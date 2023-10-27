import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, makeStyles, TextField, Typography } from '@material-ui/core';
import { CustomProperty, ProjectContainer } from '@models';
import { useFormik } from 'formik';
import _ from 'lodash';
import React, { useState } from 'react';
import { colors, GrayButton, theme } from '../../styles';
import { VcioIcon } from '../controls';

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
    label: {
        height: 20,
        fontFamily: 'Open Sans',
        fontSize: '14px',
        fontWeight: 'normal',
        fontStretch: 'normal',
        lineHeight: 1.43,
        fontStyle: 'normal',
        letterSpacing: 'normal',
        color: colors.black_90
    },
    text: {
        marginBottom: theme.spacing(2),
        borderRadius: 4,
        backgroundColor: colors.white_100,
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: colors.blue_gray_300
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
    dialogActions: {
        justifyContent: 'flex-start',
        padding: theme.spacing(5, 0, 10, 10)
    }
});

interface MyProps {
    open: boolean;
    name: string;   // The key of the selected custom property
    project: ProjectContainer;
    mutateProject: Function;
    handleDialogClose: Function;
    enableSave: Function;
}

export const AddCustomPropertyValueDialog: React.FunctionComponent<MyProps> = (props: MyProps) => {

    const classes = useStyles();

    type ValidationMessage = {
        error_message_1: string;
        error_message_2: string;
    };
    const initialValidationMessage: ValidationMessage = {
        error_message_1: '',
        error_message_2: ''
    };

    const [errorMsg, setErrorMsg] = useState(initialValidationMessage);

    /**
     * Validates the new group name - makes sure it is not already used.
     * @param newCustomPropertyValue
     */
    const validate = (newCustomPropertyValue: string): ValidationMessage => {
        const msg: ValidationMessage = {
            error_message_1: '',
            error_message_2: ''
        };

        // Find the custom property in existing custom properties
        const cp: CustomProperty | undefined = _.find(props.project.roProjectWithData.custom_node_props, { name: props.name });

        if (cp) {
            _.forEach(cp.str_values, (val: string) => {
                if (val.toLowerCase() === newCustomPropertyValue.toLowerCase()) {
                    msg.error_message_1 = 'Value already exists for this custom property';
                    msg.error_message_2 = 'Please enter a different value';
                    return false; // end loop
                }
                return true; // continue loop
            });

            if (msg.error_message_1 !== '') {
                return msg;
            }
        }

        return msg;
    };

    const handleValueChange = (_event: any) => {
        if (errorMsg.error_message_1 !== '') {
            // Error msg is showing, user changes text, need to get rid of error msg
            setErrorMsg(initialValidationMessage);
        }
    };

    /**
     * User added a new value, add the new value to the project.custom_node_props for the currently selected
     * custom property.
     */
    const handleNewCustomPropertyValue = (newValue: string): void => {
        const updatedProject: ProjectContainer = new ProjectContainer(props.project.roProjectWithData);
        updatedProject.addCustomNodeProp(props.name, newValue);
        props.mutateProject(updatedProject, false).then();
        props.enableSave(true);     // enable save and undo buttons
    };

    /**
     * Close the dialog by invoking parent function - since dialog was launched by parent
     */
    const handleClose = () => {
        setErrorMsg(initialValidationMessage);
        formik.values.custom_property_value = '';
        props.handleDialogClose();
    };

    /**
     * Hand the new value back to ListPanel
     * @param newValue  The new value for the custom property.
     */
    const addCustomPropertyValue = (newValue: string) => {
        handleNewCustomPropertyValue(newValue);
    };


    /**
     * Validate and either show error messages or add the custom property value.
     * @param values    The values from the form submit
     */
    const submitHandler = async (values: any) => {
        setErrorMsg(initialValidationMessage);
        const newValue: string = values.custom_property_value.trim();
        const msg: ValidationMessage = validate(newValue);
        setErrorMsg(msg);
        if (msg.error_message_1 === '') {
            addCustomPropertyValue(newValue);
            formik.values.custom_property_value = '';
            props.handleDialogClose();
        }
    };

    /**
     * Setup formik
     */
    const formik = useFormik({
        initialValues: {
            custom_property_value: ''
        },
        onSubmit: (values) => submitHandler(values),
    });


    return (
        <>
            <Dialog
                data-cy="AddCustomPropertyDialog"
                open={props.open}
                classes={{ paper: classes.dialog }}
                maxWidth={false}
                onClose={handleClose}
                style={{ maxHeight: '100%' }}
            >
                <IconButton
                    data-cy="closeAddCustomPropertyBtn"
                    className={classes.closeBtn}
                    onClick={handleClose}
                >
                    <VcioIcon vcio="general-cross" iconColor={colors.blue_gray_500} height={16}/>
                </IconButton>
                <DialogTitle
                    data-cy="AddCustomPropertyDialogTitle"
                    id="custom-property-dialog-title"
                    classes={{ root: classes.titleDiv }}
                >
                    Add New Custom Property Value
                </DialogTitle>
                <form onSubmit={formik.handleSubmit}>
                    <DialogContent className={classes.dialogContent}>
                        <Grid container direction="column">
                            <Typography
                                data-cy="addCustomPropertyValueLabel"
                                className={classes.label}
                                gutterBottom
                            >
                                Custom Property Value
                            </Typography>
                            <TextField
                                data-cy="addCustomPropertyValueInput"
                                className={classes.text}
                                required
                                name="custom_property_value"
                                autoComplete="off"
                                value={formik.values.custom_property_value}
                                onChange={(e) => {
                                    formik.handleChange(e);
                                    handleValueChange(e);
                                }}
                            />
                            {
                                !!errorMsg.error_message_1 &&
                                <Box className={classes.errorText}>
                                    {errorMsg.error_message_1}
                                </Box>
                            }
                            {
                                !!errorMsg.error_message_2 &&
                                <Box className={classes.errorText}>
                                    {errorMsg.error_message_2}
                                </Box>
                            }
                        </Grid>
                    </DialogContent>
                    <DialogActions className={classes.dialogActions}>
                        <Button
                            data-cy="createCustomPropertyValueBtn"
                            type="submit"
                            autoFocus
                        >
                            Create
                        </Button>
                        <GrayButton
                            data-cy="cancelCreateCustomPropertyValueBtn"
                            onClick={handleClose}
                            size="small"
                        >
                            Cancel
                        </GrayButton>
                    </DialogActions>
                </form>
            </Dialog>
        </>
    );
};

