import { Box, Button, FormControl, Grid, ListItemIcon, makeStyles, MenuItem, Select, Tooltip, withStyles } from '@material-ui/core';
import { useWindowHeight } from '@react-hook/window-size';
import { ColumnApi, GridApi, GridReadyEvent, ICellRendererParams } from 'ag-grid-community';
import { IRowDragItem } from 'ag-grid-community/dist/lib/rendering/row/rowDragComp';
import _ from 'lodash';
import { useSnackbar } from 'notistack';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { isMacOs } from 'react-device-detect';
import { AppContext } from '../../context';
import { CustomProperty, NetworkNode, NodeGroup, ProjectContainer } from '../../models';
import { Api } from '../../services';
import { colors, text } from '../../styles';
import { AG_GRID_LOCALE_EN, getDragDropGridConfig, InventoryType, log, RowDragMode, ShowToast } from '../../utils';
import { isCalculating } from '../../utils/common-project';
import { InformationTooltip, VcioIcon } from '../controls';
import { ContextAction, ContextActions, InventoryContextMenu } from '../controls/InventoryContextMenu';
import { GeneralStringEditDialog, GroupEditDialog } from '../dialogs';
import { ApplicationCard } from '../list-cards';
import { ListPanel } from '../ListPanel';

const initialMousePosition = {
    mouseX: null,
    mouseY: null,
};

interface InventoryApplicationProps {
    showManageCustomPropsDialog: (event: any) => void;
    rowSelectionCallback?: Function;
    // applicationsSelected: NodeGroup[];
    project: ProjectContainer;
    mutateProject: Function;
    enableSave: Function;
    // eslint-disable-next-line react/no-unused-prop-types
    gridType: 'device' | 'application' | 'movegroup';
    setGridReadyOptions?: any;
    // this gets passed along via the into a utility function
    // eslint-disable-next-line react/no-unused-prop-types
    setDndData: Function;
    // this gets passed along via the into a utility function
    // eslint-disable-next-line react/no-unused-prop-types
    okToDropIntoRow: Function;
    contextCallback?: Function;
    calculationCallback?: Function;
    projectHasUnsavedChanges?: boolean;
}

const StyledMenuItem = withStyles({
    root: {
        backgroundColor: colors.white_100,
        '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
            color: colors.black_90,
            fontSize: 14
        },
        '&:focus': {
            // backgroundColor: colors.white_100,
            '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
                color: colors.black_90,
                fontSize: 14
            },
        },

    },
})(MenuItem);

const useStyles = makeStyles(_theme => ({
    dropdown: {
        '& > div > div.MuiListItemIcon-root > span.MuiIcon-root': {
            // Styles the icon on the select control
            height: '18px',
            width: '22.5px'
        },
        '& > div > span': {
            // Style the text on the select control
            fontWeight: 600,
            color: colors.black_90
        },
        '& > div > span > span': {
            // Style the count on the select control
            fontWeight: 'normal'
        }
    },
    menuItem: {
        height: '38px'
    },
    menuItemIcon: {
        minWidth: '0px',
        marginRight: '10px'
    },
    menuItemText: {
        ...text.regularText
    },
    menuItemTextCount: {
        ...text.regularText,
        opacity: '0.6'
    },
    paper: {
        borderRadius: 4,
        backgroundColor: colors.white_100,
        shadowColor: 'rgba(15, 45, 104, 0.15)',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowRadius: 15,
        shadowOpacity: 1,
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: colors.blue_gray_200,
    },
}));

/**
 * Inventory...Applications Subpanel (grid and toolbar)
 * @constructor
 */
export const InventoryApplication: React.FunctionComponent<InventoryApplicationProps> = (inventoryApplicationProps) => {
    const {
        project: pProject, setGridReadyOptions: pSetGridReadyOptions, calculationCallback: pCalculationCallback,
        contextCallback: pContextCallback, rowSelectionCallback: pRowSelectionCallback, mutateProject: pMutateProject,
        enableSave: pEnableSave, showManageCustomPropsDialog: pShowManageCustomPropsDialog, projectHasUnsavedChanges: pProjectHasUnsavedChanges
    } = inventoryApplicationProps;
    const classes = useStyles();
    const windowHeight = useWindowHeight();
    const maxBodyHeight = useMemo(() => windowHeight - 350, [windowHeight]);
    const appContext = useContext(AppContext);
    const { enqueueSnackbar } = useSnackbar();

    const [gridApi, setGridApi] = useState<{
        api: GridApi;
        columnApi: ColumnApi;
    }>();

    const [selectedName, setSelectedName] = useState('App');
    const [selectedVal, setSelectedVal] = useState('application');

    // Context menu management (right mouse)
    const [mousePosition, setMousePosition] = useState<{
        mouseX: null | number;
        mouseY: null | number;
    }>(initialMousePosition);

    const isRowDropCopy = useRef(false);

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

    const calculateButtonRef = React.useRef<HTMLButtonElement>(null);

    const [selectedRows, setSelectedRows] = useState<any[]>([]);
    const [clickedRow, setClickedRow] = useState<any[]>([]);

    const [groupEditDialogOpen, setGroupEditDialogOpen] = useState<NodeGroup | null>(null);
    const [cpEditDialogOpen, setCpEditDialogOpen] = useState<CustomProperty | null>(null);

    /**
     * Run calculation for app
     * @param ids
     */
    const startAppCalculation = useCallback((ids?: string[]) => {
        Api.calcApp(pProject.roProjectWithData.id, ids).then(() => {
            if (pCalculationCallback) {
                pCalculationCallback();
            }
        }).catch(err => {
            ShowToast(`Failed to start app calculation, error: ${err && err.statusText ? err.statusText : 'Unknown'}`, appContext, enqueueSnackbar, 'error');
        });
    }, [appContext, enqueueSnackbar, pProject, pCalculationCallback]);

    /**
     * Run calculations for custom property
     * @param customPropertyKey
     * @param values
     */
    const startCpCalculation = useCallback((customPropertyKey: string, values: string[]) => {
        Api.calcCustomProperty(pProject.roProjectWithData.id, customPropertyKey, values).then(() => {
            if (pCalculationCallback) {
                pCalculationCallback();
            }
        }).catch(err => {
            ShowToast(`Failed to start custom property calculation, error: ${err && err.statusText ? err.statusText : 'Unknown'}`, appContext, enqueueSnackbar, 'error');
        });
    }, [appContext, enqueueSnackbar, pCalculationCallback, pProject.roProjectWithData.id]);

    const inventoryContextCallback = useCallback((action: ContextAction) => {
        setMousePosition(initialMousePosition);
        const sr = selectedRows?.length > 0 ? selectedRows : clickedRow;
        const isCustomProperty: boolean = sr.length > 0 && sr[0].typeName;
        if (action === ContextActions.CalculateDependencies) {
            if (isCustomProperty) {
                startCpCalculation(sr[0].type, sr.map((data: any) => data.id));
            } else {
                startAppCalculation(sr.map((data: NetworkNode) => data.id));
            }
            return;
        }

        if (action === ContextActions.EditItem && sr?.length == 1) {
            if (isCustomProperty) {
                log('[InventoryApplication] contextCallback, sr[0]:', sr[0]);
                setCpEditDialogOpen(sr[0]);
            } else {
                setGroupEditDialogOpen(sr[0]);
            }
            return;
        }

        if (action === ContextActions.ExcludeItem) {
            const updatedProject: ProjectContainer = new ProjectContainer(pProject.roProjectWithData);
            updatedProject.excludeItems(sr, 'app');
            pMutateProject(updatedProject, false).then();
            pEnableSave(true);
        }

        if (action === ContextActions.UnExcludeItem) {
            const updatedProject: ProjectContainer = new ProjectContainer(pProject.roProjectWithData);
            updatedProject.unexcludeItems(sr, 'app');
            pMutateProject(updatedProject, false).then();
            pEnableSave(true);
        }

        if (pContextCallback) {
            pContextCallback(action, sr);
        }
    }, [clickedRow, pContextCallback, selectedRows, startAppCalculation, startCpCalculation, pMutateProject, pEnableSave, pProject.roProjectWithData]);

    /**
     * Handle right mouse (context) click
     *
     * @param mouseX
     * @param mouseY
     * @param contextSelectedRows
     * @param contextSelectedRow
     */
    const handleContextClick = useCallback((mouseX: number, mouseY: number, contextSelectedRows: [], contextSelectedRow: []) => {
        setMousePosition({
            mouseX,
            mouseY
        });
        setSelectedRows(contextSelectedRows);
        setClickedRow(contextSelectedRow);
    }, []);

    /**
     * Update selectedRows state and perform callback, if available
     *
     * @param type (application, custom property)
     * @param newSelectedRows
     */
    const handleRowSelection = useCallback((type: string, newSelectedRows: NetworkNode[]) => {
        if (pRowSelectionCallback) {
            pRowSelectionCallback(type, newSelectedRows);
        }
        setMousePosition(initialMousePosition);
        setSelectedRows(newSelectedRows);
    }, [pRowSelectionCallback]);

    /**
     * Custom renderer for table rows
     */
    const ApplicationCardCellRenderer = useCallback((params: ICellRendererParams) => {

        /*
            Inside this CellRenderer:
                - refers to the components properties.  But, cannot really use here.
                    The value of within this CellRenderer seems frozen to the first time
                    InventoryApplication is rendered.  If the pProject subsequently changes in a
                    different render of InventoryApplication, this CellRenderer will still see
                    the pProject as it was in the first render.  Thus, we need to use context
                    to pass component data to the CellRenderer.

                params.data
                params.node.data
                    Both refer to the data provided for the row

                params.context
                    refers to the context data provided by ListPanel to AgGridReact
                    This is the best way to pass component level data to this CellRenderer.
         */

        return (
            <Box style={{ display: 'flex', height: '100%' }}>
                <ApplicationCard item={params.node.data} context={params.context}/>
            </Box>
        );
    }, []);

    /**
     * Calculation button handler
     */
    const calcBtnLabel = useMemo(() => {
        if (selectedRows.length > 0) {
            return `Calculate for ${selectedRows.length} ${selectedName}(s)`;
        }
        return `Calculate All ${selectedName}s`;
    }, [selectedName, selectedRows.length]);

    /**
     * Determines whether the Calculate button should be disabled
     */
    const shouldDisableCalculateBtn = useCallback(() => {

        if (isCalculating(pProject)) {
            return true;
        }
        if (pProjectHasUnsavedChanges) {
            return true;
        }
        if (selectedName === 'App' && pProject.roProjectWithData.apps_count === 0) {
            return true;
        }
        if (selectedName !== 'App') {
            // User selected a custom property in the drop-down
            // selectedVal holds the name ('name' is a bad variable name, holds the id) of the custom property
            const cp: CustomProperty | undefined = _.find(pProject.roProjectWithData.custom_node_props, { name: selectedVal });
            if (!cp || !cp.str_values || cp.str_values.length === 0) {
                return true;
            }
        }

        return false;
    }, [pProject, pProjectHasUnsavedChanges, selectedName, selectedVal]);

    const calcBtnTooltipText = useMemo(() => {
        if (shouldDisableCalculateBtn()) {
            return 'The pProject must be saved in order to start calculation';
        }
        return 'Start calculation';
    }, [shouldDisableCalculateBtn]);

    const handleCalculate = useCallback(() => {
        // TODO: figure out how to get the page mask to cover the inventory area quicker
        // immediately disable the calculate button
        if (calculateButtonRef?.current) {
            calculateButtonRef.current.disabled = true;
        }
        // TODO - saveProject is not synchronous, need to rethink doing an auto save.
        // saveProject()
        // .then(() => {
        if (selectedVal === 'application') {
            // 'application' is selected in the ListPanel drop-down
            // The table shows applications
            startAppCalculation(gridApi?.api.getSelectedRows().map((data: NetworkNode) => data.id));
        } else {
            // A custom property is selected in the ListPanel drop-down
            // The table shows values for the selected custom property
            startCpCalculation(selectedVal, gridApi?.api.getSelectedRows().map((data: any) => data.id) || []);
        }
        // });
    }, [gridApi?.api, selectedVal, startAppCalculation, startCpCalculation]);

    /**
     * Calculate button to be shown in the table header
     */
    const calculateBtn = useMemo(() => {
        return (
            <Grid
                container
                direction="row"
                justify="flex-end"
            >
                <Grid item>
                    <Tooltip title={calcBtnTooltipText} arrow>
                        <span>
                            <Button
                                disabled={shouldDisableCalculateBtn()}
                                style={{ marginTop: 8 }}
                                size="small"
                                ref={calculateButtonRef}
                                variant="outlined"
                                data-cy="appCalculation"
                                startIcon={<VcioIcon vcio="migration-calculate" iconColor={colors.green_500} rem={0.7}/>}
                                onClick={handleCalculate}
                            >
                                {calcBtnLabel}
                            </Button>
                        </span>
                    </Tooltip>
                </Grid>
            </Grid>
        );
    }, [calcBtnLabel, calcBtnTooltipText, handleCalculate, shouldDisableCalculateBtn]);

    const getRowDragText = useCallback((params: IRowDragItem) => {
        const { rowNode } = params;

        if (rowNode) {
            const rowNodeSelected = rowNode.isSelected();
            const selectedNodeCount = gridApi?.api.getSelectedRows().length || 0;

            const isCustomProperty = !!rowNode.data.typeName;
            const dragType = isCustomProperty ? rowNode.data.typeName : 'application';

            if (rowNodeSelected && selectedNodeCount === 1) {
                rowNode.data.dragMode = isRowDropCopy.current ?
                    (isCustomProperty ? RowDragMode.CopySelectedProperty : RowDragMode.CopySelectedApplication) :
                    (isCustomProperty ? RowDragMode.MoveSelectedProperty : RowDragMode.MoveSelectedApplication);
                return (isRowDropCopy.current ? 'copy' : 'move')
                    + ' selected ' + dragType + ' "' + rowNode.data.name + '"';
            }
            if (!rowNodeSelected) {
                rowNode.data.dragMode = isRowDropCopy.current ?
                    (isCustomProperty ? RowDragMode.CopyProperty : RowDragMode.CopyApplication) :
                    (isCustomProperty ? RowDragMode.MoveProperty : RowDragMode.MoveApplication);
                return (isRowDropCopy.current ? 'copy' : 'move')
                    + ' ' + dragType + ' "' + rowNode.data.name + '"';
            }

            if (isCustomProperty) {
                rowNode.data.dragMode = isRowDropCopy.current ?
                    (isCustomProperty ? RowDragMode.CopyProperty : RowDragMode.CopyApplication) :
                    (isCustomProperty ? RowDragMode.MoveProperty : RowDragMode.MoveApplication);
                return (isRowDropCopy.current ? 'copy' : 'move')
                    + ' ' + dragType + ' "' + rowNode.data.name + '"';
            }

            rowNode.data.dragMode = isRowDropCopy.current ?
                (isCustomProperty ? RowDragMode.CopySelectedProperties : RowDragMode.CopySelectedApplications) :
                (isCustomProperty ? RowDragMode.MoveSelectedProperties : RowDragMode.MoveSelectedApplications);
            return (isRowDropCopy.current ? 'copy' : 'move')
                + ' the (' + selectedNodeCount + ') selected ' + dragType + 's';
        }

        return '';
    }, [gridApi?.api]);

    const rowNodeIdGetter = useCallback((data: any) => {
        return data.id;
    }, []);

    const agGridOptions = useMemo(() => _.merge(
        {
            columnDefs: [
                {
                    field: '',
                    rowDrag: true,
                    checkboxSelection: true,
                    headerCheckboxSelection: true,
                    headerCheckboxSelectionFilteredOnly: true,
                    suppressMovable: true,
                    unSortIcon: true,
                    width: 75,
                    sortable: false,
                    suppressMenu: true,
                    rowDragText: getRowDragText,
                    cellStyle: { verticalAlign: 'middle' },
                },
                {
                    headerName: '',
                    headerTooltip: 'Summary view of the application',
                    field: 'name',
                    enableRowGroup: false,
                    flex: 1,
                    minWidth: 200,
                    resizable: true,
                    suppressMovable: true,
                    sort: 'asc',
                    unSortIcon: true,
                    cellRenderer: 'applicationCardCellRenderer',
                    cellStyle: { verticalAlign: 'middle' },
                },
            ],
            immutableData: true,
            localeText: AG_GRID_LOCALE_EN,
            frameworkComponents: {
                applicationCardCellRenderer: ApplicationCardCellRenderer,
            },
            getRowNodeId: rowNodeIdGetter,
            rowGroupPanelShow: 'never',
            debug: !!process.env.NEXT_PUBLIC_DEBUG_FLAG,
            valueCache: true,
            debounceVerticalScrollbar: true,
            rowBuffer: 25,
            rowHeight: 74,
            suppressContextMenu: true,
            suppressScrollOnNewData: true,
            suppressRowClickSelection: true,
            suppressCellSelection: false,
            enableCellTextSelection: true
        },
        getDragDropGridConfig(inventoryApplicationProps)
    ), [ApplicationCardCellRenderer, getRowDragText, inventoryApplicationProps, rowNodeIdGetter]);

    /**
     * Update Application
     * @param item
     */
    const handleUpdateGroup = useCallback((item: NodeGroup) => {
        const updatedProject: ProjectContainer = new ProjectContainer(pProject.roProjectWithData);
        updatedProject.updateApp(item);
        pMutateProject(updatedProject, false);
        pEnableSave(true);
    }, [pEnableSave, pMutateProject, pProject.roProjectWithData]);

    /**
     * Update custom property
     * @param item
     */
    const handleUpdateCp = useCallback((item: string) => {
        log('[InventoryApplication] handleUpdateCp, item:', item, cpEditDialogOpen);
        if (cpEditDialogOpen && cpEditDialogOpen.name != item) {
            const updatedProject: ProjectContainer = new ProjectContainer(pProject.roProjectWithData);
            updatedProject.updateCustomPropertyValue(cpEditDialogOpen, item);
            pMutateProject(updatedProject, false);
            pEnableSave(true);
        }
    }, [cpEditDialogOpen, pEnableSave, pMutateProject, pProject.roProjectWithData]);

    /**
     * Given the custom property name (which is actually the key - example: 'C64026'), find in pProject.custom_node_props
     * the custom property and extract it's title (title is like 'Department' or 'Owner').
     * @param name  The key of the custom property
     * @returns title of the custom property
     */
    const getCustomPropertyTitle = useCallback((name: string): string => {
        let title: string = '';
        const cp: any | undefined = _.find(pProject.roProjectWithData.custom_node_props, { 'name': name });
        if (cp) {
            title = cp.title;
        }
        return title;
    }, [pProject.roProjectWithData.custom_node_props]);

    /**
     * The user made a selection in the application/custom property dropdown, update the panel to reflect the new context
     * @param event
     */
    const handleSelectChange = useCallback((event: any) => {
        if (event.target.value === 'manageCustomProperties') {
            event.stopPropagation();
            return;
        }
        setSelectedVal(event.target.value);
        setSelectedName(event.target.value === 'application' ? 'App' : getCustomPropertyTitle(event.target.value) || '');
        handleRowSelection(event.target.value, []);
    }, [getCustomPropertyTitle, handleRowSelection]);

    /**
     * Builds the drop-down at the top of the panel.
     * Drop-down will include 'Applications' and each custom property title, along with a link to open the manage custom
     * properties dialog.
     */
    const buildSelectControl = useCallback(() => {
        const infoIcon =
            <InformationTooltip
                tipIcon={<VcioIcon vcio="general-info-circle" iconColor={colors.blue_100} style={{ marginLeft: '5px', marginTop: '10px' }}/>}
            >
                <b>Move</b>
                <span style={{ fontStyle: 'italic' }}> Applications </span> or
                <span style={{ fontStyle: 'italic' }}> Custom Properties </span> into
                <span style={{ fontStyle: 'italic' }}> Compute Instances </span> or
                <span style={{ fontStyle: 'italic' }}> Move Groups </span>
                by dragging and dropping their rows into the appropriate grid.
                <br/><br/>
                <b>Copy</b>
                <span style={{ fontStyle: 'italic' }}> Applications </span> or
                <span style={{ fontStyle: 'italic' }}> Custom Properties </span> by holding down the
                <b> {isMacOs ? 'COMMAND' : 'CONTROL'}</b> key before dragging the rows into one of the other grids.
            </InformationTooltip>;

        // moves the menu below the select input
        const menuProps = {
            anchorOrigin: {
                vertical: 30,
                horizontal: 5
            },
            getContentAnchorEl: null,
            classes: {
                paper: classes.paper,
            }
        };

        const listItems = [];
        listItems.push(
            <StyledMenuItem key='applications' value='application' className={classes.menuItem}>
                <ListItemIcon className={classes.menuItemIcon}>
                    <VcioIcon vcio="migration-application" iconColor={colors.blue_gray_500}/>
                </ListItemIcon>
                <span className={classes.menuItemText} data-cy="inventoryPanelTitleApplication">
                    Applications
                    <span className={classes.menuItemTextCount}>
                        &nbsp;(<span data-cy="inventoryPanelTitleApplicationCount">{pProject.roProjectWithData.apps_count || 0}</span>)
                    </span>
                </span>
            </StyledMenuItem>
        );

        // Create a MenuItem for each custom property containing the title of the custom property and a count of how
        // many distinct values exist for the custom property across all devices.
        let countOfDistinctValues: number = 0;
        _.forEach(pProject.roProjectWithData.custom_node_props, (customNodeProp) => {
            countOfDistinctValues = customNodeProp.str_values ? customNodeProp.str_values.length : 0;
            listItems.push(
                <StyledMenuItem
                    key={customNodeProp.name}
                    value={customNodeProp.name}
                    className={classes.menuItem}
                >
                    <ListItemIcon className={classes.menuItemIcon}>
                        <VcioIcon vcio="general-tag-outline" iconColor={colors.blue_gray_500}/>
                    </ListItemIcon>
                    <span className={classes.menuItemText} data-cy={'inventoryPanelDrop' + customNodeProp.title}>
                        {customNodeProp.title} <span className={classes.menuItemTextCount}>({countOfDistinctValues})</span>
                    </span>
                </StyledMenuItem>
            );
        }
        );

        if (pShowManageCustomPropsDialog !== undefined) {
            // Should always have showManageCustomPropsDialog, just have to wrap with the check so onClick won't
            // complain about it being potentially undefined
            listItems.push(
                <StyledMenuItem
                    key='manageCustomProperties'
                    value='manageCustomProperties'
                    className={classes.menuItem}
                    onClick={pShowManageCustomPropsDialog}
                >
                    <ListItemIcon className={classes.menuItemIcon}>
                        <VcioIcon vcio="view-list" height={14} width={17.5} iconColor={colors.green_500}/>
                    </ListItemIcon>
                    <span className={classes.menuItemText} data-cy="manageCustomProperties">
                        Manage Custom Properties
                    </span>
                </StyledMenuItem>
            );
        }

        if (selectedVal !== 'application') {
            // A custom property is currently selected in the drop-down
            let foundCNP: CustomProperty | undefined = _.find(pProject.roProjectWithData.custom_node_props, { name: selectedVal });
            if (!foundCNP) {
                // This can happen in the following scenario:
                // User adds a new custom property and value, changes the drop-down to that new custom property,
                // Saves.  The backend converts the uuid we generated on the client-side for the 'name', to
                // a different string value.  We need to find the custom property by title, then use the new string
                // value of name in the drop-down.
                foundCNP = _.find(pProject.roProjectWithData.custom_node_props, { title: selectedName });
                if (foundCNP) {
                    setSelectedVal(foundCNP.name);
                } else {
                    setSelectedVal('application');
                }
            }
        }

        return (
            <>
                <FormControl>
                    <Select
                        disableUnderline
                        MenuProps={menuProps}
                        className={classes.dropdown}
                        value={selectedVal}
                        onChange={handleSelectChange}
                        data-cy='applicationsPanelSelectControl'
                    >
                        {listItems}
                    </Select>
                </FormControl>
                <Box component='span' style={{ marginTop: '12 px' }}>
                    {infoIcon}
                </Box>
            </>
        );
    }, [classes.dropdown, classes.menuItem, classes.menuItemIcon, classes.menuItemText, classes.menuItemTextCount, classes.paper, handleSelectChange, pProject.roProjectWithData.apps_count, pProject.roProjectWithData.custom_node_props, pShowManageCustomPropsDialog, selectedName, selectedVal]);

    const selectControl = useMemo(() => buildSelectControl(), [buildSelectControl]);

    const handleGridReady = useCallback((params: GridReadyEvent) => {
        setGridApi({
            api: params.api,
            columnApi: params.columnApi
        });
        if (pSetGridReadyOptions) {
            pSetGridReadyOptions(params);
        }
    }, [pSetGridReadyOptions]);

    return (
        <>
            <Box
                onContextMenu={(event: React.MouseEvent<HTMLElement>) => {
                    event.preventDefault();  // If context menu is showing, suppress right mouse click
                }}
                data-cy='inventory-application'
            >
                <ListPanel
                    type={InventoryType.Application}
                    items={pProject.roProjectWithData.apps || []}
                    selectedName={selectedName}
                    maxBodyHeight={maxBodyHeight}
                    selectedRows={selectedRows}
                    selectedRowChange={handleRowSelection}
                    agGridOptions={agGridOptions}
                    project={pProject}
                    mutateProject={pMutateProject}
                    enableSave={pEnableSave}
                    setGridReadyOptions={handleGridReady}
                    contextCallback={handleContextClick}
                    optionalBtn={calculateBtn}
                    headerControl={selectControl}
                    selectedVal={selectedVal}
                />
                <InventoryContextMenu
                    type={InventoryType.Application}
                    contextCallback={inventoryContextCallback}
                    selectedRows={selectedRows?.length > 0 ? selectedRows : clickedRow}
                    mouseX={mousePosition.mouseX}
                    mouseY={mousePosition.mouseY}
                />
            </Box>
            {
                groupEditDialogOpen !== null &&
                <GroupEditDialog
                    open={true}
                    item={groupEditDialogOpen}
                    title="Edit Application"
                    onClose={() => setGroupEditDialogOpen(null)}
                    onUpdateClick={handleUpdateGroup}
                />
            }
            {
                cpEditDialogOpen !== null &&
                <GeneralStringEditDialog
                    open={true}
                    item={cpEditDialogOpen?.name || ''}
                    title="Edit Custom Property Value"
                    onClose={() => setCpEditDialogOpen(null)}
                    onUpdateClick={handleUpdateCp}
                />
            }
        </>
    );
};
