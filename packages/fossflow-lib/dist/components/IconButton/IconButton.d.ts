import React from 'react';
import { TooltipProps } from '@mui/material/Tooltip';
interface Props {
    name: string;
    Icon: React.ReactNode;
    isActive?: boolean;
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
    tooltipPosition?: TooltipProps['placement'];
    disabled?: boolean;
    hotkey?: string | null;
}
export declare const IconButton: ({ name, Icon, onClick, isActive, disabled, tooltipPosition, hotkey }: Props) => import("react/jsx-runtime").JSX.Element;
export {};
