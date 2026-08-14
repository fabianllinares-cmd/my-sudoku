import type { Digit } from "./types";

/** Bits 0–8 represent digits 1–9. */
export const ALL_CANDIDATES = 0x1ff;

export function digitBit(digit: number): number {
  return digit === 0 ? 0 : 1 << (digit - 1);
}

export function bitCount(mask: number): number {
  let n = 0;
  let bits = mask;
  while (bits) {
    bits &= bits - 1;
    n += 1;
  }
  return n;
}

export function singleDigit(mask: number): Digit {
  if (mask === 0 || (mask & (mask - 1)) !== 0) return 0;
  let digit = 1 as Digit;
  let bits = mask;
  while (bits > 1) {
    bits >>= 1;
    digit = (digit + 1) as Digit;
  }
  return digit;
}

export function digitsFromMask(mask: number): Digit[] {
  const digits: Digit[] = [];
  for (let digit = 1; digit <= 9; digit += 1) {
    if (mask & (1 << (digit - 1))) digits.push(digit as Digit);
  }
  return digits;
}

export function firstDigit(mask: number): Digit {
  for (let digit = 1; digit <= 9; digit += 1) {
    if (mask & (1 << (digit - 1))) return digit as Digit;
  }
  return 0;
}

export function hasDigit(mask: number, digit: number): boolean {
  return (mask & digitBit(digit)) !== 0;
}

export function toggleDigit(mask: number, digit: number): number {
  return mask ^ digitBit(digit);
}
