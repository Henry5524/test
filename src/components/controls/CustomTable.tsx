import { Box, Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { ColDef, ColumnApi, FirstDataRenderedEvent, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community';
import 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';
import clsx from 'clsx';
import _ from 'lodash';
import React, { useCallback, useMemo, useState } from 'react';
import { AG_GRID_LOCALE_EN, calcMarginToCenterTable, doHeaderHeightAndColumnWidthAdjustment } from '../../utils';
import { DataPanelColumn } from './DataPanelColumn';

export interface CustomTableProps {
    data: {
        rows: object[];
        columns: DataPanelColumn[];
    };
    // maxWidth?: number;
    maxBodyHeight?: number;
    pageSize?: number;
    suppressCenterInDiv?: boolean;
    agGridOptions?: GridOptions;
}

const useStyles = makeStyles(_theme => ({
    gridContainer: {
        position: 'relative',
        height: '100%'
    },
    gridContainerButton: {
        position: 'absolute',
        zIndex: 15,
        right: 20,
        top: 2
    },
    gridContainerGrid: {
        zIndex: 10,
        height: '100%'
    }
}));

const HEADER_COMPONENT_PARAMS = {
    template:
        '<div class="ag-cell-label-container" role="presentation">' +
        '  <span ref="eMenu" class="ag-header-icon ag-header-cell-menu-button"></span>' +
        '  <div ref="eLabel" class="ag-header-cell-label" role="presentation">' +
        '    <span ref="eSortOrder" class="ag-header-icon ag-sort-order"></span>' +
        '    <span ref="eSortAsc" class="ag-header-icon ag-sort-ascending-icon"></span>' +
        '    <span ref="eSortDesc" class="ag-header-icon ag-sort-descending-icon"></span>' +
        '    <span ref="eSortNone" class="ag-header-icon ag-sort-none-icon"></span>' +
        '    <span ref="eText" class="ag-header-cell-text" role="columnheader" style="white-space: normal;"></span>' +
        '    <span ref="eFilter" class="ag-header-icon ag-filter-icon"></span>' +
        '  </div>' +
        '</div>',
};

/**
 * Basic table layout with toolbar row showing title and optional buttons plus grid with specified columns & data
 *
 * @param tableProps
 * @constructor
 */
export const CustomTable: React.FunctionComponent<CustomTableProps> = (tableProps: CustomTableProps) => {
    const classes = useStyles();
    const [leftMargin, setLeftMargin] = useState<number>(0);
    const [tableWidth, setTableWidth] = useState<number>();

    /**
     * First data rendered event process and propagate
     * @param event
     */
    const onFirstDataRendered = useCallback((event: FirstDataRenderedEvent) => {
        if (!tableProps.data) {
            return;
        }
        const handleGridSizing = (api: GridApi, columnApi: ColumnApi) => {
            if (!api || !columnApi) {
                return;
            }
            doHeaderHeightAndColumnWidthAdjustment(api, columnApi);
            // Optionally center the table in the parent div
            if (!tableProps.suppressCenterInDiv) {
                const newMargin = calcMarginToCenterTable(api, columnApi);
                if (newMargin !== leftMargin) {
                    setLeftMargin(newMargin);
                    if (newMargin > 0) {
                        // @ts-ignore
                        setTableWidth(api.gridCore.eGridDiv.parentNode.parentNode.parentNode.clientWidth - (newMargin * 2));
                    }
                }
            }
        };
        handleGridSizing(event.api, event.columnApi);
        if (tableProps.agGridOptions?.onFirstDataRendered) {
            tableProps.agGridOptions.onFirstDataRendered(event);
        }
    }, [tableProps.agGridOptions?.onFirstDataRendered, tableProps.suppressCenterInDiv]);

    const onGridReady = useCallback((event: GridReadyEvent) => {
        if (tableProps.agGridOptions?.onGridReady) {
            tableProps.agGridOptions.onGridReady(event);
        }
    }, [tableProps.data, tableProps.agGridOptions]);

    // Set up default grid options
    const customTableOptions: GridOptions = useMemo(() => {
        const opts = {
            defaultColDef: {
                sortable: true,
                resizable: true,
                editable: false,
                cellClass: 'vAlign',
                floatingFilter: false,
                enableRowGroup: false,
                enablePivot: false,
                enableValue: false,
                unSortIcon: true,
                checkboxSelection: false,
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
                menuTabs: ['filterMenuTab', 'columnsMenuTab', 'generalMenuTab'],
                headerComponentParams: HEADER_COMPONENT_PARAMS,
                comparator: (valueA: any, valueB: any, _nodeA: any, _nodeB: any, _isInverted: boolean) => {
                    const valueANum = Number(valueA);
                    const valueBNum = Number(valueB);
                    if (!isNaN(valueANum) && !isNaN(valueBNum)) {
                        return valueANum - valueBNum;
                    }
                    if (valueA == valueB) {
                        return 0;
                    }
                    return (valueA > valueB) ? 1 : -1;
                }
            },
            localeText: AG_GRID_LOCALE_EN,
        };
        if (!onGridReady || !onFirstDataRendered) {
            return opts;
        }
        // Merge options together.  First the default options, then the options requested by user and finally options that must be processed locally first
        _.merge(opts, tableProps.agGridOptions, {
            onFirstDataRendered,
            onGridReady,
        });
        return opts;
    }, [onFirstDataRendered, onGridReady, tableProps.agGridOptions]);

    /**
     * If the data was provided, copy column defs and add tool tips
     */
    const columnDefs: ColDef[] = useMemo(() => {
        return tableProps.data.columns.map((column, _index): ColDef => {
            column.headerTooltip = column.headerName;
            return column as ColDef;
        });
    }, [tableProps.data.columns]);

    return (
        <>
            <Grid container direction="row" spacing={1} justify='center' style={{ width: '100%', height: '100%' }}>
                <Grid xs item style={{ maxWidth: '100%' }}>
                    <Box
                        className={clsx(classes.gridContainer, 'ag-theme-alpine')}
                        style={{
                            height: customTableOptions.domLayout ? undefined : 600,
                            marginLeft: leftMargin + 'px',
                            width: tableWidth + 'px'
                        }}
                    >
                        <Box className={classes.gridContainerGrid}>
                            <AgGridReact
                                rowData={tableProps.data.rows}
                                columnDefs={columnDefs}
                                gridOptions={customTableOptions}
                            />
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        </>
    );
};
