import { describe, expect, it } from "vitest";
import {
  cloneGrid,
  findConflicts,
  generatePuzzle,
  isSolved,
  isValidPlacement,
  solve,
  type Difficulty,
  type Grid,
} from "./engine";

function countClues(grid: Grid): number {
  return grid.flat().filter((v) => v !== 0).length;
}

/** Exhaustively count solutions (test-only, no early stop). */
function countAllSolutions(grid: Grid, limit = 2): number {
  const work = cloneGrid(grid);
  let found = 0;
  const search = (): boolean => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (work[row][col] !== 0) continue;
        for (let value = 1; value <= 9; value++) {
          if (isValidPlacement(work, row, col, value)) {
            work[row][col] = value;
            if (search()) return true;
            work[row][col] = 0;
          }
        }
        return false;
      }
    }
    found++;
    return found >= limit;
  };
  search();
  return found;
}

describe("isValidPlacement", () => {
  it("rejects duplicates in a row, column, and box", () => {
    const grid: Grid = Array.from({ length: 9 }, () => Array(9).fill(0));
    grid[0][0] = 5;
    expect(isValidPlacement(grid, 0, 4, 5)).toBe(false); // same row
    expect(isValidPlacement(grid, 4, 0, 5)).toBe(false); // same column
    expect(isValidPlacement(grid, 1, 1, 5)).toBe(false); // same box
    expect(isValidPlacement(grid, 4, 4, 5)).toBe(true); // unrelated cell
  });
});

describe("generatePuzzle", () => {
  const difficulties: Difficulty[] = ["easy", "medium", "hard", "expert"];

  for (const difficulty of difficulties) {
    it(`produces a solvable ${difficulty} puzzle with a unique solution`, () => {
      const { puzzle, solution } = generatePuzzle(difficulty);

      // Solution is a fully valid completed grid.
      expect(isSolved(solution)).toBe(true);

      // Puzzle is a subset of the solution and has no conflicts.
      expect(findConflicts(puzzle).size).toBe(0);
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (puzzle[r][c] !== 0) {
            expect(puzzle[r][c]).toBe(solution[r][c]);
          }
        }
      }

      // Harder puzzles reveal fewer clues.
      expect(countClues(puzzle)).toBeLessThan(81);

      // The puzzle has exactly one solution.
      expect(countAllSolutions(puzzle)).toBe(1);

      // Solving the puzzle reproduces the recorded solution.
      const attempt = cloneGrid(puzzle);
      expect(solve(attempt)).toBe(true);
      expect(attempt).toEqual(solution);
    });
  }

  it("orders difficulties by clue count", () => {
    const easy = countClues(generatePuzzle("easy").puzzle);
    const expert = countClues(generatePuzzle("expert").puzzle);
    expect(easy).toBeGreaterThan(expert);
  });
});

describe("isSolved", () => {
  it("is false for an incomplete grid", () => {
    const { puzzle } = generatePuzzle("easy");
    expect(isSolved(puzzle)).toBe(false);
  });
});
