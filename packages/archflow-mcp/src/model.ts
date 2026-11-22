// The ArchFlow diagram format (what the app saves and loads), limited to the
// parts the MCP server writes. Mirrors fossflow-lib/src/schemas.

export interface Coords {
  x: number;
  y: number;
}

export interface ModelItem {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface ViewItem {
  id: string;
  tile: Coords;
  labelHeight?: number;
}

export interface ConnectorLabel {
  id: string;
  text: string;
  position: number;
  height?: number;
  line?: '1' | '2';
  showLine?: boolean;
}

export interface Anchor {
  id: string;
  ref: { item?: string; anchor?: string; tile?: Coords };
}

export type ConnectorStyle = 'SOLID' | 'DOTTED' | 'DASHED';
export type ConnectorLineType = 'SINGLE' | 'DOUBLE' | 'DOUBLE_WITH_CIRCLE';

export interface Connector {
  id: string;
  description?: string;
  labels?: ConnectorLabel[];
  color?: string;
  customColor?: string;
  width?: number;
  style?: ConnectorStyle;
  lineType?: ConnectorLineType;
  showArrow?: boolean;
  anchors: Anchor[];
  [key: string]: unknown;
}

export interface Rectangle {
  id: string;
  color?: string;
  customColor?: string;
  from: Coords;
  to: Coords;
}

export interface TextBox {
  id: string;
  tile: Coords;
  content: string;
  fontSize?: number;
  orientation?: 'X' | 'Y';
}

export interface View {
  id: string;
  name: string;
  description?: string;
  lastUpdated?: string;
  items: ViewItem[];
  rectangles?: Rectangle[];
  connectors?: Connector[];
  textBoxes?: TextBox[];
}

export interface Color {
  id: string;
  value: string;
}

export interface Icon {
  id: string;
  name: string;
  url: string;
  collection?: string;
  isIsometric?: boolean;
  scale?: number;
}

export interface Diagram {
  title: string;
  name?: string;
  description?: string;
  version?: string;
  icons: Icon[];
  colors: Color[];
  items: ModelItem[];
  views: View[];
  fitToScreen?: boolean;
  [key: string]: unknown;
}

// Colours offered to the assistant for zones and connectors. The app keeps a
// diagram's colours in `colors` and shapes refer to them by id.
export const PALETTE: Record<string, string> = {
  blue: '#9ebcf5',
  green: '#9fdcbf',
  amber: '#f6c66b',
  violet: '#b9a6f3',
  pink: '#e59cc0',
  red: '#f19a9a',
  orange: '#f5b47e',
  teal: '#8fd3d6',
  gray: '#c3c9d3'
};
export const COLOR_NAMES = Object.keys(PALETTE) as [string, ...string[]];

// Text sizes of the app (fontSize is in tiles)
export const TEXT_SIZES = { small: 0.4, medium: 0.6, large: 0.9 } as const;
