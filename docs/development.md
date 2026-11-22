# Development

<p>
 <b>English</b> | <a href="development.pl.md">Polski</a>
</p>

## Quick Start (Local Development)

```bash
# Clone the repository
git clone https://github.com/cyryllo/ArchFlow
cd ArchFlow

# Install dependencies
npm install

# Build the library (required first time)
npm run build:lib

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Monorepo Structure

This is a monorepo containing several packages:

- `packages/fossflow-lib` - React component library for drawing network diagrams (built with Webpack)
- `packages/fossflow-app` - Progressive Web App which wraps the lib and presents it (built with RSBuild)
- `packages/fossflow-backend` - Optional backend server for persistent diagram storage
- `packages/fossflow-desktop` - Native desktop app (Electron)

### Development Commands

```bash
# Development
npm run dev          # Start app development server
npm run dev:lib      # Watch mode for library development

# Building
npm run build        # Build both library and app
npm run build:lib    # Build library only
npm run build:app    # Build app only

# Desktop app (Electron)
npm run dev:desktop   # Run desktop app in dev mode
npm run build:desktop # Build desktop installers

# Testing & Linting
npm test             # Run unit tests
npm run lint         # Check for linting errors

# E2E Tests (Selenium)
cd e2e-tests
./run-tests.sh       # Run end-to-end tests (requires Docker & Python)

# Publishing
npm run publish:lib  # Publish library to npm
```

## 🤖 MCP server (`packages/archflow-mcp`)

The MCP server for AI assistants is published to npm as [`archflow-mcp`](https://www.npmjs.com/package/archflow-mcp). The user guide is [mcp.md](mcp.md).

```bash
npm run build --workspace=packages/archflow-mcp   # icon catalogue + TypeScript -> dist/
npm test --workspace=packages/archflow-mcp        # builds, then runs the tests
```

- `src/server.ts` holds the tools and the instructions for the model, `src/builder.ts` builds and edits diagrams, and `src/layout.ts` places them on the isometric grid. `src/storage.ts` saves to the Docker API or a folder, and `src/validate.ts` mirrors fossflow-lib's schemas.
- `src/catalog.json` (icon ids, categories, names in every language) is generated from the app's icon set by `scripts/build-catalog.mjs`. Every build regenerates it, so new icons or translations reach the MCP server automatically.
- The tests use a real MCP client and also save through the real backend (`packages/fossflow-backend`). `test/fixtures/shop-diagram.json` is the sample diagram; fossflow-lib's `mcpDiagram.test.ts` checks it with the editor's own `modelSchema`. When the output changes on purpose, refresh it with `UPDATE_FIXTURES=1 node --test test/*.test.mjs` (after a build).
- To try your local build in Claude Code, point it at `node /full/path/to/packages/archflow-mcp/dist/index.js` instead of `npx`.

**Releasing.** The package version follows the app (`scripts/update-version.js` updates it too). A version tag runs `.github/workflows/npm.yml`, which tests the package and publishes it with npm **Trusted Publishing**, so no npm token is stored anywhere. A version that is already on npm is skipped. The trusted publisher is set on npmjs.com → archflow-mcp → Settings: repository `cyryllo/ArchFlow`, workflow `npm.yml`, with *npm publish* allowed. If npm ever shows it as expired or not validated, remove it and add it again with the same values before the next tag.

## 🖥️ Building the desktop app

The desktop app (Electron) wraps the same editor in a native window. **Download it from the [latest release](https://github.com/cyryllo/ArchFlow/releases/latest)**: AppImage or `.deb` for Linux, an installer for Windows (see [Download](../README.md#️-download)).

Diagrams are saved as real files on disk, automatically — no location prompt, no browser storage involved. The app creates an `ArchFlow` folder inside your Documents directory (`~/Documents/ArchFlow`, or the localized equivalent, e.g. `~/Dokumenty/ArchFlow` on a Polish system) the first time it runs, and every diagram you save through **Save** / **My diagrams** becomes a `.json` file there. Exports use native "Save As" dialogs.

To build it yourself:

```bash
npm run dev:desktop     # run in dev mode (opens a native window)
npm run build:desktop   # build the packages for your system into packages/fossflow-desktop/dist/
```

On Linux this produces the AppImage and `.deb`. The Windows installer is built on Windows (building it on Linux needs wine); the `Desktop builds` GitHub workflow builds all of them for every version tag and attaches them to the release.

---

[← Back to the README](../README.md)
