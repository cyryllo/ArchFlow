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
