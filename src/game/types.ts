import type { Difficulty, Digit, GeneratedPuzzle, Grid } from "../engine";

export interface BoardSnapshot {
  grid: Grid;
  notes: number[];
  mistakes: number;
  completed: boolean;
  autoPencil: boolean;
}

export interface GameState {
  puzzle: Grid;
  solution: Grid;
  grid: Grid;
  notes: number[];
  autoPencil: boolean;
  pencilMode: boolean;
  selected: number | null;
  difficulty: Difficulty;
  elapsedMs: number;
  mistakes: number;
  completed: boolean;
  undoStack: BoardSnapshot[];
  generating: boolean;
  hasPuzzle: boolean;
}

export const STORAGE_KEY = "my-sudoku:v1";
export const UNDO_LIMIT = 80;

export interface SavedGame {
  version: 1;
  puzzle: Grid;
  solution: Grid;
  grid: Grid;
  notes: number[];
  autoPencil: boolean;
  pencilMode: boolean;
  selected: number | null;
  difficulty: Difficulty;
  elapsedMs: number;
  mistakes: number;
  completed: boolean;
  undoStack: BoardSnapshot[];
  savedAt: number;
}

export type GameAction =
  | { type: "select"; cell: number }
  | { type: "enter"; digit: Digit }
  | { type: "erase" }
  | { type: "togglePencil" }
  | { type: "toggleAutoPencil" }
  | { type: "undo" }
  | { type: "tick"; deltaMs: number }
  | { type: "newGameStart"; difficulty: Difficulty }
  | { type: "newGameReady"; generated: GeneratedPuzzle; difficulty: Difficulty }
  | { type: "hydrate"; saved: SavedGame };
