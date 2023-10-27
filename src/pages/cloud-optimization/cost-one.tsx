import React from 'react';
import { Container, Grid } from '@material-ui/core';
import { Page } from '../../components/layout';
import { getNavigationMenu } from '../../utils/navigation';

const NAV_MENU = getNavigationMenu('cloudOptimization');

export default function CostOne() {

    return (
        <Page tab="cloudOptimization" navMenu={NAV_MENU}>
            <Container>
                <Grid
                    container
                    direction="column"
                    justify="center"
                    alignItems="center"
                >
                    <h1>Cost One</h1>
                    <p>This is a leaf node that
                        does NOT redefine the navigation.
                    </p>
                </Grid>
            </Container>
        </Page>
    );
}
