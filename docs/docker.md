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
- **Logins.** With `compose.yml` from 0.9.0, ArchFlow asks for a login: see [Accounts and logins](#accounts-and-logins). With `AUTH_MODE=none` there are no accounts, and anyone who can open the address can view, change and delete diagrams. Keep that setup on a trusted network.
- **Backups.** Everything ArchFlow stores is in `/data/diagrams` (your `./diagrams` folder), including accounts (`.archflow/auth.json`), so backing up that folder is enough.

## Accounts and logins

From 0.9.0, ArchFlow in Docker can ask for a login. `compose.yml` turns this on (`AUTH_MODE=local`). The image on its own, or a `compose.yml` from before 0.9.0, keeps working as before, without logins (`AUTH_MODE=none`).

**The first administrator.** On a fresh ArchFlow with logins, the first person who opens it sees *Create the administrator account*. Do this right after starting the container: until then, anyone who reaches the address could take that role. Alternatively, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (e.g. in `.env`), and the account is created when the container starts. This only works while there are no accounts yet.

**Roles**

| Role | Can |
|---|---|
| Administrator | Everything, plus users and settings (☰ → *Users and settings*) |
| Editor | Create, change and delete diagrams |
| Viewer | Open diagrams without changing them |

Every logged-in user sees all diagrams. Each diagram records who created it and who changed it last; *My diagrams* shows the last one.

**Adding people.** In ☰ → *Users and settings*, enter an e-mail, a name and a role, then click *Add user*. ArchFlow shows a temporary password once. Give it to the person; they choose their own password at their first login. The same panel resets passwords, changes roles, and disables or deletes users. ArchFlow always keeps at least one active administrator.

**Public access.** In *Settings* → *Public access*, people who aren't logged in can open ArchFlow and design. They save only in their browser or to a file, never to the server, and can log in with the button at the top.

**Tokens for AI assistants and scripts.**
- Each user creates their own tokens in *Account* → *Tokens*: read-only or read-and-change, with an optional expiry date. A token acts with its owner's rights.
- Tokens can be created by administrators, by users with *API and MCP* ticked, or by everyone when *Settings* → *API and MCP access for everyone* is on.
- The administrator sees every token on the *Tokens* tab and can revoke any of them.
- See [AI assistants (MCP)](mcp.md#mcp-in-docker-over-http).

**Sessions**
- A login lasts 30 days.
- Changing a password logs out the other browsers.
- Disabling a user logs them out at once and stops their tokens.
- After 10 failed logins from one address in 15 minutes, logging in from it is blocked for the rest of that time.

**HTTPS.** Logins work over plain HTTP in your own network. Over the internet, put ArchFlow behind a reverse proxy with HTTPS, such as Nginx Proxy Manager. The proxy has to pass `X-Forwarded-Proto` (most do), so the login cookie is marked secure. Don't add the proxy's own password protection (basic auth): it uses the same `Authorization` header that tokens need.

**Where accounts are kept.** In `.archflow/auth.json` inside the diagrams folder. Passwords are stored as scrypt hashes and tokens as SHA-256 hashes. Back this file up together with the diagrams.

**Lost the only administrator's password?**
1. Stop the container.
2. Delete `.archflow/auth.json` from the diagrams folder (`sudo` may be needed).
3. Start the container again and create the administrator anew.

The diagrams stay. Accounts and tokens are gone and have to be added again.

## Configuration

| Variable | Default | Description |
|---|---|---|
| `ARCHFLOW_VERSION` | `latest` | Image tag used by `compose.yml`. |
| `ENABLE_SERVER_STORAGE` | `true` | Save diagrams as files on the server (My diagrams). Set to `false` for browser-only (session) storage. |
| `STORAGE_PATH` | `/data/diagrams` | Where diagrams are stored inside the container. Mount a host folder or volume here. |
| `AUTH_MODE` | `none` in the image, `local` in `compose.yml` | `local` = accounts and logins, `none` = no logins (trusted networks only). See [Accounts and logins](#accounts-and-logins). |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | *(empty)* | Create the first administrator at start-up, instead of the setup screen. Used only while there are no accounts. |
| `MCP_TOKEN` | *(empty)* | Only without logins (`AUTH_MODE=none`): turns on the MCP server for AI assistants at `/mcp`. With logins, everyone uses their own token instead. Clients send it as `Authorization: Bearer <token>`. See [AI assistants (MCP)](mcp.md#mcp-in-docker-over-http). |

To disable server storage and fall back to browser-only (session) storage, set `ENABLE_SERVER_STORAGE=false`:
```bash
ENABLE_SERVER_STORAGE=false docker compose up -d
# or
docker run -d -p 9500:80 -e ENABLE_SERVER_STORAGE=false ghcr.io/cyryllo/archflow:latest
```

See [Saving and Opening Diagrams](saving.md) for what changes in the app.

---

[← Back to the README](../README.md)
