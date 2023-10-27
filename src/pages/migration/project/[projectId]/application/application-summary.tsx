import { CalculationError, DataPanelGroup, DataPanelGroupProps, ImageCarouselDialog, InventoryHeader, Message, Page, ProjectMessagesWrapper, VcioIcon } from '@components';
import { CircularProgress, Grid } from '@material-ui/core';
import { appCalcsCompleteFn, doRoute } from '@utils';
import { ICellRendererParams } from 'ag-grid-community';
import clsx from 'clsx';
import _ from 'lodash';
import { useRouter } from 'next/router';
import React, { useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';
import { DataPanelColumn } from '../../../../../components/controls/DataPanelColumn';
import { NoData } from '../../../../../components/controls/NoData';
import { useMigrationMenu } from '../../../../../hooks';
import { Target } from '../../../../../models';
import { useProject, useProjects } from '../../../../../services';
import { colors, theme } from '../../../../../styles';
import { CalcStatus, commonProjectStyles, getProjectStatus, getXref, ProjectViewType } from '../../../../../utils/common-project';

/**
 * Results summary panel for Applications
 *
 * @constructor
 */
export default function CustomPropertySummary() {
    const classes = commonProjectStyles();
    const { query: { projectId } } = useRouter();
    const router = useRouter();
    const { data: project, error } = useProject(projectId as string);
    const { data: projects } = useProjects();
    const { data: appData } = useSWR(project?.roProjectWithData ? `application_${projectId}` : null,
        // @ts-ignore
        () => getXref(project.roProjectWithData, 'app'));
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

    const NAV_MENU = useMigrationMenu(project?.roProjectWithData);

    // App info from the full projects list
    const additionalProjectInfo: any = useMemo(() => _.find(projects, { id: projectId }), [projects, projectId]);
    const appResults = useMemo(() => {
        if (additionalProjectInfo) {
            return _.find(additionalProjectInfo.results, { type: 'app' });
        }
        return {};
    }, [additionalProjectInfo]);

    const images: {
        title: string;
        name: string;
        imageUrl: string;
    }[] = useMemo(() => {
        if (!appData) {
            return [];
        }
        return [
            {
                title: 'Network Throughput',
                name: 'thp_app_all_dependencies.png',
                imageUrl: appData['thp_app_all_dependencies.png']
            },
            {
                title: 'All Applications (Calculated)',
                name: 'spring All Applications in Conversations_App_1.png',
                imageUrl: appData['spring All Applications in Conversations_App_1.png']
            },
            {
                title: 'Only Interconnected Applications',
                name: 'App Interactions.png',
                imageUrl: appData['App Interactions.png']
            }
        ];
    }, [appData]);

    const imageClickHandler = useCallback((imageName: string) => {
        setCarouselOpen({
            open: true,
            startAt: Math.max(_.findIndex(images, (image) => {
                return image.name === imageName;
            }), 0)
        });
    }, [images]);

    const RouteToDetail = useCallback((params: ICellRendererParams) => {
        if (additionalProjectInfo && appCalcsCompleteFn(params, appResults)) {
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
    }, [appResults, classes, router, additionalProjectInfo]);

    const columnDefs: DataPanelColumn[] = useMemo(() => {
        return [
            {
                headerName: 'Application',
                field: 'application',
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
        ];
    }, [RouteToDetail]);

    // Only show analyzed rows
    const rows = useMemo(() => {
        if (!project || !appResults?.params?.ids) {
            return [];
        }
        const allRows: any[] = _.map(project.roProjectWithData.apps, app => {
            const typeMap = _.countBy(app.node_ids, node_id => {
                return project.roProjectWithData.nodesMap[node_id].type;
            });
            const rowCols: any = {
                application: app.name,
                applicationId: app.id,
                vms: typeMap.Virtual || '-',
                servers: typeMap.Physical || '-',
                totalComputeInstances: app.node_ids.length
            };
            return rowCols;
        });
        return _.filter(allRows, row => appResults.params.ids.includes(row.application));
    }, [appResults, project]);

    const DPG_DEVICES_IN_EACH_APPLICATION: DataPanelGroupProps = useMemo(() => {
        return {
            toolbar: {
                title: 'Compute Instances in Each Application',
                buttons: {
                    generalDownloadBtn: true
                },
                titleTooltip:
                    <>
                        Use to:
                        <ul>
                            <li>Check results of dependency calculations between applications and compute instances</li>
                            <br/>
                            <li>Determine if changes need to be made to applications Example: Compute instances span too many locations.</li>
                        </ul>
                    </>
            },
            projectName: project?.roProjectWithData.name || 'Error: No Project Name',
            tabs: [
                {
                    dataId: `${project?.roProjectWithData.name}_devicesInEachApplication`,
                    data: {
                        columnDefs,
                        rows
                    }
                }
            ]
        };
    }, [columnDefs, project, rows]);

    const DPG_NETWORK_THROUGHPUT: DataPanelGroupProps = useMemo(() => {
        return {
            toolbar: {
                title: 'Network Throughput',
                buttons: {
                    generalDownloadBtn: true
                },
                titleTooltip:
                    <>
                        Use to:
                        <ul>
                            <li>View how compute instances that belong to analyzed applications communicate</li>
                        </ul>
                    </>
            },
            projectName: project?.roProjectWithData.name || 'Error: No Project Name',
            tabs: [
                {
                    dataId: `${project?.roProjectWithData.name}_thp_app_all_dependencies`,
                    source: {
                        name: appData ? 'thp_app_all_dependencies.xlsx' : undefined,
                        url: appData ? appData['thp_app_all_dependencies.xlsx'] : undefined
                    },
                    image: {
                        footerText: 'Network throughput between external IPs, internal VMs, and other internal physical servers and devices.',
                        name: appData ? 'thp_app_all_dependencies.png' : undefined,
                        url: appData ? appData['thp_app_all_dependencies.png'] : undefined,
                        onClickHandler: imageClickHandler
                    },
                }
            ]
        };
    }, [imageClickHandler, project, appData]);

    const DPG_APPLICATION_TOP_TALKERS: DataPanelGroupProps = useMemo(() => {
        return {
            toolbar: {
                title: 'Application Top Talkers',
                buttons: {
                    generalDownloadBtn: true
                },
                titleTooltip:
                    <>
                        Use to:
                        <ul>
                            <li>Gather greater detail about conversation connections</li>
                            <br/>
                            <li>Determine the number of IP addresses per application that are talking to compute instances</li>
                            <br/>
                            <li>Identify the potential impact of moving specific applications to establish a move priority</li>
                        </ul>
                    </>
            },
            projectName: project?.roProjectWithData.name || 'Error: No Project Name',
            tabs: [{
                dataId: `${project?.roProjectWithData.name}_Application Top Talker`,
                source: {
                    name: appData ? 'Application Top Talker.csv' : undefined,
                    url: appData ? appData['Application Top Talker.csv'] : undefined
                }
            }]
        };
    }, [appData, project]);

    const DPG_APPLICATION_CONNECTIONS: DataPanelGroupProps = useMemo(() => {
        return {
            toolbar: {
                title: 'Application Connections',
                showTotal: true,
                buttons: {
                    generalDownloadBtn: true
                },
                titleTooltip:
                    <>
                        Use to:
                        <ul>
                            <li>See how analyzed applications talk to each other</li>
                            <br/>
                            <li>Determine which applications are easier or more complicated to move based on dependencies</li>
                        </ul>
                    </>
            },
            projectName: project?.roProjectWithData.name || 'Error: No Project Name',
            tabs: [
                {
                    dataId: `${project?.roProjectWithData.name}all_app_conversations`,
                    tabTitle: 'All Applications (Calculated)',
                    source: {
                        name: appData ? 'all_app_conversations.csv' : undefined,
                        url: appData ? appData['all_app_conversations.csv'] : undefined
                    },
                    image: {
                        name: appData ? 'spring All Applications in Conversations_App_1.png' : undefined,
                        url: appData ? appData['spring All Applications in Conversations_App_1.png'] : undefined,
                        onClickHandler: imageClickHandler
                    }
                },
                {
                    tabTitle: 'Only Interconnected Applications',
                    dataId: `${project?.roProjectWithData.name}_Application Top Talker`,
                    source: {
                        name: appData ? 'Application Top Talker.csv' : undefined,
                        url: appData ? appData['Application Top Talker.csv'] : undefined
                    },
                    image: {
                        name: appData ? 'spring All Applications in Conversations_App_1.png' : undefined,
                        url: appData ? appData['App Interactions.png'] : undefined,
                        onClickHandler: imageClickHandler
                    }
                }
            ]
        };
    }, [appData, imageClickHandler, project]);

    if (!project || !project.roProjectWithData.nodesMap || !projects || !appData) {
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
                    msg="Applications were calculated with errors"
                    projectName={project.roProjectWithData.name}
                />
            </Page>
        );
    }

    // There were no results for the applications
    if (!appResults) {
        return (
            <Page tab="migration" navMenu={NAV_MENU}>
                <NoData
                    icon={<VcioIcon vcio="migration-application" rem={10} width={200} iconColor={colors.blue_gray_200}/>}
                    msg={<h1>There are no application results available</h1>}
                />
            </Page>
        );
    }

    return (
        <ProjectMessagesWrapper maskWhenCalculating={false}>
            <Page tab="migration" navMenu={NAV_MENU}>
                {
                    !error && appData &&

                    <Grid container className={classes.container}>
                        <InventoryHeader project={project} title='Analyzed Applications'/>
                        <Grid container style={{ marginBottom: theme.spacing(6) }}>
                            <Grid item className={classes.headers} xs={12} style={{ marginBottom: theme.spacing(6) }}>
                                Inventory Summary
                            </Grid>
                            <DataPanelGroup {...DPG_DEVICES_IN_EACH_APPLICATION} />
                        </Grid>
                        <Grid container style={{ marginBottom: theme.spacing(6) }}>
                            <Grid item className={classes.headers} xs style={{ marginBottom: theme.spacing(6) }}>
                                Network Overview
                            </Grid>
                            <Grid container spacing={3}>
                                <Grid item md={6} sm={12}>
                                    <DataPanelGroup {...DPG_NETWORK_THROUGHPUT} />

                                </Grid>
                                <Grid item md={6} sm={12}>
                                    <DataPanelGroup {...DPG_APPLICATION_TOP_TALKERS} />
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid container style={{ marginBottom: theme.spacing(6) }}>
                            <DataPanelGroup {...DPG_APPLICATION_CONNECTIONS} />
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
}
;
