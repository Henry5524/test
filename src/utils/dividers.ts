import { Point } from './point';

export class Divider {
    min: number = 10;
    max: number = 10000;
    position: number = 100;
    inverse?: boolean;
    axis: 'x' | 'y' = 'x';
    moving?: boolean;
    start?: number;
    cbMove?: (divider: Divider) => void;
    cbEnd?: (divider: Divider) => void;
}

const dividerDragStart = (divider: Divider): void => {
    divider.moving = true;
    divider.start = divider.position;
    dividerMove(divider, { x: 0, y: 0 });
};

const dividerDragEnd = (divider: Divider, p: Point): void => {
    divider.moving = false;
    dividerMove(divider, p);
    if (divider.cbEnd) {
        divider.cbEnd(divider);
    }
};

const dividerMove = (divider: Divider, p: Point): void => {
    const m = divider.inverse ? -1 : 1;
    let size = (divider.start ?? 0) + (m * p[divider.axis]);
    if (size < divider.min) {
        size = divider.min;
    }
    if (size > divider.max) {
        size = divider.max;
    }
    divider.position = size;
    if (divider.cbMove) {
        divider.cbMove(divider);
    }
};

export const getDividerHandler = (divider: Divider): ((origEvent: React.MouseEvent<HTMLElement, MouseEvent>) => void) => {
    let start: Point | undefined;

    return (event) => {
        event = event || window.event;
        event.stopPropagation();
        event.preventDefault();
        if (event.pageX) {
            start = new Point(event.pageX, event.pageY);
        }
        else if (event.clientX) {
            start = new Point(event.clientX, event.clientY);
        }
        if (start) {
            dividerDragStart(divider);

            document.body.onmousemove = (e: MouseEvent) => {
                e = e || window.event;
                e.stopPropagation();
                e.preventDefault();
                let endX = 0;
                let endY = 0;
                if (e.pageX) {
                    endX = e.pageX;
                    endY = e.pageY;
                }
                else if (e.clientX) {
                    endX = e.clientX;
                    endY = e.clientY;
                }
                if (start) {
                    dividerMove(divider, new Point(endX - start.x, endY - start.y));
                }
            };

            document.body.onmouseup = (e: MouseEvent) => {
                document.body.onmousemove = null;
                document.body.onmouseup = null;
                e = e || window.event;
                e.stopPropagation();
                e.preventDefault();
                let endX = 0;
                let endY = 0;
                if (e.pageX) {
                    endX = e.pageX;
                    endY = e.pageY;
                }
                else if (e.clientX) {
                    endX = e.clientX;
                    endY = e.clientY;
                }
                if (start) {
                    dividerDragEnd(divider, new Point(endX - start.x, endY - start.y));
                }
                start = undefined;
            };
        }
    };

};
