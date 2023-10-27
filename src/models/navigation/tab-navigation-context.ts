import { TabNavigationItem } from './tab-navigation-item';

/**
 * This object will reside in application context and will hold an array of TabNavigationItem, one for each tab that
 * has been visited by the user.
 */
export type TabNavigationContext = {
    tab_navigation_items: TabNavigationItem [];
};
