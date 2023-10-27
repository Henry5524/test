import {makeStyles, Typography} from '@material-ui/core';
import React from 'react';

const useStyles = makeStyles(() => ({
    copyright: {
        position: 'fixed',
        bottom: 14,
        left: 75,
        fontSize: 14,
        color: 'white'
    }
}));

export const Copyright = () => {
    const classes = useStyles();
    return (
        <Typography data-cy="loginCopyright" variant="body2" align="center" className={classes.copyright}>
            &copy; 2019 Virtana, All rights reserved
        </Typography>
    );
};
