import type { Difficulty } from "../engine";
import { formatTime } from "../game/useGame";

interface HeaderProps {
  elapsedMs: number;
  mistakes: number;
  difficulty: Difficulty;
  generating: boolean;
  onNewGame: () => void;
  onDifficulty: (difficulty: Difficulty) => void;
}

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export function Header({
  elapsedMs,
  mistakes,
  difficulty,
  generating,
  onNewGame,
  onDifficulty,
}: HeaderProps) {
  return (
    <header className="header">
      <div className="title-row">
        <h1>My Sudoku</h1>
        <button type="button" className="new-btn" onClick={onNewGame} disabled={generating}>
          New
        </button>
      </div>
      <div className="status-row">
        <div className="stat" aria-label="Time">
          <span className="stat-label">Time</span>
          <span className="stat-value">{formatTime(elapsedMs)}</span>
        </div>
        <div className="stat" aria-label="Mistakes">
          <span className="stat-label">Mistakes</span>
          <span className="stat-value">{mistakes}</span>
        </div>
        <div className="difficulty" role="group" aria-label="Difficulty">
          {DIFFICULTIES.map((level) => (
            <button
              key={level}
              type="button"
              className={`diff-btn ${difficulty === level ? "active" : ""}`}
              disabled={generating}
              onClick={() => onDifficulty(level)}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
