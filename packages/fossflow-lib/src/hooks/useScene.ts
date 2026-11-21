import { useCallback, useMemo, useRef } from 'react';
import {
  ModelItem,
  ViewItem,
  Connector,
  TextBox,
  Rectangle,
  ItemReference,
  ClipboardData,
  Coords
} from 'src/types';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useModelStore } from 'src/stores/modelStore';
import { useSceneStore } from 'src/stores/sceneStore';
import * as reducers from 'src/stores/reducers';
import type { State } from 'src/stores/reducers/types';
import { produce } from 'immer';
import {
  getItemByIdOrThrow,
  generateId,
  findNearestUnoccupiedTilesForGroup
} from 'src/utils';
import {
  CONNECTOR_DEFAULTS,
  RECTANGLE_DEFAULTS,
  TEXTBOX_DEFAULTS
} from 'src/config';

export const useScene = () => {
  const model = useModelStore((state) => {
    return state;
  });
  const scene = useSceneStore((state) => {
    return state;
  });
  const currentViewId = useUiStateStore((state) => {
    return state.view;
  });
  const transactionInProgress = useRef(false);

  const currentView = useMemo(() => {
    // Handle case where view doesn't exist yet or stores aren't initialized
    if (!model?.views || !currentViewId) {
      return {
        id: '',
        name: 'Default View',
        items: [],
        connectors: [],
        rectangles: [],
        textBoxes: []
      };
    }

    try {
      return getItemByIdOrThrow(model.views, currentViewId).value;
    } catch (error) {
      // console.warn(`View "${currentViewId}" not found, using fallback`);
      // Return first available view or empty view
      return (
        model.views[0] || {
          id: currentViewId,
          name: 'Default View',
          items: [],
          connectors: [],
          rectangles: [],
          textBoxes: []
        }
      );
    }
  }, [currentViewId, model?.views]);

  const items = useMemo(() => {
    return currentView.items ?? [];
  }, [currentView.items]);

  const colors = useMemo(() => {
    return model?.colors ?? [];
  }, [model?.colors]);

  const connectors = useMemo(() => {
    return (currentView.connectors ?? []).map((connector) => {
      const sceneConnector = scene?.connectors?.[connector.id];

      return {
        ...CONNECTOR_DEFAULTS,
        ...connector,
        ...sceneConnector
      };
    });
  }, [currentView.connectors, scene?.connectors]);

  const rectangles = useMemo(() => {
    return (currentView.rectangles ?? []).map((rectangle) => {
      return {
        ...RECTANGLE_DEFAULTS,
        ...rectangle
      };
    });
  }, [currentView.rectangles]);

  const textBoxes = useMemo(() => {
    return (currentView.textBoxes ?? []).map((textBox) => {
      const sceneTextBox = scene?.textBoxes?.[textBox.id];

      return {
        ...TEXTBOX_DEFAULTS,
        ...textBox,
        ...sceneTextBox
      };
    });
  }, [currentView.textBoxes, scene?.textBoxes]);

  const getState = useCallback(() => {
    return {
      model: {
        version: model?.version ?? '',
        title: model?.title ?? '',
        description: model?.description,
        colors: model?.colors ?? [],
        icons: model?.icons ?? [],
        items: model?.items ?? [],
        views: model?.views ?? []
      },
      scene: {
        connectors: scene?.connectors ?? {},
        textBoxes: scene?.textBoxes ?? {}
      }
    };
  }, [model, scene]);

  const setState = useCallback(
    (newState: State) => {
      if (model?.actions?.set && scene?.actions?.set) {
        model.actions.set(newState.model, true); // Skip history since we're managing it here
        scene.actions.set(newState.scene, true); // Skip history since we're managing it here
      }
    },
    [model?.actions, scene?.actions]
  );

  const saveToHistoryBeforeChange = useCallback(() => {
    // Prevent multiple saves during grouped operations
    if (transactionInProgress.current) {
      return;
    }

    model?.actions?.saveToHistory?.();
    scene?.actions?.saveToHistory?.();
  }, [model?.actions, scene?.actions]);

  const createModelItem = useCallback(
    (newModelItem: ModelItem) => {
      if (!model?.actions || !scene?.actions) return getState();

      if (!transactionInProgress.current) {
        saveToHistoryBeforeChange();
      }

      const newState = reducers.createModelItem(newModelItem, getState());
      setState(newState);
      return newState; // Return the new state for chaining
    },
    [
      getState,
      setState,
      saveToHistoryBeforeChange,
      model?.actions,
      scene?.actions
    ]
  );

  const updateModelItem = useCallback(
    (id: string, updates: Partial<ModelItem>) => {
      if (!model?.actions || !scene?.actions) return;

      saveToHistoryBeforeChange();
      const newState = reducers.updateModelItem(id, updates, getState());
      setState(newState);
    },
    [
      getState,
      setState,
      saveToHistoryBeforeChange,
      model?.actions,
      scene?.actions
    ]
  );

  const deleteModelItem = useCallback(
    (id: string) => {
      if (!model?.actions || !scene?.actions) return;

      saveToHistoryBeforeChange();
      const newState = reducers.deleteModelItem(id, getState());
      setState(newState);
    },
    [
      getState,
      setState,
      saveToHistoryBeforeChange,
      model?.actions,
      scene?.actions
    ]
  );

  const createViewItem = useCallback(
    (newViewItem: ViewItem, currentState?: State) => {
      if (!model?.actions || !scene?.actions || !currentViewId) return;

      if (!transactionInProgress.current) {
        saveToHistoryBeforeChange();
      }

      // Use provided state or get current state
      const stateToUse = currentState || getState();

      const newState = reducers.view({
        action: 'CREATE_VIEWITEM',
        payload: newViewItem,
        ctx: { viewId: currentViewId, state: stateToUse }
      });
      setState(newState);
      return newState;
    },
    [
      getState,
      setState,
      currentViewId,
      saveToHistoryBeforeChange,
      model?.actions,
      scene?.actions
    ]
  );

  const updateViewItem = useCallback(
    (id: string, updates: Partial<ViewItem>, currentState?: State) => {
      if (!model?.actions || !scene?.actions || !currentViewId) return getState();

      if (!transactionInProgress.current) {
        saveToHistoryBeforeChange();
      }

      const stateToUse = currentState || getState();
      const newState = reducers.view({
        action: 'UPDATE_VIEWITEM',
        payload: { id, ...updates },
        ctx: { viewId: currentViewId, state: stateToUse }
      });
      setState(newState);
      return newState; // Return for chaining
    },
    [
      getState,
      setState,
      currentViewId,
      saveToHistoryBeforeChange,
      model?.actions,
      scene?.actions
    ]
  );

  const deleteViewItem = useCallback(
    (id: string) => {
      if (!model?.actions || !scene?.actions || !currentViewId) return;

      saveToHistoryBeforeChange();
      const newState = reducers.view({
        action: 'DELETE_VIEWITEM',
        payload: id,
        ctx: { viewId: currentViewId, state: getState() }
      });
      setState(newState);
    },
    [
      getState,
      setState,
      currentViewId,
      saveToHistoryBeforeChange,
      model?.actions,
      scene?.actions
    ]
  );

  const createConnector = useCallback(
    (newConnector: Connector) => {
      if (!model?.actions || !scene?.actions || !currentViewId) return;

      saveToHistoryBeforeChange();
      const newState = reducers.view({
        action: 'CREATE_CONNECTOR',
        payload: newConnector,
        ctx: { viewId: currentViewId, state: getState() }
      });
      setState(newState);
    },
    [
      getState,
      setState,
      currentViewId,
      saveToHistoryBeforeChange,
      model?.actions,
      scene?.actions
    ]
  );

  // Pass `currentState` (and use the returned state) to chain several
  // updates in one tick without them overwriting each other
  const updateConnector = useCallback(
    (id: string, updates: Partial<Connector>, currentState?: State) => {
      if (!model?.actions || !scene?.actions || !currentViewId) return currentState;

      saveToHistoryBeforeChange();
      const newState = reducers.view({
        action: 'UPDATE_CONNECTOR',
        payload: { id, ...updates },
        ctx: { viewId: currentViewId, state: currentState || getState() }
      });
      setState(newState);
      return newState;
    },
    [
      getState,
      setState,
      currentViewId,
      saveToHistoryBeforeChange,
      model?.actions,
      scene?.actions
    ]
  );

  const deleteConnector = useCallback(
    (id: string) => {
      if (!model?.actions || !scene?.actions || !currentViewId) return;

      saveToHistoryBeforeChange();
      const newState = reducers.view({
        action: 'DELETE_CONNECTOR',
        payload: id,
        ctx: { viewId: currentViewId, state: getState() }
      });
      setState(newState);
    },
    [
      getState,
      setState,
      currentViewId,
      saveToHistoryBeforeChange,
      model?.actions,
      scene?.actions
    ]
  );

  const createTextBox = useCallback(
    (newTextBox: TextBox) => {
      if (!model?.actions || !scene?.actions || !currentViewId) return;

      saveToHistoryBeforeChange();
      const newState = reducers.view({
        action: 'CREATE_TEXTBOX',
        payload: newTextBox,
        ctx: { viewId: currentViewId, state: getState() }
      });
      setState(newState);
    },
    [
      getState,
      setState,
      currentViewId,
      saveToHistoryBeforeChange,
      model?.actions,
      scene?.actions
    ]
  );

  // Pass `currentState` (and use the returned state) to chain several
  // updates in one tick without them overwriting each other
  const updateTextBox = useCallback(
    (id: string, updates: Partial<TextBox>, currentState?: State) => {
      if (!model?.actions || !scene?.actions || !currentViewId) return currentState;

      saveToHistoryBeforeChange();
      const newState = reducers.view({
        action: 'UPDATE_TEXTBOX',
        payload: { id, ...updates },
        ctx: { viewId: currentViewId, state: currentState || getState() }
      });
      setState(newState);
      return newState;
    },
    [
      getState,
      setState,
      currentViewId,
      saveToHistoryBeforeChange,
      model?.actions,
      scene?.actions
    ]
  );

  const deleteTextBox = useCallback(
    (id: string) => {
      if (!model?.actions || !scene?.actions || !currentViewId) return;

      saveToHistoryBeforeChange();
      const newState = reducers.view({
        action: 'DELETE_TEXTBOX',
        payload: id,
        ctx: { viewId: currentViewId, state: getState() }
      });
      setState(newState);
    },
    [
      getState,
      setState,
      currentViewId,
      saveToHistoryBeforeChange,
      model?.actions,
      scene?.actions
    ]
  );

  const createRectangle = useCallback(
    (newRectangle: Rectangle) => {
      if (!model?.actions || !scene?.actions || !currentViewId) return;

      saveToHistoryBeforeChange();
      const newState = reducers.view({
        action: 'CREATE_RECTANGLE',
        payload: newRectangle,
        ctx: { viewId: currentViewId, state: getState() }
      });
      setState(newState);
    },
    [
      getState,
      setState,
      currentViewId,
      saveToHistoryBeforeChange,
      model?.actions,
      scene?.actions
    ]
  );

  // Pass `currentState` (and use the returned state) to chain several
  // updates in one tick without them overwriting each other
  const updateRectangle = useCallback(
    (id: string, updates: Partial<Rectangle>, currentState?: State) => {
      if (!model?.actions || !scene?.actions || !currentViewId) return currentState;

      saveToHistoryBeforeChange();
      const newState = reducers.view({
        action: 'UPDATE_RECTANGLE',
        payload: { id, ...updates },
        ctx: { viewId: currentViewId, state: currentState || getState() }
      });
      setState(newState);
      return newState;
    },
    [
      getState,
      setState,
      currentViewId,
      saveToHistoryBeforeChange,
      model?.actions,
      scene?.actions
    ]
  );

  const deleteRectangle = useCallback(
    (id: string) => {
      if (!model?.actions || !scene?.actions || !currentViewId) return;

      saveToHistoryBeforeChange();
      const newState = reducers.view({
        action: 'DELETE_RECTANGLE',
        payload: id,
        ctx: { viewId: currentViewId, state: getState() }
      });
      setState(newState);
    },
    [
      getState,
      setState,
      currentViewId,
      saveToHistoryBeforeChange,
      model?.actions,
      scene?.actions
    ]
  );

  const transaction = useCallback(
    (operations: () => void) => {
      if (!model?.actions || !scene?.actions) return;

      // Prevent nested transactions
      if (transactionInProgress.current) {
        operations();
        return;
      }

      // Save state before transaction
      saveToHistoryBeforeChange();

      // Mark transaction as in progress
      transactionInProgress.current = true;

      try {
        // Execute all operations without saving intermediate history
        operations();
      } finally {
        // Always reset transaction state
        transactionInProgress.current = false;
      }
    },
    [saveToHistoryBeforeChange, model?.actions, scene?.actions]
  );

  // Deletes several elements (nodes, rectangles, connectors, text boxes) as a
  // single undo step. The reducers are chained on one state object because
  // the individual delete* helpers each read the render-time state and would
  // overwrite each other when called in the same tick.
  const deleteItems = useCallback(
    (refs: ItemReference[]) => {
      if (!model?.actions || !scene?.actions || !currentViewId) return;
      if (refs.length === 0) return;

      const actionByType: Partial<Record<ItemReference['type'], string>> = {
        ITEM: 'DELETE_VIEWITEM',
        RECTANGLE: 'DELETE_RECTANGLE',
        CONNECTOR: 'DELETE_CONNECTOR',
        TEXTBOX: 'DELETE_TEXTBOX'
      };

      saveToHistoryBeforeChange();

      let state: State = getState();
      refs.forEach((ref) => {
        const action = actionByType[ref.type];
        if (!action) return;
        try {
          state = reducers.view({
            action,
            payload: ref.id,
            ctx: { viewId: currentViewId, state }
          } as Parameters<typeof reducers.view>[0]);
        } catch {
          // Already gone (e.g. a connector removed together with its node)
        }
      });
      setState(state);
    },
    [
      getState,
      setState,
      currentViewId,
      saveToHistoryBeforeChange,
      model?.actions,
      scene?.actions
    ]
  );

  // Pastes clipboard content with fresh ids, shifted by `offset` tiles, as a
  // single undo step. Nodes keep their relative layout but are nudged to the
  // nearest free tiles. Returns references to the new elements (to select them).
  const pasteItems = useCallback(
    (clip: ClipboardData, offset: Coords): ItemReference[] => {
      if (!model?.actions || !scene?.actions || !currentViewId) return [];

      const idMap = new Map<string, string>();
      const newId = (oldId: string) => {
        const id = generateId();
        idMap.set(oldId, id);
        return id;
      };
      const shift = (tile: Coords) => {
        return { x: tile.x + offset.x, y: tile.y + offset.y };
      };

      saveToHistoryBeforeChange();
      let state: State = getState();
      const created: ItemReference[] = [];

      // Nodes: find free tiles for the whole group at once
      const targets = clip.viewItems.map((viewItem) => {
        return { id: viewItem.id, targetTile: shift(viewItem.tile) };
      });
      const freeTiles =
        targets.length > 0
          ? findNearestUnoccupiedTilesForGroup(targets, { items, rectangles: [] } as any, [])
          : [];

      clip.viewItems.forEach((viewItem, index) => {
        const modelItem = clip.modelItems.find((m) => {
          return m.id === viewItem.id;
        });
        if (!modelItem) return;
        const id = newId(viewItem.id);
        state = reducers.createModelItem({ ...modelItem, id }, state);
        state = reducers.view({
          action: 'CREATE_VIEWITEM',
          payload: {
            ...viewItem,
            id,
            tile: freeTiles?.[index] ?? targets[index].targetTile
          },
          ctx: { viewId: currentViewId, state }
        });
        created.push({ type: 'ITEM', id });
      });

      clip.rectangles.forEach((rectangle) => {
        const id = newId(rectangle.id);
        state = reducers.view({
          action: 'CREATE_RECTANGLE',
          payload: {
            ...rectangle,
            id,
            from: shift(rectangle.from),
            to: shift(rectangle.to)
          },
          ctx: { viewId: currentViewId, state }
        });
        created.push({ type: 'RECTANGLE', id });
      });

      clip.textBoxes.forEach((textBox) => {
        const id = newId(textBox.id);
        state = reducers.view({
          action: 'CREATE_TEXTBOX',
          payload: { ...textBox, id, tile: shift(textBox.tile) },
          ctx: { viewId: currentViewId, state }
        });
        created.push({ type: 'TEXTBOX', id });
      });

      // Connectors: give every anchor a new id first, so anchor-to-anchor
      // references inside the copied set can be remapped too
      clip.connectors.forEach((connector) => {
        connector.anchors.forEach((anchor) => {
          return newId(anchor.id);
        });
      });
      clip.connectors.forEach((connector) => {
        const anchors = connector.anchors.map((anchor) => {
          const ref: typeof anchor.ref = {};
          if (anchor.ref.item) ref.item = idMap.get(anchor.ref.item);
          if (anchor.ref.anchor) ref.anchor = idMap.get(anchor.ref.anchor);
          if (anchor.ref.tile) ref.tile = shift(anchor.ref.tile);
          return { id: idMap.get(anchor.id) as string, ref };
        });
        // Skip a connector whose ends point outside what was copied
        const isComplete = anchors.every((anchor) => {
          return anchor.ref.item || anchor.ref.anchor || anchor.ref.tile;
        });
        if (!isComplete) return;

        try {
          state = reducers.view({
            action: 'CREATE_CONNECTOR',
            payload: { ...connector, id: generateId(), anchors },
            ctx: { viewId: currentViewId, state }
          });
        } catch {
          // A connector that can't be routed is simply left out
        }
      });

      setState(state);
      return created;
    },
    [
      getState,
      setState,
      items,
      currentViewId,
      saveToHistoryBeforeChange,
      model?.actions,
      scene?.actions
    ]
  );

  // Moves rectangles / text boxes / nodes to the top or bottom of their layer
  const reorderItems = useCallback(
    (refs: ItemReference[], where: 'front' | 'back') => {
      if (!model?.actions || !scene?.actions || !currentViewId) return;

      const listByType: Partial<
        Record<ItemReference['type'], 'rectangles' | 'textBoxes' | 'items'>
      > = {
        RECTANGLE: 'rectangles',
        TEXTBOX: 'textBoxes',
        ITEM: 'items'
      };

      saveToHistoryBeforeChange();
      const newState = produce(getState(), (draft) => {
        const view = draft.model.views.find((v) => {
          return v.id === currentViewId;
        });
        if (!view) return;

        (['rectangles', 'textBoxes', 'items'] as const).forEach((listName) => {
          const ids = refs
            .filter((ref) => {
              return listByType[ref.type] === listName;
            })
            .map((ref) => {
              return ref.id;
            });
          const list = view[listName] as { id: string }[] | undefined;
          if (!list || ids.length === 0) return;

          const moved = list.filter((el) => {
            return ids.includes(el.id);
          });
          const rest = list.filter((el) => {
            return !ids.includes(el.id);
          });
          (view as any)[listName] =
            where === 'front' ? [...rest, ...moved] : [...moved, ...rest];
        });
      });
      setState(newState);
    },
    [
      getState,
      setState,
      currentViewId,
      saveToHistoryBeforeChange,
      model?.actions,
      scene?.actions
    ]
  );

  const placeIcon = useCallback(
    (params: { modelItem: ModelItem; viewItem: ViewItem }) => {
      if (!model?.actions || !scene?.actions) return;

      // Save history before the transaction
      saveToHistoryBeforeChange();

      // Mark transaction as in progress
      transactionInProgress.current = true;

      try {
        // Create model item first and get the updated state
        const stateAfterModelItem = createModelItem(params.modelItem);

        // Create view item using the updated state
        if (stateAfterModelItem) {
          createViewItem(params.viewItem, stateAfterModelItem);
        }
      } finally {
        // Always reset transaction state
        transactionInProgress.current = false;
      }
    },
    [
      createModelItem,
      createViewItem,
      saveToHistoryBeforeChange,
      model?.actions,
      scene?.actions
    ]
  );

  return {
    items,
    connectors,
    colors,
    rectangles,
    textBoxes,
    currentView,
    createModelItem,
    updateModelItem,
    deleteModelItem,
    createViewItem,
    updateViewItem,
    deleteViewItem,
    createConnector,
    updateConnector,
    deleteConnector,
    createTextBox,
    updateTextBox,
    deleteTextBox,
    createRectangle,
    updateRectangle,
    deleteRectangle,
    transaction,
    placeIcon,
    deleteItems,
    pasteItems,
    reorderItems
  };
};
