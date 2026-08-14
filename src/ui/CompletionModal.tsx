import { formatTime } from "../game/useGame";

interface CompletionModalProps {
  elapsedMs: number;
  mistakes: number;
  onNewGame: () => void;
}

export function CompletionModal({ elapsedMs, mistakes, onNewGame }: CompletionModalProps) {
  return (
    <div className="modal-backdrop" role="dialog" aria-labelledby="complete-title">
      <div className="modal">
        <h2 id="complete-title">Puzzle complete</h2>
        <p className="complete-stats">
          <span>
            Time <strong>{formatTime(elapsedMs)}</strong>
          </span>
          <span>
            Mistakes <strong>{mistakes}</strong>
          </span>
        </p>
        <button type="button" className="primary-btn" onClick={onNewGame}>
          New game
        </button>
      </div>
    </div>
  );
}
