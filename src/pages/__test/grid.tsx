import { Box, CircularProgress, Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { ColDef, FirstDataRenderedEvent, GridOptions, ValueFormatterParams } from 'ag-grid-community';
import 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';
import _ from 'lodash';
import { useRouter } from 'next/router';
import React from 'react';
import useSWR from 'swr';
import { DataPanelColumn } from '../../components/controls/DataPanelColumn';
import { downloadAndParse } from '../../services';
import { AG_GRID_LOCALE_EN, doHeaderHeightAndColumnWidthAdjustment } from '../../utils';

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

const onFirstDataRendered = (event: FirstDataRenderedEvent) => {
    doHeaderHeightAndColumnWidthAdjustment(event.api, event.columnApi);
};

// const onColumnResized = (event: ColumnResizedEvent) => {
//     headerHeightSetter(event);
// };

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
        height: '100%',
        overflow: 'hidden'
    }
}));

// Restrict the number of columns
const maxCols: number = 5;

const tableProps: {
    data: {
        rows: object[];
        columns: DataPanelColumn[];
    };
    maxWidth?: number;
    maxBodyHeight?: number;
    pageSize?: number;
    agGridOptions?: GridOptions;
} = {
    data: {
        rows: [],
        columns: []
    },
    maxWidth: undefined,
    maxBodyHeight: undefined,
    pageSize: undefined,
    agGridOptions: undefined
};

// Set up default grid options
const customTableOptions: GridOptions = {
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
    },
    localeText: AG_GRID_LOCALE_EN,
    suppressColumnVirtualisation: true
};

const GridTestPage = () => {
    // const appContext = useContext(AppContext);
    const classes = useStyles();
    const router = useRouter();
    // const [winWidth, winHeight] = useWindowSize();
    // const [spacerWidth] = useState(0);
    // const [gridApi] = useState<{
    //     api: GridApi;
    //     columnApi: ColumnApi;
    // }>();
    const { data: testData } = useSWR('gridTestData', () => {
        return getResults(`${router.basePath}/test1.csv`);
    });

    // useEffect(() => {
    // fill out any available space to ensure there are no gaps
    // if (gridApi && spacerWidth > 0) {
    //     gridApi.sizeColumnsToFit();
    // }
    // }, [spacerWidth, gridApi]);

    // useEffect(() => {
    //     log(winWidth);
    //     log(winHeight);
    // }, [winWidth, winHeight]);

    if (!testData) {
        return (
            <>
                <CircularProgress/>
            </>
        );
    }

    tableProps.data.rows = testData.rows;
    tableProps.data.columns = testData.columns;

    /**
     * Copy column definitions and make changes as required
     */
    let columnDefs: ColDef[] = tableProps.data.columns.map((column, _index): ColDef => {
        column.headerTooltip = column.headerName;
        column.headerName = column.headerName?.replace(/_/g, '_\u200b').replace(/->/, '->\u200b').replace(/<-/, '<-\u200b');
        return column as ColDef;
    });

    if (maxCols) {
        columnDefs = _.slice(columnDefs, 0, maxCols);
    }

    // const onGridReady = (event: GridReadyEvent) => {
    //     setGridApi({
    //         api: event.api,
    //         columnApi: event.columnApi
    //     });
    // };
    // const handleGridSizeChanged = (params: {
    //     gridsApi: GridApi;
    //     gridsColumnApi: ColumnApi;
    //     clientWidth: number;
    // }) => {
    //     if (!params.gridsApi || !params.gridsColumnApi) {
    //         return;
    //     }
    //     // get the current grid parent div width
    //     const gridWidth = params.clientWidth;
    //
    //     params.gridsColumnApi.autoSizeAllColumns(true);
    //
    //     const padding = 20;
    //     // @ts-ignore
    //     const height = headerHeightGetter(params.gridsApi.gridCore.eGridDiv) + padding;
    //     params.gridsApi.setHeaderHeight(height);
    //
    //     // keep track of which columns to hide/show
    //     const columnsToShow = [];
    //     const columnsToHide = [];
    //
    //     // iterate over all columns (visible or not) and work out
    //     // now many columns can fit (based on their minWidth)
    //     let totalColsWidth = 0;
    //     const allColumns = params.gridsColumnApi.getAllColumns();
    //     for (let i = 0; i < allColumns.length; i++) {
    //         const column = allColumns[i];
    //         totalColsWidth += column.getActualWidth();
    //         if (totalColsWidth > gridWidth) {
    //             columnsToHide.push(column.getColId());
    //         } else {
    //             columnsToShow.push(column.getColId());
    //         }
    //     }
    //
    //     params.gridsColumnApi.setColumnsVisible(columnsToShow, true);
    //     // params.columnApi.setColumnsVisible(columnsToHide, false);
    //
    //     if (totalColsWidth + 30 < gridWidth) {
    //         const newSpacerWidth = totalColsWidth < gridWidth ? (gridWidth - totalColsWidth) / 2 - 10 : 0;
    //         if (newSpacerWidth > 0) {
    //             params.gridsApi.sizeColumnsToFit();
    //         }
    //         setSpacerWidth(newSpacerWidth);
    //     }
    // };

    // Merge options together.  First the default options, then the options requested by user and finally options that must be processed locally first
    _.merge(customTableOptions, tableProps.agGridOptions, {
        onFirstDataRendered,
        // onColumnResized,
        // onGridReady,
        // onGridSizeChanged: doGridSizeChanged
    });

    const leftMargin = 0;

    return (
        <>
            <Grid container direction="row" style={{ width: '100%', height: '100%' }}>
                <Grid xs item>
                    <Box className={classes.gridContainer}>
                        <Box className={classes.gridContainerGrid} ml={leftMargin + 'px'}>
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

const getResults = (filepath: string) => {
    return new Promise<{
        columns: DataPanelColumn[];
        rows: object[];
    }>((resolve, _reject) => {
        downloadAndParse(filepath)
            .then((sheets) => {
                const columns: DataPanelColumn[] = [];
                const rows: object[] = [];
                _.forEach(sheets, sheet => {
                    if (_.isEmpty(columns)) {
                        let columnNbr = 0;
                        let referenceRow: object[] = [];
                        if (sheet.values.length > 0) {
                            // eslint-disable-next-line prefer-destructuring
                            referenceRow = sheet.values[0];
                        }
                        _.forEach(sheet.headers, headerName => {
                            const field = 'field' + columnNbr;
                            let valueFormatter: any | undefined;
                            let type: string | undefined = '';
                            if (referenceRow && referenceRow.length > columnNbr && _.isNumber(referenceRow[columnNbr])) {
                                valueFormatter = (params: ValueFormatterParams) => {
                                    const value: number = Number(params.value).valueOf();
                                    if (isNaN(value)) {
                                        type = undefined;
                                        return params.value;
                                    }
                                    type = 'numeric';
                                    if (value < 1 && value > -1) {
                                        return value.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
                                    }
                                    if (Number.isInteger(value)) {
                                        return value.toLocaleString();
                                    }
                                    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                };
                            }
                            columns.push({
                                type,
                                headerName: headerName.replace(/_/g, '_\u200b')
                                    .replace(/->/, '->\u200b').replace(/<-/, '<-\u200b'),  // Zero width space added to enable word wrapping
                                field,
                                valueFormatter
                            });
                            columnNbr++;
                        });
                    }
                    _.forEach(sheet.values, row => {
                        let columnNbr = 0;
                        const rowValue = {};
                        _.forEach(row, column => {
                            // @ts-ignore
                            rowValue[`field${columnNbr}`] = column;
                            columnNbr++;
                        });
                        rows.push(rowValue);
                    });
                });
                resolve({
                    columns,
                    rows
                });
            });

    });

};

export default GridTestPage;
