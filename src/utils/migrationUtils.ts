import { ProjectContainer } from '@models';
import { config } from '@root/config';
import { DataSheet, downloadAndParse } from '@services';
import { log } from '@utils/log';
import { bitsPerSecRenderer } from '@utils/utils';
import { ICellRendererParams } from 'ag-grid-community';
import _ from 'lodash';

/**
 * Have the calculations been completed on custom properties?
 */
export const customCalcsCompleteFn = ((params: ICellRendererParams, results: any) => {
    return !!(results
        && !results.error
        && results.params.ids.includes(params.data.propertyName));
});

/**
 * Have the calculations been completed on apps?
 */
export const appCalcsCompleteFn = ((params: ICellRendererParams, results: any) => {
    return !!(results
        && !results.error
        && results.params.ids.includes(params.data.application));
});

/**
 * Have the calculations been completed on mgs?
 */
export const mgCalcsCompleteFn = ((params: ICellRendererParams, results: any) => {
    return !!(results
        && !results.error
        && results.params.ids.includes(params.data.moveGroup));
});

/**
 * Determine total Virtual/Physical compute instances in a move group, either directly or else indirectly via inclusion in an Application
 *
 * @param project
 * @param move_group
 */
export const mgTotalComputeInstances = (project: ProjectContainer, mgId: string) => {
    let uniqueDevices: string[] = [];

    if (project?.roProjectWithData.moveGroupMap) {
        const moveGroup = project.roProjectWithData.moveGroupMap[mgId];
        uniqueDevices = moveGroup.node_ids || [];
        _.forEach(moveGroup.group_ids, groupId => {
            uniqueDevices = _.union(uniqueDevices, project.roProjectWithData.appsMap[groupId].node_ids);
        });
    } else {
        log('Invalid project object');
    }
    return uniqueDevices.length;
};

/**
 * Analyze custom properties associated with a move group, return object with list of property i.d.s each with array of referenced values.
 *
 * @param project
 * @param move_group
 */
export const summarizeCustomProperties = (project: ProjectContainer, mgId: string): { [key: string]: string[] } => {
    let customPropertySummary: { [key: string]: string[] } = {};

    if (project?.roProjectWithData.moveGroupMap) {
        const moveGroup = project.roProjectWithData.moveGroupMap[mgId];
        // First get the summary of the individual nodes
        customPropertySummary = _.reduce(moveGroup.node_ids, (acc, node_id) => {
            _.forEach(project.roProjectWithData.nodesMap[node_id]?.custom_props, (value, key: string) => {
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key] = _.union(acc[key], [value]);
            });
            return acc;
        }, customPropertySummary);
        // Now get the summary of applications
        _.forEach(moveGroup.group_ids, groupId => {
            // First the application custom props
            _.forEach(project.roProjectWithData.appsMap[groupId].custom_props, (key, value) => {
                if (!customPropertySummary[key]) {
                    customPropertySummary[key] = [];
                }
                customPropertySummary[key] = _.union(customPropertySummary[key], [value]);
            });
            // Then all of the nodes referenced by the application
            customPropertySummary = _.reduce(project.roProjectWithData.appsMap[groupId].node_ids, (acc, node_id) => {
                _.forEach(project.roProjectWithData.nodesMap[node_id]?.custom_props, (value, key: string) => {
                    if (!acc[key]) {
                        acc[key] = [];
                    }
                    acc[key] = _.union(acc[key], [value]);
                });
                return acc;
            }, customPropertySummary);
        });
    } else {
        log('Invalid project object');
    }

    return customPropertySummary;
};

/**
 * IP Ports reduced data file names for various situations
 *
 * @param type
 * @param itemName
 */
const dataFileKeyFn = (
    type: 'client' | 'client_aggr' | 'server' | 'server_aggr' | 'overview',
    itemName: string) => {
    // YES! "client" requires the file named "server" and vice versa.  It is not a typo.  Don't ask why, just go with it - DC 01/2021
    switch (type) {
        case 'client':
            return `${itemName.replace(/ /g, '').replace(/_/g, '')}_[0-9]+_as_server_.csv`;
        case 'client_aggr':
            return `${itemName.replace(/ /g, '').replace(/_/g, '')}_[0-9]+_as_server_aggr.csv`;
        case 'server':
            return `${itemName.replace(/ /g, '').replace(/_/g, '')}_[0-9]+_as_client_.csv`;
        case 'server_aggr':
            return `${itemName.replace(/ /g, '').replace(/_/g, '')}_[0-9]+_as_client_aggr.csv`;
    }
    return `${itemName.replace(/ /g, '').replace(/_/g, '')}_[0-9]+_ips_ports_reduced.csv`;
};

/**
 * Ip Ports pivot results files for application/custom client/server dependency tables
 *
 * @param type
 * @param itemName
 * @param fnXref
 */
export const getIpPortsResults = (
    type: 'client' | 'client_aggr' | 'server' | 'server_aggr' | 'overview',
    itemName: string,
    fnXref: { [key: string]: string } | undefined) => {
    return new Promise<{
        itemName: string;
        data?: DataSheet[];
        clientCount?: string;
        speed1?: string;
        speed2?: string;
        error: boolean;
    }>((resolve, _reject) => {
        const dataFileKey = dataFileKeyFn(type, itemName);
        const dataFileNameRegex = new RegExp(dataFileKey);
        const dataFileName = _.find(fnXref, (_value: any, key: any) => {
            return key.search(dataFileNameRegex) > -1;
        });
        if (!dataFileName) {
            log(`No data file found for ${itemName} in ${JSON.stringify(fnXref)} `);
            resolve({
                itemName,
                error: true
            });
        } else {
            downloadAndParse(config.results_base_url + dataFileName)
                .then((ipPorts) => {
                    if (type === 'client' || type === 'server') {
                        const speed1Ndx = type === 'server' ? ipPorts[0].headers.indexOf('Avg Throughput Client to Server (Kb/sec)') :
                            (type === 'client') ? ipPorts[0].headers.indexOf('Avg Throughput Server to Client (Kb/sec)') : undefined;
                        const speed2Ndx = type === 'server' ? ipPorts[0].headers.indexOf('Avg Throughput Server to Client (Kb/sec)') :
                            (type === 'client') ? ipPorts[0].headers.indexOf('Avg Throughput Client to Server (Kb/sec)') : undefined;
                        const summary = _.reduce(ipPorts[0].values, (result: any, values) => {
                            const speed1 = speed1Ndx ? parseFloat(values[speed1Ndx]) : 0;
                            const speed2 = speed2Ndx ? parseFloat(values[speed2Ndx]) : 0;
                            if (!isNaN(speed1)) {
                                result.speed1 += speed1;
                            }
                            if (!isNaN(speed2)) {
                                result.speed2 += speed2;
                            }
                            return result;
                        }, { speed1: 0, speed2: 0 });
                        const clientCountNdx = ipPorts[0].headers.indexOf(type === 'server' ? 'Server Application' : 'Client Application');
                        const clientCount = !_.isUndefined(clientCountNdx) ? new Set(_.map(ipPorts[0].values, value => value[clientCountNdx])).size : undefined;
                        resolve({
                            itemName,
                            data: ipPorts,
                            clientCount: clientCount ? clientCount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : undefined,
                            speed1: bitsPerSecRenderer(summary.speed1 * 1000),
                            speed2: bitsPerSecRenderer(summary.speed2 * 1000),
                            error: false
                        });
                    } else {
                        resolve({
                            itemName,
                            data: ipPorts,
                            error: false
                        });
                    }
                });
        }
    });
};
