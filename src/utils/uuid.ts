/* eslint-disable no-bitwise */
export class UUID {
    /**
     * Generates a new unique (in the most majority of cases) UUID string
     *
     * @return Unique UUID string
     */
    static get(): string {
        let d = new Date().getTime();
        if (window.performance && typeof window.performance.now === 'function') {
            d += performance.now();
        }
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            /* tslint:disable:no-bitwise */
            const r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            /* tslint:enable:no-bitwise */
        });
        return uuid;
    }
}
