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

---

## 🔴 Known Issues

### 1. Panning on empty-area click+drag ignores the user's Pan Settings and doesn't persist
**Priority**: HIGH (reported as actively disruptive - "często psuje wszystko")
**Problem**: Even after configuring Pan Settings to restrict panning to middle-click / right-click / the Pan tool only, left-click-and-drag on empty canvas still pans the view.
**Root causes found in code** (not yet fixed):
- `packages/fossflow-lib/src/stores/uiStateStore.tsx` - `panSettings` lives only in the in-memory Zustand `uiStateStore`, with no persistence (no `localStorage`, no save/restore). It always resets to `packages/fossflow-lib/src/config/panSettings.ts`'s `DEFAULT_PAN_SETTINGS` (`emptyAreaClickPan: true`) on every fresh app/window load - any change made in the Settings dialog is lost as soon as the app restarts.
- `packages/fossflow-lib/src/components/PanSettings/PanSettings.tsx` - the toggle switches for `middleClickPan`/`rightClickPan`/`ctrlClickPan`/`altClickPan` render `checked={!panSettings.xClickPan}` (inverted), while the `emptyAreaClickPan` switch right above them renders `checked={panSettings.emptyAreaClickPan}` (not inverted). This inconsistency makes the panel confusing/misleading - toggling e.g. "middle click and drag" to look "on" actually turns that pan method **off**, the opposite of what the switch appears to say. Easy to end up with the wrong configuration without noticing.
**Fix Strategy**:
- Persist `panSettings` (e.g. to `localStorage`, similar to how `hotkeyProfile`/language are already persisted at the app level) so Settings changes survive a restart.
- Fix the inverted `checked` props in `PanSettings.tsx` so each switch's visual on/off state matches what it actually does.
