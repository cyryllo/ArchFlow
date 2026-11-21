import { ModeActions } from 'src/types';
import { generateId, findNearestUnoccupiedTile } from 'src/utils';
import { VIEW_ITEM_DEFAULTS } from 'src/config';

// Add item: pick an icon in the panel (click or drag), then click / drop it
// on the canvas. After one node is placed the tool closes and Select is back.
export const PlaceIcon: ModeActions = {
  mousemove: () => {},
  mousedown: () => {},
  mouseup: ({ uiState, scene, isRendererInteraction }) => {
    if (uiState.mode.type !== 'PLACE_ICON') return;

    // Releasing over the icon panel (e.g. a plain click to pick an icon)
    // must not drop an icon onto the canvas underneath it.
    if (uiState.mode.id !== null && isRendererInteraction) {
      // Find the nearest unoccupied tile to the target position
      const targetTile = findNearestUnoccupiedTile(
        uiState.mouse.position.tile,
        scene
      );

      // Place the icon on the nearest unoccupied tile
      if (targetTile) {
        const modelItemId = generateId();

        scene.placeIcon({
          modelItem: {
            id: modelItemId,
            name: 'Untitled',
            icon: uiState.mode.id
          },
          viewItem: {
            ...VIEW_ITEM_DEFAULTS,
            id: modelItemId,
            tile: targetTile
          }
        });
      }

      uiState.actions.setItemControls(null);
      uiState.actions.setMode({
        type: 'CURSOR',
        showCursor: true,
        mousedownItem: null
      });
    }
  }
};
