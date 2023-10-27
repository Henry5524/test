import { InventoryHeader, Message, Page, VcioIcon } from '@components';
import { Box, CircularProgress, Divider, Grid, Link, makeStyles, Menu, MenuItem } from '@material-ui/core';
import { doRoute } from '@utils';
import { useRouter } from 'next/router';
import React, { MouseEvent, useCallback, useState } from 'react';
import useSWR from 'swr';
import { PanelGroup } from '../../../../../../components/controls/PanelGroup';
import { useMigrationMenu } from '../../../../../../hooks';
import { Target } from '../../../../../../models';
import { useProject } from '../../../../../../services';
import { colors } from '../../../../../../styles';
import { commonProjectStyles, getXref } from '../../../../../../utils/common-project';
import { MoveGroupCost } from './move-group-cost';
import MoveGroupDashboard from './move-group-dashboard';
import MoveGroupNetwork from './move-group-network';

const useStyles = makeStyles((_theme) => ({
    colorPrimary: {
        color: colors.green_600
    }
}));

export default function MoveGroupInfo() {
    const classes = commonProjectStyles();
    const localClasses = useStyles();
    const moveGroupSummary = MoveGroupDashboard();
    const moveGroupNetwork = MoveGroupNetwork();
    const router = useRouter();
    const { query: { projectId, mgId } } = useRouter();
    const { data: project, error } = useProject(projectId as string);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const { data: mgData } = useSWR(project?.roProjectWithData ? `movegroup_${projectId}` : null,
        // @ts-ignore
        () => getXref(project?.roProjectWithData, 'mg'));

    const NAV_MENU = useMigrationMenu(project?.roProjectWithData);

    // Move group dropdown menu clicked, navigate to different move group
    const onMgMenuClick = useCallback((event: MouseEvent<HTMLElement>) => {
        const target: Target = {
            route: '/migration/project/[projectId]/mg/[mgId]/move-group-info',
            route_as: '/migration/project/' + projectId + '/mg/' + event.currentTarget.id + '/move-group-info'
        };
        setAnchorEl(null);
        doRoute(router, target);
    }, [projectId, router]);
    const onMgMenuOpen = useCallback((event: MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    }, []);
    const onMgMenuClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    if (error) {
        return (
            <Grid
                container
                direction="row"
                justify="center"
                alignItems="center"
                style={{ marginTop: 40 }}
            >
                <Message warning={true}>{error?.message ?? 'Unknown Error'}</Message>
            </Grid>
        );
    }

    if (!project || !project.roProjectWithData.moveGroupMap || !mgData) {
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

    let tabsData = [
        {
            tabTitle: 'Inventory Summary',
            tabContent: moveGroupSummary
        },
        {
            tabTitle: 'Detailed Network Data',
            tabContent: moveGroupNetwork
        }
    ];

    // todo: only show cost tab when when running locally or in dev.  Remove this after the Akasia service works for all projects
    const isDevRegExp = /^localhost\.|dev\./i;
    const isDev = isDevRegExp.test(window.location.hostname);

    if (isDev) {
        tabsData.splice(1, 0, {
            tabTitle: 'Cost Analysis',
            tabContent: <MoveGroupCost mgid={mgId as string} projectId={projectId as string}/>
        });
    }

    return (
        <Page tab="migration" navMenu={NAV_MENU}>
            <Grid container className={classes.container} direction="column" spacing={2} style={{ flex: 'auto', flexWrap: 'nowrap' }}>
                <Grid item>
                    <Link
                        data-cy="backToMoveGroupList"
                        href="#"
                        onClick={() => {
                            const target: Target = {
                                route: '/migration/project/[projectId]/mg/move-group-list',
                                route_as: '/migration/project/' + projectId + '/mg/move-group-list'
                            };
                            doRoute(router, target);
                        }}
                        className={localClasses.colorPrimary}
                    >
                        &lt;  Move Group List
                    </Link>
                </Grid>
                <InventoryHeader
                    project={project}
                    title={
                        <Grid container direction="row" alignItems="center">
                            {project.roProjectWithData.moveGroupMap[mgId as string].name}
                            <Divider orientation="vertical" flexItem style={{ marginRight: 16, marginLeft: 16 }}/>
                            <Menu
                                anchorEl={anchorEl}
                                keepMounted
                                className={classes.dropdown}
                                open={Boolean(anchorEl)}
                                onClose={onMgMenuClose}
                                elevation={0}
                                getContentAnchorEl={null}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'center',
                                }}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'center',
                                }}
                            >
                                {
                                    project.roProjectWithData.move_groups.map((menu_move_group: any) => {
                                        return (
                                            <MenuItem
                                                id={menu_move_group.id}
                                                key={menu_move_group.id}
                                                value={menu_move_group.name}
                                                className={classes.menuItem}
                                                onClick={onMgMenuClick}
                                            >
                                                <Box className={classes.menuItemText}>{menu_move_group.name}</Box>
                                            </MenuItem>
                                        );
                                    })
                                }
                            </Menu>
                            <VcioIcon vcio='migration-move-group' iconColor={colors.green_500} rem={1.5} width={29} onClick={onMgMenuOpen}/>
                            <VcioIcon vcio='ars-angle-down' iconColor={colors.green_500} rem={0.75} width={12} onClick={onMgMenuOpen}/>
                        </Grid>
                    }
                />
                <PanelGroup
                    projectName={project.roProjectWithData.name || ''}
                    tabs={tabsData}
                />
            </Grid>
        </Page>
    );
};
