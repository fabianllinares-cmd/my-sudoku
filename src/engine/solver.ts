import { ALL_CANDIDATES, bitCount, digitBit, digitsFromMask, singleDigit } from "./bits";
import type { Grid } from "./types";
import { CELL_COUNT } from "./types";
import { PEERS, UNITS } from "./units";
import { shuffle } from "./rng";

interface SolverState {
  values: Uint8Array;
  cands: Uint16Array;
}

export interface SolveStats {
  nodes: number;
}

function cloneState(state: SolverState): SolverState {
  return {
    values: state.values.slice(),
    cands: state.cands.slice(),
  };
}

function place(state: SolverState, cell: number, digit: number): boolean {
  const current = state.values[cell]!;
  if (current === digit) return true;
  if (current !== 0) return false;
  if ((state.cands[cell]! & digitBit(digit)) === 0) return false;

  state.values[cell] = digit;
  state.cands[cell] = digitBit(digit);

  for (const peer of PEERS[cell]!) {
    if (state.values[peer] === digit) return false;
    state.cands[peer] &= ~digitBit(digit);
    if (state.values[peer] === 0 && state.cands[peer] === 0) return false;
  }
  return true;
}

function propagate(state: SolverState): boolean {
  let changed = true;
  while (changed) {
    changed = false;

    for (let cell = 0; cell < CELL_COUNT; cell += 1) {
      if (state.values[cell] !== 0) continue;
      const mask = state.cands[cell]!;
      if (mask === 0) return false;
      const only = singleDigit(mask);
      if (only) {
        if (!place(state, cell, only)) return false;
        changed = true;
      }
    }

    for (const unit of UNITS) {
      for (let digit = 1; digit <= 9; digit += 1) {
        const bit = digitBit(digit);
        let found = -1;
        let count = 0;
        let alreadyPlaced = false;
        for (const cell of unit) {
          if (state.values[cell] === digit) {
            alreadyPlaced = true;
            break;
          }
          if (state.values[cell] === 0 && (state.cands[cell]! & bit) !== 0) {
            count += 1;
            found = cell;
          }
        }
        if (alreadyPlaced) continue;
        if (count === 0) return false;
        if (count === 1) {
          if (!place(state, found, digit)) return false;
          changed = true;
        }
      }
    }
  }
  return true;
}

function stateFromGrid(grid: Grid): SolverState | null {
  const state: SolverState = {
    values: new Uint8Array(CELL_COUNT),
    cands: new Uint16Array(CELL_COUNT),
  };
  state.cands.fill(ALL_CANDIDATES);

  for (let cell = 0; cell < CELL_COUNT; cell += 1) {
    const value = grid[cell]!;
    if (!value) continue;
    if (!place(state, cell, value)) return null;
  }
  if (!propagate(state)) return null;
  return state;
}

function search(
  state: SolverState,
  limit: number,
  solutions: Grid[],
  stats: SolveStats,
  random?: () => number,
): boolean {
  stats.nodes += 1;

  let best = -1;
  let bestCount = 10;
  for (let cell = 0; cell < CELL_COUNT; cell += 1) {
    if (state.values[cell] !== 0) continue;
    const count = bitCount(state.cands[cell]!);
    if (count < bestCount) {
      bestCount = count;
      best = cell;
      if (count <= 1) break;
    }
  }

  if (best === -1) {
    solutions.push(Array.from(state.values) as Grid);
    return solutions.length >= limit;
  }

  let digits = digitsFromMask(state.cands[best]!);
  if (random) digits = shuffle(digits, random);

  for (const digit of digits) {
    const next = cloneState(state);
    if (!place(next, best, digit)) continue;
    if (!propagate(next)) continue;
    if (search(next, limit, solutions, stats, random)) return true;
  }
  return false;
}

export function solve(grid: Grid): Grid | null {
  const solutions: Grid[] = [];
  const stats: SolveStats = { nodes: 0 };
  const state = stateFromGrid(grid);
  if (!state) return null;
  search(state, 1, solutions, stats);
  return solutions[0] ?? null;
}

export function countSolutions(
  grid: Grid,
  limit = 2,
  stats: SolveStats = { nodes: 0 },
): number {
  const solutions: Grid[] = [];
  const state = stateFromGrid(grid);
  if (!state) return 0;
  search(state, limit, solutions, stats);
  return solutions.length;
}

export function hasUniqueSolution(grid: Grid): boolean {
  return countSolutions(grid, 2) === 1;
}

export function solveRandomized(grid: Grid, random: () => number): Grid | null {
  const solutions: Grid[] = [];
  const stats: SolveStats = { nodes: 0 };
  const state = stateFromGrid(grid);
  if (!state) return null;
  search(state, 1, solutions, stats, random);
  return solutions[0] ?? null;
}

