import { CircularProgress, Grid, IconButton, Link, makeStyles, Paper, Slide } from '@material-ui/core';
import { TreeItem, TreeView } from '@material-ui/lab';
import _ from 'lodash';
import { useRouter } from 'next/router';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { AppContext } from '../../context';
import {
    CustomProperty,
    initializeTabNavigationItem,
    NavigationMenu,
    NavigationMenuNode,
    TabNavigationContext,
    TabNavigationItem
} from '../../models';
import { useProject } from '../../services';
import { colors } from '../../styles';
import { doRoute, log } from '../../utils';
import { VcioIcon } from '../controls';

const LOGGING: boolean = false;
const logx = (msg: string, ...more: any[]): void => {
    if (LOGGING) {
        log(msg, more);
    }
};
const AUTO_EXPAND_GROUP_NODES_TO_SHOW_CHILD_CALC_SPINNERS: boolean = true;

/**
 * Find the requested node in the given nodes array.  Typically called with the nodes array of a NavigationMenu
 * looking for a specific node (by key).  Calls self recursively to examine child nodes.
 *
 * @param nodes     The nodes property from a NavigationMenu or a NavigationMenuNode.
 * @param keyValue  The key (nodeId) of the node we are looking for.
 * @returns NavigationMenuNode  The found node, or null if not found.
 */
const findNavMenuNode = (nodes: NavigationMenuNode[], keyValue: string): NavigationMenuNode | null => {

    let foundNode: NavigationMenuNode | null = null;

    _.forEach(nodes, (node: NavigationMenuNode) => {

        if (node.key === keyValue) {
            foundNode = node;
            return false;  // End loop
        }
        if (node.nodes && node.nodes.length > 0) {
            foundNode = findNavMenuNode(node.nodes, keyValue);
            if (foundNode) {
                return false; // End loop
            }
        }
        return null;    // Continue loop
    });

    return foundNode;
};

/**
 * Deletes all custom property nodes from the specified nodes array.  These will be all the level 1 nodes that
 * are not specified in keepKeys.
 *
 * @param nodes     Array of NavigationMenuNodes
 * @param keepKeys  Array of strings.  The keys of nodes that should not be deleted.
 */
const deleteCustomPropertyNodes = (nodes: any, keepKeys: string[]): void => {
    _.remove(nodes, (n: any) => !(keepKeys.includes(n.key) && n.level === 1));
};

/**
 * Given the TabNavigationContext from app context, find the item for the specified tab.  TabNavigationContext will
 * contain one TabNavigationItem entry for each tab that has been visited by the user.  This allows the navigation to
 * be restored to the look it had before when revisiting the tab.
 *
 * @param tabNavigationContext     From app context
 * @param name                     tab name
 * @returns                        The TabNavigationItem for the specified tab.
 */
const getTabNavigationItem = (tabNavigationContext: TabNavigationContext, name: string): TabNavigationItem => {
    let navNode: TabNavigationItem | undefined;
    navNode = tabNavigationContext.tab_navigation_items.find((node) => {
        return (node.tab_name === name);
    });
    if (!navNode) {
        // This should never happen
        navNode = initializeTabNavigationItem();
    }
    return navNode;
};

/**
 * Replaces the TabNavigationItem in the TabNavigationContext for the current tab, with the updated TabNavigationItem.
 * @param tabNavigationContext  Context that holds an array of TabNavigationItem, one for each visited tab
 * @param tabNavigationItem     The look/feel of the current tab
 * @param name                  The current tab name
 */
const replaceTabNavigationItem = (tabNavigationContext: TabNavigationContext, tabNavigationItem: TabNavigationItem, name: string) => {
    const index = _.findIndex(tabNavigationContext.tab_navigation_items, { tab_name: name });
    tabNavigationContext.tab_navigation_items.splice(index, 1, tabNavigationItem);
};


const useStyles = makeStyles(theme => ({
    navShow: {
        height: '100%'
    },
    navHide: {
        display: 'none'
    },
    nav: {
        backgroundColor: colors.blue_gray_50,
        borderRightWidth: '1px',
        borderRightStyle: 'solid',
        borderRightColor: colors.blue_gray_200,
        height: '100%',
        width: '260px',
        display: 'flex',
        flexDirection: 'column',
        flex: 'auto',
        position: 'relative',
    },
    navnav: {
        overflowX: 'hidden',
        overflowY: 'auto',
        position: 'absolute',
        top: 0,
        right: 0,
        left: 0,
        bottom: 0,
    },
    navHdr: {
        display: 'flex',
        flexDirection: 'column',
        paddingLeft: '46px'
    },
    top: {
        marginTop: '19px',
        marginBottom: '8px',
        color: colors.green_600,
        height: '18px',
        fontFamily: 'Open Sans',
        fontSize: '12px',
        fontWeight: 'normal',
        fontStretch: 'normal',
        fontStyle: 'normal',
        lineHeight: '1.5',
        letterSpacing: 'normal'
    },
    topLink: {
        color: colors.green_600
    },
    noTopLink: {
        marginBottom: '28px'
    },
    titleAndIconWrapper: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        paddingLeft: '4px'
    },
    title: {
        fontFamily: 'Muli',
        fontSize: '20px',
        fontWeight: 'normal',
        fontStretch: 'normal',
        fontStyle: 'normal',
        lineHeight: '1.15',
        letterSpacing: 'normal',
        color: 'rgba(0, 0, 0, 0.7)'
    },
    subtitle: {
        height: '23px',
        fontFamily: 'Open Sans',
        fontSize: '15px',
        fontWeight: 600,
        fontStretch: 'normal',
        fontStyle: 'normal',
        lineHeight: '1.5',
        letterSpacing: 'normal',
        color: 'rgba(0, 0, 0, 0.7)',
        paddingLeft: '4px',
        marginTop: '3px'
    },
    navCollapseButton: {
        // The circular button with icon that will collapse the left nav
        width: '25px',
        height: '25px',
        position: 'absolute',
        left: 246,
        top: 34,
        zIndex: 1,
        color: colors.green_500,
        backgroundColor: `${theme.palette.background.paper} !important`,
        boxShadow: `0 0 5px 0 ${theme.palette.grey[400]}`
    },
    navBody: {
        padding: theme.spacing(6, 0, 0, 6)
    },
    treeContent: {
        paddingTop: '3px',
        paddingBottom: '3px',
        height: '36px',
        borderRadius: theme.spacing(5, 0, 0, 5),
        '&:hover': {
            // Hovered group nodes, backgroundColor should be #edf1f7 opacity 0.6
            backgroundColor: 'rgba(237, 241, 247, 0.6)'
        }
    },
    treeContentLeafSelected: {
        paddingTop: '3px',
        paddingBottom: '3px',
        borderRadius: theme.spacing(5, 0, 0, 5),
        backgroundColor: `${theme.palette.secondary.light} !important`,
        borderRight: '4px solid #19b382',
        color: colors.black_90,
        '&:hover': {
            // Hovered group nodes, backgroundColor should be #edf1f7 opacity 0.6
            backgroundColor: 'rgba(237, 241, 247, 0.6)'
        },
        '& > div > div:last-of-type': {
            // Clicked leaf nodes - backgroundColor light green with black text
            backgroundColor: `${theme.palette.secondary.light} !important`,
            color: colors.black_90
        }
    },
    treeContentGroupSelected: {
        paddingTop: '3px',
        paddingBottom: '3px',
        borderRadius: theme.spacing(5, 0, 0, 5),
        backgroundColor: `${colors.blue_gray_50} !important`,
        '&:hover': {
            // Hovered group nodes, backgroundColor should be #edf1f7 opacity 0.6
            backgroundColor: 'rgba(237, 241, 247, 0.6)'
        },
        '&:focus > .MuiTreeItem-content .MuiTreeItem-label': {
            // Clicked group nodes - backgroundColor same as nav backgroundColor
            backgroundColor: `${colors.blue_gray_50} !important`
        }
    },
    treeItemLabelLeaf: {
        padding: theme.spacing(2, 0, 2, 1),
        minHeight: '16px',
        fontFamily: 'Muli',
        fontSize: '14px',
        fontStretch: 'normal',
        fontStyle: 'normal',
        lineHeight: '1.15',
        letterSpacing: 'normal',
        fontWeight: 'normal',
        color: colors.green_600,
        '&:hover': {
            // We set hover backgroundColor in treeContent class,
            // we just want to see that same color here.
            backgroundColor: 'transparent'
        }
    },
    treeItemLabelGroup: {
        padding: theme.spacing(2, 0, 2, 1),
        minHeight: '16px',
        fontFamily: 'Muli',
        fontSize: '14px',
        fontStretch: 'normal',
        fontStyle: 'normal',
        lineHeight: '1.15',
        letterSpacing: 'normal',
        fontWeight: 600,
        color: colors.black_90,
        '&:hover': {
            // We set hover backgroundColor in treeContent class,
            // we just want to see that same color here.
            backgroundColor: 'transparent'
        }
    },
    navExpandContainer: {
        width: '36.5px',
        height: '100%'
    },
    navExpandShaded: {
        // The vertical strip at far left when the left nav is collapsed
        width: '24px',
        height: '100%',
        backgroundColor: colors.blue_gray_50,
        borderRightWidth: '1px',
        borderRightStyle: 'solid',
        borderRightColor: colors.blue_gray_200
    },
    navExpandButton: {
        // The circular button with icon that will expand a collapsed left nav
        width: '25px',
        height: '25px',
        marginLeft: '10px',
        color: colors.green_500,
        backgroundColor: `${theme.palette.background.paper} !important`,
        boxShadow: `0 0 5px 0 ${theme.palette.grey[400]}`
    }
}));


interface TreeNavProps {
    navMenu: NavigationMenu;
    forceParentRender: Function;    // Pass a new empty object to this function and the Page component will re-render.
}

const dynamicCustomPropertiesInitialState: NavigationMenuNode[] = [];

/**
 * TreeNav is the left hand navigation on the site.  It is included by the Page component.
 * Navigation menus are defined using json in navigation.js - normally a navigation menu is defined for each top tab.
 * However; a navigation menu may be defined for a specific page - such that visiting that page switches to a whole new
 * left nav.
 *
 * Note that when you leave a tab for another tab, then come back to a page for the original tab, the left nav will be
 * restored to the look it had before - on the same page as before - with the same menu groups open, ...etc.
 *
 * @param props     The navigation menu json
 */
export const TreeNav: React.FunctionComponent<TreeNavProps> = (props) => {
    const { navMenu: pNavMenu, forceParentRender: pForceParentRender } = props;

    const router = useRouter();
    const { query: { projectId } } = useRouter();
    const { data: project } = useProject(projectId as string);

    logx('TreeNav: ---------- rendering for pathname=', router.pathname, ' ----------');

    const tabName = pNavMenu.tab_name;

    const topLink: any = useMemo(() => {
        if (pNavMenu.top_link) {
            return {
                label: pNavMenu.top_link.label,
                target: pNavMenu.top_link.target
            };
        }
        return null;
    }, [pNavMenu.top_link]);

    const classes = useStyles();

    // Grab context
    const appContext = useContext(AppContext);
    const { tabNavigationContext } = appContext;

    // ----------  Begin - initialize component state from context ----------
    const tabNavigationItem: TabNavigationItem = getTabNavigationItem(tabNavigationContext, tabName);
    const switchedProjects: boolean = useMemo(() => projectId !== tabNavigationItem.projectId, [projectId, tabNavigationItem.projectId]);

    // Tracks if the navigation menu itself is expanded (open) or collapsed to a thin strip at left
    const openInitialState: boolean = useMemo(() => tabNavigationItem ? tabNavigationItem.nav_open : true, [tabNavigationItem]);
    const [open, setOpen] = useState(openInitialState);

    // Was the navigation menu opened by hovering the mouse over a collapsed left nav?
    const [openByMouseEnter, setOpenByMouseEnter] = useState(false);

    // expanded tracks which menu nodes are expanded
    const expandedInitialState: string[] = useMemo(() => tabNavigationItem ? tabNavigationItem.expanded : [], [tabNavigationItem]);
    const [expanded, setExpanded] = useState(expandedInitialState);

    // Auto expand collapsed group nodes when a child node shows a calculation spinner.
    // Holds the navigation node key of a node that was auto-expanded.  For example: We auto expand the Applications
    // node in the menu when calculating applications so that we can show the spinner next to  the child Application
    // Analysis Summary node.
    const [autoExpandedNode, setAutoExpandedNode] = useState('');

    // selected tracks which menu node is selected
    const selectedInitialState: string = useMemo(() => tabNavigationItem ? tabNavigationItem.selected : '', [tabNavigationItem]);
    const [selected, setSelected] = useState(selectedInitialState);

    const navMenuDynamicInitialState: NavigationMenu = useMemo(() => switchedProjects ?
        _.cloneDeep(pNavMenu) :
        tabNavigationItem && tabNavigationItem.navMenuDynamic ? _.cloneDeep(tabNavigationItem.navMenuDynamic) : _.cloneDeep(pNavMenu), [pNavMenu, switchedProjects, tabNavigationItem]);
    const [navMenuDynamic, setNavMenuDynamic] = useState(navMenuDynamicInitialState);

    const [dynamicCustomProperties, setDynamicCustomProperties] = useState(dynamicCustomPropertiesInitialState);

    const navOpen: boolean = useMemo(() => tabNavigationItem.nav_open || openByMouseEnter, [openByMouseEnter, tabNavigationItem.nav_open]);

    // ----------  End - initialize component state from context ----------

    const pageHasLeftNav: boolean = useMemo(() => {
        return pNavMenu.nodes.length !== 0;
    }, [pNavMenu.nodes.length]);

    const showLeftNav: boolean = useMemo(() => (open && pageHasLeftNav) || (navOpen && pageHasLeftNav), [navOpen, open, pageHasLeftNav]);

    // ----------  Begin: fetch project data code ----------

    /**
     * Auto expand collapsed group nodes when a child node shows a calculation spinner.
     * Example: The Applications group node is collapsed, hiding the child Analysis Summary node.  Calculation is
     * started on one or more applications.  A spinner is added to Applications/Analysis Summary.  Automatically
     * expand Applications so the user can see the Analysis Summary spinner.
     *
     * @param key   The key of the group node
     */
    const autoExpandNode = useCallback((key: string): void => {

        if (!AUTO_EXPAND_GROUP_NODES_TO_SHOW_CHILD_CALC_SPINNERS) {
            return;
        }

        if (autoExpandedNode === key) {
            // We only auto expand the group node once.  if user closes the group node, we do not want to auto expand
            // it again.
            return;
        }

        if (!(expanded.includes(key))) {
            const newExpanded: string[] = _.cloneDeep(expanded);
            newExpanded.push(key);
            setExpanded(newExpanded);
            setAutoExpandedNode(key);
            tabNavigationItem.expanded = newExpanded;
            replaceTabNavigationItem(tabNavigationContext, tabNavigationItem, tabName);
        }
    }, [autoExpandedNode, expanded, tabName, tabNavigationContext, tabNavigationItem]);


    /*
        Examine the projects custom_node_props to create menu nodes for each custom property.  Note that we don't need
        to do this each render, just when the custom_node_props (or project name/instance) change. So, we memoize the
        function call.
     */
    const customPropMenuNodes = useMemo((): NavigationMenuNode[] => {

        logx('TreeNav: customPropMenuNodes running');

        if (!project) {
            // Should never happen, we check for data before calling this function.
            return [];
        }

        if (!project.roProjectWithData.custom_node_props) {
            return [];
        }

        const nodes: NavigationMenuNode[] = [];

        _.forEach(project.roProjectWithData.custom_node_props, (projectCustomNodeProp) => {
            // Show the custom property if it has a name (misnamed id) and a title (the title is shown to the user)
            // and - if the name is not a 36 character uuid.  When the inventory page adds a new custom property, it
            // is given a uuid for the name.  When the inventory page is saved, the backend converts the name to
            // something like 'C42067'.  So, if we encounter a name that is a uuid, we know it is a new custom property
            // that has not been saved yet.  We do not want to show unsaved custom properties in the left nav.
            if (projectCustomNodeProp.title && projectCustomNodeProp.name && projectCustomNodeProp.name.length !== 36) {
                const newNode: NavigationMenuNode = {
                    name: projectCustomNodeProp.title,
                    key: projectCustomNodeProp.name,
                    level: 1,
                    nodes: [
                        {
                            name: `${projectCustomNodeProp.title} List`,
                            key: `${projectCustomNodeProp.name}-List`,
                            title: project.roProjectWithData.project_name,
                            subtitle: project.roProjectWithData.project_instance,
                            level: 2,
                            target: {
                                route: `/migration/project/${projectId}/custom/${projectCustomNodeProp.name}/custom-property-list`,
                                route_as: `/migration/project/${projectId}/custom/${projectCustomNodeProp.name}/custom-property-list`
                            }
                        },
                        {
                            name: 'Analysis Summary',
                            key: `${projectCustomNodeProp.name}-Analysis-Summary`,
                            title: project.roProjectWithData.project_name,
                            subtitle: project.roProjectWithData.project_instance,
                            level: 2,
                            target: {
                                route: `/migration/project/${projectId}/custom/${projectCustomNodeProp.name}/custom-property-summary`,
                                route_as: `/migration/project/${projectId}/custom/${projectCustomNodeProp.name}/custom-property-summary`
                            }
                        },
                    ]
                };
                nodes.push(newNode);
            }
        });

        return nodes;
    }, [project?.roProjectWithData.custom_node_props,
            project?.roProjectWithData.project_name,
            project?.roProjectWithData.project_instance]);


    const getCustomPropertiesChanged = (): boolean => {
        if (project) {
            if (customPropMenuNodes.length !== dynamicCustomProperties.length) {
                return true;
            }
            const difference: NavigationMenuNode[] = _.differenceWith(customPropMenuNodes, dynamicCustomProperties, _.isEqual);
            if (difference.length > 0) {
                return true;
            }
        }
        return false;
    };

    const customPropertiesChanged: boolean = getCustomPropertiesChanged();

    if (project) {
        logx('TreeNav: switchedProjects=', switchedProjects);
        logx('TreeNav: customPropertiesChanged=', customPropertiesChanged);
        if (customPropertiesChanged || switchedProjects) {
            // Delete prev custom property nodes
            const keysToKeep: string[] = ['inventory', 'environment-overview', 'applications', 'moveGroups'];
            deleteCustomPropertyNodes(navMenuDynamic.nodes, keysToKeep);
            // Add new nodes
            _.forEach(customPropMenuNodes, (cp) => {
                logx(`TreeNav: adding custom property with key=${cp.key} and name=${cp.name}`);
                navMenuDynamic.nodes.push(cp);
            });
        }
        if (switchedProjects || customPropertiesChanged) {
            setDynamicCustomProperties(customPropMenuNodes);
            setNavMenuDynamic(navMenuDynamic);
            tabNavigationItem.navMenuDynamic = navMenuDynamic;
            if (switchedProjects) {
                tabNavigationItem.projectId = projectId as string;
            }
            replaceTabNavigationItem(tabNavigationContext, tabNavigationItem, tabName);
        }
    }

    /**
     * Show the spinning icon next to:
     *  Applications - Analysis Summary navigation node if any applications are calculating.
     *  Move Groups - Analysis Summary navigation node if any move groups are calculating.
     *  The custom property Analysis Summary navigation node if the particular custom property is calculating.
     */
    useMemo(() => {

        logx('TreeNav: calc spinner logic running');

        if (!project) {
            return;
        }

        _.forEach(project.roProjectWithData.results, (projectResult: any) => {

            logx(`TreeNav: calc spinner logic type=${projectResult.type} ` +
                projectResult.groupName ? `CP=${projectResult.groupName} ` : '' +
                `running=${projectResult.running}`);

            if (projectResult.type === 'app') {
                const appAnalysisSummaryNode: NavigationMenuNode | null = findNavMenuNode(navMenuDynamic.nodes, 'applications-analysis-summary');
                if (appAnalysisSummaryNode) {
                    if (projectResult.running) {
                        logx('TreeNav: adding calc spinner for applications analysis summary');
                        appAnalysisSummaryNode.icon_class = 'CircularProgress';
                        autoExpandNode('applications');
                    } else if (projectResult.error && projectResult.error.length > 0) {
                        logx('TreeNav: adding calc error icon for applications analysis summary');
                        appAnalysisSummaryNode.icon_class = 'vcio-status-alarm';
                        autoExpandNode('applications');
                    } else {
                        appAnalysisSummaryNode.icon_class = '';
                    }
                }
            } else if (projectResult.type === 'mg') {
                const mgAnalysisSummaryNode: NavigationMenuNode | null = findNavMenuNode(navMenuDynamic.nodes, 'move-groups-analysis-summary');
                if (mgAnalysisSummaryNode) {
                    if (projectResult.running) {
                        logx('TreeNav: adding calc spinner for move groups analysis summary');
                        mgAnalysisSummaryNode.icon_class = 'CircularProgress';
                        autoExpandNode('moveGroups');
                    } else if (projectResult.error && projectResult.error.length > 0) {
                        logx('TreeNav: adding calc error icon for move groups analysis summary');
                        mgAnalysisSummaryNode.icon_class = 'vcio-status-alarm';
                        autoExpandNode('moveGroups');
                    } else {
                        mgAnalysisSummaryNode.icon_class = '';
                    }
                }
            } else if (projectResult.type === 'overview') {
                const envOverviewNode: NavigationMenuNode | null = findNavMenuNode(navMenuDynamic.nodes, 'environment-overview');
                if (envOverviewNode) {
                    if (projectResult.running) {
                        logx('TreeNav: adding calc spinner for environment overview');
                        envOverviewNode.icon_class = 'CircularProgress';
                    } else if (projectResult.error && projectResult.error.length > 0) {
                        logx('TreeNav: adding calc error icon for move groups analysis summary');
                        envOverviewNode.icon_class = 'vcio-status-alarm';
                    } else {
                        envOverviewNode.icon_class = '';
                    }
                }
            } else if (projectResult.type === 'group') {
                // Find the custom property name in the projects custom_node_props to get its key (the name).
                const cnp: CustomProperty | undefined = _.find(project?.roProjectWithData.custom_node_props, { title: projectResult.groupName });
                if (cnp) {
                    const cpAnalysisSummaryNode: NavigationMenuNode | null = findNavMenuNode(navMenuDynamic.nodes, cnp.name + '-Analysis-Summary');
                    if (cpAnalysisSummaryNode) {
                        if (projectResult.running) {
                            logx(`TreeNav: adding calc spinner for custom property ${projectResult.groupName}`);
                            cpAnalysisSummaryNode.icon_class = 'CircularProgress';
                            autoExpandNode(cnp.name);
                        } else if (projectResult.error && projectResult.error.length > 0) {
                            logx(`TreeNav: adding calc error icon for custom property ${projectResult.groupName}`);
                            cpAnalysisSummaryNode.icon_class = 'vcio-status-alarm';
                            autoExpandNode(cnp.name);
                        } else {
                            cpAnalysisSummaryNode.icon_class = '';
                        }
                    }
                }
            }
        });
    }, [project?.roProjectWithData.results, project?.roProjectWithData.custom_node_props, autoExpandNode, navMenuDynamic.nodes]);

    // ---------- End: fetch project data code ----------


    /**
     * Collapse or expand the navigation menu.  We also set a state variable on the Page component to a new empty
     * object, by passing that object to forceParentRender.  The change in state will force Page to re-render.
     * A Page re-render is necessary so that the content can be expanded/collapsed as necessary.
     */
    const toggleNavigationMenu = useCallback(() => {
        logx(`TreeNav: toggleNavigationMenu: toggling navigation from ${open} to ${!open}`);
        tabNavigationItem.nav_open = !open;
        replaceTabNavigationItem(tabNavigationContext, tabNavigationItem, tabName);
        setOpen(!open);
        logx('TreeNav: toggleNavigationMenu: forcing Page render');
        pForceParentRender({});
    }, [open, pForceParentRender, tabName, tabNavigationContext, tabNavigationItem]);

    /**
     * Invoked when the mouse enters the collapsed nav menu.  Opens the nav menu if not already open, but does not set
     * context, therefore the open is temporary.  As soon as the user clicks a node, or moves their mouse out of the nav,
     * the nav will close.  Only TreeNav re-renders.  Page does not need to re-render.  The nav will temporarily
     * overlay the content.
     */
    const mouseEnterCollapsedNavMenu = useCallback(() => {
        if (!openByMouseEnter && !navOpen) {
            setOpenByMouseEnter(true);
        }
    }, [navOpen, openByMouseEnter]);

    /**
     * Invoked when the mouse leaves the nav menu.  If the nav menu had been opened via mouse enter, it will be closed.
     * If the nav menu had been opened via click, it will remain open.  Only TreeNav re-renders.  Page does not need
     * to re-render.  The nav that had been overlaying the content will be collapsed.
     */
    const mouseLeaveNavMenu = useCallback(() => {
        if (openByMouseEnter) {
            setOpenByMouseEnter(false);
        }
    }, [openByMouseEnter]);

    /**
     * Just expanded or collapsed a group node in the currently displayed navigation tree.
     * Note that when onNodeToggle fires, onNodeSelect will also fire.  The node is both toggled and selected.
     * @param nodeIds   The NavigationMenu keys of all the expanded nodes.
     */
    const onNodeToggle = useCallback((nodeIds: string[]) => {

        logx('TreeNav: onNodeToggle');
        logx('TreeNav: state expanded=', expanded);
        logx('context expanded=', tabNavigationItem.expanded);
        logx('setting state and context expanded=', nodeIds);

        setExpanded(nodeIds);
        tabNavigationItem.expanded = nodeIds;
        replaceTabNavigationItem(tabNavigationContext, tabNavigationItem, tabName);
    }, [expanded, tabName, tabNavigationContext, tabNavigationItem]);

    /**
     * Just selected or deselected a node (group or leaf) in the currently displayed navigation tree.
     * @param nodeId    The NavigationMenu key of the selected node.
     */
    const onNodeSelect = useCallback((nodeId: string) => {

        // find the selected node within the navigation menu
        const node = findNavMenuNode(navMenuDynamic.nodes, nodeId);
        if (!node) {
            logx('could not find the selected node for key=', nodeId);
            logx('make sure your navMenu has the "key" property defined');
            return;
        }

        logx('TreeNav: onNodeSelect');
        logx('state selected=', selected);
        logx('context selected=', tabNavigationItem.selected);
        logx('setting state and context selected=', nodeId);

        if (node.target) {
            // This is a leaf node
            setSelected(nodeId);
            tabNavigationItem.selected = nodeId;

            tabNavigationItem.target.route = node.target && node.target.route ? node.target.route : '';
            tabNavigationItem.target.route_as = node.target && node.target.route_as ? node.target.route_as : '';
            tabNavigationItem.target.callback = node.target && node.target.callback ? node.target.callback : null;
            tabNavigationItem.title = node.title ? node.title : node.name;
            tabNavigationItem.subtitle = node.subtitle ? node.subtitle : '';
        }
        replaceTabNavigationItem(tabNavigationContext, tabNavigationItem, tabName);

        if (node.target) {
            // This is a leaf node
            doRoute(router, node.target);
        }
    }, [navMenuDynamic.nodes, router, selected, tabName, tabNavigationContext, tabNavigationItem]);

    /**
     * Clicked the top link in the navigation title area.  This link is optional, it is only defined in some NavigationMenu
     * instances.  Update the TabNavigationItem in context and send the link on its way.
     */
    const onClickTopLink = useCallback(() => {
        tabNavigationItem.selected = '';
        tabNavigationItem.expanded = [];
        tabNavigationItem.target = {};
        if (topLink.target.route) {
            tabNavigationItem.target.route = topLink.target.route;
        }
        if (topLink.target.route_as) {
            tabNavigationItem.target.route_as = topLink.target.route_as;
        }
        if (topLink.target.callback) {
            tabNavigationItem.target.callback = topLink.target.callback;
        }
        tabNavigationItem.title = 'Dashboard';
        tabNavigationItem.subtitle = '';
        replaceTabNavigationItem(tabNavigationContext, tabNavigationItem, tabName);
        doRoute(router, tabNavigationItem.target);
    }, [router, tabName, tabNavigationContext, tabNavigationItem, topLink?.target?.callback, topLink?.target?.route, topLink?.target?.route_as]);

    /**
     * Renders tree items via recursion of the NavigationMenu nodes.
     * @param section
     */
    const renderItems = useCallback((section: NavigationMenu | NavigationMenuNode) =>
        (section.nodes || []).map((node: NavigationMenuNode) => {
            let label;
            if (node.icon_class && node.icon_class === 'CircularProgress') {
                label = <span>{node.name} <CircularProgress size={12}/></span>;
            } else if (node.icon_class && node.icon_class === 'vcio-status-alarm') {
                label = <span>{node.name} <VcioIcon className={node.icon_class} iconColor={colors.red_500} style={{ float: 'right', marginRight: '28px' }}/></span>;
            } else if (node.icon_class) {
                label = <span>{node.name} <VcioIcon className={node.icon_class} style={{ float: 'right', marginRight: '28px' }}/></span>;
            } else {
                label = node.name;
            }

            const leafNode: boolean = !node.nodes;
            return (
                <TreeItem
                    nodeId={node.key}
                    label={label}
                    key={node.key}
                    classes={{
                        root: leafNode ? undefined : classes.treeContentGroupSelected,
                        label: leafNode ? classes.treeItemLabelLeaf : classes.treeItemLabelGroup,
                        content: classes.treeContent,
                        selected: leafNode ? classes.treeContentLeafSelected : undefined
                    }}
                >
                    {renderItems(node)}
                </TreeItem>
            );
        }), [classes.treeContent, classes.treeContentGroupSelected, classes.treeContentLeafSelected, classes.treeItemLabelGroup, classes.treeItemLabelLeaf]); // renderItems

    const topLinkDiv = useMemo(() => {
        if (topLink && topLink.label !== '') {
            return (
                <div className={classes.top}>
                    <span className='vcio-ars-chevron-tiny-left' style={{ height: '12px', width: '15px', marginRight: '2px' }}/>
                    <Link data-cy="navMenuTopLink" href='#' onClick={onClickTopLink} className={classes.topLink}>{topLink.label}</Link>
                </div>
            );
        }
        return <div className={classes.noTopLink}/>;
    }, [classes.noTopLink, classes.top, classes.topLink, onClickTopLink, topLink]);


    const subtitleDiv = useMemo(() => {
        if (project?.roProjectWithData.project_instance) {
            return <div data-cy="navMenuSubTitle" className={classes.subtitle}>{project?.roProjectWithData.project_instance}</div>;
        }
        return <></>;
    }, [classes.subtitle, project?.roProjectWithData.project_instance]);

    const expander = useMemo(() => {
        if (pageHasLeftNav && !navOpen) {
            return (
                <Grid
                    container
                    direction="row"
                    justify="flex-start"
                    alignItems="flex-start"
                    spacing={0}
                    style={{ width: '36.5px', height: '100%' }}
                >
                    <Grid item>
                        <div style={{ width: '36.5px', height: '34px' }}>
                            <div className={classes.navExpandShaded} onMouseEnter={mouseEnterCollapsedNavMenu}/>
                        </div>
                    </Grid>
                    <Grid item>
                        <div style={{ width: '36.5px' }}>
                            <IconButton onClick={toggleNavigationMenu} className={pageHasLeftNav ? classes.navExpandButton : ''}>
                                <VcioIcon className='vcio-ars-angle-right' iconColor={colors.green_500}/>
                            </IconButton>
                        </div>
                    </Grid>
                    <Grid item style={{ height: '100%' }}>
                        <div style={{ width: '36.5px', height: '100%' }}>
                            <div className={classes.navExpandShaded} onMouseEnter={mouseEnterCollapsedNavMenu}/>
                        </div>
                    </Grid>
                </Grid>
            );
        }
        return <></>;
    }, [classes.navExpandButton, classes.navExpandShaded, mouseEnterCollapsedNavMenu, navOpen, pageHasLeftNav, toggleNavigationMenu]);

    const theIcon = useMemo(() => {
        if (openByMouseEnter) {
            return <VcioIcon className='vcio-ars-angle-right' iconColor={colors.green_500} style={{ marginRight: '3px' }}/>;
        }
        return <VcioIcon className='vcio-ars-angle-left' iconColor={colors.green_500} style={{ marginRight: '3px' }}/>;
    }, [openByMouseEnter]);

    const prevTabExpanded: string[] = useMemo(() => tabNavigationItem.expanded, [tabNavigationItem.expanded]);
    const prevTabSelected: string = useMemo(() => tabNavigationItem.selected, [tabNavigationItem.selected]);

    const showOrHide: string = useMemo(() => showLeftNav ? classes.navShow : classes.navHide, [classes.navHide, classes.navShow, showLeftNav]);

    if (tabNavigationItem.tab_name === '') {
        // Should never happen, means did not find the tabNavigationItem
        // ToDo: How do we want to show such fatal errors?
        return (
            <p>Error: TreeNav did not find<br/>
                previous tab navigation<br/>
                item for this tab!
            </p>
        );
    }

    logx('TreeNav: rendering');

    /*
        Note that we are rendering the navMenuDynamic and not the navMenu received as a prop.
        For 'Cloud Migration' pages that are specific to a projectId, we may have altered the left nav menu to
        include custom properties.  Hence, we want to render the updated menu and not the
        menu originally passed to us.
     */
    return (
        <>
            {expander}
            <div className={showOrHide} onMouseLeave={mouseLeaveNavMenu}>
                <Slide in={showLeftNav} direction='right'>
                    <Paper className={classes.nav}>
                        <IconButton onClick={toggleNavigationMenu} className={classes.navCollapseButton}>
                            {theIcon}
                        </IconButton>
                        <nav className={classes.navnav}>
                            <div className={classes.navHdr}>
                                {topLinkDiv}
                                <div className={classes.titleAndIconWrapper}>
                                    <div data-cy="navMenuTitle" className={classes.title}>
                                        {project?.roProjectWithData.project_name} <br/>
                                    </div>
                                </div>
                                {subtitleDiv}
                            </div>
                            <div className={classes.navBody}>
                                <TreeView
                                    defaultCollapseIcon={<VcioIcon className='vcio-ars-angle-down' iconColor={colors.blue_gray_500}/>}
                                    defaultExpandIcon={<VcioIcon className='vcio-ars-angle-right' iconColor={colors.blue_gray_500}/>}
                                    expanded={prevTabExpanded}
                                    selected={prevTabSelected}
                                    multiSelect={false}
                                    onNodeSelect={(_event: object, value: [] | string) => {
                                        onNodeSelect(value as string);
                                    }}
                                    onNodeToggle={(_event: object, value: string []) => {
                                        onNodeToggle(value);
                                    }}
                                >
                                    {renderItems(navMenuDynamic)}
                                </TreeView>
                            </div>
                        </nav>
                    </Paper>
                </Slide>
            </div>
        </>
    );

};
