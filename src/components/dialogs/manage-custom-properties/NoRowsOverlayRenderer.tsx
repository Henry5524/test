import React from 'react';
import { VcioIcon } from '../../controls/VcioIcon';
import { colors } from '../../../styles';
import { NoData } from '../../controls/NoData';

export const NoRowsOverlayRenderer: React.FunctionComponent = () => {

    return (
        <NoData
            msg='There are no custom properties defined for devices'
            icon={
                <VcioIcon
                    className='vcio-general-tag-outline'
                    height={80}
                    width={100}
                    style={{ fontSize: '80px' }}
                    iconColor={colors.blue_gray_200}
                />
            }
        />
    );

};
