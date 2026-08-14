import { beforeEach, describe, expect, it } from "vitest";
import {
  calculateCandidateMasks,
  digitsFromMask,
  hasDigit,
  parseGrid,
  ratePuzzle,
} from "../engine";
import type { Digit, GeneratedPuzzle } from "../engine";
import { boxOf, colOf, rowOf } from "../engine";
import { createInitialState, reduce, selectDigitProgress, selectNotes } from "./gameState";
import type { GameAction, GameState } from "./types";

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

const EMPTY_CELL = 2;
const CORRECT_DIGIT = SOLUTION[EMPTY_CELL]! as Digit;

function generated(): GeneratedPuzzle {
  return { puzzle: PUZZLE, solution: SOLUTION, rating: ratePuzzle(PUZZLE, "easy") };
}

function run(state: GameState, ...actions: GameAction[]): GameState {
  return actions.reduce(reduce, state);
}

function peersOf(cell: number): number[] {
  const peers: number[] = [];
  for (let other = 0; other < 81; other += 1) {
    if (other === cell) continue;
    if (rowOf(other) === rowOf(cell) || colOf(other) === colOf(cell) || boxOf(other) === boxOf(cell)) {
      peers.push(other);
    }
  }
  return peers;
}

describe("game state", () => {
  let started: GameState;

  beforeEach(() => {
    started = run(createInitialState("easy"), {
      type: "newGameReady",
      generated: generated(),
      difficulty: "easy",
    });
  });

  it("starts from the puzzle with no notes", () => {
    expect(started.grid).toEqual(PUZZLE);
    expect(started.hasPuzzle).toBe(true);
    expect(started.generating).toBe(false);
    expect(selectNotes(started).every((mask) => mask === 0)).toBe(true);
  });

  describe("auto pencil", () => {
    it("shows candidates calculated from the current board", () => {
      const state = run(started, { type: "toggleAutoPencil" });
      expect(selectNotes(state)).toEqual(calculateCandidateMasks(state.grid));
    });

    it("removes a placed digit from row, column and box peers", () => {
      const state = run(
        started,
        { type: "toggleAutoPencil" },
        { type: "select", cell: EMPTY_CELL },
        { type: "enter", digit: CORRECT_DIGIT },
      );
      const notes = selectNotes(state);

      expect(state.grid[EMPTY_CELL]).toBe(CORRECT_DIGIT);
      expect(notes[EMPTY_CELL]).toBe(0);
      for (const peer of peersOf(EMPTY_CELL)) {
        if (state.grid[peer] !== 0) continue;
        expect(hasDigit(notes[peer]!, CORRECT_DIGIT)).toBe(false);
      }
    });

    it("recalculates after erasing a number", () => {
      const placed = run(
        started,
        { type: "toggleAutoPencil" },
        { type: "select", cell: EMPTY_CELL },
        { type: "enter", digit: CORRECT_DIGIT },
      );
      const erased = run(placed, { type: "erase" });
      const notes = selectNotes(erased);

      expect(erased.grid[EMPTY_CELL]).toBe(0);
      expect(notes).toEqual(calculateCandidateMasks(erased.grid));
      expect(digitsFromMask(notes[EMPTY_CELL]!)).toContain(CORRECT_DIGIT);
    });

    it("recalculates after undoing a move", () => {
      const before = run(started, { type: "toggleAutoPencil" }, { type: "select", cell: EMPTY_CELL });
      const notesBefore = selectNotes(before);
      const after = run(before, { type: "enter", digit: CORRECT_DIGIT }, { type: "undo" });

      expect(after.grid).toEqual(PUZZLE);
      expect(selectNotes(after)).toEqual(notesBefore);
      expect(selectNotes(after)).toEqual(calculateCandidateMasks(after.grid));
    });

    it("stays in sync across a sequence of entries and undos", () => {
      let state = run(started, { type: "toggleAutoPencil" });
      const empties = PUZZLE.map((value, cell) => (value === 0 ? cell : -1)).filter((c) => c >= 0);

      for (const cell of empties.slice(0, 8)) {
        state = run(state, { type: "select", cell }, { type: "enter", digit: SOLUTION[cell]! as Digit });
        expect(selectNotes(state)).toEqual(calculateCandidateMasks(state.grid));
      }
      for (let i = 0; i < 4; i += 1) {
        state = run(state, { type: "undo" });
        expect(selectNotes(state)).toEqual(calculateCandidateMasks(state.grid));
      }
    });

    it("keeps manual notes and restores them when disabled", () => {
      const withNotes = run(
        started,
        { type: "togglePencil" },
        { type: "select", cell: EMPTY_CELL },
        { type: "enter", digit: 1 },
        { type: "enter", digit: 9 },
      );
      const manual = selectNotes(withNotes)[EMPTY_CELL];
      expect(digitsFromMask(manual!)).toEqual([1, 9]);

      const auto = run(withNotes, { type: "toggleAutoPencil" });
      expect(selectNotes(auto)).toEqual(calculateCandidateMasks(auto.grid));
      expect(auto.pencilMode).toBe(false);

      const back = run(auto, { type: "toggleAutoPencil" });
      expect(selectNotes(back)[EMPTY_CELL]).toBe(manual);
    });
  });

  describe("manual notes", () => {
    it("toggles candidates in pencil mode", () => {
      const state = run(
        started,
        { type: "togglePencil" },
        { type: "select", cell: EMPTY_CELL },
        { type: "enter", digit: 4 },
        { type: "enter", digit: 4 },
      );
      expect(selectNotes(state)[EMPTY_CELL]).toBe(0);
    });

    it("clears a cell's notes when a number is placed there", () => {
      const state = run(
        started,
        { type: "togglePencil" },
        { type: "select", cell: EMPTY_CELL },
        { type: "enter", digit: 1 },
        { type: "togglePencil" },
        { type: "enter", digit: CORRECT_DIGIT },
      );
      expect(state.manualNotes[EMPTY_CELL]).toBe(0);
    });
  });

  describe("remaining digit counts", () => {
    it("drops the count after a correct entry and restores it on undo", () => {
      const index = CORRECT_DIGIT - 1;
      const before = selectDigitProgress(started)[index]!;

      const placed = run(started, { type: "select", cell: EMPTY_CELL }, { type: "enter", digit: CORRECT_DIGIT });
      expect(selectDigitProgress(placed)[index]!.remaining).toBe(before.remaining - 1);

      const undone = run(placed, { type: "undo" });
      expect(selectDigitProgress(undone)[index]!.remaining).toBe(before.remaining);

      const erased = run(placed, { type: "erase" });
      expect(selectDigitProgress(erased)[index]!.remaining).toBe(before.remaining);
    });

    it("does not count an incorrect entry", () => {
      const wrong: Digit = CORRECT_DIGIT === 1 ? 2 : 1;
      const before = selectDigitProgress(started)[wrong - 1]!;
      const state = run(started, { type: "select", cell: EMPTY_CELL }, { type: "enter", digit: wrong });

      expect(state.mistakes).toBe(1);
      expect(selectDigitProgress(state)[wrong - 1]!.remaining).toBe(before.remaining);
      expect(selectDigitProgress(state)[wrong - 1]!.completed).toBe(false);
    });

    it("marks a digit complete once all nine are correctly placed", () => {
      let state = started;
      for (let cell = 0; cell < 81; cell += 1) {
        if (SOLUTION[cell] === 7 && state.grid[cell] === 0) {
          state = run(state, { type: "select", cell }, { type: "enter", digit: 7 });
        }
      }
      const seven = selectDigitProgress(state)[6]!;
      expect(seven.remaining).toBe(0);
      expect(seven.completed).toBe(true);
    });
  });

  describe("rules", () => {
    it("never edits an original clue", () => {
      const clue = PUZZLE.findIndex((value) => value !== 0);
      const state = run(started, { type: "select", cell: clue }, { type: "enter", digit: 1 }, { type: "erase" });
      expect(state.grid[clue]).toBe(PUZZLE[clue]);
    });

    it("detects completion when the last correct number is entered", () => {
      let state = started;
      for (let cell = 0; cell < 81; cell += 1) {
        if (state.grid[cell] === 0) {
          state = run(state, { type: "select", cell }, { type: "enter", digit: SOLUTION[cell]! as Digit });
        }
      }
      expect(state.completed).toBe(true);
      expect(state.mistakes).toBe(0);
    });
  });
});
