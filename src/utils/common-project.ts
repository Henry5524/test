import { makeStyles } from '@material-ui/core';
import _ from 'lodash';
import { config } from '../config';
import { Project, ProjectContainer, ProjectResult } from '../models/data';
import { Api, downloadFile } from '../services';
import { colors, text, theme } from '../styles';

export const commonProjectStyles = makeStyles(() => ({
    root: {
        flexGrow: 1,
    },
    toolbar: {
        ...text.primaryInterfaceTitleH1
    },
    container: {
        padding: theme.spacing(10)
    },
    headers: {
        ...text.secondaryInterfaceTitleH1
    },
    table: {
        minWidth: 650,
        border: '0 0 1 0'
    },
    cardWrapper: {
        borderRadius: '4px',
        boxShadow: colors.blue_gray_200 + ' 0 1px 0 0',
        border: 'solid 1px',
        borderColor: colors.blue_gray_200,
        backgroundColor: colors.white_100,
    },
    subText: {
        ...text.h5
    },
    title: {
        color: colors.blue_gray_500,
        fontSize: 15,
        '& > b': {
            ...text.h5,
            color: colors.black_90,
            marginRight: 5
        },
    },
    button: {
        marginTop: -6,
        marginLeft: theme.spacing(2),
        borderRadius: 4,
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: colors.blue_gray_200,
        height: 40
    },
    dropdown: {
        '& > .MuiPaper-root.MuiMenu-paper': {
            backgroundColor: colors.white_100,
            boxShadow: '0 2px 15px 0 rgba(15, 45, 104, 0.15)',
            borderRadius: 4,
            border: 'solid 1px ' + colors.blue_gray_200,
            color: colors.black_100,
        },
        '& > div > div.MuiListItemIcon-root > span.MuiIcon-root': {
            // Styles the icon on the select control
            height: '18px',
            width: '22.5px'
        },
        '& > div > span': {
            // Style the text on the select control
            fontWeight: 600,
            color: colors.black_90
        },
        '& > div > span > span': {
            // Style the count on the select control
            fontWeight: 'normal'
        }
    },
    menuItem: {
        height: '38px'
    },
    menuItemIcon: {
        minWidth: '0px',
        marginRight: '10px'
    },
    menuItemText: {
        ...text.regularText
    },
    menuItemTextCount: {
        ...text.regularText,
        opacity: '0.6'
    },
    linkButton: {
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        textDecoration: 'none',
        display: 'inline',
        margin: 0,
        padding: 0,
    },
    'linkButton:hover': {
        textDecoration: 'none'
    },
    'linkbutton:focus': {
        textDecoration: 'none'
    }
}));

export enum ProjectViewType {
    Inventory = 'inventory',
    Overview = 'overview',
    App = 'app',
    AppList = 'applist',
    MoveGroup = 'mg',
    MoveGroupList = 'mglist',
    CustomGroup = 'group',
}

export enum CalcStatus {
    NotCalculated = 0,
    Running = 1,
    Completed = 2,
    Error = 3
}

/**
 * Specifies what part of a Page to mask with the Material UI Backdrop component.
 */
export enum MaskTarget {
    Nothing = 0,
    ContentOnly = 1,    // Mask the content, leaving the left nav and top header unmasked/enabled
    Everything = 2      // Mask the entire page, including left nav and top header
}

const recurse = (xref: { [key: string]: string }, project: any, childrenOrNode: any) => {
    if (childrenOrNode && childrenOrNode.children && childrenOrNode.children.length > 0) {
        _.forEach(childrenOrNode.children, (child) => {
            recurse(xref, project, child);
        });
    } else {
        xref[childrenOrNode.name] = '/'
            + (project ? project.project_name : '') + '/'
            + (project ? project.project_instance : '') + '/'
            + childrenOrNode.path + '/'
            + childrenOrNode.name;
    }
};

/**
 * Recursively traverse the getResults response to get leaf nodes which have the info about file names and paths.
 *
 * @param project
 * @param type
 */
export function getXref(project: Project | undefined, type: string): Promise<{ [key: string]: string }> {
    return new Promise(resolve => {
        if (!project) {
            resolve({});
        } else {
            Api.getResults(project.id, type)
                .then((resultsData) => {
                    const xref: { [key: string]: string } = {};
                    if (project) {
                        const analysisData = resultsData;
                        _.forEach(analysisData, (child) => {
                            recurse(xref, project, child);
                        });
                    }
                    resolve(xref);
                });
        }
    });
}

/**
 * Examines project results to get status.
 * @param results   Array of project results
 * @param type      Specifies whether to get the status of the overview, app, or mg results.
 */
export const getProjectStatus = (results: ProjectResult[], type: string = ProjectViewType.Overview): number => {

    const result: ProjectResult | undefined = results.find((r: any) => {
        return (r.type === type);
    });
    if (!result) {
        return CalcStatus.NotCalculated;
    }
    if (result.error && result.error.length > 0) {
        return CalcStatus.Error;
    }
    if (result.running) {
        return CalcStatus.Running;
    }
    return CalcStatus.Completed;

};

/**
 * Download all the results for the given project.
 * @param projectId
 * @param _event
 */
export const downloadAllResults = async (projectId: string, _event?: any) => {
    if (_event) {
        _event.stopPropagation();
    }

    Api.axios({
        method: 'get',
        url: '/objects/' + projectId + '/results/root',
        baseURL: config.api_base_url,
    }).then((response) => {
        _.each(response.data, (item) => {
            if (item.is_dir && item.download_url) {
                downloadFile(item.name + '.zip', '/download/' + item.download_url, config.api_base_url);
            }
        });
    });
};


/**
 * Check if the project is calculating.  Note that only one calculation can be running at a time for a project.
 */
export const isCalculating = (project: ProjectContainer | undefined) => {

    if (!project) {
        return false;
    }

    let runningCalculations: boolean = false;

    _.forEach(project.roProjectWithData.results, (projectResult: any) => {

        if (projectResult.type === 'app' && projectResult.running) {
            runningCalculations = true;
            return false;   // end forEach
        }

        if (projectResult.type === 'mg' && projectResult.running) {
            runningCalculations = true;
            return false;   // end forEach
        }

        if (projectResult.type === 'overview' && projectResult.running) {
            runningCalculations = true;
            return false;   // end forEach
        }

        if (projectResult.type === 'group' && projectResult.running) {
            // Custom property calculation is running - in API, 'custom property' is 'group'
            runningCalculations = true;
            return false;   // end forEach
        }

        return null;    // continue
    });

    return runningCalculations;

};
