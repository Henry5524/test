import React from 'react';
import { Container, Grid } from '@material-ui/core';
import { Page } from '../../components/layout';
import { getNavigationMenu } from '../../utils/navigation';

const NAV_MENU = getNavigationMenu('dataCenterCapacity');

export default function DataCenterCapacityDashboard() {

    return (
        <Page tab="dataCenterCapacity" navMenu={NAV_MENU}>
            <Container>
                <Grid
                    container
                    direction="column"
                    justify="center"
                    alignItems="center"
                >
                    <h1>Data Center Dashboard</h1>
                </Grid>
            </Container>
        </Page>
    );
}
