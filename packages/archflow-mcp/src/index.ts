#!/usr/bin/env node
// archflow-mcp: the ArchFlow MCP server over stdio (for Claude Desktop,
// Claude Code and other MCP clients).
//
// Where diagrams go:
//   ARCHFLOW_URL=http://localhost:8080  ArchFlow in Docker (server storage)
//   ARCHFLOW_DIR=/path/to/folder        a folder of diagram files
//   (neither)                           Documents/ArchFlow, like the desktop app
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { VERSION, createServer } from './server.js';
import { storeFromEnv } from './storage.js';

const arg = process.argv[2];
if (arg === '--version' || arg === '-v') {
  console.log(VERSION);
  process.exit(0);
}
if (arg === '--help' || arg === '-h') {
  console.log(`archflow-mcp ${VERSION} - MCP server for ArchFlow diagrams (stdio)

Environment:
  ARCHFLOW_URL    address of ArchFlow in Docker, e.g. http://localhost:8080
  ARCHFLOW_TOKEN  access token, if your ArchFlow requires one
  ARCHFLOW_DIR    folder for diagram files (default: Documents/ArchFlow)

Docs: https://github.com/cyryllo/ArchFlow/blob/master/docs/mcp.md`);
  process.exit(0);
}

const store = storeFromEnv();
const server = createServer(store);
await server.connect(new StdioServerTransport());
// stdout is the protocol channel; messages for people go to stderr
console.error(`archflow-mcp ${VERSION}: diagrams in the ${store.where}`);
