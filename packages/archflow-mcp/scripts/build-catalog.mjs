// Writes src/catalog.json: the ArchFlow icon set (ids, categories, names in
// every UI language) without the drawings, for the MCP server.
// Source of truth: the app's generated icon module and its translations.
// Run inside the monorepo; the published package ships the generated file.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ICONS = resolve(HERE, '../../fossflow-app/src/icons');
const OUT = resolve(HERE, '../src/catalog.json');

if (!existsSync(resolve(ICONS, 'archflowIcons.ts'))) {
  // Outside the monorepo (e.g. installed from npm): keep the shipped catalog
  console.log('build-catalog: app icon set not found, keeping src/catalog.json');
  process.exit(0);
}

const iconsTs = readFileSync(resolve(ICONS, 'archflowIcons.ts'), 'utf8');
const namesTs = readFileSync(resolve(ICONS, 'iconNames.ts'), 'utf8');

const categories = JSON.parse(
  iconsTs.match(/export const ARCHFLOW_ICON_CATEGORIES = (\[[\s\S]*?\]);/)[1]
);
const icons = [...iconsTs.matchAll(/\{ id: "([^"]+)", collection: "([^"]+)", names: (\{[^}]*\})/g)].map(
  ([, id, category, names]) => {
    return { id, category, names: JSON.parse(names) };
  }
);
const translations = JSON.parse(namesTs.slice(namesTs.indexOf('= ') + 2).replace(/;\s*$/, ''));

for (const [code, t] of Object.entries(translations)) {
  const lang = code.split('-')[0];
  for (const c of categories) c[lang] = t.categories[c.id];
  for (const icon of icons) icon.names[lang] = t.icons[icon.id];
}

const catalog = {
  languages: ['en', 'pl', ...Object.keys(translations).map((c) => {
    return c.split('-')[0];
  })],
  categories: categories.map(({ color, ...c }) => {
    return c;
  }),
  icons
};
writeFileSync(OUT, JSON.stringify(catalog, null, 1) + '\n');
console.log(`build-catalog: ${icons.length} icons, ${categories.length} categories -> src/catalog.json`);
