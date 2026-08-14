import { describe, expect, it } from "vitest";
import { calculateCandidateMasks, calculateCandidates, syncAutoPencilNotes } from "./candidates";
import { cloneGrid, parseGrid } from "./board";
import { digitsFromMask, hasDigit } from "./bits";
import { boxOf, colOf, rowOf } from "./units";
import type { Digit } from "./types";

const WIKIPEDIA_EASY = parseGrid(`
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

describe("candidates", () => {
  it("calculates row/column/box candidates correctly", () => {
    const masks = calculateCandidateMasks(WIKIPEDIA_EASY);
    const emptyCell = 2;
    expect(WIKIPEDIA_EASY[emptyCell]).toBe(0);
    const digits = digitsFromMask(masks[emptyCell]!);
    expect(digits).not.toContain(5);
    expect(digits).not.toContain(3);
    expect(digits).not.toContain(7);
    expect(digits).toContain(4);
    expect(digits).toContain(1);
    expect(digits).toContain(2);
  });

  it("returns no candidates for filled cells", () => {
    const masks = calculateCandidateMasks(WIKIPEDIA_EASY);
    expect(masks[0]).toBe(0);
    expect(calculateCandidates(WIKIPEDIA_EASY)[0]).toEqual([]);
  });
});

describe("auto pencil updates", () => {
  it("removes a placed digit from peers in the same row, column, and box", () => {
    const grid = cloneGrid(WIKIPEDIA_EASY);
    const cell = 2;
    const digit = 4 as Digit;
    grid[cell] = digit;

    const before = calculateCandidateMasks(WIKIPEDIA_EASY);
    const after = syncAutoPencilNotes(grid);

    expect(after[cell]).toBe(0);

    for (let peer = 0; peer < 81; peer += 1) {
      if (peer === cell || grid[peer] !== 0) continue;
      const sameUnit =
        rowOf(peer) === rowOf(cell) || colOf(peer) === colOf(cell) || boxOf(peer) === boxOf(cell);
      if (!sameUnit) continue;
      expect(hasDigit(after[peer]!, digit)).toBe(false);
      if (hasDigit(before[peer]!, digit)) {
        expect(hasDigit(after[peer]!, digit)).toBe(false);
      }
    }
  });

  it("recalculates candidates from the current board, not the original puzzle", () => {
    const grid = cloneGrid(WIKIPEDIA_EASY);
    grid[2] = 4;
    const after = calculateCandidates(grid);
    expect(after[1]).not.toContain(4);
    expect(after[11]).not.toContain(4);
  });
});
