import { Box, Grid } from '@material-ui/core';
import React from 'react';
import { colors } from '../../styles';
import SvgArrow from '../SvgArrow';
import { VcioIcon } from './VcioIcon';

interface DataTransferGraphicProps {
    title: string;
    fromDesignation: string;
    toDesignation: string;
    speed1?: string;
    speed2?: string;
    clientCount?: string;
}

export const DataTransferGraphic: React.FunctionComponent<DataTransferGraphicProps> = (props: DataTransferGraphicProps) => {
    return (
        <Box mt={8} mb={12}>
            <Grid container spacing={4} justify="center" alignItems="center">
                <Grid item>
                    <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '14px' }}>
                        <Box
                            border={1}
                            borderColor={colors.blue_gray_200}
                            bgcolor={colors.blue_gray_40}
                            borderRadius={4}
                            p={4}
                        >
                            <Grid container justify="center" alignItems="center">
                                <Grid item>
                                    <VcioIcon vcio="migration-application" rem={2} width={50} iconColor={colors.blue_500} mr={12}/>
                                </Grid>
                                <Grid item>
                                    {props.title}<br/>{props.clientCount && Number(props.clientCount) > 0 ? `${props.clientCount} ${props.fromDesignation}` : ''}
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>
                </Grid>
                <Grid item>
                    <Box ml={8} mr={8}>
                        <Grid container direction="column" justify="center" alignItems="center" style={{ minWidth: '100px' }}>
                            <Grid item style={{ color: colors.blue_600 }}>
                                {props.speed1 || ''}
                            </Grid>
                            <Grid item style={{ width: '75%', minWidth: '100px', maxWidth: '150px' }}>
                                <SvgArrow color={colors.blue_500} direction="right"/>
                            </Grid>
                            <Grid item style={{ width: '75%', minWidth: '100px', maxWidth: '150px' }}>
                                <SvgArrow color={colors.green_500} direction="left"/>
                            </Grid>
                            <Grid item style={{ color: colors.green_600 }}>
                                {props.speed2 || ''}
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>
                <Grid item>
                    <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <Box
                            border={1}
                            borderColor={colors.blue_gray_200}
                            bgcolor={colors.white_100}
                            borderRadius={4}
                        >
                            <Box
                                border={1}
                                borderColor={colors.blue_gray_200}
                                bgcolor={colors.white_100}
                                borderRadius={4}
                                style={{ position: 'relative', left: '-6px', top: '6px' }}
                            >
                                <Box
                                    border={1}
                                    borderColor={colors.blue_gray_200}
                                    bgcolor={colors.blue_gray_40}
                                    borderRadius={4}
                                    p={4}
                                    style={{ position: 'relative', left: '-6px', top: '6px' }}
                                >
                                    <Grid container justify="center" alignItems="center">
                                        <Grid item>
                                            <VcioIcon vcio="migration-application" rem={2} width={50} iconColor={colors.blue_500} mr={12}/>
                                        </Grid>
                                        <Grid item>
                                            {props.toDesignation} Applications<br/>and Compute Instances
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};
