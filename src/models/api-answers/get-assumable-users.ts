import { BasePaginationAnswer } from './base-pagination-aswer';
import { AssumableUser } from '../accounts/assumable-user';
import { IPaginationOptions } from './pagination-options';

export interface IGetAssumableUsersOptions extends IPaginationOptions {
    name?: string;
    email?: string;
}

export class GetAssumableUsersAnswer extends BasePaginationAnswer {
    assumableUsers!: AssumableUser[];

    constructor(json?: any) {
        super(json);
        this.parseGetAssumableUsersAnswer(json || {});
    }

    parse(json: any): GetAssumableUsersAnswer {
        super.parse(json);
        this.parseGetAssumableUsersAnswer(json);
        return this;
    }

    private parseGetAssumableUsersAnswer(json: any) {
        this.__assignClassArrays(json, { assumableUsers: AssumableUser });
    }
}
