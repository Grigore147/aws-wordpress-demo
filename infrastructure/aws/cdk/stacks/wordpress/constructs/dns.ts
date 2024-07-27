import { Construct } from 'constructs';
import { IHostedZone, HostedZone, AaaaRecord, ARecord, RecordTarget, IAliasRecordTarget } from 'aws-cdk-lib/aws-route53';

export interface WordPressDnsProps {
    readonly domainName: string;
    readonly domainZone: IHostedZone;
}

export class Dns extends Construct {
    public readonly domainZone: IHostedZone;
    public readonly domainName: string;

    constructor(scope: Construct, id: string, props: WordPressDnsProps) {
        super(scope, id);

        this.domainZone = props.domainZone;
        this.domainName = props.domainName;
    }

    public createHostedZone(id: string, domainName: string): HostedZone {
        return new HostedZone(this, id, {
            zoneName: domainName,
            comment: `Hosted zone for ${domainName}`
        });
    }

    public addTargetRecord(id: string, target: IAliasRecordTarget, comment?: string) {
        new ARecord(this, id, {
            zone: this.domainZone,
            recordName: this.domainName,
            target: RecordTarget.fromAlias(target),
            comment: comment
        });

        new AaaaRecord(this, id, {
            zone: this.domainZone,
            recordName: this.domainName,
            target: RecordTarget.fromAlias(target),
            comment: comment
        });
    }
}
