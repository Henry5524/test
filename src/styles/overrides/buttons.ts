import { Overrides } from '@material-ui/core/styles/overrides';
import { colors, text } from '../styleGuide';

export const { MuiButton }: Overrides = {
    MuiButton: {
        text: text.regularText,
        root: {
            textTransform: 'none',
            backgroundColor: colors.green_150,
            color: colors.black_100,
            '&:hover': {
                backgroundColor: colors.green_100,
            },
            '&:disabled': {
                backgroundColor: colors.green_150,
                opacity: .5,
                color: colors.black_100,
                cursor: 'not-allowed',
            },
            '&.icon-button': {
                width: '40px',
                minWidth: '40px',
                padding: 0,
                color: colors.green_700,
            }
        },
        outlined: {
            backgroundColor: colors.white_100,
            border: '1px solid ' + colors.green_500,
            '&:hover': {
                backgroundColor: colors.green_100,
                border: '1px solid ' + colors.green_100,
            },
            '&:disabled': {
                border: '1px solid ' + colors.green_500,
                backgroundColor: colors.white_100,
                opacity: .5,
                color: colors.black_100,
                cursor: 'not-allowed',
            },
            '&.icon-button': {
                color: colors.green_500,
                border: '1px solid ' + colors.blue_gray_300,
                '&:hover': {
                    backgroundColor: colors.white_100,
                    border: '1px solid ' + colors.green_500,
                },
                '&.selected': {
                    backgroundColor: colors.white_100,
                    border: '1px solid ' + colors.green_500,
                },
                '&:disabled': {
                    border: '1px solid ' + colors.blue_gray_300,
                    opacity: .5,
                    cursor: 'not-allowed',
                },
            }
        },
        sizeLarge: {
            height: '40px',
            padding: '10px 14px',
        },
        iconSizeLarge: {
            color: colors.green_700,
            '& > svg': {
                width: '20px',
                height: '20px',
            },
        },
        sizeSmall: {
            ...text.regularText,
            backgroundColor: colors.green_600,
            color: colors.white_100,
            fill: colors.white_100,
            fontWeight: 600,
            height: '32px',
            padding: '7px 12px',
            '&:hover': {
                backgroundColor: colors.green_500,
            },
            '&:disabled': {
                backgroundColor: colors.green_600,
                opacity: .5,
                color: colors.white_100,
                cursor: 'not-allowed',
            },
            '&$outlined': {
                color: colors.green_600,
                backgroundColor: colors.white_100,
                border: '1px solid ' + colors.green_500,
                fontWeight: 'normal',
                '&:hover': {
                    color: colors.white_100,
                    backgroundColor: colors.green_500,
                    border: '1px solid ' + colors.green_500,
                    '& svg': {
                        color: colors.white_100,
                    },
                },
                '&:disabled': {
                    border: '1px solid ' + colors.green_500,
                    backgroundColor: colors.white_100,
                    opacity: .5,
                    color: colors.green_600,
                    cursor: 'not-allowed',
                },
                '& svg': {
                    color: colors.green_500,
                },
                '&.icon-button': {
                    color: colors.green_500,
                    border: '1px solid ' + colors.blue_gray_300,
                    '&:hover': {
                        backgroundColor: colors.green_50,
                        border: '1px solid ' + colors.green_200,
                        '& svg': {
                            color: colors.green_500,
                        }
                    },
                    '&.selected': {
                        backgroundColor: colors.green_50,
                        border: '1px solid ' + colors.green_200,
                        '& svg': {
                            color: colors.green_500,
                        }
                    },
                    '&:disabled': {
                        border: '1px solid ' + colors.blue_gray_300,
                        opacity: .5,
                        cursor: 'not-allowed',
                    },
                }
            },
            '&.icon-button': {
                width: '32px',
                minWidth: '32px',
                padding: 0,
                color: colors.white_100,
            }
        },
        iconSizeSmall: {
            color: colors.white_100,
            '& > svg': {
                width: '20px',
                height: '20px',
            }
        },
    }
};
