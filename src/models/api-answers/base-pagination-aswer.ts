import { BaseModel } from '../base';
import { PaginationData } from './pagination-data';

export class BasePaginationAnswer extends BaseModel {
    pagination!: PaginationData;

    constructor(json?: any) {
        super(json);
        this.parseBasePaginatedAnswer(json || {});
    }

    parse(json: any): BasePaginationAnswer {
        super.parse(json);
        this.parseBasePaginatedAnswer(json);
        return this;
    }

    private parseBasePaginatedAnswer(json: any) {
        this.__assignClassFields(json, { pagination: PaginationData });
    }
}
