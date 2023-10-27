/**
 * Searches the string for query and return the array of string parts with the flag matched/not matched
 *
 * @param text Text in which to search
 * @param query Query string to search for
 * @return Array of matches array in format of [startIndex, endIndex, isMatched]
 */
export function getMatches(text: string, query: string, ignoreCase = true): [number, number, boolean][] {
    const matches: [number, number, boolean][] = [];
    if (text && query) {
        const t = ignoreCase ? text.toLocaleLowerCase() : text;
        const q = ignoreCase ? query.toLocaleLowerCase() : query;
        let start = 0;
        let ind = t.indexOf(q);
        while (ind > -1 && start < t.length - 1) {
            if (ind > start) {
                matches.push([start, ind, false]);
            }
            matches.push([ind, ind + q.length, true]);
            start = ind + q.length;
            ind = t.indexOf(q, start);
        }
        matches.push([start, t.length, false]);
        return matches;
    }
    return [[0, text ? text.length : 0, false]];
}

/**
 * Converts the string and array of matches prepared by @getMatches to an array of text parts with the matched flag
 *
 * @param text Text in which to search
 * @param matches Array of matches for the text in format of [startIndex, endIndex, isMatched]
 * @return Array of parts
 */
export function getParts(text: string, matches: [number, number, boolean][]): { part: string; match: boolean }[] {
    const parts: { part: string; match: boolean }[] = [];
    for (const m of matches) {
        parts.push({ part: text.slice(m[0], m[1]), match: m[2] });
    }
    return parts;
}
