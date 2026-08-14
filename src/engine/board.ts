import type { Digit, Grid } from "./types";
import { CELL_COUNT } from "./types";

export function emptyGrid(): Grid {
  return Array.from({ length: CELL_COUNT }, () => 0);
}

export function cloneGrid(grid: Grid): Grid {
  return grid.slice() as Grid;
}

export function countClues(grid: Grid): number {
  let count = 0;
  for (const value of grid) {
    if (value !== 0) count += 1;
  }
  return count;
}

export function parseGrid(source: string): Grid {
  const chars = source.replace(/[^0-9.]/g, "");
  if (chars.length !== CELL_COUNT) {
    throw new Error(`Expected 81 cells, received ${chars.length}`);
  }
  return chars.split("").map((char) => (char === "." ? 0 : (Number(char) as Digit)));
}

export function serializeGrid(grid: Grid): string {
  return grid.map((value) => (value === 0 ? "." : String(value))).join("");
}

export function sameGrid(a: Grid, b: Grid): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function emptyNotes(): number[] {
  return Array.from({ length: CELL_COUNT }, () => 0);
}
