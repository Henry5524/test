import { Box, BoxProps, Button, Grid, InputAdornment, makeStyles, TextField } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import { ToggleButtonGroup } from '@material-ui/lab';
import { colors, text } from '@styles';
import { InventoryType, log } from '@utils';
import { CellClickedEvent, GridReadyEvent, RowSelectedEvent } from 'ag-grid-community';
import 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';
import clsx from 'clsx';
import _ from 'lodash';
import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isMacOs } from 'react-device-detect';
import { CustomProperty, NodeGroup, ProjectContainer } from '../models';
import { isCalculating } from '../utils/common-project';
import { InformationTooltip, VcioIcon } from './controls';
import { TooltipToggleButton } from './controls/TooltipToggleButton';
import { AddCustomPropertyValueDialog, AddGroupDialog } from './dialogs';

const useStyles = makeStyles(_theme => ({
    root: {
        margin: 0,
        paddingRight: 10,
    },
    title: {
        color: colors.blue_gray_500,
        fontSize: 15,
        '& > b': {
            ...text.h5,
            color: colors.black_90,
            marginRight: 5
        },
    },
    gridContainer: {
        position: 'relative'
    },
    gridContainerButton: {
        position: 'absolute',
        zIndex: 15,
        right: 0,
        top: 2
    },
    gridContainerGrid: {
        zIndex: 10
    }
}));

interface ListPanelProps extends Partial<BoxProps> {

    // ListPanel is used for devices, applications, and move groups - which kind of ListPanel we are
    type: InventoryType;
    // This is either the filtered pProject.nodes, pProject.apps, or pProject.move_groups
    items: NodeGroup[];

    // true from inventory-device, not provided by inventory-application or inventory-movegroup
    hasTableView?: boolean;

    // true from inventory-device, not provided by inventory-application or inventory-movegroup
    hasFilters?: boolean;

    maxBodyHeight?: any;        // Provided by all three containers
    contextCallback?: Function; // Provided by Inventory to inventory-device to ListPanel to handle the grids context menu
    selectedRows?: NodeGroup[]; // Which rows in the grid are selected, applicable to all three containers

    // Callback provided by all three containers so ListPanel can inform the container about row selection
    selectedRowChange?: Function;

    // toolbar shown only on a devices ListPanel - shows the applied app/custom property/move group filters
    toolbarFooter?: ReactNode;

    // The project from the swr cache
    project: ProjectContainer;
    // Provided to update the project in the swr cache, for example when adding an application, move group, or custom
    // property
    mutateProject: Function;

    // Callback to let Inventory know a change was made by a child that necessitates a project Save
    enableSave: Function;

    // Provided by inventory-application and inventory-movegroup.  Also provided by
    // inventory-device when the device grid is toggled to card view.
    agGridOptions?: any;

    // Provided from inventory-device when the device grid is toggled to table view
    agGridTableOptions?: any;

    // Provides the grid ready options for the three grids to Inventory.tsx
    // for devices ListPanel, is Inventory.tsx setDeviceGridOptions
    // for apps ListPanel, is Inventory.tsx setApplicationGridOptions
    // for move groups ListPanel, is Inventory.tsx setMoveGroupGridOptions
    setGridReadyOptions: Function;

    // Optional button to be shown on the grid header
    optionalBtn?: JSX.Element;

    // Optional replacement for the default (static) header text
    headerControl?: JSX.Element;

    // application or else a custom property.  Only used for application subpanel.
    selectedVal?: string;

    // application or else a custom property.  Only used for application subpanel.
    selectedName?: string;

    // provided by inventory-device so that device panel may be updated with custom property changes
    cpNameToTitleMap?: any;
}

/**
 * ListPanel is rendered by three different parent containers:
 *  inventory-device to show a devices grid
 *  inventory-application to show an applications grid
 *  inventory-movegroup to show a move groups grid
 *
 * Note that when showing the applications grid, there is a drop-down that lets you choose to instead show the values
 * for a custom property in the grid.
 *
 */
export const ListPanel: React.FunctionComponent<ListPanelProps> = (props) => {
    const {
        project: pProject, cpNameToTitleMap: pCpNameToTitleMap, agGridOptions: pAgGridOptions, selectedName: pSelectedName, selectedVal: pSelectedVal, contextCallback: pContextCallback, type: pType, items: pItems,
        maxBodyHeight: pMaxBodyHeight, headerControl: pHeaderControl, selectedRows: pSelectedRows, agGridTableOptions: pAgGridTableOptions, selectedRowChange: pSelectedRowChange, toolbarFooter: pToolbarFooter, enableSave: pEnableSave, className: pClassName, hasTableView: pHasTableView,
        optionalBtn: pOptionalBtn, mutateProject: pMutateProject
    } = props;
    const classes = useStyles();

    const calculating = useMemo(() => isCalculating(pProject), [pProject]);

    // Tracks whether the user selected Card View or List View on the device panel.  Probably should be named listView.
    // Only relevant for device ListPanel
    const [tableView, setTableView] = useState(false);

    // Only relevant for applications and move groups ListPanels
    const [addGroupDialogOpen, setAddGroupDialogOpen] = useState(false);

    // Only relevant for applications ListPanel
    const [addCustomPropertyValueDialogOpen, setAddCustomPropertyValueDialogOpen] = useState(false);

    const quickFilterRef = useRef(null);

    const [viewType, setViewType] = useState('card');

    const [selectedRowCount, setSelectedRowCount] = useState(0);

    const [gridReadyOptions, setGridReadyOptions] = useState<GridReadyEvent>();

    const handleOnGridReady = useCallback((pGridReadyOptions: GridReadyEvent) => {
        setGridReadyOptions(pGridReadyOptions);
        props.setGridReadyOptions(pGridReadyOptions);
    }, []);

    // Copy the AgGridOptions we received so that we can add our onGridReady handler
    // This version of the options will be provided when building the Ag Grid
    const myAgGridOptions = useMemo(() => {
        if (!pAgGridOptions) {
            return null;
        }
        const localGridOptions = _.cloneDeep(pAgGridOptions);
        localGridOptions.onGridReady = handleOnGridReady;
        return localGridOptions;
    }, [pAgGridOptions, handleOnGridReady]);

    // Need to do the same of the table version of options (if supplied)
    const myAgGridTableOptions = useMemo(() => {
        if (!pAgGridTableOptions) {
            return null;
        }
        const localGridTableOptions = _.cloneDeep(pAgGridTableOptions);
        localGridTableOptions.onGridReady = handleOnGridReady;
        return localGridTableOptions;
    }, [pAgGridTableOptions, handleOnGridReady]);

    const gridQuickFilterId = useMemo(() => 'gridQuickFilter-' + pType.replace(/ /g, ''), [pType]);

    /**
     * useEffect runs after render - This one is used to dynamically update the grid data rows whenever the project
     * changes.  Intent is to update the data rows following a copy/move/drag.
     * This is relevant for all three types of ListPanels.
     */
    useEffect(() => {
        // log(`ListPanel: type=${pType} useEffect for [gridReadyOptions, project]`);
        if (gridReadyOptions) {
            // log(`ListPanel: type=${pType} useEffect for [gridReadyOptions, project] redrawing rows`);
            // @ts-ignore
            gridReadyOptions.api.redrawRows();
            // @ts-ignore
            gridReadyOptions.api.resetRowHeights();

            // @ts-ignore
            if (quickFilterRef && quickFilterRef.current && quickFilterRef.current.childNodes[0]) {
                // @ts-ignore
                const gridQuickFilter = quickFilterRef.current.childNodes[0].querySelector('#' + gridQuickFilterId);
                // @ts-ignore
                if (gridQuickFilter && gridQuickFilter.value) {
                    // @ts-ignore
                    gridReadyOptions.api.setQuickFilter(gridQuickFilter.value);
                }
            }
        }
    }, [gridReadyOptions, pProject, gridQuickFilterId]);

    const handleViewChange = useCallback((_event: object, listViewType: string) => {
        if (listViewType !== null) {
            setViewType(listViewType);

            // todo: need to change the column defs and have it apply
            setTableView(listViewType === 'table');
        }
    }, []);

    const getAddBtnTitle = useCallback(() => {
        let addBtnTitle: string = '';
        if (pType === InventoryType.Application) {
            if (pSelectedVal === 'application') {
                addBtnTitle = `Add ${InventoryType.Application}`;
            } else {
                addBtnTitle = 'Add Custom Property Value';
            }
        } else if (pType === InventoryType.MoveGroup) {
            addBtnTitle = `Add ${InventoryType.MoveGroup}`;
        }
        return addBtnTitle;
    }, [pSelectedVal, pType]);

    const addBtnTitle: string = useMemo(() => getAddBtnTitle(), [getAddBtnTitle]);

    const showAddGroupDialog = useCallback(() => {
        setAddGroupDialogOpen(true);
    }, []);

    const showAddCustomPropertyValueDialog = useCallback(() => {
        setAddCustomPropertyValueDialogOpen(true);
    }, []);

    // Quick Search....
    const [listSearch, setListSearch] = useState<string>();
    const searchItems = useMemo(() => listSearch
        ? pItems.filter(item => item.name && listSearch ? item.name.toLocaleLowerCase().indexOf(listSearch) > -1 : true)
        : pItems, [pItems, listSearch]);

    const handleSearchChange = useCallback((event: { target: { value: any } }) => {
        if (gridReadyOptions) {
            gridReadyOptions.api.setQuickFilter(event.target.value);
        }
        setListSearch(event?.target?.value?.toLocaleLowerCase() ?? '');
    }, [gridReadyOptions]);

    const onCellContextMenuClick = useCallback((cce: CellClickedEvent) => {
        if (pContextCallback && cce?.event) {
            log('[ListPanel] onCellContextMenuClick, cce:', cce, '\n\tcce.data:', cce.data, '\n\tselectedRows:', pSelectedRows);
            pContextCallback(
                (cce.event as MouseEvent).clientX - 2,
                (cce.event as MouseEvent).clientY - 4,
                pSelectedRows,
                [cce.data]
            );
        }
    }, [pContextCallback, pSelectedRows]);

    // const handleContextClick = (event: MouseEvent<HTMLDivElement>) => {
    //     if (pContextCallback) {
    //         event.preventDefault();
    //         pContextCallback(event.clientX - 2, event.clientY - 4, pSelectedRows ? (pSelectedRows) : []);
    //     }
    // };

    /**
     * Row selection has changed.  Execute callback, if available
     */
    const handleSelectedRowsChange = useCallback((event: RowSelectedEvent) => {
        setSelectedRowCount(event.api.getSelectedRows().length);
        if (pSelectedRowChange) {
            pSelectedRowChange(pSelectedVal, event.api.getSelectedRows());
        }
    }, [pSelectedRowChange, pSelectedVal]);

    const infoIcon: any = useMemo(() => {
        if (pType === InventoryType.MoveGroup) {
            return (
                <InformationTooltip>
                    <b>Move</b>
                    <span style={{ fontStyle: 'italic' }}>Move Groups</span> into
                    <span style={{ fontStyle: 'italic' }}>Compute Instances</span>,
                    <span style={{ fontStyle: 'italic' }}>Applications</span> or
                    <span style={{ fontStyle: 'italic' }}>Custom Properties</span> by dragging and dropping their rows into the appropriate grid.
                    <br/><br/>
                    <b>Copy</b> <span style={{ fontStyle: 'italic' }}>Move Groups</span> by holding down the
                    <b>{isMacOs ? 'COMMAND' : 'CONTROL'}</b> key before dragging the rows into one of the other grids.
                </InformationTooltip>
            );
        }
        return (
            <InformationTooltip>
                <b>Move</b>
                <span style={{ fontStyle: 'italic' }}>Compute Instances</span> into
                <span style={{ fontStyle: 'italic' }}>Applications</span>,
                <span style={{ fontStyle: 'italic' }}>Custom Properties</span> or
                <span style={{ fontStyle: 'italic' }}>Move Groups</span> by dragging and dropping their rows into the appropriate grid.
                <br/><br/>
                <b>Copy</b>
                <span style={{ fontStyle: 'italic' }}>Compute Instances</span> by holding down the
                <b>{isMacOs ? 'COMMAND' : 'CONTROL'}</b> key before dragging the rows into one of the other grids.
            </InformationTooltip>
        );
    }, [pType]);

    const panelTop: any = useMemo(() => {
        if (pType === InventoryType.Application && pHeaderControl) {
            // Application panel has custom header control
            return pHeaderControl;
        }
        if (searchItems) {
            const title = (pType === 'Device' ? 'Compute Instance' : pType);
            return (
                <>
                    <VcioIcon
                        vcio={pType === InventoryType.Device ? 'migration-device' : 'migration-move-group'}
                        iconColor={colors.blue_gray_500}
                        style={{ marginTop: -2, marginRight: 5 }}
                    />
                    <span data-cy={`inventoryPanelTitle${pType}`} style={{ fontWeight: 600, color: colors.black_90 }}>{`${title}s`}</span>
                    &nbsp;(<span data-cy={`inventoryPanelTitle${pType}Count`}>{searchItems.length}</span>)
                    {infoIcon}
                </>
            );
        }
        return <></>;
    }, [pHeaderControl, infoIcon, searchItems, pType]);

    /**
     * Sort ascending ignoring case
     */
    const sortComparator = useCallback((a: string, b: string): number => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        if (aLower < bLower) {
            return -1;
        }
        if (aLower < bLower) {
            return 1;
        }
        return 0;
    }, []);

    /**
     * What data do we want to show in the grid?  If the selected value from the drop-down at the top of the applications
     * ListPanel is 'applications' then we want to show the NodeGroups in the searchItems variable.
     * If a custom property is selected in the drop-down, we want to show the string values for that custom property.
     */
    const getRowData = useCallback((): NodeGroup[] | string[] => {
        let result: any;

        if (pType === InventoryType.Device) {
            result = pItems?.map(row => {
                // Adding cpNameToTitleMap here is a hack - we are adding it to each row.  Would prefer to add it to
                // AgGridReact.context.cpNameToTitleMap.  Issue occurred: When a new custom property was added to a device via
                // the CustomPropertiesDialog, could not get AgGridReact.context.cpNameToTitleMap to update right away.
                return ({ ...row, tableData: { checked: false }, cpNameToTitleMap: pCpNameToTitleMap });
            });
        } else if (pType === InventoryType.MoveGroup) {
            result = pItems?.map(row => {
                return ({ ...row, tableData: { checked: false } });
            });
        } else if (pType === InventoryType.Application && pSelectedVal === 'application') {
            result = searchItems.map(row => {
                return ({ ...row, tableData: { checked: false } });
            });
        } else {
            let values: string[] = [];
            const cp: CustomProperty | undefined = _.find(pProject.roProjectWithData.custom_node_props, { name: pSelectedVal });
            if (cp && cp.str_values && cp.str_values.length > 0) {
                values = cp.str_values;
            }
            values = values.sort(sortComparator);

            result = [];
            _.each(values, (value) => {
                result.push({
                    id: value,
                    name: value,
                    type: pSelectedVal,
                    typeName: cp ? cp.title : '',
                });
            });

            // we need to filter based on filter text entered
            if (listSearch) {
                result = result.filter((item: any) => item.name ? item.name.match(new RegExp(listSearch, 'gi')) : true);
            }
        }

        return result;
    }, [pCpNameToTitleMap, pItems, listSearch, pProject.roProjectWithData.custom_node_props, searchItems, pSelectedVal, sortComparator, pType]);

    const myRowData: NodeGroup[] | string[] = useMemo(() => getRowData(), [getRowData]);

    const getAgGrid = useCallback((gridOptions: any) => {

        return (
            <>
                <Grid
                    container
                    // onContextMenu={handleContextClick}
                    style={{ cursor: pContextCallback ? 'context-menu' : 'auto' }}
                >
                    <Grid item xs={12}>
                        <div
                            data-cy="listPanelGridDiv"
                            className="ag-theme-alpine"
                            style={{
                                height: pMaxBodyHeight + 60,
                                width: '100%'
                            }}
                        >
                            <AgGridReact
                                data-cy="listPanelGrid"
                                gridOptions={gridOptions}
                                onSelectionChanged={handleSelectedRowsChange}
                                preventDefaultOnContextMenu={true}
                                onCellContextMenu={onCellContextMenuClick}
                                rowData={myRowData}
                                /*
                                    The below context is available in InventoryApplication ApplicationCardCellRenderer
                                    and in InventoryMoveGroups MoveGroupCardCellRenderer as params.context.
                                    The context is passed to ApplicationCard and MoveGroupCard as a property and is
                                    available as context.

                                    Note that we pass just what we need from project to ApplicationCard/MoveGroupCard
                                    Inside ApplicationCard/MoveGroupCard it is referenced as context.pProject.
                                    No need to pass the potentially massive nodes object.
                                 */
                                context={{
                                    selectedRowCount,
                                    calculating,
                                    selectedName: pSelectedName,
                                    selectedVal: pSelectedVal,
                                    project: {
                                        id: pProject.roProjectWithData.id,
                                        project_name: pProject.roProjectWithData.project_name,
                                        project_instance: pProject.roProjectWithData.project_instance,
                                        apps: pProject.roProjectWithData.apps,
                                        move_groups: pProject.roProjectWithData.move_groups,
                                        custom_node_props: pProject.roProjectWithData.custom_node_props,
                                        results: pProject.roProjectWithData.results
                                    }
                                }}
                            />
                        </div>
                    </Grid>
                </Grid>
            </>
        );
    }, [calculating, pContextCallback, handleSelectedRowsChange, pMaxBodyHeight, myRowData, onCellContextMenuClick, pProject.roProjectWithData.apps, pProject.roProjectWithData.custom_node_props, pProject.roProjectWithData.id, pProject.roProjectWithData.move_groups, pProject.roProjectWithData.project_instance, pProject.roProjectWithData.project_name, pProject.roProjectWithData.results, pSelectedName, selectedRowCount, pSelectedVal]);

    return (
        <>
            <Grid
                container
                direction="column"
                className={clsx(classes.root, pClassName)}
            >
                <Grid item xs={12}>
                    <Grid container alignItems="center">
                        <Grid item style={{ marginBottom: pType === 'Move Group' ? 18 : 6 }} className={classes.title}>
                            {panelTop}
                        </Grid>
                        <Grid item xs/>
                        <Grid item>
                            {
                                pHasTableView &&
                                <ToggleButtonGroup
                                    data-cy="listPanelViewTypeGroup"
                                    value={viewType}
                                    exclusive
                                    onChange={handleViewChange}
                                    aria-label="view type"
                                >
                                    <TooltipToggleButton
                                        data-cy="listPanelCardViewButton"
                                        title="Card View"
                                        placement="bottom-start"
                                        arrow
                                        value="card"
                                        aria-label="card view"
                                    >
                                        <VcioIcon vcio="view-cards" iconColor={colors.green_500}/>
                                    </TooltipToggleButton>
                                    <TooltipToggleButton
                                        dataCy="listPanelTableViewButton"
                                        title="List View"
                                        placement="bottom-start"
                                        arrow
                                        value="table"
                                        aria-label="list view"
                                    >
                                        <VcioIcon vcio="view-table" iconColor={colors.green_500}/>
                                    </TooltipToggleButton>
                                </ToggleButtonGroup>
                            }
                            {
                                !pHasTableView &&
                                <Button
                                    size="large"
                                    data-cy="InventoryAddButton"
                                    variant="outlined"
                                    style={{ marginTop: -6 }}
                                    title={addBtnTitle}
                                    onClick={
                                        (
                                            pType === InventoryType.MoveGroup
                                            || (pType === InventoryType.Application && pSelectedVal === 'application')
                                        )
                                            ? showAddGroupDialog
                                            : showAddCustomPropertyValueDialog
                                    }
                                    className="icon-button"
                                >
                                    <VcioIcon vcio="general-plus" iconColor={colors.green_500}/>
                                </Button>
                            }
                        </Grid>
                    </Grid>
                    <Grid container style={{ marginTop: 20 }}>
                        <Grid item xs={12}>
                            <TextField
                                id={gridQuickFilterId}
                                size="small"
                                fullWidth={true}
                                data-cy="devicesSearchField"
                                placeholder="Quick filter..."
                                ref={quickFilterRef}
                                onChange={handleSearchChange}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon/>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                    </Grid>
                    {
                        pToolbarFooter &&
                        pToolbarFooter
                    }
                </Grid>
                <Grid container style={{ marginTop: '20px' }}>
                    <Grid item xs>
                        {
                            !tableView &&
                            <>
                                <Box className={classes.gridContainer}>
                                    <Box className={classes.gridContainerButton}>
                                        {pOptionalBtn}
                                    </Box>
                                    <Box className={classes.gridContainerGrid}>
                                        {getAgGrid(myAgGridOptions)}
                                    </Box>
                                </Box>
                            </>
                        }
                        {
                            pHasTableView && tableView &&
                            <>
                                {getAgGrid(myAgGridTableOptions)}
                            </>
                        }
                    </Grid>
                </Grid>
            </Grid>
            {
                addGroupDialogOpen &&
                <AddGroupDialog
                    type={pType}
                    handleDialogClose={(addedGroup: boolean) => {
                        setAddGroupDialogOpen(false);
                        if (addedGroup) {
                            // Tell parent that we changed the project
                            pEnableSave(true);
                        }
                    }}
                    open={true}
                    project={pProject}
                    mutateProject={pMutateProject}
                />
            }
            {
                addCustomPropertyValueDialogOpen &&
                <AddCustomPropertyValueDialog
                    handleDialogClose={() => {
                        setAddCustomPropertyValueDialogOpen(false);
                    }}
                    open={true}
                    name={pSelectedVal || ''}
                    project={pProject}
                    mutateProject={pMutateProject}
                    enableSave={pEnableSave}
                />
            }
        </>
    );
};
