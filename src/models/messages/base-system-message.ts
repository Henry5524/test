import { BaseModel } from '../base';

export class BaseSystemMessage extends BaseModel {
    id!: string;
    exchange!: string;
    routing_key!: string;
    data: any;

    constructor(json?: any) {
        super(json);
        this.parseBaseSystemMessage(json || {});
    }

    parse(json: any): BaseSystemMessage {
        super.parse(json);
        this.parseBaseSystemMessage(json);
        return this;
    }

    private parseBaseSystemMessage(json: any) {
        this.__assignFields(json, ['id', 'exchange', 'routing_key', 'data']);
    }

}
