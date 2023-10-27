import { IdName } from '../base';
import { PersonRole } from './person-role';

export class Organization extends IdName {
    createdAt!: string;
    roles: PersonRole[] = [];

    constructor(json?: any) {
        super(json);
        this.parseOrg(json || {});
    }

    parse(json: any): Organization {
        super.parse(json);
        this.parseOrg(json);
        return this;
    }

    private parseOrg(json: any) {
        this.__assignFields(json, ['createdAt']);
        this.__assignClassArrays(json, { roles: PersonRole });
    }

}
