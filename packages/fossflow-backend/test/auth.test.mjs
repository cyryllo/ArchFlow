// The backend with logins on (AUTH_MODE=local) and off, as a real server.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { setTimeout as sleep } from 'node:timers/promises';

const SERVER = new URL('../server.js', import.meta.url).pathname;

const startServer = async (env) => {
  const dir = mkdtempSync(join(tmpdir(), 'archflow-auth-'));
  const port = 40000 + Math.floor(Math.random() * 5000);
  const proc = spawn(process.execPath, [SERVER], {
    env: { ...process.env, ENABLE_SERVER_STORAGE: 'true', STORAGE_PATH: dir, BACKEND_PORT: String(port), ...env },
    stdio: 'ignore'
  });
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${base}/api/storage/status`)).ok) break;
    } catch {
      // not up yet
    }
    await sleep(100);
  }
  return { proc, base, dir };
};

// A tiny browser: keeps the session cookie
const browser = (base) => {
  let cookie = '';
  return async (method, path, body, headers = {}) => {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0].endsWith('=') ? '' : set.split(';')[0];
    const json = await res.json().catch(() => {
      return null;
    });
    return { status: res.status, body: json, setCookie: set };
  };
};

const diagram = (title) => {
  return { title, name: title, icons: [], colors: [], items: [], views: [] };
};

describe('logins on (AUTH_MODE=local)', () => {
  let srv;
  let admin;
  let users;
  before(async () => {
    srv = await startServer({ AUTH_MODE: 'local' });
    admin = browser(srv.base);
    users = {};
  });
  after(() => {
    srv.proc.kill();
  });

  test('a fresh server asks for the administrator and protects the API', async () => {
    const status = await (await fetch(`${srv.base}/api/storage/status`)).json();
    assert.deepEqual(status.auth, { mode: 'local', setupRequired: true, publicAccess: false });
    assert.equal((await fetch(`${srv.base}/api/diagrams`)).status, 401);
  });

  test('setup creates the admin once and logs them in', async () => {
    assert.equal((await admin('POST', '/api/auth/setup', { email: 'a@x.pl', password: 'short' })).status, 400);
    const r = await admin('POST', '/api/auth/setup', { email: 'Admin@X.pl', name: 'Ada', password: 'admin-pass-123' });
    assert.equal(r.status, 201);
    assert.match(r.setCookie, /archflow_session=.*HttpOnly.*SameSite=Lax/i);
    assert.equal(r.body.user.email, 'admin@x.pl');
    assert.equal((await admin('GET', '/api/auth/me')).body.user.role, 'admin');
    const again = await browser(srv.base)('POST', '/api/auth/setup', { email: 'evil@x.pl', password: 'evil-pass-123' });
    assert.equal(again.status, 409);
    // The account file is private
    const file = join(srv.dir, '.archflow', 'auth.json');
    assert.ok(existsSync(file));
    assert.doesNotMatch(readFileSync(file, 'utf8'), /admin-pass-123/);
  });

  test('the admin adds an editor and a viewer with temporary passwords', async () => {
    for (const role of ['editor', 'viewer']) {
      const r = await admin('POST', '/api/admin/users', { email: `${role}@x.pl`, name: role, role });
      assert.equal(r.status, 201);
      assert.equal(r.body.user.mustChangePassword, true);
      users[role] = { id: r.body.user.id, password: r.body.temporaryPassword, b: browser(srv.base) };
    }
    assert.equal((await admin('POST', '/api/admin/users', { email: 'editor@x.pl', role: 'editor' })).status, 409);
    for (const role of ['editor', 'viewer']) {
      const u = users[role];
      assert.equal((await u.b('POST', '/api/auth/login', { email: `${role}@x.pl`, password: 'wrong-password' })).status, 401);
      assert.equal((await u.b('POST', '/api/auth/login', { email: `${role}@x.pl`, password: u.password })).status, 200);
      const changed = await u.b('POST', '/api/auth/password', { currentPassword: u.password, newPassword: `${role}-new-pass` });
      assert.equal(changed.status, 200);
      assert.equal(changed.body.user.mustChangePassword, false);
    }
  });

  test('roles: editors write, viewers only read; diagrams record their authors', async () => {
    const created = await users.editor.b('POST', '/api/diagrams', { ...diagram('Team plan'), owner: 'forged' });
    assert.equal(created.status, 201);
    const id = created.body.id;
    assert.equal((await users.viewer.b('POST', '/api/diagrams', diagram('Nope'))).status, 403);
    assert.equal((await users.viewer.b('DELETE', `/api/diagrams/${encodeURIComponent(id)}`)).status, 403);
    const read = await users.viewer.b('GET', `/api/diagrams/${encodeURIComponent(id)}`);
    assert.equal(read.status, 200);
    // The owner's id stays on the server; the author's e-mail is shown
    assert.equal(read.body.owner, undefined);
    assert.equal(read.body.createdBy, 'editor@x.pl');
    assert.equal(read.body._permissions.canEdit, false);
    // The admin changes it: the author stays, the last editor changes
    await admin('PUT', `/api/diagrams/${encodeURIComponent(id)}`, { ...diagram('Team plan'), owner: 'forged' });
    const after = (await admin('GET', `/api/diagrams/${encodeURIComponent(id)}`)).body;
    assert.equal(after.createdBy, 'editor@x.pl');
    assert.equal(after.modifiedBy, 'admin@x.pl');
    // The file on disk keeps the real owner, not the forged one
    assert.equal(JSON.parse(readFileSync(join(srv.dir, `${id}.json`), 'utf8')).owner, users.editor.id);
    assert.equal((await users.viewer.b('GET', '/api/diagrams')).body.length, 1);
  });

  test("diagram ids can't reach other files", async () => {
    for (const bad of ['.archflow%2Fauth', '..%2F..%2Fetc%2Fpasswd', '.hidden']) {
      assert.equal((await admin('GET', `/api/diagrams/${bad}`)).status, 400, bad);
    }
  });

  test('API tokens: only with API access, scoped, revocable', async () => {
    const ed = users.editor.b;
    assert.equal((await ed('POST', '/api/auth/tokens', { name: 'MCP', scope: 'write' })).status, 403);
    await admin('PATCH', `/api/admin/users/${users.editor.id}`, { apiAccess: true });
    const read = await ed('POST', '/api/auth/tokens', { name: 'Reader', scope: 'read', expiresInDays: 30 });
    const write = await ed('POST', '/api/auth/tokens', { name: 'Claude Code', scope: 'write' });
    assert.equal(read.status, 201);
    assert.match(write.body.token, /^afk_/);
    const bearer = (t) => {
      return { Authorization: `Bearer ${t}` };
    };
    const anon = browser(srv.base);
    assert.equal((await anon('GET', '/api/diagrams', undefined, bearer(read.body.token))).status, 200);
    assert.equal((await anon('POST', '/api/diagrams', diagram('X'), bearer(read.body.token))).status, 403);
    assert.equal((await anon('POST', '/api/diagrams', diagram('Via token'), bearer(write.body.token))).status, 201);
    const me = await anon('GET', '/api/auth/me', undefined, bearer(write.body.token));
    assert.equal(me.body.user.email, 'editor@x.pl');
    assert.equal(me.body.viaToken, true);
    // Tokens can't manage accounts or tokens
    assert.equal((await anon('GET', '/api/auth/tokens', undefined, bearer(write.body.token))).status, 403);
    assert.equal((await anon('GET', '/api/admin/users', undefined, bearer(write.body.token))).status, 403);
    // The list never shows the token itself
    const list = (await ed('GET', '/api/auth/tokens')).body;
    assert.equal(list.length, 2);
    assert.ok(list.every((t) => !t.token && !t.hash));
    // Taking API access away stops the tokens; giving it to everyone brings them back
    await admin('PATCH', `/api/admin/users/${users.editor.id}`, { apiAccess: false });
    assert.equal((await anon('GET', '/api/diagrams', undefined, bearer(write.body.token))).status, 401);
    await admin('PATCH', '/api/admin/settings', { apiAccessForAll: true });
    assert.equal((await anon('GET', '/api/diagrams', undefined, bearer(write.body.token))).status, 200);
    // The admin sees all tokens and revokes one
    const all = (await admin('GET', '/api/admin/tokens')).body;
    assert.ok(all.some((t) => t.user === 'editor@x.pl'));
    await admin('DELETE', `/api/admin/tokens/${write.body.id}`);
    assert.equal((await anon('GET', '/api/diagrams', undefined, bearer(write.body.token))).status, 401);
    assert.equal((await anon('GET', '/api/diagrams', undefined, bearer('afk_made-up'))).status, 401);
  });

  test('disabling a user logs them out and stops their tokens', async () => {
    const v = users.viewer;
    await admin('PATCH', '/api/admin/settings', { apiAccessForAll: true });
    const t = (await v.b('POST', '/api/auth/tokens', { name: 'viewer token', scope: 'read' })).body.token;
    await admin('PATCH', `/api/admin/users/${v.id}`, { disabled: true });
    assert.equal((await v.b('GET', '/api/diagrams')).status, 401);
    assert.equal((await browser(srv.base)('GET', '/api/diagrams', undefined, { Authorization: `Bearer ${t}` })).status, 401);
    assert.equal((await browser(srv.base)('POST', '/api/auth/login', { email: 'viewer@x.pl', password: 'viewer-new-pass' })).status, 403);
    await admin('PATCH', `/api/admin/users/${v.id}`, { disabled: false });
  });

  test('a password reset gives a new temporary password and logs out old sessions', async () => {
    const r = await admin('POST', `/api/admin/users/${users.editor.id}/reset-password`);
    assert.equal(r.status, 200);
    assert.equal((await users.editor.b('GET', '/api/auth/me')).status, 401);
    const login = await browser(srv.base)('POST', '/api/auth/login', { email: 'editor@x.pl', password: r.body.temporaryPassword });
    assert.equal(login.body.user.mustChangePassword, true);
  });

  test('ArchFlow always keeps an active administrator', async () => {
    const me = (await admin('GET', '/api/auth/me')).body.user;
    assert.equal((await admin('PATCH', `/api/admin/users/${me.id}`, { disabled: true })).status, 400);
    assert.equal((await admin('PATCH', `/api/admin/users/${me.id}`, { role: 'editor' })).status, 400);
    assert.equal((await admin('DELETE', `/api/admin/users/${me.id}`)).status, 400);
    assert.equal((await users.editor.b('GET', '/api/admin/users')).status, 401);
  });

  test('viewers and editors are not admins', async () => {
    const e = browser(srv.base);
    const r = await admin('POST', `/api/admin/users/${users.editor.id}/reset-password`);
    await e('POST', '/api/auth/login', { email: 'editor@x.pl', password: r.body.temporaryPassword });
    assert.equal((await e('GET', '/api/admin/users')).status, 403);
    assert.equal((await e('POST', '/api/admin/users', { email: 'z@x.pl', role: 'admin' })).status, 403);
  });

  test('public access: an admin setting the app reads from the status', async () => {
    const status = async () => {
      return (await (await fetch(`${srv.base}/api/storage/status`)).json()).auth;
    };
    assert.equal((await status()).publicAccess, false);
    assert.equal((await admin('PATCH', '/api/admin/settings', { publicAccess: true })).body.publicAccess, true);
    assert.equal((await status()).publicAccess, true);
    // Guests still can't touch the server's diagrams
    assert.equal((await fetch(`${srv.base}/api/diagrams`)).status, 401);
    await admin('PATCH', '/api/admin/settings', { publicAccess: false });
  });

  test('sharing: private diagrams, people, read-only and edit access', async () => {
    // A second editor and the viewer log in fresh
    const r1 = await admin('POST', '/api/admin/users', { email: 'ola@x.pl', name: 'Ola', role: 'editor' });
    const ola = browser(srv.base);
    await ola('POST', '/api/auth/login', { email: 'ola@x.pl', password: r1.body.temporaryPassword });
    const r2 = await admin('POST', `/api/admin/users/${users.viewer.id}/reset-password`);
    const jan = browser(srv.base);
    await jan('POST', '/api/auth/login', { email: 'viewer@x.pl', password: r2.body.temporaryPassword });

    // Ola makes a private diagram
    const id = (await ola('POST', '/api/diagrams', diagram('Secret plan'))).body.id;
    const path = `/api/diagrams/${encodeURIComponent(id)}`;
    assert.equal((await ola('PUT', `${path}/sharing`, { visibility: 'private' })).status, 200);
    const names = async (b) => {
      const r = await b('GET', '/api/diagrams');
      assert.ok(Array.isArray(r.body), `list: ${r.status} ${JSON.stringify(r.body)}`);
      return r.body.map((d) => d.name);
    };
    assert.ok(!(await names(jan)).includes('Secret plan'));
    assert.equal((await jan('GET', path)).status, 404);
    assert.ok((await names(admin)).includes('Secret plan'), 'admins see everything');
    // Only the owner or an admin manages sharing
    assert.equal((await jan('GET', `${path}/sharing`)).status, 404);
    // Shared with the viewer to view, and with editor@x.pl to edit
    const sharing = (await ola('GET', `${path}/sharing`)).body;
    assert.ok(sharing.people.some((p) => p.email === 'viewer@x.pl'));
    await ola('PUT', `${path}/sharing`, { users: [{ id: users.viewer.id, access: 'view' }, { id: users.editor.id, access: 'edit' }] });
    const listed = (await jan('GET', '/api/diagrams')).body.find((d) => d.name === 'Secret plan');
    assert.equal(listed.sharedWithMe, true);
    assert.equal(listed.canEdit, false);
    assert.equal((await jan('GET', path)).status, 200);
    assert.equal((await jan('PUT', path, diagram('Secret plan'))).status, 403);
    // The edit share works for an editor, but they can't re-share or delete it
    const ed = browser(srv.base);
    const r3 = await admin('POST', `/api/admin/users/${users.editor.id}/reset-password`);
    await ed('POST', '/api/auth/login', { email: 'editor@x.pl', password: r3.body.temporaryPassword });
    assert.equal((await ed('PUT', path, { ...diagram('Secret plan'), items: [] })).status, 200);
    assert.equal((await ed('GET', `${path}/sharing`)).status, 403);
    assert.equal((await ed('DELETE', path)).status, 403);
    // A normal save can't change the sharing
    await ed('PUT', path, { ...diagram('Secret plan'), access: { visibility: 'team' } });
    assert.equal((await ola('GET', `${path}/sharing`)).body.visibility, 'private');
  });

  test('share links: view without logging in, expire, revoke', async () => {
    const ola = browser(srv.base);
    const r = await admin('POST', '/api/admin/users', { email: 'link@x.pl', role: 'editor' });
    await ola('POST', '/api/auth/login', { email: 'link@x.pl', password: r.body.temporaryPassword });
    const id = (await ola('POST', '/api/diagrams', diagram('Linked'))).body.id;
    const path = `/api/diagrams/${encodeURIComponent(id)}`;
    await ola('PUT', `${path}/sharing`, { visibility: 'private' });
    const link = (await ola('POST', `${path}/links`, { expiresInDays: 7 })).body;
    assert.match(link.token, /^afs_/);
    const anon = browser(srv.base);
    const seen = await anon('GET', `/api/shared/${link.token}`);
    assert.equal(seen.status, 200);
    assert.equal(seen.body.title, 'Linked');
    assert.equal(seen.body.access, undefined);
    assert.equal(seen.body._permissions.canEdit, false);
    // The token isn't stored or listed
    assert.doesNotMatch(readFileSync(join(srv.dir, `${id}.json`), 'utf8'), new RegExp(link.token));
    const links = (await ola('GET', `${path}/sharing`)).body.links;
    assert.equal(links.length, 1);
    assert.equal(links[0].token, undefined);
    assert.equal((await anon('GET', '/api/shared/afs_made-up')).status, 404);
    await ola('DELETE', `${path}/links/${link.id}`);
    assert.equal((await anon('GET', `/api/shared/${link.token}`)).status, 404);
  });

  test('too many failed logins are slowed down', async () => {
    const b = browser(srv.base);
    let last;
    for (let i = 0; i < 11; i++) last = await b('POST', '/api/auth/login', { email: 'admin@x.pl', password: `bad-${i}` });
    assert.equal(last.status, 429);
  });
});

describe('logins off (AUTH_MODE=none, the default)', () => {
  let srv;
  before(async () => {
    srv = await startServer({ AUTH_MODE: '' });
  });
  after(() => {
    srv.proc.kill();
  });

  test('everything works without an account, as before', async () => {
    const b = browser(srv.base);
    const status = await (await fetch(`${srv.base}/api/storage/status`)).json();
    assert.equal(status.auth.mode, 'none');
    const created = await b('POST', '/api/diagrams', diagram('Open'));
    assert.equal(created.status, 201);
    assert.equal((await b('GET', '/api/diagrams')).body.length, 1);
    assert.equal((await b('GET', '/api/auth/me')).status, 404);
    assert.equal((await b('GET', '/api/diagrams/..%2Fsecret')).status, 400);
  });
});
