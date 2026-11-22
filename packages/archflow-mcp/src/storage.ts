// Where diagrams are kept: ArchFlow's server storage (Docker, through its
// API) or a folder of JSON files (the desktop app's Documents/ArchFlow).
import { existsSync, readFileSync } from 'node:fs';
import { access, mkdir, readFile, readdir, stat, unlink, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import type { Diagram } from './model.js';

export interface DiagramInfo {
  id: string;
  name: string;
  lastModified?: string;
}

export interface DiagramStore {
  // Human-readable description of where diagrams go
  readonly where: string;
  list(): Promise<DiagramInfo[]>;
  load(id: string): Promise<Diagram>;
  // Both return the id the diagram is stored under (it follows the name)
  create(diagram: Diagram): Promise<string>;
  save(id: string, diagram: Diagram): Promise<string>;
  // Where the user can see it: a link or a file path
  locate(id: string): string;
}

export class StoreError extends Error {}

// Same rules as the app: the file name follows the diagram name
export const sanitizeFilename = (name: string) => {
  const cleaned = (name || 'Untitled Diagram')
    // eslint-disable-next-line no-control-regex
    .replace(/[\\/?%*:|"<>\x00-\x1f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 150);
  return cleaned || 'Untitled Diagram';
};

const nameOf = (d: Diagram) => {
  return (d.name as string) || d.title || 'Untitled Diagram';
};

// ---------------------------------------------------------------------------

export class HttpStore implements DiagramStore {
  readonly where: string;
  private base: string;
  private publicUrl: string;

  // `url` is where the API is reached; `publicUrl` is the address people open
  // ArchFlow at, for links (they differ inside the Docker container)
  constructor(
    url: string,
    private token?: string,
    publicUrl?: string
  ) {
    this.base = url.replace(/\/+$/, '');
    this.publicUrl = (publicUrl || url).replace(/\/+$/, '');
    this.where = `ArchFlow server at ${this.publicUrl}`;
  }

  private async call(path: string, init: RequestInit = {}) {
    let res: Response;
    try {
      res = await fetch(`${this.base}/api${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
          ...(init.headers ?? {})
        }
      });
    } catch (e) {
      throw new StoreError(`Can't reach ArchFlow at ${this.base} (${(e as Error).message}). Is it running?`);
    }
    const body = await res.json().catch(() => {
      return null;
    });
    if (res.status === 404 && body?.error === 'Diagram not found') throw new StoreError('Diagram not found');
    if (res.status === 503 || body?.error === 'Server storage is disabled') {
      throw new StoreError(`Server storage is turned off in ArchFlow at ${this.base} (ENABLE_SERVER_STORAGE)`);
    }
    if (!res.ok) throw new StoreError(`ArchFlow answered ${res.status}: ${body?.error ?? res.statusText}`);
    return body;
  }

  async list() {
    const list = (await this.call('/diagrams')) as DiagramInfo[];
    return list.map((d) => {
      return { id: d.id, name: d.name, lastModified: d.lastModified };
    });
  }

  async load(id: string) {
    return (await this.call(`/diagrams/${encodeURIComponent(id)}`)) as Diagram;
  }

  async create(diagram: Diagram) {
    const r = await this.call('/diagrams', {
      method: 'POST',
      body: JSON.stringify({ ...diagram, name: nameOf(diagram) })
    });
    return r.id as string;
  }

  async save(id: string, diagram: Diagram) {
    const r = await this.call(`/diagrams/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ ...diagram, name: nameOf(diagram) })
    });
    return (r.id as string) ?? id;
  }

  locate(id: string) {
    // Read-only view; to edit, open it in "My diagrams"
    return `${this.publicUrl}/display/${encodeURIComponent(id)}`;
  }
}

// ---------------------------------------------------------------------------

export class FolderStore implements DiagramStore {
  readonly where: string;

  constructor(private dir: string) {
    this.where = `folder ${dir}`;
  }

  private path(id: string) {
    if (id.includes('/') || id.includes('\\') || id.startsWith('.')) throw new StoreError(`Invalid diagram id "${id}"`);
    return join(this.dir, `${id}.json`);
  }

  private async exists(id: string) {
    try {
      await access(this.path(id));
      return true;
    } catch {
      return false;
    }
  }

  // " (2)", " (3)"... when another diagram already has the name
  private async uniqueId(name: string, keepId?: string) {
    const base = sanitizeFilename(name);
    let candidate = base;
    for (let n = 2; candidate !== keepId && (await this.exists(candidate)); n++) candidate = `${base} (${n})`;
    return candidate;
  }

  async list() {
    await mkdir(this.dir, { recursive: true });
    const out: DiagramInfo[] = [];
    for (const file of await readdir(this.dir)) {
      if (!file.endsWith('.json')) continue;
      try {
        const p = join(this.dir, file);
        const data = JSON.parse(await readFile(p, 'utf8'));
        out.push({ id: file.replace(/\.json$/, ''), name: nameOf(data), lastModified: (await stat(p)).mtime.toISOString() });
      } catch {
        // Not a diagram - skip
      }
    }
    return out;
  }

  async load(id: string) {
    try {
      return JSON.parse(await readFile(this.path(id), 'utf8')) as Diagram;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') throw new StoreError('Diagram not found');
      throw e;
    }
  }

  async create(diagram: Diagram) {
    await mkdir(this.dir, { recursive: true });
    const id = await this.uniqueId(nameOf(diagram));
    const now = new Date().toISOString();
    await writeFile(
      this.path(id),
      JSON.stringify({ ...diagram, name: nameOf(diagram), id, created: now, lastModified: now }, null, 2)
    );
    return id;
  }

  async save(id: string, diagram: Diagram) {
    const newId = await this.uniqueId(nameOf(diagram), id);
    await writeFile(
      this.path(newId),
      JSON.stringify({ ...diagram, name: nameOf(diagram), id: newId, lastModified: new Date().toISOString() }, null, 2)
    );
    if (newId !== id) await unlink(this.path(id)).catch(() => {});
    return newId;
  }

  locate(id: string) {
    return this.path(id);
  }
}

// ---------------------------------------------------------------------------

// The user's Documents folder, as the desktop app (Electron) finds it
export const documentsDir = () => {
  const home = homedir();
  if (process.platform === 'linux') {
    const config = process.env.XDG_CONFIG_HOME || join(home, '.config');
    const file = join(config, 'user-dirs.dirs');
    if (existsSync(file)) {
      const m = readFileSync(file, 'utf8').match(/^XDG_DOCUMENTS_DIR="?([^"\n]+)"?/m);
      if (m) return m[1].replace('$HOME', home);
    }
  }
  return join(home, 'Documents');
};

export const storeFromEnv = (env = process.env, publicUrl?: string): DiagramStore => {
  if (env.ARCHFLOW_URL) {
    return new HttpStore(env.ARCHFLOW_URL, env.ARCHFLOW_TOKEN, env.ARCHFLOW_PUBLIC_URL || publicUrl);
  }
  return new FolderStore(resolve(env.ARCHFLOW_DIR || join(documentsDir(), 'ArchFlow')));
};
