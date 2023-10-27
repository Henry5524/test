import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, makeStyles, TextField, Typography } from '@material-ui/core';
import { Autocomplete, createFilterOptions } from '@material-ui/lab';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CustomProperty, NetworkNode, ProjectContainer } from '../../models';
import { colors, GrayButton, text, theme } from '../../styles';
import { VcioIcon } from '../controls';

const useStyles = makeStyles({
    dialog: {
        minWidth: 600,
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
        height: 16,
        width: 20
    },
    removeBtn: {
        padding: theme.spacing(1, 0.5, 1.5, 0),
        height: 16,
        width: 20
    },
    dialogContent: {
        padding: theme.spacing(0, 10, 0, 10)
    },
    titleDiv: {
        // titleDiv is used to override the styles for the root of the DialogTitle
        padding: theme.spacing(3, 0, 2, 10),
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
        padding: theme.spacing(14, 10, 10, 10),
        '&.MuiDialogActions-spacing > :last-child': {
            // Slides the last button to the right, and styles it per the mock
            marginLeft: 'auto',
            color: colors.black_90,
            borderRadius: 4,
            borderStyle: 'solid',
            borderWidth: 1,
            borderColor: colors.blue_gray_200,
            backgroundColor: colors.white_100
        }
    },
    label: {
        ...text.regularText,
        marginTop: theme.spacing(5.5),
        color: colors.black_100
    },
    remove: {
        marginLeft: 'auto',
        marginTop: theme.spacing(5),
        padding: theme.spacing(0, 2, 0, 0),
        color: colors.green_600
    },
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
    menuItem: {
        height: 38
    },
    menuItemTextUnselected: {
        ...text.regularText,
        color: colors.black_50
    },
    menuItemText: {
        ...text.regularText,
        color: colors.black_90
    },
    select: {
        borderRadius: 4,
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: colors.blue_gray_300,
        padding: theme.spacing(1.5, 3, 1.5, 3),
        height: 32
    },
    checkbox: {
        marginLeft: 'auto',
        height: '16px',
        padding: theme.spacing(0, 1, 0, 0),
        marginTop: theme.spacing(5.5),
        marginRight: theme.spacing(0)
    },
    checkboxText: {
        ...text.smallText,
        color: colors.black_70,
        marginTop: theme.spacing(5.5),
        marginLeft: theme.spacing(0)
    },
    currentlySetToText: {
        ...text.smallText,
        color: colors.black_70,
        marginTop: theme.spacing(1)
    },
    explanationText: {
        marginLeft: theme.spacing(10),
        ...text.regularText,
        color: colors.black_70
    },
    bottom: {
        visibility: 'hidden',
        height: '0px'
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
    },
});

type CustomPropertyWithChoices = {
    name: string;           // The id, bad variable name, but same as the variable name used in the API
    title: string;          // The text displayed to the user as the custom property name
    titleLowercase: string;
    choices: string[];
    valuesFromSelectedRows: string;
};

type ExistingCpFormData = {
    name: string;           // The id, bad variable name, but same as the variable name used in the API
    title: string;          // The text displayed to the user as the custom property name
    clean: boolean;         // The text displayed to the user
    selectedValue: string;  // The value the user provides from the dialog form field, initially populated with 'Do not change'
};

type NewCpFormData = {
    name: string;           // The id, bad variable name, but same as the variable name used in the API
    title: string;          // The text displayed to the user as the custom property name
    value: string;
    removed: boolean;
    index: number;
    errorMessage: string;
};

const DO_NOT_CHANGE = 'Do not change';


const initializeExistingCpsFormData = (customProperties: CustomProperty[]): ExistingCpFormData [] => {
    const result: ExistingCpFormData [] = [];
    _.forEach(customProperties, (cp) => {
        result.push(
            {
                name: cp.name,
                title: cp.title ? cp.title : '',
                clean: false,
                selectedValue: DO_NOT_CHANGE
            }
        );
    });
    return result;
};


interface MyProps {
    open: boolean;
    closeDialog: Function;
    selectedRows: NetworkNode[] | any[];
    project: ProjectContainer;
    mutateProject: Function;
    enableSave: Function;
    applyNewCustomProperties: Function;
}

export const CustomPropertiesDialog: React.FunctionComponent<MyProps> = (props: MyProps) => {

    const classes = useStyles();
    const [changed, setChanged] = useState(false);
    const [existingCpsFormData, setExistingCpsFormData] = useState(initializeExistingCpsFormData(props.project.roProjectWithData.custom_node_props));
    const [newCpsFormData, setNewCpsFormData] = useState<NewCpFormData[]>([]);
    const [scrollToBottom, setScrollToBottom] = useState(false);


    useEffect(() => {
        if (scrollToBottom) {
            setScrollToBottom(false);
            const bottom = document.querySelector('#bottom');
            if (bottom) {
                bottom.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [scrollToBottom]);


    if (!props.open) {
        return (<></>);
    }

    const handleDialogClose = () => {
        setExistingCpsFormData(initializeExistingCpsFormData(props.project.roProjectWithData.custom_node_props));
        setNewCpsFormData([]);
        props.closeDialog();
    };

    const handleExistingSelectChange = (event: any, name: string) => {
        const clonedExistingCpsFormData = _.cloneDeep(existingCpsFormData);
        const existingCpFormData: ExistingCpFormData | undefined = _.find(clonedExistingCpsFormData, { name });
        if (existingCpFormData) {
            existingCpFormData.selectedValue = event.currentTarget.outerText === '' ? DO_NOT_CHANGE : event.currentTarget.outerText;
            setExistingCpsFormData(clonedExistingCpsFormData);
            setChanged(true);
        }
    };

    /**
     * Handles typed text in an existing custom property value field
     */
    const handleExistingInputChange = (event: any, name: string, value: string, reason: string) => {

        if (event === null || reason !== 'input') {
            return;
        }

        const clonedExistingCpsFormData = _.cloneDeep(existingCpsFormData);
        const existingCpFormData: ExistingCpFormData | undefined = _.find(clonedExistingCpsFormData, { name });
        if (existingCpFormData) {
            existingCpFormData.selectedValue = value;
            setExistingCpsFormData(clonedExistingCpsFormData);
            setChanged(true);
        }
    };

    /**
     * Handles selected text in an existing custom property value field
     */
    const handleCheckboxChange = (event: any, name: string) => {
        const clonedExistingCpsFormData = _.cloneDeep(existingCpsFormData);
        const existingCpFormData: ExistingCpFormData | undefined = _.find(clonedExistingCpsFormData, { name });
        if (existingCpFormData) {
            existingCpFormData.clean = event.target.checked;
            setExistingCpsFormData(clonedExistingCpsFormData);
            setChanged(true);
        }
    };


    const getSelectedValue = (name: string): string => {
        const existingCpFormData: ExistingCpFormData | undefined = _.find(existingCpsFormData, { name });
        if (existingCpFormData) {
            return existingCpFormData.selectedValue;
        }
        return DO_NOT_CHANGE;
    };

    const getCheckboxValue = (name: string): boolean => {
        const existingCpFormData: ExistingCpFormData | undefined = _.find(existingCpsFormData, { name });
        if (existingCpFormData) {
            return existingCpFormData.clean;
        }
        return false;
    };


    /**
     * Adds a new custom property so it will be shown in a new grid row.  Note that we supply a uuid as the id in
     * the name field. (Remember that the name field holds an id, not a name.  It was badly named in the API, we kept
     * it badly consistent here.
     * If the user supplies a title and value, and the page is saved, the backend will modify the
     * name in the project - replacing our uuid with a shorter string to be used as the id.
     */
    const addCustomPropertyField = () => {
        const clonedNewCpsFormData: NewCpFormData[] = _.cloneDeep(newCpsFormData);
        const idx = clonedNewCpsFormData.length;
        clonedNewCpsFormData.push({
            name: uuidv4(),
            title: '',
            value: '',
            removed: false,
            index: idx,
            errorMessage: ''
        });
        setNewCpsFormData(clonedNewCpsFormData);
        setScrollToBottom(true);
    };

    const applyChanges = () => {

        if (!changed) {
            props.closeDialog();
            setExistingCpsFormData(initializeExistingCpsFormData(props.project.roProjectWithData.custom_node_props));
            setNewCpsFormData([]);
            return;
        }

        let changedProject: boolean = false;
        let changedExistingCpsFormData: boolean = false;
        let selectedNodeIndex: number = -1;
        const clonedExistingCpFormData: ExistingCpFormData[] = _.cloneDeep(existingCpsFormData);
        const updatedProject: ProjectContainer = new ProjectContainer(props.project.roProjectWithData);

        // Loop thru each selected node (a.k.a. device or compute instance)
        _.forEach(props.selectedRows, (row) => {
            selectedNodeIndex++;
            const result: {
                rowChangedProject: boolean;
                rowChangedExistingCpsFormData: boolean;
            } = updatedProject.adjustCustomProperties(row, selectedNodeIndex, clonedExistingCpFormData, newCpsFormData);
            changedProject = result.rowChangedProject || changedProject;
            changedExistingCpsFormData = result.rowChangedExistingCpsFormData || changedExistingCpsFormData;
        }); // End loop thru each selected node (a.k.a. device or compute instance)

        // InventoryDevice needs to update a private map with new custom properties
        if (newCpsFormData.length > 0) {
            props.applyNewCustomProperties(newCpsFormData);
        }

        if (changedExistingCpsFormData) {
            // Reset clean flag for each previously existing custom property - we would have performed the clean above
            _.forEach(clonedExistingCpFormData, (e: ExistingCpFormData) => {
                e.clean = false;
            });
            setExistingCpsFormData(clonedExistingCpFormData);
        }
        if (changedProject) {
            // Clear out the new custom property data structure, anything new is now considered existing
            setNewCpsFormData([]);
            // Mutate the project in swr cache with our changes.  Since project is a property, will cause us to
            // re-render, showing the changes in the UI.
            props.mutateProject(updatedProject, false).then();
            // Tell Inventory.tsx that we changed something so that the Save/Undo buttons are enabled.
            props.enableSave(true);
        }
        props.closeDialog();
    };

    /**
     * For the custom property id, gets the set of custom property values found on all the selected compute instances.
     * @param name  The id, bad variable name, but same as the variable name used in the API
     */
    const getCustomPropertyValuesForSelectedNodes = (name: string) => {

        const foundValues: string[] = [];

        _.forEach(props.selectedRows, (row) => {
            const node = _.find(props.project.roProjectWithData.nodes, { id: row.id });   // ToDo: Try with Dales project map
            if (node) {
                if (node.custom_props) {
                    if (node.custom_props[name]) {
                        foundValues.push(node.custom_props[name]);
                    }
                }
            }
        });
        return [...new Set(foundValues)].sort();
    };

    /**
     * Does the title already exist in either the existing custom properties or the new custom properties array?
     * @param title The user readable name of the custom property
     * @param name  The key
     */
    const isDuplicateTitle = (title: string, name: string) => {

        const lcTitle = title.trim().toLowerCase();

        const existing: ExistingCpFormData | undefined = _.find(existingCpsFormData, (e: ExistingCpFormData) => {
            return e.title.trim().toLowerCase() === lcTitle;
        });
        if (existing && existing.name !== name) {
            return true;
        }

        const newCp: NewCpFormData | undefined = _.find(newCpsFormData, (n: NewCpFormData) => {
            return n.title.trim().toLowerCase() === lcTitle;
        });
        if (newCp && newCp.name !== name) {
            return true;
        }

        return false;
    };

    /**
     * Echoes typing in the New custom property title field back to the dialog
     */
    const handleNewPropertyTitleChange = (event: any, name: string) => {
        const clonedNewCpsFormData: NewCpFormData[] | null = _.cloneDeep(newCpsFormData);
        const newCpFormData: NewCpFormData | undefined = _.find(clonedNewCpsFormData, { name });
        if (newCpFormData) {
            newCpFormData.title = event.target.value;
            setNewCpsFormData(clonedNewCpsFormData);
        }
    };

    /**
     * When leave the new custom property title field, checks for duplicates
     */
    const handleNewPropertyTitleBlur = (event: any, name: string) => {

        const clonedNewCpsFormData: NewCpFormData[] | null = _.cloneDeep(newCpsFormData);
        const newCpFormData: NewCpFormData | undefined = _.find(clonedNewCpsFormData, { name });

        // Check for duplicate
        if (isDuplicateTitle(event.target.value, name)) {
            if (newCpFormData) {
                newCpFormData.title = event.target.value;
                newCpFormData.errorMessage = 'Property with this name already exists.  Please make sure the name is unique.';
                setNewCpsFormData(clonedNewCpsFormData);
            }
            return;
        }

        if (newCpFormData) {
            newCpFormData.title = event.target.value;
            newCpFormData.errorMessage = '';
            setNewCpsFormData(clonedNewCpsFormData);
            setChanged(true);
        }
    };

    const handleNewPropertyValueChange = (event: any, name: string) => {
        const clonedNewCpsFormData: NewCpFormData[] | null = _.cloneDeep(newCpsFormData);
        const newCpFormData: NewCpFormData | undefined = _.find(clonedNewCpsFormData, { name });
        if (newCpFormData) {
            newCpFormData.value = event.target.value;
            setNewCpsFormData(clonedNewCpsFormData);
            setChanged(true);
        }
    };

    /**
     * User added a new custom property, then decided to remove it.  Removes the New Property from the dialog.
     * @param name  The id, bad variable name, but same as the variable name used in the API
     */
    const removeNewCustomProperty = (name: string) => {
        const clonedNewCpsFormData: NewCpFormData[] | null = _.cloneDeep(newCpsFormData);
        const newCpFormData: NewCpFormData | undefined = _.find(clonedNewCpsFormData, { name });
        if (newCpFormData) {
            newCpFormData.removed = true;     // logically remove
        }
        setNewCpsFormData(clonedNewCpsFormData);
    };

    const buildAutoCompleteField = (cp: CustomPropertyWithChoices) => {

        const filter = createFilterOptions();
        const currentValue: string = getSelectedValue(cp.name);

        return (
            <Autocomplete
                id={'autoComplete-' + cp.name}
                key={'autoComplete-' + cp.name}
                value={currentValue}
                selectOnFocus
                handleHomeEndKeys
                options={cp.choices}
                freeSolo
                filterOptions={(options: string[], params: any): any => {
                    return filter(options, params);
                }}
                getOptionLabel={(choice: string) => {
                    return choice;
                }}
                renderOption={(choice: string) => {
                    return choice;
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        id={'textField-' + cp.name}
                        key={'textField-' + cp.name}
                        variant="outlined"
                        size="small"
                    />
                )}
                onChange={(e: any, _value: any) => {
                    handleExistingSelectChange(e, cp.name);
                }}
                onInputChange={(e: any, value: any, reason: string) => {
                    handleExistingInputChange(e, cp.name, value, reason);
                }}
            />
        );
    };

    /**
     * Gets the core content for the dialog
     */
    const getDialogContent = (): JSX.Element => {

        const customPropertiesWithChoices: CustomPropertyWithChoices[] = [];

        let choices: string[];

        _.forEach(props.project.roProjectWithData.custom_node_props, (cp: CustomProperty) => {
            choices = [];
            choices.push(DO_NOT_CHANGE);
            if (cp.title && cp.str_values) {
                _.forEach(cp.str_values, (v: string) => {
                    choices.push(v);
                });

                const distinctFoundValues: string[] = getCustomPropertyValuesForSelectedNodes(cp.name);
                const distinctFoundValuesText: string = distinctFoundValues.join(', ');
                customPropertiesWithChoices.push({
                    name: cp.name,
                    title: cp.title,
                    titleLowercase: cp.title.trim().toLowerCase(),
                    choices,
                    valuesFromSelectedRows: distinctFoundValuesText
                });
            }

        });

        const sortedCustomPropertiesWithChoices: CustomPropertyWithChoices[] = _.orderBy(customPropertiesWithChoices, ['titleLowercase']);


        const existingFormFields: any[] = [];

        // Build a combo box for each custom property
        _.forEach(sortedCustomPropertiesWithChoices, (cp) => {

            const autoCompleteField = buildAutoCompleteField(cp);
            existingFormFields.push(
                <Grid container direction="column" key={`gridColumn-${cp.name}`}>
                    <Grid container direction="row" key={`gridRow-${cp.name}`}>
                        <Typography
                            key={`customPropertyTitle-${cp.name}`}
                            data-cy="customPropertyTitle"
                            className={classes.label}
                            gutterBottom
                        >
                            {cp.title}
                        </Typography>
                        <Checkbox
                            key={`customPropertyClean-${cp.name}`}
                            data-cy="customPropertyClean"
                            name="okToDelete"
                            size="small"
                            className={classes.checkbox}
                            checked={getCheckboxValue(cp.name)}
                            onChange={(e: any) => {
                                handleCheckboxChange(e, cp.name);
                            }}
                        />
                        <Typography
                            key={`customPropertyCleanText-${cp.name}`}
                            data-cy="customPropertyCleanText"
                            className={classes.checkboxText}
                            gutterBottom
                        >
                            Clean current value(s)
                        </Typography>
                    </Grid>
                    {autoCompleteField}
                    <Typography
                        key={`customPropertySetToText-${cp.name}`}
                        data-cy="customPropertySetToText"
                        className={classes.currentlySetToText}
                        gutterBottom
                    >
                        Currently set to {cp.valuesFromSelectedRows || 'nothing'}
                    </Typography>
                </Grid>
            );
        });

        // Build two text fields for each new custom property

        const newFormFields: any[] = [];
        _.forEach(newCpsFormData, (newCpFormData: NewCpFormData) => {
            if (!newCpFormData.removed) {
                newFormFields.push(
                    <Grid container direction="column" key={`gridColumn-${newCpFormData.name}`}>
                        <Grid container direction="row" key={`gridRow-${newCpFormData.name}`}>
                            <Typography
                                key={`newPropertyText-${newCpFormData.name}`}
                                data-cy="newPropertyText"
                                className={classes.label}
                                gutterBottom
                            >
                                New Property
                            </Typography>
                            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
                            <span
                                key={`removeSpan-${newCpFormData.name}`}
                                className={classes.remove}
                                onClick={() => {
                                    removeNewCustomProperty(newCpFormData.name);
                                }}
                            >
                                <IconButton
                                    key={`removeIcon-${newCpFormData.name}`}
                                    data-cy="removeIcon"
                                    className={classes.removeBtn}
                                >
                                    <VcioIcon vcio="general-cross" iconColor={colors.blue_gray_500} height={16} key={`generalCrossIcon-${newCpFormData.name}`}/>
                                </IconButton>
                                Remove
                            </span>
                        </Grid>
                        <TextField
                            key={`newPropertyTitle-${newCpFormData.name}`}
                            data-cy="newPropertyTitle"
                            size="small"
                            placeholder="Specify a unique name for new property"
                            required
                            name={`newPropertyTitle-${newCpFormData.name}`}
                            autoComplete="off"
                            value={newCpFormData.title}
                            onChange={(e) => {
                                handleNewPropertyTitleChange(e, newCpFormData.name);
                            }}
                            onBlur={(e) => {
                                handleNewPropertyTitleBlur(e, newCpFormData.name);
                            }}
                        />
                        <TextField
                            key={`newPropertyValue-${newCpFormData.name}`}
                            data-cy="newPropertyValue"
                            size="small"
                            style={{ marginTop: '5px' }}
                            placeholder="Enter a value"
                            required
                            name={`newPropertyValue-${newCpFormData.name}`}
                            autoComplete="off"
                            value={newCpFormData.value}
                            onChange={(e) => {
                                handleNewPropertyValueChange(e, newCpFormData.name);
                            }}
                        />
                        {
                            newCpFormData.errorMessage !== '' &&
                            <Box key={`newPropertyErrorMessage-${newCpFormData.name}`} className={classes.errorText}>
                                {newCpFormData.errorMessage}
                            </Box>
                        }
                    </Grid>
                );
            }
        });

        return (
            <>
                <form>
                    {existingFormFields}
                    {newFormFields}
                </form>
                <div
                    id="bottom"
                    className={classes.bottom}
                />
            </>
        );

    }; // getDialogContent

    const dialogTitle: string = 'Set Custom Properties for ' +
        props.selectedRows.length + ' Compute ' +
        ((props.selectedRows.length > 1) ? 'Instances' : 'Instance');

    return (
        <>
            <Dialog
                data-cy="SCPDialog"
                open={props.open}
                classes={{ paper: classes.dialog }}
                maxWidth={false}
                onClose={handleDialogClose}
                style={{ maxHeight: '100%' }}
            >
                <IconButton
                    key="closeSCPBtn"
                    data-cy="closeSCPBtn"
                    className={classes.closeBtn}
                    onClick={handleDialogClose}
                >
                    <VcioIcon vcio="general-cross" iconColor={colors.blue_gray_500} height={16}/>
                </IconButton>
                <DialogTitle
                    data-cy="SCPDialogTitle"
                    id="mcp-dialog-title"
                    classes={{ root: classes.titleDiv }}
                >
                    {dialogTitle}
                </DialogTitle>
                <Box className={classes.explanationText}>
                    Values entered below will overwrite current properties of the compute instances
                </Box>
                <DialogContent className={classes.dialogContent}>
                    {getDialogContent()}
                </DialogContent>
                <DialogActions className={classes.dialogActions}>
                    <Button
                        key="applySCPBtn"
                        data-cy="applySCPBtn"
                        type="submit"
                        autoFocus
                        disabled={!changed}
                        onClick={applyChanges}
                    >
                        Apply
                    </Button>
                    <GrayButton
                        key="cancelSCPBtn"
                        data-cy="cancelSCPBtn"
                        onClick={handleDialogClose}
                        size="small"
                    >
                        Cancel
                    </GrayButton>
                    <Button
                        key="addCustomProperty"
                        data-cy="addCustomProperty"
                        size="small"
                        variant="outlined"
                        startIcon={<VcioIcon className='vcio-general-plus-circle' iconColor={colors.green_500}/>}
                        onClick={addCustomPropertyField}
                    >
                        Add Custom Property
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

