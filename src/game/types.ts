import type { Difficulty, Digit, GeneratedPuzzle, Grid } from "../engine";

export interface BoardSnapshot {
  grid: Grid;
  manualNotes: number[];
  mistakes: number;
  completed: boolean;
}

export interface GameState {
  puzzle: Grid;
  solution: Grid;
  grid: Grid;
  /**
   * Player-entered pencil marks. Auto Pencil candidates are never stored here;
   * they are derived from the grid so they cannot fall out of sync.
   */
  manualNotes: number[];
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
export const SAVE_VERSION = 2;

export interface SavedGame {
  version: number;
  puzzle: Grid;
  solution: Grid;
  grid: Grid;
  manualNotes: number[];
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

/** Version 1 stored the displayed notes, which could be auto-generated. */
export interface SavedGameV1 {
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
  undoStack: { grid: Grid; notes: number[]; mistakes: number; completed: boolean }[];
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
