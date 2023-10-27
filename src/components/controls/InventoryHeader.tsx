import { Box, Button, Grid } from '@material-ui/core';
import React from 'react';
import { Project, ProjectContainer } from '../../models/data';
import { colors, theme } from '../../styles';
import { commonProjectStyles, downloadAllResults } from '../../utils/common-project';
import { VcioIcon } from './VcioIcon';

/**
 * project: project object
 * title: {optional} title to display on left side
 * extraButtons: {optional} extra buttons to show on the right side before the common buttons
 * hamburgerMenu: {optional} far right button (typically a hamburger menu)
 */
interface InformationTooltipProps {
    project: ProjectContainer | Project;
    title?: string | React.ReactElement;
    extraButtons?: React.ReactElement;
    hamburgerMenu?: React.ReactElement;
}

/**
 * Common first line header for the inventory panels, to include the panel title and various button & info objects
 * @param props
 * @constructor
 */
export const InventoryHeader: React.FunctionComponent<InformationTooltipProps> = (props) => {
    const classes = commonProjectStyles();

    return (
        <Grid container style={{ marginBottom: theme.spacing(6) }} className={classes.toolbar}>
            {
                props.title &&
                <Grid item xs={12} sm={4}>
                    <Box data-cy="inventoryHeaderTitle">
                        {props.title}
                    </Box>
                </Grid>
            }
            <Grid item xs/>
            <Grid item>
                <Grid container justify="flex-end" spacing={2}>
                    {props.extraButtons}
                    <Grid item>
                        <Button
                            size="large"
                            variant="outlined"
                            startIcon={<VcioIcon className='vcio-general-download' width={24} iconColor={colors.green_500} data-cy="generalDownload"/>}
                            onClick={(event) => downloadAllResults(props.project instanceof Project ? props.project.id :  props.project.roProjectWithData.id, event)}
                        >
                            All Results
                        </Button>
                    </Grid>
                    {props.hamburgerMenu}
                </Grid>
            </Grid>
        </Grid>
    );
};
