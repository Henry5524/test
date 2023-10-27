/**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param r The red color value
 * @param g The green color value
 * @param b The blue color value
 * @return The HSL representation
 */
export function rgb2hsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h: number = 0;
    let s: number = 0;
    const l = (max + min) / 2;

    if (max != min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max == r) {
            h = (g - b) / d + (g < b ? 6 : 0);
        }
        else if (max == g) {
            h = (b - r) / d + 2;
        }
        else if (max == b) {
            h = (r - g) / d + 4;
        }
        h /= 6;
    }

    return [h, s, l];
}

function hue2rgb(p: number, q: number, t: number): number {
    if (t < 0) { t += 1; }
    if (t > 1) { t -= 1; }
    if (t < 1 / 6) { return p + (q - p) * 6 * t; }
    if (t < 1 / 2) { return q; }
    if (t < 2 / 3) { return p + (q - p) * (2 / 3 - t) * 6; }
    return p;
}

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param h The hue
 * @param s The saturation
 * @param l The lightness
 * @return The RGB representation
 */
export function hsl2rgb(h: number, s: number, l: number): [number, number, number] {
    let r: number;
    let g: number;
    let b: number;
    if (s == 0) {
        r = l;
        g = l;
        b = l;
    }
    else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.trunc(r * 255), Math.trunc(g * 255), Math.trunc(b * 255)];
}

/**
 * Checks if the color is too bright to be used as a background for the white text
 * If so - darkens the color to the appropriate level.
 *
 * @param color The RGB color in #XXXXXX format
 * @return The RGB color in #XXXXXX format
 */
export function low2Dark(color: string): string {
    const hsl = rgb2hsl(
        parseInt(color.substring(1, 3), 16),
        parseInt(color.substring(3, 5), 16),
        parseInt(color.substring(5, 7), 16)
    );
    const rgb = hsl2rgb(hsl[0], hsl[1], hsl[2] > 0.4 ? 0.4 : hsl[2]);
    return '#'
        + addZero(rgb[0].toString(16))
        + addZero(rgb[1].toString(16))
        + addZero(rgb[2].toString(16));
}

function addZero(s: string): string {
    if (!s) {
        return '00';
    }
    return s.length < 2 ? '0' + s : s;
}

/**
 * Merge the color with the bgColor with the provided opacity of foreground color
 *
 * @param fgColor The RGB color in #XXXXXX format that will be "placed" over bg
 * @param bgColor The RGB color in #XXXXXX format that will be used as a background
 * @param opacity The opacity assumed for fgColor to merge
 * @return The result RGB color in #XXXXXX format
 */
export function colorOverBg(fgColor: string, bgColor = '#ffffff', opacity = .05) {
    const bg: number[] = [
        parseInt(bgColor.substring(1, 3), 16),
        parseInt(bgColor.substring(3, 5), 16),
        parseInt(bgColor.substring(5, 7), 16)
    ];
    const fg: number[] = [
        parseInt(fgColor.substring(1, 3), 16),
        parseInt(fgColor.substring(3, 5), 16),
        parseInt(fgColor.substring(5, 7), 16)
    ];
    return '#'
        + addZero(Math.trunc(((1 - opacity) * bg[0] + opacity * fg[0])).toString(16))
        + addZero(Math.trunc(((1 - opacity) * bg[1] + opacity * fg[1])).toString(16))
        + addZero(Math.trunc(((1 - opacity) * bg[2] + opacity * fg[2])).toString(16));
}

/**
 * Converts the color in RGB #XXXXXX format to "rgba(r, g, b, a)" string
 *
 * @param color The RGB color in #XXXXXX format
 * @param opacity The opacity
 * @return The result RGB color in #XXXXXX format
 */
export function color2RGBA(color: string, opacity: number): string {
    return 'rgba('
        + parseInt(color.substring(1, 3), 16) + ','
        + parseInt(color.substring(3, 5), 16) + ','
        + parseInt(color.substring(5, 7), 16) + ','
        + opacity + ')';
}

/**
 * Converts the color in RGB #XXXXXX format to the array of numbers from 0 to 1 used by WebGL
 *
 * @param color The RGB color in #XXXXXX format
 * @param opacity The opacity
 * @return The result is the color in format of [r, g, b, a] array of 0-1 numbers
 */
export function color4GL(color: string, opacity: number): number[] {
    return [
        parseInt(color.substring(1, 3), 16) / 255,
        parseInt(color.substring(3, 5), 16) / 255,
        parseInt(color.substring(5, 7), 16) / 255,
        opacity
    ];
}
