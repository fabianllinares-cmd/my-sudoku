import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { emptyNotes, parseGrid } from "../engine";
import { clearMemoryStorage, useMemoryStorage } from "../test/memoryStorage";
import { loadSavedGame, migrateSavedGame, saveGame } from "./persistence";
import { createInitialState, reduce, toSavedGame } from "./gameState";
import { SAVE_VERSION, STORAGE_KEY } from "./types";
import type { SavedGameV1 } from "./types";
import { ratePuzzle } from "../engine";

const PUZZLE = parseGrid(`
53..7....
6..195...
.98....6.
8...6...3
4..8.3..1
7...2...6
.6....28.
...419..5
....8..79
`);

const SOLUTION = parseGrid(`
534678912
672195348
198342567
859761423
426853791
713924856
961537284
287419635
345286179
`);

function startedState() {
  return reduce(createInitialState("hard"), {
    type: "newGameReady",
    generated: { puzzle: PUZZLE, solution: SOLUTION, rating: ratePuzzle(PUZZLE, "hard") },
    difficulty: "hard",
  });
}

function v1(overrides: Partial<SavedGameV1> = {}): SavedGameV1 {
  const notes = emptyNotes();
  notes[2] = 0b101;
  return {
    version: 1,
    puzzle: PUZZLE,
    solution: SOLUTION,
    grid: PUZZLE,
    notes,
    autoPencil: false,
    pencilMode: false,
    selected: 2,
    difficulty: "medium",
    elapsedMs: 4200,
    mistakes: 1,
    completed: false,
    undoStack: [{ grid: PUZZLE, notes, mistakes: 0, completed: false }],
    savedAt: 1,
    ...overrides,
  };
}

describe("persistence", () => {
  beforeEach(() => {
    useMemoryStorage();
  });

  afterEach(() => {
    clearMemoryStorage();
  });

  it("saves and restores a game", () => {
    const state = reduce(startedState(), { type: "enter", digit: 4 });
    saveGame(toSavedGame(state));

    const restored = loadSavedGame();
    expect(restored).not.toBeNull();
    expect(restored!.version).toBe(SAVE_VERSION);
    expect(restored!.grid).toEqual(state.grid);
    expect(restored!.manualNotes).toEqual(state.manualNotes);
    expect(restored!.difficulty).toBe("hard");
    expect(restored!.mistakes).toBe(state.mistakes);
    expect(restored!.elapsedMs).toBe(state.elapsedMs);
  });

  it("restores extreme games", () => {
    const state = { ...startedState(), difficulty: "extreme" as const };
    saveGame(toSavedGame(state));
    expect(loadSavedGame()!.difficulty).toBe("extreme");
  });

  it("returns null when nothing is stored", () => {
    expect(loadSavedGame()).toBeNull();
  });

  it("returns null for corrupt data", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    expect(loadSavedGame()).toBeNull();
  });

  it("rejects a save with a malformed board", () => {
    expect(migrateSavedGame({ version: SAVE_VERSION, puzzle: [1, 2, 3] })).toBeNull();
    expect(migrateSavedGame(null)).toBeNull();
  });

  it("migrates version 1 manual notes", () => {
    const migrated = migrateSavedGame(v1());
    expect(migrated).not.toBeNull();
    expect(migrated!.version).toBe(SAVE_VERSION);
    expect(migrated!.manualNotes[2]).toBe(0b101);
    expect(migrated!.undoStack[0]!.manualNotes[2]).toBe(0b101);
    expect(migrated!.elapsedMs).toBe(4200);
  });

  it("drops version 1 notes that were auto-generated", () => {
    const migrated = migrateSavedGame(v1({ autoPencil: true }));
    expect(migrated!.autoPencil).toBe(true);
    expect(migrated!.manualNotes.every((mask) => mask === 0)).toBe(true);
    expect(migrated!.undoStack[0]!.manualNotes.every((mask) => mask === 0)).toBe(true);
  });

  it("falls back to easy for an unknown difficulty", () => {
    const migrated = migrateSavedGame(v1({ difficulty: "impossible" as never }));
    expect(migrated!.difficulty).toBe("easy");
  });
});
