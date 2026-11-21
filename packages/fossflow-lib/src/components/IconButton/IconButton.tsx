import React, { useMemo } from 'react';
import { Button, Box, useTheme } from '@mui/material';
import Tooltip, { TooltipProps } from '@mui/material/Tooltip';

interface Props {
  name: string;
  Icon: React.ReactNode;
  isActive?: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  tooltipPosition?: TooltipProps['placement'];
  disabled?: boolean;
  // Single-letter tool shortcut shown in the button's corner
  hotkey?: string | null;
}

export const IconButton = ({
  name,
  Icon,
  onClick,
  isActive = false,
  disabled = false,
  tooltipPosition = 'bottom',
  hotkey
}: Props) => {
  const theme = useTheme();
  const iconColor = useMemo(() => {
    if (isActive) {
      return 'grey.200';
    }

    if (disabled) {
      return 'grey.800';
    }

    return 'grey.500';
  }, [disabled, isActive]);

  return (
    <Tooltip
      title={name}
      placement={tooltipPosition}
      enterDelay={1000}
      enterNextDelay={1000}
      arrow
      sx={{ bgcolor: 'primary.main' }}
    >
      <Button
        variant="text"
        onClick={onClick}
        aria-label={name}
        aria-pressed={isActive}
        sx={{
          position: 'relative',
          borderRadius: 0,
          height: theme.customVars.toolMenu.height,
          width: theme.customVars.toolMenu.height,
          maxWidth: '100%',
          minWidth: 'auto',
          bgcolor: isActive ? 'primary.light' : undefined,
          p: 0,
          m: 0
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            svg: {
              color: iconColor
            }
          }}
        >
          {Icon}
        </Box>
        {hotkey && (
          <Box
            component="span"
            sx={{
              position: 'absolute',
              right: 3,
              bottom: 1,
              fontSize: 9,
              lineHeight: 1,
              fontFamily: 'monospace',
              color: isActive ? 'grey.200' : 'grey.500',
              pointerEvents: 'none'
            }}
          >
            {hotkey.toUpperCase()}
          </Box>
        )}
      </Button>
    </Tooltip>
  );
};
