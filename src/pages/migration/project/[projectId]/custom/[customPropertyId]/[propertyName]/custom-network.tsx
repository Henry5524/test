import { Message, NetworkTable } from '@components';
import { CircularProgress, Grid } from '@material-ui/core';
import { AG_GRID_LOCALE_EN, getIpPortsResults } from '@utils';
import { useRouter } from 'next/router';
import React, { useMemo } from 'react';
import useSWR from 'swr';
import { useProject } from '../../../../../../../services';
import { theme } from '../../../../../../../styles';
import { commonProjectStyles, getXref } from '../../../../../../../utils/common-project';

export default function CustomNetwork() {
    const classes = commonProjectStyles();
    const { query: { projectId, customPropertyId, propertyName } } = useRouter();
    const { data: project } = useProject(projectId as string);
    const { data: allGroupData, error } = useSWR(project?.roProjectWithData ? `custom_group_${projectId}_${customPropertyId}_${propertyName}` : null,
        () => getXref(project?.roProjectWithData, 'group'));
    const { data: ipPortsReduced } = useSWR(allGroupData ? `ipPortsReduced_${projectId}_${customPropertyId}_${propertyName}_overview` : null,
        () => getIpPortsResults('overview', propertyName as string, allGroupData));

    const TOOLTIP_NETWORK_CONVERSATION = useMemo(() => (
        <>
            Use this data for your own custom analysis<br/><br/>
            <dd>
                <li>
                    Ex: identify subnets and count the number of devices in each subnet → if there are a large number of dependent devices,
                    are they all coming from the same subnet (same {propertyName}?), different ways to summarize the data
                </li>
            </dd>
        </>
    ), [propertyName]);

    if (!project || !project.roProjectWithData.appsMap || !ipPortsReduced || !allGroupData || !propertyName) {
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
                        dataId={`${projectId}_${customPropertyId}_${propertyName}_pivot_data_network`}
                        ipPortsReduced={ipPortsReduced.data}
                        rowGroupCols={[]}
                        aggrCols={[]}
                        showCols={[]}
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
