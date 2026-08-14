import { describe, expect, it } from "vitest";
import { parseGrid } from "./board";
import { digitProgress, remainingDigitCounts } from "./progress";

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

describe("digit progress", () => {
  it("counts original clues", () => {
    const progress = digitProgress(PUZZLE, SOLUTION);
    const clueCounts = new Map<number, number>();
    for (const value of PUZZLE) {
      if (value !== 0) clueCounts.set(value, (clueCounts.get(value) ?? 0) + 1);
    }
    for (const entry of progress) {
      expect(entry.placed).toBe(clueCounts.get(entry.digit) ?? 0);
      expect(entry.remaining).toBe(9 - entry.placed);
      expect(entry.completed).toBe(entry.placed === 9);
    }
  });

  it("counts correctly placed player numbers alongside clues", () => {
    const grid = PUZZLE.slice();
    const cell = 2;
    expect(SOLUTION[cell]).toBe(4);
    const before = digitProgress(grid, SOLUTION)[3]!;
    grid[cell] = 4;
    const after = digitProgress(grid, SOLUTION)[3]!;

    expect(after.digit).toBe(4);
    expect(after.placed).toBe(before.placed + 1);
    expect(after.remaining).toBe(before.remaining - 1);
  });

  it("ignores incorrect placements", () => {
    const grid = PUZZLE.slice();
    const cell = 2;
    grid[cell] = 1;
    const progress = digitProgress(grid, SOLUTION);
    const before = digitProgress(PUZZLE, SOLUTION);

    expect(progress[0]!.placed).toBe(before[0]!.placed);
    expect(progress[0]!.remaining).toBe(before[0]!.remaining);
  });

  it("reports zero remaining and completion for a fully placed digit", () => {
    const grid = PUZZLE.slice();
    for (let cell = 0; cell < 81; cell += 1) {
      if (SOLUTION[cell] === 7) grid[cell] = 7;
    }
    const seven = digitProgress(grid, SOLUTION)[6]!;

    expect(seven.digit).toBe(7);
    expect(seven.placed).toBe(9);
    expect(seven.remaining).toBe(0);
    expect(seven.completed).toBe(true);
  });

  it("does not complete a digit when one instance is wrong", () => {
    const grid = SOLUTION.slice();
    const cell = grid.findIndex((value) => value === 7);
    grid[cell] = 1;
    const progress = digitProgress(grid, SOLUTION);

    expect(progress[6]!.remaining).toBe(1);
    expect(progress[6]!.completed).toBe(false);
    // The misplaced 1 sits where a 7 belongs, so it never counts as a tenth 1.
    expect(progress[0]!.placed).toBe(9);
  });

  it("reports every digit complete for a solved board", () => {
    const progress = digitProgress(SOLUTION, SOLUTION);
    expect(progress.every((entry) => entry.completed)).toBe(true);
    expect(remainingDigitCounts(SOLUTION, SOLUTION)).toEqual(Array(9).fill(0));
  });

  it("exposes remaining counts indexed by digit", () => {
    const counts = remainingDigitCounts(PUZZLE, SOLUTION);
    expect(counts).toHaveLength(9);
    const progress = digitProgress(PUZZLE, SOLUTION);
    counts.forEach((count, index) => {
      expect(count).toBe(progress[index]!.remaining);
    });
  });
});
