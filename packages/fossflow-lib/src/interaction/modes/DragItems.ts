import { produce } from 'immer';
import { ModeActions, Coords, ItemReference } from 'src/types';
import { useScene } from 'src/hooks/useScene';
import type { State } from 'src/stores/reducers/types';
import {
  getItemByIdOrThrow,
  CoordsUtils,
  hasMovedTile,
  getAnchorParent,
  getItemAtTile,
  findNearestUnoccupiedTilesForGroup,
  getItemsBounds
} from 'src/utils';

export const dragItems = (
  items: ItemReference[],
  tile: Coords,
  delta: Coords,
  scene: ReturnType<typeof useScene>
) => {
  const itemRefs = items.filter((item) => {
    return item.type === 'ITEM';
  });
  const otherRefs = items.filter((item) => {
    return item.type !== 'ITEM';
  });

  // Nodes snap to the nearest free tiles as a group
  let newTiles: Coords[] | null = null;
  if (itemRefs.length > 0) {
    const itemsWithTargets = itemRefs.map((item) => {
      const node = getItemByIdOrThrow(scene.items, item.id).value;
      return {
        id: item.id,
        targetTile: CoordsUtils.add(node.tile, delta)
      };
    });
    newTiles = findNearestUnoccupiedTilesForGroup(
      itemsWithTargets,
      scene,
      itemRefs.map((item) => {
        return item.id;
      }) // Exclude the items being dragged
    );
    // No room for the whole group: leave everything where it is, so nodes and
    // the zones/texts around them never drift apart
    if (!newTiles) return;
  }

  // Every update is chained on one state object inside one transaction:
  // separate updates in the same tick would each start from the render-time
  // state and overwrite one another (that's how nodes used to stay behind
  // while a zone or text in the same selection moved).
  scene.transaction(() => {
    let currentState: State | undefined;

    itemRefs.forEach((item, index) => {
      currentState = scene.updateViewItem(
        item.id,
        { tile: (newTiles as Coords[])[index] },
        currentState
      );
    });

    // Connectors travel with the selection: hand-placed points (tile anchors)
    // move by the same delta when the connector itself is selected (the box
    // caught it - see connectorFollowsSelection), or when both of its ends
    // sit on nodes that are being moved. A connector with a free end stays
    // put otherwise, so a join with another connector never gets torn.
    const movedNodeIds = new Set(
      itemRefs.map((item) => {
        return item.id;
      })
    );
    const selectedConnectorIds = new Set(
      otherRefs
        .filter((item) => {
          return item.type === 'CONNECTOR';
        })
        .map((item) => {
          return item.id;
        })
    );
    scene.connectors.forEach((connector) => {
      const first = connector.anchors[0];
      const last = connector.anchors[connector.anchors.length - 1];
      const travels =
        selectedConnectorIds.has(connector.id) ||
        (!!first?.ref.item &&
          !!last?.ref.item &&
          movedNodeIds.has(first.ref.item) &&
          movedNodeIds.has(last.ref.item));
      const hasPoints = connector.anchors.some((anchor) => {
        return anchor.ref.tile;
      });
      if (!travels || !hasPoints) return;

      currentState = scene.updateConnector(
        connector.id,
        {
          anchors: connector.anchors.map((anchor) => {
            return anchor.ref.tile
              ? { ...anchor, ref: { ...anchor.ref, tile: CoordsUtils.add(anchor.ref.tile, delta) } }
              : anchor;
          })
        },
        currentState
      );
    });

    otherRefs.forEach((item) => {
      if (item.type === 'RECTANGLE') {
        const rectangle = getItemByIdOrThrow(scene.rectangles, item.id).value;
        currentState = scene.updateRectangle(
          item.id,
          {
            from: CoordsUtils.add(rectangle.from, delta),
            to: CoordsUtils.add(rectangle.to, delta)
          },
          currentState
        );
      } else if (item.type === 'TEXTBOX') {
        const textBox = getItemByIdOrThrow(scene.textBoxes, item.id).value;
        currentState = scene.updateTextBox(
          item.id,
          { tile: CoordsUtils.add(textBox.tile, delta) },
          currentState
        );
      } else if (item.type === 'CONNECTOR_ANCHOR') {
        const connector = getAnchorParent(item.id, scene.connectors);

        const newConnector = produce(connector, (draft) => {
          const anchor = getItemByIdOrThrow(connector.anchors, item.id);

          const itemAtTile = getItemAtTile({ tile, scene });

          switch (itemAtTile?.type) {
            case 'ITEM':
              draft.anchors[anchor.index] = {
                ...anchor.value,
                ref: {
                  item: itemAtTile.id
                }
              };
              break;
            case 'CONNECTOR_ANCHOR':
              draft.anchors[anchor.index] = {
                ...anchor.value,
                ref: {
                  anchor: itemAtTile.id
                }
              };
              break;
            default:
              draft.anchors[anchor.index] = {
                ...anchor.value,
                ref: {
                  tile
                }
              };
              break;
          }
        });

        currentState = scene.updateConnector(
          connector.id,
          newConnector,
          currentState
        );
      }
    });
  });
};

export const DragItems: ModeActions = {
  entry: ({ uiState, rendererRef }) => {
    if (uiState.mode.type !== 'DRAG_ITEMS' || !uiState.mouse.mousedown) return;

    const renderer = rendererRef;
    renderer.style.userSelect = 'none';
  },
  exit: ({ rendererRef }) => {
    const renderer = rendererRef;
    renderer.style.userSelect = 'auto';
  },
  mousemove: ({ uiState, scene }) => {
    if (uiState.mode.type !== 'DRAG_ITEMS' || !uiState.mouse.mousedown) return;

    if (uiState.mode.isInitialMovement) {
      const delta = CoordsUtils.subtract(
        uiState.mouse.position.tile,
        uiState.mouse.mousedown.tile
      );

      dragItems(uiState.mode.items, uiState.mouse.position.tile, delta, scene);

      uiState.actions.setMode(
        produce(uiState.mode, (draft) => {
          draft.isInitialMovement = false;
        })
      );

      return;
    }

    if (!hasMovedTile(uiState.mouse) || !uiState.mouse.delta?.tile) return;

    const delta = uiState.mouse.delta.tile;

    dragItems(uiState.mode.items, uiState.mouse.position.tile, delta, scene);
  },
  mouseup: ({ uiState, scene }) => {
    uiState.actions.setItemControls(null);

    // A dragged multi-selection stays selected (as a box around its new
    // position), so it can be dragged again, nudged or deleted
    if (uiState.mode.type === 'DRAG_ITEMS' && uiState.mode.keepSelection) {
      const items = uiState.mode.items;
      // (a selection of only connectors has no tile bounds; the drawn box
      // is computed from the elements themselves anyway)
      const bounds = getItemsBounds(items, scene) ?? {
        startTile: uiState.mouse.position.tile,
        endTile: uiState.mouse.position.tile
      };
      if (items.length > 0) {
        uiState.actions.setMode({
          type: 'LASSO',
          showCursor: true,
          isDragging: false,
          fromCursor: true,
          selection: { ...bounds, items }
        });
        return;
      }
    }

    uiState.actions.setMode({
      type: 'CURSOR',
      showCursor: true,
      mousedownItem: null
    });
  }
};
