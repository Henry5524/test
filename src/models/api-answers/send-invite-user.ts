import { BaseModel, IdName } from '../base';
import { OrgPerson } from '../accounts';

export class SendInviteUserAnswer extends BaseModel {
    id!: string;
    users!: OrgPerson[];
    organization!: IdName;

    constructor(json?: any) {
        super(json);
        this.parseSendInviteUserAnswer(json || {});
    }

    parse(json: any): SendInviteUserAnswer {
        super.parse(json);
        this.parseSendInviteUserAnswer(json);
        return this;
    }

    private parseSendInviteUserAnswer(json: any) {
        this.__assignFields(json, ['id']);
        this.__assignClassFields(json, { organization: IdName });
        this.__assignClassArrays(json, { users: OrgPerson });
    }
}
