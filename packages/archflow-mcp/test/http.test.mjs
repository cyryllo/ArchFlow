// The MCP server over HTTP, as a remote client (e.g. Claude Code) sees it.
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync } from 'node:fs';
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
    server = await startHttpServer({ port: 0, host: '127.0.0.1', token: TOKEN, storeFor: () => new FolderStore(dir) });
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
