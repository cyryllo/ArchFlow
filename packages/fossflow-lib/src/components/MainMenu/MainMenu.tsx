import React, { useState, useCallback, useMemo } from 'react';
import { Menu, Typography, Divider, Card, ListSubheader } from '@mui/material';
import { shallow } from 'zustand/shallow';
import { GitHub as GitHubIcon } from '@mui/icons-material';
import { UiIcon, UiIconName } from 'src/components/Icons/UiIcons';
import { HostMenuGroup, HostMenuItem } from 'src/types';
import { UiElement } from 'src/components/UiElement/UiElement';
import { IconButton } from 'src/components/IconButton/IconButton';
import { useUiStateStore } from 'src/stores/uiStateStore';
import {
  exportAsJSON,
  transformFromCompactFormat
} from 'src/utils/exportOptions';
import { modelFromModelStore } from 'src/utils';
import { useInitialDataManager } from 'src/hooks/useInitialDataManager';
import { useModelStore } from 'src/stores/modelStore';
import { useHistory } from 'src/hooks/useHistory';
import { DialogTypeEnum } from 'src/types/ui';
import { MenuItem } from './MenuItem';
import { useTranslation } from 'src/stores/localeStore';

const subheaderSx = {
  lineHeight: '28px',
  fontSize: 11,
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  bgcolor: 'transparent'
};

export const MainMenu = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const model = useModelStore((state) => {
    return modelFromModelStore(state);
  }, shallow);
  const isMainMenuOpen = useUiStateStore((state) => {
    return state.isMainMenuOpen;
  });
  const mainMenuOptions = useUiStateStore((state) => {
    return state.mainMenuOptions;
  });
  const hostMenuItems = useUiStateStore((state) => {
    return state.hostMenuItems;
  });
  const exportJsonHandler = useUiStateStore((state) => {
    return state.exportJsonHandler;
  });
  const uiStateActions = useUiStateStore((state) => {
    return state.actions;
  });
  const initialDataManager = useInitialDataManager();
  const { clearHistory } = useHistory();

  const { t } = useTranslation('mainMenu');

  const onToggleMenu = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget);
      uiStateActions.setIsMainMenuOpen(true);
    },
    [uiStateActions]
  );

  const gotoUrl = useCallback((url: string) => {
    window.open(url, '_blank');
  }, []);

  const { load } = initialDataManager;

  const onOpenModel = useCallback(async () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json';

    fileInput.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];

      if (!file) {
        throw new Error('No file selected');
      }

      const fileReader = new FileReader();

      fileReader.onload = async (e) => {
        const rawData = JSON.parse(e.target?.result as string);
        let modelData = rawData;

        // Check format and transform if needed
        if (rawData._?.f === 'compact') {
          modelData = transformFromCompactFormat(rawData);
        }

        load(modelData);
        clearHistory(); // Clear history when loading new model
      };
      fileReader.readAsText(file);

      uiStateActions.resetUiState();
    };

    await fileInput.click();
    uiStateActions.setIsMainMenuOpen(false);
  }, [uiStateActions, load, clearHistory]);

  const onExportAsJSON = useCallback(async () => {
    uiStateActions.setIsMainMenuOpen(false);
    if (exportJsonHandler) {
      exportJsonHandler();
      return;
    }
    exportAsJSON(model);
  }, [model, uiStateActions, exportJsonHandler]);

  const onExportAsImage = useCallback(() => {
    uiStateActions.setIsMainMenuOpen(false);
    uiStateActions.setDialog(DialogTypeEnum.EXPORT_IMAGE);
  }, [uiStateActions]);

  const { clear } = initialDataManager;

  const onClearCanvas = useCallback(() => {
    clear();
    clearHistory(); // Clear history when clearing canvas
    uiStateActions.setIsMainMenuOpen(false);
  }, [uiStateActions, clear, clearHistory]);

  const onOpenSettings = useCallback(() => {
    uiStateActions.setIsMainMenuOpen(false);
    uiStateActions.setDialog(DialogTypeEnum.SETTINGS);
  }, [uiStateActions]);

  const sectionVisibility = useMemo(() => {
    return {
      links: Boolean(
        mainMenuOptions.find((opt) => {
          return opt.includes('LINK');
        })
      ),
      version: Boolean(mainMenuOptions.includes('VERSION'))
    };
  }, [mainMenuOptions]);

  const onOpenHelp = useCallback(() => {
    uiStateActions.setIsMainMenuOpen(false);
    uiStateActions.setDialog(DialogTypeEnum.HELP);
  }, [uiStateActions]);

  // Entries the host app adds (new diagram, my diagrams, save, language...)
  const hostItems = (group: HostMenuGroup) => {
    return hostMenuItems
      .filter((item) => {
        return item.group === group;
      })
      .map((item: HostMenuItem) => {
        return (
          <MenuItem
            key={item.id}
            disabled={item.disabled}
            shortcut={item.shortcut}
            Icon={item.icon ? <UiIcon name={item.icon as UiIconName} /> : undefined}
            onClick={() => {
              uiStateActions.setIsMainMenuOpen(false);
              item.onClick();
            }}
          >
            {item.label}
          </MenuItem>
        );
      });
  };

  if (mainMenuOptions.length === 0) {
    return null;
  }

  return (
    <UiElement>
      <IconButton
        Icon={<UiIcon name="menu" />}
        name={t('menuButton')}
        onClick={onToggleMenu}
        isActive={isMainMenuOpen}
      />

      <Menu
        anchorEl={anchorEl}
        open={isMainMenuOpen}
        onClose={() => {
          uiStateActions.setIsMainMenuOpen(false);
        }}
        elevation={0}
        sx={{
          mt: 2
        }}
        MenuListProps={{
          sx: {
            minWidth: '280px',
            py: 0
          }
        }}
      >
        <Card sx={{ py: 1 }}>
          {/* File */}
          <ListSubheader sx={subheaderSx}>{t('groupFile')}</ListSubheader>
          {hostItems('file')}
          {mainMenuOptions.includes('ACTION.OPEN') && (
            <MenuItem onClick={onOpenModel} Icon={<UiIcon name="openFile" />}>
              {t('openFile')}
            </MenuItem>
          )}
          {mainMenuOptions.includes('ACTION.CLEAR_CANVAS') && (
            <MenuItem onClick={onClearCanvas} Icon={<UiIcon name="clearCanvas" />}>
              {t('clearCanvas')}
            </MenuItem>
          )}

          {/* Export */}
          {(mainMenuOptions.includes('EXPORT.JSON') ||
            mainMenuOptions.includes('EXPORT.PNG') ||
            hostMenuItems.some((i) => {
              return i.group === 'export';
            })) && (
            <>
              <Divider />
              <ListSubheader sx={subheaderSx}>{t('groupExport')}</ListSubheader>
              {mainMenuOptions.includes('EXPORT.JSON') && (
                <MenuItem onClick={onExportAsJSON} Icon={<UiIcon name="exportJson" />}>
                  {t('exportJson')}
                </MenuItem>
              )}
              {mainMenuOptions.includes('EXPORT.PNG') && (
                <MenuItem onClick={onExportAsImage} Icon={<UiIcon name="exportImage" />}>
                  {t('exportImage')}
                </MenuItem>
              )}
              {hostItems('export')}
            </>
          )}

          {/* Application */}
          <Divider />
          <ListSubheader sx={subheaderSx}>{t('groupApp')}</ListSubheader>
          <MenuItem onClick={onOpenSettings} Icon={<UiIcon name="settings" />}>
            {t('settings')}
          </MenuItem>
          {hostItems('app')}
          <MenuItem
            onClick={onOpenHelp}
            Icon={<UiIcon name="help" />}
            shortcut="F1"
          >
            {t('help')}
          </MenuItem>

          {sectionVisibility.links && (
            <>
              <Divider />

              {mainMenuOptions.includes('LINK.GITHUB') && (
                <MenuItem
                  onClick={() => {
                    return gotoUrl(`${REPOSITORY_URL}`);
                  }}
                  Icon={<GitHubIcon />}
                >
                  {t('gitHub')}
                </MenuItem>
              )}
            </>
          )}

          {sectionVisibility.version && (
            <>
              <Divider />

              {mainMenuOptions.includes('VERSION') && (
                <MenuItem>
                  <Typography variant="body2" color="text.secondary">
                    ArchFlow v{PACKAGE_VERSION}
                  </Typography>
                </MenuItem>
              )}
            </>
          )}
        </Card>
      </Menu>
    </UiElement>
  );
};
