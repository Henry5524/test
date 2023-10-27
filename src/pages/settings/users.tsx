// @ts-ignore
import { InviteUserDialog, Message, Page, VcioIcon } from '@components';
import { AppContext } from '@context';
import { Box, Button, Divider as MenuDivider, Grid, Icon, IconButton, InputAdornment, ListItemIcon, ListItemText, makeStyles, Menu, MenuItem, Snackbar, TextField, Tooltip, Typography, withStyles } from '@material-ui/core';
import { Alert, AlertProps } from '@material-ui/lab';
import { OrgPerson, TabNavigationItem, Target } from '@models';
import { useWindowHeight } from '@react-hook/window-size';

import { Auth } from '@services';
import { colors, text, theme } from '@styles';
import { AG_GRID_LOCALE_EN, getDefaultTarget, getNavigationMenu, ShowToast } from '@utils';
import { MaskTarget } from '@utils/common-project';
import { CellClickedEvent, GridApi, GridOptions, GridReadyEvent, RowSelectedEvent } from 'ag-grid-community';

import { AgGridReact } from 'ag-grid-react';
import { useSnackbar } from 'notistack';
import React, { Component, useContext, useEffect, useState } from 'react';


const useStyles = makeStyles(() => ({
    container: {
        padding: theme.spacing(10)
    },
    toolbar: {
        ...text.primaryInterfaceTitleH1,
        marginTop: 20,
    },
    panel: {
        minWidth: '300px',
    },
    divider: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '6px',
        backgroundColor: colors.blue_gray_100,
        color: colors.blue_gray_500,
        marginRight: 16,
        cursor: 'col-resize',
        pointerEvents: 'all',
        '& *': {
            pointerEvents: 'none',
        }
    },
    resultsText: {
        fontWeight: 'normal',
        fontStyle: 'normal',
        letterSpacing: 0,
        color: colors.blue_gray_700
    },
}));

const StyledMenu = withStyles({
    paper: {
        borderRadius: 4,
        backgroundColor: colors.white_100,
        shadowColor: 'rgba(15, 45, 104, 0.15)',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowRadius: 15,
        shadowOpacity: 1,
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: colors.blue_gray_200,
    },
    list: {
        paddingTop: 0,
        paddingBottom: 0,
    }
})(Menu);

const StyledMenuItem = withStyles({
    root: {
        backgroundColor: colors.white_100,
        '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
            color: colors.black_90,
            fontSize: 14
        },
        '&:focus': {
            // backgroundColor: colors.white_100,
            '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
                color: colors.black_90,
                fontSize: 14
            },
        },

    },
})(MenuItem);

export const UsersList: React.FunctionComponent = () => {
    const classes = useStyles();
    const appContext = useContext(AppContext);
    const { enqueueSnackbar } = useSnackbar();

    const [snackbar, setSnackbar] = useState<AlertProps & { open: boolean; text: string }>({ open: false, severity: 'info', text: '' });
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);   // For the hamburger menu
    const [error, setError] = useState<{ message: string } | null>(null);
    const [searchString, setSearchString] = useState<string>('');
    const [tabNavigationContext, setTabNavigationContext] = useState(appContext.tabNavigationContext);
    const [users, setUsers] = useState<OrgPerson[] | undefined>(undefined);
    const [gridApi, setGridApi] = useState<GridApi>();
    const [inviteUserDialogOpened, setInviteUserDialogOpened] = useState(false);
    const [selectedRowsCount, setSelectedRowsCount] = useState<number>(0);
    const [selectedRows, setSelectedRows] = useState<OrgPerson[]>([]);
    const [clickedRow, setClickedRow] = useState<OrgPerson | null>(null);

    const windowHeight = useWindowHeight();
    const maxBodyHeight = windowHeight - 350;
    const orgId = appContext.user?.activeOrganizationId;
    const userId = appContext && appContext.user ? appContext.user.id : null;

    const handleOnGridReady = (event: GridReadyEvent) => {
        setGridApi(event.api);
    };

    useEffect(() => {
        let active = true;

        if (users != undefined) {
            return undefined;
        }

        if (orgId === '') {
            setUsers([]);
            return undefined;
        }

        Promise.all([
            Auth.getOrgUsers({ org_id: orgId }),
            Auth.getInvitations({ org_id: orgId })
        ]).then(results => {
            if (active) {
                const u: OrgPerson[] = [];
                if (results[1].invitations) {
                    for (const inv of results[1].invitations) {
                        if (inv.user) {
                            if (!inv.user.id) {
                                inv.user.id = inv.id;
                            }
                            u.push(inv.user);
                        }
                    }
                }
                if (results[0].users) {
                    u.push(...results[0].users);
                }
                setError(null);
                setUsers(u);
            }
        }).catch(err => {
            setError(err);
            setUsers([]);
        });

        return () => {
            active = false;
        };
    }, [users, orgId]);

    useEffect(() => {
        const target: Target = getDefaultTarget('settings');
        const newTabNavigationItem: TabNavigationItem = {
            tab_name: 'settings',
            nav_open: true,
            expanded: [],
            selected: 'settings-users',
            target,
            title: 'Settings',
            subtitle: ''
        };
        tabNavigationContext.tab_navigation_items.push(newTabNavigationItem);
        setTabNavigationContext(tabNavigationContext);
    }, [tabNavigationContext]);

    const handleSnackbarClose = () => setSnackbar({ open: false, severity: 'info', text: '' });
    const showError = (ttl: string, msg: string) => {
        ShowToast(
            <Grid container>
                <Grid item xs={1}><VcioIcon vcio="vcio-general-cross" iconColor={colors.red_500}/></Grid>
                <Grid item xs={11}>{ttl}<br/>{msg}</Grid>
            </Grid>
            , appContext, enqueueSnackbar, 'warning');
    };

    /**
     * Opens the hamburger menu on click of the hamburger icon
     * @param event The menu is anchored to the target element of the click event - the icon, causing the menu to open.
     * @param row
     */
    const handleHamburgerMenuClick = (event: any, row: OrgPerson) => {
        event.stopPropagation();
        setClickedRow(row);
        setMenuAnchorEl(event.currentTarget);
    };

    /**
     * Closes the hamburger menu by setting the anchor element to null.
     */
    const handleHamburgerMenuClose = (event: any) => {
        event.stopPropagation();
        setMenuAnchorEl(null);
        setClickedRow(null);
    };

    const handleResendInvitationClick = (event: any) => {
        event.stopPropagation();
        setMenuAnchorEl(null);
        const rows = selectedRows?.length > 0 ? [...selectedRows] : [clickedRow];
        Promise.allSettled(rows.map(row => {
            if (row?._invitationId) {
                return Auth.deleteInvitation(row.id);
            }
            return null;
        })).then(results => {
            const deleted: OrgPerson[] = [];
            for (let i = 0; i < results.length; i++) {
                const res = results[i];
                const row = rows[i];
                if (res.status != 'fulfilled') {
                    showError('Invitation have not been sent because of the following error:', res.reason.message);
                } else if (row) {
                    deleted.push(row);
                }
            }
            if (deleted.length > 0 && orgId) {
                Promise.allSettled(deleted.map(r => Auth.sendInviteUser(orgId, r.email, [{ id: '1' }]))).then(iresults => {
                    let ok = 0;
                    for (const res of iresults) {
                        if (res.status == 'fulfilled') {
                            ok++;
                        } else {
                            showError('Invitation have not been sent because of the following error:', res.reason.message);
                        }
                    }
                    if (ok > 0) {
                        const s = ok != 1 ? 's' : '';
                        ShowToast(`Invitation${s} have been resent to ${ok} user${s}.`, appContext, enqueueSnackbar);
                        setUsers(undefined);
                    }
                });
            }
        });
    };

    const handleRemoveUserClick = (event: any) => {
        event.stopPropagation();
        setMenuAnchorEl(null);
        const rows = selectedRows?.length > 0 ? selectedRows : [clickedRow];
        Promise.allSettled(rows.map(row => {
            if (row && row.id != userId) {
                return row._invitationId ? Auth.deleteInvitation(row._invitationId) : Auth.deleteUser(row.id, orgId as string);
            }
            return null;
        })).then(results => {
            let ok = 0;
            for (const res of results) {
                if (res.status == 'fulfilled') {
                    ok++;
                } else {
                    showError('User have not been deleted because of the following error:', res.reason.message);
                }
            }
            if (ok > 0) {
                ShowToast(`The user${ok != 1 ? 's have ' : ' has '} been deleted.`, appContext, enqueueSnackbar);
                setUsers(undefined);
            }
        });
    };

    /**
     * Constructs the hamburger menu
     */
    const getHamburgerMenu = () => {
        const rows = selectedRows?.length > 0 ? selectedRows : [clickedRow];
        let showResend = false;
        let showRemove = false;
        for (const row of rows) {
            if (row) {
                if (row.id != userId && !row._invitationId) {
                    showRemove = true;
                }
                else if (row._invitationId) {
                    showResend = true;
                    showRemove = true;
                }
            }
        }
        if (!showResend && !showRemove) {
            return null;
        }
        return (
            <StyledMenu
                id="hamburger-menu"
                anchorEl={menuAnchorEl}
                elevation={0}
                getContentAnchorEl={null}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                keepMounted
                open={Boolean(menuAnchorEl)}
                onClose={handleHamburgerMenuClose}
            >
                {
                    showResend &&
                    <StyledMenuItem
                        onClick={(event) => handleResendInvitationClick(event)}
                    >
                        <ListItemIcon style={{ minWidth: 30 }}>
                            <VcioIcon vcio="mail-envelope-open-text" iconColor={colors.blue_500}/>
                        </ListItemIcon>
                        <ListItemText primary="Resend Invitation"/>
                    </StyledMenuItem>
                }
                {showResend && showRemove && <MenuDivider/>}
                {
                    showRemove &&
                    <StyledMenuItem
                        onClick={(event) => handleRemoveUserClick(event)}
                    >
                        <ListItemIcon style={{ minWidth: 30 }}>
                            <VcioIcon vcio="general-trash-outline" iconColor={colors.red_500}/>
                        </ListItemIcon>
                        <ListItemText data-cy="removeUser" primary="Remove User"/>
                    </StyledMenuItem>
                }
            </StyledMenu>
        );
    };

    const NAV_MENU = getNavigationMenu('settings');
    const mask: MaskTarget = users == null ? MaskTarget.ContentOnly : MaskTarget.Nothing;

    const handleSearchChange = (event: { target: { value: any } }) => {
        setSearchString(event.target.value);
        gridApi?.setQuickFilter(event.target.value);
    };

    const handleInviteNewUserClick = () => {
        setInviteUserDialogOpened(true);
    };

    const onCellContextMenuClick = (cce: CellClickedEvent) => {
        if (cce.event && cce.data) {
            setMenuAnchorEl(cce.event.target as any);
            setClickedRow(cce.data);
        }
    };

    const handleSelectedRowsChange = (event: RowSelectedEvent) => {
        setSelectedRows(event.api.getSelectedRows());
        setSelectedRowsCount(event.api.getSelectedRows().length);
    };

    const handleSendInvitations = (emails: string[]) => {
        if (orgId && emails && emails.length > 0) {
            Promise.allSettled(emails.map(email => Auth.sendInviteUser(orgId, email, [{ id: '1' }])))
                .then(results => {
                    let succeeded = 0;
                    let failed = 0;
                    let errorMsg = '';
                    for (const res of results) {
                        if (res.status == 'fulfilled') {
                            succeeded++;
                        } else {
                            failed++;
                            errorMsg = res.reason.message;
                        }
                    }
                    if (succeeded > 0) {
                        const s = succeeded != 1 ? 's' : '';
                        ShowToast((
                            <div>
                                <VcioIcon vcio="mail-envelope-open-text" iconColor={colors.blue_600} style={{ marginRight: 8 }}/>
                                Invitation{s} have been sent to {succeeded} user{s}.
                            </div>
                        ), appContext, enqueueSnackbar, 'info');
                    }
                    if (failed > 0) {
                        showError(`Invitations have not been sent to ${failed} user${failed != 1 ? 's' : ''} because of the following error:`, errorMsg);
                    }
                    setUsers(undefined);
                    setInviteUserDialogOpened(false);
                });
        }
    };

    class StatusColumnRenderer extends Component<{ data: OrgPerson }> {
        constructor(cellProps: any) {
            super(cellProps);
        }

        getReactContainerStyle() {
            return {
                display: 'flex',
                height: '100%',
            };
        }

        render() {
            return (
                this.props.data?.status == 'verified' && !this.props.data?._invitationId
                    ? <VcioIcon vcio="um-user" iconColor={colors.blue_gray_300}/>
                    : <VcioIcon vcio="clock-hourglass-outline" iconColor={colors.blue_500}/>
            );
        }
    }

    class NameColumnRenderer extends Component<{ data: OrgPerson }> {
        constructor(cellProps: any) {
            super(cellProps);
        }

        getReactContainerStyle() {
            return {
                display: 'flex',
                height: '100%',
            };
        }

        render() {
            return (
                this.props.data?.status == 'verified' && !this.props.data?._invitationId
                    ? (
                        <>
                            <span>{this.props.data?.name}</span>
                            {
                                this.props.data?.id == userId &&
                                <span style={{ color: colors.blue_gray_500, marginLeft: 4 }}>(you)</span>
                            }
                        </>
                    )
                    : <span style={{ color: colors.blue_gray_500 }}>{this.props.data?.name ? this.props.data?.name : 'N/A'} (pending)</span>
            );
        }
    }

    class RoleColumnRenderer extends Component<{ data: OrgPerson }> {
        constructor(cellProps: any) {
            super(cellProps);
        }

        getReactContainerStyle() {
            return {
                display: 'flex',
                height: '100%',
            };
        }

        render() {
            const { data } = this.props;
            if (data?.roles?.length > 0) {
                return data.roles.map(role => <span key={role.id}>{role.name}</span>);
            }
            return '';
        }
    }

    class MenuColumnRenderer extends Component<{ data: OrgPerson }> {
        constructor(cellProps: any) {
            super(cellProps);
        }

        getReactContainerStyle() {
            return {
                display: 'flex',
                height: '100%',
            };
        }

        render() {
            return (
                this.props.data?.id == userId ? '' :
                    <IconButton
                        aria-controls="row-menu"
                        aria-haspopup="true"
                        onClick={e => handleHamburgerMenuClick(e, this.props.data)}
                    >
                        <VcioIcon vcio="general-dots" iconColor={colors.green_500}/>
                    </IconButton>
            );
        }
    }

    const gridOptions: GridOptions = {
        cacheQuickFilter: true,
        columnDefs: [
            {
                checkboxSelection: true,
                headerCheckboxSelection: true,
                headerCheckboxSelectionFilteredOnly: true,
                suppressMovable: true,
                lockPosition: true,
                lockVisible: true,
                unSortIcon: true,
                width: 65,
                sortable: false,
                suppressMenu: true,
                cellStyle: { verticalAlign: 'middle' },
            },
            {
                flex: 1,
                width: 32,
                maxWidth: 32,
                minWidth: 32,
                resizable: false,
                sortable: true,
                unSortIcon: true,
                cellRenderer: 'statusColumnRenderer',
                cellStyle: { verticalAlign: 'middle', paddingLeft: 0, paddingRight: 0 },
            },
            {
                headerName: 'Name',
                field: 'name',
                flex: 1,
                minWidth: 150,
                resizable: true,
                sortable: true,
                unSortIcon: true,
                cellRenderer: 'nameColumnRenderer',
                cellStyle: { verticalAlign: 'middle', paddingLeft: 0 },
            },
            {
                headerName: 'Email',
                field: 'email',
                flex: 1,
                minWidth: 150,
                resizable: true,
                sortable: true,
                unSortIcon: true,
                cellStyle: { verticalAlign: 'middle' },
            },
            {
                headerName: 'Role',
                flex: 1,
                maxWidth: 150,
                resizable: false,
                sortable: true,
                unSortIcon: true,
                cellRenderer: 'roleColumnRenderer',
                cellStyle: { verticalAlign: 'middle' },
            },
            {
                flex: 1,
                maxWidth: 100,
                minWidth: 100,
                resizable: false,
                sortable: false,
                cellRenderer: 'menuColumnRenderer',
                cellStyle: { verticalAlign: 'middle' },
            },
        ],
        defaultColDef: {
            sortable: true,
        },
        frameworkComponents: {
            nameColumnRenderer: NameColumnRenderer,
            statusColumnRenderer: StatusColumnRenderer,
            roleColumnRenderer: RoleColumnRenderer,
            menuColumnRenderer: MenuColumnRenderer,
        },
        getRowNodeId: (data: any) => {
            return data.id;
        },
        groupSelectsChildren: true,
        immutableData: true,
        localeText: AG_GRID_LOCALE_EN,
        rowHeight: 54,
        suppressContextMenu: true,
        suppressScrollOnNewData: true,
        tooltipShowDelay: 0,
        suppressRowClickSelection: true,
        suppressCellSelection: false,
        enableCellTextSelection: true,
        onGridReady: handleOnGridReady,
        rowSelection: 'multiple',
        enableRangeSelection: false,
    };

    return (
        <Page tab="settings" navMenu={NAV_MENU} mask={mask}>
            {
                !error &&
                <>
                    <Grid container style={{ marginBottom: theme.spacing(6) }} className={classes.toolbar}>
                        <Grid item xs={12} sm={4}>
                            <Box>User List</Box>
                        </Grid>
                        <Grid item xs/>
                        <Grid item>
                            <Button
                                size="large"
                                data-cy="inviteUser"
                                startIcon={<Icon>add_circle</Icon>}
                                onClick={handleInviteNewUserClick}
                                disabled={orgId === ''}
                            >
                                Invite New Users
                            </Button>
                        </Grid>
                    </Grid>
                    <Grid container alignItems="center" spacing={2}>
                        <Grid item xs={6}>
                            <TextField
                                placeholder="Search users by name or email"
                                value={searchString}
                                data-cy="userListSearch"
                                onChange={handleSearchChange}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <VcioIcon vcio="general-search" iconColor={colors.blue_gray_500}/>
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        searchString &&
                                        <Tooltip title="Clear this search field" arrow placement="top">
                                            <InputAdornment
                                                position="start"
                                                data-cy="clearSearchField"
                                                onClick={() => {
                                                    setSearchString('');
                                                    gridApi?.setQuickFilter('');
                                                }}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <VcioIcon vcio="general-cross" iconColor={colors.blue_gray_500}/>
                                            </InputAdornment>
                                        </Tooltip>
                                    ),
                                }}
                                style={{ width: 379 }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <Grid container alignItems="center" justify="flex-end">
                                <Typography
                                    data-cy="resultText"
                                    className={classes.resultsText}
                                    noWrap
                                >
                                    Results contain {users ? users.length : 0} Users
                                </Typography>
                                {
                                    selectedRowsCount > 0 &&
                                    <>
                                        <Typography
                                            className={classes.resultsText}
                                            style={{ marginLeft: theme.spacing(4) }}
                                            noWrap
                                        >
                                            Selected: <b>{selectedRowsCount} user{selectedRowsCount > 1 ? 's' : ''}</b>
                                        </Typography>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            style={{ marginLeft: theme.spacing(4) }}
                                            endIcon={<VcioIcon vcio="ars-chevron-down" rem={.7} forceRem={true} iconColor={colors.blue_gray_500}/>}
                                            onClick={event => setMenuAnchorEl(event.target as any)}
                                        >
                                            Actions
                                        </Button>
                                    </>
                                }
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid container>
                        <Grid item xs={12}>
                            <div
                                className="ag-theme-alpine"
                                style={{
                                    height: maxBodyHeight + 60,
                                    width: '100%'
                                }}
                            >
                                <AgGridReact
                                    gridOptions={gridOptions}
                                    onSelectionChanged={handleSelectedRowsChange}
                                    preventDefaultOnContextMenu={true}
                                    onCellContextMenu={onCellContextMenuClick}
                                    rowData={users}
                                    context={{}}
                                />
                            </div>
                        </Grid>
                    </Grid>
                    <InviteUserDialog
                        open={inviteUserDialogOpened}
                        users={users}
                        sendInvitations={handleSendInvitations}
                        onClose={() => setInviteUserDialogOpened(false)}
                    />

                    {getHamburgerMenu()}
                </>
            }
            {
                error &&
                <Grid
                    container
                    direction="row"
                    justify="center"
                    alignItems="center"
                    style={{ marginTop: 40 }}
                >
                    <Message warning={true}>{error?.message ?? 'Unknown Error'}</Message>
                </Grid>
            }
            <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
                <Alert severity={snackbar.severity} onClose={handleSnackbarClose}>
                    {snackbar.text}
                </Alert>
            </Snackbar>
        </Page>
    );
};

export default UsersList;
