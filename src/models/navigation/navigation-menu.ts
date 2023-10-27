import { NavigationMenuNode } from './navigation-menu-node';
import { Target } from './target';

/**
 * Defines the object structure of the json left hand navigation menu.
 * The tab_name is the key - where tab_name should match the value property in the tab definition in Header.tsx.
 * The optional sub_menu_name is a key to be used when redefining the menu tree for a particular page on a tab.
 * The optional top_link will be shown in the header (top/left) area of the left navigation menu.
 * The nodes are an array of menu nodes.
 */
export interface NavigationMenu {
    tab_name: string;
    sub_menu_name?: string;
    top_link?: {
        label: string;
        target: Target;
    };
    nodes: NavigationMenuNode[];
}
