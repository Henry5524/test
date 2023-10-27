import { Grid, Tab, Tabs } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { TabPanel } from './TabPanel';

const useStyles = makeStyles({
    root: {
        display: 'flex',
        flexGrow: 1,
        flexDirection: 'column',
    },
});

/**
 * Properties for the data panel
 */
export interface PanelGroupProps {
    projectName: string;
    tabs: ({
        tabTitle: string;
        tabContent: React.ReactFragment;
    })[];
    tabChange?: Function;
}

function a11yProps(index: any) {
    return {
        id: `scrollable-auto-tab-${index}`,
        'aria-controls': `scrollable-auto-tabpanel-${index}`,
    };
}

/**
 * Multiple tab group handler
 *
 * @param groupProps
 * @constructor
 */
export const PanelGroup: React.FunctionComponent<PanelGroupProps> = (groupProps) => {
    const classes = useStyles();
    const [tabState, setTabState] = React.useState<number>(0);

    const handleTabChange = (_event: React.ChangeEvent<{}>, newValue: number) => {
        setTabState(newValue);
        if (groupProps.tabChange) {
            groupProps.tabChange(_event, newValue);
        }
    };

    return (
        <>
            {
                groupProps.tabs.length > 0 &&
                <Grid item xs={12} className={classes.root} style={{ display: 'flex', flexDirection: 'column' }}>
                    <Tabs
                        value={tabState}
                        onChange={handleTabChange}
                        indicatorColor="primary"
                        textColor="primary"
                        variant="scrollable"
                        scrollButtons="auto"
                        aria-label="panel group"
                    >
                        {
                            groupProps.tabs.map((tab, ndx) => {
                                return <Tab label={tab.tabTitle} {...a11yProps(ndx)} key={tab.tabTitle}/>;
                            })
                        }
                    </Tabs>
                    {
                        groupProps.tabs.map((tab, ndx) => {
                            return (
                                <TabPanel
                                    value={tabState}
                                    index={ndx}
                                    key={tab.tabTitle}
                                >
                                    {tab.tabContent}
                                </TabPanel>
                            );
                        })
                    }
                </Grid>
            }
        </>
    );
};
