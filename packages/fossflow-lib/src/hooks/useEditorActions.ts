import { useCallback } from 'react';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useModelStore } from 'src/stores/modelStore';
import { useScene } from 'src/hooks/useScene';
import { useDiagramUtils } from 'src/hooks/useDiagramUtils';
import { dragItems } from 'src/interaction/modes/DragItems';
import { ClipboardData, Coords, ItemReference, Connector } from 'src/types';
import { TEXTBOX_DEFAULTS } from 'src/config';
import { generateId, getItemsBounds } from 'src/utils';

// Element types that can be selected, copied, moved and deleted together
const SELECTABLE: ItemReference['type'][] = [
  'ITEM',
  'RECTANGLE',
  'TEXTBOX',
  'CONNECTOR'
];

/**
 * Editing actions shared by keyboard shortcuts and the right-click menu, so
 * both always do exactly the same thing.
 */
export const useEditorActions = () => {
  const uiState = useUiStateStore((state) => {
    return state;
  });
  const modelItems = useModelStore((state) => {
    return state.items;
  });
  const scene = useScene();
  const { fitToView } = useDiagramUtils();
  const { actions } = uiState;

  const isEditable = uiState.editorMode === 'EDITABLE';

  // ---------- Selection ----------

  const getSelection = useCallback((): ItemReference[] => {
    const { mode, itemControls } = uiState;
    if (
      (mode.type === 'LASSO' || mode.type === 'FREEHAND_LASSO') &&
      mode.selection
    ) {
      return mode.selection.items;
    }
    if (itemControls && 'id' in itemControls) {
      if (SELECTABLE.includes(itemControls.type)) return [itemControls];
    }
    return [];
  }, [uiState]);

  const getBounds = useCallback(
    (refs: ItemReference[]) => {
      return getItemsBounds(refs, scene);
    },
    [scene]
  );

  // Makes `refs` the current selection: one element opens its properties,
  // several become a box selection that can be dragged or deleted.
  const selectItems = useCallback(
    (refs: ItemReference[]) => {
      if (refs.length === 1) {
        actions.setMode({ type: 'CURSOR', showCursor: true, mousedownItem: null });
        actions.setItemControls(refs[0]);
        return;
      }
      actions.setItemControls(null);
      if (refs.length === 0) {
        actions.setMode({ type: 'CURSOR', showCursor: true, mousedownItem: null });
        return;
      }
      // Just-pasted elements aren't in this render's scene yet, so the tile
      // bounds may be unknown here; the drawn box is computed from the
      // elements themselves on the next render anyway
      const bounds = getBounds(refs) ?? {
        startTile: { x: 0, y: 0 },
        endTile: { x: 0, y: 0 }
      };
      actions.setMode({
        type: 'LASSO',
        showCursor: true,
        isDragging: false,
        fromCursor: true,
        selection: { ...bounds, items: refs }
      });
    },
    [actions, getBounds]
  );

  // Shift+click: add the element to the selection, or take it out again
  const toggleInSelection = useCallback(
    (ref: ItemReference) => {
      if (!SELECTABLE.includes(ref.type) || ref.type === 'CONNECTOR') return;
      const current = getSelection().filter((r) => {
        return r.type !== 'CONNECTOR';
      });
      const exists = current.some((r) => {
        return r.type === ref.type && r.id === ref.id;
      });
      selectItems(
        exists
          ? current.filter((r) => {
              return !(r.type === ref.type && r.id === ref.id);
            })
          : [...current, ref]
      );
    },
    [getSelection, selectItems]
  );

  const selectAll = useCallback(() => {
    selectItems([
      ...scene.items.map((i) => {
        return { type: 'ITEM' as const, id: i.id };
      }),
      ...scene.rectangles.map((r) => {
        return { type: 'RECTANGLE' as const, id: r.id };
      }),
      ...scene.textBoxes.map((t) => {
        return { type: 'TEXTBOX' as const, id: t.id };
      }),
      ...scene.connectors.map((c) => {
        return { type: 'CONNECTOR' as const, id: c.id };
      })
    ]);
  }, [scene.items, scene.rectangles, scene.textBoxes, scene.connectors, selectItems]);

  const clearSelection = useCallback(() => {
    actions.setItemControls(null);
    actions.setMode({ type: 'CURSOR', showCursor: true, mousedownItem: null });
  }, [actions]);

  // ---------- Delete / clipboard ----------

  const deleteItems = useCallback(
    (refs: ItemReference[] = getSelection()) => {
      if (!isEditable || refs.length === 0) return;
      scene.deleteItems(refs);
      clearSelection();
    },
    [isEditable, getSelection, scene, clearSelection]
  );

  const buildClipboard = useCallback(
    (refs: ItemReference[]): ClipboardData | null => {
      const ids = (type: ItemReference['type']) => {
        return refs
          .filter((r) => {
            return r.type === type;
          })
          .map((r) => {
            return r.id;
          });
      };
      const view = scene.currentView;
      const nodeIds = ids('ITEM');
      const viewItems = (view.items ?? []).filter((i) => {
        return nodeIds.includes(i.id);
      });
      const rectangles = (view.rectangles ?? []).filter((r) => {
        return ids('RECTANGLE').includes(r.id);
      });
      const textBoxes = (view.textBoxes ?? []).filter((t) => {
        return ids('TEXTBOX').includes(t.id);
      });
      // Connectors go along when picked explicitly, or when every node they
      // touch is part of the copy
      const connectorIds = ids('CONNECTOR');
      const connectors = (view.connectors ?? []).filter((c: Connector) => {
        if (connectorIds.includes(c.id)) return true;
        const itemRefs = c.anchors.filter((a) => {
          return a.ref.item;
        });
        return (
          itemRefs.length > 0 &&
          itemRefs.every((a) => {
            return nodeIds.includes(a.ref.item as string);
          })
        );
      });

      if (
        viewItems.length + rectangles.length + textBoxes.length + connectors.length ===
        0
      ) {
        return null;
      }

      const tiles: Coords[] = [
        ...viewItems.map((i) => {
          return i.tile;
        }),
        ...rectangles.flatMap((r) => {
          return [r.from, r.to];
        }),
        ...textBoxes.map((t) => {
          return t.tile;
        }),
        ...connectors.flatMap((c) => {
          return c.anchors
            .map((a) => {
              return a.ref.tile;
            })
            .filter(Boolean) as Coords[];
        })
      ];

      return {
        modelItems: modelItems.filter((m) => {
          return nodeIds.includes(m.id);
        }),
        viewItems,
        rectangles,
        textBoxes,
        connectors,
        origin: {
          x: Math.min(
            ...tiles.map((t) => {
              return t.x;
            })
          ),
          y: Math.min(
            ...tiles.map((t) => {
              return t.y;
            })
          )
        }
      };
    },
    [scene.currentView, modelItems]
  );

  const copy = useCallback(
    (refs: ItemReference[] = getSelection()) => {
      const clip = buildClipboard(refs);
      if (clip) actions.setClipboard(clip);
      return clip;
    },
    [getSelection, buildClipboard, actions]
  );

  const cut = useCallback(
    (refs: ItemReference[] = getSelection()) => {
      if (!isEditable) return;
      if (copy(refs)) deleteItems(refs);
    },
    [isEditable, getSelection, copy, deleteItems]
  );

  // Pastes so the copied group's top-left corner lands on `tile`
  // (by default the tile under the mouse)
  const paste = useCallback(
    (tile: Coords = uiState.mouse.position.tile) => {
      const clip = uiState.clipboard;
      if (!isEditable || !clip) return;
      const created = scene.pasteItems(clip, {
        x: tile.x - clip.origin.x,
        y: tile.y - clip.origin.y
      });
      selectItems(created);
    },
    [isEditable, uiState.clipboard, uiState.mouse.position.tile, scene, selectItems]
  );

  // Copy placed right next to the original, without touching the clipboard
  const duplicate = useCallback(
    (refs: ItemReference[] = getSelection()) => {
      if (!isEditable) return;
      const clip = buildClipboard(refs);
      if (!clip) return;
      const created = scene.pasteItems(clip, { x: 1, y: -1 });
      selectItems(created);
    },
    [isEditable, getSelection, buildClipboard, scene, selectItems]
  );

  const reorder = useCallback(
    (where: 'front' | 'back', refs: ItemReference[] = getSelection()) => {
      if (!isEditable || refs.length === 0) return;
      scene.reorderItems(refs, where);
    },
    [isEditable, getSelection, scene]
  );

  // Arrow keys: nudge the selection one tile
  const moveSelection = useCallback(
    (delta: Coords) => {
      // Connectors in the selection move too (their hand-placed points)
      const refs = getSelection();
      if (!isEditable || refs.length === 0) return false;

      dragItems(refs, uiState.mouse.position.tile, delta, scene);

      const { mode } = uiState;
      if (mode.type === 'LASSO' && mode.selection) {
        const s = mode.selection;
        actions.setMode({
          ...mode,
          selection: {
            ...s,
            startTile: { x: s.startTile.x + delta.x, y: s.startTile.y + delta.y },
            endTile: { x: s.endTile.x + delta.x, y: s.endTile.y + delta.y },
            // Redraw the box around the moved elements
            sceneRect: undefined
          }
        });
      } else if (mode.type === 'FREEHAND_LASSO' && mode.selection) {
        // The drawn outline can't follow a keyboard nudge - keep the items
        // selected as a box instead
        selectItems(refs);
      }
      return true;
    },
    [isEditable, getSelection, uiState, scene, actions, selectItems]
  );

  // ---------- Element actions ----------

  const showProperties = useCallback(
    (ref: ItemReference) => {
      actions.setMode({ type: 'CURSOR', showCursor: true, mousedownItem: null });
      actions.setItemControls(ref);
    },
    [actions]
  );

  const changeIcon = useCallback(
    (ref: ItemReference) => {
      if (ref.type !== 'ITEM') return;
      showProperties(ref);
      // Let the node panel mount before asking it to open the icon picker
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('quickIconChange'));
      }, 0);
    },
    [showProperties]
  );

  const rename = useCallback(
    (ref: ItemReference | undefined = getSelection()[0]) => {
      if (!ref || ref.type !== 'ITEM') return;
      showProperties(ref);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('archflow:focusName'));
      }, 0);
    },
    [getSelection, showProperties]
  );

  // "Connect to…": start a connector from this node; the next click picks
  // the other end (works in both click and drag connector modes)
  const startConnectorFrom = useCallback(
    (itemId: string) => {
      if (!isEditable) return;
      const id = generateId();
      scene.createConnector({
        id,
        color: scene.colors[0]?.id,
        anchors: [
          { id: generateId(), ref: { item: itemId } },
          { id: generateId(), ref: { item: itemId } }
        ]
      });
      actions.setItemControls(null);
      actions.setMode({
        type: 'CONNECTOR',
        showCursor: true,
        id,
        startAnchor: { itemId },
        isConnecting: true
      });
    },
    [isEditable, scene, actions]
  );

  // ---------- Tools started from menus ----------

  const startAddNode = useCallback(() => {
    actions.setItemControls({ type: 'ADD_ITEM' });
    actions.setMode({ type: 'PLACE_ICON', showCursor: true, id: null });
  }, [actions]);

  const startDrawRectangle = useCallback(() => {
    actions.setItemControls(null);
    actions.setMode({ type: 'RECTANGLE.DRAW', showCursor: true, id: null });
  }, [actions]);

  const addTextAt = useCallback(
    (tile: Coords) => {
      if (!isEditable) return;
      const id = generateId();
      scene.createTextBox({ ...TEXTBOX_DEFAULTS, id, tile });
      showProperties({ type: 'TEXTBOX', id });
    },
    [isEditable, scene, showProperties]
  );

  return {
    isEditable,
    getSelection,
    selectItems,
    toggleInSelection,
    selectAll,
    clearSelection,
    deleteItems,
    copy,
    cut,
    paste,
    duplicate,
    reorder,
    moveSelection,
    showProperties,
    changeIcon,
    rename,
    startConnectorFrom,
    startAddNode,
    startDrawRectangle,
    addTextAt,
    zoomIn: actions.incrementZoom,
    zoomOut: actions.decrementZoom,
    fitToView,
    canPaste: Boolean(uiState.clipboard)
  };
};
