// The MCP server over HTTP (Streamable HTTP, stateless): for running next to
// ArchFlow on a server, e.g. inside the Docker image. Every request needs the
// token: "Authorization: Bearer <token>".
import { timingSafeEqual } from 'node:crypto';
import { createServer as createHttpServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './server.js';
import type { DiagramStore } from './storage.js';

export interface HttpOptions {
  port: number;
  host: string;
  token: string;
  path?: string;
  // The store for one request (it may depend on the address the client used)
  storeFor: (req: IncomingMessage) => DiagramStore;
}

const MAX_BODY = 10 * 1024 * 1024;

const sendJson = (res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) => {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(JSON.stringify(body));
};

// A JSON-RPC error, which MCP clients show to the user
const rpcError = (res: ServerResponse, status: number, message: string, headers: Record<string, string> = {}) => {
  sendJson(res, status, { jsonrpc: '2.0', error: { code: -32000, message }, id: null }, headers);
};

const tokenMatches = (header: string | undefined, token: string) => {
  const m = header?.match(/^Bearer\s+(.+)$/i);
  if (!m) return false;
  const a = Buffer.from(m[1].trim());
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
};

const readBody = (req: IncomingMessage) => {
  return new Promise<unknown>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error('Request too large'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || 'null'));
      } catch {
        reject(new Error('The request body is not JSON'));
      }
    });
    req.on('error', reject);
  });
};

// The address the client used to reach us (behind nginx or another proxy)
export const publicUrlOf = (req: IncomingMessage) => {
  const first = (v: string | string[] | undefined) => {
    return (Array.isArray(v) ? v[0] : v)?.split(',')[0].trim();
  };
  const host = first(req.headers['x-forwarded-host']) || first(req.headers.host);
  if (!host) return undefined;
  const proto = first(req.headers['x-forwarded-proto']) || 'http';
  return `${proto}://${host}`;
};

export const startHttpServer = (opts: HttpOptions): Promise<Server> => {
  const path = opts.path ?? '/mcp';
  const server = createHttpServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname !== path) return sendJson(res, 404, { error: 'Not found' });
    if (!tokenMatches(req.headers.authorization, opts.token)) {
      return rpcError(res, 401, 'Missing or wrong token (Authorization: Bearer <MCP_TOKEN>)', {
        'WWW-Authenticate': 'Bearer'
      });
    }
    // Stateless: no server-to-client stream and no sessions to end
    if (req.method !== 'POST') return rpcError(res, 405, 'Method not allowed', { Allow: 'POST' });

    let body: unknown;
    try {
      body = await readBody(req);
    } catch (e) {
      return rpcError(res, 400, (e as Error).message);
    }

    const mcp = createServer(opts.storeFor(req));
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on('close', () => {
      void transport.close();
      void mcp.close();
    });
    try {
      await mcp.connect(transport);
      await transport.handleRequest(req, res, body);
    } catch (e) {
      if (!res.headersSent) rpcError(res, 500, `Internal error: ${(e as Error).message}`);
    }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(opts.port, opts.host, () => {
      return resolve(server);
    });
  });
};
