import { digitBit } from "../bits";
import { calculateCandidateMasks } from "../candidates";
import { cloneGrid } from "../board";
import type {
  Grid,
  LogicalSolveResult,
  TechniqueContext,
  TechniqueFn,
  TechniqueName,
  TechniqueStep,
} from "../types";
import { findHiddenSingles, findNakedSingles } from "./singles";

/**
 * Ordered human-style technique pipeline.
 * Add naked/hidden pairs, locked candidates, fish, and wings here later.
 * Each technique reads bitmask candidates and returns placements/eliminations.
 */
export const TECHNIQUE_PIPELINE: { name: TechniqueName; apply: TechniqueFn }[] = [
  { name: "naked-single", apply: findNakedSingles },
  { name: "hidden-single", apply: findHiddenSingles },
  // Future:
  // { name: "naked-pair", apply: findNakedPairs },
  // { name: "hidden-pair", apply: findHiddenPairs },
  // { name: "locked-candidate", apply: findLockedCandidates },
  // { name: "naked-triple", apply: findNakedTriples },
  // { name: "hidden-triple", apply: findHiddenTriples },
  // { name: "x-wing", apply: findXWing },
  // { name: "swordfish", apply: findSwordfish },
  // { name: "xy-wing", apply: findXyWing },
];

export const SINGLES_TECHNIQUES: TechniqueName[] = ["naked-single", "hidden-single"];

function applyStep(ctx: TechniqueContext, step: TechniqueStep): void {
  for (const placement of step.placements) {
    ctx.grid[placement.cell] = placement.digit;
  }
  for (const elimination of step.eliminations) {
    ctx.candidates[elimination.cell]! &= ~digitBit(elimination.digit);
  }
  ctx.candidates = calculateCandidateMasks(ctx.grid);
}

export function solveLogically(
  grid: Grid,
  allowed: TechniqueName[] = SINGLES_TECHNIQUES,
): LogicalSolveResult {
  const ctx: TechniqueContext = {
    grid: cloneGrid(grid),
    candidates: calculateCandidateMasks(grid),
  };
  const steps: TechniqueStep[] = [];
  const pipeline = TECHNIQUE_PIPELINE.filter((technique) => allowed.includes(technique.name));

  while (true) {
    if (ctx.grid.every((value) => value !== 0)) {
      return { solved: true, steps, grid: ctx.grid };
    }
    let step: TechniqueStep | null = null;
    for (const technique of pipeline) {
      step = technique.apply(ctx);
      if (step) break;
    }
    if (!step) {
      return { solved: false, steps, grid: ctx.grid };
    }
    applyStep(ctx, step);
    steps.push(step);
  }
}

export function solvableWithSingles(grid: Grid): boolean {
  return solveLogically(grid, SINGLES_TECHNIQUES).solved;
}

export function hardestTechniqueUsed(steps: TechniqueStep[]): TechniqueName {
  const order: TechniqueName[] = TECHNIQUE_PIPELINE.map((technique) => technique.name);
  let hardest: TechniqueName = "naked-single";
  for (const step of steps) {
    if (order.indexOf(step.technique) > order.indexOf(hardest)) {
      hardest = step.technique;
    }
  }
  return hardest;
}
