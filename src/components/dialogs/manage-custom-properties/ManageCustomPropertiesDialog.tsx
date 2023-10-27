import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, makeStyles, } from '@material-ui/core';
import { CellClickedEvent, ColDef, ColGroupDef, GridApi } from 'ag-grid-community';
import 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';
import _ from 'lodash';
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CustomProperty, CustomPropertyType, ProjectContainer } from '../../../models/data';
import { colors, GrayButton, theme } from '../../../styles';
import { VcioIcon } from '../../controls';
import { CustomPropertyIconCellRenderer } from './CustomPropertyIconCellRenderer';
import { NoRowsOverlayRenderer } from './NoRowsOverlayRenderer';
import { TrashIconCellRenderer } from './TrashIconCellRenderer';


const useStyles = makeStyles({
    dialog: {
        minWidth: '558px',
        borderRadius: 4,
        backgroundColor: colors.white_100,
        shadowColor: 'rgba(15, 45, 104, 0.39)',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowRadius: 13,
        shadowOpacity: 1,
        borderStyle: 'solid',
        borderWidth: 0,
        borderColor: colors.blue_gray_300,
    },
    closeBtn: {
        padding: theme.spacing(4, 3, 1.5, 0),
        marginLeft: 'auto',
        height: '16px',
        width: '20px'
    },
    dialogContent: {
        paddingLeft: theme.spacing(10)
    },
    titleDiv: {
        // titleDiv is used to override the styles for the root of the DialogTitle
        padding: theme.spacing(3, 0, 0, 10),
        fontFamily: 'Muli',
        fontSize: '22px',
        fontWeight: 300,
        fontStyle: 'normal',
        fontStretch: 'normal',
        lineHeight: 1.4,
        letterSpacing: 'normal',
        color: colors.black_90
    },
    dialogActions: {
        justifyContent: 'flex-start',
        padding: theme.spacing(5, 0, 10, 10),
        '&.MuiDialogActions-spacing > :last-child': {
            // Slides the last button to the right, and styles it per the mock
            marginLeft: 'auto',
            marginRight: '40px',
            color: colors.black_90,
            borderRadius: '4px',
            borderStyle: 'solid',
            borderWidth: '1px',
            borderColor: colors.blue_gray_200,
            backgroundColor: colors.white_100
        }
    },
    tableRow: {
        '&:hover': {
            backgroundColor: colors.blue_gray_100   // What color should this be?
        }
    },
    propertyTitleCell: {
        '&:hover': {
            borderRadius: '4px',
            borderStyle: 'solid !important',
            borderWidth: '1px',
            borderColor: colors.blue_gray_300 + '!important',
            backgroundColor: colors.white_100
        }
    },
    errorText: {
        fontFamily: 'Open Sans',
        fontSize: '13px',
        fontWeight: 'normal',
        fontStretch: 'normal',
        fontStyle: 'normal',
        lineHeight: 1.38,
        letterSpacing: 'normal',
        color: colors.red_500
    }
});

interface DialogProps {
    open: boolean;
    handleDialogClose: Function;
    project: ProjectContainer;
    mutateProject: Function;
}

export const ManageCustomPropertiesDialog: React.FunctionComponent<DialogProps> = (props: DialogProps) => {

    const classes = useStyles();
    const duplicateTitleMessage: string = 'is already used as a custom property name.';

    type DialogCustomProperty = {
        name: string;           // The id - yea, bad variables names, but keeping consistent with the API
        title: string;          // The displayed name
        deviceCount: number;
        deviceCountMessage: string;
        deleted: boolean;
        duplicate: boolean;
    };

    const [changed, setChanged] = useState<boolean>(false);
    const [gridApi, setGridApi] = useState<GridApi | undefined>();

    /**
     * Populates an array of DialogCustomProperty
     */
    const getCustomProperties = (): DialogCustomProperty[] => {

        const cps: DialogCustomProperty[] = [];
        let count: number = 0;

        _.forEach(props.project.roProjectWithData.custom_node_props, (customNodeProp: CustomProperty) => {
            if (customNodeProp.name && customNodeProp.title) {
                const dialogCustomProperty: DialogCustomProperty = {
                    name: customNodeProp.name,
                    title: customNodeProp.title,
                    deviceCount: 0,
                    deviceCountMessage: '',
                    deleted: false,
                    duplicate: false
                };
                count = 0;
                _.forEach(props.project.roProjectWithData.nodes, node => {
                    if (node.custom_props) {
                        if (node.custom_props[customNodeProp.name]) {
                            count++;
                        }
                    }
                });
                dialogCustomProperty.deviceCount = count;
                dialogCustomProperty.deviceCountMessage = `set for ${count} devices`;
                cps.push(dialogCustomProperty);
            }
        });
        return cps;
    };

    // customProperties are from the project at the time of render
    // We can compare our table of custom properties from the dialog to customProperties to see if anything changed.
    const customProperties: DialogCustomProperty[] = getCustomProperties();

    const handleClose = () => {
        // Cancel any pending edits
        if (gridApi) {
            gridApi.stopEditing(true);
        }
        props.handleDialogClose(false);     // false indicates that no changes were applied
    };

    const addDialogCustomProperty = () => {

        // @ts-ignore
        gridApi.applyTransaction({
            add: [{
                name: uuidv4(),
                title: '',
                deviceCount: 0,
                deviceCountMessage: 'set for 0 devices',
                deleted: false,
                duplicate: false
            }]
        });
        // @ts-ignore
        const indexOfNewRow = gridApi.getModel().rowsToDisplay.length - 1;
        // @ts-ignore
        gridApi.startEditingCell({
            rowIndex: indexOfNewRow,
            colKey: 'propertyTitle'
        });

    };

    const ToggleDeleteDialogCustomProperty = (event: CellClickedEvent) => {

        event.node.setData({
            name: event.node.data.name,
            title: event.node.data.title,
            deviceCount: event.node.data.deviceCount,
            deviceCountMessage: !event.node.data.deleted ?
                `will be removed from ${event.node.data.deviceCount} devices and cannot be undone after saving` :
                `set for ${event.node.data.deviceCount} devices`,
            deleted: !event.node.data.deleted,
            duplicate: event.node.data.duplicate
        });

        event.api.resetRowHeights();
        if (!changed) {
            setChanged(true);
        }
    };

    const onGridReady = (params: any) => {
        setGridApi(params.api);
    };

    /**
     * Was this custom property added by the user on the dialog?  Or, did it already exist on the project?
     * @param name
     */
    const isNewCustomProperty = (name: string) => {
        const dialogCustomProperty: DialogCustomProperty | undefined = _.find(customProperties, { 'name': name });
        return !dialogCustomProperty;
    };

    const applyChanges = () => {
        // Complete any pending edits
        if (gridApi) {
            gridApi.stopEditing(false);
        }

        let isNew: boolean;
        let existingStrValues: string[];
        const updatedProject: ProjectContainer = new ProjectContainer(props.project.roProjectWithData);

        // We delete all the custom_node_props from the updatedProject, then we rebuild the custom_node_props
        // from the dialogs data.
        updatedProject.updateCustomNodeProps([]);

        // Rebuild our array of custom properties

        // @ts-ignore
        gridApi.forEachNode((rowNode: any) => {
            isNew = isNewCustomProperty(rowNode.data.name);

            // Do not keep new custom properties added in the dialog that were given a duplicate title
            // Note that an existing custom property that was given a duplicate title will be flagged as a duplicate, but
            // it's title was not changed.  We want to keep the old title.
            const isNewDuplicate: boolean = rowNode.data.duplicate && isNew;

            if (!rowNode.data.deleted && !isNewDuplicate) {
                if (!isNew) {
                    // Grab str_values from the projects custom_node_props
                    let foundExistingCnp: CustomProperty | undefined = _.find(props.project.roProjectWithData.custom_node_props, { name: rowNode.data.name });
                    if (foundExistingCnp) {
                        existingStrValues = foundExistingCnp.str_values ? foundExistingCnp.str_values : [];
                    }
                }
                updatedProject.addNewCustomNodeProp(new CustomProperty({
                    name: rowNode.data.name,        // id
                    title: rowNode.data.title,      // displayed name
                    type: CustomPropertyType.String,
                    str_values: isNew ? [] : existingStrValues
                }));
            }

        }); // end gridApi.forEachNode

        props.mutateProject(updatedProject, false);
        setChanged(false);
        props.handleDialogClose(true);      // true indicates that some changes were applied
    };

    const getTitles = (api: any): string[] => {
        if (!api) {
            return [];
        }

        const rowData: any[] = [];
        // @ts-ignore
        api.forEachNode(node => rowData.push(node.data));
        return rowData.map(row => row.title.trim().toLowerCase());
    };

    const isDuplicateTitle = (title: string, api: any): boolean => {
        if (!title) {
            return false;
        }
        const newTitle = title.trim().toLowerCase();
        const allTitles: string[] = getTitles(api);
        return allTitles.indexOf(newTitle) !== -1;
    };

    /**
     * Defines the columns for the ag-grid table of custom properties
     */
    const getColumnDefs = (): (ColDef | ColGroupDef)[] => {
        return [
            {
                headerName: '',
                colId: 'customPropertyIconColumn',
                cellRenderer: 'customPropertyIconCellRenderer',
                rowDrag: true,
                width: 90
            },
            {
                headerName: '',
                field: 'name',
                hide: true
            },
            {
                headerName: '',
                field: 'title',
                editable: true,
                colId: 'propertyTitle',
                cellClass: classes.propertyTitleCell,
                width: 175,
                valueSetter: params => {
                    if (params.oldValue.toLowerCase() !== params.newValue.toLowerCase()) {
                        if (isDuplicateTitle(params.newValue, params.api)) {
                            params.node.setData({
                                name: params.node.data.name,
                                title: params.newValue,
                                deviceCount: params.node.data.deviceCount,
                                deviceCountMessage: `'${params.newValue}' ${duplicateTitleMessage}`,
                                deleted: params.node.data.deleted,
                                duplicate: true
                            });
                            if (params.api) {
                                // @ts-ignore
                                params.api.resetRowHeights();
                            }
                            return true;
                        }
                    }

                    // Not a duplicate
                    params.node.setData({
                        name: params.node.data.name,
                        title: params.newValue,
                        deviceCount: params.node.data.deviceCount,
                        deviceCountMessage: params.node.data.deleted ?
                            `will be removed from ${params.node.data.deviceCount} devices and cannot be undone after saving` :
                            `set for ${params.node.data.deviceCount} devices`,
                        deleted: params.node.data.deleted,
                        duplicate: false
                    });
                    if (gridApi) {
                        // @ts-ignore
                        gridApi.resetRowHeights();
                    }
                    setChanged(true);
                    return true;
                }
            },
            {
                headerName: '',
                field: 'deviceCount',
                hide: true
            },
            {
                headerName: '',
                field: 'deviceCountMessage',
                colId: 'deviceCountMessageColumn',
                width: 280,
                wrapText: true,
                cellStyle: params => {
                    return (params.data.deleted || params.data.duplicate) ?
                        { lineHeight: '18px', color: colors.red_600 } :
                        { lineHeight: '40px', color: colors.black_70 };
                }
            },
            {
                headerName: '',
                colId: 'deleteIconColumn',
                cellRenderer: 'trashIconCellRenderer',
                onCellClicked: ToggleDeleteDialogCustomProperty,
                width: 30
            }
        ];
    };

    /**
     * Gets the core content for the dialog, either an ag-grid table of custom properties or a no data message
     */
    const getDialogContent = () => {

        return (
            <>
                <div
                    className="ag-theme-alpine"
                    style={{
                        height: 300,
                        width: 600
                    }}
                >
                    <AgGridReact
                        columnDefs={getColumnDefs()}
                        rowData={customProperties}
                        headerHeight={0}        // suppress header
                        suppressMovableColumns={true}
                        rowDragManaged={true}
                        frameworkComponents={{
                            trashIconCellRenderer: TrashIconCellRenderer,
                            customPropertyIconCellRenderer: CustomPropertyIconCellRenderer,
                            noRowsOverlayRenderer: NoRowsOverlayRenderer
                        }}
                        noRowsOverlayComponent='noRowsOverlayRenderer'
                        onGridReady={onGridReady}
                        singleClickEdit={true}
                        stopEditingWhenGridLosesFocus={true}
                        suppressContextMenu={true}
                    />
                </div>
            </>
        );

    }; // getDialogContent


    return (
        <>
            <Dialog
                data-cy="MCPDialog"
                open={props.open}
                classes={{ paper: classes.dialog }}
                maxWidth={false}
                onClose={handleClose}
                onEnter={() => {
                    setChanged(false);
                }}
                style={{ maxHeight: '100%' }}
            >
                <IconButton
                    data-cy="closeMCPBtn"
                    className={classes.closeBtn}
                    onClick={handleClose}
                >
                    <VcioIcon vcio="general-cross" iconColor={colors.blue_gray_500} height={16}/>
                </IconButton>
                <DialogTitle
                    data-cy="MCPDialogTitle"
                    id="mcp-dialog-title"
                    classes={{ root: classes.titleDiv }}
                >
                    Manage Custom Properties
                </DialogTitle>
                <DialogContent className={classes.dialogContent}>
                    {getDialogContent()}
                </DialogContent>
                <DialogActions className={classes.dialogActions}>
                    <Button
                        data-cy="applyMCPBtn"
                        type="submit"
                        autoFocus
                        disabled={!changed}
                        onClick={applyChanges}
                    >
                        Apply
                    </Button>
                    <GrayButton
                        data-cy="cancelMCPBtn"
                        onClick={handleClose}
                        size="small"
                    >
                        Cancel
                    </GrayButton>
                    <Button
                        size="small"
                        data-cy="addCustomProperties"
                        variant="outlined"
                        startIcon={<VcioIcon className='vcio-general-plus-circle' iconColor={colors.green_500}/>}
                        onClick={addDialogCustomProperty}
                    >
                        Add Custom Property
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

