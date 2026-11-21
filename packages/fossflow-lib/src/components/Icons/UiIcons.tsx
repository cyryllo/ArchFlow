import React from 'react';

// ArchFlow's own UI icon set (24px grid, 1.7 stroke, currentColor).
// One drawing style for the toolbar, the right-click menu and the ☰ menu so
// every function is recognisable by its icon wherever it appears.
const PATHS = {
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  select: '<path d="M5 3.5 19 10l-6.2 1.8L10.5 18z"/><path d="m13 12 5 5"/>',
  boxSelect:
    '<rect x="3.5" y="3.5" width="13" height="13" rx="1" stroke-dasharray="2.6 2.4"/><path d="m13 13 7.5 3.2-3 1-1 3z"/>',
  lasso:
    '<path d="M7 15.5C4.6 14.6 3 12.9 3 11c0-3.3 4-6 9-6s9 2.7 9 6-4 6-9 6c-.9 0-1.8-.1-2.6-.3" stroke-dasharray="2.6 2.4"/><circle cx="7.5" cy="17.5" r="1.8"/><path d="M7 19.3c-.4 1-.2 1.8.5 2.2"/>',
  pan: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12"/><path d="M11 11.5V4a1.5 1.5 0 0 1 3 0v7.5"/><path d="M14 11.5V5.5a1.5 1.5 0 0 1 3 0V13"/><path d="M17 9.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.6a6 6 0 0 1-4.6-2.2L4.5 15a1.5 1.5 0 0 1 2.3-2L8 14.3"/>',
  addNode:
    '<path d="M11 3 3.5 7.2v8.6L11 20l2-1.1"/><path d="M3.5 7.2 11 11.4l7.5-4.2L11 3"/><path d="M11 11.4V20"/><path d="M18 14v7M14.5 17.5h7"/>',
  rectangle:
    '<rect x="3.5" y="6" width="17" height="12" rx="1.5" fill="currentColor" fill-opacity=".14"/>',
  connector:
    '<circle cx="5" cy="18" r="2.2"/><path d="M7 16.4 17.5 6.5"/><path d="M12.5 6.3h5.2v5.2"/>',
  text: '<path d="M5 6V4.5h14V6"/><path d="M12 4.5v15"/><path d="M9 19.5h6"/>',
  zoomIn:
    '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.8-4.8M10.5 7.5v6M7.5 10.5h6"/>',
  zoomOut:
    '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.8-4.8M7.5 10.5h6"/>',
  fit: '<path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4"/><rect x="8.5" y="8.5" width="7" height="7" rx="1"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.3a2.6 2.6 0 0 1 5 .9c0 1.8-2.5 2.2-2.5 3.8"/><circle cx="12" cy="17" r=".7" fill="currentColor"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  properties:
    '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  changeIcon:
    '<path d="M12 3 5 7v8l7 4 7-4V7z"/><path d="m9.5 11.5 2.5-2.5 2.5 2.5M12 9v6"/>',
  duplicate:
    '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/><path d="M14 11v6M11 14h6"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  cut: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8 16.3 18 4M16 16.3 6 4"/>',
  paste:
    '<rect x="5" y="4.5" width="14" height="16" rx="2"/><path d="M9 4.5V3.8A.8.8 0 0 1 9.8 3h4.4a.8.8 0 0 1 .8.8v.7"/><path d="M9 11h6M9 15h4"/>',
  delete:
    '<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5V7"/>',
  bringToFront:
    '<rect x="9" y="9" width="11" height="11" rx="1.5" fill="currentColor" fill-opacity=".18"/><path d="M15 9V5.5A1.5 1.5 0 0 0 13.5 4h-8A1.5 1.5 0 0 0 4 5.5v8A1.5 1.5 0 0 0 5.5 15H9"/>',
  sendToBack:
    '<rect x="4" y="4" width="11" height="11" rx="1.5" fill="currentColor" fill-opacity=".18"/><path d="M9 15v3.5A1.5 1.5 0 0 0 10.5 20h8a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 18.5 9H15"/>',
  selectAll:
    '<rect x="3.5" y="3.5" width="17" height="17" rx="2" stroke-dasharray="2.6 2.4"/><path d="m8 12 3 3 5-6"/>',
  newDiagram:
    '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 11v6M9 14h6"/>',
  library:
    '<path d="M12 3 3 7.5l9 4.5 9-4.5z"/><path d="m3 12 9 4.5 9-4.5"/><path d="m3 16.5 9 4.5 9-4.5"/>',
  save: '<path d="M5 4h11l4 4v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M8 4v5h7V4"/><rect x="7" y="13" width="10" height="7" rx="1"/>',
  openFile:
    '<path d="M12 3v12M7.5 10.5 12 15l4.5-4.5"/><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>',
  exportJson:
    '<path d="M8 4H7a2 2 0 0 0-2 2v3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v3a2 2 0 0 0 2 2h1"/><path d="M16 4h1a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2 2 2 0 0 0-2 2v3a2 2 0 0 1-2 2h-1"/><path d="M12 8v7M9.5 12.5 12 15l2.5-2.5"/>',
  exportImage:
    '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="m21 16-5-5-8 9"/>',
  clearCanvas:
    '<path d="m7 21-4.3-4.3a1 1 0 0 1 0-1.4L13 5a1 1 0 0 1 1.4 0l5.6 5.6a1 1 0 0 1 0 1.4L11 21z"/><path d="M21 21H7M9.5 8.5l6 6"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  language:
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>',
  version:
    '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.3"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>'
} as const;

export type UiIconName = keyof typeof PATHS;

interface Props {
  name: UiIconName;
  size?: number;
  style?: React.CSSProperties;
}

export const UiIcon = ({ name, size = 20, style }: Props) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', flex: 'none', ...style }}
      // Static, hard-coded path data only - never user input
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
    />
  );
};
