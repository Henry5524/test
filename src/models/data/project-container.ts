import { ContextAction, ContextActions } from '@components/controls/InventoryContextMenu';
import { CustomProperty, CustomPropertyType, IdType, MoveGroup, NetworkNode, ProjectWithData } from '@root/models';
import { DragAndDropData, log } from '@utils';
import { RowNode } from 'ag-grid-community';
import _ from 'lodash';
import { NodeGroup } from './node-group';

// Maps to be used for lookup/reference (read only)
const updateMaps = (data: ProjectWithData) => {

    if (!data) {
        return;
    }
    // log('updating project maps');
    if (data.exclude) {
        for (const item of data.exclude) {
            if (item?.type == 'device') {
                const node = data.nodes.find((n: NetworkNode) => n.id == item.id);
                if (node) {
                    node._disabled = true;
                }
            } else if (item?.type == 'app') {
                const app = data.apps.find((a: NodeGroup) => a.id == item.id);
                if (app) {
                    app._disabled = true;
                }
            }
        }
    }
    // Convenience map of nodes by id
    data.nodesMap = _.keyBy(data.nodes, 'id');
    // Convenience map of move group references
    data.moveGroupMap = _.keyBy(data.move_groups, 'id');
    // Convenience map of application references
    data.appsMap = _.keyBy(data.apps, 'id');
    // Convenience map of nodes to applications
    data.nodeToAppsMap = _.reduce(data.apps, (acc: { [key: string]: string[] }, cur) => {
        _.forEach(cur.node_ids, node_id => {
            if (!acc[node_id]) {
                acc[node_id] = [];
            }
            acc[node_id].push(cur.id);
        });
        return acc;
    }, {});
    // Convenience map of applications to move groups
    data.appToMgsMap = _.reduce(data.move_groups, (acc: { [key: string]: string[] }, cur) => {
        _.forEach(cur.group_ids, group_id => {
            if (!acc[group_id]) {
                acc[group_id] = [];
            }
            acc[group_id].push(cur.id);
        });
        return acc;
    }, {});
    // Convenience map of nodes to associated move groups
    data.nodeToMgsMap = _.reduce(data.move_groups, (acc: { [key: string]: string[] }, cur) => {
        _.forEach(cur.node_ids, node_id => {
            if (!acc[node_id]) {
                acc[node_id] = [];
            }
            acc[node_id].push(cur.id);
        });
        return acc;
    }, {});

    // Convenience map of custom properties to associated nodes for each value
    data.customPropsMap = _.reduce(data.nodes, (acc: { [key: string]: CustomProperty }, cur) => {
        _.forEach(cur.custom_props, (prop_value: string, prop_key: string) => {
            if (!acc[prop_key]) {
                // @ts-ignore
                acc[prop_key] = {};
            }
            // @ts-ignore
            if (!acc[prop_key][prop_value]) {
                // @ts-ignore
                acc[prop_key][prop_value] = [];
            }
            // @ts-ignore
            acc[prop_key][prop_value].push(cur.id);
        });
        return acc;
    }, {});
};

type NewCpFormData = {
    name: string;       // The id, bad variable name, but same as the variable name used in the API
    title: string;      // The text displayed to the user
    value: string;
    removed: boolean;
    index: number;
    errorMessage: string;
};

type ExistingCpFormData = {
    name: string;       // The id, bad variable name, but same as the variable name used in the API
    clean: boolean;
    selectedValue: string;
};

interface FilterProps {
    applicationSelected: NodeGroup[];
    moveGroupSelected: NodeGroup[];
}

export class ProjectContainer {
    private _projectWithData: ProjectWithData;
    private _changed: boolean;
    private _changeIndicator: number;

    constructor(project: ProjectWithData) {
        this._projectWithData = _.cloneDeep(project);
        this._changed = false;
        this._changeIndicator = 0;
        updateMaps(this._projectWithData);
    }

    get changeIndicator(): number {
        return this._changeIndicator;
    }

    get changed(): boolean {
        return this._changed;
    }

    get roProjectWithData(): ProjectWithData {
        return this._projectWithData;
    }

    /**
     * When the private project object has been modified, this will update all of the internal data structures
     */
    private syncInternals = (): void => {
        this._projectWithData.move_groups_count = this._projectWithData.move_groups.length;
        this._projectWithData.apps_count = this._projectWithData.apps.length;
        updateMaps(this._projectWithData);
        this._changed = true;
        this._changeIndicator++;
    };

    updateProjectName = (newProjectName: string): void => {
        this._projectWithData.project_name = newProjectName;
        this.syncInternals();
    };

    updateProjectInstance = (newProjectInstance: string): void => {
        this._projectWithData.project_instance = newProjectInstance;
        this.syncInternals();
    };

    updateExcludeNets = (newExcludeNets: string[]): void => {
        this._projectWithData.exclude_nets = newExcludeNets;
        this.syncInternals();
    };

    removeApps = (removeApps: string[]): void => {
        _.remove(this._projectWithData.apps, (app: NodeGroup) => {
            return removeApps.includes(app.id);
        });
        this.syncInternals();
    };

    removeMoveGroups = (mgIds: string[]): void => {
        _.remove(this._projectWithData.move_groups, (mg: NodeGroup) => {
            return mgIds.includes(mg.id);
        });

        // Spin thru project.nodes
        // remove from project.nodes.mgid any of our selected custom property values
        _.forEach(this._projectWithData.nodes, (node) => {
            _.forEach(mgIds, (mgId) => {
                if (node.mgid === mgId) {
                    delete node.mgid;
                    return false;   // end inner forEach loop
                }
                return true;        // continue inner forEach loop
            });
        });
        _.forEach(mgIds, (nodeId) => {
            const node = _.find(this._projectWithData.nodes, { id: nodeId });
            if (node) {
                delete node.mgid;
            }
        });
        this.syncInternals();
    };

    deleteSelected = (selectedRows: NetworkNode[]): void => {
        let selectedCustomPropertyValues: boolean = false;
        if (selectedRows.length > 0) {
            // @ts-ignore
            if (selectedRows[0].typeName) {
                selectedCustomPropertyValues = true;
            }
        }

        if (selectedCustomPropertyValues) {
            // Spin thru project.nodes
            // Remove from project.nodes.custom_props any of our selected custom property values
            _.forEach(this._projectWithData.nodes, (node) => {
                _.forEach(selectedRows, (row) => {
                    if (node.custom_props[row.type] && node.custom_props[row.type] === row.id) {
                        delete node.custom_props[row.type];
                        return false;   // end inner forEach loop
                    }
                    return true;        // continue inner forEach loop
                });
            });
            // Remove from the str_values array inside the clonedProject.custom_node_props for the custom property.
            let foundCnp: CustomProperty | undefined;
            _.forEach(selectedRows, (row) => {
                foundCnp = _.find(this._projectWithData.custom_node_props, { name: row.type });
                if (foundCnp && foundCnp.str_values) {
                    _.remove(foundCnp.str_values, function (strValue) {
                        return strValue === row.name;
                    });
                }
            });

        } else {
            // Remove the selected applications from project.apps
            const selectedRowIds = selectedRows.map((selectedRow) => selectedRow.id);
            this.updateApps(_.filter(this._projectWithData.apps, (app: NodeGroup) => !selectedRowIds.includes(app.id)));
            // The list of apps associated with a node is managed by inventory-device logic on rerender.
            // So...clear the app list from each node, since it must be entirely reconstructed from the group membership via inventory-device rerender.
            _.forEach(this.roProjectWithData.nodes, (node) => {
                node.apps = [];
            });
            _.forEach(
                this.roProjectWithData.move_groups,
                (mg: MoveGroup) => _.remove(mg.group_ids, id => selectedRowIds.includes(id))
            );
        }
        this.syncInternals();
    };

    addApp = (newApp: NodeGroup): void => {
        this._projectWithData.apps.push(newApp);
        this.syncInternals();
    };

    addMoveGroup = (newMoveGroup: MoveGroup): void => {
        this._projectWithData.move_groups.push(newMoveGroup);
        this.syncInternals();
    };

    updateApps = (newApps: NodeGroup[]): void => {
        this._projectWithData.apps = newApps;
        this.syncInternals();
    };

    updateMoveGroups = (newMoveGroups: MoveGroup[]): void => {
        this._projectWithData.move_groups = newMoveGroups;
        this.syncInternals();
    };

    updateCustomNodeProps = (newCustomNodeProps: CustomProperty[]): void => {
        this._projectWithData.custom_node_props = newCustomNodeProps;
        this.syncInternals();
    };

    updateCustomAppProps = (newCustomAppProps: CustomProperty[]): void => {
        this._projectWithData.custom_app_props = newCustomAppProps;
        this.syncInternals();
    };

    /**
     * Exclude items
     *
     * @param sr
     * @param type 'app', 'device',
     */
    excludeItems = (sr: NetworkNode[], type: 'app' | 'device'): void => {
        for (const node of sr) {
            const index = this._projectWithData.exclude.findIndex(item => item.id == node.id);
            if (index == -1) {
                this._projectWithData.exclude.push(new IdType({ id: node.id, type }));
            }
        }
        this.syncInternals();
    };

    /**
     * Unexclude items
     *
     * @param sr
     * @param type
     */
    unexcludeItems = (sr: NetworkNode[], type: 'app' | 'device'): void => {
        for (const node of sr) {
            _.remove(this._projectWithData.exclude, item => item.id == node.id);
        }
        if (type === 'app') {
            this._projectWithData.apps.forEach(item => {
                item._disabled = false;
            });
        } else if (type === 'device') {
            this._projectWithData.nodes.forEach(item => {
                item._disabled = false;
            });
        }
        this.syncInternals();
    };

    updateApp = (item: NodeGroup): void => {
        const i = this._projectWithData.apps.findIndex(g => g.id == item.id);
        if (i > -1) {
            this._projectWithData.apps[i] = item;
            this._projectWithData.appsMap[item.id] = item;
        }
        this.syncInternals();
    };

    moveToMoveGroup = (ids: string[], mgId: string): void => {
        const mg: MoveGroup | undefined = _.find(this._projectWithData.move_groups, { id: mgId });
        if (!mg) {
            return;
        }

        // NOTE: A device can be in at most 1 move group either directly or indirectly (via application membership)
        // Future: A device can't be in Application that is in MG1 and at the same time device itself in MG2.  NOTE: this should be server-side logic!
        _.forEach(this._projectWithData.move_groups, (move_group) => {
            _.remove(move_group.node_ids, (id: string) => {
                return ids.includes(id);
            });
        });
        mg.node_ids = _.union(mg.node_ids, ids);
        this.syncInternals();
    };

    addToMoveGroup = (ids: string[], mgId: string): void => {
        const mg: MoveGroup | undefined = _.find(this._projectWithData.move_groups, { id: mgId });
        if (!mg) {
            return;
        }
        // An application may be in multiple move groups, move groups may contain multiple applications
        mg.group_ids = _.union(mg.group_ids, ids);
        this.syncInternals();
    };

    removeFromMoveGroup = (ids: string[], mgId: string): void => {
        const mg: MoveGroup | undefined = _.find(this._projectWithData.move_groups, { id: mgId });
        if (!mg) {
            return;
        }
        _.remove(mg.group_ids, (id: string) => {
            return ids.includes(id);
        });
        this.syncInternals();
    };

    copyToApp = (ids: string[], appId: string): void => {
        const application: NodeGroup | undefined = _.find(this._projectWithData.apps, { id: appId });
        if (!application) {
            return;
        }
        application.node_ids = _.union(application.node_ids, ids);

        // The list of apps associated with a node is managed by inventory-device logic on rerender.
        // So...clear the app list here since it must be entirely reconstructed from the group membership via inventory-device rerender.
        // Would be REALLY nice to refactor this behavior ....
        _.forEach(ids, (nodeId) => {
            const node = _.find(this._projectWithData.nodes, { id: nodeId });
            if (node) {
                node.apps = [];
            }
        });
        this.syncInternals();
    };

    moveToApp = (ids: string[], appId: string): void => {
        const application: NodeGroup | undefined = _.find(this._projectWithData.apps, { id: appId });
        if (!application) {
            return;
        }
        _.forEach(this._projectWithData.apps, (app) => {
            _.remove(app.node_ids, (id: string) => {
                return ids.includes(id);
            });
        });
        application.node_ids = _.union(application.node_ids, ids);

        // The list of apps associated with a node is managed by inventory-device logic on rerender.
        // So...clear the app list here since it must be entirely reconstructed from the group membership via inventory-device rerender.
        // Would be REALLY nice to refactor this behavior ....
        _.forEach(ids, (nodeId) => {
            const node = _.find(this._projectWithData.nodes, { id: nodeId });
            if (node) {
                node.apps = [];
            }
        });
        this.syncInternals();
    };

    updateCustomPropertyValue = (cpEditDialogOpen: CustomProperty, item: string): void => {
        if (this._projectWithData.nodes) {
            for (const node of this._projectWithData.nodes) {
                if (node.custom_props && node.custom_props[cpEditDialogOpen.type] == cpEditDialogOpen.name) {
                    node.custom_props[cpEditDialogOpen.type] = item;
                }
            }
        }
        if (this._projectWithData.custom_node_props) {
            for (const cnp of this._projectWithData.custom_node_props) {
                if (cnp.name === cpEditDialogOpen.type) {
                    if (cnp.str_values) {
                        for (const [idx, sv] of cnp.str_values.entries()) {
                            if (sv === cpEditDialogOpen.name) {
                                cnp.str_values[idx] = item;
                                break;
                            }
                        }
                    }
                    break;
                }
            }
        }
        this.syncInternals();
    };

    updateMoveGroup = (item: MoveGroup): void => {
        const i = this._projectWithData.move_groups.findIndex(g => g.id == item.id);
        if (i > -1) {
            this._projectWithData.move_groups[i] = item;
            this._projectWithData.moveGroupMap[item.id] = item;
        }
        this.syncInternals();
    };

    updateDevice = (ni: number, device: NetworkNode): void => {
        this._projectWithData.nodes[ni] = device;
        this._projectWithData.nodesMap[device.id] = device;
        this.syncInternals();
    };

    addCustomNodeProp = (propertyName: string, newValue: string): void => {
        const cp: CustomProperty | undefined = _.find(this._projectWithData.custom_node_props, { name: propertyName });
        if (!cp) {
            // Should not happen
            log(`AddCustomPropertyValueDialog: handleNewCustomPropertyValue: Did not find custom property in 
                props.project.custom_node_props with name=${propertyName}`);
        } else {
            if (!cp.str_values) {
                cp.str_values = [];
            }
            cp.str_values.push(newValue);
        }
        this.syncInternals();
    };

    addNewCustomNodeProp = (customNodeProp: CustomProperty): void => {
        this._projectWithData.custom_node_props.push(customNodeProp);
        this.syncInternals();
    };

    adjustCustomProperties = (row: any,
        selectedNodeIndex: number,
        clonedExistingCpFormData: ExistingCpFormData[],
        newCpsFormData: NewCpFormData[]): {rowChangedExistingCpsFormData: boolean; rowChangedProject: boolean} => {

        let changedProject: boolean = false;
        let changedExistingCpsFormData: boolean = false;

        // Get the node from the project
        const node = _.find(this._projectWithData.nodes, { id: row.id });

        if (node) {
            // Loop thru the existing custom properties
            _.forEach(clonedExistingCpFormData, (existingCpFormData: ExistingCpFormData) => {
                if (existingCpFormData.clean) {
                    if (node.custom_props && node.custom_props[existingCpFormData.name]) {
                        // User wanted to clean this custom property of all values, delete it from the node
                        delete node.custom_props[existingCpFormData.name];
                        changedProject = true;
                        changedExistingCpsFormData = true;
                    }
                } else if (existingCpFormData.selectedValue !== 'Do not change') {
                    // User set a new value for this custom property, update the node with the new value
                    if (!node.custom_props) {
                        node.custom_props = {};
                    }
                    node.custom_props[existingCpFormData.name] = existingCpFormData.selectedValue;

                    if (!this._projectWithData.custom_node_props) {
                        this.updateCustomNodeProps([]);
                    }

                    const foundCNP: CustomProperty | undefined = _.find(this._projectWithData.custom_node_props, { name: existingCpFormData.name });
                    if (foundCNP) {
                        const valueExists: boolean = foundCNP.str_values ? foundCNP.str_values.includes(existingCpFormData.selectedValue) : false;
                        if (!valueExists) {
                            if (!foundCNP.str_values) {
                                foundCNP.str_values = [];
                            }
                            foundCNP.str_values.push(existingCpFormData.selectedValue);
                        }
                    }

                    changedProject = true;
                    changedExistingCpsFormData = true;
                }
            }); // End loop thru the existing custom properties

            if (newCpsFormData.length > 0) {

                // Loop thru the new custom property returned by the CustomPropertiesDialog
                _.forEach(newCpsFormData, (newCpFormData: NewCpFormData) => {

                    if (!newCpFormData.removed &&
                        newCpFormData.title !== '' &&
                        newCpFormData.value !== '' &&
                        newCpFormData.errorMessage === '') {

                        if (!this._projectWithData.custom_node_props) {
                            this.updateCustomNodeProps([]);
                        }

                        if (selectedNodeIndex === 0) {
                            // Add the custom property to the projects list of custom properties.
                            // We only want to do this one time, thus we only do it on the first node.
                            this._projectWithData.custom_node_props.push(new CustomProperty({
                                name: newCpFormData.name,
                                title: newCpFormData.title,
                                type: CustomPropertyType.String,
                                str_values: [newCpFormData.value]
                            }));
                        }

                        if (!node.custom_props) {
                            node.custom_props = {};
                        }
                        node.custom_props[newCpFormData.name] = newCpFormData.value;
                        changedProject = true;

                        // Copy the new custom property to the existing custom property data structure
                        // That way if the user opens the Set Custom Properties dialog again before saving,
                        // our new custom property will show as existing.
                        clonedExistingCpFormData.push({
                            name: newCpFormData.name,
                            clean: false,
                            selectedValue: newCpFormData.value
                        });
                        changedExistingCpsFormData = true;
                    }
                }); // End loop thru the new custom properties returned by the CustomPropertiesDialog

            }
        }   // End if (node)

        this.syncInternals();
        return { rowChangedProject: changedProject, rowChangedExistingCpsFormData: changedExistingCpsFormData };
    };

    removeFromMoveGroups = (selectedRowIds: string[]): void => {
        _.forEach(this._projectWithData.move_groups, (move_group) => {
            _.remove(move_group.node_ids, (id: string) => {
                return selectedRowIds.includes(id);
            });
        });
        _.forEach(selectedRowIds, (nodeId) => {
            const node = _.find(this._projectWithData.nodes, { id: nodeId });
            if (node) {
                delete node.mgid;
            }
        });
        this.syncInternals();
    };

    removeFromApps = (action: ContextAction, selectedRowIds: string[], filter: FilterProps): void => {
        if (action === ContextActions.RemoveFromAllApplications) {
            _.forEach(this._projectWithData.apps, (app) => {
                _.remove(app.node_ids, (id: string) => {
                    return selectedRowIds.includes(id);
                });
            });
        } else if (action === ContextActions.RemoveFromSelectedApplications) {
            const filteredRowIds = filter.applicationSelected.map(filteredApp => filteredApp.id);
            _.forEach(this._projectWithData.apps, (app) => {
                if (filteredRowIds.includes(app.id)) {
                    _.remove(app.node_ids, (id: string) => {
                        return selectedRowIds.includes(id);
                    });
                }
            });
        } else if (action === ContextActions.RemoveFromAllExceptSelectedApplications) {
            const filteredRowIds = filter.applicationSelected.map(filteredApp => filteredApp.id);
            _.forEach(this._projectWithData.apps, (app) => {
                if (!filteredRowIds.includes(app.id)) {
                    _.remove(app.node_ids, (id: string) => {
                        return selectedRowIds.includes(id);
                    });
                }
            });
        }
        // The list of apps associated with a node is managed by inventory-device logic on rerender.
        // So...clear the app list here since it must be entirely reconstructed from the group membership via inventory-device rerender.
        // Would be REALLY nice to refactor this behavior ....
        _.forEach(selectedRowIds, (nodeId) => {
            const node = _.find(this._projectWithData.nodes, { id: nodeId });
            if (node) {
                node.apps = [];
            }
        });
        this.syncInternals();
    };

    /**
     * Move device(s) into applications or move groups
     *
     * @param dragDropData
     * @param sourceDeviceIds array of source device ids
     * @param finishDrop
     */
    moveDevices = (
        dragDropData: DragAndDropData,
        sourceDeviceIds: string[]): {
        updatedProject: ProjectContainer;
        errorMessages: string[];
        displayMessage: string;
    } => {
        // we are moving devices into applications
        if (dragDropData.targetGridType === 'application') {
            // remove source devices from all applications
            _.forEach(this._projectWithData.apps, (app) => {
                _.remove(app.node_ids, (id: string) => {
                    return sourceDeviceIds.includes(id);
                });
            });
        } else if (dragDropData.targetGridType === 'movegroup') {
            // we are moving devices into move groups
            // remove source devices from all move groups
            _.forEach(this._projectWithData.move_groups, (move_group) => {
                _.remove(move_group.node_ids, (id: string) => {
                    return sourceDeviceIds.includes(id);
                });
            });
            _.forEach(sourceDeviceIds, (nodeId) => {
                const node = _.find(this._projectWithData.nodes, { id: nodeId });
                if (node) {
                    delete node.mgid;
                }
            });
        }

        return this.copyDevices(dragDropData, sourceDeviceIds, true);
    };

    /**
     * Move application(s) into devices or move groups
     *
     * @param dragDropData
     * @param sourceApplicationIds array of source application ids
     * @param finishDrop
     */
    moveApplications = (dragDropData: DragAndDropData, sourceApplicationIds: string[]): {
        updatedProject: ProjectContainer;
        errorMessages: string[];
        displayMessage: string;
    } => {
        // we are moving applications into devices
        if (dragDropData.targetGridType === 'device') {
            // remove source applications from all devices
            _.forEach(this._projectWithData.apps, (app) => {
                if (sourceApplicationIds.includes(app.id)) {
                    app.node_ids = [];
                }
            });
        } else if (dragDropData.targetGridType === 'movegroup') {
            // we are moving applications into move groups
            // remove source applications from all move groups
            _.forEach(this._projectWithData.move_groups, (mg) => {
                _.remove(mg.group_ids, (id: string) => {
                    return sourceApplicationIds.includes(id);
                });
            });
        }

        return this.copyApplications(dragDropData, sourceApplicationIds, true);
    };

    /**
     * Move move group(s) into devices or applications
     *
     * @param dragDropData
     * @param sourceMoveGroupIds array of source move group ids
     * @param finishDrop
     */
    moveMoveGroups = (dragDropData: DragAndDropData, sourceMoveGroupIds: string[]): {
        updatedProject: ProjectContainer;
        errorMessages: string[];
        displayMessage: string;
    } => {
        // we are moving move groups into devices
        if (dragDropData.targetGridType === 'device') {
            // remove source move groups from all devices
            _.forEach(this._projectWithData.move_groups, (mg) => {
                if (sourceMoveGroupIds.includes(mg.id)) {
                    // remove all devices from this move group
                    mg.node_ids = [];
                }
            });

            // remove move group id from all devices
            _.forEach(this._projectWithData.nodes, (node) => {
                if (sourceMoveGroupIds.includes(node.mgid)) {
                    delete node.mgid;
                }
            });
        } else if (dragDropData.targetGridType === 'application') {
            // we are moving move groups into applications
            // remove source move groups from all applications
            _.forEach(this._projectWithData.move_groups, (mg) => {
                if (sourceMoveGroupIds.includes(mg.id)) {
                    // remove all applications from this move group
                    mg.group_ids = [];
                }
            });
        }

        return this.copyMoveGroups(dragDropData, sourceMoveGroupIds, true);
    };

    /**
     * Move properties into devices
     *
     * @param dragDropData
     * @param sourcePropertyIds array of source property ids
     * @param finishDrop
     */
    moveProperties = (dragDropData: DragAndDropData, sourcePropertyIds: string[]): {
        updatedProject: ProjectContainer;
        errorMessages: string[];
        displayMessage: string;
    } => {
        // we are moving properties into devices
        if (dragDropData.targetGridType === 'device') {
            // remove source properties from all devices if it exists
            const propertyType = dragDropData.sourceGridDraggedRowNode.data.type;

            _.forEach(this._projectWithData.nodes, (node) => {
                _.each(sourcePropertyIds, (propertyId) => {
                    if (node.custom_props[propertyType] === propertyId) {
                        delete node.custom_props[propertyType];
                    }
                });
            });
        }

        return this.copyProperties(dragDropData, sourcePropertyIds, true);
    };

    /**
     * Copy device(s) into applications or move groups
     *
     * @param dragDropData
     * @param sourceDeviceIds array of source device ids
     * @param isMove
     * @param finishDrop
     */
    copyDevices = (
        dragDropData: DragAndDropData,
        sourceDeviceIds: string[],
        isMove: boolean): {
        updatedProject: ProjectContainer;
        errorMessages: string[];
        displayMessage: string;
    } => {
        const errorMessages: string[] = [];
        const copyOrMove = isMove ? 'moved' : 'copied';

        // we are copying devices into applications
        if (dragDropData.targetGridType === 'application') {

            // we need to check the row node data since this grid disguises itself as either application or custom properties
            if (dragDropData.targetGridDroppedIntoRowNode.data.typeName === undefined) {

                // check if the target id is currently selected, if so then copy devices into all selected applications
                if (dragDropData.targetGridDroppedIntoRowNode.isSelected()) {

                    let applicationCount = 0;

                    _.each(dragDropData.targetGridSelectedRowNodes, (rowNode: RowNode) => {

                        const application = _.find(this._projectWithData.apps, { id: rowNode.data.id });

                        if (!application) {
                            errorMessages.push('Application "' + rowNode.data.name + '" not found within the project data');
                        } else {
                            applicationCount += 1;

                            // add the device ids to the application's node_ids array
                            application.node_ids = _.union(application.node_ids, sourceDeviceIds);

                            // Future: need to add logic to make sure that devices do not belong to multiple move groups

                            // The list of apps associated with a node is managed by inventory-device logic on rerender.
                            // So...clear the app list here since it must be entirely reconstructed from the group membership via inventory-device rerender.
                            _.forEach(sourceDeviceIds, (nodeId) => {
                                const node = _.find(this._projectWithData.nodes, { id: nodeId });
                                if (node) {
                                    node.apps = [];
                                }
                            });
                        }
                    });
                    this.syncInternals();
                    return {
                        updatedProject: this,
                        errorMessages,
                        displayMessage: sourceDeviceIds.length > 1 ?
                            '(' + sourceDeviceIds.length + ') compute instances have been ' + copyOrMove + ' to (' + applicationCount + ') applications'
                            : '(1) compute instance has been ' + copyOrMove + ' to (' + applicationCount + ') applications'
                    };
                }
                // copy the devices into the targeted application row
                const application = _.find(this._projectWithData.apps, { id: dragDropData.targetGridDroppedIntoRowNode.data.id });

                if (!application) {
                    errorMessages.push('Application "' + dragDropData.targetGridDroppedIntoRowNode.data.name + '" not found within the project data');
                } else {
                    // add the device ids to the application's node_ids array
                    application.node_ids = _.union(application.node_ids, sourceDeviceIds);

                    // Future: need to add logic to make sure that devices do not belong to multiple move groups

                    // The list of apps associated with a node is managed by inventory-device logic on rerender.
                    // So...clear the app list here since it must be entirely reconstructed from the group membership via inventory-device rerender.
                    _.forEach(sourceDeviceIds, (nodeId) => {
                        const node = _.find(this._projectWithData.nodes, { id: nodeId });
                        if (node) {
                            node.apps = [];
                        }
                    });
                    this.syncInternals();
                    return {
                        updatedProject: this,
                        errorMessages,
                        displayMessage: sourceDeviceIds.length > 1 ?
                            '(' + sourceDeviceIds.length + ') compute instances have been ' + copyOrMove + ' to (1) application "' + application.name + '"'
                            : '(1) compute instance has been ' + copyOrMove + ' to (1) application "' + application.name + '"'
                    };
                }

            } else {
                // we must be dropping into a custom property grid
                const targetRowId = dragDropData.targetGridDroppedIntoRowNode.data.id;
                const propertyType = dragDropData.targetGridDroppedIntoRowNode.data.type;
                const propertyTypeName = dragDropData.targetGridDroppedIntoRowNode.data.typeName;

                _.forEach(sourceDeviceIds, (nodeId) => {
                    const node = _.find(this._projectWithData.nodes, { id: nodeId });
                    if (node) {
                        node.custom_props[propertyType] = targetRowId;
                    }
                });
                this.syncInternals();
                return {
                    updatedProject: this,
                    errorMessages,
                    displayMessage: sourceDeviceIds.length > 1 ?
                        '(' + sourceDeviceIds.length + ') compute instances have been ' + copyOrMove + ' to (1) "' + propertyTypeName + '" properties'
                        : '(1) compute instance has been ' + copyOrMove + ' to  (1) "' + propertyTypeName + '" properties'
                };
            }
        } else if (dragDropData.targetGridType === 'movegroup') {

            const moveGroup = _.find(this._projectWithData.move_groups, { id: dragDropData.targetGridDroppedIntoRowNode.data.id });

            if (!moveGroup) {
                errorMessages.push('Move Group "' + dragDropData.targetGridDroppedIntoRowNode.data.name + '" not found within the project data');
            } else {
                // add the device ids to the move group's node_ids array
                moveGroup.node_ids = _.union(moveGroup.node_ids, sourceDeviceIds);

                _.forEach(sourceDeviceIds, (nodeId) => {
                    const device = _.find(this._projectWithData.nodes, { id: nodeId });
                    if (device) {
                        device.mgid = moveGroup.id;
                    }
                });
                this.syncInternals();
                return {
                    updatedProject: this,
                    errorMessages,
                    displayMessage: sourceDeviceIds.length > 1 ?
                        '(' + sourceDeviceIds.length + ') compute instances have been ' + copyOrMove + ' to (1) move group "' + moveGroup.name + '"'
                        : '(1) compute instance has been ' + copyOrMove + ' to (1) move group "' + moveGroup.name + '"'
                };
            }
        }
        return {
            updatedProject: this,
            errorMessages,
            displayMessage: ''
        };
    };

    /**
     * Copy application(s) into devices or move groups
     *
     * @param dragDropData
     * @param sourceApplicationIds array of source application ids
     * @param isMove
     * @param finishDrop
     */
    copyApplications = (dragDropData: DragAndDropData, sourceApplicationIds: string[], isMove: boolean): {
        updatedProject: ProjectContainer;
        errorMessages: string[];
        displayMessage: string;
    } => {
        const errorMessages: string[] = [];
        const copyOrMove = isMove ? 'moved' : 'copied';

        // are we dropping into one row or all of the selected rows?
        const targetRowIds = !dragDropData.targetGridDroppedIntoRowNode.isSelected() ?
            [dragDropData.targetGridDroppedIntoRowNode.data.id]
            : dragDropData.targetGridSelectedRowNodes.map((rowData) => rowData.id);

        if (dragDropData.targetGridType === 'device') {
            // iterate over each application being dropped
            _.each(sourceApplicationIds, (applicationId) => {
                const application = _.find(this._projectWithData.apps, { id: applicationId });
                if (!application) {
                    errorMessages.push('Application id "' + applicationId + '" not found within the project data');
                } else {
                    application.node_ids = _.union(application.node_ids, targetRowIds);
                }
            });
            this.syncInternals();
            return {
                updatedProject: this,
                errorMessages,
                displayMessage: sourceApplicationIds.length > 1 ?
                    '(' + sourceApplicationIds.length + ') applications have been ' + copyOrMove + ' to (' + targetRowIds.length + ') compute instances'
                    : '(1) application has been ' + copyOrMove + ' to  (' + targetRowIds.length + ') compute instances'
            };
        }
        if (dragDropData.targetGridType === 'movegroup') {
            // iterate over each move group being dropped into
            _.each(targetRowIds, (moveGroupId) => {
                const moveGroup = _.find(this._projectWithData.move_groups, { id: moveGroupId });
                if (!moveGroup) {
                    errorMessages.push('Move group id "' + moveGroupId + '" not found within the project data');
                } else {
                    // update the move group to include the application ids of the rows being dragged
                    moveGroup.group_ids = _.union(moveGroup.group_ids, sourceApplicationIds);
                }
            });
            this.syncInternals();
            return {
                updatedProject: this,
                errorMessages,
                displayMessage: sourceApplicationIds.length > 1 ?
                    '(' + sourceApplicationIds.length + ') applications have been ' + copyOrMove + ' to (' + targetRowIds.length + ') move groups'
                    : '(1) application has been ' + copyOrMove + ' to  (' + targetRowIds.length + ') move groups'
            };
        }
        return {
            updatedProject: this,
            errorMessages,
            displayMessage: ''
        };
    };

    /**
     * Copy move group(s) into devices or applications
     *
     * @param dragDropData
     * @param sourceMoveGroupIds array of source move group ids
     * @param isMove
     * @param finishDrop
     */
    copyMoveGroups = (dragDropData: DragAndDropData, sourceMoveGroupIds: string[], isMove: boolean): {
        updatedProject: ProjectContainer;
        errorMessages: string[];
        displayMessage: string;
    } => {
        const errorMessages: string[] = [];
        const copyOrMove = isMove ? 'moved' : 'copied';

        // are we dropping into one row or all of the selected rows?
        const targetRowIds = !dragDropData.targetGridDroppedIntoRowNode.isSelected() ?
            [dragDropData.targetGridDroppedIntoRowNode.data.id]
            : dragDropData.targetGridSelectedRowNodes.map((rowData) => rowData.id);

        if (dragDropData.targetGridType === 'device') {

            // iterate over each device being dropped into
            _.each(targetRowIds, (deviceId) => {
                const device = _.find(this._projectWithData.nodes, { id: deviceId });

                if (!device) {
                    errorMessages.push('Compute instance id "' + deviceId + '" not found within the project data');
                } else {
                    const moveGroup = _.find(this._projectWithData.move_groups, { id: sourceMoveGroupIds[0] });
                    if (!moveGroup) {
                        errorMessages.push('Move group id "' + sourceMoveGroupIds[0] + '" not found within the project data');
                    } else {
                        moveGroup.node_ids = _.union(moveGroup.node_ids, [deviceId]);
                        // eslint-disable-next-line prefer-destructuring
                        device.mgid = sourceMoveGroupIds[0];
                    }
                }
            });
            this.syncInternals();
            return {
                updatedProject: this,
                errorMessages,
                displayMessage: sourceMoveGroupIds.length > 1 ?
                    '(' + sourceMoveGroupIds.length + ') move groups have been ' + copyOrMove + ' to (' + targetRowIds.length + ') compute instances'
                    : '(1) move group has been ' + copyOrMove + ' to  (' + targetRowIds.length + ') compute instances'
            };
        }
        if (dragDropData.targetGridType === 'application') {
            // iterate over each move group being dropped
            _.each(sourceMoveGroupIds, (moveGroupId) => {
                // find the move group within the project
                const moveGroup = _.find(this._projectWithData.move_groups, { id: moveGroupId });
                if (!moveGroup) {
                    errorMessages.push('Move group id "' + moveGroupId + '" not found within the project data');
                } else {
                    // update the move group to include the application ids of the rows being dropped into
                    moveGroup.group_ids = _.union(moveGroup.group_ids, targetRowIds);
                }
            });
            this.syncInternals();
            return {
                updatedProject: this,
                errorMessages,
                displayMessage: sourceMoveGroupIds.length > 1 ?
                    '(' + sourceMoveGroupIds.length + ') move groups have been ' + copyOrMove + ' to (' + targetRowIds.length + ') applications'
                    : '(1) move group has been ' + copyOrMove + ' to  (' + targetRowIds.length + ') applications'
            };
        }
        return {
            updatedProject: this,
            errorMessages,
            displayMessage: ''
        };
    };

    /**
     * Copy properties into devices
     *
     * @param dragDropData
     * @param sourcePropertyIds array of source property ids
     * @param isMove
     * @param finishDrop
     */
    copyProperties = (dragDropData: DragAndDropData, sourcePropertyIds: string[], isMove: boolean): {
        updatedProject: ProjectContainer;
        errorMessages: string[];
        displayMessage: string;
    } => {
        const errorMessages: string[] = [];
        const copyOrMove = isMove ? 'moved' : 'copied';

        // are we dropping into one row or all of the selected rows?
        const targetRowIds = !dragDropData.targetGridDroppedIntoRowNode.isSelected() ?
            [dragDropData.targetGridDroppedIntoRowNode.data.id]
            : dragDropData.targetGridSelectedRowNodes.map((rowData) => rowData.id);

        if (dragDropData.targetGridType === 'device') {
            const propertyType = dragDropData.sourceGridDraggedRowNode.data.type;

            _.forEach(targetRowIds, (nodeId) => {
                const node = _.find(this._projectWithData.nodes, { id: nodeId });
                if (node) {
                    // I have a question to the BE team, but currently this will only take the last id in the list
                    _.each(sourcePropertyIds, (propertyId) => {
                        node.custom_props[propertyType] = propertyId;
                    });
                }
            });
            this.syncInternals();
            return {
                updatedProject: this,
                errorMessages,
                displayMessage: sourcePropertyIds.length > 1 ?
                    '(' + sourcePropertyIds.length + ') properties have been ' + copyOrMove + ' to (' + targetRowIds.length + ') compute instances'
                    : '(1) property has been ' + copyOrMove + ' to  (' + targetRowIds.length + ') compute instances'
            };
        }
        return {
            updatedProject: this,
            errorMessages,
            displayMessage: ''
        };
    };

}
