/**
/// <reference types="cypress" />
/// <reference types="@bahmutov/cy-api" />

// @ts-ignore
import utils from '../../../components/specs/data/login/utils';
const data = require('../../../../cypress/fixtures/data/API/data.json')
const loginData = require('../../../../cypress/fixtures/data/IntegrationTest/login.json')

 //These tests are for the constellation API to create Project with GET, PUT and DELETE methods

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

    const constellationUrl = Cypress.env('constellationUrl');
    let projectId: string;


    it.skip('Create a new project with the POST request and verify it is created and response is with ID ', function () {
        const fileName = 'munging_with_props.zip';
        const method = 'POST';
        const url = constellationUrl + data.apiProjects;
        const fileType = 'application/zip';

        // Get file from fixtures as binary
        cy.fixture(fileName, 'binary').then( (zipfile) => {

            // File in binary format gets converted to blob so it can be sent as Form data
            Cypress.Blob.binaryStringToBlob(zipfile, fileType).then((blob) => {

                // Build up the form
                const formData = new FormData();
                formData.set('file', blob, fileName); //adding a file to the form
                formData.set('project_name', data.project_name);
                formData.set('project_instance', data.project_instance);

                (cy as any).xFormRequest(method, url, formData, function(done: {
                    responseText: object;
                    status: any; })
                {
                    expect(done.status).to.eq(200);
                    // @ts-ignore
                    const abc = JSON.parse(done.responseText);
                    projectId = (abc.id);
                })
            })
            // cy.wait(10000); //This is needed so that the ID for the project created is saved
        })
    });

    it.skip('This to the wait time for the above results are calculated', function () {
        cy.wait(1000*100);
    });

    it.skip('Query for the Projects list and verify the properties ', function () {
        cy.wait(5000)
        .api({
            method: 'GET',
            url: constellationUrl + data.apiObjects + '?type=project',
            followRedirect: false,
            headers: {
                'content-type': 'application/json'
            }
        }).then(response => {
            console.log(response)
            expect(response).to.have.property('headers');
            expect(response.headers['content-type']).to.eq('application/json');
            let num: any;
            for(let i = 0; i < response.body.length; i++) {
                if(response.body[i].name === data.project_name+'/'+data.project_instance){
                    num = i
                }
            }
            const proj = response.body[num];
            // console.log(proj)

            const projProp = [
                'create_time',
                'description',
                'has_overview',
                'id',
                'modify_time',
                'name',
                'project_instance',
                'project_name',
                'results',
                'size',
                'type']

            //Verify the above properties are listed correctly
            projProp.forEach((keys) => {
                expect(proj).have.property(keys)
            });

            //Parse through the list of projects to get the ID whose names are project_name+'/'+project_instance
            response.body.forEach(function(item: {
                id: string;
                name: string; }) {
                if (item.name === data.project_name+'/'+data.project_instance){
                    projectId = item.id
                }
            });
        });
    });

    it.skip('get the specific project ID and verify ', function () {
        cy.wait(5000)
        .api({
            method: 'GET',
            url: constellationUrl + data.apiObjects + projectId,
            followRedirect: false,
            failOnStatusCode: false,
            headers: {
                'content-type': 'application/json'
            }
        }).then(response => {
            expect(response.body.name).to.eq(data.project_name+'/'+data.project_instance);
            expect(response.body.project_instance).to.eq(data.project_instance);
            expect(response.body.project_name).to.eq(data.project_name);
        })
    });
});
*/
