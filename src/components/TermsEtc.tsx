import { makeStyles, Typography } from '@material-ui/core';
import Link from '@material-ui/core/Link';
import clsx from 'clsx';
import React from 'react';
import { useRouter } from 'next/router';
import { customStyles } from '../styles/customStyles';

const useStyles = makeStyles(() => ({
    terms: {
        position: 'fixed',
        bottom: 14,
        right: 160,
        fontSize: 14,
        color: 'white'
    },
    Twitter: {
        width: 18,
        height: 18,
        objectFit: 'contain'
    },
    Linkedin: {
        width: 18,
        height: 18,
        objectFit: 'contain'
    },
    loginPageLink: customStyles.loginPageLink,
    underline: customStyles.underline,
}));

export const TermsEtc = () => {
    const classes = useStyles();
    const { basePath } = useRouter();

    return (
        <Typography variant="body2" align="center" className={classes.terms}>
            <Link
                href="https://www.virtana.com/wp-content/uploads/2020/11/Product-and-Services-Agreement-Direct-Purchases-Only-10-2020.pdf"
                target="_blank"
                className={clsx(classes.loginPageLink, classes.underline)}
                style={{ marginRight: 12 }}
            >
                Terms of the Products &amp; Services Agreement
            </Link>
            |
            {/* <Link
                href={basePath + '/support' + (!redirect ? '' : '?redirect=' + redirect)}
                className={clsx(classes.loginPageLink, classes.underline)}
                style={{marginLeft: 12}}
            >
                Support
            </Link> */}
            <Link
                href="https://www.linkedin.com/company/virtanacorps/"
                target="_blank"
                className={classes.loginPageLink}
                style={{ marginLeft: 12 }}
            >
                <img alt="Linkedin" src={`${basePath}/images/Linkedin.svg`} className={classes.Linkedin} />
            </Link>
            <Link
                href="https://twitter.com/virtanacorp"
                target="_blank"
                className={classes.loginPageLink}
                style={{ marginLeft: 12 }}
            >
                <img alt="Twitter" src={`${basePath}/images/Twitter.svg`} className={classes.Twitter} />
            </Link>
        </Typography>
    );
};
