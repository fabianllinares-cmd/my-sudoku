import { DIFFICULTIES, emptyNotes } from "../engine";
import type { Difficulty } from "../engine";
import type { SavedGame, SavedGameV1 } from "./types";
import { SAVE_VERSION, STORAGE_KEY } from "./types";

function isBoard(value: unknown): value is number[] {
  return Array.isArray(value) && value.length === 81;
}

function asDifficulty(value: unknown): Difficulty {
  return DIFFICULTIES.includes(value as Difficulty) ? (value as Difficulty) : "easy";
}

/**
 * Version 1 stored displayed notes, which were auto-generated while Auto Pencil
 * was on. Only treat them as manual notes when Auto Pencil was off.
 */
function fromV1(saved: SavedGameV1): SavedGame {
  const manualNotes = saved.autoPencil ? emptyNotes() : saved.notes;
  return {
    version: SAVE_VERSION,
    puzzle: saved.puzzle,
    solution: saved.solution,
    grid: saved.grid,
    manualNotes,
    autoPencil: saved.autoPencil,
    pencilMode: saved.pencilMode,
    selected: saved.selected,
    difficulty: asDifficulty(saved.difficulty),
    elapsedMs: saved.elapsedMs,
    mistakes: saved.mistakes,
    completed: saved.completed,
    undoStack: (saved.undoStack ?? []).map((entry) => ({
      grid: entry.grid,
      manualNotes: saved.autoPencil ? emptyNotes() : entry.notes,
      mistakes: entry.mistakes,
      completed: entry.completed,
    })),
    savedAt: saved.savedAt,
  };
}

export function migrateSavedGame(value: unknown): SavedGame | null {
  if (!value || typeof value !== "object") return null;
  const saved = value as Partial<SavedGame> & Partial<SavedGameV1>;

  if (!isBoard(saved.puzzle) || !isBoard(saved.solution) || !isBoard(saved.grid)) return null;

  if (saved.version === 1) {
    if (!isBoard(saved.notes)) return null;
    return fromV1(saved as SavedGameV1);
  }

  if (saved.version !== SAVE_VERSION || !isBoard(saved.manualNotes)) return null;

  return {
    ...(saved as SavedGame),
    difficulty: asDifficulty(saved.difficulty),
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
