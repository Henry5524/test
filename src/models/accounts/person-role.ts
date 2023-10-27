import { BaseModel } from '../base';

export class PersonRole extends BaseModel {
    id!: number;
    name!: string;

    constructor(json?: any) {
        super(json);
        this.parsePersonRole(json || {});
    }

    parse(json: any): PersonRole {
        super.parse(json);
        this.parsePersonRole(json);
        return this;
    }

    private parsePersonRole(json: any) {
        this.__assignFields(json, ['id', 'name']);
    }

}
