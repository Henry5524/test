import { BaseModel } from './base-model';

export class LogEntry extends BaseModel {
    static LEVEL_DEBUG = 0;
    static LEVEL_INFO = 1;
    static LEVEL_WARNING = 2;
    static LEVEL_ERROR = 3;
    static LEVEL_EXCEPTION = 4;
    static LEVEL_STATUS = 5;
    static SEVERITY_NAME = ['Debug', 'Info', 'Warning', 'Error', 'Exeption', 'Status'];
    ts: number = 0;
    level: number = 0;
    label: string = '';
    text: string = '';
    host: string = '';

    constructor(json?: any) {
        super(json);
        this.parseLogEntry(json || {});
    }

    parse(json: any): LogEntry {
        super.parse(json);
        this.parseLogEntry(json);
        return this;
    }

    private parseLogEntry(json: any) {
        this.__assignFields(json, ['ts', 'level', 'label', 'text', 'host']);
    }

}
