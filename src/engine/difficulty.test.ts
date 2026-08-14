import { describe, expect, it } from "vitest";
import { DIFFICULTY_TARGETS, matchesDifficulty, ratePuzzle } from "./difficulty";
import { generatePuzzleWithSeed } from "./generator";
import { hasUniqueSolution, solve } from "./solver";
import { solvableWithSingles } from "./techniques";
import { countClues, parseGrid } from "./board";

const EASY = parseGrid(`
53..7....
6..195...
.98....6.
8...6...3
4..8.3..1
7...2...6
.6....28.
...419..5
....8..79
`);

describe("difficulty rating", () => {
  it("reports no stall and no search work for a singles-only puzzle", () => {
    const rating = ratePuzzle(EASY);
    expect(rating.singlesOnly).toBe(true);
    expect(rating.singlesStall).toBe(0);
    expect(rating.searchNodes).toBe(1);
    // 30 clues, so it classifies as medium rather than easy.
    expect(rating.clueCount).toBe(30);
    expect(rating.level).toBe("medium");
  });

  it("keeps the requested level when one is supplied", () => {
    expect(ratePuzzle(EASY, "hard").level).toBe("hard");
  });
});

describe("extreme generation", () => {
  const seeds = [11, 202, 3003];

  it("produces puzzles with exactly one solution", () => {
    for (const seed of seeds) {
      const generated = generatePuzzleWithSeed("extreme", seed);
      expect(hasUniqueSolution(generated.puzzle)).toBe(true);
      expect(solve(generated.puzzle)).toEqual(generated.solution);
      expect(generated.rating.level).toBe("extreme");
    }
  });

  it("requires deduction beyond singles", () => {
    for (const seed of seeds) {
      const generated = generatePuzzleWithSeed("extreme", seed);
      expect(solvableWithSingles(generated.puzzle)).toBe(false);
      expect(generated.rating.singlesOnly).toBe(false);
    }
  });

  it("meets the extreme gates rather than only removing more clues", () => {
    const target = DIFFICULTY_TARGETS.extreme;
    for (const seed of seeds) {
      const { puzzle, rating } = generatePuzzleWithSeed("extreme", seed);
      expect(matchesDifficulty(rating, "extreme")).toBe(true);
      expect(rating.singlesStall).toBeGreaterThanOrEqual(target.minSinglesStall);
      expect(rating.searchNodes).toBeGreaterThanOrEqual(target.minSearchNodes);
      expect(countClues(puzzle)).toBeGreaterThanOrEqual(target.minClues);
      expect(countClues(puzzle)).toBeLessThanOrEqual(target.maxClues);
    }
  });

  it("is harder than hard on average", () => {
    const measure = (level: "hard" | "extreme") => {
      const ratings = seeds.map((seed) => generatePuzzleWithSeed(level, seed).rating);
      return {
        stall: ratings.reduce((sum, r) => sum + r.singlesStall, 0) / ratings.length,
        nodes: ratings.reduce((sum, r) => sum + r.searchNodes, 0) / ratings.length,
      };
    };
    const hard = measure("hard");
    const extreme = measure("extreme");

    expect(extreme.stall).toBeGreaterThan(hard.stall);
    expect(extreme.nodes).toBeGreaterThanOrEqual(hard.nodes);
  });

  it("keeps easy and medium unchanged by the extreme gates", () => {
    expect(DIFFICULTY_TARGETS.easy.minSinglesStall).toBe(0);
    expect(DIFFICULTY_TARGETS.easy.minSearchNodes).toBe(0);
    expect(DIFFICULTY_TARGETS.medium.minSinglesStall).toBe(0);
    expect(DIFFICULTY_TARGETS.hard.minSearchNodes).toBe(0);

    const easy = generatePuzzleWithSeed("easy", 7);
    expect(easy.rating.singlesOnly).toBe(true);
    expect(hasUniqueSolution(easy.puzzle)).toBe(true);
  });
});
