import { Coords, EditorModeEnum, MainMenuOptions } from './common';
import { Icon } from './model';
import { ItemReference } from './scene';
import { HotkeyProfile } from 'src/config/hotkeys';
import { PanSettings } from 'src/config/panSettings';
import { ZoomSettings } from 'src/config/zoomSettings';
import { LabelSettings } from 'src/config/labelSettings';
import { IconPackManagerProps, HostMenuItem, ClipboardData } from './isoflowProps';

interface AddItemControls {
  type: 'ADD_ITEM';
}

export type ItemControls = ItemReference | AddItemControls;

export interface Mouse {
  position: {
    screen: Coords;
    tile: Coords;
  };
  mousedown: {
    screen: Coords;
    tile: Coords;
  } | null;
  delta: {
    screen: Coords;
    tile: Coords;
  } | null;
}

// Mode types
export interface InteractionsDisabled {
  type: 'INTERACTIONS_DISABLED';
  showCursor: boolean;
}

export interface CursorMode {
  type: 'CURSOR';
  showCursor: boolean;
  mousedownItem: ItemReference | null;
}

export interface DragItemsMode {
  type: 'DRAG_ITEMS';
  showCursor: boolean;
  items: ItemReference[];
  isInitialMovement: Boolean;
  // Set when a multi-selection is being dragged: after the drop the same
  // elements stay selected, so they can be moved again right away
  keepSelection?: boolean;
}

export interface PanMode {
  type: 'PAN';
  showCursor: boolean;
  // Set for a temporary pan (empty-area drag, middle/right/modifier click):
  // the mode to go back to when the mouse button is released. Absent when
  // the Pan tool itself was selected, which keeps PAN active until changed.
  returnTo?: Mode;
}

export interface PlaceIconMode {
  type: 'PLACE_ICON';
  showCursor: boolean;
  id: string | null;
}

export interface ConnectorMode {
  type: 'CONNECTOR';
  showCursor: boolean;
  id: string | null;
  // For click-based connection mode
  startAnchor?: {
    tile?: Coords;
    itemId?: string;
  };
  isConnecting?: boolean;
}

export interface DrawRectangleMode {
  type: 'RECTANGLE.DRAW';
  showCursor: boolean;
  id: string | null;
}

export const AnchorPositionOptions = {
  BOTTOM_LEFT: 'BOTTOM_LEFT',
  BOTTOM_RIGHT: 'BOTTOM_RIGHT',
  TOP_RIGHT: 'TOP_RIGHT',
  TOP_LEFT: 'TOP_LEFT'
} as const;

export type AnchorPosition = keyof typeof AnchorPositionOptions;

export interface TransformRectangleMode {
  type: 'RECTANGLE.TRANSFORM';
  showCursor: boolean;
  id: string;
  selectedAnchor: AnchorPosition | null;
}

export interface TextBoxMode {
  type: 'TEXTBOX';
  showCursor: boolean;
  id: string | null;
}

export interface LassoMode {
  type: 'LASSO';
  showCursor: boolean;
  selection: {
    startTile: Coords;
    endTile: Coords;
    items: ItemReference[];
    // The screen-aligned box being dragged, in scene (un-zoomed) pixels.
    // Absent for selections made otherwise (Ctrl+A, Shift+click, after a
    // move): their box is drawn around the selected elements.
    sceneRect?: { from: Coords; to: Coords };
  } | null;
  isDragging: boolean;
  // True when the box selection was started by dragging empty space with the
  // Select tool (rather than picking the Lasso tool). Such a selection hands
  // control back to Select once it is used or dismissed.
  fromCursor?: boolean;
}

export interface FreehandLassoMode {
  type: 'FREEHAND_LASSO';
  showCursor: boolean;
  path: Coords[]; // Screen coordinates of the drawn path
  selection: {
    pathTiles: Coords[]; // Tile coordinates of the path points
    items: ItemReference[];
  } | null;
  isDragging: boolean;
}

export type Mode =
  | InteractionsDisabled
  | CursorMode
  | PanMode
  | PlaceIconMode
  | ConnectorMode
  | DrawRectangleMode
  | TransformRectangleMode
  | DragItemsMode
  | TextBoxMode
  | LassoMode
  | FreehandLassoMode;
// End mode types

export interface Scroll {
  position: Coords;
  offset: Coords;
}

export interface IconCollectionState {
  id?: string;
  isExpanded: boolean;
}

export type IconCollectionStateWithIcons = IconCollectionState & {
  icons: Icon[];
};

export const DialogTypeEnum = {
  EXPORT_IMAGE: 'EXPORT_IMAGE',
  HELP: 'HELP',
  SETTINGS: 'SETTINGS'
} as const;

export interface ContextMenu {
  type: 'ITEM' | 'EMPTY';
  item?: ItemReference;
  tile: Coords;
}


export type ConnectorInteractionMode = 'click' | 'drag';

export interface UiState {
  view: string;
  mainMenuOptions: MainMenuOptions;
  editorMode: keyof typeof EditorModeEnum;
  iconCategoriesState: IconCollectionState[];
  mode: Mode;
  dialog: keyof typeof DialogTypeEnum | null;
  isMainMenuOpen: boolean;
  itemControls: ItemControls | null;
  contextMenu: ContextMenu | null;
  zoom: number;
  scroll: Scroll;
  mouse: Mouse;
  rendererEl: HTMLDivElement | null;
  enableDebugTools: boolean;
  hotkeyProfile: HotkeyProfile;
  panSettings: PanSettings;
  zoomSettings: ZoomSettings;
  labelSettings: LabelSettings;
  connectorInteractionMode: ConnectorInteractionMode;
  expandLabels: boolean;
  iconPackManager: IconPackManagerProps | null;
  exportJsonHandler: (() => void) | null;
  hostMenuItems: HostMenuItem[];
  iconCategoryLabels: Record<string, string>;
  clipboard: ClipboardData | null;
}

export interface UiStateActions {
  setView: (view: string) => void;
  setMainMenuOptions: (options: MainMenuOptions) => void;
  setEditorMode: (mode: keyof typeof EditorModeEnum) => void;
  setIconCategoriesState: (iconCategoriesState: IconCollectionState[]) => void;
  resetUiState: () => void;
  setMode: (mode: Mode) => void;
  incrementZoom: () => void;
  decrementZoom: () => void;
  setIsMainMenuOpen: (isOpen: boolean) => void;
  setDialog: (dialog: keyof typeof DialogTypeEnum | null) => void;
  setZoom: (zoom: number) => void;
  setScroll: (scroll: Scroll) => void;
  setItemControls: (itemControls: ItemControls | null) => void;
  setContextMenu: (contextMenu: ContextMenu | null) => void;
  setMouse: (mouse: Mouse) => void;
  setRendererEl: (el: HTMLDivElement) => void;
  setEnableDebugTools: (enabled: boolean) => void;
  setHotkeyProfile: (profile: HotkeyProfile) => void;
  setPanSettings: (settings: PanSettings) => void;
  setZoomSettings: (settings: ZoomSettings) => void;
  setLabelSettings: (settings: LabelSettings) => void;
  setConnectorInteractionMode: (mode: ConnectorInteractionMode) => void;
  setExpandLabels: (expand: boolean) => void;
  setIconPackManager: (iconPackManager: IconPackManagerProps | null) => void;
  setExportJsonHandler: (handler: (() => void) | null) => void;
  setHostMenuItems: (items: HostMenuItem[]) => void;
  setIconCategoryLabels: (labels: Record<string, string>) => void;
  setClipboard: (clipboard: ClipboardData | null) => void;
}

export type UiStateStore = UiState & {
  actions: UiStateActions;
};
