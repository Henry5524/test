import { CalculationError, DataPanelGroup, DataPanelGroupProps, InventoryHeader, Message, Page, ProjectMessagesWrapper, VcioIcon } from '@components';
import { CircularProgress, Grid } from '@material-ui/core';
import { useProject } from '@services';
import { colors, theme } from '@styles';
import { doRoute, mgTotalComputeInstances } from '@utils';
import { CalcStatus, commonProjectStyles, getProjectStatus, getXref, ProjectViewType } from '@utils/common-project';
import { ICellRendererParams } from 'ag-grid-community';
import clsx from 'clsx';
import _ from 'lodash';
import { useRouter } from 'next/router';
import React, { useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { DataPanelColumn } from '../../../../../components/controls/DataPanelColumn';
import { NoData } from '../../../../../components/controls/NoData';
import { useMigrationMenu } from '../../../../../hooks';
import { Target } from '../../../../../models';

export default function MoveGroupSummary() {
    const classes = commonProjectStyles();
    const { query: { projectId } } = useRouter();
    const { data: project, error } = useProject(projectId as string);
    const { data: mgData } = useSWR(project?.roProjectWithData ? `movegroup_${projectId}` : null,
        // @ts-ignore
        () => getXref(project?.roProjectWithData, 'mg'));
    const router = useRouter();

    const NAV_MENU = useMigrationMenu(project?.roProjectWithData);

    const mgResults: any = useMemo(() => {
        if (project?.roProjectWithData.results) {
            return _.find(project.roProjectWithData.results, { type: 'mg' });
        }
        return {};
    }, [project?.roProjectWithData.results]);

    const RouteToDetail = useCallback((params: ICellRendererParams) => {
        const target: Target = {
            route: '/migration/project/[projectId]/mg/[mgId]/move-group-info',
            route_as: '/migration/project/' + projectId + '/mg/' + params.data.moveGroupId + '/move-group-info'
        };
        return (
            <>
                <button type="button" className={clsx(classes.linkButton)} onClick={() => doRoute(router, target)}>
                    <span style={{ color: colors.green_500 }}>{params.value}</span>
                </button>
            </>
        );
    }, [classes, projectId, router]);

    const columnDefs: DataPanelColumn[] = useMemo(() => {
        return [
            {
                headerName: 'Move Group',
                field: 'moveGroup',
                sort: 'asc',
                width: 350,
                cellRendererFramework: RouteToDetail
            },
            {
                headerName: 'Applications',
                field: 'appCount',
                filter: false,
                type: 'numericColumn'
            },
            {
                headerName: 'Individual Compute Instances',
                field: 'individualComputeInstances',
                type: 'numericColumn'
            },
            {
                headerName: 'Total Compute Instances',
                field: 'totalComputeInstances',
                type: 'numericColumn'
            },
        ];
    }, [RouteToDetail]);

    // Only show analyzed rows
    const rows = useMemo(() => {
        if (!project || !mgResults) {
            return [];
        }
        const allRows: any[] = _.map(project.roProjectWithData.move_groups, move_group => {
            const rowCols: any = {
                icon: 'icon',
                moveGroup: move_group.name,
                moveGroupId: move_group.id,
                appCount: move_group.group_ids?.length ? move_group.group_ids.length : '-',
                individualComputeInstances: move_group.node_ids?.length ? move_group.node_ids.length : '-',
                totalComputeInstances: mgTotalComputeInstances(project, move_group.id),
            };
            return rowCols;
        });
        return _.filter(allRows, row => mgResults.params.ids.includes(row.moveGroup));
    }, [mgResults, project]);

    const DPG_MOVE_GROUPS_BY_APPLICATION: DataPanelGroupProps = useMemo(() => {
        return {
            projectName: project?.roProjectWithData.name || 'Error: No Project Name ',
            toolbar: {
                title: 'Move Groups by Application and Compute Instance Count',
                buttons: {
                    generalDownloadBtn: true
                },
                titleTooltip:
                    <>
                        Use to:
                        <ul>
                            <li>Identify the inventory of analyzed move groups</li>
                        </ul>
                    </>
            },
            tabs: [
                {
                    dataId: `${project?.roProjectWithData.name}_entity_MoveGroup_info`,
                    data: {
                        columnDefs,
                        rows
                    },
                    maxWidth: 900
                }
            ]
        };
    }, [columnDefs, project, rows]);

    const DPG_NETWORK_THROUGHPUT: DataPanelGroupProps = useMemo(() => {
        return {
            projectName: (project && project.roProjectWithData.name) || 'Error: No Project Name ',
            toolbar: {
                title: 'Network Throughput',
                buttons: {
                    generalDownloadBtn: true
                },
                titleTooltip:
                    <>
                        Use to:
                        <ul>
                            <li>Estimate bandwidth requirements between groups</li>
                            <br/>
                            <li>Determine if move groups are independent enough to move separately or if some must be moved together</li>
                        </ul>
                    </>
            },
            tabs: [
                {
                    dataId: `${project?.roProjectWithData.name}_all_group_dc_interactions`,
                    source: {
                        name: mgData ? 'all_group_dc_interactions.xlsx' : undefined,
                        url: mgData ? mgData['all_group_dc_interactions.xlsx'] : undefined
                    },
                    image: {
                        footerText: 'Network throughput between the analyzed move groups and external IPs, and the rest of the datacenter.',
                        name: mgData ? 'all_group_dc_interactions.png' : undefined,
                        url: mgData ? mgData['all_group_dc_interactions.png'] : undefined
                    },
                    maxWidth: 900
                }
            ]
        };
    }, [mgData, project]);

    if (!project || !project.roProjectWithData.nodesMap || !mgData) {
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

    if (getProjectStatus(project.roProjectWithData.results, ProjectViewType.MoveGroup) === CalcStatus.Error) {
        return (
            <Page tab="migration" navMenu={NAV_MENU}>
                <CalculationError
                    type={ProjectViewType.MoveGroup}
                    msg='Error calculating move groups'
                    projectName={project.roProjectWithData.name}
                />
            </Page>
        );
    }

    // There were no results for the move groups
    if (!project.roProjectWithData || !mgResults) {
        return (
            <Page tab="migration" navMenu={NAV_MENU}>
                <NoData
                    icon={<VcioIcon vcio="migration-move-group" rem={10} width={200} iconColor={colors.blue_gray_200}/>}
                    msg={<h1>There are no move group results available</h1>}
                />
            </Page>
        );
    }

    return (
        <ProjectMessagesWrapper maskWhenCalculating={false}>
            <Page tab="migration" navMenu={NAV_MENU}>
                {
                    !error && mgData &&
                    <Grid container className={classes.container}>
                        <InventoryHeader project={project} title='Analyzed Move Groups'/>
                        <Grid container style={{ marginBottom: theme.spacing(6) }}>
                            <Grid item className={classes.headers} xs style={{ marginBottom: theme.spacing(6) }}>
                                Inventory Summary
                            </Grid>
                            <Grid item xs={12}>
                                <DataPanelGroup {...DPG_MOVE_GROUPS_BY_APPLICATION} />
                            </Grid>
                        </Grid>
                        <Grid container style={{ marginBottom: theme.spacing(6) }}>
                            <Grid item className={classes.headers} xs style={{ marginBottom: theme.spacing(6) }}>
                                Network Overview
                            </Grid>
                            <Grid item xs={12}>
                                <DataPanelGroup {...DPG_NETWORK_THROUGHPUT} />
                            </Grid>
                        </Grid>
                    </Grid>
                }
                {
                    error &&
                    <Grid
                        container
                        direction="row"
                        justify="center"
                        alignItems="center"
                        style={{ marginTop: 40 }}
                    >
                        <Message warning={true}>{error?.message ?? 'Unknown Error'}</Message>
                    </Grid>
                }
            </Page>
        </ProjectMessagesWrapper>
    );
};
