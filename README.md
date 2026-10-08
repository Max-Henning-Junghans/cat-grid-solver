# Cat Grid Solver

A local browser app that imports colored cat grid puzzle screenshots, generates new puzzles, and explains logical solving steps. It includes English and German, editable color regions and marks, and eleven individually selectable techniques. No runtime packages, accounts, or image services are required.

An independent project with an original demo puzzle and generated test images. It is not affiliated with any puzzle app publisher.

![Cat Grid Solver with puzzle generation, input tools, and an explained deduction](preview.jpg)

## Start

Requires Node.js 20 or newer. From this directory, run:

```powershell
npm start
```

Open http://127.0.0.1:5173 in your browser. To use another port:

```powershell
$env:PORT = '5174'
npm start
```

## Use

1. Choose, drop, or paste a PNG, JPEG, or WebP screenshot. **Try sample** imports the original Garden puzzle image through the same recognition pipeline.
2. Review the detected board. If needed, use **Adjust crop / size** to drag a rectangle around the entire colored grid and select its size. Square grids from 2×2 to 20×20 are supported; puzzles must have a valid solution under the rules below.
3. Click a cell to cycle between cat, X, and empty. The tools above the board select **Cat**, **Suspected cat**, **X**, **Clear**, or **Color** directly. **Edit colors** opens the color palette. Choose a swatch to correct a region; **Add color** creates a missing color. Amber outlines flag uncertain recognition. Correct those cells before solving.
4. Enable the techniques you want to use, then choose one of the three solve actions:

| Action | Behavior |
| --- | --- |
| **Next deduction** | Apply one logical deduction, which may change one or several cells. |
| **All current deductions** | Find all deductions using the board exactly as it is now, then apply them together. New consequences wait until another click. |
| **Solve as far as possible** | Chain enabled logical deductions until solved or no further deduction is available. |

Every batch is one undoable action. **Undo** and **Redo** restore both board marks and color edits. **Reset marks** removes cats and X marks while preserving colors and is also undoable. Outlined cells are the evidence for the latest step; solid outlines identify changed cells. The history records the techniques used.

The language selector is always available. Language and technique preferences are remembered on this device. Puzzle work stays in the current tab and is reset on reload. Screenshot pixels are processed on your computer and are never uploaded. The app makes no external network requests.

Arrow keys move between cells. Space cycles a mark, C places a cat, P toggles a suspected cat, X excludes a cell, and Delete clears it. Ctrl+Z / Cmd+Z undoes a change; add Shift to redo.

Drag across cells to mark Xs, even with **Cycle marks** selected. Start on an X to erase Xs for the entire stroke. Right-click also toggles X and supports dragging. X strokes skip confirmed and suspected cats. Select **Clear** to drag away any marks and hints, including cats; **Color** paints regions by dragging. Re-entering a cell during a stroke does not toggle it again. Mouse, pen, and touch use the same controls, with a live preview. Each finished stroke is one Undo action. Escape or an interrupted gesture cancels the preview. A Cat-tool drag does not stamp multiple cats. Dragging inside the grid marks cells; scroll the page from outside the grid on touch devices.

**Suspected cat** shows a cat with a question mark as a personal note. Click or drag to add hints; start on a hint to remove hints. Confirmed cats are preserved. The solver and validation treat hinted cells as ordinary empty candidates: they do not count as cats, exclude neighbors, or influence any deduction. A proven cat or X replaces a hint, and Undo restores it. Use **Cat** or C to confirm a hint, **Clear** or Delete to remove it, or X on the keyboard to explicitly exclude it. Reset marks clears hints too. Personal hints do not confirm uncertain screenshot recognition.

## Rules and techniques

There must be exactly one cat in every row, column, and color. Cats cannot touch, including diagonally. The solver uses logical constraints and never backtracks or guesses. An ambiguous puzzle may remain partially solved.

Basic techniques exclude neighbors or other cells in a cat's row, column, or color, and place a cat when a unit has one remaining cell. Advanced techniques use confined colors, common neighbors, pairs/triples, and incompatible candidate positions. Each technique can be disabled independently; disabled techniques never make changes implicitly.

The recognizer finds a regular colored grid, groups tile colors, and distinguishes cat shapes from X strokes. It is tuned for clear app screenshots. Cropped cells, animations, unusual marks, and very similar colors may need manual correction. Recognition uncertainty and rule conflicts are shown on the board.

## Puzzle generation

Use **Generate a puzzle** to choose a square size from 4×4 through 20×20 and one of **Easy**, **Medium**, **Hard**, or **Extreme**. The original rules require square boards: exactly one cat per row and column implies equal counts of rows and columns. Sizes 2 and 3 cannot satisfy the no-touch rule.

Generated puzzles have connected color regions, no prefilled marks, and one unique cat placement. The generator accepts a board only when the logical solver completes it; that sequence of sound deductions fixes every cat and certifies uniqueness. Larger boards grow from fresh smaller layouts by inserting safe cat positions and connected region bridges, with the difficulty checked after each expansion.

Difficulty follows this solver's deduction order and is relative to the selected size. Basic deductions contribute zero points; line confinement and shared neighbors contribute one each, pairs/triples three, and compatibility deductions five. Easy requires zero advanced points, Medium 1–2, Hard 3–4, and Extreme 5 or more. Ratings measure the verified logical path, rather than a human difficulty guarantee or a globally shortest solution.

Generation runs locally in a worker, keeping the interface responsive. **Cancel** keeps the current board. A successful generation replaces the board in one undoable action, starts a fresh deduction history, and preserves your technique switches. Harder puzzles may need techniques you currently have disabled. If a matching puzzle cannot be found within 20 seconds, the existing board stays in place and you can try again. English/German applies to generation controls and messages too.

For reproducible development examples, `generatePuzzle({size, difficulty, seed})` in `dist/generator.js` accepts a 32-bit seed. The visible button chooses a fresh random seed each time.

## Verify

```powershell
npm test
npm run check
```

Tests cover generated puzzle uniqueness using an independent exact solution counter at sizes 4, 8, 12, and 20; all difficulty levels; reproducible seeds; and generation failure. They also cover the generated demo screenshot, original geometric cat and X marks, grid sizes, crop recovery, uncertain marks, the distinction between snapshot and chained batches, and every technique against an independent exhaustive solution oracle. Screenshot fixtures are compressed RGBA data, so the tests need only Node. `node scripts/create-fixtures.mjs` regenerates the demo PNG and fixtures without dependencies.

The browser app is in `dist/`; `server.mjs` serves it locally. Optional WebMCP tools use the same board actions as the visible buttons when the browser supports them.
