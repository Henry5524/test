import { mount } from 'cypress-react-unit-test';
import React from 'react';
// @ts-ignore
import {PromoField} from '../../components/controls';


describe('Promofield Tests', () => {

    it.skip('Input text field can take a value', () => {
        // @ts-ignore
        mount(<PromoField  />);
        cy.get('input').type('Hello').should('have.value', 'Hello');
    });

    it.skip('Input text field can be cleared', () => {
        // @ts-ignore
        mount(<PromoField  />);
        cy.get('input').type('Hi').clear();
    });

    it.skip('Input field should have a class and value should be nil', () => {
        // @ts-ignore
        mount(<PromoField />);
        cy.get('input').should('have.class', 'MuiInputBase-input');
        cy.get('input').invoke('val').should('contain', '');
    });

});
