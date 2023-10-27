import { BaseModel } from './base-model';

export class IdType extends BaseModel {
    id!: string;
    type!: string;

    constructor(json?: any) {
        super(json);
        this.parseIdType(json || {});
    }

    parse(json: any): IdType {
        super.parse(json);
        this.parseIdType(json);
        return this;
    }

    private parseIdType(json: any) {
        this.__assignFields(json, ['id', 'type']);
    }
}
