import React from 'react';

import {
    DialogProps, Dialog, DialogContent, DialogTitle, makeStyles, IconButton,
    List, ListItem, ListItemAvatar, ListItemText, Avatar, DialogActions,
} from '@material-ui/core';

import { Project } from '@models';
import { colors, GrayButton, theme } from '@styles';
import { useProjects } from '@services';
import { sortStringsBy } from '@utils';
import { VcioIcon } from '../controls/VcioIcon';

interface SelectProjectDialogProps extends DialogProps {
    title?: string;
    onProjectSelect: (project: Project) => void;
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
    list: {
        width: '100%',
        maxHeight: 800,
    },
    listItem: {
        cursor: 'pointer',
        '&:hover': {
            backgroundColor: colors.blue_gray_50
        }
    },
    title: {
        width: '100%',
        fontSize: 22,
        fontWeight: 300,
        fontStyle: 'normal',
        letterSpacing: 0,
        color: colors.black_90
    },
});

export const SelectProjectDialog: React.FunctionComponent<SelectProjectDialogProps> = (props) => {
    const classes = useStyles();

    let { data: projects } = useProjects();
    projects = (projects || []).sort(sortStringsBy('name'));

    // We want to pass all the properties to Dialog, except for props.onProjectSelect
    const { onProjectSelect, ...propsForDialog } = props;

    return (
        <Dialog
            data-cy="selectProjectWindow"
            classes={{ paper: classes.dialog }}
            aria-labelledby="customized-dialog-title"
            {...propsForDialog}
        >
            <DialogTitle
                data-cy="selectProjectWindowTitle"
                id="customized-dialog-title"
                className={classes.title}
            >
                {props.title ? props.title : 'Select Project'}
                <IconButton
                    data-cy="selectProjectButton"
                    onClick={(e) => { return props.onClose ? props.onClose(e, 'backdropClick') : null; }}
                    style={{ marginRight: -15, marginTop: -10, float: 'right' }}
                >
                    <VcioIcon vcio="general-cross" iconColor={colors.blue_gray_500} />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <List className={classes.list}>
                    {projects.map((project: Project) => (
                        <ListItem key={project.id} className={classes.listItem} onClick={() => props.onProjectSelect(project)}>
                            <ListItemAvatar>
                                <Avatar>
                                    <VcioIcon vcio="migration-device"/>
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText primary={project.project_name} secondary={project.project_instance} />
                        </ListItem>
                    ))}
                </List>
            </DialogContent>
            <DialogActions className={classes.dialogActions}>
                <GrayButton
                    data-cy="networksExclusionListCancelButton"
                    onClick={(e) => { return props.onClose ? props.onClose(e, 'backdropClick') : null; }}
                    size="small"
                >
                    Cancel
                </GrayButton>
            </DialogActions>
        </Dialog>
    );
};
