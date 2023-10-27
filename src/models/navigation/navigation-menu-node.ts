import { Target } from './target';

/**
 * Defines a single node in the left navigation menu.
 * A node may itself contain an array of other nodes.
 */
export interface NavigationMenuNode {
    name: string;
    key: string;
    level: number;
    title?: string;
    subtitle?: string;
    icon_class?: string;
    target?: Target;
    nodes?: NavigationMenuNode[];
}
