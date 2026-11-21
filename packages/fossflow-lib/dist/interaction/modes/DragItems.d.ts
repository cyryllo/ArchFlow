import { ModeActions, Coords, ItemReference } from '../../types';
import { useScene } from '../../hooks/useScene';
export declare const dragItems: (items: ItemReference[], tile: Coords, delta: Coords, scene: ReturnType<typeof useScene>) => void;
export declare const DragItems: ModeActions;
