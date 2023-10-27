/// <reference types="cypress" />
/// <reference types="@bahmutov/cy-api" />

import { mount } from 'cypress-react-unit-test';
import React from 'react';
import {Signin} from '../../components/Signin';

/**
 * Tests for the Signin UI component
 */
describe('Signin tests', () => {

    // it('Should initialize', () => {
    //     mount(<Signin />);
    //     cy.get('main')
    //         .then((result) => {
    //             (cy as any).xHtmlCompare(result, 'Signin.html');
    //             (cy as any).xPixelCompare(result, 'Signin.png');
    //         });
    // });

    it.skip('Should have inputs', () => {
        mount(<Signin />);
        cy.get('form input[name=email]');
        cy.get('form input[name=password]');
    });

    it.skip('Email input should have focus by default', () => {
        mount(<Signin />);
        cy.get('form input[name=email]').focused();
    });

    it.skip('Should have Log in button', () => {
        mount(<Signin />);
        cy.get('form button[type=submit]');
    });

    it.skip('Log In PromoButton is visible', () => {
        mount(<Signin />);
        cy.get('form button').should('be.visible');
    });

    it.skip('Log In Text is visible', () => {
        mount(<Signin />);
        cy.get('form button span').contains('Log In');
    });

    it.skip('Should have Log In text in the PromoButton', () => {
        mount(<Signin />);
        cy.get('form a').should('have.prop', 'href').and('include', '/reset-password');
        cy.get('form').find('a')
            .should(($a) => {
                expect($a).to.have.length(1);
                expect($a).to.have.text('Forgot your password?');
            });
    });


    it.skip('Should have Sign up link', () => {
        mount(<Signin />);
        cy.get('div a').should('have.prop', 'href').and('include', 'signup');
        cy.get('div').find('a')
            .should(($a) => {
                expect($a[0]).to.have.text('Sign Up');
                expect($a[2]).to.have.text('Terms of Use');
                expect($a[3]).to.have.text('Support');

            });
    });

    it.skip('Should have Terms of Use link', () => {
        mount(<Signin />);
        cy.get('div a').should('have.prop', 'href');
        cy.get('div').find('a')
            .should(($a) => {
                expect($a[2].attributes[1].value).to.equal('terms');
            });
    });


    it.skip('Should have Sign up link', () => {
        mount(<Signin />);
        cy.get('div a').should('have.prop', 'href');
        cy.get('div').find('a')
            .should(($a) => {
                expect($a[3].attributes[1].value).to.equal('support');
            });
    });

});
