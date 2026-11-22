// Diagram storage API (/api/diagrams) with who-may-do-what, sharing and
// share links (/api/shared/<token>).
//
// Diagrams are JSON files in STORAGE_PATH; the file name follows the diagram
// name. Who owns a diagram and who it's shared with is kept inside the file
// ("owner", "access"), so renaming keeps it. The client can never set those
// fields through a normal save, and only people who manage a diagram see them.
//
// Without logins (AUTH_MODE=none) everyone may do everything, as before.
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import express from 'express';

const LINK_PREFIX = 'afs_';

const sha256 = (s) => {
  return crypto.createHash('sha256').update(s).digest('hex');
};

// Turn a diagram name into a filesystem-safe filename stem: strips characters
// invalid on Windows/Linux/macOS, collapses whitespace, and caps the length.
export const sanitizeFilename = (name) => {
  const cleaned = (name || 'Untitled Diagram')
    // eslint-disable-next-line no-control-regex
    .replace(/[\\/?%*:|"<>\x00-\x1f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 150);
  return cleaned || 'Untitled Diagram';
};

// A diagram id is a file name stem: no folders, no hidden files
export const validId = (id) => {
  return typeof id === 'string' && id.length > 0 && id.length <= 200 && !/[\\/\x00]/.test(id) && !id.startsWith('.');
};

// Fields only the server writes
const SERVER_FIELDS = ['owner', 'createdBy', 'modifiedBy', 'access', '_permissions'];
const fromClient = (body) => {
  const copy = { ...body };
  SERVER_FIELDS.forEach((f) => {
    delete copy[f];
  });
  return copy;
};

const accessOf = (d) => {
  const a = d.access || {};
  return { visibility: a.visibility === 'private' ? 'private' : 'team', users: a.users || [], links: a.links || [] };
};

export const createDiagramRouter = ({ storagePath, auth }) => {
  const local = auth.mode === 'local';
  const file = (id) => {
    return path.join(storagePath, `${id}.json`);
  };
  const exists = async (id) => {
    return fs
      .access(file(id))
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });
  };
  const read = async (id) => {
    return JSON.parse(await fs.readFile(file(id), 'utf-8'));
  };
  const write = async (id, data) => {
    await fs.writeFile(file(id), JSON.stringify(data, null, 2));
  };

  // Picks a filename stem for `name`, appending " (2)", " (3)"... when another
  // diagram has it; `keepId` is the diagram being saved (its own name is fine)
  const uniqueId = async (name, keepId) => {
    const base = sanitizeFilename(name);
    let candidate = base;
    for (let n = 2; candidate !== keepId && (await exists(candidate)); n++) candidate = `${base} (${n})`;
    return candidate;
  };

  // What `user` may do with diagram `d`
  const permissions = (user, d) => {
    if (!local) return { read: true, write: true, manage: false, delete: true };
    const a = accessOf(d);
    const admin = user.role === 'admin';
    const owner = !!d.owner && d.owner === user.id;
    const share = a.users.find((s) => {
      return s.id === user.id;
    });
    const team = a.visibility === 'team';
    const read = admin || owner || team || !!share;
    // Viewers never change anything, whatever a diagram's sharing says
    const write = user.role !== 'viewer' && (admin || owner || team || share?.access === 'edit');
    // Diagrams from before 0.9.1 have no owner: admins manage them
    const manage = admin || owner;
    return { read, write, manage, delete: write && (team || manage), shared: !!share && !owner };
  };

  // A diagram as the client gets it: without the owner's id and sharing
  // internals (the author's and last editor's e-mails stay)
  const forClient = (d, p) => {
    const { owner, access, _permissions, ...out } = d;
    out._permissions = { canEdit: p.write, canManage: p.manage, visibility: accessOf(d).visibility };
    return out;
  };

  const loadOr404 = async (req, res) => {
    if (!validId(req.params.id)) {
      res.status(400).json({ error: 'Invalid diagram id' });
      return null;
    }
    try {
      const d = await read(req.params.id);
      const p = permissions(req.user, d);
      // A diagram you may not see doesn't exist for you
      if (!p.read) {
        res.status(404).json({ error: 'Diagram not found' });
        return null;
      }
      return { d, p };
    } catch (e) {
      if (e.code === 'ENOENT') res.status(404).json({ error: 'Diagram not found' });
      else res.status(500).json({ error: 'Failed to read diagram' });
      return null;
    }
  };

  const router = express.Router();
  const canRead = auth.requireUser;
  const canWrite = auth.requireRole('admin', 'editor');

  router.get('/diagrams', canRead, async (req, res) => {
    try {
      const out = [];
      for (const name of await fs.readdir(storagePath).catch(() => {
        return [];
      })) {
        if (!name.endsWith('.json') || name === 'metadata.json' || name.startsWith('.')) continue;
        try {
          const id = name.slice(0, -5);
          const stats = await fs.stat(file(id));
          const d = await read(id);
          const p = permissions(req.user, d);
          if (!p.read) continue;
          out.push({
            id,
            name: d.name || d.title || 'Untitled Diagram',
            lastModified: stats.mtime,
            size: stats.size,
            ...(d.modifiedBy ? { modifiedBy: d.modifiedBy } : {}),
            ...(local
              ? {
                  createdBy: d.createdBy ?? null,
                  visibility: accessOf(d).visibility,
                  canEdit: p.write,
                  canManage: p.manage,
                  sharedWithMe: p.shared
                }
              : {})
          });
        } catch (e) {
          console.error(`Skipping ${name}: ${e.message}`);
        }
      }
      res.json(out);
    } catch (e) {
      res.status(500).json({ error: 'Failed to list diagrams', details: e.message });
    }
  });

  router.get('/diagrams/:id', canRead, async (req, res) => {
    const got = await loadOr404(req, res);
    if (got) res.json(forClient(got.d, got.p));
  });

  router.put('/diagrams/:id', canWrite, async (req, res) => {
    const oldId = req.params.id;
    if (!validId(oldId)) return res.status(400).json({ error: 'Invalid diagram id' });
    try {
      let previous = {};
      if (await exists(oldId)) {
        previous = await read(oldId);
        const p = permissions(req.user, previous);
        if (!p.read) return res.status(404).json({ error: 'Diagram not found' });
        if (!p.write) return res.status(403).json({ error: 'You can only view this diagram' });
      }
      const newId = await uniqueId(req.body.name || req.body.title, oldId);
      const data = {
        ...fromClient(req.body),
        id: newId,
        // Kept from the file: when and by whom it was created, and its sharing
        ...(previous.created ? { created: previous.created } : {}),
        ...(previous.owner ? { owner: previous.owner, createdBy: previous.createdBy } : {}),
        ...(previous.access ? { access: previous.access } : {}),
        ...(req.user?.email ? { modifiedBy: req.user.email } : {}),
        lastModified: new Date().toISOString()
      };
      await write(newId, data);
      if (newId !== oldId) await fs.unlink(file(oldId)).catch(() => {});
      res.json({ success: true, id: newId });
    } catch (e) {
      console.error(`Error saving ${oldId}:`, e);
      res.status(500).json({ error: 'Failed to save diagram' });
    }
  });

  router.delete('/diagrams/:id', canWrite, async (req, res) => {
    const got = await loadOr404(req, res);
    if (!got) return;
    if (!got.p.delete) return res.status(403).json({ error: 'Only the owner or an administrator can delete this diagram' });
    await fs.unlink(file(req.params.id));
    res.json({ success: true });
  });

  router.post('/diagrams', canWrite, async (req, res) => {
    try {
      const id = await uniqueId(req.body.name || req.body.title);
      const now = new Date().toISOString();
      await write(id, {
        ...fromClient(req.body),
        id,
        ...(req.user?.email ? { owner: req.user.id, createdBy: req.user.email, modifiedBy: req.user.email } : {}),
        created: now,
        lastModified: now
      });
      res.status(201).json({ success: true, id });
    } catch (e) {
      console.error('Error creating diagram:', e);
      res.status(500).json({ error: 'Failed to create diagram' });
    }
  });

  // --- sharing (logins only) ----------------------------------------------

  const manageOr403 = async (req, res) => {
    if (!local) {
      res.status(404).json({ error: 'Sharing needs logins (AUTH_MODE=local)' });
      return null;
    }
    const got = await loadOr404(req, res);
    if (!got) return null;
    if (!got.p.manage) {
      res.status(403).json({ error: 'Only the owner or an administrator can share this diagram' });
      return null;
    }
    return got;
  };

  const sharingView = (d) => {
    const a = accessOf(d);
    const user = (id) => {
      return auth.store.userById(id);
    };
    return {
      visibility: a.visibility,
      owner: d.createdBy ?? null,
      users: a.users
        .map((s) => {
          const u = user(s.id);
          return u ? { id: u.id, email: u.email, name: u.name, role: u.role, access: s.access } : null;
        })
        .filter(Boolean),
      links: a.links.map((l) => {
        return { id: l.id, prefix: l.prefix, createdAt: l.createdAt, createdBy: l.createdBy, expiresAt: l.expiresAt };
      }),
      // Who it can be shared with
      people: auth.store.users
        .filter((u) => {
          return !u.disabled && u.id !== d.owner;
        })
        .map((u) => {
          return { id: u.id, email: u.email, name: u.name, role: u.role };
        })
    };
  };

  router.get('/diagrams/:id/sharing', canRead, async (req, res) => {
    const got = await manageOr403(req, res);
    if (got) res.json(sharingView(got.d));
  });

  // Visibility and the people it's shared with (sent whole)
  router.put('/diagrams/:id/sharing', canRead, async (req, res) => {
    const got = await manageOr403(req, res);
    if (!got) return;
    const { visibility, users } = req.body || {};
    if (visibility !== undefined && !['team', 'private'].includes(visibility)) {
      return res.status(400).json({ error: 'Visibility must be team or private' });
    }
    const list = users === undefined ? accessOf(got.d).users : users;
    if (!Array.isArray(list)) return res.status(400).json({ error: 'users must be a list' });
    const clean = [];
    for (const s of list) {
      if (!auth.store.userById(s?.id)) return res.status(400).json({ error: 'Unknown user' });
      if (!['view', 'edit'].includes(s.access)) return res.status(400).json({ error: 'Access must be view or edit' });
      if (s.id !== got.d.owner && !clean.some((c) => c.id === s.id)) clean.push({ id: s.id, access: s.access });
    }
    const a = accessOf(got.d);
    got.d.access = { ...a, visibility: visibility ?? a.visibility, users: clean };
    await write(req.params.id, got.d);
    res.json(sharingView(got.d));
  });

  router.post('/diagrams/:id/links', canRead, async (req, res) => {
    const got = await manageOr403(req, res);
    if (!got) return;
    const days = req.body?.expiresInDays ? Number(req.body.expiresInDays) : null;
    if (days !== null && (!Number.isFinite(days) || days < 1 || days > 3650)) {
      return res.status(400).json({ error: 'Invalid expiry' });
    }
    const token = `${LINK_PREFIX}${crypto.randomBytes(24).toString('base64url')}`;
    const link = {
      id: crypto.randomUUID(),
      hash: sha256(token),
      prefix: token.slice(0, 10),
      createdAt: new Date().toISOString(),
      createdBy: req.user.email,
      expiresAt: days ? new Date(Date.now() + days * 864e5).toISOString() : null
    };
    const a = accessOf(got.d);
    got.d.access = { ...a, links: [...a.links, link] };
    await write(req.params.id, got.d);
    // The only time the link's token is shown
    res.status(201).json({ id: link.id, token, expiresAt: link.expiresAt });
  });

  router.delete('/diagrams/:id/links/:linkId', canRead, async (req, res) => {
    const got = await manageOr403(req, res);
    if (!got) return;
    const a = accessOf(got.d);
    const links = a.links.filter((l) => {
      return l.id !== req.params.linkId;
    });
    if (links.length === a.links.length) return res.status(404).json({ error: 'No such link' });
    got.d.access = { ...a, links };
    await write(req.params.id, got.d);
    res.json({ success: true });
  });

  // --- share links: read-only, no login needed ------------------------------

  router.get('/shared/:token', async (req, res) => {
    const token = String(req.params.token);
    if (!local || !token.startsWith(LINK_PREFIX)) return res.status(404).json({ error: 'Link not found' });
    const hash = sha256(token);
    for (const name of await fs.readdir(storagePath).catch(() => {
      return [];
    })) {
      if (!name.endsWith('.json') || name.startsWith('.')) continue;
      try {
        const d = await read(name.slice(0, -5));
        const link = accessOf(d).links.find((l) => {
          return l.hash === hash;
        });
        if (!link) continue;
        if (link.expiresAt && Date.now() > Date.parse(link.expiresAt)) {
          return res.status(410).json({ error: 'This link has expired' });
        }
        return res.json(forClient(d, { write: false, manage: false }));
      } catch {
        // not a diagram
      }
    }
    res.status(404).json({ error: 'Link not found' });
  });

  return router;
};
