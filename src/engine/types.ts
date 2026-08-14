export const SIZE = 9;
export const BOX = 3;
export const CELL_COUNT = 81;

export type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type Grid = Digit[];

export type Difficulty = "easy" | "medium" | "hard";

/**
 * Human-style techniques. V1 uses singles for rating and logical solving.
 * Later versions can add the remaining techniques to TECHNIQUE_PIPELINE
 * without changing the candidate bitmask representation.
 */
export type TechniqueName =
  | "naked-single"
  | "hidden-single"
  | "naked-pair"
  | "hidden-pair"
  | "locked-candidate"
  | "naked-triple"
  | "hidden-triple"
  | "x-wing"
  | "swordfish"
  | "xy-wing";

export interface DifficultyRating {
  /** Requested or classified level. */
  level: Difficulty;
  clueCount: number;
  /** True when the puzzle can be finished with naked + hidden singles. */
  singlesOnly: boolean;
  /** Backtracking nodes visited by the search solver. */
  searchNodes: number;
  /** Hardest technique required. Expand as techniques are added. */
  hardestTechnique: TechniqueName;
}

export interface GeneratedPuzzle {
  puzzle: Grid;
  solution: Grid;
  rating: DifficultyRating;
}

export interface Placement {
  cell: number;
  digit: Digit;
  technique: TechniqueName;
}

export interface Elimination {
  cell: number;
  digit: Digit;
  technique: TechniqueName;
}

export interface TechniqueStep {
  technique: TechniqueName;
  placements: Placement[];
  eliminations: Elimination[];
}

export interface TechniqueContext {
  grid: Grid;
  /** 81 candidate bitmasks. Bit 0 = digit 1, bit 8 = digit 9. */
  candidates: number[];
}

export type TechniqueFn = (ctx: TechniqueContext) => TechniqueStep | null;

export interface LogicalSolveResult {
  solved: boolean;
  steps: TechniqueStep[];
  grid: Grid;
}
