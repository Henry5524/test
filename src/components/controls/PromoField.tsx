import { makeStyles, OutlinedTextFieldProps, TextField, Tooltip } from '@material-ui/core';
import clsx from 'clsx';
import React from 'react';
import { colors } from '../../styles/styleGuide';

const useStyles = makeStyles({
    root: {
        borderRadius: 4,
        border: 'solid 0 green',
        backgroundColor: colors.white_100,
        borderStyle: 'solid',
        borderColor: colors.green_100,
        color: colors.black_100,
    },
    inputProps: {
        height: 2
    },
    errors: {
        backgroundColor: colors.yellow_100
    }
});

interface PromoFieldProps extends Partial<OutlinedTextFieldProps> {
    errors?: number;
    dataCy?: string;
}

export const PromoField: React.FunctionComponent<PromoFieldProps> = (props) => {
    const { children, className, placeholder, dataCy, ...other } = props;
    const classes = useStyles();
    other.variant = 'outlined';
    other.margin = 'normal';
    other.InputProps =
        {
            classes: {
                input: classes.inputProps
            }
        };

    return (
        <Tooltip
            data-cy={(dataCy || 'base') + 'Tooltip'}
            title={placeholder || ''}
            arrow
            placement="left"
        >
            <TextField
                data-cy={dataCy || 'basePromoField'}
                placeholder={placeholder}
                className={clsx(classes.root, other.errors && classes.errors, className)}
                {...other}
            >
                {children}
            </TextField>
        </Tooltip>
    );
};
