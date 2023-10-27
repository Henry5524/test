import {
    CalculationError, ProjectMessagesWrapper, DataPanelGroup,
    DataPanelGroupProps, ImageCarouselDialog, InventoryHeader, Message, Page
} from '@components';
import { CircularProgress, Grid } from '@material-ui/core';
import _ from 'lodash';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import useSWR from 'swr';
import { useMigrationMenu } from '../../../../hooks';
import { useProjectLight } from '../../../../services';
import { theme } from '../../../../styles';
import { CalcStatus, commonProjectStyles, getProjectStatus, getXref, ProjectViewType } from '../../../../utils/common-project';

export default function Overview() {
    const classes = commonProjectStyles();
    const { query: { projectId } } = useRouter();
    const { data: project, error } = useProjectLight(projectId as string);
    const { data: overviewData } = useSWR(project ? `overview_${projectId}` : null,
        // @ts-ignore
        () => getXref(project, 'overview'));

    const [carouselOpen, setCarouselOpen] = useState({
        open: false,
        startAt: 0
    });
    let images: {
        title: string;
        name: string;
        imageUrl: string;
    }[] = [];
    const imageClickHandler = (imageName: string) => {
        setCarouselOpen({
            open: true,
            startAt: Math.max(_.findIndex(images, (image) => {
                return image.name === imageName;
            }), 0)
        });
    };
    if (overviewData) {
        images = [
            {
                title: 'Network Overview',
                name: 'thp_all_dependencies.png',
                imageUrl: overviewData['thp_all_dependencies.png']
            }
        ];
    }

    const NAV_MENU = useMigrationMenu(project);

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

    if (project && project.results) {
        if (getProjectStatus(project.results, ProjectViewType.Overview) === CalcStatus.Error) {
            return (
                <Page tab="migration" navMenu={NAV_MENU}>
                    <CalculationError
                        type={ProjectViewType.Overview}
                        msg="Environment Overview was calculated with errors"
                        projectName={project.name}
                    />
                </Page>
            );
        }
    }

    const DPG_COMPUTE_DEVICE_INVENTORY: DataPanelGroupProps = {
        toolbar: {
            title: 'Inventory Counts',
            buttons: {
                generalDownloadBtn: true
            },
            titleTooltip:
                <>
                    Use to:
                    <ul>
                        <li>Confirm that the displayed number and type of compute instances match expectations</li>
                        <br /><li>Identify compute instances without an IP address, as these must be resolved</li>
                        <br /><li>Determine if the number of conversations match NetFlow output</li>
                    </ul>
                </>
        },
        projectName: project.name || 'Error: No Project Name',
        tabs: [
            {
                dataId: `${project.name}_invent_entity_summary`,
                source: {
                    name: overviewData ? 'invent_entity_summary.xlsx' : undefined,
                    url: overviewData ? overviewData['invent_entity_summary.xlsx'] : undefined
                },
            }
        ]
    };

    const DPG_NETWORK_TROUGHPUT: DataPanelGroupProps = {
        projectName: project.name || 'Error: No Project Name',
        toolbar: {
            title: 'Network Throughput',
            buttons: {
                generalDownloadBtn: true
            },
            titleTooltip:
                <>
                    Use to:
                    <ul>
                        <li>View relationships and throughput rates in all conversations</li>
                        <br /><li>Determine if numbers are expected or if more data collection is needed</li>
                    </ul>
                </>
        },
        tabs: [
            {
                dataId: `${project.name}_thp_all_dependencies`,
                source: {
                    name: overviewData ? 'thp_all_dependencies.xlsx' : undefined,
                    url: overviewData ? overviewData['thp_all_dependencies.xlsx'] : undefined
                },
                image: {
                    footerText: 'Network throughput between external IPs, internal VMs, and other internal physical servers and devices.',
                    name: overviewData ? 'thp_all_dependencies.png' : undefined,
                    url: overviewData ? overviewData['thp_all_dependencies.png'] : undefined,
                    onClickHandler: imageClickHandler
                }
            }
        ]
    };

    const DPG_CONVERSATION_SUMMARY: DataPanelGroupProps = {
        projectName: project.name || 'Error: No Project Name',
        toolbar: {
            title: 'Conversation Summary',
            buttons: {
                generalDownloadBtn: true
            },
            titleTooltip:
                <>
                    Use to:
                    <ul>
                        <li>View the number of unique NetFlow conversation types</li>
                    </ul>
                </>
        },
        tabs: [
            {
                dataId: `${project.name}_conversation_summary`,
                source: {
                    name: overviewData ? 'conversation_summary.xlsx' : undefined,
                    url: overviewData ? overviewData['conversation_summary.xlsx'] : undefined,
                    xlsSheetNames: ['Conversation Summary']
                }
            }
        ]
    };

    const DPG_DEVICES: DataPanelGroupProps = {
        projectName: project.name || 'Error: No Project Name',
        toolbar: {
            title: 'Compute Instances - Network Service Details',
            showFilter: true,
            showTotal: true,
            buttons: {
                filterBtn: false,
                dataColumnsBtn: false,
                dataSortBtn: false,
                generalDownloadBtn: true
            },
            titleTooltip:
                <>
                    Use to:
                    <ul>
                        <li>Identify the network services and distribution of bandwidth usage</li>
                        <br /><li>Track connections between different types of network traffic</li>
                    </ul>
                </>
        },
        tabs: [
            {
                dataId: `${project.name}_vm_all_net_services`,
                source: {
                    name: overviewData ? 'vm_all_net_services.xlsx' : undefined,
                    url: overviewData ? overviewData['vm_all_net_services.xlsx'] : undefined
                }
            }
        ]
    };

    return (
        <ProjectMessagesWrapper maskWhenCalculating={false}>
            <Page tab="migration" navMenu={NAV_MENU}>
                {
                    !error && overviewData &&
                    <Grid container className={classes.container}>
                        <InventoryHeader project={project} title='Environment Overview'/>
                        <Grid container style={{ marginBottom: theme.spacing(6) }}>
                            <Grid item className={classes.headers} xs={12} style={{ marginBottom: theme.spacing(6) }}>
                                Inventory Summary
                            </Grid>
                            <DataPanelGroup {...DPG_COMPUTE_DEVICE_INVENTORY} data-cy="computeInstancesInventory"/>
                        </Grid>
                        <Grid container style={{ marginBottom: theme.spacing(6) }}>
                            <Grid item className={classes.headers} xs style={{ marginBottom: theme.spacing(6) }}>
                                Network Overview
                            </Grid>
                            <Grid container spacing={3}>
                                <Grid item md={6} sm={12}>
                                    <DataPanelGroup {...DPG_NETWORK_TROUGHPUT} data-cy="networkThroughput"/>
                                </Grid>
                                <Grid item md={6} sm={12}>
                                    <DataPanelGroup {...DPG_CONVERSATION_SUMMARY} data-cy="conversationSummary"/>
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid container style={{ marginBottom: theme.spacing(6) }}>
                            <DataPanelGroup {...DPG_DEVICES} />
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
            </Page>
        </ProjectMessagesWrapper>
    );
};
