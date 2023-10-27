import { CalculationError, DataPanelGroup, InventoryHeader, Message, Page, ProjectMessagesWrapper, VcioIcon } from '@components';
import { Box, CircularProgress, Grid } from '@material-ui/core';
import { AG_GRID_LOCALE_EN, customCalcsCompleteFn, doRoute } from '@utils';
import { ICellRendererParams } from 'ag-grid-community';
import clsx from 'clsx';
import _ from 'lodash';
import { useRouter } from 'next/router';
import React, { useCallback, useMemo } from 'react';
import { DataPanelColumn } from '../../../../../../components/controls/DataPanelColumn';
import { DependencyCalculationColumn } from '../../../../../../components/controls/DependencyCalculationColumn';
import { NoData } from '../../../../../../components/controls/NoData';
import { useMigrationMenu } from '../../../../../../hooks';
import { Target } from '../../../../../../models';
import { useProject, useProjects } from '../../../../../../services';
import { colors, theme } from '../../../../../../styles';
import { CalcStatus, commonProjectStyles, getProjectStatus, ProjectViewType } from '../../../../../../utils/common-project';

/**
 * "List" page for custom properties (e.g. Zone, Owner)
 *
 * @constructor
 */
export default function CustomPropertyList() {
    const classes = commonProjectStyles();
    const { query: { projectId, customPropertyId } } = useRouter();
    const router = useRouter();
    const { data: projects } = useProjects();
    const { data: project, error } = useProject(projectId as string);

    const customPropertyName: string = useMemo(() => {
        if (!project) {
            return '';
        }
        return _.find(
            _.union(project.roProjectWithData.custom_app_props, project.roProjectWithData.custom_node_props), { name: customPropertyId as string })
            ?.title || '';
    }, [project, customPropertyId]);

    // Additional project info from the full projects list
    const groupResults = useMemo(() => {
        if (!projects) {
            return {};
        }
        const additionalProjectInfo: any = _.find(projects, { id: projectId });
        if (additionalProjectInfo) {
            return _.find(additionalProjectInfo.results, { type: 'group', groupName: customPropertyName });
        }
        return {};
    }, [projects, projectId, customPropertyName]);

    /**
     * Provide route to detail link for cell, IFF calculations have been completed.
     * @param params
     * @constructor
     */
    const RouteToDetail = useCallback((params: ICellRendererParams) => {
        if (customCalcsCompleteFn(params, groupResults)) {
            const target: Target = {
                route: '/migration/project/[projectId]/custom/[customPropertyId]/[propertyName]/custom-info',
                route_as: '/migration/project/' + projectId + '/custom/' + customPropertyId + '/' + params.data.propertyName + '/custom-info'
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
    }, [projectId, customPropertyId, groupResults, classes, router]);

    const colDefs: DataPanelColumn[] = useMemo(() => {
        if (!project?.roProjectWithData || !projects) {
            return [];
        }
        const defs: DataPanelColumn[] = [
            DependencyCalculationColumn({
                calcCompleteFn: customCalcsCompleteFn,
                calcCompleteFnParms: groupResults
            }),
            {
                headerName: `${customPropertyName}`,
                field: 'propertyName',
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
                headerName: 'Apps',
                field: 'appsCount',
                type: 'numericColumn'
            },
        ];
        // Add columns for custom properties
        _.forEach(_.union(project.roProjectWithData.custom_node_props, project.roProjectWithData.custom_app_props), (custom_prop: any) => {
            if (custom_prop.title !== customPropertyName) {
                // @ts-ignore
                defs.push({
                    headerName: custom_prop.title,
                    field: custom_prop.name,
                    headerComponent: 'tooltipColumnRenderer',
                    headerComponentParams: {
                        tooltipText: `Values are based on all devices for the ${custom_prop?.title || 'property'}. \n\n
                    Multiple values indicate that the ${custom_prop?.title || 'property'} contains devices with different values.`
                    },
                    isCustomProperty: true
                });
            }
        });
        return defs;
    }, [customPropertyName, project, projects, groupResults, RouteToDetail]);
    const customColumns: DataPanelColumn[] = useMemo(() => _.filter(colDefs, { isCustomProperty: true }),
        [colDefs]
    );

    // Move group analysis.  For each custom property value, return mg i.d. and list of associated nodes.
    const mgsToCustom: any = useMemo(() => {
        if (!project) {
            return [];
        }
        const thisCustomProp: any = _.find(project.roProjectWithData.custom_node_props, { name: customPropertyId });
        return _.reduce(project.roProjectWithData.move_groups, (result: { [key: string]: object[] }, val) => {
            _.forEach(_.filter(val.custom_props, (_prop, key) => {
                return key === thisCustomProp?.name;
            }), (prop) => {
                if (!result[prop]) {
                    result[prop] = [];
                }
                result[prop].push({
                    id: val.id,
                    nodeIds: val.node_ids
                });
            });
            return result;
        }, {});
    }, [project, customPropertyId]);

    // App analysis.  For each custom property value, return mg i.d. and list of associated nodes.
    const appsToCustom: any = useMemo(() => {
        if (!project) {
            return [];
        }
        const thisCustomProp: any = _.find(project.roProjectWithData.custom_node_props, { name: customPropertyId });
        return _.reduce(project.roProjectWithData.apps, (result: { [key: string]: object[] }, val) => {
            _.forEach(_.filter(val.custom_props, (_prop, key) => {
                return key === thisCustomProp?.name;
            }), (prop) => {
                if (!result[prop]) {
                    result[prop] = [];
                }
                result[prop].push({
                    id: val.id,
                    nodeIds: val.node_ids
                });
            });
            return result;
        }, {});
    }, [project, customPropertyId]);

    // Node analysis.  For each custom property value, return node i.d.
    const nodesToCustom: any = useMemo(() => {
        if (!project) {
            return [];
        }
        const thisCustomProp: any = _.find(project.roProjectWithData.custom_node_props, { name: customPropertyId });
        return _.reduce(project.roProjectWithData.nodes, (result: { [key: string]: object[] }, val) => {
            _.forEach(_.filter(val.custom_props, (_prop, key) => {
                return key === thisCustomProp?.name;
            }), (prop) => {
                if (!result[prop]) {
                    result[prop] = [];
                }
                result[prop].push({
                    id: val.id,
                    nodeIds: [val.id]
                });
            });
            return result;
        }, {});
    }, [project, customPropertyId]);

    const rows: any[] = useMemo(() => {
        if (!project) {
            return [];
        }
        const rowStack: any[] = [];
        const customProps = _.merge(_.keys(mgsToCustom), _.keys(appsToCustom), _.keys(nodesToCustom)).sort();
        _.forEach(customProps, prop => {
            const allNodeIds = _.union(
                _.reduce(mgsToCustom[prop], (acc, val: any) => {
                    acc = _.union(acc, val.nodeIds);
                    return acc;
                }, []),
                _.reduce(appsToCustom[prop], (acc, val: any) => {
                    acc = _.union(acc, val.nodeIds);
                    return acc;
                }, []),
                _.reduce(nodesToCustom[prop], (acc, val: any) => {
                    acc = _.union(acc, val.nodeIds);
                    return acc;
                }, [])
            );
            const typeMap = _.countBy(allNodeIds, (nodeId: string) => {
                return project.roProjectWithData.nodesMap[nodeId].type;
            });
            // Primary data columns for this row
            let rowCols = {
                icon: 'icon',
                propertyName: prop,
                mgCount: mgsToCustom[prop] ? mgsToCustom[prop].length : '-',
                vms: typeMap.Virtual || '-',
                servers: typeMap.Physical || '-',
                totalComputeInstances: allNodeIds.length,
                appsCount: appsToCustom[prop] ? appsToCustom[prop].length : '-',
            };
            // Get list of other custom props referenced by nodes in group
            _.forEach(_.union(project.roProjectWithData.custom_node_props, project.roProjectWithData.custom_node_props), (custom_prop: any) => {
                if (custom_prop.title !== customPropertyName) {
                    const customPropSet = _.reduce(allNodeIds, (acc, nodeId) => {
                        const node = project.roProjectWithData.nodesMap[nodeId];
                        if (node.custom_props[custom_prop.name]) {
                            acc.add(node.custom_props[custom_prop.name]);
                        }
                        return acc;
                    }, new Set());
                    rowCols = { ...rowCols, [custom_prop.name]: [...customPropSet].toString() };
                }
            });
            // @ts-ignore
            rowStack.push(rowCols);
        });
        return rowStack;
    }, [mgsToCustom, appsToCustom, nodesToCustom, project, customPropertyName]);

    const NAV_MENU = useMigrationMenu(project?.roProjectWithData);

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

    if (getProjectStatus(project.roProjectWithData.results, ProjectViewType.CustomGroup) === CalcStatus.Error) {
        return (
            <Page tab="migration" navMenu={NAV_MENU}>
                <CalculationError
                    type={ProjectViewType.CustomGroup}
                    msg={`Error calculating ${customPropertyName}`}
                    projectName={project.roProjectWithData.name}
                />
            </Page>
        );
    }

    if (rows.length === 0) {
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
                            <h2>This area will show {customPropertyName} defined for your devices.</h2>
                            <h3>You can create {customPropertyName} values in the <a href="" onClick={redirectToInventory}>Inventory</a></h3>
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
                    colDefs && rows &&
                    <Grid container className={classes.container}>
                        <InventoryHeader
                            project={project}
                            title={`${customPropertyName} List`}
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
                                            data-cy="dependenciesCustomProp"
                                        >
                                            {
                                                (
                                                    groupResults
                                                    && !groupResults.error) ?
                                                    `${rows.length} of ${rows.length} ${customPropertyName}${rows.length === 1 ? '' : 's'}`
                                                    :
                                                    `0 of ${rows.length} ${customPropertyName}`
                                            }
                                        </Box>
                                    </Box>
                                    <Box style={{ marginRight: '28px', marginLeft: '4px', marginTop: '2px' }}>
                                        <VcioIcon vcio='migration-group' iconColor={colors.blue_500} rem={2} width={40}/>
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
                                        dataId: `${project.roProjectWithData.name}_${customPropertyId}_grouplist`,
                                        data: {
                                            columnDefs: colDefs,
                                            rows
                                        },
                                        agGridOptions: {
                                            context: {
                                                customColumns
                                            },
                                            localeText: AG_GRID_LOCALE_EN,
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
