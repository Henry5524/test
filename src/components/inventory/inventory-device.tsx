import { Box, Button, Chip, Grid, makeStyles } from '@material-ui/core';
import { MoveGroup, NetworkNode, NodeGroup, ProjectContainer } from '@models';
import { useWindowHeight } from '@react-hook/window-size';
import { AG_GRID_LOCALE_EN } from '@utils';
import { Column, GridSizeChangedEvent, ValueGetterParams } from 'ag-grid-community';
import { IRowDragItem } from 'ag-grid-community/dist/lib/rendering/row/rowDragComp';
import _ from 'lodash';
import React, { Component, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { colors } from '../../styles';
import { getDragDropGridConfig, InventoryType, log, RowDragMode } from '../../utils';
import { VcioIcon } from '../controls';
import { ContextAction, ContextActions, InventoryContextMenu } from '../controls/InventoryContextMenu';
import { CustomPropertiesDialog, DeviceEditDialog } from '../dialogs';
import { ListPanel } from '../index';

const useStyles = makeStyles(_theme => ({
    cellRenderer1: {
        color: colors.black_90,
        width: '100%',
        margin: 0,
        display: 'flex',
        padding: '13px 11px',
        position: 'relative',
        fontSize: '14px',
        fontStyle: 'normal',
        fontFamily: 'Open Sans',
        fontWeight: 'normal',
        lineHeight: '20px',
        letterSpacing: 0
    },
    cellRenderer2: {
        flex: 'auto',
        display: 'flex',
        flexDirection: 'column',
    },
    name: {
        display: 'flex'
    },
    ips: {
        color: colors.black_70,
        fontSize: '13px'
    },
    appsAndMgs: {
        color: colors.blue_500,
        display: 'flex',
        flexWrap: 'wrap',
        fontSize: '13px',
        marginTop: '8px'
    },
    appsAndMgsIcon: {
        color: colors.blue_500,
        width: '20px',
        fontSize: '1rem',
        fontStyle: 'normal',
        textAlign: 'center',
        verticalAlign: 'middle'
    },
    virtual: {
        top: '5px',
        color: colors.black_70,
        right: '15px',
        position: 'absolute',
        fontSize: '13px',
        textAlign: 'right'
    },
    customProperties: {
        'display': 'flex',
        fontSize: '13px',
        marginTop: '8px',
        flexDirection: 'column'
    },
    customPropertiesSpan: {
        color: colors.blue_gray_500,
        marginRight: '4px'
    },
    excludedIcon: {
        color: colors.amber_600,
        width: '20px',
        fontSize: '1rem',
        fontStyle: 'normal',
        textAlign: 'center',
        verticalAlign: 'middle'
    },
    excluded: {
        color: colors.amber_600,
        opacity: 0.7,
        fontSize: '14px',
        fontStyle: 'normal',
    },
}));

const initialMousePosition = {
    mouseX: null,
    mouseY: null,
};

interface InventoryProps {
    contextCallback?: Function;
    rowSelectionCallback?: Function;
    project: ProjectContainer;
    mutateProject: Function;
    filter?: {
        applicationSelected: NodeGroup[];
        moveGroupSelected: MoveGroup[];
    };
    changeFilterCallback?: Function;
    enableSave: Function;
    gridType: 'device' | 'application' | 'movegroup';
    setGridReadyOptions?: any;
    // this gets passed along via the props into a utility function
    // eslint-disable-next-line react/no-unused-prop-types
    setDndData: Function;
    // this gets passed along via the props into a utility function
    // eslint-disable-next-line react/no-unused-prop-types
    okToDropIntoRow: Function;
}

/**
 * We get an array of these back from the context menu Set Custom Properties dialog - one entry for each
 * new custom property that was added on the dialog.  name is a uuid, title is the display text for the custom property,
 * value is the value of the custom property.  When the dialog is completed, we add the name/value to each selected device.
 */
type NewCustomProperty = {
    name: string;   // The id, bad variable name, but same as the variable name used in the API
    title: string;  // The text displayed to the user
    value: string;
    removed: boolean;
    index: number;
    errorMessage: string;
};

/**
 * Inventory...Devices Subpanel (grid and toolbar)
 * Note that 'node'/'device'/'compute instance' refer to the same thing.  API uses node, we originally used 'device'
 * in the UI, which explains all the 'device' references in the code.  UX later changed 'device' in UI to
 * 'compute instance'.
 */
export const InventoryDevice: React.FunctionComponent<InventoryProps> = (props: InventoryProps) => {
    const {
        project: pProject, changeFilterCallback: pChangeFilterCallback, filter: pFilter, contextCallback: pContextCallback, rowSelectionCallback: pRowSelectionCallback,
        setGridReadyOptions: pSetGridReadyOptions, mutateProject: pMutateProject, enableSave: pEnableSave, gridType: pGridType
    } = props;
    const classes = useStyles();

    // These two state variables keep track of which column value was selected via click, on which row.
    // Useful when the user chooses 'Copy to Clipboard' from the right-click context menu.
    const [selectedColumnValue, setSelectedColumnValue] = useState<string | null>(null);
    const [selectedRowId, setSelectedRowId] = useState('');

    // this is height of the filter toolbar (selected chips)
    const [filterToolbarHeight, setFilterToolbarHeight] = useState(0);
    const windowHeight = useWindowHeight();
    const maxBodyHeight = useMemo(() => windowHeight - 350 - filterToolbarHeight, [filterToolbarHeight, windowHeight]);

    // Controls when the Set Custom Properties Dialog is shown
    const [openCustomPropertiesDialog, setOpenCustomPropertiesDialog] = useState(false);

    const [deviceEditDialogOpen, setDeviceEditDialogOpen] = useState<NetworkNode | null>(null);

    // Context menu management (right mouse)
    const [mousePosition, setMousePosition] = useState<{
        mouseX: null | number;
        mouseY: null | number;
    }>(initialMousePosition);
    const [selectedRows, setSelectedRows] = useState<NetworkNode[]>([]);
    const [clickedRow, setClickedRow] = useState<any[]>([]);

    const handleAgGridReady = useCallback((params: any) => {
        if (pSetGridReadyOptions) {
            pSetGridReadyOptions(params);
        }
    }, [pSetGridReadyOptions]);

    const handleContextClick = useCallback((mouseX: number, mouseY: number, contextSelectedRows: [], contextSelectedRow: []) => {
        setMousePosition({
            mouseX,
            mouseY
        });
        setSelectedRows(contextSelectedRows);
        setClickedRow(contextSelectedRow);
    }, []);

    /**
     * Close the context menu.  Simply wraps setting of the state variable for code readability.
     * It was shown by right-mouse click in the devices grid.
     */
    const closeContextMenu = useCallback(() => {
        setMousePosition(initialMousePosition);
    }, []);

    /**
     * Show the 'Set Custom Properties' Dialog.  Simply wraps setting of the state variable for code readability.
     * It was selected from the context menu.
     */
    const showCustomPropertiesDialog = useCallback(() => {
        setOpenCustomPropertiesDialog(true);
    }, []);

    /**
     * Hide the Custom Properties Dialog.  Simply wraps setting of the state variable for code readability.
     */
    const hideCustomPropertiesDialog = useCallback(() => {
        setOpenCustomPropertiesDialog(false);
    }, []);

    /**
     * Called when an action is selected in the context menu.
     * The context menu was shown via right-mouse click in the devices grid.
     * @param action    ContextAction from InventoryContextMenu
     * @param sr        NetworkNode[] the selected row
     */
    const inventoryContextCallback = useCallback((action: ContextAction, sr: NetworkNode[]) => {
        closeContextMenu();
        if (action === ContextActions.SetCustomProperties) {
            // We can handle this context action, show the Custom Properties Dialog
            showCustomPropertiesDialog();
            return;
        }

        if (action === ContextActions.EditItem && sr?.length == 1) {
            setDeviceEditDialogOpen(sr[0]);
            return;
        }

        if (action === ContextActions.ExcludeItem) {
            const updatedProject: ProjectContainer = new ProjectContainer(pProject.roProjectWithData);
            updatedProject.excludeItems(sr, 'device');
            pMutateProject(updatedProject, false).then();
            pEnableSave(true);
        }

        if (action === ContextActions.UnExcludeItem) {
            const updatedProject: ProjectContainer = new ProjectContainer(pProject.roProjectWithData);
            updatedProject.unexcludeItems(sr, 'device');
            pMutateProject(updatedProject, false).then();
            pEnableSave(true);
        }

        // Let Inventory (our parent) handle the remaining actions from the right-mouse click context menu
        if (pContextCallback) {
            if (action === ContextActions.CopyFieldValueToClipboard) {
                if (sr[0].id === selectedRowId) {
                    pContextCallback(action, sr, selectedColumnValue);
                } else {
                    // User right-clicked in another row after previously selecting a cell in a different row.
                    // Do not use the saved column value, instead the pContextCallback will use the name.
                    pContextCallback(action, sr, null);
                }
            } else {
                pContextCallback(action, sr);
            }
        }
    }, [closeContextMenu, pProject.roProjectWithData, pContextCallback, pMutateProject, selectedColumnValue, pEnableSave, selectedRowId, showCustomPropertiesDialog]);

    // this is the reference to the filter toolbar
    const refCallback = useCallback((element: any) => {
        if (element) {
            setFilterToolbarHeight(element.getBoundingClientRect().height + 13);
        } else {
            setFilterToolbarHeight(0);
        }
    }, []);

    const handleRowSelection = useCallback((type: string, newSelectedRows: NetworkNode[]) => {
        if (pRowSelectionCallback) {
            pRowSelectionCallback(type, newSelectedRows);
        }
        closeContextMenu();
        setSelectedRows(newSelectedRows);
    }, [closeContextMenu, pRowSelectionCallback]);

    const isRowDropCopy = useRef<boolean>(false);

    // Run once and clean up later
    useEffect(() => {
        const keydownListener = (event: KeyboardEvent) => {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            isRowDropCopy.current = (event.ctrlKey || event.keyCode === 91 || event.keyCode === 17);
        };

        const keyupListener = (event: KeyboardEvent) => {
            if (event.key == 'Control' || event.keyCode === 91 || event.keyCode === 17) {
                isRowDropCopy.current = false;
            }
        };

        document.addEventListener('keydown', keydownListener);
        document.addEventListener('keyup', keyupListener);

        return () => {
            document.removeEventListener('keyup', keyupListener);
            document.removeEventListener('keydown', keydownListener);
        };
    }, []);

    const groupsMap = useRef<{ [id: string]: NodeGroup | MoveGroup }>({});

    // Need a map of custom property name (the id) to title (the text shown to the user).
    // Example: name = 'C42067', title = 'Owner'.
    const cpNameToTitleMap: { [id: string]: { title: string } } = useMemo(() => {
        const localCpNameToTitleMap: { [id: string]: { title: string } } = {};
        _.forEach(pProject.roProjectWithData.custom_node_props, (p: any) => {
            localCpNameToTitleMap[p.name] = { title: p.title };
        });
        return localCpNameToTitleMap;
    }, [pProject.roProjectWithData.custom_node_props]);

    useMemo(() => {

        const moveGroups: MoveGroup[] = pProject.roProjectWithData.move_groups || [];

        const { nodesMap } = pProject.roProjectWithData;

        for (const moveGroup of moveGroups) {
            if (moveGroup && moveGroup.node_ids) {
                groupsMap.current[moveGroup.id] = moveGroup;
                for (const nodeId of moveGroup.node_ids) {
                    if (nodesMap && nodesMap[nodeId]) {
                        nodesMap[nodeId].mgid = moveGroup.id;
                    }
                }
            }
        }
        const apps: NodeGroup[] = _.cloneDeep(pProject.roProjectWithData.apps) || [];
        for (const app of apps) {
            if (app && app.node_ids) {
                groupsMap.current[app.id] = app;
                for (const nodeId of app.node_ids) {
                    if (nodesMap && nodesMap[nodeId]) {
                        nodesMap[nodeId].apps = _.union(nodesMap[nodeId].apps, [app.id]);
                    }
                }
            }
        }

        for (const moveGroup of moveGroups) {
            if (moveGroup && moveGroup.group_ids) {
                for (const moveGroupId of moveGroup.group_ids) {
                    if (!groupsMap.current[moveGroupId]) {
                        log('[Inventory Devices]', `Move group "${moveGroup.id}(${moveGroup.name})" contains not existing group: ${moveGroupId}`);
                    } else {
                        groupsMap.current[moveGroupId].mgid = moveGroup.id;
                        if (groupsMap.current[moveGroupId].node_ids) {
                            for (const nodeId of groupsMap.current[moveGroupId].node_ids) {
                                if (!nodesMap[nodeId]?.inMoveGroup) {
                                    nodesMap[nodeId].mgid = moveGroup.id;
                                }
                            }
                        }
                    }
                }
            }
        }
    }, [pProject.roProjectWithData]);


    // const groupTypes: string[] = [];     // Does not seem to be used
    useMemo(() => {
        const groups: { [type: string]: NodeGroup[] } = {};
        const prGroups = pProject.roProjectWithData.groups || [];
        for (const projectGroup of prGroups) {
            groupsMap.current[projectGroup.id] = projectGroup;
            if (groups[projectGroup.type]) {
                groups[projectGroup.type].push(projectGroup);
            } else {
                groups[projectGroup.type] = [projectGroup];
                // groupTypes.push(projectGroup.type);  // Does not seem to be used
            }
        }
    }, [pProject.roProjectWithData.groups]);

    const filtersExist = useCallback(() => {
        let filterFound: boolean = false;
        _.each(pFilter, (filterType: any[]) => {
            if (filterType.length > 0) {
                filterFound = true;
            }
        });

        return filterFound;
    }, [pFilter]);

    // Apply filters
    const filteredNodes: NetworkNode[] = useMemo(() => {
        if (pProject.roProjectWithData.nodes && pFilter && filtersExist()) {
            let filteredPropertyNodes: any = [];

            // we need to loop through all customer properties and find device nodes that contain them
            _.each(pFilter, (filterType: any[], key: any) => {
                if (key !== 'applicationSelected' && key !== 'moveGroupSelected') {
                    _.each(filterType, (fType) => {
                        const filtered = _.filter(pProject.roProjectWithData.nodes, (node) => {
                            return fType.type !== undefined && (node.custom_props[fType.type] === fType.id);
                        });

                        filteredPropertyNodes = _.union(filteredPropertyNodes, filtered);
                    });
                }
            });

            // Nodes associated with app filter
            const filteredApps = _.uniq(_.flattenDeep(_.map(pFilter.applicationSelected, app => app.node_ids)));

            // Nodes associated with move group filter
            const filteredMgNodes = _.uniq(_.flattenDeep(_.map(pFilter.moveGroupSelected, mg => mg.node_ids)));
            const filteredMgApps = _.uniq(_.flattenDeep(_.map(pFilter.moveGroupSelected, mg => mg.group_ids)));
            const filterMgAppNodes = _.uniq(_.flattenDeep(_.map(filteredMgApps, appId => pProject.roProjectWithData.appsMap[appId]?.node_ids)));

            // Nodes associated with property filters
            const filteredProps = _.uniq(_.flattenDeep(_.map(filteredPropertyNodes, node => node.id)));

            // Overall filter
            const filteredNodeIds = _.union(filteredApps, filteredMgNodes, filterMgAppNodes, filteredProps);
            return _.filter(pProject.roProjectWithData.nodes, node => filteredNodeIds.includes(node.id));
        }
        return pProject.roProjectWithData.nodes || [];
    }, [filtersExist, pFilter, pProject.roProjectWithData.appsMap, pProject.roProjectWithData.nodes]);

    // Removal of a single filter
    const handleFilterDelete = useCallback((node: NodeGroup) => {
        if (pChangeFilterCallback) {
            const newFilter = _.cloneDeep(pFilter);
            _.forOwn(pFilter, (_value, key) => {
                // @ts-ignore
                if (newFilter && newFilter[key]) {
                    // @ts-ignore
                    _.remove(newFilter[key], (filteredNode: NodeGroup) => {
                        return filteredNode.id === node.id;
                    });
                }
            });
            pChangeFilterCallback(newFilter);
        }
    }, [pChangeFilterCallback, pFilter]);

    // Clear all of the filters by returning an empty filter object
    const clearAllFilters = useCallback(() => {
        if (pChangeFilterCallback) {
            pChangeFilterCallback(_.mapValues(pFilter, () => []));
        }
    }, [pChangeFilterCallback, pFilter]);

    // Generate the chips to show filtered item list
    const chips: React.ReactElement[] = useMemo(() => {
        if (!pFilter) {
            return [];
        }
        let localChips: React.ReactElement[] = [];
        _.forOwn(pFilter, (_value: any, key) => {
            // @ts-ignore
            localChips = _.union(localChips, pFilter[key]?.map((nextFilter: NodeGroup) => {
                return (
                    <span key={nextFilter.name}>
                        <Chip
                            label={(key === 'applicationSelected' ?
                                'App: ' :
                                (key === 'moveGroupSelected' ? 'Move Group: ' : (_value[0].typeName + ': '))) + nextFilter.name}
                            clickable
                            style={{ backgroundColor: colors.green_50, margin: '0 2px 2px 0' }}
                            onDelete={() => handleFilterDelete(nextFilter)}
                            size="small"
                        />
                    </span>
                );
            }));
        });
        return localChips;
    }, [handleFilterDelete, pFilter]);

    // Generate chips toolbar row
    const toolbarFooter = useMemo(() =>
        <>
            {
                chips && chips.length > 0 &&
                <>
                    <Grid ref={refCallback} container justify="center" spacing={1} style={{ marginTop: '16px' }}>
                        <Grid item style={{ marginTop: '5px' }}>
                            Filters Applied:
                        </Grid>
                        <Grid item xs style={{ marginRight: 'auto' }} data-cy="filteredEntity">
                            {
                                chips
                            }
                        </Grid>
                        <Grid item style={{ marginLeft: 'auto' }}>
                            <Button onClick={clearAllFilters} data-cy="clearAllBtn">Clear all</Button>
                        </Grid>
                    </Grid>
                </>
            }
        </>, [chips, clearAllFilters, refCallback]);


    const summaryValueGetter = useCallback((params: ValueGetterParams) => {

        let nameValue = '';
        let appsValue = '';
        let cpsValue = '';
        let mgsValue = '';
        let ipsValue = '';
        let typeValue = '';

        if (params.data) {
            nameValue = params.data.name + '\n';

            if (params.data.apps?.length > 0) {
                _.each(params.data.apps, (app) => {
                    appsValue += (groupsMap.current[app] ? groupsMap.current[app].name : 'UnknownApp') + '\n';
                });
            }

            const cpKeys =
                params.data.custom_props && Object.keys(params.data.custom_props).length > 0 ? Object.keys(params.data.custom_props) : null;

            _.each(cpKeys, (key) => {
                if (params.data.cpNameToTitleMap[key]) {
                    cpsValue += params.data.cpNameToTitleMap[key].title + '\n' + params.data.custom_props[key] + '\n';
                } else {
                    console.log('Error: ' + key + ' does not exist in params.data.cpNameToTitleMap[key]', params.data.cpNameToTitleMap);
                }
            });

            if (params.data.mgid) {
                mgsValue = (groupsMap.current[params.data.mgid] ? groupsMap.current[params.data.mgid].name : 'UnknownMG') + '\n';
            }

            if (params.data.ips.length > 0) {
                _.each(params.data.ips, (ip) => {
                    ipsValue += ip + '\n';
                });
            }

            typeValue = params.data.type;
        }

        return nameValue + appsValue + cpsValue + mgsValue + ipsValue + typeValue;
    }, []);

    const groupingValueGetter = useCallback((params: ValueGetterParams) => {

        // @ts-ignore
        const groupedColumns = params.columnApi.getRowGroupColumns();

        let cellValue = '';

        groupedColumns.forEach((groupColumn: Column) => {
            // @ts-ignore
            const { colDef } = groupColumn;

            if (colDef.headerName === 'Move Group') {
                if (params.data && params.data.mgid) {
                    cellValue = cellValue + (cellValue ? ' | ' : '')
                        + (groupsMap.current[params.data.mgid] ? groupsMap.current[params.data.mgid].name : 'UnknownMG');
                }
            }

            if (colDef.headerName === 'Application') {
                if (params.data && params.data.apps.length > 0) {
                    cellValue = cellValue + (cellValue ? ' | ' : '') + params.data.apps.map((app: any) => {
                        return (groupsMap.current[app] ? groupsMap.current[app].name : 'UnknownApp');
                    });
                }
            }

            if (colDef.headerName === 'Compute Instance') {
                cellValue = cellValue + (cellValue ? ' | ' : '') + params.data.name;
            }

            if (colDef.headerName === 'IPs') {
                if (params.data && params.data.ips.length > 0) {
                    cellValue = cellValue + (cellValue ? ' | ' : '') + params.data.ips.map((ip: any) => {
                        return ip;
                    });
                }
            }

            if (colDef.headerName === 'Type') {
                cellValue = cellValue + (cellValue ? ' | ' : '') + params.data.type;
            }
        });

        return cellValue;
    }, []);

    const getRowDragText = useCallback((params: IRowDragItem) => {
        const { rowNode } = params;

        if (rowNode) {
            // @ts-ignore
            const rowNodeSelected = rowNode.selected;
            // @ts-ignore
            const selectedNodeCount = rowNode.gridApi.getSelectedRows().length;

            if (rowNode.group) {
                const groupName = rowNode.groupData['ag-Grid-AutoColumn'];

                if (groupName) {
                    rowNode.groupData.dragMode = isRowDropCopy.current ? RowDragMode.CopyDevicesWithinGroup : RowDragMode.MoveDevicesWithinGroup;
                    return (isRowDropCopy.current ? 'copy' : 'move')
                        + ' the (' + rowNode.allLeafChildren.length + ') compute instances within group "' + rowNode.groupData['ag-Grid-AutoColumn'] +
                        '"';
                }

                rowNode.groupData.dragMode = isRowDropCopy.current ?
                    RowDragMode.CopyDevicesWithinUnassignedGroup :
                    RowDragMode.MoveDevicesWithinUnassignedGroup;
                return (isRowDropCopy.current ? 'copy' : 'move')
                    + ' the (' + rowNode.allLeafChildren.length + ') compute instances within this unassigned group';
            }
            if (rowNodeSelected && selectedNodeCount === 1) {
                rowNode.data.dragMode = isRowDropCopy.current ? RowDragMode.CopySelectedDevice : RowDragMode.MoveSelectedDevice;
                return (isRowDropCopy.current ? 'copy' : 'move')
                    + ' selected compute instance "' + rowNode.data.name + '"';
            }
            if (!rowNodeSelected) {
                rowNode.data.dragMode = isRowDropCopy.current ? RowDragMode.CopyDevice : RowDragMode.MoveDevice;
                return (isRowDropCopy.current ? 'copy' : 'move')
                    + ' compute instance "' + rowNode.data.name + '"';
            }

            rowNode.data.dragMode = isRowDropCopy.current ? RowDragMode.CopySelectedDevices : RowDragMode.MoveSelectedDevices;
            return (isRowDropCopy.current ? 'copy' : 'move')
                + ' the (' + selectedNodeCount + ') selected compute instances';
        }

        return '';
    }, []);

    const getGroupingRowDragText = useCallback((params: IRowDragItem) => {
        const { rowNode } = params;

        if (rowNode) {
            // @ts-ignore
            const rowNodeSelected = rowNode.selected;
            // @ts-ignore
            const selectedNodeCount = rowNode.gridApi.getSelectedRows().length;

            if (rowNode.group) {
                const groupName = rowNode.groupData['ag-Grid-AutoColumn'];

                if (groupName) {
                    rowNode.groupData.dragMode = isRowDropCopy.current ? RowDragMode.CopyDevicesWithinGroup : RowDragMode.MoveDevicesWithinGroup;
                    return (isRowDropCopy.current ? 'copy' : 'move') +
                        ' the (' +
                        rowNode.allLeafChildren.length +
                        ') compute instances within group "' +
                        rowNode.groupData['ag-Grid-AutoColumn'] +
                        '"';
                }

                rowNode.groupData.dragMode = isRowDropCopy.current ?
                    RowDragMode.CopyDevicesWithinUnassignedGroup :
                    RowDragMode.MoveDevicesWithinUnassignedGroup;

                return (isRowDropCopy.current ? 'copy' : 'move') +
                    ' the (' +
                    rowNode.allLeafChildren.length +
                    ') compute instances within this unassigned group';
            }
            if (rowNodeSelected && selectedNodeCount === 1) {
                rowNode.data.dragMode = isRowDropCopy.current ? RowDragMode.CopySelectedDevice : RowDragMode.MoveSelectedDevice;
                return (isRowDropCopy.current ? 'copy' : 'move') +
                    ' selected compute instance "' +
                    rowNode.data.name + '"';
            }
            if (!rowNodeSelected) {
                rowNode.data.dragMode = isRowDropCopy.current ? RowDragMode.CopyDevice : RowDragMode.MoveDevice;
                return (isRowDropCopy.current ? 'copy' : 'move') +
                    ' compute instance "' +
                    rowNode.data.name + '"';
            }

            rowNode.data.dragMode = isRowDropCopy.current ? RowDragMode.CopySelectedDevices : RowDragMode.MoveSelectedDevices;
            return (isRowDropCopy.current ? 'copy' : 'move') +
                ' the (' +
                selectedNodeCount +
                ') selected compute instances';
        }

        return '';
    }, []);

    const rowNodeIdGetter = useCallback((data: any) => {
        return data.id;
    }, []);

    // When resizing the three main inventory grid panels we need to call resetRowHeights
    const onGridSizeChanged = useCallback((gridSizeChangedEvent: GridSizeChangedEvent) => {
        gridSizeChangedEvent.api.resetRowHeights();
    }, []);

    const applicationValueGetter = useCallback((params: ValueGetterParams) => {
        if (params.data && params.data.apps.length > 0) {
            return params.data.apps.map((app: any) => {
                return (groupsMap.current[app] ? groupsMap.current[app].name : 'UnknownApp');
            });
        }
        return '';
    }, []);

    const moveGroupValueGetter = useCallback((params: ValueGetterParams) => {
        if (params.data && params.data.mgid) {
            return (groupsMap.current[params.data.mgid] ? groupsMap.current[params.data.mgid].name : 'UnknownMG');
        }
        return '';
    }, []);

    const onCellClickedHandler = useCallback((params: any) => {
        // The compute (a.k.a device) table is in List (a.k.a Table) view.
        // User clicked a cell, save the cells value and the id of the row.  We will use these in case
        // the user right-clicks and chooses Copy to Clipboard.
        setSelectedColumnValue(params.value !== undefined ? params.value.toString() : '');
        setSelectedRowId(params.node.id);
    }, []);

    const cellRenderer = useCallback((params: any) => {

        const cpKeys = params.data.custom_props && Object.keys(params.data.custom_props).length > 0 ? Object.keys(params.data.custom_props) : null;

        let html = '';
        html += '<div class="ag-react-container" style="display: flex; height: 100%;">';
        html += `<div class="MuiBox-root ${classes.cellRenderer1}">`;
        html += `<div class="MuiBox-root ${classes.cellRenderer2}">`;

        html += `<div class="MuiBox-root ${classes.name}" title="${params.data.id}">${params.data.name}</div>`;

        if (params.data.ips && params.data.ips.length > 0) {
            html += `<div class="${classes.ips}" title="${params.data.id}">${params.data.ips[0]}</div>`;
            if (params.data.ips.length > 1) {
                html += '<span>(' + (params.data.ips.length - 1) + ')</span>';
            }
        }

        if (cpKeys) {
            html += `<div class="${classes.customProperties}">`;
            _.forEach(cpKeys, key => {
                if (params.data.cpNameToTitleMap[key]) {
                    html += `<span class="${classes.customPropertiesSpan}">${params.data.cpNameToTitleMap[key].title} ${params.data.custom_props[key]}</span>`;
                }
                // Skips custom properties that were deleted from the Manage Custom Properties dialog
            });
        }

        if (params.data.apps && params.data.apps.length > 0) {
            html += `<div class="${classes.appsAndMgs}">`;
            _.forEach(params.data.apps, id => {
                html += '<span>' +
                    `<span class="material-icons MuiIcon-root ${classes.appsAndMgsIcon} vcio-migration-application" aria-hidden="true" style="margin-top: -4px; margin-right: 4px;"></span>` +
                    '<span style="margin-top: 12px; margin-right: 7px;">' + (groupsMap.current[id] ? groupsMap.current[id].name : 'UnknownApp') + '</span>' +
                    '</span>';
            });
            html += '</div>';
        }

        if (params.data.mgid) {
            html += `<div class="${classes.appsAndMgs}">`;
            if (params.data.mgid) {
                html += '<span>' +
                    `<span class="material-icons MuiIcon-root ${classes.appsAndMgsIcon} vcio-migration-move-group" aria-hidden="true" style="margin-top: -4px; margin-right: 4px;"></span>` +
                    '<span style="margin-top: 12px; margin-right: 7px;">' + (groupsMap.current[params.data.mgid] ? groupsMap.current[params.data.mgid].name : 'UnknownMG') + '</span>' +
                    '</span>';
            }
            html += '</div>';
        }

        if (params.data.type === NetworkNode.Type.Virtual) {
            html += `<div class="virtual ${classes.virtual}">Virtual`;
            if (params.data._disabled) {
                html += '<br />';
                html += `<span class="material-icons MuiIcon-root ${classes.excludedIcon} vcio-general-minus-circle-outline" aria-hidden="true" style="margin-top: -4px; margin-right: 4px;"></span>`;
                html += `<span class="${classes.excluded}">excluded</span>`;
            }
            html += '</div>';
        }

        html += '</div>';
        html += '</div>';
        return html;
    }, [classes.appsAndMgs, classes.appsAndMgsIcon, classes.cellRenderer1, classes.cellRenderer2, classes.customProperties, classes.customPropertiesSpan, classes.excluded, classes.excludedIcon, classes.ips, classes.name, classes.virtual]);

    const headerComponentRendererMemo = useCallback((_params: any) => {
        return <div/>;
    }, []);

    const agGridOptions = useMemo(() => {
        return _.merge({
            cacheQuickFilter: true,
            columnDefs: [
                {
                    headerTooltip: 'Check or drag this column',
                    field: '',
                    rowDrag: true,
                    checkboxSelection: true,
                    headerCheckboxSelection: true,
                    headerCheckboxSelectionFilteredOnly: true,
                    suppressMovable: true,
                    lockPosition: true,
                    lockVisible: true,
                    unSortIcon: true,
                    width: 65,
                    sortable: false,
                    suppressMenu: true,
                    rowDragText: getRowDragText,
                    cellStyle: { verticalAlign: 'middle' },
                },
                {
                    autoHeight: true,
                    headerName: 'Summary',
                    headerTooltip: 'Summary view of the compute instances',
                    colId: 'summary',
                    field: 'name',
                    filter: 'agTextColumnFilter',
                    menuTabs: ['filterMenuTab'],
                    enableRowGroup: false,
                    flex: 1,
                    minWidth: 200,
                    resizable: true,
                    suppressMovable: true,
                    sortable: true,
                    sort: 'asc',
                    unSortIcon: true,
                    cellRenderer,
                    cellStyle: { verticalAlign: 'middle' },
                    headerComponent: pGridType !== 'device' ? headerComponentRendererMemo : null,
                    valueGetter: summaryValueGetter,
                },
            ],
            defaultColDef: {
                sortable: true,
                filter: 'agMultiColumnFilter',
                filterParams: {
                    filters: [
                        {
                            filter: 'agTextColumnFilter',
                            filterParams: {
                                newRowsAction: 'keep',
                                buttons: ['reset']
                            }
                        },
                    ]
                },
            },
            getRowNodeId: rowNodeIdGetter,
            immutableData: true,
            debug: !!process.env.NEXT_PUBLIC_DEBUG_FLAG,
            valueCache: true,
            debounceVerticalScrollbar: true,
            rowBuffer: 25,
            onGridSizeChanged,
            localeText: AG_GRID_LOCALE_EN,
            rowGroupPanelShow: 'never',
            suppressContextMenu: true,
            suppressScrollOnNewData: true,
            tooltipShowDelay: 0,
        }, getDragDropGridConfig(props));
    }, [getRowDragText, cellRenderer, pGridType, headerComponentRendererMemo, summaryValueGetter, rowNodeIdGetter, onGridSizeChanged, props]);

    const applicationColumnRenderer = useCallback((params: any) => {
        let html = '<div class="ag-react-container">';
        if (params.data && params.data.apps.length > 0) {
            _.forEach(params.data.apps, app => {
                html += `<span key={${groupsMap.current[app].name}}>`;
                html += `<span class="material-icons MuiIcon-root ${classes.appsAndMgsIcon} vcio-migration-application" aria-hidden="true" style="margin-top: -3px; margin-right: 5px;"></span>`;
                html += `${groupsMap.current[app] ? groupsMap.current[app].name : 'UnknownApp'}`;
                html += '</span>';
            });
        }
        html += '</div>';
        return html;
    }, [classes.appsAndMgsIcon]);

    const moveGroupColumnRenderer = useCallback((params: any) => {
        let html = '<div class="ag-react-container">';
        if (params.data && params.data.mgid) {
            html += '<span>' +
                `<span class="material-icons MuiIcon-root ${classes.appsAndMgsIcon} vcio-migration-move-group" aria-hidden="true" style="margin-top: -4px; margin-right: 4px;"></span>` +
                '<span style="margin-top: 12px; margin-right: 7px;">' + (groupsMap.current[params.data.mgid] ? groupsMap.current[params.data.mgid].name : 'UnknownMG') + '</span>' +
                '</span>';
        }
        html += '</div>';
        return html;
    }, [classes.appsAndMgsIcon]);

    const agGridTableOptions = useMemo(() => {

        class GroupRenderer extends Component {
            constructor(cellProps: any) {
                super(cellProps);
            }

            getReactContainerStyle() {
                // return {
                //     display: 'flex',
                //     height: '100%',
                // };
            }

            refresh() {
                return false;
            }

            render() {
                // @ts-ignore
                const { node } = this.props;

                if (node.group) {
                    const rowGroupColumnHeaderName = node.rowGroupColumn.colDef.headerName;

                    if (rowGroupColumnHeaderName === 'Move Group') {
                        return (
                            <>
                                <VcioIcon vcio="migration-move-group" iconColor={colors.blue_500} style={{ marginTop: 15, marginRight: 5 }}/>
                                {node.group ? node.groupData['ag-Grid-AutoColumn'] : node.data.name}
                            </>
                        );
                    }

                    if (rowGroupColumnHeaderName === 'Application') {
                        return (
                            <>
                                <VcioIcon vcio="migration-application" iconColor={colors.blue_500} style={{ marginTop: 15, marginRight: 5 }}/>
                                {node.group ? node.groupData['ag-Grid-AutoColumn'] : node.data.name}
                            </>
                        );
                    }

                    if (rowGroupColumnHeaderName === 'Compute Instance') {
                        return (
                            <>
                                <VcioIcon vcio="migration-device" iconColor={colors.blue_gray_500} style={{ marginTop: 15, marginRight: 5 }}/>
                                {node.group ? node.groupData['ag-Grid-AutoColumn'] : node.data.name}
                            </>
                        );
                    }

                    if (rowGroupColumnHeaderName === 'IPs') {
                        return (
                            <>
                                <VcioIcon vcio="um-sitemap" iconColor={colors.blue_gray_500} style={{ marginTop: 15, marginRight: 5 }}/>
                                {node.group ? node.groupData['ag-Grid-AutoColumn'] : node.data.name}
                            </>
                        );
                    }

                    if (rowGroupColumnHeaderName === 'Type') {
                        return (
                            <>
                                <VcioIcon vcio="migration-dependency" iconColor={colors.blue_gray_500} style={{ marginTop: 15, marginRight: 5 }}/>
                                {node.group ? node.groupData['ag-Grid-AutoColumn'] : node.data.name}
                            </>
                        );
                    }

                    return (
                        <>
                            <VcioIcon vcio="general-tag-outline" iconColor={colors.blue_gray_500} style={{ marginTop: 15, marginRight: 5 }}/>
                            {node.group ? node.groupData['ag-Grid-AutoColumn'] : node.data.name}
                        </>
                    );
                }

                // @ts-ignore
                const groupedColumns = node.columnApi.getRowGroupColumns();

                let cellValue = '';

                groupedColumns.forEach((groupColumn: Column) => {
                    // @ts-ignore
                    const { colDef } = groupColumn;

                    if (colDef.headerName === 'Move Group') {
                        if (node.data && node.data.mgid) {
                            cellValue = cellValue + (cellValue ? ' | ' : '')
                                + (groupsMap.current[node.data.mgid] ? groupsMap.current[node.data.mgid].name : 'UnknownMG');
                        }
                    }

                    if (colDef.headerName === 'Application') {
                        if (node.data && node.data.apps.length > 0) {
                            cellValue = cellValue + (cellValue ? ' | ' : '') + node.data.apps.map((app: any) => {
                                return (groupsMap.current[app] ? groupsMap.current[app].name : 'UnknownApp');
                            });
                        }
                    }

                    if (colDef.headerName === 'Compute Instance') {
                        cellValue = cellValue + (cellValue ? ' | ' : '') + (node.group ? node.groupData['ag-Grid-AutoColumn'] : node.data.name);
                    }

                    if (colDef.headerName === 'IPs') {
                        if (node.data && node.data.ips.length > 0) {
                            cellValue = cellValue + (cellValue ? ' | ' : '') + node.data.ips.map((ip: any) => {
                                return ip;
                            });
                        }
                    }

                    if (colDef.headerName === 'Type') {
                        cellValue = cellValue + (cellValue ? ' | ' : '') + node.data.type;
                    }
                });

                return (
                    <>
                        {cellValue}
                    </>
                );
            }
        }

        return _.merge({
            autoGroupColumnDef: {
                cellRenderer: 'agGroupCellRenderer',
                cellRendererParams: {
                    innerRenderer: 'groupRenderer',
                },
                columnGroupShow: false,
                filter: 'agMultiColumnFilter',
                filterParams: {
                    filters: [
                        {
                            filter: 'agTextColumnFilter',
                            filterParams: {
                                newRowsAction: 'keep',
                                buttons: ['reset']
                            }
                        },
                    ]
                },
                floatingFilter: true,
                headerName: 'Groups', // do not assign when groupHideOpenParents = true
                headerTooltip: 'Grouped columns',
                width: 250,
                menuTabs: ['filterMenuTab', 'columnsMenuTab', 'generalMenuTab'],
                resizable: true,
                sort: 'desc',
                sortable: true,
                valueGetter: groupingValueGetter,
            },
            cacheQuickFilter: true,
            columnDefs: [
                {
                    headerTooltip: 'Check or drag this column',
                    field: '',
                    rowDrag: true,
                    checkboxSelection: true,
                    headerCheckboxSelection: true,
                    headerCheckboxSelectionFilteredOnly: true,
                    suppressMovable: true,
                    lockPosition: true,
                    lockVisible: true,
                    unSortIcon: true,
                    floatingFilter: false,
                    width: 65,
                    sortable: false,
                    suppressMenu: true,
                    rowDragText: getGroupingRowDragText,
                    cellStyle: { verticalAlign: 'middle' },
                },
                {
                    headerName: 'Compute Instance',
                    enableRowGroup: true,
                    menuTabs: ['columnsMenuTab', 'filterMenuTab', 'generalMenuTab'],
                    columnsMenuParams: {
                        // hides the Column Filter section
                        suppressColumnFilter: true,

                        // hides the Select / Un-select all widget
                        suppressColumnSelectAll: true,

                        // hides the Expand / Collapse all widget
                        suppressColumnExpandAll: true,
                    },
                    filter: 'agMultiColumnFilter',
                    filterParams: {
                        filters: [
                            {
                                filter: 'agTextColumnFilter',
                                filterParams: {
                                    newRowsAction: 'keep',
                                    buttons: ['reset']
                                }
                            },
                        ]
                    },
                    field: 'name',
                    flex: 1,
                    width: 250,
                    minWidth: 200,
                    resizable: true,
                    sortable: true,
                    sort: 'asc',
                    unSortIcon: true,
                    cellStyle: { verticalAlign: 'middle' },
                },
                {
                    headerName: 'Application',
                    hide: false,
                    enableRowGroup: true,
                    rowGroup: false,
                    rowGroupIndex: 1,
                    flex: 1,
                    floatingFilter: true,
                    minWidth: 200,
                    resizable: true,
                    sortable: true,
                    valueGetter: applicationValueGetter,
                    sort: 'desc',
                    unSortIcon: true,
                    cellRenderer: applicationColumnRenderer,
                    cellStyle: { verticalAlign: 'middle' },
                },
                {
                    headerName: 'Move Group',
                    hide: false,
                    enableRowGroup: true,
                    rowGroup: false,
                    rowGroupIndex: 0,
                    valueGetter: moveGroupValueGetter,
                    flex: 1,
                    minWidth: 200,
                    resizable: true,
                    sortable: true,
                    sort: 'desc',
                    unSortIcon: true,
                    cellRenderer: moveGroupColumnRenderer,
                    cellStyle: { verticalAlign: 'middle' },
                },
                {
                    headerName: 'IPs',
                    enableRowGroup: true,
                    columnGroupShow: false,
                    field: 'ips',
                    flex: 1,
                    minWidth: 150,
                    resizable: true,
                    sortable: true,
                    unSortIcon: true,
                    cellStyle: { verticalAlign: 'middle' },
                },
                {
                    headerName: 'Type',
                    enableRowGroup: true,
                    field: 'type',
                    flex: 1,
                    minWidth: 150,
                    resizable: true,
                    sortable: true,
                    unSortIcon: true,
                    cellStyle: { verticalAlign: 'middle' },
                },
            ],
            defaultColDef: {
                sortable: true,
                filter: 'agMultiColumnFilter',
                filterParams: {
                    filters: [
                        {
                            filter: 'agTextColumnFilter',
                            filterParams: {
                                newRowsAction: 'keep',
                                buttons: ['reset']
                            }
                        },
                    ]
                },
                floatingFilter: true,
                menuTabs: ['columnsMenuTab', 'filterMenuTab', 'generalMenuTab'],
                onCellClicked: onCellClickedHandler
            },
            frameworkComponents: {
                groupRenderer: GroupRenderer
            },
            getRowNodeId: rowNodeIdGetter,
            // groupHideOpenParents: true, //when set to true, the grouped columns behave differently
            groupSelectsChildren: true,
            immutableData: true,
            localeText: AG_GRID_LOCALE_EN,
            rowGroupPanelShow: 'always',
            debug: !!process.env.NEXT_PUBLIC_DEBUG_FLAG,
            valueCache: true,
            debounceVerticalScrollbar: true,
            rowBuffer: 25,
            rowHeight: 54,
            suppressContextMenu: true,
            suppressScrollOnNewData: true,
            tooltipShowDelay: 0,
            suppressRowClickSelection: true,
            suppressCellSelection: false,
            enableCellTextSelection: true
        }, getDragDropGridConfig(props));
    }, [groupingValueGetter, getGroupingRowDragText, applicationValueGetter, applicationColumnRenderer, moveGroupValueGetter, moveGroupColumnRenderer, onCellClickedHandler, rowNodeIdGetter, props]);

    useMemo(() => {
        pProject.roProjectWithData.custom_node_props?.forEach((customProp) => {
            // @ts-ignore
            agGridTableOptions.columnDefs.push({
                headerName: customProp.title,
                enableRowGroup: true,
                columnGroupShow: false,
                field: customProp.name,
                flex: 1,
                minWidth: 150,
                resizable: true,
                sortable: true,
                unSortIcon: true,
                valueGetter: (params: ValueGetterParams) => {
                    // @ts-ignore
                    return params.data ? params.data.custom_props[params.colDef.field] : '';
                },
                cellStyle: { verticalAlign: 'middle' },
            });
        });
    }, [agGridTableOptions.columnDefs, pProject.roProjectWithData.custom_node_props]);

    const handleUpdateDevice = useCallback((device: NetworkNode) => {
        const ni = pProject.roProjectWithData.nodes.findIndex(node => node.id == device.id);
        if (ni > -1) {
            pProject.updateDevice(ni, device);
            pMutateProject(pProject, false);
            pEnableSave(true);
        }
    }, [pProject, pMutateProject, pEnableSave]);

    /**
     * User applied changes in the Set Custom Properties dialog (CustomPropertiesDialog).
     * Update the map of custom property name (name is the id) to title (title is the user friendly name) with
     * the new custom property.
     */
    const applyNewCustomProperties = useCallback((newCustomProperties: NewCustomProperty[]) => {
        if (newCustomProperties.length < 1) {
            return;
        }

        // Loop thru the new custom properties returned by the CustomPropertiesDialog
        _.forEach(newCustomProperties, (newCustomProperty: NewCustomProperty) => {
            if (!newCustomProperty.removed &&
                newCustomProperty.title !== '' &&
                newCustomProperty.value !== '' &&
                newCustomProperty.errorMessage === '') {
                cpNameToTitleMap[newCustomProperty.name] = { title: newCustomProperty.title };
            }
        });
    }, [cpNameToTitleMap]);

    const onContextMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();  // If context menu is showing, suppress right mouse click
    }, []);

    if (!pProject) {
        return <></>;
    }

    return (
        <>
            <Box
                onContextMenu={onContextMenu}
                data-cy='inventory-device'
            >
                <ListPanel
                    key='inventory-device'
                    hasTableView={true}
                    hasFilters={true}
                    type={InventoryType.Device}
                    // @ts-ignore
                    items={filteredNodes}
                    maxBodyHeight={maxBodyHeight}
                    groupsMap={groupsMap}               // Does not appear in ListPanel - how is this not an error?
                    agGridOptions={agGridOptions}
                    agGridTableOptions={agGridTableOptions}
                    showFilterByGridTypeButtons={true}
                    showDropTypeButtons={true}
                    contextCallback={handleContextClick}
                    // @ts-ignore
                    selectedRows={selectedRows}
                    selectedRowChange={handleRowSelection}
                    toolbarFooter={toolbarFooter}
                    project={pProject}
                    mutateProject={pMutateProject}
                    enableSave={pEnableSave}
                    setGridReadyOptions={handleAgGridReady}
                    cpNameToTitleMap={cpNameToTitleMap}
                />
                <InventoryContextMenu
                    type={InventoryType.Device}
                    contextCallback={inventoryContextCallback}
                    selectedRows={selectedRows?.length > 0 ? selectedRows : clickedRow}
                    mouseX={mousePosition.mouseX}
                    mouseY={mousePosition.mouseY}
                />
            </Box>
            {
                openCustomPropertiesDialog &&
                <CustomPropertiesDialog
                    open={openCustomPropertiesDialog}
                    closeDialog={hideCustomPropertiesDialog}
                    applyNewCustomProperties={applyNewCustomProperties}
                    selectedRows={selectedRows?.length > 0 ? selectedRows : clickedRow}
                    project={pProject}
                    mutateProject={pMutateProject}
                    enableSave={pEnableSave}
                />
            }
            {
                deviceEditDialogOpen !== null &&
                <DeviceEditDialog
                    open={true}
                    item={deviceEditDialogOpen}
                    onClose={() => setDeviceEditDialogOpen(null)}
                    onUpdateClick={handleUpdateDevice}
                />
            }
        </>
    );
};
