import { describe, expect, it } from "vitest";
import { parseGrid } from "./board";
import { calculateCandidateMasks } from "./candidates";
import { digitsFromMask, digitBit, hasDigit } from "./bits";
import { autoPencilNotes, hasInvalidNotes, invalidNoteMasks, removeNoteFromPeers } from "./notes";
import { boxOf, colOf, rowOf } from "./units";
import { emptyNotes } from "./board";

const PUZZLE = parseGrid(`
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

function peersOf(cell: number): number[] {
  const peers: number[] = [];
  for (let other = 0; other < 81; other += 1) {
    if (other === cell) continue;
    if (rowOf(other) === rowOf(cell) || colOf(other) === colOf(cell) || boxOf(other) === boxOf(cell)) {
      peers.push(other);
    }
  }
  return peers;
}

describe("autoPencilNotes", () => {
  it("fills every empty cell with the currently legal candidates", () => {
    const notes = autoPencilNotes(PUZZLE);
    expect(notes).toEqual(calculateCandidateMasks(PUZZLE));

    for (let cell = 0; cell < 81; cell += 1) {
      if (PUZZLE[cell] !== 0) {
        expect(notes[cell]).toBe(0);
        continue;
      }
      const candidates = digitsFromMask(notes[cell]!);
      expect(candidates.length).toBeGreaterThan(0);
      for (const peer of peersOf(cell)) {
        const value = PUZZLE[peer]!;
        if (value !== 0) expect(candidates).not.toContain(value);
      }
    }
  });
});

describe("removeNoteFromPeers", () => {
  it("clears the digit from row, column and box peers only", () => {
    const notes = autoPencilNotes(PUZZLE);
    const cell = 2;
    const digit = 4;
    const pruned = removeNoteFromPeers(notes, cell, digit);
    const peers = new Set(peersOf(cell));

    for (let other = 0; other < 81; other += 1) {
      if (peers.has(other)) {
        expect(hasDigit(pruned[other]!, digit)).toBe(false);
      } else {
        expect(pruned[other]).toBe(notes[other]);
      }
    }
  });

  it("leaves other digits in peer notes untouched", () => {
    const notes = autoPencilNotes(PUZZLE);
    const pruned = removeNoteFromPeers(notes, 2, 4);
    for (const peer of peersOf(2)) {
      expect(pruned[peer]).toBe(notes[peer]! & ~digitBit(4));
    }
  });

  it("does not mutate the input", () => {
    const notes = autoPencilNotes(PUZZLE);
    const copy = notes.slice();
    removeNoteFromPeers(notes, 2, 4);
    expect(notes).toEqual(copy);
  });
});

describe("invalidNoteMasks", () => {
  it("reports nothing for freshly generated candidates", () => {
    const notes = autoPencilNotes(PUZZLE);
    expect(invalidNoteMasks(notes, PUZZLE).every((mask) => mask === 0)).toBe(true);
    expect(hasInvalidNotes(notes, PUZZLE)).toBe(false);
  });

  it("flags a note the board already rules out", () => {
    const notes = emptyNotes();
    // Row 0 already holds a 5, so pencilling 5 into row 0 is impossible.
    notes[2] = digitBit(5);
    const invalid = invalidNoteMasks(notes, PUZZLE);

    expect(hasDigit(invalid[2]!, 5)).toBe(true);
    expect(hasInvalidNotes(notes, PUZZLE)).toBe(true);
  });

  it("is derived from the board, so it clears when the board changes", () => {
    const grid = PUZZLE.slice();
    const notes = emptyNotes();
    notes[2] = digitBit(4);
    expect(invalidNoteMasks(notes, grid)[2]).toBe(0);

    grid[8] = 4; // same row as cell 2
    expect(hasDigit(invalidNoteMasks(notes, grid)[2]!, 4)).toBe(true);

    grid[8] = 0;
    expect(invalidNoteMasks(notes, grid)[2]).toBe(0);
  });

  it("ignores notes on cells that already hold a number", () => {
    const grid = PUZZLE.slice();
    const notes = emptyNotes();
    notes[0] = digitBit(9);
    expect(invalidNoteMasks(notes, grid)[0]).toBe(0);
  });
});
