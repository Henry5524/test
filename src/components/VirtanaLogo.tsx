import { makeStyles } from '@material-ui/core';
import React from 'react';
import { useRouter } from 'next/router';

const useStyles = makeStyles(() => ({
    virtanaLogo: {
        width: 199,
        height: 38,
        objectFit: 'contain',
        display: 'block',
        marginLeft: 'auto',
        marginRight: 'auto'
    },
    logo: {
        width: 51,
        height: 46,
        objectFit: 'contain',
        display: 'block',
        marginLeft: 'auto',
        marginRight: 'auto'
    }
}));

interface VirtanaLogoProps {
    noText?: boolean;
};

export const VirtanaLogo: React.FunctionComponent<VirtanaLogoProps> = (props) => {
    const classes = useStyles();
    const { basePath } = useRouter();
    const imgName = props.noText ? 'logo.svg' : 'virtanalogo.svg';

    return (
        <>
            <img
                data-cy="virtanaLogo"
                src={`${basePath}/images/${imgName}`}
                alt="Virtana Logo"
                className={props.noText ? classes.logo : classes.virtanaLogo}
            />
        </>
    );
};
