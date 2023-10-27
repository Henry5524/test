import { Overrides } from '@material-ui/core/styles/overrides';
import { colors, text } from '../styleGuide';

export const { MuiInputBase, MuiOutlinedInput}: Overrides = {
    MuiInputBase: {
        input: {
            ...text.regularText,
            color: colors.black_90,
        },
    },
    MuiOutlinedInput: {
        root: {
            padding: '10px 12px',
            '&.Mui-focused:not(:hover):not($disabled) fieldset': {
                borderColor: colors.green_500,
                borderWidth: '1px',
            },
            '&:not(.Mui-focused):hover:not($disabled) fieldset': {
                borderColor: colors.green_500,
            },
            '&.Mui-focused:hover:not($disabled) fieldset': {
                borderColor: colors.green_500,
                borderWidth: '1px',
            },
            '&$disabled fieldset': {
                borderColor: colors.green_500,
                backgroundColor: colors.blue_gray_50,
                opacity: .5,
            },
            '&:not($multiline) input': {
                height: '20px',
            },
        },
        multiline: {
            padding: '10px 12px',
        },
        marginDense: {
            padding: '6px 12px',
        },
        input: {
            padding: 0,
            paddingTop: 0,
            paddingBottom: 0,
            '&$disabled': {
                opacity: .5,
                backgroundColor: colors.blue_gray_50,
            },
        },
        inputMarginDense: {
            padding: 0,
            paddingTop: 0,
            paddingBottom: 0,
        },
        notchedOutline: {
            borderColor: colors.blue_gray_300,
        },
        adornedStart: {
            color: colors.blue_gray_500
        }
    }
};
