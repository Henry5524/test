/// <reference types="cypress" />
/// <reference types="@bahmutov/cy-api" />
// @ts-ignore
import * as path from 'path';
// @ts-ignore
import utils from '../../../cypress/login/utils';
const data = require('../../../../cypress/fixtures/data/API/data.json');
const loginData = require('../../../../cypress/fixtures/data/IntegrationTest/login.json')
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

    const constellationUrl = `${Cypress.env('constellationUrl')}`;
    let objectUuid: string;

    it.skip('Get the correct project UUID for the API Project', function () {
        cy.api({
            method: 'GET',
            url: constellationUrl + data.apiObjects + '?type=project',
            failOnStatusCode: false,
            followRedirect: false,
        }).then(response => {
            console.log(response)
            response.body.forEach(function(item: {
                project_name: string;
                id: string; }) {
                if (item.project_name === data.project_name){
                    objectUuid = item.id;
                }
            });
        });
    });

    it.skip('Delete the move_groups and apps with GETResponse.json via PUT method', function () {
        cy.wait(5000)
            .readFile(data.fixturesDir+'/GETResponse.json').then((response) => {
            cy.api({
                method: 'PUT',
                url: constellationUrl + data.apiObjects + objectUuid,
                followRedirect: false,
                failOnStatusCode: false,
                body: response
            }).then(response => {
                expect(response.status).to.eq(204);
            });
        });
    });

    it.skip('Delete the project which was created', function () {
        cy.wait(10000)
            .api({
                method: 'DELETE',
                url: constellationUrl + data.apiObjects,
                followRedirect: false,
                failOnStatusCode: false,
                headers: {
                    'content-type': 'application/json'
                },
                body: [objectUuid]
            }).then(response => {
            // console.log(response)
            expect(response.status).to.eq(204);
        })
    });

    it.skip('Delete files in the cypress/fixture/constellation-results dir', function () {
        (cy as any).xLog('Deleting files from the ' + data.fixturesDir + ' directory')
        cy.task('deleteFiles', data.fixturesDir)

    });

});
