import { CalculationError, DataPanelGroup, ImageCarouselDialog, InventoryHeader, Message, Page, ProjectMessagesWrapper, VcioIcon } from '@components';
import { CircularProgress, Grid } from '@material-ui/core';
import { customCalcsCompleteFn, doRoute } from '@utils';
import { ICellRendererParams } from 'ag-grid-community';
import clsx from 'clsx';
import _ from 'lodash';
import { useRouter } from 'next/router';
import React, { useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';
import { DataPanelColumn } from '../../../../../../components/controls/DataPanelColumn';
import { NoData } from '../../../../../../components/controls/NoData';
import { useMigrationMenu } from '../../../../../../hooks';
import { Target } from '../../../../../../models';
import { useProject } from '../../../../../../services';
import { colors, theme } from '../../../../../../styles';
import { CalcStatus, commonProjectStyles, getProjectStatus, getXref, ProjectViewType } from '../../../../../../utils/common-project';

/**
 * Results summary panel for custom properties (e.g. Zone, Owner)
 *
 * @constructor
 */
export default function CustomPropertySummary() {
    const classes = commonProjectStyles();
    const { query: { projectId, customPropertyId } } = useRouter();
    const router = useRouter();
    const { data: project, error } = useProject(projectId as string);
    const { data: allGroupData } = useSWR(project?.roProjectWithData ? `custom_group_${projectId}_${customPropertyId}` : null,
        // @ts-ignore
        () => getXref(project?.roProjectWithData, 'group'));
    const [carouselOpen, setCarouselOpen] = useState({
        open: false,
        startAt: 0
    });

    const doCarouselClose = useCallback(() => {
        setCarouselOpen({
            open: false,
            startAt: 0
        });
    }, []);

    const customPropertyName: string =
        useMemo(() => {
            if (!project) {
                return {};
            }
            // @ts-ignore
            return _.find(_.union(project.custom_app_props, project.custom_node_props), { name: customPropertyId })?.title || '';
        }, [customPropertyId, project]);

    // Only keep mappings for this property
    const groupData: any = useMemo(() => _.pickBy(allGroupData, (_value, key) => {
        return key.includes(customPropertyName as string);
    }), [allGroupData, customPropertyName]);

    const groupResults: any = useMemo(() => {
        if (project?.roProjectWithData.results) {
            return _.find(project.roProjectWithData.results, { type: 'group', groupName: customPropertyName });
        }
        return [];
    }, [project?.roProjectWithData.results, customPropertyName]);

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
    }, [classes, projectId, customPropertyId, groupResults, router]);

    const images: {
        title: string;
        name: string;
        imageUrl: string;
    }[] = useMemo(() => [
        {
            title: 'Network Throughput',
            name: 'thp_custom_group_all_dependencies.png',
            imageUrl: groupData['thp_custom_group_all_dependencies.png']
        },
        {
            title: `All ${customPropertyName} (calculated)`,
            name: `spring All Custom Groups _ ${customPropertyName} _ in Conversations_Group_1.png`,
            imageUrl: groupData[`spring All Custom Groups _ ${customPropertyName} _ in Conversations_Group_1.png`]
        },
        {
            title: `All Interconnected ${customPropertyName}`,
            name: `Custom Group _ ${customPropertyName} _ Interactions.png`,
            imageUrl: groupData[`Custom Group _ ${customPropertyName} _ Interactions.png`]
        }
    ], [customPropertyName, groupData]);

    const imageClickHandler = useCallback((imageName: string) => {
        setCarouselOpen({
            open: true,
            startAt: Math.max(_.findIndex(images, (image) => {
                return image.name === imageName;
            }), 0)
        });
    }, [images]);

    const columnDefs: DataPanelColumn[] = useMemo(() => [
        {
            headerName: `${customPropertyName}`,
            field: 'propertyName',
            sort: 'asc',
            width: 350,
            cellRendererFramework: RouteToDetail
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
    ], [RouteToDetail, customPropertyName]);

    const customPropSummary = useMemo(() => {
        if (!project) {
            return {};
        }
        return _.reduce(project.roProjectWithData.nodes, (result: { [key: string]: object[] }, node) => {
            const customProp = _.find(project.roProjectWithData.custom_node_props, { title: customPropertyName });
            _.forEach(_.filter(node.custom_props, (_prop, key) => {
                return key === customProp?.name;
            }), (prop) => {
                if (!result[prop]) {
                    result[prop] = [];
                }
                // @ts-ignore
                result[prop].push(node.id);
            });
            return result;
        }, {});
    }, [customPropertyName, project]);

    // Only show analyzed rows
    const rows = useMemo(() => {
        if (!project) {
            return [];
        }
        const allRows = _.map(customPropSummary, (prop, key) => {
            if (!project.roProjectWithData.nodesMap) {
                return [];
            }
            const typeMap = _.countBy(prop, (nodeId: string) => {
                return project.roProjectWithData.nodesMap[nodeId].type;
            });
            const rowCols: any = {
                propertyName: key,
                vms: typeMap.Virtual || '-',
                servers: typeMap.Physical || '-',
                totalComputeInstances: prop.length
            };
            return rowCols;
        });
        return _.filter(allRows, row => groupResults.params.ids.includes(row.propertyName));
    }, [customPropSummary, groupResults, project]);

    const NAV_MENU = useMigrationMenu(project?.roProjectWithData);

    if (!project || !project.roProjectWithData.nodesMap || !allGroupData) {
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

    if (!groupResults) {
        return (
            <Page tab="migration" navMenu={NAV_MENU}>
                <NoData
                    icon={<VcioIcon vcio="general-tag-outline" rem={10} width={200} iconColor={colors.blue_gray_200}/>}
                    msg={<h1>There are no {customPropertyName} results available</h1>}
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
                        <InventoryHeader project={project} title={`Analyzed ${customPropertyName}`}/>
                        <Grid container style={{ marginBottom: theme.spacing(6) }}>
                            <Grid item className={classes.headers} xs={12} style={{ marginBottom: theme.spacing(6) }}>
                                Inventory Summary
                            </Grid>
                            <DataPanelGroup
                                toolbar={{
                                    title: `Compute Instances for Each ${customPropertyName}`,
                                    buttons: {
                                        generalDownloadBtn: true
                                    }
                                }}
                                projectName={project.roProjectWithData.name || 'Error: No Project Name'}
                                tabs={[
                                    {
                                        dataId: `${project.roProjectWithData.name}_${customPropertyName}_devicesInEachCustomGroup`,
                                        data: {
                                            columnDefs,
                                            rows
                                        },
                                    }
                                ]}
                            />
                        </Grid>
                        <Grid container style={{ marginBottom: theme.spacing(6) }}>
                            <Grid item className={classes.headers} xs style={{ marginBottom: theme.spacing(6) }}>
                                Network Overview
                            </Grid>
                            <Grid container spacing={3}>
                                <Grid item md={6} sm={12}>
                                    <DataPanelGroup
                                        toolbar={{
                                            title: 'Network Throughput',
                                            buttons: {
                                                generalDownloadBtn: true
                                            }
                                        }}
                                        projectName={project.roProjectWithData.name || 'Error: No Project Name'}
                                        tabs={[
                                            {
                                                dataId: `${project.roProjectWithData.name}_${customPropertyName}_thp_custom_group_all_dependencies`,
                                                source: {
                                                    name: groupData ? 'thp_custom_group_all_dependencies.xlsx' : undefined,
                                                    url: groupData ? groupData['thp_custom_group_all_dependencies.xlsx'] : undefined
                                                },
                                                image: {
                                                    footerText: 'Network throughput between external IPs, internal VMs, and other internal physical servers and devices.',
                                                    name: groupData ? 'thp_custom_group_all_dependencies.png' : undefined,
                                                    url: groupData ? groupData['thp_custom_group_all_dependencies.png'] : undefined,
                                                    onClickHandler: imageClickHandler
                                                }
                                            }
                                        ]}
                                    />

                                </Grid>
                                <Grid item md={6} sm={12}>
                                    <DataPanelGroup
                                        toolbar={{
                                            title: `${customPropertyName} Top Talkers`,
                                            buttons: {
                                                generalDownloadBtn: true
                                            }
                                        }}
                                        projectName={project.roProjectWithData.name || 'Error: No Project Name'}
                                        tabs={[{
                                            dataId: `${project.roProjectWithData.name}_${customPropertyName}_Custom Group Top Talker`,
                                            source: {
                                                name: groupData ? 'Custom Group Top Talker.csv' : undefined,
                                                url: groupData ? groupData['Custom Group Top Talker.csv'] : undefined
                                            }
                                        }]}
                                    />
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid container style={{ marginBottom: theme.spacing(6) }}>
                            <DataPanelGroup
                                projectName={project.roProjectWithData.name || 'Error: No Project Name'}
                                toolbar={{
                                    title: `${customPropertyName} Connections`,
                                    showTotal: true,
                                    buttons: {
                                        generalDownloadBtn: true
                                    }
                                }}
                                tabs={[
                                    {
                                        tabTitle: `All ${customPropertyName} (calculated)`,
                                        dataId: `${project.roProjectWithData.name}_${customPropertyName}_all_custom_group_conversations`,
                                        source: {
                                            name: groupData ? 'all_custom_group_conversations.csv' : undefined,
                                            url: groupData ? groupData['all_custom_group_conversations.csv'] : undefined
                                        },
                                        image: {
                                            name: groupData ?
                                                `spring All Custom Groups _ ${customPropertyName} _ in Conversations_Group_1.png` : undefined,
                                            url: groupData ?
                                                groupData[`spring All Custom Groups _ ${customPropertyName} _ in Conversations_Group_1.png`] : undefined,
                                            onClickHandler: imageClickHandler
                                        }
                                    },
                                    {
                                        tabTitle: `Only Interconnected ${customPropertyName}`,
                                        dataId: `${project.roProjectWithData.name}_${customPropertyName}_Custom Group Top Talker`,
                                        source: {
                                            name: groupData ? 'Custom Group Top Talker.csv' : undefined,
                                            url: groupData ? groupData['Custom Group Top Talker.csv'] : undefined
                                        },
                                        image: {
                                            name: groupData ? `Custom Group _ ${customPropertyName} _ Interactions.png` : undefined,
                                            url: groupData ? groupData[`Custom Group _ ${customPropertyName} _ Interactions.png`] : undefined,
                                            onClickHandler: imageClickHandler
                                        }
                                    }
                                ]}
                            />
                        </Grid>
                    </Grid>
                }
                <ImageCarouselDialog
                    images={images}
                    startAt={carouselOpen.startAt}
                    handleCarouselClose={doCarouselClose}
                    imageCarouselOpen={carouselOpen.open}
                />
            </Page>
        </ProjectMessagesWrapper>
    );
};
