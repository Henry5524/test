import { AppContext } from '@context';
import { Button, Dialog, DialogActions, DialogContent, DialogProps, DialogTitle, Grid, IconButton, makeStyles, Typography, } from '@material-ui/core';

import { colors, GrayButton, theme } from '@styles';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import React, { useContext, useState } from 'react';

import Dropzone from 'react-dropzone-uploader';
import { config } from '../../config';
import { ShowToast } from '../../utils';
import { VcioIcon } from '../controls/VcioIcon';

interface ImportInventoryConfigDialogProps extends DialogProps {
    projectid: string;
}

const useStyles = makeStyles({
    dialog: {
        width: 572,
        borderRadius: 4,
        backgroundColor: colors.white_100,
        borderStyle: 'solid',
        borderWidth: 0,
        borderColor: colors.blue_gray_300,
        padding: theme.spacing(4),
    },
    dialogActions: {
        marginTop: 46,
        justifyContent: 'flex-start',
        paddingLeft: theme.spacing(6),
        paddingRight: theme.spacing(6),
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
        minHeight: 122,
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
});

export const ImportInventoryConfigDialog: React.FunctionComponent<ImportInventoryConfigDialogProps> = (props) => {
    const appContext = useContext(AppContext);
    const [fileSelected, setFileSelected] = useState<{ file: File | null }>({ file: null });
    const classes = useStyles();
    const { enqueueSnackbar } = useSnackbar();

    const importClickHandler = async (file: any) => {
        const formData = new FormData();
        formData.append('files', file);
        await fetch(`${config.api_base_url}/projects/${props.projectid}/mapping`, {
            method: 'POST',
            body: formData
        }).then((response) => {
            if (!response.ok) {
                response.text().then((responseBodyAsText) => {
                    let details: string = '';
                    try {
                        const responseBody = JSON.parse(responseBodyAsText);
                        details = responseBody.error;
                    } catch (e) {
                        details = 'code ' + response.status + ': ' + responseBodyAsText;
                    }
                    ShowToast(`Inventory Config upload error (${details})`, appContext, enqueueSnackbar, 'error');
                });
            }
        }).catch(() => {
            ShowToast('Inventory Config upload was cancelled', appContext, enqueueSnackbar, 'success');
        });
    };

    const formik = useFormik({
        initialValues: {},
        onSubmit: () => {
            if (props.onClose) {
                props.onClose({}, 'backdropClick');
            }
            // pause swr from re-validating projects data
            appContext.setShouldFetchProjectsData(false);
            importClickHandler(fileSelected.file).then(() => {
                // resume swr from re-validating projects data
                appContext.setShouldFetchProjectsData(true);
            });
        },
    });

    return (
        <Dialog
            data-cy="uploadNewProjectWindow"
            classes={{ paper: classes.dialog }}
            aria-labelledby="customized-dialog-title"
            {...props}
        >
            <DialogTitle
                data-cy="uploadNewProjectWindowTitle"
                id="customized-dialog-title"
                className={classes.title}
            >
                Import Inventory Configuration
                <IconButton
                    data-cy="uploadNewProjectButton"
                    onClick={(e) => {
                        return props.onClose ? props.onClose(e, 'backdropClick') : null;
                    }}
                    style={{ marginRight: -15, marginTop: -10, float: 'right' }}
                >
                    <VcioIcon vcio="general-cross" iconColor={colors.blue_gray_500}/>
                </IconButton>
            </DialogTitle>
            <form onSubmit={formik.handleSubmit}>
                <DialogContent>
                    <Grid container direction="column">
                        <Typography
                            data-cy="configUploadLabel"
                            className={classes.label}
                            gutterBottom
                        >
                            CSV File with Configuration Data
                        </Typography>
                        <Dropzone
                            data-cy="configUploadDropzone"
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
                            inputContent={(_files, extra) => extra.reject ? 'CSV files only' : 'Drop a file here or click to select it'}
                            accept="text/csv,.csv"
                        />
                        <Grid container direction="row">
                            <Grid item xs={1} style={{ maxWidth: 25 }}>
                                <VcioIcon vcio="general-info-circle" style={{ color: colors.blue_100 }}/>
                            </Grid>
                            <Grid item xs={11} style={{ flexGrow: 1, maxWidth: 'fit-content' }}>
                                This will <b>overwrite</b> configuration of all custom properties, applications, and move groups.
                                You may need to re-calculate Environment Overview, Application and Move Group dependencies after the import.
                            </Grid>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions className={classes.dialogActions}>
                    <Button
                        data-cy="configUploadSubmitButton"
                        type="submit"
                        disabled={!fileSelected || !fileSelected.file}
                        autoFocus
                    >
                        Import
                    </Button>
                    <GrayButton
                        data-cy="networksExclusionListCancelButton"
                        onClick={(e) => {
                            return props.onClose ? props.onClose(e, 'backdropClick') : null;
                        }}
                        size="small"
                    >
                        Cancel
                    </GrayButton>
                </DialogActions>
            </form>
        </Dialog>
    );
};
