import React from 'react';
import { Grid, makeStyles } from '@material-ui/core';
import { useRouter } from 'next/router';
import { Page } from '../../components/layout';
import { getEmptyNavigationMenu } from '../../utils/navigation';

const NAV_MENU = getEmptyNavigationMenu('executiveSummary');

const useStyles = makeStyles(() => ({
    root: {
        flexGrow: 1,
    },
    emptyDashboardImage: {
        width: 120,
        height: 120,
        opacity: 0.8
    },
    emptyDashboardText: {
        fontFamily: 'Muli',
        fontSize: 22,
        fontWeight: 300,
        fontStretch: 'normal',
        fontStyle: 'normal',
        lineHeight: 1.4,
        letterSpacing: 'normal',
        color: '#808d9d',
        textAlign: 'center'
    },
    emptyDashboardContainer: {
        height: '100%',
        margin: '20px 20px 0 20px',
        backgroundColor: '#f8f9fc',
        textAlign: 'center',
        alignItems: 'center',
        verticalAlign: 'middle',
        justifyContent: 'center',
        display: 'flex'
    }
}));

export default function ExecutiveSummaryDashboard() {

    return (
        <Page tab="executiveSummary" navMenu={NAV_MENU}>
            <EmptyDashboard/>
        </Page>
    );
};

const EmptyDashboard = () => {
    const classes = useStyles();
    const { basePath } = useRouter();
    return (
        <>
            <div className={classes.emptyDashboardContainer}>
                <Grid container style={{ marginTop: '10%' }}>
                    <Grid item xs={12}>
                        <img
                            data-cy="emptyDashboard"
                            src={`${basePath}/images/nav-migration.svg`}
                            alt="no dashboard"
                            className={classes.emptyDashboardImage}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <span className={classes.emptyDashboardText}>
                            Summary coming soon!
                        </span>
                    </Grid>
                </Grid>
            </div>
        </>
    );
};
