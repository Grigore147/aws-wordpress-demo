import { Construct } from 'constructs';
import { Vpc, VpcProps } from 'aws-cdk-lib/aws-ec2';

export interface NetworkProps {
    readonly vpc: VpcProps;
}

export class WordPressNetwork extends Construct {
    public readonly config: NetworkProps;
    public readonly vpc: Vpc;

    constructor(scope: Construct, id: string, props: NetworkProps) {
        super(scope, id);

        this.config = props;

        this.vpc = new Vpc(this, 'WordPressVPC', this.config.vpc);
    }
}
