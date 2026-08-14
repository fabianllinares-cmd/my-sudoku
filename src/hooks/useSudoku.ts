import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  cloneGrid,
  EMPTY,
  findConflicts,
  generatePuzzle,
  isSolved,
  SIZE,
  type Difficulty,
  type Grid,
} from "../sudoku/engine";

export interface CellPosition {
  row: number;
  col: number;
}

export interface SudokuState {
  board: Grid;
  givens: boolean[][];
  notes: number[][][];
  solution: Grid;
  selected: CellPosition | null;
  difficulty: Difficulty;
  notesMode: boolean;
  conflicts: Set<string>;
  solved: boolean;
  elapsedSeconds: number;
  mistakes: number;
}

const STORAGE_KEY = "my-sudoku:autosave";

function makeNotes(): number[][][] {
  return Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => [] as number[]),
  );
}

function computeGivens(puzzle: Grid): boolean[][] {
  return puzzle.map((row) => row.map((value) => value !== EMPTY));
}

interface NewGameOptions {
  difficulty: Difficulty;
}

export function useSudoku(initialDifficulty: Difficulty = "easy") {
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [board, setBoard] = useState<Grid>(() => []);
  const [givens, setGivens] = useState<boolean[][]>(() => []);
  const [notes, setNotes] = useState<number[][][]>(makeNotes);
  const [solution, setSolution] = useState<Grid>(() => []);
  const [selected, setSelected] = useState<CellPosition | null>(null);
  const [notesMode, setNotesMode] = useState(false);
  const [solved, setSolved] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const timerRef = useRef<number | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current !== null) return;
    timerRef.current = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const newGame = useCallback(
    (options?: NewGameOptions) => {
      const nextDifficulty = options?.difficulty ?? difficulty;
      const { puzzle, solution: sol } = generatePuzzle(nextDifficulty);
      setDifficulty(nextDifficulty);
      setBoard(cloneGrid(puzzle));
      setGivens(computeGivens(puzzle));
      setNotes(makeNotes());
      setSelected(null);
      setSolution(sol);
      setSolved(false);
      setElapsedSeconds(0);
      setMistakes(0);
      stopTimer();
      startTimer();
    },
    [difficulty, startTimer, stopTimer],
  );

  useEffect(() => {
    const saved = loadSavedGame();
    if (saved) {
      setDifficulty(saved.difficulty);
      setBoard(saved.board);
      setGivens(saved.givens);
      setNotes(saved.notes);
      setSolution(saved.solution);
      setElapsedSeconds(saved.elapsedSeconds);
      setMistakes(saved.mistakes);
      setSolved(isSolved(saved.board));
      if (!isSolved(saved.board)) startTimer();
    } else {
      newGame({ difficulty: initialDifficulty });
    }
    return stopTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const conflicts = useMemo(
    () => (board.length ? findConflicts(board) : new Set<string>()),
    [board],
  );

  useEffect(() => {
    if (!board.length) return;
    if (isSolved(board)) {
      setSolved(true);
      stopTimer();
    }
  }, [board, stopTimer]);

  useEffect(() => {
    if (!board.length) return;
    persistGame({
      board,
      givens,
      notes,
      solution,
      difficulty,
      elapsedSeconds,
      mistakes,
    });
  }, [board, givens, notes, solution, difficulty, elapsedSeconds, mistakes]);

  const selectCell = useCallback((row: number, col: number) => {
    setSelected({ row, col });
  }, []);

  const setValue = useCallback(
    (value: number) => {
      if (!selected || solved) return;
      const { row, col } = selected;
      if (givens[row][col]) return;

      if (notesMode && value !== EMPTY) {
        setNotes((prev) => {
          const next = prev.map((r) => r.map((c) => [...c]));
          const cell = next[row][col];
          const idx = cell.indexOf(value);
          if (idx >= 0) cell.splice(idx, 1);
          else cell.push(value);
          return next;
        });
        return;
      }

      setBoard((prev) => {
        const next = cloneGrid(prev);
        next[row][col] = value;
        return next;
      });
      setNotes((prev) => {
        const next = prev.map((r) => r.map((c) => [...c]));
        next[row][col] = [];
        return next;
      });
      if (value !== EMPTY && solution.length && value !== solution[row][col]) {
        setMistakes((prev) => prev + 1);
      }
    },
    [selected, solved, givens, notesMode, solution],
  );

  const erase = useCallback(() => {
    setValue(EMPTY);
  }, [setValue]);

  const hint = useCallback(() => {
    if (!selected || solved || !solution.length) return;
    const { row, col } = selected;
    if (givens[row][col] || board[row][col] === solution[row][col]) return;
    setBoard((prev) => {
      const next = cloneGrid(prev);
      next[row][col] = solution[row][col];
      return next;
    });
    setNotes((prev) => {
      const next = prev.map((r) => r.map((c) => [...c]));
      next[row][col] = [];
      return next;
    });
  }, [selected, solved, solution, givens, board]);

  const toggleNotesMode = useCallback(() => {
    setNotesMode((prev) => !prev);
  }, []);

  const move = useCallback(
    (dRow: number, dCol: number) => {
      setSelected((prev) => {
        const base = prev ?? { row: 0, col: 0 };
        return {
          row: Math.min(SIZE - 1, Math.max(0, base.row + dRow)),
          col: Math.min(SIZE - 1, Math.max(0, base.col + dCol)),
        };
      });
    },
    [],
  );

  const state: SudokuState = {
    board,
    givens,
    notes,
    solution,
    selected,
    difficulty,
    notesMode,
    conflicts,
    solved,
    elapsedSeconds,
    mistakes,
  };

  return {
    state,
    newGame,
    selectCell,
    setValue,
    erase,
    hint,
    toggleNotesMode,
    move,
    setDifficulty,
  };
}

interface PersistedGame {
  board: Grid;
  givens: boolean[][];
  notes: number[][][];
  solution: Grid;
  difficulty: Difficulty;
  elapsedSeconds: number;
  mistakes: number;
}

function persistGame(game: PersistedGame) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  } catch {
    // Ignore storage failures (e.g. private mode / quota).
  }
}

function loadSavedGame(): PersistedGame | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedGame;
    if (!parsed.board?.length || !parsed.solution?.length) return null;
    return parsed;
  } catch {
    return null;
  }
}
