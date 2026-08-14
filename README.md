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

## Build / installable app

```bash
npm run build
npm run preview
```

On Android Chrome: open the app → menu → **Add to Home screen**. After that it launches as a standalone app and continues to work offline.

## Features (V1)

- 9×9 board with row, column, box, and same-number highlights
- Easy / Medium / Hard generation with a uniqueness-checked engine
- Notes, Auto Pencil, undo, erase, timer, and mistake count
- Automatic local save and resume
