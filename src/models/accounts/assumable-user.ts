import { IdName } from '../base';

export class AssumableUser extends IdName {
    email!: string;

    constructor(json?: any) {
        super(json);
        this.parseAssumableUser(json || {});
    }

    parse(json: any): AssumableUser {
        super.parse(json);
        this.parseAssumableUser(json);
        return this;
    }

    private parseAssumableUser(json: any) {
        this.__assignFields(json, ['email']);
    }

}
