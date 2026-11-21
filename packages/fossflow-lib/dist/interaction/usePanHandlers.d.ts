import { SlimMouseEvent } from '../types';
export declare const usePanHandlers: () => {
    handleMouseDown: (e: SlimMouseEvent) => boolean;
    handleMouseUp: () => boolean;
    isPanning: boolean;
};
