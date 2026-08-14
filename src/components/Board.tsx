import { SIZE, EMPTY } from "../sudoku/engine";
import type { CellPosition } from "../hooks/useSudoku";
import type { Grid } from "../sudoku/engine";

interface BoardProps {
  board: Grid;
  givens: boolean[][];
  notes: number[][][];
  selected: CellPosition | null;
  conflicts: Set<string>;
  onSelect: (row: number, col: number) => void;
}

export function Board({
  board,
  givens,
  notes,
  selected,
  conflicts,
  onSelect,
}: BoardProps) {
  if (!board.length) return null;

  const selectedValue =
    selected && board[selected.row][selected.col] !== EMPTY
      ? board[selected.row][selected.col]
      : null;

  return (
    <div className="board" role="grid" aria-label="Sudoku board">
      {board.map((rowValues, row) =>
        rowValues.map((value, col) => {
          const isGiven = givens[row][col];
          const isSelected =
            selected?.row === row && selected?.col === col;
          const inScope =
            selected != null &&
            (selected.row === row ||
              selected.col === col ||
              (Math.floor(selected.row / 3) === Math.floor(row / 3) &&
                Math.floor(selected.col / 3) === Math.floor(col / 3)));
          const isConflict = conflicts.has(`${row},${col}`);
          const sameValue =
            selectedValue != null &&
            value === selectedValue &&
            value !== EMPTY;

          const classes = [
            "cell",
            isGiven ? "cell--given" : "cell--entry",
            isSelected ? "cell--selected" : "",
            inScope && !isSelected ? "cell--scope" : "",
            isConflict ? "cell--conflict" : "",
            sameValue && !isSelected ? "cell--match" : "",
            col % 3 === 2 && col !== SIZE - 1 ? "cell--border-right" : "",
            row % 3 === 2 && row !== SIZE - 1 ? "cell--border-bottom" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={`${row}-${col}`}
              type="button"
              className={classes}
              role="gridcell"
              aria-label={`Row ${row + 1}, column ${col + 1}${
                value !== EMPTY ? `, value ${value}` : ", empty"
              }`}
              aria-selected={isSelected}
              onClick={() => onSelect(row, col)}
            >
              {value !== EMPTY ? (
                <span className="cell__value">{value}</span>
              ) : notes[row][col].length ? (
                <span className="cell__notes">
                  {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
                    <span key={n} className="cell__note">
                      {notes[row][col].includes(n) ? n : ""}
                    </span>
                  ))}
                </span>
              ) : null}
            </button>
          );
        }),
      )}
    </div>
  );
}
