/**
 * Compares two strings case insensitive with null check, can be passed to sort().
 *
 * @param a String A
 * @param b String B
 * @return 1, 0 or -1
 */
export function compareStrings(a: string | undefined, b: string | undefined): number {
    return !a
        ? (!b ? 0 : 1)
        : (!b ? -1 : a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase()));
}

/**
 * Produces the standard comparision function to compare Objects by it's string property
 * case insensitive with null check.
 *
 * @param name Property name of the object to compare by
 * @return A standard comparision function that can be passed to sort()
 */
export function sortStringsBy(name: string): (a: any, b: any) => number {
    return (a, b) => compareStrings(a[name], b[name]);
}

/**
 * Compares two numbers with null check, can be passed to sort().
 *
 * @param a Number A
 * @param b Number B
 * @return 1, 0 or -1
 */
export function compareNumbers(a: number | undefined, b: number | undefined): number {
    return a == null
        ? (b == null ? 0 : 1)
        : (b == null ? -1 : a - b);
}

/**
 * Produces the standard comparision function to compare Objects by it's number property
 * with null check.
 *
 * @param name Property name of the object to compare by
 * @return A standard comparision function that can be passed to sort()
 */
export function sortNumbersBy(name: string): (a: any, b: any) => number {
    return (a, b) => compareNumbers(a[name], b[name]);
}

/**
 * Produces the standard comparision function to compare Objects by it's Boolean property.
 *
 * @param name Property name of the object to compare by
 * @return A standard comparision function that can be passed to sort()
 */
export function sortBooleansBy(name: string): (a: any, b: any) => number {
    return (a: any, b: any) => a[name] == b[name]
        ? 0
        : (a[name] ? -1 : 1);
}

/**
 * Produces the standard comparision function to compare Objects by it's array property length.
 *
 * @param name Property name of the object to compare by
 * @return A standard comparision function that can be passed to sort()
 */
export function sortLengthBy(name: string): (a: any, b: any) => number {
    return (a: any, b: any) => (!a[name] || a[name].length == 0)
        ? ((!b[name] || b[name].length == 0) ? 0 : 1)
        : (
            (!b[name] || b[name].length == 0)
                ? -1
                : a[name].length - b[name].length
        );
}

/**
 * Produces the set of straight and reverse standard comparision functions
 * to compare Objects by it's array property with the provided sort function.
 * Function will NOT change the Object's array property order.
 *
 * @param name Property name of the object to compare by
 * @return An array of two(asc and desc) standard comparision functions that can be passed to sort()
 */
export function arraySortImmFn(name: string, cmp: (a: any, b: any) => number): [(a: any, b: any) => number, (a: any, b: any) => number] {
    return [
        (a: any, b: any) => {
            if (!a || !a[name] || a[name].length == 0) {
                return !b || !b[name] || b[name].length == 0 ? 0 : 1;
            }
            if (!b || !b[name] || b[name].length == 0) {
                return -1;
            }
            const ra = a[name].slice().sort(cmp);
            const rb = b[name].slice().sort(cmp);
            return cmp(ra[0], rb[0]);
        },
        (a: any, b: any) => {
            if (!b || !b[name] || b[name].length == 0) {
                return !a || !a[name] || a[name].length == 0 ? 0 : 1;
            }
            if (!a || !a[name] || a[name].length == 0) {
                return -1;
            }
            const ra = a[name].slice().sort((aa: any, bb: any) => cmp(bb, aa));
            const rb = b[name].slice().sort((aa: any, bb: any) => cmp(bb, aa));
            return cmp(rb[0], ra[0]);
        }
    ];
}

/**
 * Produces the set of straight and reverse standard comparision functions
 * to compare Objects by it's array property with the provided sort function.
 * Function WILL CHANGE the Object's array property order.
 *
 * @param name Property name of the object to compare by
 * @return An array of two(asc and desc) standard comparision functions that can be passed to sort()
 */
export function arraySortFn(name: string, cmp: (a: any, b: any) => number): [(a: any, b: any) => number, (a: any, b: any) => number] {
    return [
        (a: any, b: any) => {
            if (!a || !a[name] || a[name].length == 0) {
                return !b || !b[name] || b[name].length == 0 ? 0 : 1;
            }
            if (!b || !b[name] || b[name].length == 0) {
                return -1;
            }
            const ra = a[name].sort(cmp);
            const rb = b[name].sort(cmp);
            return cmp(ra[0], rb[0]);
        },
        (a: any, b: any) => {
            if (!b || !b[name] || b[name].length == 0) {
                return !a || !a[name] || a[name].length == 0 ? 0 : 1;
            }
            if (!a || !a[name] || a[name].length == 0) {
                return -1;
            }
            const ra = a[name].sort((aa: any, bb: any) => cmp(bb, aa));
            const rb = b[name].sort((aa: any, bb: any) => cmp(bb, aa));
            return cmp(rb[0], ra[0]);
        }
    ];
}
