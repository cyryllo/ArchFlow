import { produce } from 'immer';
import { CoordsUtils, setWindowCursor } from 'src/utils';
import { ModeActions } from 'src/types';

export const Pan: ModeActions = {
  entry: () => {
    setWindowCursor('grab');
  },
  exit: () => {
    setWindowCursor('default');
  },
  mousemove: ({ uiState }) => {
    if (uiState.mode.type !== 'PAN') return;

    if (uiState.mouse.mousedown !== null) {
      const newScroll = produce(uiState.scroll, (draft) => {
        draft.position = uiState.mouse.delta?.screen
          ? CoordsUtils.add(draft.position, uiState.mouse.delta.screen)
          : draft.position;
      });

      uiState.actions.setScroll(newScroll);
    }
  },
  mousedown: ({ uiState, isRendererInteraction }) => {
    if (uiState.mode.type !== 'PAN' || !isRendererInteraction) return;

    setWindowCursor('grabbing');
  },
  mouseup: ({ uiState }) => {
    if (uiState.mode.type !== 'PAN') return;
    setWindowCursor('grab');

    // A temporary pan (e.g. started by dragging empty space in select mode)
    // hands control back to the tool that was active before it.
    if (uiState.mode.returnTo) {
      setWindowCursor('default');
      uiState.actions.setMode(uiState.mode.returnTo);
    }
  }
};
