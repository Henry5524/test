import React from 'react';
import { Container, Grid } from '@material-ui/core';
import { Page } from '../../components/layout';
import { getNavigationMenu } from '../../utils/navigation';

const NAV_MENU = getNavigationMenu('cloudOptimization', 'cost-four');

export default function CostFive() {

    return (
        <Page tab="cloudOptimization" navMenu={NAV_MENU}>
            <Container>
                <Grid
                    container
                    direction="column"
                    justify="center"
                    alignItems="center"
                >
                    <h1>Cost Five</h1>
                    <p>This is a leaf node that
                        does NOT redefine the navigation.
                    </p>
                </Grid>
            </Container>
        </Page>
    );
}
