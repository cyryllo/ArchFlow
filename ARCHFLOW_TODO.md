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

## 🔴 Known Issues

### Stage 2: new diagram icon set
**Wanted**: replace the current diagram icons with a new, larger isometric set in one style, **coloured by category** (network, communication, servers and computers, ...). Not only server-room/infrastructure: also flow/process diagrams (people and roles, documents, decisions, events, channels, ...). Old diagrams should get matching new icons automatically. More icons can be added in a later step.
