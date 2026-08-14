# My Sudoku

A personal Sudoku PWA for playing on a phone. It works offline after install and does not need an account or a backend.

## Run locally

```bash
npm install
npm run dev
```

Then open the printed local URL.

## Tests

```bash
npm test
```

## Play on GitHub Pages

https://fabianllinares-cmd.github.io/my-sudoku/

On Android Chrome: open that URL → menu → **Add to Home screen**. After install it works offline.

Pushes to `main` build, test, and deploy the app with GitHub Actions.

## Build / installable app

```bash
npm run build
npm run preview
```

The production preview is served at `/my-sudoku/` (same path as GitHub Pages).

## Features (V1)

- 9×9 board with row, column, box, and same-number highlights
- Easy / Medium / Hard generation with a uniqueness-checked engine
- Notes, Auto Pencil, undo, erase, timer, and mistake count
- Automatic local save and resume
