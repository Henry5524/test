import React from 'react';
import { VcioIcon } from '../../controls/VcioIcon';
import { colors } from '../../../styles';

interface MyProps {
    data: any;
}

export const TrashIconCellRenderer: React.FunctionComponent<MyProps> = (props: MyProps) => {

    return (
        props.data.deleted ?
            <VcioIcon
                className='vcio-history-undo'
                height={16}
                width={20}
                style={{ fontSize: '16px' }}
                iconColor={colors.green_500}
            /> :
            <VcioIcon
                className='vcio-general-trash-outline'
                height={16}
                width={20}
                style={{ fontSize: '16px' }}
                iconColor={colors.blue_gray_500}
            />
    );

};
