// eslint-disable-next-line import/no-extraneous-dependencies
import 'cypress-file-upload';
import data from '../../../cypress/fixtures/data/IntegrationTest/projectDashboard.json';

const utilsLogin = require('../login/utils');
const login = require('../../../cypress/fixtures/data/IntegrationTest/login.json');

/**
 * Utils for Project Dashboard
 *
 * @author Matt Schreiner
 * */

module.exports = {

    /**
     * Standard function to sort the Project Dashboard
     *
     * @params =>   sortOrder: ex. 'Descending'
     *              sortProjectBy: your selector, ex. 'projectCardName'
     *
     */
    sortProjectDashboard(params: { sortProjectBy: any; sortOrder: string }) {
        let projectCard: any[];
        let projectCardSort: any[];

        (cy as any).xGet('projectCardContentSummarySizeDate', { timeout: 60000 }).should('not.contain', 'modified in a few seconds');

        (cy as any).xGet(params.sortProjectBy).then(($els: Iterable<unknown> | ArrayLike<unknown>) => {

            // Find all project names, versions, or time stamps and put them in 2 arrays
            projectCard = Array.from($els, (el: any) => el.innerText);
            projectCardSort = Array.from($els, (el: any) => el.innerText);

            if (params.sortProjectBy === 'projectCardContentSummarySizeDate') {

                this.lastModifiedSortUtil({
                    projectCardSort,
                    sortOrder: params.sortOrder
                });
            }

            if (params.sortProjectBy === 'projectCardVersion' || params.sortProjectBy === 'projectCardName') {

                // Sort projectCardNameSort to ascending order
                projectCardSort.sort((a, b) => {
                    return a.toLowerCase().localeCompare(b.toLowerCase());
                });

                // Reverse the Sort to Descending if sortOrder = Descending
                if (params.sortOrder === 'Descending') {
                    projectCardSort.reverse();
                }

                // Compare the 2 Arrays
                expect(projectCard).to.be.deep.equal(projectCardSort);
            }


        });
    },

    /**
     * Standard function to sort by Modification Timestamp
     *
     * @params =>   sortProjectBy: your selector, ex. 'projectCardName'
     *              sortByText: Project Name, Version Name, or Modification Timestamp
     *
     *
     */
    lastModifiedSortUtil(params: { projectCardSort: any[]; sortOrder: string }) {

        const myNewArray: any[] = [];
        const mySortArray: any[] = [];

        params.projectCardSort.forEach((sizeModified) => {
            const splitSizeDate = sizeModified.split(',');
            const lastModified = splitSizeDate[1];
            const reducedLastModified = lastModified.replace(' modified ', '');
            const reducedLastModified2 = reducedLastModified.replace('few ', '');

            const splitReducedLastModified = reducedLastModified2.split(' ');
            let num = splitReducedLastModified[0];
            num = num.replace('a', '1');
            num *= 1;
            const duration = splitReducedLastModified[1];
            const formattedDate = Cypress.moment().subtract(duration, num).milliseconds(0).unix();

            myNewArray.push(formattedDate);
            mySortArray.push(formattedDate);

        });

        if (params.sortOrder === 'Ascending') {
            // @ts-ignore
            mySortArray.sort((a, b) => {
                if (a < b) return 1;
                if (a > b) return -1;
                return 0;
            });
        }

        if (params.sortOrder === 'Descending') {
            // @ts-ignore
            mySortArray.sort((a, b) => {
                if (a > b) return 1;
                if (a < b) return -1;
                return 0;
            });
        }

        expect(myNewArray).to.deep.eq(mySortArray);

    },


    /**
     * Standard function to sort the Project Dashboard
     *
     * @params =>   sortProjectBy: your selector, ex. 'projectCardName'
     *              sortByText: Project Name, Version Name, or Modification Timestamp
     *
     *
     */
    testSortProjectDashboard(params: { sortByText: string; sortProjectBy: any }) {

        (cy as any).xGet('projectDashboardSortBy').wait(1000).type('{selectall}{backspace}' + params.sortByText + '{enter}').wait(1000);

        // Test default sort order
        this.sortProjectDashboard({
            sortOrder: 'Ascending',
            sortProjectBy: params.sortProjectBy
        });

        // Test descending sort order
        (cy as any).xGet('projectDashboardSortDescendingButton').click();

        this.sortProjectDashboard({
            sortOrder: 'Descending',
            sortProjectBy: params.sortProjectBy
        });

        // Test that ascending sort order work when coming from descending sort order
        (cy as any).xGet('projectDashboardSortAscendingButton').click();

        this.sortProjectDashboard({
            sortOrder: 'Ascending',
            sortProjectBy: params.sortProjectBy
        });
    },

    /**
     * Standard function to create a Project
     *
     * @params =>   projectName
     *              versionName
     *              projectData
     *
     */
    createNewProject(params: { projectName: string; versionName: string; projectData: any; blankDashboard?: any }) {

        if (params.blankDashboard) {
            (cy as any).xGet('newProjectButton').contains('Create a New Project').click();
        } else {
            (cy as any).xGet('newProjectButton', { timeout: 12000 }).first().click();
        }
        (cy as any).xGet('projectNameInput').type(params.projectName);
        (cy as any).xGet('projectVersionInput').type(params.versionName);
        cy.fixture(params.projectData, { timeout: 300000 })
            .get('.dzu-input', { timeout: 180000 }).attachFile(params.projectData);
        (cy as any).xGet('projectUploadSubmitButton').click();
    },

    /**
     * Standard function to select a Project Card dropdown option
     *
     * @params =>   projectName: ex. 'Test Project Name'
     *              versionName: ex. 'Test Version Name'
     *              dropdownOption: ex. 'View Results'
     */
    clickProjectDropDownOption(params: { projectName: string; versionName: string; dropdownOption: string; renamedProjectName?: any; renamedVersionName?: any }) {

        const projectCardName = params.projectName;
        const projectCardVersion = params.versionName;

        (cy as any).xGet('projectDashboardSearchField').wait(200).type(' ').wait(1000);
        (cy as any).xGet('projectDashboardSearchFieldClear').click().wait(1000);
        (cy as any).xGet('projectDashboardSearchField').wait(200).type(projectCardName).wait(1000);
        (cy as any).xGet('projectCard').should('have.length', 1);

        (cy as any).xGet('projectCard', {
            timeout: 60000,
            dataAttrs: {
                'project-name': projectCardName,
                'project-version': projectCardVersion,
            }
        }).within(($projectCard: any[]) => {

            (cy as any).xGet('projectCardName', { force: true }).contains(projectCardName).should(($text: { innerText: any }[]) => {
                expect($text[0].innerText).to.eq(projectCardName);
            });

            (cy as any).xGet('projectCardVersion', { force: true }).contains(projectCardVersion).should(($text: { innerText: any }[]) => {
                expect($text[0].innerText).to.eq(projectCardVersion);
            });

            // you can click the project card to access its menu
            (cy as any).xGet('projectCardMenuButton', { force: true }).click();

            // projectCardMenuButton
            console.log('projectCard id ->', Cypress.$($projectCard[0]).attr('data-project-id'));
        });

        // we can now access the popup menu since it was clicked in the previous step
        (cy as any).xGet('projectCardMenu', {
            dataAttrs: {
                'project-name': projectCardName,
                'project-version': projectCardVersion,
            }
            // @ts-ignore
        }).within(() => {

            if (params.dropdownOption === 'View Inventory') {
                (cy as any).xGet('projectCardMenuItemViewInventory').click();
            }

            if (params.dropdownOption === 'Rename') {
                (cy as any).xGet('projectCardMenuItemRename').click();
            }

            if (params.dropdownOption === 'View Results') {
                (cy as any).xGet('projectCardMenuItemViewResults').click();
            }

            if (params.dropdownOption === 'Download Results') {
                (cy as any).xGet('projectCardMenuItemDownloadResults').click();
            }

            if (params.dropdownOption === 'Delete') {
                (cy as any).xGet('projectCardMenuItemDelete').click();
            }
        });

        if (params.dropdownOption === 'View Inventory') {
            (cy as any).xGet('inventoryHeaderTitle', {
                timeout: 20000
            }).contains('Inventory');
            (cy as any).xGet('navMenuTitle', {
                timeout: 10000
            }).contains(params.projectName);
            (cy as any).xGet('navMenuSubTitle', {
                timeout: 10000
            }).contains(params.versionName);
        }

        if (params.dropdownOption === 'Rename') {

            cy.wait(3000); // text is not loaded fast enough, need to wait, otherwise cypress mistypes, to be improved

            if (params.renamedProjectName) {
                (cy as any).xGet('renameProjectNameInput').type('{selectall}{backspace}').wait(2000).type(params.renamedProjectName).wait(2000);
            }

            if (params.renamedVersionName) {
                (cy as any).xGet('renameProjectVersionInput').type('{selectall}{backspace}').wait(2000).type(params.renamedVersionName).wait(2000);
            }

            (cy as any).xGet('renameProjectSubmitButton').click();
        }

        if (params.dropdownOption === 'View Results') {
            (cy as any).xGet('inventoryHeaderTitle', {
                timeout: 10000
            }).contains('Environment Overview');
            (cy as any).xGet('navMenuTitle', {
                timeout: 10000
            }).contains(params.projectName);
            (cy as any).xGet('navMenuSubTitle', {
                timeout: 10000
            }).contains(params.versionName);
        }

        if (params.dropdownOption === 'Download Results') {
            // Will add when I automate this test
        }

        if (params.dropdownOption === 'Delete') {

            // @ts-ignore
            if (params.cancelDelete === true) {

                (cy as any).xGet('deleteProjectCancelButton').click();

                // Verifies Card was not deleted
                (cy as any).xGet('projectCard', {
                    timeout: 60000,
                    dataAttrs: {
                        'project-name': projectCardName,
                        'project-version': projectCardVersion,
                    }
                });
            } else {
                this.deletePopup({
                    projectName: params.projectName,
                    versionName: params.versionName
                });
            }

        }
    },

    /**
     * Standard function to verify, then delete a project that errored
     *
     * @params =>   projectName: ex. 'Test Project Name'
     *              versionName: ex. 'Test Version Name'
     */
    deleteProject(params: { projectName: string, versionName: string }) {
        //Go back to Dashboard, in case suite stalls somewhere, project should still be deleted
        cy.url().then((result: any) => {
            // console.log(result)
            if (result != `${Cypress.env('vcio-ui') + '/migration/dashboard'}`) {
                (cy as any).xGet('navMenuTopLink', { timeout: 10000 }).then(($result: any) => {
                    if ($result.is(':enabled')) {
                        (cy as any).xGet('navMenuTopLink', { timeout: 10000 }).click();
                    }
                });
            }
        });

        cy.wait(2000).url().then((result: any) => {
            if (result != `${Cypress.env('vcio-ui') + '/migration/dashboard'}`) {
                cy.visit(`${Cypress.env('vcio-ui')}`);
                cy.url().then(() => {
                    if (result === `${Cypress.env('vcio-ui')}`) {
                        utilsLogin.loginVCIO({
                            email: login.email,
                            password: login.password
                        });
                    }
                });
            }
        });

        cy.url().then((result: any) => {
            if (result != `${Cypress.env('vcio-ui') + '/migration/dashboard'}`) {
                (cy as any).xGet('migrateTab').click();
            }
        });

        utilsLogin.changeOrganization({
            organizationName: 'Virtana'
        });

        this.clickProjectDropDownOption({
            projectName: params.projectName,
            versionName: params.versionName,
            dropdownOption: 'Delete'
        });
    },

    /**
     * Standard function for the delete window, verify & delete
     *
     * @params =>   projectName: ex. 'Test Project Name'
     *              versionName: ex. 'Test Version Name'
     */
    deletePopup(params: { projectName: string; versionName: string }) {

        (cy as any).xGet('deleteProjectText').contains('Please confirm you want to delete project ' + params.projectName + ', ' + params.versionName);
        (cy as any).xGet('deleteProjectWarningText').contains('This action cannot be undone. If you decide to recreate this project later, you will need to start from scratch.');
        (cy as any).xGet('deleteProjectConfirmCheckbox').click();
        (cy as any).xGet('deleteProjectConfirmText').contains('Yes, delete project ' + params.projectName + ', ' + params.versionName + ' and all its data');
        (cy as any).xGet('deleteProjectSubmitButton').click();

        // Verify card no longer shows
        (cy as any).xGet('projectCard', {
            timeout: 60000,
            dataAttrs: {
                'project-name': params.projectName,
                'project-version': params.versionName,
            }
        }).should('not.exist');
    },

    /**
     * Standard function to verify a Project Card's info
     *
     * @params =>   projectName
     *              versionName
     *              statusOverview: 'vcio-status-alarm', 'vcio-status-ok', 'vcio-status-not-ready'
     *              statusApp: 'vcio-status-alarm', 'vcio-status-ok', 'vcio-status-not-ready'
     *              statusMg: 'vcio-status-alarm', 'vcio-status-ok', 'vcio-status-not-ready'
     *              overviewLinkText: 'Environment Overview (Completed)', etc
     *              appLinkText: 'Applications (not calculated yet)', etc
     *              mgLinkText: 'Move Groups (not calculated yet)', etc
     */
    verifyProjectCard({ params }: { params: any }) {

        const projectCardName = params.projectName;
        const projectCardVersion = params.versionName;

        (cy as any).xGet('projectCard', {
            timeout: 60000,
            dataAttrs: {
                'project-name': projectCardName,
                'project-version': projectCardVersion,
            }
            // @ts-ignore
        }).within((_projectCard: any[]) => {

            (cy as any).xGet('projectCardName', { force: true }).contains(projectCardName).should(($text: { innerText: any }[]) => {
                expect($text[0].innerText).to.eq(projectCardName);
            });

            (cy as any).xGet('projectCardVersion', { force: true }).contains(projectCardVersion).should(($text: { innerText: any }[]) => {
                expect($text[0].innerText).to.eq(projectCardVersion);
            });

            // Here we make sure nothing is still calculating, may need to raise timeout for larger data sets
            (cy as any).xGet('projectCardLinkTextOverview', { timeout: 90000 }).should('exist').and('not.contain', 'calculating');
            (cy as any).xGet('projectCardLinkTextApp', { timeout: 60000 }).should('exist').and('not.contain', 'calculating');
            (cy as any).xGet('projectCardLinkTextMg', { timeout: 60000 }).should('exist').and('not.contain', 'calculating');
            (cy as any).xGet('projectCardLinkTextGroup', { timeout: 60000 }).should('exist').and('not.contain', 'calculating');

            // Extra bit of wait for card values to appear in UI
            cy.wait(6000);

            // Verify project card link text
            if (params.overviewLinkText) {
                (cy as any).xGet('projectCardLinkTextOverview', { timeout: 60000 }).contains(params.overviewLinkText);
            }

            if (params.appLinkText) {
                // TEMPORARILY DISABLING THIS, WILL NEED TO REVISIT.  IT IS BREAKING TESTS AT THE MOMENT.
                // (cy as any).xGet('projectCardLinkTextApp', { timeout: 60000 }).contains(params.appLinkText);
                // (cy as any).xGet('projectCardLinkTextApp', {timeout: 60000}).then((res: any) => {
                //     console.log(res)
                //     expect(res[0].innerText).to.eq(params.appLinkText)
                // })
            }

            if (params.mgLinkText) {
                (cy as any).xGet('projectCardLinkTextMg', { timeout: 60000 }).contains(params.mgLinkText);
            }

            if (params.cgLinkText) {
                (cy as any).xGet('projectCardLinkTextGroup', { timeout: 60000 }).then((res: any) => {
                    console.log(res);
                    console.log(res[0].innerText);

                    expect(res[0].innerText).to.eq(params.cgLinkText);
                });
            }

            // Verify project card status icons
            if (params.statusOverview) {
                (cy as any).xGet('projectCardGridItemStatusOverview', { descendants: ['.' + params.statusOverview] }).should('have.class', params.statusOverview);
            }

            if (params.statusApp) {
                (cy as any).xGet('projectCardGridItemStatusApp', { descendants: ['.' + params.statusApp] }).should('have.class', params.statusApp);
            }

            if (params.statusMg) {
                (cy as any).xGet('projectCardGridItemStatusMg', { descendants: ['.' + params.statusMg] }).should('have.class', params.statusMg);
            }

            if (params.statusCp) {
                (cy as any).xGet('projectCardGridItemStatusGroup', { descendants: ['.' + params.statusCp] }).should('have.class', params.statusCp);
            }

            if (params.moveGroupsCount || params.applicationsCount || params.computeInstancesCount) {

                // Verify # of Compute Instances, Applications, Move Groups, & File Size
                // First, extract the numbers from the combined string
                (cy as any).xGet('projectCardContentSummaryCounts').then(($el: { text: () => any }) => {
                    const counts = $el.text();
                    cy.log(counts);
                    const splitCounts = counts.split('|');
                    let computeInstancesCount = splitCounts[0];
                    computeInstancesCount = computeInstancesCount.replace(/\u00a0/g, '');
                    computeInstancesCount = computeInstancesCount.replace('Compute Instances', '');
                    computeInstancesCount *= 1;
                    cy.log(computeInstancesCount);

                    let applicationsCount = splitCounts[1];
                    applicationsCount = applicationsCount.replace('Applications', '');
                    applicationsCount = applicationsCount.replace(/\u00a0/g, '');
                    applicationsCount *= 1;
                    cy.log(applicationsCount);

                    let moveGroupsCount = splitCounts[2];
                    moveGroupsCount = moveGroupsCount.replace('Move Groups', '');
                    moveGroupsCount = moveGroupsCount.replace(/\u00a0/g, '');
                    moveGroupsCount *= 1;
                    cy.log(moveGroupsCount);

                    if (params.computeInstancesCount) {
                        expect(params.computeInstancesCount).to.eq(computeInstancesCount);
                    }

                    if (params.applicationsCount) {
                        expect(params.applicationsCount).to.eq(applicationsCount);
                    }

                    if (params.moveGroupsCount) {
                        expect(params.moveGroupsCount).to.eq(moveGroupsCount);
                    }
                });
            }

            if (params.projectSize || params.lastModified) {

                (cy as any).xGet('projectCardContentSummarySizeDate', { timeout: 60000 }).should('not.contain', '0 B, modified a few seconds ago');
                (cy as any).xGet('projectCardContentSummarySizeDate', { timeout: 60000 }).should('not.contain', 'modified in a few seconds');
                (cy as any).xGet('projectCardContentSummarySizeDate').then(($el: { text: () => any }) => {
                    const sizeModified = $el.text();
                    const splitSizeDate = sizeModified.split(',');
                    const projectSizeWhole = splitSizeDate[0];
                    const projectSizeSplit = projectSizeWhole.split(' ');
                    const projectSizeNumber = projectSizeSplit[0] * 1;
                    const projectSizeUnit = projectSizeSplit[1];
                    let lastModified = splitSizeDate[1];
                    lastModified = lastModified.replace(' modified', 'modified');

                    // @ts-ignore
                    if (params.projectSizeUnit) {
                        // @ts-ignore
                        expect(params.projectSizeUnit).to.eq(projectSizeUnit);
                    }

                    if (params.projectSizeNumber) {
                        const projectSizeNumberUpper = params.projectSizeNumber * 1.08;
                        const projectSizeNumberLower = params.projectSizeNumber * .92;
                        expect(projectSizeNumber).to.be.within(projectSizeNumberLower, projectSizeNumberUpper);
                    }

                    if (params.lastModified) {
                        // @ts-ignore
                        expect(params.lastModified).to.eq(lastModified);
                    }
                });
            }
        });
    },

    /**
     * Standard function to verify a Project Card's info
     *
     * @params =>   projectName
     *              versionName
     *              whichLink: the project card link you want to click
     */
    clickProjectCardLink(params: { projectName: any; versionName: any; whichLink: string }) {

        const projectCardName = params.projectName;
        const projectCardVersion = params.versionName;

        (cy as any).xGet('projectDashboardSearchField').wait(200).type(' ').wait(1000);
        (cy as any).xGet('projectDashboardSearchFieldClear').click().wait(1000);
        (cy as any).xGet('projectDashboardSearchField').wait(200).type(projectCardName).wait(1000);
        (cy as any).xGet('projectCard').should('have.length', 1);

        (cy as any).xGet('projectCard', {
            timeout: 60000,
            dataAttrs: {
                'project-name': projectCardName,
                'project-version': projectCardVersion,
            }
            // @ts-ignore
        }).within(($projectCard: any[]) => {

            if (params.whichLink === 'Environment Overview') {
                (cy as any).xGet('projectCardLinkTextOverview').click();
            }

            if (params.whichLink === 'Applications') {
                (cy as any).xGet('projectCardLinkTextApp').click();
            }

            if (params.whichLink === 'Move Groups') {
                (cy as any).xGet('projectCardLinkTextMg').click();
            }

            if (params.whichLink === 'Blank Space') {
                (cy as any).xGet('projectCardVersion').click();
            }

            if (params.whichLink === 'Compute Instances Count') {
                (cy as any).xGet('projectCardFooterLinkCompute Instances').click();
            }

            if (params.whichLink === 'Applications Count') {
                (cy as any).xGet('projectCardFooterLinkApplications').click();
            }

            if (params.whichLink === 'Move Groups Count') {
                (cy as any).xGet('projectCardFooterLinkMove Groups').click();
            }
        });

        if (params.whichLink === 'Environment Overview') {
            (cy as any).xGet('inventoryHeaderTitle', {
                timeout: 10000
            }).contains('Environment Overview');
        }

        if (params.whichLink === 'Applications') {
            (cy as any).xGet('inventoryHeaderTitle', {
                timeout: 10000
            }).contains('Analyzed Applications');
        }

        if (params.whichLink === 'Move Groups') {
            (cy as any).xGet('inventoryHeaderTitle', {
                timeout: 10000
            }).contains('Analyzed Move Groups');
        }

        if (params.whichLink === 'Blank Space') {
            (cy as any).xGet('inventoryHeaderTitle', {
                timeout: 10000
            }).contains('Inventory');
        }

        if (params.whichLink === 'Compute Instances Count') {
            (cy as any).xGet('inventoryHeaderTitle', {
                timeout: 10000
            }).contains('Inventory');
        }

        if (params.whichLink === 'Applications Count') {
            (cy as any).xGet('inventoryHeaderTitle', {
                timeout: 10000
            }).contains('Application List');
        }

        if (params.whichLink === 'Move Groups Count') {
            (cy as any).xGet('inventoryHeaderTitle', {
                timeout: 10000
            }).contains('Move Group List');
        }

        (cy as any).xGet('navMenuTitle', {
            timeout: 10000
        }).contains(params.projectName);
        (cy as any).xGet('navMenuSubTitle', {
            timeout: 10000
        }).contains(params.versionName);
    },

    /**
     * Ensure no toast messages
     */
    disableToast() {
        cy.window().then((window) => {
            // @ts-ignore
            window.setFunctionalitySwitches({
                showToasts: false
            });
        });
    },

    createProjectForTest(params: { projectName: string; versionName: string }) {
        this.createNewProject(
            {
                projectName: params.projectName,
                versionName: params.versionName,
                projectData: data.project.projectData.file
            });

        // Wait for all loading bars to finish
        (cy as any).xGet('projectCardFileInformation', { timeout: 60000 }).should('not.exist');

        // Card had not been modified yet, wait until it's modified
        (cy as any).xGet('projectCardContentSummarySizeDate', { timeout: 60000 }).should('not.contain', 'modified in a few seconds');

        this.verifyProjectCard({
            params: {
                projectName: params.projectName,
                versionName: params.versionName,
                statusOverview: data.statusOverview,
                statusApp: data.statusApp,
                statusMg: data.statusMg,
                overviewLinkText: data.overviewLinkText,
                appLinkText: data.appLinkText,
                mgLinkText: data.mgLinkText,
                computeInstancesCount: data.project.projectData.computeInstancesCount,
                applicationsCount: data.project.projectData.applicationsCount,
                moveGroupsCount: data.project.projectData.moveGroupsCount,
            }
        });
    },

};
