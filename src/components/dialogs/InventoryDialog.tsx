import { Box, Dialog, DialogContent, DialogTitle, IconButton, Paper, PaperProps, TextField } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { ColDef, ColGroupDef, RowClickedEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import React, { Component } from 'react';
import Draggable from 'react-draggable';
import { ProjectContainer } from '../../models/data';
import { colors } from '../../styles';
import { VcioIcon } from '../controls/VcioIcon';
import { ApplicationCard } from '../list-cards';
import { CustomPropertyIconCellRenderer } from './manage-custom-properties/CustomPropertyIconCellRenderer';
import { TrashIconCellRenderer } from './manage-custom-properties/TrashIconCellRenderer';

interface InventoryDialogProps {
    type: 'application' | 'moveGroup' | undefined;
    handleDialogSelection: Function;
    handleDialogCancel: Function;
    project: ProjectContainer;
    open: boolean;
}

const useStyles = makeStyles(theme => (
    {
        root: {
            margin: 0,
            padding: theme.spacing(2),
        },
        closeButton: {
            position: 'absolute',
            right: theme.spacing(1),
            top: theme.spacing(1),
            color: theme.palette.grey[500],
        },
    })
);

/**
 * Draggable dialog handler
 *
 * @param props
 * @constructor
 */
const PaperComponent = (props: PaperProps) => {
    return (
        <Draggable handle="#draggable-dialog-title" cancel={'[class*="MuiDialogContent-root"]'}>
            <Paper {...props} />
        </Draggable>
    );
};

/**
 * Inventory dialog for choosing projects or move groups
 *
 * @param props
 * @constructor
 */
export const InventoryDialog: React.FunctionComponent<InventoryDialogProps> = (props: InventoryDialogProps) => {
    const classes = useStyles();

    const handleClose = () => {
        props.handleDialogCancel();
    };

    const handleClick = (event: RowClickedEvent) => {
        props.handleDialogSelection(event.data.id);
    };
    const items = props.project && props.type === 'application' ? props.project.roProjectWithData.apps : props.project.roProjectWithData.move_groups;

    const getColumnDefs = (): (ColDef | ColGroupDef)[] => {
        return [
            {
                headerName: 'Name',
                field: 'name',
                sortable: true,
                unSortIcon: true,
                cellRenderer: 'fullWidthCellRenderer'
            }
        ];
    };

    // Obtain the gridApi handle
    let gridApi: any;
    const onGridReady = (params: any) => {
        gridApi = params.api;
        gridApi.sizeColumnsToFit();
    };

    // Apply filter
    const onFilterTextBoxChanged = (event: any) => {
        gridApi.setQuickFilter(event.target.value);
    };

    /**
     * Custom renderer for table rows
     */
    class FullWidthCellRenderer extends Component {
        constructor(callProps: any) {
            super(callProps);
        }

        getReactContainerStyle() {
            return {
                display: 'flex',
                height: '100%',
            };
        }

        render() {
            // @ts-ignore
            return <ApplicationCard item={this.props.node.data} context={this.props.context}/>;
        }
    };

    return (
        <>
            {
                props.project && (props.type === 'application' ? props.project.roProjectWithData.apps : props.project.roProjectWithData.move_groups) &&
                <Dialog
                    onClose={handleClose}
                    open={props.open}
                    maxWidth={false}
                    style={{ width: '100%', height: '800px' }}
                    PaperComponent={PaperComponent}
                    aria-labelledby="draggable-dialog-title"
                >
                    <DialogTitle style={{ cursor: 'move' }} id="draggable-dialog-title">Select {props.type === 'application' ? 'Application' : 'Move Group'}
                        <IconButton aria-label="close" className={classes.closeButton} onClick={handleClose}>
                            <VcioIcon vcio="general-cross" iconColor={colors.blue_gray_500}/>
                        </IconButton>
                    </DialogTitle>
                    <DialogContent>
                        <Box mb={2}>
                            <TextField label='Filter...' data-cy="selectAppMoveGroupFilter" onInput={onFilterTextBoxChanged} variant='outlined'/>
                        </Box>
                        <Box
                            className="ag-theme-alpine"
                            style={{
                                height: 300,
                                width: 600
                            }}
                        >
                            <AgGridReact
                                columnDefs={getColumnDefs()}
                                rowData={items}
                                suppressMovableColumns={true}
                                context={{
                                    project: {
                                        move_groups: props.project.roProjectWithData.move_groups
                                    }
                                }}
                                defaultColDef={{
                                    suppressMenu: true
                                }}
                                rowDragManaged={true}
                                frameworkComponents={{
                                    trashIconCellRenderer: TrashIconCellRenderer,
                                    customPropertyIconCellRenderer: CustomPropertyIconCellRenderer,
                                    fullWidthCellRenderer: FullWidthCellRenderer
                                }}
                                onRowClicked={handleClick}
                                onGridReady={onGridReady}
                                isFullWidthCell={() => true}
                                fullWidthCellRenderer='fullWidthCellRenderer'
                                suppressContextMenu={true}
                            />
                        </Box>
                    </DialogContent>
                </Dialog>
            }
        </>
    );
};
