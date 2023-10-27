/**
 * Defines a navigation target.  This would either be a route, a route/route_as, or a callback.
 */
export type Target = {
    route?: string;
    route_as?: string;
    callback?: Function | null;
};
