/// <reference types="cypress" />
/// <reference types="@bahmutov/cy-api" />

import 'cypress-file-upload';

const utils = require('../../cypress/login/utils');
const login = require('../../../cypress/fixtures/data/IntegrationTest/login.json');
const data = require('../../../cypress/fixtures/data/IntegrationTest/data.json');
const apiData = require('../../../cypress/fixtures/data/API/data.json');

/**
 * Below tests are the Project Dashboard integration tests
 */

describe('Integration test for the Project Dashboard page', () => {

    const constellationUrl = `${Cypress.env('constellationUrl')}`;
    let objectUuid: string;
    let token: string;

    beforeEach(() => {
        cy.visit(`${Cypress.env('vcio-ui')}`);
        utils.loginVCIO({
            email: login.email,
            password: login.password,
            organization: login.organization
        });
    });

    // todo: I skipped all of these, will talk with Malhar when he is back

    it.skip('Login to the vcio-ui', function () {
        cy.url().should('eq', `${Cypress.env('vcio-ui') + '/migration/dashboard'}`);
    });

    let NumCards: number;
    it.skip('Get the total number of cards', function () {
        // cy.get(':nth-child(4) > .MuiTab-wrapper').click();
        cy.url().should('eq', `${Cypress.env('vcio-ui') + '/migration/dashboard'}`);
        cy.get('div.MuiGrid-root.MuiGrid-container').should('be.visible');
        cy.wait(2000);

        cy.get('div.MuiGrid-root.MuiGrid-container').then((response) => {
            NumCards = response[0].childNodes.length;
            cy.log('Number of cards are: ' + NumCards);
        });
    });

    it.skip('Create a new project', function () {
        cy.url().should('eq', `${Cypress.env('vcio-ui') + '/migration/dashboard'}`);

        cy.wait(2000).get('.MuiGrid-root').then((response) => {
            // IF loop will only run if atleast 1 project is already created
            if ((response[0].childElementCount) > 0) {

                // If the projects are present, below code will verify if the project which will be created does already exist
                // to avoid duplicate project being requested
                let present: boolean;
                cy.get('div.MuiCardHeader-root').then((res) => {
                    console.log(res);
                    console.log(res.length);
                    for (let i = 0; i < res.length; i++) {
                        console.log(res[i].innerText);
                        console.log(res[i].children);
                        if ((res[i].innerText).includes(data.project_name)) {
                            (cy as any).xLog(data.project_name + ' Project already present');
                            present = true;
                        }
                    }
                    if (!present) {
                        cy.get('div > button > .MuiButton-label').contains('New Project').click(); // Click on new project link
                        cy.get(':nth-child(2) > .MuiInputBase-root > .MuiInputBase-input').type(data.project_name); // Project Name
                        cy.get(':nth-child(4) > .MuiInputBase-root > .MuiInputBase-input').type(data.project_instance); // Project Instance
                        // This will attach the file to the Project from the fixtures
                        const yourFixturePath = 'munging_with_props.zip';
                        cy.fixture('munging_with_props.zip')
                            .get('[accept=".zip,.rar,.7zip"]').attachFile(yourFixturePath);

                        // Create the Project
                        cy.get('form button span.MuiButton-label').first().click();

                        cy.wait(5000);
                        cy.get('div.MuiGrid-root.MuiGrid-container');
                    }
                });
            }
            // If the Project list is empty the new project will be created.
            else {
                cy.get('div > button > .MuiButton-label').contains('New Project').click(); // Click on new project link
                cy.get(':nth-child(2) > .MuiInputBase-root > .MuiInputBase-input').type(data.project_name); // Project Name
                cy.get(':nth-child(4) > .MuiInputBase-root > .MuiInputBase-input').type(data.project_instance); // Project Instance
                // This will attach the file to the Project from the fixtures
                const yourFixturePath = 'munging_with_props.zip';
                cy.fixture('munging_with_props.zip')
                    .get('[accept=".zip,.rar,.7zip"]').attachFile(yourFixturePath);

                // Create the Project
                cy.get('form button span.MuiButton-label').first().click();

                cy.wait(5000);
                cy.get('div.MuiGrid-root.MuiGrid-container');
            }
        });

    });


    it.skip('Verify the number of cards are visible', function () {
        cy.get('div.MuiGrid-root.MuiGrid-container').then((response) => {
            expect(response[0].childNodes.length).to.be.above(1);
        });
    });

    it.skip('Test the search field operation', function () {
        cy.url().should('eq', `${Cypress.env('vcio-ui') + '/migration/dashboard'}`);

        cy.get('.MuiInputBase-root > .MuiOutlinedInput-input').type(data.project_name);
        cy.get('div.MuiCardHeader-root').then((res) => {
            if (res.length > 0) {
                for (let i = 0; i < res.length; i++) {
                    expect(res[i].innerText).includes(data.project_name);
                }
            }
        });

        cy.get('.MuiInputBase-root > .MuiOutlinedInput-input').clear().type('_');
        cy.get('div.MuiCardHeader-root').then((res) => {
            if (res.length > 0) {
                for (let i = 0; i < res.length; i++) {
                    expect(res[i].innerText).includes('_');
                }
            }
        });
    });

    it.skip('Project card check if the Environment Overview is complete', function () {
        cy.url().should('eq', `${Cypress.env('vcio-ui') + '/migration/dashboard'}`);
        cy.get('.MuiInputBase-root > .MuiOutlinedInput-input').type(data.project_name);
        cy.get('div.MuiCardContent-root').then((res) => {
            if ((res[0].children[0].children[0].textContent) != ('Environment Overview (Completed)')) {
                cy.wait(15000);
            } if ((res[0].children[0].children[0].textContent) != ('Environment Overview (Completed)')) {
                cy.wait(15000);
            } if ((res[0].children[0].children[0].textContent) != ('Environment Overview (Completed)')) {
                cy.wait(15000);
            }
        });

        cy.get('div.MuiCardContent-root').then((res) => {
            expect(res[0].children[0].children[0].textContent).to.eq('Environment Overview (Completed)');
        });

    });

    it.skip('login to the auth and get the Project UUID', function () {
        // With the post request get the x-id-token and use that x-id-token to GET the project and parse the
        // project ID for the above created project
        cy.api({
            method: 'POST',
            url: `${Cypress.env('auth')}`,
            failOnStatusCode: false,
            followRedirect: false,
            body: {
                email: login.email,
                password: login.password,
                organization: login.organization
            }
        }).then((r) => {
            console.log(r);
            // @ts-ignore
            const str = r.headers['set-cookie'][1];
            const str1 = str.split('=');
            // eslint-disable-next-line prefer-destructuring
            token = (str1[1].split(';')[0]);
        })
            .api({
                method: 'GET',
                url: constellationUrl + apiData.apiObjects + '?type=project',
                failOnStatusCode: false,
                followRedirect: false,
                headers: { 'x-id-token': token }
            }).then(res => {
                res.body.forEach(function(item: {
                    project_name: string;
                    id: string; }) {
                    if (item.project_name === data.project_name){
                        objectUuid = item.id;
                        (cy as any).xLog('The object UUID of the created project is ' + objectUuid);
                    }
                });
            });
    });


    it.skip('Verify the clicking on the project routes to correct projectUUID and URL', function () {
        cy.url().should('eq', `${Cypress.env('vcio-ui') + '/migration/dashboard'}`);

        cy.get('.MuiInputBase-root > .MuiOutlinedInput-input').type(data.project_name);
        cy.get('div > .MuiCardHeader-root > .MuiCardHeader-content > .MuiCardHeader-title').click();
        cy.url().should('eq', `${Cypress.env('vcio-ui') + '/migration/project/' + objectUuid + '/inventory'}`);
    });

});
