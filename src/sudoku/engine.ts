export type Grid = number[][];

export type Difficulty = "easy" | "medium" | "hard" | "expert";

export interface Puzzle {
  puzzle: Grid;
  solution: Grid;
  difficulty: Difficulty;
}

const SIZE = 9;
const BOX = 3;
const EMPTY = 0;

/** Number of cells to remove per difficulty (out of 81). */
const CLUES_REMOVED: Record<Difficulty, number> = {
  easy: 40,
  medium: 48,
  hard: 54,
  expert: 58,
};

function emptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array<number>(SIZE).fill(EMPTY));
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Whether `value` may be placed at (row, col) without breaking Sudoku rules. */
export function isValidPlacement(
  grid: Grid,
  row: number,
  col: number,
  value: number,
): boolean {
  for (let i = 0; i < SIZE; i++) {
    if (grid[row][i] === value && i !== col) return false;
    if (grid[i][col] === value && i !== row) return false;
  }
  const boxRow = Math.floor(row / BOX) * BOX;
  const boxCol = Math.floor(col / BOX) * BOX;
  for (let r = boxRow; r < boxRow + BOX; r++) {
    for (let c = boxCol; c < boxCol + BOX; c++) {
      if (grid[r][c] === value && !(r === row && c === col)) return false;
    }
  }
  return true;
}

/** Fill an empty grid with a valid, randomized complete solution. */
function fillGrid(grid: Grid): boolean {
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (grid[row][col] !== EMPTY) continue;
      for (const value of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
        if (isValidPlacement(grid, row, col, value)) {
          grid[row][col] = value;
          if (fillGrid(grid)) return true;
          grid[row][col] = EMPTY;
        }
      }
      return false;
    }
  }
  return true;
}

/**
 * Count solutions up to `limit`. Used to guarantee puzzles have a unique
 * solution while keeping the search cheap (stops early at the limit).
 */
function countSolutions(grid: Grid, limit = 2): number {
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (grid[row][col] !== EMPTY) continue;
      let count = 0;
      for (let value = 1; value <= SIZE; value++) {
        if (isValidPlacement(grid, row, col, value)) {
          grid[row][col] = value;
          count += countSolutions(grid, limit);
          grid[row][col] = EMPTY;
          if (count >= limit) return count;
        }
      }
      return count;
    }
  }
  return 1;
}

/** Solve a grid in place using backtracking. Returns false if unsolvable. */
export function solve(grid: Grid): boolean {
  return fillGrid(grid);
}

/** Generate a puzzle with a unique solution for the given difficulty. */
export function generatePuzzle(difficulty: Difficulty = "easy"): Puzzle {
  const solution = emptyGrid();
  fillGrid(solution);

  const puzzle = cloneGrid(solution);
  const target = CLUES_REMOVED[difficulty];
  let removed = 0;

  const positions = shuffle(
    Array.from({ length: SIZE * SIZE }, (_, i) => i),
  );

  for (const pos of positions) {
    if (removed >= target) break;
    const row = Math.floor(pos / SIZE);
    const col = pos % SIZE;
    if (puzzle[row][col] === EMPTY) continue;

    const backup = puzzle[row][col];
    puzzle[row][col] = EMPTY;

    if (countSolutions(cloneGrid(puzzle)) !== 1) {
      puzzle[row][col] = backup;
    } else {
      removed++;
    }
  }

  return { puzzle, solution, difficulty };
}

/** Coordinates of every cell that conflicts with another filled cell. */
export function findConflicts(grid: Grid): Set<string> {
  const conflicts = new Set<string>();
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const value = grid[row][col];
      if (value === EMPTY) continue;
      if (!isValidPlacement(grid, row, col, value)) {
        conflicts.add(`${row},${col}`);
      }
    }
  }
  return conflicts;
}

/** True when the grid is completely and correctly filled. */
export function isSolved(grid: Grid): boolean {
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const value = grid[row][col];
      if (value === EMPTY) return false;
      if (!isValidPlacement(grid, row, col, value)) return false;
    }
  }
  return true;
}

export { SIZE, BOX, EMPTY };
