import { Box, Grid, makeStyles, Tooltip } from '@material-ui/core';
import React from 'react';
import { colors } from '../../styles';
import { VcioIcon } from './VcioIcon';

interface InformationTooltipProps {
    tipIcon?: any;
}

const useStyles = makeStyles({
    tooltip: {
        backgroundColor: 'white',
        color: 'rgba(0, 0, 0, 0.87)',
        borderLeft: '8px solid #bfe6ff',
        borderRadius: 'none',
        boxShadow: '0 2px 15px 0 rgba(15, 45, 104, 0.2)',
        fontSize: 14,
        padding: '24px 40px 15px 10px',
        maxWidth: 435,
        maxHeight: 280,
        cursor: 'pointer',
        overflowY: 'auto'
    }
});

export const InformationTooltip: React.FunctionComponent<InformationTooltipProps> = (props) => {
    const { tipIcon, children }: any = props;

    const infoIcon = <VcioIcon vcio="general-info-circle" iconColor={colors.blue_100} style={{ marginLeft: '5px' }}/>;
    const tooltipIcon = tipIcon || infoIcon;
    const classes = useStyles();

    return (
        <Tooltip
            classes={{
                tooltip: classes.tooltip
            }}
            disableFocusListener
            interactive
            title={
                <Grid container direction="row">
                    <Grid item xs={1}>
                        {tooltipIcon}
                    </Grid>
                    <Grid item xs>
                        <Box pl={2}>
                            {children}
                        </Box>
                    </Grid>
                </Grid>
            }
        >
            <span style={{ cursor: 'pointer' }}>
                {tooltipIcon}
            </span>
        </Tooltip>
    );
};
