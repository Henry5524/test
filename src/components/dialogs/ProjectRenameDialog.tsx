import { Button, CardProps, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, makeStyles, TextField, Typography } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { useFormik } from 'formik';
import { produce } from 'immer';
import _ from 'lodash';
import { useSnackbar } from 'notistack';
import React, { useContext } from 'react';
import { mutate } from 'swr';
import { config } from '../../config';
import { AppContext } from '../../context';
import { Project, ProjectContainer } from '../../models/data';
import { useProject } from '../../services';
import { colors, theme } from '../../styles';
import { ShowToast } from '../../utils';
import { VcioIcon } from '../controls/VcioIcon';

interface ProjectRenameDialogProps extends CardProps {
    project: Project;
    renameProjectOpen: boolean;
    handleRenameProjectClose: any;
    projectNames: string[];
}

const useStyles = makeStyles({
    dialog: {
        width: 558,
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
    label: {
        height: 20,
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        letterSpacing: 0,
        color: colors.black_90
    },
    text: {
        marginBottom: theme.spacing(6),
        borderRadius: 4,
        backgroundColor: colors.white_100,
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: colors.blue_gray_300
    },
    inputLabel: {
        borderRadius: 4,
        backgroundColor: colors.blue_gray_40,
        borderWidth: 1,
        fontSize: 14,
        fontWeight: 'normal',
        color: colors.blue_gray_500
    },
    autocompletePaper: {
        width: 478,
        marginLeft: -1,
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
        borderColor: colors.blue_gray_200
    },
    autocompleteListbox: {
        height: 230,
    },
});

export const ProjectRenameDialog: React.FunctionComponent<ProjectRenameDialogProps> = (props) => {
    const appContext = useContext(AppContext);
    const { children, className, project, projectNames, renameProjectOpen, handleRenameProjectClose, ...other } = props;
    const classes = useStyles();
    const { enqueueSnackbar } = useSnackbar();

    // lets get the full project data since we need all the data before updating
    const { data: fullProject } = useProject(project.id as string);

    const renameProjectHandler = async (name: string, instance: string) => {
        if (!fullProject) {
            return;
        }
        const updatedProject: ProjectContainer = new ProjectContainer(fullProject.roProjectWithData);

        updatedProject.updateProjectName(name);
        updatedProject.updateProjectInstance(instance);

        // in this mutate call we will optimistically update the UI
        await mutate('getProjects', produce(projectsDataToMutate => {
            const projectToRename = _.find(projectsDataToMutate, { id: project.id });
            projectToRename.project_name = name;
            projectToRename.project_instance = instance;
        }), false);

        await fetch(config.api_base_url + '/objects/' + project.id, {
            method: 'PUT',
            body: JSON.stringify(updatedProject.roProjectWithData),
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(response => {
            if (response.status === 204) {
                ShowToast('Project was updated', appContext, enqueueSnackbar, 'success');
            } else {
                ShowToast('Update error (status => ' + response.status + ')', appContext, enqueueSnackbar, 'error');
            }
        });
    };

    const formik = useFormik({
        // enableReinitialize: true,
        initialValues: {
            project_name: project.project_name,
            project_instance: project.project_instance,
        },
        onSubmit: values => {
            handleClose();

            // pause swr from re-validating projects data
            appContext.setShouldFetchProjectsData(false);

            renameProjectHandler(values.project_name, values.project_instance).then(() => {
                formik.values.project_name = '';
                formik.values.project_instance = '';

                // resume swr from re-validating projects data
                appContext.setShouldFetchProjectsData(true);
            });
        },
    });

    const handleEnter = () => {
        formik.values.project_name = project.project_name;
        formik.values.project_instance = project.project_instance;
    };

    const handleClose = () => {
        handleRenameProjectClose();
    };

    return (
        <Dialog
            data-cy="renameProjectWindow"
            classes={{ paper: classes.dialog }}
            onClose={handleClose}
            onEnter={handleEnter}
            aria-labelledby="customized-dialog-title"
            open={renameProjectOpen}
            {...other}
        >
            <DialogTitle
                data-cy="renameProjectWindowTitle"
                id="customized-dialog-title"
                className={classes.title}
            >
                Edit Project Name
                <IconButton
                    data-cy="renameProjectButton"
                    onClick={handleClose}
                    style={{ marginRight: -15, marginTop: -10, float: 'right' }}
                >
                    <VcioIcon vcio="general-cross" iconColor={colors.blue_gray_500}/>
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <form onSubmit={formik.handleSubmit}>
                    <Grid container direction="column">
                        <Typography
                            data-cy="renameProjectNameLabel"
                            className={classes.label}
                            gutterBottom
                        >
                            Project Name
                        </Typography>
                        <Autocomplete
                            data-cy="renameProjectNameInput"
                            className={classes.text}
                            classes={{
                                paper: classes.autocompletePaper,
                                listbox: classes.autocompleteListbox,
                            }}
                            options={projectNames}
                            renderInput={(params) => <TextField {...params} placeholder="Project Name" variant="outlined"/>}
                            size="small"
                            freeSolo={true}
                            openOnFocus={true}
                            value={formik.values.project_name}
                            onChange={(_event, value) => {
                                formik.values.project_name = value || '';
                            }}
                            onBlur={(event) => {
                                // @ts-ignore
                                formik.values.project_name = event.target.value || '';
                            }}
                            autoHighlight
                            selectOnFocus
                        />
                        <Typography
                            data-cy="renameProjectVersionLabel"
                            className={classes.label}
                            gutterBottom
                        >
                            Version Name
                        </Typography>
                        <TextField
                            data-cy="renameProjectVersionInput"
                            className={classes.text}
                            required
                            name="project_instance"
                            autoComplete="off"
                            placeholder="Version Name"
                            value={formik.values.project_instance}
                            onChange={formik.handleChange}
                        />
                    </Grid>
                    <DialogActions className={classes.dialogActions}>
                        <Button
                            data-cy="renameProjectSubmitButton"
                            type="submit"
                            autoFocus
                        >
                            Save
                        </Button>
                        <Button
                            data-cy="renameProjectCancelButton"
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
