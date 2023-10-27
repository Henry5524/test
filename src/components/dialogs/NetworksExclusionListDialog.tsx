import React from 'react';

import {
    Button, DialogProps, Dialog, DialogActions,
    DialogContent, DialogTitle, Grid, Typography,
    makeStyles, IconButton, TextField
} from '@material-ui/core';
import { useFormik } from 'formik';

import { colors, GrayButton, theme } from '@styles';
import { VcioIcon } from '../controls/VcioIcon';

interface NetworksExclusionListDialogProps extends DialogProps {
    nets_list: string[];
    onUpdate: (nets_list: string[]) => void;
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

export const NetworksExclusionListDialog: React.FunctionComponent<NetworksExclusionListDialogProps> = (props) => {
    const classes = useStyles();

    const formik = useFormik({
        initialValues: {
            nets_list: (props.nets_list || []).join('\n')
        },
        onSubmit: () => {
            if (props.onClose) {
                props.onClose({}, 'backdropClick');
            }
        },
    });

    const handleOnUpdateClick = () => {
        if (props.onUpdate) {
            props.onUpdate((formik.values.nets_list || '').split('\n'));
        }
    };

    // We want to pass all the properties to Dialog, except for props.onUpdate
    const { onUpdate, ...propsForDialog } = props;

    return (
        <Dialog
            data-cy="networksExclusionListWindow"
            classes={{ paper: classes.dialog }}
            aria-labelledby="customized-dialog-title"
            {...propsForDialog}
        >
            <DialogTitle
                data-cy="networksExclusionListWindowTitle"
                id="customized-dialog-title"
                className={classes.title}
            >
                Edit Networks Exclusion List
                <IconButton
                    data-cy="networksExclusionListButton"
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
                            data-cy="networksExclusionListLabel"
                            className={classes.label}
                            gutterBottom
                        >
                            Enter <b>IP</b>, <b>Network</b> or <b>IP range</b> (in form of IP-IP) one per line
                            to exclude their conversations from calculations.
                        </Typography>
                        <TextField
                            data-cy="networksExclusionListInput"
                            className={classes.text}
                            multiline
                            autoFocus
                            rows={30}
                            name="nets_list"
                            autoComplete="off"
                            value={formik.values.nets_list}
                            onChange={formik.handleChange}
                        />
                    </Grid>
                </DialogContent>
                <DialogActions className={classes.dialogActions}>
                    <Button
                        data-cy="networksExclusionListSubmitButton"
                        type="submit"
                        onClick={handleOnUpdateClick}
                    >
                        Update
                    </Button>
                    <GrayButton
                        data-cy="networksExclusionListCancelButton"
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
