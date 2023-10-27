import {
    Box,
    makeStyles, Tooltip, withStyles,
} from '@material-ui/core';
import React, { useContext } from 'react';
import clsx from 'clsx';
import _ from 'lodash';
import Router from 'next/router';
import { text, colors } from '@styles';
import { MoveGroup, Target } from '@models';
import { VcioIcon } from '../controls/VcioIcon';
import { doRoute, setupNavMenu } from '../../utils';
import { AppContext } from '../../context';

const useStyles = makeStyles({
    root: {
        ...text.regularText,
        color: colors.black_70,
        margin: 0,
        padding: '13px 11px',
        position: 'relative',
        display: 'flex',
        '&.selected': {
            backgroundColor: colors.yellow_50,
        },
        width: '100%',
        '& .counterHighlight': {
            fontSize: 13,
            color: colors.black_70,
            position: 'absolute',
            marginTop: -2,
            right: 0,
            textAlign: 'right',
            '& > span': {
                color: colors.amber_600,
            },
            backgroundColor: colors.green_100,
            borderRadius: 12,
            height: 24,
            cursor: 'pointer',
            display: 'flex',
        },
        '& .apps-and-devices': {
            fontSize: 13,
            color: colors.black_70,
            position: 'absolute',
            marginTop: -2,
            right: 0,
            height: 24,
            textAlign: 'right',
            '& > span': {
                color: colors.amber_600,
            },
            display: 'flex',
        },
    },
    panel: {
        display: 'flex',
        flex: 'auto',
        flexDirection: 'row',
        '& .name': {
            display: 'flex',
        },
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

interface MoveGroupCardProps {
    // The data for the row, provided in InventoryMoveGroup MoveGroupCardCellRenderer
    item: MoveGroup;
    // context object passed to AgGridReact in ListPanel
    context: any;
}

export const MoveGroupCard: React.FunctionComponent<MoveGroupCardProps>  = (props) => {
    const cardType = 'mg';
    const classes = useStyles();
    let doesIdExist = false;
    const appContext = useContext(AppContext);
    const nodeId = 'move-group-list';
    const nodeExpand = ['moveGroups'];
    const nodesCount = props.item && props.item.node_ids && props.item.node_ids.length ? props.item.node_ids.length : 0;
    const appsCount = props.item && props.item.group_ids && props.item.group_ids.length ? props.item.group_ids.length : 0;

    const handleTooltipClick = () => {
        const target: Target = {
            route: '/migration/project/[projectId]/mg/' + props.item.id + '/move-group-info',
            route_as: '/migration/project/' + props.context.project.id + '/mg/' + props.item.id + '/move-group-info'
        };
        setupNavMenu(appContext, 'migration', nodeId, target, props.context.project.project_name, props.context.project.project_instance, nodeExpand);
        doRoute(Router, target);
    };

    _.forEach(props.context.project.results, (result) => {
        if (result.type === cardType) {
            _.forEach(result.params.ids, (id) => {
                if (id === props.item.name) {
                    doesIdExist = true;
                }
            });
        }
    });

    const dynamicWidthOffset = 8;
    const twoRendered = (nodesCount > 0 && appsCount > 0);

    let dynamicWidth = twoRendered ? 85 : 55;

    if (nodesCount > 999) {
        dynamicWidth += (dynamicWidthOffset * 3);
    }
    else if (nodesCount > 99) {
        dynamicWidth += (dynamicWidthOffset * 2);
    }
    else if (nodesCount > 9) {
        dynamicWidth += dynamicWidthOffset;
    }

    if (appsCount > 999) {
        dynamicWidth += (dynamicWidthOffset * 3);
    }
    else if (appsCount > 99) {
        dynamicWidth += (dynamicWidthOffset * 2);
    }
    else if (appsCount > 9) {
        dynamicWidth += dynamicWidthOffset;
    }

    return (
        <Box className={clsx(classes.root)}>
            <Box className={classes.panel}>
                <Box className="name" title={props.item.id}>
                    { props.item.name }
                </Box>
            </Box>
            <Box
                onClick={handleTooltipClick}
                data-cy="moveGroupHighlight"
                style={{ width: dynamicWidth }}
                className={doesIdExist ? 'counterHighlight' : 'apps-and-devices'}
            >
                {
                    nodesCount > 0 &&
                    <LightTooltip
                        data-cy="deviceCountToolTip"
                        title={
                            doesIdExist ? <>Dependencies are calculated<br/>Click to open results</> : ''
                        }
                        arrow
                    >
                        <div data-cy="deviceCount" style={{ marginLeft: 13, paddingTop: 2 }}>
                            {nodesCount}
                            <VcioIcon data-cy="vcio-migration-device" vcio="migration-device" iconColor={colors.blue_gray_500} rem={0.9} style={{ marginTop: -2, marginRight: 6, marginLeft: 1 }}/>
                        </div>
                    </LightTooltip>
                }
                {
                    appsCount > 0 &&
                    <LightTooltip
                        data-cy="appCountToolTip"
                        title={
                            doesIdExist ? <>Dependencies are calculated<br/>Click to open results</> : ''
                        }
                        arrow
                    >
                        <div data-cy="appCount" style={{ marginLeft: twoRendered ? 0 : 13, paddingTop: 2 }}>
                            {appsCount}
                            <VcioIcon vcio="migration-application" iconColor={colors.blue_gray_500} rem={0.9} style={{ marginTop: -2, marginRight: 0, marginLeft: 1 }}/>
                        </div>
                    </LightTooltip>
                }
            </Box>
        </Box>
    );
};
