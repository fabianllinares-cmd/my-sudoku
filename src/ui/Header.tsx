import { DIFFICULTIES } from "../engine";
import type { Difficulty } from "../engine";
import { formatTime } from "../game/useGame";
import type { Theme } from "../game/theme";

interface HeaderProps {
  elapsedMs: number;
  mistakes: number;
  difficulty: Difficulty;
  generating: boolean;
  theme: Theme;
  onNewGame: () => void;
  onDifficulty: (difficulty: Difficulty) => void;
  onToggleTheme: () => void;
}

export function Header({
  elapsedMs,
  mistakes,
  difficulty,
  generating,
  theme,
  onNewGame,
  onDifficulty,
  onToggleTheme,
}: HeaderProps) {
  return (
    <header className="header">
      <div className="title-row">
        <h1>My Sudoku</h1>
        <div className="title-actions">
          <button
            type="button"
            className="icon-btn"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={theme === "dark"}
            onClick={onToggleTheme}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          <button type="button" className="new-btn" onClick={onNewGame} disabled={generating}>
            New
          </button>
        </div>
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
    </header>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
