import React, { ChangeEvent, FormEvent, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { normalizeSync } from 'normalize-diacritics';
import _ from 'lodash';
import {
    CircularProgress, Container, Grid, Link, makeStyles,
    Typography, Button, TextField, FormControlLabel, Checkbox,
} from '@material-ui/core';

import { Message, Page, VcioIcon, VirtanaLogo } from '@components';
import { Auth } from '@services';
import { colors, customStyles, text } from '@styles';
import { AppContext } from '@context';
import { useCookies } from 'react-cookie';
import { Autocomplete } from '@material-ui/lab';
import { AssumableUser } from '@models/accounts/assumable-user';
import { getMatches, getParts, log, sortStringsBy } from '@utils';
import { mutate } from 'swr';
import { produce } from 'immer';

const useStyles = makeStyles((theme) => ({
    logoutLink: {
        ...customStyles.loginPageLink,
        color: colors.green_600,
        cursor: 'pointer',
    },
    paper: {
        ...text.regularText,
        position: 'absolute',
        left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'transparent',
        color: colors.black_100,
        textAlign: 'center'
    },
    wrapper: {
        margin: theme.spacing(2),
        position: 'relative',
    },
    form: {
        width: 515,
        height: 262,
        margin: 'auto',
        marginTop: theme.spacing(10),
        padding: theme.spacing(10),
        border: '1px solid ' + colors.blue_gray_200,
        borderRadius: 4,
    },
    submit: {
        margin: theme.spacing(6, 0, 0),
    },
    buttonProgress: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -12,
    },
    title: {
        fontFamily: 'Muli',
        fontSize: 27,
        fontWeight: 600,
        fontStretch: 'normal',
        fontStyle: 'normal',
        lineHeight: 1.4,
        letterSpacing: 'normal',
        marginBottom: 43
    },
    signedInAs: {
        '& > span': {
            color: colors.blue_gray_500,
        },
        '& > *': {
            marginLeft: theme.spacing(1),
            marginRight: theme.spacing(1),
        },
    },
    fieldTitle: {
        textAlign: 'left',
        marginBottom: theme.spacing(1),
    },
    info: {
        ...text.regularText,
        color: colors.blue_gray_300,
        width: 350,
        margin: '32px auto 0 auto',
        padding: '14px 34px 19px 4px',
        borderTop: '1px solid ' + colors.blue_gray_700,
        borderBottom: '1px solid ' + colors.blue_gray_700,
        textAlign: 'left'
    },
    autocompletePaper: {
        width: 433,
        marginLeft: -1,
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
        borderColor: colors.blue_gray_200
    },
    autocompleteListbox: {
        maxHeight: 230,
    },
    checkbox: {
        fontSize: 13,
    },
    userLine: {
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        fontSize: 14,
    }
}));

export const AssumeUserPage = () => {
    const classes = useStyles();
    const appContext = useContext(AppContext);
    const [working, setWorking] = useState(false);
    const [error, setError] = useState<{ message: string } | null>(null);
    const [, setCookie, removeCookie] = useCookies();
    const router = useRouter();

    const [granted, setGranted] = useState(false);
    const handleGrantedChange = (event: ChangeEvent<HTMLInputElement>) => {
        setGranted(event.target.checked);
    };

    const [selected, setSelected] = useState<AssumableUser | null>(null);
    const handleSelectedChange = (_event: ChangeEvent<{}>, value: AssumableUser | null) => {
        setSelected(value);
    };

    const [open, setOpen] = useState(false);
    const [users, setUsers] = useState<AssumableUser[]>([]);
    const loading = (!users || users.length === 0) && !error;

    const collectUsers = useCallback((offset: number, au: AssumableUser[], active: boolean) => {
        Auth.getAssumableUsers({ offset })
            .then(answer => {
                if (active) {
                    if (answer.assumableUsers && answer.pagination && answer.pagination.offset + answer.pagination.count < answer.pagination.total) {
                        au.push(...answer.assumableUsers);
                        collectUsers(answer.pagination.offset + answer.pagination.count, au, active);
                    }
                    else if (answer.assumableUsers) {
                        au.push(...answer.assumableUsers);
                        setUsers(au.sort(sortStringsBy('name')));
                    }
                    else {
                        setUsers([]);
                        setError({ message: 'Error reading the list of assumable users from the server.' });
                    }
                }
            })
            .catch(err => {
                setError(err);
                setUsers([]);
                setOpen(false);
            });
    }, []);

    useEffect(() => {
        let active = true;
        if (!loading) {
            return undefined;
        }
        collectUsers(0, [], active);
        return () => {
            active = false;
        };
    }, [loading, setOpen, users, collectUsers]);

    const userName = appContext && appContext.user ? appContext.user.name : '';
    const userEmail = appContext && appContext.user ? appContext.user.email : '';

    const assumeUserHandler = (event: FormEvent<HTMLFormElement>) => {
        log('[AssumeUserPage] assumeUserHandler, user:', selected);
        event.preventDefault();
        setWorking(true);
        if (selected?.id) {
            setError(null);

            // since we are assuming a user let's clear out our stored active org cookie
            removeCookie('local-user-active-org-data', {
                path: '/'
            });

            Auth.assumeUser(selected.id)
                .then(assumedUser => {
                    appContext.setUser(assumedUser);

                    appContext.setActiveOrganizationId(assumedUser.activeOrganizationId);

                    // we are running into 4k cookie size limit and these unused _organizationsMap can safely be deleted from the cookie
                    // if the data stored is over 4k the cookie is not persisted
                    delete assumedUser._organizationsMap;

                    setCookie('local-user-data', assumedUser, {
                        path: '/',
                        maxAge: 60 * 60 * 24
                    });
                    setWorking(false);

                    // lets delete all of the project from cache
                    mutate('getProjects', produce(projectsDataToMutate => {
                        _.remove(projectsDataToMutate, () => true);
                    }), false);

                    router.push('/migration/dashboard');
                })
                .catch(err => {
                    setWorking(false);
                    setError(err);
                });
        }
        else {
            setError({ message: 'Internal error, selected user does not have an ID' });
        }
    };

    const handleLogout = () => {
        removeCookie('local-user-data', {
            path: '/'
        });
        router.push('/signin');
    };

    return (
        <Page>
            <Container component="main" maxWidth="md">
                <div className={classes.paper}>
                    <VirtanaLogo noText /><br />
                    <div className={classes.wrapper}>
                        <Typography className={classes.title} data-cy="assumeUserHeader">Assume User</Typography>
                        <Typography className={classes.signedInAs} style={{ fontSize: 14 }} data-cy="assumeUserDetails">
                            You're signed in as
                            <b>{userName}</b>
                            <span>({userEmail})</span>
                            <Link onClick={handleLogout} className={classes.logoutLink} data-cy="assumeUserLogOut">Log Out</Link>
                        </Typography>
                    </div>
                    <form
                        data-cy="assumeUserForm"
                        className={classes.form}
                        onSubmit={assumeUserHandler}
                    >
                        <div className={classes.fieldTitle}>Select a user to access their account.</div>
                        <Autocomplete
                            classes={{
                                paper: classes.autocompletePaper,
                                listbox: classes.autocompleteListbox,
                            }}
                            open={open}
                            onOpen={() => { setOpen(true); }}
                            onClose={() => { setOpen(false); }}
                            getOptionSelected={(option, value) => option.name === value.name}
                            getOptionLabel={(option) => option.name + ' - ' + option.email}
                            options={users}
                            loading={loading && !error}
                            // renderInput={(params) => <TextField {...params} placeholder="User" variant="outlined"/>}
                            size="small"
                            openOnFocus={true}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="outlined"
                                    data-cy="userSelectionTextField"
                                    InputProps={{
                                        ...params.InputProps,
                                        startAdornment: (
                                            <VcioIcon
                                                style={{ marginLeft: 8 }}
                                                vcio={open ? 'general-search' : 'um-user'}
                                                iconColor={open || selected ? colors.green_500 : colors.blue_gray_300}
                                            />
                                        ),
                                        endAdornment: (
                                            <>
                                                {loading && !error && open ? <CircularProgress color="inherit" size={20} /> : null}
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                            renderOption={(option, { inputValue }) => {
                                const matchesName = getMatches(normalizeSync(option.name), normalizeSync(inputValue));
                                const partsName = getParts(option.name, matchesName);
                                const matchesEmail = getMatches(normalizeSync(option.email), normalizeSync(inputValue));
                                const partsEmail = getParts(option.email, matchesEmail);
                                return (
                                    <div className={classes.userLine}>
                                        {partsName.map((part, index) => (
                                            // eslint-disable-next-line react/no-array-index-key
                                            <span key={'name-' + index} style={{ color: part.match ? colors.amber_600 : colors.black_100 }}>
                                                {part.part}
                                            </span>
                                        ))}
                                        <span key="divider" style={{ color: colors.blue_gray_500 }}> - </span>
                                        {partsEmail.map((part, index) => (
                                            // eslint-disable-next-line react/no-array-index-key
                                            <span key={'email-' + index} style={{ color: part.match ? colors.amber_600 : colors.blue_gray_500 }}>
                                                {part.part}
                                            </span>
                                        ))}
                                    </div>
                                );
                            }}
                            autoHighlight
                            selectOnFocus
                            onChange={handleSelectedChange}
                        />
                        <FormControlLabel
                            className={classes.checkbox}
                            data-cy="assumeUserCheckbox"
                            control={<Checkbox checked={granted} onChange={handleGrantedChange} />}
                            label="I have been granted permission to assume this user"
                        />
                        <div className={classes.wrapper}>
                            <Button
                                type="submit"
                                data-cy="assumeUserSubmitButton"
                                disabled={working || !granted || !selected}
                                className={classes.submit}
                                size="large"
                            >
                                Assume User
                            </Button>
                            {working && <CircularProgress size={24} className={classes.buttonProgress}/>}
                        </div>
                    </form>
                    {
                        !!error?.message &&
                        <Grid
                            container
                            direction="row"
                            justify="center"
                            alignItems="center"
                            style={{ marginTop: 40 }}
                        >
                            <Message warning={true}>{error?.message ?? ''}</Message>
                        </Grid>
                    }
                </div>
            </Container>
        </Page>
    );
};

export default AssumeUserPage;
