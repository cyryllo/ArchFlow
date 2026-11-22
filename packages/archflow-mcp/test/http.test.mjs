// The MCP server over HTTP, as a remote client (e.g. Claude Code) sees it.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { publicUrlOf, startHttpServer } from '../dist/http.js';
import { FolderStore, HttpStore } from '../dist/storage.js';

const TOKEN = 'test-token-0123456789abcdef';

describe('HTTP transport', () => {
  const dir = mkdtempSync(join(tmpdir(), 'archflow-http-'));
  let server;
  let base;
  before(async () => {
    server = await startHttpServer({ port: 0, host: '127.0.0.1', auth: { kind: 'token', token: TOKEN }, storeFor: () => new FolderStore(dir) });
    base = `http://127.0.0.1:${server.address().port}`;
  });
  after(() => {
    server.close();
  });

  const connect = async (token = TOKEN) => {
    const client = new Client({ name: 'test', version: '1.0.0' });
    await client.connect(
      new StreamableHTTPClientTransport(new URL(`${base}/mcp`), {
        requestInit: { headers: { Authorization: `Bearer ${token}` } }
      })
    );
    return client;
  };

  test('with the token: tools work and diagrams are saved', async () => {
    const client = await connect();
    const { tools } = await client.listTools();
    assert.ok(tools.some((t) => t.name === 'build_diagram'));
    const r = await client.callTool({
      name: 'build_diagram',
      arguments: { title: 'Over HTTP', nodes: [{ name: 'Server', icon: 'server' }, { name: 'DB', icon: 'storage' }] }
    });
    assert.equal(r.isError, undefined, r.content[0].text);
    assert.ok(existsSync(join(dir, 'Over HTTP.json')));
    await client.close();
  });

  test('without or with a wrong token: 401', async () => {
    await assert.rejects(connect('wrong-token-wrong-token'), /401|token/i);
    const res = await fetch(`${base}/mcp`, { method: 'POST', body: '{}' });
    assert.equal(res.status, 401);
    assert.equal(res.headers.get('www-authenticate'), 'Bearer');
  });

  test('other paths and methods', async () => {
    assert.equal((await fetch(`${base}/other`)).status, 404);
    const get = await fetch(`${base}/mcp`, { headers: { Authorization: `Bearer ${TOKEN}` } });
    assert.equal(get.status, 405);
    const bad = await fetch(`${base}/mcp`, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}` }, body: 'not json' });
    assert.equal(bad.status, 400);
  });
});

test('links use the address the client came from', () => {
  const req = (headers) => ({ headers });
  assert.equal(publicUrlOf(req({ host: 'archflow.lan:9500' })), 'http://archflow.lan:9500');
  assert.equal(
    publicUrlOf(req({ host: '127.0.0.1:3002', 'x-forwarded-host': 'diagrams.example.com', 'x-forwarded-proto': 'https' })),
    'https://diagrams.example.com'
  );
  const store = new HttpStore('http://127.0.0.1:3001', undefined, 'https://diagrams.example.com/');
  assert.equal(store.locate('My shop'), 'https://diagrams.example.com/display/My%20shop');
  assert.match(store.where, /diagrams\.example\.com/);
});

// ArchFlow with logins: clients use their own ArchFlow tokens
const BACKEND = new URL('../../fossflow-backend/server.js', import.meta.url).pathname;
describe('HTTP with ArchFlow user tokens', { skip: !existsSync(BACKEND) && 'backend not found' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'archflow-login-'));
  const bport = 41000 + Math.floor(Math.random() * 1000);
  const api = `http://127.0.0.1:${bport}`;
  let backend;
  let mcp;
  let base;
  const tokens = {};
  before(async () => {
    backend = spawn(process.execPath, [BACKEND], {
      env: { ...process.env, ENABLE_SERVER_STORAGE: 'true', STORAGE_PATH: dir, BACKEND_PORT: String(bport), AUTH_MODE: 'local', ADMIN_EMAIL: 'admin@x.pl', ADMIN_PASSWORD: 'admin-pass-123' },
      stdio: 'ignore'
    });
    for (let i = 0; i < 50; i++) {
      try {
        if ((await fetch(`${api}/api/storage/status`)).ok) break;
      } catch {
        // not up yet
      }
      await sleep(100);
    }
    const login = await fetch(`${api}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@x.pl', password: 'admin-pass-123' }) });
    const cookie = login.headers.get('set-cookie').split(';')[0];
    for (const scope of ['read', 'write']) {
      const r = await fetch(`${api}/api/auth/tokens`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ name: scope, scope }) });
      tokens[scope] = (await r.json()).token;
    }
    mcp = await startHttpServer({
      port: 0,
      host: '127.0.0.1',
      auth: { kind: 'archflow', url: api },
      storeFor: (req) => new HttpStore(api, req.headers.authorization.split(' ')[1])
    });
    base = `http://127.0.0.1:${mcp.address().port}`;
  });
  after(() => {
    mcp?.close();
    backend?.kill();
  });

  const connectWith = async (token) => {
    const client = new Client({ name: 'test', version: '1.0.0' });
    await client.connect(new StreamableHTTPClientTransport(new URL(`${base}/mcp`), { requestInit: { headers: { Authorization: `Bearer ${token}` } } }));
    return client;
  };

  test('a write token builds diagrams as its owner', async () => {
    const client = await connectWith(tokens.write);
    const r = await client.callTool({ name: 'build_diagram', arguments: { title: 'By token', nodes: [{ name: 'A', icon: 'server' }] } });
    assert.equal(r.isError, undefined, r.content[0].text);
    assert.equal(JSON.parse(readFileSync(join(dir, 'By token.json'), 'utf8')).createdBy, 'admin@x.pl');
    await client.close();
  });

  test('a read-only token can read but not save', async () => {
    const client = await connectWith(tokens.read);
    assert.match((await client.callTool({ name: 'list_diagrams', arguments: {} })).content[0].text, /By token/);
    const r = await client.callTool({ name: 'build_diagram', arguments: { title: 'Nope', nodes: [{ name: 'A', icon: 'server' }] } });
    assert.equal(r.isError, true);
    assert.match(r.content[0].text, /read-only/);
    await client.close();
  });

  test('an unknown token is refused', async () => {
    await assert.rejects(connectWith('afk_not-a-real-token'), /401|token/i);
  });
});
