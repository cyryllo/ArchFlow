import { ModelStore, UiStateStore, Size, SlimMouseEvent } from '../types';
import { useScene } from '../hooks/useScene';
export interface State {
    model: ModelStore;
    scene: ReturnType<typeof useScene>;
    uiState: UiStateStore;
    rendererRef: HTMLElement;
    rendererSize: Size;
    isRendererInteraction: boolean;
    mouseEvent?: SlimMouseEvent;
}
export type ModeActionsAction = (state: State) => void;
export type ModeActions = {
    entry?: ModeActionsAction;
    exit?: ModeActionsAction;
    mousemove?: ModeActionsAction;
    mousedown?: ModeActionsAction;
    mouseup?: ModeActionsAction;
};
