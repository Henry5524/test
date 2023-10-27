import { Box, Grid } from '@material-ui/core';
import _ from 'lodash';
import React from 'react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { config } from '../../config';
import { Toolbar, ToolbarProps } from './Toolbar';

interface ImageWrapperProps {
    imgPath: string;
    noPathRemapping?: boolean;
    // eslint-disable-next-line react/require-default-props
    onClickHandler?: () => void;
    // eslint-disable-next-line react/require-default-props
    nav?: boolean;
    // eslint-disable-next-line react/require-default-props
    toolbar?: ToolbarProps;
    // eslint-disable-next-line react/require-default-props
    enableWheel?: boolean;
}

/**
 * Image Wrapper for displaying zoomable images.
 *
 * Example usage:
 *  <ImageWrapper imgPath={`${path.basePath}/images/test2.png`}/>
 *
 * @param props
 * @constructor
 */
export const ImageWrapper: React.FunctionComponent<ImageWrapperProps> = (props: ImageWrapperProps) => {
    const { imgPath, onClickHandler, enableWheel } = props;

    const zoomState = {
        type: true,
        limitToBounds: true,
        panningEnabled: false,
        transformEnabled: true,
        pinchEnabled: false,
        limitToWrapper: false,
        disabled: false,
        dbClickEnabled: false,
        lockAxisX: false,
        lockAxisY: false,
        velocityEqualToMove: true,
        enableWheel: enableWheel || false,
        enableTouchPadPinch: true,
        enableVelocity: true,
        limitsOnWheel: false,
    };
    const downloadImg = () => {
        const win = window.open(imgPath, '_blank');
        // @ts-ignore
        win.focus();
    };
    /**
     * Function information is not yet used, keeping for reference for now.
     * @param img
     */
    const onImgLoad = (_img: any) => {
        // const height = img.target.offsetHeight;
        // const width = img.target.offsetWidth;
        // log(`${imgPath}, height: ${height}, width: ${width}`);
    };

    const onImgClick = () => {
        if (onClickHandler) onClickHandler();
    };

    if (_.isEmpty(props.imgPath)) {
        return (
            <Box alignItems="center" justifyContent="center">No Data Found</Box>
        );
    }

    return (
        <>
            {
                props.toolbar &&
                <Toolbar
                    title={props.toolbar.title}
                    showTotal={!_.isEmpty(props.imgPath) ? props.toolbar.showTotal : false}
                    buttons={!_.isEmpty(props.imgPath) ? props.toolbar.buttons : {}}
                    sourceName={props.toolbar.sourceName}
                    sourceUrl={props.toolbar.sourceUrl}
                    sourceImageName={props.toolbar.sourceImageName}
                    sourceImageUrl={props.toolbar.sourceImageUrl}
                    imageToggle={props.toolbar.imageToggle}
                />
            }
            <Grid container direction="row" spacing={1} alignItems="center" justify="center">
                <Box>
                    <Box className="row align-items-center" style={{ overflow: 'auto', maxWidth: '100%', maxHeight: '100%' }}>
                        <Box className="col-lg-12">
                            <TransformWrapper
                                options={{
                                    limitToBounds: zoomState.limitToBounds,
                                    transformEnabled: zoomState.transformEnabled,
                                    disabled: zoomState.disabled,
                                    limitToWrapper: zoomState.limitToWrapper,
                                }}
                                pan={{
                                    disabled: !zoomState.panningEnabled,
                                    lockAxisX: zoomState.lockAxisX,
                                    lockAxisY: zoomState.lockAxisY,
                                    velocityEqualToMove: zoomState.velocityEqualToMove,
                                    velocity: zoomState.enableVelocity,
                                }}
                                pinch={{ disabled: !zoomState.pinchEnabled }}
                                doubleClick={{ disabled: !zoomState.dbClickEnabled }}
                                wheel={{
                                    wheelEnabled: zoomState.enableWheel,
                                    touchPadEnabled: zoomState.enableTouchPadPinch,
                                    limitsOnWheel: zoomState.limitsOnWheel,
                                    step: 10,
                                }}
                            >
                                {(
                                    {
                                        // @ts-ignore
                                        zoomIn,
                                        // @ts-ignore
                                        zoomOut,
                                        // @ts-ignore
                                        resetTransform
                                    }
                                ) => {
                                    return (
                                        <Box style={{ position: 'relative', }}>
                                            {
                                                props.nav &&
                                                <Box style={{ position: 'sticky', top: 5, left: 5, zIndex: 1000 }}>
                                                    <button
                                                        type="button"
                                                        aria-label="Zoom In"
                                                        key="zoomIn"
                                                        title="Zoom In"
                                                        data-testid="zoom-in-button"
                                                        onClick={zoomIn}
                                                        className="vcio-resize-search-plus"
                                                    />
                                                    <button
                                                        type="button"
                                                        aria-label="Zoom Out"
                                                        key="zoomOut"
                                                        title="Zoom Out"
                                                        data-testid="zoom-out-button"
                                                        onClick={zoomOut}
                                                        className="vcio-resize-search-minus"
                                                    />
                                                    <button
                                                        type="button"
                                                        aria-label="Reset Zoom"
                                                        key="resetZoom"
                                                        title="Reset Zoom"
                                                        data-testid="reset-button"
                                                        onClick={resetTransform}
                                                        className="vcio-resize-expand-arrows-alt"
                                                    />
                                                    <button
                                                        type="button"
                                                        aria-label="Download"
                                                        key="Download"
                                                        title="Download"
                                                        data-testid="download-button"
                                                        onClick={downloadImg}
                                                        className="vcio-file-file-download"
                                                    />
                                                </Box>
                                            }
                                            <TransformComponent>
                                                <Box onClick={() => onImgClick()}>
                                                    <img
                                                        src={props.noPathRemapping ? imgPath : config.results_base_url + imgPath}
                                                        onLoad={onImgLoad}
                                                        style={{ maxWidth: '100%', maxHeight: '100%', height: 'auto' }}
                                                        alt="Result"
                                                    />
                                                </Box>
                                            </TransformComponent>
                                        </Box>
                                    );
                                }}
                            </TransformWrapper>
                        </Box>
                    </Box>
                </Box>
            </Grid>
        </>
    );
};
