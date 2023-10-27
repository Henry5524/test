import React from 'react';
import Box from '@material-ui/core/Box';
import { useRouter } from 'next/router';
import { Button, makeStyles } from '@material-ui/core';
import { colors } from '../../styles';
import { VcioIcon } from './VcioIcon';
import { downloadFile } from '../../services';

const useStyles = makeStyles(() => ({
    container: {
        margin: '12% auto auto auto',
        textAlign: 'center'
    },
    calculationErrorImage: {
        display: 'block',
        height: '156px',
        width: '185px',
        marginLeft: 'auto',
        marginRight: 'auto'
    },
    calculationErrorText: {
        marginTop: '20px'
    },
    downloadDiv: {
        marginTop: '20px'
    }
}));

export interface CalculationErrorProps {
    type: string;
    msg?: string;
    projectName?: string;
}


export const CalculationError: React.FunctionComponent<CalculationErrorProps> = (props: CalculationErrorProps) => {

    const classes = useStyles();
    const { basePath } = useRouter();
    const urlSuffix: string = `/${props.projectName}/.info/${props.type}.log`;

    return (
        <>
            <Box className={classes.container}>
                <img
                    data-cy="calculationError"
                    src={`${basePath}/images/calculationError.svg`}
                    alt="generic error"
                    className={classes.calculationErrorImage}
                />
                <div className={classes.calculationErrorText}>
                    {props.msg}
                </div>
                <div className={classes.downloadDiv}>
                    <Button
                        size="large"
                        variant="outlined"
                        startIcon={<VcioIcon vcio="general-download" iconColor={colors.green_500}/>}
                        onClick={() => downloadFile('overview.log', urlSuffix)}
                    >
                        Download Error Logs
                    </Button>
                </div>
            </Box>
        </>
    );
};
