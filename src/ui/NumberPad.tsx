import type { DigitProgress, Digit } from "../engine";

interface NumberPadProps {
  digits: DigitProgress[];
  disabled: boolean;
  onEnter: (digit: Digit) => void;
}

export function NumberPad({ digits, disabled, onEnter }: NumberPadProps) {
  return (
    <div className="number-pad" role="group" aria-label="Numbers">
      {digits.map((entry) => (
        <button
          key={entry.digit}
          type="button"
          className={`num-btn${entry.completed ? " complete" : ""}`}
          disabled={disabled}
          aria-label={
            entry.completed
              ? `${entry.digit}, all placed`
              : `${entry.digit}, ${entry.remaining} remaining`
          }
          onClick={() => onEnter(entry.digit)}
        >
          <span className="num-digit">{entry.digit}</span>
          <span className="num-left" aria-hidden="true">
            {entry.completed ? "✓" : entry.remaining}
          </span>
        </button>
      ))}
    </div>
  );
}
