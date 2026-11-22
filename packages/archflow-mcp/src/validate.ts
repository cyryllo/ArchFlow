// Checks a diagram the way the app does before it opens one: the shape of
// the data (fossflow-lib/src/schemas) and the references between its parts.
import { z } from 'zod';
import { isKnownIcon, suggestIcons } from './catalog.js';
import type { Diagram } from './model.js';

const id = z.string();
const coords = z.object({ x: z.number(), y: z.number() });
const name = z.string().max(100);
const description = z.string().max(1000);

const diagramSchema = z.object({
  title: name,
  description: description.optional(),
  icons: z.array(
    z.object({
      id,
      name,
      url: z.string(),
      collection: name.optional(),
      isIsometric: z.boolean().optional(),
      scale: z.number().min(0.1).max(3).optional()
    })
  ),
  colors: z.array(z.object({ id, value: z.string().max(7) })),
  items: z.array(z.object({ id, name, description: description.optional(), icon: id.optional() })),
  views: z.array(
    z.object({
      id,
      name,
      description: description.optional(),
      items: z.array(z.object({ id, tile: coords, labelHeight: z.number().optional() })),
      rectangles: z
        .array(z.object({ id, color: id.optional(), customColor: z.string().optional(), from: coords, to: coords }))
        .optional(),
      connectors: z
        .array(
          z.object({
            id,
            description: description.optional(),
            labels: z
              .array(
                z.object({
                  id,
                  text: description,
                  position: z.number().min(0).max(100),
                  height: z.number().optional(),
                  line: z.enum(['1', '2']).optional(),
                  showLine: z.boolean().optional()
                })
              )
              .max(256)
              .optional(),
            color: id.optional(),
            customColor: z.string().optional(),
            width: z.number().optional(),
            style: z.enum(['SOLID', 'DOTTED', 'DASHED']).optional(),
            lineType: z.enum(['SINGLE', 'DOUBLE', 'DOUBLE_WITH_CIRCLE']).optional(),
            showArrow: z.boolean().optional(),
            anchors: z.array(
              z.object({ id, ref: z.object({ item: id, anchor: id, tile: coords }).partial() })
            )
          })
        )
        .optional(),
      textBoxes: z
        .array(
          z.object({
            id,
            tile: coords,
            content: name,
            fontSize: z.number().optional(),
            orientation: z.enum(['X', 'Y']).optional()
          })
        )
        .optional()
    })
  )
});

// Problems in plain words; an empty list means the app will open the diagram
export const validateDiagram = (diagram: Diagram): string[] => {
  const parsed = diagramSchema.safeParse(diagram);
  if (!parsed.success) {
    return parsed.error.issues.map((i) => {
      return `${i.path.join('.')}: ${i.message}`;
    });
  }

  const problems: string[] = [];
  const colorIds = new Set(
    diagram.colors.map((c) => {
      return c.id;
    })
  );
  const itemIds = new Set(
    diagram.items.map((i) => {
      return i.id;
    })
  );
  const ownIcons = new Set(
    diagram.icons.map((i) => {
      return i.id;
    })
  );

  for (const item of diagram.items) {
    if (item.icon && !isKnownIcon(item.icon) && !ownIcons.has(item.icon)) {
      const hint = suggestIcons(item.icon);
      problems.push(
        `Node "${item.name}": there is no icon "${item.icon}"` +
          (hint.length ? `. Did you mean: ${hint.join(', ')}?` : '. Use list_icons to find one.')
      );
    }
  }

  const seen = new Set<string>();
  const unique = (kind: string, value: string) => {
    if (seen.has(value)) problems.push(`Duplicate id "${value}" (${kind})`);
    seen.add(value);
  };

  for (const view of diagram.views) {
    const viewItems = new Set<string>();
    for (const vi of view.items) {
      unique('node', vi.id);
      viewItems.add(vi.id);
      if (!itemIds.has(vi.id)) problems.push(`View "${view.name}" places "${vi.id}", which is not a node`);
    }
    for (const r of view.rectangles ?? []) {
      unique('zone', r.id);
      if (r.color && !colorIds.has(r.color)) problems.push(`Zone "${r.id}" uses an unknown colour "${r.color}"`);
    }
    for (const t of view.textBoxes ?? []) unique('text', t.id);
    for (const c of view.connectors ?? []) {
      unique('connector', c.id);
      if (c.color && !colorIds.has(c.color)) problems.push(`Connector "${c.id}" uses an unknown colour "${c.color}"`);
      if (c.anchors.length < 2) problems.push(`Connector "${c.id}" needs at least two ends`);
      for (const a of c.anchors) {
        if (a.ref.item && !viewItems.has(a.ref.item)) {
          problems.push(`Connector "${c.id}" points to "${a.ref.item}", which is not a node on the canvas`);
        }
      }
    }
  }
  return problems;
};
