import React, { useState } from 'react';

import {
    DialogProps, Dialog, DialogContent, DialogTitle, makeStyles, IconButton,
    DialogActions, Grid, Button, Chip,
} from '@material-ui/core';

import ChipInput from 'material-ui-chip-input';
import _ from 'lodash';

import { colors, GrayButton, theme } from '@styles';
import { OrgPerson } from '@models';
import { isValidEmail } from '@utils';
import { VcioIcon } from '../controls/VcioIcon';

interface InviteUserDialogProps extends DialogProps {
    users?: OrgPerson[];
    sendInvitations: (emails: string[]) => void;
}

const useStyles = makeStyles({
    dialog: {
        width: 672,
        maxWidth: 672,
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
});

type TEmailState = 'inv' | 'reinv' | 'skip' | 'UNK';
const CH = {
    inv: {
        color: colors.black_100,
        icon: 'mail-envelope-open-text',
        icolor: colors.green_500,
        dcolor: colors.green_500,
        bg: colors.green_50,
    },
    reinv: {
        color: colors.black_100,
        icon: 'history-redo-alt',
        icolor: colors.blue_500,
        dcolor: colors.blue_gray_500,
        bg: colors.blue_gray_90,
    },
    skip: {
        color: colors.black_100,
        icon: 'general-check',
        icolor: colors.green_500,
        dcolor: colors.blue_gray_500,
        bg: colors.blue_gray_90,
    },
    UNK: {
        color: colors.blue_gray_500,
        icon: 'vcio-general-question-circle-outline',
        icolor: colors.blue_gray_500,
        dcolor: colors.blue_gray_500,
        bg: colors.blue_gray_90,
    },
};

export const InviteUserDialog: React.FunctionComponent<InviteUserDialogProps> = (props) => {
    const { users, sendInvitations, ...restProps } = props;
    const classes = useStyles();
    const [emails, setEmails] = useState<string[]>([]);
    const [invites, setInvites] = useState<string[]>([]);
    const [reinvites, setReinvites] = useState<string[]>([]);
    const [skipped, setSkipped] = useState<string[]>([]);
    const [states, setStates] = useState<{ [id: string]: TEmailState }>({});

    const handleAddEmail = (emailOrList: string) => {
        if (!props.users) {
            return;
        }
        const list = emailOrList.split(/\s+/);
        const st: { [id: string]: TEmailState } = {};
        for (const email of list) {
            if (isValidEmail(email)) {
                emails.push(email);
                const nemails = _.uniq(emails);
                invites.length = 0;
                reinvites.length = 0;
                skipped.length = 0;
                for (const e of nemails) {
                    let found = false;
                    for (const user of props.users) {
                        if (user.email == e) {
                            if (user.status == 'verified') {
                                skipped.push(e);
                                st[e] = 'skip';
                            }
                            else {
                                reinvites.push(e);
                                st[e] = 'reinv';
                            }
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        invites.push(e);
                        st[e] = 'inv';
                    }
                }
                setInvites([...invites]);
                setReinvites([...reinvites]);
                setSkipped([...skipped]);
                setEmails([...nemails]);
                setStates(st);
            }
        }
    };

    const handleDeleteEmail = (email: string) => {
        _.remove(invites, e => e == email);
        _.remove(reinvites, e => e == email);
        _.remove(skipped, e => e == email);
        _.remove(emails, e => e == email);
        setInvites([...invites]);
        setReinvites([...reinvites]);
        setSkipped([...skipped]);
        setEmails([...emails]);
        delete states[email];
        setStates({ ...states });
    };

    const handleCloseClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        setInvites([]);
        setReinvites([]);
        setSkipped([]);
        setEmails([]);
        if (props.onClose) {
            props.onClose(event, 'backdropClick');
        }
    };

    return (
        <Dialog
            data-cy="InviteUserWindow"
            classes={{ paper: classes.dialog }}
            aria-labelledby="customized-dialog-title"
            {...restProps}
        >
            <DialogTitle
                data-cy="InviteUserWindowTitle"
                id="customized-dialog-title"
                className={classes.title}
            >
                Invite New Users
                <IconButton
                    data-cy="InviteUserCloseButton"
                    onClick={handleCloseClick}
                    style={{ marginRight: -15, marginTop: -10, float: 'right' }}
                >
                    <VcioIcon vcio="general-cross" iconColor={colors.blue_gray_500} />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Grid container>
                    <Grid item xs={12}>
                        <ChipInput
                            data-cy={'emailInputText'}
                            size="small"
                            variant="outlined"
                            blurBehavior="add"
                            newChipKeys={['Enter', ' ']}
                            fullWidth={true}
                            value={emails}
                            onAdd={(email) => handleAddEmail(email)}
                            onDelete={(email) => handleDeleteEmail(email)}
                            chipRenderer={(chProps, chKey) => {
                                const st = states[chProps.chip] || 'UNK';
                                return (
                                    <Chip
                                        key={chKey}
                                        label={chProps.chip}
                                        data-cy={'email'}
                                        style={{
                                            marginRight: theme.spacing(2),
                                            marginBottom: theme.spacing(1),
                                            backgroundColor: CH[st].bg,
                                            color: CH[st].color
                                        }}
                                        icon={<VcioIcon vcio={CH[st].icon} iconColor={CH[st].icolor} />}
                                        onDelete={() => handleDeleteEmail(chProps.chip)}
                                        deleteIcon={<VcioIcon vcio="general-cross" rem={.6} iconColor={CH[st].dcolor} data-cy={'deleteEmail'} />}
                                    />
                                );
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} style={{ paddingTop: 14, paddingBottom: 40 }}>
                        <span>You can copy and paste several email addresses here</span>
                    </Grid>
                    <Grid item xs={12}>
                        <Grid container direction="column" style={{ paddingBottom: 28 }}>
                            {
                                invites.length > 0 &&
                                <Grid item style={{ paddingBottom: 12 }}>
                                    <VcioIcon vcio="mail-envelope-open-text" iconColor={colors.green_500} style={{ marginRight: 8 }} />
                                    <span data-cy={'newInviteCount'}>{invites.length} new invitation{invites.length > 1 ? 's' : ''}</span>
                                    <span style={{ color: colors.blue_gray_500, marginLeft: 8 }}>
                                        ({invites[0]}{invites.length > 1 ? ' and ' + (invites.length - 1) + ' more)' : ')'}
                                    </span>
                                </Grid>
                            }
                            {
                                reinvites.length > 0 &&
                                <Grid item style={{ paddingBottom: 12 }}>
                                    <VcioIcon vcio="history-redo-alt" iconColor={colors.blue_500} style={{ marginRight: 8 }} />
                                    <span data-cy={'reinviteCount'}>{reinvites.length} reinvitation{reinvites.length > 1 ? 's' : ''}</span>
                                    <span style={{ color: colors.blue_gray_500, marginLeft: 8 }}>
                                        ({reinvites[0]}{reinvites.length > 1 ? ' and ' + (reinvites.length - 1) + ' more)' : ')'}
                                    </span>
                                </Grid>
                            }
                            {
                                skipped.length > 0 &&
                                <Grid item style={{ paddingBottom: 12 }}>
                                    <VcioIcon vcio="general-check" iconColor={colors.green_500} style={{ marginRight: 8 }} />
                                    <span data-cy={'skippedInviteCount'}>{skipped.length} user{skipped.length > 1 ? 's' : ''} already has access and will be skipped</span>
                                    <span style={{ color: colors.blue_gray_500, marginLeft: 8 }}>
                                        ({skipped[0]}{skipped.length > 1 ? ' and ' + (skipped.length - 1) + ' more)' : ')'}
                                    </span>
                                </Grid>
                            }
                        </Grid>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions className={classes.dialogActions}>
                <Button
                    type="submit"
                    data-cy={'inviteUserSubmit'}
                    onClick={() => props.sendInvitations([...invites, ...reinvites])}
                    disabled={invites.length == 0 && reinvites.length == 0}
                >
                    Send Invitation
                </Button>
                <GrayButton
                    data-cy="networksExclusionListCancelButton"
                    onClick={handleCloseClick}
                    size="small"
                >
                    Cancel
                </GrayButton>
            </DialogActions>
        </Dialog>
    );
};
