import { autoPencilNotes, DIFFICULTIES } from "../engine";
import type { Difficulty, Grid } from "../engine";
import type { BoardSnapshot, SavedGame, SavedGameV1, SavedGameV2 } from "./types";
import { SAVE_VERSION, STORAGE_KEY } from "./types";

function isBoard(value: unknown): value is number[] {
  return Array.isArray(value) && value.length === 81;
}

function asDifficulty(value: unknown): Difficulty {
  return DIFFICULTIES.includes(value as Difficulty) ? (value as Difficulty) : "easy";
}

/**
 * Versions 1 and 2 treated Auto Pencil as a mode and did not store the notes it
 * displayed. Materialise those candidates so a game in progress reopens showing
 * exactly the notes the player was looking at, now as editable state.
 */
function notesFor(stored: number[], grid: Grid, autoPencil: boolean): number[] {
  return autoPencil ? autoPencilNotes(grid) : stored;
}

function fromLegacy(saved: SavedGameV1 | SavedGameV2): SavedGame {
  const autoPencil = saved.autoPencil === true;
  const stored = saved.version === 1 ? saved.notes : saved.manualNotes;
  const undoStack: BoardSnapshot[] = (saved.undoStack ?? []).map((entry) => ({
    grid: entry.grid,
    playerNotes: notesFor(
      "notes" in entry ? entry.notes : entry.manualNotes,
      entry.grid,
      autoPencil,
    ),
    mistakes: entry.mistakes,
    completed: entry.completed,
  }));

  return {
    version: SAVE_VERSION,
    puzzle: saved.puzzle,
    solution: saved.solution,
    grid: saved.grid,
    playerNotes: notesFor(stored, saved.grid, autoPencil),
    pencilMode: saved.pencilMode,
    selected: saved.selected,
    difficulty: asDifficulty(saved.difficulty),
    timerMs: Math.max(0, saved.elapsedMs ?? 0),
    mistakes: saved.mistakes,
    completed: saved.completed,
    undoStack,
    savedAt: saved.savedAt,
  };
}

export function migrateSavedGame(value: unknown): SavedGame | null {
  if (!value || typeof value !== "object") return null;
  const saved = value as Partial<SavedGame> & Partial<SavedGameV1> & Partial<SavedGameV2>;

  if (!isBoard(saved.puzzle) || !isBoard(saved.solution) || !isBoard(saved.grid)) return null;

  if (saved.version === 1) {
    if (!isBoard(saved.notes)) return null;
    return fromLegacy(saved as SavedGameV1);
  }

  if (saved.version === 2) {
    if (!isBoard(saved.manualNotes)) return null;
    return fromLegacy(saved as SavedGameV2);
  }

  if (saved.version !== SAVE_VERSION || !isBoard(saved.playerNotes)) return null;

  return {
    ...(saved as SavedGame),
    difficulty: asDifficulty(saved.difficulty),
    timerMs: Math.max(0, saved.timerMs ?? 0),
    undoStack: saved.undoStack ?? [],
  };
}

export function loadSavedGame(): SavedGame | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return migrateSavedGame(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveGame(saved: SavedGame): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // Storage may be unavailable; gameplay still works in-memory.
  }
}
