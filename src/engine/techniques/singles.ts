import { UNITS } from "../units";
import { digitBit, singleDigit } from "../bits";
import type { Digit } from "../types";
import type { TechniqueContext, TechniqueStep } from "../types";
import { CELL_COUNT } from "../types";

export function findNakedSingles(ctx: TechniqueContext): TechniqueStep | null {
  const placements: TechniqueStep["placements"] = [];
  for (let cell = 0; cell < CELL_COUNT; cell += 1) {
    if (ctx.grid[cell] !== 0) continue;
    const digit = singleDigit(ctx.candidates[cell]!);
    if (digit) {
      placements.push({ cell, digit, technique: "naked-single" });
    }
  }
  if (placements.length === 0) return null;
  return { technique: "naked-single", placements, eliminations: [] };
}

export function findHiddenSingles(ctx: TechniqueContext): TechniqueStep | null {
  const placements: TechniqueStep["placements"] = [];
  const seen = new Set<number>();

  for (const unit of UNITS) {
    for (let digit = 1; digit <= 9; digit += 1) {
      const bit = digitBit(digit);
      let found = -1;
      let count = 0;
      let placed = false;
      for (const cell of unit) {
        if (ctx.grid[cell] === digit) {
          placed = true;
          break;
        }
        if (ctx.grid[cell] === 0 && (ctx.candidates[cell]! & bit) !== 0) {
          count += 1;
          found = cell;
        }
      }
      if (placed || count !== 1 || seen.has(found)) continue;
      if (singleDigit(ctx.candidates[found]!) === digit) continue;
      seen.add(found);
      placements.push({
        cell: found,
        digit: digit as Digit,
        technique: "hidden-single",
      });
    }
  }

  if (placements.length === 0) return null;
  return { technique: "hidden-single", placements, eliminations: [] };
}
