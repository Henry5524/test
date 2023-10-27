import { Message, NetworkTable } from '@components';
import { CircularProgress, Grid } from '@material-ui/core';
import { AG_GRID_LOCALE_EN, getIpPortsResults } from '@utils';
import { useRouter } from 'next/router';
import React from 'react';
import useSWR from 'swr';
import { useProject } from '../../../../../../services';
import { theme } from '../../../../../../styles';
import { commonProjectStyles, getXref } from '../../../../../../utils/common-project';

const TOOLTIP_NETWORK_CONVERSATION = (
    <>
        Use to:
        <ul>
            <li>Create a custom analysis</li>
            <br/>
            <li>Example: Identify the dependent compute instances and the associated subnets</li>
        </ul>
    </>
);

export default function ApplicationNetwork() {
    const classes = commonProjectStyles();
    const { query: { projectId, applicationId } } = useRouter();
    const { data: project } = useProject(projectId as string);
    const { data: appData, error } = useSWR(project?.roProjectWithData ? `application_${projectId}_${applicationId}` : null,
        // @ts-ignore
        () => getXref(project?.roProjectWithData, 'app'));
    const { data: ipPortsReduced } = useSWR(project && project.roProjectWithData.appsMap && applicationId && appData ? `ipPortsReduced_${projectId}_${applicationId}_overview` : null,
        () => getIpPortsResults('overview', project?.roProjectWithData.appsMap[applicationId as string]?.name || '', appData));

    if (!project || !project.roProjectWithData.appsMap || !ipPortsReduced || !appData) {
        return (
            <CircularProgress/>
        );
    }

    if (error || ipPortsReduced.error) {
        return (
            <Grid
                container
                direction="row"
                justify="center"
                alignItems="center"
                style={{ marginTop: 40 }}
            >
                <Message warning={true}>{error?.message ?? (ipPortsReduced?.error ? 'Results data is not available' : 'Unknown Error')}</Message>
            </Grid>
        );
    }

    return (
        <>
            {
                ipPortsReduced && ipPortsReduced.data &&
                <>
                    <Grid item className={classes.headers} xs={12} style={{ marginBottom: theme.spacing(6) }}>
                        Network Conversations and Endpoints
                    </Grid>
                    <NetworkTable
                        projectId={projectId as string}
                        dataId={`${projectId}_${applicationId}_pivot_data_network`}
                        ipPortsReduced={ipPortsReduced.data}
                        rowGroupCols={[]}
                        aggrCols={[]}
                        showCols={[]}
                        suppressCenterInDiv={true}
                        agGridOptions={
                            {
                                defaultColDef: {
                                    sortable: true
                                },
                                localeText: AG_GRID_LOCALE_EN,
                            }
                        }
                        toolbarProps={
                            {
                                title: 'Network Conversations and Endpoints',
                                titleTooltip: TOOLTIP_NETWORK_CONVERSATION,
                            }
                        }
                    />
                </>
            }
            {
                ipPortsReduced && !ipPortsReduced.data &&
                < Grid
                    container
                    direction="row"
                    justify="center"
                    alignItems="center"
                    style={{ marginTop: 40 }}
                >
                    <Message warning={true}>No Data Found</Message>
                </Grid>
            }
        </>
    );
};
