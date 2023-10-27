import { InventoryHeader, Message, Page, VcioIcon } from '@components';
import { Box, CircularProgress, Divider, Grid, Link, makeStyles, Menu, MenuItem, Tab, Tabs } from '@material-ui/core';
import { doRoute } from '@utils';
import _ from 'lodash';
import { useRouter } from 'next/router';
import React, { ChangeEvent, MouseEvent, useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';
import { TabPanel } from '../../../../../../components/controls/TabPanel';
import { useMigrationMenu } from '../../../../../../hooks';
import { Target } from '../../../../../../models';
import { useProject } from '../../../../../../services';
import { colors } from '../../../../../../styles';
import { commonProjectStyles, getXref } from '../../../../../../utils/common-project';
import ApplicationDashboard from './application-dashboard';
import ApplicationDependencies from './application-dependencies';
import ApplicationNetwork from './application-network';

function a11yProps(index: any) {
    return {
        id: `scrollable-results-tab-${index}`,
        'aria-controls': `scrollable-results-tabpanel-${index}`,
    };
}

const useStyles = makeStyles((_theme) => ({
    colorPrimary: {
        color: colors.green_600
    }
}));

export default function ApplicationInfo() {
    const classes = commonProjectStyles();
    const localClasses = useStyles();
    const { query: { projectId, applicationId } } = useRouter();
    const { data: project, error } = useProject(projectId as string);
    const router = useRouter();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [tabState, setTabState] = useState<{
        tabNbr: number;
    }>({
        tabNbr: 0
    });
    const { data: overviewData } = useSWR<{ [key: string]: string }, any>(project?.roProjectWithData ? `overview_${projectId}_${applicationId}` : null,
        // @ts-ignore
        () => getXref(project?.roProjectWithData, 'overview'));

    const handleTabChange = useCallback((_event: ChangeEvent<{}>, newValue: number) => {
        setTabState({
            tabNbr: newValue
        });
    }, []);

    // Application dropdown menu clicked, navigate to different application
    const onAppMenuClick = useCallback(
        (event: MouseEvent<HTMLElement>) => {
            const target: Target = {
                route: '/migration/project/[projectId]/application/[applicationId]/application-info',
                route_as: '/migration/project/' + projectId + '/application/' + event.currentTarget.id + '/application-info'
            };
            setAnchorEl(null);
            doRoute(router, target);
        }, [projectId, router]);
    const onAppMenuOpen = useCallback((event: MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    }, []);
    const onAppMenuClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    const NAV_MENU = useMigrationMenu(project?.roProjectWithData);

    const apps = useMemo(() => {
        if (!project) {
            return <></>;
        }
        return _.sortBy(project.roProjectWithData.apps, 'name').map((menuApp: any) => {
            return (
                <MenuItem
                    id={menuApp.id}
                    key={menuApp.id}
                    value={menuApp.name}
                    className={classes.menuItem}
                    onClick={onAppMenuClick}
                >
                    <Box className={classes.menuItemText}>{menuApp.name}</Box>
                </MenuItem>
            );
        });
    }, [classes.menuItem, classes.menuItemText, onAppMenuClick, project]);

    if (!project || !project.roProjectWithData.appsMap || !overviewData) {
        const menu = {
            tab_name: 'migration',
            nodes: [],
        };
        return (
            <Page tab="migration" navMenu={menu}>
                <CircularProgress/>
            </Page>
        );
    }

    if (error || !project.roProjectWithData.appsMap[applicationId as string]) {
        return (
            <Page tab="migration" navMenu={NAV_MENU}>
                <Grid
                    container
                    direction="row"
                    justify="center"
                    alignItems="center"
                    style={{ marginTop: 40 }}
                >
                    <Message warning={true}>{error?.message ?? 'Unknown Error'}</Message>
                </Grid>
            </Page>
        );
    }

    return (
        <Page tab="migration" navMenu={NAV_MENU}>
            {
                !error && project &&
                <Grid container className={classes.container} direction="column" spacing={2}>
                    <Grid item>
                        <Link
                            href="#"
                            onClick={() => {
                                const target: Target = {
                                    route: '/migration/project/[projectId]/application/application-list',
                                    route_as: '/migration/project/' + projectId + '/application/application-list'
                                };
                                doRoute(router, target);
                            }}
                            className={localClasses.colorPrimary}
                        >
                            &lt;  Application List
                        </Link>
                    </Grid>
                    <InventoryHeader
                        project={project}
                        title={
                            project.roProjectWithData.appsMap &&
                            <Grid container direction="row" alignItems="center">
                                {project.roProjectWithData.appsMap[applicationId as string].name}
                                <Divider orientation="vertical" flexItem style={{ marginRight: 16, marginLeft: 16 }}/>
                                <Box className={classes.linkButton} ml={6}>
                                    <Box mt={-2}>
                                        <Menu
                                            anchorEl={anchorEl}
                                            keepMounted
                                            className={classes.dropdown}
                                            open={Boolean(anchorEl)}
                                            onClose={onAppMenuClose}
                                            elevation={0}
                                            getContentAnchorEl={null}
                                            anchorOrigin={{
                                                vertical: 'bottom',
                                                horizontal: 'right',
                                            }}
                                            transformOrigin={{
                                                vertical: 'top',
                                                horizontal: 'left',
                                            }}
                                        >
                                            {apps}
                                        </Menu>
                                        <VcioIcon vcio='migration-application' iconColor={colors.green_500} rem={1.3} width={29} onClick={onAppMenuOpen}/>
                                        <VcioIcon vcio='ars-angle-down' iconColor={colors.green_500} rem={0.75} width={12} onClick={onAppMenuOpen}/>
                                    </Box>
                                </Box>
                            </Grid>
                        }
                    />
                    <Tabs
                        value={tabState.tabNbr}
                        onChange={handleTabChange}
                        indicatorColor="primary"
                        textColor="primary"
                        variant="scrollable"
                        scrollButtons="auto"
                        aria-label="scrollable auto tabs example"
                    >
                        <Tab label='Application Dashboard' {...a11yProps(0)} data-cy="appDashboard"/>
                        <Tab label='Client Dependencies' {...a11yProps(1)} data-cy="appClientDependencies"/>
                        <Tab label='Server Dependencies' {...a11yProps(2)} data-cy="appServerDependencies"/>
                        <Tab label='Detailed Network Data' {...a11yProps(3)} data-cy="appNetwork"/>
                    </Tabs>
                    <TabPanel value={tabState.tabNbr} index={0}>
                        <ApplicationDashboard/>
                    </TabPanel>
                    <TabPanel value={tabState.tabNbr} index={1}>
                        <ApplicationDependencies type='client'/>
                    </TabPanel>
                    <TabPanel value={tabState.tabNbr} index={2}>
                        <ApplicationDependencies type='server'/>
                    </TabPanel>
                    <TabPanel value={tabState.tabNbr} index={3}>
                        <ApplicationNetwork/>
                    </TabPanel>
                </Grid>
            }
        </Page>
    );
};
