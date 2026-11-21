import React, { useCallback, useState } from 'react';
import {
  Stack,
  Divider,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  ButtonBase
} from '@mui/material';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { IconButton } from 'src/components/IconButton/IconButton';
import { UiElement } from 'src/components/UiElement/UiElement';
import { UiIcon } from 'src/components/Icons/UiIcons';
import { useScene } from 'src/hooks/useScene';
import { useHistory } from 'src/hooks/useHistory';
import { TEXTBOX_DEFAULTS } from 'src/config';
import { generateId } from 'src/utils';
import { HOTKEY_PROFILES } from 'src/config/hotkeys';
import { useTranslation } from 'src/stores/localeStore';

type SelectionTool = 'LASSO' | 'FREEHAND_LASSO';

const withKey = (label: string, key?: string | null) => {
  return key ? `${label} (${key.toUpperCase()})` : label;
};

export const ToolMenu = () => {
  const { t } = useTranslation('toolMenu');
  const { createTextBox } = useScene();
  const { undo, redo, canUndo, canRedo } = useHistory();
  const mode = useUiStateStore((state) => {
    return state.mode;
  });
  const uiStateStoreActions = useUiStateStore((state) => {
    return state.actions;
  });
  const mousePosition = useUiStateStore((state) => {
    return state.mouse.position.tile;
  });
  const hotkeyProfile = useUiStateStore((state) => {
    return state.hotkeyProfile;
  });

  const hotkeys = HOTKEY_PROFILES[hotkeyProfile];

  // Box select and freehand lasso share one button; the small arrow next to
  // it switches which one the button starts (remembered for the session)
  const [selectionTool, setSelectionTool] = useState<SelectionTool>('LASSO');
  const [selectionMenuAnchor, setSelectionMenuAnchor] =
    useState<HTMLElement | null>(null);

  // During a temporary pan (empty-area drag, middle click...) keep the tool
  // the user actually picked highlighted instead of flashing the Pan button.
  // Likewise a selection box drawn with the Select tool keeps Select lit.
  const activeTool =
    mode.type === 'PAN' && mode.returnTo
      ? mode.returnTo.type
      : mode.type === 'LASSO' && mode.fromCursor
        ? 'CURSOR'
        : mode.type;

  const startSelectionTool = useCallback(
    (tool: SelectionTool) => {
      setSelectionTool(tool);
      if (tool === 'LASSO') {
        uiStateStoreActions.setMode({
          type: 'LASSO',
          showCursor: true,
          selection: null,
          isDragging: false
        });
      } else {
        uiStateStoreActions.setMode({
          type: 'FREEHAND_LASSO',
          showCursor: true,
          path: [],
          selection: null,
          isDragging: false
        });
      }
    },
    [uiStateStoreActions]
  );

  // Keep the shared button showing whichever selection tool is active
  const shownSelectionTool: SelectionTool =
    activeTool === 'FREEHAND_LASSO' || activeTool === 'LASSO'
      ? activeTool
      : selectionTool;

  const createTextBoxProxy = useCallback(() => {
    const textBoxId = generateId();

    createTextBox({
      ...TEXTBOX_DEFAULTS,
      id: textBoxId,
      tile: mousePosition
    });

    uiStateStoreActions.setMode({
      type: 'TEXTBOX',
      showCursor: false,
      id: textBoxId
    });
  }, [uiStateStoreActions, createTextBox, mousePosition]);

  const selectionOptions: {
    tool: SelectionTool;
    label: string;
    icon: 'boxSelect' | 'lasso';
    key: string | null;
  }[] = [
    { tool: 'LASSO', label: t('boxSelect'), icon: 'boxSelect', key: hotkeys.lasso },
    {
      tool: 'FREEHAND_LASSO',
      label: t('freehandLasso'),
      icon: 'lasso',
      key: hotkeys.freehandLasso
    }
  ];
  const shownOption =
    selectionOptions.find((o) => {
      return o.tool === shownSelectionTool;
    }) ?? selectionOptions[0];

  return (
    <UiElement>
      <Stack direction="row" alignItems="center">
        {/* History */}
        <IconButton
          name={`${t('undo')} (Ctrl+Z)`}
          Icon={<UiIcon name="undo" />}
          onClick={undo}
          disabled={!canUndo}
        />
        <IconButton
          name={`${t('redo')} (Ctrl+Y)`}
          Icon={<UiIcon name="redo" />}
          onClick={redo}
          disabled={!canRedo}
        />

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Selecting and moving */}
        <IconButton
          name={withKey(t('select'), hotkeys.select)}
          hotkey={hotkeys.select}
          Icon={<UiIcon name="select" />}
          onClick={() => {
            uiStateStoreActions.setMode({
              type: 'CURSOR',
              showCursor: true,
              mousedownItem: null
            });
          }}
          isActive={activeTool === 'CURSOR' || activeTool === 'DRAG_ITEMS'}
        />
        <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
          <IconButton
            name={withKey(shownOption.label, shownOption.key)}
            hotkey={shownOption.key}
            Icon={<UiIcon name={shownOption.icon} />}
            onClick={() => {
              startSelectionTool(shownOption.tool);
            }}
            isActive={activeTool === 'LASSO' || activeTool === 'FREEHAND_LASSO'}
          />
          <ButtonBase
            aria-label={t('selectionModes')}
            title={t('selectionModes')}
            onClick={(e) => {
              setSelectionMenuAnchor(e.currentTarget);
            }}
            sx={{
              width: 14,
              color: 'grey.500',
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            <UiIcon name="chevronDown" size={12} />
          </ButtonBase>
          <Menu
            anchorEl={selectionMenuAnchor}
            open={Boolean(selectionMenuAnchor)}
            onClose={() => {
              setSelectionMenuAnchor(null);
            }}
          >
            {selectionOptions.map((option) => {
              return (
                <MenuItem
                  key={option.tool}
                  selected={option.tool === shownSelectionTool}
                  onClick={() => {
                    setSelectionMenuAnchor(null);
                    startSelectionTool(option.tool);
                  }}
                >
                  <ListItemIcon>
                    <UiIcon name={option.icon} />
                  </ListItemIcon>
                  <ListItemText>{option.label}</ListItemText>
                  {option.key && (
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 3 }}>
                      {option.key.toUpperCase()}
                    </Typography>
                  )}
                </MenuItem>
              );
            })}
          </Menu>
        </Box>
        <IconButton
          name={withKey(t('pan'), hotkeys.pan)}
          hotkey={hotkeys.pan}
          Icon={<UiIcon name="pan" />}
          onClick={() => {
            uiStateStoreActions.setMode({
              type: 'PAN',
              showCursor: false
            });

            uiStateStoreActions.setItemControls(null);
          }}
          isActive={activeTool === 'PAN'}
        />

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Adding things */}
        <IconButton
          name={withKey(t('addItem'), hotkeys.addItem)}
          hotkey={hotkeys.addItem}
          Icon={<UiIcon name="addNode" />}
          onClick={() => {
            uiStateStoreActions.setItemControls({
              type: 'ADD_ITEM'
            });
            uiStateStoreActions.setMode({
              type: 'PLACE_ICON',
              showCursor: true,
              id: null
            });
          }}
          isActive={activeTool === 'PLACE_ICON'}
        />
        <IconButton
          name={withKey(t('rectangle'), hotkeys.rectangle)}
          hotkey={hotkeys.rectangle}
          Icon={<UiIcon name="rectangle" />}
          onClick={() => {
            uiStateStoreActions.setMode({
              type: 'RECTANGLE.DRAW',
              showCursor: true,
              id: null
            });
          }}
          isActive={activeTool === 'RECTANGLE.DRAW'}
        />
        <IconButton
          name={withKey(t('connector'), hotkeys.connector)}
          hotkey={hotkeys.connector}
          Icon={<UiIcon name="connector" />}
          onClick={() => {
            uiStateStoreActions.setMode({
              type: 'CONNECTOR',
              id: null,
              showCursor: true
            });
          }}
          isActive={activeTool === 'CONNECTOR'}
        />
        <IconButton
          name={withKey(t('text'), hotkeys.text)}
          hotkey={hotkeys.text}
          Icon={<UiIcon name="text" />}
          onClick={createTextBoxProxy}
          isActive={activeTool === 'TEXTBOX'}
        />
      </Stack>
    </UiElement>
  );
};
