import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { findPeerConflicts } from "../engine";
import type { Difficulty, Digit } from "../engine";
import { generatePuzzleAsync } from "./generate";
import {
  createInitialState,
  reduce,
  selectDigitProgress,
  selectElapsedMs,
  selectInvalidNotes,
  toSavedGame,
} from "./gameState";
import { loadSavedGame, saveGame } from "./persistence";
import { applyTheme, loadTheme, nextTheme, saveTheme } from "./theme";
import type { Theme } from "./theme";

/** How often the displayed clock refreshes while play is active. */
const DISPLAY_INTERVAL_MS = 500;
/** Safety net so a hard kill loses at most this much active time. */
const AUTOSAVE_INTERVAL_MS = 20_000;

function isVisible(): boolean {
  return typeof document === "undefined" || document.visibilityState !== "hidden";
}

export function useGame() {
  const [state, dispatch] = useReducer(reduce, "easy", createInitialState);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const hydrated = useRef(false);

  const stateRef = useRef(state);
  stateRef.current = state;

  /** Saves always store a paused timer holding the active time so far. */
  const persist = useCallback((now: number = Date.now()) => {
    const current = stateRef.current;
    if (!current.hasPuzzle || current.generating) return;
    saveGame(toSavedGame(current, now));
  }, []);

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

  // Start counting once a puzzle is playable and the app is on screen.
  useEffect(() => {
    if (!state.hasPuzzle || state.generating || state.completed || !isVisible()) return;
    dispatch({ type: "resume", now: Date.now() });
  }, [state.hasPuzzle, state.generating, state.completed]);

  // Visibility is the source of truth for active time: no interval has to keep
  // running in the background, and hidden time is never counted.
  useEffect(() => {
    const pause = () => {
      const now = Date.now();
      dispatch({ type: "pause", now });
      persist(now);
    };
    const sync = () => {
      if (isVisible()) dispatch({ type: "resume", now: Date.now() });
      else pause();
    };

    document.addEventListener("visibilitychange", sync);
    window.addEventListener("pagehide", pause);
    window.addEventListener("freeze", pause);
    window.addEventListener("pageshow", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pagehide", pause);
      window.removeEventListener("freeze", pause);
      window.removeEventListener("pageshow", sync);
    };
  }, [persist]);

  // Only drives the display; accumulated time never depends on it firing.
  useEffect(() => {
    if (state.timer.runningSince === null) return;
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), DISPLAY_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [state.timer.runningSince]);

  useEffect(() => {
    persist();
  }, [state, persist]);

  useEffect(() => {
    if (state.timer.runningSince === null) return;
    const id = window.setInterval(() => persist(), AUTOSAVE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [state.timer.runningSince, persist]);

  const invalidNotes = useMemo(() => selectInvalidNotes(state), [state]);
  const digits = useMemo(() => selectDigitProgress(state), [state]);
  const conflicts = useMemo(() => findPeerConflicts(state.grid), [state.grid]);
  const hasProgress = useMemo(() => {
    if (!state.hasPuzzle) return false;
    return (
      state.grid.some((value, cell) => value !== state.puzzle[cell]) ||
      state.playerNotes.some((mask) => mask !== 0)
    );
  }, [state.grid, state.playerNotes, state.hasPuzzle, state.puzzle]);

  return {
    ...state,
    notes: state.playerNotes,
    invalidNotes,
    digits,
    conflicts,
    hasProgress,
    elapsedMs: selectElapsedMs(state, nowMs),
    timerRunning: state.timer.runningSince !== null,
    selectCell: (cell: number) => dispatch({ type: "select", cell }),
    enterDigit: (digit: Digit) => dispatch({ type: "enter", digit, now: Date.now() }),
    erase: () => dispatch({ type: "erase" }),
    togglePencil: () => dispatch({ type: "togglePencil" }),
    autoPencil: () => dispatch({ type: "autoPencil" }),
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
