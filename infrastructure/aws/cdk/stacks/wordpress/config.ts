import { NetworkProps } from './constructs/network';

import { SubnetType, InstanceClass, InstanceSize, AmazonLinuxGeneration } from "aws-cdk-lib/aws-ec2";
import { AuroraMysqlEngineVersion } from "aws-cdk-lib/aws-rds";

type Config = {
    stackName: string,
    stackDescription: string,
    stackEnv: any,
    stackBaseTags: any,

    wordpress: Object,

    network: NetworkProps,

    compute: any,
    database: any
}

export default {
    stackName: 'WordPressStack',
    stackDescription: 'WordPress Stack',

    stackEnv: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },

    stackBaseTags: {
        Tenant: 'Tenant1',
        Project: 'WordPress',
        Environment: 'Production',
        Region: process.env.CDK_DEFAULT_REGION
    },

    wordpress: {
        admin: {
            username: process.env.WP_ADMIN_USER ?? 'admin',
            email: process.env.WP_ADMIN_EMAIL ?? 'admin@wordpress.com'
        },
        site: {
            databaseName: process.env.WP_DB_NAME ?? 'wordpress',
            title: process.env.WP_SITE_TITLE ?? 'WordPress',
            installPath: process.env.WP_SITE_INSTALL_PATH ?? '/var/www/html/',
        }
    },

    network: {
        vpc: {
            vpcName: 'WordPressVPC',
            vpcCidr: '10.0.0.0/16',
            availabilityZones: ['eu-central-1a', 'eu-central-1b', 'eu-central-1c'],
            enableDnsHostnames: true,
            enableDnsSupport: true,
            natGateways: 3,
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: 'public',
                    subnetType: SubnetType.PUBLIC,
                },
                {
                    cidrMask: 24,
                    name: 'private',
                    subnetType: SubnetType.PRIVATE_WITH_EGRESS,
                },
                {
                    cidrMask: 24,
                    name: 'isolated',
                    subnetType: SubnetType.PRIVATE_ISOLATED,
                }
            ]

        }
    },

    compute: {
        linuxGeneration: AmazonLinuxGeneration.AMAZON_LINUX_2023,
        instanceClass: InstanceClass.T2,
        instanceSize: InstanceSize.MICRO,
        minCapacity: 3,
        maxCapacity: 6,
        targetCpuUtilization: 75
    },

    database: {
        version: AuroraMysqlEngineVersion.VER_3_07_0,
        timezone: 'UTC',
        defaultDatabaseName: 'wordpress'
    }
} as Config;
