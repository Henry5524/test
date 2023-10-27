import { IdName } from '../base';
import { Organization } from './organization';

export type PersonGlobalRole = 'Global-Admins' | 'Global-ReadOnly';

export class Person extends IdName {
    activeOrganizationId!: string;
    email!: string;
    organization!: string;
    organizations: Organization[] = [];
    globalRoles?: PersonGlobalRole[];
    assumerId?: string;

    _organizationsMap?: { [id: string]: Organization };
    _isGlobalAdmin: boolean = false;
    _isAdmin: boolean = false;

    constructor(json?: any) {
        super(json);
        this.parsePerson(json || {});
    }

    parse(json: any): Person {
        super.parse(json);
        this.parsePerson(json);
        return this;
    }

    private parsePerson(json: any) {
        this.__assignFields(json, [
            'activeOrganizationId',
            'email',
            'organization',
            'assumerId',
            'globalRoles'
        ]);
        this.__assignClassArrays(json, {
            organizations: Organization
        });
        this.updateMaps();
        const co = this._organizationsMap![this.activeOrganizationId];
        if (co?.roles) {
            for (const role of co.roles) {
                if (role.id == 1) {
                    this._isAdmin = true;
                    break;
                }
            }
        }
        if (this.globalRoles) {
            for (const role of this.globalRoles) {
                if (role == 'Global-Admins' || role == 'Global-ReadOnly') {
                    this._isGlobalAdmin = true;
                    break;
                }
            }
        }
    }

    /**
     * Update the id=>value maps
     */
    public updateMaps() {
        this._organizationsMap = {};
        for (const org of this.organizations) {
            this._organizationsMap[org.id] = org;
        }
    }

}
