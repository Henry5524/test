import { CSSProperties } from '@material-ui/core/styles/withStyles';

/**
 * This file contains the vCIO styleGuide colors and styles that can be used within themes and for individual components, etc.
 *
 * Material UI component overrides should be in theme.js
 *
 * https://app.zeplin.io/project/5f07291e5b600c790907a0e3/styleguide/colors
 * https://app.zeplin.io/project/5f07291e5b600c790907a0e3/styleguide/textstyles
 */
export const colors = {
    green_700: '#138661',
    green_600: '#169d72',
    green_500: '#19b382',
    green_300: '#18d197',
    green_200: '#64e3ae',
    green_150: '#91edc1',
    green_100: '#b9f8da',
    green_50: '#e6f9f1',
    green_30: '#f0fdf8',
    blue_600: '#0695f4',
    blue_500: '#2aaaff',
    blue_200: '#7fccff',
    blue_100: '#bfe6ff',
    yellow_600: '#f0d800',
    yellow_300: '#fff27b',
    yellow_500: '#ffe500',
    yellow_100: '#fff9c7',
    yellow_50: '#fffce5',
    blue_gray_900: '#2a2d32',
    blue_gray_800: '#313844',
    blue_gray_700: '#4f5a68',
    blue_gray_500: '#808d9d',
    blue_gray_300: '#c4cbd9',
    blue_gray_200: '#dde1e9',
    blue_gray_100: '#edf1f7',
    blue_gray_90: '#edf2fa',
    blue_gray_50: '#f6f7f9',
    blue_gray_40: '#f8f9fc',
    black_100: '#000000',
    black_90: 'rgba(0, 0, 0, 0.9)',
    black_80: 'rgba(0, 0, 0, 0.8)',
    black_70: 'rgba(0, 0, 0, 0.7)',
    black_60: 'rgba(0, 0, 0, 0.6)',
    black_50: 'rgba(0, 0, 0, 0.5)',
    black_40: 'rgba(0, 0, 0, 0.4)',
    black_30: 'rgba(0, 0, 0, 0.3)',
    black_20: 'rgba(0, 0, 0, 0.2)',
    black_10: 'rgba(0, 0, 0, 0.1)',
    white_100: '#ffffff',
    white_90: 'rgba(255, 255, 255, 0.9)',
    white_80: 'rgba(255, 255, 255, 0.8)',
    white_70: 'rgba(255, 255, 255, 0.7)',
    white_60: 'rgba(255, 255, 255, 0.6)',
    white_50: 'rgba(255, 255, 255, 0.5)',
    white_40: 'rgba(255, 255, 255, 0.4)',
    white_30: 'rgba(255, 255, 255, 0.3)',
    white_20: 'rgba(255, 255, 255, 0.2)',
    white_10: 'rgba(255, 255, 255, 0.1)',
    light_green_600: '#67b82e',
    light_green_500: '#74cd35',
    light_green_300: '#94d964',
    light_green_50: '#d8f1c7',
    violet_600: '#ad3ee9',
    violet_500: '#c96bfc',
    violet_300: '#dc9bff',
    red_600: '#ce3300',
    red_500: '#ea3a00',
    red_50: '#ffdcd0',
    amber_600: '#f09000',
    amber_500: '#ffaf0f',
    amber_50: '#fff3ce',
    lime_700: '#92b700',
    lime_500: '#adce0a',
    lime_200: '#d1e72e',
    lime_50: '#f0f7bb',
    'cool-green': '#2fb564',
};

export const text: { [key: string]: CSSProperties } = {
    primaryInterfaceTitleH1: {
        fontFamily: 'Muli',
        fontSize: '27px',
        fontWeight: 300,
        fontStretch: 'normal',
        fontStyle: 'normal',
        lineHeight: 1.4,
        letterSpacing: 'normal',
        color: 'rgba(0, 0, 0, 0.9)',
    },
    secondaryInterfaceTitleH1: {
        fontFamily: 'Muli',
        fontSize: '22px',
        fontWeight: 300,
        fontStyle: 'normal',
        lineHeight: 1.4,
        letterSpacing: 'normal',
        color: 'rgba(0, 0, 0, 0.7)',
    },
    moduleNavigationTitle: {
        fontFamily: 'Muli',
        fontSize: '20px',
        fontWeight: 'normal',
        fontStyle: 'normal',
        lineHeight: '23px',
        letterSpacing: 0
    },
    h3: {
        fontFamily: 'Muli',
        fontSize: '19px',
        fontWeight: 600,
        fontStyle: 'normal',
        lineHeight: '28.5px',
        letterSpacing: 0
    },
    h4: {
        fontFamily: 'Open Sans',
        fontSize: '16px',
        fontWeight: 600,
        fontStyle: 'normal',
        lineHeight: '24px',
        letterSpacing: 0
    },
    h5: {
        fontFamily: 'Open Sans',
        fontSize: '15px',
        fontWeight: 600,
        fontStyle: 'normal',
        lineHeight: '20px',
        letterSpacing: 0
    },
    sideNavigationGroup: {
        fontFamily: 'Muli',
        fontSize: '14px',
        fontWeight: 600,
        fontStyle: 'normal',
        lineHeight: '16.1px',
        letterSpacing: 0
    },
    regularHighlightedText: {
        fontFamily: 'Open Sans',
        fontSize: '14px',
        fontWeight: 600,
        fontStyle: 'normal',
        lineHeight: '20px',
        letterSpacing: 0
    },
    sideNavigationItem1St2NdLvl: {
        fontFamily: 'Muli',
        fontSize: '14px',
        fontWeight: 'normal',
        fontStyle: 'normal',
        lineHeight: '16.1px',
        letterSpacing: 0
    },
    regularText: {
        fontFamily: 'Open Sans',
        fontSize: '14px',
        fontWeight: 'normal',
        fontStyle: 'normal',
        lineHeight: '20px',
        letterSpacing: 0
    },
    sideNavigationItem3RdLvl: {
        fontFamily: 'Muli',
        fontSize: '13px',
        fontWeight: 'normal',
        fontStyle: 'normal',
        letterSpacing: 0
    },
    smallText: {
        fontFamily: 'Open Sans',
        fontSize: '13px',
        fontWeight: 'normal',
        fontStyle: 'normal',
        lineHeight: '18px',
        letterSpacing: 0
    },
    extraSmallText: {
        fontFamily: 'Open Sans',
        fontSize: '12px',
        fontWeight: 'normal',
        fontStyle: 'normal',
        lineHeight: '18px',
        letterSpacing: 0
    }
};
