import { OrgDropdownMenu, UserDropdownMenu, VcioIcon } from '@components';
import { AppContext } from '@context';
import { AppBar, IconButton, makeStyles, Tab, Tabs } from '@material-ui/core';
import Link from '@material-ui/core/Link';
import { TabNavigationItem, Target } from '@models';
import _ from 'lodash';
import { useSnackbar } from 'notistack';

import { Auth } from '@services';
import { colors, theme } from '@styles';
import { doRoute, getDefaultTarget, ShowToast, warn } from '@utils';
import Router, { useRouter } from 'next/router';
import React, { useContext, useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import { mutate } from 'swr';
import { produce } from 'immer';
import { version } from '../../../package.json';

import Divider from '../../public/images/divider.svg';
import Logo from '../../public/images/logo-combo.svg';
import { SupportDropdownMenu } from '../controls/SupportDropdownMenu';

// Needed to extract this out so that theme would be recognized within cypress unit test since theme is
// currently loaded via _document.js when app runs.
const useStyles = makeStyles({
    assumedBanner: {
        height: 28,
        background: colors.amber_500,
        color: colors.black_100,
        padding: 5,
        fontSize: 12,
        textAlign: 'center',
    },
    bannerLinks: {
        '& > span': {
            marginLeft: theme.spacing(4),
            marginRight: theme.spacing(1),
        },
        '& > a': {
            marginRight: theme.spacing(4),
        }
    },
    bannerLink: {
        cursor: 'pointer',
        textDecoration: 'underline',
    },
    root: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'start',
        backgroundColor: colors.blue_gray_900,
        color: colors.white_100,
        height: '56px',
        boxShadow: '0 1px 4px 0 rgba(0, 0, 0, 0.25)'
        // position: 'absolute'    // Prevents header from sticking as you scroll the page
    },
    left: {
        width: '33.3%',
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start'
    },
    middle: {
        width: '33.3%',
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    right: {
        width: '33.4%',
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    logout: {
        fontSize: 12,
        cursor: 'pointer',
        padding: theme.spacing(2),
        color: colors.white_100
    },
    logo: {
        margin: theme.spacing(4, 4, 4, 6),
        cursor: 'pointer'
    },
    lines: {
        marginLeft: theme.spacing(3),
        marginTop: theme.spacing(5)
    },
    tabIndicator: {
        display: 'none'
    },
    tabsRoot: {
        alignItems: 'center',
        minHeight: '32px',
        maxHeight: '32px',
        minWidth: '130px'
    },
    tabWrapper: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    tabLabelIcon: {
        height: '20px',
        color: colors.white_100,
        fontSize: 16,
        textTransform: 'none'
    },
    tabSelected: {
        background: 'linear-gradient(to top, #25b575, #00ac8d)',
        borderRadius: theme.spacing(8)
    },
    avatar: {
        height: '26px',
        width: '26px',
        margin: theme.spacing(0, 0, 0, 4),
        backgroundColor: colors.blue_gray_300,
        fontFamily: 'Open Sans',
        fontSize: '13px',
        fontWeight: 600,
        fontStretch: 'normal',
        fontStyle: 'normal',
        lineHeight: '3.08',
        letterSpacing: 'normal',
        color: 'rgba(0, 0, 0, 0.9)'
    },
    circleIcon: {
        background: colors.green_700,
        width: '35px',
        height: '35px',
        borderRadius: '50%',
        textAlign: 'center',
        lineHeight: '40px',
        verticalAlign: 'middle',
        padding: '15px',
        marginLeft: '5px',
        marginRight: '4px'
    }
});

interface HeaderProps {
    tab?: 'executiveSummary' | 'cloudOptimization' | 'dataCenterCapacity' | 'migration' | 'settings';
    onNotificationsClick?: ((event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void) | undefined;
}

/**
 * Main application header bar
 *
 * @param props
 * @constructor
 */
export const Header: React.FunctionComponent<HeaderProps> = (props) => {
    const classes = useStyles();
    const router = useRouter();
    const appContext = useContext(AppContext);
    const { enqueueSnackbar } = useSnackbar();

    const { prevTabName, setPrevTabName } = appContext;
    const { tabNavigationContext, setTabNavigationContext } = appContext;
    const [, setCookie, removeCookie] = useCookies();
    const [supportMenuEl, setSupportMenuEl] = useState<Element | null>(null);

    const getTabNavigationItem = (tabName: string): TabNavigationItem | undefined =>
        tabNavigationContext.tab_navigation_items.find(tabNavigationItem => tabNavigationItem.tab_name == tabName);

    const showTabDefaultPage = (tabName: string) => {
        const target: Target = getDefaultTarget(tabName);
        doRoute(router, target);
    };

    const onChangeTab = (_event: any, tabName: string) => {
        const tabNavigationItem: TabNavigationItem | undefined = getTabNavigationItem(tabName);
        const target: Target = getDefaultTarget(tabName.toString());

        if (tabName === prevTabName) {
            // User is already on this tab, but they clicked the tab again.
            // Useful when the left nav is collapsed - send them to the default page for the tab.
            if (tabNavigationItem) {
                tabNavigationItem.expanded = [];
                tabNavigationItem.selected = 'dashboard';
                tabNavigationItem.target = target;
                tabNavigationItem.title = 'Dashboard';
                tabNavigationItem.subtitle = '';
                setTabNavigationContext(tabNavigationContext);
            }
            showTabDefaultPage(tabName);
            return;
        }

        // Did indeed change tabs

        setPrevTabName(tabName);

        if (!tabNavigationItem) {
            // First time to this tab, create tab navigation item
            // and show default page for the tab
            const newTabNavigationItem: TabNavigationItem = {
                tab_name: tabName as string,
                nav_open: true,
                expanded: [],
                selected: 'dashboard',
                target,
                title: 'Dashboard',
                subtitle: ''
            };
            tabNavigationContext.tab_navigation_items.push(newTabNavigationItem);
            setTabNavigationContext(tabNavigationContext);
            showTabDefaultPage(tabName);
        } else {
            // Been to this tab before, restore tab as it was previously
            doRoute(router, tabNavigationItem.target);
        }
    };

    useEffect(() => {
        router.prefetch('/signin').then();
    });

    // this allows users to open up a browser debugger window and type "appVersion" to see the current running version
    useEffect(() => {
        // @ts-ignore
        window.appVersion = version;
    }, []);

    const tabClasses = {
        root: classes.tabsRoot,
        wrapper: classes.tabWrapper,
        labelIcon: classes.tabLabelIcon,
        selected: classes.tabSelected,
    };

    const assumedUser = appContext.user && appContext.user.assumerId ? `${appContext.user.name} (${appContext.user.email})` : null;

    const handleLogoutClick = () => {
        removeCookie('local-user-data', {
            path: '/'
        });
        appContext.setActiveOrganizationId('');
        router.push('/signin');
    };

    const handleRevertUserClick = () => {
        // since we are reverting a user let's clear out our stored active org cookie
        removeCookie('local-user-active-org-data', {
            path: '/'
        });

        Auth.revertAssumeUser().then(
            revertedUser => {
                appContext.setActiveOrganizationId(revertedUser.activeOrganizationId);
                appContext.setUser(revertedUser);

                // we are running into 4mb cookie size limit and these unused _organizationsMap can safely be deleted from the cookie
                // if the data stored is over 4mb the cookie is not persisted
                delete revertedUser._organizationsMap;

                setCookie('local-user-data', revertedUser, {
                    path: '/',
                    maxAge: 60 * 60 * 24
                });

                // lets delete all of the project from cache
                mutate('getProjects', produce(projectsDataToMutate => {
                    _.remove(projectsDataToMutate, () => true);
                }), false);

                // force the user back to the projects list page since they will get a new list for the active org they switched to
                router.push('/migration/dashboard');
            }
        ).catch(err => {
            warn('[Header] handleRevertUserClick, Auth.revertAssumeUser.ERROR:', err);
            ShowToast('Could not revert user. ' + (err?.message ? err.message : ''), appContext, enqueueSnackbar, 'error');
        });
    };

    return (
        <>
            {
                assumedUser &&
                <AppBar className={classes.assumedBanner} position="relative" data-cy="assumeUserBanner">
                    <div data-cy="assumeUserName">
                        You are using the system as {assumedUser}
                        <span className={classes.bannerLinks}>
                            <VcioIcon vcio="um-user-friends" iconColor={colors.black_100} rem={.7}/>
                            <Link onClick={handleRevertUserClick} className={classes.bannerLink} data-cy="revertUser">Revert User</Link>
                            |
                            <VcioIcon vcio="general-sign-out-alt" iconColor={colors.black_100} rem={.7}/>
                            <Link onClick={handleLogoutClick} className={classes.bannerLink} data-cy="assumeUserLogOut">Log Out</Link>
                        </span>
                    </div>
                </AppBar>
            }
            <AppBar className={classes.root} position="relative">
                <div className={classes.left}>
                    <Link onClick={() => Router.push('/migration/dashboard')}>
                        <Logo className={classes.logo}/>
                    </Link>
                    <Divider style={{ marginTop: 15, marginLeft: 10 }}/>
                    <OrgDropdownMenu/>
                </div>
                <div className={classes.middle}>
                    {
                        props.tab &&
                        <Tabs
                            centered
                            value={props.tab && props.tab != 'settings' ? props.tab : false}
                            onChange={onChangeTab}
                            classes={{ root: classes.tabsRoot, indicator: classes.tabIndicator }}
                        >
                            {/*<Tab*/}
                            {/*    label="Summary"*/}
                            {/*    data-cy="summaryTab"*/}
                            {/*    classes={tabClasses}*/}
                            {/*    icon={*/}
                            {/*        <VcioIcon*/}
                            {/*            className="vcio-nav-dashboard"*/}
                            {/*            iconColor={colors.white_100}*/}
                            {/*            style={{ marginTop: 4, marginRight: 6 }}*/}
                            {/*            fontSize="small"*/}
                            {/*        />*/}
                            {/*    }*/}
                            {/*    value="executiveSummary"*/}
                            {/*/>*/}
                            <Tab
                                label="Migrate"
                                data-cy="migrateTab"
                                classes={tabClasses}
                                icon={
                                    <VcioIcon
                                        className="vcio-nav-migration"
                                        iconColor={colors.white_100}
                                        style={{ marginTop: 4, marginRight: 6 }}
                                        fontSize="small"
                                    />
                                }
                                value="migration"
                            />
                        </Tabs>
                    }
                </div>
                <div className={classes.right}>
                    <IconButton onClick={(event) => setSupportMenuEl(event.currentTarget)} className={supportMenuEl ? classes.circleIcon : ''}>
                        <VcioIcon className="vcio-nav-support" data-cy="support" iconColor={colors.white_100} rem={1.25} fontSize="small"/>
                    </IconButton>
                    <SupportDropdownMenu menuAnchorEl={supportMenuEl} handleSupportMenuClose={() => setSupportMenuEl(null)}/>
                    <IconButton
                        onClick={() => router.push('/settings/users')}
                        className={props.tab == 'settings' ? classes.circleIcon : ''}
                    >
                        <VcioIcon data-cy="settings" className="vcio-nav-settings" iconColor={colors.white_100} rem={1.25} fontSize="small"/>
                    </IconButton>
                    {/*<IconButton*/}
                    {/*    onClick={props.onNotificationsClick}*/}
                    {/*    disabled={!props.onNotificationsClick}*/}
                    {/*    style={{ opacity: props.onNotificationsClick ? 1 : .5 }}*/}
                    {/*>*/}
                    {/*    <VcioIcon className="vcio-nav-notifications" data-cy="notification" iconColor={colors.white_100} rem={1.25} fontSize="small"/>*/}
                    {/*</IconButton>*/}
                    <div style={{ marginLeft: '10px', marginRight: '4px' }}>
                        <Divider/>
                    </div>
                    <UserDropdownMenu />
                </div>
            </AppBar>
        </>
    );
};

