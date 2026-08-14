import { CELL_COUNT, SIZE } from "./types";

export function rowOf(cell: number): number {
  return Math.floor(cell / SIZE);
}

export function colOf(cell: number): number {
  return cell % SIZE;
}

export function boxOf(cell: number): number {
  return Math.floor(rowOf(cell) / 3) * 3 + Math.floor(colOf(cell) / 3);
}

export function cellIndex(row: number, col: number): number {
  return row * SIZE + col;
}

function buildRows(): number[][] {
  return Array.from({ length: SIZE }, (_, row) =>
    Array.from({ length: SIZE }, (_, col) => cellIndex(row, col)),
  );
}

function buildCols(): number[][] {
  return Array.from({ length: SIZE }, (_, col) =>
    Array.from({ length: SIZE }, (_, row) => cellIndex(row, col)),
  );
}

function buildBoxes(): number[][] {
  return Array.from({ length: SIZE }, (_, box) => {
    const startRow = Math.floor(box / 3) * 3;
    const startCol = (box % 3) * 3;
    const cells: number[] = [];
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        cells.push(cellIndex(startRow + row, startCol + col));
      }
    }
    return cells;
  });
}

export const ROWS = buildRows();
export const COLS = buildCols();
export const BOXES = buildBoxes();
export const UNITS = [...ROWS, ...COLS, ...BOXES];

export const PEERS: number[][] = Array.from({ length: CELL_COUNT }, (_, cell) => {
  const peers = new Set<number>();
  for (const unit of UNITS) {
    if (unit.includes(cell)) {
      for (const other of unit) {
        if (other !== cell) peers.add(other);
      }
    }
  }
  return [...peers];
});

export const CELL_UNITS: number[][] = Array.from({ length: CELL_COUNT }, (_, cell) => {
  const indexes: number[] = [];
  UNITS.forEach((unit, index) => {
    if (unit.includes(cell)) indexes.push(index);
  });
  return indexes;
});
