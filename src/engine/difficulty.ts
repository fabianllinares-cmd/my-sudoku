import { countClues } from "./board";
import { countSolutions } from "./solver";
import { hardestTechniqueUsed, solvableWithSingles, solveLogically } from "./techniques";
import type { Difficulty, DifficultyRating, Grid } from "./types";

export interface DifficultyTarget {
  level: Difficulty;
  minClues: number;
  maxClues: number;
  requireSingles: boolean;
  forbidSingles: boolean;
}

export const DIFFICULTY_TARGETS: Record<Difficulty, DifficultyTarget> = {
  easy: {
    level: "easy",
    minClues: 36,
    maxClues: 46,
    requireSingles: true,
    forbidSingles: false,
  },
  medium: {
    level: "medium",
    minClues: 30,
    maxClues: 35,
    requireSingles: false,
    forbidSingles: false,
  },
  hard: {
    level: "hard",
    minClues: 22,
    maxClues: 28,
    requireSingles: false,
    forbidSingles: true,
  },
};

export function ratePuzzle(puzzle: Grid, requested?: Difficulty): DifficultyRating {
  const clueCount = countClues(puzzle);
  const logical = solveLogically(puzzle);
  const singlesOnly = solvableWithSingles(puzzle);
  const stats = { nodes: 0 };
  countSolutions(puzzle, 1, stats);

  let level: Difficulty;
  if (singlesOnly && clueCount >= 34) level = "easy";
  else if (clueCount >= 30) level = "medium";
  else level = "hard";

  return {
    level: requested ?? level,
    clueCount,
    singlesOnly,
    searchNodes: stats.nodes,
    hardestTechnique: logical.solved ? hardestTechniqueUsed(logical.steps) : "hidden-single",
  };
}

export function matchesDifficulty(rating: DifficultyRating, difficulty: Difficulty): boolean {
  const target = DIFFICULTY_TARGETS[difficulty];
  if (rating.clueCount < target.minClues || rating.clueCount > target.maxClues) return false;
  if (target.requireSingles && !rating.singlesOnly) return false;
  if (target.forbidSingles && rating.singlesOnly) return false;
  return true;
}
