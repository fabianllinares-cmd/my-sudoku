import { cloneGrid } from "./board";
import { UNITS } from "./units";
import type { Digit, Grid } from "./types";
import { CELL_COUNT } from "./types";

export function findPeerConflicts(grid: Grid): boolean[] {
  const conflict = Array.from({ length: CELL_COUNT }, () => false);
  for (const unit of UNITS) {
    const seen = new Map<Digit, number[]>();
    for (const cell of unit) {
      const value = grid[cell]!;
      if (!value) continue;
      const list = seen.get(value) ?? [];
      list.push(cell);
      seen.set(value, list);
    }
    for (const cells of seen.values()) {
      if (cells.length > 1) {
        for (const cell of cells) conflict[cell] = true;
      }
    }
  }
  return conflict;
}

export function hasPeerConflict(grid: Grid, cell: number, digit: Digit): boolean {
  if (!digit) return false;
  const next = cloneGrid(grid);
  next[cell] = digit;
  return findPeerConflicts(next)[cell] === true;
}

export function isCorrectPlacement(solution: Grid, cell: number, digit: Digit): boolean {
  return solution[cell] === digit;
}

export function isPuzzleComplete(grid: Grid, solution: Grid): boolean {
  for (let cell = 0; cell < CELL_COUNT; cell += 1) {
    if (grid[cell] === 0 || grid[cell] !== solution[cell]) return false;
  }
  return true;
}

export function isFilledValidSudoku(grid: Grid): boolean {
  for (const value of grid) {
    if (value < 1 || value > 9) return false;
  }
  return !findPeerConflicts(grid).some(Boolean);
}

export function isValidPartialGrid(grid: Grid): boolean {
  return !findPeerConflicts(grid).some(Boolean);
}
