// The ArchFlow MCP server: tools for AI assistants to read, build and change
// ArchFlow diagrams.
import { writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  SpecError,
  addConnector,
  addNodes,
  addText,
  addZone,
  buildDiagram,
  removeConnector,
  removeNode,
  removeZone,
  summarize,
  updateNode,
  type DiagramSpec
} from './builder.js';
import { categoryList, findIcons } from './catalog.js';
import { COLOR_NAMES, TEXT_SIZES, type Diagram } from './model.js';
import { StoreError, storeFromEnv, type DiagramStore } from './storage.js';
import { validateDiagram } from './validate.js';

// The package version (package.json sits next to dist/ in the published package)
export const VERSION: string = createRequire(import.meta.url)('../package.json').version;

const INSTRUCTIONS = `ArchFlow draws isometric (3D-looking) architecture and process diagrams.
A diagram has nodes (an icon with a name and optional description), zones (coloured areas under groups of nodes, with a title), connectors (arrows between nodes, optionally labelled) and free texts.

How to work:
- Find icon ids with list_icons (search in any language, e.g. "database", "baza"). Every node needs a valid icon id.
- Build a new diagram with ONE build_diagram call. Don't compute coordinates: put nodes into zones and the server lays them out. Zones are placed left to right in the order given (use them as layers or tiers: clients, entry, services, data...); zones with a higher "row" go in a line below. Nodes without a zone go in a row below the zones.
- For exact placement give a node a "position" in slots: {col, row}, col grows to the right, row grows downwards, 1 slot = the normal distance between two nodes.
- Change an existing diagram with the small tools (add_nodes, add_connectors, update_node, add_zone...). They take the diagram id or name; get_diagram shows ids and positions.
- Keep node names short (they're labels on the canvas, 1-3 words); put details in "description". Write names in the user's language.
- Every change is saved right away. Tell the user where the diagram is (the result says it). If the diagram is open in ArchFlow at the same time, they should reopen it from "My diagrams" to see the changes - and not save the old copy over them.`;

const slot = z
  .object({ col: z.number().describe('Slots to the right'), row: z.number().describe('Slots down') })
  .describe('Position in slots (1 slot = normal distance between nodes)');
const color = z.enum(COLOR_NAMES);
const diagramRef = z.string().describe('Diagram id or name (see list_diagrams)');

const nodeShape = {
  id: z.string().optional().describe('Your own short id to refer to the node (default: from the name)'),
  name: z.string().min(1).max(100).describe('Label on the canvas, short'),
  icon: z.string().describe('Icon id from list_icons'),
  description: z.string().max(900).optional().describe('Longer text shown when the node is clicked')
};

const connectorShape = {
  from: z.string().describe('Node id'),
  to: z.string().describe('Node id'),
  label: z.string().max(200).optional(),
  style: z.enum(['solid', 'dashed', 'dotted']).optional(),
  line: z.enum(['single', 'double', 'double_with_circle']).optional(),
  color: color.optional().describe('Default: the colour of the zone it starts in'),
  arrow: z.boolean().optional().describe('Arrow head at "to" (default true)')
};

const ok = (text: string, data?: unknown) => {
  return {
    content: [{ type: 'text' as const, text: data === undefined ? text : `${text}\n${JSON.stringify(data, null, 1)}` }]
  };
};
const fail = (text: string) => {
  return { content: [{ type: 'text' as const, text }], isError: true };
};

// Runs a tool body; known problems go back to the assistant as tool errors
const guard = <A>(fn: (args: A) => Promise<ReturnType<typeof ok>>) => {
  return async (args: A) => {
    try {
      return await fn(args);
    } catch (e) {
      if (e instanceof SpecError || e instanceof StoreError) return fail(e.message);
      throw e;
    }
  };
};

export const createServer = (store: DiagramStore = storeFromEnv()) => {
  const server = new McpServer({ name: 'archflow', version: VERSION }, { instructions: INSTRUCTIONS });

  const resolveId = async (ref: string) => {
    const list = await store.list();
    const hit =
      list.find((d) => {
        return d.id === ref;
      }) ??
      list.find((d) => {
        return d.name.toLowerCase() === ref.toLowerCase();
      });
    if (!hit) {
      const names = list
        .slice(0, 20)
        .map((d) => {
          return `"${d.id}"`;
        })
        .join(', ');
      throw new StoreError(`There is no diagram "${ref}" in the ${store.where}.${names ? ` Diagrams: ${names}` : ''}`);
    }
    return hit.id;
  };

  const check = (diagram: Diagram) => {
    const problems = validateDiagram(diagram);
    if (problems.length) throw new SpecError(`Not saved - the diagram has problems:\n- ${problems.join('\n- ')}`);
  };

  // Load, change, check, save
  const edit = async (ref: string, change: (d: Diagram) => string) => {
    const id = await resolveId(ref);
    const diagram = await store.load(id);
    const message = change(diagram);
    check(diagram);
    const savedId = await store.save(id, diagram);
    return ok(`${message}\nSaved: ${store.locate(savedId)}`);
  };

  server.registerTool(
    'list_icons',
    {
      title: 'List icons',
      description:
        'Icons available for nodes. Search by words in any language (matches ids and names), or filter by category. Without arguments: the categories and all icons.',
      inputSchema: {
        query: z.string().optional(),
        category: z.string().optional().describe('Category id, e.g. af-network'),
        lang: z.string().optional().describe('Language of the names: en, pl, de, fr, es, it, pt, cs, nl, uk')
      },
      annotations: { readOnlyHint: true }
    },
    guard(async ({ query, category, lang }) => {
      const icons = findIcons({ query, category, lang });
      if (!query && !category) {
        return ok('Categories and icons (id: name):', {
          categories: categoryList(lang),
          icons: Object.fromEntries(
            icons.map((i) => {
              return [i.id, i.name];
            })
          )
        });
      }
      if (icons.length === 0) return ok('No icons match. Try another word or list_icons without arguments.');
      return ok(`${icons.length} icon(s):`, icons);
    })
  );

  server.registerTool(
    'list_diagrams',
    {
      title: 'List diagrams',
      description: 'Diagrams in ArchFlow storage: id, name, last change.',
      inputSchema: {},
      annotations: { readOnlyHint: true }
    },
    guard(async () => {
      const list = await store.list();
      return ok(list.length ? `${list.length} diagram(s) in the ${store.where}:` : `No diagrams yet in the ${store.where}.`, list.length ? list : undefined);
    })
  );

  server.registerTool(
    'get_diagram',
    {
      title: 'Read a diagram',
      description: 'A diagram as nodes (with ids and slot positions), zones, connectors and texts.',
      inputSchema: { diagram: diagramRef },
      annotations: { readOnlyHint: true }
    },
    guard(async ({ diagram }) => {
      const id = await resolveId(diagram);
      return ok(`Diagram "${id}":`, summarize(await store.load(id)));
    })
  );

  server.registerTool(
    'build_diagram',
    {
      title: 'Build a diagram',
      description:
        'Creates a whole diagram in one go and saves it. Group nodes into zones (laid out left to right, a higher "row" goes below); nodes and zones are placed automatically unless a node has a position. Returns where the diagram was saved.',
      inputSchema: {
        title: z.string().min(1).max(100),
        description: z.string().max(1000).optional(),
        nodes: z
          .array(
            z.object({
              ...nodeShape,
              zone: z.string().optional().describe('Id of the zone the node belongs to'),
              position: slot.optional()
            })
          )
          .min(1),
        zones: z
          .array(
            z.object({
              id: z.string(),
              name: z.string().max(100).optional().describe('Title shown at the zone'),
              color: z.union([color, z.literal('none')]).optional().describe('"none" = group without a coloured area'),
              row: z.number().int().optional().describe('Line of zones, 0 = top'),
              shape: z.enum(['grid', 'line']).optional().describe('Nodes in a square grid (default) or in a row across the screen, e.g. for a process; a row is best with color "none"')
            })
          )
          .optional(),
        connectors: z.array(z.object(connectorShape)).optional(),
        texts: z
          .array(
            z.object({
              text: z.string().max(100),
              position: slot.optional(),
              near: z.string().optional().describe('Node id to put the text under'),
              size: z.enum(Object.keys(TEXT_SIZES) as [keyof typeof TEXT_SIZES]).optional()
            })
          )
          .optional(),
        layout: z
          .enum(['row', 'column', 'grid'])
          .optional()
          .describe('How to place nodes without zone or position (default: row, grid for many)'),
        replace: diagramRef.optional().describe('Overwrite this existing diagram instead of creating a new one')
      }
    },
    guard(async (args) => {
      const { replace, ...spec } = args;
      const diagram = buildDiagram(spec as DiagramSpec);
      check(diagram);
      const id = replace ? await store.save(await resolveId(replace), diagram) : await store.create(diagram);
      const view = diagram.views[0];
      return ok(
        `Diagram "${diagram.title}" saved with ${diagram.items.length} nodes, ${view.rectangles?.length ?? 0} zones, ${view.connectors?.length ?? 0} connectors.\n` +
          `Id: ${id}\nWhere: ${store.locate(id)}\nIn ArchFlow: open "My diagrams" and load "${id}".`
      );
    })
  );

  server.registerTool(
    'add_nodes',
    {
      title: 'Add nodes',
      description:
        'Adds nodes to a diagram. Place each one with "near" (next to a node), "zone" (inside a zone, which grows if needed) or "position"; otherwise it goes to the right of everything.',
      inputSchema: {
        diagram: diagramRef,
        nodes: z
          .array(
            z.object({
              ...nodeShape,
              zone: z.string().optional().describe('Zone id'),
              near: z.object({ node: z.string(), side: z.enum(['right', 'left', 'above', 'below']) }).optional(),
              position: slot.optional()
            })
          )
          .min(1)
      }
    },
    guard(async ({ diagram, nodes }) => {
      return edit(diagram, (d) => {
        return `Added: ${addNodes(d, nodes).join(', ')}`;
      });
    })
  );

  server.registerTool(
    'update_node',
    {
      title: 'Change a node',
      description: 'Changes the name, icon, description or position of a node. An empty description removes it.',
      inputSchema: {
        diagram: diagramRef,
        node: z.string().describe('Node id'),
        name: z.string().min(1).max(100).optional(),
        icon: z.string().optional(),
        description: z.string().max(900).optional(),
        position: slot.optional()
      }
    },
    guard(async ({ diagram, node, ...changes }) => {
      return edit(diagram, (d) => {
        updateNode(d, node, changes);
        return `Changed node "${node}".`;
      });
    })
  );

  server.registerTool(
    'remove_node',
    {
      title: 'Remove a node',
      description: 'Removes a node and the connectors attached to it.',
      inputSchema: { diagram: diagramRef, node: z.string().describe('Node id') },
      annotations: { destructiveHint: true }
    },
    guard(async ({ diagram, node }) => {
      return edit(diagram, (d) => {
        const n = removeNode(d, node);
        return `Removed node "${node}"${n ? ` and ${n} connector(s)` : ''}.`;
      });
    })
  );

  server.registerTool(
    'add_connectors',
    {
      title: 'Connect nodes',
      description: 'Adds arrows between nodes, optionally with a label and a line style.',
      inputSchema: { diagram: diagramRef, connectors: z.array(z.object(connectorShape)).min(1) }
    },
    guard(async ({ diagram, connectors }) => {
      return edit(diagram, (d) => {
        const ids = connectors.map((c) => {
          return addConnector(d, c);
        });
        return `Added connector(s): ${ids.join(', ')}`;
      });
    })
  );

  server.registerTool(
    'remove_connector',
    {
      title: 'Remove a connector',
      description: 'Removes a connector by its id, or the connector(s) going from one node to another.',
      inputSchema: {
        diagram: diagramRef,
        id: z.string().optional(),
        from: z.string().optional(),
        to: z.string().optional()
      },
      annotations: { destructiveHint: true }
    },
    guard(async ({ diagram, id, from, to }) => {
      if (!id && !(from && to)) throw new SpecError('Give "id", or "from" and "to"');
      return edit(diagram, (d) => {
        return `Removed ${removeConnector(d, { id, from, to })} connector(s).`;
      });
    })
  );

  server.registerTool(
    'add_zone',
    {
      title: 'Add a zone',
      description: 'Adds a coloured area under the given nodes (fitted around them), with an optional title.',
      inputSchema: {
        diagram: diagramRef,
        nodes: z.array(z.string()).min(1).describe('Node ids'),
        name: z.string().max(100).optional(),
        color: color.optional(),
        margin: z.number().int().min(0).max(3).optional().describe('Extra tiles around the nodes (default 0)')
      }
    },
    guard(async ({ diagram, ...spec }) => {
      return edit(diagram, (d) => {
        return `Added zone "${addZone(d, spec)}".`;
      });
    })
  );

  server.registerTool(
    'remove_zone',
    {
      title: 'Remove a zone',
      description: 'Removes a zone (the coloured area and its title). Its nodes stay.',
      inputSchema: { diagram: diagramRef, zone: z.string().describe('Zone id') },
      annotations: { destructiveHint: true }
    },
    guard(async ({ diagram, zone }) => {
      return edit(diagram, (d) => {
        removeZone(d, zone);
        return `Removed zone "${zone}".`;
      });
    })
  );

  server.registerTool(
    'add_text',
    {
      title: 'Add a text',
      description: 'Adds a text on the canvas, at a position or under a node.',
      inputSchema: {
        diagram: diagramRef,
        text: z.string().min(1).max(100),
        position: slot.optional(),
        near: z.string().optional().describe('Node id'),
        size: z.enum(Object.keys(TEXT_SIZES) as [keyof typeof TEXT_SIZES]).optional()
      }
    },
    guard(async ({ diagram, ...spec }) => {
      return edit(diagram, (d) => {
        return `Added text "${addText(d, spec).id}".`;
      });
    })
  );

  server.registerTool(
    'rename_diagram',
    {
      title: 'Rename a diagram',
      description: 'Changes the title of a diagram (its file or id follows the new name).',
      inputSchema: { diagram: diagramRef, title: z.string().min(1).max(100) }
    },
    guard(async ({ diagram, title }) => {
      return edit(diagram, (d) => {
        d.title = title;
        d.name = title;
        if (d.views[0]) d.views[0].name = title;
        return `Renamed to "${title}".`;
      });
    })
  );

  server.registerTool(
    'export_json',
    {
      title: 'Export to a file',
      description:
        'Writes a diagram to a JSON file, which can be opened in ArchFlow with ☰ → Open from file (JSON) or shared.',
      inputSchema: { diagram: diagramRef, path: z.string().describe('File path; ".json" is added if missing') }
    },
    guard(async ({ diagram, path }) => {
      const id = await resolveId(diagram);
      const data = await store.load(id);
      const file = resolve(path.endsWith('.json') ? path : `${path}.json`);
      await writeFile(file, JSON.stringify(data, null, 2));
      return ok(`Exported "${id}" to ${file}`);
    })
  );

  return server;
};
