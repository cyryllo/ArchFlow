import React from 'react';
import { MenuItem as MuiMenuItem, ListItemIcon, Typography, Box } from '@mui/material';

export interface Props {
  onClick?: () => void;
  Icon?: React.ReactNode;
  children: string | React.ReactNode;
  disabled?: boolean;
  shortcut?: string;
}

export const MenuItem = ({
  onClick,
  Icon,
  children,
  disabled = false,
  shortcut
}: Props) => {
  return (
    <MuiMenuItem onClick={onClick} disabled={disabled}>
      <ListItemIcon sx={{ opacity: disabled ? 0.5 : 1 }}>{Icon}</ListItemIcon>
      <Box sx={{ flex: 1 }}>{children}</Box>
      {shortcut && (
        <Typography variant="body2" color="text.secondary" sx={{ ml: 3, fontSize: 12 }}>
          {shortcut}
        </Typography>
      )}
    </MuiMenuItem>
  );
};
