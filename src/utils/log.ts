/**
 * console.logs the message only when the debug flag is on.
 * @param msg   string message
 * @param more  additional parameters that will all simply be appended to the message.
 *
 * Usage Examples:
 *      log('My Message');
 *
 * Three examples that all do the same thing:
 *      log('My Message x=' + x);   // Old way with quotation marks and string concatenation
 *      log(`My Message x=${x}`);   // ES6 way with tick marks instead of quotation marks
 *      log('My message x=', x);    // Convenience provided by this functions rest parameters.
 *                                     Seems easier than either of the two examples above.
 */

export function log(msg: string, ...more: any[]): void {
    if (process.env.NEXT_PUBLIC_DEBUG_FLAG) {
        // eslint-disable-next-line no-console
        console.log(msg, ...more);
    }
}

export function warn(msg: string, ...more: any[]): void {
    if (process.env.NEXT_PUBLIC_DEBUG_FLAG) {
        // eslint-disable-next-line no-console
        console.warn(msg, ...more);
    }
}
