import { beforeEach, describe, expect, it } from "vitest";
import {
  autoPencilNotes,
  digitsFromMask,
  hasDigit,
  invalidNoteMasks,
  parseGrid,
  ratePuzzle,
} from "../engine";
import type { Digit, GeneratedPuzzle } from "../engine";
import { boxOf, colOf, rowOf } from "../engine";
import {
  createInitialState,
  reduce,
  selectDigitProgress,
  selectElapsedMs,
  selectInvalidNotes,
} from "./gameState";
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

/** Cell 2 has exactly {1,2,4} available; cell 8 shares its row and solves to 2. */
const CELL = 2;
const PEER_CELL = 8;
const UNRELATED_CELL = 40;

function generated(): GeneratedPuzzle {
  return { puzzle: PUZZLE, solution: SOLUTION, rating: ratePuzzle(PUZZLE, "easy") };
}

function run(state: GameState, ...actions: GameAction[]): GameState {
  return actions.reduce(reduce, state);
}

function place(state: GameState, cell: number, digit: Digit, now = 0): GameState {
  return run(state, { type: "select", cell }, { type: "enter", digit, now });
}

function pencil(state: GameState, cell: number, digit: Digit): GameState {
  return run(
    state,
    { type: "togglePencil" },
    { type: "select", cell },
    { type: "enter", digit, now: 0 },
    { type: "togglePencil" },
  );
}

function notesAt(state: GameState, cell: number): Digit[] {
  return digitsFromMask(state.playerNotes[cell]!);
}

function isPeer(a: number, b: number): boolean {
  return rowOf(a) === rowOf(b) || colOf(a) === colOf(b) || boxOf(a) === boxOf(b);
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

  it("starts from the puzzle with no notes and a stopped timer", () => {
    expect(started.grid).toEqual(PUZZLE);
    expect(started.hasPuzzle).toBe(true);
    expect(started.playerNotes.every((mask) => mask === 0)).toBe(true);
    expect(started.timer.runningSince).toBeNull();
    expect(selectElapsedMs(started, 10_000)).toBe(0);
  });

  describe("auto pencil", () => {
    it("fills every empty cell with the currently valid candidates", () => {
      const state = run(started, { type: "autoPencil" });
      expect(state.playerNotes).toEqual(autoPencilNotes(state.grid));
      expect(notesAt(state, CELL)).toEqual([1, 2, 4]);
      expect(selectInvalidNotes(state).every((mask) => mask === 0)).toBe(true);
    });

    it("leaves notes editable afterwards", () => {
      let state = run(started, { type: "autoPencil" });
      state = pencil(state, CELL, 1);
      expect(notesAt(state, CELL)).toEqual([2, 4]);

      state = pencil(state, CELL, 1);
      expect(notesAt(state, CELL)).toEqual([1, 2, 4]);
    });

    it("keeps a manually removed note removed after an unrelated move", () => {
      let state = run(started, { type: "autoPencil" });
      state = pencil(state, CELL, 4);
      expect(notesAt(state, CELL)).toEqual([1, 2]);

      state = place(state, UNRELATED_CELL, 5);
      expect(isPeer(UNRELATED_CELL, CELL)).toBe(false);
      expect(notesAt(state, CELL)).toEqual([1, 2]);
    });

    it("removes a placed digit from row, column and box notes only", () => {
      const filled = run(started, { type: "autoPencil" });
      const before = filled.playerNotes.slice();
      const state = place(filled, PEER_CELL, 2);

      for (let cell = 0; cell < 81; cell += 1) {
        if (cell === PEER_CELL) {
          expect(state.playerNotes[cell]).toBe(0);
        } else if (isPeer(cell, PEER_CELL)) {
          expect(hasDigit(state.playerNotes[cell]!, 2)).toBe(false);
          expect(state.playerNotes[cell]).toBe(before[cell]! & ~0b10);
        } else {
          expect(state.playerNotes[cell]).toBe(before[cell]);
        }
      }
    });

    // The example from the V3 brief: {2,4,7} manually trimmed to {4,7} must
    // become {4} after a peer takes 7, never {2,4}.
    it("prunes without recalculating over a curated note set", () => {
      let state = run(started, { type: "autoPencil" });
      expect(notesAt(state, CELL)).toEqual([1, 2, 4]);

      state = pencil(state, CELL, 1);
      expect(notesAt(state, CELL)).toEqual([2, 4]);

      state = place(state, PEER_CELL, 2);

      expect(notesAt(state, CELL)).toEqual([4]);
      expect(notesAt(state, CELL)).not.toContain(1);
      expect(state.mistakes).toBe(0);
    });

    it("recalculates from scratch when pressed a second time", () => {
      let state = run(started, { type: "autoPencil" });
      state = pencil(state, CELL, 1);
      state = pencil(state, CELL, 5);
      state = place(state, PEER_CELL, 2);
      expect(notesAt(state, CELL)).toEqual([4, 5]);

      state = run(state, { type: "autoPencil" });

      expect(state.playerNotes).toEqual(autoPencilNotes(state.grid));
      expect(notesAt(state, CELL)).toEqual([1, 4]);
      expect(selectInvalidNotes(state).every((mask) => mask === 0)).toBe(true);
    });
  });

  describe("impossible manual notes", () => {
    it("allows pencilling a digit the board rules out", () => {
      // Row 0 already holds a 5.
      const state = pencil(started, CELL, 5);
      expect(notesAt(state, CELL)).toEqual([5]);
    });

    it("marks it invalid without touching the mistake counter", () => {
      const state = pencil(started, CELL, 5);
      const invalid = selectInvalidNotes(state);

      expect(hasDigit(invalid[CELL]!, 5)).toBe(true);
      expect(state.mistakes).toBe(0);
      expect(invalid).toEqual(invalidNoteMasks(state.playerNotes, state.grid));
    });

    it("never counts invalid notes as mistakes, however many are added", () => {
      let state = started;
      for (const digit of [5, 3, 7] as Digit[]) {
        state = pencil(state, CELL, digit);
      }
      expect(notesAt(state, CELL)).toEqual([3, 5, 7]);
      expect(state.mistakes).toBe(0);
    });

    it("clears the flag when the board makes the note legal again", () => {
      // A 4 placed in the same row makes a pencilled 4 impossible.
      let state = place(started, PEER_CELL, 4);
      state = pencil(state, CELL, 4);
      expect(notesAt(state, CELL)).toEqual([4]);
      expect(hasDigit(selectInvalidNotes(state)[CELL]!, 4)).toBe(true);

      state = run(state, { type: "select", cell: PEER_CELL }, { type: "erase" });
      expect(notesAt(state, CELL)).toEqual([4]);
      expect(selectInvalidNotes(state)[CELL]).toBe(0);
    });

    it("also clears the flag after undoing the move that caused it", () => {
      let state = place(started, PEER_CELL, 4);
      state = pencil(state, CELL, 4);
      expect(hasDigit(selectInvalidNotes(state)[CELL]!, 4)).toBe(true);

      state = run(state, { type: "undo" }, { type: "undo" });
      expect(selectInvalidNotes(state)[CELL]).toBe(0);
    });
  });

  describe("undo", () => {
    it("restores notes pruned by a definite placement", () => {
      const filled = run(started, { type: "autoPencil" });
      const before = filled.playerNotes.slice();

      const placed = place(filled, PEER_CELL, 2);
      expect(placed.playerNotes).not.toEqual(before);

      const undone = run(placed, { type: "undo" });
      expect(undone.playerNotes).toEqual(before);
      expect(undone.grid).toEqual(PUZZLE);
    });

    it("restores a manually added note", () => {
      const before = started.playerNotes.slice();
      const state = pencil(started, CELL, 5);
      const undone = run(state, { type: "undo" });
      expect(undone.playerNotes).toEqual(before);
    });

    it("restores a manually removed note", () => {
      const filled = run(started, { type: "autoPencil" });
      const before = filled.playerNotes.slice();
      const trimmed = pencil(filled, CELL, 2);
      expect(notesAt(trimmed, CELL)).toEqual([1, 4]);

      const undone = run(trimmed, { type: "undo" });
      expect(undone.playerNotes).toEqual(before);
    });

    it("restores the notes replaced by auto pencil", () => {
      const state = pencil(started, CELL, 5);
      const before = state.playerNotes.slice();
      const filled = run(state, { type: "autoPencil" });
      expect(filled.playerNotes).not.toEqual(before);

      expect(run(filled, { type: "undo" }).playerNotes).toEqual(before);
    });

    it("steps back through a mixed sequence of notes and numbers", () => {
      const states: GameState[] = [run(started, { type: "autoPencil" })];
      states.push(pencil(states[0]!, CELL, 1));
      states.push(place(states[1]!, PEER_CELL, 2));
      states.push(pencil(states[2]!, CELL, 9));

      let state = states[3]!;
      for (let i = 2; i >= 0; i -= 1) {
        state = run(state, { type: "undo" });
        expect(state.playerNotes).toEqual(states[i]!.playerNotes);
        expect(state.grid).toEqual(states[i]!.grid);
      }
    });
  });

  describe("timer", () => {
    it("counts only while resumed", () => {
      let state = run(started, { type: "resume", now: 1_000 });
      expect(selectElapsedMs(state, 4_000)).toBe(3_000);

      state = run(state, { type: "pause", now: 4_000 });
      expect(selectElapsedMs(state, 90_000)).toBe(3_000);

      state = run(state, { type: "resume", now: 90_000 });
      expect(selectElapsedMs(state, 91_500)).toBe(4_500);
    });

    it("does not start before a puzzle is ready", () => {
      const blank = run(createInitialState("easy"), { type: "resume", now: 1_000 });
      expect(blank.timer.runningSince).toBeNull();
      expect(selectElapsedMs(blank, 60_000)).toBe(0);
    });

    it("stops permanently when the puzzle is completed", () => {
      let state = run(started, { type: "resume", now: 0 });
      const empties = PUZZLE.map((value, cell) => (value === 0 ? cell : -1)).filter((c) => c >= 0);

      for (const cell of empties) {
        state = place(state, cell, SOLUTION[cell]! as Digit, 1_000);
      }

      expect(state.completed).toBe(true);
      expect(state.timer.runningSince).toBeNull();
      expect(selectElapsedMs(state, 500_000)).toBe(1_000);

      const afterResume = run(state, { type: "resume", now: 600_000 });
      expect(afterResume.timer.runningSince).toBeNull();
      expect(selectElapsedMs(afterResume, 900_000)).toBe(1_000);
    });

    it("resets for a new game", () => {
      const played = run(started, { type: "resume", now: 0 }, { type: "pause", now: 30_000 });
      expect(selectElapsedMs(played, 30_000)).toBe(30_000);

      const fresh = run(played, {
        type: "newGameReady",
        generated: generated(),
        difficulty: "easy",
      });
      expect(selectElapsedMs(fresh, 30_000)).toBe(0);
    });
  });

  describe("rules", () => {
    it("never edits an original clue", () => {
      const clue = PUZZLE.findIndex((value) => value !== 0);
      const state = run(
        started,
        { type: "select", cell: clue },
        { type: "enter", digit: 1, now: 0 },
        { type: "erase" },
      );
      expect(state.grid[clue]).toBe(PUZZLE[clue]);
    });

    it("counts an incorrect entry as a mistake", () => {
      const state = place(started, CELL, 1);
      expect(state.grid[CELL]).toBe(1);
      expect(state.mistakes).toBe(1);
    });

    it("clears a cell when the same digit is entered twice", () => {
      const state = place(place(started, CELL, 4), CELL, 4);
      expect(state.grid[CELL]).toBe(0);
    });

    it("detects completion when the last correct number is entered", () => {
      let state = started;
      for (let cell = 0; cell < 81; cell += 1) {
        if (state.grid[cell] === 0) {
          state = place(state, cell, SOLUTION[cell]! as Digit);
        }
      }
      expect(state.completed).toBe(true);
      expect(state.mistakes).toBe(0);
    });
  });

  describe("remaining digit counts", () => {
    it("drops after a correct entry and returns on undo or erase", () => {
      const before = selectDigitProgress(started)[1]!;
      const placed = place(started, PEER_CELL, 2);
      expect(selectDigitProgress(placed)[1]!.remaining).toBe(before.remaining - 1);

      expect(selectDigitProgress(run(placed, { type: "undo" }))[1]!.remaining).toBe(before.remaining);
      expect(selectDigitProgress(run(placed, { type: "erase" }))[1]!.remaining).toBe(before.remaining);
    });

    it("does not count an incorrect entry", () => {
      const before = selectDigitProgress(started)[0]!;
      const state = place(started, CELL, 1);
      expect(state.mistakes).toBe(1);
      expect(selectDigitProgress(state)[0]!.remaining).toBe(before.remaining);
    });

    it("marks a digit complete once all nine are correctly placed", () => {
      let state = started;
      for (let cell = 0; cell < 81; cell += 1) {
        if (SOLUTION[cell] === 7 && state.grid[cell] === 0) {
          state = place(state, cell, 7);
        }
      }
      const seven = selectDigitProgress(state)[6]!;
      expect(seven.remaining).toBe(0);
      expect(seven.completed).toBe(true);
    });
  });
});
