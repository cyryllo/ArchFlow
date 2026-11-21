import { Coords, ItemReference } from '../types';
interface SceneLike {
    items: {
        id: string;
        tile: Coords;
    }[];
    rectangles: {
        id: string;
        from: Coords;
        to: Coords;
    }[];
    textBoxes: {
        id: string;
        tile: Coords;
    }[];
    connectors?: {
        id: string;
        anchors: {
            ref: {
                item?: string;
                anchor?: string;
                tile?: Coords;
            };
        }[];
    }[];
}
export declare const getItemsBounds: (refs: ItemReference[], scene: SceneLike) => {
    startTile: Coords;
    endTile: Coords;
} | null;
type ConnectorLike = NonNullable<SceneLike['connectors']>[number];
/**
 * Whether a connector goes along with a selection: every node it's attached
 * to is selected and every hand-placed point is inside. A free end (first or
 * last point) that touches another connector's point is a join between two
 * connectors, so it never counts as inside - moving it would tear the two
 * apart.
 */
export declare const connectorFollowsSelection: (connector: ConnectorLike, isNodeCaught: (id: string) => boolean, isTileCaught: (tile: Coords) => boolean, allConnectors: ConnectorLike[]) => boolean;
export declare const isMultiSelectable: (ref: ItemReference | null | undefined) => boolean;
export interface SceneRect {
    from: Coords;
    to: Coords;
}
export declare const screenToScene: (mouse: Coords, zoom: number, scroll: {
    position: Coords;
}, rendererSize: {
    width: number;
    height: number;
}) => Coords;
export declare const normalizeRect: (rect: SceneRect) => SceneRect;
export declare const isInRect: (point: Coords, rect: SceneRect) => boolean;
export declare const getItemsInSceneRect: (rect: SceneRect, scene: SceneLike) => ItemReference[];
export declare const getSelectionSceneRect: (selection: {
    items: ItemReference[];
    sceneRect?: SceneRect;
}, scene: SceneLike) => SceneRect | null;
export {};
