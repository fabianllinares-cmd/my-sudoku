import { boxOf, colOf, digitsFromMask, rowOf } from "../engine";
import type { Grid } from "../engine";

interface BoardProps {
  puzzle: Grid;
  grid: Grid;
  notes: number[];
  solution: Grid;
  selected: number | null;
  conflicts: boolean[];
  disabled: boolean;
  onSelect: (cell: number) => void;
}

export function Board({
  puzzle,
  grid,
  notes,
  solution,
  selected,
  conflicts,
  disabled,
  onSelect,
}: BoardProps) {
  const selectedDigit = selected !== null ? grid[selected]! : 0;

  return (
    <div className="board" role="grid" aria-label="Sudoku board">
      {grid.map((value, cell) => {
        const clue = puzzle[cell] !== 0;
        const selectedCell = selected === cell;
        const inRow = selected !== null && rowOf(cell) === rowOf(selected);
        const inCol = selected !== null && colOf(cell) === colOf(selected);
        const inBox = selected !== null && boxOf(cell) === boxOf(selected);
        const sameNumber = selectedDigit !== 0 && value === selectedDigit;
        const mistake = value !== 0 && value !== solution[cell];
        const conflict = conflicts[cell];
        const col = colOf(cell);
        const row = rowOf(cell);
        const classes = [
          "cell",
          clue ? "clue" : "player",
          selectedCell ? "selected" : "",
          inRow || inCol || inBox ? "peer" : "",
          sameNumber ? "same" : "",
          mistake || conflict ? "conflict" : "",
          col === 2 || col === 5 ? "box-right" : "",
          row === 2 || row === 5 ? "box-bottom" : "",
        ]
          .filter(Boolean)
          .join(" ");

        const candidates = value === 0 ? digitsFromMask(notes[cell]!) : [];

        return (
          <button
            key={cell}
            type="button"
            role="gridcell"
            aria-selected={selectedCell}
            aria-label={`Row ${row + 1} column ${col + 1}${value ? `, ${value}` : ""}${clue ? ", clue" : ""}`}
            className={classes}
            disabled={disabled}
            onClick={() => onSelect(cell)}
          >
            {value !== 0 ? (
              <span className="digit">{value}</span>
            ) : (
              <span className="notes" aria-hidden={candidates.length === 0}>
                {([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map((digit) => (
                  <span key={digit} className={candidates.includes(digit) ? "note on" : "note"}>
                    {candidates.includes(digit) ? digit : ""}
                  </span>
                ))}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
