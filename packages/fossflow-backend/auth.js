// Logins, roles and API tokens for ArchFlow's server (AUTH_MODE=local).
//
// Everything is kept in one JSON file next to the diagrams
// (<STORAGE_PATH>/.archflow/auth.json), so the existing volume and backups
// cover it. No extra dependencies: passwords use Node's scrypt, sessions are
// HMAC-signed cookies, API tokens are stored as SHA-256 hashes.
//
// Roles: admin (everything, users), editor (create and change diagrams),
// viewer (read only). API tokens belong to a user, act with that user's
// rights, and need API access (granted by the admin per user, or to all).
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import express from 'express';

const SESSION_COOKIE = 'archflow_session';
const SESSION_DAYS = 30;
const MIN_PASSWORD = 8;
const ROLES = ['admin', 'editor', 'viewer'];
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 10;

// ---------------------------------------------------------------------------
// Small helpers

const now = () => {
  return new Date().toISOString();
};
const sha256 = (s) => {
  return crypto.createHash('sha256').update(s).digest('hex');
};
const b64url = (buf) => {
  return Buffer.from(buf).toString('base64url');
};
const safeEqual = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
const normEmail = (e) => {
  return String(e || '').trim().toLowerCase();
};
const validEmail = (e) => {
  return /^[^\s@]+@[^\s@]+$/.test(e) && e.length <= 200;
};

export const hashPassword = (password) => {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${b64url(salt)}$${b64url(hash)}`;
};

export const verifyPassword = (password, stored) => {
  try {
    const [kind, N, r, p, salt, hash] = String(stored).split('$');
    if (kind !== 'scrypt') return false;
    const expected = Buffer.from(hash, 'base64url');
    const got = crypto.scryptSync(password, Buffer.from(salt, 'base64url'), expected.length, {
      N: Number(N),
      r: Number(r),
      p: Number(p)
    });
    return crypto.timingSafeEqual(expected, got);
  } catch {
    return false;
  }
};

// A readable temporary password, e.g. for a new account or a reset
const tempPassword = () => {
  return b64url(crypto.randomBytes(9)).replace(/[-_]/g, 'x');
};

// ---------------------------------------------------------------------------
// The store: one JSON file, kept in memory, written atomically

class AuthStore {
  constructor(file) {
    this.file = file;
    this.data = {
      version: 1,
      secret: '',
      // publicAccess: people who aren't logged in may use the editor, but only
      // save in their browser or to a file - never to the server
      settings: { apiAccessForAll: false, publicAccess: false },
      users: [],
      tokens: []
    };
    if (fs.existsSync(file)) {
      const stored = JSON.parse(fs.readFileSync(file, 'utf8'));
      this.data = { ...this.data, ...stored, settings: { ...this.data.settings, ...stored.settings } };
    }
    if (!this.data.secret) {
      this.data.secret = crypto.randomBytes(32).toString('hex');
      this.save();
    }
  }

  save() {
    fs.mkdirSync(path.dirname(this.file), { recursive: true, mode: 0o700 });
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), { mode: 0o600 });
    fs.renameSync(tmp, this.file);
  }

  get users() {
    return this.data.users;
  }
  get tokens() {
    return this.data.tokens;
  }
  get settings() {
    return this.data.settings;
  }

  userById(id) {
    return this.users.find((u) => {
      return u.id === id;
    });
  }
  userByEmail(email) {
    const e = normEmail(email);
    return this.users.find((u) => {
      return u.email === e;
    });
  }
  activeAdmins() {
    return this.users.filter((u) => {
      return u.role === 'admin' && !u.disabled;
    });
  }

  addUser({ email, name, role, password, apiAccess = false, mustChangePassword = false }) {
    const user = {
      id: crypto.randomUUID(),
      email: normEmail(email),
      name: String(name || '').trim().slice(0, 100),
      role,
      passwordHash: hashPassword(password),
      disabled: false,
      apiAccess: !!apiAccess,
      mustChangePassword,
      sessionVersion: 1,
      createdAt: now(),
      lastLoginAt: null
    };
    this.users.push(user);
    this.save();
    return user;
  }
}

// What the app may see about a user
const publicUser = (u, store) => {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    disabled: !!u.disabled,
    apiAccess: !!u.apiAccess,
    canUseApi: u.role === 'admin' || !!u.apiAccess || !!store.settings.apiAccessForAll,
    mustChangePassword: !!u.mustChangePassword,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt
  };
};

const publicToken = (t) => {
  return {
    id: t.id,
    name: t.name,
    prefix: t.prefix,
    scope: t.scope,
    createdAt: t.createdAt,
    expiresAt: t.expiresAt,
    lastUsedAt: t.lastUsedAt
  };
};

// ---------------------------------------------------------------------------

export const createAuth = ({ mode, dataDir, adminEmail, adminPassword, log = console.log }) => {
  if (mode !== 'local') {
    // No logins: everyone may do everything, as before
    const anonymous = { id: null, email: null, role: 'admin', anonymous: true };
    return {
      mode: 'none',
      status: () => {
        return { mode: 'none', setupRequired: false, publicAccess: true };
      },
      attach: (req, res, next) => {
        req.user = anonymous;
        next();
      },
      requireUser: (req, res, next) => {
        next();
      },
      requireRole: () => {
        return [
          (req, res, next) => {
            next();
          }
        ];
      },
      router: express.Router().all('*', (req, res) => {
        res.status(404).json({ error: 'Logins are off (AUTH_MODE=none)' });
      }),
      adminRouter: express.Router().all('*', (req, res) => {
        res.status(404).json({ error: 'Logins are off (AUTH_MODE=none)' });
      })
    };
  }

  const store = new AuthStore(path.join(dataDir, 'auth.json'));

  // The first admin from the environment (only while there are no users)
  if (store.users.length === 0 && adminEmail && adminPassword) {
    if (validEmail(normEmail(adminEmail)) && adminPassword.length >= MIN_PASSWORD) {
      store.addUser({ email: adminEmail, name: 'Administrator', role: 'admin', password: adminPassword });
      log(`Created the administrator ${normEmail(adminEmail)} from ADMIN_EMAIL`);
    } else {
      log('ADMIN_EMAIL/ADMIN_PASSWORD ignored: invalid e-mail or password shorter than 8 characters');
    }
  }
  if (store.users.length === 0) {
    log('No accounts yet: open ArchFlow in the browser to create the administrator');
  }

  // --- sessions (signed cookie) -------------------------------------------

  const sign = (payload) => {
    return crypto.createHmac('sha256', store.data.secret).update(payload).digest('base64url');
  };

  const isHttps = (req) => {
    return req.secure || String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';
  };

  const setSession = (req, res, user) => {
    const payload = b64url(JSON.stringify({ u: user.id, v: user.sessionVersion, e: Date.now() + SESSION_DAYS * 864e5 }));
    res.cookie(SESSION_COOKIE, `${payload}.${sign(payload)}`, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isHttps(req),
      path: '/',
      maxAge: SESSION_DAYS * 864e5
    });
  };

  const clearSession = (req, res) => {
    res.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: 'lax', secure: isHttps(req), path: '/' });
  };

  const readCookie = (req) => {
    const header = req.headers.cookie || '';
    const m = header.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
    return m ? decodeURIComponent(m[1]) : null;
  };

  const userFromSession = (req) => {
    const raw = readCookie(req);
    if (!raw) return null;
    const [payload, mac] = raw.split('.');
    if (!payload || !mac || !safeEqual(mac, sign(payload))) return null;
    try {
      const { u, v, e } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      const user = store.userById(u);
      if (!user || user.disabled || user.sessionVersion !== v || Date.now() > e) return null;
      return user;
    } catch {
      return null;
    }
  };

  // --- API tokens ----------------------------------------------------------

  const canUseApi = (user) => {
    return user.role === 'admin' || user.apiAccess || store.settings.apiAccessForAll;
  };

  const userFromToken = (req) => {
    const m = String(req.headers.authorization || '').match(/^Bearer\s+(afk_[A-Za-z0-9_-]+)$/);
    if (!m) return null;
    const hash = sha256(m[1]);
    const token = store.tokens.find((t) => {
      return safeEqual(t.hash, hash);
    });
    if (!token) return { error: 'Unknown or revoked token' };
    if (token.expiresAt && Date.now() > Date.parse(token.expiresAt)) return { error: 'The token has expired' };
    const user = store.userById(token.userId);
    if (!user || user.disabled) return { error: 'The token owner is disabled' };
    if (!canUseApi(user)) return { error: 'API and MCP access is not allowed for this user' };
    // "Last used" is written at most once a minute
    if (!token.lastUsedAt || Date.now() - Date.parse(token.lastUsedAt) > 60000) {
      token.lastUsedAt = now();
      store.save();
    }
    return { user, token };
  };

  // Puts req.user (and req.token) on every /api request; never rejects
  const attach = (req, res, next) => {
    req.user = null;
    if (req.headers.authorization) {
      const r = userFromToken(req);
      if (r?.user) {
        req.user = r.user;
        req.token = r.token;
      } else if (r?.error) {
        req.authError = r.error;
      }
    } else {
      req.user = userFromSession(req);
    }
    next();
  };

  // --- guards ---------------------------------------------------------------

  const requireUser = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: req.authError || 'Not logged in', login: true });
    }
    // A read-only token may only read
    if (req.token?.scope === 'read' && !['GET', 'HEAD'].includes(req.method)) {
      return res.status(403).json({ error: 'This token is read-only' });
    }
    next();
  };

  const requireRole = (...roles) => {
    return [
      requireUser,
      (req, res, next) => {
        if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Not allowed for your role' });
        next();
      }
    ];
  };

  // Account and user management only from a browser session, never a token
  const requireSession = [
    requireUser,
    (req, res, next) => {
      if (req.token) return res.status(403).json({ error: 'Not allowed with an API token' });
      next();
    }
  ];

  // --- login rate limit (per IP) -------------------------------------------

  const failures = new Map();
  const tooManyFailures = (ip) => {
    const f = failures.get(ip);
    if (!f) return false;
    if (Date.now() - f.first > LOGIN_WINDOW_MS) {
      failures.delete(ip);
      return false;
    }
    return f.count >= LOGIN_MAX_FAILURES;
  };
  const noteFailure = (ip) => {
    const f = failures.get(ip);
    if (!f || Date.now() - f.first > LOGIN_WINDOW_MS) failures.set(ip, { count: 1, first: Date.now() });
    else f.count += 1;
  };

  const checkPassword = (password) => {
    if (typeof password !== 'string' || password.length < MIN_PASSWORD) {
      return `The password must have at least ${MIN_PASSWORD} characters`;
    }
    if (password.length > 200) return 'The password is too long';
    return null;
  };

  // --- /api/auth: login, the own account, own tokens ------------------------

  const router = express.Router();

  router.get('/me', requireUser, (req, res) => {
    res.json({ user: publicUser(req.user, store), viaToken: !!req.token });
  });

  router.post('/setup', (req, res) => {
    if (store.users.length > 0) return res.status(409).json({ error: 'The administrator already exists' });
    const { email, name, password } = req.body || {};
    if (!validEmail(normEmail(email))) return res.status(400).json({ error: 'Enter a valid e-mail address' });
    const bad = checkPassword(password);
    if (bad) return res.status(400).json({ error: bad });
    const user = store.addUser({ email, name, role: 'admin', password });
    log(`Created the administrator ${user.email} in the setup screen`);
    user.lastLoginAt = now();
    store.save();
    setSession(req, res, user);
    res.status(201).json({ user: publicUser(user, store) });
  });

  router.post('/login', (req, res) => {
    if (tooManyFailures(req.ip)) {
      return res.status(429).json({ error: 'Too many failed attempts. Try again in 15 minutes.' });
    }
    const { email, password } = req.body || {};
    const user = store.userByEmail(email);
    // Same answer whether the e-mail or the password is wrong
    if (!user || !verifyPassword(String(password || ''), user.passwordHash)) {
      noteFailure(req.ip);
      return res.status(401).json({ error: 'Wrong e-mail or password' });
    }
    if (user.disabled) return res.status(403).json({ error: 'This account is disabled' });
    failures.delete(req.ip);
    user.lastLoginAt = now();
    store.save();
    setSession(req, res, user);
    res.json({ user: publicUser(user, store) });
  });

  router.post('/logout', (req, res) => {
    clearSession(req, res);
    res.json({ success: true });
  });

  router.post('/password', requireSession, (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    if (!verifyPassword(String(currentPassword || ''), req.user.passwordHash)) {
      return res.status(400).json({ error: 'The current password is wrong' });
    }
    const bad = checkPassword(newPassword);
    if (bad) return res.status(400).json({ error: bad });
    req.user.passwordHash = hashPassword(newPassword);
    req.user.mustChangePassword = false;
    // Other browsers are logged out; this one gets a fresh session
    req.user.sessionVersion += 1;
    store.save();
    setSession(req, res, req.user);
    res.json({ user: publicUser(req.user, store) });
  });

  router.get('/tokens', requireSession, (req, res) => {
    res.json(
      store.tokens
        .filter((t) => {
          return t.userId === req.user.id;
        })
        .map(publicToken)
    );
  });

  router.post('/tokens', requireSession, (req, res) => {
    if (!canUseApi(req.user)) return res.status(403).json({ error: 'API and MCP access is not allowed for you' });
    const { name, scope, expiresInDays } = req.body || {};
    const cleanName = String(name || '').trim().slice(0, 100);
    if (!cleanName) return res.status(400).json({ error: 'Give the token a name' });
    if (!['read', 'write'].includes(scope)) return res.status(400).json({ error: 'Scope must be read or write' });
    const days = expiresInDays ? Number(expiresInDays) : null;
    if (days !== null && (!Number.isFinite(days) || days < 1 || days > 3650)) {
      return res.status(400).json({ error: 'Invalid expiry' });
    }
    const secret = `afk_${b64url(crypto.randomBytes(30))}`;
    const token = {
      id: crypto.randomUUID(),
      userId: req.user.id,
      name: cleanName,
      prefix: secret.slice(0, 10),
      hash: sha256(secret),
      scope,
      createdAt: now(),
      expiresAt: days ? new Date(Date.now() + days * 864e5).toISOString() : null,
      lastUsedAt: null
    };
    store.tokens.push(token);
    store.save();
    // The only time the token itself is shown
    res.status(201).json({ ...publicToken(token), token: secret });
  });

  router.delete('/tokens/:id', requireSession, (req, res) => {
    const t = store.tokens.find((x) => {
      return x.id === req.params.id && x.userId === req.user.id;
    });
    if (!t) return res.status(404).json({ error: 'No such token' });
    store.data.tokens = store.tokens.filter((x) => {
      return x !== t;
    });
    store.save();
    res.json({ success: true });
  });

  // --- /api/admin: users, settings, all tokens ------------------------------

  const adminRouter = express.Router();
  adminRouter.use(requireSession, (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only for administrators' });
    next();
  });

  adminRouter.get('/users', (req, res) => {
    res.json(
      store.users.map((u) => {
        return publicUser(u, store);
      })
    );
  });

  adminRouter.post('/users', (req, res) => {
    const { email, name, role, apiAccess } = req.body || {};
    const e = normEmail(email);
    if (!validEmail(e)) return res.status(400).json({ error: 'Enter a valid e-mail address' });
    if (!ROLES.includes(role)) return res.status(400).json({ error: 'Unknown role' });
    if (store.userByEmail(e)) return res.status(409).json({ error: 'A user with this e-mail already exists' });
    const password = tempPassword();
    const user = store.addUser({ email: e, name, role, password, apiAccess, mustChangePassword: true });
    log(`${req.user.email} created the user ${user.email} (${role})`);
    res.status(201).json({ user: publicUser(user, store), temporaryPassword: password });
  });

  // Would this change leave ArchFlow without an active administrator?
  const losesLastAdmin = (user, change) => {
    const wasActiveAdmin = user.role === 'admin' && !user.disabled;
    const staysActiveAdmin = (change.role ?? user.role) === 'admin' && !(change.disabled ?? user.disabled);
    return wasActiveAdmin && !staysActiveAdmin && store.activeAdmins().length <= 1;
  };

  adminRouter.patch('/users/:id', (req, res) => {
    const user = store.userById(req.params.id);
    if (!user) return res.status(404).json({ error: 'No such user' });
    const { name, role, disabled, apiAccess } = req.body || {};
    if (role !== undefined && !ROLES.includes(role)) return res.status(400).json({ error: 'Unknown role' });
    if (user.id === req.user.id && (disabled === true || (role && role !== 'admin'))) {
      return res.status(400).json({ error: "You can't disable yourself or take away your own admin role" });
    }
    if (losesLastAdmin(user, { role, disabled })) {
      return res.status(400).json({ error: 'ArchFlow needs at least one active administrator' });
    }
    if (name !== undefined) user.name = String(name).trim().slice(0, 100);
    if (role !== undefined) user.role = role;
    if (apiAccess !== undefined) user.apiAccess = !!apiAccess;
    if (disabled !== undefined) {
      user.disabled = !!disabled;
      // A disabled user is logged out everywhere
      if (user.disabled) user.sessionVersion += 1;
    }
    store.save();
    res.json(publicUser(user, store));
  });

  adminRouter.post('/users/:id/reset-password', (req, res) => {
    const user = store.userById(req.params.id);
    if (!user) return res.status(404).json({ error: 'No such user' });
    const password = tempPassword();
    user.passwordHash = hashPassword(password);
    user.mustChangePassword = true;
    user.sessionVersion += 1;
    store.save();
    log(`${req.user.email} reset the password of ${user.email}`);
    res.json({ temporaryPassword: password });
  });

  adminRouter.delete('/users/:id', (req, res) => {
    const user = store.userById(req.params.id);
    if (!user) return res.status(404).json({ error: 'No such user' });
    if (user.id === req.user.id) return res.status(400).json({ error: "You can't delete yourself" });
    if (losesLastAdmin(user, { disabled: true })) {
      return res.status(400).json({ error: 'ArchFlow needs at least one active administrator' });
    }
    store.data.users = store.users.filter((u) => {
      return u !== user;
    });
    // Their tokens go too; their diagrams stay
    store.data.tokens = store.tokens.filter((t) => {
      return t.userId !== user.id;
    });
    store.save();
    log(`${req.user.email} deleted the user ${user.email}`);
    res.json({ success: true });
  });

  adminRouter.get('/settings', (req, res) => {
    res.json(store.settings);
  });

  adminRouter.patch('/settings', (req, res) => {
    const { apiAccessForAll, publicAccess } = req.body || {};
    if (apiAccessForAll !== undefined) store.settings.apiAccessForAll = !!apiAccessForAll;
    if (publicAccess !== undefined) store.settings.publicAccess = !!publicAccess;
    store.save();
    res.json(store.settings);
  });

  adminRouter.get('/tokens', (req, res) => {
    res.json(
      store.tokens.map((t) => {
        return { ...publicToken(t), user: store.userById(t.userId)?.email ?? null };
      })
    );
  });

  adminRouter.delete('/tokens/:id', (req, res) => {
    const before = store.tokens.length;
    store.data.tokens = store.tokens.filter((t) => {
      return t.id !== req.params.id;
    });
    if (store.tokens.length === before) return res.status(404).json({ error: 'No such token' });
    store.save();
    res.json({ success: true });
  });

  return {
    mode: 'local',
    status: () => {
      return { mode: 'local', setupRequired: store.users.length === 0, publicAccess: !!store.settings.publicAccess };
    },
    attach,
    requireUser,
    requireRole,
    router,
    adminRouter,
    store
  };
};
