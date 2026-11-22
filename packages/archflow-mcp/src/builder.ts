// Turns the assistant's description of a diagram (nodes, zones, connectors,
// texts) into the ArchFlow format, and edits existing diagrams.
import {
  BLOCK_GAP_C,
  Occupancy,
  ROW_GAP_UP,
  SLOT_C,
  SLOT_UP,
  blockTiles,
  inBounds,
  placeBlock,
  screenExtent,
  slotToTile,
  tileBounds,
  tileToSlot,
  toScreen,
  toTile
} from './layout.js';
import {
  PALETTE,
  TEXT_SIZES,
  type Connector,
  type ConnectorLineType,
  type ConnectorStyle,
  type Coords,
  type Diagram,
  type Rectangle,
  type TextBox,
  type View
} from './model.js';

export interface Slot {
  col: number;
  row: number;
}

export interface NodeSpec {
  id?: string;
  name: string;
  icon: string;
  description?: string;
  zone?: string;
  position?: Slot;
}

export interface ZoneSpec {
  id: string;
  name?: string;
  color?: string;
  row?: number;
  shape?: 'grid' | 'line';
}

export interface ConnectorSpec {
  id?: string;
  from: string;
  to: string;
  label?: string;
  style?: 'solid' | 'dashed' | 'dotted';
  line?: 'single' | 'double' | 'double_with_circle';
  color?: string;
  arrow?: boolean;
}

export interface TextSpec {
  text: string;
  position?: Slot;
  near?: string;
  size?: keyof typeof TEXT_SIZES;
}

export interface DiagramSpec {
  title: string;
  description?: string;
  nodes: NodeSpec[];
  zones?: ZoneSpec[];
  connectors?: ConnectorSpec[];
  texts?: TextSpec[];
  layout?: 'row' | 'column' | 'grid';
}

export class SpecError extends Error {}

const VIEW_ID = 'main';
const ZONE_TITLE_SIZE = TEXT_SIZES.small;

const slug = (s: string) => {
  return (
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/ł/g, 'l')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'item'
  );
};

// A new id based on `wanted` that isn't in `taken` (and is then reserved)
const uniqueId = (wanted: string, taken: Set<string>) => {
  let id = wanted;
  for (let n = 2; taken.has(id); n++) id = `${wanted}-${n}`;
  taken.add(id);
  return id;
};

const escapeHtml = (s: string) => {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

// Node descriptions are rich text in the app
export const toRichText = (text: string) => {
  return text
    .split(/\n\s*\n/)
    .map((p) => {
      return `<p>${escapeHtml(p.trim()).replace(/\n/g, '<br>')}</p>`;
    })
    .join('');
};

export const fromRichText = (html?: string) => {
  if (!html) return undefined;
  const text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();
  return text || undefined;
};

const STYLE: Record<string, ConnectorStyle> = { solid: 'SOLID', dashed: 'DASHED', dotted: 'DOTTED' };
const LINE: Record<string, ConnectorLineType> = {
  single: 'SINGLE',
  double: 'DOUBLE',
  double_with_circle: 'DOUBLE_WITH_CIRCLE'
};

const paletteColors = () => {
  return Object.entries(PALETTE).map(([id, value]) => {
    return { id, value };
  });
};

// Makes sure the diagram defines `color` (one of the palette names)
const ensureColor = (diagram: Diagram, color: string) => {
  if (!PALETTE[color]) {
    throw new SpecError(`Unknown colour "${color}". Use one of: ${Object.keys(PALETTE).join(', ')}`);
  }
  if (
    !diagram.colors.some((c) => {
      return c.id === color;
    })
  ) {
    diagram.colors.push({ id: color, value: PALETTE[color] });
  }
  return color;
};

export const mainView = (diagram: Diagram): View => {
  if (diagram.views.length === 0) {
    diagram.views.push({ id: VIEW_ID, name: diagram.title, items: [] });
  }
  const view = diagram.views[0];
  view.rectangles ??= [];
  view.connectors ??= [];
  view.textBoxes ??= [];
  return view;
};

const allIds = (diagram: Diagram) => {
  const view = mainView(diagram);
  return new Set<string>([
    ...diagram.items.map((i) => {
      return i.id;
    }),
    ...view.rectangles!.map((r) => {
      return r.id;
    }),
    ...view.connectors!.flatMap((c) => {
      return [
        c.id,
        ...c.anchors.map((a) => {
          return a.id;
        })
      ];
    }),
    ...view.textBoxes!.map((t) => {
      return t.id;
    })
  ]);
};

const tileOf = (diagram: Diagram, nodeId: string) => {
  return mainView(diagram).items.find((i) => {
    return i.id === nodeId;
  })?.tile;
};

const zoneTitle = (zoneId: string, name: string, b: { from: Coords; to: Coords }): TextBox => {
  // At the zone's left corner, along its upper-left edge (as in the app's examples)
  return {
    id: `${zoneId}-title`,
    tile: { x: Math.min(b.from.x, b.to.x) - 1, y: Math.max(b.from.y, b.to.y) + 2 },
    content: name,
    fontSize: ZONE_TITLE_SIZE
  };
};

const makeConnector = (
  diagram: Diagram,
  spec: ConnectorSpec,
  taken: Set<string>,
  defaultColor: string
): Connector => {
  const view = mainView(diagram);
  for (const end of [spec.from, spec.to]) {
    if (
      !view.items.some((i) => {
        return i.id === end;
      })
    ) {
      throw new SpecError(`Connector ${spec.from} -> ${spec.to}: there is no node "${end}"`);
    }
  }
  if (spec.from === spec.to) throw new SpecError(`Connector from "${spec.from}" to itself`);
  const id = uniqueId(spec.id ? slug(spec.id) : `${slug(spec.from)}-to-${slug(spec.to)}`, taken);
  const connector: Connector = {
    id,
    color: ensureColor(diagram, spec.color ?? defaultColor),
    anchors: [
      { id: uniqueId(`${id}-from`, taken), ref: { item: spec.from } },
      { id: uniqueId(`${id}-to`, taken), ref: { item: spec.to } }
    ]
  };
  if (spec.style && spec.style !== 'solid') connector.style = STYLE[spec.style];
  if (spec.line && spec.line !== 'single') connector.lineType = LINE[spec.line];
  if (spec.arrow === false) connector.showArrow = false;
  if (spec.label) {
    connector.labels = [{ id: uniqueId(`${id}-label`, taken), text: spec.label, position: 50 }];
  }
  return connector;
};

// ---------------------------------------------------------------------------
// A whole diagram from a description

export const buildDiagram = (spec: DiagramSpec): Diagram => {
  if (spec.nodes.length === 0) throw new SpecError('A diagram needs at least one node');
  const diagram: Diagram = {
    title: spec.title,
    // The app shows "name" in its title bar
    name: spec.title,
    ...(spec.description ? { description: spec.description } : {}),
    icons: [],
    colors: paletteColors(),
    items: [],
    views: [],
    fitToScreen: true
  };
  const view = mainView(diagram);
  const taken = new Set<string>();

  // Nodes, with their ids
  const zoneIds = new Set(
    (spec.zones ?? []).map((z) => {
      return z.id;
    })
  );
  const nodes = spec.nodes.map((n) => {
    if (n.zone && !zoneIds.has(n.zone)) {
      throw new SpecError(`Node "${n.name}" is in zone "${n.zone}", which is not in "zones"`);
    }
    const id = n.id ? n.id : slug(n.name);
    if (n.id && taken.has(n.id)) throw new SpecError(`Two nodes have the id "${n.id}"`);
    return { ...n, id: n.id ? (taken.add(n.id), n.id) : uniqueId(id, taken) };
  });
  zoneIds.forEach((z) => {
    if (taken.has(z)) throw new SpecError(`Zone id "${z}" is also a node id`);
    taken.add(z);
  });

  const tiles = new Map<string, Coords>();
  const occupancy = new Occupancy();

  // 1. Zones whose nodes have no fixed position: blocks left to right,
  //    one line of blocks per zone row
  const zones = spec.zones ?? [];
  const autoZones = zones.filter((z) => {
    const members = nodes.filter((n) => {
      return n.zone === z.id;
    });
    return (
      members.length > 0 &&
      members.every((n) => {
        return !n.position;
      })
    );
  });
  const rows = [
    ...new Set(
      autoZones.map((z) => {
        return z.row ?? 0;
      })
    )
  ].sort((a, b) => {
    return a - b;
  });
  let rowUp = 0;
  let previousHalf = 0;
  for (const [ri, row] of rows.entries()) {
    const inRow = autoZones.filter((z) => {
      return (z.row ?? 0) === row;
    });
    const blocks = inRow.map((z) => {
      const members = nodes.filter((n) => {
        return n.zone === z.id;
      });
      return { zone: z, members, tiles: blockTiles(members.length, z.shape ?? 'grid') };
    });
    // Half the height of the row's tallest block, measured on its nodes
    // (a zone fits its nodes; a row across the screen is only one tile high)
    const half = Math.max(
      ...blocks.map((b) => {
        const ups = b.tiles.map((t) => {
          return toScreen(t).up;
        });
        return (Math.max(...ups) - Math.min(...ups)) / 2 + 0.5;
      })
    );
    if (ri > 0) rowUp -= previousHalf + half + ROW_GAP_UP;
    previousHalf = half;
    let left = 0;
    for (const b of blocks) {
      const placed = placeBlock(b.tiles, left, rowUp);
      b.members.forEach((n, i) => {
        tiles.set(n.id, occupancy.take(placed[i]));
      });
      const bounds = tileBounds(placed);
      left = screenExtent(bounds).right + BLOCK_GAP_C;
    }
  }

  // 2. Nodes with a fixed position
  for (const n of nodes) {
    if (n.position) tiles.set(n.id, occupancy.take(occupancy.nearestFree(slotToTile(n.position))));
  }

  // 3. The rest: zone members next to their zone's positioned nodes, loose
  //    nodes in a row/column/grid (below the zones when there are any)
  for (const n of nodes) {
    if (tiles.has(n.id) || !n.zone) continue;
    const anchor = nodes.find((m) => {
      return m.zone === n.zone && tiles.has(m.id);
    });
    const start = anchor ? tiles.get(anchor.id)! : toTile(0, 0);
    tiles.set(n.id, occupancy.take(occupancy.nearestFree(start)));
  }
  const loose = nodes.filter((n) => {
    return !tiles.has(n.id);
  });
  if (loose.length > 0) {
    const used = [...tiles.values()];
    const layout = spec.layout ?? (loose.length <= 6 || used.length > 0 ? 'row' : 'grid');
    let startC = 0.5;
    let startUp = 0;
    if (used.length > 0) {
      const ext = screenExtent(tileBounds(used, 0, 1));
      startC = ext.left + 0.5;
      startUp = ext.bottom - ROW_GAP_UP - 1;
    }
    const cols = layout === 'row' ? loose.length : layout === 'column' ? 1 : Math.ceil(Math.sqrt(loose.length));
    loose.forEach((n, i) => {
      const c = startC + (i % cols) * SLOT_C;
      const up = startUp - Math.floor(i / cols) * SLOT_UP;
      tiles.set(n.id, occupancy.take(occupancy.nearestFree(toTile(c, up))));
    });
  }

  // Model items and their places
  for (const n of nodes) {
    diagram.items.push({
      id: n.id,
      name: n.name,
      icon: n.icon,
      ...(n.description ? { description: toRichText(n.description) } : {})
    });
    view.items.push({ id: n.id, tile: tiles.get(n.id)! });
  }

  // Zones fitted around their nodes, with a title
  const zoneColor = new Map<string, string | undefined>();
  zones.forEach((z, i) => {
    const members = nodes.filter((n) => {
      return n.zone === z.id;
    });
    if (members.length === 0) throw new SpecError(`Zone "${z.id}" has no nodes`);
    const color = z.color ?? Object.keys(PALETTE)[i % Object.keys(PALETTE).length];
    const bounds = tileBounds(
      members.map((n) => {
        return tiles.get(n.id)!;
      })
    );
    if (color !== 'none') {
      zoneColor.set(z.id, ensureColor(diagram, color));
      view.rectangles!.push({ id: z.id, color, ...bounds });
    }
    if (z.name) view.textBoxes!.push(zoneTitle(z.id, z.name, bounds));
  });

  // Connectors: coloured like the zone they start in
  for (const c of spec.connectors ?? []) {
    const fromZone = nodes.find((n) => {
      return n.id === c.from;
    })?.zone;
    view.connectors!.push(makeConnector(diagram, c, taken, zoneColor.get(fromZone ?? '') ?? 'blue'));
  }

  for (const t of spec.texts ?? []) addTextBox(diagram, t, taken);
  return diagram;
};

// ---------------------------------------------------------------------------
// Edits of an existing diagram

const addTextBox = (diagram: Diagram, spec: TextSpec, taken = allIds(diagram)) => {
  let tile: Coords;
  if (spec.near) {
    const t = tileOf(diagram, spec.near);
    if (!t) throw new SpecError(`There is no node "${spec.near}"`);
    const s = toScreen(t);
    tile = toTile(s.c - 1, s.up - 2);
  } else if (spec.position) {
    tile = slotToTile(spec.position);
  } else {
    throw new SpecError('A text needs "position" or "near"');
  }
  const text: TextBox = {
    id: uniqueId(`text-${slug(spec.text)}`, taken),
    tile,
    content: spec.text,
    fontSize: TEXT_SIZES[spec.size ?? 'medium']
  };
  mainView(diagram).textBoxes!.push(text);
  return text;
};

export const addText = (diagram: Diagram, spec: TextSpec) => {
  return addTextBox(diagram, spec);
};

export interface AddNodeSpec extends NodeSpec {
  near?: { node: string; side: 'right' | 'left' | 'above' | 'below' };
}

export const addNodes = (diagram: Diagram, specs: AddNodeSpec[]) => {
  const view = mainView(diagram);
  const taken = allIds(diagram);
  const occupancy = new Occupancy(
    view.items.map((i) => {
      return i.tile;
    })
  );
  const added: string[] = [];
  for (const n of specs) {
    if (n.id && taken.has(n.id)) throw new SpecError(`The id "${n.id}" is already used`);
    const id = n.id ? (taken.add(n.id), n.id) : uniqueId(slug(n.name), taken);
    let wanted: Coords;
    const zone = n.zone
      ? view.rectangles!.find((r) => {
          return r.id === n.zone;
        })
      : undefined;
    if (n.zone && !zone) throw new SpecError(`There is no zone "${n.zone}"`);
    if (n.position) {
      wanted = slotToTile(n.position);
    } else if (n.near) {
      const t = tileOf(diagram, n.near.node);
      if (!t) throw new SpecError(`There is no node "${n.near.node}"`);
      const s = toScreen(t);
      const d = { right: [SLOT_C, 0], left: [-SLOT_C, 0], above: [0, SLOT_UP], below: [0, -SLOT_UP] }[n.near.side];
      wanted = toTile(s.c + d[0], s.up + d[1]);
    } else if (zone) {
      // A free spot inside the zone (same spacing as its nodes), else next to it
      const b = { from: zone.from, to: zone.to };
      const x0 = Math.min(b.from.x, b.to.x);
      const y1 = Math.max(b.from.y, b.to.y);
      wanted = { x: x0, y: y1 };
      for (let y = y1; y >= Math.min(b.from.y, b.to.y); y -= 2) {
        const free = [...Array(Math.abs(b.to.x - b.from.x) + 1).keys()]
          .map((i) => {
            return { x: x0 + i, y };
          })
          .find((t) => {
            return (t.x - x0) % 2 === 0 && !occupancy.has(t);
          });
        if (free) {
          wanted = free;
          break;
        }
      }
    } else {
      // To the right of everything
      const tiles = view.items.map((i) => {
        return i.tile;
      });
      const ext = tiles.length ? screenExtent(tileBounds(tiles, 0, 1)) : { right: -SLOT_C, top: 0, bottom: 0 };
      wanted = toTile(ext.right + SLOT_C - 0.5, Math.round((ext.top + ext.bottom) / 2));
    }
    const tile = occupancy.take(occupancy.nearestFree(wanted));
    diagram.items.push({
      id,
      name: n.name,
      icon: n.icon,
      ...(n.description ? { description: toRichText(n.description) } : {})
    });
    view.items.push({ id, tile });
    if (zone && !inBounds(tile, zone)) growZone(diagram, zone, tile);
    added.push(id);
  }
  return added;
};

const growZone = (diagram: Diagram, zone: Rectangle, tile: Coords) => {
  const b = tileBounds([zone.from, zone.to, tile], 0, 1);
  zone.from = b.from;
  zone.to = b.to;
  const title = mainView(diagram).textBoxes!.find((t) => {
    return t.id === `${zone.id}-title`;
  });
  if (title) title.tile = zoneTitle(zone.id, title.content, b).tile;
};

export interface NodeChanges {
  name?: string;
  icon?: string;
  description?: string;
  position?: Slot;
}

export const updateNode = (diagram: Diagram, nodeId: string, changes: NodeChanges) => {
  const item = diagram.items.find((i) => {
    return i.id === nodeId;
  });
  const viewItem = mainView(diagram).items.find((i) => {
    return i.id === nodeId;
  });
  if (!item || !viewItem) throw new SpecError(`There is no node "${nodeId}"`);
  if (changes.name !== undefined) item.name = changes.name;
  if (changes.icon !== undefined) item.icon = changes.icon;
  if (changes.description !== undefined) {
    if (changes.description) item.description = toRichText(changes.description);
    else delete item.description;
  }
  if (changes.position) {
    const occupancy = new Occupancy(
      mainView(diagram)
        .items.filter((i) => {
          return i.id !== nodeId;
        })
        .map((i) => {
          return i.tile;
        })
    );
    viewItem.tile = occupancy.nearestFree(slotToTile(changes.position));
  }
};

export const removeNode = (diagram: Diagram, nodeId: string) => {
  const view = mainView(diagram);
  if (
    !diagram.items.some((i) => {
      return i.id === nodeId;
    })
  ) {
    throw new SpecError(`There is no node "${nodeId}"`);
  }
  diagram.items = diagram.items.filter((i) => {
    return i.id !== nodeId;
  });
  view.items = view.items.filter((i) => {
    return i.id !== nodeId;
  });
  const before = view.connectors!.length;
  view.connectors = view.connectors!.filter((c) => {
    return !c.anchors.some((a) => {
      return a.ref.item === nodeId;
    });
  });
  return before - view.connectors.length;
};

export const addConnector = (diagram: Diagram, spec: ConnectorSpec) => {
  const view = mainView(diagram);
  const zone = view.rectangles!.find((r) => {
    const t = tileOf(diagram, spec.from);
    return t && inBounds(t, r);
  });
  const connector = makeConnector(diagram, spec, allIds(diagram), zone?.color && PALETTE[zone.color] ? zone.color : 'blue');
  view.connectors!.push(connector);
  return connector.id;
};

export const removeConnector = (diagram: Diagram, ref: { id?: string; from?: string; to?: string }) => {
  const view = mainView(diagram);
  const matches = view.connectors!.filter((c) => {
    if (ref.id) return c.id === ref.id;
    const ends = c.anchors.map((a) => {
      return a.ref.item;
    });
    return ends[0] === ref.from && ends[ends.length - 1] === ref.to;
  });
  if (matches.length === 0) throw new SpecError('No such connector');
  view.connectors = view.connectors!.filter((c) => {
    return !matches.includes(c);
  });
  return matches.length;
};

export const addZone = (
  diagram: Diagram,
  spec: { id?: string; name?: string; color?: string; nodes: string[]; margin?: number }
) => {
  const view = mainView(diagram);
  const taken = allIds(diagram);
  const tiles = spec.nodes.map((n) => {
    const t = tileOf(diagram, n);
    if (!t) throw new SpecError(`There is no node "${n}"`);
    return t;
  });
  if (tiles.length === 0) throw new SpecError('A zone needs at least one node');
  const id = uniqueId(slug(spec.id ?? spec.name ?? 'zone'), taken);
  const color = ensureColor(diagram, spec.color ?? 'blue');
  const bounds = tileBounds(tiles, spec.margin ?? 0);
  view.rectangles!.push({ id, color, ...bounds });
  if (spec.name) view.textBoxes!.push(zoneTitle(id, spec.name, bounds));
  return id;
};

export const removeZone = (diagram: Diagram, zoneId: string) => {
  const view = mainView(diagram);
  const before = view.rectangles!.length;
  view.rectangles = view.rectangles!.filter((r) => {
    return r.id !== zoneId;
  });
  if (view.rectangles.length === before) throw new SpecError(`There is no zone "${zoneId}"`);
  view.textBoxes = view.textBoxes!.filter((t) => {
    return t.id !== `${zoneId}-title`;
  });
};

// ---------------------------------------------------------------------------
// A readable summary for the assistant

export const summarize = (diagram: Diagram) => {
  const view = mainView(diagram);
  const colorName = (id?: string) => {
    if (!id) return undefined;
    const value = diagram.colors.find((c) => {
      return c.id === id;
    })?.value;
    return (
      Object.entries(PALETTE).find(([, v]) => {
        return v === value;
      })?.[0] ?? id
    );
  };
  const nodes = diagram.items.map((item) => {
    const t = tileOf(diagram, item.id);
    return {
      id: item.id,
      name: item.name,
      icon: item.icon,
      ...(item.description ? { description: fromRichText(item.description) } : {}),
      ...(t ? { position: tileToSlot(t) } : { position: null })
    };
  });
  return {
    title: diagram.title,
    nodes,
    zones: view.rectangles!.map((r) => {
      const title = view.textBoxes!.find((t) => {
        return t.id === `${r.id}-title`;
      });
      return {
        id: r.id,
        ...(title ? { name: title.content } : {}),
        color: colorName(r.color) ?? (r.customColor ? r.customColor : undefined),
        nodes: view.items
          .filter((i) => {
            return inBounds(i.tile, r);
          })
          .map((i) => {
            return i.id;
          })
      };
    }),
    connectors: view.connectors!.map((c) => {
      const ends = c.anchors
        .map((a) => {
          return a.ref.item;
        })
        .filter(Boolean);
      return {
        id: c.id,
        from: ends[0] ?? null,
        to: ends.length > 1 ? ends[ends.length - 1] : null,
        ...(c.labels?.length
          ? {
              label: c.labels
                .map((l) => {
                  return l.text;
                })
                .join(' / ')
            }
          : c.description
            ? { label: c.description }
            : {}),
        style: (c.style ?? 'SOLID').toLowerCase(),
        color: colorName(c.color)
      };
    }),
    texts: view.textBoxes!.filter((t) => {
      return !t.id.endsWith('-title');
    }).map((t) => {
      return { id: t.id, text: t.content, position: tileToSlot(t.tile) };
    })
  };
};
