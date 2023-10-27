import { CircularProgress, Grid } from '@material-ui/core';
import Box from '@material-ui/core/Box';
import { downloadAndParseAndConvertToResults } from '@services';
import { GridOptions, GridReadyEvent, ICellRendererParams } from 'ag-grid-community';
import _ from 'lodash';
import React, { Component, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { CustomTable } from './CustomTable';
import { DataPanelColumn } from './DataPanelColumn';
import { InformationTooltip } from './InformationTooltip';

/**
 * Properties for the data panel
 *
 * projectName: name of the project
 * dataId: globally unique identifier for the dataset (e.g. consider caching)
 * data: {optional}predefined datasource (data and source properties are mutually exclusive)
 * source: {optional}csv or xls datasource (data and source properties are mutually exclusive)
 * dataFilter: {optional}function to be used to filter the data prior to display
 * totalResultsFn: {optional} function that gets updates for total result count
 * maxWidth: {optional} maximum width of the panel in pixels
 * onGridReady: {optional} callback for when grid is ready to show
 * agGridOptions: {optional} misc agGridOptions
 */
export interface DataPanelProps {
    projectName: string;
    dataId: string;             // Unique identifier for the dataset
    data?: {
        columnDefs: DataPanelColumn[];
        rows: object[];
    };
    source?: {
        name: string | undefined;
        url: string | undefined;
        xlsSheetNames?: string[];  // If specified, will only parse the specified xls sheets.  Otherwise will parse all sheets.
    };

    dataFilter?(columnDefs: DataPanelColumn[], rows: any[]): object[];

    totalResultsFn?(args: number): void;

    maxWidth?: number;
    suppressAutoHeight?: boolean;
    suppressCenterInDiv?: boolean;
    onGridReady?(event: GridReadyEvent): void;

    agGridOptions?: GridOptions;
}

/**
 * Render column with an InformationTooltip.  Define the column like this:
 *
 *                  headerComponent: 'tooltipColumnRenderer',
 *                  headerComponentParams : {
 *                      tooltipText: 'Hello, this is a tooltip!'
 *                  }
 */
class TooltipColumnRenderer extends Component {
    constructor(cellProps: any) {
        super(cellProps);
    }

    getReactContainerStyle() {
        return {
            width: '100%',
            height: '100%',
        };
    }

    render() {
        // @ts-ignore
        const { displayName, tooltipText } = this.props;
        return (
            <Grid container direction="row" alignItems="center">
                <Box pt={4}>{displayName}
                    <InformationTooltip>
                        {tooltipText}
                    </InformationTooltip>
                </Box>
            </Grid>
        );
    }
}

/**
 * Wrap comma delimited string
 */
export const WrapTextRenderer = ((params: ICellRendererParams) => {
    return params.value.split(',').join('<br/>');
});

/**
 * Basic table layout created from a spreadsheet/csv datasource
 *
 * @param tableProps
 * @constructor
 */
export const DataPanel: React.FunctionComponent<DataPanelProps> = (tableProps: DataPanelProps) => {
    const { data: remoteData } = useSWR(tableProps.source?.url ? `getDetails_${tableProps.dataId}` : null,
        () => {
            if (tableProps?.source?.url) {
                return downloadAndParseAndConvertToResults(tableProps.source.url, tableProps.maxWidth, tableProps.source.xlsSheetNames);
            }
            return new Promise<{
                columnDefs: DataPanelColumn[];
                rows: object[];
            }>((resolve, _reject) => {
                resolve({
                    columnDefs: [],
                    rows: []
                });
            });
        });
    const [finalResults, setFinalResults] = useState<{
        dataId: string;
        columnDefs: DataPanelColumn[];
        rows: object[];
    }>();

    const columnDefs: DataPanelColumn[] = useMemo(() => {
        if (!finalResults) {
            return [];
        }
        const defs = finalResults.columnDefs.map((column, _index): DataPanelColumn => {
            column.headerTooltip = column.headerName;
            return column;
        });
        _.forEach(defs, (columnDef: DataPanelColumn) => {
            if (columnDef.isCustomProperty) {
                columnDef.cellRenderer = WrapTextRenderer;
                columnDef.cellStyle = { paddingTop: '10px', lineHeight: '25px' };
            }
        });
        return defs;
    }, [finalResults]);

    const displayRows: object[] = useMemo(() => {
        if (!finalResults) {
            return [];
        }
        let showRows = finalResults.rows;
        if (tableProps.dataFilter) {
            showRows = tableProps.dataFilter(columnDefs, showRows);
        }
        return showRows;
    }, [finalResults, columnDefs, tableProps]);

    // Report total records found back to the parent, if requested
    useEffect(() => {
        setTimeout(() => {
            if (tableProps.totalResultsFn && displayRows) {
                tableProps.totalResultsFn(displayRows.length);
            }
        }, 0);
    }, [displayRows, tableProps]);

    const data = useMemo(() => {
        return {
            columns: columnDefs,
            rows: displayRows,
        };
    }, [columnDefs, displayRows]);

    // Default grid options
    const customTableOptions: GridOptions = useMemo(() => {
        const optns = {
            ensureDomOrder: true,
            enableCellTextSelection: true,
            // https://www.ag-grid.com/javascript-grid-context-menu/
            getContextMenuItems: () => {
                return ['copy'];
            },
            suppressContextMenu: false,
            domLayout: (!!tableProps.suppressAutoHeight || (displayRows.length > 50)) ? undefined : 'autoHeight',
            onGridReady: tableProps.onGridReady,
            frameworkComponents: {
                tooltipColumnRenderer: TooltipColumnRenderer
            },
            suppressPropertyNamesCheck: true
        };

        // Merge in tableProps table options
        _.merge(optns, tableProps.agGridOptions);
        return optns;
    }, [displayRows.length, tableProps.agGridOptions, tableProps.onGridReady, tableProps.suppressAutoHeight]);

    if ((tableProps.source?.name && tableProps.source?.url && !remoteData) && (!tableProps.data || (tableProps.data.columnDefs.length === 0))) {
        return (
            <CircularProgress/>
        );
    }

    if (!finalResults || tableProps.dataId !== finalResults.dataId) {
        if ((tableProps.source?.name && !tableProps.source?.url && !tableProps.data)) {
            return (
                <Box alignItems="center" justifyContent="center">No Data Found</Box>
            );
        }
        if (remoteData) {
            setFinalResults({ ...remoteData, dataId: tableProps.dataId });
        } else if (tableProps.data) {
            setFinalResults({ ...tableProps.data, dataId: tableProps.dataId });
        }
        return (
            <>
            </>
        );
    }

    return (
        <>
            {
                displayRows && columnDefs &&
                <CustomTable
                    data={data}
                    suppressCenterInDiv={tableProps.suppressCenterInDiv}
                    agGridOptions={customTableOptions}
                />
            }
        </>
    );

};
