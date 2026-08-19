import { digitBit } from "./bits";
import { calculateCandidateMasks } from "./candidates";
import type { Grid } from "./types";
import { CELL_COUNT } from "./types";
import { PEERS } from "./units";

/**
 * Player pencil notes are editable state, kept separate from the candidates the
 * board currently allows. These helpers are the only operations that connect the
 * two: Auto Pencil copies candidates into notes once, placing a digit prunes
 * peers, and validity is recomputed from the board rather than stored.
 */

/** Notes written when Auto Pencil is invoked: every legal candidate, once. */
export function autoPencilNotes(grid: Grid): number[] {
  return calculateCandidateMasks(grid);
}

/**
 * Drop one digit from the notes of every cell sharing a row, column or box with
 * `cell`. Every other note the player curated is left untouched.
 */
export function removeNoteFromPeers(notes: number[], cell: number, digit: number): number[] {
  const bit = digitBit(digit);
  const next = notes.slice();
  for (const peer of PEERS[cell]!) {
    next[peer]! &= ~bit;
  }
  return next;
}

/**
 * Notes the current board makes impossible, derived rather than stored so they
 * clear themselves as soon as the board changes.
 */
export function invalidNoteMasks(notes: number[], grid: Grid): number[] {
  const legal = calculateCandidateMasks(grid);
  const invalid = new Array<number>(CELL_COUNT);
  for (let cell = 0; cell < CELL_COUNT; cell += 1) {
    invalid[cell] = grid[cell] !== 0 ? 0 : notes[cell]! & ~legal[cell]!;
  }
  return invalid;
}

export function hasInvalidNotes(notes: number[], grid: Grid): boolean {
  return invalidNoteMasks(notes, grid).some((mask) => mask !== 0);
}
