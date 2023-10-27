import { Box, Divider, Grid, InputAdornment, makeStyles, TextField, Tooltip } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import { ToggleButtonGroup } from '@material-ui/lab';
import { GridApi } from 'ag-grid-community';
import _ from 'lodash';
import React, { useState } from 'react';
import { downloadFile } from '../../services';
import { colors, text } from '../../styles';
import { DropDownMenuButton } from './DropDownMenuButton';
import { InformationTooltip } from './InformationTooltip';
import { ToolbarButtonGroup } from './ToolbarButtonGroup';
import { TooltipToggleButton } from './TooltipToggleButton';
import { VcioIcon } from './VcioIcon';

export interface ToolbarButtons {
    generalDownloadBtn?: boolean;
    dataSortBtn?: boolean;
    dataColumnsBtn?: boolean;
    filterBtn?: boolean;
}

export interface ToolbarProps {
    title?: string;
    tooltip?: string | React.ReactElement;
    showFilter?: boolean;
    gridApi?: GridApi;
    showTotal?: boolean;
    totalResults?: number;
    sourceName?: string;
    sourceUrl?: string;
    sourceImageName?: string;
    sourceImageUrl?: string;
    buttons?: ToolbarButtons;
    imageToggle?: (target: string) => void;
}

const useStyles = makeStyles({
    toolbar: {
        ...text.primaryInterfaceTitleH1,
        marginBottom: 10,
        display: 'flex',
        flex: 1,
        flexGrow: 1,
    },
    button: {
        marginLeft: 8,
        borderRadius: 4,
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: colors.blue_gray_200
    },
    subText: {
        ...text.h5
    },
    normalText: {
        ...text.regularText
    },
    labelOffset: {
        transform: 'translate(44px, 20px) scale(1)',
    }
});

/**
 * Grid containing specified columns & data with toolbar row showing title and buttons
 *
 * @param props
 * @constructor
 */
export const Toolbar: React.FunctionComponent<ToolbarProps> = (props: ToolbarProps) => {
    const classes = useStyles();
    const buttonList: JSX.Element[] = [];

    const toggleImage = (target: string) => {
        if (props.imageToggle) props.imageToggle(target);
    };
    // By default, the image button is active first (since by default the image view is shown initially)
    const [viewerType, setViewerType] = useState('image');

    const handleViewerTypeChange = (_event: object, viewType: string) => {
        if (viewerType !== null) {
            setViewerType(viewType);
            toggleImage(viewType);
        }
    };

    const buttons = {
        generalDownloadBtn:
            <>
                {
                    props.sourceUrl && props.sourceName && props.sourceImageUrl && props.sourceImageName ?
                        <DropDownMenuButton
                            tooltip="Download"
                            className={classes.button}
                            key='downloadGridOrImageBtn'
                            icon={
                                <>
                                    <VcioIcon vcio="general-download" iconColor={colors.green_500}/>
                                    <VcioIcon vcio="ars-chevron-down" iconColor={colors.blue_gray_500}/>
                                </>
                            }
                            submenu={
                                [
                                    {
                                        icon: 'view-image',
                                        title: 'Download Graph (PNG)',
                                        key: 'viewImage',
                                        onClick: (() => {
                                            downloadFile(
                                                props.sourceImageName,
                                                props.sourceImageUrl
                                            );
                                        })
                                    },
                                    {
                                        icon: 'view-table',
                                        key: 'viewTable',
                                        title: 'Download Data (xlsx)',
                                        onClick: (() => {
                                            if (props.sourceUrl) {
                                                downloadFile(
                                                    props.sourceName,
                                                    props.sourceUrl
                                                );
                                            } else if (props.gridApi) {
                                                props.gridApi.exportDataAsCsv();
                                            }
                                        })
                                    },
                                ]
                            }
                        />
                        :
                        <Tooltip title="Download">
                            <IconButton
                                key="generalDownloadBtn"
                                className={classes.button}
                                onClick={() => {
                                    if (props.sourceUrl || props.sourceImageUrl) {
                                        downloadFile(
                                            props.sourceName || props.sourceImageName,
                                            props.sourceUrl || props.sourceImageUrl
                                        );
                                    } else if (props.gridApi) {
                                        props.gridApi.exportDataAsCsv();
                                    }
                                }}
                            >
                                <VcioIcon vcio="general-download" iconColor={colors.green_500}/>
                            </IconButton>
                        </Tooltip>
                }
            </>,
        dataSortBtn:
            <Tooltip title="Sort" key='dataSortBtn'>
                <IconButton
                    className={classes.button}
                    style={{ padding: '0 7 0 7' }}
                >
                    <VcioIcon vcio="data-sort" iconColor={colors.green_500}/>
                    <VcioIcon vcio="ars-chevron-down" iconColor={colors.blue_gray_500}/>
                </IconButton>
            </Tooltip>,
        dataColumnsBtn:
            <Tooltip title="Data Columns" key="dataColumnsBtn">
                <IconButton
                    className={classes.button}
                    onClick={() => {
                        // if the attached table is an ag-grid, then use it's grid options to open or close the columns panel
                        if (props.gridApi) {
                            const openedToolPanelId = props.gridApi.getOpenedToolPanel();
                            if (openedToolPanelId && openedToolPanelId === 'columns') {
                                props.gridApi.closeToolPanel();
                            } else {
                                props.gridApi.openToolPanel('columns');
                            }
                        }
                    }}
                >
                    <VcioIcon vcio="data-columns" iconColor={colors.green_500}/>
                    <VcioIcon vcio="ars-chevron-down" iconColor={colors.blue_gray_500}/>
                </IconButton>
            </Tooltip>,
        filterBtn:
            <Tooltip title="Filter" key="filterBtn">
                <IconButton
                    className={classes.button}
                    onClick={() => {
                        if (props.gridApi) {
                            const openedToolPanelId = props.gridApi.getOpenedToolPanel();
                            if (openedToolPanelId && openedToolPanelId === 'filters') {
                                props.gridApi.closeToolPanel();
                            } else {
                                props.gridApi.openToolPanel('filters');
                            }
                        }
                    }}
                >
                    <VcioIcon vcio="data-filter" iconColor={colors.green_500}/>
                </IconButton>
            </Tooltip>,
        viewImageOrTableBtn:
            props.buttons && !_.isEmpty(props.sourceImageUrl) &&
            <ToggleButtonGroup
                data-cy='toolbarViewTypeGroup'
                key='viewImageOrTableBtn'
                value={viewerType}
                exclusive
                onChange={handleViewerTypeChange}
            >
                <TooltipToggleButton
                    key='viewImageBtn'
                    dataCy='toolbarViewImageButton'
                    title='View Image'
                    placement='bottom-start'
                    arrow
                    value='image'
                >
                    <VcioIcon vcio="view-image" iconColor={colors.green_500}/>
                </TooltipToggleButton>
                <TooltipToggleButton
                    key='viewTableBtn'
                    dataCy='toolbarViewDataButton'
                    title='View Data'
                    placement="bottom-start"
                    arrow
                    value='data'
                >
                    <VcioIcon vcio="view-table" iconColor={colors.green_500}/>
                </TooltipToggleButton>
            </ToggleButtonGroup>,
        verticalBar:
        // @ts-ignore
            <Divider key="divider" orientation="vertical" flexItem style={{ marginRight: 16, marginLeft: 16 }}/>
    };
    // If both data and image url are provided, show toggle button
    if (props.sourceImageUrl && props.sourceImageName && props.sourceUrl && props.sourceName && props.imageToggle) {
        // @ts-ignore
        buttonList.push(buttons.viewImageOrTableBtn);
    }
    _.forOwn(props.buttons, (_value, key) => {
        if (_value) {
            // @ts-ignore
            buttonList.push(buttons[key]);
        }
    });

    return (
        <>
            <Grid
                container
                direction="row"
                spacing={1}
                alignItems="center"
                justify="flex-end"
                className={classes.toolbar}
                style={{ marginBottom: (props.gridApi ? '0' : '35px') }}
            >
                {
                    props.title &&
                    <>
                        <Grid item>
                            <Grid container direction="row">
                                <Box className={classes.subText}>{props.title}
                                    {
                                        props.tooltip &&
                                        <InformationTooltip>
                                            {props.tooltip}
                                        </InformationTooltip>
                                    }
                                </Box>
                            </Grid>
                        </Grid>
                        {/* Force all remaining content to the right side of the row */}
                        <Grid item xs/>
                    </>
                }
                {
                    props.showFilter &&
                    <Grid item>
                        <Grid container justify="flex-end">
                            <TextField
                                data-cy="moveGroupListFilter"
                                placeholder="Quick Filter..."
                                key="searchBtn"
                                InputLabelProps={{ shrink: true, classes: { root: classes.labelOffset } }}
                                onChange={(event) => {
                                    // if the attached table is an ag-grid, then use it's grid options to set the quick filter
                                    if (props.gridApi) {
                                        props.gridApi.setQuickFilter(event.target.value);
                                    }
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <VcioIcon vcio="general-search"/>
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>
                    </Grid>
                }
                {
                    // If there wasn't a title, the quick filter, if used, will be on the left side of the row
                    // and a spacer will be needed here to force everything else to the right
                    !props.title &&
                    <Grid item xs/>
                }
                {
                    props.showTotal && props.totalResults && props.totalResults > 0 ?
                        <>
                            <Box className={classes.normalText} ml={6}>
                                Results contain {props.totalResults.toLocaleString()} items
                            </Box>
                            <Divider key="totalDivider" orientation="vertical" flexItem style={{ marginRight: 16, marginLeft: 16 }}/>
                        </>
                        : ''
                }
                <Grid item>
                    <ToolbarButtonGroup buttons={buttonList}/>
                </Grid>
            </Grid>
        </>
    );
};
