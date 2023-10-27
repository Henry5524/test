import { Overrides } from '@material-ui/core/styles/overrides';

export const { MuiInputLabel }: Overrides = {
    MuiInputLabel: {
        formControl: {
            top: '-7px'  // Align the label hints to middle of text control
        },
        shrink: {
            transform: 'translate(14px, -5px) scale(0.75) !important',
            background: 'white',   // Note this is for the login page (dark background)
            padding: '5px'
        }
    }
};
