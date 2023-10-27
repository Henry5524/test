import React from 'react';
import { Container, Grid } from '@material-ui/core';
import { Page } from '../../components/layout';
import { getNavigationMenu } from '../../utils/navigation';

const NAV_MENU = getNavigationMenu('cloudOptimization');

export default function CloudOptimizationDashboard() {

    return (
        <Page tab="cloudOptimization" navMenu={NAV_MENU}>
            <Container>
                <Grid
                    container
                    direction="column"
                    justify="center"
                    alignItems="center"
                >
                    <h1>Cloud Cost Dashboard</h1>
                </Grid>
            </Container>
        </Page>
    );
}
