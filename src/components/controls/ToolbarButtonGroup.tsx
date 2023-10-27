import Grid from '@material-ui/core/Grid';
import React from 'react';
import { v4 } from 'uuid';

interface ToolBarButtonProps {
    title?: string;
    buttons: JSX.Element[];
}

/**
 * Toolbar button group.  Container for multiple button/dropdown buttons will handle marking enabled/disabled as appropriate.
 * NOTE: Work in Progress
 *
 * @param props
 * @constructor
 */
export const ToolbarButtonGroup: React.FunctionComponent<ToolBarButtonProps> = (props) => {
    return (
        <Grid container justify="flex-end">
            {
                props.buttons.map(button => {
                    if (!button.key) {
                        return React.cloneElement(button, { key: v4() });
                    }
                    return button;
                })
            }
        </Grid>
    );
};
