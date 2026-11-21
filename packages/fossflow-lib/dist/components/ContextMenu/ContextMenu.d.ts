import React from 'react';
export interface MenuItemI {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    shortcut?: string;
    disabled?: boolean;
    danger?: boolean;
}
export type ContextMenuEntry = MenuItemI | 'divider' | {
    heading: string;
};
interface Props {
    onClose: () => void;
    anchorEl?: HTMLElement | null;
    menuItems: ContextMenuEntry[];
}
export declare const ContextMenu: ({ onClose, anchorEl, menuItems }: Props) => import("react/jsx-runtime").JSX.Element;
export {};
