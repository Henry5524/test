import React, { useState } from 'react';
import { useRouter } from 'next/router';

import {
    CircularProgress, Container, Grid, Link, makeStyles, Typography
} from '@material-ui/core';
import { useFormik } from 'formik';
import clsx from 'clsx';

import { Message, PromoButton, PromoField, LandingPage, VirtanaLogo, VcioIcon } from '@components';
import { Auth } from '@services';
import { customStyles, colors, text } from '@styles';


const useStyles = makeStyles((theme) => ({
    loginPageLink: customStyles.loginPageLink,
    underline: customStyles.underline,
    paper: {
        position: 'absolute',
        left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'transparent',
        color: colors.white_100,
        textAlign: 'center'
    },
    complete: {
        position: 'absolute',
        left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 540,
        height: 512,
        opacity: 0.9,
        backgroundColor: colors.blue_gray_800,
        color: colors.white_100,
        textAlign: 'center',
        paddingTop: 114,
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
        color: colors.white_100,
        '& > a:first-child:not(last-child)': {
            marginRight: 12,
        },
        '& > a:last-child:not(first-child)': {
            marginLeft: 12,
        }
    },
    subTitle: {
        fontFamily: 'Muli',
        fontSize: 25,
        fontWeight: 600,
        fontStretch: 'normal',
        fontStyle: 'normal',
        lineHeight: 1.4,
        letterSpacing: 'normal',
        color: colors.white_80,
        marginBottom: 43
    },
    subTitle2: {
        fontSize: 19,
        marginTop: 51,
        margin: '51px auto 0 auto',
        width: 378,
        textAlign: 'left'
    },
    field: {
        width: 384
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
    }
}));

export const ResetPasswordPage = () => {
    const classes = useStyles();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState({ message: null });
    const [complete, setComplete] = useState(false);
    const { query: { redirect }, basePath } = useRouter();

    const resetPasswordHandler = (email: string) => {
        setLoading(true);
        setError({ message: null });
        Auth.resetUserPassword(email)
            .then(() => {
                setLoading(false);
                setComplete(true);
            })
            .catch(err => {
                setLoading(false);
                setError(err);
            });
    };

    const formik = useFormik({
        initialValues: {
            email: '',
        },
        onSubmit: values => {
            resetPasswordHandler(values.email);
        },
    });

    return (
        <LandingPage>
            <Typography className={classes.signup}>
                {
                    complete &&
                    <>
                        <Link
                            data-cy="signUp"
                            href={basePath + '/signin' + (!redirect ? '' : '?redirect=' + redirect)}
                            className={clsx(classes.loginPageLink, classes.underline)}
                        >
                            Log in
                        </Link>
                        {/*|*/}
                    </>
                }
                {/*hiding sign up link until user management functionality is completed*/}
                {/*<Link*/}
                {/*    data-cy="signUp"*/}
                {/*    href={'signup' + (!redirect ? '' : '?redirect=' + redirect)}*/}
                {/*    className={clsx(classes.loginPageLink, classes.underline)}*/}
                {/*>*/}
                {/*    Sign Up*/}
                {/*</Link>*/}
            </Typography>
            <Container component="main" maxWidth="xs">
                {
                    !complete &&
                    <div className={classes.paper}>
                        <VirtanaLogo />
                        <div className={classes.wrapper}>
                            <Typography className={classes.subTitle}>Password Recovery</Typography>
                            <Typography style={{ fontSize: 14 }}>Enter the email you're using for your account.</Typography>
                        </div>
                        <form
                            data-cy="resetPasswordForm"
                            className={classes.form}
                            onSubmit={formik.handleSubmit}
                        >
                            <PromoField
                                className={classes.field}
                                dataCy="resetPasswordEmail"
                                required
                                fullWidth
                                id="email"
                                placeholder="Email"
                                name="email"
                                autoComplete="email"
                                autoFocus
                                onChange={formik.handleChange}
                                value={formik.values.email}
                                errors={error.message ? 1 : 0}
                            />
                            <div className={classes.wrapper}>
                                <PromoButton
                                    dataCy="resetPasswordSubmit"
                                    type="submit"
                                    disabled={loading}
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    className={classes.submit}
                                >
                                    Continue
                                </PromoButton>
                                {loading && <CircularProgress size={24} className={classes.buttonProgress}/>}
                            </div>
                            <Typography className={classes.wrapper}>
                                <Link
                                    href="signin"
                                    className={clsx(classes.loginPageLink, classes.underline)}
                                >
                                    Back to Log in
                                </Link>
                            </Typography>
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
                        </form>
                        {process.env.NEXT_PUBLIC_DEBUG_FLAG === 'true' && <h6>[ DEBUG mode is ON ]</h6>}
                    </div>
                }
                {
                    complete &&
                    <div className={classes.complete}>
                        <VirtanaLogo noText={true} />
                        <Typography className={classes.subTitle} style={{ fontSize: 27, marginTop: 24 }}>Thank You!</Typography>
                        <div>
                            <Typography className={clsx(classes.subTitle, classes.subTitle2)}>
                                We've sent password reset instructions<br />to your email address.
                            </Typography>
                        </div>
                        <Grid
                            className={classes.info}
                            container
                            direction="row"
                            justify="center"
                            alignItems="center"
                            style={{ marginTop: 32 }}
                        >
                            <Grid item xs={2}>
                                <VcioIcon vcio="general-info-circle" style={{ fontSize: 36, color: colors.blue_gray_700, width: 'auto', paddingRight: 8 }} />
                            </Grid>
                            <Grid item xs={10}>
                                <Typography style={{ fontSize: 14, paddingLeft: 8 }}>
                                    If you do not get an email within a few minutes, check that the submitted address is correct
                                </Typography>
                            </Grid>
                        </Grid>
                    </div>
                }
            </Container>
        </LandingPage>
    );
};

export default ResetPasswordPage;
