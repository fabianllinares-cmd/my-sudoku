import { useCallback, useEffect, useState } from "react";
import type { Difficulty, Digit } from "./engine";
import { useGame } from "./game/useGame";
import { Actions } from "./ui/Actions";
import { Board } from "./ui/Board";
import { CompletionModal } from "./ui/CompletionModal";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Header } from "./ui/Header";
import { NumberPad } from "./ui/NumberPad";

export default function App() {
  const game = useGame();
  const [pendingDifficulty, setPendingDifficulty] = useState<Difficulty | null>(null);

  const requestNewGame = useCallback(
    (difficulty: Difficulty) => {
      if (game.hasProgress && !game.completed) {
        setPendingDifficulty(difficulty);
        return;
      }
      game.startNewGame(difficulty);
    },
    [game],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (game.generating) return;
      if (event.key >= "1" && event.key <= "9") {
        game.enterDigit(Number(event.key) as Digit);
        return;
      }
      if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
        game.erase();
        return;
      }
      if (event.key === "p" || event.key === "P" || event.key === "n" || event.key === "N") {
        game.togglePencil();
        return;
      }
      if (event.key === "a" || event.key === "A") {
        game.toggleAutoPencil();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        game.undo();
        return;
      }
      if (event.key === "u" || event.key === "U") {
        game.undo();
        return;
      }
      if (game.selected === null) return;
      const moves: Record<string, number> = {
        ArrowLeft: -1,
        ArrowRight: 1,
        ArrowUp: -9,
        ArrowDown: 9,
      };
      const delta = moves[event.key];
      if (delta !== undefined) {
        event.preventDefault();
        const next = game.selected + delta;
        if (next >= 0 && next < 81) game.selectCell(next);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game]);

  const boardDisabled = game.generating || !game.hasPuzzle;

  return (
    <div className="app">
      <Header
        elapsedMs={game.elapsedMs}
        mistakes={game.mistakes}
        difficulty={game.difficulty}
        generating={game.generating}
        onNewGame={() => requestNewGame(game.difficulty)}
        onDifficulty={(difficulty) => requestNewGame(difficulty)}
      />

      <main className="board-wrap">
        <Board
          puzzle={game.puzzle}
          grid={game.grid}
          notes={game.notes}
          solution={game.solution}
          selected={game.selected}
          conflicts={game.conflicts}
          disabled={boardDisabled}
          onSelect={game.selectCell}
        />
        {game.generating && (
          <div className="generating" aria-live="polite">
            <div className="spinner" />
            Generating
          </div>
        )}
      </main>

      <NumberPad disabled={boardDisabled || game.completed} onEnter={game.enterDigit} />
      <Actions
        pencilMode={game.pencilMode}
        autoPencil={game.autoPencil}
        canUndo={game.canUndo}
        disabled={boardDisabled || game.completed}
        onErase={game.erase}
        onTogglePencil={game.togglePencil}
        onUndo={game.undo}
        onToggleAutoPencil={game.toggleAutoPencil}
      />

      {game.completed && (
        <CompletionModal
          elapsedMs={game.elapsedMs}
          mistakes={game.mistakes}
          onNewGame={() => game.startNewGame(game.difficulty)}
        />
      )}

      {pendingDifficulty && (
        <ConfirmDialog
          title="Start a new game?"
          message="The current puzzle will be replaced."
          confirmLabel="New game"
          onCancel={() => setPendingDifficulty(null)}
          onConfirm={() => {
            const difficulty = pendingDifficulty;
            setPendingDifficulty(null);
            game.startNewGame(difficulty);
          }}
        />
      )}
    </div>
  );
}
