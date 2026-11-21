import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  ListSubheader
} from '@mui/material';

export interface MenuItemI {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
}

// A heading line or a separator between groups of entries
export type ContextMenuEntry = MenuItemI | 'divider' | { heading: string };

interface Props {
  onClose: () => void;
  anchorEl?: HTMLElement | null;
  menuItems: ContextMenuEntry[];
}

export const ContextMenu = ({ onClose, anchorEl, menuItems }: Props) => {
  return (
    <Menu
      open={!!anchorEl}
      anchorEl={anchorEl}
      onClose={onClose}
      MenuListProps={{ dense: true, sx: { minWidth: 230 } }}
    >
      {menuItems.map((item, index) => {
        if (item === 'divider') {
          return <Divider key={index} />;
        }
        if ('heading' in item) {
          return (
            <ListSubheader key={index} sx={{ lineHeight: '28px', fontSize: 12 }}>
              {item.heading}
            </ListSubheader>
          );
        }
        return (
          <MenuItem
            key={index}
            onClick={item.onClick}
            disabled={item.disabled}
            sx={item.danger ? { color: 'error.main' } : undefined}
          >
            {item.icon && (
              <ListItemIcon sx={item.danger ? { color: 'error.main' } : undefined}>
                {item.icon}
              </ListItemIcon>
            )}
            <ListItemText primaryTypographyProps={{ fontSize: 14 }}>
              {item.label}
            </ListItemText>
            {item.shortcut && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ ml: 3, fontSize: 12 }}
              >
                {item.shortcut}
              </Typography>
            )}
          </MenuItem>
        );
      })}
    </Menu>
  );
};
