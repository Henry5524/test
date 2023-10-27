import { AppContext } from '@context';

import { CssBaseline, makeStyles, ThemeProvider } from '@material-ui/core';
import { Person } from '@models';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';
import { LicenseManager } from 'ag-grid-enterprise';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { SnackbarProvider } from 'notistack';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useCookies } from 'react-cookie';
import 'react-dropzone-uploader/dist/styles.css';
import Zendesk, { ZendeskAPI } from 'react-zendesk';

import { SWRConfig } from 'swr';
import '../../public/agGrid.css';
import '../../public/vCIO.css';
import '../../public/vCIOIcons.css';
import { VcioIcon } from '../components';
import { TabNavigationItem, Target } from '../models';
import { Api, Auth } from '../services';
import { colors, theme } from '../styles';
import { doRoute, getDefaultTarget, log } from '../utils';

const ZENDESK_KEY = 'e7f4d43f-f94c-4362-9974-eeb59a65b631';

LicenseManager.setLicenseKey(
    'CompanyName=Virtana,LicensedApplication=React,LicenseType=SingleApplication,LicensedConcurrentDeveloperCount=5,LicensedProductionInstancesCount=1,'
    + 'AssetReference=AG-010973,ExpiryDate=21_October_2021_[v2]_MTYzNDc3MDgwMDAwMA==c2425f9da2fe1a41794c4cd21a853ca0'
);

const LOGGING: boolean = false;
const logx = (msg: string, ...more: any[]): void => {
    if (LOGGING) {
        log(msg, more);
    }
};
const revalidateOnFocusDefault: {revalidateOnFocus: boolean} = { revalidateOnFocus: false };

interface MyAppProps {
    Component: any;
    pageProps: any;
}

const useStyles = makeStyles(() => ({
    success: {
        backgroundColor: colors.light_green_50,
        color: colors.black_90,
        borderRadius: 4,
        shadowColor: 'rgba(15, 45, 104, 0.24)',
        shadowOffset: {
            width: 0,
            height: 4
        },
        shadowRadius: 10,
        shadowOpacity: 1,
        fontFamily: 'Open Sans',
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        whiteSpace: 'pre-line',
    },
    error: {
        backgroundColor: colors.red_50,
        color: colors.black_90,
        borderRadius: 4,
        shadowColor: 'rgba(15, 45, 104, 0.24)',
        shadowOffset: {
            width: 0,
            height: 4
        },
        shadowRadius: 10,
        shadowOpacity: 1,
        fontFamily: 'Open Sans',
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        whiteSpace: 'pre-line',
    },
    warning: {
        backgroundColor: colors.amber_50,
        color: colors.black_90,
        borderRadius: 4,
        shadowColor: 'rgba(15, 45, 104, 0.24)',
        shadowOffset: {
            width: 0,
            height: 4
        },
        shadowRadius: 10,
        shadowOpacity: 1,
        fontFamily: 'Open Sans',
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        whiteSpace: 'pre-line',
    },
    info: {
        color: colors.black_90,
        backgroundColor: colors.blue_100,
        borderRadius: 4,
        shadowColor: 'rgba(15, 45, 104, 0.24)',
        shadowOffset: {
            width: 0,
            height: 4
        },
        shadowRadius: 10,
        shadowOpacity: 1,
        fontFamily: 'Open Sans',
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        whiteSpace: 'pre-line',
    },
}));

/**
 * This can be used to trace nextjs navigation
 *
 * @param _metric
 */
export function reportWebVitals(_metric: any) {
    // log(metric);
}

const unProtectedRoutes = [
    '/signin',
    '/login',
    '/signup',
    '/about',
    '/support',
    '/reset-password',
    '/recover/password',
    '/__test'
];

const MyApp: React.FunctionComponent<MyAppProps> = (props) => {

    const appContext = useContext(AppContext);
    const [user, setUser] = useState(appContext.user);
    const [activeOrganizationId, setActiveOrganizationId] = useState(appContext.activeOrganizationId);
    const [projectsDashboardSearch, setProjectsDashboardSearch] = useState(appContext.projectsDashboardSearch);
    const [projectsDashboardSortField, setProjectsDashboardSortField] = useState(appContext.projectsDashboardSortField);
    const [projectsDashboardSortDirection, setProjectsDashboardSortDirection] = useState(appContext.projectsDashboardSortDirection);
    const [shouldFetchProjectsData, setShouldFetchProjectsData] = useState(appContext.shouldFetchProjectsData);
    const [tabNavigationContext, setTabNavigationContext] = useState(appContext.tabNavigationContext);
    const [prevTabName, setPrevTabName] = useState(appContext.prevTabName);
    const [messageQueueUuid, setMessageQueueUuid] = useState(appContext.messageQueueUuid);
    const [functionalitySwitches, setFunctionalitySwitches] = useState(appContext.functionalitySwitches);
    const [zendeskLoaded, setZendeskLoaded] = useState(false);

    const [cookies, setCookie, removeCookie] = useCookies();

    const router = useRouter();

    const zenDeskSettings = useMemo(() => {
        return {
            offset: {
                horizontal: '-10px',
                vertical: '-9px'
            },
            position: {
                horizontal: 'right',
                vertical: 'bottom'
            },
            color: {
                theme: colors.green_300,
                launcher: colors.green_500,
                launcherText: colors.white_100,
                // button: colors.green_150,
                // header: colors.green_150,
            },
            launcher: {
                label: {
                    'en-US': 'Support',
                }
            },
            contactForm: {
                title: {
                    'en-US': 'Leave us a message'
                }
            }
        };
    }, []);

    const protectedRoute = useMemo(() => !unProtectedRoutes.includes(router.pathname), [router.pathname]);

    useEffect(() => {
        logx('[MyApp] useEffect,', router.pathname, ' -> user:', user);

        const userFromCookie = new Person(cookies['local-user-data']);

        const adminsRoute = router.pathname.startsWith('/admin');

        if (!user && userFromCookie) {

            logx('[MyApp] useEffect,', router.pathname, ' -> restore user:', userFromCookie);

            const afterLogin = (loggedInPerson: Person) => {
                setUser(loggedInPerson);

                // below is needed for navigation tree initialization
                const target: Target = getDefaultTarget('migration');
                const newTabNavigationItem: TabNavigationItem = {
                    tab_name: 'migration',
                    nav_open: true,
                    expanded: [],
                    selected: 'dashboard',
                    target,
                    title: 'Dashboard',
                    subtitle: ''
                };
                tabNavigationContext.tab_navigation_items.push(newTabNavigationItem);
                setTabNavigationContext(tabNavigationContext);
                setPrevTabName('migration');
            };

            userFromCookie.updateMaps();

            const orgsMap = userFromCookie._organizationsMap;

            const cookieActiveOrg = cookies['local-user-active-org-data'];

            // if we saved our last active org choice in the cookie, then use it if that org id is valid
            if (cookieActiveOrg && orgsMap && orgsMap[cookieActiveOrg.id]) {
                Auth.setActiveOrg(cookieActiveOrg.id).then(res => {
                    if (res && res.id && res.name) {

                        appContext.setActiveOrganizationId(res.id);

                        // @ts-ignore
                        userFromCookie.activeOrganizationId = res.id;

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

                        logx('[MyApp] useEffect, setActiveOrg.OK:', res);
                    } else {
                        logx('[MyApp] useEffect, setActiveOrg.OK but got malformed answer:', res);
                    }

                    afterLogin(userFromCookie);
                }).catch(() => {
                    // the active org id was not valid so delete it
                    removeCookie('local-user-active-org-data', {
                        path: '/'
                    });

                    afterLogin(userFromCookie);
                });
            } else {
                // the active org id was not valid so delete it
                removeCookie('local-user-active-org-data', {
                    path: '/'
                });

                afterLogin(userFromCookie);
            }
        } else if (protectedRoute && !user) {
            router.push('/signin');
        } else if (adminsRoute && user && !user._isGlobalAdmin) {
            // Future: deny access to admin's routes for non-admins, maybe redirect to dashboard or error page
            logx('[MyApp] useEffect, admins route');
        }
    }, [router, user, tabNavigationContext, cookies, appContext, setCookie, removeCookie, protectedRoute]);


    useEffect(() => {
        if (zendeskLoaded && user) {
            ZendeskAPI('webWidget', 'prefill', {
                name: {
                    value: user.name
                },
                email: {
                    value: user.email
                }
            });
        }
    }, [user, zendeskLoaded]);

    useEffect(() => {
        // Remove the server-side injected CSS.
        const jssStyles = document.querySelector('#jss-server-side');
        if (jssStyles && jssStyles.parentElement) {
            jssStyles.parentElement.removeChild(jssStyles);
        }

        // This is for cypress testing
        // @ts-ignore
        window.doRoute = (target: string) => {
            doRoute(router, {
                route: target,
            });
        };
    }, [router]);

    const classes = useStyles();

    return !user && protectedRoute ? null : (
        <AppContext.Provider
            value={{
                user, setUser,
                activeOrganizationId, setActiveOrganizationId,
                projectsDashboardSearch, setProjectsDashboardSearch,
                projectsDashboardSortField, setProjectsDashboardSortField,
                projectsDashboardSortDirection, setProjectsDashboardSortDirection,
                shouldFetchProjectsData, setShouldFetchProjectsData,
                tabNavigationContext, setTabNavigationContext,
                prevTabName, setPrevTabName,
                messageQueueUuid, setMessageQueueUuid,
                functionalitySwitches, setFunctionalitySwitches
            }}
        >
            <Head>
                <title>Virtana</title>
                <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width"/>
                <link rel="icon" type="image/x-icon" href={router.basePath + '/favicon.ico'}/>
            </Head>
            <ThemeProvider theme={theme}>
                <SnackbarProvider
                    classes={{
                        variantSuccess: classes.success,
                        variantError: classes.error,
                        variantWarning: classes.warning,
                        variantInfo: classes.info,
                    }}
                    iconVariant={{
                        success: <VcioIcon vcio="status-alarm" style={{ marginRight: 8 }} iconColor={colors.light_green_600}/>,
                        error: <VcioIcon vcio="status-ok" style={{ marginRight: 8 }} iconColor={colors.red_500}/>,
                        warning: <VcioIcon vcio="status-warning" style={{ marginRight: 8 }} iconColor={colors.amber_500}/>,
                        info: <VcioIcon vcio="status-Info" style={{ marginRight: 8 }} iconColor={colors.blue_600}/>
                    }}
                    maxSnack={4}
                >
                    {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
                    <CssBaseline/>
                    <SWRConfig
                        value={revalidateOnFocusDefault}
                    >
                        <props.Component {...props.pageProps} />
                    </SWRConfig>
                    <Zendesk zendeskKey={ZENDESK_KEY} {...zenDeskSettings} onLoaded={() => setZendeskLoaded(true)}/>
                </SnackbarProvider>
            </ThemeProvider>
        </AppContext.Provider>
    );
};

export default MyApp;
