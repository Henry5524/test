import axios, { AxiosInstance } from 'axios';
import {
    IdName, Person, SignupConfirm,
    IGetAssumableUsersOptions, GetAssumableUsersAnswer,
    GetOrgUsersAnswer, IGetOrgUsersOptions, SendInviteUserAnswer,
    IGetInvitationsOptions, GetInvitationsAnswer
} from '@models';
import { stringify } from 'qs';
import { config } from '../config';
import { handleRequest } from './http-helpers';

export class Auth {
    static axios: AxiosInstance = axios.create({
        baseURL: config.auth_base_url,
        withCredentials: false,
    });

    /**
     * Exchange userName and password for the Auth-Token
     *
     * @param {String} email User email
     * @param {String} password User password
     * @param {String} organization User organization
     * @return {Promise<Person>} will resolve to Person
     */
    static login(email: string, password: string): Promise<Person> {
        return handleRequest<Person>(
            Auth.axios.post('/users/login', { email, password }),
            data => new Person(data)
        );
    }

    /**
     * Logout user
     *
     * @return {Promise} will be resolved if logout was successful
     */
    static logout(): Promise<void> {
        return handleRequest<void>(Auth.axios.delete('/login', {}));
    }

    /**
     * Register new user
     *
     * @param {String} email User email
     * @param {String} password User password
     * @param {String} name User real name
     * @param {String} organization User real organization
     * @param {String} InvitationToken User invitation token from backend
     * @return {Promise} will resolve to registration result object
     */
    static signup(email: string, password: string, name: string, InvitationToken: string | string[]): Promise<SignupConfirm> {
        return handleRequest(
            Auth.axios.post('/users/signup', { name, email, password, InvitationToken }),
            data => new SignupConfirm(data)
        );
    }

    /**
     * Update user active organization
     *
     * @param {String} id Organization Id
     * @return {Promise} will resolve to object with Id and Name of the Organization set as active
     */
    static setActiveOrg(orgId: string): Promise<IdName> {
        return handleRequest(
            Auth.axios.put('/users/active_organization', { id: orgId }),
            data => new IdName(data)
        );
    }

    /**
     * Initialize user password reset sequence
     *
     * @param {String} email User's email
     * @return {Promise} will resolve on success
     */
    static resetUserPassword(email: string): Promise<void> {
        return handleRequest(Auth.axios.post('/users/password/reset', { email }));
    }

    /**
     * Get user info
     *
     * @param {String} userId User's i.d.
     * @return {Promise} will resolve on success
     */
    static getUserInfo(userId: string): Promise<Person> {
        return handleRequest(Auth.axios.get('/users/' + userId), data => new Person(data));
    }

    /**
     * Confirm user password reset
     *
     * @param {String} email User's email
     * @param {String} confirmationCode Code from password restoration email
     * @param {String} password User's new password
     * @return {Promise} will resolve on success
     */
    static resetUserPasswordConfirm(email: string, confirmationCode: string, password: string): Promise<void> {
        return handleRequest(Auth.axios.post('/users/password/reset/confirm', { email, confirmationCode, password }));
    }

    /**
     * Confirm organization invitation
     *
     * @param {String} confirmationCode Code from organization invitation email
     * @return {Promise} will resolve on success
     */
    static organizationInvitationConfirm(confirmationCode: string): Promise<void> {
        return handleRequest(Auth.axios.post('/invitations/' + confirmationCode));
    }

    // Invitations

    /**
     * Get list of all invitations
     *
     * @param {IGetInvitationsOptions} opts search options
     * @return {Promise<GetInvitationsAnswer>} will resolve on success to {GetInvitationsAnswer}
     */
    static getInvitations(opts: IGetInvitationsOptions = {}): Promise<GetInvitationsAnswer> {
        return handleRequest(
            Auth.axios.get('/invitations?' + stringify(opts)),
            data => new GetInvitationsAnswer(data)
        );
    }

    /**
     * Send invitation to join Org to provided email.
     *
     * @param {String} orgId Organization ID
     * @param {String} email Future user's email
     * @return {Promise<SendInviteUserAnswer[]>} will resolve to SendInviteUserAnswer[]
     */
    static sendInviteUser(orgId: string, email: string, roles: { [is: string]: string }[]): Promise<SendInviteUserAnswer[]> {
        return handleRequest(
            Auth.axios.post(
                '/invitations?' + stringify({ org_id: orgId }),
                { email, roles }
            ),
            data => data && Array.isArray(data) ? data.map(r => new SendInviteUserAnswer(r)) : []
        );
    }

    /**
     * Delete invitation
     *
     * @param {string} id Invitation ID
     * @return {Promise<void>} will resolve if the operation was successful
     */
    static deleteInvitation(id: string): Promise<void> {
        return handleRequest(Auth.axios.delete('/invitations/' + id));
    }


    /* ***************** */
    /* Admin only calls */
    /* *************** */

    /**
     * Get list of all users that are assumable by global admin/read only
     *
     * @param {IGetAssumableUsersOptions} opts search options
     * @return {Promise<GetAssumableUsersAnswer>} will resolve on success to {GetAssumableUsersAnswer}
     */
    static getAssumableUsers(opts: IGetAssumableUsersOptions = {}): Promise<GetAssumableUsersAnswer> {
        return handleRequest(
            Auth.axios.get('/admin/assume_user?' + stringify(opts)),
            data => new GetAssumableUsersAnswer(data)
        );
    }

    /**
     * Assuming a user
     *
     * @param {String} id User's ID
     * @return {Promise<Person>} will resolve to Person
     */
    static assumeUser(id: string): Promise<Person> {
        return handleRequest(
            Auth.axios.post('/admin/assume_user', { id }),
            data => new Person(data)
        );
    }

    /**
     * Reverting an assumed user
     *
     * @return {Promise<Person>} will resolve to Person
     */
    static revertAssumeUser(): Promise<Person> {
        return handleRequest(
            Auth.axios.delete('/admin/assume_user'),
            data => new Person(data)
        );
    }

    /**
     * Get list of all users in organization
     *
     * @param {IGetOrgUsersOptions} opts search options
     * @return {Promise<GetOrgUsersAnswer>} will resolve on success to {GetOrgUsersAnswer}
     */
    static getOrgUsers(opts: IGetOrgUsersOptions = {}): Promise<GetOrgUsersAnswer> {
        return handleRequest(
            Auth.axios.get('/users?' + stringify(opts)),
            data => new GetOrgUsersAnswer(data)
        );
    }

    /**
     * Delete user
     *
     * @param {string} id User ID
     * @return {Promise<void>} will resolve if the operation was successful
     */
    static deleteUser(id: string, orgId: string): Promise<void> {
        return handleRequest(Auth.axios.delete(`/users/${id}/organizations/${orgId}`));
    }

    /**
     * Add an organization.
     *
     * @param name
     * @return {Promise} will resolve to object with Id and Name of the Organization
     */
    static addOrganization(name: string) {
        return handleRequest(
            Auth.axios.post('/admin/organizations', { name }),
            data => new IdName(data)
        );
    }

    /**
     * Update an organization to a new name.
     *
     * @param id
     * @param newName
     * @return {Promise} will resolve to object with Id and Name of the Organization
     */
    static updateOrganization(id: string, newName: string) {
        return handleRequest(
            Auth.axios.put('/admin/organizations/' + id, { name: newName }),
            data => new IdName(data)
        );
    }

    /**
     * Get list of ALL organizations.
     *
     * @return {Promise} will resolve to object with List of ids and names of organizations
     */
    static getAllOrganizations() {
        return handleRequest(
            Auth.axios.get('/admin/organizations'),
            data => data.organizations
        );
    }
}
