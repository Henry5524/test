import {
    Box,
    Button,
    Dialog, DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    makeStyles,
    TextField,
    Typography,
} from '@material-ui/core';
import React, { useState } from 'react';
import { InventoryType, log } from '@utils';
import { useFormik } from 'formik';
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { colors, theme, GrayButton } from '../../styles';
import { VcioIcon } from '../controls/VcioIcon';
import { MoveGroup, NodeGroup, ProjectContainer } from '../../models/data';

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

interface AddGroupDialogProps {
    type: InventoryType;
    open: boolean;
    handleDialogClose: (arg0: boolean) => void;
    project: ProjectContainer;
    mutateProject: Function;
}

export const AddGroupDialog: React.FunctionComponent<AddGroupDialogProps> = (props: AddGroupDialogProps) => {

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
     * @param newGroupName
     */
    const validate = (newGroupName: string): ValidationMessage => {
        const msg: ValidationMessage = {
            error_message_1: '',
            error_message_2: ''
        };
        const newGroupNameLowerCase = newGroupName.toLowerCase();
        const existingGroups = (props.type === InventoryType.Application) ? props.project.roProjectWithData.apps : props.project.roProjectWithData.move_groups;
        _.forEach(existingGroups, (group: NodeGroup | MoveGroup) => {
            if (group.name.toLowerCase() === newGroupNameLowerCase) {
                msg.error_message_1 = `${props.type} with this name already exists.`;
                msg.error_message_2 = `Please select another name for the new ${props.type}.`;
                return false; // end loop
            }
            return true; // continue loop
        });
        return msg;
    };

    const handleNameChange = (_event: any) => {
        if (errorMsg.error_message_1 !== '') {
            // Error msg is showing, user changes text, need to get rid of error msg
            setErrorMsg(initialValidationMessage);
        }
    };

    /**
     * Close the dialog by invoking parent function - since dialog was launched by parent
     */
    const handleClose = () => {
        setErrorMsg(initialValidationMessage);
        formik.values.group_name = '';
        props.handleDialogClose(false);     // false indicates a group was not added, dialog was canceled.
    };

    /**
     * Updates the project in the SWR cache with our new application or new move group.
     * @param groupName     Name of the new group
     */
    const addGroup = (groupName: string) => {

        let newNode: NodeGroup | MoveGroup;
        if (props.type === InventoryType.Application) {
            newNode = new NodeGroup({
                id: uuidv4(),
                mgid: null,
                type: NodeGroup.TYPE_APP,
                name: groupName,
                node_ids: [],
                _disabled: null
            });
        } else if (props.type === InventoryType.MoveGroup) {
            newNode = new MoveGroup({
                id: uuidv4(),
                mgid: null,
                type: NodeGroup.TYPE_MOVEGROUP,
                name: groupName,
                node_ids: [],
                _disabled: null
            });
        } else {
            // Should not happen
            return;
        }
        const updatedProject:  ProjectContainer = new ProjectContainer(props.project.roProjectWithData);
        // Update the project with our new application or move group
        if (props.type === InventoryType.Application) {
            updatedProject.addApp(newNode);
        } else if (props.type === InventoryType.MoveGroup) {
            updatedProject.addMoveGroup(newNode as MoveGroup);
        }
        props.mutateProject(updatedProject, false).then();
    };


    /**
     * Validate and either show error messages or add the group.
     * @param values    The values from the form submit
     */
    const submitHandler = async (values: any) => {
        setErrorMsg(initialValidationMessage);
        log ('AddGroupDialog: submitHandler');
        const groupName: string = values.group_name.trim();
        const msg: ValidationMessage = validate(groupName);
        setErrorMsg(msg);
        if (msg.error_message_1 === '') {
            addGroup(groupName);
            formik.values.group_name = '';
            props.handleDialogClose(true);     // true indicates a group was added
        }
    };

    /**
     * Setup formik
     */
    const formik = useFormik({
        initialValues: {
            group_name: ''
        },
        onSubmit: (values) => submitHandler(values),
    });


    return (
        <>
            <Dialog
                data-cy="AddGroupDialog"
                open={props.open}
                classes={{ paper: classes.dialog }}
                maxWidth={false}
                onClose={handleClose}
                style={{ maxHeight: '100%' }}
            >
                <IconButton
                    data-cy="closeAddGroupBtn"
                    className={classes.closeBtn}
                    onClick={handleClose}
                >
                    <VcioIcon vcio="general-cross" iconColor={colors.blue_gray_500} height={16}/>
                </IconButton>
                <DialogTitle
                    data-cy="AddGroupDialogTitle"
                    id="group-dialog-title"
                    classes={{ root: classes.titleDiv }}
                >
                    {`Add New ${props.type}`}
                </DialogTitle>
                <form onSubmit={formik.handleSubmit}>
                    <DialogContent className={classes.dialogContent}>
                        <Grid container direction="column">
                            <Typography
                                data-cy="addGroupNameLabel"
                                className={classes.label}
                                gutterBottom
                            >
                                {props.type} Name
                            </Typography>
                            <TextField
                                data-cy="addGroupNameInput"
                                className={classes.text}
                                required
                                name="group_name"
                                autoComplete="off"
                                value={formik.values.group_name}
                                onChange={( e) => {formik.handleChange(e); handleNameChange(e); }}
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
                            data-cy="createGroupBtn"
                            type="submit"
                            autoFocus
                        >
                            Create
                        </Button>
                        <GrayButton
                            data-cy="cancelAddGroupBtn"
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

