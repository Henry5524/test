import { DataTransferGraphic, InformationTooltip, Message, NetworkTable, VcioIcon } from '@components';
import { Box, CircularProgress, Grid, Menu, MenuItem } from '@material-ui/core';
import { useProject } from '@services';
import { colors } from '@styles';
import { AG_GRID_LOCALE_EN, getIpPortsResults, InventoryType } from '@utils';
import { commonProjectStyles, getXref } from '@utils/common-project';
import { useRouter } from 'next/router';
import React, { MouseEvent, useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';

interface CustomDependenciesProps {
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
 * Main function for custom properties - client/server dependencies tab
 *
 * @constructor
 */
export default function CustomDependencies(props: CustomDependenciesProps) {
    const classes = commonProjectStyles();
    const { query: { projectId, customPropertyId, propertyName } } = useRouter();
    const { data: project } = useProject(projectId as string);
    const { data: allGroupData, error } = useSWR(project?.roProjectWithData ? `custom_group_${projectId}_${customPropertyId}_${propertyName}` : null,
        () => getXref(project?.roProjectWithData, 'group'));
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
    const { data: ipPortsReduced } = useSWR(project && allGroupData ? `ipPortsReduced_${projectId}_${customPropertyId}_${propertyName}_${props.type}` : null,
        () => getIpPortsResults(props.type, propertyName as string, allGroupData));
    const { data: ipPortsReducedAggr } = useSWR(project && allGroupData ? `ipPortsReduced_${projectId}_${customPropertyId}_${propertyName}_${props.type}_aggr` : null,
        () => getIpPortsResults(props.type === 'client' ? 'client_aggr' : 'server_aggr', propertyName as string, allGroupData));

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
            Client dependencies are the {props.type} that depend on this {propertyName} to serve information (this {propertyName} acts as a server)<br/><br/>
            This is a list of {props.type} to this {propertyName}<br/><br/>
            Use this to get a sense of which {propertyName} depend on this {propertyName}&nbsp;
            for information and the maximum amount data sent in either direction per second<br/><br/>
            Max: size the pipe correctly → when you deploy the compute instance in the cloud,&nbsp;
            you choose the network adaptor type and this information can help you choose the correct size. <br/><br/>
            You have to pay for traffic going from public cloud to on-prem, this information can help you choose the correct bandwidth plan needed<br/><br/>
            <dd>
                <li>If you have 5 dependencies → do I size for all five to max at the same time?<br/><br/></li>
                <li>Do I need to pay for more bandwidth, even if I won’t use it most of the time?<br/><br/></li>
                <li>Is the bandwidth high in the datacenter just because it’s available? Am I ok with higher latency?</li>
            </dd>
        </>
    ), [props.type, propertyName]);

    const TOOLTIP_SERVICE_DETAILS_BY_APPLICATION = useMemo(() => (
        <>
            See details about the {props.type} applications and the network services used<br/><br/>
            Identify what kind of applications are communicating with each other, what kind of communication<br/><br/>
            <dd>
                <li>use these details to define the configuration needed for a migration<br/><br/></li>
                <li>Look at IP address of client devices to identify which subnets need to be able reach this {propertyName}<br/><br/></li>
                <li>Identify the client compute instances that rely on this {propertyName} and may need to move together with this {propertyName}<br/><br/></li>
                <dd>
                    <li>Start to build your move groups and decide what to move together</li>
                </dd>
            </dd>
        </>
    ), [props.type, propertyName]);

    const TOOLTIP_SERVICE_DETAILS_BY_DEVICE = useMemo(() => (
        <>
            Drill into exactly which compute instances are talking to each other<br/><br/>
            <dd>
                <li>use these details to define the configuration needed for a migration<br/><br/></li>
                <li>Look at IP address of {props.type} devices to identify which subnets need to be able reach this {propertyName}<br/><br/></li>
                <li>Identify the {props.type} compute instances that rely on this {propertyName} and may need to move together with this {propertyName}<br/><br/></li>
                <dd>
                    <li>Start to build your move groups and decide what to move together</li>
                </dd>
            </dd>
        </>
    ), [props.type, propertyName]);

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
        return [`Avg Throughput ${propertyName} to Servers (Kb/sec)`, `Avg Throughput Servers to ${propertyName} (Kb/sec)`, 'Number of Connections'];
    }, [project?.roProjectWithData.appsMap, propertyName]);

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
        return `\`${projectId}_${customPropertyId}_${propertyName}_pivot_data_${props.type}_1\``;
    }, [customPropertyId, projectId, propertyName, props.type]);

    const DATAID_2 = useMemo(() => {
        return `ipPortsReduced_${projectId}_${customPropertyId}_${propertyName}_${props.type}`;
    }, [customPropertyId, projectId, propertyName, props.type]);

    const DATAID_3 = useMemo(() => {
        return `ipPortsReduced_${projectId}_${customPropertyId}_${propertyName}_${props.type}_aggr`;
    }, [customPropertyId, projectId, propertyName, props.type]);

    if (!project || !customPropertyId || !ipPortsReduced || !ipPortsReducedAggr) {
        return (
            <CircularProgress/>
        );
    }

    if (error || !customPropertyId || ipPortsReduced.error || ipPortsReducedAggr.error) {
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
                        title={`${propertyName}`}
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
                <Grid container direction="row" alignItems="center" className={classes.headers}>
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
                                horizontal: 'right',
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
