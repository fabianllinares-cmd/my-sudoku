import type { Digit } from "../engine";

interface NumberPadProps {
  disabled: boolean;
  onEnter: (digit: Digit) => void;
}

export function NumberPad({ disabled, onEnter }: NumberPadProps) {
  return (
    <div className="number-pad" role="group" aria-label="Numbers">
      {([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map((digit) => (
        <button
          key={digit}
          type="button"
          className="num-btn"
          disabled={disabled}
          onClick={() => onEnter(digit)}
        >
          {digit}
        </button>
      ))}
    </div>
  );
}
