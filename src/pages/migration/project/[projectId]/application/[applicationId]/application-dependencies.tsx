import { DataTransferGraphic, InformationTooltip, Message, NetworkTable, VcioIcon } from '@components';
import { Box, CircularProgress, Grid, Menu, MenuItem } from '@material-ui/core';
import { useProject } from '@services';
import { colors, theme } from '@styles';
import { AG_GRID_LOCALE_EN, getIpPortsResults, InventoryType } from '@utils';
import { commonProjectStyles, getXref } from '@utils/common-project';
import { useRouter } from 'next/router';
import React, { MouseEvent, useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';

interface ApplicationDependenciesProps {
    type: 'client' | 'server';
}

const AG_GRID_OPTIONS_1 = {
    localeText: AG_GRID_LOCALE_EN,
    defaultColDef: {
        sortable: true
    },
};

const AG_GRID_OPTIONS_2 = {
    groupSuppressAutoColumn: true,
    groupIncludeTotalFooter: true,
    suppressRowClickSelection: true,
    localeText: AG_GRID_LOCALE_EN,
    defaultColDef: {
        sortable: true
    },
    domLayout: 'autoHeight'
};

/**
 * Main function for application - client/server dependencies tab
 *
 * @constructor
 */
export default function ApplicationDependencies(props: ApplicationDependenciesProps) {
    const classes = commonProjectStyles();
    const { query: { projectId, applicationId } } = useRouter();
    const { data: project } = useProject(projectId as string);
    const { data: appData, error } = useSWR(project?.roProjectWithData ? `application_${projectId}_${applicationId}` : null,
        () => getXref(project?.roProjectWithData, 'app'));
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [currentMode, setCurrentMode] = useState<{
        id: string;
        displayName: string;
    }>({
        id: InventoryType.Application,
        displayName: 'Application'
    });
    const typeDisplayName = useMemo(() => {
        return props.type.charAt(0).toUpperCase() + props.type.slice(1);
    }, [props.type]);
    const { data: ipPortsReduced } = useSWR(project && applicationId && appData ? `ipPortsReduced_${projectId}_${applicationId}_${props.type}` : null,
        () => getIpPortsResults(props.type, project?.roProjectWithData.appsMap[applicationId as string]?.name || '', appData));
    const { data: ipPortsReducedAggr } = useSWR(project && applicationId && appData ? `ipPortsReduced_${projectId}_${applicationId}_${props.type}_aggr` : null,
        () => getIpPortsResults(props.type === 'client' ? 'client_aggr' : 'server_aggr', project?.roProjectWithData.appsMap[applicationId as string]?.name || '', appData));

    const onAppMenuClick = useCallback((event: MouseEvent<HTMLElement>) => {
        setAnchorEl(null);
        const mode = event.currentTarget.id || InventoryType.Device;
        setCurrentMode({
            id: mode,
            displayName: mode === InventoryType.Device ? 'Compute Instance' : mode
        });
    }, []);

    const onAppMenuOpen = useCallback(() => setAnchorEl(document.getElementById('dropdownMenuAnchor')), []);

    const onAppMenuClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    const TOOLTIP_MAXIMUM_THROUGHPUT = useMemo(() => (
        <>
            Use to:
            <ul>
                <li>Identify applications that act as a {props.type} to this application</li>
                <br/>
                <li>Determine amount of data sent between client and server applications</li>
            </ul>
        </>
    ), [props.type]);

    const TOOLTIP_SERVICE_DETAILS_BY_DEVICE = useMemo(() => (
        <>
            Use to:
            <ul>
                <li>Determine the {props.type} compute instances that must move with the application</li>
                <br/>
                <li>Identify the subnets that need access to the application</li>
                <br/>
                <li>Define the configuration needed for the migration</li>
                <br/>
                <li>Check for unexpected services that require network access</li>
                <br/>
                <li>Help size the cloud instance correctly and choose the correct bandwidth</li>
            </ul>
        </>
    ), [props.type]);

    const TOOLTIP_SERVICE_DETAILS_BY_APPLICATION = useMemo(() => (
        <>
            Use to:
            <ul>
                <li>Identify the kinds of applications and the types of communication employed by each application</li>
                <br/>
                <li>Verify the ports to be opened for application communication</li>
                <br/>
                <li>Check for unexpected services that require network access</li>
            </ul>
        </>
    ), []);

    const TOOLBAR_PROPS = useMemo(() => {
        return {
            title: 'Average Throughput',
            titleTooltip: TOOLTIP_MAXIMUM_THROUGHPUT,
            showTotal: false
        };
    }, [TOOLTIP_MAXIMUM_THROUGHPUT]);

    const GROUP_RENDER_PROPS = useMemo(() => {
        return {
            headerName: `${typeDisplayName} Application`,
            showRowGroup: true,
        };
    }, [typeDisplayName]);

    const colLabels: string[] = useMemo(() => {
        if (!project?.roProjectWithData.appsMap) {
            return [];
        }
        return [`Avg Throughput ${project.roProjectWithData.appsMap[applicationId as string].name} to Servers (Kb/sec)`, `Avg Throughput Servers to ${project.roProjectWithData.appsMap[applicationId as string].name} (Kb/sec)`, 'Number of Connections'];
    }, [project?.roProjectWithData.appsMap, applicationId]);

    const showCols = useMemo(() => {
        return props.type === 'client' ? ['Avg Throughput Server to Client (Kb/sec)', 'Avg Throughput Client to Server (Kb/sec)', 'Number of Connections'] : ['Avg Throughput Client to Server (Kb/sec)', 'Avg Throughput Server to Client (Kb/sec)', 'Number of Connections'];
    }, [props.type]);

    const aggrCols = useMemo(() => {
        return props.type === 'client' ? ['Avg Throughput Server to Client (Kb/sec)', 'Avg Throughput Client to Server (Kb/sec)', 'Number of Connections'] : ['Avg Throughput Client to Server (Kb/sec)', 'Avg Throughput Server to Client (Kb/sec)', 'Number of Connections'];
    }, [props.type]);

    const rowGroupCols = useMemo(() => {
        return props.type === 'client' ? ['Client Application'] : ['Server Application'];
    }, [props.type]);

    const DATAID_1 = useMemo(() => {
        return `${projectId}_${applicationId}_pivot_data_${props.type}_1`;
    }, [projectId, applicationId, props.type]);

    const DATAID_2 = useMemo(() => {
        return `ipPortsReduced_${projectId}_${applicationId}_${props.type}`;
    }, [projectId, applicationId, props.type]);

    const DATAID_3 = useMemo(() => {
        return `ipPortsReduced_${projectId}_${applicationId}_${props.type}_aggr`;
    }, [projectId, applicationId, props.type]);

    if (!project || !appData || !ipPortsReduced || !ipPortsReducedAggr) {
        return (
            <CircularProgress/>
        );
    }

    if (error || !applicationId || ipPortsReduced.error || ipPortsReducedAggr.error) {
        return (
            <Grid
                container
                direction="row"
                justify="center"
                alignItems="center"
                style={{ marginTop: 40 }}
            >
                <Message warning={true}>{error?.message ?? (ipPortsReduced?.error || ipPortsReducedAggr.error ? 'Results data is not available' : 'Unknown Error')}</Message>
            </Grid>
        );
    }

    return (
        <>
            <Grid container spacing={4}>
                <Grid item style={{ width: '100%' }} data-cy='dataTransferGraphic'>
                    <DataTransferGraphic
                        title={`${project.roProjectWithData.appsMap[applicationId as string].name}`}
                        fromDesignation={props.type === 'client' ? 'servers' : 'clients'}
                        toDesignation={typeDisplayName}
                        clientCount={ipPortsReduced.clientCount}
                        speed1={ipPortsReduced.speed1}
                        speed2={ipPortsReduced.speed2}
                    />
                </Grid>
                <Box className={classes.headers} mb={4}>
                    Throughput Summary By {typeDisplayName} Application
                </Box>
                {
                    ipPortsReduced && ipPortsReduced.data &&
                    <NetworkTable
                        projectId={projectId as string}
                        dataId={DATAID_1}
                        ipPortsReduced={ipPortsReduced.data}
                        rowGroupCols={rowGroupCols}
                        aggrCols={aggrCols}
                        showCols={showCols}
                        colLabels={colLabels}
                        maxWidth={750}
                        groupRenderProps={GROUP_RENDER_PROPS}
                        toolbarProps={TOOLBAR_PROPS}
                        agGridOptions={AG_GRID_OPTIONS_2}
                    />
                }
                <Grid
                    container
                    direction="row"
                    alignItems="center"
                    className={classes.headers}
                    style={{ marginTop: theme.spacing(6), marginBottom: theme.spacing(4) }}
                >
                    <Box onClick={onAppMenuOpen} mb={4}>
                        Service Details&nbsp;
                        <Box
                            id="dropdownMenuAnchor"
                            data-cy='serviceDetailDropdown'
                            className={classes.linkButton}
                            style={{ borderBottom: '2px dotted', textDecoration: 'none', color: colors.green_500, fontWeight: 400 }}
                        >
                            by&nbsp;{currentMode.displayName}
                        </Box>
                    </Box>
                    {
                        Boolean(anchorEl) &&
                        <Menu
                            anchorEl={anchorEl}
                            keepMounted
                            className={classes.dropdown}
                            open={Boolean(anchorEl)}
                            onClose={onAppMenuClose}
                            elevation={0}
                            getContentAnchorEl={null}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left',
                            }}
                        >
                            <MenuItem
                                id={InventoryType.Application}
                                key={InventoryType.Application}
                                className={classes.menuItem}
                                onClick={onAppMenuClick}
                            >
                                <Box className={classes.menuItemText}>Application</Box>
                            </MenuItem>
                            <MenuItem
                                id={InventoryType.Device}
                                key={InventoryType.Device}
                                className={classes.menuItem}
                                onClick={onAppMenuClick}
                            >
                                <Box className={classes.menuItemText}>Compute Instance</Box>
                            </MenuItem>
                        </Menu>
                    }
                    <VcioIcon vcio='ars-angle-down' iconColor={colors.blue_gray_500} rem={1.5} width={25} onClick={onAppMenuOpen} style={{ marginTop: '-10px' }}/>
                    <Box mt={-4}>
                        <InformationTooltip>
                            {currentMode.id === InventoryType.Device ? TOOLTIP_SERVICE_DETAILS_BY_DEVICE : TOOLTIP_SERVICE_DETAILS_BY_APPLICATION}
                        </InformationTooltip>
                    </Box>
                </Grid>
                {
                    currentMode.id === InventoryType.Device &&
                    <>
                        {
                            ipPortsReduced && ipPortsReduced.data &&
                            <NetworkTable
                                projectId={projectId as string}
                                dataId={DATAID_2}
                                ipPortsReduced={ipPortsReduced.data}
                                suppressCenterInDiv={true}
                                noBorder={true}
                                agGridOptions={AG_GRID_OPTIONS_1}
                            />
                        }
                        {
                            !(ipPortsReduced && ipPortsReduced.data) &&
                            <Grid
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
                }
                {
                    currentMode.id === InventoryType.Application &&
                    <>
                        {
                            ipPortsReducedAggr && ipPortsReducedAggr.data &&
                            <NetworkTable
                                projectId={projectId as string}
                                dataId={DATAID_3}
                                ipPortsReduced={ipPortsReducedAggr.data}
                                noBorder={true}
                                agGridOptions={AG_GRID_OPTIONS_1}
                            />
                        }
                        {
                            !(ipPortsReducedAggr && ipPortsReducedAggr.data) &&
                            <Grid
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
                }
            </Grid>
        </>
    );
};
