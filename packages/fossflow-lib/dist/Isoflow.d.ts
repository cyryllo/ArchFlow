import { IsoflowProps } from './types';
export declare const Isoflow: (props: IsoflowProps) => import("react/jsx-runtime").JSX.Element;
declare const useIsoflow: () => {
    Model: {
        get: () => import("./types").ModelStoreWithHistory;
        set: (model: Partial<import("./types").Model>, skipHistory?: boolean) => void;
        undo: () => boolean;
        redo: () => boolean;
        canUndo: () => boolean;
        canRedo: () => boolean;
        saveToHistory: () => void;
        clearHistory: () => void;
    };
    uiState: import("./types").UiStateActions;
    rendererEl: HTMLDivElement | null;
};
export { useIsoflow };
export * from './standaloneExports';
export { UiIcon } from './components/Icons/UiIcons';
export type { UiIconName } from './components/Icons/UiIcons';
export type { HostMenuItem, HostMenuGroup, ClipboardData } from './types';
export default Isoflow;
