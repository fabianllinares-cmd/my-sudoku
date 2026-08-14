import { EMPTY, SIZE } from "../sudoku/engine";
import type { Grid } from "../sudoku/engine";

interface NumberPadProps {
  board: Grid;
  onNumber: (value: number) => void;
  disabled: boolean;
}

/** Count how many of each digit are already placed (1-9 each appears 9x). */
function digitCounts(board: Grid): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const row of board) {
    for (const value of row) {
      if (value !== EMPTY) counts[value] = (counts[value] ?? 0) + 1;
    }
  }
  return counts;
}

export function NumberPad({ board, onNumber, disabled }: NumberPadProps) {
  const counts = board.length ? digitCounts(board) : {};

  return (
    <div className="numberpad" role="group" aria-label="Number pad">
      {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => {
        const remaining = SIZE - (counts[n] ?? 0);
        const exhausted = remaining <= 0;
        return (
          <button
            key={n}
            type="button"
            className="numberpad__key"
            onClick={() => onNumber(n)}
            disabled={disabled || exhausted}
            aria-label={`Enter ${n}`}
          >
            <span className="numberpad__digit">{n}</span>
            <span className="numberpad__remaining">{remaining}</span>
          </button>
        );
      })}
    </div>
  );
}
