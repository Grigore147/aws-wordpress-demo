import * as Cdk from 'aws-cdk-lib';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { Vpc, SubnetType, Peer, Port, SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { 
    ApplicationLoadBalancer, 
    ApplicationListener,
    ApplicationProtocol
} from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

import { WordPressCompute } from './ec2';

export interface LoadBalancerProps {
    vpc: Vpc,
    name: string,
    compute: WordPressCompute
}

export class WordPressLoadBalancer extends Construct {
    public readonly loadBalancer: ApplicationLoadBalancer;
    public readonly vpc: Vpc;
    public readonly name: string;
    public readonly securityGroup: SecurityGroup;
    public readonly httpListener: ApplicationListener;
    public readonly httpsListener: ApplicationListener;

    constructor(scope: Construct, id: string, props: LoadBalancerProps) {
        super(scope, id);

        let { vpc, name, compute } = props;

        this.vpc = vpc;
        this.name = name;

        this.securityGroup = new SecurityGroup(this, 'LoadBalancerSecurityGroup', {
            vpc: this.vpc,
            allowAllOutbound: true,
            securityGroupName: `${this.name}-Security-Group`,
            description: 'Security group for the WordPress Load Balancer'
        });
        this.securityGroup.addIngressRule(Peer.anyIpv4(), Port.HTTP, 'Allow HTTP traffic from the Internet');
        this.securityGroup.addIngressRule(Peer.anyIpv4(), Port.HTTPS, 'Allow HTTPS traffic from the Internet');

        compute.addSecurityIngressRule(this.securityGroup, Port.tcp(80), 'HTTP traffic from Load Balancer');

        this.loadBalancer = new ApplicationLoadBalancer(this, this.name, {
            vpc: this.vpc,
            internetFacing: true,
            securityGroup: this.securityGroup,
            loadBalancerName: this.name,
            vpcSubnets: {
                subnetType: SubnetType.PUBLIC
            }
        });

        this.httpListener = this.loadBalancer.addListener('HTTPListener', {
            protocol: ApplicationProtocol.HTTP,
            port: 80,
        });

        this.httpListener.addTargets('Target', {
            protocol: ApplicationProtocol.HTTP,
            port: 80,
            targets: [compute.autoScalingGroup],
            targetGroupName: 'WordPressTargetGroup',
            healthCheck: {
                path: '/',
                healthyHttpCodes: '200',
                interval: Duration.seconds(30),
                timeout: Duration.seconds(5),
                healthyThresholdCount: 3,
                unhealthyThresholdCount: 3
            }
        });

        this.saveDnsParameter(this.loadBalancer.loadBalancerDnsName);

        new Cdk.CfnOutput(this, 'ApplicationLoadBalancerDNS', {
            description: 'Application Load Balancer DNS',
            value: this.loadBalancer.loadBalancerDnsName
        });
    }

    protected saveDnsParameter(dnsName: string): StringParameter {
        return new StringParameter(this, 'WordpressApplicationLoadBalancerDNS', {
            parameterName: '/wordpress/load-balancer/dns',
            stringValue: this.loadBalancer.loadBalancerDnsName
        });
    }
}
