# ArchFlow TODO List

Known issues found while developing ArchFlow. The original FossFLOW/Isoflow issue backlogs are not included here, since they pertain to the upstream projects, not this fork.

---

## ✅ Resolved

### "Modified" indicator stays on right after saving
Fixed in `App.tsx`'s `handleModelUpdated`: instead of unconditionally setting `hasUnsavedChanges(true)` on every `onModelUpdated` call (which fires continuously even without real edits, due to an unmemoized model selector upstream), the incoming model is now compared by serialized content against the last known snapshot.

### Remove GitHub link from the dropdown (hamburger) menu
Fixed by passing `mainMenuOptions` to `<Isoflow>` in `App.tsx`, excluding `'LINK.GITHUB'` and `'LINK.DISCORD'`.

### Translate context menu, native dialogs, DiagramManager UI, and toolbar/zoom tooltips
Fixed. Context menu ("Add Node"/"Add Rectangle"), the Electron "unsaved changes" close dialog, the DiagramManager save/load UI, and the tool menu + zoom controls + main menu button tooltips (Undo/Redo/Select/Lasso/Pan/etc., Zoom in/out/Fit to screen/Help) are all wired to the app's PL/EN locale system now.

### Saved files are named by internal ID, not by the diagram's name
Fixed in both `packages/fossflow-desktop/src/main.js` and `packages/fossflow-backend/server.js`: filenames are now derived from the sanitized diagram name (with " (2)"-style collision suffixing), and saving under a new name renames the file on disk instead of just updating the `name` field inside it.

### Move the hamburger (☰) menu, zoom controls, and toolbar onto one line
Fixed - all now share one row at the top of the canvas (`packages/fossflow-lib/src/components/UiOverlay/UiOverlay.tsx`) instead of hamburger top-left / tools top-right / zoom bottom-left.

### Tool buttons (Rectangle, Connector, Pan, etc.) didn't stay active - always snapped back to "Select"
**Root cause found and fixed**: `setEditorMode` in `packages/fossflow-lib/src/stores/uiStateStore.tsx` unconditionally reset `mode` back to the starting mode (CURSOR) every time it was called, and it was being called on nearly every render because `App.tsx` passed a brand-new `mainMenuOptions` array literal to `<Isoflow>` on every render, retriggering the effect that calls `setEditorMode`. Fixed by (1) making `setEditorMode` a no-op when `editorMode` hasn't actually changed, and (2) hoisting `mainMenuOptions` to a stable module-level constant in `App.tsx`. Verified: tool buttons and hotkeys now correctly switch and hold their mode, rectangle drag-to-draw works.

### Pan Settings were ignored and not persisted; empty-area drag left the app stuck in Pan mode
**Root cause** (different from the earlier guess): dragging empty space with the Select tool was hard-coded in `interaction/modes/Cursor.ts` to switch to `PAN` - ignoring `emptyAreaClickPan` - and nothing ever switched back, so the user stayed in Pan mode after every such drag. The `emptyAreaClickPan` check in `usePanHandlers.ts` never fired at all (it compared the event target with the wrong element). Middle/right/modifier-click pan also didn't move the view, because the mouse state wasn't updated before the pan handler returned. Fixed:
- Dragging empty space with Select now draws a **selection box** (default); with `emptyAreaClickPan` enabled it pans instead. Both are temporary and return to Select on mouse release (`PanMode.returnTo`, `LassoMode.fromCursor`).
- Middle/right/Ctrl/Alt-click pans are temporary too and return to whatever tool was active.
- `panSettings` persist in `localStorage` (`archflow-pan-settings`); the inverted switches in `PanSettings.tsx` are fixed.

### Tools stay active until another tool is picked or ESC is pressed
Rectangle, Text, Add item (the picked icon stays on the cursor), Connector and Lasso no longer fall back to Select after one use. ESC cancels whatever is in progress (unplaced text box, half-drawn connector), closes open panels and always returns to Select. Tools react only to the left mouse button, so a right-click doesn't draw anything.

### Clearer tool names; export moved into the ☰ menu
The tools are now named "Select / move items" and "Pan view (hand)", with matching help and settings text. The toolbar "Export File" button is gone: "Export as JSON" in the ☰ menu opens the app's export dialog (new `onExportJson` prop on `<Isoflow>`). The duplicate "Export as Compact JSON" menu entry was removed; compact files can still be opened.

---

### Delete key, Ctrl+A, one-shot Rectangle/Add item, right-click-only context menu
- **Delete / Backspace** removes the selected element, or everything in a lasso/box selection, as one undo step (new `deleteItems` in `hooks/useScene.ts`).
- **Ctrl+A** selects all nodes, rectangles and text boxes as a box selection (drag or Delete right away).
- **Rectangle (R)**, **Add item** and **Text** go back to Select after one rectangle / node / text. Connector and Lasso stay active until ESC or another tool.
- The "Add node / Add rectangle" menu opens only on **right-click** (no longer on left-click). Its "Add rectangle" starts the same drag-to-draw mode as R instead of creating a 1-tile square.

---

### New interface (stage 1 of the UI proposal)
- Own UI icon set (`components/Icons/UiIcons.tsx`, exported as `UiIcon`) on the toolbar, the right-click menu and the ☰ menu.
- One top row: ☰ on the left, tools in the middle (undo/redo · select, box/freehand lasso as one button with a switch arrow, hand · node, rectangle, connector, text, with the hotkey in each button's corner), zoom + fit on the right.
- Right-click menu on empty canvas (add node, draw rectangle, add text, paste, select all, fit) and on elements (connect to…, properties, change icon, copy, cut, duplicate, bring to front / send to back, delete; acts on the whole multi-selection when the element is part of it).
- ☰ menu grouped into File / Export / Application; the host app adds New diagram, My diagrams, Save and Language through the new `menuItems` prop.
- App top bar slimmed down to the diagram name, save state, Save and My diagrams. Ctrl+S / Ctrl+O do the same as those buttons.
- New shortcuts: Ctrl+C / X / V / D, Ctrl+] / Ctrl+[, Ctrl + / Ctrl −, Shift+1, F2, arrows nudge the selection, Space + drag pans, Shift+click adds to / removes from the selection. Tool letters no longer fire together with Ctrl (Ctrl+C used to switch to the connector tool).
- Shared editing actions in `hooks/useEditorActions.ts`; clipboard paste and z-order in `hooks/useScene.ts` (`pasteItems`, `reorderItems`).

---

### Box selection and moving a multi-selection
- The selection box is now screen-aligned (a plain rectangle, like other editors). It used to be a range of grid tiles, i.e. a thin diamond along the drag diagonal, so dragging corner to corner caught almost nothing (often only a text). Helpers in `utils/selection.ts`; after release the box hugs the selected elements.
- Dragging a multi-selection moves nodes, zones and texts together and keeps them selected afterwards. Before, separate updates in one tick overwrote each other (nodes stayed behind while a zone/text moved); `dragItems` now chains every update on one state (`updateRectangle` / `updateTextBox` / `updateConnector` accept and return a state like `updateViewItem`).
- Interaction modes get the mouse position of the current event (they used to lag one event behind).
- Pasted elements stay selected.
- Connectors: the box catches a connector when all its hand-placed points are inside and the nodes it's attached to are caught too; a free end that touches another connector's point (a path clicked point by point is a chain of short connectors) counts as a join and keeps the connector out, so moving a zone never tears such a chain apart (`connectorFollowsSelection` in `utils/selection.ts`). Without a box selection, a connector moves as a whole only when both its ends sit on moved nodes.

### Settings on one page
Settings are one scrolling page (fixed size) with three sections: Mouse (pan gestures, zoom to cursor), Keyboard (tool letters, keyboard panning) and Connectors. Removed the icon packs tab (packs a diagram uses still load automatically) and the technical label-padding slider; everything is translated. Switch thumbs are visible when off.

### Remaining translations
The property panels (node, connector, rectangle, text, icon picker), the export-to-image dialog, the color-picker tooltip and the text-editor fallback were hard-coded in English; they now use the new `itemControls` and `exportImage` locale sections (PL/EN). The rectangle tool icon is now a plain rectangle (it looked like an app window).

---

### Loading a diagram showed the previous canvas (and saving then overwrote the file)
**Root cause**: in `packages/fossflow-app/src/App.tsx`, after "Load" set the new diagram, the editor instance that was about to be replaced still reported its own model once more, and `handleModelUpdated` wrote that back into `diagramData` - so the remounted editor started with the old (often empty) canvas. Saving then stored that state over the diagram on the server. On top of that, `onModelUpdated` was a new function on every render, so the editor reported its model in an endless loop (hundreds of times a second). Fixed: every reload bumps an editor generation and reports from an older generation are ignored; the callback is stable per editor instance.

---

### New diagram icon set (stage 2)
177 isometric icons in 9 colour-coded categories (servers & computers, network, communication, data, security, people & organisation, flow & process, business & logistics, shapes), generated by `scripts/icons/build-icons.mjs` (engine in `iso.mjs` / `parts.mjs`, one file per category in `sets/`) into `packages/fossflow-app/src/icons/archflowIcons.ts`. All 37 ids of the old isoflow pack are kept, so old diagrams get the new drawings automatically: loading from the server or opening a file swaps saved built-in icons for the current ones (`withCurrentBuiltInIcons` in `src/icons/index.ts`, and in the ☰ "Open from file" action); imported and icon-pack icons stay. Icon names and picker category headings follow the UI language (`iconCategoryLabels` prop).

---

## 🔴 Known Issues

### Stage 3: desktop builds
**Status**: Linux AppImage + .deb build locally (`npm run build:desktop`) and the AppImage was checked on a virtual display (new UI, disk storage). The Windows installer can't be built here (electron-builder needs wine to stamp the .exe), so `.github/workflows/desktop.yml` builds Linux (ubuntu runner) and Windows NSIS (windows runner) on every `v*.*.*` tag and attaches them to the GitHub release; it can also be run manually. Still to do: first CI run (needs a new tag - the workflow isn't in v0.6.0), try the .exe on Windows, describe downloads in README/site (stage 4).
Note: when testing from a terminal inside VS Code, unset `ELECTRON_RUN_AS_NODE` before starting the AppImage, otherwise it starts as plain Node ("bad option").

### Stage 4: docs and website
**Done**: README (EN) and docs/README.pl.md rewritten for the new interface (features, downloads, how to use with screenshots, shortcuts, saving); project website (site/, EN + PL) updated with a download section and new gallery; all screenshots retaken in Full HD from a demo diagram (online shop) by `scripts/docs/screenshots.mjs` + `scripts/docs/demo-diagram.mjs` (run against a throwaway instance, see the script header). Re-run the script whenever the UI changes.

### Stage 4b: user manual
**Done**: quick start (`docs/quick-start*.md`) and the full user manual (`docs/manual.md`, `docs/manual.pl.md`, 16 chapters: getting ArchFlow, the screen, moving around, nodes, zones, connectors, text, selecting and editing, right-click menus, undo, saving, export, settings, language, all shortcuts, troubleshooting), with screenshots from `scripts/docs/screenshots.mjs` (sets `docs`, `quickstart`, `manual`). It replaces the former `docs/usage*.md`.

### App fixes found while taking the screenshots (released in v0.6.2)
- Node labels sat at a fixed height, so the taller new icons poked up behind them; labels are now lifted above the measured icon height (`SceneLayers/Nodes/Node/Node.tsx`).
- The dotted line from a label to its node swallowed clicks in the middle of the icon (`components/Label/Label.tsx`, `pointer-events: none`).
- The right-click menu only appeared on the next re-render (e.g. after moving the mouse), because its anchor was a ref; it's state now (`components/UiOverlay/UiOverlay.tsx`).

### Stage 5: more interface languages
**Wanted**: besides Polish and English, translate the UI into the popular languages: Portuguese (Brazil, pt-BR), German (de-DE), Spanish (es-ES), Italian (it-IT), French (fr-FR), plus other widely used ones - e.g. Chinese (zh-CN), Japanese (ja-JP), Ukrainian (uk-UA), Russian (ru-RU), Dutch (nl-NL), Turkish (tr-TR), Korean (ko-KR), Czech (cs-CZ).
**What it covers**: the library locale (`packages/fossflow-lib/src/i18n/*.ts`, typed by `LocaleProps`), the app strings (`packages/fossflow-app/src/i18n/*.json`), the language list (`supportedLanguages` in the app's `i18n.ts`; the ☰ menu "Language" entry should become a picker once there are more than two), icon names and categories in the generated icon set (`names` per language in `scripts/icons`), and the desktop app's native dialogs. The upstream project had some of these locales once (e.g. es-ES) - check git history for anything reusable, but all new UI strings need translating.

### Stage 6: MCP server so AI assistants can create diagrams
**Wanted**: an MCP (Model Context Protocol) server for ArchFlow, so AI assistants (Claude and other MCP clients) can use the tool directly: build and change diagrams, then the user opens them in ArchFlow.
**Idea for the tools it exposes**:
- read: list the icon set (ids, names, categories - from `scripts/icons` / `archflowIcons.ts`), list diagrams, read a diagram;
- build: create a diagram, add/update/remove nodes (icon, name, description, tile), zones (rectangles with colour), text, connectors (between nodes, with waypoints, labels, style), auto-layout helpers (grid/row/column placement so the model doesn't have to compute tiles);
- save/export: save into ArchFlow's server storage through the backend API (`GET/POST/PUT/DELETE /api/diagrams` in `packages/fossflow-backend/server.js`) or the desktop app's folder (`~/Documents/ArchFlow`), export JSON (and later PNG/SVG).
**Notes**: validate everything against the model schema (`packages/fossflow-lib/src/schemas`) before saving; reuse/extend `LLM-GENERATION-GUIDE.md` as the format reference; ship as an npm package (stdio transport for desktop clients) and optionally as an HTTP endpoint in the Docker image; document setup for Claude Desktop / Claude Code.

### Stage 7: logins and user management (Docker version)
**Why**: the Docker version has no accounts - anyone who can open the address can view, change and delete every diagram in "My diagrams", and the read-only share link isn't access control.
**Wanted**:
- log in to ArchFlow (username + password, hashed with bcrypt/argon2; session cookie or token) - optionally single sign-on later (OIDC: Google / Microsoft / Keycloak, maybe LDAP);
- user management for an administrator: add / disable / delete users, reset passwords, roles (e.g. admin, editor, viewer);
- permissions on diagrams: owner, shared with users or groups (view / edit), a private/shared flag;
- share links with a random token (optionally expiring), read-only by default, instead of guessable `/display/<name>` URLs;
- first-run setup of the admin account (or an env variable), and a switch to keep the current no-login mode for trusted networks;
- an audit trail of who changed what is a nice-to-have.
**Notes**: everything lives in `packages/fossflow-backend` (Express) - it needs a small user store (SQLite file next to the diagrams is enough), auth middleware on `/api/*`, and login / user-management screens in the app. The desktop app and the plain-website mode stay without logins.

### Share button shows where it can't work
**Problem**: "Share" in My diagrams copies `<origin>/display/<id>`, which only works with server storage (Docker). In the desktop app it produces an `app://bundle/...` link nobody else can open, and in browser-only mode the link has nothing to load.
**Fix Strategy**: show the Share button only when `storageKind === 'server'` (`packages/fossflow-app/src/components/DiagramManager.tsx`). Revisit together with stage 7 (token-based share links).

### Slimmer README
**Done**: README.md and docs/README.pl.md are down from ~400 to ~85 lines (what it is, features, download, Docker in four lines, a documentation table). The rest moved to `docs/docker`, `docs/usage`, `docs/saving` and `docs/development` (`.md` English, `.pl.md` Polish); the website's Docker link points to `docs/docker*.md`.

### Most settings aren't remembered
**Problem**: only the pan settings are persisted (`config/panSettings.ts`, localStorage). Tool letters (hotkey profile), zoom-to-cursor and the connector mode live only in the in-memory UI store, so they reset on every reload - and also when the language changes, because the editor is remounted.
**Fix Strategy**: persist them the same way as pan settings (load on store creation, save in the setters in `stores/uiStateStore.tsx`), then update the manual (docs/manual*.md, chapter 13).

