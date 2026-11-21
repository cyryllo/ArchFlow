export interface PanSettings {
  // Mouse pan options
  middleClickPan: boolean;
  rightClickPan: boolean;
  ctrlClickPan: boolean;
  altClickPan: boolean;
  emptyAreaClickPan: boolean;
  
  // Keyboard pan options
  arrowKeysPan: boolean;
  wasdPan: boolean;
  ijklPan: boolean;
  
  // Pan speed
  keyboardPanSpeed: number;
}

export const DEFAULT_PAN_SETTINGS: PanSettings = {
  // Mouse options - start with common defaults
  middleClickPan: true,
  rightClickPan: false,
  ctrlClickPan: false,
  altClickPan: false,
  // Off by default: dragging empty space with the Select tool draws a
  // selection box. The Pan (hand) tool / middle click move the view.
  emptyAreaClickPan: false,
  
  // Keyboard options
  arrowKeysPan: true,
  wasdPan: false,
  ijklPan: false,
  
  // Pan speed (pixels per key press)
  keyboardPanSpeed: 20
};

const PAN_SETTINGS_STORAGE_KEY = 'archflow-pan-settings';

// Pan settings are persisted so changes made in the Settings dialog survive
// an app restart. Unknown/missing keys fall back to the defaults.
export const loadPanSettings = (): PanSettings => {
  try {
    const raw = localStorage.getItem(PAN_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_PAN_SETTINGS;
    const stored = JSON.parse(raw) as Partial<PanSettings>;
    const merged = { ...DEFAULT_PAN_SETTINGS };
    (Object.keys(DEFAULT_PAN_SETTINGS) as (keyof PanSettings)[]).forEach(
      (key) => {
        if (typeof stored[key] === typeof DEFAULT_PAN_SETTINGS[key]) {
          (merged as Record<string, unknown>)[key] = stored[key];
        }
      }
    );
    return merged;
  } catch {
    return DEFAULT_PAN_SETTINGS;
  }
};

export const savePanSettings = (settings: PanSettings) => {
  try {
    localStorage.setItem(PAN_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage unavailable (private mode, quota) - keep the in-memory value only
  }
};