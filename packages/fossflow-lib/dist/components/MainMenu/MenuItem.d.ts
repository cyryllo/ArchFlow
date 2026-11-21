import React from 'react';
export interface Props {
    onClick?: () => void;
    Icon?: React.ReactNode;
    children: string | React.ReactNode;
    disabled?: boolean;
    shortcut?: string;
}
export declare const MenuItem: ({ onClick, Icon, children, disabled, shortcut }: Props) => import("react/jsx-runtime").JSX.Element;
