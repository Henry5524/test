import { BaseModel } from './base-model';

export class IdName extends BaseModel {
    id!: string;
    name!: string;

    constructor(json?: any) {
        super(json);
        this.parseIdName(json || {});
    }

    parse(json: any): IdName {
        super.parse(json);
        this.parseIdName(json);
        return this;
    }

    private parseIdName(json: any) {
        this.__assignFields(json, ['id', 'name']);
    }
}
