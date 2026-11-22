// Placement on ArchFlow's isometric grid.
//
// The app stores positions as tiles (x, y). On screen a tile step x+1 goes
// right-up and y+1 goes left-up. Here we work in screen terms:
//   c  - to the right, in tile widths      c  = (x - y) / 2
//   up - upwards, in tile heights (= c/2)  up = (x + y) / 2
// The assistant uses "slots" ({col, row}): one slot is a comfortable distance
// between two nodes with their labels, row grows downwards.
import type { Coords } from './model.js';

export const SLOT_C = 3;
export const SLOT_UP = 3;
// Gaps between zone blocks (in c) and between rows of zones (in up)
const BLOCK_GAP_C = 2;
const ROW_GAP_UP = 3;

export interface Screen {
  c: number;
  up: number;
}

export const toTile = (c: number, up: number): Coords => {
  return { x: Math.round(c + up), y: Math.round(up - c) };
};

export const toScreen = (t: Coords): Screen => {
  return { c: (t.x - t.y) / 2, up: (t.x + t.y) / 2 };
};

export const slotToTile = (slot: { col: number; row: number }): Coords => {
  return toTile(slot.col * SLOT_C, -slot.row * SLOT_UP);
};

export const tileToSlot = (t: Coords) => {
  const s = toScreen(t);
  const round = (n: number) => {
    return Math.round(n * 10) / 10 + 0;
  };
  return { col: round(s.c / SLOT_C), row: round(-s.up / SLOT_UP) };
};

const key = (t: Coords) => {
  return `${t.x},${t.y}`;
};

// Tiles in use; finds the nearest free tile when a wanted one is taken
export class Occupancy {
  private used = new Set<string>();

  constructor(tiles: Coords[] = []) {
    tiles.forEach((t) => {
      return this.take(t);
    });
  }

  has(t: Coords) {
    return this.used.has(key(t));
  }

  take(t: Coords) {
    this.used.add(key(t));
    return t;
  }

  // Same tile if free, otherwise the closest free one (rings of step 2, so
  // nodes keep a tile of space between them)
  nearestFree(t: Coords): Coords {
    if (!this.has(t)) return t;
    for (let r = 2; r < 200; r += 2) {
      for (let dx = -r; dx <= r; dx += 2) {
        for (let dy = -r; dy <= r; dy += 2) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const c = { x: t.x + dx, y: t.y + dy };
          if (!this.has(c)) return c;
        }
      }
    }
    throw new Error('No free tile found');
  }
}

export interface Bounds {
  from: Coords;
  to: Coords;
}

// Tile-space bounding box (what a zone rectangle covers), at least `min`
// tiles on each side, grown evenly around the content
export const tileBounds = (tiles: Coords[], margin = 0, min = 3): Bounds => {
  const xs = tiles.map((t) => {
    return t.x;
  });
  const ys = tiles.map((t) => {
    return t.y;
  });
  let x0 = Math.min(...xs) - margin;
  let x1 = Math.max(...xs) + margin;
  let y0 = Math.min(...ys) - margin;
  let y1 = Math.max(...ys) + margin;
  while (x1 - x0 + 1 < min) {
    x0 -= (x1 - x0) % 2 === 0 ? 1 : 0;
    x1 += 1;
  }
  while (y1 - y0 + 1 < min) {
    y0 -= (y1 - y0) % 2 === 0 ? 1 : 0;
    y1 += 1;
  }
  return { from: { x: x0, y: y0 }, to: { x: x1, y: y1 } };
};

export const inBounds = (t: Coords, b: Bounds) => {
  const [x0, x1] = [Math.min(b.from.x, b.to.x), Math.max(b.from.x, b.to.x)];
  const [y0, y1] = [Math.min(b.from.y, b.to.y), Math.max(b.from.y, b.to.y)];
  return t.x >= x0 && t.x <= x1 && t.y >= y0 && t.y <= y1;
};

// Screen extent of a tile box: left/right in c, bottom/top in up
export const screenExtent = (b: Bounds) => {
  const corners = [b.from, b.to, { x: b.from.x, y: b.to.y }, { x: b.to.x, y: b.from.y }].map(toScreen);
  const cs = corners.map((s) => {
    return s.c;
  });
  const ups = corners.map((s) => {
    return s.up;
  });
  return {
    left: Math.min(...cs) - 0.5,
    right: Math.max(...cs) + 0.5,
    bottom: Math.min(...ups) - 0.5,
    top: Math.max(...ups) + 0.5
  };
};

// Tiles for `count` nodes inside a zone block: a grid with a free tile
// between neighbours (as in the app's own examples), or a row across the
// screen (a process lane)
export const blockTiles = (count: number, shape: 'grid' | 'line'): Coords[] => {
  if (shape === 'line') {
    return Array.from({ length: count }, (_, i) => {
      return toTile(i * SLOT_C, 0);
    });
  }
  const cols = Math.ceil(Math.sqrt(count));
  return Array.from({ length: count }, (_, i) => {
    // Reading order: along the row towards the right of the screen first
    return { x: 2 * (i % cols), y: -2 * Math.floor(i / cols) };
  });
};

// Moves a set of tiles so their box starts at screen `left` and is
// vertically centred on `up`
export const placeBlock = (tiles: Coords[], left: number, up: number): Coords[] => {
  const b = tileBounds(tiles, 0, 1);
  const ext = screenExtent(b);
  const dc = left - ext.left;
  const dup = up - (ext.top + ext.bottom) / 2;
  // A shift by (dc, dup) in screen space = (dc + dup, dup - dc) in tiles.
  // Tiles are whole numbers, so dx + dy (= 2 dup) and dx - dy (= 2 dc) must
  // be both even or both odd: keep the vertical shift exact (blocks in one
  // row line up) and give the horizontal one up to half a tile
  const up2 = Math.round(dup * 2);
  let c2 = Math.round(dc * 2);
  if ((up2 - c2) % 2 !== 0) c2 += 1;
  const dx = (up2 + c2) / 2;
  const dy = (up2 - c2) / 2;
  return tiles.map((t) => {
    return { x: t.x + dx, y: t.y + dy };
  });
};

export { BLOCK_GAP_C, ROW_GAP_UP };
