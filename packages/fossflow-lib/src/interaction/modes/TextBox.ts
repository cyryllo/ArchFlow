import { generateId, setWindowCursor } from 'src/utils';
import { ModeActions } from 'src/types';
import { TEXTBOX_DEFAULTS } from 'src/config';

// Text tool: a freshly created text box follows the mouse and is placed on
// mouse release, then the tool hands back to Select with the text's panel open.
// (With `id === null` a click on the canvas creates the text box there.)
export const TextBox: ModeActions = {
  entry: () => {
    setWindowCursor('crosshair');
  },
  exit: () => {
    setWindowCursor('default');
  },
  mousemove: ({ uiState, scene }) => {
    if (uiState.mode.type !== 'TEXTBOX' || !uiState.mode.id) return;

    scene.updateTextBox(uiState.mode.id, {
      tile: uiState.mouse.position.tile
    });
  },
  mousedown: ({ uiState, scene, isRendererInteraction }) => {
    if (
      uiState.mode.type !== 'TEXTBOX' ||
      uiState.mode.id ||
      !isRendererInteraction
    )
      return;

    const textBoxId = generateId();

    scene.createTextBox({
      ...TEXTBOX_DEFAULTS,
      id: textBoxId,
      tile: uiState.mouse.position.tile
    });

    uiState.actions.setItemControls(null);
    uiState.actions.setMode({
      type: 'TEXTBOX',
      showCursor: false,
      id: textBoxId
    });
  },
  mouseup: ({ uiState, scene, isRendererInteraction }) => {
    if (uiState.mode.type !== 'TEXTBOX' || !uiState.mode.id) return;

    if (!isRendererInteraction) {
      scene.deleteTextBox(uiState.mode.id);
    } else {
      uiState.actions.setItemControls({
        type: 'TEXTBOX',
        id: uiState.mode.id
      });
    }

    // One text per use: back to Select, so clicking empty space after typing
    // just closes the panel instead of dropping another text box
    uiState.actions.setMode({
      type: 'CURSOR',
      showCursor: true,
      mousedownItem: null
    });
  }
};
