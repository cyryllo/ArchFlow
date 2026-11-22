#!/usr/bin/env node
// archflow-mcp: the ArchFlow MCP server.
//
//   archflow-mcp           over stdio (Claude Desktop, Claude Code and other
//                          MCP clients start it themselves)
//   archflow-mcp --http    over HTTP at /mcp, for running on a server; needs
//                          MCP_TOKEN, which clients send as a Bearer token
//
// Where diagrams go:
//   ARCHFLOW_URL=http://localhost:9500  ArchFlow in Docker (server storage)
//   ARCHFLOW_DIR=/path/to/folder        a folder of diagram files
//   (neither)                           Documents/ArchFlow, like the desktop app
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { bearerOf, publicUrlOf, startHttpServer } from './http.js';
import { VERSION, createServer } from './server.js';
import { storeFromEnv } from './storage.js';

const args = process.argv.slice(2);
const option = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

if (args.includes('--version') || args.includes('-v')) {
  console.log(VERSION);
  process.exit(0);
}
if (args.includes('--help') || args.includes('-h')) {
  console.log(`archflow-mcp ${VERSION} - MCP server for ArchFlow diagrams

Usage:
  archflow-mcp                         stdio (default)
  archflow-mcp --http [--port 3002] [--host 127.0.0.1] [--auth archflow]
                                       HTTP at /mcp; requires MCP_TOKEN, or with
                                       --auth archflow the users' own ArchFlow
                                       tokens (ArchFlow with logins)

Environment:
  ARCHFLOW_URL         address of ArchFlow in Docker, e.g. http://localhost:9500
  ARCHFLOW_PUBLIC_URL  address people open ArchFlow at, for links (HTTP mode
                       works it out from the request when not set)
  ARCHFLOW_TOKEN       access token, if your ArchFlow requires one
  ARCHFLOW_DIR         folder for diagram files (default: Documents/ArchFlow)
  MCP_TOKEN            token clients must send in HTTP mode
                       (Authorization: Bearer <token>)
  MCP_PORT, MCP_HOST   defaults for --port and --host

Docs: https://github.com/cyryllo/ArchFlow/blob/master/docs/mcp.md`);
  process.exit(0);
}

if (args.includes('--http')) {
  const port = Number(option('--port') ?? process.env.MCP_PORT ?? 3002);
  const host = option('--host') ?? process.env.MCP_HOST ?? '127.0.0.1';
  // --auth archflow: clients use their own ArchFlow tokens (logins on);
  // otherwise one shared MCP_TOKEN
  const archflowAuth = option('--auth') === 'archflow';
  const token = process.env.MCP_TOKEN?.trim();
  if (archflowAuth && !process.env.ARCHFLOW_URL) {
    console.error('archflow-mcp --http --auth archflow needs ARCHFLOW_URL');
    process.exit(1);
  }
  if (!archflowAuth && (!token || token.length < 16)) {
    console.error('archflow-mcp --http needs MCP_TOKEN (at least 16 characters), e.g.: export MCP_TOKEN=$(openssl rand -hex 32)');
    process.exit(1);
  }
  await startHttpServer({
    port,
    host,
    auth: archflowAuth ? { kind: 'archflow', url: process.env.ARCHFLOW_URL! } : { kind: 'token', token: token! },
    storeFor: (req) => {
      // With ArchFlow tokens, the client's token is used for every change,
      // so ArchFlow applies that user's rights
      const env = archflowAuth ? { ...process.env, ARCHFLOW_TOKEN: bearerOf(req) } : process.env;
      return storeFromEnv(env, publicUrlOf(req));
    }
  });
  console.error(
    `archflow-mcp ${VERSION}: HTTP on http://${host}:${port}/mcp (${archflowAuth ? 'ArchFlow user tokens' : 'MCP_TOKEN'}), diagrams in the ${storeFromEnv().where}`
  );
} else {
  const store = storeFromEnv();
  await createServer(store).connect(new StdioServerTransport());
  // stdout is the protocol channel; messages for people go to stderr
  console.error(`archflow-mcp ${VERSION}: diagrams in the ${store.where}`);
}
