import { Box } from '@material-ui/core';
import React from 'react';

interface TabPanelProps {
    // eslint-disable-next-line react/require-default-props
    children?: React.ReactNode;
    index: any;
    value: any;
    key?: any;
}

/**
 * Wrapper for a tab panel
 * @param props
 * @constructor
 */
export const TabPanel: React.FunctionComponent<TabPanelProps> = (props: TabPanelProps) => {
    const { children, value, index, ...other } = props;

    return (
        <>
            {
                value === index &&
                <Box
                    role="tabpanel"
                    hidden={value !== index}
                    id={`scrollable-auto-tabpanel-${index}`}
                    aria-labelledby={`scrollable-auto-tab-${index}`}
                    {...other}
                    p={3}
                    style={{ display: 'flex', flex: 'auto' }}
                >
                    <Box style={{ display: 'flex', flex: 'auto', flexDirection: 'column' }}>{children}</Box>
                </Box>
            }
        </>
    );
};
