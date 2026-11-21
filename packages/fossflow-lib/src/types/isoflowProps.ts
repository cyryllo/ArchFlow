import type { EditorModeEnum, MainMenuOptions } from './common';
import type { Model, ModelItem, ViewItem, Rectangle, TextBox, Connector } from './model';
import type { RendererProps } from './rendererProps';

export type InitialData = Model & {
  fitToView?: boolean;
  view?: string;
};

export interface LocaleProps {
  common: {
    exampleText: string;
  };
  mainMenu: {
    open: string;
    exportJson: string;
    exportImage: string;
    clearCanvas: string;
    settings: string;
    gitHub: string;
    menuButton: string;
    groupFile: string;
    groupExport: string;
    groupApp: string;
    help: string;
    openFile: string;
  };
  zoomControls: {
    zoomOut: string;
    zoomIn: string;
    fitToScreen: string;
    help: string;
  };
  contextMenu: {
    addNode: string;
    addRectangle: string;
    addText: string;
    paste: string;
    selectAll: string;
    fitToScreen: string;
    connectTo: string;
    properties: string;
    changeIcon: string;
    copy: string;
    cut: string;
    duplicate: string;
    bringToFront: string;
    sendToBack: string;
    delete: string;
    selectionCount: string;
  };
  toolMenu: {
    undo: string;
    redo: string;
    select: string;
    lassoSelect: string;
    freehandLasso: string;
    pan: string;
    addItem: string;
    rectangle: string;
    connector: string;
    text: string;
    boxSelect: string;
    selectionModes: string;
  };
  helpDialog: {
    title: string;
    close: string;
    keyboardShortcuts: string;
    mouseInteractions: string;
    action: string;
    shortcut: string;
    method: string;
    description: string;
    note: string;
    noteContent: string;
    // Keyboard shortcuts
    undoAction: string;
    undoDescription: string;
    redoAction: string;
    redoDescription: string;
    redoAltAction: string;
    redoAltDescription: string;
    helpAction: string;
    helpDescription: string;
    zoomInAction: string;
    zoomInShortcut: string;
    zoomInDescription: string;
    zoomOutAction: string;
    zoomOutShortcut: string;
    zoomOutDescription: string;
    panCanvasAction: string;
    panCanvasShortcut: string;
    panCanvasDescription: string;
    contextMenuAction: string;
    contextMenuShortcut: string;
    contextMenuDescription: string;
    // Mouse interactions
    selectToolAction: string;
    selectToolShortcut: string;
    selectToolDescription: string;
    panToolAction: string;
    panToolShortcut: string;
    panToolDescription: string;
    addItemAction: string;
    addItemShortcut: string;
    addItemDescription: string;
    drawRectangleAction: string;
    drawRectangleShortcut: string;
    drawRectangleDescription: string;
    createConnectorAction: string;
    createConnectorShortcut: string;
    createConnectorDescription: string;
    addTextAction: string;
    addTextShortcut: string;
    addTextDescription: string;
    copyAction: string;
    copyShortcut: string;
    copyDescription: string;
    cutAction: string;
    cutShortcut: string;
    cutDescription: string;
    pasteAction: string;
    pasteShortcut: string;
    pasteDescription: string;
    duplicateAction: string;
    duplicateShortcut: string;
    duplicateDescription: string;
    selectAllAction: string;
    selectAllShortcut: string;
    selectAllDescription: string;
    deleteAction: string;
    deleteShortcut: string;
    deleteDescription: string;
    escapeAction: string;
    escapeShortcut: string;
    escapeDescription: string;
    moveAction: string;
    moveShortcut: string;
    moveDescription: string;
    spacePanAction: string;
    spacePanShortcut: string;
    spacePanDescription: string;
    fitAction: string;
    fitShortcut: string;
    fitDescription: string;
    renameAction: string;
    renameShortcut: string;
    renameDescription: string;
    reorderAction: string;
    reorderShortcut: string;
    reorderDescription: string;
    shiftClickAction: string;
    shiftClickShortcut: string;
    shiftClickDescription: string;
  };
  connectorHintTooltip: {
    tipCreatingConnectors: string;
    tipConnectorTools: string;
    clickInstructionStart: string;
    clickInstructionMiddle: string;
    clickInstructionEnd: string;
    nowClickTarget: string;
    dragStart: string;
    dragEnd: string;
    rerouteStart: string;
    rerouteMiddle: string;
    rerouteEnd: string;
  };
  lassoHintTooltip: {
    tipLasso: string;
    tipFreehandLasso: string;
    lassoDragStart: string;
    lassoDragEnd: string;
    freehandDragStart: string;
    freehandDragMiddle: string;
    freehandDragEnd: string;
    freehandComplete: string;
    moveStart: string;
    moveMiddle: string;
    moveEnd: string;
  };
  importHintTooltip: {
    title: string;
    instructionStart: string;
    menuButton: string;
    instructionMiddle: string;
    openButton: string;
    instructionEnd: string;
  };
  connectorRerouteTooltip: {
    title: string;
    instructionStart: string;
    instructionSelect: string;
    instructionMiddle: string;
    instructionClick: string;
    instructionAnd: string;
    instructionDrag: string;
    instructionEnd: string;
  };
  connectorEmptySpaceTooltip: {
    message: string;
    instruction: string;
  };
  settings: {
    title: string;
    close: string;
    sectionMouse: string;
    sectionMouseDesc: string;
    sectionKeyboard: string;
    sectionKeyboardDesc: string;
    sectionConnectors: string;
    zoom: {
      description: string;
      zoomToCursor: string;
      zoomToCursorDesc: string;
    };
    hotkeys: {
      title: string;
      profile: string;
      profileQwerty: string;
      profileSmnrct: string;
      profileNone: string;
      tool: string;
      hotkey: string;
      toolSelect: string;
      toolPan: string;
      toolAddItem: string;
      toolRectangle: string;
      toolConnector: string;
      toolText: string;
      note: string;
    };
    pan: {
      title: string;
      mousePanOptions: string;
      emptyAreaClickPan: string;
      middleClickPan: string;
      rightClickPan: string;
      ctrlClickPan: string;
      altClickPan: string;
      keyboardPanOptions: string;
      arrowKeys: string;
      wasdKeys: string;
      ijklKeys: string;
      keyboardPanSpeed: string;
      note: string;
    };
    connector: {
      title: string;
      connectionMode: string;
      clickMode: string;
      clickModeDesc: string;
      dragMode: string;
      dragModeDesc: string;
      note: string;
    };
    iconPacks: {
      title: string;
      lazyLoading: string;
      lazyLoadingDesc: string;
      availablePacks: string;
      coreIsoflow: string;
      alwaysEnabled: string;
      awsPack: string;
      gcpPack: string;
      azurePack: string;
      kubernetesPack: string;
      loading: string;
      loaded: string;
      notLoaded: string;
      iconCount: string;
      lazyLoadingDisabledNote: string;
      note: string;
    };
  };
  lazyLoadingWelcome: {
    title: string;
    message: string;
    configPath: string;
    configPath2: string;
    canDisable: string;
    signature: string;
  };
  // other namespaces can be added here
  itemControls: {
    close: string;
    delete: string;
    name: string;
    description: string;
    labelHeight: string;
    iconSize: string;
    updateIcon: string;
    settings: string;
    searchIcons: string;
    searchIconsEnter: string;
    recentlyUsed: string;
    importIcons: string;
    treatAsIsometric: string;
    treatAsIsometricHint: string;
    placeHint: string;
    enterText: string;
    textSize: string;
    alignment: string;
    color: string;
    useCustomColor: string;
    labels: string;
    labelsCount: string;
    addLabel: string;
    noLabels: string;
    label: string;
    labelText: string;
    labelPosition: string;
    line1: string;
    line2: string;
    heightOffset: string;
    showDottedLine: string;
    width: string;
    lineStyle: string;
    styleSOLID: string;
    styleDOTTED: string;
    styleDASHED: string;
    lineType: string;
    lineSINGLE: string;
    lineDOUBLE: string;
    lineDOUBLE_WITH_CIRCLE: string;
    hintSearching: string;
    hintBrowsing: string;
    showArrow: string;
  };
  exportImage: {
    title: string;
    browserNoticeTitle: string;
    browserNotice: string;
    cropHint: string;
    cropCanvasHint: string;
    options: string;
    showGrid: string;
    expandDescriptions: string;
    cropToContent: string;
    backgroundColor: string;
    transparentBackground: string;
    quality: string;
    custom: string;
    scale: string;
    recrop: string;
    cropApplied: string;
    applyCrop: string;
    clearSelection: string;
    cancel: string;
    download: string;
    error: string;
    pickColor: string;
    editorUnavailable: string;
  };
}

export interface IconPackManagerProps {
  lazyLoadingEnabled: boolean;
  onToggleLazyLoading: (enabled: boolean) => void;
  packInfo: Array<{
    name: string;
    displayName: string;
    loaded: boolean;
    loading: boolean;
    error: string | null;
    iconCount: number;
  }>;
  enabledPacks: string[];
  onTogglePack: (packName: string, enabled: boolean) => void;
}

export interface IsoflowProps {
  initialData?: InitialData;
  mainMenuOptions?: MainMenuOptions;
  onModelUpdated?: (Model: Model) => void;
  width?: number | string;
  height?: number | string;
  enableDebugTools?: boolean;
  editorMode?: keyof typeof EditorModeEnum;
  renderer?: RendererProps;
  locale?: LocaleProps;
  iconPackManager?: IconPackManagerProps;
  // Overrides the main menu's "Export JSON" action (e.g. to show the host
  // app's own export dialog). Without it the raw model is downloaded.
  onExportJson?: () => void;
  // Extra entries the host app adds to the ☰ menu (new diagram, save, ...)
  menuItems?: HostMenuItem[];
}

export type HostMenuGroup = 'file' | 'export' | 'app';

export interface HostMenuItem {
  id: string;
  label: string;
  group: HostMenuGroup;
  // Name of an icon from the built-in UI icon set (see UiIcon)
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  onClick: () => void;
}

// What Ctrl+C / Ctrl+X put on the (in-app) clipboard
export interface ClipboardData {
  modelItems: ModelItem[];
  viewItems: ViewItem[];
  rectangles: Rectangle[];
  textBoxes: TextBox[];
  connectors: Connector[];
  // Top-left-most tile of the copied elements; paste aligns this to the target
  origin: { x: number; y: number };
}
