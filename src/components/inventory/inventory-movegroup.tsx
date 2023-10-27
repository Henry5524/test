import { Box, Button, Grid, Tooltip } from '@material-ui/core';
import { useWindowHeight } from '@react-hook/window-size';
import { ColumnApi, GridApi, GridReadyEvent, ICellRendererParams } from 'ag-grid-community';
import { IRowDragItem } from 'ag-grid-community/dist/lib/rendering/row/rowDragComp';
import _ from 'lodash';
import { useSnackbar } from 'notistack';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppContext } from '../../context';
import { MoveGroup, NetworkNode, NodeGroup, ProjectContainer } from '../../models';
import { Api } from '../../services';
import { colors } from '../../styles';
import { AG_GRID_LOCALE_EN, getDragDropGridConfig, InventoryType, RowDragMode, ShowToast } from '../../utils';
import { isCalculating } from '../../utils/common-project';
import { VcioIcon } from '../controls';
import { ContextAction, ContextActions, InventoryContextMenu } from '../controls/InventoryContextMenu';
import { GroupEditDialog } from '../dialogs';
import { ListPanel, MoveGroupCard } from '../index';

const initialMousePosition = {
    mouseX: null,
    mouseY: null,
};

interface InventoryMoveGroupProps {
    rowSelectionCallback?: Function;
    moveGroupsSelected: NodeGroup[];
    project: ProjectContainer;
    mutateProject: Function;
    enableSave: Function;
    // eslint-disable-next-line react/no-unused-prop-types
    gridType: 'device' | 'application' | 'movegroup';
    setGridReadyOptions?: any;
    // this gets passed along via the props into a utility function
    // eslint-disable-next-line react/no-unused-prop-types
    setDndData: Function;
    // this gets passed along via the props into a utility function
    // eslint-disable-next-line react/no-unused-prop-types
    okToDropIntoRow: Function;
    contextCallback?: Function;
    calculationCallback?: Function;
    projectHasUnsavedChanges?: boolean;
}

/**
 * Inventory...MoveGroups Subpanel (grid and toolbar)
 * @constructor
 */
export const InventoryMoveGroup: React.FunctionComponent<InventoryMoveGroupProps> = (props: InventoryMoveGroupProps) => {
    const {
        project: pProject, calculationCallback: pCalculationCallback, contextCallback: pContextCallback,
        rowSelectionCallback: pRowSelectionCallback, projectHasUnsavedChanges: pProjectHasUnsavedChanges,
        mutateProject: pMutateProject, enableSave: pEnableSave, moveGroupsSelected: pMoveGroupsSelected,
        setGridReadyOptions: pSetGridReadyOptions
    } = props;
    const windowHeight = useWindowHeight();
    const maxBodyHeight = windowHeight - 350;
    const appContext = useContext(AppContext);
    const { enqueueSnackbar } = useSnackbar();

    const [gridApi, setGridApi] = useState<{
        api: GridApi;
        columnApi: ColumnApi;
    }>();

    // Context menu management (right mouse)
    const [mousePosition, setMousePosition] = useState<{
        mouseX: null | number;
        mouseY: null | number;
    }>(initialMousePosition);

    const isRowDropCopy = useRef(false);
    // Run once and clean up later
    useEffect(() => {
        const keydownListener = (event: KeyboardEvent) => {
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

    const [selectedRows, setSelectedRows] = useState<NetworkNode[]>([]);
    const [clickedRow, setClickedRow] = useState<any[]>([]);

    const [groupEditDialogOpen, setGroupEditDialogOpen] = useState<NodeGroup | null>(null);

    const startCalculation = useCallback((ids?: string[]) => {
        Api.calcMg(pProject.roProjectWithData.id, ids).then(() => {
            if (pCalculationCallback) {
                pCalculationCallback();
            }
        }).catch(err => {
            ShowToast(`Failed to start calculation, error: ${err && err.statusText ? err.statusText : 'Unknown'}`, appContext, enqueueSnackbar, 'error');
        });
    }, [appContext, enqueueSnackbar, pProject.roProjectWithData.id, pCalculationCallback]);

    const inventoryContextCallback = useCallback((action: ContextAction) => {
        setMousePosition(initialMousePosition);
        const sr = selectedRows?.length > 0 ? selectedRows : clickedRow;
        if (action === ContextActions.CalculateDependencies) {
            // Go ahead and handle calculation request since we have the startCalculation function
            startCalculation(sr.map((data: any) => data.id));
            return;
        }
        if (action === ContextActions.EditItem && sr?.length == 1) {
            setGroupEditDialogOpen(sr[0]);
            return;
        }

        // Pass other requests back to Inventory to be handled there
        if (pContextCallback) {
            pContextCallback(action, sr);
        }
    }, [clickedRow, pContextCallback, selectedRows, startCalculation]);

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
     * @param type
     * @param newSelectedRows
     */
    const handleRowSelection = useCallback((_type: string, newSelectedRows: NetworkNode[]) => {
        if (pRowSelectionCallback) {
            pRowSelectionCallback(newSelectedRows);
        }
        setMousePosition(initialMousePosition);
        setSelectedRows(newSelectedRows);
    }, [pRowSelectionCallback]);

    /**
     * Custom renderer for table rows
     */
    const MoveGroupCardCellRenderer = useCallback((params: ICellRendererParams) => {

        /*
            Inside this CellRenderer:
                props - refers to the components properties.  But, cannot really use props here.
                    The value of props within this CellRenderer seems frozen to the first time
                    InventoryApplication is rendered.  If the project subsequently changes in a
                    different render of InventoryApplication, this CellRenderer will still see
                    the project as it was in the first render.  Thus, we need to use context
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
                <MoveGroupCard item={params.node.data} context={params.context}/>
            </Box>
        );
    }, []);

    const calcBtnLabel: string = useMemo(() => {
        if (selectedRows?.length > 0) {
            return `Calculate for ${selectedRows.length} Move Group(s)`;
        }
        if (pProject.roProjectWithData.move_groups?.length === 0) {
            // if there are no move groups created yet and calculation is ran, the BE will create these move groups automatically
            // easy, medium, hard
            return 'Create Groups by Complexity';
        }
        return 'Calculate All Move Groups';
    }, [pProject.roProjectWithData.move_groups?.length, selectedRows.length]);

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
        return pProject.roProjectWithData.apps_count === 0;
    }, [pProject, pProjectHasUnsavedChanges]);

    const calcBtnTooltipText = useMemo(() => {
        if (shouldDisableCalculateBtn()) {
            return 'The project must be saved in order to start calculation';
        }
        return 'Start calculation';
    }, [shouldDisableCalculateBtn]);

    /**
     * Calculation button handler
     */
    const handleCalculate = useCallback(() => {
        // TODO: figure out how to get the page mask to cover the inventory area quicker
        // immediately disable the calculate button
        if (calculateButtonRef?.current) {
            calculateButtonRef.current.disabled = true;
        }
        // TODO - saveProject is not synchronous, need to rethink doing an auto save.
        // saveProject()
        //     .then(() => {
        startCalculation(selectedRows.map((data: NetworkNode) => data.id));
        //     });
    }, [selectedRows, startCalculation]);

    /**
     * Calculate button to be shown in the table header
     */
    const calculateBtn = useMemo(() => (
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
                            data-cy="moveGroupCalculation"
                            startIcon={<VcioIcon vcio="migration-calculate" iconColor={colors.green_500} rem={0.7}/>}
                            onClick={handleCalculate}
                        >
                            {calcBtnLabel}
                        </Button>
                    </span>
                </Tooltip>
            </Grid>
        </Grid>
    ), [calcBtnLabel, calcBtnTooltipText, handleCalculate, shouldDisableCalculateBtn]);

    const getRowDragText = useCallback((params: IRowDragItem) => {
        const { rowNode } = params;

        if (rowNode) {
            const rowNodeSelected = rowNode.isSelected();
            const selectedNodeCount = gridApi?.api.getSelectedRows().length || 0;

            if (rowNodeSelected && selectedNodeCount === 1) {
                rowNode.data.dragMode = isRowDropCopy.current ? RowDragMode.CopySelectedMoveGroup : RowDragMode.MoveSelectedMoveGroup;
                return (isRowDropCopy.current ? 'copy' : 'move') + ' selected move group "'
                    + rowNode.data.name + '"';
            }
            if (!rowNodeSelected) {
                rowNode.data.dragMode = isRowDropCopy.current ? RowDragMode.CopyMoveGroup : RowDragMode.MoveMoveGroup;
                return (isRowDropCopy.current ? 'copy' : 'move') + ' move group "'
                    + rowNode.data.name + '"';
            }

            rowNode.data.dragMode = isRowDropCopy.current ? RowDragMode.CopySelectedMoveGroups : RowDragMode.MoveSelectedMoveGroups;
            return (isRowDropCopy.current ? 'copy' : 'move')
                + ' the (' + selectedNodeCount + ') selected move groups';
        }

        return '';
    }, [gridApi?.api]);

    const rowNodeIdGetter = useCallback((data: any) => {
        return data.id;
    }, []);

    const agGridOptions = useMemo(() => {
        return _.merge(
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
                        headerTooltip: 'Summary view of the move group',
                        field: 'name',
                        enableRowGroup: false,
                        flex: 1,
                        minWidth: 200,
                        resizable: true,
                        suppressMovable: true,
                        sort: 'asc',
                        unSortIcon: true,
                        cellRenderer: 'movegroupCardCellRenderer',
                        cellStyle: { verticalAlign: 'middle' },
                    },
                ],
                immutableData: true,
                localeText: AG_GRID_LOCALE_EN,
                frameworkComponents: {
                    movegroupCardCellRenderer: MoveGroupCardCellRenderer,
                },
                getRowNodeId: rowNodeIdGetter,
                rowGroupPanelShow: 'never',
                debug: !!process.env.NEXT_PUBLIC_DEBUG_FLAG,
                valueCache: true,
                debounceVerticalScrollbar: true,
                rowBuffer: 25,
                rowHeight: 54,
                suppressContextMenu: true,
                suppressScrollOnNewData: true,
                suppressRowClickSelection: true,
                suppressCellSelection: false,
                enableCellTextSelection: true,
                onGridReady: (parms: GridReadyEvent) => {
                    setGridApi({
                        api: parms.api,
                        columnApi: parms.columnApi
                    });
                }
            },
            getDragDropGridConfig(props)
        );
    }, [MoveGroupCardCellRenderer, getRowDragText, props, rowNodeIdGetter]);

    const handleUpdateGroup = useCallback((item: MoveGroup) => {
        const updatedProject: ProjectContainer = new ProjectContainer(pProject.roProjectWithData);
        updatedProject.updateMoveGroup(item);
        pMutateProject(updatedProject, false);
        pEnableSave(true);
    }, [pMutateProject, pEnableSave, pProject]);

    return (
        <>
            <Box
                onContextMenu={(event: React.MouseEvent<HTMLElement>) => {
                    event.preventDefault();  // If context menu is showing, suppress right mouse click
                }}
                data-cy='inventory-movegroup'
            >

                <ListPanel
                    type={InventoryType.MoveGroup}
                    items={pProject.roProjectWithData.move_groups}
                    maxBodyHeight={maxBodyHeight}
                    selectedRows={pMoveGroupsSelected}
                    selectedRowChange={handleRowSelection}
                    agGridOptions={agGridOptions}
                    project={pProject}
                    mutateProject={pMutateProject}
                    enableSave={pEnableSave}
                    setGridReadyOptions={pSetGridReadyOptions}
                    contextCallback={handleContextClick}
                    optionalBtn={calculateBtn}
                />
                <InventoryContextMenu
                    type={InventoryType.MoveGroup}
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
                    title="Edit Move Group"
                    onClose={() => setGroupEditDialogOpen(null)}
                    onUpdateClick={g => handleUpdateGroup(g as MoveGroup)}
                />
            }
        </>
    );
};
