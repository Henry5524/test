import { NextRouter } from 'next/router';
import { NavigationMenu, Target } from '@models';

/**
 * Defines static left nav menu tree json by tab.
 */
const navigationMenus: NavigationMenu [] = [
    {
        tab_name: 'cloudOptimization',
        top_link: {
            label: 'All Projects',
            target: {
                route: '/cloud-optimization/dashboard'
            }
        },
        nodes: [
            {
                name: 'Dashboard',
                key: 'dashboard',
                title: 'NY Data Center',
                subtitle: 'Initial Analysis',
                level: 1,
                target: {
                    route: '/cloud-optimization/dashboard',
                }
            },
            {
                name: 'CostA',
                key: 'cost-a',
                level: 1,
                icon_class: 'vcio-general-star-outline',
                nodes: [
                    {
                        name: 'Cost One',
                        key: 'cost-one',
                        level: 2,
                        title: 'Cost Ones Title',
                        subtitle: 'Cost Ones Subtitle',
                        target: {
                            route: '/cloud-optimization/cost-one',
                        }
                    },
                    {
                        name: 'Cost Two',
                        key: 'cost-two',
                        level: 2,
                        target: {
                            route: '/cloud-optimization/cost-two',
                        }
                    },
                    {
                        name: 'CostB',
                        key: 'cost-b',
                        level: 2,
                        icon_class: 'vcio-general-eye',
                        nodes: [
                            {
                                name: 'Cost Three',
                                key: 'cost-three',
                                level: 3,
                                target: {
                                    route: '/cloud-optimization/cost-three',
                                }
                            },
                            {
                                name: 'Cost Four',
                                key: 'cost-four',
                                level: 3,
                                target: {
                                    route: '/cloud-optimization/cost-four',
                                }
                            }
                        ],
                    },
                ],
            },
        ],
    },
    {
        tab_name: 'cloudOptimization',
        sub_menu_name: 'cost-four',
        top_link: {
            label: 'Sub Menu Top Link',
            target: {
                route: '/cloud-optimization/dashboard'
            }
        },
        nodes: [
            {
                name: 'Dashboard',
                key: 'dashboard',
                level: 1,
                target: {
                    route: '/cloud-optimization/dashboard',
                }
            },
            {
                name: 'Cost Five',
                key: 'cost-five',
                level: 1,
                target: {
                    route: '/cloud-optimization/cost-five',
                }
            },
            {
                name: 'CostC',
                key: 'cost-c',
                level: 1,
                nodes: [
                    {
                        name: 'Cost Six',
                        key: 'cost-six',
                        level: 2,
                        target: {
                            route: '/cloud-optimization/cost-six',
                        }
                    },
                    {
                        name: 'Cost Seven',
                        key: 'cost-seven',
                        level: 2,
                        target: {
                            route: '/cloud-optimization/cost-seven',
                        }
                    }
                ],
            },
        ],
    },
    {
        tab_name: 'dataCenterCapacity',
        nodes: [
            {
                name: 'Dashboard',
                key: 'dashboard',
                level: 1,
                target: {
                    route: '/data-center-capacity/dashboard',
                }
            },
        ],
    },
    {
        tab_name: 'executiveSummary',
        nodes: [
            {
                name: 'Dashboard',
                key: 'dashboard',
                level: 1,
                target: {
                    route: '/executive-summary/dashboard',
                }
            },
        ],
    },
    {
        tab_name: 'settings',
        nodes: [
            {
                name: 'Users',
                key: 'settings-users',
                level: 2,
                target: {
                    route: '/settings/users',
                }
            },
        ],
    },
];

/**
 * Gets the left nav json for the specified tab.
 * @param tabName       Tab name.
 * @param subMenuName   Sub menu name.  A left nav json may be defined for a specific page on a tab.  In that case, the
 *                      key of the page can be used as the subMenuName.
 * @returns NavigationMenu
 */
export function getNavigationMenu(tabName: string, subMenuName?: string): NavigationMenu {

    const foundNavigationMenu: NavigationMenu | undefined = navigationMenus.find((navigationMenu: NavigationMenu) => {
        return subMenuName ? (navigationMenu.tab_name === tabName && navigationMenu.sub_menu_name === subMenuName) : (navigationMenu.tab_name === tabName);
    });

    return foundNavigationMenu || getEmptyNavigationMenu(tabName);

}

/**
 * Returns an empty left nav. *
 * @param tabName
 * @returns Empty left nav.
 */
export function getEmptyNavigationMenu(tabName: string): NavigationMenu {
    return { tab_name: tabName, nodes: [] };
}

/**
 * Returns a left navigation menu for a 'migration' tab page that is specific for a projectId.
 * @param projectId Project Id.
 * @param title     Title to be displayed in the left nav title area.
 * @param subtitle  Subtitle to be displayed in the left nav subtitle area.
 */
export function getMigrationProjectNavigationMenu(projectId: string, title: string, subtitle: string): NavigationMenu {
    return {
        tab_name: 'migration',
        top_link: {
            label: 'All Projects',
            target: {
                route: '/migration/dashboard'
            }
        },
        nodes: [
            {
                name: 'Inventory',
                key: 'inventory',
                title,
                subtitle,
                level: 1,
                target: {
                    route: '/migration/project/[projectId]/inventory',
                    route_as: `/migration/project/${projectId}/inventory`
                }
            },
            {
                name: 'Environment Overview',
                key: 'environment-overview',
                title,
                subtitle,
                level: 1,
                target: {
                    route: '/migration/project/[projectId]/overview',
                    route_as: `/migration/project/${projectId}/overview`
                }
            },
            {
                name: 'Applications',
                key: 'applications',
                title,
                subtitle,
                level: 1,
                // icon_class: 'vcio-migration-application',
                nodes: [
                    {
                        name: 'Application List',
                        key: 'applications-list',
                        title,
                        subtitle,
                        level: 2,
                        target: {
                            route: '/migration/project/[projectId]/application/application-list',
                            route_as: `/migration/project/${projectId}/application/application-list`
                        }
                    },
                    {
                        name: 'Analysis Summary',
                        key: 'applications-analysis-summary',
                        title,
                        subtitle,
                        level: 2,
                        target: {
                            route: '/migration/project/[projectId]/application/application-summary',
                            route_as: `/migration/project/${projectId}/application/application-summary`
                        }
                    },
                ],
            },
            {
                name: 'Move Groups',
                key: 'moveGroups',
                title,
                subtitle,
                level: 1,
                // icon_class: 'vcio-migration-move-group',
                nodes: [
                    {
                        name: 'Move Group List',
                        key: 'move-group-list',
                        title,
                        subtitle,
                        level: 2,
                        target: {
                            route: '/migration/project/[projectId]/mg/move-group-list',
                            route_as: `/migration/project/${projectId}/mg/move-group-list`
                        }
                    },
                    {
                        name: 'Analysis Summary',
                        key: 'move-groups-analysis-summary',
                        title,
                        subtitle,
                        level: 2,
                        target: {
                            route: '/migration/project/[projectId]/mg/move-group-summary',
                            route_as: `/migration/project/${projectId}/mg/move-group-summary`
                        }
                    },
                ],
            },
        ],
    };
}

/**
 * Easy way for other components to designate which node should be selected for a tab.
 * To use:
 *  1. import AppContext and useContext
 *  2. Get context via:      const appContext = useContext(AppContext);
 *  3. Call function:
 *      setupNavMenu(appContext, 'migration', 'inventory', 'Inventory Title');
 *      setupNavMenu(appContext, 'migration', 'applications-summary-dashboard', 'Summary Dashboard', '', ['applications']);
 *
 * @param appContext    Application context
 * @param tabName       Should match the tabName (see NavigationMenu) for the target menu
 * @param nodeId        Should match the key for the node to be selected on the target menu
 * @param target        Target
 * @param title         The title for the page.  Will be used as the title in the top left of the nav menu.
 * @param subtitle      Subtitle for the page.  Shown in the top left title area of the navigation.  Not shown if not provided,
 *                      or if an empty string is provided.
 * @param nodesToExpand Optional. The keys of any group nodes that need to be expanded.  If not provided, no groups will
 *                      be expanded.
 */
export const setupNavMenu = (appContext: any, tabName: string, nodeId: string, target: Target,
    title: string, subtitle: string = '', nodesToExpand: string[] = []): void => {

    const { tabNavigationContext, setTabNavigationContext } = appContext;
    const tabNavigationItem = tabNavigationContext.tab_navigation_items.find((node: any) => {
        return (node.tab_name === tabName);
    });
    tabNavigationItem.selected = nodeId;
    tabNavigationItem.expanded = nodesToExpand;
    tabNavigationItem.title = title;
    tabNavigationItem.subtitle = subtitle;
    tabNavigationItem.target = target;
    setTabNavigationContext(tabNavigationContext);
};

/**
 * Is the left nav expanded (a.k.a open) or collapsed (a.k.a. closed).  Note we could not use expanded/collapsed here
 * because the TreeView already uses the term expanded to refer to whether a group node is expanded or not.
 * @param appContext
 * @param tabName
 * @returns boolean
 */
export const isNavOpen = (appContext: any, tabName: string): boolean => {
    const { tabNavigationContext } = appContext;
    const tabNavigationItem = tabNavigationContext.tab_navigation_items.find((node: any) => {
        return (node.tab_name === tabName);
    });
    return tabNavigationItem ? tabNavigationItem.nav_open : true;
};

/**
 * Gets the default target for the tab.
 *
 * Useful from places like the sign in page which knows which tab it wants to show,
 * but needs to know which route.  Similarly, good for the first time you visit a tab in the Header.
 *
 * @param tabName   The tab name.  Should match the tab.value in Header for the tab.
 * @returns Target A target may be a route, a route/route_as, or a callback.
 */
export const getDefaultTarget = (tabName: string): Target => {
    // @ts-ignore
    return {
        executiveSummary: {
            route: '/executive-summary/dashboard'
        },
        cloudOptimization: {
            route: '/cloud-optimization/dashboard'
        },
        migration: {
            route: '/migration/dashboard'
        },
        settings: {
            route: '/settings/users'
        }
    }[tabName];
};

/**
 * Route to the specified target (route or callback).
 * @param router    Provide a router
 * @param target    A Target
 * @param replace   When not provided, will do a normal router.push.  When true, will do a router.replace instead.
 */
export const doRoute = (router: NextRouter, target: Target, replace: boolean = false) => {

    if (target && target.route && target.route !== '') {
        if (target.route_as && target.route_as !== '') {
            replace ? router.replace(target.route, target.route_as) : router.push(target.route, target.route_as);
        }
        else {
            replace ? router.replace(target.route, target.route) : router.push(target.route, target.route);
        }
    }
    else if (target && target.callback) {
        target.callback(target);
    }
};


