import { Header } from '@components';
import { Backdrop, CircularProgress, makeStyles } from '@material-ui/core';
import { NavigationMenu } from '@models';
import React, { useState } from 'react';
import { MaskTarget } from '../../utils/common-project';
import { TreeNav } from './TreeNav';

const useStyles = makeStyles((theme) => ({
    '@global': {
        '.vw-hidden': {
            display: 'none',
        },
    },
    pageRoot: {
        height: '100vh',
        width: '100%',
        overflow: 'hidden',
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        display: 'flex',
        flexDirection: 'column',
        flex: 'auto',
    },
    pageHeader: {
        display: 'flex',
        flexShrink: 0,
        flexDirection: 'column',
    },
    pageContentWrapper: {
        display: 'flex',
        flexShrink: 0,
        flex: 'auto',
    },
    pageContent: {
        display: 'flex',
        flexShrink: 0,
        position: 'relative',
        flex: 'auto',
    },
    navColumn: {
        gridColumnEnd: 'span 1',
        // zIndex is necessary to overlay content after hovering over a collapsed left nav.
        // Chose 1100 to match the top AppBar (in the header).
        zIndex: 1100
    },
    main: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        padding: theme.spacing(0, 4, 8, 4),
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        flex: 'auto',
        height: '100%',
        overflow: 'auto'
    },
    maskEverything: {
        // As of 09/2020, the AppBar (used in the page header) zIndex defaults to 1100 per
        // https://next.material-ui.com/customization/z-index/
        // We also gave the left nav the same zIndex of 1100.
        // So, if we want to mask everything, zIndex must be greater than 1100 for the backdrop.
        zIndex: 1101,   // left nav and top nav are masked
        color: '#000',
        opacity: 0.15
    },
    maskContentOnly: {
        // As of 09/2020, the AppBar (used in the page header) zIndex defaults to 1100 per
        // https://next.material-ui.com/customization/z-index/
        // We also gave the left nav the same zIndex of 1100.
        // So, if we want to mask just the content of the page, leaving the left nav and header accessible, zIndex must
        // be less than 1100 for the backdrop.
        zIndex: 1099,   // left nav and top nav are not masked
        color: '#000',
        opacity: 0.15
    },
    spinner: {
        alignSelf: 'center',
        color: '#fff',
        opacity: 0.8
    }
}));

interface PageProps {
    children?: NonNullable<React.ReactNode>;
    tab?: 'executiveSummary' | 'cloudOptimization' | 'dataCenterCapacity' | 'migration' | 'settings';
    navMenu?: NavigationMenu;
    dataCy?: string;
    mask?: MaskTarget;
    onNotificationsClick?: ((event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void) | undefined;
}

export const Page: React.FunctionComponent<PageProps> = (props) => {
    const classes = useStyles();
    const nav: boolean = props.navMenu?.nodes.length !== 0;

    // const { messageQueueUuid } = appContext;
    // console.log('Page received message queue uuid=', messageQueueUuid);

    // setForceRender may be called by TreeNav to force a re-render of Page.  TreeNav provides a new empty object
    // which will change the state of Page, which will force a re-render.  This is done when the left nav is
    // collapsed or expanded - the Page needs to re-render to expand/shrink the content area.

    const [, setForceRender] = useState({});

    let navDiv;
    if (nav && props.navMenu) {
        navDiv =
            <div className={classes.navColumn}>
                <TreeNav navMenu={props.navMenu} forceParentRender={setForceRender}/>
            </div>;
    } else {
        navDiv = '';
    }

    let backdropClassName: string = '';
    let openBackdrop: boolean = false;
    if (props.mask === MaskTarget.Everything) {
        backdropClassName = classes.maskEverything;
        openBackdrop = true;
    } else if (props.mask === MaskTarget.ContentOnly) {
        backdropClassName = classes.maskContentOnly;
        openBackdrop = true;
    }

    return (
        <>
            <div
                data-cy={props.dataCy || 'basePage'}
                className={classes.pageRoot}
            >
                <Backdrop className={backdropClassName} open={openBackdrop}>
                    {openBackdrop && <CircularProgress size={48} className={classes.spinner}/>}
                </Backdrop>
                <div className={classes.pageHeader}>
                    <Header
                        tab={props.tab}
                        onNotificationsClick={props.onNotificationsClick}
                    />
                </div>
                <div className={classes.pageContentWrapper}>
                    {navDiv}
                    <div className={classes.pageContent}>
                        <main className={classes.main}>
                            {props.children}
                        </main>
                    </div>
                </div>
            </div>
        </>
    );
};
