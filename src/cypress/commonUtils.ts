/// <reference types="cypress" />

/**
 * Wait until there is no mask visible
 *
 * @param delayMs Wait before testing for mask
 */
export const waitForNoMask = (delayMs?: number, maxWaitMs?: number) => {
    cy.wait(delayMs || 500);
    cy.get('.MuiBackdrop-root,[class^=makeStyles-mask]', {
        timeout: maxWaitMs || 30000
    }).should('not.be.visible');
};

