/// <reference types="cypress" />
/// <reference types="@bahmutov/cy-api" />

/**
 * Tests for the MOCK API mocks/api
 */
// @ts-ignore
describe('Tests for the mock data', () => {
    const mockDataServerUrl = Cypress.env('mockDataServerUrl') ;

    it('test mocked api', () => {
        cy.api({
            method: 'GET',
            url: mockDataServerUrl + 'api/persons/1',
            followRedirect: false,
            headers: {
                'content-type': 'application/json'
            }
        }).then(response => {
            expect(response.status).to.eq(200);
            expect(response.statusText).to.eq('OK');
            expect(response).to.have.property('headers');
            expect(response.headers['content-type']).to.eq('application/json');

            const person = response.body;
            cy.log(person, 'Person');

            expect(person).not.to.equal(null);

            // todo: figure out how to properties from the corresponding CONTRACT.json
            const properties = [
                'email',
                'phone',
                'timezone',
                'id',
                'org',
                'name',
                'avatar_url',
                'created_at',
                'last_access',
                'enabled',
                'role'
            ];

            properties.forEach((key) => {
                expect(person).to.have.property(key);
            });

            // todo: wire in html compare between person and cypress fixture file?
        });
    });

    it('Login mock api test', () => {
        cy.api({
            method: 'POST',
            url: mockDataServerUrl + 'api/auth/login',
            followRedirect: false,
            failOnStatusCode: false,
            headers: {
                'content-type': 'application/json'
            },
            body: {
                'userName': 'malhar.thite@virtana.com', // this is a valid email
                'password': '1234',
                'orgName': 'Virtana'
            }

        }).then(response => {
            console.log('response', response);
            expect(response.status).to.eq(200);
            expect(response.statusText).to.eq('OK');
            expect(response).to.have.property('headers');
        });
    });

    it('Login test with invalid credentials returns statusCode 403', () => {
        cy.api({
            method: 'POST',
            url: mockDataServerUrl + 'api/auth/login',
            followRedirect: false,
            failOnStatusCode: false,
            headers: {
                'content-type': 'application/json'
            },
            body: {
                'userName': 'unknow@test.com',
                'password': '1234',
                'orgName': 'Virtana'
            }

        }).then(response => {
            console.log(response.status);
            console.log(response);
            expect(response.status).to.eq(403);
            expect(response.statusText).to.eq('Forbidden');
            expect(response).to.have.property('headers');
        });
    });

    it('Login test with incomplete request body returns statusCode 400', () => {
        cy.api({
            method: 'POST',
            url: mockDataServerUrl + 'api/auth/login',
            followRedirect: false,
            failOnStatusCode: false,
            headers: {
                'content-type': 'application/json'
            },
            body: {
                'userName': 'malhar@test.com',
                'password': '',
                'orgName': 'string'
            }

        }).then(response => {
            console.log(response.status);
            console.log(response);
            expect(response.status).to.eq(400);
            expect(response.statusText).to.eq('Bad Request');
            expect(response).to.have.property('headers');
        });
    });

    it('Login test with Delete statusCode 204', () => {
        cy.api({
            method: 'DELETE',
            url: mockDataServerUrl + 'api/auth/login',
            followRedirect: false,
            failOnStatusCode: false,
            headers: {
                'content-type': 'application/json'
            },

        }).then(response => {
            expect(response.status).to.eq(204);
            expect(response.statusText).to.eq('No Content');
            expect(response).to.have.property('headers');
            expect(response.body).to.eq('');
        });
    });
});
