# ArchFlow TODO List

Known issues found while developing ArchFlow. The original FossFLOW/Isoflow issue backlogs are not included here, since they pertain to the upstream projects, not this fork.

---

## 🔴 Known Issues

### 1. "Modified" indicator stays on right after saving
**Priority**: HIGH (Bug, confusing UX - looks like the save didn't work)
**Problem**: After saving a diagram (via App Storage/Server Storage or the desktop app), the toolbar still shows "• Modified" right away, even though nothing changed since the save. Likely caused by `handleModelUpdated` in `App.tsx` unconditionally calling `setHasUnsavedChanges(true)` on every `onModelUpdated` callback from the Isoflow canvas, including calls that fire without any real user edit (e.g. on mount/remount).
**Relevant Codebase Areas**:
- `packages/fossflow-app/src/App.tsx` - `handleModelUpdated` (unconditional `setHasUnsavedChanges(true)`)
- `packages/fossflow-app/src/App.tsx` - `handleDiagramManagerSaved` (sets `hasUnsavedChanges(false)` after save, but a subsequent spurious `onModelUpdated` call may immediately flip it back to `true`)
**Fix Strategy**:
- Diff the incoming model against the last-saved/last-known model before marking unsaved changes, instead of always setting `true`
- Test: Save a diagram via App Storage, close the dialog, verify "Modified" does NOT reappear until an actual edit is made

### 2. Remove GitHub link from the dropdown (hamburger) menu
**Priority**: MEDIUM (cleanup)
**Problem**: The main dropdown menu (☰) has a "GitHub" entry that links out to the repository. Should be removed.
**Relevant Codebase Areas**:
- `packages/fossflow-lib/src/components/MainMenu/MainMenu.tsx` - `LINK.GITHUB` menu item (~line 247), controlled by `mainMenuOptions`
- `packages/fossflow-lib/src/Isoflow.tsx` - `mainMenuOptions` prop (defaults to `MAIN_MENU_OPTIONS` if not overridden)
**Fix Strategy**:
- Pass a `mainMenuOptions` prop from `packages/fossflow-app/src/App.tsx`'s `<Isoflow>` usage that excludes `'LINK.GITHUB'`

### 3. Move the hamburger (☰) menu next to the toolbar buttons
**Priority**: LOW (layout/UX polish, "if possible")
**Problem**: The ☰ menu button (main menu) is positioned separately from the app's own toolbar (Nowy Diagram / Dysk aplikacji / Eksportuj Plik buttons), appearing as a disconnected floating button below-left instead of inline with the other buttons.
**Relevant Codebase Areas**:
- `packages/fossflow-lib/src/components/UiOverlay/UiOverlay.tsx` - positions `MainMenu` absolutely (`top: appPadding.y, left: appPadding.x`) relative to the canvas
- `packages/fossflow-app/src/App.tsx` - `.toolbar` div with the app's own buttons, rendered outside the canvas/UiOverlay
**Fix Strategy**:
- Investigate whether `MainMenu` can be rendered inside `App.tsx`'s own `.toolbar` div instead of via `UiOverlay`, or whether the toolbar needs to be repositioned/restyled to sit flush with where `UiOverlay` places `MainMenu`

### 4. Translate context menu, native dialogs, and DiagramManager UI (currently English-only)
**Priority**: MEDIUM (i18n gap - these don't follow the app's language setting at all)
**Problem**: Several UI surfaces are hardcoded in English regardless of the selected language (PL/EN):
- Right-click context menu ("Add Node", "Add Rectangle")
- Electron native dialogs: the "Unsaved changes" close-confirmation dialog, and its "Close"/"Cancel" buttons
- The "Save Diagram" dialog inside App Storage/Server Storage (title, "Diagram name" placeholder, Save/Cancel buttons, and its `alert`/`confirm` messages)
**Relevant Codebase Areas**:
- `packages/fossflow-lib/src/components/ContextMenu/ContextMenuManager.tsx` - hardcoded `label: 'Add Node'` / `label: 'Add Rectangle'`, no `useTranslation` used at all
- `packages/fossflow-desktop/src/main.js` - `will-prevent-unload` handler's `dialog.showMessageBoxSync` strings
- `packages/fossflow-app/src/components/DiagramManager.tsx` - not wired to i18n at all (no `useTranslation`/`t()` calls anywhere in the file)
**Fix Strategy**:
- Add translation keys for context menu items and wire `ContextMenuManager.tsx` to `useTranslation`
- For the Electron dialog (main process, no React/i18next available there): pass the current language from the renderer to main via IPC (or read it from a stored setting) and maintain a small PL/EN string table in `main.js`
- Wire `DiagramManager.tsx` to `useTranslation('app')` like the rest of `App.tsx` already does, adding the missing keys to `en-US.json`/`pl-PL.json`

### 5. Saved files are named by internal ID, not by the diagram's name
**Priority**: MEDIUM (UX - files on disk are not human-navigable)
**Problem**: Diagrams saved via App Storage are written to disk as `<id>.json` (e.g. `diagram_1785361543071.json`), where `id` is a timestamp-based identifier generated at creation time - not the name the user typed in the Save dialog (e.g. "Moj diagram"). The given name only lives inside the file's `name`/`title` field, not in the filename itself, making the folder hard to browse outside the app.
**Relevant Codebase Areas**:
- `packages/fossflow-desktop/src/main.js` - `registerStorageHandlers()`, `diagramPath(id)` and the `storage:create` handler's `id = data.id || \`diagram_${Date.now()}\`` generation
- `packages/fossflow-backend/server.js` - same pattern server-side (`POST /api/diagrams`, `id = req.body.id || \`diagram_${Date.now()}\``), should stay consistent with the desktop behavior
**Fix Strategy**:
- Derive the filename from the (sanitized) diagram name instead of a generated id - strip characters invalid in filenames, trim, and handle name collisions (e.g. append " (2)")
- On rename (saving an existing diagram under a new name), rename the file on disk to match rather than only updating the `name` field inside it
- Decide whether the in-app `id` used for tracking (`currentDiagramId`, list keys, etc.) becomes the sanitized filename itself, or stays a separate identifier with a lookup table - simplest is likely to make them the same, same as the id currently doubles as the filename stem
