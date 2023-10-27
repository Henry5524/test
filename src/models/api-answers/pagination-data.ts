import { BaseModel } from '../base';

export class PaginationData extends BaseModel {
    count!: number;
    offset!: number;
    limit!: number;
    total!: number;

    constructor(json?: any) {
        super(json);
        this.parsePaginationData(json || {});
    }

    parse(json: any): PaginationData {
        super.parse(json);
        this.parsePaginationData(json);
        return this;
    }

    private parsePaginationData(json: any) {
        this.__assignFields(json, ['count', 'offset', 'limit', 'total']);
    }
}
