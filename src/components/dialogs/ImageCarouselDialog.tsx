import { Box, CardProps, Dialog, DialogContent, DialogTitle, Grid, makeStyles } from '@material-ui/core';
import React from 'react';
import Carousel from 'react-material-ui-carousel';
import { colors, theme } from '../../styles';
import { UUID } from '../../utils';
import { ImageWrapper } from '../controls/ImageWrapper';

interface ImageCarouselDialogProps extends CardProps {
    // eslint-disable-next-line react/require-default-props
    startAt?: number;
    images: {
        title: string;
        name: string;
        imageUrl: string;
    }[];
    imageCarouselOpen: boolean;
    handleCarouselClose: () => void;
}

const useStyles = makeStyles({
    dialog: {
        height: 'auto',
        borderRadius: 4,
        backgroundColor: colors.white_100,
        shadowColor: 'rgba(15, 45, 104, 0.39)',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowRadius: 13,
        shadowOpacity: 1,
        borderStyle: 'solid',
        borderWidth: 0,
        borderColor: colors.blue_gray_300,
        padding: theme.spacing(4),
    },
    title: {
        width: '100%',
        fontSize: 22,
        fontWeight: 300,
        fontStyle: 'normal',
        letterSpacing: 0,
        color: colors.black_90
    },
});
export const ImageCarouselDialog: React.FunctionComponent<ImageCarouselDialogProps> = (props: ImageCarouselDialogProps) => {
    const { children, className, images, imageCarouselOpen, handleCarouselClose, ...other } = props;
    const classes = useStyles();
    const [title, setTitle] = React.useState(images && images[0] ? images[0].title : '');

    const handleClose = () => {
        handleCarouselClose();
    };

    return (
        <>
            <Box css={{ maxHeight: '80%', maxWidth: '80%' }}>
                <Dialog
                    data-cy="imageCarouselDialog"
                    open={imageCarouselOpen}
                    classes={{ paper: classes.dialog }}
                    maxWidth={false}
                    onClose={handleClose}
                    style={{ maxHeight: '100%' }}
                    {...other}
                >
                    <DialogTitle
                        data-cy="imageCarouselDialogTitle"
                        id="customized-dialog-title"
                        className={classes.title}
                    >
                        {title}
                    </DialogTitle>
                    <DialogContent>
                        <Grid container style={{ maxHeight: '80%' }}>
                            <Carousel
                                autoPlay={false}
                                timeout={100}
                                navButtonsAlwaysVisible={false}
                                startAt={props.startAt || 0}
                                onChange={(index: number) => setTitle(images[index].title)}
                            >
                                {
                                    images.map((item, i) =>
                                        <Box pr={15} pl={15} id={'image' + i} key={UUID.toString()}>
                                            <ImageWrapper
                                                imgPath={item.imageUrl}
                                                enableWheel={true}
                                            />
                                        </Box>
                                    )
                                }
                            </Carousel>
                        </Grid>
                    </DialogContent>
                </Dialog>
            </Box>
        </>
    );
};

