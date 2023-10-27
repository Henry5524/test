import React, { FunctionComponent, useContext, useEffect, useState } from 'react';
import { CardMedia, CircularProgress, Grid } from '@material-ui/core';

import { AppContext } from '@context';
import { CloudPricing } from '@services';
import { Message } from '@components';

export interface MoveGroupCostProps {
    mgid: string;
    projectId: string;
}

export const MoveGroupCost: FunctionComponent<MoveGroupCostProps> = (props) => {
    const appContext = useContext(AppContext);
    const [iframeUrl, setIframeUrl] = useState<string>('');
    const [error, setError] = useState<{ message: string } | null>(null);

    const userId = appContext && appContext.user ? appContext.user.id : '';
    const orgId = appContext && appContext.user ? appContext.user.activeOrganizationId : '';

    const loading = !iframeUrl && !error;

    useEffect(() => {
        let active = true;

        if (!loading) {
            return undefined;
        }
        CloudPricing.getAkasiaPricingUrl(props.mgid, userId, orgId, props.projectId, false)
            .then(url => {
                if (active && url) {
                    setError(null);
                    setIframeUrl(url);
                    // setIframeUrl('https://saas.akasiacloud.com/cloud-compare-virtana/101054');
                }
            })
            .catch(err => {
                setError(err);
                setIframeUrl('');
                // setError(null);
                // setIframeUrl('https://saas.akasiacloud.com/cloud-compare-virtana/101054');
            });

        return () => {
            active = false;
        };

    }, [loading, orgId, userId, props.projectId, props.mgid]);

    return (
        <>
            {
                !error?.message && iframeUrl &&
                <CardMedia
                    component="iframe"
                    src={iframeUrl}
                    frameBorder={0}
                    style={{ position: 'relative', width: '100%', height: '100%' }}
                />
            }
            { !error?.message && !iframeUrl && <CircularProgress /> }
            {
                !!error?.message &&
                <Grid
                    container
                    direction="row"
                    justify="center"
                    alignItems="center"
                    style={{ marginTop: 40 }}
                >
                    <Message warning={true}>{error.message ?? ''}</Message>
                </Grid>
            }
        </>
    );
};

export default MoveGroupCost;
