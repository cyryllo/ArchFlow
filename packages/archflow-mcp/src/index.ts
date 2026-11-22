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
import { publicUrlOf, startHttpServer } from './http.js';
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
  archflow-mcp --http [--port 3002] [--host 127.0.0.1]
                                       HTTP at /mcp, requires MCP_TOKEN

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
  const token = process.env.MCP_TOKEN?.trim();
  if (!token || token.length < 16) {
    console.error('archflow-mcp --http needs MCP_TOKEN (at least 16 characters), e.g.: export MCP_TOKEN=$(openssl rand -hex 32)');
    process.exit(1);
  }
  const port = Number(option('--port') ?? process.env.MCP_PORT ?? 3002);
  const host = option('--host') ?? process.env.MCP_HOST ?? '127.0.0.1';
  await startHttpServer({
    port,
    host,
    token,
    storeFor: (req) => {
      return storeFromEnv(process.env, publicUrlOf(req));
    }
  });
  console.error(`archflow-mcp ${VERSION}: HTTP on http://${host}:${port}/mcp, diagrams in the ${storeFromEnv().where}`);
} else {
  const store = storeFromEnv();
  await createServer(store).connect(new StdioServerTransport());
  // stdout is the protocol channel; messages for people go to stderr
  console.error(`archflow-mcp ${VERSION}: diagrams in the ${store.where}`);
}
