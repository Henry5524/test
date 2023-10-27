import { makeStyles, Tooltip } from '@material-ui/core';
import React from 'react';
import { ToggleButton, ToggleButtonProps } from '@material-ui/lab';
import { colors } from '../../styles';

const useStyles = makeStyles({
    toggleButtonRoot: {
        '&.Mui-selected': {
            backgroundColor: colors.green_50,
            borderLeftColor: colors.green_200
        },
    },
    toggleButtonSelected: {
        borderRadius: 4,
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: colors.green_200,
    },
});

interface TooltipToggleButtonProps extends Partial<ToggleButtonProps> {
    title: string;
    arrow: boolean;
    placement: any;
    dataCy?: string;
}

export const TooltipToggleButton: React.FunctionComponent<TooltipToggleButtonProps> = (props) => {
    const {
        title, arrow, placement, dataCy, ...other
    } = props;
    const classes = useStyles();

    return (
        <Tooltip title={props.title} arrow={props.arrow} placement={props.placement}>
            <ToggleButton key={props.key} data-cy={props.dataCy || 'toggleButton'} classes={{ root: classes.toggleButtonRoot, selected: classes.toggleButtonSelected }} {...other}>{props.children}</ToggleButton>
        </Tooltip>
    );
};
