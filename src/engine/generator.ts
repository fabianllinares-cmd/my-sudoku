import { cloneGrid, countClues, emptyGrid } from "./board";
import { matchesDifficulty, ratePuzzle, DIFFICULTY_TARGETS } from "./difficulty";
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

export function generatePuzzle(
  difficulty: Difficulty,
  random: () => number = Math.random,
): GeneratedPuzzle {
  let last: GeneratedPuzzle | null = null;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const solution = generateCompletedGrid(random);
    const puzzle = carvePuzzle(solution, difficulty, random);
    const rating = ratePuzzle(puzzle, difficulty);
    last = { puzzle, solution, rating };
    if (matchesDifficulty(rating, difficulty) && hasUniqueSolution(puzzle)) {
      return last;
    }
  }
  if (!last) {
    throw new Error("Puzzle generation failed");
  }
  return last;
}

export function generatePuzzleWithSeed(difficulty: Difficulty, seed: number): GeneratedPuzzle {
  return generatePuzzle(difficulty, mulberry32(seed));
}
