import { Icon, makeStyles, IconProps } from '@material-ui/core';
import clsx from 'clsx';
import React from 'react';
import { colors } from '../../styles';

interface VcioIconProps extends IconProps {
    vcio?: string;
    iconColor?: string;
    height?: number;
    width?: number;
    rem?: number;
    forceRem?: boolean;
    vAlign?: string;
    mr?: number;
    ml?: number;
}

export const VcioIcon: React.FunctionComponent<VcioIconProps> = (props) => {
    const { vcio, iconColor, height, width, rem, forceRem, vAlign, children, className, ...other }: any = props;

    const useStyles = makeStyles({
        root: {
            width: width || 20,
            height,
            color: iconColor || colors.black_100,
            fontSize: rem ? rem + 'rem' + (forceRem ? ' !important' : '') : '1rem',
            fontStyle: 'normal',
            textAlign: 'center',
            verticalAlign: vAlign || 'middle',
            marginRight: props.mr + 'px' || 0,
            marginLeft: props.ml + 'px' || 0,
        }
    });

    const classes = useStyles();

    return (
        <Icon className={clsx(classes.root, className, vcio ? 'vcio-' + vcio : null)} {...other}>
            {children}
        </Icon>
    );
};
