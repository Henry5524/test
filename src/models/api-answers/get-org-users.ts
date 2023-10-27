import { BasePaginationAnswer } from './base-pagination-aswer';
import { OrgPerson } from '../accounts/org-person';
import { IPaginationOptions } from './pagination-options';

export interface IGetOrgUsersOptions extends IPaginationOptions {
    org_id?: string;
}

export class GetOrgUsersAnswer extends BasePaginationAnswer {
    users!: OrgPerson[];

    constructor(json?: any) {
        super(json);
        this.parseGetOrgUsersAnswer(json || {});
    }

    parse(json: any): GetOrgUsersAnswer {
        super.parse(json);
        this.parseGetOrgUsersAnswer(json);
        return this;
    }

    private parseGetOrgUsersAnswer(json: any) {
        this.__assignClassArrays(json, { users: OrgPerson });
    }
}
