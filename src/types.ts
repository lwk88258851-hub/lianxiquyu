export type ToolType = 'pen' | 'highlighter' | 'eraser' | 'shape' | 'spotlight' | 'magnifier' | 'text' | 'question' | 'select';
export type ShapeType = 'line' | 'rectangle' | 'circle' | 'right-triangle' | 'isosceles-triangle' | 'equilateral-triangle';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
  timestamp: number;
}

export interface DrawingPath {
  id: string;
  type: ToolType | 'shape';
  shapeType?: ShapeType;
  points: Point[];
  color: string;
  width: number;
  opacity: number;
  isComplete: boolean;
  columnIndex?: number;
}

export interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  columnIndex?: number;
}

export interface QuestionOption {
  id: string;
  label: string;
  text: string;
}

export interface QuestionData {
  stem: string;
  options: QuestionOption[];
  imageUrl?: string;
  correctAnswer?: string;
  explanation?: string;
}

export interface QuestionElement {
  id: string;
  type: 'question';
  x: number;
  y: number;
  width: number;
  height: number;
  data: QuestionData;
  selectedOptionId?: string;
  isAnswerRevealed: boolean;
  columnIndex?: number;
}

export interface WhiteboardPage {
  id: string;
  elements: (DrawingPath | TextElement | QuestionElement)[];
  redoStack: (DrawingPath | TextElement | QuestionElement)[];
}

export interface WhiteboardState {
  pages: WhiteboardPage[];
  currentPageIndex: number;
  currentPath: DrawingPath | null;
  activeTool: ToolType;
  activeShape: ShapeType;
  color: string;
  width: number;
  magnification: number;
  isSmartShapeEnabled: boolean;
  columns: number;
  columnOffsets: number[]; // X-positions of dividers
  lastWritingTool: ToolType;
}

export const COLORS = [
  '#FFFFFF', // White
  '#F87171', // Red
  '#FB923C', // Orange
  '#FBBF24', // Amber
  '#34D399', // Emerald
  '#60A5FA', // Blue
  '#818CF8', // Indigo
  '#A78BFA', // Violet
];

export const WIDTHS = [2, 4, 8, 16, 32];
