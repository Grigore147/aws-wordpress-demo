import { Construct } from 'constructs';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { AutoScalingGroup } from 'aws-cdk-lib/aws-autoscaling';
import { Duration } from 'aws-cdk-lib/core';
import * as Ec2 from 'aws-cdk-lib/aws-ec2';

import { WordPressComputeLaunchTemplate } from './ec2-launch-template';
import { WordPressEfs } from '../efs';

export interface ComputeProps {
    readonly vpc: Vpc;
    readonly efs: WordPressEfs;
}

export class WordPressCompute extends Construct {
    public readonly vpc: Vpc;
    public readonly launchTemplate: WordPressComputeLaunchTemplate;
    public readonly autoScalingGroup: AutoScalingGroup;

    constructor(scope: Construct, id: string, props: ComputeProps) {
        super(scope, id);

        this.vpc = props.vpc;

        const config = this.node.getContext('config');

        this.launchTemplate = new WordPressComputeLaunchTemplate(this, 'WordPressComputeLaunchTemplate', {
            vpc: this.vpc,
            efs: props.efs
        });

        this.autoScalingGroup = new AutoScalingGroup(this, 'WordPressAutoScalingGroup', {
            autoScalingGroupName: 'WordPressAutoScalingGroup',
            launchTemplate: this.launchTemplate.template,
            vpc: this.vpc,
            vpcSubnets: {
                subnetType: Ec2.SubnetType.PRIVATE_WITH_EGRESS
            },
            minCapacity: config.compute.minCapacity,
            maxCapacity: config.compute.maxCapacity,
            cooldown: Duration.seconds(30)
        });

        this.autoScalingGroup.scaleOnCpuUtilization('KeepSpareCPU', {
            targetUtilizationPercent: config.compute.targetCpuUtilization
        });
    }

    public getSecurityGroup() {
        return this.launchTemplate.securityGroup;
    }

    public addSecurityIngressRule(peer: any, port: Ec2.Port, description: string) {
        this.getSecurityGroup().addIngressRule(peer, port, description);
    }
}
