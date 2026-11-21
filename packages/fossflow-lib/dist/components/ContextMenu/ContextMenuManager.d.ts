interface Props {
    anchorEl?: HTMLElement | null;
}
/**
 * Right-click menu.
 * - On empty canvas: add node / draw rectangle / add text, paste, select all, fit.
 * - On an element: connect to…, properties, change icon, copy/cut/duplicate,
 *   stacking order, delete. If the element is part of the current
 *   multi-selection, the actions apply to the whole selection.
 */
export declare const ContextMenuManager: ({ anchorEl }: Props) => import("react/jsx-runtime").JSX.Element | null;
export {};
