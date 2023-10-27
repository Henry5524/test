/**
/// <reference types="cypress" />
/// <reference types="@bahmutov/cy-api" />

import { mount } from 'cypress-react-unit-test';
import React from 'react';
import {ProjectUploadDialog} from "../components/controls";

describe('ProjectCard tests', () => {

    it.skip('Verify the New Project Button exists ', function () {
        mount(<ProjectUploadDialog />);
        cy.get('button').should('have.class', 'MuiButton-root')
            .contains('New Project');
    });

    it.skip('Click on the button to open the container', function () {
        mount(<ProjectUploadDialog />);
        cy.get('button').click();
        cy.get('.MuiTypography-root').contains('Upload New Project');
    });

    it.skip('Click on the button to open the container', function () {
        mount(<ProjectUploadDialog />)
        cy.get('button').click();
        cy.get('.MuiInputBase-root > .MuiInputBase-input').then((response) => {
            console.log(response)
            expect(response.length).to.eq(2);
            for(let i = 0; i < response.length; i++) {
                if (i === 0) {
                    expect(response[i].placeholder).to.eq('Project Name');
                }
                if (i === 1) {
                    expect(response[i].placeholder).to.eq('Instance Name');
                }
            }
        });
    });

    it.skip('Verify create project and cancel button are visible ', function () {
        mount(<ProjectUploadDialog />);
        cy.get('button').click();
        cy.get('form button').then((response) => {
            expect(response.length).to.eq(2);
            for (let i = 0; i < response.length; i++) {
                if (i === 0) {
                    expect(response[i].textContent).to.eq('Create Project Version');
                }
                if (i === 1) {
                    expect(response[i].textContent).to.eq('Cancel');
                }
            }
        });
    });

    it.skip('Verify choose file button is visible', function () {
        mount(<ProjectUploadDialog />);
        cy.get('button').click();
        cy.get('form input');
        cy.get('[accept=".zip,.rar,.7zip"]').then((response) => {
            expect(response[0].name).to.eq("files");
        });
        cy.get('[accept=".zip,.rar,.7zip"]').click();
    });
});
*/
