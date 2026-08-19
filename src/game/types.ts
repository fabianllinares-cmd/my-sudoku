import type { Difficulty, Digit, GeneratedPuzzle, Grid } from "../engine";
import type { TimerState } from "./timer";

export interface BoardSnapshot {
  grid: Grid;
  playerNotes: number[];
  mistakes: number;
  completed: boolean;
}

export interface GameState {
  puzzle: Grid;
  solution: Grid;
  grid: Grid;
  /**
   * The player's pencil notes. This is editable state, not a candidate
   * calculation: Auto Pencil seeds it, placing a digit prunes it, and manual
   * edits are preserved. Legality is derived separately from the board.
   */
  playerNotes: number[];
  pencilMode: boolean;
  selected: number | null;
  difficulty: Difficulty;
  timer: TimerState;
  mistakes: number;
  completed: boolean;
  undoStack: BoardSnapshot[];
  generating: boolean;
  hasPuzzle: boolean;
}

export const STORAGE_KEY = "my-sudoku:v1";
export const UNDO_LIMIT = 80;
export const SAVE_VERSION = 3;

export interface SavedGame {
  version: number;
  puzzle: Grid;
  solution: Grid;
  grid: Grid;
  playerNotes: number[];
  pencilMode: boolean;
  selected: number | null;
  difficulty: Difficulty;
  /** Accumulated active play time. Saves always store a paused timer. */
  timerMs: number;
  mistakes: number;
  completed: boolean;
  undoStack: BoardSnapshot[];
  savedAt: number;
}

/** Version 1 stored displayed notes, which were auto-generated while Auto Pencil was on. */
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

/** Version 2 stored manual notes and derived Auto Pencil candidates on the fly. */
export interface SavedGameV2 {
  version: 2;
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
  undoStack: { grid: Grid; manualNotes: number[]; mistakes: number; completed: boolean }[];
  savedAt: number;
}

export type GameAction =
  | { type: "select"; cell: number }
  | { type: "enter"; digit: Digit; now: number }
  | { type: "erase" }
  | { type: "togglePencil" }
  | { type: "autoPencil" }
  | { type: "undo" }
  | { type: "pause"; now: number }
  | { type: "resume"; now: number }
  | { type: "newGameStart"; difficulty: Difficulty }
  | { type: "newGameReady"; generated: GeneratedPuzzle; difficulty: Difficulty }
  | { type: "hydrate"; saved: SavedGame };
