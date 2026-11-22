// The diagram the MCP server (packages/archflow-mcp) builds for its sample
// request must pass the editor's own model check - the same one used when a
// diagram is opened.
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { modelSchema } from '../model';

const MCP = join(__dirname, '../../../../archflow-mcp');
const FIXTURE = join(MCP, 'test/fixtures/shop-diagram.json');
const CATALOG = join(MCP, 'src/catalog.json');

describe('diagram built by archflow-mcp', () => {
  const run = existsSync(FIXTURE) ? it : it.skip;
  run('passes the model schema and reference checks', () => {
    const diagram = JSON.parse(readFileSync(FIXTURE, 'utf8'));
    // Saved files carry no built-in icons; the app adds them when it opens one
    const { icons } = JSON.parse(readFileSync(CATALOG, 'utf8'));
    diagram.icons = icons.map((i: { id: string; names: { en: string } }) => {
      return { id: i.id, name: i.names.en, url: 'data:,', isIsometric: true };
    });
    const result = modelSchema.safeParse(diagram);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.issues, null, 2));
    }
    expect(diagram.items.length).toBeGreaterThan(10);
  });
});
