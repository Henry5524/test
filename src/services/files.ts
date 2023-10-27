import { ValueFormatterParams } from 'ag-grid-community';
import _ from 'lodash';
import Papa from 'papaparse';
import XLSX from 'xlsx';
import { DataPanelColumn } from '../components/controls/DataPanelColumn';

import { config } from '../config';
import { log } from '../utils';
import { Api } from './api';

export function downloadFile(filename: string | undefined, urlValue: string | undefined, baseUrl?: string) {
    if (!filename || !urlValue) {
        log(`Unable to download file ${filename}: ${urlValue}`);
        return;
    }
    Api.axios({
        method: 'get',
        url: urlValue,
        baseURL: baseUrl || config.results_base_url,
        responseType: 'blob', // important
    }).then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
    });
}

/**
 * Common data format for results of parsing csv and xlsx files
 */
export interface DataSheet {
    page: string;
    headers: string[];
    values: any[];
}

/**
 * Download and parse the specified .csv OR .xls OR .xlsx file
 *
 * @param url
 * @param xlsSheetNames
 */
export async function downloadAndParse(url: string, xlsSheetNames?: string[]): Promise<DataSheet[]> {
    if (!url) {
        return new Promise((_resolve, reject) => {
            reject(new Error('Blank URL, unable to download'));
        });
    }
    if (url.endsWith('.csv')) {
        return downloadAndParseCSV(url);
    }
    if (url.endsWith('.xlsx') || url.endsWith('.xls')) {
        return downloadAndParseXls(url, xlsSheetNames);
    }
    return new Promise((_resolve, reject) => {
        reject(new Error('Unrecognized file type'));
    });
}

/**
 * Download specified .xls or .xlsx file and parse it into JSON array of sheets, headers and rows
 *
 * @param url
 * @param xlsSheetNames
 */
export async function downloadAndParseXls(url: string, xlsSheetNames?: string[]) {
    let result: Uint8Array = new Uint8Array();
    const response = await fetch(url);
    // @ts-ignore
    const reader = response.body.getReader();
    let chunk = await reader.read();

    while (!chunk.done) {
        const mergedArray = new Uint8Array(result.length + chunk.value.length);
        mergedArray.set(result);
        // @ts-ignore
        mergedArray.set(chunk.value, result.length);
        result = mergedArray;
        // get the next result
        // eslint-disable-next-line no-await-in-loop
        chunk = await reader.read();
    }
    const workbook = XLSX.read(result, { type: 'array' });
    const sheets: DataSheet[] = [];

    _.forEach(workbook.Sheets, (worksheet: XLSX.WorkSheet, key: string) => {
        if (!xlsSheetNames || (xlsSheetNames.includes(key))) {
            const json: string[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (json.length > 0) {
                sheets.push({
                    page: key,
                    headers: json[0],
                    values: json.slice(1)
                });
            }
        }
    });
    return sheets;
}

/**
 * Download specified .csv file and parse it into JSON array of (1 sheet), header and rows
 *
 * @param url
 */
export function downloadAndParseCSV(url: string): Promise<DataSheet[]> {
    return Api.axios.get(url, {
        baseURL: '',   // Base URL needs to be suppressed from the axios call
    }).then(response => {
        const results = Papa.parse(response.data, {
            skipEmptyLines: true
        });
        const sheets: DataSheet[] = [];
        if (!_.isEmpty(results)) {
            sheets.push({
                page: 'default',
                // @ts-ignore
                headers: results.data[0],
                values: results.data.slice(1)
            });
        }
        return sheets;
    });
}

/**
 * Downlaad specified results file and convert to rows/columns for display
 *
 * @param sourceUrl
 * @param maxWidth
 * @param xlsSheetNames
 */
export async function downloadAndParseAndConvertToResults(sourceUrl: string, maxWidth?: number, xlsSheetNames?: string[]): Promise<{
    columnDefs: DataPanelColumn[];
    rows: object[];
}> {
    return new Promise((resolve, _reject) => {
        downloadAndParse(config.results_base_url + sourceUrl, xlsSheetNames)
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
                            let type: string | undefined;
                            if (referenceRow && referenceRow.length > columnNbr && _.isNumber(referenceRow[columnNbr])) {
                                valueFormatter = (params: ValueFormatterParams) => {
                                    const value: number = Number(params.value).valueOf();
                                    if (isNaN(value)) {
                                        return params.value;
                                    }
                                    type = 'numeric';
                                    if (value < 1 && value > -1) {
                                        return value.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
                                    }
                                    if (Number.isInteger(value)) {
                                        return value.toLocaleString();
                                    }
                                    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                };
                            }
                            columns.push({
                                type,
                                headerName: headerName.replace(/_/g, '_\u200b').replace(/->/, '->\u200b').replace(/<-/, '<-\u200b'),  // Zero width space added to enable word wrapping
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
                    if (maxWidth) {
                        // Force last column to fill out the remaining space if it doesn't already have a flex
                        if (columns.length > 0 && !columns[columns.length - 1].flex) {
                            columns[columns.length - 1].flex = 1;
                        }

                    }
                });
                resolve({
                    columnDefs: columns,
                    rows
                });
            });
    });
};
