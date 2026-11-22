# Running ArchFlow with Docker

<p>
 <b>English</b> | <a href="docker.pl.md">Polski</a>
</p>

A prebuilt image is published to GitHub Container Registry on every successful build of `master`:

```
ghcr.io/cyryllo/archflow
```

| Tag | Meaning |
|---|---|
| `latest` | Latest build of `master` |
| `0.6.1` (any version) | A specific ArchFlow version, from `package.json` |
| `sha-abc1234` | A specific commit |

The image is currently built for `linux/amd64` only.

ArchFlow listens on port **9500** in all examples below. Ports like 80 or 8080 are often already taken by other services, so 9500 is a safer default. You can change it, see [Changing the port](#changing-the-port).

## Option 1: Docker Compose (recommended)

You don't need to clone the repository, just the compose file.

```bash
# 1. Create a folder for ArchFlow and download the compose file
mkdir archflow && cd archflow
curl -O https://raw.githubusercontent.com/cyryllo/ArchFlow/master/compose.yml

# 2. Pull the image and start the container in the background
docker compose pull
docker compose up -d
```

Open **http://localhost:9500** in your browser. Diagrams are saved as JSON files in `./diagrams`, next to `compose.yml`.

Everyday commands, run from the same folder:

```bash
docker compose ps                   # is it running?
docker compose logs -f              # follow logs
docker compose stop                 # stop (container is kept)
docker compose start                # start it again
docker compose down                 # stop and remove the container (diagrams stay in ./diagrams)
docker compose pull && docker compose up -d   # update to the newest image
```

To pin a specific version instead of `latest`, set `ARCHFLOW_VERSION`, either inline or in a `.env` file next to `compose.yml`:

```bash
ARCHFLOW_VERSION=0.6.1 docker compose up -d
```

## Option 2: `docker run`

```bash
docker run -d --name archflow \
  -p 9500:80 \
  -v "$(pwd)/diagrams:/data/diagrams" \
  --restart unless-stopped \
  ghcr.io/cyryllo/archflow:latest
```

Everyday commands:

```bash
docker ps                        # is it running?
docker logs -f archflow          # follow logs
docker stop archflow             # stop the container
docker start archflow            # start it again
docker rm -f archflow            # remove the container (diagrams stay in ./diagrams)
```

To update: `docker pull ghcr.io/cyryllo/archflow:latest`, then `docker rm -f archflow` and run the command above again. Your diagrams are kept in `./diagrams`.

If you prefer a named Docker volume over a host folder, use `-v archflow-diagrams:/data/diagrams` instead. The volume survives `docker rm`. To list or delete it:

```bash
docker volume ls                                                          # list volumes
docker run --rm -v archflow-diagrams:/data alpine ls -la /data            # see what's inside
docker volume rm archflow-diagrams                                        # delete it, with all diagrams in it
```

## Option 3: Build from source

If you have cloned the repository, you can build the image yourself instead of pulling it:

```bash
docker compose up -d --build                     # build from the local source and start
docker compose -f compose.dev.yml up --build     # dev variant: ports 3000 (app) and 3001 (API)
```

## Changing the port

The port is the number **before** the colon in the port mapping (`HOST:CONTAINER`). Inside the container ArchFlow always listens on `80`; only change the host side.

- **Compose:** edit the `ports` line in `compose.yml`, e.g. `- "9600:80"`, then run `docker compose up -d`.
- **`docker run`:** change `-p 9500:80` to e.g. `-p 9600:80`.

To check whether a port is free on Linux: `ss -ltn | grep :9500` (no output means it's free).

## How the container works

Good to know before you run it on a server:

- **One container, two processes.** nginx serves the web app on port `80` inside the container, and a small Node.js backend (port `3001`) stores diagrams. nginx forwards `/api/...` requests to the backend, so you only need to publish port 80 (mapped to 9500 on the host). Don't publish 3001.
- **Where diagrams live.** The backend writes each diagram as a JSON file to `/data/diagrams` inside the container. The image doesn't declare a volume, so **if you don't mount anything there, diagrams live only inside the container**. They survive `stop`/`start`/restart, but are **lost on `docker rm`, `docker compose down`, or when updating to a new image**. Always mount a folder or a named volume (the examples above do).
- **Host folder vs named volume.**
  - Host folder (`./diagrams:/data/diagrams`): files are directly visible on your disk, easy to back up or copy. If the folder doesn't exist, Docker creates it for you on the first start.
  - Named volume (`archflow-diagrams:/data/diagrams`): Docker manages the storage (under `/var/lib/docker/volumes/` on Linux). Not visible as a normal folder, but avoids the permission issue below.
- **File ownership (Linux).** The container runs as `root`, so the `./diagrams` folder and the JSON files in it are owned by `root` on the host. To edit, move or delete them by hand, use `sudo` or take ownership: `sudo chown -R $USER: diagrams`. ArchFlow itself keeps working after that.
- **Works offline.** Everything the app needs is inside the image, so the container starts in a few seconds and doesn't need internet access, only for pulling the image.
- **Restarts.** Both examples use `restart: unless-stopped`: the container starts again after a crash or a reboot of the machine, unless you stopped it yourself.
- **No logins.** ArchFlow has no user accounts. Anyone who can open the address can view, change and delete diagrams in My diagrams. Run it on a trusted network, or put it behind a reverse proxy with authentication (e.g. basic auth) if it's reachable from the internet.
- **Backups.** Everything ArchFlow stores is in `/data/diagrams` (your `./diagrams` folder), so backing up that folder is enough.

## Configuration

| Variable | Default | Description |
|---|---|---|
| `ARCHFLOW_VERSION` | `latest` | Image tag used by `compose.yml`. |
| `ENABLE_SERVER_STORAGE` | `true` | Save diagrams as files on the server (My diagrams). Set to `false` for browser-only (session) storage. |
| `STORAGE_PATH` | `/data/diagrams` | Where diagrams are stored inside the container. Mount a host folder or volume here. |
| `MCP_TOKEN` | *(empty)* | Turns on the MCP server for AI assistants at `/mcp`. Clients send it as `Authorization: Bearer <token>`. See [AI assistants (MCP)](mcp.md#mcp-in-docker-over-http). |

To disable server storage and fall back to browser-only (session) storage, set `ENABLE_SERVER_STORAGE=false`:
```bash
ENABLE_SERVER_STORAGE=false docker compose up -d
# or
docker run -d -p 9500:80 -e ENABLE_SERVER_STORAGE=false ghcr.io/cyryllo/archflow:latest
```

See [Saving and Opening Diagrams](saving.md) for what changes in the app.

---

[← Back to the README](../README.md)
