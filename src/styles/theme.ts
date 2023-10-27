import { createMuiTheme } from '@material-ui/core';
import { colors } from './styleGuide';
import {
    MuiTable, MuiTableHead, MuiTableCell,
    MuiButton,
    MuiInputBase,
    MuiOutlinedInput,
    MuiInputLabel,
} from './overrides';

// Create a theme instance.
export const theme = createMuiTheme({
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 1440,
            lg: 1840,
            xl: 1920,
        },
    },
    overrides: {
        MuiTable, MuiTableHead, MuiTableCell,
        MuiButton,
        MuiInputBase,
        MuiOutlinedInput,
        MuiInputLabel,
    },
    props: {
        MuiTextField: {
            variant: 'outlined'
        },
        MuiTable: {
            stickyHeader: true
        }
    },
    spacing: 4,
    typography: {
        fontFamily: 'Open Sans, Muli, Helvetica, Arial, sans-serif',
    },
    palette: {
        primary: {
            main: '#2f3032',
            light: '#696969',
            contrastText: '#eaeaea',
        },
        secondary: {
            main: '#22c583',
            light: '#ddf6eb',
            dark: '#189d72',
        },
        error: {
            main: colors.red_500,
        },
        background: {
            default: colors.white_100,
            paper: '#f6f7f9',
        },
    },
});

