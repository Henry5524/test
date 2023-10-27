/// <reference types="cypress" />
/**
 * This is the util that holds all the methods which are required/used frequently
 * created by malhar.thite
 * */

// @ts-ignore
module.exports = {

    /**
     * Standard function to create a basic Balance Finder Analytics
     * @param {Object} params =>
     *                  email: (required)
     *                  password : (required)
     *                  organisation: (required)
     *
     */
    loginVCIO(params: { email: string; password: string; organization: string }) {
        cy.visit(`${Cypress.env('vcio-ui')}`);
        // cy.wait(5000);
        (cy as any).xGet('signInEmail').type(params.email);
        (cy as any).xGet('signInPassword').type(params.password);
        // (cy as any).xGet('signInOrganization').type(params.organization); //we have removed this option from the login page
        (cy as any).xGet('signInSubmit').contains('Log In').click();
        cy.url().should('eq', `${Cypress.env('vcio-ui') + '/migration/dashboard'}`);

    },

    /**
     * Logout of VCIO
     */
    logoutVCIO() {
        (cy as any).xGet('dropDownMenu').click();
        (cy as any).xGet('logoutBtn').click();
        (cy as any).xGet('signInEmail');
    },


    /**
     * Standard function to change the Organization
     *
     * @params =>   organizationName: ex. 'Cypress'
     */
    changeOrganization(params: { organizationName: any }) {

        (cy as any).xGet('organizationMenu').then(($el: { text: () => any }) => {
            const orgName = $el.text();

            if (orgName != params.organizationName) {

                (cy as any).xGet('organizationMenu').click();
                cy.wait(1000);
                (cy as any).xGet('org-id-' + params.organizationName, { timeout: 2000 }).click();
            }

            (cy as any).xGet('organizationMenu').should('contain', params.organizationName);

        });
    },
};
