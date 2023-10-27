import React, { useContext, useState } from 'react';
import { useRouter } from 'next/router';

import {
    CircularProgress, Container, Grid, Link, makeStyles, Typography
} from '@material-ui/core';
import { useFormik } from 'formik';
import clsx from 'clsx';
import _ from 'lodash';

import { Target, TabNavigationItem, Person } from '@models';
import { doRoute, getDefaultTarget, log } from '@utils';
import { AppContext, ExtendedWindow } from '@context';
import { Message, PromoButton, PromoField, LandingPage, VirtanaLogo } from '@components';
import { Api, Auth } from '@services';
import { customStyles } from '@styles';
import { useCookies } from 'react-cookie';

const useStyles = makeStyles((theme) => ({
    loginPageLink: customStyles.loginPageLink,
    underline: customStyles.underline,
    paper: {
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'transparent',
        color: 'white',
        textAlign: 'center'
    },
    wrapper: {
        margin: theme.spacing(2),
        position: 'relative',
    },
    form: {
        width: '100%', // Fix IE 11 issue.
        maxWidth: 400,
        marginTop: theme.spacing(1),
    },
    submit: {
        margin: theme.spacing(6, 0, 4),
    },
    buttonProgress: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -12,
        marginLeft: -12,
    },
    signup: {
        position: 'fixed',
        top: 20,
        right: 75,
    },
    field: {
        width: 384
    },
}));

declare let window: ExtendedWindow;

export const SigninPage = () => {
    const classes = useStyles();
    const appContext = useContext(AppContext);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState({ message: null });
    const router = useRouter();
    const { query: { redirect }, basePath } = useRouter();

    /**
     * Logically creates a message queue, which is identified by a UUID, which we save into application context.
     * The UUID will be used later when polling for messages.
     */
    const setupMessageQueue = () => {
        return Api.createMessageQueue()
            .then((uuid) => {
                appContext.setMessageQueueUuid(uuid);
            });
    };

    /**
     * Function to be placed on the window object for usage by cypress automated tests.
     * Allows setting of a single functionality switch.
     * @param switchName    One of the valid switch names from FunctionalitySwitches
     * @param value         boolean
     */
    const setSwitch = (switchName: string, value: boolean): void => {
        const updatedSwitches = _.cloneDeep(appContext.functionalitySwitches);
        updatedSwitches[switchName] = value;
        appContext.setFunctionalitySwitches(updatedSwitches);
    };

    /**
     * Add functions to the window object in order to make them globally available.  Initial use case is to make
     * functions available to be called by cypress automated tests.
     */
    const makeFunctionsAvailableToWindowObject = () => {

        // Sets up window.setSwitch to allow setting of a single switch.
        // Example usage:
        //      window.setSwitch('showProjectCalculationToasts', false)
        window.setSwitch = setSwitch;

        // Sets up window.setFunctionalitySwitches to allow setting of all switches at once
        // Example usage:
        //      window.setFunctionalitySwitches({
        //          showProjectCalculationToasts: false
        //          showProjectSaveToasts: false
        //          ...etc   specify ALL switches from FunctionalitySwitches
        //      })
        window.setFunctionalitySwitches = appContext.setFunctionalitySwitches;
    };

    const [cookies, setCookie, removeCookie] = useCookies();

    const signinHandler = (email: string, password: string) => {
        setLoading(true);
        setError({ message: null });
        Auth.login(email, password)
            .then(person => {
                setLoading(false);

                const afterLogin = (loggedInPerson: Person) => {
                    appContext.setUser(loggedInPerson);
                    const hasOrganizations = loggedInPerson.organizations.length > 0;

                    // we are running into 4k cookie size limit and these unused _organizationsMap can safely be deleted from the cookie
                    // if the data stored is over 4k the cookie is not persisted
                    delete loggedInPerson._organizationsMap;

                    // set user into the local cookie, we will use this to determine if we should log back int
                    setCookie('local-user-data', loggedInPerson, {
                        path: '/',
                        maxAge: 60 * 60 * 24
                    });

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
                    appContext.tabNavigationContext.tab_navigation_items.push(newTabNavigationItem);
                    appContext.setTabNavigationContext(appContext.tabNavigationContext);
                    appContext.setPrevTabName('migration');

                    if (!redirect) {
                        // only set up the message queue if the user belongs to an organization
                        if (hasOrganizations) {
                            setupMessageQueue().then();
                        }
                        makeFunctionsAvailableToWindowObject();
                        doRoute(router, target, true);
                    } else {
                        // redirect to constellation ui if redirect query string is provided
                        document.location.href = redirect as string;
                    }
                };

                person.updateMaps();

                const orgsMap = person._organizationsMap;

                const cookieActiveOrg = cookies['local-user-active-org-data'];

                // if we saved our last active org choice in the cookie, then use it if that org id is valid
                if (cookieActiveOrg && orgsMap && orgsMap[cookieActiveOrg.id]) {
                    Auth.setActiveOrg(cookieActiveOrg.id).then(res => {
                        if (res && res.id && res.name) {

                            appContext.setActiveOrganizationId(res.id);

                            // @ts-ignore
                            person.activeOrganizationId = res.id;

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

                            log('[SignIn] signinHandler, setActiveOrg.OK:', res);
                        } else {
                            log('[SignIn] signinHandler, setActiveOrg.OK but got malformed answer:', res);
                        }

                        afterLogin(person);
                    }).catch(() => {
                        // the active org id was not valid so delete it
                        removeCookie('local-user-active-org-data', {
                            path: '/'
                        });

                        afterLogin(person);
                    });
                }
                else {
                    // the active org id was not valid so delete it
                    removeCookie('local-user-active-org-data', {
                        path: '/'
                    });

                    afterLogin(person);
                }
            })
            .catch(err => {
                removeCookie('local-user-data');
                setLoading(false);
                setError(err);
            });
    };

    const formik = useFormik({
        initialValues: {
            email: '',
            password: '',
        },
        onSubmit: values => {
            signinHandler(values.email, values.password);
        },
    });

    return (
        <LandingPage>
            {/* hiding sign up link until user management functionality is completed */}
            {/* <Link
                data-cy="signUp"
                href={basePath + '/signup' + (!redirect ? '' : '?redirect=' + redirect)}
                className={clsx(classes.signup, classes.loginPageLink, classes.underline)}
            >
                Sign Up
            </Link> */}
            <Container component="main" maxWidth="xs">
                <div className={classes.paper}>
                    <VirtanaLogo/>
                    <form
                        data-cy="signInForm"
                        className={classes.form}
                        onSubmit={formik.handleSubmit}
                    >
                        <PromoField
                            className={classes.field}
                            dataCy="signInEmail"
                            required
                            fullWidth
                            id="email"
                            placeholder="Work Email"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            onChange={formik.handleChange}
                            value={formik.values.email}
                            errors={error.message ? 1 : 0}
                            /* to bypass the react bug with boolean props
                                https://stackoverflow.com/questions/49784294/warning-received-false-for-a-non-boolean-attribute-how-do-i-pass-a-boolean-f */
                        />
                        <PromoField
                            className={classes.field}
                            data-cy="signInPassword"
                            required
                            fullWidth
                            name="password"
                            placeholder="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            onChange={formik.handleChange}
                            value={formik.values.password}
                            errors={error.message ? 1 : 0}
                        />
                        {/* <FormControlLabel
                            control={<Checkbox value="remember" color="primary" />}
                            label="Remember me"
                        /> */}
                        <div className={classes.wrapper}>
                            <PromoButton
                                data-cy="signInSubmit"
                                type="submit"
                                disabled={loading}
                                fullWidth
                                variant="contained"
                                color="primary"
                                className={classes.submit}
                            >
                                Log In
                            </PromoButton>
                            {loading && <CircularProgress size={24} className={classes.buttonProgress}/>}
                        </div>
                        <Typography className={classes.wrapper}>
                            <Link
                                href={basePath + '/reset-password' + (!redirect ? '' : '?redirect=' + redirect)}
                                className={clsx(classes.loginPageLink, classes.underline)}
                            >
                                Forgot your password?
                            </Link>
                        </Typography>
                        {
                            !!error.message &&
                            <Grid
                                data-cy="errorMessage"
                                container
                                direction="row"
                                justify="center"
                                alignItems="center"
                                style={{ marginTop: 40 }}
                            >
                                <Message warning={true}>{error?.message ?? ''}</Message>
                            </Grid>
                        }
                    </form>
                    {process.env.NEXT_PUBLIC_DEBUG_FLAG === 'true' && <h6>[ DEBUG mode is ON ]</h6>}
                </div>
            </Container>
        </LandingPage>
    );
};

export default SigninPage;
