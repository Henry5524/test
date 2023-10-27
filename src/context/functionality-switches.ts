/**
 * Type definition for switches to enable/disable functionality
 * See app.ts and _app.tsx where this object is created with defaults and placed into the app context
 * for usage throughout the application.
 */
export type FunctionalitySwitches = {
    [id: string]: boolean;

    // Added to allow suppression of toasts during automated tests
    showToasts: boolean;

    // It is envisioned that we will have more switches...
    // Any switch added here also needs to be added to app.ts

};

export interface ExtendedWindow extends Window {
    setSwitch: (fn: string, state: boolean) => void;
    setFunctionalitySwitches: (switches: FunctionalitySwitches) => void;
};
