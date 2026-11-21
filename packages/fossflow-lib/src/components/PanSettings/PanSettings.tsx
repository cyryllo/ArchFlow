import React from 'react';
import { Box, Typography, FormControlLabel, Switch, Slider, FormGroup } from '@mui/material';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useTranslation } from 'src/stores/localeStore';
import { PanSettings as PanSettingsType } from 'src/config/panSettings';

const usePanSettings = () => {
  const panSettings = useUiStateStore((state) => {
    return state.panSettings;
  });
  const setPanSettings = useUiStateStore((state) => {
    return state.actions.setPanSettings;
  });

  const toggle = (setting: keyof PanSettingsType) => {
    if (typeof panSettings[setting] === 'boolean') {
      setPanSettings({ ...panSettings, [setting]: !panSettings[setting] });
    }
  };

  return { panSettings, setPanSettings, toggle };
};

// Which mouse gestures move the view (the Pan tool always does)
export const MousePanSettings = () => {
  const { panSettings, toggle } = usePanSettings();
  const { t } = useTranslation();

  const options: { key: keyof PanSettingsType; label: string }[] = [
    { key: 'middleClickPan', label: t('settings.pan.middleClickPan') },
    { key: 'emptyAreaClickPan', label: t('settings.pan.emptyAreaClickPan') },
    { key: 'rightClickPan', label: t('settings.pan.rightClickPan') },
    { key: 'ctrlClickPan', label: t('settings.pan.ctrlClickPan') },
    { key: 'altClickPan', label: t('settings.pan.altClickPan') }
  ];

  return (
    <FormGroup>
      {options.map((option) => {
        return (
          <FormControlLabel
            key={option.key}
            control={
              <Switch
                checked={Boolean(panSettings[option.key])}
                onChange={() => {
                  toggle(option.key);
                }}
              />
            }
            label={option.label}
          />
        );
      })}
    </FormGroup>
  );
};

// Moving the view from the keyboard (when nothing is selected)
export const KeyboardPanSettings = () => {
  const { panSettings, setPanSettings, toggle } = usePanSettings();
  const { t } = useTranslation();

  const options: { key: keyof PanSettingsType; label: string }[] = [
    { key: 'arrowKeysPan', label: t('settings.pan.arrowKeys') },
    { key: 'wasdPan', label: t('settings.pan.wasdKeys') },
    { key: 'ijklPan', label: t('settings.pan.ijklKeys') }
  ];

  return (
    <Box>
      <FormGroup>
        {options.map((option) => {
          return (
            <FormControlLabel
              key={option.key}
              control={
                <Switch
                  checked={Boolean(panSettings[option.key])}
                  onChange={() => {
                    toggle(option.key);
                  }}
                />
              }
              label={option.label}
            />
          );
        })}
      </FormGroup>

      <Typography variant="body2" sx={{ mt: 2 }}>
        {t('settings.pan.keyboardPanSpeed')}
      </Typography>
      <Box sx={{ px: 1, maxWidth: 360 }}>
        <Slider
          value={panSettings.keyboardPanSpeed}
          onChange={(_, value) => {
            setPanSettings({ ...panSettings, keyboardPanSpeed: value as number });
          }}
          min={5}
          max={50}
          step={5}
          marks
          valueLabelDisplay="auto"
        />
      </Box>
    </Box>
  );
};
