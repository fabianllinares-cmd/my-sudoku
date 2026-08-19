import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { autoPencilNotes, emptyNotes, parseGrid, ratePuzzle } from "../engine";
import { clearMemoryStorage, useMemoryStorage } from "../test/memoryStorage";
import { loadSavedGame, migrateSavedGame, saveGame } from "./persistence";
import { createInitialState, reduce, selectElapsedMs, toSavedGame } from "./gameState";
import { SAVE_VERSION, STORAGE_KEY } from "./types";
import type { GameState, SavedGameV1, SavedGameV2 } from "./types";

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

function startedState(): GameState {
  return reduce(createInitialState("hard"), {
    type: "newGameReady",
    generated: { puzzle: PUZZLE, solution: SOLUTION, rating: ratePuzzle(PUZZLE, "hard") },
    difficulty: "hard",
  });
}

function legacyNotes(): number[] {
  const notes = emptyNotes();
  notes[2] = 0b101;
  return notes;
}

function v1(overrides: Partial<SavedGameV1> = {}): SavedGameV1 {
  const notes = legacyNotes();
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

function v2(overrides: Partial<SavedGameV2> = {}): SavedGameV2 {
  const manualNotes = legacyNotes();
  return {
    version: 2,
    puzzle: PUZZLE,
    solution: SOLUTION,
    grid: PUZZLE,
    manualNotes,
    autoPencil: false,
    pencilMode: false,
    selected: 2,
    difficulty: "extreme",
    elapsedMs: 9000,
    mistakes: 2,
    completed: false,
    undoStack: [{ grid: PUZZLE, manualNotes, mistakes: 1, completed: false }],
    savedAt: 2,
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
    const state = reduce(startedState(), { type: "enter", digit: 4, now: 0 });
    saveGame(toSavedGame(state, 1_000));

    const restored = loadSavedGame();
    expect(restored).not.toBeNull();
    expect(restored!.version).toBe(SAVE_VERSION);
    expect(restored!.grid).toEqual(state.grid);
    expect(restored!.playerNotes).toEqual(state.playerNotes);
    expect(restored!.difficulty).toBe("hard");
    expect(restored!.mistakes).toBe(state.mistakes);
  });

  it("round-trips notes including ones the board forbids", () => {
    let state = startedState();
    state = reduce(state, { type: "autoPencil" });
    state = reduce(state, { type: "togglePencil" });
    state = reduce(state, { type: "select", cell: 2 });
    state = reduce(state, { type: "enter", digit: 5, now: 0 });
    saveGame(toSavedGame(state, 0));

    expect(loadSavedGame()!.playerNotes).toEqual(state.playerNotes);
  });

  describe("active time across a reload", () => {
    it("keeps accumulated time and ignores the time the app was closed", () => {
      let state = reduce(startedState(), { type: "resume", now: 1_000 });
      expect(selectElapsedMs(state, 6_000)).toBe(5_000);

      // The app is hidden and then closed five seconds in.
      state = reduce(state, { type: "pause", now: 6_000 });
      saveGame(toSavedGame(state, 6_000));
      expect(loadSavedGame()!.timerMs).toBe(5_000);

      // Reopened much later.
      let resumed = reduce(createInitialState("easy"), {
        type: "hydrate",
        saved: loadSavedGame()!,
      });
      expect(resumed.timer.runningSince).toBeNull();
      expect(selectElapsedMs(resumed, 500_000)).toBe(5_000);

      resumed = reduce(resumed, { type: "resume", now: 500_000 });
      expect(selectElapsedMs(resumed, 502_000)).toBe(7_000);
    });

    it("banks time from a save taken while play is active", () => {
      const state = reduce(startedState(), { type: "resume", now: 0 });
      saveGame(toSavedGame(state, 12_000));

      const saved = loadSavedGame()!;
      expect(saved.timerMs).toBe(12_000);

      const resumed = reduce(createInitialState("easy"), { type: "hydrate", saved });
      expect(selectElapsedMs(resumed, 999_999)).toBe(12_000);
    });

    it("keeps a completed game's final time", () => {
      let state = reduce(startedState(), { type: "resume", now: 0 });
      state = { ...state, completed: true, timer: { accumulatedMs: 8_000, runningSince: null } };
      saveGame(toSavedGame(state, 100_000));

      const saved = loadSavedGame()!;
      expect(saved.completed).toBe(true);
      expect(saved.timerMs).toBe(8_000);

      const resumed = reduce(createInitialState("easy"), { type: "hydrate", saved });
      const afterResume = reduce(resumed, { type: "resume", now: 200_000 });
      expect(selectElapsedMs(afterResume, 300_000)).toBe(8_000);
    });
  });

  describe("migration", () => {
    it("keeps version 1 manual notes and elapsed time", () => {
      const migrated = migrateSavedGame(v1());
      expect(migrated!.version).toBe(SAVE_VERSION);
      expect(migrated!.playerNotes[2]).toBe(0b101);
      expect(migrated!.undoStack[0]!.playerNotes[2]).toBe(0b101);
      expect(migrated!.timerMs).toBe(4200);
    });

    it("keeps version 2 manual notes and elapsed time", () => {
      const migrated = migrateSavedGame(v2());
      expect(migrated!.version).toBe(SAVE_VERSION);
      expect(migrated!.playerNotes[2]).toBe(0b101);
      expect(migrated!.undoStack[0]!.playerNotes[2]).toBe(0b101);
      expect(migrated!.timerMs).toBe(9000);
      expect(migrated!.difficulty).toBe("extreme");
    });

    it("materialises the candidates a version 2 game was displaying", () => {
      // With Auto Pencil on, V2 derived the notes and stored none, so the
      // displayed candidates have to be written into the new note state.
      const migrated = migrateSavedGame(v2({ autoPencil: true }));
      expect(migrated!.playerNotes).toEqual(autoPencilNotes(PUZZLE));
      expect(migrated!.undoStack[0]!.playerNotes).toEqual(autoPencilNotes(PUZZLE));
    });

    it("materialises the candidates a version 1 game was displaying", () => {
      const migrated = migrateSavedGame(v1({ autoPencil: true }));
      expect(migrated!.playerNotes).toEqual(autoPencilNotes(PUZZLE));
    });

    it("leaves a migrated game playable and editable", () => {
      const state = reduce(createInitialState("easy"), {
        type: "hydrate",
        saved: migrateSavedGame(v2({ autoPencil: true }))!,
      });
      const edited = reduce(
        reduce(reduce(state, { type: "togglePencil" }), { type: "select", cell: 2 }),
        { type: "enter", digit: 1, now: 0 },
      );
      expect(edited.playerNotes[2]).not.toBe(state.playerNotes[2]);
    });
  });

  describe("rejects bad data", () => {
    it("returns null when nothing is stored", () => {
      expect(loadSavedGame()).toBeNull();
    });

    it("returns null for corrupt data", () => {
      localStorage.setItem(STORAGE_KEY, "{not json");
      expect(loadSavedGame()).toBeNull();
    });

    it("rejects a malformed board or missing notes", () => {
      expect(migrateSavedGame({ version: SAVE_VERSION, puzzle: [1, 2, 3] })).toBeNull();
      expect(migrateSavedGame(null)).toBeNull();
      expect(
        migrateSavedGame({ version: SAVE_VERSION, puzzle: PUZZLE, solution: SOLUTION, grid: PUZZLE }),
      ).toBeNull();
    });

    it("falls back to easy for an unknown difficulty", () => {
      expect(migrateSavedGame(v2({ difficulty: "impossible" as never }))!.difficulty).toBe("easy");
    });
  });
});
