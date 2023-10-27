import { AgGridColumnProps } from 'ag-grid-react';

export interface DataPanelColumn extends AgGridColumnProps{
    isCustomProperty?: boolean;
    origHeaderName?: string;
}
