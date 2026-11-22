import React, { createContext, useContext, useRef } from 'react';
import { createStore, useStore } from 'zustand';
import {
  CoordsUtils,
  incrementZoom,
  decrementZoom,
  getStartingMode
} from 'src/utils';
import { UiStateStore } from 'src/types';
import { INITIAL_UI_STATE } from 'src/config';
import { loadPanSettings, savePanSettings } from 'src/config/panSettings';
import { loadEditorPreferences, saveEditorPreferences } from 'src/config/editorPreferences';
import { DEFAULT_LABEL_SETTINGS } from 'src/config/labelSettings';

const initialState = () => {
  // Remembered Settings-dialog choices (tool letters, zoom, connector mode)
  const prefs = loadEditorPreferences();

  return createStore<UiStateStore>((set, get) => {
    const savePrefs = () => {
      const { hotkeyProfile, zoomSettings, connectorInteractionMode } = get();
      saveEditorPreferences({ hotkeyProfile, zoomSettings, connectorInteractionMode });
    };

    return {
      zoom: INITIAL_UI_STATE.zoom,
      scroll: INITIAL_UI_STATE.scroll,
      view: '',
      mainMenuOptions: [],
      editorMode: 'EXPLORABLE_READONLY',
      mode: getStartingMode('EXPLORABLE_READONLY'),
      iconCategoriesState: [],
      isMainMenuOpen: false,
      dialog: null,
      rendererEl: null,
      contextMenu: null,
      mouse: {
        position: { screen: CoordsUtils.zero(), tile: CoordsUtils.zero() },
        mousedown: null,
        delta: null
      },
      itemControls: null,
      enableDebugTools: false,
      hotkeyProfile: prefs.hotkeyProfile,
      panSettings: loadPanSettings(),
      zoomSettings: prefs.zoomSettings,
      labelSettings: DEFAULT_LABEL_SETTINGS,
      connectorInteractionMode: prefs.connectorInteractionMode,
      expandLabels: false, // Default to collapsed labels
      iconPackManager: null, // Will be set by Isoflow if provided
      exportJsonHandler: null, // Will be set by Isoflow if provided
      hostMenuItems: [],
      iconCategoryLabels: {},
      clipboard: null,

      actions: {
        setView: (view) => {
          set({ view });
        },
        setMainMenuOptions: (mainMenuOptions) => {
          set({ mainMenuOptions });
        },
        setEditorMode: (mode) => {
          // Guard against redundant calls resetting the user's current interaction
          // mode (e.g. back to CURSOR) just because a parent re-rendered and passed
          // an equal-but-newly-created editorMode/mainMenuOptions prop.
          if (get().editorMode === mode) return;
          set({ editorMode: mode, mode: getStartingMode(mode) });
        },
        setIconCategoriesState: (iconCategoriesState) => {
          set({ iconCategoriesState });
        },
        resetUiState: () => {
          set({
            mode: getStartingMode(get().editorMode),
            scroll: {
              position: CoordsUtils.zero(),
              offset: CoordsUtils.zero()
            },
            itemControls: null,
            zoom: 1
          });
        },
        setMode: (mode) => {
          set({ mode });
        },
        setDialog: (dialog) => {
          set({ dialog });
        },
        setIsMainMenuOpen: (isMainMenuOpen) => {
          set({ isMainMenuOpen, itemControls: null });
        },
        incrementZoom: () => {
          const { zoom } = get();
          set({ zoom: incrementZoom(zoom) });
        },
        decrementZoom: () => {
          const { zoom } = get();
          set({ zoom: decrementZoom(zoom) });
        },
        setZoom: (zoom) => {
          set({ zoom });
        },
        setScroll: ({ position, offset }) => {
          set({ scroll: { position, offset: offset ?? get().scroll.offset } });
        },
        setItemControls: (itemControls) => {
          set({ itemControls });
        },
        setContextMenu: (contextMenu) => {
          set({ contextMenu });
        },
        setMouse: (mouse) => {
          set({ mouse });
        },
        setEnableDebugTools: (enableDebugTools) => {
          set({ enableDebugTools });
        },
        setRendererEl: (el: HTMLDivElement) => {
          set({ rendererEl: el });
        },
        setHotkeyProfile: (hotkeyProfile: any) => {
          set({ hotkeyProfile });
          savePrefs();
        },
        setPanSettings: (panSettings) => {
          savePanSettings(panSettings);
          set({ panSettings });
        },
        setZoomSettings: (zoomSettings) => {
          set({ zoomSettings });
          savePrefs();
        },
        setLabelSettings: (labelSettings) => {
          set({ labelSettings });
        },
        setConnectorInteractionMode: (connectorInteractionMode) => {
          set({ connectorInteractionMode });
          savePrefs();
        },
        setExpandLabels: (expandLabels) => {
          set({ expandLabels });
        },
        setIconPackManager: (iconPackManager) => {
          set({ iconPackManager });
        },
        setExportJsonHandler: (exportJsonHandler) => {
          set({ exportJsonHandler });
        },
        setHostMenuItems: (hostMenuItems) => {
          set({ hostMenuItems });
        },
        setIconCategoryLabels: (iconCategoryLabels) => {
          set({ iconCategoryLabels });
        },
        setClipboard: (clipboard) => {
          set({ clipboard });
        }
      }
    };
  });
};

const UiStateContext = createContext<ReturnType<typeof initialState> | null>(
  null
);

interface ProviderProps {
  children: React.ReactNode;
}

// TODO: Typings below are pretty gnarly due to the way Zustand works.
// see https://github.com/pmndrs/zustand/discussions/1180#discussioncomment-3439061
export const UiStateProvider = ({ children }: ProviderProps) => {
  const storeRef = useRef<ReturnType<typeof initialState>>();

  if (!storeRef.current) {
    storeRef.current = initialState();
  }

  return (
    <UiStateContext.Provider value={storeRef.current}>
      {children}
    </UiStateContext.Provider>
  );
};

export function useUiStateStore<T>(selector: (state: UiStateStore) => T) {
  const store = useContext(UiStateContext);

  if (store === null) {
    throw new Error('Missing provider in the tree');
  }

  const value = useStore(store, selector);
  return value;
}
