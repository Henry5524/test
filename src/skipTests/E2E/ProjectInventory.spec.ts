/// <reference types="cypress" />
/// <reference types="@bahmutov/cy-api" />

// @ts-ignore
// const apiData = require('../../fixtures/data/API/data.json')
import 'cypress-file-upload';

const utilsLogin = require('../../cypress/login');
const login = require('../../../cypress/fixtures/data/IntegrationTest/login.json');
const data = require('../../../cypress/fixtures/data/IntegrationTest/data.json');

/**
 * Below tests are the Project Dashboard integration tests
 */

describe('Integration test for the Project Dashboard page', () => {

    beforeEach(() => {
        cy.visit(`${Cypress.env('vcio-ui')}`);
        utilsLogin.loginVCIO({
            email: login.email,
            password: login.password,
            organization: login.organization
        });
    });

    // todo: I skipped all of these, will talk with Malhar when he is back

    it.skip('Verify the clicking on the project routes to correct projectUUID and URL', function () {
        cy.url().should('eq', `${Cypress.env('vcio-ui') + '/migration/dashboard'}`);

        cy.get('.MuiInputBase-root > .MuiOutlinedInput-input').type(data.project_name);
        cy.get('div > .MuiCardHeader-root > .MuiCardHeader-content > .MuiCardHeader-title').click();
        cy.url().should('have.string', 'inventory');

        // Verify the header elements
        cy.get('div.MuiGrid-root.MuiGrid-item.MuiGrid-grid-xs-2').then((res) => {
            expect(res[0].innerText).to.eq('Inventory');
        });

        cy.get('div.MuiGrid-root.MuiGrid-container.MuiGrid-spacing-xs-2.MuiGrid-justify-xs-flex-end').then((res) => {
            expect(res[0].childNodes.length).to.eq(4);
            console.log(res);
            console.log(res[0].childNodes[0].textContent);
            for (let i = 0; i < res[0].childNodes.length; i++) {
                switch (true) {
                    case(i == 0) :
                        expect(res[0].childNodes[i].textContent).to.eq('Save');
                        break;
                    case (i == 1) :
                        expect(res[0].childNodes[i].textContent).contains('Network');
                        break;
                    case (i == 2) :
                        expect(res[0].childNodes[i].textContent).to.eq('All Results');
                        break;
                    case (i == 3) :
                        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                        expect(res[0].childNodes[i].textContent).to.be.empty;
                        break;
                }
            }
        });
    });

    it.skip('Delete newly created project as a part of cleanup', function () {
        cy.url().should('eq', `${Cypress.env('vcio-ui') + '/migration/dashboard'}`);
        cy.get('.MuiInputBase-root > .MuiOutlinedInput-input').type(data.project_name);
        let num: number;
        cy.get('div.MuiCardHeader-root').then((res) => {
            for (let i = 0; i < res.length; i++) {
                console.log(res[i].innerText);
                console.log(res[i].children);
                if ((res[i].innerText).includes(data.project_name)) {
                    num = i + 1;
                }
            }
            cy.get(':nth-child(' + num + ') > div > .MuiCardHeader-root > .MuiCardHeader-action').click();

            cy.get('div > .MuiPaper-root > ul > li').should('have.class', 'MuiListItem-gutters').contains('Delete').click({ force: true });
        });
    });
});
