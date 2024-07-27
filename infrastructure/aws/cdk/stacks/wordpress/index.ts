import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { 
    WordPressNetwork,
    WordPressLoadBalancer,
    WordPressCompute,
    WordPressEfs,
    WordPressDatabase
} from './constructs';

export class WordPressStack extends Stack {
    public readonly network: WordPressNetwork;
    public readonly efs: WordPressEfs;
    public readonly loadBalancer: WordPressLoadBalancer;
    public readonly compute: WordPressCompute;
    public readonly database: WordPressDatabase;

    constructor(scope: Construct, id: string, props?: StackProps, config?: any) {
        super(scope, id, props);

        this.node.setContext('config', config);

        this.network = new WordPressNetwork(this, 'WordPressNetwork', config.network);
        this.efs = new WordPressEfs(this, 'WordPressEfs', {
            vpc: this.network.vpc
        });
        this.compute = new WordPressCompute(this, 'WordPressCompute', {
            vpc: this.network.vpc,
            efs: this.efs
        });
        this.database = new WordPressDatabase(this, 'WordPressDatabase', {
            vpc: this.network.vpc,
            computeSecurityGroup: this.compute.getSecurityGroup(),
        });
        this.loadBalancer = new WordPressLoadBalancer(this, 'WordPressLoadBalancer', {
            vpc: this.network.vpc,
            name: 'WordPressLoadBalancer',
            compute: this.compute
        });
    }
}
