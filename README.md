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

## Features

- 9×9 board with row, column, box, and same-number highlights, including matching pencil notes
- Easy / Medium / Hard / Extreme generation with a uniqueness-checked engine
- Remaining count per digit on the keypad
- Notes, undo, erase, mistake count, and a light/dark theme
- Auto Pencil fills every empty cell with the candidates that are legal at that moment. It is a
  one-shot action, so notes stay yours afterwards: placing a digit only removes that digit from its
  row, column, and box, and a note the board forbids is flagged rather than blocked or deleted.
- The timer counts active play only. It stops whenever the app is hidden or backgrounded and
  resumes when it comes back, so time spent away is never counted.
- Automatic local save and resume
