import { Divider, Menu, MenuItem, withStyles } from '@material-ui/core';
import { NetworkNode } from '@models';
import { colors } from '@styles';
import { InventoryType } from '@utils';
import React, { useCallback, useMemo } from 'react';
import { VcioIcon } from './VcioIcon';

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

export interface ContextAction {
    id: number;
    type: 'application' | 'moveGroup' | undefined;
}

export const ContextActions: {
    Cancel: ContextAction;
    SetCustomProperties: ContextAction;
    CopyToApplication: ContextAction;
    MoveToApplication: ContextAction;
    MoveToMoveGroup: ContextAction;
    RemoveFromMoveGroups: ContextAction;
    RemoveFromAllApplications: ContextAction;
    RemoveFromSelectedApplications: ContextAction;
    RemoveFromAllExceptSelectedApplications: ContextAction;
    AddToMoveGroup: ContextAction;
    RemoveFromMoveGroup: ContextAction;
    CalculateDependencies: ContextAction;
    DeleteSelected: ContextAction;
    EditItem: ContextAction;
    ExcludeItem: ContextAction;
    UnExcludeItem: ContextAction;
    CopyFieldValueToClipboard: ContextAction;
} = {
    Cancel: {
        id: 0,
        type: undefined
    },
    SetCustomProperties: {
        id: 1,
        type: undefined
    },
    CopyToApplication: {
        id: 2,
        type: 'application'
    },
    MoveToApplication: {
        id: 3,
        type: 'application'
    },
    MoveToMoveGroup: {
        id: 4,
        type: 'moveGroup'
    },
    RemoveFromMoveGroups: {
        id: 5,
        type: 'moveGroup'
    },
    RemoveFromAllApplications: {
        id: 6,
        type: 'application'
    },
    RemoveFromSelectedApplications: {
        id: 7,
        type: 'application'
    },
    RemoveFromAllExceptSelectedApplications: {
        id: 8,
        type: 'application'
    },
    AddToMoveGroup: {
        id: 10,
        type: 'moveGroup'
    },
    RemoveFromMoveGroup: {
        id: 11,
        type: 'moveGroup'
    },
    CalculateDependencies: {
        id: 12,
        type: undefined
    },
    DeleteSelected: {
        id: 13,
        type: undefined
    },
    EditItem: {
        id: 14,
        type: undefined
    },
    ExcludeItem: {
        id: 15,
        type: undefined
    },
    UnExcludeItem: {
        id: 16,
        type: undefined
    },
    CopyFieldValueToClipboard: {
        id: 17,
        type: undefined
    }
};

interface InventoryContextMenuProps {
    type: InventoryType;
    contextCallback?: Function;
    mouseX: number | null;
    mouseY: number | null;
    selectedRows: NetworkNode[] | any[];
}

/**
 * Context menu displayed via right mouse within inventory subpanels.
 *
 * @param props
 * @constructor
 */
export const InventoryContextMenu: React.FunctionComponent<InventoryContextMenuProps> = (props) => {
    const { contextCallback: pContextCallback, selectedRows: pSelectedRows, mouseX: pMouseX, mouseY: pMouseY, type: pType } = props;

    const handleContextClose = useCallback((action: ContextAction) => {
        if (pContextCallback) {
            pContextCallback(action, pSelectedRows);
        }
    }, [pContextCallback, pSelectedRows]);

    const hasExcluded = useMemo(() => pSelectedRows.some(item => item._disabled), [pSelectedRows]);
    const hasNotExcluded = useMemo(() => pSelectedRows.some(item => !item._disabled), [pSelectedRows]);

    const getDeviceContextMenuItems = useCallback(() => {
        return (
            <StyledMenu
                key='contextmenu'
                open={pMouseY !== null}
                onClose={() => handleContextClose(ContextActions.Cancel)}
                anchorReference="anchorPosition"
                anchorPosition={
                    pMouseY !== null && pMouseX !== null
                        ? { top: pMouseY, left: pMouseX }
                        : undefined
                }
            >
                {/* <StyledMenuItem */}
                {/*    onClick={() => handleContextClose(ContextActions.EditItem)}*/}
                {/*    disabled={pSelectedRows.length !== 1}*/}
                {/*    key={'inventory-device-menu' + ContextActions.EditItem.id}*/}
                {/*    data-cy="inventoryDevicesEditItem"*/}
                {/* >*/}
                {/*    <VcioIcon vcio='general-edit' style={{ marginRight: '6px' }} iconColor={colors.blue_500}/>*/}
                {/*    Edit*/}
                {/* </StyledMenuItem> */}
                <StyledMenuItem
                    onClick={() => handleContextClose(ContextActions.CopyFieldValueToClipboard)}
                    disabled={pSelectedRows.length !== 1}
                    key={'inventory-device-menu' + ContextActions.CopyFieldValueToClipboard.id}
                    data-cy="inventoryDevicesCopyToClipboard"
                >
                    <VcioIcon vcio='general-edit' style={{ marginRight: '6px' }} iconColor={colors.blue_500}/>
                    Copy to Clipboard
                </StyledMenuItem>
                <Divider/>
                {
                    hasNotExcluded &&
                    <StyledMenuItem
                        onClick={() => handleContextClose(ContextActions.ExcludeItem)}
                        key={'inventory-device-menu' + ContextActions.ExcludeItem.id}
                        data-cy="inventoryDevicesExcludeItem"
                    >
                        <VcioIcon vcio='general-minus-circle-outline' style={{ marginRight: '6px' }} iconColor={colors.red_500}/>
                        Exclude from Calculation
                    </StyledMenuItem>
                }
                {
                    hasExcluded &&
                    <StyledMenuItem
                        onClick={() => handleContextClose(ContextActions.UnExcludeItem)}
                        key={'inventory-device-menu' + ContextActions.UnExcludeItem.id}
                        data-cy="inventoryDevicesUnExcludeItem"
                    >
                        <VcioIcon vcio='general-plus-circle' style={{ marginRight: '6px' }} iconColor={colors.blue_500}/>
                        Return Device(s) to Calculation
                    </StyledMenuItem>
                }
                <StyledMenuItem
                    onClick={() => handleContextClose(ContextActions.SetCustomProperties)}
                    disabled={pSelectedRows.length === 0}
                    key={'inventory-device-menu' + ContextActions.SetCustomProperties.id}
                    data-cy="inventoryDevicesSetCustomProperties"
                >
                    <VcioIcon vcio='general-tags-outline' style={{ marginRight: '6px' }} iconColor={colors.blue_500}/>
                    Set Custom Properties
                </StyledMenuItem>
                <Divider/>
                <StyledMenuItem
                    onClick={() => handleContextClose(ContextActions.CopyToApplication)}
                    disabled={pSelectedRows.length === 0}
                    key={'inventory-device-menu' + ContextActions.CopyToApplication.id}
                    data-cy="inventoryDevicesCopyToApplication"
                >
                    <VcioIcon vcio='migration-copy-to-application' style={{ marginRight: '6px' }} iconColor={colors.blue_500}/>
                    Copy to Application
                </StyledMenuItem>
                <StyledMenuItem
                    onClick={() => handleContextClose(ContextActions.MoveToApplication)}
                    disabled={pSelectedRows.length === 0}
                    key={'inventory-device-menu' + ContextActions.MoveToApplication.id}
                    data-cy="inventoryDevicesMoveToApplication"
                >
                    <VcioIcon vcio='migration-move-to-application' style={{ marginRight: '6px' }} iconColor={colors.blue_500}/>
                    Move to Application
                </StyledMenuItem>
                <Divider/>
                <StyledMenuItem
                    onClick={() => handleContextClose(ContextActions.RemoveFromSelectedApplications)}
                    disabled={pSelectedRows.length === 0}
                    key={'inventory-device-menu' + ContextActions.RemoveFromSelectedApplications.id}
                    data-cy="inventoryDevicesRemoveFromSelectedApplication"
                >
                    <VcioIcon vcio='migration-remove-from-application' style={{ marginRight: '6px' }} iconColor={colors.red_500}/>
                    Remove from Selected Applications
                </StyledMenuItem>
                <StyledMenuItem
                    onClick={() => handleContextClose(ContextActions.RemoveFromAllExceptSelectedApplications)}
                    disabled={pSelectedRows.length === 0}
                    key={'inventory-device-menu' + ContextActions.RemoveFromAllExceptSelectedApplications.id}
                    data-cy="inventoryDevicesRemoveExceptSelectedApplication"
                >
                    <VcioIcon vcio='migration-remove-from-application' style={{ marginRight: '6px' }} iconColor={colors.red_500}/>
                    Remove from All EXCEPT Selected Applications
                </StyledMenuItem>
                <StyledMenuItem
                    onClick={() => handleContextClose(ContextActions.RemoveFromAllApplications)}
                    disabled={pSelectedRows.length === 0}
                    key={'inventory-device-menu' + ContextActions.RemoveFromAllApplications.id}
                    data-cy="inventoryDevicesRemoveFromAllApplication"
                >
                    <VcioIcon vcio='general-cross' style={{ marginRight: '6px' }} iconColor={colors.red_500}/>
                    Remove from ALL Applications
                </StyledMenuItem>
                <Divider/>
                <StyledMenuItem
                    onClick={() => handleContextClose(ContextActions.MoveToMoveGroup)}
                    disabled={pSelectedRows.length === 0}
                    key={'inventory-device-menu' + ContextActions.MoveToMoveGroup.id}
                    data-cy="inventoryDevicesMoveToMoveGroup"
                >
                    <VcioIcon vcio='migration-move-to-move-group' style={{ marginRight: '6px' }} iconColor={colors.blue_500}/>
                    Move to Move Group
                </StyledMenuItem>
                <StyledMenuItem
                    onClick={() => handleContextClose(ContextActions.RemoveFromMoveGroups)}
                    disabled={pSelectedRows.length === 0}
                    key={'inventory-device-menu' + ContextActions.RemoveFromMoveGroups.id}
                    data-cy="inventoryDevicesRemoveFromMoveGroups"
                >
                    <VcioIcon vcio='migration-remove-from-move-group' style={{ marginRight: '6px' }} iconColor={colors.red_500}/>
                    Remove from Move Groups
                </StyledMenuItem>
            </StyledMenu>
        );
    }, [handleContextClose, hasExcluded, hasNotExcluded, pMouseX, pMouseY, pSelectedRows.length]);

    const getApplicationsContextMenuItems = useCallback(() => {
        let showingContextMenuForCustomProperty: boolean = false;
        let customProperty: string = '';
        if (pType === InventoryType.Application) {
            if (pSelectedRows.length > 0) {
                if (pSelectedRows[0].typeName) {
                    showingContextMenuForCustomProperty = true;
                    customProperty = pSelectedRows[0].typeName;
                }
            }
        }
        return (
            <StyledMenu
                key='contextmenu'
                open={pMouseY !== null}
                onClose={() => handleContextClose(ContextActions.Cancel)}
                anchorReference="anchorPosition"
                anchorPosition={
                    pMouseY !== null && pMouseX !== null
                        ? { top: pMouseY, left: pMouseX }
                        : undefined
                }
            >
                <StyledMenuItem
                    onClick={() => handleContextClose(ContextActions.EditItem)}
                    disabled={pSelectedRows.length !== 1}
                    key={'inventory-applications-menu' + ContextActions.EditItem.id}
                    data-cy="inventoryApplicationsEditItem"
                >
                    <VcioIcon vcio='general-edit' style={{ marginRight: '6px' }} iconColor={colors.blue_500}/>
                    Edit
                </StyledMenuItem>
                <StyledMenuItem
                    onClick={() => handleContextClose(ContextActions.CopyFieldValueToClipboard)}
                    disabled={pSelectedRows.length !== 1}
                    key={'inventory-applications-menu' + ContextActions.CopyFieldValueToClipboard.id}
                    data-cy="inventoryApplicationsCopyToClipboard"
                >
                    <VcioIcon vcio='general-clone' style={{ marginRight: '6px' }} iconColor={colors.blue_500}/>
                    Copy to Clipboard
                </StyledMenuItem>
                <Divider/>
                {
                    hasNotExcluded &&
                    <StyledMenuItem
                        onClick={() => handleContextClose(ContextActions.ExcludeItem)}
                        key={'inventory-applications-menu' + ContextActions.ExcludeItem.id}
                        data-cy="inventoryApplicationsExcludeItem"
                    >
                        <VcioIcon vcio='general-minus-circle-outline' style={{ marginRight: '6px' }} iconColor={colors.red_500}/>
                        Exclude from Calculation
                    </StyledMenuItem>
                }
                {
                    hasExcluded &&
                    <StyledMenuItem
                        onClick={() => handleContextClose(ContextActions.UnExcludeItem)}
                        key={'inventory-applications-menu' + ContextActions.UnExcludeItem.id}
                        data-cy="inventoryApplicationsUnExcludeItem"
                    >
                        <VcioIcon vcio='general-plus-circle' style={{ marginRight: '6px' }} iconColor={colors.blue_500}/>
                        Return Application(s) to Calculation
                    </StyledMenuItem>
                }
                {(hasNotExcluded || hasExcluded) && <Divider/>}
                <StyledMenuItem
                    onClick={() => handleContextClose(ContextActions.AddToMoveGroup)}
                    disabled={pSelectedRows.length === 0 || showingContextMenuForCustomProperty}
                    key={'inventory-applications-menu' + ContextActions.AddToMoveGroup.id}
                    data-cy="inventoryApplicationsAddToMoveGroup"
                >
                    <VcioIcon vcio='migration-move-to-move-group' style={{ marginRight: '6px' }} iconColor={colors.blue_500}/>
                    Add to Move Group
                </StyledMenuItem>
                <StyledMenuItem
                    onClick={() => handleContextClose(ContextActions.RemoveFromMoveGroup)}
                    disabled={pSelectedRows.length === 0 || showingContextMenuForCustomProperty}
                    key={'inventory-applications-menu' + ContextActions.RemoveFromMoveGroup.id}
                    data-cy="inventoryApplicationsRemoveFromMoveGroup"
                >
                    <VcioIcon vcio='migration-remove-from-move-group' style={{ marginRight: '6px' }} iconColor={colors.red_500}/>
                    Remove from Move Group
                </StyledMenuItem>
                <StyledMenuItem
                    onClick={() => handleContextClose(ContextActions.CalculateDependencies)}
                    disabled={pSelectedRows.length === 0}
                    key={'inventory-applications-menu' + ContextActions.CalculateDependencies.id}
                    data-cy="inventoryApplicationsCalculateDependencies"
                >
                    <VcioIcon vcio='migration-calculate' style={{ marginRight: '6px' }} iconColor={colors.red_500}/>
                    Calculate Dependencies
                </StyledMenuItem>
                <StyledMenuItem
                    onClick={() => handleContextClose(ContextActions.DeleteSelected)}
                    disabled={pSelectedRows.length === 0}
                    key={'inventory-applications-menu' + ContextActions.DeleteSelected.id}
                    data-cy="inventoryApplicationsDeleteSelected"
                >
                    <VcioIcon vcio='general-trash-outline' style={{ marginRight: '6px' }} iconColor={colors.red_500}/>
                    Delete Selected {showingContextMenuForCustomProperty ? `${customProperty}s` : 'Applications'}
                </StyledMenuItem>
            </StyledMenu>
        );
    }, [handleContextClose, hasExcluded, hasNotExcluded, pMouseX, pMouseY, pSelectedRows, pType]);

    const getMoveGroupsContextMenuItems = useCallback(() => {

        return (
            <StyledMenu
                key='contextmenu'
                open={pMouseY !== null}
                onClose={() => handleContextClose(ContextActions.Cancel)}
                anchorReference="anchorPosition"
                anchorPosition={
                    pMouseY !== null && pMouseX !== null
                        ? { top: pMouseY, left: pMouseX }
                        : undefined
                }
            >
                <StyledMenuItem
                    onClick={() => handleContextClose(ContextActions.EditItem)}
                    disabled={pSelectedRows.length !== 1}
                    key={'inventory-movegroups-menu' + ContextActions.EditItem.id}
                    data-cy="inventoryMoveGroupsEditItem"
                >
                    <VcioIcon vcio='general-edit' style={{ marginRight: '6px' }} iconColor={colors.blue_500}/>
                    Edit
                </StyledMenuItem>
                <StyledMenuItem
                    onClick={() => handleContextClose(ContextActions.CopyFieldValueToClipboard)}
                    disabled={pSelectedRows.length !== 1}
                    key={'inventory-movegroups-menu' + ContextActions.CopyFieldValueToClipboard.id}
                    data-cy="inventoryMoveGroupsCopyToClipboard"
                >
                    <VcioIcon vcio='general-clone' style={{ marginRight: '6px' }} iconColor={colors.blue_500}/>
                    Copy to Clipboard
                </StyledMenuItem>
                <StyledMenuItem
                    onClick={() => handleContextClose(ContextActions.CalculateDependencies)}
                    disabled={pSelectedRows.length === 0}
                    key={'inventory-movegroups-menu' + ContextActions.CalculateDependencies.id}
                    data-cy="inventoryMoveGroupsCalculateDependencies"
                >
                    <VcioIcon vcio='migration-calculate' style={{ marginRight: '6px' }} iconColor={colors.red_500}/>
                    Calculate Dependencies
                </StyledMenuItem>
                <StyledMenuItem
                    onClick={() => handleContextClose(ContextActions.DeleteSelected)}
                    disabled={pSelectedRows.length === 0}
                    key={'inventory-movegroups-menu' + ContextActions.DeleteSelected.id}
                    data-cy="inventoryMoveGroupsDeleteSelected"
                >
                    <VcioIcon vcio='general-trash-outline' style={{ marginRight: '6px' }} iconColor={colors.red_500}/>
                    Delete Selected Move Groups
                </StyledMenuItem>
            </StyledMenu>
        );
    }, [handleContextClose, pMouseX, pMouseY, pSelectedRows.length]);

    const styledMenu = useMemo(() => {
        if (pType === InventoryType.Device) {
            return getDeviceContextMenuItems();
        }
        if (pType === InventoryType.Application) {
            return getApplicationsContextMenuItems();
        }
        if (pType === InventoryType.MoveGroup) {
            return getMoveGroupsContextMenuItems();
        }
        return '';
    }, [getApplicationsContextMenuItems, getDeviceContextMenuItems, getMoveGroupsContextMenuItems, pType]);

    return (
        <>
            {styledMenu}
        </>
    );
};
