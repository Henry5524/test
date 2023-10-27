import { ICellRendererParams } from 'ag-grid-community';
import React from 'react';
import { colors } from '../../styles';
import { VcioIcon } from './VcioIcon';

interface DependencyCalculationColumnProps {
    calcCompleteFn: Function;
    calcCompleteFnParms: object;
}

/**
 * Column for rendering indicator for analysis complete for the row
 *
 * @param props
 * @constructor
 */
export const DependencyCalculationColumn = (props: DependencyCalculationColumnProps) => {
    const IconRenderer = ((params: ICellRendererParams) => {
        if (props.calcCompleteFn(params, props.calcCompleteFnParms)) {
            return <VcioIcon vcio="status-ok" iconColor={colors.light_green_600} width={25}/>;
        }
        return '';
    });

    return ({
        headerName: '',
        field: 'icon',
        sortable: false,
        filter: false,
        cellRendererFramework: IconRenderer,
        headerComponentParams: {
            template:
                '<div class="ag-cell-label-container" role="presentation">' +
                '  <span ref="eMenu" class="ag-header-icon ag-header-cell-menu-button"></span>' +
                '  <div ref="eLabel" class="ag-header-cell-label" role="presentation">' +
                '    <span ref="eSortOrder" class="ag-header-icon ag-sort-order" ></span>' +
                '    <span ref="eSortAsc" class="ag-header-icon ag-sort-ascending-icon" ></span>' +
                '    <span ref="eSortDesc" class="ag-header-icon ag-sort-descending-icon" ></span>' +
                '    <span ref="eSortNone" class="ag-header-icon ag-sort-none-icon" ></span>' +
                '    <span ref="eText" class="ag-header-cell-text" role="columnheader"></span>' +
                '    <span ref="eFilter" class="ag-header-icon ag-filter-icon"></span>' +
                '  </div>' +
                '</div>'
        },
        width: 60,
        maxWidth: 60
    });
};
