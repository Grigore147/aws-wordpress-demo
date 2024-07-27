import * as Cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RemovalPolicy } from 'aws-cdk-lib';
import * as Ec2 from 'aws-cdk-lib/aws-ec2';
import * as Rds from 'aws-cdk-lib/aws-rds';
import { 
    Vpc, 
    SubnetType,
    SecurityGroup
} from 'aws-cdk-lib/aws-ec2';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';

export interface DatabaseProps {
    readonly vpc: Vpc;
    readonly computeSecurityGroup: SecurityGroup;
}

export interface DatabaseConfig {
    readonly version: Rds.AuroraMysqlEngineVersion;
    readonly timezone: string;
    readonly defaultDatabaseName: string;
}

export class WordPressDatabase extends Construct {
    public readonly config: DatabaseConfig;
    public readonly vpc: Vpc;
    public readonly cluster: Rds.DatabaseCluster;

    constructor(scope: Construct, id: string, props: DatabaseProps) {
        super(scope, id);

        this.config = this.node.getContext('config').database;
        this.vpc    = props.vpc;

        const computeSecurityGroup = props.computeSecurityGroup;
        
        const subnetGroup = new Rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
            subnetGroupName: 'WordPressDatabaseSubnetGroup',
            description: 'Subnet group for the WordPress database',
            vpc: this.vpc,
            vpcSubnets: {
                subnetType: SubnetType.PRIVATE_ISOLATED
            }
        });

        const clusterParameterGroup = new Rds.ParameterGroup(this, 'cluster', {
            engine: Rds.DatabaseClusterEngine.auroraMysql({
                version: Rds.AuroraMysqlEngineVersion.VER_3_07_0
            }),
            parameters: {
                time_zone: this.config.timezone,
                character_set_client: 'utf8mb4',
                character_set_connection: 'utf8mb4',
                character_set_database: 'utf8mb4',
                character_set_results: 'utf8mb4',
                character_set_server: 'utf8mb4',
                collation_connection: 'utf8mb4_bin',
            }
        })

        const rdsSecurityGroup = new Ec2.SecurityGroup(this, 'WordPressRdsSecurityGroup', {
            vpc: this.vpc,
            allowAllOutbound: true,
            securityGroupName: 'wordpress-rds-security-group',
        });
        rdsSecurityGroup.addIngressRule(
            Ec2.Peer.securityGroupId(computeSecurityGroup.securityGroupId),
            Ec2.Port.tcp(3306),
            'Traffic from EC2.'
        );

        const rdsCredentialsSecret = new Secret(this, 'WordPressRdsAdminCredentials', {
            secretName: 'wordpress/database/admin-credentials',
            description: 'Admin credentials for the WordPress database.',
            generateSecretString: {
                secretStringTemplate: JSON.stringify({ username: 'admin' }),
                generateStringKey: 'password',
                excludePunctuation: true,
                includeSpace: false
            },
            removalPolicy: RemovalPolicy.DESTROY
        });

        this.cluster = new Rds.DatabaseCluster(this, 'rds', {
            engine: Rds.DatabaseClusterEngine.auroraMysql({
                version: Rds.AuroraMysqlEngineVersion.VER_3_07_0
            }),
            writer: Rds.ClusterInstance.provisioned('writer', {
                instanceType: Ec2.InstanceType.of(
                    Ec2.InstanceClass.BURSTABLE3, 
                    Ec2.InstanceSize.MEDIUM
                )
            }),
            vpc: this.vpc,
            vpcSubnets: {
                subnetType: SubnetType.PRIVATE_ISOLATED
            },
            subnetGroup: subnetGroup,
            securityGroups: [rdsSecurityGroup],
            // readers: [
            //     Rds.ClusterInstance.serverlessV2('reader1', { scaleWithWriter: true }),
            // ]
            clusterIdentifier: 'wordpress',
            credentials: Rds.Credentials.fromSecret(rdsCredentialsSecret),
            defaultDatabaseName: this.config.defaultDatabaseName,
            parameterGroup: clusterParameterGroup,
            deletionProtection: false,
            removalPolicy: RemovalPolicy.DESTROY
        });

        new Cdk.CfnOutput(this, 'DatabaseClusterEndpoint', {
            description: 'WordPress Database Cluster Endpoint',
            value: this.cluster.clusterEndpoint.hostname
        });
    }
}
