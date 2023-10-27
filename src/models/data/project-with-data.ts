import { IdType } from '../base';
import { CustomProperty } from './custom-property';
import { MoveGroup } from './move-group';
import { NetworkNode } from './network-node';
import { NodeGroup } from './node-group';
import { Project } from './project';

export class ProjectWithData extends Project {
    nodes: NetworkNode[] = [];
    apps!: NodeGroup[];
    groups!: NodeGroup[];
    move_groups!: MoveGroup[];
    exclude!: IdType[];
    exclude_nets!: string[];
    custom_node_props!: CustomProperty[];
    custom_app_props!: CustomProperty[];

    // ******** Dynamic, convenience mappings ********
    nodesMap!: { [key: string]: NetworkNode };
    appsMap!: { [key: string]: NodeGroup };
    moveGroupMap!: { [key: string]: MoveGroup };
    customPropsMap!: { [key: string]: CustomProperty };
    nodeToAppsMap!: { [key: string]: string[] };
    nodeToMgsMap!: { [key: string]: string[] };
    appToMgsMap!: { [key: string]: string[] };
    _rebuildMaps: boolean = false;

    constructor(json?: any) {
        super(json);
        this.parseProjectWithData(json || {});
    }

    parse(json: any): ProjectWithData {
        super.parse(json);
        this.parseProjectWithData(json);
        return this;
    }

    private parseProjectWithData(json: any) {
        this.__assignFields(json, [
            'exclude_nets'
        ]);
        this.__assignClassArrays(json, {
            nodes: NetworkNode,
            apps: NodeGroup,
            groups: NodeGroup,
            move_groups: MoveGroup,
            exclude: IdType,
            custom_node_props: CustomProperty,
            custom_app_props: CustomProperty,
            filteredNodes: NetworkNode
        });
    }

}
