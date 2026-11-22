<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/brand/logo-dark.svg">
    <img alt="ArchFlow" src="docs/brand/logo.svg" width="440">
  </picture>
</p>

<p align="center">
 <a href="README.md">English</a> | <a href="docs/README.pl.md">Polski</a>
</p>

<p align="center">
  <b>See how it looks:</b>
  <a href="https://cyryllo.github.io/ArchFlow/app/"><b>▶ Try the live demo</b></a> (runs in your browser, no install)
  &nbsp;·&nbsp;
  <a href="https://cyryllo.github.io/ArchFlow/">🌐 Project website</a>
</p>

**ArchFlow** is a fork of <a href="https://github.com/stan-smith/FossFLOW">FossFLOW</a> by Stan Smith, which is itself a fork/rewrite of <a href="https://github.com/markmanx/isoflow">Isoflow</a> by @markmanx — this project stands on both of their shoulders. If either project has helped you, please check them out and consider supporting their work.

------------------------------------------------------------------------------------------------------------------------------
ArchFlow is a free, open-source editor for clear, good-looking **isometric diagrams**: system architecture, networks, cloud infrastructure and business processes. Use it in the browser, install the desktop app on Linux or Windows, or host it yourself with one Docker command.

![ArchFlow editor](docs/screenshots/en-editor.png)

## ✨ Features

- **177 isometric icons in 9 colour-coded categories**: servers & computers, network, communication, data, security, people & organisation, flow & process, business & logistics, shapes. Import your own images as icons too.
- **Not only infrastructure:** start and end events, decisions, gateways, documents, approvals, timers and milestones for process diagrams.
- **Zones, connectors and text:** group elements in coloured zones, connect them (with waypoints, labels, line styles and arrows), add text and rich-text descriptions.
- **Right-click menus** on the canvas and on every element; a **☰ menu** for files, export and settings.
- **Select and move together:** selection box, Shift+click, then drag or nudge with the arrow keys. Connectors keep their shape.
- **Keyboard shortcuts** for copy, cut, paste, duplicate, select all, delete, zoom, fit, rename and every tool (press F1 for the list).
- **Export** to a portable JSON file (every icon included) or to a PNG image with your choice of resolution, background and cropping.
- **Save where you like:** files on your computer, a shared list on your Docker server, or the desktop app's `Documents/ArchFlow` folder.
- **English and Polish** interface, icon names included.

## ⬇️ Download

Ready-made desktop builds are attached to every [release](https://github.com/cyryllo/ArchFlow/releases/latest):

| File | For |
|---|---|
| `ArchFlow-X.Y.Z-x86_64.AppImage` | Linux, any distribution |
| `ArchFlow-X.Y.Z-amd64.deb` | Debian / Ubuntu |
| `ArchFlow-Setup-X.Y.Z.exe` | Windows (installer) |

```bash
# Linux AppImage
chmod +x ArchFlow-*-x86_64.AppImage
./ArchFlow-*-x86_64.AppImage
```

The Windows installer isn't code-signed yet, so SmartScreen may warn you the first time: click **More info → Run anyway**. Prefer the browser? [Try the live demo](https://cyryllo.github.io/ArchFlow/app/) or [run it with Docker](#-run-with-docker).

## 🐳 Run with Docker

```bash
mkdir archflow && cd archflow
curl -O https://raw.githubusercontent.com/cyryllo/ArchFlow/master/compose.yml
docker compose pull
docker compose up -d      # then open http://localhost:9500
```

Diagrams are saved as JSON files in `./diagrams`. Ports, `docker run`, configuration, backups and how the container works: **[Docker guide](docs/docker.md)**.

## 📚 Documentation

| | |
|---|---|
| 🚀 [Quick start](docs/quick-start.md) | Your first diagram in ten steps, with screenshots |
| 🧭 [Using ArchFlow](docs/usage.md) | The screen, tools, right-click menus, selecting and moving, shortcuts, settings |
| 💾 [Saving and opening](docs/saving.md) | Files, My diagrams, export to JSON and PNG, browser-only mode |
| 🐳 [Docker guide](docs/docker.md) | Installing and running ArchFlow on your server |
| 🛠️ [Development](docs/development.md) | Running from source, project structure, building the desktop app |
| 📝 [ARCHFLOW_TODO.md](ARCHFLOW_TODO.md) | Known issues and roadmap |

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) and [Development](docs/development.md).

## License

MIT
