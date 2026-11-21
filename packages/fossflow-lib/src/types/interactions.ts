import { ModelStore, UiStateStore, Size, SlimMouseEvent } from 'src/types';
import { useScene } from 'src/hooks/useScene';

export interface State {
  model: ModelStore;
  scene: ReturnType<typeof useScene>;
  uiState: UiStateStore;
  rendererRef: HTMLElement;
  rendererSize: Size;
  isRendererInteraction: boolean;
  // The raw event (for modifier keys such as Shift+click)
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
