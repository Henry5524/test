import { Invitation } from '../accounts';
import { BasePaginationAnswer } from './base-pagination-aswer';
import { IPaginationOptionsWsort } from './pagination-options-wsort';

export interface IGetInvitationsOptions extends IPaginationOptionsWsort {
    org_id?: string;
}

export class GetInvitationsAnswer extends BasePaginationAnswer {
    invitations!: Invitation[];

    constructor(json?: any) {
        super(json);
        this.parseGetInvitationsAnswer(json || {});
    }

    parse(json: any): GetInvitationsAnswer {
        super.parse(json);
        this.parseGetInvitationsAnswer(json);
        return this;
    }

    private parseGetInvitationsAnswer(json: any) {
        this.__assignClassArrays(json, { invitations: Invitation });
    }
}
