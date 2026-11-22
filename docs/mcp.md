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

There are two ways to run it:

- **On your computer** (steps 1 to 4 below). The assistant starts the server itself. You need [Node.js](https://nodejs.org/) 18 or newer. It works with the desktop app, a folder of files and ArchFlow in Docker.
- **Inside the Docker image** ([MCP in Docker](#mcp-in-docker-over-http)). You turn it on with one setting on the server, and assistants connect over HTTP with a token. You install nothing on your computer. It works with assistants that support remote MCP servers, such as Claude Code.

It also works with local models, e.g. through Ollama: see [Local models](#local-models-ollama-and-others).

## 1. Choose where the diagrams go

The MCP server saves diagrams to the same place ArchFlow reads them from:

| You use ArchFlow… | Setting | You'll find the diagrams in |
|---|---|---|
| in **Docker** on your server | `ARCHFLOW_URL=http://your-server:9500` | *My diagrams* in the browser |
| as the **desktop app** | nothing (the default) | *My diagrams* in the app (`Documents/ArchFlow`) |
| with files in **another folder** | `ARCHFLOW_DIR=/path/to/folder` | ☰ → *Open from file (JSON)* |

Use the address you open ArchFlow at in the browser, e.g. `http://localhost:9500` (ArchFlow started with `compose.yml`) or `http://localhost:3000` (the development `compose.dev.yml`). Server storage must be on: it is by default in the Docker image. If your ArchFlow has logins (the default `compose.yml` from 0.9.0), also set `ARCHFLOW_TOKEN` to your personal token from *Account* (see [With logins](#with-logins-the-default-from-090)).

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

## MCP in Docker (over HTTP)

The Docker image (0.8.1 or newer) contains the MCP server. How you connect depends on whether your ArchFlow has logins.

### With logins (the default from 0.9.0)

The server is always on, and **each person uses their own token**:

1. In ArchFlow open your name at the top (or ☰ → *Account*) and create a token in *Tokens for AI assistants and the API*. Choose *Read and change*, or *Read only* for an assistant that should only answer questions.
2. ArchFlow shows the token once, together with the ready `claude mcp add …` command for Claude Code. Copy it and run it in a terminal.

The assistant then works with your rights: a viewer's token can't change anything, and a revoked token stops working at once. If *Tokens* says access isn't turned on, ask the administrator (*Users and settings* → *API and MCP*). More in the [Docker guide](docker.md#accounts-and-logins).

### Without logins (`AUTH_MODE=none`): one shared token

The server is off until you give it a token.


1. **Make a token**, a long random string:

   ~~~bash
   openssl rand -hex 32
   ~~~

2. **Give it to the container.** In the folder with `compose.yml`, put it in `.env` and restart:

   ~~~bash
   echo "MCP_TOKEN=paste-the-token-here" >> .env
   docker compose up -d
   ~~~

   With `docker run`, add `-e MCP_TOKEN=…`. The MCP server saves through ArchFlow's server storage, so `ENABLE_SERVER_STORAGE` must stay `true`, which is the default.

3. **Check it.** `curl -X POST http://your-server:9500/mcp` should answer *Missing or wrong token*. That means the server is on and waits for the token. *The ArchFlow MCP server is off* means the container didn't get `MCP_TOKEN`.

4. **Connect the assistant.** In Claude Code:

   ~~~bash
   claude mcp add --transport http archflow --scope user http://your-server:9500/mcp \
     --header "Authorization: Bearer paste-the-token-here"
   ~~~

   Or for one project, in `.mcp.json`:

   ~~~json
   {
     "mcpServers": {
       "archflow": {
         "type": "http",
         "url": "http://your-server:9500/mcp",
         "headers": { "Authorization": "Bearer paste-the-token-here" }
       }
     }
   }
   ~~~

   Other assistants need support for remote MCP servers over **Streamable HTTP** with your own header. Claude Desktop's config file starts only local servers, so set it up as in step 2 above (`npx` with `ARCHFLOW_URL`).

Then continue with [Try it](#3-try-it). The links the assistant gives use the address it connected to.

**Keep the token secret.** It gives full access to all diagrams. Don't commit `.env` to git. Use HTTPS (a reverse proxy in front of ArchFlow) if you reach the server over the internet. To change the token, edit `.env` and run `docker compose up -d` again, then update the assistant.

The same HTTP server also runs outside Docker: `MCP_TOKEN=… npx -y archflow-mcp@latest --http --port 3002`, which listens on `127.0.0.1` by default (`--host 0.0.0.0` for all addresses). `--help` lists the options.

## Local models (Ollama and others)

Yes, you can use ArchFlow's MCP server with a model on your own computer. You need an app between the two. Ollama, LM Studio or llama.cpp only run the model and don't talk to MCP servers. An **MCP client** does: it sends your request to the local model and runs the tools the model asks for.

| App | Runs the model with | Adding ArchFlow |
|---|---|---|
| [Open WebUI](https://docs.openwebui.com/features/extensibility/mcp) (0.6.31+) | Ollama | *Admin Settings → External Tools → Add Server*, type **MCP (Streamable HTTP)**, URL `http://your-server:9500/mcp`, Bearer auth with your token. It connects to [MCP in Docker](#mcp-in-docker-over-http) only. If Open WebUI itself runs in Docker, use the server's IP address, not `localhost`. |
| [Continue](https://docs.continue.dev/customize/deep-dives/mcp) (VS Code, JetBrains) | Ollama | In **agent** mode; a file `.continue/mcpServers/archflow.yaml`, shown below |
| [Goose](https://block.github.io/goose/) (desktop app, terminal) | Ollama | Add a custom **command-line (stdio)** extension: command `npx -y archflow-mcp@latest`, environment variable `ARCHFLOW_URL` |
| [MCPHost](https://github.com/mark3labs/mcphost) (terminal) | Ollama | `mcphost --model ollama:<model> --config <file>`; config format in its README |
| [LM Studio](https://lmstudio.ai/docs/app/mcp) | itself | *Program → Install → Edit mcp.json*, the same format as Claude Desktop (step 2) |

Continue, `.continue/mcpServers/archflow.yaml`:

~~~yaml
name: ArchFlow
version: 0.0.1
schema: v1
mcpServers:
  - name: archflow
    command: npx
    args: ["-y", "archflow-mcp@latest"]
    env:
      ARCHFLOW_URL: http://localhost:9500
~~~

**Choosing a model**

- The model must support **tool calling**. Ollama marks such models with *tools* in its library.
- **Bigger models work better.** We tried the homelab example ("router, switch, Proxmox with three VMs, NAS, Raspberry Pi; group it into zones") with `qwen3:30b-a3b` and `gemma4:26b`. Both built a correct diagram in a few minutes on a desktop GPU; gemma fixed its own mistake after the first error. Models of 7 to 8B often struggle with the long description of `build_diagram`.
- **Give it enough context**, at least 16 to 32 thousand tokens. The tool descriptions and the icon list take several thousand, and Ollama's default is smaller. Set `num_ctx` in the app, or start Ollama with `OLLAMA_CONTEXT_LENGTH=32768 ollama serve`.
- Local models like to make up icon ids, such as `raspberry-pi`. The server replaces an unknown id with the closest icon and tells the model which one it used.

ArchFlow's MCP server itself is tested with Claude Code and with a local model through our own test client. The apps in the table are listed because they support MCP; their menus can change between versions.

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
- **Logins** for ArchFlow in Docker are planned. The MCP server will use them too.

## Troubleshooting

| What you see | What to do |
|---|---|
| The assistant doesn't have ArchFlow's tools, or `/mcp` shows *Connection closed* | Start a new conversation. In `/mcp` choose *archflow* → *Reconnect*. Check that the command ends with `archflow-mcp@latest`. Inside a clone of the ArchFlow repository, plain `archflow-mcp` picks the unbuilt local package and fails with `archflow-mcp: not found`. |
| Not sure the server starts at all | Run `npx -y archflow-mcp@latest --version` in a terminal. It should print the version; if not, install or update Node.js (18+). |
| *Can't reach ArchFlow at …* | Check the address: open it in a browser. `curl http://localhost:9500/api/storage/status` should answer `{"enabled":true,…}`. ArchFlow from `compose.yml` listens on port 9500, the development setup (`compose.dev.yml`) on 3000. |
| *Server storage is turned off* | Set `ENABLE_SERVER_STORAGE=true` for the container (the default in the image). |
| The diagram isn't in *My diagrams* | Close *My diagrams* and open it again. Make sure you're looking at the ArchFlow the server saves to: the same address, or the desktop app when there's no `ARCHFLOW_URL`. |
| *The ArchFlow MCP server is off* (from `/mcp` in Docker) | Set `MCP_TOKEN` for the container and restart it (`docker compose up -d`). `ENABLE_SERVER_STORAGE` must be `true`. |
| *Missing or wrong token* | The assistant must send `Authorization: Bearer <token>` with exactly the container's `MCP_TOKEN`. |
| *Unknown or revoked token* / *The token has expired* | With logins: create a new token in *Account* and update the assistant. |
| *API and MCP access is not allowed for this user* | The administrator turns it on in *Users and settings* (per user, or for everyone in *Settings*). |
| *This token is read-only* | The token was created as *Read only*. Create one with *Read and change*. |
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
