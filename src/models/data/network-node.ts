import { BaseModel } from '../base';

export enum NetworkNodeType {
    Virtual = 'Virtual',
}

export class NetworkNode extends BaseModel {
    static Type = NetworkNodeType;
    id!: string;
    name!: string;
    ips!: string[];
    type!: NetworkNodeType;
    ics!: boolean[];
    apps: string[] = [];
    mgid!: string;
    inMoveGroup: boolean = false;
    custom_props!: { [id: string]: any };

    _disabled!: boolean;

    constructor(json?: any) {
        super(json);
        this.parseNetworkNode(json || {});
    }

    parse(json: any): NetworkNode {
        super.parse(json);
        this.parseNetworkNode(json);
        return this;
    }

    private parseNetworkNode(json: any) {
        this.__assignFields(json, [
            'id',
            'name',
            'ips',
            'type',
            'ics',
            'apps',
            'mgid',
            'inMoveGroup',
            '_disabled',
            'custom_props'
        ]);
    }

}
