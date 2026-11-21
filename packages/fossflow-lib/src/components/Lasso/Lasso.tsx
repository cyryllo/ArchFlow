import React from 'react';
import { Box } from '@mui/material';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useScene } from 'src/hooks/useScene';
import { getSelectionSceneRect } from 'src/utils';

// Selection box: a screen-aligned rectangle, drawn inside a SceneLayer so it
// follows scrolling and zoom. While dragging it is the dragged box; once
// released it hugs the selected elements, showing exactly what was caught.
export const Lasso = () => {
  const mode = useUiStateStore((state) => {
    return state.mode;
  });
  const scene = useScene();

  if (mode.type !== 'LASSO' || !mode.selection) {
    return null;
  }

  const rect = getSelectionSceneRect(mode.selection, scene);
  if (!rect) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        pointerEvents: 'none',
        border: '1.5px dashed #2196f3',
        bgcolor: 'rgba(33, 150, 243, 0.08)',
        borderRadius: '6px'
      }}
      style={{
        left: rect.from.x,
        top: rect.from.y,
        width: Math.max(1, rect.to.x - rect.from.x),
        height: Math.max(1, rect.to.y - rect.from.y)
      }}
    />
  );
};
