import type { SavedGame } from "./types";
import { STORAGE_KEY } from "./types";

export function loadSavedGame(): SavedGame | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedGame;
    if (parsed.version !== 1) return null;
    if (!parsed.puzzle?.length || parsed.puzzle.length !== 81) return null;
    if (!parsed.solution?.length || parsed.solution.length !== 81) return null;
    if (!parsed.grid?.length || parsed.grid.length !== 81) return null;
    if (!parsed.notes?.length || parsed.notes.length !== 81) return null;
    return parsed;
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
