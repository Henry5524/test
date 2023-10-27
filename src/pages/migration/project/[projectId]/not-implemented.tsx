import { Page } from '@components';
import { NavigationMenu } from '@models/navigation';
import { useProject } from '@services';
import { getEmptyNavigationMenu, getMigrationProjectNavigationMenu } from '@utils';
import { useRouter } from 'next/router';
import React from 'react';
import { Box, makeStyles } from '@material-ui/core';

const useStyles = makeStyles(() => ({
    container: {
        margin: '12% auto auto auto',
        textAlign: 'center'
    }
}));

export default function NotImplemented() {

    const classes = useStyles();
    const { query: { projectId } } = useRouter();
    const { data: project } = useProject(projectId as string);

    let navMenu: NavigationMenu;
    if (project) {
        navMenu = getMigrationProjectNavigationMenu(projectId as string, project.roProjectWithData.project_name, project.roProjectWithData.project_instance);
    } else {
        navMenu = getEmptyNavigationMenu('migration');
    }

    return (
        <Page tab="migration" navMenu={navMenu}>
            <Box className={classes.container}>
                Not Implemented Yet
            </Box>
        </Page>
    );
};
