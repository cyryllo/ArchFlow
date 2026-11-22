import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Box, useTheme } from '@mui/material';
import { EditorModeEnum, DialogTypeEnum } from 'src/types';
import { UiElement } from 'components/UiElement/UiElement';
import { SceneLayer } from 'src/components/SceneLayer/SceneLayer';
import { DragAndDrop } from 'src/components/DragAndDrop/DragAndDrop';
import { ItemControlsManager } from 'src/components/ItemControls/ItemControlsManager';
import { ToolMenu } from 'src/components/ToolMenu/ToolMenu';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { MainMenu } from 'src/components/MainMenu/MainMenu';
import { ZoomControls } from 'src/components/ZoomControls/ZoomControls';
import { DebugUtils } from 'src/components/DebugUtils/DebugUtils';
import { useResizeObserver } from 'src/hooks/useResizeObserver';
import { ContextMenuManager } from 'src/components/ContextMenu/ContextMenuManager';
import { ExportImageDialog } from '../ExportImageDialog/ExportImageDialog';
import { HelpDialog } from '../HelpDialog/HelpDialog';
import { SettingsDialog } from '../SettingsDialog/SettingsDialog';
import { CoordsUtils, getTilePosition } from 'src/utils';

const ToolsEnum = {
  MAIN_MENU: 'MAIN_MENU',
  ZOOM_CONTROLS: 'ZOOM_CONTROLS',
  TOOL_MENU: 'TOOL_MENU',
  ITEM_CONTROLS: 'ITEM_CONTROLS'
} as const;

interface EditorModeMapping {
  [k: string]: (keyof typeof ToolsEnum)[];
}

const EDITOR_MODE_MAPPING: EditorModeMapping = {
  [EditorModeEnum.EDITABLE]: [
    'ITEM_CONTROLS',
    'ZOOM_CONTROLS',
    'TOOL_MENU',
    'MAIN_MENU'
  ],
  [EditorModeEnum.EXPLORABLE_READONLY]: ['ZOOM_CONTROLS'],
  [EditorModeEnum.NON_INTERACTIVE]: []
};

const getEditorModeMapping = (editorMode: keyof typeof EditorModeEnum) => {
  const availableUiFeatures = EDITOR_MODE_MAPPING[editorMode];

  return availableUiFeatures;
};

export const UiOverlay = () => {
  const theme = useTheme();
  // Anchor for the right-click menu. Kept in state (not a ref) so the menu
  // opens in the same render the anchor appears, not on the next mouse move.
  const [contextMenuAnchor, setContextMenuAnchor] = useState<HTMLElement | null>(null);
  const toolMenuRef = useRef<HTMLDivElement>(null);
  const { appPadding } = theme.customVars;
  const spacing = useCallback(
    (multiplier: number) => {
      return parseInt(theme.spacing(multiplier), 10);
    },
    [theme]
  );
  const uiStateActions = useUiStateStore((state) => {
    return state.actions;
  });
  const enableDebugTools = useUiStateStore((state) => {
    return state.enableDebugTools;
  });
  const mode = useUiStateStore((state) => {
    return state.mode;
  });
  const mouse = useUiStateStore((state) => {
    return state.mouse;
  });
  const dialog = useUiStateStore((state) => {
    return state.dialog;
  });
  const itemControls = useUiStateStore((state) => {
    return state.itemControls;
  });
  const editorMode = useUiStateStore((state) => {
    return state.editorMode;
  });
  const availableTools = useMemo(() => {
    return getEditorModeMapping(editorMode);
  }, [editorMode]);
  const rendererEl = useUiStateStore((state) => {
    return state.rendererEl;
  });
  const contextMenu = useUiStateStore((state) => {
    return state.contextMenu;
  });
  const { size: rendererSize } = useResizeObserver(rendererEl);

  // The main menu/zoom/tool rows sit right under the host app's own toolbar,
  // so they use a smaller top offset than appPadding.y (which is also used
  // for spacing that isn't adjacent to the app toolbar, e.g. ITEM_CONTROLS).
  const topRowY = 12;

  return (
    <>
      <Box
        sx={{
          position: 'absolute',
          width: 0,
          height: 0,
          top: 0,
          left: 0
        }}
      >
        {availableTools.includes('ITEM_CONTROLS') && itemControls && (
          <UiElement
            sx={{
              position: 'absolute',
              width: '360px',
              overflowY: 'scroll',
              '&::-webkit-scrollbar': {
                display: 'none'
              }
            }}
            style={{
              left: appPadding.x,
              top: topRowY + theme.customVars.toolMenu.height + spacing(2),
              maxHeight: rendererSize.height - appPadding.y * 6
            }}
          >
            <ItemControlsManager />
          </UiElement>
        )}

        {/* One row along the top: ☰ menu on the left, tools in the middle,
            zoom on the right */}
        <Box
          sx={{
            position: 'absolute',
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            columnGap: spacing(1),
            pointerEvents: 'none',
            '& > *': { pointerEvents: 'auto' }
          }}
          style={{
            top: topRowY,
            left: appPadding.x,
            width: Math.max(0, rendererSize.width - appPadding.x * 2)
          }}
        >
          <Box sx={{ justifySelf: 'start' }}>
            {availableTools.includes('MAIN_MENU') && <MainMenu />}
          </Box>
          <Box ref={toolMenuRef} sx={{ justifySelf: 'center' }}>
            {availableTools.includes('TOOL_MENU') && <ToolMenu />}
          </Box>
          <Box sx={{ justifySelf: 'end' }}>
            {availableTools.includes('ZOOM_CONTROLS') && <ZoomControls />}
          </Box>
        </Box>

        {enableDebugTools && (
          <UiElement
            sx={{
              position: 'absolute',
              width: 350,
              transform: 'translateY(-100%)'
            }}
            style={{
              maxWidth: `calc(${rendererSize.width} - ${appPadding.x * 2}px)`,
              left: appPadding.x,
              top: rendererSize.height - appPadding.y * 2 - spacing(1)
            }}
          >
            <DebugUtils />
          </UiElement>
        )}
      </Box>

      {mode.type === 'PLACE_ICON' && mode.id && (
        <SceneLayer disableAnimation>
          <DragAndDrop iconId={mode.id} tile={mouse.position.tile} />
        </SceneLayer>
      )}

      {dialog === DialogTypeEnum.EXPORT_IMAGE && (
        <ExportImageDialog
          onClose={() => {
            return uiStateActions.setDialog(null);
          }}
        />
      )}

      {dialog === DialogTypeEnum.HELP && <HelpDialog />}

      {dialog === DialogTypeEnum.SETTINGS && <SettingsDialog />}

      <SceneLayer>
        {contextMenu && (
          <Box 
            ref={setContextMenuAnchor}
            sx={{
              position: 'absolute',
              left: getTilePosition({ tile: contextMenu.tile }).x,
              top: getTilePosition({ tile: contextMenu.tile }).y
            }}
          />
        )}
        <ContextMenuManager anchorEl={contextMenu ? contextMenuAnchor : null} />
      </SceneLayer>
    </>
  );
};
