import { describe, expect, it } from "vitest";
import { parseGrid, serializeGrid } from "./board";
import { countSolutions, hasUniqueSolution, solve } from "./solver";
import { isFilledValidSudoku, isPuzzleComplete } from "./validator";

/** Peter Norvig's well-known easy example. */
const NORVIG_EASY = "003020600900305001001806400008102900700000008006708200002609500800203009005010300";
const NORVIG_EASY_SOLUTION = "483921657967345821251876493548132976729564138136798245372689514814253769695417382";

const WIKIPEDIA_EASY = `
53..7....
6..195...
.98....6.
8...6...3
4..8.3..1
7...2...6
.6....28.
...419..5
....8..79
`;

const WIKIPEDIA_EASY_SOLUTION = `
534678912
672195348
198342567
859761423
426853791
713924856
961537284
287419635
345286179
`;

describe("solver", () => {
  it("solves a known easy puzzle (Norvig)", () => {
    const puzzle = parseGrid(NORVIG_EASY);
    const expected = parseGrid(NORVIG_EASY_SOLUTION);
    const solved = solve(puzzle);
    expect(solved).not.toBeNull();
    expect(serializeGrid(solved!)).toBe(serializeGrid(expected));
    expect(isFilledValidSudoku(solved!)).toBe(true);
    expect(isPuzzleComplete(solved!, expected)).toBe(true);
  });

  it("solves a known Wikipedia puzzle", () => {
    const puzzle = parseGrid(WIKIPEDIA_EASY);
    const expected = parseGrid(WIKIPEDIA_EASY_SOLUTION);
    const solved = solve(puzzle);
    expect(serializeGrid(solved!)).toBe(serializeGrid(expected));
  });

  it("reports a unique solution for known puzzles", () => {
    expect(hasUniqueSolution(parseGrid(WIKIPEDIA_EASY))).toBe(true);
    expect(countSolutions(parseGrid(WIKIPEDIA_EASY), 2)).toBe(1);
  });

  it("returns null for a contradictory puzzle", () => {
    const puzzle = parseGrid(WIKIPEDIA_EASY);
    puzzle[0] = 6;
    expect(solve(puzzle)).toBeNull();
    expect(countSolutions(puzzle, 2)).toBe(0);
  });
});
