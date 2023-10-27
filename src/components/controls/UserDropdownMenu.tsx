import { Avatar, Grid, IconButton, ListItemIcon, ListItemText, makeStyles, Menu, MenuItem, withStyles } from '@material-ui/core';
import _ from 'lodash';
import { useRouter } from 'next/router';
import React, { useContext } from 'react';
import { useCookies } from 'react-cookie';
import { ZendeskAPI } from 'react-zendesk';
import { AppContext } from '../../context';
import { colors } from '../../styles/styleGuide';
import { VcioIcon } from './VcioIcon';

interface UserDropdownMenuProps {
}


const useStyles = makeStyles({
    avatar: {
        height: 32,
        width: 32,
        backgroundColor: colors.blue_gray_800,
        fontFamily: 'Open Sans',
        fontSize: 13,
        fontStretch: 'normal',
        fontStyle: 'normal',
        lineHeight: '3.08',
        letterSpacing: 'normal',
        cursor: 'pointer',
        border: 'solid 2px #19b382',
        color: 'white'
    },
    button: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'middle',
        backgroundColor: colors.blue_gray_900,
        color: colors.white_100,
        boxShadow: '0 1px 4px 0 rgba(0, 0, 0, 0.25)'
    },
    listIcon: {
        margin: '0 5px 0 0',
        padding: 2,
        width: 20,
        minWidth: 20
    },
    loggedInText: {
        fontFamily: 'Open Sans',
        fontSize: 14,
        fontWeight: 'normal',
        fontStretch: 'normal',
        fontStyle: 'normal',
        lineHeight: 1.5,
        letterSpacing: 'normal',
        color: colors.blue_gray_500
    },
    menuContainer: {
        boxShadow: '0 2px 15px 0 rgba(15, 45, 104, 0.15)',
        border: 'solid 1px #dde1e9',
        backgroundColor: 'white',
        borderRadius: '4px',
        width: 240,
    },
    menuHeader: {
        marginLeft: 15,
        borderBottom: '1px solid #dde1e9'
    },
    menuIcon: {
        objectFit: 'contain'
    },
    menuStyle: {
        padding: 0
    },
    userNameText: {
        fontFamily: 'Open Sans',
        fontSize: 14,
        fontWeight: 600,
        fontStretch: 'normal',
        fontStyle: 'normal',
        lineHeight: 1.43,
        letterSpacing: 'normal',
        color: colors.blue_gray_900
    },
    userEmailText: {
        fontFamily: 'Open Sans',
        fontSize: 10,
        fontWeight: 'normal',
        fontStretch: 'normal',
        fontStyle: 'normal',
        letterSpacing: 'normal',
        color: colors.blue_gray_900
    }
});

const StyledListItemText = withStyles(() => ({
    root: {
        fontFamily: 'Open Sans',
        fontSize: 12,
        fontWeight: 'normal',
        fontStretch: 'normal',
        fontStyle: 'normal',
        margin: 0,
        padding: 0,
        letterSpacing: 'normal',
        color: 'rgba(0, 0, 0, 0.9)'
    },
}))(ListItemText);

const StyledMenuItem = withStyles(() => ({
    root: {
        margin: 0,
        padding: '8px 20px 10px 10px'
    }
}))(MenuItem);

/**
 * User control menu for profile, password, and logging out
 *
 * @param props
 * @constructor
 */
export const UserDropdownMenu: React.FunctionComponent<UserDropdownMenuProps> = () => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const router = useRouter();
    const appContext = useContext(AppContext);
    const classes = useStyles();

    const [, , removeCookie] = useCookies();

    const handleClick = (event: any) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        removeCookie('local-user-data', {
            path: '/'
        });
        ZendeskAPI('webWidget', 'close');
        ZendeskAPI('webWidget', 'reset');
        router.push('/signin');
    };

    const handleAssumeUser = () => {
        router.push('/admin/assume-user');
    };

    const userName = appContext.user?.name || ' ';
    const userEmail = appContext.user?.email || '';
    const userIsAdmin = appContext.user?._isGlobalAdmin;

    // go to the sign in page if user is no longer signed in
    if (userName === ' ') {
        router.push('/signin');
    }

    return (
        <>
            <IconButton
                onClick={handleClick}
                className={classes.button}
                data-cy="dropDownMenu"
            >
                <Avatar className={classes.avatar}>{_.toUpper(userName.split(' ').map((n) => n[0]).join(''))}</Avatar>
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                keepMounted
                MenuListProps={{ disablePadding: true }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                elevation={0}
                className={classes.menuStyle}
                getContentAnchorEl={null}
                anchorOrigin={{
                    vertical: 50,
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
            >
                <div className={classes.menuContainer}>
                    <Grid
                        container
                        spacing={0}
                        className={classes.menuHeader}
                    >
                        <Grid style={{ padding: 0, margin: 0 }} item xs={12}>
                            <span className={classes.loggedInText}>Logged in as</span>
                        </Grid>
                        <Grid style={{ padding: 0, margin: '0 0 0 0' }} item xs={12}>
                            <span className={classes.userNameText}>{userName}</span>
                        </Grid>
                        <Grid style={{ padding: 0, margin: '0 0 12px 0' }} item xs={12}>
                            <span className={classes.userEmailText}>{userEmail}</span>
                        </Grid>
                    </Grid>
                    {
                        userIsAdmin &&
                        <StyledMenuItem onClick={handleAssumeUser}>
                            <ListItemIcon className={classes.listIcon}>
                                <VcioIcon vcio="um-user-friends" iconColor={colors.green_500} rem={0.8}/>
                            </ListItemIcon>
                            <StyledListItemText primary="Assume User" data-cy="assumeUser"/>
                        </StyledMenuItem>
                    }
                    <StyledMenuItem onClick={handleLogout} data-cy='logoutBtn'>
                        <ListItemIcon className={classes.listIcon}>
                            <VcioIcon vcio="um-user" iconColor={colors.green_500} rem={0.8}/>
                        </ListItemIcon>
                        <StyledListItemText primary="Log Out"/>
                    </StyledMenuItem>
                </div>
            </Menu>
        </>
    );
};
