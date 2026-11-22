// The tools as an MCP client sees them, saving to a folder and to the real
// ArchFlow backend.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { setTimeout as sleep } from 'node:timers/promises';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from '../dist/server.js';
import { FolderStore, HttpStore } from '../dist/storage.js';
import { shopSpec } from './sample-spec.mjs';

const connect = async (store) => {
  const [a, b] = InMemoryTransport.createLinkedPair();
  await createServer(store).connect(a);
  const client = new Client({ name: 'test', version: '1.0.0' });
  await client.connect(b);
  const call = async (name, args = {}) => {
    const r = await client.callTool({ name, arguments: args });
    return { error: !!r.isError, text: r.content.map((c) => c.text).join('\n') };
  };
  return { client, call };
};

describe('tools with a folder', () => {
  const dir = mkdtempSync(join(tmpdir(), 'archflow-mcp-'));
  let call;
  let client;
  before(async () => {
    ({ call, client } = await connect(new FolderStore(dir)));
  });

  test('lists the tools with instructions', async () => {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name);
    for (const n of ['list_icons', 'build_diagram', 'get_diagram', 'add_nodes', 'add_connectors', 'export_json']) {
      assert.ok(names.includes(n), n);
    }
    assert.match(client.getInstructions(), /isometric/);
  });

  test('list_icons', async () => {
    const all = await call('list_icons');
    assert.match(all.text, /"storage": "Database"/);
    assert.match(all.text, /af-network/);
    const pl = await call('list_icons', { query: 'baza', lang: 'pl' });
    assert.match(pl.text, /Baza danych/);
  });

  test('build, read, change and export a diagram', async () => {
    const built = await call('build_diagram', shopSpec);
    assert.equal(built.error, false, built.text);
    assert.match(built.text, /Id: Online shop/);
    assert.ok(existsSync(join(dir, 'Online shop.json')));
    assert.equal(JSON.parse(readFileSync(join(dir, 'Online shop.json'), 'utf8')).name, 'Online shop');

    const listed = await call('list_diagrams');
    assert.match(listed.text, /Online shop/);

    const read = JSON.parse((await call('get_diagram', { diagram: 'online shop' })).text.split('\n').slice(1).join('\n'));
    assert.equal(read.nodes.length, 17);
    assert.equal(read.zones.find((z) => z.id === 'data').name, 'Data');

    assert.equal((await call('add_nodes', { diagram: 'Online shop', nodes: [{ id: 'search', name: 'Search', icon: 'search-index', near: { node: 'db', side: 'below' } }] })).error, false);
    assert.equal((await call('add_connectors', { diagram: 'Online shop', connectors: [{ from: 'orders', to: 'search', label: 'index' }] })).error, false);
    assert.equal((await call('update_node', { diagram: 'Online shop', node: 'db', name: 'Orders (PostgreSQL)' })).error, false);
    assert.equal((await call('add_zone', { diagram: 'Online shop', nodes: ['search'], name: 'Search', color: 'teal' })).error, false);
    assert.equal((await call('add_text', { diagram: 'Online shop', text: 'v2', near: 'search' })).error, false);
    assert.equal((await call('remove_connector', { diagram: 'Online shop', from: 'db', to: 'dwh' })).error, false);
    assert.equal((await call('remove_node', { diagram: 'Online shop', node: 'cache' })).error, false);

    const after = JSON.parse(readFileSync(join(dir, 'Online shop.json'), 'utf8'));
    assert.ok(after.items.some((i) => i.name === 'Orders (PostgreSQL)'));
    assert.ok(!after.items.some((i) => i.id === 'cache'));
    assert.ok(after.views[0].connectors.some((c) => c.labels?.[0]?.text === 'index'));

    const renamed = await call('rename_diagram', { diagram: 'Online shop', title: 'Shop v2' });
    assert.equal(renamed.error, false);
    assert.deepEqual(readdirSync(dir).sort(), ['Shop v2.json']);
    assert.equal(JSON.parse(readFileSync(join(dir, 'Shop v2.json'), 'utf8')).name, 'Shop v2');

    const out = join(dir, 'export');
    assert.equal((await call('export_json', { diagram: 'Shop v2', path: out })).error, false);
    assert.equal(JSON.parse(readFileSync(`${out}.json`, 'utf8')).title, 'Shop v2');
  });

  test('a second diagram with the same name gets " (2)"; replace overwrites', async () => {
    const spec = { title: 'Twice', nodes: [{ name: 'A', icon: 'server' }] };
    await call('build_diagram', spec);
    assert.match((await call('build_diagram', spec)).text, /Id: Twice \(2\)/);
    assert.match((await call('build_diagram', { ...spec, replace: 'Twice' })).text, /Id: Twice\n/);
  });

  test('unknown icons are replaced with the closest one, and the assistant is told', async () => {
    const r = await call('build_diagram', {
      title: 'Guessed icons',
      nodes: [{ name: 'DB', icon: 'databse' }, { name: 'Pi', icon: 'raspberry-pi' }, { name: 'Nextcloud', icon: 'nextcloud' }]
    });
    assert.equal(r.error, false, r.text);
    assert.match(r.text, /no icon "databse", used "storage"/);
    assert.match(r.text, /no icon "nextcloud", used "(server|vm|container|cloud)/);
    const saved = JSON.parse(readFileSync(join(dir, 'Guessed icons.json'), 'utf8'));
    assert.deepEqual(saved.items.map((i) => i.icon)[0], 'storage');
    // Several words: icons matching any of them; none at all -> generic icons
    assert.match((await call('list_icons', { query: 'load balancer' })).text, /"id": "loadbalancer"/);
    assert.match((await call('list_icons', { query: 'raspberry pi' })).text, /Closest: server/);
    const none = await call('list_icons', { query: 'zzzz' });
    assert.match(none.text, /not product logos.*Closest/);
  });

  test('errors come back as tool errors with a hint, and nothing is saved', async () => {
    const bad = await call('build_diagram', { title: 'Broken', nodes: [{ id: 'a', name: 'A', icon: 'server' }], connectors: [{ from: 'a', to: 'nope' }] });
    assert.equal(bad.error, true);
    assert.match(bad.text, /no node "nope"/);
    assert.ok(!existsSync(join(dir, 'Broken.json')));
    const missing = await call('get_diagram', { diagram: 'nope' });
    assert.equal(missing.error, true);
    assert.match(missing.text, /no diagram "nope"/);
    const noNode = await call('update_node', { diagram: 'Twice', node: 'zzz', name: 'x' });
    assert.match(noNode.text, /no node "zzz"/);
  });
});

// The real backend from the Docker image, if this runs inside the monorepo
const BACKEND = new URL('../../fossflow-backend/server.js', import.meta.url).pathname;
describe('tools with the ArchFlow backend', { skip: !existsSync(BACKEND) && 'backend not found' }, () => {
  const port = 39000 + Math.floor(Math.random() * 1000);
  const dir = mkdtempSync(join(tmpdir(), 'archflow-backend-'));
  let backend;
  let call;
  before(async () => {
    backend = spawn(process.execPath, [BACKEND], {
      env: { ...process.env, ENABLE_SERVER_STORAGE: 'true', STORAGE_PATH: dir, BACKEND_PORT: String(port) },
      stdio: 'ignore'
    });
    for (let i = 0; i < 50; i++) {
      try {
        if ((await fetch(`http://127.0.0.1:${port}/api/storage/status`)).ok) break;
      } catch {
        // not up yet
      }
      await sleep(100);
    }
    ({ call } = await connect(new HttpStore(`http://127.0.0.1:${port}/`)));
  });
  after(() => {
    backend?.kill();
  });

  test('build and change through the API', async () => {
    const built = await call('build_diagram', shopSpec);
    assert.equal(built.error, false, built.text);
    assert.match(built.text, /display\/Online%20shop/);
    assert.ok(existsSync(join(dir, 'Online shop.json')));
    assert.equal((await call('add_nodes', { diagram: 'Online shop', nodes: [{ name: 'CDN', icon: 'cdn' }] })).error, false);
    const saved = JSON.parse(readFileSync(join(dir, 'Online shop.json'), 'utf8'));
    assert.equal(saved.items.length, 18);
    assert.equal(saved.name, 'Online shop');
  });

  test('a stopped ArchFlow gives a readable error', async () => {
    const { call: offline } = await connect(new HttpStore('http://127.0.0.1:9'));
    const r = await offline('list_diagrams');
    assert.equal(r.error, true);
    assert.match(r.text, /Can't reach ArchFlow/);
  });
});
