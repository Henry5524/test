import { Button, ButtonProps, makeStyles } from '@material-ui/core';
import clsx from 'clsx';
import React from 'react';

const useStyles = makeStyles({
    root: {
        width: 184,
        height: 38,
        borderRadius: 34,
        backgroundImage: 'linear-gradient(to left, #13a4a4, #2fb564);',
        '&:hover': {
            backgroundImage: 'linear-gradient(to left, #5dc8c8, #60cc8b)'
        },
        '&:disabled': {
            opacity: 0.7,
        },
    }
});

interface PromoButtonProps extends Partial<ButtonProps> {
    dataCy?: string;
}

export const PromoButton: React.FunctionComponent<PromoButtonProps> = (props) => {
    const { children, className, dataCy, ...other } = props;
    const classes = useStyles();

    return (
        <Button
            data-cy={dataCy || 'basePromoButton'}
            className={clsx(classes.root, className)}
            {...other}
        >
            {children}
        </Button>
    );
};
