import {
  autoPencilNotes,
  cloneGrid,
  digitProgress,
  emptyGrid,
  emptyNotes,
  invalidNoteMasks,
  isCorrectPlacement,
  isPuzzleComplete,
  removeNoteFromPeers,
  toggleDigit,
} from "../engine";
import type { DigitProgress, Difficulty } from "../engine";
import { createTimer, elapsedMs, pauseTimer, startTimer } from "./timer";
import type { BoardSnapshot, GameAction, GameState, SavedGame } from "./types";
import { SAVE_VERSION, UNDO_LIMIT } from "./types";

export function createInitialState(difficulty: Difficulty): GameState {
  return {
    puzzle: emptyGrid(),
    solution: emptyGrid(),
    grid: emptyGrid(),
    playerNotes: emptyNotes(),
    pencilMode: false,
    selected: null,
    difficulty,
    timer: createTimer(),
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
    playerNotes: state.playerNotes.slice(),
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
        playerNotes: saved.playerNotes,
        pencilMode: saved.pencilMode,
        selected: saved.selected,
        difficulty: saved.difficulty,
        timer: createTimer(saved.timerMs),
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
      return { ...state, pencilMode: !state.pencilMode };
    /**
     * Auto Pencil is a one-shot action, not a mode: it replaces the notes with
     * the candidates that are legal right now and then leaves them alone.
     */
    case "autoPencil": {
      if (state.completed || state.generating || !state.hasPuzzle) return state;
      return {
        ...state,
        undoStack: pushUndo(state),
        playerNotes: autoPencilNotes(state.grid),
      };
    }
    case "undo": {
      if (state.undoStack.length === 0 || state.generating) return state;
      const previous = state.undoStack[state.undoStack.length - 1]!;
      return {
        ...state,
        grid: previous.grid,
        playerNotes: previous.playerNotes,
        mistakes: previous.mistakes,
        completed: previous.completed,
        undoStack: state.undoStack.slice(0, -1),
      };
    }
    case "resume": {
      if (!state.hasPuzzle || state.completed || state.generating) return state;
      const timer = startTimer(state.timer, action.now);
      return timer === state.timer ? state : { ...state, timer };
    }
    case "pause": {
      const timer = pauseTimer(state.timer, action.now);
      return timer === state.timer ? state : { ...state, timer };
    }
    case "newGameStart":
      return {
        ...state,
        generating: true,
        difficulty: action.difficulty,
        completed: false,
        timer: createTimer(),
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
      if (state.grid[cell] === 0 && state.playerNotes[cell] === 0) return state;
      const grid = cloneGrid(state.grid);
      const playerNotes = state.playerNotes.slice();
      grid[cell] = 0;
      playerNotes[cell] = 0;
      return { ...state, undoStack: pushUndo(state), grid, playerNotes };
    }
    case "enter": {
      if (!canEdit(state)) return state;
      const cell = state.selected!;
      if (isClue(state, cell)) return state;
      const digit = action.digit;

      if (state.pencilMode) {
        // Any digit may be pencilled in, even one the board currently forbids.
        if (state.grid[cell] !== 0) return state;
        const playerNotes = state.playerNotes.slice();
        playerNotes[cell] = toggleDigit(playerNotes[cell]!, digit);
        return { ...state, undoStack: pushUndo(state), playerNotes };
      }

      const grid = cloneGrid(state.grid);
      const cleared = state.playerNotes.slice();
      const repeated = state.grid[cell] === digit;
      grid[cell] = repeated ? 0 : digit;
      cleared[cell] = 0;

      if (repeated) {
        return { ...state, undoStack: pushUndo(state), grid, playerNotes: cleared };
      }

      // Placing a definite digit only prunes that digit from its peers.
      const playerNotes = removeNoteFromPeers(cleared, cell, digit);
      const incorrect = !isCorrectPlacement(state.solution, cell, digit);
      const completed = isPuzzleComplete(grid, state.solution);
      return {
        ...state,
        undoStack: pushUndo(state),
        grid,
        playerNotes,
        mistakes: state.mistakes + (incorrect ? 1 : 0),
        completed,
        timer: completed ? pauseTimer(state.timer, action.now) : state.timer,
      };
    }
    default:
      return state;
  }
}

/** Notes the board currently makes impossible. Derived, never stored. */
export function selectInvalidNotes(state: GameState): number[] {
  return invalidNoteMasks(state.playerNotes, state.grid);
}

export function selectDigitProgress(state: GameState): DigitProgress[] {
  return digitProgress(state.grid, state.solution);
}

export function selectElapsedMs(state: GameState, now: number): number {
  return elapsedMs(state.timer, now);
}

export function toSavedGame(state: GameState, now: number): SavedGame {
  return {
    version: SAVE_VERSION,
    puzzle: state.puzzle,
    solution: state.solution,
    grid: state.grid,
    playerNotes: state.playerNotes,
    pencilMode: state.pencilMode,
    selected: state.selected,
    difficulty: state.difficulty,
    timerMs: elapsedMs(state.timer, now),
    mistakes: state.mistakes,
    completed: state.completed,
    undoStack: state.undoStack,
    savedAt: now,
  };
}
