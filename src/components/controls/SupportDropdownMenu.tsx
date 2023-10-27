import { Divider as MenuDivider, ListItemIcon, ListItemText, Menu, MenuItem, withStyles } from '@material-ui/core';
import React, { useState } from 'react';
import { ZendeskAPI } from 'react-zendesk';
import { colors } from '../../styles';
import { InventoryIntroductionDialog } from '../dialogs';
import { VcioIcon } from './VcioIcon';

interface SupportDropdownMenuProps {
    menuAnchorEl: Element | null;
    handleSupportMenuClose: Function;
}

const StyledMenu = withStyles({
    paper: {
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
        borderColor: colors.blue_gray_200,
    },
    list: {
        paddingTop: 0,
        paddingBottom: 0,
    }
})(Menu);

const StyledMenuItem = withStyles({
    root: {
        backgroundColor: colors.white_100,
        '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
            color: colors.black_90,
            fontSize: 14
        },
        '&:focus': {
            // backgroundColor: colors.white_100,
            '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
                color: colors.black_90,
                fontSize: 14
            },
        },
    },
})(MenuItem);

const StyledHeader = withStyles({
    root: {
        backgroundColor: colors.white_100,
        '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
            color: colors.black_90,
            fontSize: 14,
            fontWeight: 'bold',
            cursor: 'default'
        },
    },
})(MenuItem);

/**
 * Support dropdown menu for main header bar
 */
export const SupportDropdownMenu: React.FunctionComponent<SupportDropdownMenuProps> = (props) => {
    const [inventoryIntroductionOpened, setInventoryIntroductionOpened] = useState(false);

    const handleSupportMenuClose = (event: any) => {
        event.stopPropagation();
        props.handleSupportMenuClose();
    };

    const helpCenter = (_event: React.MouseEvent) => {
        props.handleSupportMenuClose();
        // eslint-disable-next-line max-len
        window.open('https://docs.virtana.com', '_blank');
    };

    const watchProductTour = (_event: React.MouseEvent) => {
        props.handleSupportMenuClose();
        setInventoryIntroductionOpened(true);
    };

    const contactSupport = (_event: React.MouseEvent) => {
        props.handleSupportMenuClose();

        ZendeskAPI('webWidget', 'open');
    };

    const virtanaWebsite = (_event: React.MouseEvent) => {
        props.handleSupportMenuClose();
        window.open('https://www.virtana.com', '_blank');
    };

    return (
        <>
            <StyledMenu
                id="hamburger-menu"
                anchorEl={props.menuAnchorEl}
                elevation={0}
                getContentAnchorEl={null}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                keepMounted
                open={Boolean(props.menuAnchorEl)}
                onClose={handleSupportMenuClose}
            >
                <StyledHeader>
                    <ListItemText primary="Help & Support"/>
                </StyledHeader>
                <MenuDivider/>
                <StyledMenuItem
                    data-cy="helpCenter"
                    onClick={(event) => helpCenter(event)}
                >
                    <ListItemIcon style={{ minWidth: 30 }}>
                        <VcioIcon vcio="general-question-circle" iconColor={colors.green_500}/>
                    </ListItemIcon>
                    <ListItemText primary="Help Center"/>
                </StyledMenuItem>
                <StyledMenuItem
                    data-cy="watchProductTour"
                    onClick={(event) => watchProductTour(event)}
                >
                    <ListItemIcon style={{ minWidth: 30 }}>
                        <VcioIcon vcio="video-youtube" iconColor={colors.green_500}/>
                    </ListItemIcon>
                    <ListItemText primary="Watch Product Tour"/>
                </StyledMenuItem>
                <StyledMenuItem
                    data-cy="contactSupport"
                    onClick={(event) => contactSupport(event)}
                >
                    <ListItemIcon style={{ minWidth: 30 }}>
                        <VcioIcon vcio="general-comment" iconColor={colors.green_500}/>
                    </ListItemIcon>
                    <ListItemText primary="Contact Support"/>
                </StyledMenuItem>
                <StyledMenuItem
                    data-cy="virtanaWebsite"
                    onClick={(event) => virtanaWebsite(event)}
                >
                    <ListItemIcon style={{ minWidth: 30 }}>
                        <VcioIcon vcio="general-globe" iconColor={colors.green_500}/>
                    </ListItemIcon>
                    <ListItemText primary="Virtana Website"/>
                </StyledMenuItem>
            </StyledMenu>
            <InventoryIntroductionDialog
                open={inventoryIntroductionOpened}
                onClose={() => setInventoryIntroductionOpened(false)}
            />
        </>
    );
};
