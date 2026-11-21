import { ClipboardData, Coords, ItemReference } from '../types';
/**
 * Editing actions shared by keyboard shortcuts and the right-click menu, so
 * both always do exactly the same thing.
 */
export declare const useEditorActions: () => {
    isEditable: boolean;
    getSelection: () => ItemReference[];
    selectItems: (refs: ItemReference[]) => void;
    toggleInSelection: (ref: ItemReference) => void;
    selectAll: () => void;
    clearSelection: () => void;
    deleteItems: (refs?: ItemReference[]) => void;
    copy: (refs?: ItemReference[]) => ClipboardData | null;
    cut: (refs?: ItemReference[]) => void;
    paste: (tile?: Coords) => void;
    duplicate: (refs?: ItemReference[]) => void;
    reorder: (where: "front" | "back", refs?: ItemReference[]) => void;
    moveSelection: (delta: Coords) => boolean;
    showProperties: (ref: ItemReference) => void;
    changeIcon: (ref: ItemReference) => void;
    rename: (ref?: ItemReference | undefined) => void;
    startConnectorFrom: (itemId: string) => void;
    startAddNode: () => void;
    startDrawRectangle: () => void;
    addTextAt: (tile: Coords) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    fitToView: () => Promise<void>;
    canPaste: boolean;
};
