import { DEFAULT_HOTKEY_PROFILE, HOTKEY_PROFILES, HotkeyProfile } from './hotkeys';
import { DEFAULT_ZOOM_SETTINGS, ZoomSettings } from './zoomSettings';

// Editor preferences from the Settings dialog that are remembered between
// sessions (localStorage). Pan settings have their own key (panSettings.ts).
export interface EditorPreferences {
  hotkeyProfile: HotkeyProfile;
  zoomSettings: ZoomSettings;
  connectorInteractionMode: 'click' | 'drag';
}

const STORAGE_KEY = 'archflow-editor-preferences';

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  hotkeyProfile: DEFAULT_HOTKEY_PROFILE,
  zoomSettings: DEFAULT_ZOOM_SETTINGS,
  connectorInteractionMode: 'click'
};

// Unknown or invalid stored values fall back to the defaults one by one
export const loadEditorPreferences = (): EditorPreferences => {
  const prefs = { ...DEFAULT_EDITOR_PREFERENCES };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return prefs;
    const stored = JSON.parse(raw) as Partial<EditorPreferences>;
    if (stored.hotkeyProfile && stored.hotkeyProfile in HOTKEY_PROFILES) {
      prefs.hotkeyProfile = stored.hotkeyProfile;
    }
    if (typeof stored.zoomSettings?.zoomToCursor === 'boolean') {
      prefs.zoomSettings = { ...DEFAULT_ZOOM_SETTINGS, zoomToCursor: stored.zoomSettings.zoomToCursor };
    }
    if (stored.connectorInteractionMode === 'click' || stored.connectorInteractionMode === 'drag') {
      prefs.connectorInteractionMode = stored.connectorInteractionMode;
    }
  } catch {
    // Unreadable storage - keep the defaults
  }
  return prefs;
};

export const saveEditorPreferences = (prefs: EditorPreferences) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Storage unavailable (private mode, quota) - keep them in memory only
  }
};
