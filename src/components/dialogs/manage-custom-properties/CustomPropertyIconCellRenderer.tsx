import React from 'react';
import { VcioIcon } from '../../controls/VcioIcon';
import { colors } from '../../../styles';

interface MyProps {
    data: any;
}

export const CustomPropertyIconCellRenderer: React.FunctionComponent<MyProps> = (props: MyProps) => {

    return (
        props.data.deleted ?
            <VcioIcon
                className='vcio-general-cross-circle'
                height={20}
                width={25}
                style={{ fontSize: '20px' }}
                iconColor={colors.blue_gray_300}
            /> :
            <VcioIcon
                className='vcio-general-tag-outline'
                height={20}
                width={25}
                style={{ fontSize: '20px' }}
                iconColor={colors.blue_500}
            />
    );

};
