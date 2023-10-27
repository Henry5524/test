import { BaseModel } from '../base';

export class NodeGroup extends BaseModel {
    static ID_NO_GROUP = '__NO_GROUP__';

    static TYPE_APP = 'Application';
    static TYPE_NETS = 'Nets';
    static TYPE_MOVEGROUP = 'Move Group';

    id!: string;
    mgid!: string;
    type!: string;
    name!: string;
    node_ids: string[] = [];
    custom_props: { [id: string]: any } = {};

    _disabled!: boolean;

    constructor(json?: any) {
        super(json);
        this.parseNodeGroup(json || {});
    }

    parse(json: any): NodeGroup {
        super.parse(json);
        this.parseNodeGroup(json);
        return this;
    }

    private parseNodeGroup(json: any) {
        this.__assignFields(json, [
            'id',
            'mgid',
            'type',
            'name',
            'node_ids',
            '_disabled',
            'custom_props'
        ]);
    }

}
