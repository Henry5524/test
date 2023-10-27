import { CalculationError, DataPanelGroup, InventoryHeader, Message, Page, ProjectMessagesWrapper, VcioIcon } from '@components';
import { Box, CircularProgress, Grid } from '@material-ui/core';
import { doRoute, mgCalcsCompleteFn, mgTotalComputeInstances, } from '@utils';
import { ICellRendererParams } from 'ag-grid-community';
import clsx from 'clsx';
import _ from 'lodash';
import { useRouter } from 'next/router';
import React, { useCallback, useMemo } from 'react';
import { DataPanelColumn } from '../../../../../components/controls/DataPanelColumn';
import { DependencyCalculationColumn } from '../../../../../components/controls/DependencyCalculationColumn';
import { NoData } from '../../../../../components/controls/NoData';
import { useMigrationMenu } from '../../../../../hooks';
import { Target } from '../../../../../models';
import { useProject, useProjects } from '../../../../../services';
import { colors, theme } from '../../../../../styles';
import { CalcStatus, commonProjectStyles, getProjectStatus, ProjectViewType } from '../../../../../utils/common-project';

/**
 * Home page for accessing Move Group Result details
 *
 * @constructor
 */
export default function MoveGroupList() {
    const classes = commonProjectStyles();
    const { query: { projectId } } = useRouter();
    const router = useRouter();
    const { data: project, error } = useProject(projectId as string);
    const { data: projects } = useProjects();

    const NAV_MENU = useMigrationMenu(project?.roProjectWithData);

    // Project info from the full projects list
    const additionalProjectInfo: any = useMemo(() => _.find(projects, { id: projectId }), [projectId, projects]);
    const mgResults = useMemo(() => {
        if (additionalProjectInfo) {
            return _.find(additionalProjectInfo.results, { type: 'mg' });
        }
        return {};

    }, [additionalProjectInfo]);

    /**
     * Provide route to detail link for cell, IFF calculations have been completed.
     * @param params
     * @constructor
     */
    const RouteToDetail = useCallback((params: ICellRendererParams) => {
        if (mgCalcsCompleteFn(params, mgResults)) {
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
        }
        return (
            <>
                {params.value}
            </>
        );
    }, [mgResults, projectId, classes, router]);

    const columnDefs = useMemo((): DataPanelColumn[] => {
        if (!project) {
            return [];
        }
        const colDefs: DataPanelColumn[] = [
            DependencyCalculationColumn({
                calcCompleteFn: mgCalcsCompleteFn,
                calcCompleteFnParms: mgResults
            }),
            {
                headerName: 'Move Group',
                field: 'moveGroup',
                sort: 'asc',
                cellRendererFramework: RouteToDetail
            },
            {
                headerName: 'Applications',
                field: 'appCount',
                type: 'numericColumn'
            },
            {
                headerName: 'Custom Groups',
                field: 'customGroupCount',
                type: 'numericColumn'
            },
            {
                headerName: 'Individual Compute Instances',
                field: 'individualDeviceCount',
                type: 'numericColumn'
            },
            {
                headerName: 'Total Compute Instances',
                field: 'totalComputeInstances',
                type: 'numericColumn'
            },
        ];
        // Add columns for custom node properties
        _.forEach(project.roProjectWithData.custom_node_props, custom_node_prop => {
            colDefs.push({
                headerName: custom_node_prop.title,
                field: custom_node_prop.name,
                headerComponent: 'tooltipColumnRenderer',
                headerComponentParams: {
                    tooltipText: 'Values are based on all devices in the move group. \n\n' +
                        'Multiple values indicate that the move group contains devices with different values.'
                }
            });
        });
        // Add columns for custom app properties
        _.forEach(project.roProjectWithData.custom_app_props, custom_app_prop => {
            colDefs.push({
                headerName: custom_app_prop.title,
                field: custom_app_prop.name,
                headerComponent: 'tooltipColumnRenderer',
                headerComponentParams: {
                    tooltipText: 'Values are based on all devices in the move group. \n\n' +
                        'Multiple values indicate that the move group contains devices with different values.'
                }
            });
        });
        return colDefs;
    }, [RouteToDetail, mgResults, project]);

    const rows: any[] = useMemo(() => {
        if (!project) {
            return [];
        }
        return _.map(project.roProjectWithData.move_groups, move_group => {
            let rowCols: any = {
                icon: 'icon',
                moveGroup: move_group.name,
                moveGroupId: move_group.id,
                appCount: move_group.group_ids && move_group.group_ids.length > 0 ? move_group.group_ids.length : '-',
                customGroupCount: _.keys(move_group.custom_props).length > 0 ? _.keys(move_group.custom_props).length : '-',
                individualDeviceCount: move_group.node_ids ? move_group.node_ids.length : '-',
                totalComputeInstances: mgTotalComputeInstances(project, move_group.id),
            };
            // Get list of custom props referenced by nodes in move group
            _.forOwn(project.roProjectWithData.customPropsMap, (custom_prop: any) => {
                const custom = _.reduce(move_group.node_ids, (acc: { [key: string]: number }, cur) => {
                    const node = project.roProjectWithData.nodesMap[cur];
                    if (node && node.custom_props[custom_prop.name]) {
                        if (acc[node.custom_props[custom_prop.name]]) {
                            acc[node.custom_props[custom_prop.name]]++;
                        } else {
                            acc[node.custom_props[custom_prop.name]] = 1;
                        }
                    }
                    return acc;
                }, {});
                const customString = _.reduce(custom, (acc: string, value: number, key: string) => {
                    return acc + (acc.length > 0 ? ', ' : '') + key + (value > 1 ? '(' + value + ')' : '');
                }, '');
                rowCols = { ...rowCols, [custom_prop.name]: customString };
            });
            return rowCols;
        });
    }, [project]);

    if (!project || !projects || !project.roProjectWithData.nodesMap || !project.roProjectWithData.customPropsMap) {
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

    if (project.roProjectWithData.move_groups.length === 0) {
        const target: Target = {
            route: '/migration/project/[projectId]/inventory',
            route_as: `/migration/project/${projectId}/inventory`
        };
        const redirectToInventory = () => {
            doRoute(router, target);
            return false;
        };
        return (
            <Page tab="migration" navMenu={NAV_MENU}>
                <NoData
                    icon={<VcioIcon vcio="general-tag-outline" rem={10} width={200} iconColor={colors.blue_gray_200}/>}
                    msg={
                        <div>
                            <h2>This area will show Move Groups defined for your devices.</h2>
                            <h3>You can create Move Group values in the <a href="" onClick={redirectToInventory}>Inventory</a></h3>
                        </div>
                    }
                />
            </Page>
        );
    }

    return (
        <ProjectMessagesWrapper maskWhenCalculating={false}>
            <Page tab="migration" navMenu={NAV_MENU}>
                {
                    columnDefs && rows &&
                    <Grid container className={classes.container}>
                        <InventoryHeader
                            project={project}
                            title='Move Group List'
                            extraButtons={
                                <>
                                    <Box style={{ fontSize: '15px', marginTop: '2px' }}>
                                        Dependencies are calculated for<br/>
                                        <Box
                                            style={
                                                {
                                                    fontStyle: 'normal',
                                                    letterSpacing: 0,
                                                    color: colors.blue_600,
                                                    textAlign: 'right'
                                                }

                                            }
                                            data-cy="dependenciesMoveGroup"
                                        >
                                            {
                                                (mgResults
                                                    && !mgResults.error) ?
                                                    mgResults.params.ids.length + ' of ' + rows.length + ' Move Groups'
                                                    :
                                                    '0 of ' + rows.length + ' Move Groups'
                                            }
                                        </Box>
                                    </Box>
                                    <Box style={{ marginRight: '28px', marginLeft: '4px', marginTop: '2px' }}>
                                        <VcioIcon vcio='migration-move-group' iconColor={colors.blue_500} rem={2} width={40}/>
                                    </Box>
                                </>
                            }
                        />
                        <Grid container style={{ marginBottom: theme.spacing(6) }}>
                            <DataPanelGroup
                                toolbar={{
                                    showFilter: true,
                                    showTotal: true,
                                    buttons: {
                                        generalDownloadBtn: true,
                                    }
                                }}
                                projectName={project.roProjectWithData.name || ''}
                                tabs={[
                                    {
                                        dataId: `${project.roProjectWithData.name}_movegrouplist`,
                                        data: {
                                            columnDefs,
                                            rows
                                        }
                                    }
                                ]}
                            />
                        </Grid>
                    </Grid>
                }
            </Page>
        </ProjectMessagesWrapper>
    );
};
