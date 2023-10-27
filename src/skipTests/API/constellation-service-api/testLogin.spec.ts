/// <reference types="cypress" />
/// <reference types="@bahmutov/cy-api" />
// @ts-ignore
import utils from '../../../cypress/login/utils';

const loginData = require('../../../../cypress/fixtures/data/IntegrationTest/login.json');
/**
 * These tests are for the constellation Projects details
 */
// @ts-ignore
describe('Tests for the constellation project dashboard', () => {
    beforeEach(() => {
        cy.visit(`${Cypress.env('vcio-ui')}`);

        utils.loginVCIO({
            email: loginData.email,
            password: loginData.password,
            organization: loginData.organization
        });
        cy.url({ timeout: 20000 }).should('eq', `${Cypress.env('vcio-ui') + '/migration/dashboard'}`);
    });

    it('test api', function () {
        cy.api({
            method: 'POST',
            url: 'https://dev.vcio.virtana.com/auth/login',
            body: { email: 'test@virtana.com', password: 'V1.admin', organization: 'Virtana' }
        }).then((res) => {
            console.log(res);
            console.log(res.body.id);
            window.localStorage.setItem('jwt', res.body.id);
        });
    });

});
