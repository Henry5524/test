import {mount} from 'cypress-react-unit-test'
import React from "react"
import Header from "./Header"

/**
 * Tests for the Header UI component
 */
describe('Header tests', () => {
    const testHeader = function (tabId) {

        // valid tabs => executiveSummary, cloudOptimization, dataCenterCapacity, migration
        mount(<Header tab={tabId}/>,
            {
                stylesheets: [
                    'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap'
                ]
            }
        );

        // https://docs.cypress.io/api/commands/contains.html#Syntax
        cy.contains('Summary', {matchCase: true})
            .should('be.visible');

        cy.contains('Cloud Cost', {matchCase: true})
            .should('be.visible');

        cy.contains('Data Center', {matchCase: true})
            .should('be.visible');

        cy.contains('#migration_tab', 'Migration', {matchCase: true})
            .should('be.visible');
    }

    it('Verify responsive behavior for laptop', () => {

        cy.viewport(1440, 900)
        testHeader('cloudOptimization')

    });

    //todo: remove skip after component is fixed to be responsive for tablet size
    it.skip('Verify responsive behavior for tablet', () => {

        cy.viewport(1024, 768)
        testHeader('dataCenterCapacity')

    });

})
