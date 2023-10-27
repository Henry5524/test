import React, { useState } from 'react';
import { useRouter } from 'next/router';

import {
    CircularProgress, Container, Grid, Link, makeStyles, Typography
} from '@material-ui/core';
import { useFormik } from 'formik';
import clsx from 'clsx';

import { Message, PromoButton, PromoField, LandingPage, VirtanaLogo } from '@components';
import { Auth } from '@services';
import { customStyles, colors } from '@styles';

const userObject = {
    firstname: '',
    lastname: '',
    email: '',
    company: '',
    password: ''
};

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
        marginTop: theme.spacing(2),
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
    relative: {
        position: 'relative'
    },
    field: {
        width: 384
    },
    field2: {
        width: 184
    },
}));

export const SignupPage = () => {
    const classes = useStyles();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState({ message: null });
    const router = useRouter();
    const { query: { redirect, token }, basePath } = useRouter();

    const invitationToken = token || '';

    const signupHandler = (values: typeof userObject) => {
        setLoading(true);
        setError({ message: null });
        Auth.signup(values.email, values.password, values.firstname + ' ' + values.lastname, invitationToken)
            .then(_person => {
                setLoading(false);
                router.replace('/signin' + (!redirect ? '' : '?redirect=' + redirect));
            })
            .catch(err => {
                setLoading(false);
                if (err?.message && typeof err.message == 'string' && (err.message as string).startsWith('your password does not meet')) {
                    err.message = (
                        <>
                            <p>{err.message}</p>
                            <div style={{ textAlign: 'left' }}>
                                Rules:
                                <dd>
                                    <li>12 characters minimum length</li>
                                    <li>Must include a number, symbol, lowercase, and uppercase</li>
                                    <li>Should not include your email address, first name, or last name</li>
                                </dd>
                            </div>
                        </>
                    );
                }
                setError(err);
            });
    };

    const formik = useFormik({
        initialValues: userObject,
        onSubmit: values => {
            signupHandler(values);
        },
    });

    return (
        <LandingPage>
            <div className={classes.relative}>
                <Grid
                    container
                    className={classes.signup}
                    justify="flex-end"
                >
                    <Typography className={classes.loginPageLink} data-cy="alreadyAccount" >Already have an account?</Typography>
                    <Link
                        data-cy="logIn"
                        href={basePath + '/signin' + (!redirect ? '' : '?redirect=' + redirect)}
                        style={{ marginLeft: 12 }}
                        className={clsx(classes.loginPageLink, classes.underline)}
                    >
                        Log in
                    </Link>
                </Grid>
            </div>
            <Container component="main" maxWidth="xs">
                <div className={classes.paper}>
                    <VirtanaLogo/>
                    <form className={classes.form} onSubmit={formik.handleSubmit}>
                        <Grid container spacing={1}>
                            <Grid item xs={6}>
                                <PromoField
                                    className={classes.field2}
                                    dataCy="signUpFirstName"
                                    required
                                    id="firstname"
                                    placeholder="First Name"
                                    name="firstname"
                                    autoComplete="firstname"
                                    autoFocus
                                    onChange={formik.handleChange}
                                    value={formik.values.firstname}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <PromoField
                                    className={classes.field2}
                                    dataCy="signUpLastName"
                                    required
                                    id="lastname"
                                    placeholder="Last Name"
                                    name="lastname"
                                    autoComplete="lastname"
                                    onChange={formik.handleChange}
                                    value={formik.values.lastname}
                                />
                            </Grid>
                        </Grid>
                        <PromoField
                            className={classes.field}
                            dataCy="signUpEmail"
                            required
                            fullWidth
                            id="workemail"
                            placeholder="Work Email"
                            name="email"
                            autoComplete="email"
                            onChange={formik.handleChange}
                            value={formik.values.email}
                        />
                        <PromoField
                            className={classes.field}
                            dataCy="signUpPassword"
                            required
                            fullWidth
                            name="password"
                            placeholder="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            onChange={formik.handleChange}
                            value={formik.values.password}
                        />
                        <div className={classes.wrapper}>
                            <PromoButton
                                dataCy="signUpSubmit"
                                type="submit"
                                disabled={loading}
                                fullWidth
                                variant="contained"
                                color="primary"
                                className={classes.submit}
                            >
                                Sign Up!
                            </PromoButton>
                            {loading && <CircularProgress size={24} className={classes.buttonProgress}/>}
                        </div>
                        {
                            !!error.message &&
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
                        <Grid
                            container
                            direction="row"
                            justify="center"
                            alignItems="center"
                            style={{ marginTop: 40 }}
                        >
                            <Message success={true} dark={true}>
                                By creating a Virtana account, you are agreeing to the
                                &nbsp;
                                <a
                                    href="https://www.virtana.com/wp-content/uploads/2020/11/Product-and-Services-Agreement-Direct-Purchases-Only-10-2020.pdf"
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ color: colors.green_500 }}
                                >
                                    Terms of the Products &amp; Services Agreement (Direct Purchases Only) located here.
                                </a>
                                <br />
                                If you do not agree to these terms, you may not proceed with creating an account.
                            </Message>
                        </Grid>
                    </form>

                </div>
            </Container>
        </LandingPage>
    );
};

export default SignupPage;
