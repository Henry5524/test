import { BaseModel } from '../base';

export class ProjectResultParams extends BaseModel {
    ids!: string[];

    constructor(json?: any) {
        super(json);
        this.parseProjectResultParams(json || {});
    }

    parse(json: any): ProjectResultParams {
        super.parse(json);
        this.parseProjectResultParams(json);
        return this;
    }

    private parseProjectResultParams(json: any) {
        this.__assignFields(json, ['ids']);
    }

}
