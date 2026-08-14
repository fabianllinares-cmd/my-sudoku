import { countClues } from "./board";
import { countSolutions } from "./solver";
import { hardestTechniqueUsed, solveLogically } from "./techniques";
import type { Difficulty, DifficultyRating, Grid } from "./types";

export interface DifficultyTarget {
  level: Difficulty;
  minClues: number;
  maxClues: number;
  requireSingles: boolean;
  forbidSingles: boolean;
  /**
   * Minimum cells left unsolved when the logical technique pipeline stalls.
   * This measures how much deduction beyond the implemented techniques the
   * puzzle demands, and tightens automatically as techniques are added.
   */
  minSinglesStall: number;
  /**
   * Minimum backtracking work the search solver needs after constraint
   * propagation. Puzzles solved by propagation alone score 1.
   */
  minSearchNodes: number;
  /** Carve attempts to sample; the hardest sample wins for gated levels. */
  attempts: number;
}

export const DIFFICULTY_TARGETS: Record<Difficulty, DifficultyTarget> = {
  easy: {
    level: "easy",
    minClues: 36,
    maxClues: 46,
    requireSingles: true,
    forbidSingles: false,
    minSinglesStall: 0,
    minSearchNodes: 0,
    attempts: 12,
  },
  medium: {
    level: "medium",
    minClues: 30,
    maxClues: 35,
    requireSingles: false,
    forbidSingles: false,
    minSinglesStall: 0,
    minSearchNodes: 0,
    attempts: 12,
  },
  hard: {
    level: "hard",
    minClues: 22,
    maxClues: 28,
    requireSingles: false,
    forbidSingles: true,
    minSinglesStall: 0,
    minSearchNodes: 0,
    attempts: 12,
  },
  extreme: {
    level: "extreme",
    minClues: 21,
    maxClues: 26,
    requireSingles: false,
    forbidSingles: true,
    minSinglesStall: 45,
    minSearchNodes: 4,
    attempts: 32,
  },
};

/** Backtracking work the search solver needs to reach the first solution. */
export function searchComplexity(puzzle: Grid): number {
  const stats = { nodes: 0 };
  countSolutions(puzzle, 1, stats);
  return stats.nodes;
}

export function ratePuzzle(puzzle: Grid, requested?: Difficulty): DifficultyRating {
  const clueCount = countClues(puzzle);
  const logical = solveLogically(puzzle);
  const singlesStall = logical.grid.filter((value) => value === 0).length;
  const singlesOnly = logical.solved;
  const searchNodes = searchComplexity(puzzle);
  const extreme = DIFFICULTY_TARGETS.extreme;

  let level: Difficulty;
  if (singlesStall >= extreme.minSinglesStall && searchNodes >= extreme.minSearchNodes) {
    level = "extreme";
  } else if (singlesOnly && clueCount >= 34) {
    level = "easy";
  } else if (clueCount >= 30) {
    level = "medium";
  } else {
    level = "hard";
  }

  return {
    level: requested ?? level,
    clueCount,
    singlesOnly,
    singlesStall,
    searchNodes,
    hardestTechnique: logical.solved ? hardestTechniqueUsed(logical.steps) : "hidden-single",
  };
}

export function matchesDifficulty(rating: DifficultyRating, difficulty: Difficulty): boolean {
  const target = DIFFICULTY_TARGETS[difficulty];
  if (rating.clueCount < target.minClues || rating.clueCount > target.maxClues) return false;
  if (target.requireSingles && !rating.singlesOnly) return false;
  if (target.forbidSingles && rating.singlesOnly) return false;
  if (rating.singlesStall < target.minSinglesStall) return false;
  if (rating.searchNodes < target.minSearchNodes) return false;
  return true;
}

/** Ordering used to compare how demanding two puzzles are. */
export function hardnessScore(rating: DifficultyRating): number {
  return rating.singlesStall * 10 + rating.searchNodes;
}
