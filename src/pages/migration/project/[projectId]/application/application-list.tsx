import { CalculationError, DataPanelGroup, InventoryHeader, Message, Page, ProjectMessagesWrapper, VcioIcon } from '@components';
import { Box, CircularProgress, Grid } from '@material-ui/core';
import { appCalcsCompleteFn, doRoute } from '@utils';
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
 * Home page for accessing Application Result details
 *
 * @constructor
 */
export default function ApplicationList() {
    const classes = commonProjectStyles();
    const { query: { projectId } } = useRouter();
    const router = useRouter();
    const { data: project, error } = useProject(projectId as string);
    const { data: projects } = useProjects();

    const NAV_MENU = useMigrationMenu(project?.roProjectWithData);

    // Project info from the full projects list
    const additionalProjectInfo: any = useMemo(() => _.find(projects, { id: projectId }), [projects, projectId]);

    const appResults = useMemo(() => {
        if (additionalProjectInfo) {
            return _.find(additionalProjectInfo.results, { type: 'app' });
        }
        return {};
    }, [additionalProjectInfo]);


    /**
     * Provide route to detail link for cell, IFF calculations have been completed.
     * @param params
     * @constructor
     */
    const RouteToDetail = useCallback((params: ICellRendererParams) => {
        if (appCalcsCompleteFn(params, appResults)) {
            const target: Target = {
                route: '/migration/project/[projectId]/application/[applicationId]/application-info',
                route_as: '/migration/project/' + additionalProjectInfo.id + '/application/' + params.data.applicationId + '/application-info'
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
    }, [appResults, classes, additionalProjectInfo, router]);

    const columnDefs = useMemo((): DataPanelColumn[] => {
        if (!project) {
            return [];
        }
        const colDefs: DataPanelColumn[] = [
            DependencyCalculationColumn({
                calcCompleteFn: appCalcsCompleteFn,
                calcCompleteFnParms: appResults
            }),
            {
                headerName: 'Application',
                field: 'application',
                sort: 'asc',
                width: 350,
                cellRendererFramework: RouteToDetail
            },
            {
                headerName: 'Move Groups',
                field: 'mgCount',
                type: 'numericColumn'
            },
            {
                headerName: 'VMs',
                field: 'vms',
                type: 'numericColumn'
            },
            {
                headerName: 'Physical Servers',
                field: 'servers',
                type: 'numericColumn'
            },
            {
                headerName: 'Total Compute Instances',
                field: 'totalComputeInstances',
                type: 'numericColumn'
            },
            {
                headerName: 'Shared Compute Instances',
                field: 'sharedDevices',
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
                    tooltipText: 'Values are based on all devices in the application. \n\n' +
                        'Multiple values indicate that the application contains devices with different values.'
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
                    tooltipText: 'Values are based on all devices in the application. \n\n' +
                        'Multiple values indicate that the application contains devices with different values.'
                }
            });
        });
        return colDefs;
    }, [RouteToDetail, appResults, project]);

    const rows: any[] = useMemo(() => {
        if (!project) {
            return [];
        }
        return _.map(project.roProjectWithData.apps, app => {
            // Compute shared devices column
            const shared = _.reduce(app.node_ids, (acc: string[], cur) => {
                // If the node is mapped to more than 1 app (presumably this app), add it to the list of shared with other apps
                if (project.roProjectWithData.nodeToAppsMap[cur].length > 1) {
                    acc.push(cur);
                }
                return acc;
            }, []);

            // Compute Virtual/Physical device counts
            const typeMap = _.countBy(app.node_ids, node_id => {
                return project.roProjectWithData.nodesMap[node_id].type;
            });

            // Primary data columns for this row
            let rowCols: any = {
                icon: 'icon',
                application: app.name,
                applicationId: app.id,
                mgCount: project.roProjectWithData.appToMgsMap[app.id] ? project.roProjectWithData.appToMgsMap[app.id].length : '-',
                vms: typeMap.Virtual || '-',
                servers: typeMap.Physical || '-',
                totalComputeInstances: app.node_ids.length,
                sharedDevices: shared.length || '-',
            };
            // Add list of custom props referenced by nodes in application
            _.forOwn(_.union(project.roProjectWithData.custom_app_props, project.roProjectWithData.custom_node_props), (custom_prop: any) => {
                const custom = _.reduce(app.node_ids, (acc: { [key: string]: number }, cur) => {
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

    if (!project || !projects || !project.roProjectWithData.nodesMap) {
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

    if (getProjectStatus(project.roProjectWithData.results, ProjectViewType.App) === CalcStatus.Error) {
        return (
            <Page tab="migration" navMenu={NAV_MENU}>
                <CalculationError
                    type={ProjectViewType.App}
                    msg='Error calculating applications'
                    projectName={project.roProjectWithData.name}
                />
            </Page>
        );
    }

    if (project.roProjectWithData.apps.length === 0) {
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
                            <h2>This area will show Applications defined for your devices.</h2>
                            <h3>You can create Applications values in the <a href="" onClick={redirectToInventory}>Inventory</a></h3>
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
                            title='Application List'
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
                                            data-cy="dependenciesApplication"
                                        >
                                            {
                                                (appResults
                                                    && !appResults.error) ?
                                                    appResults.params.ids.length + ' of ' + rows.length + ' Applications'
                                                    :
                                                    '0 of ' + rows.length + ' Applications'
                                            }
                                        </Box>
                                    </Box>
                                    <Box style={{ marginRight: '28px', marginLeft: '4px', marginTop: '2px' }}>
                                        <VcioIcon vcio='migration-application' iconColor={colors.blue_500} rem={2} width={40}/>
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
                                        dataId: `${project.roProjectWithData.name}_applicationList`,
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
