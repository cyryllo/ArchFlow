# AI assistants (MCP)

<p align="right">
 <b>English</b> | <a href="mcp.pl.md">Polski</a>
</p>

ArchFlow has an **MCP server**, `archflow-mcp`. It lets AI assistants such as Claude Desktop, Claude Code or any other app that supports the Model Context Protocol draw ArchFlow diagrams for you. Describe what you need in plain words, for example *"draw our shop's architecture: browser, load balancer, two app servers, PostgreSQL with a replica"*. The assistant builds the diagram and saves it, and you open it in ArchFlow like any other.

The assistant can:

- create whole diagrams, with nodes, coloured zones, connectors with labels, and texts;
- change existing ones: add or remove nodes and connectors, rename things, change icons, add zones;
- read your diagrams and answer questions about them;
- find icons by name in any of ArchFlow's languages.

You don't need to place anything by hand: ArchFlow's server lays out the nodes on the isometric grid. Zones go left to right, like layers of an architecture. Afterwards you can move things around in ArchFlow as usual.

You need [Node.js](https://nodejs.org/) 18 or newer on the computer where the assistant runs.

## 1. Choose where the diagrams go

The MCP server saves diagrams to the same place ArchFlow reads them from:

| You use ArchFlow… | Setting | You'll find the diagrams in |
|---|---|---|
| in **Docker** on your server | `ARCHFLOW_URL=http://your-server:9500` | *My diagrams* in the browser |
| as the **desktop app** | nothing (the default) | *My diagrams* in the app (`Documents/ArchFlow`) |
| with files in **another folder** | `ARCHFLOW_DIR=/path/to/folder` | ☰ → *Open from file (JSON)* |

Use the address you open ArchFlow at in the browser, e.g. `http://localhost:9500` (ArchFlow started with `compose.yml`) or `http://localhost:3000` (the development `compose.dev.yml`). Server storage must be on: it is by default in the Docker image.

## 2. Add it to your assistant

### Claude Code

One command in a terminal. Add `-e ARCHFLOW_URL=…` for Docker:

~~~bash
claude mcp add archflow --scope user -e ARCHFLOW_URL=http://localhost:9500 -- npx -y archflow-mcp@latest
~~~

For the desktop app's folder leave the `-e` part out. `--scope user` makes ArchFlow available in all your projects. Check it with `claude mcp list`.

`@latest` makes `npx` always take the newest version from npm. It also works inside a clone of the ArchFlow repository; plain `archflow-mcp` doesn't work there (see [Troubleshooting](#troubleshooting)).

#### Claude Code in VS Code (only the extension installed)

If the terminal says `claude: command not found`, you have only the VS Code extension. It contains the same program, so call it by its full path:

~~~bash
$(ls -d ~/.vscode/extensions/anthropic.claude-code-*/resources/native-binary/claude | tail -1) \
  mcp add archflow --scope user -e ARCHFLOW_URL=http://localhost:9500 -- npx -y archflow-mcp@latest
~~~

On Windows the extension is in `%USERPROFILE%\.vscode\extensions\anthropic.claude-code-…\resources\native-binary\claude.exe`. You can also [install the `claude` command](https://docs.anthropic.com/en/docs/claude-code/setup). It uses the same settings as the extension.

Another way, for one project only: put a `.mcp.json` file in the project folder. Claude Code asks you to approve it the first time:

~~~json
{
  "mcpServers": {
    "archflow": {
      "command": "npx",
      "args": ["-y", "archflow-mcp@latest"],
      "env": { "ARCHFLOW_URL": "http://localhost:9500" }
    }
  }
}
~~~

#### Then start a new conversation

MCP servers start together with a conversation, so ArchFlow's tools appear in the **next** one. Type `/mcp` in Claude Code to see whether `archflow` is connected; you can reconnect it there.

### Claude Desktop

1. Open **Settings → Developer → Edit Config**. That opens `claude_desktop_config.json`.
2. Add `archflow` to `mcpServers`:

~~~json
{
  "mcpServers": {
    "archflow": {
      "command": "npx",
      "args": ["-y", "archflow-mcp@latest"],
      "env": { "ARCHFLOW_URL": "http://localhost:9500" }
    }
  }
}
~~~

3. Restart Claude Desktop. ArchFlow's tools appear under the tools (🔨) icon.

For the desktop app's folder remove the `env` line.

### Other MCP clients

Run `npx -y archflow-mcp@latest` as a **stdio** server, with the variables from step 1 in its environment. `npx -y archflow-mcp@latest --help` shows the options.

## 3. Try it

Ask in your own words, in any language. For example:

- *"Draw a diagram of a web shop: customers (browser, mobile app), entry (load balancer, API gateway), services (orders, payments, event queue), data (PostgreSQL, Redis, data warehouse). Add the order process below: new order, accept, paid?, shipping, delivered."*
- *"In the diagram Online shop, add a search service next to the database and connect orders to it."*
- *"Which services in Online shop talk to the database?"*
- *"Rename the diagram to Shop v2 and export it to ~/Desktop/shop.json."*

The assistant tells you where it saved the diagram. Behind the scenes it usually looks up icons with `list_icons`, builds the whole diagram with one `build_diagram` call, and then fixes details with the smaller tools. The first time, Claude Code asks you to allow each ArchFlow tool; choose to always allow them if you don't want to be asked again.

## 4. Open the result

- **Docker / desktop app:** open **My diagrams** and load the diagram. If *My diagrams* was already open, close and open it again to refresh the list.
- **Folder:** ☰ → **Open from file (JSON)**.

> **Don't edit the same diagram in two places at once.** Every change the assistant makes is saved right away. If you have that diagram open in ArchFlow while the assistant changes it, load it again from *My diagrams* before you continue. Otherwise saving your open copy overwrites the assistant's changes.

## Tools

| Tool | What it does |
|---|---|
| `list_icons` | Finds icons by name in any language, or lists them all by category |
| `list_diagrams` | Lists your diagrams |
| `get_diagram` | Reads a diagram: nodes, zones, connectors, texts |
| `build_diagram` | Creates a whole diagram in one go, laid out automatically |
| `add_nodes`, `update_node`, `remove_node` | Adds, changes or removes nodes |
| `add_connectors`, `remove_connector` | Connects nodes, with labels and line styles |
| `add_zone`, `remove_zone` | Coloured zones under groups of nodes |
| `add_text` | Text on the canvas |
| `rename_diagram` | Changes a diagram's title |
| `export_json` | Saves a diagram to a JSON file |

Before anything is saved, the diagram is checked the same way ArchFlow checks it when opening. A mistake, such as an icon that doesn't exist, goes back to the assistant with a hint, and nothing broken is saved.

## Good to know

- **Layout** is automatic but simple. Zones go in rows from left to right, nodes inside a zone form a small grid, and a zone can also be a single row, which suits a process. You can ask for exact positions, or move things in ArchFlow afterwards.
- **Docker and access:** the MCP server uses the same API as ArchFlow in the browser. ArchFlow in Docker doesn't have logins yet, so anyone who can open it can also change diagrams. Keep it on a trusted network. Logins are planned.
- **Coming next:** the MCP server built into the Docker image (over HTTP), so it doesn't have to run on your computer.

## Troubleshooting

| What you see | What to do |
|---|---|
| The assistant doesn't have ArchFlow's tools, or `/mcp` shows *Connection closed* | Start a new conversation. In `/mcp` choose *archflow* → *Reconnect*. Check that the command ends with `archflow-mcp@latest`. Inside a clone of the ArchFlow repository, plain `archflow-mcp` picks the unbuilt local package and fails with `archflow-mcp: not found`. |
| Not sure the server starts at all | Run `npx -y archflow-mcp@latest --version` in a terminal. It should print the version; if not, install or update Node.js (18+). |
| *Can't reach ArchFlow at …* | Check the address: open it in a browser. `curl http://localhost:9500/api/storage/status` should answer `{"enabled":true,…}`. ArchFlow from `compose.yml` listens on port 9500, the development setup (`compose.dev.yml`) on 3000. |
| *Server storage is turned off* | Set `ENABLE_SERVER_STORAGE=true` for the container (the default in the image). |
| The diagram isn't in *My diagrams* | Close *My diagrams* and open it again. Make sure you're looking at the ArchFlow the server saves to: the same address, or the desktop app when there's no `ARCHFLOW_URL`. |
| The assistant writes files or code instead of using the tools | Ask it to "use the archflow tools", and check `/mcp`. |

## Without MCP

If your AI tool can't use MCP, ask it to write a file in ArchFlow's compact format and open that with ☰ → *Open from file (JSON)*. The format and all icon ids are described in [LLM-GENERATION-GUIDE.md](../LLM-GENERATION-GUIDE.md).

## Running from the source code

To try a development version, or to use it before the npm package, build it from a clone of the repository:

~~~bash
git clone https://github.com/cyryllo/ArchFlow.git
cd ArchFlow
npm install
npm run build --workspace=packages/archflow-mcp
~~~

Then use `node /full/path/to/ArchFlow/packages/archflow-mcp/dist/index.js` instead of `npx -y archflow-mcp@latest` in the steps above. `npm test --workspace=packages/archflow-mcp` runs its tests.
