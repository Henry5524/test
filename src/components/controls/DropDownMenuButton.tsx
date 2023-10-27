import { Box, Button, Tooltip } from '@material-ui/core';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Grow from '@material-ui/core/Grow';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import React, { MouseEventHandler } from 'react';
import { colors } from '../../styles/styleGuide';
import { VcioIcon } from './VcioIcon';

export interface DropDownMenuRow {
    onClick: MouseEventHandler;
    icon?: JSX.Element | string;
    title: string;
    key: string;
}

export interface DropDownProps {
    className?: string;
    enabled?: boolean;
    icon: JSX.Element | string;
    tooltip?: string;
    key: string;
    submenu: DropDownMenuRow[];
}

/**
 * A drop down menu button with support for defining icon and submenus
 *
 * enabled: true to highlight the button as enabled (default: false)
 * icon: JSX.Element to define the icon(s) to be shown on the button
 * submenu: An array of icon (optional) and title
 *
 * @param props
 * @constructor
 */
export const DropDownMenuButton: React.FunctionComponent<DropDownProps> = (props) => {
    const { className, ...other } = props;
    const [enabled, setEnabled] = React.useState(other.enabled);
    const [open, setOpen] = React.useState(false);
    const anchorRef = React.useRef<HTMLButtonElement>(null);

    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen);
        setEnabled(!open);
    };

    const handleClose = (event: React.MouseEvent<EventTarget>) => {
        if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
            return;
        }
        setOpen(false);
        setEnabled(false);
    };

    const handleListKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Tab') {
            event.preventDefault();
            setOpen(false);
        }
    };

    return (
        <>
            <Tooltip title={props.tooltip || ''}>
                <Button
                    ref={anchorRef}
                    aria-controls={open ? 'menu-list-grow' : undefined}
                    aria-haspopup="true"
                    onClick={handleToggle}
                    className={className}
                    style={{ padding: 0, color: colors.green_500, backgroundColor: enabled ? colors.green_100 : 'white' }}
                >
                    {other.icon}
                </Button>
            </Tooltip>
            {
                other.submenu &&

                <Popper open={open} anchorEl={anchorRef.current} role={undefined} transition style={{ zIndex: 1000 }} placement='bottom-start'>
                    {({ TransitionProps, placement }) => (
                        <Grow
                            {...TransitionProps}
                            style={{ transformOrigin: placement === 'bottom' ? 'left top' : 'left bottom' }}
                        >
                            <Paper style={{ backgroundColor: 'white' }}>
                                <ClickAwayListener onClickAway={handleClose}>
                                    <MenuList autoFocusItem={open} onKeyDown={handleListKeyDown}>
                                        {
                                            // @ts-ignore
                                            other.submenu.map((value) => {
                                                return (
                                                    <MenuItem
                                                        onClick={
                                                            (event) => {
                                                                value.onClick(event);
                                                            }
                                                        }
                                                        key={value.key}
                                                    >
                                                        <Box mr={2}>
                                                            {
                                                                typeof value.icon === 'string' &&
                                                                <VcioIcon vcio={value.icon} iconColor={colors.green_500}/>
                                                            }
                                                            {
                                                                typeof value.icon !== 'string' &&
                                                                value.icon
                                                            }
                                                        </Box>
                                                        {value.title}
                                                    </MenuItem>
                                                );
                                            })
                                        }
                                    </MenuList>
                                </ClickAwayListener>
                            </Paper>
                        </Grow>
                    )}
                </Popper>
            }
        </>
    );
};
