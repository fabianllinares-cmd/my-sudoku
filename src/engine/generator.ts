import { cloneGrid, countClues, emptyGrid } from "./board";
import { hardnessScore, matchesDifficulty, ratePuzzle, DIFFICULTY_TARGETS } from "./difficulty";
import { mulberry32, shuffle } from "./rng";
import { countSolutions, hasUniqueSolution, solveRandomized } from "./solver";
import { solvableWithSingles } from "./techniques";
import type { Difficulty, Digit, GeneratedPuzzle, Grid } from "./types";
import { CELL_COUNT } from "./types";

function seedDiagonal(random: () => number): Grid {
  const grid = emptyGrid();
  const digits: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let band = 0; band < 3; band += 1) {
    const shuffled = shuffle(digits, random);
    let index = 0;
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        grid[(band * 3 + row) * 9 + (band * 3 + col)] = shuffled[index]!;
        index += 1;
      }
    }
  }
  return grid;
}

export function generateCompletedGrid(random: () => number = Math.random): Grid {
  const seeded = seedDiagonal(random);
  const solved = solveRandomized(seeded, random);
  if (!solved) {
    throw new Error("Failed to generate a completed Sudoku grid");
  }
  return solved;
}

function carvePuzzle(solution: Grid, difficulty: Difficulty, random: () => number): Grid {
  const target = DIFFICULTY_TARGETS[difficulty];
  const puzzle = cloneGrid(solution);
  const order = shuffle(
    Array.from({ length: CELL_COUNT }, (_, cell) => cell),
    random,
  );

  for (const cell of order) {
    const clues = countClues(puzzle);
    if (clues <= target.minClues) break;
    const saved = puzzle[cell]!;
    puzzle[cell] = 0;
    if (countSolutions(puzzle, 2) !== 1) {
      puzzle[cell] = saved;
      continue;
    }
    if (target.requireSingles && !solvableWithSingles(puzzle)) {
      puzzle[cell] = saved;
    }
  }

  if (target.forbidSingles && solvableWithSingles(puzzle)) {
    for (const cell of order) {
      if (puzzle[cell] === 0) continue;
      if (countClues(puzzle) <= target.minClues && !solvableWithSingles(puzzle)) break;
      const saved = puzzle[cell]!;
      puzzle[cell] = 0;
      if (countSolutions(puzzle, 2) !== 1) {
        puzzle[cell] = saved;
        continue;
      }
      if (countClues(puzzle) <= target.minClues && !solvableWithSingles(puzzle)) break;
    }
  }

  return puzzle;
}

/**
 * Levels gated on solving difficulty keep the hardest sample seen so far, so a
 * fallback puzzle is still meaningfully harder than the level below it.
 */
function preferCandidate(
  candidate: GeneratedPuzzle,
  incumbent: GeneratedPuzzle | null,
  gated: boolean,
): boolean {
  if (!incumbent) return true;
  if (!gated) return true;
  return hardnessScore(candidate.rating) > hardnessScore(incumbent.rating);
}

export function generatePuzzle(
  difficulty: Difficulty,
  random: () => number = Math.random,
): GeneratedPuzzle {
  const target = DIFFICULTY_TARGETS[difficulty];
  const gated = target.minSinglesStall > 0 || target.minSearchNodes > 0;
  let best: GeneratedPuzzle | null = null;

  for (let attempt = 0; attempt < target.attempts; attempt += 1) {
    const solution = generateCompletedGrid(random);
    const puzzle = carvePuzzle(solution, difficulty, random);
    const rating = ratePuzzle(puzzle, difficulty);
    const candidate: GeneratedPuzzle = { puzzle, solution, rating };

    if (matchesDifficulty(rating, difficulty) && hasUniqueSolution(puzzle)) {
      return candidate;
    }
    if (preferCandidate(candidate, best, gated)) {
      best = candidate;
    }
  }

  if (!best) {
    throw new Error("Puzzle generation failed");
  }
  return best;
}

export function generatePuzzleWithSeed(difficulty: Difficulty, seed: number): GeneratedPuzzle {
  return generatePuzzle(difficulty, mulberry32(seed));
}
