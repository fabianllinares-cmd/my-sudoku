import { useEffect } from "react";
import { Board } from "./components/Board";
import { NumberPad } from "./components/NumberPad";
import { useSudoku } from "./hooks/useSudoku";
import type { Difficulty } from "./sudoku/engine";
import "./index.css";

const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
  { id: "expert", label: "Expert" },
];

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function App() {
  const {
    state,
    newGame,
    selectCell,
    setValue,
    erase,
    hint,
    toggleNotesMode,
    move,
  } = useSudoku("easy");

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key >= "1" && event.key <= "9") {
        setValue(Number(event.key));
      } else if (event.key === "Backspace" || event.key === "Delete") {
        erase();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        move(-1, 0);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        move(1, 0);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        move(0, -1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        move(0, 1);
      } else if (event.key.toLowerCase() === "n") {
        toggleNotesMode();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setValue, erase, move, toggleNotesMode]);

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">
          <span className="app__title-accent">my</span>sudoku
        </h1>
        <p className="app__subtitle">
          A clean, keyboard-friendly Sudoku with unique-solution puzzles.
        </p>
      </header>

      <div className="difficulty" role="group" aria-label="Difficulty">
        {DIFFICULTIES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`difficulty__btn${
              state.difficulty === id ? " difficulty__btn--active" : ""
            }`}
            onClick={() => newGame({ difficulty: id })}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="stats">
        <div className="stat">
          <span className="stat__label">Time</span>
          <span className="stat__value" data-testid="timer">
            {formatTime(state.elapsedSeconds)}
          </span>
        </div>
        <div className="stat">
          <span className="stat__label">Mistakes</span>
          <span className="stat__value" data-testid="mistakes">
            {state.mistakes}
          </span>
        </div>
        <div className="stat">
          <span className="stat__label">Level</span>
          <span className="stat__value stat__value--capitalize">
            {state.difficulty}
          </span>
        </div>
      </div>

      <div className="playfield">
        <div className="board-wrapper">
          <Board
            board={state.board}
            givens={state.givens}
            notes={state.notes}
            selected={state.selected}
            conflicts={state.conflicts}
            onSelect={selectCell}
          />
          {state.solved && (
            <div className="win-overlay" role="alert">
              <div className="win-card">
                <div className="win-emoji" aria-hidden="true">
                  🎉
                </div>
                <h2>Solved!</h2>
                <p>
                  {formatTime(state.elapsedSeconds)} · {state.mistakes} mistake
                  {state.mistakes === 1 ? "" : "s"}
                </p>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => newGame()}
                >
                  Play again
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="sidebar">
          <NumberPad
            board={state.board}
            onNumber={setValue}
            disabled={state.solved}
          />

          <div className="controls">
            <button
              type="button"
              className={`btn${
                state.notesMode ? " btn--active" : ""
              }`}
              onClick={toggleNotesMode}
              aria-pressed={state.notesMode}
            >
              Notes {state.notesMode ? "on" : "off"}
            </button>
            <button
              type="button"
              className="btn"
              onClick={erase}
              disabled={state.solved}
            >
              Erase
            </button>
            <button
              type="button"
              className="btn"
              onClick={hint}
              disabled={state.solved}
            >
              Hint
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => newGame()}
            >
              New game
            </button>
          </div>

          <p className="hints">
            Tip: use arrow keys to move, 1–9 to fill, Backspace to erase, and
            <strong> N</strong> to toggle notes.
          </p>
        </div>
      </div>

      <footer className="app__footer">
        Built with React + Vite · puzzles are generated with a guaranteed unique
        solution.
      </footer>
    </div>
  );
}
