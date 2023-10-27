import { Container, Grid } from '@material-ui/core';
import Link from '@material-ui/core/Link';
import React from 'react';
import { useRouter } from 'next/router';

const About = () => {
    const { query: { redirect }, basePath } = useRouter();

    return (
        <Container>
            <Grid
                container
                direction="column"
                justify="center"
                alignItems="center"
            >
                <h1>About</h1>
                <p>This is the about page</p>
                <p>
                    <Link href={basePath + '/signin' + (!redirect ? '' : '?redirect=' + redirect)}>
                        Go home
                    </Link>
                </p>
            </Grid>
        </Container>
    );
};
export default About;
