import React, { useCallback, useMemo } from 'react';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useTranslation } from 'src/stores/localeStore';
import { useEditorActions } from 'src/hooks/useEditorActions';
import { UiIcon } from 'src/components/Icons/UiIcons';
import { HOTKEY_PROFILES } from 'src/config/hotkeys';
import { ItemReference } from 'src/types';
import { ContextMenu, ContextMenuEntry } from './ContextMenu';

interface Props {
  anchorEl?: HTMLElement | null;
}

const key = (k?: string | null) => {
  return k ? k.toUpperCase() : undefined;
};

/**
 * Right-click menu.
 * - On empty canvas: add node / draw rectangle / add text, paste, select all, fit.
 * - On an element: connect to…, properties, change icon, copy/cut/duplicate,
 *   stacking order, delete. If the element is part of the current
 *   multi-selection, the actions apply to the whole selection.
 */
export const ContextMenuManager = ({ anchorEl }: Props) => {
  const { t } = useTranslation('contextMenu');
  const contextMenu = useUiStateStore((state) => {
    return state.contextMenu;
  });
  const hotkeyProfile = useUiStateStore((state) => {
    return state.hotkeyProfile;
  });
  const uiStateActions = useUiStateStore((state) => {
    return state.actions;
  });
  const editor = useEditorActions();
  const hotkeys = HOTKEY_PROFILES[hotkeyProfile];

  const onClose = useCallback(() => {
    uiStateActions.setContextMenu(null);
  }, [uiStateActions]);

  // Run an action and close the menu
  const run = useCallback(
    (fn: () => void) => {
      return () => {
        onClose();
        fn();
      };
    },
    [onClose]
  );

  const entries = useMemo((): ContextMenuEntry[] => {
    if (!contextMenu || !editor.isEditable) return [];

    if (contextMenu.type === 'EMPTY' || !contextMenu.item) {
      const tile = contextMenu.tile;
      return [
        {
          label: t('addNode'),
          icon: <UiIcon name="addNode" />,
          shortcut: key(hotkeys.addItem),
          onClick: run(editor.startAddNode)
        },
        {
          label: t('addRectangle'),
          icon: <UiIcon name="rectangle" />,
          shortcut: key(hotkeys.rectangle),
          onClick: run(editor.startDrawRectangle)
        },
        {
          label: t('addText'),
          icon: <UiIcon name="text" />,
          shortcut: key(hotkeys.text),
          onClick: run(() => {
            editor.addTextAt(tile);
          })
        },
        'divider',
        {
          label: t('paste'),
          icon: <UiIcon name="paste" />,
          shortcut: 'Ctrl+V',
          disabled: !editor.canPaste,
          onClick: run(() => {
            editor.paste(tile);
          })
        },
        {
          label: t('selectAll'),
          icon: <UiIcon name="selectAll" />,
          shortcut: 'Ctrl+A',
          onClick: run(editor.selectAll)
        },
        'divider',
        {
          label: t('fitToScreen'),
          icon: <UiIcon name="fit" />,
          shortcut: 'Shift+1',
          onClick: run(editor.fitToView)
        }
      ];
    }

    const item: ItemReference = contextMenu.item;
    const selection = editor.getSelection();
    const inSelection =
      selection.length > 1 &&
      selection.some((r) => {
        return r.type === item.type && r.id === item.id;
      });
    const targets = inSelection ? selection : [item];

    const list: ContextMenuEntry[] = [];
    if (inSelection) {
      list.push({ heading: `${t('selectionCount')}: ${selection.length}` });
    }

    if (!inSelection && item.type === 'ITEM') {
      list.push({
        label: t('connectTo'),
        icon: <UiIcon name="connector" />,
        shortcut: key(hotkeys.connector),
        onClick: run(() => {
          editor.startConnectorFrom(item.id);
        })
      });
    }
    if (!inSelection) {
      list.push({
        label: t('properties'),
        icon: <UiIcon name="properties" />,
        onClick: run(() => {
          editor.showProperties(item);
        })
      });
    }
    if (!inSelection && item.type === 'ITEM') {
      list.push({
        label: t('changeIcon'),
        icon: <UiIcon name="changeIcon" />,
        shortcut: 'I',
        onClick: run(() => {
          editor.changeIcon(item);
        })
      });
    }

    if (item.type !== 'CONNECTOR') {
      if (list.length > 0) list.push('divider');
      list.push(
        {
          label: t('copy'),
          icon: <UiIcon name="copy" />,
          shortcut: 'Ctrl+C',
          onClick: run(() => {
            editor.copy(targets);
          })
        },
        {
          label: t('cut'),
          icon: <UiIcon name="cut" />,
          shortcut: 'Ctrl+X',
          onClick: run(() => {
            editor.cut(targets);
          })
        },
        {
          label: t('duplicate'),
          icon: <UiIcon name="duplicate" />,
          shortcut: 'Ctrl+D',
          onClick: run(() => {
            editor.duplicate(targets);
          })
        },
        'divider',
        {
          label: t('bringToFront'),
          icon: <UiIcon name="bringToFront" />,
          shortcut: 'Ctrl+]',
          onClick: run(() => {
            editor.reorder('front', targets);
          })
        },
        {
          label: t('sendToBack'),
          icon: <UiIcon name="sendToBack" />,
          shortcut: 'Ctrl+[',
          onClick: run(() => {
            editor.reorder('back', targets);
          })
        }
      );
    }

    list.push('divider', {
      label: t('delete'),
      icon: <UiIcon name="delete" />,
      shortcut: 'Delete',
      danger: true,
      onClick: run(() => {
        editor.deleteItems(targets);
      })
    });

    return list;
  }, [contextMenu, editor, hotkeys, run, t]);

  if (entries.length === 0) return null;

  return <ContextMenu anchorEl={anchorEl} onClose={onClose} menuItems={entries} />;
};
