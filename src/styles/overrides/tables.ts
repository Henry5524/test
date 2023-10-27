import { Overrides } from '@material-ui/core/styles/overrides';
import { colors } from '../styleGuide';

export const { MuiTable, MuiTableHead, MuiTableCell }: Overrides = {
    MuiTable: {
        root: {
            backgroundColor: colors.white_100,
        }
    },
    MuiTableHead: {
        root: {
            backgroundColor: colors.white_100,
        },
    },
    MuiTableCell: {
        root: {
            padding: 0,
        },
        head: {
            backgroundColor: colors.white_100,
        }
    }
};
