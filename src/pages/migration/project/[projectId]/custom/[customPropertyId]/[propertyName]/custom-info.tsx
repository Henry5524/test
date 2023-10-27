import { InventoryHeader, Message, Page, VcioIcon } from '@components';
import { Box, CircularProgress, Divider, Grid, Link, makeStyles, Menu, MenuItem, Tab, Tabs } from '@material-ui/core';
import { doRoute } from '@utils';
import _ from 'lodash';
import { useRouter } from 'next/router';
import React, { ChangeEvent, MouseEvent, useCallback, useMemo, useState } from 'react';
import { TabPanel } from '../../../../../../../components/controls/TabPanel';
import { useMigrationMenu } from '../../../../../../../hooks';
import { Target } from '../../../../../../../models';
import { useProject } from '../../../../../../../services';
import { colors } from '../../../../../../../styles';
import { commonProjectStyles } from '../../../../../../../utils/common-project';
import CustomDashboard from './custom-dashboard';
import CustomDependencies from './custom-dependencies';
import CustomNetwork from './custom-network';

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

export default function CustomInfo() {
    const classes = commonProjectStyles();
    const localClasses = useStyles();
    const { query: { projectId, customPropertyId, propertyName } } = useRouter();
    const { data: project, error } = useProject(projectId as string);
    const router = useRouter();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [tabState, setTabState] = useState<{
        tabNbr: number;
    }>({
        tabNbr: 0
    });
    const handleTabChange = useCallback((_event: ChangeEvent<{}>, newValue: number) => {
        setTabState({
            tabNbr: newValue
        });
    }, []);

    // Custom dropdown menu clicked, navigate to different application
    const onCustomMenuClick = useCallback(
        (event: MouseEvent<HTMLElement>) => {
            const target: Target = {
                route: '/migration/project/[projectId]/custom/[customPropertyId]/[propertyName]/custom-info',
                route_as: '/migration/project/' + projectId + '/custom/' + customPropertyId + '/' + event.currentTarget.id + '/custom-info'
            };
            setAnchorEl(null);
            doRoute(router, target);
        }, [projectId, customPropertyId, router]);
    const onCustomMenuOpen = useCallback((event: MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    }, []);
    const onCustomMenuClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    // Get a list of all custom property values for this property category
    const values = useMemo(() => {
        if (!project?.roProjectWithData) {
            return [];
        }
        const customProp = project.roProjectWithData.customPropsMap[customPropertyId as string] || {};
        return _.reduce(customProp, (acc: any, val, key) => {
            if (_.isArray(val)) {
                acc[key] = val;
            }
            return acc;
        }, {});
    }, [project, customPropertyId]);

    const navigateToHome = useCallback(() => {
        const target: Target = {
            route: '/migration/project/[projectId]/custom/[customPropertyId]/custom-property-list',
            route_as: `/migration/project/${projectId}/custom/${customPropertyId}/custom-property-list`
        };
        doRoute(router, target);
    }, [projectId, customPropertyId, router]);

    const NAV_MENU = useMigrationMenu(project?.roProjectWithData);

    if (!project) {
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

    if (error) {
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
                            onClick={navigateToHome}
                            className={localClasses.colorPrimary}
                        >
                            &lt;  Custom Properties List
                        </Link>
                    </Grid>
                    <InventoryHeader
                        project={project}
                        title={
                            project.roProjectWithData.appsMap &&
                            <Grid container direction="row" alignItems="center">
                                {propertyName}
                                <Divider orientation="vertical" flexItem style={{ marginRight: 16, marginLeft: 16 }}/>
                                <Box className={classes.linkButton} ml={6}>
                                    <Box mt={-2}>
                                        <Menu
                                            anchorEl={anchorEl}
                                            keepMounted
                                            className={classes.dropdown}
                                            open={Boolean(anchorEl)}
                                            onClose={onCustomMenuClose}
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
                                            {
                                                _.map(_.keys(values).sort(), (key: string) => {
                                                    return (
                                                        <MenuItem
                                                            id={key}
                                                            key={key}
                                                            value={key}
                                                            className={classes.menuItem}
                                                            onClick={onCustomMenuClick}
                                                        >
                                                            <Box className={classes.menuItemText}>{key}</Box>
                                                        </MenuItem>
                                                    );
                                                })
                                            }
                                        </Menu>
                                        <VcioIcon vcio='migration-calculate' iconColor={colors.green_500} rem={1.3} width={29} onClick={onCustomMenuOpen}/>
                                        <VcioIcon vcio='ars-angle-down' iconColor={colors.green_500} rem={0.75} width={12} onClick={onCustomMenuOpen}/>
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
                        <Tab label={propertyName + ' Dashboard'} {...a11yProps(0)} data-cy="customDashboard"/>
                        <Tab label='Client Dependencies' {...a11yProps(1)} data-cy="customClientDependencies"/>
                        <Tab label='Server Dependencies' {...a11yProps(2)} data-cy="customServerDependencies"/>
                        <Tab label='Detailed Network Data' {...a11yProps(3)} data-cy="customNetwork"/>
                    </Tabs>
                    <TabPanel value={tabState.tabNbr} index={0}>
                        <CustomDashboard/>
                    </TabPanel>
                    <TabPanel value={tabState.tabNbr} index={1}>
                        <CustomDependencies type='client'/>
                    </TabPanel>
                    <TabPanel value={tabState.tabNbr} index={2}>
                        <CustomDependencies type='server'/>
                    </TabPanel>
                    <TabPanel value={tabState.tabNbr} index={3}>
                        <CustomNetwork/>
                    </TabPanel>
                </Grid>
            }
        </Page>
    );
};
