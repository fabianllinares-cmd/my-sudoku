import { describe, expect, it } from "vitest";
import { generateCompletedGrid, generatePuzzleWithSeed } from "./generator";
import { hasUniqueSolution, solve } from "./solver";
import { isFilledValidSudoku, isPuzzleComplete, isValidPartialGrid } from "./validator";
import { countClues } from "./board";
import { mulberry32 } from "./rng";
import { DIFFICULTY_TARGETS } from "./difficulty";
import type { Difficulty } from "./types";

describe("completed grid generator", () => {
  it("generates valid completed grids", () => {
    const random = mulberry32(42);
    for (let i = 0; i < 3; i += 1) {
      const grid = generateCompletedGrid(random);
      expect(isFilledValidSudoku(grid)).toBe(true);
      expect(hasUniqueSolution(grid)).toBe(true);
    }
  });
});

describe("puzzle generator", () => {
  const difficulties: Difficulty[] = ["easy", "medium", "hard", "extreme"];

  it("generates unique puzzles for each difficulty", () => {
    for (const difficulty of difficulties) {
      const generated = generatePuzzleWithSeed(difficulty, 1000 + difficulty.length);
      expect(hasUniqueSolution(generated.puzzle)).toBe(true);
      expect(isValidPartialGrid(generated.puzzle)).toBe(true);
      expect(isFilledValidSudoku(generated.solution)).toBe(true);
      expect(isPuzzleComplete(generated.solution, generated.solution)).toBe(true);
      const solved = solve(generated.puzzle);
      expect(solved).not.toBeNull();
      expect(solved).toEqual(generated.solution);
      expect(countClues(generated.puzzle)).toBeGreaterThanOrEqual(DIFFICULTY_TARGETS[difficulty].minClues - 2);
      expect(generated.rating.level).toBe(difficulty);
    }
  });
});
