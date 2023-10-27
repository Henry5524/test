import { Button, withStyles } from '@material-ui/core';
import { colors, text } from './styleGuide';

export const GrayButton = withStyles({
    root: {
        text: text.regularText,
        backgroundColor: colors.blue_gray_90,
        borderRadius: '4px',
        boxShadow: '0 1px 0 0 #d3dded',
        marginLeft: '10px',
        color: colors.black_90,
        '&:hover': {
            boxShadow: '0 1px 0 0 #a1d8bd',
            backgroundColor: colors.green_50
        }
    },
    sizeSmall: {
        fontWeight: 'normal',
        boxShadow: '0 1px 0 0 #d3dded',
        height: '32px',
        padding: '7px 12px'
    },
    sizeLarge: {
        height: '40px',
        boxShadow: '0 1px 0 0 #d3dded',
        padding: '10px 14px'
    }
})(Button);
