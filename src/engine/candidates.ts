import { ALL_CANDIDATES, digitBit, digitsFromMask } from "./bits";
import type { Digit, Grid } from "./types";
import { CELL_COUNT } from "./types";
import { boxOf, colOf, rowOf } from "./units";

/**
 * Calculate valid candidates for every cell from the current board using
 * row, column, and 3x3-box constraints. Filled cells have mask 0.
 */
export function calculateCandidateMasks(grid: Grid): number[] {
  const rowUsed = new Array<number>(9).fill(0);
  const colUsed = new Array<number>(9).fill(0);
  const boxUsed = new Array<number>(9).fill(0);

  for (let cell = 0; cell < CELL_COUNT; cell += 1) {
    const value = grid[cell]!;
    if (!value) continue;
    const bit = digitBit(value);
    rowUsed[rowOf(cell)] |= bit;
    colUsed[colOf(cell)] |= bit;
    boxUsed[boxOf(cell)] |= bit;
  }

  const masks = new Array<number>(CELL_COUNT);
  for (let cell = 0; cell < CELL_COUNT; cell += 1) {
    if (grid[cell]) {
      masks[cell] = 0;
    } else {
      masks[cell] =
        ALL_CANDIDATES &
        ~rowUsed[rowOf(cell)]! &
        ~colUsed[colOf(cell)]! &
        ~boxUsed[boxOf(cell)]!;
    }
  }
  return masks;
}

export function calculateCandidates(grid: Grid): Digit[][] {
  return calculateCandidateMasks(grid).map(digitsFromMask);
}

/** Recalculate all candidates after a board change when Auto Pencil is on. */
export function syncAutoPencilNotes(grid: Grid): number[] {
  return calculateCandidateMasks(grid);
}

export function notesAfterManualPlace(notes: number[], cell: number): number[] {
  const next = notes.slice();
  next[cell] = 0;
  return next;
}
