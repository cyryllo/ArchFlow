import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { test } from 'node:test';
import { addNodes, addZone, buildDiagram, removeNode, summarize, SpecError } from '../dist/builder.js';
import { findIcons, suggestIcons } from '../dist/catalog.js';
import { inBounds } from '../dist/layout.js';
import { validateDiagram } from '../dist/validate.js';
import { shopSpec } from './sample-spec.mjs';

const FIXTURE = new URL('./fixtures/shop-diagram.json', import.meta.url);

test('icon search works in any language and suggests close ids', () => {
  assert.ok(findIcons({ query: 'database' }).some((i) => i.id === 'storage'));
  assert.ok(findIcons({ query: 'baza danych' }).some((i) => i.id === 'storage'));
  assert.ok(findIcons({ query: 'Datenbank' }).some((i) => i.id === 'storage'));
  assert.equal(findIcons({ query: 'loadbalancer', lang: 'pl' })[0].name, 'Load balancer');
  assert.ok(suggestIcons('databse').includes('storage'));
  assert.ok(suggestIcons('kubernetes').includes('cluster'));
});

test('the shop example builds into a valid diagram', () => {
  const d = buildDiagram(shopSpec);
  assert.deepEqual(validateDiagram(d), []);
  const view = d.views[0];
  assert.equal(d.items.length, 17);
  assert.equal(view.connectors.length, 15);
  // 4 coloured zones ("process" has none), 5 titles
  assert.equal(view.rectangles.length, 4);
  assert.equal(view.textBoxes.length, 5);
  // No two nodes on one tile
  const tiles = view.items.map((i) => `${i.tile.x},${i.tile.y}`);
  assert.equal(new Set(tiles).size, tiles.length);
  // Every zone covers exactly its own nodes
  for (const r of view.rectangles) {
    const inside = view.items.filter((i) => inBounds(i.tile, r)).map((i) => i.id);
    const members = shopSpec.nodes.filter((n) => n.zone === r.id).map((n) => n.id);
    assert.deepEqual(inside.sort(), members.sort(), `zone ${r.id}`);
  }
  // Zones go left to right, the process row is below them
  const pos = Object.fromEntries(summarize(d).nodes.map((n) => [n.id, n.position]));
  assert.ok(pos.customer.col < pos.lb.col && pos.lb.col < pos.orders.col && pos.orders.col < pos.db.col);
  assert.ok(pos.start.row > pos.browser.row && pos.start.row > pos.dwh.row);
  // Connectors take the colour of the zone they start in
  assert.equal(view.connectors.find((c) => c.id === 'orders-to-db').color, 'blue');
  assert.equal(view.connectors.find((c) => c.id === 'orders-to-queue').style, 'DASHED');
  // Descriptions are rich text, and read back as plain text
  assert.equal(d.items.find((i) => i.id === 'orders').description, '<p>Cart and orders.</p><p>Written in Go.</p>');
  assert.equal(summarize(d).nodes.find((n) => n.id === 'orders').description, 'Cart and orders.\n\nWritten in Go.');

  // The fixture that fossflow-lib's own schema test checks (UPDATE_FIXTURES=1 to refresh)
  const json = JSON.stringify(d, null, 2) + '\n';
  if (process.env.UPDATE_FIXTURES) writeFileSync(FIXTURE, json);
  assert.equal(json, readFileSync(FIXTURE, 'utf8'), 'fixture out of date: run with UPDATE_FIXTURES=1');
});

test('nodes without zones go in a row, or a grid when there are many', () => {
  const few = buildDiagram({ title: 'Few', nodes: ['a', 'b', 'c'].map((n) => ({ name: n, icon: 'server' })) });
  const rows = summarize(few).nodes.map((n) => n.position.row);
  assert.equal(new Set(rows).size, 1);
  const many = buildDiagram({ title: 'Many', nodes: Array.from({ length: 9 }, (_, i) => ({ name: `n${i}`, icon: 'server' })) });
  assert.equal(new Set(summarize(many).nodes.map((n) => n.position.row)).size, 3);
  assert.deepEqual(validateDiagram(many), []);
});

test('fixed positions are kept, collisions are moved aside', () => {
  const d = buildDiagram({
    title: 'Fixed',
    nodes: [
      { id: 'a', name: 'A', icon: 'server', position: { col: 0, row: 0 } },
      { id: 'b', name: 'B', icon: 'server', position: { col: 2, row: 1 } },
      { id: 'c', name: 'C', icon: 'server', position: { col: 0, row: 0 } }
    ]
  });
  const pos = Object.fromEntries(summarize(d).nodes.map((n) => [n.id, n.position]));
  assert.deepEqual(pos.a, { col: 0, row: 0 });
  assert.deepEqual(pos.b, { col: 2, row: 1 });
  assert.notDeepEqual(pos.c, pos.a);
});

test('mistakes in the description are reported clearly', () => {
  assert.throws(() => buildDiagram({ title: 'x', nodes: [] }), SpecError);
  assert.throws(
    () => buildDiagram({ title: 'x', nodes: [{ name: 'A', icon: 'server', zone: 'nope' }] }),
    /zone "nope"/
  );
  assert.throws(
    () =>
      buildDiagram({ title: 'x', nodes: [{ id: 'a', name: 'A', icon: 'server' }], connectors: [{ from: 'a', to: 'b' }] }),
    /no node "b"/
  );
  assert.throws(() => buildDiagram({ title: 'x', nodes: [{ name: 'A', icon: 'server', zone: 'z' }], zones: [{ id: 'z', color: 'purple' }] }), /Unknown colour/);
  const bad = buildDiagram({ title: 'x', nodes: [{ name: 'DB', icon: 'databse' }] });
  assert.match(validateDiagram(bad).join(), /no icon "databse".*storage/);
});

test('editing: add next to a node, add into a zone, remove with connectors', () => {
  const d = buildDiagram(shopSpec);
  const [id] = addNodes(d, [{ name: 'Search', icon: 'search-index', zone: 'data' }]);
  const zone = d.views[0].rectangles.find((r) => r.id === 'data');
  assert.ok(inBounds(d.views[0].items.find((i) => i.id === id).tile, zone));
  const [right] = addNodes(d, [{ name: 'CDN', icon: 'cdn', near: { node: 'lb', side: 'above' } }]);
  const pos = Object.fromEntries(summarize(d).nodes.map((n) => [n.id, n.position]));
  assert.ok(pos[right].row < pos.lb.row);
  assert.equal(removeNode(d, 'orders'), 5);
  assert.deepEqual(validateDiagram(d), []);
  const z = addZone(d, { name: 'Edge', color: 'teal', nodes: ['lb', right] });
  assert.ok(summarize(d).zones.find((x) => x.id === z).nodes.includes('lb'));
});
