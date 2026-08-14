import { describe, expect, it } from "vitest";
import { parseGrid } from "./board";
import {
  findPeerConflicts,
  hasPeerConflict,
  isCorrectPlacement,
  isPuzzleComplete,
} from "./validator";

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

describe("move validation", () => {
  it("detects peer conflicts", () => {
    const grid = PUZZLE.slice();
    grid[2] = 5;
    const conflicts = findPeerConflicts(grid);
    expect(conflicts[0]).toBe(true);
    expect(conflicts[2]).toBe(true);
    expect(hasPeerConflict(PUZZLE, 2, 5)).toBe(true);
    expect(hasPeerConflict(PUZZLE, 2, 4)).toBe(false);
  });

  it("detects incorrect placements against the solution", () => {
    expect(isCorrectPlacement(SOLUTION, 2, 4)).toBe(true);
    expect(isCorrectPlacement(SOLUTION, 2, 1)).toBe(false);
  });

  it("detects puzzle completion", () => {
    expect(isPuzzleComplete(PUZZLE, SOLUTION)).toBe(false);
    expect(isPuzzleComplete(SOLUTION, SOLUTION)).toBe(true);
    const almost = SOLUTION.slice();
    almost[80] = 0;
    expect(isPuzzleComplete(almost, SOLUTION)).toBe(false);
    almost[80] = 8;
    expect(isPuzzleComplete(almost, SOLUTION)).toBe(false);
  });
});
