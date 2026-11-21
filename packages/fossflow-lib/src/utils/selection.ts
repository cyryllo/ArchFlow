import { Coords, ItemReference } from 'src/types';
import { PROJECTED_TILE_SIZE } from 'src/config';
import { getTilePosition } from './renderer';

interface SceneLike {
  items: { id: string; tile: Coords }[];
  rectangles: { id: string; from: Coords; to: Coords }[];
  textBoxes: { id: string; tile: Coords }[];
  connectors?: {
    id: string;
    anchors: { ref: { item?: string; anchor?: string; tile?: Coords } }[];
  }[];
}

// Tile bounds around a set of elements - the box a multi-selection draws
export const getItemsBounds = (
  refs: ItemReference[],
  scene: SceneLike
): { startTile: Coords; endTile: Coords } | null => {
  const tiles: Coords[] = [];
  refs.forEach((ref) => {
    if (ref.type === 'ITEM') {
      const item = scene.items.find((i) => {
        return i.id === ref.id;
      });
      if (item) tiles.push(item.tile);
    } else if (ref.type === 'RECTANGLE') {
      const rect = scene.rectangles.find((r) => {
        return r.id === ref.id;
      });
      if (rect) tiles.push(rect.from, rect.to);
    } else if (ref.type === 'TEXTBOX') {
      const textBox = scene.textBoxes.find((t) => {
        return t.id === ref.id;
      });
      if (textBox) tiles.push(textBox.tile);
    }
  });
  if (tiles.length === 0) return null;
  const xs = tiles.map((t) => {
    return t.x;
  });
  const ys = tiles.map((t) => {
    return t.y;
  });
  return {
    startTile: { x: Math.min(...xs), y: Math.min(...ys) },
    endTile: { x: Math.max(...xs), y: Math.max(...ys) }
  };
};

type ConnectorLike = NonNullable<SceneLike['connectors']>[number];

const sameTile = (a: Coords, b: Coords) => {
  return a.x === b.x && a.y === b.y;
};

/**
 * Whether a connector goes along with a selection: every node it's attached
 * to is selected and every hand-placed point is inside. A free end (first or
 * last point) that touches another connector's point is a join between two
 * connectors, so it never counts as inside - moving it would tear the two
 * apart.
 */
export const connectorFollowsSelection = (
  connector: ConnectorLike,
  isNodeCaught: (id: string) => boolean,
  isTileCaught: (tile: Coords) => boolean,
  allConnectors: ConnectorLike[]
) => {
  const { anchors } = connector;
  if (anchors.length === 0) return false;
  return anchors.every((anchor, index) => {
    const isEnd = index === 0 || index === anchors.length - 1;
    const { item, tile, anchor: joinedTo } = anchor.ref;
    if (item) return isNodeCaught(item);
    if (joinedTo) return !isEnd;
    if (tile) {
      if (!isTileCaught(tile)) return false;
      if (!isEnd) return true;
      const joinsAnother = allConnectors.some((other) => {
        return (
          other.id !== connector.id &&
          other.anchors.some((a) => {
            return a.ref.tile && sameTile(a.ref.tile, tile);
          })
        );
      });
      return !joinsAnother;
    }
    return true;
  });
};

export const isMultiSelectable = (ref: ItemReference | null | undefined) => {
  return (
    !!ref &&
    (ref.type === 'ITEM' || ref.type === 'RECTANGLE' || ref.type === 'TEXTBOX')
  );
};

// ---------------------------------------------------------------------------
// Screen-aligned selection box.
// "Scene" coordinates are the un-zoomed, un-scrolled pixel space the scene
// layers are drawn in (what getTilePosition returns). A box dragged on screen
// is a plain rectangle there, unlike a tile range, which is a diamond.

export interface SceneRect {
  from: Coords;
  to: Coords;
}

export const screenToScene = (
  mouse: Coords,
  zoom: number,
  scroll: { position: Coords },
  rendererSize: { width: number; height: number }
): Coords => {
  return {
    x: (mouse.x - rendererSize.width / 2 - scroll.position.x) / zoom,
    y: (mouse.y - rendererSize.height / 2 - scroll.position.y) / zoom
  };
};

export const normalizeRect = (rect: SceneRect): SceneRect => {
  return {
    from: { x: Math.min(rect.from.x, rect.to.x), y: Math.min(rect.from.y, rect.to.y) },
    to: { x: Math.max(rect.from.x, rect.to.x), y: Math.max(rect.from.y, rect.to.y) }
  };
};

export const isInRect = (point: Coords, rect: SceneRect) => {
  const r = normalizeRect(rect);
  return point.x >= r.from.x && point.x <= r.to.x && point.y >= r.from.y && point.y <= r.to.y;
};

const rectangleCorners = (from: Coords, to: Coords): Coords[] => {
  return [from, { x: to.x, y: from.y }, to, { x: from.x, y: to.y }];
};

// Elements inside a screen box: nodes and text boxes by their position,
// rectangles only when all four corners are inside
export const getItemsInSceneRect = (
  rect: SceneRect,
  scene: SceneLike
): ItemReference[] => {
  const items: ItemReference[] = [];
  scene.items.forEach((item) => {
    if (isInRect(getTilePosition({ tile: item.tile }), rect)) {
      items.push({ type: 'ITEM', id: item.id });
    }
  });
  scene.rectangles.forEach((r) => {
    const inside = rectangleCorners(r.from, r.to).every((corner) => {
      return isInRect(getTilePosition({ tile: corner }), rect);
    });
    if (inside) items.push({ type: 'RECTANGLE', id: r.id });
  });
  scene.textBoxes.forEach((t) => {
    if (isInRect(getTilePosition({ tile: t.tile }), rect)) {
      items.push({ type: 'TEXTBOX', id: t.id });
    }
  });
  // A connector is caught when all its hand-placed points are inside the box
  // and every node it's attached to is caught as well
  const caughtNodes = new Set(
    items
      .filter((i) => {
        return i.type === 'ITEM';
      })
      .map((i) => {
        return i.id;
      })
  );
  const connectors = scene.connectors ?? [];
  connectors.forEach((c) => {
    const inside = connectorFollowsSelection(
      c,
      (id) => {
        return caughtNodes.has(id);
      },
      (tile) => {
        return isInRect(getTilePosition({ tile }), rect);
      },
      connectors
    );
    if (inside) items.push({ type: 'CONNECTOR', id: c.id });
  });
  return items;
};

// The box drawn around a selection (and used to tell whether a click lands
// inside it): the dragged box itself, or a box around the selected elements
export const getSelectionSceneRect = (
  selection: { items: ItemReference[]; sceneRect?: SceneRect },
  scene: SceneLike
): SceneRect | null => {
  if (selection.sceneRect) return normalizeRect(selection.sceneRect);

  const halfW = PROJECTED_TILE_SIZE.width / 2;
  const halfH = PROJECTED_TILE_SIZE.height / 2;
  const points: Coords[] = [];
  const addTile = (tile: Coords, tall: boolean) => {
    const p = getTilePosition({ tile });
    points.push({ x: p.x - halfW, y: p.y - (tall ? halfH * 4 : halfH) });
    points.push({ x: p.x + halfW, y: p.y + halfH });
  };
  selection.items.forEach((ref) => {
    if (ref.type === 'ITEM') {
      const item = scene.items.find((i) => {
        return i.id === ref.id;
      });
      if (item) addTile(item.tile, true);
    } else if (ref.type === 'RECTANGLE') {
      const r = scene.rectangles.find((x) => {
        return x.id === ref.id;
      });
      if (r) {
        rectangleCorners(r.from, r.to).forEach((corner) => {
          addTile(corner, false);
        });
      }
    } else if (ref.type === 'TEXTBOX') {
      const t = scene.textBoxes.find((x) => {
        return x.id === ref.id;
      });
      if (t) addTile(t.tile, false);
    } else if (ref.type === 'CONNECTOR') {
      const c = (scene.connectors ?? []).find((x) => {
        return x.id === ref.id;
      });
      c?.anchors.forEach((a) => {
        if (a.ref.tile) addTile(a.ref.tile, false);
      });
    }
  });
  if (points.length === 0) return null;
  const xs = points.map((p) => {
    return p.x;
  });
  const ys = points.map((p) => {
    return p.y;
  });
  return {
    from: { x: Math.min(...xs), y: Math.min(...ys) },
    to: { x: Math.max(...xs), y: Math.max(...ys) }
  };
};
