import * as Path from 'path';
import * as Fs from 'fs';

import { Construct } from 'constructs';
import * as Ec2 from 'aws-cdk-lib/aws-ec2';
import * as Iam from 'aws-cdk-lib/aws-iam';
import { Vpc, SecurityGroup } from 'aws-cdk-lib/aws-ec2';

import { WordPressEfs } from '../efs';

export interface WordPressComputeLaunchTemplateProps {
    readonly vpc: Vpc;
    readonly efs: WordPressEfs;
}

export class WordPressComputeLaunchTemplate extends Construct {
    public readonly vpc: Vpc;
    public readonly template: Ec2.LaunchTemplate;
    public readonly securityGroup: SecurityGroup;

    constructor(scope: Construct, id: string, props: WordPressComputeLaunchTemplateProps) {
        super(scope, id);

        this.vpc = props.vpc;

        const efs = props.efs;

        const config = this.node.getContext('config');
        const AWS_REGION  = config.stackEnv.region;
        const AWS_ACCOUNT = config.stackEnv.account;

        this.securityGroup = new Ec2.SecurityGroup(this, 'WordPressEc2SecurityGroup', {
            vpc: this.vpc,
            allowAllOutbound: true,
            securityGroupName: 'wordpress-ec2-security-group',
        });

        efs.allowConnectionFrom(this.securityGroup, 'Allow inbound NFS traffic from WordPress EC2 instances');

        const role = new Iam.Role(this, 'WordPressInstanceRole', {
            assumedBy: new Iam.ServicePrincipal('ec2.amazonaws.com'),
        });
        // Managed policies for EC2 instances
        role.addManagedPolicy(Iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
        // Managed policy to allow read-only access to EC2 instances
        role.addManagedPolicy(Iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ReadOnlyAccess'));
        // Policy to allow the EC2 instance to access the Secrets Manager secret
        role.addToPolicy(new Iam.PolicyStatement({
            actions: [
                'secretsmanager:DescribeSecret',
                'secretsmanager:GetSecretValue',
                'secretsmanager:ListSecretVersionIds'
            ],
            resources: [
                `arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT}:secret:wordpress/database/admin-credentials-*`
            ]
        }));
        // Policy to allow the EC2 instance to access the EFS filesystem
        role.addToPolicy(new Iam.PolicyStatement({
            actions: [
                'elasticfilesystem:ClientMount',
                'elasticfilesystem:ClientWrite'
            ],
            resources: [
                `arn:aws:elasticfilesystem:${AWS_REGION}:${AWS_ACCOUNT}:file-system/${efs.filesystem.fileSystemId}`
            ]
        }));
      
        const userData = Ec2.UserData.custom(Fs.readFileSync(Path.join(__dirname, 'wordpress-setup.sh'), 'utf8'));

        this.template = new Ec2.LaunchTemplate(this, 'WordPressLaunchTemplate', {
            launchTemplateName: 'WordPressLaunchTemplate',
            instanceType: Ec2.InstanceType.of(config.compute.instanceClass, config.compute.instanceSize),
            machineImage: new Ec2.AmazonLinuxImage({
                generation: config.compute.linuxGeneration,
            }),
            securityGroup: this.securityGroup,
            role: role,
            keyPair: new Ec2.KeyPair(this, 'WordPressKeyPair', {
                keyPairName: 'WordPressKeyPair',
                format: Ec2.KeyPairFormat.PEM,
                type: Ec2.KeyPairType.RSA
            }),
            userData: userData,
            // blockDevices: [
            //     {
            //         deviceName: '/dev/xvda',
            //         volume: Ec2.BlockDeviceVolume.ebs(10, {
            //             deleteOnTermination: true
            //         })
            //     }
            // ]
        });
    }
}
