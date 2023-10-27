import { NodeGroup } from './node-group';

export class MoveGroup extends NodeGroup {
    group_ids: string[] = [];

    constructor(json?: any) {
        super(json);
        this.parseMoveGroup(json || {});
    }

    parse(json: any): MoveGroup {
        super.parse(json);
        this.parseMoveGroup(json);
        return this;
    }

    private parseMoveGroup(json: any) {
        this.type = NodeGroup.TYPE_MOVEGROUP;
        this.__assignFields(json, [
            'group_ids',
        ]);
    }

}
