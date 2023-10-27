import { BaseModel } from '../base';

export enum BaseSystemObjectType {
    Unknown = 'unknown',
    Project = 'project',
    ProjectRun = 'projectrun',
}

export class BaseSystemObject extends BaseModel {
    static Type = BaseSystemObjectType;
    id!: string;
    name?: string;
    description?: string;
    create_time!: number;
    modify_time!: number;
    type: BaseSystemObjectType = BaseSystemObjectType.Unknown;

    _new?: boolean;

    constructor(json?: any) {
        super(json);
        this.parseBaseSystemObject(json || {});
    }

    parse(json: any): BaseSystemObject {
        super.parse(json);
        this.parseBaseSystemObject(json);
        return this;
    }

    private parseBaseSystemObject(json: any) {
        this.__assignFields(json, ['id', 'name', 'description', 'create_time', 'modify_time', 'type', '_new']);
    }

}
