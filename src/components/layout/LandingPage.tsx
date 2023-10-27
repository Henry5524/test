import { Container, Grid, makeStyles } from '@material-ui/core';
import React from 'react';
import { useRouter } from 'next/router';
import { Copyright } from '../Copyright';
import { TermsEtc } from '../TermsEtc';

const useStyles = makeStyles({
    background: {
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        position: 'fixed',
        bottom: 0,
    },
    pattern: {
        float: 'right',
        width: 480,
        height: 900,
        objectFit: 'contain'
    },
});

export const LandingPage: React.FunctionComponent = (props) => {
    const { children } = props;
    const classes = useStyles();
    const { basePath } = useRouter();

    return (
        <Container
            data-cy="landingPage"
            className={classes.background}
            style={{ backgroundImage: `url("${basePath}/images/virtana_screensaver_2_2080x2016__ 1.png")` }}
        >
            <img src={`${basePath}/images/pattern.svg`} alt='' className={classes.pattern}/>
            {children}
            <Grid
                container
                direction="row"
                justify="center"
                alignItems="center"
            >
                <Copyright/>
                <TermsEtc/>
            </Grid>
        </Container>
    );
};
