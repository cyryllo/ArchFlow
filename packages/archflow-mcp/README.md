# archflow-mcp

MCP server for [ArchFlow](https://github.com/cyryllo/ArchFlow), the free isometric diagram editor. It lets AI assistants (Claude Desktop, Claude Code and other MCP clients) **build and change ArchFlow diagrams**: nodes with 177 icons, coloured zones, labelled connectors and texts, laid out automatically on the isometric grid.

Describe a system in plain words. The assistant builds the diagram, saves it where ArchFlow keeps its diagrams, and you open it in *My diagrams*.

## Setup

Requires Node.js 18+.

**Claude Code**

~~~bash
claude mcp add archflow --scope user -e ARCHFLOW_URL=http://localhost:9500 -- npx -y archflow-mcp
~~~

**Claude Desktop**: Settings → Developer → Edit Config:

~~~json
{
  "mcpServers": {
    "archflow": {
      "command": "npx",
      "args": ["-y", "archflow-mcp"],
      "env": { "ARCHFLOW_URL": "http://localhost:9500" }
    }
  }
}
~~~

**Where diagrams go**

| Variable | Meaning |
|---|---|
| `ARCHFLOW_URL` | Address of ArchFlow running in Docker, e.g. `http://localhost:9500` (server storage) |
| `ARCHFLOW_DIR` | A folder of diagram files |
| *(neither)* | `Documents/ArchFlow`, the folder of the ArchFlow desktop app |
| `ARCHFLOW_TOKEN` | Access token, for ArchFlow instances that require one |

## Tools

`list_icons`, `list_diagrams`, `get_diagram`, `build_diagram`, `add_nodes`, `update_node`, `remove_node`, `add_connectors`, `remove_connector`, `add_zone`, `remove_zone`, `add_text`, `rename_diagram`, `export_json`.

Every diagram is validated with ArchFlow's own rules before it is saved. Mistakes such as an unknown icon go back to the assistant with suggestions.

Full guide with examples: **[docs/mcp.md](https://github.com/cyryllo/ArchFlow/blob/master/docs/mcp.md)** ([Polski](https://github.com/cyryllo/ArchFlow/blob/master/docs/mcp.pl.md)).

## License

MIT
