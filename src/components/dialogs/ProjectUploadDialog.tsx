import { Button, CardProps, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Icon, IconButton, makeStyles, TextField, Typography, } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { useFormik } from 'formik';
import { produce } from 'immer';
import _ from 'lodash';
import moment from 'moment';
import { useSnackbar } from 'notistack';
import React, { useContext, useState } from 'react';
import Dropzone from 'react-dropzone-uploader';
import { mutate } from 'swr';
import { config } from '../../config';
import { AppContext } from '../../context';
import { Project } from '../../models/data';
import { Api } from '../../services';
import { colors, theme } from '../../styles';
import { ShowToast } from '../../utils';
import { VcioIcon } from '../controls/VcioIcon';

interface ProjectUploadDialogProps extends CardProps {
    text: string;
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
    file: {
        marginBottom: theme.spacing(6),
        borderRadius: 4,
        backgroundColor: colors.white_100,
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: colors.blue_gray_300
    },
    dropzone: {
        minHeight: 92,
        overflow: 'auto',
        borderRadius: 4,
        backgroundColor: colors.blue_gray_40,
        borderStyle: 'dashed',
        borderWidth: 1,
        fontSize: 8,
        borderColor: colors.blue_gray_500,
        marginBottom: theme.spacing(6),
    },
    dropzoneActive: {
        borderColor: colors.green_700,
        borderWidth: 2,
    },
    dropzoneReject: {
        borderColor: colors.red_600,
        borderWidth: 2,
    },
    inputLabel: {
        borderRadius: 4,
        backgroundColor: colors.blue_gray_40,
        borderWidth: 1,
        fontSize: 14,
        fontWeight: 'normal',
        color: colors.blue_gray_500
    },
    preview: {
        overflow: 'auto',
        padding: '30px 3%',
        height: 92,
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
        maxHeight: 230,
    },
});

export const ProjectUploadDialog: React.FunctionComponent<ProjectUploadDialogProps> = (props) => {
    const appContext = useContext(AppContext);
    const { children, className, projectNames, ...other } = props;
    const [fileSelected, setFileSelected] = useState<{ file: File | null }>({ file: null });
    const [open, setOpen] = useState(false);
    const classes = useStyles();
    const { enqueueSnackbar } = useSnackbar();

    const createProjectHandler = async (name: string, instance: string, file: any) => {
        const formData = new FormData();
        formData.append('project_name', name);
        formData.append('project_instance', instance);
        formData.append('files', file);

        const abortUploadKey = 'abortUploadKey-' + _.trim(formik.values.project_name + '-' + formik.values.project_instance);
        const controller = new AbortController();
        const { signal } = controller;

        // store the abort controller so we can cancel upload at a later time
        Api.uploadProjectAbortControllerMap.set(abortUploadKey, controller);

        const newProject = new Project({
            project_name: formik.values.project_name,
            project_instance: formik.values.project_instance,
            modify_time: moment().valueOf() / 1000,
            size: file.size,
            name: file.name, // use this field in the upload view to show file size being uploaded
            description: abortUploadKey, // use this field in the upload view to abort an upload
        });

        // in this mutate call we will optimistically update the UI
        mutate('getProjects', produce(projectsDataToMutate => {
            projectsDataToMutate.push(newProject);
        }), false);

        formik.values.project_name = '';
        formik.values.project_instance = '';

        await fetch(config.api_base_url + '/projects', {
            method: 'POST',
            body: formData,
            signal
        })
            .then((response) => {

                if (!response.ok) {
                    response.text().then((responseBodyAsText) => {

                        // in this mutate call we will optimistically update the UI
                        mutate('getProjects', produce(projectsDataToMutate => {
                            _.remove(projectsDataToMutate, (projectToMutate: Project) => projectToMutate.description === abortUploadKey);
                        }), false);

                        try {
                            const responseBody = JSON.parse(responseBodyAsText);
                            ShowToast('Project upload error (' + responseBody.error + ')', appContext, enqueueSnackbar, 'error');
                        } catch (e) {
                            // error in converting response text to json so you just the text
                            ShowToast('Project upload error (code ' + response.status + ': ' + responseBodyAsText + ')', appContext, enqueueSnackbar, 'error');
                        }
                    });
                }
            })
            .catch(() => {
                // in this mutate call we will optimistically update the UI
                mutate('getProjects', produce(projectsDataToMutate => {
                    _.remove(projectsDataToMutate, (projectToMutate: Project) => projectToMutate.description === abortUploadKey);
                }), false);

                ShowToast('Project upload was cancelled', appContext, enqueueSnackbar, 'success');
            });

        // clear out abort controller and remove from map
        Api.uploadProjectAbortControllerMap.set(abortUploadKey, null);
        Api.uploadProjectAbortControllerMap.delete(abortUploadKey);

        // [...Api.uploadProjectAbortControllerMap.keys()].map(key => (
        //     console.log(key, Api.uploadProjectAbortControllerMap.get(key))
        // ));
    };

    const formik = useFormik({
        initialValues: {
            project_name: '',
            project_instance: '',
        },
        onSubmit: values => {
            handleClose();

            // pause swr from re-validating projects data
            appContext.setShouldFetchProjectsData(false);

            createProjectHandler(values.project_name, values.project_instance, fileSelected.file).then(() => {
                formik.values.project_name = '';
                formik.values.project_instance = '';

                // resume swr from re-validating projects data
                appContext.setShouldFetchProjectsData(true);
            });
        },
    });

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <div>
            <Button
                data-cy="newProjectButton"
                size="large"
                startIcon={<Icon>add_circle</Icon>}
                onClick={handleClickOpen}
            >
                {props.text}
            </Button>
            <Dialog
                data-cy="uploadNewProjectWindow"
                classes={{ paper: classes.dialog }}
                onClose={handleClose}
                aria-labelledby="customized-dialog-title"
                open={open}
                {...other}
            >
                <DialogTitle
                    data-cy="uploadNewProjectWindowTitle"
                    id="customized-dialog-title"
                    className={classes.title}
                >
                    Upload New Project
                    <IconButton
                        data-cy="uploadNewProjectButton"
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
                                data-cy="projectNameLabel"
                                className={classes.label}
                                gutterBottom
                            >
                                Project Name
                            </Typography>
                            <Autocomplete
                                data-cy="projectNameInput"
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
                                onKeyPress={(event) => {
                                    formik.setFieldValue('project_name', (event.target as any).value || '');
                                }}
                                onChange={(_event, value) => {
                                    formik.setFieldValue('project_name', value || '');
                                }}
                                onBlur={(event) => {
                                    formik.setFieldValue('project_name', (event.target as any).value || '');
                                }}
                                autoHighlight
                                selectOnFocus
                            />
                            <Typography
                                data-cy="projectVersionLabel"
                                className={classes.label}
                                gutterBottom
                            >
                                Version Name
                            </Typography>
                            <TextField
                                data-cy="projectVersionInput"
                                className={classes.text}
                                required
                                name="project_instance"
                                autoComplete="off"
                                placeholder="Version Name"
                                value={formik.values.project_instance}
                                onChange={formik.handleChange}
                            />
                            <Typography
                                data-cy="projectUploadLabel"
                                className={classes.label}
                                gutterBottom
                            >
                                Archive with Project Data
                            </Typography>
                            <Dropzone
                                data-cy="projectUploadDropzone"
                                addClassNames={{
                                    dropzone: classes.dropzone,
                                    preview: classes.preview,
                                    inputLabel: classes.inputLabel,
                                    dropzoneActive: classes.dropzoneActive,
                                    dropzoneReject: classes.dropzoneReject,
                                }}
                                onChangeStatus={(fileWithMeta, status) => {
                                    if (status === 'done') {
                                        setFileSelected({ file: fileWithMeta.file });
                                    }
                                }}
                                maxFiles={1}
                                autoUpload={false}
                                inputContent={(_files, extra) => extra.reject ? 'Zip files only' : 'Drop a zip file here or click to select it'}
                                accept="application/zip,.zip,.rar,.7zip"
                            />
                        </Grid>
                        <DialogActions className={classes.dialogActions}>
                            <Button
                                data-cy="projectUploadSubmitButton"
                                type="submit"
                                autoFocus
                                disabled={_.isEmpty(formik.values.project_name) || _.isEmpty(formik.values.project_instance) || !fileSelected.file}
                            >
                                Create Project
                            </Button>
                            <Button
                                data-cy="projectUploadCancelButton"
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
        </div>
    );
};
