import { ImportInventoryConfigDialog, InventoryHeader, ManageCustomPropertiesDialog, Message, NetworksExclusionListDialog, Page, ProjectMessagesWrapper, SelectProjectDialog, VcioIcon } from '@components';
import { InventoryDialog } from '@components/dialogs/InventoryDialog';
import { Box, Button, CircularProgress, Divider as MenuDivider, Grid, ListItemIcon, ListItemText, makeStyles, Menu, MenuItem, Snackbar, withStyles } from '@material-ui/core';
import { MoreHoriz, MoreVert, VisibilityOff } from '@material-ui/icons';
import { Alert, ToggleButtonGroup } from '@material-ui/lab';
import { Api, downloadFile, useProject } from '@services';
import { colors, text, theme } from '@styles';
import { Divider, getDividerHandler, getEmptyNavigationMenu, log, setupNavMenu, ShowToast } from '@utils';
import { RowNode } from 'ag-grid-community';
import copy from 'copy-to-clipboard';
import _ from 'lodash';
import SingletonRouter, { Router, useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ContextAction, ContextActions } from '../../../../components/controls/InventoryContextMenu';
import { TooltipToggleButton } from '../../../../components/controls/TooltipToggleButton';
import { InventoryApplication } from '../../../../components/inventory/inventory-application';
import { InventoryDevice } from '../../../../components/inventory/inventory-device';
import { InventoryMoveGroup } from '../../../../components/inventory/inventory-movegroup';
import { AppContext } from '../../../../context';
import { useMigrationMenu } from '../../../../hooks';
import { MoveGroup, NetworkNode, NodeGroup, Project, ProjectContainer, Target } from '../../../../models';
import { DragAndDropData, RowDragMode } from '../../../../utils';
import { MaskTarget } from '../../../../utils/common-project';

const useStyles = makeStyles(() => ({
    container: {
        padding: theme.spacing(10)
    },
    toolbar: {
        ...text.primaryInterfaceTitleH1
    },
    panel: {
        minWidth: '300px',
    },
    divider: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '6px',
        backgroundColor: colors.blue_gray_100,
        color: colors.blue_gray_500,
        marginRight: 16,
        cursor: 'col-resize',
        pointerEvents: 'all',
        '& *': {
            pointerEvents: 'none',
        }
    }
}));

const StyledMenu = withStyles({
    paper: {
        borderRadius: 4,
        backgroundColor: colors.white_100,
        shadowColor: 'rgba(15, 45, 104, 0.15)',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowRadius: 15,
        shadowOpacity: 1,
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: colors.blue_gray_200,
    },
    list: {
        paddingTop: 0,
        paddingBottom: 0,
    }
})(Menu);

const StyledMenuItem = withStyles({
    root: {
        backgroundColor: colors.white_100,
        '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
            color: colors.black_90,
            fontSize: 14
        },
        '&:focus': {
            // backgroundColor: colors.white_100,
            '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
                color: colors.black_90,
                fontSize: 14
            },
        },

    },
})(MenuItem);

interface FilterProps {
    applicationSelected: NodeGroup[];
    moveGroupSelected: MoveGroup[];
}

const initialMidPanelWidth = 380;
const initialRightPanelWidth = 380;

export default function ProjectDetails() {

    const appContext = useContext(AppContext);
    const { enqueueSnackbar } = useSnackbar();
    const classes = useStyles();
    const { query: { projectId } } = useRouter();
    const [snackbar, setSnackbar] = useState<{ open: boolean; severity: any; text: string; ah?: boolean }>({ open: false, severity: 'info' as any, text: '' });
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);   // For the hamburger menu
    const [saveInProcessFor, setSaveInProcessFor] = useState({ requestId: '', projectId: '' });
    const [loading, setLoading] = useState(false);
    const [calculating, setCalculating] = useState(false);
    const [changed, setChanged] = useState(false);
    const [importConfigOpened, setImportConfigOpened] = useState(false);
    const [networksExclusionOpened, setNetworksExclusionOpened] = useState(false);
    const [selectProjectOpened, setSelectProjectOpened] = useState(false);
    const networkExclusionsButtonRef = useRef(null);
    const [openManageCustomPropsDialog, setOpenManageCustomPropsDialog] = useState(false);
    const [inventoryDialog, setInventoryDialog] = useState<{
        display: boolean;
        action: ContextAction | undefined;
        selectedRows: any[];
    }>(
        {
            display: false,
            action: undefined,
            selectedRows: [],
        });
    const [filter, setFilter] = useState<FilterProps>({
        applicationSelected: [],
        moveGroupSelected: []
    });

    // this controls the toggle buttons for filtering the devices grid when apps or
    // move groups are selected in their respective grids
    const [filterByGridType, setFilterByGridType] = useState('filter');

    // state for the 3 inventory grids
    const [deviceGridOptions, setDeviceGridOptions] = useState(null);
    const [applicationGridOptions, setApplicationGridOptions] = useState(null);
    const [moveGroupGridOptions, setMoveGroupGridOptions] = useState(null);

    useEffect(() => {
        // console.log('Inventory useEffect [deviceGridOptions, applicationGridOptions, moveGroupGridOptions]');

        // wait until all 3 inventory grid are loaded and ready and then apply grid row drop zones
        if (deviceGridOptions && applicationGridOptions && moveGroupGridOptions) {
            // console.log('Inventory useEffect [deviceGridOptions, applicationGridOptions, moveGroupGridOptions] applying dropzones');

            // get the row drops zones so that they can be added to the device grid
            // @ts-ignore
            const applicationGridDropZoneParamsForDeviceGrid = applicationGridOptions.api.getRowDropZoneParams({});
            // @ts-ignore
            const movegroupGridDropZoneParamsForDeviceGrid = moveGroupGridOptions.api.getRowDropZoneParams({});

            // remove any existing row drops zones from the device grid
            // @ts-ignore
            deviceGridOptions.api.removeRowDropZone(applicationGridDropZoneParamsForDeviceGrid);
            // @ts-ignore
            deviceGridOptions.api.removeRowDropZone(movegroupGridDropZoneParamsForDeviceGrid);

            // add the row drops zones to the device grid
            // @ts-ignore
            deviceGridOptions.api.addRowDropZone(applicationGridDropZoneParamsForDeviceGrid);
            // @ts-ignore
            deviceGridOptions.api.addRowDropZone(movegroupGridDropZoneParamsForDeviceGrid);

            // get the row drops zones so that they can be added to the application grid
            // @ts-ignore
            const deviceGridDropZoneParamsForApplicationGrid = deviceGridOptions.api.getRowDropZoneParams({});
            // @ts-ignore
            const movegroupGridDropZoneParamsForApplicationGrid = moveGroupGridOptions.api.getRowDropZoneParams({});

            // remove any existing row drops zones from the application grid
            // @ts-ignore
            applicationGridOptions.api.removeRowDropZone(deviceGridDropZoneParamsForApplicationGrid);
            // @ts-ignore
            applicationGridOptions.api.removeRowDropZone(movegroupGridDropZoneParamsForApplicationGrid);

            // add the row drops zones to the application grid
            // @ts-ignore
            applicationGridOptions.api.addRowDropZone(deviceGridDropZoneParamsForApplicationGrid);
            // @ts-ignore
            applicationGridOptions.api.addRowDropZone(movegroupGridDropZoneParamsForApplicationGrid);

            // get the row drops zones so that they can be added to the move group grid
            // @ts-ignore
            const deviceGridDropZoneParamsForMoveGroupGrid = deviceGridOptions.api.getRowDropZoneParams({});
            // @ts-ignore
            const applicationGridDropZoneParamsForMoveGroupGrid = applicationGridOptions.api.getRowDropZoneParams({});

            // remove any existing row drops zones from the move group grid
            // @ts-ignore
            moveGroupGridOptions.api.removeRowDropZone(deviceGridDropZoneParamsForMoveGroupGrid);
            // @ts-ignore
            moveGroupGridOptions.api.removeRowDropZone(applicationGridDropZoneParamsForMoveGroupGrid);

            // add the row drops zones to the move group grid
            // @ts-ignore
            moveGroupGridOptions.api.addRowDropZone(deviceGridDropZoneParamsForMoveGroupGrid);
            // @ts-ignore
            moveGroupGridOptions.api.addRowDropZone(applicationGridDropZoneParamsForMoveGroupGrid);
        }

    }, [deviceGridOptions, applicationGridOptions, moveGroupGridOptions]);

    // ag-grid will update the dndData upon a row drop between grids
    const [dndData, setDndData] = useState<DragAndDropData>();

    const { data: project, error, mutate: mutateProject } = useProject(projectId as string);

    const finishDrop = useCallback((updatedProject: ProjectContainer, errorMessages: string[], displayMessage: string) => {
        log('Finishing drop');
        // this causes a rerender, but the grids aren't maintaining selected state after rerender
        // log('Are project/updatedProject different - lodash?', !_.isEqual(project, updatedProject));
        mutateProject(updatedProject, false);

        // enable the Save project button
        setChanged(true);

        ShowToast(displayMessage, appContext, enqueueSnackbar);

        if (errorMessages.length > 0) {
            let errorMessage = 'Errors occurred while copying move group(s):\n';
            _.each(errorMessages, (msg) => {
                errorMessage = errorMessage + msg + '\n';
            });
            ShowToast(errorMessage, appContext, enqueueSnackbar, 'error');
        }

        setDndData(undefined);
    }, [appContext, enqueueSnackbar, mutateProject]);

    useEffect(() => {

        // console.log('Inventory: useEffect: [dndData]');
        // if the dndData changes due to a row drop between grids, then process it based on the sourceDragMode
        if (dndData && project) {
            const updatedProject: ProjectContainer = new ProjectContainer(project.roProjectWithData);
            // log('Inventory: useEffect: [dndData] processing row drop');
            let results: {
                updatedProject: ProjectContainer;
                errorMessages: string[];
                displayMessage: string;
            } | undefined;
            switch (dndData.sourceDragMode) {
                case RowDragMode.CopyDevice:
                case RowDragMode.CopySelectedDevice:
                    results = updatedProject.copyDevices(dndData, [dndData.sourceGridDraggedRowNodeData.id], false);
                    break;
                case RowDragMode.CopySelectedDevices:
                    results = updatedProject.copyDevices(dndData, dndData.sourceGridSelectedRowNodesData.map((rowData) => rowData.id), false);
                    break;
                case RowDragMode.CopyDevicesWithinGroup:
                case RowDragMode.CopyDevicesWithinUnassignedGroup:
                    results = updatedProject.copyDevices(dndData, dndData.sourceGridAllLeafChildrenNodes.map((rowNode: RowNode) => rowNode.data.id), false);
                    break;

                case RowDragMode.CopyApplication:
                case RowDragMode.CopySelectedApplication:
                    results = updatedProject.copyApplications(dndData, [dndData.sourceGridDraggedRowNodeData.id], false);
                    break;
                case RowDragMode.CopySelectedApplications:
                    results = updatedProject.copyApplications(dndData, dndData.sourceGridSelectedRowNodesData.map((rowData) => rowData.id), false);
                    break;

                case RowDragMode.CopyMoveGroup:
                case RowDragMode.CopySelectedMoveGroup:
                    results = updatedProject.copyMoveGroups(dndData, [dndData.sourceGridDraggedRowNodeData.id], false);
                    break;
                case RowDragMode.CopySelectedMoveGroups:
                    results = updatedProject.copyMoveGroups(dndData, dndData.sourceGridSelectedRowNodesData.map((rowData) => rowData.id), false);
                    break;

                case RowDragMode.CopyProperty:
                case RowDragMode.CopySelectedProperty:
                    results = updatedProject.copyProperties(dndData, [dndData.sourceGridDraggedRowNodeData.id], false);
                    break;
                case RowDragMode.CopySelectedProperties:
                    // can only copy one property value to a device
                    results = updatedProject.copyProperties(dndData, [dndData.sourceGridDraggedRowNodeData.id], false);
                    // copyProperties(dndData, dndData.sourceGridSelectedRowNodesData.map((rowData) => rowData.id));
                    break;

                case RowDragMode.MoveDevice:
                case RowDragMode.MoveSelectedDevice:
                    results = updatedProject.moveDevices(dndData, [dndData.sourceGridDraggedRowNodeData.id]);
                    break;
                case RowDragMode.MoveSelectedDevices:
                    results = updatedProject.moveDevices(dndData, dndData.sourceGridSelectedRowNodesData.map((rowData) => rowData.id));
                    break;
                case RowDragMode.MoveDevicesWithinGroup:
                case RowDragMode.MoveDevicesWithinUnassignedGroup:
                    results = updatedProject.moveDevices(dndData, dndData.sourceGridAllLeafChildrenNodes.map((rowNode: RowNode) => rowNode.data.id));
                    break;

                case RowDragMode.MoveApplication:
                case RowDragMode.MoveSelectedApplication:
                    results = updatedProject.moveApplications(dndData, [dndData.sourceGridDraggedRowNodeData.id]);
                    break;
                case RowDragMode.MoveSelectedApplications:
                    results = updatedProject.moveApplications(dndData, dndData.sourceGridSelectedRowNodesData.map((rowData) => rowData.id));
                    break;

                case RowDragMode.MoveMoveGroup:
                case RowDragMode.MoveSelectedMoveGroup:
                    results = updatedProject.moveMoveGroups(dndData, [dndData.sourceGridDraggedRowNodeData.id]);
                    break;
                case RowDragMode.MoveSelectedMoveGroups:
                    results = updatedProject.moveMoveGroups(dndData, dndData.sourceGridSelectedRowNodesData.map((rowData) => rowData.id));
                    break;

                case RowDragMode.MoveProperty:
                case RowDragMode.MoveSelectedProperty:
                    results = updatedProject.moveProperties(dndData, [dndData.sourceGridDraggedRowNodeData.id]);
                    break;
                case RowDragMode.MoveSelectedProperties:
                    results = updatedProject.moveProperties(dndData, dndData.sourceGridSelectedRowNodesData.map((rowData) => rowData.id));
                    break;

            }
            if (results) {
                finishDrop(results.updatedProject, results.errorMessages, results.displayMessage);
            }
        }
    }, [appContext, dndData, enqueueSnackbar, finishDrop, mutateProject, project]);

    useEffect(() => {
        // console.log('Inventory: useEffect: [] router checks');
        // @ts-ignore
        SingletonRouter.router.change = (...args) => {
            // @ts-ignore
            if (changed && (SingletonRouter.router.basePath + SingletonRouter.router.asPath) !== args[2]) {

                // eslint-disable-next-line no-restricted-globals,no-alert
                if (confirm('There are unsaved Inventory changes within your project.\n\nDo you want to navigate away and lose your changes?')) {
                    return Router.prototype.change.apply(SingletonRouter.router, args);
                }

                // Hack to get the focus on the page to clear the tree node selected
                if (networkExclusionsButtonRef && networkExclusionsButtonRef.current) {
                    // @ts-ignore
                    networkExclusionsButtonRef.current.focus();
                }

                if (project) {
                    const target: Target = {
                        route: '/migration/project/[projectId]/inventory',
                        route_as: '/migration/project/' + project.roProjectWithData.id + '/inventory'
                    };

                    setupNavMenu(appContext,
                        'migration',
                        'inventory',
                        target,
                        project.roProjectWithData.project_name,
                        project.roProjectWithData.project_instance,
                        []);
                }

                return new Promise((resolve) => resolve(false)).then(() => {
                });
            }

            return Router.prototype.change.apply(SingletonRouter.router, args);

        };

        return () => {
            // @ts-ignore
            delete SingletonRouter.router.change;
        };
    }, [project, changed, appContext]);

    const handleFilterByGridChange = useCallback((_event: object, pFilter: string) => {
        setFilterByGridType(pFilter !== null ? pFilter : 'nofilter');
    }, []);

    /**
     * Perform the requested action from the Devices right-click context menu dialog.
     * @param action                The chosen right-click context action
     * @param selectedRows          The selected rows
     * @param selectedColumnValue   If the user selected a cell while the device table is in List (a.k.a. Table) View,
     *                              and then right-clicked and chose 'Copy to Clipboard', this parameter will contain the
     *                              cell value.
     */
    const handleDevicesContextCallback = useCallback((action: ContextAction, selectedRows: NetworkNode[], selectedColumnValue: string | null) => {
        if (!project) {
            return;
        }

        if (action === ContextActions.CopyToApplication
            || action === ContextActions.MoveToApplication
            || action === ContextActions.MoveToMoveGroup) {
            // Get the selected application or moveGroup
            setInventoryDialog({
                display: true,
                action,
                selectedRows
            });
            return;
        }

        if (action === ContextActions.CopyFieldValueToClipboard && selectedRows?.length === 1) {
            if (selectedColumnValue !== null) {
                copy(selectedColumnValue);
            } else {
                copy(selectedRows[0].name);
            }
            return;
        }

        // Get a new instance of ProjectContainer that we can modify, then we will mutate it causing the page to rerender
        const updatedProject: ProjectContainer = new ProjectContainer(project.roProjectWithData);
        if (action.type === 'moveGroup') {
            if (action === ContextActions.RemoveFromMoveGroups) {
                const selectedRowIds = selectedRows.map((selectedRow) => selectedRow.id);
                updatedProject.removeFromMoveGroups(selectedRowIds);
                mutateProject(updatedProject, false).then();
                setChanged(true);
            }
        } else if (action.type === 'application') {
            const selectedRowIds = selectedRows.map(selectedRow => selectedRow.id);
            updatedProject.removeFromApps(action, selectedRowIds, filter);
            mutateProject(updatedProject, false).then();
            setChanged(true);
        }
    }, [project, filter, mutateProject]);

    const filterChange = useCallback((newFilter: FilterProps) => {
        setFilter(newFilter);
    }, []);

    /**
     * This function is designed to be passed down to child components.  It allows them a way to flag to the Inventory
     * page that they made some project changes and the save button should be enabled.
     *
     * @param madeChanges   boolean - true, some project changes were made.  false, no changes were made.
     */
    const enableSave = useCallback((madeChanges: boolean) => {
        if (madeChanges) {
            setChanged(true);   // Enable the Save/Undo buttons
        }
    }, []);

    /**
     * Determine if its ok to drop a row onto another
     *
     * @param sourceGridDraggedRowNode
     * @param targetGridDroppedIntoRowNode
     */
    const okToDropIntoRow = useCallback((sourceGridDraggedRowNode: RowNode, targetGridDroppedIntoRowNode: RowNode) => {
        let okToDrop = false;

        const checkOkToDrop = (sourceType: string) => {
            // set up the rules for allowing dragged row from target grid to be dropped into source grid row
            if (sourceType === 'Virtual') {
                if (targetGridDroppedIntoRowNode.data.type === '') {
                    okToDrop = true;
                }
                else if (targetGridDroppedIntoRowNode.data.type === 'Move Group') {
                    okToDrop = true;
                }
                else if (targetGridDroppedIntoRowNode.data.type === 'Virtual') {
                    okToDrop = false;
                }
                else {
                    // must be dropping into a custom property
                    okToDrop = true;
                }
            }
            else if (sourceType === '') {
                if (targetGridDroppedIntoRowNode.data.type === 'Virtual') {
                    okToDrop = true;
                }
                else if (targetGridDroppedIntoRowNode.data.type === 'Move Group') {
                    okToDrop = true;
                }
            }
            else if (sourceType === 'Move Group') {
                if (targetGridDroppedIntoRowNode.data.type === 'Virtual') {
                    okToDrop = true;
                }
                else if (targetGridDroppedIntoRowNode.data.type === '') {
                    okToDrop = true;
                }
            }
            else if (targetGridDroppedIntoRowNode.data.type === 'Virtual') {
                // must be dragging a custom property
                okToDrop = true;
            }
            return okToDrop;
        };

        if (targetGridDroppedIntoRowNode && targetGridDroppedIntoRowNode.data && sourceGridDraggedRowNode) {
            if (sourceGridDraggedRowNode.data) {
                okToDrop = checkOkToDrop(sourceGridDraggedRowNode.data.type);
            }

            if (sourceGridDraggedRowNode.group) {
                okToDrop = checkOkToDrop(sourceGridDraggedRowNode.allLeafChildren[0].data.type);
            }
        }

        return okToDrop;
    }, []);

    /**
     * Show the Manage Custom Properties dialog
     */
    const showManageCustomPropsDialog = useCallback((event: any): void => {
        if (event) {
            event.stopPropagation();
            setMenuAnchorEl(null);  // Close the hamburger menu
        }
        setOpenManageCustomPropsDialog(true);
    }, []);

    /**
     * Hide the Manage Custom Properties dialog
     */
    const hideManageCustomPropsDialog = useCallback((madeChanges: boolean): void => {
        setOpenManageCustomPropsDialog(false);
        if (madeChanges) {
            setChanged(true);
        }
    }, []);


    /**
     * Rows were selected in a subpanel
     */
    const handleRowSelection = useCallback((type: string, newSelectedRows: NetworkNode[]) => {
        // only filter if enabled via UI toggle button
        if (filterByGridType === 'filter') {
            const newFilter = _.clone(filter);
            // @ts-ignore
            newFilter[type] = newSelectedRows;

            setFilter(newFilter);
        }
    }, [filter, filterByGridType]);

    const rowSelectionCallback = useCallback((type: string, selectedRows: NetworkNode[]) => {
        handleRowSelection(type + 'Selected', selectedRows);
    }, [handleRowSelection]);

    const moveGroupSelectionCallback = useCallback((selectedRows: NetworkNode[]) => {
        handleRowSelection('moveGroupSelected', selectedRows);
    }, [handleRowSelection]);

    /**
     * Perform the requested action from the Move Groups right-click context menu dialog.
     * @param action                The chosen right-click context action
     * @param selectedRows          The selected rows
     */
    const handleMoveGroupsContextCallback = useCallback((action: ContextAction, selectedRows: any[]) => {
        if (!project) {
            return;
        }

        if (selectedRows.length === 0) {
            return;
        }

        if (action === ContextActions.CopyFieldValueToClipboard && selectedRows?.length === 1) {
            copy(selectedRows[0].name);
            return;
        }

        // DeleteSelected is the only action expected
        if (action !== ContextActions.DeleteSelected) {
            return;
        }

        const updatedProject: ProjectContainer = new ProjectContainer(project.roProjectWithData);
        // Remove the selected move groups
        const mgIds = selectedRows.map((selectedRow) => selectedRow.id);
        updatedProject.removeMoveGroups(mgIds);
        mutateProject(updatedProject, false).then();
        setChanged(true);
    }, [project, mutateProject]);

    /**
     * Context menu...application dialog dismissed without any selection
     */
    const handleInventoryDialogCancel = useCallback(() => {
        setInventoryDialog({
            display: false,
            action: ContextActions.Cancel,
            selectedRows: []
        });
    }, []);

    /**
     * Perform the requested action from the Applications right-click context menu dialog.
     * @param action                The chosen right-click context action
     * @param selectedRows          The selected rows
     */
    const handleApplicationsContextCallback = useCallback((action: ContextAction, selectedRows: any[]) => {
        if (!project) {
            return;
        }

        if (selectedRows.length === 0) {
            return;
        }

        if (action === ContextActions.CopyFieldValueToClipboard && selectedRows?.length === 1) {
            copy(selectedRows[0].name);
            return;
        }

        if (action === ContextActions.AddToMoveGroup ||
            action === ContextActions.RemoveFromMoveGroup) {
            // Have the user select a move group
            setInventoryDialog({
                display: true,
                action,
                selectedRows
            });
            return;
        }

        if (action !== ContextActions.DeleteSelected) {
            return;
        }

        // DeleteSelected logic

        // Clone the project so when we mutate it the page will rerender
        const updatedProject: ProjectContainer = new ProjectContainer(project.roProjectWithData);
        updatedProject.deleteSelected(selectedRows);
        mutateProject(updatedProject, false).then();
        setChanged(true);
    }, [project, mutateProject]);

    const handleStartedCalculating = useCallback(() => {
        setCalculating(true);
    }, []);

    const handleFinishedCalculating = useCallback(() => {
        setCalculating(false);
    }, []);

    const NAV_MENU = useMigrationMenu(project?.roProjectWithData);

    /**
     * Save project. Assumes any changes have been made to the project object.  Both this component and child
     * components can make changes by mutating the project object in the swr cache.
     */
    const saveProject = useCallback((): void => {
        if (!project) {
            return;
        }
        if (changed) {
            setLoading(true);

            ShowToast('Saving Project', appContext, enqueueSnackbar);

            // Send save project request to the backend
            Api.updateObjectReturnResponse(project.roProjectWithData)
                .then((response) => {

                    // Successfully back from the save project request - but the project is not fully saved yet.
                    // Note that the backend save project logic is itself asynchronous.  We store the
                    // request id/project id.  ProjectMessagesWrapper will poll for messages looking for a
                    // save finished message for the request id/project id.  Once that occurs we unmask the page
                    // in handleFinishedSaving.
                    setSaveInProcessFor({
                        requestId: response.headers['x-cmr-api-requestid'],
                        projectId: project.roProjectWithData.id
                    });
                })
                .catch(err => {
                    setSnackbar({
                        open: true,
                        severity: 'error',
                        ah: false,
                        text: 'Saving Project Error: ' + (err?.message ? err.message : 'Unknown error.')
                    });
                    setLoading(false);
                });
        }
    }, [appContext, changed, enqueueSnackbar, project]);

    // Future: find a way to resize panels in more "react way"
    const setPanelSize = useCallback((id: string, width: number) => {
        const panel = document.getElementById(id);
        if (panel && width) {
            panel.style.width = `${width}px`;
            panel.style.minWidth = `${width}px`;
            panel.style.maxWidth = `${width}px`;
        }
    }, []);

    const dMid: Divider = useMemo(() => {
        return {
            min: 300,
            max: 800,
            position: initialMidPanelWidth,
            axis: 'x',
            inverse: true,
            cbMove: d => setPanelSize('project-mid-panel', d.position)
        };
    }, [setPanelSize]);
    const dRight: Divider = useMemo(() => {
        return {
            min: 300,
            max: 800,
            position: initialRightPanelWidth,
            axis: 'x',
            inverse: true,
            cbMove: d => setPanelSize('project-right-panel', d.position)
        };
    }, [setPanelSize]);
    const handleMidDivider = useMemo(() => getDividerHandler(dMid), [dMid]);
    const handleRightDivider = useMemo(() => getDividerHandler(dRight), [dRight]);


    const handleSnackbarClose = useCallback(() => setSnackbar({ open: false, severity: 'info', text: '' }), []);

    /**
     * Opens the hamburger menu on click of the hamburger icon
     * @param event The menu is anchored to the target element of the click event - the icon, causing the menu to open.
     */
    const handleHamburgerMenuClick = useCallback((event: any) => {
        event.stopPropagation();
        setMenuAnchorEl(event.currentTarget);
    }, []);

    /**
     * Closes the hamburger menu by setting the anchor element to null.
     */
    const handleHamburgerMenuClose = useCallback((event: any) => {
        event.stopPropagation();
        setMenuAnchorEl(null);
    }, []);

    /**
     * Temporary handler for hamburger menu options that are not yet implemented.
     * @param event
     */
    // const hamburgerMenuOptionTBD = (event: any) => {
    //     if (event) {
    //         event.stopPropagation();
    //         setMenuAnchorEl(null);  // Close the hamburger menu
    //     }
    //     setSnackbar({ open: true, severity: 'info', text: 'Functionality Not Yet Implemented' });
    // };

    /**
     * Send calcEnvironmentOverview to BE API
     * @param event
     */
    const updateEnvironmentOverview = useCallback((event: any) => {
        if (event) {
            event.stopPropagation();
            setMenuAnchorEl(null);  // Close the hamburger menu
        }
        if (!project) {
            return;
        }
        Api.calcOverview(project.roProjectWithData.id)
            .then(runId => {
                setSnackbar({ open: true, severity: 'info', text: 'Calculation started. Run ID: ' + runId });
            })
            .catch(err => {
                setSnackbar({ open: true, severity: 'error', text: 'Error starting Update Environment Overview. ' + err });
            });
    }, [project]);

    /**
     * Export Inventory Configuration
     * @param event
     */
    const exportInventoryConfiguration = useCallback((event: any) => {
        if (event) {
            event.stopPropagation();
            setMenuAnchorEl(null);  // Close the hamburger menu
        }
        if (!project) {
            return;
        }
        const urlSuffix: string = `/${project.roProjectWithData.name}/provisional_data/netflow/provisional/overview/all_entity_properties.csv`;

        downloadFile('all_entity_properties.csv', urlSuffix);
    }, [project]);

    /**
     * Import Inventory Configuration
     * @param event
     */
    const importInventoryConfiguration = useCallback((event: any) => {
        if (event) {
            event.stopPropagation();
            setMenuAnchorEl(null);  // Close the hamburger menu
        }
        setImportConfigOpened(true);
    }, []);

    const handleNetworksExclusionListUpdate = useCallback((list: string[]) => {
        if (!project) {
            return;
        }
        setNetworksExclusionOpened(false);
        project.updateExcludeNets(list && list.length > 0 && list[0] != '' ? list : []);
        setChanged(true);
    }, [project]);

    const handleNetworksExclusionClick = useCallback(() => {
        setNetworksExclusionOpened(true);
    }, []);

    const customPropertiesClick = useCallback((event) => showManageCustomPropsDialog(event), [showManageCustomPropsDialog]);

    const importGroupsClick = useCallback(() => {
        setMenuAnchorEl(null);
        setSelectProjectOpened(true);
    }, []);

    const exportInventoryConfigClick = useCallback((event) => exportInventoryConfiguration(event), [exportInventoryConfiguration]);

    /**
     * Constructs the hamburger menu
     */
    const getHamburgerMenu = useMemo(() => {
        return (
            <StyledMenu
                id="hamburger-menu"
                anchorEl={menuAnchorEl}
                elevation={0}
                getContentAnchorEl={null}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                keepMounted
                open={Boolean(menuAnchorEl)}
                onClose={handleHamburgerMenuClose}
            >
                <StyledMenuItem
                    data-cy="updateEnvOverview"
                    onClick={(event) => updateEnvironmentOverview(event)}
                >
                    <ListItemIcon style={{ minWidth: 30 }}>
                        <VcioIcon vcio="migration-calculate" iconColor={colors.green_500}/>
                    </ListItemIcon>
                    <ListItemText primary="Update Environment Overview"/>
                </StyledMenuItem>
                <StyledMenuItem
                    data-cy="manageCustomProperties"
                    onClick={customPropertiesClick}
                >
                    <ListItemIcon style={{ minWidth: 30 }}>
                        <VcioIcon vcio="view-list" iconColor={colors.green_500}/>
                    </ListItemIcon>
                    <ListItemText primary="Manage Custom Properties"/>
                </StyledMenuItem>
                <StyledMenuItem
                    data-cy="importGroups"
                    onClick={importGroupsClick}
                >
                    <ListItemIcon style={{ minWidth: 30 }}>
                        <VcioIcon vcio="migration-application" iconColor={colors.green_500}/>
                    </ListItemIcon>
                    <ListItemText primary="Import Groups from Another Project"/>
                </StyledMenuItem>
                <MenuDivider/>
                <StyledMenuItem
                    data-cy="exportInventoryConfig"
                    onClick={exportInventoryConfigClick}
                >
                    <ListItemIcon style={{ minWidth: 30 }}>
                        <VcioIcon vcio="file-file-export" iconColor={colors.green_500}/>
                    </ListItemIcon>
                    <ListItemText primary="Export Inventory Configuration"/>
                </StyledMenuItem>
                <StyledMenuItem
                    data-cy="projectCardMenuItemViewInventory"
                    onClick={(event) => importInventoryConfiguration(event)}
                >
                    <ListItemIcon style={{ minWidth: 30 }}>
                        <VcioIcon vcio="file-file-import" iconColor={colors.green_500}/>
                    </ListItemIcon>
                    <ListItemText primary="Import Inventory Configuration"/>
                </StyledMenuItem>
            </StyledMenu>
        );
    }, [customPropertiesClick, exportInventoryConfigClick, handleHamburgerMenuClose, importGroupsClick, importInventoryConfiguration, menuAnchorEl, updateEnvironmentOverview]);

    /**
     * Context menu...project dialog sequence has finished.  Process the desired action.
     * @param targetId
     */
    const handleInventoryDialogSelection = useCallback((targetId: string) => {
        if (!project) {
            return;
        }
        const updatedProject: ProjectContainer = new ProjectContainer(project.roProjectWithData);

        const selectedRowIds = inventoryDialog.selectedRows.map((selectedRow) => selectedRow.id);
        if (targetId && inventoryDialog.action) {

            if (inventoryDialog.action.type === 'application') {

                // Update the app object (e.g. group membership)
                const application: NodeGroup | undefined = _.find(updatedProject.roProjectWithData.apps, { id: targetId });
                if (!application) {
                    log('ERROR: Application not found after inventory dialog dismissed');
                    setInventoryDialog({
                        display: false,
                        action: undefined,
                        selectedRows: []
                    });
                    return;
                }

                if (inventoryDialog.action === ContextActions.CopyToApplication) {
                    updatedProject.copyToApp(selectedRowIds, application.id);

                } else if (inventoryDialog.action === ContextActions.MoveToApplication) {
                    updatedProject.moveToApp(selectedRowIds, application.id);
                }

                mutateProject(updatedProject, false).then();
                setChanged(true);

            } else if (inventoryDialog.action.type === 'moveGroup') {
                const mg: MoveGroup | undefined = _.find(updatedProject.roProjectWithData.move_groups, { id: targetId });
                if (!mg) {
                    log('ERROR: Move group not found after inventory dialog dismissed');
                    setInventoryDialog({
                        display: false,
                        action: undefined,
                        selectedRows: []
                    });
                    return;
                }
                if (inventoryDialog.action === ContextActions.MoveToMoveGroup) {
                    updatedProject.moveToMoveGroup(selectedRowIds, mg.id);
                    mutateProject(updatedProject, false).then();
                    setChanged(true);

                } else if (inventoryDialog.action === ContextActions.AddToMoveGroup) {
                    updatedProject.addToMoveGroup(selectedRowIds, mg.id);
                    mutateProject(updatedProject, false).then();
                    setChanged(true);

                } else if (inventoryDialog.action === ContextActions.RemoveFromMoveGroup) {
                    updatedProject.removeFromMoveGroup(selectedRowIds, mg.id);
                    mutateProject(updatedProject, false).then();
                    setChanged(true);
                }
            }
        }
        setInventoryDialog({
            display: false,
            action: undefined,
            selectedRows: []
        });
    }, [inventoryDialog.action, inventoryDialog.selectedRows, mutateProject, project]);

    const importGroupsFromProject = useCallback((pl: Project) => {
        if (!project) {
            return;
        }
        setSelectProjectOpened(false);
        setLoading(true);
        Api.getProject(pl.id).then((p) => {
            if (p && p.roProjectWithData.nodes && p.roProjectWithData.apps && p.roProjectWithData.move_groups) {
                for (const na of p.roProjectWithData.apps) {
                    if (na.node_ids) {
                        na.node_ids = na.node_ids.filter(id => project.roProjectWithData.nodesMap[id]);
                    }
                }
                for (const na of p.roProjectWithData.move_groups) {
                    if (na.node_ids) {
                        na.node_ids = na.node_ids.filter(id => project.roProjectWithData.nodesMap[id]);
                    }
                }
                project.updateApps(p.roProjectWithData.apps);
                project.updateMoveGroups(p.roProjectWithData.move_groups);
            }
            setLoading(false);
            setChanged(true);
        }).catch(err => {
            setLoading(false);
            ShowToast('ERROR: Could not load project to import. ' + err, appContext, enqueueSnackbar, 'error');
        });
    }, [appContext, enqueueSnackbar, project]);

    /**
     * This function is passed to ProjectMessagesWrapper.  Invoked by ProjectMessagesWrapper when a save completed
     * message is received.
     */
    const handleFinishedSaving = useCallback(() => {
        if (!project) {
            return;
        }
        // Not saving any more
        setSaveInProcessFor({
            requestId: '',
            projectId: ''
        });

        setChanged(false);
        setLoading(true);
        const updatedProject: ProjectContainer = new ProjectContainer(project.roProjectWithData);
        mutateProject(updatedProject, true)
            .then(() => {
                // Fetched updated project from server
                setLoading(false);
            });
    }, [mutateProject, project]);

    /**
     * Undoes any changes to the project.
     *
     * Assumes all changes have been made to the project object.  Child components making changes would have mutated
     * the project object in swr cache.  This page could have made additional changes to the project object which it
     * grabbed from swr cache.
     *
     * Implements undo by simply fetching the project again from the server and updating the cache.
     */
    const handleUndoChanges = useCallback(() => {
        mutateProject()     // Force fetch from server
            .then(() => {
                setChanged(false);
            });
    }, [mutateProject]);

    // Default to no masking
    const mask = useMemo(() => {
        let localMask: MaskTarget = MaskTarget.Nothing;
        if (loading || saveInProcessFor.requestId !== '') {
            // Saving or Loading, mask the entire page including the left nav
            localMask = MaskTarget.Everything;
        } else if (calculating) {
            // Calculating, mask just the content, leave left nav unmasked
            localMask = MaskTarget.ContentOnly;
        }
        return localMask;
    }, [calculating, loading, saveInProcessFor.requestId]);

    if (!project) {
        const menu = getEmptyNavigationMenu('migration');
        return (
            <Page tab="migration" navMenu={menu}>
                <CircularProgress/>
            </Page>
        );
    }

    return (
        <ProjectMessagesWrapper
            maskWhenCalculating={true}
            maskWhenSaving={true}
            saveInProcessFor={saveInProcessFor}
            handleFinishedSaving={handleFinishedSaving}
            handleFinishedCalculating={handleFinishedCalculating}
        >
            <Page tab="migration" navMenu={NAV_MENU} mask={mask}>
                {
                    !error &&
                    <>
                        <Grid container className={classes.toolbar} style={{ marginTop: 20 }}>
                            <InventoryHeader
                                project={project}
                                title="Inventory"
                                extraButtons={
                                    <>
                                        <Grid item>
                                            <Button size="large" disabled={!changed} onClick={saveProject} data-cy="saveProject">Save</Button>
                                        </Grid>
                                        {
                                            changed &&
                                            <Grid item>
                                                <Button size="large" variant="outlined" onClick={handleUndoChanges} data-cy="undoChanges">Undo Changes</Button>
                                            </Grid>
                                        }
                                        <Grid item>
                                            <Button
                                                ref={networkExclusionsButtonRef}
                                                size="large"
                                                variant="outlined"
                                                startIcon={<VisibilityOff/>}
                                                onClick={handleNetworksExclusionClick}
                                            >
                                                Network Exclusions
                                                {project?.roProjectWithData.exclude_nets?.length > 0 ?
                                                    <>&nbsp;({project.roProjectWithData.exclude_nets.length})</> :
                                                    null}
                                            </Button>
                                        </Grid>
                                        <Grid item>
                                            <ToggleButtonGroup
                                                data-cy="listPanelFilterByGridsGroup"
                                                value={filterByGridType}
                                                exclusive
                                                onChange={handleFilterByGridChange}
                                                aria-label="Filter Compute Instances by Applications, Move Groups or Custom Groups"
                                            >
                                                <TooltipToggleButton
                                                    data-cy="listPanelFilterByGridsButton"
                                                    title="Filter Compute Instances by Applications, Move Groups or Custom Groups"
                                                    placement="bottom-start"
                                                    arrow
                                                    value="filter"
                                                    aria-label="Filter Compute Instances by Applications, Move Groups or Custom Groups"
                                                >
                                                    <VcioIcon vcio="data-filter" iconColor={colors.green_500}/>
                                                </TooltipToggleButton>
                                            </ToggleButtonGroup>
                                        </Grid>
                                    </>
                                }
                                hamburgerMenu={
                                    <Grid item>
                                        <Button
                                            size="large"
                                            variant="outlined"
                                            className="icon-button"
                                            data-cy="inventoryHamburgerMenu"
                                            onClick={handleHamburgerMenuClick}
                                        >
                                            <MoreHoriz/>
                                        </Button>
                                        {getHamburgerMenu}
                                    </Grid>
                                }
                            />
                        </Grid>

                        <Box display="flex" flex="auto">
                            <Box display="flex" flexDirection="column" flex="auto" className={classes.panel}>
                                <InventoryDevice
                                    project={project}
                                    mutateProject={mutateProject}
                                    filter={filter}
                                    gridType="device"
                                    setGridReadyOptions={setDeviceGridOptions}
                                    setDndData={setDndData}
                                    okToDropIntoRow={okToDropIntoRow}
                                    changeFilterCallback={filterChange}
                                    contextCallback={handleDevicesContextCallback}
                                    enableSave={enableSave}
                                />
                            </Box>
                            <Box className={classes.divider} onMouseDown={handleMidDivider}>
                                <MoreVert/>
                            </Box>
                            <Box display="flex">
                                <Box
                                    id="project-mid-panel"
                                    flexDirection="column"
                                    flex="auto"
                                    className={classes.panel}
                                    style={{ width: initialMidPanelWidth, minWidth: initialMidPanelWidth, maxWidth: initialMidPanelWidth }}
                                >
                                    <InventoryApplication
                                        showManageCustomPropsDialog={showManageCustomPropsDialog}
                                        rowSelectionCallback={rowSelectionCallback}
                                        project={project}
                                        mutateProject={mutateProject}
                                        gridType="application"
                                        setGridReadyOptions={setApplicationGridOptions}
                                        setDndData={setDndData}
                                        okToDropIntoRow={okToDropIntoRow}
                                        // applicationsSelected={filter.applicationSelected} //how to handle custom property? pass in entire filters?
                                        enableSave={enableSave}
                                        contextCallback={handleApplicationsContextCallback}
                                        calculationCallback={handleStartedCalculating}
                                        projectHasUnsavedChanges={changed}
                                    />
                                </Box>
                            </Box>
                            <Box className={classes.divider} onMouseDown={handleRightDivider}>
                                <MoreVert/>
                            </Box>
                            <Box display="flex">
                                <Box
                                    id="project-right-panel"
                                    flexDirection="column"
                                    flex="auto"
                                    className={classes.panel}
                                    style={{ width: initialRightPanelWidth, minWidth: initialRightPanelWidth, maxWidth: initialRightPanelWidth }}
                                >
                                    <InventoryMoveGroup
                                        rowSelectionCallback={moveGroupSelectionCallback}
                                        project={project}
                                        mutateProject={mutateProject}
                                        gridType="movegroup"
                                        setGridReadyOptions={setMoveGroupGridOptions}
                                        setDndData={setDndData}
                                        okToDropIntoRow={okToDropIntoRow}
                                        moveGroupsSelected={filter.moveGroupSelected}
                                        enableSave={enableSave}
                                        contextCallback={handleMoveGroupsContextCallback}
                                        calculationCallback={handleStartedCalculating}
                                        projectHasUnsavedChanges={changed}
                                    />
                                </Box>
                            </Box>
                        </Box>
                    </>
                }
                {
                    error &&
                    <Grid
                        container
                        direction="row"
                        justify="center"
                        alignItems="center"
                        style={{ marginTop: 40 }}
                    >
                        <Message warning={true}>{error?.message ?? 'Unknown Error'}</Message>
                    </Grid>
                }
                {
                    snackbar.open &&
                    <Snackbar
                        open={snackbar.open}
                        autoHideDuration={snackbar.ah ? 5000 : null}
                        onClose={handleSnackbarClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    >
                        <Alert severity={snackbar.severity} onClose={handleSnackbarClose}>
                            {snackbar.text}
                        </Alert>
                    </Snackbar>
                }
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={snackbar.ah ? 5000 : null}
                    onClose={handleSnackbarClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                >
                    <Alert severity={snackbar.severity} onClose={handleSnackbarClose}>
                        {snackbar.text}
                    </Alert>
                </Snackbar>
                {
                    openManageCustomPropsDialog &&
                    <ManageCustomPropertiesDialog
                        handleDialogClose={hideManageCustomPropsDialog}
                        open={openManageCustomPropsDialog}
                        project={project}
                        mutateProject={mutateProject}
                    />
                }
                {
                    inventoryDialog.display &&
                    <InventoryDialog
                        project={project}
                        type={inventoryDialog.action ? inventoryDialog.action.type : undefined}
                        handleDialogSelection={handleInventoryDialogSelection}
                        handleDialogCancel={handleInventoryDialogCancel}
                        open={inventoryDialog.display}
                    />
                }
                {
                    importConfigOpened &&
                    <ImportInventoryConfigDialog
                        open={importConfigOpened}
                        projectid={project.roProjectWithData.id}
                        onClose={() => setImportConfigOpened(false)}
                    />
                }
                {
                    networksExclusionOpened &&
                    <NetworksExclusionListDialog
                        open={networksExclusionOpened}
                        nets_list={project.roProjectWithData.exclude_nets}
                        onClose={() => setNetworksExclusionOpened(false)}
                        onUpdate={handleNetworksExclusionListUpdate}
                    />
                }
                {
                    selectProjectOpened &&
                    <SelectProjectDialog
                        open={selectProjectOpened}
                        title="Select Project to Import Configuration"
                        onClose={() => setSelectProjectOpened(false)}
                        onProjectSelect={importGroupsFromProject}
                    />
                }
            </Page>
        </ProjectMessagesWrapper>
    );
};
