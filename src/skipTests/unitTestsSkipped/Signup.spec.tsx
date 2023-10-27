import { mount } from 'cypress-react-unit-test';
import React from 'react';
import {Signup} from '../../components/Signup'
const data = require('../../components/specs/data/signup.json')


describe('Signup components tests', () => {
    it.skip('Mount the sign up page ', function () {
        mount(<Signup />);
        cy.get('form input[name=firstname]');
        cy.get('form input[name=lastname]');
        cy.get('form input[name=email]');
        cy.get('form input[name=company]');
        cy.get('form input[name=password]');
    });

    it.skip('Sign Up PromoButton is visible', () => {
        mount(<Signup />);
        cy.get('form button').should('be.visible');
    });

    it.skip('Sign Up PromoButton is visible', () => {
        mount(<Signup />);
        cy.get('form button span').contains('Sign Up!');
    });

    it.skip('Verify the terms and conditions ', function () {
        mount(<Signup />);
        cy.get('.MuiContainer-root > .MuiGrid-root >').contains('By creating a Virtana account, you are agreeing to theTerms and Conditions');
    });

    it.skip('Verify the terms and conditions has the href property', function () {
        mount(<Signup />);
        cy.get('.MuiContainer-root > .MuiGrid-root > div > a').should('have.prop', 'href').and('include', 'terms');
    });

    it.skip('Verify the href property', function () {
        mount(<Signup />);
        cy.get('.MuiContainer-root > .MuiGrid-root > div > a').should('have.attr', 'target', '_blank');
    });

    it.skip('Verify the text boxes has the typed values', function () {
        mount(<Signup />);
        cy.get('form input[name=firstname]').type(data.firstName);
        cy.get('form input[name=lastname]').type(data.lastName);
        cy.get('form input[name=email]').type(data.email);
        cy.get('form input[name=company]').type(data.company);
        cy.get('form input[name=password]').type(data.password);
        cy.get('form input').then((response) => {
            expect(response[0].defaultValue).to.eq(data.firstName);
            expect(response[1].defaultValue).to.eq(data.lastName);
            expect(response[2].defaultValue).to.eq(data.email);
            expect(response[3].defaultValue).to.eq(data.company);
            expect(response[4].defaultValue).to.eq(data.password);
        });
    });
});
