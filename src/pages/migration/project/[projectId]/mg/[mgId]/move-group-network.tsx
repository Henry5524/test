import { DataPanelGroup, Message, Page } from '@components';
import { CircularProgress, Grid } from '@material-ui/core';
import _ from 'lodash';
import { useRouter } from 'next/router';
import React, { useMemo } from 'react';
import useSWR from 'swr';
import { DataPanelColumn } from '../../../../../../components/controls/DataPanelColumn';
import { useProject } from '../../../../../../services';
import { theme } from '../../../../../../styles';
import { getXref } from '../../../../../../utils/common-project';

const RowFilter = (columns: DataPanelColumn[], rows: []) => {
    const column = _.find(columns, { 'headerName': 'MoveGroup' });
    if (!column || !column.field) {
        return rows;
    }
    return _.filter(rows, (row: any) => {
        // @ts-ignore
        return row[column.field] === project.roProjectWithData.moveGroupMap[mgId].name;
    });
};

export default function MoveGroupNetwork() {
    const { query: { projectId, mgId } } = useRouter();
    const { data: project, error } = useProject(projectId as string);
    const { data: mgData } = useSWR(project?.roProjectWithData ? `movegroup_${projectId}` : null,
        // @ts-ignore
        () => getXref(project?.roProjectWithData, 'mg'));
    const { data: projectOverview } = useSWR(project?.roProjectWithData ? `overview_${projectId}` : null,
        // @ts-ignore
        () => getXref(project?.roProjectWithData, 'root'));

    const dataFileName = useMemo(() => {
        if (!project || !mgData) {
            return '';
        }
        const dataFileNameRegex = new RegExp(`${project.roProjectWithData.moveGroupMap[mgId as string].name.replace(/ /g, '')}_[0-9]+_ips_ports_reduced.csv`);
        return _.find(mgData, (_value: any, key: any) => {
            return key.search(dataFileNameRegex) > -1;
        });
    }, [project, mgData, mgId]);

    if (!project || !mgData || !project.roProjectWithData.moveGroupMap) {
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

    return (
        <>
            {
                !error && mgData && project && dataFileName &&
                <Grid item>
                    {
                        projectOverview &&
                        <Grid container style={{ marginBottom: theme.spacing(6) }}>
                            <DataPanelGroup
                                toolbar={{
                                    showFilter: true,
                                    showTotal: true,
                                    buttons: {
                                        generalDownloadBtn: true,
                                    },
                                    title: 'Network Conversations and Endpoints',
                                    titleTooltip:
                                        <>
                                            Use to:
                                            <ul>
                                                <li>Create a custom analysis</li>
                                                <br/>
                                                <li>Example: Identify the dependent compute instances and the associated subnets</li>
                                            </ul>
                                        </>
                                }}
                                projectName={project.roProjectWithData.name || ''}
                                tabs={[
                                    {
                                        dataId: `${project.roProjectWithData.name}_${dataFileName}`,
                                        source: {
                                            name: dataFileName,
                                            url: dataFileName
                                        },
                                        dataFilter: RowFilter
                                    }
                                ]}
                            />
                        </Grid>
                    }
                </Grid>
            }
            {
                !(!error && mgData && project && dataFileName) &&
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
