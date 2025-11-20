export type ShapeType = 'circle' | 'square' | 'triangle' | 'diamond' | 'star' | 'hexagon';

export interface ShapeStyle {
  id: ShapeType;
  color: string;
  bg: string;
  border: string;
}

export interface LevelConfig {
  id: number;
  structure: ('M' | 'F')[];
  points: number;
  label: string;
}

export interface Layer {
  type: 'M' | 'F';
  code: number[];
  options: number[][] | null;
  isSolved: boolean;
  userSelected: number[] | null;
}

export interface Puzzle {
  id: number;
  input: ShapeStyle[];
  output: ShapeStyle[];
  layers: Layer[];
  totalMystery: number;
  levelConfig: LevelConfig;
}

export interface HistoryRecord {
  round: number;
  level: number;
  pointsPotential: number;
  earned: number;
  correct: boolean;
  puzzleSnapshot: Puzzle;
}

export type AppMode = 'HOME' | 'ASSESSMENT' | 'PRACTICE_CONFIG' | 'PRACTICE_PLAY' | 'FINISHED';
export type PracticeType = 'PROGRESSIVE' | 'LEVEL' | 'RANDOM';