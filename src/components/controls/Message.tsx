import { Box, Container, ContainerProps, Grid, makeStyles } from '@material-ui/core';
import React from 'react';
import { colors } from '../../styles';

const useStyles = makeStyles({
    container: {
        padding: 0,
        position: 'relative',
    },
    root: {
        opacity: 0.95,
        backgroundColor: colors.blue_gray_50,
        fontWeight: 'normal',
        fontStyle: 'normal',
        letterSpacing: 0,
        color: colors.black_80,
        padding: '16px 24px 16px 24px',
        position: 'relative',
        '&.message-dark': {
            backgroundColor: colors.blue_gray_800,
            color: colors.white_100,
        }
    },
    warning: {
        width: 8,
        opacity: 0.95,
        top: 0,
        left: 0,
        position: 'absolute',
        height: '100%',
        backgroundColor: colors.yellow_600
    },
    success: {
        width: 8,
        opacity: 0.95,
        top: 0,
        left: 0,
        position: 'absolute',
        height: '100%',
        backgroundColor: colors.green_700
    },
});

interface MessageProps extends ContainerProps {
    warning?: boolean;
    success?: boolean;
    dark?: boolean;
}

export const Message: React.FunctionComponent<MessageProps> = (props) => {
    const classes = useStyles();

    return (
        <Container className={classes.container}>
            <Grid
                container
                direction="row"
                justify="center"
                alignItems="center"
                className={classes.root + (props.dark ? ' message-dark' : '')}
            >
                {props.warning && <Box className={classes.warning}/>}
                {props.success && !props.warning && <Box className={classes.success}/>}
                <div>{props.children}</div>
            </Grid>
        </Container>
    );
};
