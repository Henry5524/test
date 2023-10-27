import React from 'react';
import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core';
import { colors } from '../../styles';

const useStyles = makeStyles(() => ({
    container: {
        margin: '12% auto auto auto',
        textAlign: 'center'
    },
    msgText: {
        marginTop: '39px',
        marginBottom: '20px',
        color: colors.blue_gray_500
    }
}));

export interface NoDataProps {
    msg?: string | JSX.Element;
    icon?: string | JSX.Element;
}

/**
 * Used to show an icon and message in place of actual content when there is not any content.
 * Shows an optional centered icon above optional centered text.
 * @param props
 *      msg:    The text message
 *      icon:   The VcioIcon
 */
export const NoData: React.FunctionComponent<NoDataProps> = (props: NoDataProps) => {

    const classes = useStyles();

    return (
        <>
            <Box className={classes.container}>
                {props.icon}
                <div className={classes.msgText}>
                    {props.msg}
                </div>
            </Box>
        </>
    );
};
