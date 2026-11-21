import { produce } from 'immer';
import { ModeActions } from 'src/types';
import {
  hasMovedTile,
  getItemAtTile,
  getItemsBounds,
  isMultiSelectable,
  screenToScene,
  getItemsInSceneRect,
  getSelectionSceneRect,
  isInRect
} from 'src/utils';

export const Lasso: ModeActions = {
  mousemove: ({ uiState, scene, rendererSize }) => {
    if (uiState.mode.type !== 'LASSO' || !uiState.mouse.mousedown) return;

    if (uiState.mode.isDragging && uiState.mode.selection) {
      // User is dragging an existing selection - once the mouse reaches
      // another tile, switch to DRAG_ITEMS mode
      if (hasMovedTile(uiState.mouse)) {
        uiState.actions.setMode({
          type: 'DRAG_ITEMS',
          showCursor: true,
          items: uiState.mode.selection.items,
          isInitialMovement: true,
          keepSelection: true
        });
      }
      return;
    }

    // User is dragging out a screen-aligned selection box
    const mouseDown = uiState.mouse.mousedown;
    const toScene = (p: { x: number; y: number }) => {
      return screenToScene(p, uiState.zoom, uiState.scroll, rendererSize);
    };
    const sceneRect = {
      from: toScene(mouseDown.screen),
      to: toScene(uiState.mouse.position.screen)
    };
    const items = getItemsInSceneRect(sceneRect, scene);
    const tileBounds = getItemsBounds(items, scene) ?? {
      startTile: mouseDown.tile,
      endTile: uiState.mouse.position.tile
    };

    uiState.actions.setMode(
      produce(uiState.mode, (draft) => {
        if (draft.type === 'LASSO') {
          draft.selection = { ...tileBounds, items, sceneRect };
        }
      })
    );
  },

  mousedown: ({ uiState, scene, mouseEvent, rendererSize }) => {
    if (uiState.mode.type !== 'LASSO') return;

    // Shift+click on an element adds it to / removes it from the selection
    if (mouseEvent?.shiftKey) {
      const clicked = getItemAtTile({
        tile: uiState.mouse.position.tile,
        scene
      });
      if (clicked && isMultiSelectable(clicked)) {
        const current = uiState.mode.selection?.items ?? [];
        const exists = current.some((r) => {
          return r.type === clicked.type && r.id === clicked.id;
        });
        const items = exists
          ? current.filter((r) => {
              return !(r.type === clicked.type && r.id === clicked.id);
            })
          : [...current, clicked];
        const bounds = getItemsBounds(items, scene);

        if (!bounds) {
          uiState.actions.setMode(
            uiState.mode.fromCursor
              ? { type: 'CURSOR', showCursor: true, mousedownItem: null }
              : { ...uiState.mode, selection: null, isDragging: false }
          );
          return;
        }
        uiState.actions.setMode({
          ...uiState.mode,
          isDragging: false,
          selection: { ...bounds, items }
        });
        return;
      }
    }

    // If there's an existing selection, check if click is within it
    if (uiState.mode.selection) {
      const rect = getSelectionSceneRect(uiState.mode.selection, scene);
      const isWithinSelection =
        !!rect &&
        isInRect(
          screenToScene(
            uiState.mouse.position.screen,
            uiState.zoom,
            uiState.scroll,
            rendererSize
          ),
          rect
        );

      if (isWithinSelection) {
        // Clicked within selection - prepare to drag
        uiState.actions.setMode(
          produce(uiState.mode, (draft) => {
            if (draft.type === 'LASSO') {
              draft.isDragging = true;
            }
          })
        );
        return;
      }

      // A box selection made with the Select tool: clicking elsewhere goes
      // back to Select and is handled as a normal click (select/drag item).
      if (uiState.mode.fromCursor) {
        const itemAtTile = getItemAtTile({
          tile: uiState.mouse.position.tile,
          scene
        });

        if (!itemAtTile) uiState.actions.setItemControls(null);

        uiState.actions.setMode({
          type: 'CURSOR',
          showCursor: true,
          mousedownItem: itemAtTile
        });
        return;
      }

      // Clicked outside selection - clear it and stay in LASSO mode
      uiState.actions.setMode(
        produce(uiState.mode, (draft) => {
          if (draft.type === 'LASSO') {
            draft.selection = null;
            draft.isDragging = false;
          }
        })
      );
    }
  },

  mouseup: ({ uiState }) => {
    if (uiState.mode.type !== 'LASSO') return;

    // A Select-tool box that caught nothing just returns to Select
    if (
      uiState.mode.fromCursor &&
      (!uiState.mode.selection || uiState.mode.selection.items.length === 0)
    ) {
      uiState.actions.setMode({
        type: 'CURSOR',
        showCursor: true,
        mousedownItem: null
      });
      return;
    }

    // Reset dragging state but keep selection; the box now hugs the
    // selected elements instead of the area that was dragged
    uiState.actions.setMode(
      produce(uiState.mode, (draft) => {
        if (draft.type === 'LASSO') {
          draft.isDragging = false;
          if (draft.selection) draft.selection.sceneRect = undefined;
        }
      })
    );
  }
};
