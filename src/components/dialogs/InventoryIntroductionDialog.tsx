import React, { useState } from 'react';
import { useRouter } from 'next/router';

import {
    DialogProps, Dialog, DialogContent, DialogTitle,
    makeStyles, IconButton, DialogActions, Button
} from '@material-ui/core';

import { colors, GrayButton, theme } from '@styles';
import { VcioIcon } from '../controls/VcioIcon';

const useStyles = makeStyles({
    dialog: {
        width: 774,
        height: 574,
        minWidth: 774,
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
        '& > button:first-child': {
            marginRight: 'auto',
        }
    },
    title: {
        width: '100%',
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        letterSpacing: 0,
        color: colors.blue_gray_500,
        '& > b': {
            fontSize: 15,
        }
    },
    subTitle: {
        fontFamily: 'Muli',
        fontSize: 27,
        fontWeight: 600,
        fontStretch: 'normal',
        fontStyle: 'normal',
        lineHeight: 1.4,
        letterSpacing: 'normal',
        textAlign: 'left',
        color: colors.black_90,
    },
    text: {
        width: '100%',
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        letterSpacing: 0,
        color: colors.black_90,
        paddingLeft: 32,
        marginTop: 32,
        marginBottom: 32,
        borderLeft: '4px solid ' + colors.blue_100,
    },
});

const PAGES = [
    {
        title: 'What’s on this page?',
        text: `The Inventory is a tool that allows you to manage the devices,
            applications (or custom groups), and move groups to ensure successful cloud migrations.`,
        img: 'images/help/inventory/WhatsOnThisPage.gif'
    },
    {
        title: 'Create Applications',
        text: `Move your devices to Applications or Custom Groups that are meaningful to you.
            Calculate the dependencies between the devices to better understand your environment.`,
        img: 'images/help/inventory/CreateApplications.gif'
    },
    {
        title: 'View Dependency Analysis',
        text: `Explore application dependencies to make sure it's safe to move.
            Add applications to the analysis to see more dependencies and cover entire environment.`,
        img: 'images/help/inventory/ViewDependencies.gif'
    },
    {
        title: 'Identify Move Groups',
        text: 'Analyze and schedule your Move Groups to ensure successful cloud migration.',
        img: 'images/help/inventory/GetMoveGroupInventory.gif'
    },
];

export const InventoryIntroductionDialog: React.FunctionComponent<DialogProps> = (props) => {
    const classes = useStyles();
    const [pageNumber, setPageNumber] = useState(0);
    const { basePath } = useRouter();

    const nextOrDoneClickHandle = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        if (pageNumber + 1 == PAGES.length && props.onClose) {
            props.onClose(e, 'backdropClick');
        }
        else {
            setPageNumber(pageNumber + 1);
        }
    };

    return (
        <Dialog
            data-cy="inventoryIntroductionWindow"
            classes={{ paper: classes.dialog }}
            aria-labelledby="customized-dialog-title"
            {...props}
        >
            <DialogTitle
                data-cy="inventoryIntroductionWindowTitle"
                id="customized-dialog-title"
                className={classes.title}
            >
                <b>Inventory Quick Guide</b> | Page {pageNumber + 1} of {PAGES.length}
                <IconButton
                    data-cy="inventoryIntroductionButton"
                    onClick={(e) => { return props.onClose ? props.onClose(e, 'backdropClick') : null; }}
                    style={{ marginRight: -15, marginTop: -10, float: 'right' }}
                >
                    <VcioIcon vcio="general-cross" iconColor={colors.blue_gray_500} />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <div className={classes.subTitle}>
                    {PAGES[pageNumber].title}
                </div>
                <div style={{ paddingLeft: 32 }}>
                    <div className={classes.text}>
                        {PAGES[pageNumber].text}
                    </div>
                    <img src={`${basePath}/${PAGES[pageNumber].img}`} alt="help img" />
                </div>
            </DialogContent>
            <DialogActions className={classes.dialogActions}>
                <GrayButton
                    data-cy="networksExclusionListCancelButton"
                    onClick={(e) => { return props.onClose ? props.onClose(e, 'backdropClick') : null; }}
                    size="small"
                >
                    Close
                </GrayButton>
                {
                    pageNumber > 0 &&
                    <GrayButton
                        data-cy="networksExclusionListCancelButton"
                        onClick={() => setPageNumber(pageNumber - 1)}
                        size="small"
                    >
                        Previous
                    </GrayButton>
                }
                {
                    PAGES.length > 1 &&
                    <Button
                        data-cy="networksExclusionListCancelButton"
                        onClick={nextOrDoneClickHandle}
                        size="small"
                    >
                        {pageNumber + 1 == PAGES.length ? 'Done' : 'Next'}
                    </Button>
                }
            </DialogActions>
        </Dialog>
    );
};
