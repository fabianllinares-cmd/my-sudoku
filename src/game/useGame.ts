import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import {
  cloneGrid,
  emptyGrid,
  emptyNotes,
  findPeerConflicts,
  isCorrectPlacement,
  isPuzzleComplete,
  syncAutoPencilNotes,
  toggleDigit,
} from "../engine";
import type { Difficulty, Digit } from "../engine";
import { generatePuzzleAsync } from "./generate";
import { loadSavedGame, saveGame } from "./persistence";
import type { BoardSnapshot, GameAction, GameState, SavedGame } from "./types";
import { UNDO_LIMIT } from "./types";

function snapshotOf(state: GameState): BoardSnapshot {
  return {
    grid: cloneGrid(state.grid),
    notes: state.notes.slice(),
    mistakes: state.mistakes,
    completed: state.completed,
    autoPencil: state.autoPencil,
  };
}

function pushUndo(state: GameState): BoardSnapshot[] {
  return [...state.undoStack, snapshotOf(state)].slice(-UNDO_LIMIT);
}

function applyAutoNotes(grid: GameState["grid"], autoPencil: boolean, notes: number[]): number[] {
  return autoPencil ? syncAutoPencilNotes(grid) : notes;
}

function createBlankState(difficulty: Difficulty): GameState {
  return {
    puzzle: emptyGrid(),
    solution: emptyGrid(),
    grid: emptyGrid(),
    notes: emptyNotes(),
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

function isClue(state: GameState, cell: number): boolean {
  return state.puzzle[cell] !== 0;
}

function reduce(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "hydrate": {
      const saved = action.saved;
      return {
        puzzle: saved.puzzle,
        solution: saved.solution,
        grid: saved.grid,
        notes: saved.notes,
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
      return { ...state, pencilMode: !state.pencilMode };
    case "toggleAutoPencil": {
      if (state.completed || state.generating) return state;
      const autoPencil = !state.autoPencil;
      return {
        ...state,
        autoPencil,
        pencilMode: autoPencil ? false : state.pencilMode,
        undoStack: pushUndo(state),
        notes: applyAutoNotes(state.grid, autoPencil, state.notes),
      };
    }
    case "undo": {
      if (state.undoStack.length === 0 || state.generating) return state;
      const previous = state.undoStack[state.undoStack.length - 1]!;
      return {
        ...state,
        grid: previous.grid,
        notes: previous.notes,
        mistakes: previous.mistakes,
        completed: previous.completed,
        autoPencil: previous.autoPencil,
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
      const notes = emptyNotes();
      return {
        puzzle,
        solution,
        grid: cloneGrid(puzzle),
        notes,
        autoPencil: false,
        pencilMode: false,
        selected: puzzle.findIndex((value) => value === 0),
        difficulty: action.difficulty,
        elapsedMs: 0,
        mistakes: 0,
        completed: false,
        undoStack: [],
        generating: false,
        hasPuzzle: true,
      };
    }
    case "erase": {
      if (state.selected === null || state.completed || state.generating) return state;
      const cell = state.selected;
      if (isClue(state, cell)) return state;
      if (state.grid[cell] === 0 && state.notes[cell] === 0) return state;
      const grid = cloneGrid(state.grid);
      const notes = state.notes.slice();
      grid[cell] = 0;
      notes[cell] = 0;
      return {
        ...state,
        undoStack: pushUndo(state),
        grid,
        notes: applyAutoNotes(grid, state.autoPencil, notes),
      };
    }
    case "enter": {
      if (state.selected === null || state.completed || state.generating) return state;
      const cell = state.selected;
      if (isClue(state, cell)) return state;
      const digit = action.digit;

      if (state.pencilMode && !state.autoPencil) {
        if (state.grid[cell] !== 0) return state;
        const notes = state.notes.slice();
        notes[cell] = toggleDigit(notes[cell]!, digit);
        return { ...state, undoStack: pushUndo(state), notes };
      }

      if (state.grid[cell] === digit) {
        const grid = cloneGrid(state.grid);
        const notes = state.notes.slice();
        grid[cell] = 0;
        notes[cell] = 0;
        return {
          ...state,
          undoStack: pushUndo(state),
          grid,
          notes: applyAutoNotes(grid, state.autoPencil, notes),
        };
      }

      const grid = cloneGrid(state.grid);
      let notes = state.notes.slice();
      grid[cell] = digit;
      notes[cell] = 0;
      notes = applyAutoNotes(grid, state.autoPencil, notes);
      const incorrect = !isCorrectPlacement(state.solution, cell, digit);
      const mistakes = state.mistakes + (incorrect ? 1 : 0);
      const completed = isPuzzleComplete(grid, state.solution);
      return {
        ...state,
        undoStack: pushUndo(state),
        grid,
        notes,
        mistakes,
        completed,
      };
    }
    default:
      return state;
  }
}

function toSavedGame(state: GameState): SavedGame {
  return {
    version: 1,
    puzzle: state.puzzle,
    solution: state.solution,
    grid: state.grid,
    notes: state.notes,
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

export function useGame() {
  const [state, dispatch] = useReducer(reduce, "easy", createBlankState);
  const lastTick = useRef(Date.now());
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const saved = loadSavedGame();
    if (saved) {
      dispatch({ type: "hydrate", saved });
      return;
    }
    void generatePuzzleAsync("easy")
      .then((generated) => dispatch({ type: "newGameReady", generated, difficulty: "easy" }))
      .catch(() => {
        dispatch({ type: "newGameStart", difficulty: "easy" });
      });
  }, []);

  const startNewGame = useCallback((difficulty: Difficulty) => {
    dispatch({ type: "newGameStart", difficulty });
    void generatePuzzleAsync(difficulty).then((generated) => {
      dispatch({ type: "newGameReady", generated, difficulty });
    });
  }, []);

  useEffect(() => {
    lastTick.current = Date.now();
    const id = window.setInterval(() => {
      if (document.hidden) {
        lastTick.current = Date.now();
        return;
      }
      const now = Date.now();
      const delta = now - lastTick.current;
      lastTick.current = now;
      if (delta > 0) dispatch({ type: "tick", deltaMs: delta });
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!state.hasPuzzle || state.generating) return;
    saveGame(toSavedGame(state));
  }, [state]);

  const conflicts = useMemo(() => findPeerConflicts(state.grid), [state.grid]);
  const hasProgress = useMemo(() => {
    if (!state.hasPuzzle) return false;
    return state.grid.some((value, cell) => value !== state.puzzle[cell]) || state.notes.some((mask) => mask !== 0);
  }, [state.grid, state.notes, state.hasPuzzle, state.puzzle]);

  return {
    ...state,
    conflicts,
    hasProgress,
    selectCell: (cell: number) => dispatch({ type: "select", cell }),
    enterDigit: (digit: Digit) => dispatch({ type: "enter", digit }),
    erase: () => dispatch({ type: "erase" }),
    togglePencil: () => dispatch({ type: "togglePencil" }),
    toggleAutoPencil: () => dispatch({ type: "toggleAutoPencil" }),
    undo: () => dispatch({ type: "undo" }),
    startNewGame,
    canUndo: state.undoStack.length > 0 && !state.generating,
  };
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
