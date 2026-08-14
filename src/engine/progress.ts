import type { Digit, Grid } from "./types";
import { CELL_COUNT, SIZE } from "./types";

export interface DigitProgress {
  digit: Digit;
  /** Correctly placed instances: original clues plus correct player entries. */
  placed: number;
  /** Instances still missing from the board. */
  remaining: number;
  completed: boolean;
}

/**
 * Count how many of each digit are correctly placed. A value that disagrees
 * with the solution never counts, so a wrong entry cannot complete a digit.
 */
export function digitProgress(grid: Grid, solution: Grid): DigitProgress[] {
  const placed = new Array<number>(SIZE + 1).fill(0);

  for (let cell = 0; cell < CELL_COUNT; cell += 1) {
    const value = grid[cell]!;
    if (value !== 0 && value === solution[cell]) {
      placed[value] += 1;
    }
  }

  return Array.from({ length: SIZE }, (_, index) => {
    const digit = (index + 1) as Digit;
    const count = placed[digit]!;
    return {
      digit,
      placed: count,
      remaining: SIZE - count,
      completed: count === SIZE,
    };
  });
}

/** Remaining count per digit, indexed 0-8 for digits 1-9. */
export function remainingDigitCounts(grid: Grid, solution: Grid): number[] {
  return digitProgress(grid, solution).map((entry) => entry.remaining);
}
