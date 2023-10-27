import { DataPanelGroup, DataPanelGroupProps, ImageCarouselDialog, Message } from '@components';
import { DataPanelColumn } from '@components/controls/DataPanelColumn';
import { CircularProgress, Grid } from '@material-ui/core';
import { useProject } from '@services';
import { theme } from '@styles';
import _ from 'lodash';
import { useRouter } from 'next/router';
import React, { useMemo, useState } from 'react';
import useSWR from 'swr';
import { commonProjectStyles, getXref } from '../../../../../../../utils/common-project';

export default function CustomDashboard() {
    const classes = commonProjectStyles();
    const { query: { projectId, customPropertyId, propertyName } } = useRouter();
    const { data: project, error } = useProject(projectId as string);
    const { data: allGroupData } = useSWR(project?.roProjectWithData ? `custom_group_${projectId}_${customPropertyId}_${propertyName}` : null,
        // @ts-ignore
        () => getXref(project?.roProjectWithData, 'group'));
    const [carouselOpen, setCarouselOpen] = useState({
        open: false,
        startAt: 0
    });

    const customProp: any = useMemo(() => project?.roProjectWithData?.customPropsMap[customPropertyId as string] || {}, [project, customPropertyId]);

    const rows = useMemo(() => {
        if (!project || !customProp) {
            return [];
        }
        const nodes = customProp[propertyName as string] || [];
        return _.map(nodes, node_id => {
            const node = project.roProjectWithData.nodesMap[node_id];
            let rowCols: any = {
                name: node.name,
                nodeId: node.id,
                type: node.type,
                ips: node.ips,
            };
            // Get list of custom node props referenced by nodes in custom group
            _.forOwn(project.roProjectWithData.custom_node_props, (custom_prop: any) => {
                rowCols = { ...rowCols, [custom_prop.name]: node.custom_props[custom_prop.name] || '' };
            });
            return rowCols;
        });
    }, [propertyName, project, customProp]);

    // Only keep mappings for this property
    const groupData: any = useMemo(() => _.pickBy(allGroupData, (_value, key) => {
        return key.includes(propertyName as string);
    }), [allGroupData, propertyName]);

    const images: {
        title: string;
        name: string;
        imageUrl: string;
    }[] = useMemo(() => {
        if (!propertyName || !groupData) {
            return [];
        }
        return [
            {
                title: propertyName + ': Network Throughput',
                name: 'thp_custom_group_' + propertyName + '_dependencies.png',
                imageUrl: groupData['thp_custom_group_' + propertyName + '_dependencies.png']
            },
            {
                title: propertyName + ' to Other Custom Groups',
                name: 'Custom Group ' + propertyName + '_to_custom_group_sup_Top_10_net_services.png',
                imageUrl: groupData['Custom Group ' + propertyName + '_to_custom_group_sup_Top_10_net_services.png']
            },
            {
                title: propertyName + ' to Internal',
                name: 'Custom Group ' + propertyName + '_to_internal_Top_10_net_services.png',
                imageUrl: groupData['Custom Group ' + propertyName + '_to_internal_Top_10_net_services.png']
            },
            {
                title: propertyName + ' to VMs',
                name: 'Custom Group ' + propertyName + '_to_vm_Top_10_net_services.png',
                imageUrl: groupData['Custom Group ' + propertyName + '_to_vm_Top_10_net_services.png']
            },
            {
                title: propertyName + ' to External',
                name: 'Custom Group ' + propertyName + '_to_external_Top_10_net_services.png',
                imageUrl: groupData['Custom Group ' + propertyName + '_to_external_Top_10_net_services.png']
            }
        ];
    }, [propertyName, groupData]);

    const imageClickHandler = useMemo(() => (imageName: string) => {
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
        _.forEach(project.roProjectWithData.custom_node_props, custom_node_prop => {
            colDefs.push({
                headerName: custom_node_prop.title,
                field: custom_node_prop.name
            });
        });
        return colDefs;
    }, [project]);

    const DPG_CUSTOM_GROUP_DEVICES: DataPanelGroupProps = useMemo(() => {
        return {
            projectName: (project && project.roProjectWithData.name) || 'Error: No Project Name ',
            toolbar: {
                title: `${propertyName} Compute Instances (` + rows.length + ')',
                showFilter: true,
                buttons: {
                    generalDownloadBtn: true
                },
                titleTooltip:
                    <>
                        Inventory of the devices associated with the {propertyName}<br/><br/>
                        Use this to evaluate if the device list is correct, or if they should be split into separate custom groups
                        (for example mycustomgroup-prod and mycustomgroup-dev instead of all in mycustomgroup)
                    </>
            },
            tabs: [
                {
                    dataId: `devicesInTheCustom_${projectId}_${customPropertyId}_${propertyName}`,
                    data: {
                        rows,
                        columnDefs
                    },
                    maxWidth: 1050
                }
            ]
        };
    }, [projectId, project, customPropertyId, propertyName, columnDefs, rows]);

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
                        The network throughput from this {propertyName} to other IP addresses outside the {propertyName}<br/><br/>
                        See dependencies to other custom groups<br/><br/>
                        <dd>
                            <li>go to the client or server dependencies tabs for more details</li>
                        </dd>
                    </>
            },
            tabs: [
                {
                    dataId: `${projectId}_thp_${propertyName}_dependencies`,
                    source: {
                        name: groupData ? 'thp_custom_group_' + propertyName + '_dependencies.xlsx' : undefined,
                        url: groupData ? groupData['thp_custom_group_' + propertyName + '_dependencies.xlsx'] : undefined
                    },
                    image: {
                        footerText: 'Network throughput between external IPs, internal VMs, and other internal physical servers and devices.',
                        name: groupData ? 'thp_custom_group_' + propertyName + '_dependencies.png' : undefined,
                        url: groupData ? groupData['thp_custom_group_' + propertyName + '_dependencies.png'] : undefined,
                        onClickHandler: imageClickHandler
                    },
                    maxWidth: 900
                }
            ]
        };
    }, [projectId, project, propertyName, groupData, imageClickHandler]);

    const DPG_CUSTOM_GROUP_TO_OWNER: DataPanelGroupProps = useMemo(() => {
        return {
            projectName: project?.roProjectWithData.name || 'Error: No Project Name ',
            toolbar: {
                title: `${propertyName} to Owner`,
                buttons: {
                    generalDownloadBtn: true
                },
                titleTooltip:
                    <>
                        Highlight the top (10) network services. <br/><br/>
                        You can see the number of vms in the {propertyName}
                        (15 vms that have conversations that we have captured / 15 vms total that belong to the {propertyName}) <br/><br/>
                        Can see undefined ports that have a lot of traffic → can go back to VW to define those ports<br/><br/>
                        Go to the “Detailed Network Data” tab to drill in to details<br/><br/>
                    </>
            },
            tabs: [
                {
                    dataId: `${projectId}_thp_${propertyName}_to_Owner_sup_Top_10_net_services`,
                    image: {
                        name: groupData ? 'Custom Group ' + propertyName + '_to_Owner_sup_Top_10_net_services.png' : undefined,
                        url: groupData ? groupData['Custom Group ' + propertyName + '_to_Owner_sup_Top_10_net_services.png'] : undefined,
                        onClickHandler: imageClickHandler
                    }
                }
            ]
        };
    }, [projectId, project, propertyName, groupData, imageClickHandler]);

    const DPG_CUSTOM_GROUP_TO_INTERNAL: DataPanelGroupProps = useMemo(() => {
        return {
            projectName: project?.roProjectWithData.name || 'Error: No Project Name ',
            toolbar: {
                title: `${propertyName} to Internal`,
                buttons: {
                    generalDownloadBtn: true
                },
                titleTooltip:
                    <>
                        Use this to look at the other IP addresses in the data center<br/><br/>
                        Which ports might need to be opened on the firewall if you move this {propertyName}?<br/><br/>
                        Start to gauge bandwidth requirements from the cloud to the datacenter<br/><br/>
                        These are IP addresses where the device type is unknown
                    </>
            },
            tabs: [
                {
                    dataId: `${projectId}_thp_custom${propertyName}_to_internal_Top_10_net_services`,
                    image: {
                        name: groupData ? 'Custom Group ' + propertyName + '_to_internal_Top_10_net_services.png' : undefined,
                        url: groupData ? groupData['Custom Group ' + propertyName + '_to_internal_Top_10_net_services.png'] : undefined,
                        onClickHandler: imageClickHandler
                    }
                }
            ]
        };
    }, [projectId, project, propertyName, groupData, imageClickHandler]);

    const DPG_CUSTOM_GROUP_TO_VMS: DataPanelGroupProps = useMemo(() => {
        return {
            projectName: project?.roProjectWithData.name || 'Error: No Project Name ',
            toolbar: {
                title: `${propertyName} to VMs`,
                buttons: {
                    generalDownloadBtn: true
                },
                titleTooltip: 'Same as above, but for compute instances'
            },
            tabs: [
                {
                    dataId: `${projectId}_thp_custom${propertyName}_to_vm_Top_10_net_services`,
                    image: {
                        name: groupData ? 'Custom Group ' + propertyName + '_to_vm_Top_10_net_services.png' : undefined,
                        url: groupData ? groupData['Custom Group ' + propertyName + '_to_vm_Top_10_net_services.png'] : undefined,
                        onClickHandler: imageClickHandler
                    }
                }
            ]
        };
    }, [projectId, project, propertyName, groupData, imageClickHandler]);

    const DPG_CUSTOM_GROUP_TO_EXTERNAL: DataPanelGroupProps = useMemo(() => {
        return {
            projectName: project?.roProjectWithData.name || 'Error: No Project Name ',
            toolbar: {
                title: `${propertyName} to External`,
                buttons: {
                    generalDownloadBtn: true
                },
                titleTooltip:
                    <>
                        From device in the {propertyName} to public IP addresses (external)<br/><br/>
                        Look for any unexpected network services<br/><br/>
                        Nothing needs to be done, except to continue to allow the access<br/><br/>
                        <dd>
                            <li>In the public cloud you need to set up the security policy in the cloud to continue to allow valid access</li>
                        </dd>
                    </>
            },
            tabs: [
                {
                    dataId: `${projectId}_thp_custom${propertyName}_to_external_Top_10_net_services`,
                    image: {
                        name: groupData ? 'Custom Group ' + propertyName + '_to_external_Top_10_net_services.png' : undefined,
                        url: groupData ? groupData['Custom Group ' + propertyName + '_to_external_Top_10_net_services.png'] : undefined,
                        onClickHandler: imageClickHandler
                    }
                }
            ]
        };
    }, [projectId, project, propertyName, groupData, imageClickHandler]);

    if (!project || !project.roProjectWithData.customPropsMap || !allGroupData) {
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
                        <DataPanelGroup data-cy="customgroupDeviceCount" {...DPG_CUSTOM_GROUP_DEVICES} />
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
                            <DataPanelGroup {...DPG_CUSTOM_GROUP_TO_OWNER} />
                        </Grid>
                        <Grid item md={4} sm={12}>
                            <DataPanelGroup {...DPG_CUSTOM_GROUP_TO_INTERNAL} />
                        </Grid>
                        <Grid item md={4} sm={12}>
                            <DataPanelGroup {...DPG_CUSTOM_GROUP_TO_VMS} />
                        </Grid>
                        <Grid item md={4} sm={12}>
                            <DataPanelGroup {...DPG_CUSTOM_GROUP_TO_EXTERNAL} />
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
