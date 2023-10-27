import { Button, CardProps, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, makeStyles, Typography, } from '@material-ui/core';
import { useFormik } from 'formik';
import { produce } from 'immer';
import _ from 'lodash';
import { useSnackbar } from 'notistack';
import React, { useContext, useState } from 'react';
import { mutate } from 'swr';
import { config } from '../../config';
import { AppContext } from '../../context';
import { Project } from '../../models';
import { colors, theme } from '../../styles';
import { ShowToast } from '../../utils';
import { VcioIcon } from '../controls';

interface ProjectDeleteDialogProps extends CardProps {
    project: Project;
    deleteProjectOpen: boolean;
    handleDeleteProjectClose: any;
}

const useStyles = makeStyles({
    dialog: {
        width: 611,
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
        padding: theme.spacing(4),
    },
    dialogActions: {
        justifyContent: 'flex-start',
        paddingLeft: 0,
        paddingRight: 0,
        paddingBottom: theme.spacing(6),
    },
    title: {
        width: '100%',
        fontSize: 22,
        fontWeight: 300,
        fontStyle: 'normal',
        letterSpacing: 0,
        color: colors.black_90
    },
    confirmText: {
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        letterSpacing: 0,
        color: colors.black_90,
        marginBottom: 20,
        marginLeft: 7,
    },
    undoneText: {
        height: 20,
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        letterSpacing: 0,
        color: colors.black_90,
        marginLeft: 27,
        marginBottom: 56,
    },
    checkboxText: {
        height: 40,
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        letterSpacing: 0,
        color: colors.black_90,
        marginLeft: 17,
        marginBottom: 46,
    },
    deleteButton: {
        border: '1px solid ' + colors.red_600,
        padding: '3px 12px',
        marginRight: 5,
        color: colors.red_600,
        '&:disabled': {
            color: colors.red_500,
            border: '1px solid ' + colors.red_50,
        },
        '&:hover': {
            backgroundColor: colors.red_50,
            color: colors.red_600,
            border: '1px solid ' + colors.red_600,
        }
    }
});

export const ProjectDeleteDialog: React.FunctionComponent<ProjectDeleteDialogProps> = (props) => {
    const { children, className, project, deleteProjectOpen, handleDeleteProjectClose, ...other } = props;
    const classes = useStyles();
    const appContext = useContext(AppContext);
    const { enqueueSnackbar } = useSnackbar();

    const [deleteButtonDisabled, setDeleteButtonDisabled] = useState(true);

    const deleteProjectHandler = async (projectId: string) => {
        // in this mutate call we will optimistically update the UI
        mutate('getProjects', produce(projectsDataToMutate => {
            _.remove(projectsDataToMutate, function (projectToMutate: Project) {
                return projectToMutate.id === projectId;
            });
        }), false);

        await fetch(config.api_base_url + '/objects', {
            method: 'DELETE',
            body: JSON.stringify([projectId]),
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(response => {
            if (response.status === 204) {
                ShowToast('Project was deleted', appContext, enqueueSnackbar, 'success');
            } else {
                ShowToast('Delete error (status => ' + response.status + ')', appContext, enqueueSnackbar, 'error');
            }
        });
    };

    const formik = useFormik({
        initialValues: {},
        onSubmit: () => {
            handleClose();

            deleteProjectHandler(project.id).then(() => {

            });
        },
    });

    const handleClose = () => {
        handleDeleteProjectClose();
    };

    const handleEnter = () => {
        setDeleteButtonDisabled(true);
    };

    return (
        <Dialog
            data-cy="deleteProjectWindow"
            classes={{ paper: classes.dialog }}
            onClose={handleClose}
            onEnter={handleEnter}
            aria-labelledby="customized-dialog-title"
            open={deleteProjectOpen}
            {...other}
        >
            <DialogTitle
                data-cy="deleteProjectWindowTitle"
                id="customized-dialog-title"
                className={classes.title}
            >
                Delete Project
                <IconButton
                    data-cy="deleteProjectButton"
                    onClick={handleClose}
                    style={{ marginRight: -15, marginTop: -10, float: 'right' }}
                >
                    <VcioIcon vcio="general-cross" iconColor={colors.blue_gray_500}/>
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <form onSubmit={formik.handleSubmit}>
                    <Grid container direction="column">
                        <Grid container direction="row">
                            <VcioIcon vcio="status-alarm" iconColor={colors.red_500} rem={1.2} style={{ marginTop: 1 }}/>
                            <Typography
                                data-cy="deleteProjectText"
                                className={classes.confirmText}
                                gutterBottom
                            >
                                Please confirm you want to delete project <b>{project.project_name}, {project.project_instance}</b>
                            </Typography>
                        </Grid>
                        <Typography
                            data-cy="deleteProjectWarningText"
                            className={classes.undoneText}
                            gutterBottom
                        >
                            This action cannot be undone. If you decide to recreate this project later, you will need to start from scratch.
                        </Typography>
                        <Typography
                            data-cy="deleteProjectConfirmText"
                            className={classes.checkboxText}
                            gutterBottom
                        >
                            <Checkbox
                                data-cy="deleteProjectConfirmCheckbox"
                                name="okToDelete"
                                style={{ marginBottom: 3, color: colors.red_500 }}
                                onChange={(event) => {
                                    setDeleteButtonDisabled(!event.target.checked);
                                }}
                            />
                            Yes, delete project <b>{project.project_name}, {project.project_instance}</b> and all its data
                        </Typography>
                    </Grid>
                    <DialogActions className={classes.dialogActions}>
                        <Button
                            data-cy="deleteProjectSubmitButton"
                            type="submit"
                            variant="outlined"
                            autoFocus
                            disabled={deleteButtonDisabled}
                            classes={{
                                outlined: classes.deleteButton,
                            }}
                            startIcon={<VcioIcon vcio="general-trash-outline" iconColor={colors.red_500}/>}
                        >
                            Delete Project
                        </Button>
                        <Button
                            data-cy="deleteProjectCancelButton"
                            size="small"
                            variant="outlined"
                            onClick={handleClose}
                        >
                            Cancel
                        </Button>
                    </DialogActions>
                </form>
            </DialogContent>
        </Dialog>
    );
};
