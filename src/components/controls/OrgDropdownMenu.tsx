import { VcioIcon } from '@components';
import { AppContext } from '@context';
import { Button, Divider, ListItemIcon, ListItemText, makeStyles, Menu, MenuItem, withStyles } from '@material-ui/core';
import { Api, Auth } from '@services';
import { colors } from '@styles';
import produce from 'immer';
import _ from 'lodash';
import { useRouter } from 'next/router';
import React, { useContext, useState } from 'react';
import { useCookies } from 'react-cookie';
import { mutate } from 'swr';
import { Person } from '../../models';
import { log } from '../../utils';
import { AddEditOrganizationDialog } from '../dialogs/AddEditOrganizationDialog';

const useStyles = makeStyles({
    button: {
        minWidth: 120,
        fontFamily: 'Muli',
        fontSize: 16,
        fontWeight: 'bold',
        fontStretch: 'normal',
        fontStyle: 'normal',
        lineHeight: 1.38,
        letterSpacing: 'normal',
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: 'transparent',
        color: colors.white_90,
        '&:hover': {
            backgroundColor: 'transparent'
        }
    },
    listIcon: {
        margin: '0 5px 0 0',
        padding: 2,
        width: 20,
        minWidth: 20
    },
    menuContainer: {
        boxShadow: '0 2px 15px 0 rgba(15, 45, 104, 0.15)',
        border: 'solid 1px #dde1e9',
        backgroundColor: 'white',
        borderRadius: '4px',
        minWidth: 240,
    },
    menuIcon: {
        objectFit: 'contain'
    },
    menuStyle: {
        padding: 0
    },
});

const StyledListItemText = withStyles(() => ({
    root: {
        fontFamily: 'Open Sans',
        fontSize: 12,
        fontWeight: 'normal',
        fontStretch: 'normal',
        fontStyle: 'normal',
        margin: '0 0 0 5px',
        padding: 0,
        letterSpacing: 'normal',
        color: 'rgba(0, 0, 0, 0.9)'
    },
}))(ListItemText);

const StyledMenuItem = withStyles(() => ({
    root: {
        margin: 0,
        padding: '8px 20px 10px 10px'
    }
}))(MenuItem);

/**
 * User organization selection dropdown in main header bar
 *
 * @constructor
 */
export const OrgDropdownMenu: React.FunctionComponent<{}> = () => {
    const classes = useStyles();
    const router = useRouter();
    const appContext = useContext(AppContext);
    const [cookies, setCookie, ] = useCookies();

    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [addOrganizationDialog, setAddOrganizationDialog] = useState(false);
    const [editOrganizationDialog, setEditOrganizationDialog] = useState(false);
    const initialOrganization = {
        id: undefined,
        name: undefined
    };
    const [editOrganizationValues, setEditOrganizationValues] = useState<{
        id: string | undefined;
        name: string | undefined;
    }>(initialOrganization);

    // we need to update maps since _organizationsMap was deleted before storing into cookie because of 4k cookie limit
    appContext.user?.updateMaps();

    const orgsMap = appContext.user?._organizationsMap || {};
    const noOrgs = (appContext.user?.organizations || []).length === 0;
    const selectedOrg = {
        id: appContext.activeOrganizationId || appContext.user?.activeOrganizationId || '',
        name: orgsMap[appContext.activeOrganizationId || appContext.user?.activeOrganizationId || '']?.name || (noOrgs ? 'No Organizations' : 'Unknown Org')
    };

    const [activeOrg, setActiveOrg] = useState<{
        id: string;
        name: string;
    }>(selectedOrg);
    const orgsList = (appContext.user?.organizations || []).filter((org) => org.id != activeOrg.id);
    if (selectedOrg.id != activeOrg.id && orgsMap[selectedOrg.id]) {
        setActiveOrg(selectedOrg);
        return null;
    }

    /**
     * Menu item was clicked
     */
    const handleClick = (event: any) => {
        setMenuAnchorEl(event.currentTarget);
    };

    /**
     * Close the dropdown menu
     */
    const handleClose = () => {
        setMenuAnchorEl(null);
    };

    /**
     * Existing organization clicked, perform switch...
     *
     * @param id the org that was selected
     */
    const handleChangeOrgClick = (id: string) => {
        // Future: add a popup asking if they really want to switch to another organization since they will lose their work in progress

        // lets delete all of the project from cache
        mutate('getProjects', produce(projectsDataToMutate => {
            _.remove(projectsDataToMutate, () => true);
        }), false);

        Auth.setActiveOrg(id).then(res => {
            if (res && res.id && res.name) {

                // lets set the appContext active org id since the BE does not currently save user settings
                appContext.setActiveOrganizationId(res.id);
                // @ts-ignore
                appContext.user.activeOrganizationId = res.id;
                // And update the local cookie as well
                const userFromCookie = new Person(cookies['local-user-data']);
                userFromCookie.activeOrganizationId = res.id;
                setCookie('local-user-data', userFromCookie, {
                    path: '/',
                    maxAge: 60 * 60 * 24
                });
                setActiveOrg({
                    id: res.id,
                    name: res.name
                });

                // store the active org in cookie since BE does not persist user setting yet
                setCookie('local-user-active-org-data', {
                    id: res.id,
                    name: res.name
                }, {
                    path: '/',
                    maxAge: 60 * 60 * 24 * 30
                });

                // restart the message queue
                Api.createMessageQueue()
                    .then((uuid) => {
                        appContext.setMessageQueueUuid(uuid);
                    });

                log('[OrgDropdownMenu] handleChangeOrgClick, setActiveOrg.OK:', res);
            } else {
                log('[OrgDropdownMenu] handleChangeOrgClick, setActiveOrg.OK but got malformed answer:', res);
            }
            setMenuAnchorEl(null);

            // fetch the list of projects for the active organization
            mutate('getProjects');

            // force the user back to the projects list page since they will get a new list for the active org they switched to
            router.push('/migration/dashboard');
        }).catch(err => {
            log('[OrgDropdownMenu] handleChangeOrgClick, setActiveOrg ERROR:', err);
            setMenuAnchorEl(null);

            // fetch the list of projects for the active organization
            mutate('getProjects');
        });
    };

    /**
     * New organization
     */
    const addOrganization = (event: any): void => {
        if (event) {
            event.stopPropagation();
            setMenuAnchorEl(null);  // Close the menu
        }
        setMenuAnchorEl(null);
        setAddOrganizationDialog(true);   // Open the dialog
    };

    /**
     * Edit organization
     */
    const editOrganization = (event: any, organizationId: string, organizationName: string): void => {
        if (event) {
            event.stopPropagation();
            setMenuAnchorEl(null);  // Close the menu
        }
        setMenuAnchorEl(null);
        setEditOrganizationValues({
            id: organizationId,
            name: organizationName
        });
        setEditOrganizationDialog(true);   // Open the dialog
    };

    const selectCreatedOrg = (id?: string, name?: string): void => {
        setAddOrganizationDialog(false);
        if (!id || !name) {
            return;
        }
        handleChangeOrgClick(id);
    };

    return (
        <>
            <Button
                onClick={handleClick}
                data-cy="organizationMenu"
                className={classes.button}
            >
                {activeOrg.name}
                <VcioIcon vcio="ars-chevron-down" iconColor={colors.blue_gray_500} style={{ marginLeft: 5 }}/>
            </Button>
            <Menu
                anchorEl={menuAnchorEl}
                keepMounted
                MenuListProps={{ disablePadding: true }}
                open={Boolean(menuAnchorEl)}
                onClose={handleClose}
                elevation={0}
                className={classes.menuStyle}
                getContentAnchorEl={null}
                anchorOrigin={{
                    vertical: 50,
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
            >
                <div className={classes.menuContainer}>
                    <div key={activeOrg.id} hidden={noOrgs}>
                        <StyledMenuItem
                            key={activeOrg.id}
                            data-cy={'org-id-' + activeOrg.name}
                            onClick={() => setMenuAnchorEl(null)}
                        >
                            <StyledListItemText primary={activeOrg.name}/>
                            <ListItemIcon className={classes.listIcon} onClick={(event) => editOrganization(event, activeOrg.id, activeOrg.name)}>
                                <VcioIcon vcio="general-pencil" iconColor={colors.blue_gray_300}/>
                            </ListItemIcon>
                        </StyledMenuItem>
                    </div>
                    {
                        orgsList.map((org) => {
                            return (
                                <div key={org.id}>
                                    <StyledMenuItem data-cy={'org-id-' + org.name} onClick={() => handleChangeOrgClick(org.id)}>
                                        <StyledListItemText primary={org.name} style={{ marginLeft: 5 }}/>
                                        <ListItemIcon className={classes.listIcon} onClick={(event) => editOrganization(event, org.id, org.name)}>
                                            <VcioIcon vcio="general-pencil" iconColor={colors.blue_gray_300}/>
                                        </ListItemIcon>
                                    </StyledMenuItem>
                                </div>
                            );
                        })
                    }
                    <Divider/>
                    <StyledMenuItem key="newOrganization" onClick={(event) => addOrganization(event)}>
                        <ListItemIcon className={classes.listIcon}>
                            <VcioIcon vcio="general-plus-circle" iconColor={colors.green_500}/>
                        </ListItemIcon>
                        <StyledListItemText primary="New Organization"/>
                    </StyledMenuItem>
                </div>
            </Menu>
            {
                addOrganizationDialog &&
                <AddEditOrganizationDialog
                    mode="add"
                    handleDialogClose={(_changed, name, id) => selectCreatedOrg(id, name)}
                />
            }
            {
                editOrganizationDialog && editOrganizationValues.id && editOrganizationValues.name &&
                <AddEditOrganizationDialog
                    mode="edit"
                    organization={editOrganizationValues}
                    handleDialogClose={(changed: boolean, newOrgName?: string) => {
                        if (changed && newOrgName && editOrganizationValues.id === activeOrg.id) {
                            setActiveOrg({
                                id: activeOrg.id,
                                name: newOrgName
                            });
                        }
                        setEditOrganizationValues(initialOrganization);
                        setEditOrganizationDialog(false);
                    }}
                />
            }
        </>
    );
};
