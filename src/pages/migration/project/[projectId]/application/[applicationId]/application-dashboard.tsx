import { DataPanelGroup, DataPanelGroupProps, ImageCarouselDialog, Message } from '@components';
import { DataPanelColumn } from '@components/controls/DataPanelColumn';
import { CircularProgress, Grid } from '@material-ui/core';
import { useProject } from '@services';
import { theme } from '@styles';
import _ from 'lodash';
import { useRouter } from 'next/router';
import React, { useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';
import { CustomProperty } from '../../../../../../models';
import { commonProjectStyles, getXref } from '../../../../../../utils/common-project';

export default function ApplicationDashboard() {
    const classes = commonProjectStyles();
    const { query: { projectId, applicationId } } = useRouter();
    const { data: project, error } = useProject(projectId as string);
    const { data: appData } = useSWR(project?.roProjectWithData ? `application_${projectId}_${applicationId}` : null,
        // @ts-ignore
        () => getXref(project.roProjectWithData, 'app'));
    const [carouselOpen, setCarouselOpen] = useState({
        open: false,
        startAt: 0
    });

    const app: any = useMemo(() => {
        if (!project) {
            return {};
        }
        return project.roProjectWithData.appsMap[applicationId as string];
    }, [project, applicationId]);

    const images: {
        title: string;
        name: string;
        imageUrl: string;
    }[] = useMemo(() => {
        if (!app || !appData) {
            return [];
        }
        return [
            {
                title: app.name + ': Network Throughput',
                name: 'thp_app_' + app.name + '_dependencies.png',
                imageUrl: appData['thp_app_' + app.name + '_dependencies.png']
            },
            {
                title: app.name + ': App to Other Apps',
                name: 'App ' + app.name + '_to_app_sup_Top_10_net_services.png',
                imageUrl: appData['App ' + app.name + '_to_app_sup_Top_10_net_services.png']
            },
            {
                title: app.name + ': App to Self',
                name: 'App ' + app.name + '_to_' + app.name + '_Top_10_net_services.png',
                imageUrl: appData['App ' + app.name + '_to_' + app.name + '_Top_10_net_services.png']
            },
            {
                title: app.name + ': App to Internal',
                name: 'App ' + app.name + '_to_internal_Top_10_net_services.png',
                imageUrl: appData['App ' + app.name + '_to_internal_Top_10_net_services.png']
            },
            {
                title: app.name + ': App to VMs',
                name: 'App ' + app.name + '_to_vm_Top_10_net_services.png',
                imageUrl: appData['App ' + app.name + '_to_vm_Top_10_net_services.png']
            },
            {
                title: app.name + ': App to External',
                name: 'App ' + app.name + '_to_external_Top_10_net_services.png',
                imageUrl: appData['App ' + app.name + '_to_external_Top_10_net_services.png']
            }
        ];
    }, [appData, app]);

    const imageClickHandler = useCallback((imageName: string) => {
        setCarouselOpen({
            open: true,
            startAt: Math.max(_.findIndex(images, (image) => {
                return image.name === imageName;
            }), 0)
        });
    }, [images]);

    const columnDefs = useMemo((): DataPanelColumn[] => {
        if (!project) {
            return [];
        }
        const colDefs: DataPanelColumn[] = [
            {
                headerName: 'Compute Instance',
                field: 'name',
                sort: 'asc'
            },
            {
                headerName: 'Type',
                field: 'type'
            },
            {
                headerName: 'IP Addresses',
                field: 'ips'
            }
        ];
        _.forEach(project.roProjectWithData.custom_node_props, (custom_prop: CustomProperty) => {
            colDefs.push({
                headerName: custom_prop.title,
                field: custom_prop.name
            });
        });
        return colDefs;
    }, [project]);

    const rows: any[] = useMemo(() => {
        if (!project) {
            return [];
        }
        return _.map(app.node_ids, node_id => {
            const node = project.roProjectWithData.nodesMap[node_id];
            let rowCols: any = {
                name: node.name,
                nodeId: node.id,
                type: node.type,
                ips: node.ips,
            };
            // Get list of custom node props referenced by nodes in application
            _.forEach(project.roProjectWithData.custom_node_props, (custom_prop: any) => {
                rowCols = { ...rowCols, [custom_prop.name]: node.custom_props[custom_prop.name] || '' };
            });
            return rowCols;
        });
    }, [app, project]);

    const DPG_APPLICATION_DEVICES: DataPanelGroupProps = useMemo(() => {
        return {
            projectName: project?.roProjectWithData.name || 'Error: No Project Name ',
            toolbar: {
                title: 'Application Compute Instances (' + rows.length + ')',
                showFilter: true,
                buttons: {
                    generalDownloadBtn: true
                },
                titleTooltip:
                    <>
                        Use to:
                        <ul>
                            <li>Evaluate if compute instances list is accurate</li>
                            <br/>
                            <li>Establish if some compute instances should be a moved to alternative applications to reduce risk during migration</li>
                        </ul>
                    </>
            },
            tabs: [
                {
                    dataId: `devicesInTheApplication_${projectId}_${applicationId}`,
                    data: {
                        rows,
                        columnDefs
                    },
                    maxWidth: 1050
                }
            ]
        };
    }, [applicationId, columnDefs, project, projectId, rows]);

    const DPG_NETWORK_THROUGHPUT: DataPanelGroupProps = useMemo(() => {
        return {
            projectName: project?.roProjectWithData.project_name || 'Error: No Project Name ',
            toolbar: {
                title: 'Network Throughput',
                buttons: {
                    generalDownloadBtn: true
                },
                titleTooltip:
                    <>
                        Use to:
                        <ul>
                            <li>View throughput from an application to IP addresses that are outside the application</li>
                            <br/>
                            <li>Identify dependencies on other applications</li>
                        </ul>
                    </>
            },
            tabs: [
                {
                    dataId: `${projectId}_thp_app${applicationId}_dependencies`,
                    source: {
                        name: appData ? 'thp_app_' + app.name + '_dependencies.xlsx' : undefined,
                        url: appData ? appData['thp_app_' + app.name + '_dependencies.xlsx'] : undefined
                    },
                    image: {
                        footerText: 'Network throughput between external IPs, internal VMs, and other internal physical servers and devices.',
                        name: appData ? 'thp_app_' + app.name + '_dependencies.png' : undefined,
                        url: appData ? appData['thp_app_' + app.name + '_dependencies.png'] : undefined,
                        onClickHandler: imageClickHandler
                    },
                    maxWidth: 900
                }
            ]
        };
    }, [app, appData, applicationId, imageClickHandler, project, projectId]);

    const DPG_APPS_TO_OTHER_APPS: DataPanelGroupProps = useMemo(() => {
        return {
            projectName: project?.roProjectWithData.name || 'Error: No Project Name ',
            toolbar: {
                title: 'Apps to Other Apps',
                buttons: {
                    generalDownloadBtn: true
                },
                titleTooltip:
                    <>
                        Use to:
                        <ul>
                            <li>Focus on the top 10 network services by trafficFocus on the top 10 network services by traffic</li>
                            <br/>
                            <li>Identify undefined ports to be resolved</li>
                            <br/>
                            <li>Relate to information on the Detailed Network Data tab</li>
                        </ul>
                    </>
            },
            tabs: [
                {
                    dataId: `${projectId}_${applicationId}_App app_to_app_Top_10_net_services`,
                    image: {
                        name: appData ? `App ${app.name}_to_app_sup_Top_10_net_services.png` : undefined,
                        url: appData ? appData[`App ${app.name}_to_app_sup_Top_10_net_services.png`] : undefined,
                        onClickHandler: imageClickHandler
                    }
                }
            ]
        };
    }, [appData, applicationId, imageClickHandler, project, projectId, app]);

    const DPG_APP_TO_SELF: DataPanelGroupProps = useMemo(() => {
        return {
            projectName: project?.roProjectWithData.name || 'Error: No Project Name ',
            toolbar: {
                title: 'App to Self',
                buttons: {
                    generalDownloadBtn: true
                },
                titleTooltip:
                    <>
                        Use to:
                        <ul>
                            <li>Determine the top 10 services accessed between compute instances in an application</li>
                        </ul>
                    </>
            },
            tabs: [
                {
                    dataId: `${projectId}_thp_app${applicationId}_Top_10_net_services`,
                    image: {
                        name: appData ? 'App ' + app.name + '_to_' + app.name + '_Top_10_net_services.png' : undefined,
                        url: appData ? appData['App ' + app.name + '_to_' + app.name + '_Top_10_net_services.png'] : undefined,
                        onClickHandler: imageClickHandler
                    }
                }
            ]
        };
    }, [app, appData, applicationId, imageClickHandler, project, projectId]);

    const DPG_APPS_TO_INTERNAL: DataPanelGroupProps = useMemo(() => {
        return {
            projectName: project?.roProjectWithData.name || 'Error: No Project Name ',
            toolbar: {
                title: 'App to Internal',
                buttons: {
                    generalDownloadBtn: true
                },
                titleTooltip:
                    <>
                        Use to:
                        <ul>
                            <li>Determine if any ports need to be opened on the firewall to move the application</li>
                            <br/>
                            <li>Help gauge bandwidth requirements for the top 10 services</li>
                        </ul>
                    </>
            },
            tabs: [
                {
                    dataId: `${projectId}_thp_app${applicationId}_to_internal_Top_10_net_services`,
                    image: {
                        name: appData ? 'App ' + app.name + '_to_internal_Top_10_net_services.png' : undefined,
                        url: appData ? appData['App ' + app.name + '_to_internal_Top_10_net_services.png'] : undefined,
                        onClickHandler: imageClickHandler
                    }
                }
            ]
        };
    }, [app, appData, applicationId, imageClickHandler, project, projectId]);

    const DPG_APPS_TO_VMS: DataPanelGroupProps = useMemo(() => {
        return {
            projectName: project?.roProjectWithData.name || 'Error: No Project Name ',
            toolbar: {
                title: 'App to VMs',
                buttons: {
                    generalDownloadBtn: true
                },
                titleTooltip:
                    <>
                        Use to:
                        <ul>
                            <li>Determine if any ports need to be opened on the firewall to move the application</li>
                            <br/>
                            <li>Help gauge bandwidth requirements for the top 10 services</li>
                        </ul>
                    </>
            },
            tabs: [
                {
                    dataId: `${projectId}_thp_app${applicationId}_to_vm_Top_10_net_services`,
                    image: {
                        name: appData ? 'App ' + app.name + '_to_vm_Top_10_net_services.png' : undefined,
                        url: appData ? appData['App ' + app.name + '_to_vm_Top_10_net_services.png'] : undefined,
                        onClickHandler: imageClickHandler
                    }
                }
            ]
        };
    }, [app, appData, applicationId, imageClickHandler, project, projectId]);

    const DPG_APPS_TO_EXTERNAL: DataPanelGroupProps = useMemo(() => {
        return {
            projectName: project?.roProjectWithData.name || 'Error: No Project Name ',
            toolbar: {
                title: 'App to External',
                buttons: {
                    generalDownloadBtn: true
                },
                titleTooltip:
                    <>
                        Use to:
                        <ul>
                            <li>View number of compute instances and throughput rates to public IP addresses</li>
                            <br/>
                            <li>Look for unexpected network services that need access</li>
                        </ul>
                    </>
            },
            tabs: [
                {
                    dataId: `${projectId}_thp_app${applicationId}_to_external_Top_10_net_services`,
                    image: {
                        name: appData ? 'App ' + app.name + '_to_external_Top_10_net_services.png' : undefined,
                        url: appData ? appData['App ' + app.name + '_to_external_Top_10_net_services.png'] : undefined,
                        onClickHandler: imageClickHandler
                    }
                }
            ]
        };
    }, [app, appData, applicationId, imageClickHandler, project, projectId]);

    if (!project || !project.roProjectWithData.appsMap || !project.roProjectWithData.customPropsMap || !appData) {
        return (
            <CircularProgress/>
        );
    }

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

    return (
        <>
            {
                rows &&
                <>
                    <Grid item className={classes.headers} xs={12} style={{ marginBottom: theme.spacing(6) }}>
                        Inventory
                    </Grid>
                    <Grid container style={{ marginBottom: theme.spacing(6) }}>
                        <DataPanelGroup data-cy="appDeviceCount" {...DPG_APPLICATION_DEVICES} />
                    </Grid>
                    <Grid item className={classes.headers} xs={12} style={{ marginBottom: theme.spacing(6) }}>
                        Network Overview
                    </Grid>
                    <Grid container style={{ marginBottom: theme.spacing(6) }}>
                        <DataPanelGroup {...DPG_NETWORK_THROUGHPUT} />
                    </Grid>
                    <Grid item className={classes.headers} xs={12} style={{ marginBottom: theme.spacing(6) }}>
                        Top Network Services By Category
                    </Grid>
                    <Grid container style={{ marginBottom: theme.spacing(6) }} spacing={3}>
                        <Grid item md={4} sm={12}>
                            <DataPanelGroup {...DPG_APPS_TO_OTHER_APPS} />
                        </Grid>
                        <Grid item md={4} sm={12}>
                            <DataPanelGroup {...DPG_APP_TO_SELF} />
                        </Grid>
                        <Grid item md={4} sm={12}>
                            <DataPanelGroup {...DPG_APPS_TO_INTERNAL} />
                        </Grid>
                        <Grid item md={4} sm={12}>
                            <DataPanelGroup {...DPG_APPS_TO_VMS} />
                        </Grid>
                        <Grid item md={4} sm={12}>
                            <DataPanelGroup {...DPG_APPS_TO_EXTERNAL} />
                        </Grid>
                    </Grid>
                </>
            }
            <ImageCarouselDialog
                images={images}
                startAt={carouselOpen.startAt}
                handleCarouselClose={() => {
                    setCarouselOpen({
                        open: false,
                        startAt: 0
                    });
                }}
                imageCarouselOpen={carouselOpen.open}
            />
        </>
    );
};
