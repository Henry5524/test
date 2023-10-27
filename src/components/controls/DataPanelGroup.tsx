import { Box, Grid, Tab, Tabs } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community';
import React, { ReactFragment, useCallback, useMemo } from 'react';
import { colors, text } from '../../styles';
import { DataPanel } from './DataPanel';
import { DataPanelColumn } from './DataPanelColumn';
import { ImageWrapper } from './ImageWrapper';
import { TabPanel } from './TabPanel';
import { Toolbar, ToolbarButtons } from './Toolbar';

const useStyles = makeStyles({
    root: {
        flexGrow: 1,
    },
    cardWrapper: {
        borderRadius: '4px',
        boxShadow: colors.blue_gray_200 + ' 0 1px 0 0',
        border: 'solid 1px',
        borderColor: colors.blue_gray_200,
        backgroundColor: colors.white_100,
    },
    toolbar: {
        ...text.primaryInterfaceTitleH1
    },
});

export interface DataPanelToolbarProps {
    title?: string;
    titleTooltip?: string | React.ReactElement;
    showFilter?: boolean;
    showTotal?: boolean;
    buttons?: ToolbarButtons;
}

export interface DataPanelGroupTabProps {
    tabTitle?: string;
    dataId: string;
    data?: {
        columnDefs: DataPanelColumn[];
        rows: object[];
    };
    source?: {
        name: string | undefined;
        url: string | undefined;
        rowCount?: Function;
        footerText?: string;
        xlsSheetNames?: string[];  // If specified, will only parse the specified xls sheets.  Otherwise will parse all sheets.
    };
    maxWidth?: number;
    suppressAutoHeight?: boolean;
    suppressCenterInDiv?: boolean;

    dataFilter?(columnDefs: DataPanelColumn[], rows: any[]): object[];

    image?: {
        name: string | undefined;
        url: string | undefined;
        footerText?: string;
        onClickHandler?: (imageName: string) => void;
    };

    onGridReady?(event: GridReadyEvent): void;

    agGridOptions?: GridOptions;
}

/**
 * Properties for the data panel
 */
export interface DataPanelGroupProps {
    projectName: string;
    noBorder?: boolean;
    tabs: DataPanelGroupTabProps[];
    toolbar?: DataPanelToolbarProps;
}

function a11yProps(index: any) {
    return {
        id: `scrollable-auto-tab-${index}`,
        'aria-controls': `scrollable-auto-tabpanel-${index}`,
    };
}

/**
 * Multiple Datatables with tabs
 *
 * @param groupProps
 * @constructor
 */
export const DataPanelGroup: React.FunctionComponent<DataPanelGroupProps> = (groupProps: DataPanelGroupProps) => {
    const classes = useStyles();
    const [tabTotals, setTabTotals] = React.useState<{ [key: number]: number }>({ 0: 0 });
    // By default, show the image first
    const [showImage, setShowImage] = React.useState<boolean>(true);
    const [tabState, setTabState] = React.useState<{
        tabNbr: number;
        data: {
            columns?: DataPanelColumn[];
            rows?: object[];
        };
        source: {
            name?: string;
            url?: string;
            xlsSheetNames?: string[];
        };
        image: {
            name?: string;
            url?: string;
        };
    }>({
        tabNbr: 0,
        data: groupProps.tabs[0].data ? groupProps.tabs[0].data : { columns: undefined, rows: undefined },
        source: groupProps.tabs[0].source ? groupProps.tabs[0].source : { name: undefined, url: undefined, xlsSheetNames: undefined },
        image: groupProps.tabs[0].image ? groupProps.tabs[0].image : { name: undefined, url: undefined }
    });
    const [gridApi, setGridApi] = React.useState<GridApi>();

    const handleTabChange = useCallback((_event: React.ChangeEvent<{}>, newValue: number) => {
        // Update the total results to match the displayed tab
        setTotalResults(tabTotals[newValue]);
        setTabState({
            ...tabState, tabNbr: newValue, source: {
                // @ts-ignore
                url: groupProps.tabs[newValue] && groupProps.tabs[newValue].source ? groupProps.tabs[newValue].source.url : undefined,
                // @ts-ignore
                name: groupProps.tabs[newValue] && groupProps.tabs[newValue].source ? groupProps.tabs[newValue].source.name : undefined,
                // @ts-ignore
                xlsSheetNames: groupProps.tabs[newValue] && groupProps.tabs[newValue].source ? groupProps.tabs[newValue].source.xlsSheetNames : undefined,
            },
            image: {
                // @ts-ignore
                url: groupProps.tabs[newValue] && groupProps.tabs[newValue].image ? groupProps.tabs[newValue].image.url : undefined,
                // @ts-ignore
                name: groupProps.tabs[newValue] && groupProps.tabs[newValue].image ? groupProps.tabs[newValue].image.name : undefined
            }
        });
        // previous tab was showing an image, but there is no image on this tab.
        if (!tabState.image.url && showImage) {
            setShowImage(false);
        }
    }, [groupProps.tabs, showImage, tabState, tabTotals]);

    const [totalResults, setTotalResults] = React.useState<number>();
    const updateTotalResults = useCallback((total: number, tabNdx: number = 0) => {
        // Keep track of the total results value for the tab, whether or not it is currently displayed
        if (total !== tabTotals[tabNdx]) {
            const newTotal = tabTotals;
            newTotal[tabNdx] = total;
            setTabTotals(newTotal);
        }
        // If the tab is currently displayed, show that total.
        if (tabNdx === tabState.tabNbr) {
            setTotalResults(total);
        }
    }, [tabState.tabNbr, tabTotals]);

    const imageToggle = useCallback((target: string) => {
        if (target === 'image') {
            setShowImage(true);
        } else {
            setShowImage(false);
        }
    }, []);

    const onGridReady = useCallback((event: GridReadyEvent, ndx: number) => {
        setGridApi(event.api);
        if (groupProps.tabs[ndx].onGridReady) {
            // @ts-ignore
            groupProps.tabs[ndx].onGridReady(event);
        }
    }, [groupProps.tabs]);

    const tabRow: React.ReactFragment = useMemo(() => {
        return groupProps.tabs.map((tab, ndx) => {
            if (tabTotals[ndx] !== 0) {
                const newTotal = tabTotals;
                newTotal[ndx] = 0;
                setTabTotals(newTotal);
            }
            return <Tab label={tab.tabTitle} {...a11yProps(ndx)} key={tab.tabTitle}/>;
        });
    }, [groupProps.tabs, tabTotals]);

    const dataPanelData = useMemo(() => {
        if (!groupProps.tabs[0].data) {
            return <></>;
        }
        return <DataPanel
            projectName={groupProps.projectName}
            dataId={groupProps.tabs[0].dataId}
            data={groupProps.tabs[0].data}
            maxWidth={groupProps.tabs[0].maxWidth}
            suppressAutoHeight={groupProps.tabs[0].suppressAutoHeight}
            suppressCenterInDiv={groupProps.tabs[0].suppressCenterInDiv}
            onGridReady={(event: GridReadyEvent) => {
                onGridReady(event, 0);
            }}
            dataFilter={groupProps.tabs[0].dataFilter}
            totalResultsFn={updateTotalResults}
            agGridOptions={groupProps.tabs[0].agGridOptions}
        />;
    }, [groupProps.projectName, groupProps.tabs, onGridReady, updateTotalResults]);

    const dataPanelSource: ReactFragment = useMemo(() => {
        if (!groupProps.tabs[0].source) {
            return <></>;
        }
        return (
            <>
                <DataPanel
                    projectName={groupProps.projectName}
                    dataId={groupProps.tabs[0].dataId}
                    source={groupProps.tabs[0].source}
                    dataFilter={groupProps.tabs[0].dataFilter}
                    maxWidth={groupProps.tabs[0].maxWidth}
                    suppressAutoHeight={groupProps.tabs[0].suppressAutoHeight}
                    suppressCenterInDiv={groupProps.tabs[0].suppressCenterInDiv}
                    totalResultsFn={updateTotalResults}
                    onGridReady={(event: GridReadyEvent) => {
                        onGridReady(event, 0);
                    }}
                    agGridOptions={groupProps.tabs[0].agGridOptions}
                />
                {
                    // @ts-ignore
                    groupProps.tabs[0].source.footerText &&
                    <Box mt={4}>
                        {
                            // @ts-ignore
                            groupProps.tabs[0].source.footerText
                        }
                    </Box>
                }
            </>
        );
    }, [groupProps.projectName, groupProps.tabs, onGridReady, updateTotalResults]);

    const tabs: React.ReactFragment = useMemo(() => {
        return groupProps.tabs.map((tab, ndx) => {
            return (
                <TabPanel value={tabState.tabNbr} index={ndx} key={tab.tabTitle}>
                    <>
                        {
                            !showImage
                            && tabState.tabNbr === ndx
                            && groupProps.tabs[ndx].data
                            &&
                            <>
                                <DataPanel
                                    projectName={groupProps.projectName}
                                    dataId={groupProps.tabs[ndx].dataId}
                                    data={groupProps.tabs[ndx].data}
                                    maxWidth={groupProps.tabs[ndx].maxWidth}
                                    suppressAutoHeight={groupProps.tabs[ndx].suppressAutoHeight}
                                    suppressCenterInDiv={groupProps.tabs[ndx].suppressCenterInDiv}
                                    onGridReady={(event: GridReadyEvent) => {
                                        onGridReady(event, ndx);
                                    }}
                                    agGridOptions={groupProps.tabs[ndx].agGridOptions}
                                    totalResultsFn={(val: number) => {
                                        updateTotalResults(val, ndx);
                                    }}
                                />
                            </>
                        }
                        {
                            !showImage
                            && tabState.tabNbr === ndx
                            && groupProps.tabs[ndx].source &&
                            <>
                                <DataPanel
                                    projectName={groupProps.projectName}
                                    dataId={groupProps.tabs[ndx].dataId}
                                    source={groupProps.tabs[ndx].source}
                                    maxWidth={groupProps.tabs[ndx].maxWidth}
                                    suppressAutoHeight={groupProps.tabs[ndx].suppressAutoHeight}
                                    suppressCenterInDiv={groupProps.tabs[ndx].suppressCenterInDiv}
                                    onGridReady={(event: GridReadyEvent) => {
                                        onGridReady(event, ndx);
                                    }}
                                    dataFilter={groupProps.tabs[ndx].dataFilter}
                                    totalResultsFn={(val: number) => {
                                        updateTotalResults(val, ndx);
                                    }}
                                    agGridOptions={groupProps.tabs[ndx].agGridOptions}
                                />
                                {
                                    // @ts-ignore
                                    groupProps.tabs[ndx].source && groupProps.tabs[ndx].source.footerText &&
                                    <Box mt={4}>
                                        {
                                            // @ts-ignore
                                            groupProps.tabs[ndx].source.footerText
                                        }
                                    </Box>
                                }
                            </>
                        }
                        {
                            showImage
                            && tabState.tabNbr === ndx
                            && groupProps.tabs[ndx].image &&
                            <>
                                <ImageWrapper
                                    nav={false}
                                    // @ts-ignore
                                    imgPath={groupProps.tabs[ndx].image.url}
                                    // @ts-ignore
                                    onClickHandler={() => {
                                        // @ts-ignore
                                        if (groupProps.tabs[ndx].image.onClickHandler) {
                                            // @ts-ignore
                                            groupProps.tabs[ndx].image.onClickHandler(groupProps.tabs[ndx].image.name);
                                        }
                                    }}
                                />
                                {
                                    // @ts-ignore
                                    groupProps.tabs[ndx].image?.url && groupProps.tabs[ndx].image.footerText &&
                                    <Box mt={4}>
                                        {
                                            // @ts-ignore
                                            groupProps.tabs[ndx].image.footerText
                                        }
                                    </Box>
                                }
                            </>
                        }
                    </>
                </TabPanel>
            );
        });
    }, [groupProps.projectName, groupProps.tabs, onGridReady, showImage, tabState.tabNbr, updateTotalResults]);

    // By default, images will show first if images and data are BOTH available.  But if there is no image, always show the data panel.
    if (showImage
        && groupProps.tabs[tabState.tabNbr]
        && !groupProps.tabs[tabState.tabNbr].image) {
        setShowImage(false);
    }

    return (
        <>
            <Grid item xs>
                <Box className={groupProps.noBorder ? undefined : classes.cardWrapper} padding={groupProps.noBorder ? '' : '24px 32px 24px 32px'}>
                    {
                        groupProps.toolbar &&
                        <Toolbar
                            title={groupProps.toolbar.title}
                            tooltip={groupProps.toolbar.titleTooltip}
                            showFilter={groupProps.toolbar.showFilter}
                            gridApi={gridApi}
                            showTotal={groupProps.toolbar.showTotal}
                            totalResults={totalResults}
                            buttons={groupProps.toolbar.buttons}
                            sourceName={tabState.source.name}
                            sourceUrl={tabState.source.url}
                            sourceImageName={tabState.image.name}
                            sourceImageUrl={tabState.image.url}
                            imageToggle={imageToggle}
                        />
                    }
                    {
                        groupProps.tabs.length > 1 &&
                        <>
                            <Grid item xs={12} className={classes.root}>
                                <Tabs
                                    value={tabState.tabNbr}
                                    onChange={handleTabChange}
                                    indicatorColor="primary"
                                    textColor="primary"
                                    variant="scrollable"
                                    scrollButtons="auto"
                                    aria-label="data panel group"
                                >
                                    {tabRow}
                                </Tabs>
                                {tabs}
                            </Grid>
                        </>
                    }
                    {
                        groupProps.tabs.length === 1 &&
                        <Grid item xs={12}>
                            <>
                                {
                                    !showImage && groupProps.tabs[0] && groupProps.tabs[0].data &&
                                    dataPanelData
                                }
                                {
                                    !showImage && groupProps.tabs[0] && groupProps.tabs[0].source &&
                                    dataPanelSource
                                }
                                {
                                    showImage && groupProps.tabs[0] && groupProps.tabs[0].image &&
                                    <>
                                        <ImageWrapper
                                            nav={false}
                                            // @ts-ignore
                                            imgPath={groupProps.tabs[0].image.url}
                                            // @ts-ignore
                                            // @ts-ignore
                                            onClickHandler={() => {
                                                // @ts-ignore
                                                if (groupProps.tabs[0].image.onClickHandler) {
                                                    // @ts-ignore
                                                    groupProps.tabs[0].image.onClickHandler(groupProps.tabs[0].image.name);
                                                }
                                            }}
                                        />
                                        {
                                            // @ts-ignore
                                            groupProps.tabs[0].image?.url && groupProps.tabs[0].image.footerText &&
                                            <Box mt={4}>
                                                {
                                                    // @ts-ignore
                                                    groupProps.tabs[0].image.footerText
                                                }
                                            </Box>
                                        }
                                    </>
                                }
                            </>
                        </Grid>
                    }
                </Box>
            </Grid>
        </>
    );
};
