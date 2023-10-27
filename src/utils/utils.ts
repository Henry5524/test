import { DebugContext } from '@context';
import { log } from '@utils/log';
import _ from 'lodash';
import moment from 'moment';
import { VariantType } from "notistack";
import { useContext } from 'react';

/**
 * Converts the string representation of IP address to the number presenting it's binary form
 *
 * @param ip The string representing IP address
 * @return The 4-bytes binary form number
 */
export function ip2num(ip: string): number {
    const d = ip.split('.');
    return ((((((+d[0]) * 256) + (+d[1])) * 256) + (+d[2])) * 256) + (+d[3]);
}

/**
 * Converts the number presenting IP address binary form to the string representation
 *
 * @param num 4-bytes integer
 * @return The string representation
 */
export function num2ip(num: number): string {
    let d = '' + num % 256;
    for (let i = 3; i > 0; i--) {
        num = Math.floor(num / 256);
        d = num % 256 + '.' + d;
    }
    return d;
}

/**
 * Checks whether both Sets have the same items
 *
 * @param a Set A
 * @param b Set B
 * @return True if Sets have same items
 */
export function isSetsEqual(a: Set<any>, b: Set<any>): boolean {
    return a.size === b.size && [...a].every(v => b.has(v));
}

/**
 * Converts a number into human readable byte format. The returned value will be a string that is the number suffixed
 * with a string storage unit.  Note that the number will be to a max of two decimal places with trailing zeroes suppressed:
 * examples:
 *      27.55 PB
 *      33.1 PB
 *      44 PB
 *
 * If you prefer to retain trailing zeroes on the number for alignment purposes, pass showTrailingZeroes as true.
 * examples:
 *      27.55 PB
 *      33.10 PB
 *      44.00 PB
 *
 * Taken from http://stackoverflow.com/a/20732091/2072693 and modified
 * @param {Number} value Numerical byte value
 * @param showTrailingZeroes
 * @param precision
 * @returns {String} Human-readable form of the byte value
 */
export function bytesRenderer(value: number | string | undefined, showTrailingZeroes?: boolean, precision?: number) {
    return speedConverter(value, 'bytes', showTrailingZeroes, precision);
}

/**
 * Converts raw value of bits per second to Kb/sec, Mb/sec, etc
 * @param value
 * @param showTrailingZeroes
 * @param precision
 */
export function bitsPerSecRenderer(value: number | string | undefined, showTrailingZeroes?: boolean, precision?: number) {
    return speedConverter(value, 'bitsPerSec', showTrailingZeroes, precision);
}

/**
 * Convert provided value to requested display format
 * @param value
 * @param type
 * @param showTrailingZeroes
 * @param precision
 */
export function speedConverter(value: number | string | undefined, type?: 'bytes' | 'bitsPerSec', showTrailingZeroes?: boolean, precision?: number) {
    let requestedPrecision = 2;

    if (value === '' || value === null || value === undefined) {
        return '';
    }
    if (value === 0 || value === '0') {
        return '0 B';
    }
    if (precision) {
        requestedPrecision = precision;
    }
    const numericValue = _.toNumber(value);
    if (_.isNaN(numericValue)) {
        // Give up, cannot do anything more.
        return (value || '').toString();
    }
    const absValue = Math.abs(numericValue);
    if (!type || type === 'bytes') {
        // Provided value is interpreted to be "bytes"
        const i = Math.floor(Math.log(absValue) / Math.log(1024));
        const valueToPrecision = (absValue / Math.pow(1024, i)).toFixed(requestedPrecision);  // Contains trailing zeroes
        const resultNum = showTrailingZeroes ? valueToPrecision : (Number(valueToPrecision) * 1).toString(); // valueToPrecision is a string, multiplying by 1 removes trailing zeroes e.g. 24.70 => 24.7
        return resultNum + ' ' + ['B', 'kB', 'MB', 'GB', 'TB', 'PB'][i];
    }
    // provided value is interpreted to mean "bits per second"
    const i = Math.floor(Math.log(absValue) / Math.log(1000));
    const valueToPrecision: string = (absValue / Math.pow(1000, i)).toFixed(requestedPrecision);  // Contains trailing zeroes
    const resultNum: string = showTrailingZeroes ? valueToPrecision : (Number(valueToPrecision) * 1).toString(); // valueToPrecision is a string, multiplying by 1 removes trailing zeroes e.g. 24.70 => 24.7
    return resultNum + ' ' + ['bps', 'Kb/sec', 'Mb/sec', 'Gb/sec', 'Tb/sec', 'Pb/sec'][i];
}

export function fromNow(date: number) {
    return moment(date * 1000).fromNow();
}

/**
 * Calculate minimum width of text string, in document context, using min-content wrapping strategy
 *
 * @param textString
 * @param divElement
 */
export const getMinTextWidth = (textString: string, divElement?: HTMLElement) => {
    const text = document.createElement('span');
    divElement && divElement.parentElement ? divElement.parentElement.appendChild(text) : document.appendChild(text);

    text.style.height = 'auto';
    text.style.width = 'min-content';
    text.style.position = 'absolute';
    text.innerHTML = textString;

    const width = Math.ceil(text.clientWidth);

    divElement && divElement.parentElement ? divElement.parentElement.removeChild(text) : document.removeChild(text);
    return (width);
};

/**
 * This function can be used for tracing and logging property changes in a module which is helpful for figuring out why re-renders occur.
 *
 * Example of typical usage would be to include this after the function definition:
 *     TracePropChanges(props, 'InventoryMoveGroup');
 *
 * @param props
 * @param callee
 */
export const TracePropChanges = (props: any, callee: string) => {
    const context = useContext(DebugContext);
    const prev = context.traceUpdateMap[callee] || {};
    const changedProps = Object.entries(props).reduce((ps: any, [k, v]) => {
        if (prev[k] !== v) {
            ps[k] = [prev[k], v];
        }
        return ps;
    }, {});
    log('** ');
    if (Object.keys(changedProps).length > 0) {
        log(callee, ' Prior props:', prev);
        log(callee, ' Current props:', props);
        log(callee, ' Changed props:', changedProps);
    } else {
        log(callee, ' No props changed');
    }
    context.traceUpdateMap[callee] = props;
};

const TOAST_AUTO_HIDE_DURATION: number = 5000;  // Milliseconds

/**
 * Show a toast message.
 *
 * @param message           The message to show in the toast
 * @param variant
 * @param autoHideDuration
 */
export const ShowToast = (
    message: string | React.ReactNode,
    appContext: {
        functionalitySwitches: {
            showToasts: boolean;
        }
    },
    enqueueSnackbar: any,
    variant: VariantType = 'info',
    autoHideDuration: number = TOAST_AUTO_HIDE_DURATION
): void => {
    if (appContext.functionalitySwitches.showToasts) {
        enqueueSnackbar(message, {
            variant,
            autoHideDuration
        });
    }

};
