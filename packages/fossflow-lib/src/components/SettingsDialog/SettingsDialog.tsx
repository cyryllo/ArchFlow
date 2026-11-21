import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
  Divider
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { HotkeySettings } from '../HotkeySettings/HotkeySettings';
import { MousePanSettings, KeyboardPanSettings } from '../PanSettings/PanSettings';
import { ZoomSettings } from '../ZoomSettings/ZoomSettings';
import { ConnectorSettings } from '../ConnectorSettings/ConnectorSettings';
import { useTranslation } from 'src/stores/localeStore';

const Section = ({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => {
  return (
    <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="h6" sx={{ fontSize: 17 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      )}
      {children}
    </Box>
  );
};

// All settings on one scrolling page in three sections: mouse, keyboard,
// connectors. Fixed size, only the content scrolls.
export const SettingsDialog = () => {
  const dialog = useUiStateStore((state) => {
    return state.dialog;
  });
  const setDialog = useUiStateStore((state) => {
    return state.actions.setDialog;
  });
  const { t } = useTranslation();

  const isOpen = dialog === 'SETTINGS';

  const handleClose = () => {
    setDialog(null);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: 'min(88vh, 820px)' }
      }}
    >
      <DialogTitle>
        {t('settings.title')}
        <IconButton
          aria-label={t('settings.close')}
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => {
              return theme.palette.grey[500];
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ px: 3, py: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Section
            title={t('settings.sectionMouse')}
            description={t('settings.sectionMouseDesc')}
          >
            <MousePanSettings />
            <ZoomSettings />
          </Section>

          <Divider />

          <Section
            title={t('settings.sectionKeyboard')}
            description={t('settings.sectionKeyboardDesc')}
          >
            <HotkeySettings />
            <Typography variant="subtitle2" sx={{ mt: 2 }}>
              {t('settings.pan.keyboardPanOptions')}
            </Typography>
            <KeyboardPanSettings />
          </Section>

          <Divider />

          <Section title={t('settings.sectionConnectors')}>
            <ConnectorSettings />
          </Section>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t('settings.close')}</Button>
      </DialogActions>
    </Dialog>
  );
};
