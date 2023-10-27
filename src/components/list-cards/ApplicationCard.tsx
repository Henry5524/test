import { Box, Grid, makeStyles, Tooltip, withStyles } from '@material-ui/core';
import { NodeGroup, Target } from '@models';
import { colors, text } from '@styles';
import clsx from 'clsx';
import _ from 'lodash';
import Router from 'next/router';
import React, { useCallback, useContext, useMemo } from 'react';
import { AppContext } from '../../context';
import { doRoute, setupNavMenu } from '../../utils';
import { VcioIcon } from '../controls/VcioIcon';

const useStyles = makeStyles({
    root: {
        ...text.regularText,
        color: colors.black_70,
        margin: 0,
        padding: '13px 11px',
        position: 'relative',
        display: 'flex',
        '&.excluded': {
            opacity: .7,
        },
        '& .badge': {
            display: 'flex',
            alignSelf: 'center',
            padding: '2px 8px',
            borderRadius: 14,
            backgroundColor: colors.blue_gray_200,
            color: colors.blue_gray_700,
            fontWeight: 'bold',
        },
        '&.selected': {
            backgroundColor: colors.yellow_50,
            '& .badge': {
                backgroundColor: colors.yellow_300,
            }
        }
    },
    panel: {
        display: 'flex',
        flex: 'auto',
        flexDirection: 'column',
        '& .name': {
            display: 'flex',
        },
        '& .excluded': {
            color: colors.amber_600,
        },
        '& .ips': {
            fontSize: 13,
            color: colors.black_70,
            '& span': {
                color: colors.green_600,
                marginLeft: 4,
            },
        },
        '& .custom-properties': {
            fontSize: 13,
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            '& span': {
                color: colors.blue_gray_500,
                marginRight: 4,
            }
        },
        '& .apps-and-mgs': {
            fontSize: 13,
            marginTop: 8,
            display: 'flex',
            flexWrap: 'wrap',
            color: colors.blue_500,
            '& div': {
                display: 'flex',
                alignItems: 'center',
                marginRight: 8,
            },
        },
    },
    counterHighlight: {
        width: 55,
        backgroundColor: colors.green_100,
        borderRadius: 12,
        height: 24,
        cursor: 'pointer'
    },
    name: {
        display: 'flex',
        marginTop: 0,
    },
    mg: {
        display: 'flex',
        color: colors.blue_500,
        alignItems: 'center',
    },
});

const LightTooltip = withStyles((theme) => ({
    tooltip: {
        backgroundColor: theme.palette.common.white,
        color: 'rgba(0, 0, 0, 0.87)',
        boxShadow: theme.shadows[1],
        fontSize: 11,
    },
    arrow: {
        color: theme.palette.common.white,
        shadow: theme.shadows[1]
    }
}))(Tooltip);

interface ApplicationCardProps {
    // The data for the row, provided in InventoryApplication ApplicationCardCellRenderer
    item: NodeGroup | string | any;
    // context object passed to AgGridReact in ListPanel
    context: any;
}

export const ApplicationCard: React.FunctionComponent<ApplicationCardProps> = (props) => {

    const appContext = useContext(AppContext);

    const settingsStruct: {
        cardType: string;
        nodeId: string;
        deviceCount: number;
        nodeType: string;
        nodeExpand: string[];
        nodeInfo: string;
    } = useMemo(() => {
        const localSettingStruct: {
            cardType: string;
            nodeId: string;
            deviceCount: number;
            nodeType: string;
            nodeExpand: string[];
            nodeInfo: string;
        } = {
            cardType: 'app',
            nodeId: 'applications-list',
            deviceCount: 0,
            nodeType: 'application',
            nodeExpand: ['applications'],
            nodeInfo: 'application-info'
        };
        if (props.item.typeName) {
            if (props.context.project && props.context.project.custom_node_props) {
                _.forEach(props.context.project.custom_node_props, (prop: any) => {
                    if (prop.title === props.item.typeName && prop[props.item.name]) {
                        localSettingStruct.deviceCount = prop[props.item.name].length;
                    }
                });
            }

            localSettingStruct.cardType = 'group';
            localSettingStruct.nodeId = props.item.type + '-List';
            localSettingStruct.nodeExpand = [props.item.type, 'groups'];
            localSettingStruct.nodeType = 'custom/' + props.item.type;
            localSettingStruct.nodeInfo = 'custom-info';
        } else {
            localSettingStruct.deviceCount = props.item && props.item.node_ids ? props.item.node_ids.length : 0;
            localSettingStruct.cardType = 'app';
            localSettingStruct.nodeId = 'applications-list';
            localSettingStruct.nodeExpand = ['applications'];
            localSettingStruct.nodeType = 'application';
            localSettingStruct.nodeInfo = 'application-info';
        }
        return localSettingStruct;
    }, [props.context.project, props.item]);

    const handleTooltipClick = useCallback(() => {
        const target: Target = {
            route: '/migration/project/[projectId]/' + settingsStruct.nodeType + '/' + props.item.id + '/' + settingsStruct.nodeInfo,
            route_as: '/migration/project/' + props.context.project.id + '/' + settingsStruct.nodeType + '/' + props.item.id + '/' + settingsStruct.nodeInfo
        };
        setupNavMenu(appContext, 'migration', settingsStruct.nodeId, target, props.context.project.project_name, props.context.project.project_instance, settingsStruct.nodeExpand);
        doRoute(Router, target);
    }, [settingsStruct.nodeType, settingsStruct.nodeInfo, settingsStruct.nodeId, settingsStruct.nodeExpand, props.item.id, props.context.project.id, props.context.project.project_name, props.context.project.project_instance, appContext]);

    const classes = useStyles();

    const doesIdExist = useMemo(() => {
        let localDoesIdExist = false;
        if (props.context.project && props.context.project.results) {
            _.forEach(props.context.project.results, (result) => {
                if (result.type === settingsStruct.cardType) {
                    _.forEach(result.params.ids, (id) => {
                        if (id === props.item.name) {
                            if (settingsStruct.cardType === 'app') {
                                const appData = _.find(props.context.project.apps, { name: id });
                                if (appData && appData.node_ids.length > 0) {
                                    localDoesIdExist = true;
                                }
                            } else {
                                _.each(props.context.project.custom_node_props, (group: any) => {
                                    if (group[id]) {
                                        localDoesIdExist = true;
                                    }
                                });
                            }
                        }
                    });
                }
            });
        }
        return localDoesIdExist;
    }, [settingsStruct.cardType, props.context.project, props.item.name]);


    const moveGroupNames: string[] = useMemo(() => {
        const localMoveGroupNames: string[] = [];
        if (props.context.project && props.context.project.move_groups) {
            _.each(props.context.project.move_groups, (mg: any) => {
                _.each(mg.group_ids, (groupId) => {
                    // @ts-ignore
                    if (groupId === props.item.id) {
                        localMoveGroupNames.push(mg.name);
                    }
                });
            });
        }
        return localMoveGroupNames;
    }, [props.context.project, props.item.id]);

    const title = useMemo(() => {
        return doesIdExist ?
            <>Dependencies are calculated<br/>Click to open results</> : '';
    }, [doesIdExist]);

    if (typeof (props.item) === 'string') {
        // We are showing a custom property value in each row instead of application info.
        // Note that this was a far easier and better performing approach than creating a separate cell renderer
        // for custom property values - because switching cell renderers at runtime for an ag-grid is complex and slow.
        return (
            <Grid container className={clsx(classes.root)}>
                <Grid item xs className={classes.panel}>
                    {props.item}
                </Grid>
            </Grid>
        );
    }

    return (
        <Grid container className={clsx(classes.root, props.item._disabled && 'excluded')}>
            <Grid item xs className={classes.panel}>
                <Box className={classes.name} title={props.item.id}>
                    {props.item.name}
                </Box>
                {
                    props.item._disabled &&
                    <Box className="excluded">
                        <VcioIcon vcio="general-minus-circle-outline" iconColor={colors.amber_600} style={{ marginTop: -2, marginRight: 4 }}/>
                        excluded
                    </Box>
                }
                {
                    moveGroupNames.length > 0 &&
                    <div className="apps-and-mgs">
                        {
                            moveGroupNames.map((name) => (
                                <span key={name}>
                                    <VcioIcon vcio="migration-move-group" iconColor={colors.blue_500} style={{ marginTop: -4, marginRight: 4 }}/>
                                    <span style={{ marginTop: 12, marginRight: 7 }}>{name}</span>
                                </span>
                            ))
                        }
                    </div>
                }
            </Grid>
            <Grid item xs/>
            <Grid item onClick={handleTooltipClick} data-cy="appHighlight" className={doesIdExist ? classes.counterHighlight : ''} style={{ marginRight: -10 }}>
                {
                    settingsStruct.deviceCount > 0 &&
                    <LightTooltip
                        data-cy="deviceCountToolTip"
                        title={title}
                        arrow
                    >
                        <div data-cy="deviceCount" style={{ marginLeft: settingsStruct.deviceCount > 99 ? 5 : (settingsStruct.deviceCount > 9 ? 10 : 13), marginTop: 2 }}>
                            {settingsStruct.deviceCount}
                            <VcioIcon
                                vcio="migration-device"
                                iconColor={colors.blue_gray_500}
                                rem={0.9}
                                style={{ marginTop: -2, marginRight: 6, marginLeft: 1 }}
                            />
                        </div>
                    </LightTooltip>
                }
            </Grid>
        </Grid>
    );
};
