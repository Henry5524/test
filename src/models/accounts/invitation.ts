import { BaseModel } from '../base';
import { OrgPerson } from './org-person';
import { Organization } from './organization';

export class Invitation extends BaseModel {
    id!: string;
    organization!: Organization;
    user!: OrgPerson;

    constructor(json?: any) {
        super(json);
        this.parseInvitation(json || {});
    }

    parse(json: any): Invitation {
        super.parse(json);
        this.parseInvitation(json);
        return this;
    }

    private parseInvitation(json: any) {
        this.__assignFields(json, ['id']);
        this.__assignClassFields(json, {
            user: OrgPerson,
            organization: Organization
        });
        if (this.user) {
            this.user._invitationId = this.id;
        }
    }
}
