import { BaseSystemObject, BaseSystemObjectType } from './base-system-object';
import { ProjectResult } from './project-result';

export class Project extends BaseSystemObject {
    type: BaseSystemObjectType = BaseSystemObjectType.Project;
    project_name!: string;
    project_instance!: string;
    size!: number;
    has_overview!: boolean;
    results!: ProjectResult[];
    running!: string;
    hasCalcError!: boolean;
    nodes_count: number = 0;
    apps_count: number = 0;
    move_groups_count: number = 0;
    results_download_url?: string;
    errors!: any[];

    constructor(json?: any) {
        super(json);
        this.parseProject(json || {});
    }

    parse(json: any): Project {
        super.parse(json);
        this.parseProject(json);
        return this;
    }

    private parseProject(json: any) {
        this.__assignFields(json, [
            'project_name',
            'project_instance',
            'size',
            'has_overview',
            'running',
            'nodes_count',
            'apps_count',
            'move_groups_count',
            'results_download_url',
            'errors',
        ]);
        this.__assignClassArrays(json, {
            results: ProjectResult,
        });
    }

}
