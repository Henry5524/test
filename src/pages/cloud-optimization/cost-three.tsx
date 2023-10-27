import React from 'react';
import { Container, Grid } from '@material-ui/core';
import { Page } from '../../components/layout';
import { getEmptyNavigationMenu } from '../../utils/navigation';

const NAV_MENU = getEmptyNavigationMenu('cloudOptimization');

export default function CostThree() {

    return (
        <Page tab="cloudOptimization" navMenu={NAV_MENU}>
            <Container>
                <Grid
                    container
                    direction="column"
                    justify="center"
                    alignItems="center"
                >
                    <h1>Cost Three</h1>
                    <p>This is a leaf node that has DOES NOT HAVE a left navigation menu.
                    </p>
                </Grid>
            </Container>
        </Page>
    );
}