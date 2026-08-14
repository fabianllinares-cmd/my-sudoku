import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { findPeerConflicts } from "../engine";
import type { Difficulty, Digit } from "../engine";
import { generatePuzzleAsync } from "./generate";
import { createInitialState, reduce, selectDigitProgress, selectNotes, toSavedGame } from "./gameState";
import { loadSavedGame, saveGame } from "./persistence";
import { applyTheme, loadTheme, nextTheme, saveTheme } from "./theme";
import type { Theme } from "./theme";

export function useGame() {
  const [state, dispatch] = useReducer(reduce, "easy", createInitialState);
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

  const notes = useMemo(() => selectNotes(state), [state]);
  const digits = useMemo(() => selectDigitProgress(state), [state]);
  const conflicts = useMemo(() => findPeerConflicts(state.grid), [state.grid]);
  const hasProgress = useMemo(() => {
    if (!state.hasPuzzle) return false;
    return (
      state.grid.some((value, cell) => value !== state.puzzle[cell]) ||
      state.manualNotes.some((mask) => mask !== 0)
    );
  }, [state.grid, state.manualNotes, state.hasPuzzle, state.puzzle]);

  return {
    ...state,
    notes,
    digits,
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

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => loadTheme());

  useEffect(() => {
    applyTheme(theme);
    saveTheme(theme);
  }, [theme]);

  return {
    theme,
    toggleTheme: () => setTheme((current) => nextTheme(current)),
  };
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
