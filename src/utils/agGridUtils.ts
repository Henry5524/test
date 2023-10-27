import { getMinTextWidth } from '@utils';
import { Column, ColumnApi, GridApi, RowDragEvent, RowNode } from 'ag-grid-community';
import _ from 'lodash';

export function getDragDropGridConfig(props: any) {
    return {
        enableRangeSelection: false,
        onRowDragEnd: (dragEvent: RowDragEvent) => {
            if (props.setDndData && props.okToDropIntoRow) {
                const sourceGridRowNode: RowNode = dragEvent.node;
                const targetGridRowNode: RowNode = dragEvent.overNode;

                if (props.okToDropIntoRow(sourceGridRowNode, targetGridRowNode)) {
                    // remove the dragged over styling from this target grid row
                    const targetGridRowNodeData: any = targetGridRowNode.data;
                    targetGridRowNodeData.isBeingDraggedOver = false;
                    targetGridRowNode.setData(targetGridRowNodeData);

                    const sourceDragMode = sourceGridRowNode.group ? sourceGridRowNode.groupData.dragMode : sourceGridRowNode.data.dragMode;
                    sourceGridRowNode.group ? delete sourceGridRowNode.groupData.dragMode : delete sourceGridRowNode.data.dragMode;

                    const targetGridType = props.gridType;

                    const dndData: DragAndDropData = {
                        sourceDragMode,
                        // @ts-ignore
                        sourceGridApi: sourceGridRowNode.gridApi,
                        // @ts-ignore
                        sourceGridColumnApi: sourceGridRowNode.columnApi,
                        sourceGridDraggedRowNode: sourceGridRowNode,
                        sourceGridDraggedRowNodeData: sourceGridRowNode.data,
                        // @ts-ignore
                        sourceGridSelectedRowNodes: sourceGridRowNode.gridApi.getSelectedNodes(),
                        // @ts-ignore
                        sourceGridSelectedRowNodesData: sourceGridRowNode.gridApi.getSelectedRows(),
                        // @ts-ignore
                        sourceGridAllLeafChildrenNodes: sourceGridRowNode.group ? sourceGridRowNode.allLeafChildren : [],
                        targetGridType,
                        // @ts-ignore
                        targetGridApi: targetGridRowNode.gridApi,
                        // @ts-ignore
                        targetGridColumnApi: targetGridRowNode.columnApi,
                        targetGridDroppedIntoRowNode: targetGridRowNode,
                        targetGridDroppedIntoRowNodeData: targetGridRowNode.data,
                        // @ts-ignore
                        targetGridSelectedRowNodes: targetGridRowNode.gridApi.getSelectedNodes(),
                        // @ts-ignore
                        targetGridSelectedRowNodesData: targetGridRowNode.gridApi.getSelectedRows()
                    };

                    props.setDndData(dndData);
                } else {
                    // remove the dragged over styling for all rows
                    dragEvent.api.forEachNode((rowNode: RowNode) => {
                        const rowNodeData = rowNode.data;
                        if (rowNodeData) {
                            rowNodeData.isBeingDraggedOver = false;
                            rowNode.setData(rowNodeData);
                        }
                    });
                }
            }
        },
        onRowDragMove: (dragEvent: RowDragEvent) => {
            if (props.setDndData && props.okToDropIntoRow) {

                const sourceGridRowNode: RowNode = dragEvent.node;
                const targetGridRowNode: RowNode = dragEvent.overNode;

                if (props.okToDropIntoRow(sourceGridRowNode, targetGridRowNode)) {

                    // remove the dragged over styling for all rows
                    dragEvent.api.forEachNode((rowNode: RowNode) => {
                        const rowNodeData = rowNode.data;
                        if (rowNodeData) {
                            rowNodeData.isBeingDraggedOver = false;
                            rowNode.setData(rowNodeData);
                        }
                    });

                    // add the dragged over styling for this row
                    const targetGridRowNodeData: any = targetGridRowNode.data;
                    targetGridRowNodeData.isBeingDraggedOver = true;
                    targetGridRowNode.setData(targetGridRowNodeData);
                } else {
                    // remove the dragged over styling for all rows
                    dragEvent.api.forEachNode((rowNode: RowNode) => {
                        const rowNodeData = rowNode.data;
                        if (rowNodeData) {
                            rowNodeData.isBeingDraggedOver = false;
                            rowNode.setData(rowNodeData);
                        }
                    });
                }
            }
        },
        onRowDragLeave: (dragEvent: RowDragEvent) => {
            if (props.setDndData && props.okToDropIntoRow) {

                const sourceGridRowNode: RowNode = dragEvent.node;
                const targetGridRowNode: RowNode = dragEvent.overNode;

                if (props.okToDropIntoRow(sourceGridRowNode, targetGridRowNode)) {

                    // remove the dragged over styling for all rows
                    dragEvent.api.forEachNode((rowNode: RowNode) => {
                        const rowNodeData = rowNode.data;
                        if (rowNodeData) {
                            rowNodeData.isBeingDraggedOver = false;
                            rowNode.setData(rowNodeData);
                        }
                    });
                } else {
                    // remove the dragged over styling for all rows
                    dragEvent.api.forEachNode((rowNode: RowNode) => {
                        const rowNodeData = rowNode.data;
                        if (rowNodeData) {
                            rowNodeData.isBeingDraggedOver = false;
                            rowNode.setData(rowNodeData);
                        }
                    });
                }
            }
        },
        rowClassRules: {
            // eslint-disable-next-line func-names
            'drag-row-over': function (params: any) {
                // returning true will apply this class to the row
                const rowNode: RowNode = params.node;
                return rowNode.data && rowNode.data.isBeingDraggedOver;
            },
        },
        rowSelection: 'multiple',
        statusBar: {
            statusPanels: [
                {
                    statusPanel: 'agSelectedRowCountComponent',
                    align: 'left',
                },
                {
                    statusPanel: 'agFilteredRowCountComponent',
                    align: 'left'
                },
                {
                    statusPanel: 'agTotalRowCountComponent',
                    align: 'right'
                },
            ],
        },
        suppressMoveWhenRowDragging: true,
    };
}

export enum RowDragMode {
    CopyDevice = 0,
    CopySelectedDevice = 1,
    CopySelectedDevices = 2,
    CopyDevicesWithinGroup = 3,
    CopyDevicesWithinUnassignedGroup = 4,
    CopyApplication = 5,
    CopySelectedApplication = 6,
    CopySelectedApplications = 7,
    CopyMoveGroup = 8,
    CopySelectedMoveGroup = 9,
    CopySelectedMoveGroups = 10,
    CopyProperty = 11,
    CopySelectedProperty = 12,
    CopySelectedProperties = 13,

    MoveDevice = 14,
    MoveSelectedDevice = 15,
    MoveSelectedDevices = 16,
    MoveDevicesWithinGroup = 17,
    MoveDevicesWithinUnassignedGroup = 18,
    MoveApplication = 19,
    MoveSelectedApplication = 20,
    MoveSelectedApplications = 21,
    MoveMoveGroup = 22,
    MoveSelectedMoveGroup = 23,
    MoveSelectedMoveGroups = 24,
    MoveProperty = 25,
    MoveSelectedProperty = 26,
    MoveSelectedProperties = 27,
}

export const RowDragModeText = {
    [RowDragMode.CopyDevice]: 'copy device',
    [RowDragMode.CopySelectedDevice]: 'copy selected device',
    [RowDragMode.CopySelectedDevices]: 'copy selected devices',
    [RowDragMode.CopyDevicesWithinGroup]: 'copy devices within group',
    [RowDragMode.CopyDevicesWithinUnassignedGroup]: 'copy devices Within unassigned group',
    [RowDragMode.CopyApplication]: 'copy application',
    [RowDragMode.CopySelectedApplication]: 'copy selected application',
    [RowDragMode.CopySelectedApplications]: 'copy selected applications',
    [RowDragMode.CopyMoveGroup]: 'copy move group',
    [RowDragMode.CopySelectedMoveGroup]: 'copy selected move group',
    [RowDragMode.CopySelectedMoveGroups]: 'copy selected move groups',
    [RowDragMode.CopyProperty]: 'copy property',
    [RowDragMode.CopySelectedProperty]: 'copy selected property',
    [RowDragMode.CopySelectedProperties]: 'copy selected properties',

    [RowDragMode.MoveDevice]: 'move device',
    [RowDragMode.MoveSelectedDevice]: 'move selected device',
    [RowDragMode.MoveSelectedDevices]: 'move selected devices',
    [RowDragMode.MoveDevicesWithinGroup]: 'move devices within group',
    [RowDragMode.MoveDevicesWithinUnassignedGroup]: 'move devices Within unassigned group',
    [RowDragMode.MoveApplication]: 'move application',
    [RowDragMode.MoveSelectedApplication]: 'move selected application',
    [RowDragMode.MoveSelectedApplications]: 'move selected applications',
    [RowDragMode.MoveMoveGroup]: 'move move group',
    [RowDragMode.MoveSelectedMoveGroup]: 'move selected move group',
    [RowDragMode.MoveSelectedMoveGroups]: 'move selected move groups',
    [RowDragMode.MoveProperty]: 'move property',
    [RowDragMode.MoveSelectedProperty]: 'move selected property',
    [RowDragMode.MoveSelectedProperties]: 'move selected properties',
};

/**
 * @param sourceDragMode - the dragging mode of the source grid row
 * @param sourceGridApi - api access to the source grid where the row nodes are dragged from
 * @param sourceGridColumnApi - column api access to the source grid where the row nodes are dragged from
 * @param sourceGridDraggedRowNode - the row node being dragged from the source grid
 * @param sourceGridDraggedRowNodeData - the data of the row node being dragged from the source grid
 * @param sourceGridSelectedRowNodes - the row nodes that are selected at the time the row is being dragged from the source grid
 * @param sourceGridSelectedRowNodesData - the data of the row nodes that are selected at the time the row is being dragged from the source grid
 * @param sourceGridAllLeafChildrenNodes - the row nodes that are leaf children of the grouped row that is being dragged from the source grid
 * @param targetGridType - type of target grid where the row nodes are being dropped into
 * @param targetGridApi - api access to the target grid where the row nodes are being dropped into
 * @param targetGridColumnApi - column api access to the source grid where the row nodes are dragged from
 * @param targetGridDroppedIntoRowNode - the row node being dropped onto within the target grid
 * @param targetGridDroppedIntoRowNodeData - the data of the row node being dropped onto within the target grid
 * @param targetGridSelectedRowNodes - the target grid row nodes that are selected at the time the row is being dropped onto the target grid
 * @param targetGridSelectedRowNodesData - the data of the target grid row nodes that are selected at the time the row is being dropped onto the target grid
 */
export interface DragAndDropData {
    sourceDragMode: RowDragMode;
    sourceGridApi: GridApi;
    sourceGridColumnApi: ColumnApi;
    sourceGridDraggedRowNode: RowNode;
    sourceGridDraggedRowNodeData: any;
    sourceGridSelectedRowNodes: [RowNode];
    sourceGridSelectedRowNodesData: [any];
    sourceGridAllLeafChildrenNodes: [RowNode];
    targetGridType: string;
    targetGridApi: GridApi;
    targetGridColumnApi: ColumnApi;
    targetGridDroppedIntoRowNode: RowNode;
    targetGridDroppedIntoRowNodeData: any;
    targetGridSelectedRowNodes: [RowNode];
    targetGridSelectedRowNodesData: [any];
}

/**
 * Set grid header height based on largest header and then autoadjust column widths.
 * Currently only supported for FirstDataRenderedEvent
 *
 * @param api
 * @param columnApi
 */
export const doHeaderHeightAndColumnWidthAdjustment = (api?: GridApi, columnApi?: ColumnApi) => {
    if (!api || !columnApi) {
        return;
    }
    // @ts-ignore
    const gridDiv = api.gridCore.eGridDiv;
    const padding = 20;

    // First autosize columns and find out if the table will fit in the view without further adjustment
    columnApi.autoSizeAllColumns();
    let fullTableWidth = _.reduce(columnApi.getAllColumns(), (acc, column: Column) => {
        return acc + (column.isVisible() ? column.getActualWidth() : 0);
    }, 0);
    if (fullTableWidth < gridDiv.parentNode.clientWidth) {
        fullTableWidth = (gridDiv.parentNode.clientWidth - fullTableWidth - 40) / 2;
    }

    // Now autosize without considering the table headers
    columnApi.autoSizeAllColumns(true);
    const columnHeaderTexts = [
        ...gridDiv.querySelectorAll('.ag-header-cell-text'),
    ];
    // Get minimum wrapped size for each table header
    _.forEach(columnApi.getAllColumns(), (column: Column) => {
        if (column.isVisible()) {
            const minTextWidth = getMinTextWidth(column.getColDef().headerName || '', gridDiv.parentNode);
            if (minTextWidth + 90 > column.getActualWidth()) {
                columnApi.setColumnWidth(column, minTextWidth + 90);
            }
        }
    });
    // Wrap the table headers and set header height
    const clientHeights = columnHeaderTexts.map(
        headerText => headerText.clientHeight
    );
    api.setHeaderHeight(Math.max(...clientHeights) + padding);
};

/**
 * Calculate (left) margin needed to center table in parent div
 *
 * @param api
 * @param columnApi
 */
export const calcMarginToCenterTable = (api?: GridApi, columnApi?: ColumnApi): number => {
    if (!api || !columnApi) {
        return 0;
    }
    // @ts-ignore
    const gridDiv = api.gridCore.eGridDiv;
    // Adjust the table margin and width to be centered in the view
    const tableWidth = _.reduce(columnApi.getAllColumns(), (acc, column: Column) => {
        return acc + (column.isVisible() ? column.getActualWidth() : 0);
    }, 0);
    const newMargin = (gridDiv.parentNode.clientWidth - tableWidth - 40) / 2;
    return newMargin > 0 ? newMargin : 0;
};
