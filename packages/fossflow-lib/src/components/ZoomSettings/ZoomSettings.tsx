import React from 'react';
import { Box, FormControlLabel, Switch, Typography } from '@mui/material';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useTranslation } from 'src/stores/localeStore';

// Mouse-wheel zoom: towards the cursor or towards the centre of the view
export const ZoomSettings = () => {
  const zoomSettings = useUiStateStore((state) => {
    return state.zoomSettings;
  });
  const setZoomSettings = useUiStateStore((state) => {
    return state.actions.setZoomSettings;
  });
  const { t } = useTranslation();

  return (
    <FormControlLabel
      sx={{ alignItems: 'flex-start', mt: 1 }}
      control={
        <Switch
          checked={zoomSettings.zoomToCursor}
          onChange={() => {
            setZoomSettings({ ...zoomSettings, zoomToCursor: !zoomSettings.zoomToCursor });
          }}
        />
      }
      label={
        <Box sx={{ pt: 1 }}>
          <Typography variant="body1">{t('settings.zoom.zoomToCursor')}</Typography>
          <Typography variant="caption" color="text.secondary">
            {t('settings.zoom.zoomToCursorDesc')}
          </Typography>
        </Box>
      }
    />
  );
};
