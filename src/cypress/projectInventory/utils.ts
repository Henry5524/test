/// <reference types="cypress" />
import { waitForNoMask } from '../commonUtils';

/**
 * Utils for Project Inventory
 *
 * @author Malhar Thite
 *
 * List of functions:
 *              navigateToDashboard
 *              createAppGroup
 *              createMoveGroup
 *              deviceToApp
 *              deviceToMoveGroup
 *              verifyDevicesByFiltering
 *              customProp
 *              moveGroupList
 *              applicationList
 *              DragNDropApp2MoveGroup
 *              DragNDropDevice2App
 *              startCalculation
 *              listView
 *              moveGroupGridOptions
 *              undo
 *              applicationGridOptions
 *              setCustomProperty
 *
 * */
module.exports = {

    /**
     * Standard function to navigate to Project Dashboard
     *
     */
    navigateToDashboard() {
        cy.url({ timeout: 5000 }).then((result: any) => {
            if (result != `${Cypress.env('vcio-ui') + '/migration/dashboard'}`) {
                (cy as any).xGet('migrateTab', { timeout: 10000 }).then(($migrateButton: any) => {
                    if ($migrateButton.is(':enabled')) {
                        cy.log('migrate tab is enabled');
                        (cy as any).xGet('migrateTab', { timeout: 10000 }).click({ force: true });
                    } else {
                        cy.wait(1000).get('[data-cy=navMenuTopLink]', { timeout: 10000 }).then((res: any) => {
                            if (res.is(':enabled')) {
                                cy.log('nav menu is enabled');
                                cy.get('[data-cy=navMenuTopLink]').click();
                            }
                        });
                    }
                });
            }
        });
        cy.url({ timeout: 5000 }).then((result: any) => {
            if (result != `${Cypress.env('vcio-ui') + '/migration/dashboard'}`) {
                cy.reload().then(() => {
                    cy.wait(4000).url({ timeout: 10000 }).then((result: any) => {
                        if (result != `${Cypress.env('vcio-ui') + '/migration/dashboard'}`) {
                            (cy as any).xGet('migrateTab', { timeout: 10000 }).then(($migrateButton: any) => {
                                if ($migrateButton.is(':enabled')) {
                                    (cy as any).xGet('migrateTab', { timeout: 10000 }).click({ force: true });
                                }
                            });
                        }
                    });
                });
                cy.url().should('eq', `${Cypress.env('vcio-ui') + '/migration/dashboard'}`);
            }

        });

    },

    /**
     * Standard function to add the application group name
     *
     * @params =>   appName: name of the app, ex. 'App02'
     *              numberOfApp: number, ex. 1 or 5 or 20
     *              create: yes or no
     *              cancel: yes or no
     *              close: yes or no
     *
     */
    createAppGroup(params: { numberOfApp: number; appName: any; createApp: any; cancelApp: any; closeApp: any }) {
        // const rng = () => Cypress._.random(0, 1e6);

        (cy as any).xGet('InventoryAddButton').first().click();

        // Verify the label says "Application Name"
        (cy as any).xGet('addGroupNameLabel').contains('Application Name');
        // (cy as any).xGet('addGroupNameLabel').then((res: any) => {
        //     expect(res[0].innerText).to.eq('Application Name');
        // });
        (cy as any).xGet('cancelAddGroupBtn').click();

        if (params.createApp === 'yes') {
            for (let i = 1; i <= params.numberOfApp; i++) {

                (cy as any).xGet('InventoryAddButton').first().click({ force: true });

                // Input a Application Name
                (cy as any).xGet('addGroupNameInput').wait(2000).click({ force: true }).type(params.appName + i);

                // Click on create
                (cy as any).xGet('createGroupBtn').click({ force: true });

            }
            // cy.wait(2000);
            this.saveProject();
        }
        if (params.cancelApp === 'yes') {
            (cy as any).xGet('InventoryAddButton').first().click();

            (cy as any).xGet('cancelAddGroupBtn').click();
        }
        if (params.closeApp === 'yes') {
            (cy as any).xGet('InventoryAddButton').first().click();

            (cy as any).xGet('closeAddGroupBtn').click();
        }
    },

    /**
     * Standard function to add the application group name
     *
     * @params =>   moveGroup: name of the moveGroup, ex. 'App02'
     *              numberOfMoveGroup: number, ex. 1 or 5 or 20
     *              create: yes or no
     *              cancel: yes or no
     *              close: yes or no
     *
     */

    createMoveGroup(params: { numberOfMoveGroup: number; moveGroupName: any; createMoveGroup: any; cancelMoveGroup: any; closeMoveGroup: any }) {

        // cy.wait(10000); // this is required because after creating app group and saving, calculation starts which takes the focus off cypress

        (cy as any).xGet('InventoryAddButton').last().click();

        // Verify the label says "Move Group Name"
        (cy as any).xGet('addGroupNameLabel').contains('Move Group Name');

        (cy as any).xGet('cancelAddGroupBtn').click();

        if (params.createMoveGroup === 'yes') {

            for (let i = 1; i <= params.numberOfMoveGroup; i++) {

                (cy as any).xGet('InventoryAddButton').last().click();

                // Input a Move Group Name
                (cy as any).xGet('addGroupNameInput').type(params.moveGroupName + i);

                // Click on create
                (cy as any).xGet('createGroupBtn').click({ force: true });
            }

            cy.wait(2000);
            // Save the Move Groups
            this.saveProject();
        }
        if (params.cancelMoveGroup === 'yes') {

            (cy as any).xGet('InventoryAddButton').last().click();

            (cy as any).xGet('cancelAddGroupBtn').click();
        }
        if (params.closeMoveGroup === 'yes') {

            (cy as any).xGet('InventoryAddButton').last().click();

            (cy as any).xGet('closeAddGroupBtn').click();
        }
    },

    /**
     * Standard function to add devices to the application group
     *
     * @params =>   deviceInfo: name or IP
     *              appName: name
     *              copyToApp: yes
     *              moveToApp: yes
     *              removeFromSelectedApp: yes
     *              removeFromAllExceptSelectedApp: yes
     *              removeFromAllApp: yes
     *
     */
    deviceToApp(params: {
        deviceInfo: any; appName: any; copyToApp: any; moveToApp: any; removeFromSelectedApp: any;
        removeFromAllExceptSelectedApp: any; removeFromAllApp: any;
    }) {

        if (params.copyToApp === 'yes') {

            (cy as any).xGet('devicesSearchField').first().click().type(params.deviceInfo);

            cy.wait(1000).get('[data-cy="inventory-device"]').within(() => {
                cy.get('.ag-checkbox-input').first().click();
            });
            // Select checkbox for the first row
            // cy.get('.ag-center-cols-container > :nth-child(1)').within(() => {
            //     cy.get('.ag-checkbox-input').first().click()
            // });

            // Rightclick on the selected device for options to move/copy
            cy.wait(1000).get('[data-cy="inventory-device"]').within(() => {
                cy.get('.ag-center-cols-container > :nth-child(1)').rightclick('center');
            });

            (cy as any).xGet('inventoryDevicesCopyToApplication').click();

            (cy as any).xGet('selectAppMoveGroupFilter').click().type(params.appName);

            cy.get('.ag-full-width-container').within(() => {
                cy.get('.ag-row-first').click();
            });

            this.saveProject();

            cy.wait(1000).get('[data-cy="inventory-device"]').within(() => {
                cy.get('.ag-checkbox-input').first().click();
            });

            (cy as any).xGet('devicesSearchField', { timeout: 2000 }).first().type('{selectall}{backspace}');

        }
        if (params.moveToApp === 'yes') {
            (cy as any).xGet('devicesSearchField').first().click().type(params.deviceInfo);

            // Select checkbox for the first row
            cy.wait(1000).get('[data-cy="inventory-device"]').within(() => {
                cy.get('.ag-checkbox-input').first().click();
            });

            // Rightclick on the selected device for options to move/copy
            cy.wait(1000).get('[data-cy="inventory-device"]').within(() => {
                cy.get('.ag-center-cols-container > :nth-child(1)').rightclick('center');
            });

            (cy as any).xGet('inventoryDevicesMoveToApplication').click();

            (cy as any).xGet('selectAppMoveGroupFilter').click().type(params.appName);

            cy.get('.ag-full-width-container').within(() => {
                cy.get('.ag-row-first').click();
            });

            this.saveProject();

            cy.get('[data-cy="inventory-device"]').within(() => {
                cy.get('.ag-checkbox-input').first().click();
            });

            (cy as any).xGet('devicesSearchField', { timeout: 2000 }).first().type('{selectall}{backspace}');

        }
        if (params.removeFromSelectedApp === 'yes') {
            (cy as any).xGet('devicesSearchField').eq(1).click().type(params.appName);

            cy.wait(1000).get('[data-cy="inventory-application"]').within(() => {
                cy.get('.ag-checkbox-input').first().click();
            });

            (cy as any).xGet('devicesSearchField').first().click().type(params.deviceInfo);

            // Select checkbox for the first row
            cy.wait(1000).get('[data-cy="inventory-device"]').within(() => {
                cy.get('.ag-checkbox-input').first().click();
            });

            // Rightclick on the selected device for options to move/copy
            cy.wait(1000).get('[data-cy="inventory-device"]').within(() => {
                cy.get('.ag-center-cols-container > :nth-child(1)').rightclick('center');
            });

            (cy as any).xGet('inventoryDevicesRemoveFromSelectedApplication').click();

            (cy as any).xGet('clearAllBtn').click();


            this.saveProject();

            cy.get('[data-cy="inventory-device"]').within(() => {
                cy.get('.ag-checkbox-input').first().click();
            });

            (cy as any).xGet('devicesSearchField', { timeout: 2000 }).first().type('{selectall}{backspace}');

            (cy as any).xGet('devicesSearchField', { timeout: 2000 }).eq(1).type('{selectall}{backspace}');


        }
        if (params.removeFromAllExceptSelectedApp === 'yes') {
            (cy as any).xGet('devicesSearchField').eq(1).click().type(params.appName);

            cy.wait(1000).get('[data-cy="inventory-application"]').within(() => {
                cy.get('.ag-checkbox-input').first().click();
            });

            (cy as any).xGet('devicesSearchField').first().click().type(params.deviceInfo);

            // Select checkbox for the first row
            cy.get('[data-cy="inventory-device"]').within(() => {
                cy.get('.ag-checkbox-input').first().click();
            });

            // Rightclick on the selected device for options to move/copy
            cy.get('[data-cy="inventory-device"]').within(() => {
                cy.get('.ag-center-cols-container > :nth-child(1)').first().rightclick('center');
            });

            (cy as any).xGet('inventoryDevicesRemoveExceptSelectedApplication').click();

            (cy as any).xGet('clearAllBtn').click();

            this.saveProject();

            cy.get('[data-cy="inventory-device"]').within(() => {
                cy.get('.ag-checkbox-input').first().click();
            });

            (cy as any).xGet('devicesSearchField', { timeout: 2000 }).first().type('{selectall}{backspace}');

            (cy as any).xGet('devicesSearchField', { timeout: 2000 }).eq(1).type('{selectall}{backspace}');

        }
        if (params.removeFromAllApp === 'yes') {

            (cy as any).xGet('devicesSearchField').first().click().type(params.deviceInfo);

            // Select checkbox for the first row
            cy.wait(1000).get('[data-cy="inventory-device"]').within(() => {
                cy.get('.ag-checkbox-input').first().click();
            });

            // Rightclick on the selected device for options to move/copy
            cy.get('[data-cy="inventory-device"]').within(() => {
                cy.get('.ag-center-cols-container > :nth-child(1)').first().rightclick('center');
            });

            (cy as any).xGet('inventoryDevicesRemoveFromAllApplication').click();

            this.saveProject();

            cy.get('[data-cy="inventory-device"]').within(() => {
                cy.get('.ag-checkbox-input').first().click();
            });

            (cy as any).xGet('devicesSearchField', { timeout: 2000 }).first().type('{selectall}{backspace}');

        }
    },

    /**
     * Standard function to add devices to the move group
     *
     * @params =>   deviceInfo: name or IP
     *              moveGroupName: name
     *              moveToMoveGroup: yes
     *              removeFromMoveGroup: yes
     *
     */
    deviceToMoveGroup(params: { deviceInfo: any; moveGroupName: any; moveToMoveGroup: any; removeFromMoveGroup: any }) {
        if (params.moveToMoveGroup === 'yes') {
            (cy as any).xGet('devicesSearchField').first().click().type(params.deviceInfo);

            // Select checkbox for the first row
            cy.wait(1000).get('[data-cy="inventory-device"]').within(() => {
                cy.get('.ag-checkbox-input').first().click();
            });

            // Rightclick on the selected device for options to move/copy
            cy.wait(1000).get('[data-cy="inventory-device"]').within(() => {
                cy.get('.ag-center-cols-container > :nth-child(1)').first().rightclick('center');
            });

            (cy as any).xGet('inventoryDevicesMoveToMoveGroup').click();

            (cy as any).xGet('selectAppMoveGroupFilter').click().type(params.moveGroupName);

            cy.get('.ag-full-width-container').within(() => {
                cy.get('.ag-row-first').click();
            });

            cy.wait(3000).then(() => {

                cy.get('[data-cy="inventory-device"]').within(() => {
                    cy.get('.ag-checkbox-input').first().click();
                });

                (cy as any).xGet('devicesSearchField', { timeout: 20000 }).first().type('{selectall}{backspace}');

                this.saveProject();
            });

        }

        if (params.removeFromMoveGroup === 'yes') {
            (cy as any).xGet('devicesSearchField').first().click().type(params.deviceInfo);

            // Select checkbox for the first row
            cy.wait(1000).get('[data-cy="inventory-device"]').within(() => {
                cy.get('.ag-checkbox-input').first().click();
            });

            // Rightclick on the selected device for options to move/copy
            cy.get('[data-cy="inventory-device"]').within(() => {
                cy.get('.ag-center-cols-container > :nth-child(1)').first().rightclick('center');
            });

            (cy as any).xGet('inventoryDevicesRemoveFromMoveGroups').click();

            this.saveProject();

            (cy as any).xGet('devicesSearchField', { timeout: 2000 }).first().type('{selectall}{backspace}');
        }
    },

    /**
     * Standard function to verify the devices filtered from Application Group or Move Group
     *
     * @params =>   filterByApp: yes or no
     *              filterByMoveGroup: yes or no
     *              filterByCustomProp: yes or no
     *              appName: name
     *              moveGroupName: name
     *
     *
     */
    verifyDevicesByFiltering(params: {
        appName: any; moveGroupName: any; filterByApp: any; filterByMoveGroup: any; deviceName: any; expectedDevices: number; filterByCustomProp: any;
        customPropName: any; customPropValue: any; arrayDevices: any;
    }) {
        if (params.filterByApp === 'yes') {
            (cy as any).xGet('devicesSearchField').eq(1).click().type(params.appName);


            cy.get('[data-cy="inventory-application"]').within(() => {
                cy.wait(3000).get('.ag-checkbox-input', { timeout: 5000 }).first().click();
            });


            (cy as any).xGet('filteredEntity').then((res: any) => {
                console.log(res);
                expect(res[0].innerText).to.eq('App: ' + params.appName);
            });

            (cy as any).xGet('devicesSearchField').eq(0).click().type(params.deviceName)
                .get('.ag-center-cols-container > :nth-child(1)')
                .first()
                .then((result: any) => {
                    console.log(result);
                    assert.include(result[0].innerText, params.deviceName);
                    (cy as any).xGet('inventoryPanelTitleDeviceCount').then((count: any) => {
                        expect(Number(count[0].innerText)).to.eq(params.expectedDevices);
                    });
                });
            (cy as any).xGet('clearAllBtn').click();

            (cy as any).xGet('filteredEntity').should('not.exist');

            (cy as any).xGet('devicesSearchField', { timeout: 2000 }).eq(1).click().type('{selectall}{backspace}');

            (cy as any).xGet('devicesSearchField', { timeout: 2000 }).eq(0).click().type('{selectall}{backspace}');
        }
        if (params.filterByMoveGroup === 'yes') {
            (cy as any).xGet('devicesSearchField').last().click().type(params.moveGroupName);

            cy.wait(1000).get('[data-cy="inventory-movegroup"]').within(() => {
                cy.get('.ag-checkbox-input').first().click();
            });

            (cy as any).xGet('filteredEntity').then((res: any) => {
                console.log(res);
                expect(res[0].innerText).to.eq('Move Group: ' + params.moveGroupName);
            });

            (cy as any).xGet('devicesSearchField').eq(0).click().type(params.deviceName)
                .get('.ag-center-cols-container > :nth-child(1)')
                .first()
                .then((result: any) => {
                    assert.include(result[0].innerText, params.deviceName);
                    (cy as any).xGet('inventoryPanelTitleDeviceCount').then((count: any) => {
                        expect(Number(count[0].innerText)).to.eq(params.expectedDevices);
                    });
                });

            (cy as any).xGet('clearAllBtn').click();

            (cy as any).xGet('filteredEntity').should('not.exist');

            (cy as any).xGet('devicesSearchField', { timeout: 2000 }).last().click().type('{selectall}{backspace}');

            (cy as any).xGet('devicesSearchField', { timeout: 2000 }).eq(0).click().type('{selectall}{backspace}');

        }
        if (params.filterByCustomProp === 'yes') {

            // Click the Application dropdown
            (cy as any).wait(500).xGet('inventoryPanelTitleApplication').click();

            // Select the Custom property name
            (cy as any).xGet(`inventoryPanelDrop${params.customPropName}`).click();

            // Filter the custom property value which is passed
            (cy as any).xGet('devicesSearchField').eq(1).click().type(params.customPropValue);

            // Click on the checkbox of the filtered custom property value
            cy.wait(1000).get('[data-cy="inventory-application"]').within(() => {
                cy.get('.ag-checkbox-input').first().click();
            });

            (cy as any).xGet('filteredEntity').then((res: any) => {
                console.log(res);
                expect(res[0].innerText).to.eq(params.customPropName + ': ' + params.customPropValue);
            });

            // Filter the compute instance name passed
            (cy as any).xGet('devicesSearchField').eq(0).click().type(params.deviceName)
                .get('[data-cy="inventory-device"]').within(() => { // wait(1000) is needed for the grid to reload
                    cy.get('.ag-center-cols-container > .ag-row-first') // Select the first row from the custom property grid
                        .then((result: any) => {
                            const a = (result[0].innerText).split(/\r?\n/); // Split the first row content
                            expect(a[0]).to.include(params.deviceName); // a[0] is the device name and assertion is to include the params.deviceName
                            cy.get('.ag-status-name-value-value').then((count: any) => { // THis will get the footer row count after filtering the compute instance
                                expect(Number(count[1].innerText)).to.eq(params.expectedDevices); // Verify it with the device count
                            });
                        });
                });

            (cy as any).xGet('clearAllBtn').click();

            (cy as any).xGet('filteredEntity').should('not.exist');

            // Uncheck the Custom property value checkbox
            cy.get('[data-cy="inventory-application"]').within(() => {
                cy.get('.ag-checkbox-input').first().click();
            });

            // Clear the search field for Application grid
            (cy as any).xGet('devicesSearchField', { timeout: 2000 }).eq(1).click().type('{selectall}{backspace}');

            // Clear the search field for compute instance grid
            (cy as any).xGet('devicesSearchField', { timeout: 2000 }).eq(0).click().type('{selectall}{backspace}');
        }
    },

    /**
     * Creates a custom property via the Manage Custom Properties dialog.
     */
    createCustomPropertyViaMCP(name: string, saveProject: boolean) {

        // Launch the MCP dialog and do a quick validation
        (cy as any).xGet('inventoryHamburgerMenu').click();
        (cy as any).xGet('manageCustomProperties').last().click();
        (cy as any).xGet('MCPDialogTitle').then((res: any) => {
            console.log(res[0].innerText);
            expect(res[0].innerText).to.eq('Manage Custom Properties');
        });
        (cy as any).xGet('applyMCPBtn').should('be.disabled');

        // Add the custom property
        (cy as any).xGet('addCustomProperties').click();
        cy.get('div.ag-cell-edit-wrapper').type(name + '{enter}');

        // Click Apply button
        (cy as any).xGet('applyMCPBtn').should('be.enabled').click();

        if (saveProject) {
            this.saveProject();
            // Verify the newly created property is visible on the left nav.
            // Custom properties are only added to the left nav after they are saved.
            cy.get('.MuiTreeView-root').then((res: any) => {
                expect(res[0].textContent).contains(name);
            });
        }

        // Verify the newly created property is visible on the Applications drop-down,
        // then click it just to dismiss the drop-down.
        (cy as any).xGet('applicationsPanelSelectControl').click();
        (cy as any).xGet('inventoryPanelDrop' + name).should('exist');

        // I guess this is here to dismiss the drop-down by clicking something else.
        // Also the delay it inadvertently introduces seems to be necessary.
        // When I remove these two lines and just add .click() to the line above, get errors in
        // CustomPropertiesTests-3.spec.ts
        (cy as any).xGet('manageCustomProperties').last().click();
        (cy as any).xGet('cancelMCPBtn').click();
    },

    /**
     * Deletes a custom property via the Manage Custom Properties dialog.
     */
    deleteCustomPropertyViaMCP(name: string, deviceCount: number, saveProject: boolean) {

        // Launch the MCP dialog and do a quick validation
        (cy as any).xGet('inventoryHamburgerMenu').click();
        (cy as any).xGet('manageCustomProperties').last().click();
        (cy as any).xGet('MCPDialogTitle').then((res: any) => {
            console.log(res[0].innerText);
            expect(res[0].innerText).to.eq('Manage Custom Properties');
        });
        (cy as any).xGet('applyMCPBtn').should('be.disabled');


        // Delete the custom property via the trash icon and validate the delete confirmation message appears
        cy.get('div.ag-center-cols-container').find('[col-id="propertyTitle"]').then((r: any) => {
            let rowID: any;
            r.each((index: any, item: any) => {
                if (item.innerText === name) {
                    rowID = index;
                    cy.wait(1000).get('div.ag-center-cols-container [row-index="' + rowID + '"]')
                        .find('[col-id="deleteIconColumn"]').click();
                    cy.get('div.ag-center-cols-container [row-index="' + rowID + '"]')
                        .find('[col-id="deviceCountMessageColumn"]')
                        .contains('will be removed from ' + deviceCount);

                    // Click Apply button
                    (cy as any).xGet('applyMCPBtn').should('be.enabled').click();

                    if (saveProject) {
                        this.saveProject();
                    }
                }
            });
        });

        // Verify the deleted property is not visible on the left nav
        cy.get('.MuiTreeView-root', { timeout: 60000 }).then((res: any) => {
            assert.notInclude(res[0].textContent, name);
        });
    },

    /**
     * Standard function to create, delete and verify the custom properties
     * ToDo:  eliminate usage - favor the two functions above
     *
     * @params =>   name: custom prop name example: 'East Lab 123' or 'West Lab'
     *              create: yes or no
     *              delete: yes or no
     *              deviceCount: number
     *
     *
     */
    customProp(params: { name: string; create: string; delete: string; deviceCount: number }) {

        // Click on the Application to open the drop down
        // (cy as any).xGet('inventoryPanelTitleApplication').click();

        (cy as any).xGet('inventoryHamburgerMenu').click();

        (cy as any).xGet('manageCustomProperties').last().click();

        (cy as any).xGet('MCPDialogTitle').then((res: any) => {
            console.log(res[0].innerText);
            expect(res[0].innerText).to.eq('Manage Custom Properties');
        });

        (cy as any).xGet('applyMCPBtn').should('be.disabled');

        if (params.create === 'yes') {
            // click add custom prop button
            (cy as any).xGet('addCustomProperties').click();

            // Type in the custom prop name
            cy.get('div.ag-cell-edit-wrapper').type(params.name + '{enter}');

            // Verify Apply button is enabled and click
            (cy as any).xGet('applyMCPBtn').should('be.enabled').click();

            this.saveProject();

            // Verify the new created property is visible on the tree nav
            cy.get('.MuiTreeView-root').then((res: any) => {
                expect(res[0].textContent).contains(params.name);
            });

            // Verify the new created property is visible on dropdown item
            (cy as any).xGet('inventoryPanelTitleApplication').click();

            (cy as any).xGet('inventoryPanelDrop' + params.name).should('exist');

            // (cy as any).xGet('inventoryPanelTitleApplication').first().click({force: true});

            (cy as any).xGet('manageCustomProperties').last().click();

            (cy as any).xGet('cancelMCPBtn').click();
        }

        if (params.delete === 'yes') {

            cy.get('div.ag-center-cols-container').find('[col-id="propertyTitle"]').then((r: any) => {
                console.log(r);
                let rowID: any;
                r.each((index: any, item: any) => {
                    // console.log(item.innerText)
                    if (item.innerText === params.name) {
                        rowID = index;
                        cy.wait(1000).get('div.ag-center-cols-container [row-index="' + rowID + '"]').find('[col-id="deleteIconColumn"]').click();

                        cy.get('div.ag-center-cols-container [row-index="' + rowID + '"]').find('[col-id="deviceCountMessageColumn"]').contains('will be removed from ' + params.deviceCount);

                        // Verify Apply button is enabled and click
                        (cy as any).xGet('applyMCPBtn').should('be.enabled').click();

                        this.saveProject();
                    }
                });
            });

            // Verify the new created property is visible on the tree nav
            cy.get('.MuiTreeView-root', { timeout: 60000 }).then((res: any) => {
                assert.notInclude(res[0].textContent, params.name);
                // expect(res[0].textContent).should('not.have.value', params.name);
            });

        }
    },

    /**
     * Standard function to view the Move Group List
     *
     * @params =>   name: move group name
     *              numberOfMoveGroupanalyized: number ex: 0, 5 etc
     *              numberOfMoveGroups: total number of move groups in the project
     *              deviceCount: total devices in the Move Group
     *              switchMoveGroup: yes or no
     *              switchMoveGroupName: move group name
     *              switchMoveGroupDeviceCount: new move group device count
     *              switchMoveGroupDeviceName: device name to verify in the grid
     *              numberOfApp: number of apps in the new move group
     *              verifyMoveGroupCalculation: Verify if the move group is calculated
     *
     */
    moveGroupList(params: {
        name: string; numberOfMoveGroupanalyized: number; numberOfMoveGroups: string; deviceCount: any;
        switchMoveGroup: string; switchMoveGroupName: string; switchMoveGroupDeviceCount: number; switchMoveGroupDeviceName: string; numberOfApp: number; appName: string;
        verifyMoveGroupCalculation: string;
    }) {

        cy.get('.vcio-ars-angle-right').eq(1).click();

        cy.get('.MuiCollapse-wrapperInner > :nth-child(1) > .MuiTreeItem-content > .MuiTypography-root').as('moveGroupList');
        cy.get('@moveGroupList').click();

        cy.url().should('include', '/mg/move-group-list');

        (cy as any).xGet('inventoryHeaderTitle').then((res: any) => {
            expect(res[0].innerText).to.eq('Move Group List');
        });

        (cy as any).wait(1000).xGet('dependenciesMoveGroup', { timeout: 5000 }).then((res: any) => {
            console.log(res[0].innerText);
            expect(res[0].innerText).to.eq(params.numberOfMoveGroupanalyized + ' of ' + params.numberOfMoveGroups + ' Move Groups');
            cy.log((params.numberOfMoveGroupanalyized + ' of ' + params.numberOfMoveGroups + ' Move Groups'));
        });

        // Filter with the Move Group Name
        (cy as any).xGet('moveGroupListFilter').click().type(params.name);

        // Test scroll to the right
        cy.get('.ag-center-cols-viewport').scrollTo('right', { ensureScrollable: false });

        // Verify the total device count
        cy.get('.ag-row > [col-id="individualDeviceCount"]').then(cell => {
            expect(Number(cell[0].innerText)).to.eq(params.deviceCount);
        });

        // Scroll to the left
        cy.get('.ag-center-cols-viewport').scrollTo('left', { ensureScrollable: false });

        if (params.verifyMoveGroupCalculation === 'yes') {
            cy.get('.ag-react-container > span.vcio-status-ok').should('exist');
        }

        // Click on Move Group name to view the Move Group
        cy.get('.ag-row > [col-id="moveGroup"]').click();

        // Verify the number of devices
        (cy as any).xGet('numberOfDevices', { timeout: 20000 }).then((res: any) => {
            expect(Number(res[0].innerText)).to.eq(params.deviceCount);
            cy.log('The number of devices are ' + params.deviceCount);
        });

        (cy as any).xGet('inventoryHeaderTitle').then((res: any) => {
            expect(res[0].innerText).to.eq(params.name);
        });

        if (params.numberOfApp) {
            (cy as any).xGet('numberOfApp').then((res: any) => {
                expect(Number(res[0].innerText)).to.eq(params.numberOfApp);
            });

            cy.get('.ag-center-cols-container').then((res: any) => {
                console.log(res);
                expect(res.length).to.be.above(0);
            });

            cy.wait(500).get('.ag-center-cols-container').within((res: any) => {
                console.log(res[0].innerText);
                assert.include(res[0].innerText, params.appName);
            });
        }

        if (params.switchMoveGroup === 'yes') {
            // Click on the icon to open the move group list
            cy.get('.vcio-migration-move-group').click();

            cy.get('.MuiPaper-root > .MuiList-root').children('.MuiListItem-button').contains(params.switchMoveGroupName).click();
            cy.log('Move group changed ' + params.switchMoveGroupName);

            // Verify the number of devices
            (cy as any).xGet('numberOfDevices', { timeout: 20000 }).then((res: any) => {
                expect(Number(res[0].innerText)).to.eq(params.switchMoveGroupDeviceCount);
            });

            // Verify the device count with grid rows
            cy.get('.ag-center-cols-container .ag-row').then((res: any) => {
                expect(res.length).to.eq(params.switchMoveGroupDeviceCount);
            });

            (cy as any).xGet('moveGroupListFilter').click().type(params.switchMoveGroupDeviceName);
            cy.log('Filter with the Device Name ' + params.switchMoveGroupDeviceName);

            // Filter with device name device name is correct after filtering
            // @ts-ignore
            cy.get('.ag-row').within((_$item: any[]) => {
                cy.get('[col-id="field0"]').then((r: any) => {
                    expect(r[0].innerText).to.eq(params.switchMoveGroupDeviceName);
                });
            });

            // scroll grid to the right
            cy.get('.ag-center-cols-viewport').scrollTo('right', { ensureScrollable: false });

            // Verify the move group column has the correct move group name
            // @ts-ignore
            cy.get('.ag-row').within((_$projectCard: any[]) => {
                cy.get('[col-id="field6"]').then((r: any) => {
                    expect(r[0].innerText).to.eq(params.switchMoveGroupName);
                });
            });
        }
    },

    /**
     * Standard function to view the Application List
     *
     * @params =>   name: application group name
     *              deviceCount: total devices in the Move Group
     *              numberOfApp
     *              numberOfAppAnalyized
     *  `           verifyApplicationCalculation
     *              switchApp
     *              switchAppName
     *              switchAppDeviceCount
     *
     */
    applicationList(params: {
        name: string; deviceCount: number; numberOfApp: number; numberOfAppAnalyized: number;
        verifyApplicationCalculation: string; switchApp: string; switchAppName: string; switchAppDeviceCount: number;
    }) {

        cy.get('.vcio-ars-angle-right').eq(0).click();

        cy.get('.MuiCollapse-wrapperInner > :nth-child(1) > .MuiTreeItem-content > .MuiTypography-root').as('applicationList');
        cy.get('@applicationList').click();

        cy.url().should('include', '/application/application-list');

        (cy as any).xGet('inventoryHeaderTitle').then((res: any) => {
            expect(res[0].innerText).to.eq('Application List');
        });

        (cy as any).wait(3000).xGet('dependenciesApplication', { timeout: 5000 }).then((res: any) => {
            console.log(res[0].innerText);
            expect(res[0].innerText).to.eq(params.numberOfAppAnalyized + ' of ' + params.numberOfApp + ' Applications');
            cy.log((params.numberOfAppAnalyized + ' of ' + params.numberOfApp + ' Applications'));
        });

        // Filter with the Move Group Name
        (cy as any).xGet('moveGroupListFilter').click().type(params.name);

        // //Test scroll to the right
        cy.get('.ag-center-cols-viewport').scrollTo('right', { ensureScrollable: false });

        // Verify if the calculation is done
        if (params.verifyApplicationCalculation === 'yes') {
            cy.get('.ag-react-container > span.vcio-status-ok').should('exist');
        }

        // Verify the total device count for the application
        cy.get('.ag-row > [col-id="totalComputeInstances"]').then((r: any) => {
            expect((Number(r[0].innerText))).to.eq(params.deviceCount);
            cy.log((Number(r[0].innerText)) + ' device is part of ' + params.name);
        });

        // //Test scroll to the right
        cy.get('.ag-center-cols-viewport').scrollTo('right', { ensureScrollable: false });

        // //Test scroll to the left
        cy.get('.ag-center-cols-viewport').scrollTo('left', { ensureScrollable: false });

        // Click on Application name to view the Application details
        cy.wait(1000).get('.ag-row > [col-id="application"]').contains(params.name).click();

        // Verify the page is navigated to the Application name details page
        cy.get('[data-cy=inventoryHeaderTitle] > .MuiGrid-root').then((res: any) => {
            expect(res[0].innerText).to.eq(params.name);
            cy.log('Application details page is ' + params.name);
        });

        cy.get('.ag-center-cols-container', { timeout: 10000 }).then((res: any) => {
            console.log(res);
            expect(Number(res[0].childElementCount)).to.eq(params.deviceCount);
        });

        cy.get('.MuiTabs-scroller').within(() => {
            cy.get('.MuiTabs-flexContainer').then((res: any) => {
                expect(res[1].children[0].ariaSelected).to.eq('true');
                cy.log('Application dashboard is selected by default');
            });
        });

        cy.get('[data-cy=toolbarViewDataButton]').click();

        cy.wait(500).get('div.ag-center-cols-container').eq(1).then((res: any) => {
            // console.log(res);
            const traffic: string[] = [];
            for (let i = 0; i < (res[0].childElementCount - 1); i++) {
                traffic.push(res[0].childNodes[i].firstChild.innerText);
            }
            console.log(traffic.toString());

            for (let i = 0; i < traffic.length; i++) {
                // console.log(traffic[i]);
                if (traffic[i] === 'apps to other apps') {
                    cy.get('.MuiGrid-spacing-xs-3  > :nth-child(1)').within(() => {
                        cy.get('.MuiGrid-item').contains('Apps to Other Apps');
                        cy.get('.MuiGrid-grid-xs-12').find('img').should('have.attr', 'src');
                    });
                } else if (traffic[i] === 'app to self') {
                    cy.get('.MuiGrid-spacing-xs-3  > :nth-child(2)').within(() => {
                        cy.get('.MuiGrid-item').contains('App to Self');
                        cy.get('.MuiGrid-grid-xs-12').find('img').should('have.attr', 'src');
                    });
                } else if (traffic[i] === 'app to internal') {
                    cy.get('.MuiGrid-spacing-xs-3  > :nth-child(3)').within(() => {
                        cy.get('.MuiGrid-item').contains('App to Internal');
                        cy.get('.MuiGrid-grid-xs-12').find('img').should('have.attr', 'src');
                    });
                } else if (traffic[i] === 'app to vm') {
                    cy.get('.MuiGrid-spacing-xs-3  > :nth-child(4)').within(() => {
                        cy.get('.MuiGrid-item').contains('App to VMs');
                        cy.get('.MuiGrid-grid-xs-12').find('img').should('have.attr', 'src');
                    });
                } else if (traffic[i] === 'app to external') {
                    cy.get('.MuiGrid-spacing-xs-3  > :nth-child(5)').within(() => {
                        cy.get('.MuiGrid-item').contains('App to External');
                        cy.get('.MuiGrid-grid-xs-12').find('img').should('have.attr', 'src');
                    });
                }
            }
        });

        if (params.switchApp === 'yes') {
            cy.get('.vcio-migration-application').click();

            cy.get('.MuiPaper-root > .MuiList-root').children('.MuiListItem-button').contains(params.switchAppName).click();
            cy.log('Application changed to ' + params.switchAppName);

            cy.get('.ag-center-cols-container').then((res: any) => {
                expect(res.length).to.eq(params.switchAppDeviceCount);
                cy.log('Total device count for ' + params.switchAppName + ' is ' + params.switchAppDeviceCount);
            });
        }
    },

    /**
     * Standard function to Drag and Drop Application to Move Group
     *
     * NOTE: Devices should be present in the Application group which you plan move to Move Group
     *
     * @params =>   appName: name
     *              moveGroupName: name
     *              deviceName: name
     *              copy: yes or no
     *              move: yes or no
     *
     */
    DragNDropApp2MoveGroup(params: { appName: string; moveGroupName: string; copy: string; move: string }) {
        // if(params.move === 'yes') {
        //     (cy as any).xGet('listPanelDropMoveButton').click()
        // }
        //
        // if(params.copy === 'yes') {
        //     (cy as any).xGet('listPanelDropCopyButton').click()
        // }

        (cy as any).xGet('devicesSearchField').eq(1).click().type(params.appName);

        (cy as any).xGet('devicesSearchField').eq(2).click().type(params.moveGroupName);

        cy.wait(1000).get('[data-cy="inventory-movegroup"]').within(() => {
            cy.get('.ag-checkbox-input').first().click();
        });

        // cy.wait(1000).get('.ag-header-container > :nth-child(1)').within(() => {
        //     cy.get('.ag-checkbox-input').eq(2).click();
        // });

        cy.wait(1000).get('[data-cy="inventory-application"]').within(() => {
            cy.get('.ag-center-cols-container > :nth-child(1)').within(() => {
                cy.get('.ag-drag-handle > span.ag-icon').as('applicationGroup');
            });
        });

        // @ts-ignore
        // cy.get('.ag-center-cols-container > :nth-child(1)').eq(1).within(() => {
        //     cy.get('.ag-drag-handle > span.ag-icon').as('applicationGroup');
        // });

        cy.wait(1000).get('[data-cy="inventory-movegroup"]').within(() => {
            cy.get('div.ag-center-cols-container > :nth-child(1)').within(() => {
                cy.get('.ag-react-container').as('moveGroup');
            });
        });

        // @ts-ignore
        // cy.get('div.ag-center-cols-container > :nth-child(1)').eq(2).within(() => {
        //     cy.get('.ag-react-container').as('moveGroup');
        // });

        cy.get('@applicationGroup')
            .trigger('mousedown', { button: 0 });

        cy.wait(500);  // Smooth transition

        cy.get('@moveGroup')
            .trigger('mousemove', { force: true })
            // .trigger('mouseleave')
            .trigger('mouseup', { force: true });

        cy.wait(1000).get('[data-cy="inventory-movegroup"]').within(() => {
            cy.get('.ag-checkbox-input').first().click();
        });

        // cy.get('.ag-header-container > :nth-child(1)', { timeout: 5000 }).within(() => {
        //     cy.get('.ag-checkbox-input').eq(2).click();
        // });

        this.saveProject();

        (cy as any).xGet('devicesSearchField', { timeout: 2000 }).eq(1).click().type('{selectall}{backspace}');

        (cy as any).xGet('devicesSearchField', { timeout: 2000 }).eq(2).click().type('{selectall}{backspace}');

    },

    /**
     * Standard function to Drag and Drop Device to Application
     *
     * @params =>   appName: name
     *              deviceName: name
     *              copyToAoo: yes or no
     *              move: yes or no
     *
     */
    DragNDropDevice2App(params: { appName: string; deviceName: string; copyToApp: string; moveToApp: string }) {
        // if(params.move === 'yes') {
        //     (cy as any).xGet('listPanelDropMoveButton').click()
        // }
        //
        // if(params.copyToApp === 'yes') {
        //     (cy as any).xGet('listPanelDropCopyButton').click()
        // }

        (cy as any).xGet('devicesSearchField').eq(1).click().type(params.appName);

        (cy as any).xGet('devicesSearchField').eq(0).click().type(params.deviceName);

        cy.wait(1000).get('[data-cy="inventory-device"]').within(() => {
            cy.get('.ag-checkbox-input').first().click();
        });

        // cy.wait(1000).get('.ag-header-container > :nth-child(1)').within(() => {
        //     cy.get('.ag-checkbox-input').first().click();
        // });


        cy.get('[data-cy="inventory-device"]').within(() => {
            cy.get('.ag-center-cols-container > :nth-child(1)').within(() => {
                cy.get('.ag-drag-handle > span.ag-icon').as('device');
            });
        });
        // @ts-ignore
        // cy.get('.ag-center-cols-container > :nth-child(1)').first().within(() => {
        //     cy.get('.ag-drag-handle > span.ag-icon').as('device');
        // });

        cy.get('[data-cy="inventory-application"]').within(() => {
            cy.get('div.ag-center-cols-container > :nth-child(1)').within(() => {
                cy.get('.ag-react-container').as('applicationGroup');
            });
        });

        // @ts-ignore
        // cy.get('div.ag-center-cols-container > :nth-child(1)').eq(1).within(() => {
        //     cy.get('.ag-react-container').as('applicationGroup');
        // });

        cy.get('@device')
            .trigger('mousedown', { button: 0 });

        cy.wait(500);  // Smooth transition

        cy.get('@applicationGroup')
            .trigger('mousemove', { force: true })
            // .trigger('mouseleave')
            .trigger('mouseup', { force: true });

        cy.wait(2000);
        this.saveProject();

        cy.wait(1000).get('[data-cy="inventory-device"]').within(() => {
            cy.get('.ag-checkbox-input').first().click();
        });

        // cy.get('.ag-header-container > :nth-child(1)').within(() => {
        //     cy.get('.ag-checkbox-input').first().click();
        // });


        (cy as any).xGet('devicesSearchField', { timeout: 2000 }).eq(1).click().type('{selectall}{backspace}');

        (cy as any).xGet('devicesSearchField', { timeout: 2000 }).eq(0).click().type('{selectall}{backspace}');


    },

    DragNDropDeviceToCustomPropertyValue(params: { deviceName: string; cpValue: string; saveProject: boolean }) {

        (cy as any).xGet('devicesSearchField').eq(0).click().type(params.deviceName);
        (cy as any).xGet('devicesSearchField').eq(1).click().type(params.cpValue);

        cy.get('[data-cy="inventory-device"]').within(() => {
            cy.get('.ag-center-cols-container > :nth-child(1)').within(() => {
                cy.get('.ag-drag-handle > span.ag-icon').as('computeInstance');
            });
        });

        cy.get('[data-cy="inventory-application"]').within(() => {
            cy.get('div.ag-center-cols-container > :nth-child(1)').within(() => {
                cy.get('.ag-react-container').as('customPropertyValue');
            });
        });

        cy.get('@computeInstance')
            .trigger('mousedown', { button: 0 });
        cy.wait(500);  // Smooth transition
        cy.get('@customPropertyValue')
            .trigger('mousemove', { force: true })
            .trigger('mouseup', { force: true });

        cy.wait(2000);

        if (params.saveProject) {
            this.saveProject();
        }

        (cy as any).xGet('devicesSearchField', { timeout: 2000 }).eq(1).click().type('{selectall}{backspace}');
        (cy as any).xGet('devicesSearchField', { timeout: 2000 }).eq(0).click().type('{selectall}{backspace}');
    },

    /**
     * Standard function to Start calculation for Application or Move Group
     *
     * NOTE: Devices should be present in the Application or Move Group
     *
     * @params =>   appName: name
     *              moveGroupName: name
     *
     */
    startCalculation(params: { appName: string; moveGroupName: string; appStartAll: string; moveGroupStartAll: string }) {
        if (params.appName) {
            (cy as any).xGet('devicesSearchField', { timeout: 2000 }).eq(1).click().type('{selectall}{backspace}');

            (cy as any).xGet('devicesSearchField', { timeout: 2000 }).eq(1).click().type(params.appName);

            cy.wait(1000).get('[data-cy="inventory-application"]').within(() => {
                cy.wait(3000).get('.ag-checkbox-input', { timeout: 5000 }).first().click();
            });

            // cy.get('.ag-header-container > :nth-child(1)').within(() => {
            //     cy.wait(3000).get('.ag-checkbox-input', { timeout: 5000 }).eq(2).click();
            // });

            (cy as any).xGet('appCalculation').click();
        }

        if (params.moveGroupName) {
            (cy as any).xGet('devicesSearchField', { timeout: 2000 }).eq(2).click().type('{selectall}{backspace}');

            (cy as any).xGet('devicesSearchField', { timeout: 2000 }).eq(2).click().type(params.moveGroupName);

            cy.wait(1000).get('[data-cy="inventory-movegroup"]').within(() => {
                cy.wait(3000).get('.ag-checkbox-input').first().click();
            });

            // cy.wait(2000).get('.ag-header-container > :nth-child(1)').within(() => {
            //     cy.get('.ag-checkbox-input').eq(4).click();
            // });

            (cy as any).xGet('moveGroupCalculation').click();

            cy.get('span > .MuiCircularProgress-root > .MuiCircularProgress-svg').should('exist');
        }

        if (params.appStartAll === 'yes') {
            (cy as any).xGet('appCalculation').click();

            // cy.get('span > .MuiCircularProgress-root > .MuiCircularProgress-svg').should('exist;
        }

        if (params.moveGroupStartAll === 'yes') {
            (cy as any).xGet('moveGroupCalculation').click();

            // cy.get('span > .MuiCircularProgress-root > .MuiCircularProgress-svg').should('exist;
        }
    },

    /**
     * Standard function to filter for the ListView
     *
     *
     * @params =>   app: yes or no
     *              moveGroup: yes or no
     *              computeInstance: yes or no
     *
     */
    listView(params: { moveGroup: string; app: string; computeInstance: string }) {

        (cy as any).xGet('listPanelTableViewButton').click();

        // Map the column with the columne names
        cy.get('[data-cy=listPanelGridDiv').first().within(() => {
            cy.get('.ag-header-row').eq(2).within(() => {
                cy.get('[aria-colindex="2"]').as('computeInstance');
                cy.get('[aria-colindex="3"]').as('application');
                cy.get('[aria-colindex="4"]').as('moveGroup');
            });
        });
        cy.get('div.ag-column-drop-wrapper').first().as('colDropper');

        // Filter with move group
        if (params.moveGroup === 'yes') {
            cy.get('@moveGroup')
                .trigger('mousedown', { button: 0 });

            cy.wait(500);  // Smooth transition

            cy.get('@colDropper')
                .trigger('mousemove', { force: true })
                .trigger('mouseup', { force: true });
        }
        // Filter with Application group
        if (params.app === 'yes') {
            cy.get('@application')
                .trigger('mousedown', { button: 0 });

            cy.wait(500);  // Smooth transition

            cy.get('@colDropper')
                .trigger('mousemove', { force: true })
                .trigger('mouseup', { force: true });
        }

        // Filter with compute instance
        if (params.computeInstance === 'yes') {
            cy.get('@computeInstance')
                .trigger('mousedown', { button: 0 });

            cy.wait(500);  // Smooth transition

            cy.get('@colDropper')
                .trigger('mousemove', { force: true })
                .trigger('mouseup', { force: true });
        }
    },

    /**
     * Standard function for options on the Move Group Grid - calculate and Delete
     *
     *
     * @params =>   app: yes or no
     *              moveGroup: yes or no
     *              computeInstance: yes or no
     *
     */
    moveGroupGridOptions(params: {
        moveGroupName: string; calculateDependency: string; delete: string;
        save: string; undo: string;
    }) {
        (cy as any).xGet('devicesSearchField').last().click().type(params.moveGroupName);


        cy.wait(1000).get('[data-cy="inventory-movegroup"]').within(() => {
            cy.get('.ag-center-cols-container > :nth-child(1)').first().rightclick('center');
        });

        // Rightclick on the selected move group for options to calculate or delete
        // cy.get('.ag-center-cols-container > :nth-child(1)').last().rightclick('center');

        if (params.delete === 'yes') {
            (cy as any).xGet('inventoryMoveGroupsDeleteSelected').click();

            if (params.undo === 'yes') {
                (cy as any).xGet('undoChanges').should('exist');

                (cy as any).xGet('undoChanges').click();
            }

            if (params.save === 'yes') {
                this.saveProject();
            }


            (cy as any).wait(1000).xGet('devicesSearchField').last().type('{selectall}{backspace}');

        }


        if (params.calculateDependency === 'yes') {
            (cy as any).xGet('inventoryMoveGroupsCalculateDependencies').click();
        }
    },

    /**
     * Standard function to Undo Changes
     *
     *
     * @params =>   undo: yes
     *
     */
    undo(params: { undo: string }) {
        if (params.undo) {
            (cy as any).xGet('undoChanges').should('exist');

            (cy as any).xGet('undoChanges').click();
        }
    },

    /**
     * Standard function for options on the Application Grid - Add to MG, Remove from MG, calculate and Delete
     *
     *
     * @params =>   appName
     *              moveGroupName
     *              addToMoveGroup: yes or no
     *              removeFromMoveGroup: yes or no
     *              calculateDependency: yes or no
     *              delete: yes or no
     *              save: yes or no
     *              undo: yes or no
     *
     */
    applicationGridOptions(params: {
        appName: string; addToMoveGroup: string; moveGroupName: string; removeFromMoveGroup: string; calculateDependency: string; delete: string;
        save: string; undo: string;
    }) {

        (cy as any).xGet('devicesSearchField').eq(1).click().type(params.appName);

        // cy.wait(1000).get('.ag-header-container > :nth-child(1)').within(() => {
        //     cy.get('.ag-checkbox-input').eq(2).click();
        // });

        cy.wait(1000).get('[data-cy="inventory-application"]').within(() => {
            cy.get('.ag-checkbox-input').first().click();
        });

        cy.wait(1000).get('[data-cy="inventory-application"]').within(() => {
            cy.get('.ag-center-cols-container > :nth-child(1)').rightclick('center');
        });

        // cy.get('.ag-center-cols-container > :nth-child(1)').rightclick('center');

        if (params.delete === 'yes') {

            (cy as any).xGet('inventoryApplicationsDeleteSelected').click();

            this.saveProject();

            (cy as any).xGet('devicesSearchField').eq(1).type('{selectall}{backspace}');
        }

        if (params.addToMoveGroup === 'yes') {
            (cy as any).xGet('inventoryApplicationsAddToMoveGroup').click();

            (cy as any).xGet('selectAppMoveGroupFilter').click().type(params.moveGroupName);

            cy.get('.ag-full-width-container').within(() => {
                cy.get('.ag-row-first').click();
            });

            this.saveProject();

            cy.get('.ag-header-container > :nth-child(1)').within(() => {
                cy.get('.ag-checkbox-input').eq(2).click();
            });

            (cy as any).xGet('devicesSearchField').eq(1).type('{selectall}{backspace}');

        }
        if (params.removeFromMoveGroup === 'yes') {

            (cy as any).xGet('inventoryApplicationsRemoveFromMoveGroup').click();

            (cy as any).xGet('selectAppMoveGroupFilter').click().type(params.moveGroupName);

            cy.get('.ag-full-width-container').within(() => {
                cy.get('.ag-row-first').click();
            });

            this.saveProject();

            cy.get('.ag-header-container > :nth-child(1)').within(() => {
                cy.get('.ag-checkbox-input').eq(2).click();
            });

            (cy as any).xGet('devicesSearchField').eq(1).type('{selectall}{backspace}');
        }

        if (params.calculateDependency === 'yes') {

            (cy as any).xGet('inventoryApplicationsCalculateDependencies').click();

            (cy as any).xGet('devicesSearchField').eq(1).type('{selectall}{backspace}');
        }
    },
    /**
     * Standard function for options on the Application Grid - Add to MG, Remove from MG, calculate and Delete
     *
     *
     * @params =>   customProp
     *              computeInstance
     *              customPropValue
     *              computeInstance
     *
     *
     */
    setCustomProperty(params: { customProp: any; computeInstance: any; customPropValue: any }) {
        (cy as any).xGet('devicesSearchField').first().click().type(params.computeInstance);

        let numberOfRow = 0;

        cy.wait(1000).get('[data-cy="inventory-device"]').within(() => {
            cy.get('.ag-checkbox-input').first().click();
        });

        cy.wait(500).get('.ag-status-name-value-value').then((res: any) => {
            // console.log(res[0].innerText);
            numberOfRow = Number(res[0].innerText);
        });

        cy.get('[data-cy="inventory-device"]').within(() => {
            cy.get('.ag-center-cols-container > :nth-child(1)').first().rightclick('center');
        });

        // Click set the custom properties option
        (cy as any).xGet('inventoryDevicesSetCustomProperties').click();

        // Verify the Title has 2 compute instances
        (cy as any).xGet('SCPDialogTitle', { timeout: 4000 }).then((res: any) => {
            if (numberOfRow === 1) {
                expect(res[0].innerText).to.eq('Set Custom Properties for ' + numberOfRow + ' Compute Instance');
            } else {
                expect(res[0].innerText).to.eq('Set Custom Properties for ' + numberOfRow + ' Compute Instances');
            }

        });

        cy.get('[data-cy="cancelSCPBtn"]').click();

        cy.get('[data-cy="inventory-device"]').within(() => {
            cy.get('.ag-center-cols-container > :nth-child(1)').first().rightclick('center');
        });
        (cy as any).xGet('inventoryDevicesSetCustomProperties').click();

        // Get the position of the drop down box for the custom property
        let count: number;
        cy.get('[data-cy="customPropertyTitle"]').then((res: any) => {
            console.log(res);
            for (let i = 0; i < res.length; i++) {
                if ((res[i].innerText) === params.customProp) {
                    count = i + 1;
                }
            }
            // Click on the 'Coast' drop down
            cy.wait(2000).get(`:nth-child(${count}) > .MuiAutocomplete-root > .MuiFormControl-root > .MuiInputBase-root`).click().type(`${params.customPropValue}{enter}`);
        });

        // Apply
        (cy as any).xGet('applySCPBtn').click();

        this.saveProject();

        cy.get('[data-cy="inventory-device"]').within(() => {
            cy.get('.ag-checkbox-input').first().click();
        });

        // Clear the search field
        (cy as any).xGet('devicesSearchField').first().click().type('{selectall}{backspace}');
    },

    /**
     * Standard function for Assume User
     *
     *
     * @params =>   assumeUserName
     *              assumeUserEmail
     *              loginUserName
     *              loginEmail
     *              submit
     *              revertUser
     *              logOutUser
     *
     *
     */
    assumeUser(params: {
        assumeUserName: string; assumeUserEmail: string; loginUserName: string; loginEmail: string; submit: string;
        revertUser: string; logOutUser: string;
    }) {

        (cy as any).xGet('dropDownMenu').click();

        (cy as any).xGet('assumeUser').click();

        // Verify the url is correct
        cy.url().should('eq', `${Cypress.env('vcio-ui') + '/admin/assume-user'}`);

        // Verify assume user banner has correct username and email address
        (cy as any).xGet('assumeUserDetails').then((r: any) => {
            // @ts-ignore
            expect(r.text()).to.eq('You\'re signed in as' + params.loginUserName + '(' + params.loginEmail + ')Log Out');
        });

        // Verify the assume user button is disabled
        cy.get('[data-cy = assumeUserSubmitButton]').should('be.disabled');

        (cy as any).xGet('userSelectionTextField').type(`${params.assumeUserName} - ${params.assumeUserEmail}{downarrow}{enter}`, {delay: 70});

        (cy as any).wait(1000).xGet('assumeUserCheckbox').click();

        (cy as any).xGet('assumeUserSubmitButton').should('be.enabled');

        if (params.submit === 'yes') {

            // (cy as any).xGet('assumeUserCheckbox').click();

            (cy as any).xGet('assumeUserSubmitButton').click();

            (cy as any).xGet('assumeUserBanner').should('exist');

            (cy as any).xGet('assumeUserName').then((r: any) => {
                expect(r.text()).to.eq(`You are using the system as ${params.assumeUserName} (${params.assumeUserEmail})Revert User|Log Out`);
            });

            cy.url().should('eq', `${Cypress.env('vcio-ui') + '/migration/dashboard'}`);

            if (params.revertUser) {
                (cy as any).xGet('revertUser').click();

                (cy as any).xGet('assumeUserBanner').should('not.exist');

                (cy as any).xGet('dropDownMenu').click();

                cy.get('.MuiMenu-list').then((res: any) => {
                    console.log(res[2].innerText);
                    expect(res[2].innerText).to.eq(`Logged in as\n${params.loginUserName}\n${params.loginEmail}\nAssume User\nLog Out`);
                    cy.log(`Logged in as\n${params.loginUserName}\n${params.loginEmail}\nAssume User\nLog Out`);
                });
            }

            if (params.logOutUser === 'yes') {

                (cy as any).xGet('assumeUserLogOut').click();

                cy.url().should('eq', `${Cypress.env('vcio-ui') + '/signin'}`);
            }
        }
    },

    /**
     * Logout of project
     */
    logout() {
        (cy as any).xGet('dropDownMenu').click();

        cy.get('.MuiList-root').contains('Log Out').click();

        cy.url().should('eq', `${Cypress.env('vcio-ui') + '/signin'}`);
    },

    /**
     * Save project and wait for mask to be cleared
     */
    saveProject() {
        cy.then(() => {
            (cy as any).xGet('saveProject', { timeout: 4000 }).click({ force: true });
            waitForNoMask(1000, 120000);
            cy.wait(500);
        });
    }
};
