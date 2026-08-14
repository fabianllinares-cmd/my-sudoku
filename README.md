# my-sudoku

A clean, keyboard-friendly **Sudoku** game built with React, TypeScript, and Vite.
Every puzzle is generated with a guaranteed **unique solution**.

## Features

- Four difficulty levels (easy, medium, hard, expert) with a backtracking generator that guarantees a single solution.
- Pencil-mark **notes** mode, conflict highlighting, and same-number highlighting.
- **Hint** and **erase** helpers, live timer, and mistake counter.
- Full keyboard support: arrow keys to move, `1`–`9` to fill, `Backspace`/`Delete` to erase, `N` to toggle notes.
- Automatic autosave to `localStorage`, so an in-progress game survives a reload.

## Getting started

```bash
npm install      # install dependencies
npm run dev      # start the Vite dev server at http://localhost:5173
```

## Available scripts

| Command             | Description                                        |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Start the Vite dev server (with `--host`).         |
| `npm run build`     | Type-check (`tsc -b`) and build for production.     |
| `npm run preview`   | Preview the production build locally.              |
| `npm run lint`      | Lint the codebase with oxlint.                     |
| `npm test`          | Run the unit test suite once with Vitest.          |
| `npm run test:watch`| Run Vitest in watch mode.                           |

## Project structure

```
src/
  sudoku/engine.ts        # puzzle generation, solver, validation
  sudoku/engine.test.ts   # unit tests for the engine
  hooks/useSudoku.ts      # game state, timer, autosave, keyboard actions
  components/Board.tsx     # 9x9 grid rendering
  components/NumberPad.tsx # digit input pad with remaining counts
  App.tsx                  # layout, controls, difficulty, win overlay
```

## Tech stack

- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [Vitest](https://vitest.dev/) for unit tests
- [oxlint](https://oxc.rs/docs/guide/usage/linter) for linting

## Cloud Agent environment

This repository includes a [`.cursor/environment.json`](.cursor/environment.json)
that installs dependencies with `npm ci` and runs the Vite dev server on port
`5173` so Cursor Cloud Agents can work on and preview the app out of the box.
