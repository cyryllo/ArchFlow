import React from 'react';
import { Stack, Box, Typography, Divider } from '@mui/material';
import { toPx } from 'src/utils';
import { UiElement } from 'src/components/UiElement/UiElement';
import { IconButton } from 'src/components/IconButton/IconButton';
import { UiIcon } from 'src/components/Icons/UiIcons';
import { MAX_ZOOM, MIN_ZOOM } from 'src/config';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useDiagramUtils } from 'src/hooks/useDiagramUtils';
import { useTranslation } from 'src/stores/localeStore';

// Zoom out · level · zoom in · fit. Help lives in the ☰ menu (and F1).
export const ZoomControls = () => {
  const { t } = useTranslation('zoomControls');
  const uiStateStoreActions = useUiStateStore((state) => {
    return state.actions;
  });
  const zoom = useUiStateStore((state) => {
    return state.zoom;
  });
  const { fitToView } = useDiagramUtils();

  return (
    <UiElement>
      <Stack direction="row" alignItems="center">
        <IconButton
          name={`${t('zoomOut')} (Ctrl −)`}
          Icon={<UiIcon name="zoomOut" />}
          onClick={uiStateStoreActions.decrementZoom}
          disabled={zoom <= MIN_ZOOM}
        />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minWidth: toPx(52)
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {Math.ceil(zoom * 100)}%
          </Typography>
        </Box>
        <IconButton
          name={`${t('zoomIn')} (Ctrl +)`}
          Icon={<UiIcon name="zoomIn" />}
          onClick={uiStateStoreActions.incrementZoom}
          disabled={zoom >= MAX_ZOOM}
        />
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        <IconButton
          name={`${t('fitToScreen')} (Shift+1)`}
          Icon={<UiIcon name="fit" />}
          onClick={fitToView}
        />
      </Stack>
    </UiElement>
  );
};
