import { CircularProgress, Grid } from '@material-ui/core';
import { GridOptions } from 'ag-grid-community';
import { ValueFormatterParams } from 'ag-grid-community/dist/lib/entities/colDef';
import _ from 'lodash';
import React, { useMemo } from 'react';
import { DataSheet, useProject } from '../../services';
import { theme } from '../../styles';
import { DataPanelColumn } from './DataPanelColumn';
import { DataPanelGroup, DataPanelToolbarProps } from './DataPanelGroup';

interface NetworkTableProps {
    projectId: string;
    dataId: string;
    ipPortsReduced: any;
    showCols?: string[];
    colLabels?: string[];
    rowGroupCols?: string[];
    aggrCols?: string[];
    maxWidth?: number;
    filterColumnName?: string;
    groupRenderProps?: {
        headerName: string;
        showRowGroup: boolean;
    };
    toolbarProps?: DataPanelToolbarProps;
    agGridOptions?: GridOptions;
    noBorder?: boolean;
    suppressAutoHeight?: boolean;
    suppressCenterInDiv?: boolean;
}

const rowFilter = (filterHeaderName: string, columns: DataPanelColumn[], rows: object[]) => {
    const column = _.find(columns, { 'headerName': filterHeaderName });
    if (!column || !column.field) {
        return rows;
    }
    return _.filter(rows, (row: any) => {
        // @ts-ignore
        return (row[column.field] || '').toString().toLowerCase().trim() === 'true';
    });
};

export const NetworkTable: React.FunctionComponent<NetworkTableProps> = (props) => {
    const { data: project, error } = useProject(props.projectId);

    const pivotData = useMemo(() => getResults(
        props.ipPortsReduced,
        props.showCols,
        props.colLabels || [],
        props.rowGroupCols || [],
        props.aggrCols || [],
        props.groupRenderProps), [props.ipPortsReduced, props.showCols, props.colLabels, props.rowGroupCols, props.aggrCols, props.groupRenderProps]
    );

    const toolbarProps = useMemo(() => {
        return {
            showFilter: true,
            showTotal: true,
            buttons: {
                generalDownloadBtn: true,
            }
            , ...props.toolbarProps
        };
    }, [props.toolbarProps]);

    const agGridOptions: GridOptions = useMemo(() => {
        return {
            defaultColDef: {
                sortable: true
            },
            suppressAggFuncInHeader: true,
            ...props.agGridOptions
        };
    }, [props.agGridOptions]);

    if (!project || !props.ipPortsReduced) {
        return (
            <CircularProgress/>
        );
    }

    return (
        <>
            {
                !error && pivotData &&
                <>
                    <Grid container style={{ marginBottom: theme.spacing(6) }}>
                        <DataPanelGroup
                            projectName={project.roProjectWithData.name || 'Error: No Project Name '}
                            toolbar={toolbarProps}
                            noBorder={props.noBorder}
                            tabs={
                                [
                                    {
                                        dataId: props.dataId,
                                        data: pivotData,
                                        dataFilter: props.filterColumnName ?
                                            () => rowFilter(props.filterColumnName || '', pivotData.columnDefs, pivotData.rows)
                                            : undefined,
                                        agGridOptions,
                                        suppressAutoHeight: props.suppressAutoHeight,
                                        suppressCenterInDiv: props.suppressCenterInDiv
                                    },
                                ]
                            }
                        />
                    </Grid>
                </>
            }
        </>
    );
};

const numberRenderer = (params: ValueFormatterParams): string => {
    if (!params.value || isNaN(Number(params.value))) {
        return '';
    }
    const value: number = Number(params.value).valueOf();
    if (value < 1 && value > -1) {
        return value.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
    }
    if (Number.isInteger(value)) {
        return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getResults = (
    sheets: DataSheet[],
    showCols: string[] | undefined,
    colLabels: string[],
    rowGroupCols: string[],
    aggCols: string [],
    groupRenderProps?: {
        headerName: string;
    }): {
    dataId: string;
    columnDefs: DataPanelColumn[];
    rows: object[];
} => {
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
            // create column for each of the data elements
            _.forEach(sheet.headers, headerName => {
                const field: string = 'field' + columnNbr;

                let valueFormatter: ((params: ValueFormatterParams) => string) | string;
                let type;
                if (headerName.includes('Port')) {
                    // Hack for Ports which are not numeric (but otherwise look like numeric) and may also have trailing '.0' in the raw data file (shrug)
                    valueFormatter = (parms: ValueFormatterParams) => {
                        if (parms.value) {
                            return parms.value.toString().split('.')[0].trim();
                        }
                        return '';
                    };
                    type = 'rightAligned';
                } else if (
                    referenceRow
                    && referenceRow.length > columnNbr
                    && (
                        (
                            !_.isEmpty(referenceRow[columnNbr])
                            && (!isNaN(Number(referenceRow[columnNbr])))
                        )
                    )
                ) {
                    // Numeric column formatter
                    valueFormatter = (rowValues: ValueFormatterParams) => numberRenderer(rowValues);
                    type = 'numericColumn';
                } else {
                    // Column is not numeric (maybe not auto-recognized as numeric?)
                    valueFormatter = (parms: ValueFormatterParams) => {
                        return _.isEmpty((parms.value || '').toString().trim()) ? '' : parms.value.toString();
                    };
                    type = undefined;
                }
                let headerCol: number = sheet.headers.findIndex((val) => val === headerName);
                // If showCols are set, update the header index to control showing only non-hidden
                if (showCols && showCols.length > 0) {
                    headerCol = showCols.findIndex((val) => val === headerName);
                }
                columns.push({
                    valueFormatter,
                    type,
                    headerName: headerCol === -1 || !colLabels[headerCol]
                        ? headerName.replace(/_/g, '_\u200b').replace(/->/, '->\u200b').replace(/<-/, '<-\u200b')
                        : colLabels[headerCol].replace(/_/g, '_\u200b').replace(/->/, '->\u200b').replace(/<-/, '<-\u200b'),
                    origHeaderName: headerName,
                    field,
                    hide: headerCol === -1,
                    rowGroup: rowGroupCols.includes(headerName),
                    enableValue: aggCols.includes(headerName),
                    // Aggregated columns
                    aggFunc: !aggCols.includes(headerName) ? undefined : (params) => {
                        let sumValue = 0;
                        params.values.forEach((value) => {
                            if (!isNaN(Number(value))) {
                                const rowValue: number = Number(value).valueOf();
                                sumValue += rowValue;
                            }
                        });
                        return sumValue;
                    },
                });
                columnNbr++;
            });
            if (groupRenderProps) {
                columns.push(groupRenderProps);
            }
        }
        // Sort into the showCols order
        if (showCols) {
            columns.sort((col1, col2) => {
                const pos1 = [...showCols].indexOf(col1.origHeaderName || '');
                const pos2 = [...showCols].indexOf(col2.origHeaderName || '');
                return pos1 - pos2;
            });
        }
        // Convert data to standard row format
        _.forEach(sheet.values, row => {
            let columnNbr = 0;
            const rowValue = {};
            _.forEach(row, column => {
                // @ts-ignore
                rowValue[`field${columnNbr}`] = _.isEmpty(column) ? '' : column;
                columnNbr++;
            });
            rows.push(rowValue);
        });
    });
    let displayRows;
    if (groupRenderProps?.headerName) {
        const groupByNdx = _.findIndex(columns, { 'headerName': groupRenderProps.headerName });
        if (groupByNdx) {
            displayRows = _.orderBy(rows, ['field' + (groupByNdx + 1)]);
        } else {
            displayRows = rows;
        }
    } else {
        displayRows = rows;
    }
    return ({
        dataId: 'pivot_table_data',
        columnDefs: columns,
        rows: displayRows
    });
};

