import { NavigationMenu, Target } from '@models';

/**
 * Defines the state (look/feel) of a tabs left hand navigation.
 * Every tab visited will have an instance of TabNavigationItem.  It defines if the navigation is:
 *      collapsed/expanded (nav_open),
 *      which group nodes are expanded,
 *      which node is selected,
 *      which projectId we were on (for the 'migration' tab),
 *      what page were we on,
 *      even a version of the navigation json itself - this is populated when some items were dynamically added to the
 *      navigation
 * The intent is to be able to restore the tabs navigation back to the way it was when it was last visited
 */
export type TabNavigationItem = {
    tab_name: string;
    nav_open: boolean;
    expanded: string[];
    selected: string;
    target: Target;
    title: string;
    subtitle: string;
    projectId?: string;
    navMenuDynamic?: NavigationMenu;
};

export const initializeTabNavigationItem = (): TabNavigationItem => {
    return {
        tab_name: '',
        nav_open: true,
        expanded: [],
        selected: '',
        target: {
            route: '',
            route_as: '',
            callback: null
        },
        title: '',
        subtitle: ''
    };
};
