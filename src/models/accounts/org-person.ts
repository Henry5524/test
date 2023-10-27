import { IdName } from '../base';
import { PersonRole } from './person-role';

export class OrgPerson extends IdName {
    email!: string;
    status!: 'verified' | 'unverified';
    roles: PersonRole[] = [];

    _invitationId: string | undefined;

    constructor(json?: any) {
        super(json);
        this.parseOrgPerson(json || {});
    }

    parse(json: any): OrgPerson {
        super.parse(json);
        this.parseOrgPerson(json);
        return this;
    }

    private parseOrgPerson(json: any) {
        this.__assignFields(json, ['email', 'status']);
        this.__assignClassArrays(json, { roles: PersonRole });
    }

}
