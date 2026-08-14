import {
  calculateCandidateMasks,
  cloneGrid,
  digitProgress,
  emptyGrid,
  emptyNotes,
  isCorrectPlacement,
  isPuzzleComplete,
  toggleDigit,
} from "../engine";
import type { DigitProgress, Difficulty } from "../engine";
import type { BoardSnapshot, GameAction, GameState, SavedGame } from "./types";
import { SAVE_VERSION, UNDO_LIMIT } from "./types";

export function createInitialState(difficulty: Difficulty): GameState {
  return {
    puzzle: emptyGrid(),
    solution: emptyGrid(),
    grid: emptyGrid(),
    manualNotes: emptyNotes(),
    autoPencil: false,
    pencilMode: false,
    selected: null,
    difficulty,
    elapsedMs: 0,
    mistakes: 0,
    completed: false,
    undoStack: [],
    generating: true,
    hasPuzzle: false,
  };
}

function snapshotOf(state: GameState): BoardSnapshot {
  return {
    grid: cloneGrid(state.grid),
    manualNotes: state.manualNotes.slice(),
    mistakes: state.mistakes,
    completed: state.completed,
  };
}

function pushUndo(state: GameState): BoardSnapshot[] {
  return [...state.undoStack, snapshotOf(state)].slice(-UNDO_LIMIT);
}

function isClue(state: GameState, cell: number): boolean {
  return state.puzzle[cell] !== 0;
}

function canEdit(state: GameState): boolean {
  return state.selected !== null && !state.completed && !state.generating && state.hasPuzzle;
}

export function reduce(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "hydrate": {
      const saved = action.saved;
      return {
        puzzle: saved.puzzle,
        solution: saved.solution,
        grid: saved.grid,
        manualNotes: saved.manualNotes,
        autoPencil: saved.autoPencil,
        pencilMode: saved.pencilMode,
        selected: saved.selected,
        difficulty: saved.difficulty,
        elapsedMs: saved.elapsedMs,
        mistakes: saved.mistakes,
        completed: saved.completed,
        undoStack: saved.undoStack ?? [],
        generating: false,
        hasPuzzle: true,
      };
    }
    case "select":
      if (state.generating) return state;
      return { ...state, selected: action.cell };
    case "togglePencil":
      if (state.autoPencil) return state;
      return { ...state, pencilMode: !state.pencilMode };
    case "toggleAutoPencil": {
      if (state.completed || state.generating) return state;
      const autoPencil = !state.autoPencil;
      return {
        ...state,
        autoPencil,
        pencilMode: autoPencil ? false : state.pencilMode,
      };
    }
    case "undo": {
      if (state.undoStack.length === 0 || state.generating) return state;
      const previous = state.undoStack[state.undoStack.length - 1]!;
      return {
        ...state,
        grid: previous.grid,
        manualNotes: previous.manualNotes,
        mistakes: previous.mistakes,
        completed: previous.completed,
        undoStack: state.undoStack.slice(0, -1),
      };
    }
    case "tick":
      if (state.completed || state.generating || !state.hasPuzzle) return state;
      return { ...state, elapsedMs: state.elapsedMs + action.deltaMs };
    case "newGameStart":
      return {
        ...state,
        generating: true,
        difficulty: action.difficulty,
        completed: false,
      };
    case "newGameReady": {
      const { puzzle, solution } = action.generated;
      return {
        ...createInitialState(action.difficulty),
        puzzle,
        solution,
        grid: cloneGrid(puzzle),
        selected: puzzle.findIndex((value) => value === 0),
        generating: false,
        hasPuzzle: true,
      };
    }
    case "erase": {
      if (!canEdit(state)) return state;
      const cell = state.selected!;
      if (isClue(state, cell)) return state;
      if (state.grid[cell] === 0 && state.manualNotes[cell] === 0) return state;
      const grid = cloneGrid(state.grid);
      const manualNotes = state.manualNotes.slice();
      grid[cell] = 0;
      manualNotes[cell] = 0;
      return { ...state, undoStack: pushUndo(state), grid, manualNotes };
    }
    case "enter": {
      if (!canEdit(state)) return state;
      const cell = state.selected!;
      if (isClue(state, cell)) return state;
      const digit = action.digit;

      if (state.pencilMode && !state.autoPencil) {
        if (state.grid[cell] !== 0) return state;
        const manualNotes = state.manualNotes.slice();
        manualNotes[cell] = toggleDigit(manualNotes[cell]!, digit);
        return { ...state, undoStack: pushUndo(state), manualNotes };
      }

      const grid = cloneGrid(state.grid);
      const manualNotes = state.manualNotes.slice();
      const repeated = state.grid[cell] === digit;
      grid[cell] = repeated ? 0 : digit;
      manualNotes[cell] = 0;

      if (repeated) {
        return { ...state, undoStack: pushUndo(state), grid, manualNotes };
      }

      const incorrect = !isCorrectPlacement(state.solution, cell, digit);
      return {
        ...state,
        undoStack: pushUndo(state),
        grid,
        manualNotes,
        mistakes: state.mistakes + (incorrect ? 1 : 0),
        completed: isPuzzleComplete(grid, state.solution),
      };
    }
    default:
      return state;
  }
}

/**
 * Notes shown on the board. With Auto Pencil on these are recalculated from the
 * current grid, so entering, erasing, and undoing all stay in sync for free.
 */
export function selectNotes(state: GameState): number[] {
  return state.autoPencil ? calculateCandidateMasks(state.grid) : state.manualNotes;
}

export function selectDigitProgress(state: GameState): DigitProgress[] {
  return digitProgress(state.grid, state.solution);
}

export function toSavedGame(state: GameState): SavedGame {
  return {
    version: SAVE_VERSION,
    puzzle: state.puzzle,
    solution: state.solution,
    grid: state.grid,
    manualNotes: state.manualNotes,
    autoPencil: state.autoPencil,
    pencilMode: state.pencilMode,
    selected: state.selected,
    difficulty: state.difficulty,
    elapsedMs: state.elapsedMs,
    mistakes: state.mistakes,
    completed: state.completed,
    undoStack: state.undoStack,
    savedAt: Date.now(),
  };
}
