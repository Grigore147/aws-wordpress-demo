import * as Cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Vpc, SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import * as Ec2 from 'aws-cdk-lib/aws-ec2';
import * as Efs from 'aws-cdk-lib/aws-efs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

export interface EfsProps {
    readonly vpc: Vpc;
}

export class WordPressEfs extends Construct {
    public readonly vpc: Vpc;
    public readonly filesystem: Efs.FileSystem;
    protected securityGroup: SecurityGroup;

    constructor(scope: Construct, id: string, props: EfsProps) {
        super(scope, id);

        this.vpc = props.vpc;

        this.filesystem = new Efs.FileSystem(this, 'WordPressEfs', {
            fileSystemName: 'wordpress-efs',
            vpc: this.vpc,
            vpcSubnets: {
                subnetType: Ec2.SubnetType.PRIVATE_WITH_EGRESS
            },
            securityGroup: this.getSecurityGroup(),
            performanceMode: Efs.PerformanceMode.GENERAL_PURPOSE,
            throughputMode: Efs.ThroughputMode.BURSTING,
            removalPolicy: Cdk.RemovalPolicy.DESTROY
        });

        this.saveFileSystemIdParameter(this.filesystem.fileSystemId);
    }

    public getSecurityGroup(): SecurityGroup {
        if (!this.securityGroup) {
            this.securityGroup = new SecurityGroup(this, 'WordPressEfsSecurityGroup', {
                vpc: this.vpc,
                allowAllOutbound: true,
                securityGroupName: 'wordpress-efs-security-group'
            });
        }

        return this.securityGroup;
    }

    public allowConnectionFrom(peer: Ec2.IPeer, description: string) {
        this.getSecurityGroup().addIngressRule(peer, Ec2.Port.tcp(2049), description);
    }

    protected saveFileSystemIdParameter(fileSystemId: string): StringParameter {
        return new StringParameter(this, 'WordPressEfsId', {
            parameterName: '/wordpress/efs/id',
            stringValue: fileSystemId
        });
    }
}
