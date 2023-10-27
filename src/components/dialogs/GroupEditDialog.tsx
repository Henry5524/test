import React from 'react';

import {
    Button, DialogProps, Dialog, DialogActions,
    DialogContent, DialogTitle, Grid, Typography,
    makeStyles, IconButton, TextField
} from '@material-ui/core';
import { useFormik } from 'formik';
import _ from 'lodash';

import { colors, GrayButton, theme } from '@styles';
import { MoveGroup, NodeGroup } from '@models';
import { VcioIcon } from '../controls/VcioIcon';

interface GroupEditDialogProps<T extends NodeGroup> extends DialogProps {
    item: T | null;
    title?: string;
    onUpdateClick: (device: T) => void;
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

export const GroupEditDialog: React.FunctionComponent<GroupEditDialogProps<NodeGroup | MoveGroup>> = (props) => {
    const classes = useStyles();

    const formik = useFormik({
        initialValues: {
            device_name: props.item?.name
        },
        enableReinitialize: true,
        onSubmit: () => {
            if (props.onClose) {
                props.onClose({}, 'backdropClick');
            }
        },
    });

    const handleOnUpdateClick = () => {
        if (props.onUpdateClick && props.item && formik.values.device_name) {
            props.item.name = formik.values.device_name;
            props.onUpdateClick(props.item);
        }
    };

    // We want to pass all the properties to Dialog, except for props.onUpdateClick
    const { onUpdateClick, ...propsForDialog } = props;

    return (
        <Dialog
            data-cy="groupEditWindow"
            classes={{ paper: classes.dialog }}
            aria-labelledby="customized-dialog-title"
            {...propsForDialog}
        >
            <DialogTitle
                data-cy="groupEditWindowTitle"
                id="customized-dialog-title"
                className={classes.title}
            >
                { props.title ? props.title : 'Edit Node Group' }
                <IconButton
                    data-cy="groupEditButton"
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
                            data-cy="groupEditLabel"
                            className={classes.label}
                            gutterBottom
                        >
                            Name
                        </Typography>
                        <TextField
                            data-cy="groupEditInput"
                            className={classes.text}
                            autoFocus
                            rows={30}
                            name="device_name"
                            autoComplete="off"
                            placeholder="Device Name"
                            value={formik.values.device_name}
                            onChange={formik.handleChange}
                        />
                    </Grid>
                </DialogContent>
                <DialogActions className={classes.dialogActions}>
                    <Button
                        data-cy="groupEditSubmitButton"
                        type="submit"
                        onClick={handleOnUpdateClick}
                        disabled={_.isEmpty(formik.values.device_name)}
                    >
                        Update
                    </Button>
                    <GrayButton
                        data-cy="groupEditCancelButton"
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
