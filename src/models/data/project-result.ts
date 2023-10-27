import { BaseModel } from '../base';
import { ProjectResultParams } from './project-result-params';

export enum ProjectResultType {
    Root = 'root',
    Overview = 'overview',
    App = 'app',
    MoveGroup = 'mg',
    CustomGroup = 'group',
}

export const ProjectResultTypeName = {
    [ProjectResultType.Root]: 'Root',
    [ProjectResultType.Overview]: 'Overview',
    [ProjectResultType.App]: 'Applications',
    [ProjectResultType.MoveGroup]: 'Move Groups',
    [ProjectResultType.CustomGroup]: 'Custom Groups',
};

export const ProjectResultTypeNameExt = {
    [ProjectResultType.Root]: 'Root',
    [ProjectResultType.Overview]: 'Overview',
    [ProjectResultType.App]: 'Application dependencies',
    [ProjectResultType.MoveGroup]: 'Move Group dependencies',
    [ProjectResultType.CustomGroup]: 'Custom Group dependencies',
};

export const ProjectResultLinkText = {
    [ProjectResultType.Root]: 'All Results',
    [ProjectResultType.Overview]: 'Environment Overview',
    [ProjectResultType.App]: 'Applications',
    [ProjectResultType.MoveGroup]: 'Move Groups',
    [ProjectResultType.CustomGroup]: 'Custom Groups',
};

export class ProjectResult extends BaseModel {
    static Type = ProjectResultType;
    type!: ProjectResultType | string;
    groupName!: string;
    groupId!: string;
    created!: number;
    finished!: number;
    params!: ProjectResultParams;
    running!: boolean;
    error!: string;
    errors!: any[];

    constructor(json?: any) {
        super(json);
        this.parseProjectResult(json || {});
    }

    parse(json: any): ProjectResult {
        super.parse(json);
        this.parseProjectResult(json);
        return this;
    }

    private parseProjectResult(json: any) {
        this.__assignFields(json, ['type', 'groupName', 'groupId', 'created', 'finished', 'running', 'error']);
        this.__assignClassFields(json, { params: ProjectResultParams });
    }

}
