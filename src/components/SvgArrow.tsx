import * as React from 'react';

interface SvgArrowProps {
    color: string;
    direction: string;  // Left or Right
}

/**
 * SVG line with arrowhead, will stretch to container.
 *
 * @param props
 * @constructor
 */
function SvgArrow(props: SvgArrowProps) {
    return (
        <svg fill={props.color} stroke={props.color} viewBox="0 0 350 100" transform={props.direction === 'left' ? 'scale(-1 1)' : ''}>
            <defs>
                <marker
                    id={'arrow_svg__arrowhead_' + props.direction}
                    markerWidth={10}
                    markerHeight={7}
                    refX={0}
                    refY={3.5}
                    orient="auto"
                >
                    <path fill={props.color} d="M0 0l10 3.5L0 7z"/>
                </marker>
            </defs>
            <path
                strokeWidth={8}
                markerEnd={'url(#arrow_svg__arrowhead_' + props.direction + ')'}
                d="M0 50h250"
            />
        </svg>
    );
}

export default SvgArrow;

