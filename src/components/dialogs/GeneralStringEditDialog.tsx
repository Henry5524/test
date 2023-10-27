import React from 'react';

import {
    Button, DialogProps, Dialog, DialogActions,
    DialogContent, DialogTitle, Grid, Typography,
    makeStyles, IconButton, TextField
} from '@material-ui/core';
import { useFormik } from 'formik';
import _ from 'lodash';

import { colors, GrayButton, theme } from '@styles';
import { VcioIcon } from '../controls/VcioIcon';

interface GeneralStringEditDialogProps extends DialogProps {
    item: string;
    itemTitle?: string;
    title?: string;
    onUpdateClick: (item: string) => void;
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
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        letterSpacing: 0,
        color: colors.black_90,
        '& > b': {
            color: colors.green_500
        }
    },
    text: {
        marginBottom: theme.spacing(6),
        borderRadius: 4,
        backgroundColor: colors.white_100,
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: colors.blue_gray_300
    },
});

export const GeneralStringEditDialog: React.FunctionComponent<GeneralStringEditDialogProps> = (props) => {
    const classes = useStyles();

    const formik = useFormik({
        initialValues: {
            item_name: props.item
        },
        enableReinitialize: true,
        onSubmit: () => {
            if (props.onClose) {
                props.onClose({}, 'backdropClick');
            }
        },
    });

    const handleOnUpdateClick = () => {
        if (props.onUpdateClick && formik.values.item_name) {
            props.onUpdateClick(formik.values.item_name);
        }
    };

    // We want to pass all the properties to Dialog, except for props.onUpdateClick
    const { onUpdateClick, ...propsForDialog } = props;

    return (
        <Dialog
            data-cy="generalStringEditWindow"
            classes={{ paper: classes.dialog }}
            aria-labelledby="customized-dialog-title"
            {...propsForDialog}
        >
            <DialogTitle
                data-cy="generalStringEditWindowTitle"
                id="customized-dialog-title"
                className={classes.title}
            >
                { props.title ? props.title : 'Edit Name' }
                <IconButton
                    data-cy="generalStringEditButton"
                    onClick={(e) => { return props.onClose ? props.onClose(e, 'backdropClick') : null; }}
                    style={{ marginRight: -15, marginTop: -10, float: 'right' }}
                >
                    <VcioIcon vcio="general-cross" iconColor={colors.blue_gray_500} />
                </IconButton>
            </DialogTitle>
            <form onSubmit={formik.handleSubmit}>
                <DialogContent>
                    <Grid container direction="column">
                        <Typography
                            data-cy="generalStringEditLabel"
                            className={classes.label}
                            gutterBottom
                        >
                            { props.itemTitle ? props.itemTitle : 'Name' }
                        </Typography>
                        <TextField
                            data-cy="generalStringEditInput"
                            className={classes.text}
                            autoFocus
                            rows={30}
                            name="item_name"
                            autoComplete="off"
                            placeholder="Device Name"
                            value={formik.values.item_name}
                            onChange={formik.handleChange}
                        />
                    </Grid>
                </DialogContent>
                <DialogActions className={classes.dialogActions}>
                    <Button
                        data-cy="generalStringEditSubmitButton"
                        type="submit"
                        onClick={handleOnUpdateClick}
                        disabled={_.isEmpty(formik.values.item_name)}
                    >
                        Update
                    </Button>
                    <GrayButton
                        data-cy="generalStringEditCancelButton"
                        onClick={(e) => { return props.onClose ? props.onClose(e, 'backdropClick') : null; }}
                        size="small"
                    >
                        Cancel
                    </GrayButton>
                </DialogActions>
            </form>
        </Dialog>
    );
};
