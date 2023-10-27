/// <reference types="cypress" />
/// <reference types="@bahmutov/cy-api" />
// @ts-ignore
import utils from '../../../cypress/login/utils';
const data = require('../../../../cypress/fixtures/data/API/data.json');
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

    const constellationUrl = `${Cypress.env('constellationUrl')}`;
    let objectUuid: string;
    const descriptionMessage = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);;

    it.skip('Get the correct project UUID for the Project', function () {
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


    it.skip('Get the project details and save it in GETResponse.json', function () {
        console.log(constellationUrl + data.apiObjects + objectUuid)
        cy.api({
            method: 'GET',
            url: constellationUrl + data.apiObjects + objectUuid,
            failOnStatusCode: false,
            followRedirect: false,
        }).then(response => {
            cy.writeFile(data.fixturesDir+'/GETResponse.json', response.body);
            expect(response.status).to.eq(200);
        })
    });

    it.skip('Modify the GETResponse.json file and appending the description and save it in PUTResponse.json file to be used for PUT request', function () {
        //Read the file from the GETResponse
        cy.readFile(data.fixturesDir+'/GETResponse.json').then((result) => {
            let a = JSON.parse(JSON.stringify(result));
            a.description = descriptionMessage //Append the description
            // console.log(Math.floor(Math.random() * a.nodes.length) + 1)
            let movegroupId : string = (a.nodes[(Math.floor(Math.random() * a.nodes.length) + 1)].id)
            let appId: string = (a.nodes[(Math.floor(Math.random() * a.nodes.length) + 1)].id)
            a.move_groups.push(
                {
                "node_ids": [
                    movegroupId
                ],
                "id": "",
                "mgid": null,
                "type": "Move Group",
                "name": "NewMG",
                "_disabled": null,
                "custom_props": null
                });
            a.apps.push(
                {
                "node_ids": [
                    appId
                ],
                "id": "",
                "mgid": null,
                "type": "Application",
                "name": "NewApp",
                "_disabled": null,
                "custom_props": null
                });

            result = JSON.parse(JSON.stringify(a))                          //Stringify and save it
            cy.writeFile(data.fixturesDir+'/PUTResponse.json', result) //writeFile with new extension PUTResponse

            cy.wait(10000)
            // Get the PUTResponse.json and pass it as PUT request body
                .readFile(data.fixturesDir+'/PUTResponse.json').then((response) => {
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
    });

    let appRunId: any;
    it.skip('Start the calculation for the Application created by PUT request', function () {
        let appId: any;
        cy.api({
            method: 'GET',
            url: constellationUrl + data.apiObjects + objectUuid,
            followRedirect: false,
        }).then(response => {
            let apps = response.body.apps

            apps.forEach(function(item: { name: string; id: any; }) {
                if(item.name === 'NewApp') {
                    appId = item.id;
                    console.log(appId)
                }
            });
            cy.wait(10000)
            .api({
                method: 'POST',
                url: constellationUrl + data.apiObjects + objectUuid + '/calc_app',
                followRedirect: false,
                failOnStatusCode: false,
                body: {
                    "app_ids": [
                        appId
                    ]
                }
            }).then((response) => {
                console.log(response)
                expect(response.status).to.eq(200)
                appRunId = response.body.runId
                cy.log(appRunId + " - Is the runID for the Application calculation")
            });
        });
    });

    it.skip('Before starting the move group this wait is added', function () {
        cy.wait(20000)
    });

    let movegroupRunId: any;
    it.skip('Start the calculation for the Move Group created by PUT request', function () {
        let moveGroupId: any;
        cy.wait(10000).api({
            method: 'GET',
            url: constellationUrl + data.apiObjects + objectUuid,
            followRedirect: false,
        }).then(response => {
            let move_groups = response.body.move_groups;

            move_groups.forEach(function (item: { name: string; id: any; }) {
                if (item.name === 'NewMG') {
                    moveGroupId = item.id;
                }
            });
            cy.wait(10000 * 2)
                .api({
                    method: 'POST',
                    url: constellationUrl + data.apiObjects + objectUuid + '/calc_mg',
                    followRedirect: false,
                    failOnStatusCode: false,
                    body: {
                        "mg_ids": [
                            moveGroupId
                        ]
                    }
                }).then((response) => {
                expect(response.status).to.eq(200);
                movegroupRunId = response.body.runId;
                cy.log(movegroupRunId + " - Is the runID for the Move Group calculation");
            });
        });
    })

    let overviewId: any;
    it.skip('Calculate the overview of all the Apps and Move Groups', function () {
        cy.wait(5000)
        .api({
            method: 'POST',
            url: constellationUrl + data.apiObjects + objectUuid + '/calc_overview',
            followRedirect: false,
            failOnStatusCode: false,
            body: {}
        }).then(response => {
            overviewId = response.body.runId;
            cy.log(overviewId + " is the ID for the overview Run of the Project");
        })
    });

    it.skip('Verify the updated project has the correct value', function () {
        cy.wait(5000)
        .api({
            method: 'GET',
            url: constellationUrl + data.apiObjects + objectUuid,
            followRedirect: false,
            failOnStatusCode: false,
        }).then(response => {
            expect(response.status).to.eq(200);
            expect(response.body.move_groups[0].name).to.eq('NewMG');
            let body = JSON.parse(JSON.stringify(response.body));
            cy.readFile(data.fixturesDir+'/PUTResponse.json').then((result) => {
                let res = JSON.parse(JSON.stringify(result));
                expect(body.move_groups[0].name).to.deep.equal(res.move_groups[0].name);
            });
        });
    });

    it.skip('This to the wait time for the above results are calculated', function () {
        cy.wait(1000*100);
    });

    it.skip('View the results for the Overview', function () {
        cy.wait(5000)
        .api({
            method: 'GET',
            url: constellationUrl + data.apiObjects + objectUuid + '/results/overview',
            followRedirect: false,
        }).then((response) => {
            cy.writeFile(data.fixturesDir+'/overview.json', response.body)
            expect(response.status).to.eq(200);
            expect(response.body.length).to.be.greaterThan(0);
        })
    });

    it.skip('View the results for the Move Groups', function () {
        cy.wait(10000)
        .api({
            method: 'GET',
            url: constellationUrl + data.apiObjects + objectUuid + '/results/mg',
            followRedirect: false,
        }).then((response) => {
            cy.writeFile(data.fixturesDir+'/movegroup.json', response.body)
            expect(response.status).to.eq(200);
            expect(response.body.length).to.be.greaterThan(0);
        })
    });

    it.skip('View the results for the Application', function () {
        cy.wait(10000)
        .api({
            method: 'GET',
            url: constellationUrl + data.apiObjects + objectUuid + '/results/app',
            followRedirect: false,
        }).then((response) => {
            cy.writeFile(data.fixturesDir+'/app.json', response.body)
            expect(response.status).to.eq(200);
            expect(response.body.length).to.be.greaterThan(0);
        })
    });

    it.skip('View the results for the Root', function () {
        cy.wait(5000)
        .api({
            method: 'GET',
            url: constellationUrl + data.apiObjects + objectUuid + '/results/root',
            followRedirect: false,
        }).then((response) => {
            cy.writeFile(data.fixturesDir+'/root.json', response.body)
            expect(response.status).to.eq(200);
            expect(response.body.length).to.be.greaterThan(0);
        });
    });
});

