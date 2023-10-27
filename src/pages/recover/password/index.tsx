import { LandingPage, Message, PromoButton, PromoField, VirtanaLogo } from '@components';

import { CircularProgress, Container, Link, makeStyles, Typography } from '@material-ui/core';
import { Auth } from '@services';
import { colors, customStyles, text } from '@styles';
import clsx from 'clsx';
import { useFormik } from 'formik';
import { useRouter } from 'next/router';
import React, { useState } from 'react';


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

export const ResetPasswordConfirmPage: React.FunctionComponent<{}> = () => {
    const classes = useStyles();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<{
        message: string | null;
    }>({ message: null });
    const [complete, setComplete] = useState(false);
    const router = useRouter();
    const { query: { userName, code }, basePath } = router;

    const resetPasswordConfirmHandler = (password: string) => {
        setLoading(true);
        setError({ message: null });
        Auth.resetUserPasswordConfirm(userName as string, code as string, password)
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
            password: '',
        },
        onSubmit: values => {
            resetPasswordConfirmHandler(values.password);
        },
    });

    return (
        <LandingPage>
            <Typography className={classes.signup}>
                <Link
                    data-cy="signUp"
                    href={basePath + '/signin'}
                    className={clsx(classes.loginPageLink, classes.underline)}
                >
                    Log in
                </Link>
                {/*hiding sign up link until user management functionality is completed*/}
                {/*|*/}
                {/*<Link*/}
                {/*    data-cy="signUp"*/}
                {/*    href={basePath + '/signup'}*/}
                {/*    className={clsx(classes.loginPageLink, classes.underline)}*/}
                {/*>*/}
                {/*    Sign Up*/}
                {/*</Link>*/}
            </Typography>
            <Container component="main" maxWidth="xs">
                {
                    !complete &&
                    <div className={classes.paper}>
                        <VirtanaLogo/>
                        <div className={classes.wrapper}>
                            <Typography className={classes.subTitle}>Create New Password</Typography>
                            <Typography style={{ fontSize: 14 }}>Email: <b>{userName}</b></Typography>
                        </div>
                        <form
                            data-cy="resetPasswordConfirmForm"
                            className={classes.form}
                            onSubmit={formik.handleSubmit}
                        >
                            <PromoField
                                className={classes.field}
                                dataCy="resetPasswordConfirmPassword"
                                required
                                fullWidth
                                id="password"
                                placeholder="Create New Password"
                                name="password"
                                type="password"
                                autoFocus
                                onChange={formik.handleChange}
                                value={formik.values.password}
                                errors={error.message ? 1 : 0}
                            />
                            <div className={classes.wrapper}>
                                <PromoButton
                                    dataCy="resetPasswordConfirmSubmit"
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
                            {
                                !!error.message &&
                                <Message warning={true}>
                                    <div style={{ textAlign: 'left' }} dangerouslySetInnerHTML={{ __html: (error.message ? error.message.replace(/\n/gi, '<br/>') : '') }}/>
                                </Message>
                            }
                        </form>
                        {process.env.NEXT_PUBLIC_DEBUG_FLAG === 'true' && <h6>[ DEBUG mode is ON ]</h6>}
                    </div>
                }
                {
                    complete &&
                    <div className={classes.complete}>
                        <VirtanaLogo noText={true}/>
                        <Typography className={classes.subTitle} style={{ fontSize: 27, marginTop: 24 }}>Success</Typography>
                        <div>
                            <Typography className={clsx(classes.subTitle, classes.subTitle2)}>
                                Your password has been changed.
                            </Typography>
                        </div>
                        <PromoButton
                            type="button"
                            fullWidth
                            variant="contained"
                            color="primary"
                            className={classes.submit}
                            href={basePath + '/signin'}
                        >
                            Log In
                        </PromoButton>
                    </div>
                }
            </Container>
        </LandingPage>
    );
};

export default ResetPasswordConfirmPage;
