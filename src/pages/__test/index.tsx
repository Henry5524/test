import { Tab, Tabs } from '@material-ui/core';
import { makeStyles, Theme } from '@material-ui/core/styles';
import React from 'react';
import ButtonsTestPage from './buttons';
import GridTestPage from './grid';
import TextInputsTestPage from './text-inputs';

const TabPanel: React.FunctionComponent<any> = (props) => {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`vertical-tabpanel-${index}`}
            {...other}
        >
            {value === index && children}
        </div>
    );
};

function a11yProps(index: any) {
    return {
        id: `vertical-tab-${index}`,
        'aria-controls': `vertical-tabpanel-${index}`,
    };
}

const useStyles = makeStyles((theme: Theme) => ({
    root: {
        flexGrow: 1,
        display: 'flex',
        height: 224,
    },
    tabs: {
        borderRight: `1px solid ${theme.palette.divider}`,
    },
}));

const TestPage: React.FunctionComponent = () => {
    const classes = useStyles();
    const [value, setValue] = React.useState(0);

    const handleChange = (_event: React.ChangeEvent<{}>, newValue: number) => {
        setValue(newValue);
    };

    return (
        <div className={classes.root}>
            <Tabs
                orientation="vertical"
                variant="scrollable"
                value={value}
                onChange={handleChange}
                aria-label="Vertical tabs example"
                className={classes.tabs}
            >
                <Tab label="Grid" {...a11yProps(0)} />
                <Tab label="Text Inputs" {...a11yProps(1)} />
                <Tab label="Buttons" {...a11yProps(2)} />
                <Tab label="Image" {...a11yProps(3)} />
            </Tabs>
            <TabPanel value={value} index={0} style={{ flex: 1 }}>
                <GridTestPage/>
            </TabPanel>
            <TabPanel value={value} index={1} style={{ flex: 1 }}>
                <TextInputsTestPage/>
            </TabPanel>
            <TabPanel value={value} index={2} style={{ flex: 1 }}>
                <ButtonsTestPage/>
            </TabPanel>
        </div>
    );
};

export default TestPage;
