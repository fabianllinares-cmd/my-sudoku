import { describe, expect, it } from "vitest";
import { parseGrid } from "./board";
import { solvableWithSingles, solveLogically } from "./techniques";

const SINGLES_PUZZLE = parseGrid(`
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

describe("logical techniques", () => {
  it("solves a singles-friendly puzzle with naked and hidden singles", () => {
    const result = solveLogically(SINGLES_PUZZLE);
    expect(result.solved).toBe(true);
    expect(solvableWithSingles(SINGLES_PUZZLE)).toBe(true);
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.steps.every((step) => step.technique === "naked-single" || step.technique === "hidden-single")).toBe(
      true,
    );
  });
});
