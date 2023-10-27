import { Box, makeStyles } from '@material-ui/core';
import { MoveGroup, NetworkNode, NodeGroup } from '@models';

import { colors, text } from '@styles';

import clsx from 'clsx';
import React from 'react';
import { VcioIcon } from '../controls';

const useStyles = makeStyles({
    root: {
        ...text.regularText,
        color: colors.black_90,
        margin: 0,
        padding: '13px 11px',
        position: 'relative',
        display: 'flex',
        '&.selected': {
            backgroundColor: colors.yellow_50,
        },
        '&.excluded': {
            opacity: .7,
        },
        '& .virtual': {
            fontSize: 13,
            color: colors.black_70,
            position: 'absolute',
            top: 5,
            right: 15,
            textAlign: 'right',
            '& > span': {
                color: colors.amber_600,
            },
        },
        width: '100%',
    },
    panel: {
        display: 'flex',
        flex: 'auto',
        flexDirection: 'column',
        '& .name': {
            display: 'flex',
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
});

interface DeviceCardProps {
    // The data for the row, provided by InventoryDevice DeviceCardCellRenderer
    item: any;
    // Provided by InventoryDevice DeviceCardCellRenderer
    appsMap: { [id: string]: NodeGroup | MoveGroup };
}


export const DeviceCard: React.FunctionComponent<DeviceCardProps> = (props) => {

    const classes = useStyles();
    const cpKeys = props.item.custom_props && Object.keys(props.item.custom_props).length > 0 ? Object.keys(props.item.custom_props) : null;

    return (
        <Box className={clsx(classes.root, props.item._disabled && 'excluded')}>
            <Box className={classes.panel}>
                <Box className="name" title={props.item.id}>
                    {props.item.name}
                </Box>
                {
                    props.item.ips && props.item.ips.length > 0 &&
                    <Box className="ips" title={props.item.id}>
                        {props.item.ips[0]}
                        {
                            props.item.ips.length > 1 &&
                            <span>(+{props.item.ips.length - 1})</span>
                        }
                    </Box>
                }
                {
                    cpKeys &&
                    <div className="custom-properties" key={'cpg-' + props.item.id}>
                        {
                            cpKeys.map((key) => {
                                if (props.item.cpNameToTitleMap[key]) {
                                    return (
                                        <span key={'cpt-' + key + '-' + props.item.id}>
                                            {props.item.cpNameToTitleMap[key].title} {props.item.custom_props[key]}
                                        </span>
                                    );
                                }
                                return '';  // Skips custom properties that were deleted from the Manage Custom Properties dialog
                            })
                        }
                    </div>
                }
                {
                    props.item.apps && props.item.apps.length > 0 &&
                    <div className="apps-and-mgs">
                        {
                            props.item.apps.map((id: string) => (
                                <span key={'at-' + id}>
                                    <VcioIcon vcio="migration-application" iconColor={colors.blue_500} style={{ marginTop: -4, marginRight: 4 }}/>
                                    <span style={{ marginTop: 12, marginRight: 7 }}>{props.appsMap[id] ? props.appsMap[id].name : 'UnknownApp'}</span>
                                </span>
                            ))
                        }
                    </div>
                }
                {
                    props.item.mgid &&
                    <div className="apps-and-mgs">
                        {
                            props.item.mgid &&
                            <span>
                                <VcioIcon vcio="migration-move-group" iconColor={colors.blue_500} style={{ marginTop: -4, marginRight: 4 }}/>
                                <span
                                    style={{ marginTop: 12, marginRight: 7 }}
                                >
                                    {props.appsMap[props.item.mgid] ? props.appsMap[props.item.mgid].name : 'UnknownMG'}
                                </span>
                            </span>
                        }
                    </div>
                }
            </Box>
            {
                props.item.type == NetworkNode.Type.Virtual &&
                <Box className="virtual">
                    Virtual
                    {
                        props.item._disabled &&
                        <>
                            <br />
                            <VcioIcon vcio="general-minus-circle-outline" iconColor={colors.amber_600} style={{ marginTop: -4, marginRight: 4 }} />
                            <span className="excluded">excluded</span>
                        </>
                    }
                </Box>
            }
        </Box>
    );
};
