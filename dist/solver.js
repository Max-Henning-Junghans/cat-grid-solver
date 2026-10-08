export const techniques = [
  { id: 'touch', level: 'basic', name: ['Cats cannot touch', 'Katzen dürfen sich nicht berühren'], description: ['Mark all eight neighbors of a cat with X.', 'Markiere alle acht Nachbarfelder einer Katze mit X.'] },
  { id: 'row-cat', level: 'basic', name: ['One cat per row', 'Eine Katze pro Zeile'], description: ['A cat excludes the other cells in its row.', 'Eine Katze schließt die anderen Felder ihrer Zeile aus.'] },
  { id: 'column-cat', level: 'basic', name: ['One cat per column', 'Eine Katze pro Spalte'], description: ['A cat excludes the other cells in its column.', 'Eine Katze schließt die anderen Felder ihrer Spalte aus.'] },
  { id: 'region-cat', level: 'basic', name: ['One cat per color', 'Eine Katze pro Farbe'], description: ['A cat excludes the other cells of its color.', 'Eine Katze schließt die anderen Felder ihrer Farbe aus.'] },
  { id: 'region-single', level: 'basic', name: ['Last cell of a color', 'Letztes Feld einer Farbe'], description: ['The only remaining cell of a color must be a cat.', 'Das letzte mögliche Feld einer Farbe muss eine Katze sein.'] },
  { id: 'row-single', level: 'basic', name: ['Last cell in a row', 'Letztes Feld einer Zeile'], description: ['The only remaining cell in a row must be a cat.', 'Das letzte mögliche Feld einer Zeile muss eine Katze sein.'] },
  { id: 'column-single', level: 'basic', name: ['Last cell in a column', 'Letztes Feld einer Spalte'], description: ['The only remaining cell in a column must be a cat.', 'Das letzte mögliche Feld einer Spalte muss eine Katze sein.'] },
  { id: 'locked', level: 'advanced', name: ['Color confined to a line', 'Farbe auf einer Linie'], description: ['If all candidates of a color are in one row or column, exclude other colors there. Also works in reverse.', 'Liegen alle Kandidaten einer Farbe in einer Zeile oder Spalte, schließe dort andere Farben aus. Gilt auch umgekehrt.'] },
  { id: 'overlap', level: 'advanced', name: ['Shared neighbors', 'Gemeinsame Nachbarfelder'], description: ['Exclude cells that touch every possible position of a required cat.', 'Schließe Felder aus, die jede mögliche Position einer benötigten Katze berühren.'] },
  { id: 'pairs', level: 'advanced', name: ['Pairs and triples', 'Paare und Dreiergruppen'], description: ['Two or three colors restricted to the same number of rows or columns reserve those lines. Also works in reverse.', 'Zwei oder drei Farben in ebenso vielen Zeilen oder Spalten reservieren diese Linien. Gilt auch umgekehrt.'] },
  { id: 'compatibility', level: 'advanced', name: ['No compatible cat position', 'Keine passende Katzenposition'], description: ['Exclude a cell if it would block every cat position in another row, column, or color.', 'Schließe ein Feld aus, wenn es jeden Katzenplatz in einer anderen Zeile, Spalte oder Farbe blockiert.'] },
];

export function units(board) {
  const n = board.size;
  const result = [];
  for (let r = 0; r < n; r++) result.push({ type: 'row', index: r, cells: Array.from({ length: n }, (_, c) => r * n + c) });
  for (let c = 0; c < n; c++) result.push({ type: 'column', index: c, cells: Array.from({ length: n }, (_, r) => r * n + c) });
  for (const k of [...new Set(board.regions)].sort((a,b)=>a-b)) result.push({ type: 'region', index: k, cells: board.regions.flatMap((region, i) => region === k ? [i] : []) });
  return result.map(unit => ({ ...unit, cats: unit.cells.filter(i => board.marks[i] === 1), candidates: unit.cells.filter(i => board.marks[i] === 0) }));
}

export function neighbors(i, n) {
  const r = Math.floor(i / n), c = i % n, result = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if ((dr || dc) && r + dr >= 0 && r + dr < n && c + dc >= 0 && c + dc < n) result.push((r + dr) * n + c + dc);
  }
  return result;
}

export function conflicts(a, b, board) {
  return Math.floor(a / board.size) === Math.floor(b / board.size) || a % board.size === b % board.size || board.regions[a] === board.regions[b] || neighbors(a, board.size).includes(b);
}

export function validateBoard(board) {
  const n = board.size;
  if (!Number.isInteger(n) || n < 2 || n > 20 || board.regions.length !== n * n || board.marks.length !== n * n || board.regions.some(k => !Number.isInteger(k) || k < 0 || k >= board.colors.length) || board.marks.some(k => ![0, 1, -1].includes(k))) return { valid: false, code: 'invalidBoard', cells: [] };
  const used = new Set(board.regions);
  if (used.size !== n) return { valid: false, code: 'colorCount', count: used.size, expected: n, cells: [] };
  const cats = board.marks.flatMap((mark, i) => mark === 1 ? [i] : []);
  for (let a = 0; a < cats.length; a++) for (let b = a + 1; b < cats.length; b++) {
    if (conflicts(cats[a], cats[b], board)) return { valid: false, code: 'catConflict', cells: [cats[a], cats[b]] };
  }
  for (const unit of units(board)) {
    if (!unit.cats.length && !unit.candidates.some(i => cats.every(cat => !conflicts(i, cat, board)))) return { valid: false, code: 'noCandidate', unit, cells: unit.cells };
  }
  return { valid: true, solved: cats.length === n, cats: cats.length };
}

function makeStep(board, technique, targets, value, reason, evidence = []) {
  const changes = [...new Set(targets)].filter(i => board.marks[i] === 0).map(index => ({ index, value }));
  return changes.length ? { technique, changes, reason, evidence: [...new Set(evidence)] } : null;
}

function* combinations(items, count, start = 0, prefix = []) {
  if (prefix.length === count) { yield prefix; return; }
  for (let i = start; i <= items.length - (count - prefix.length); i++) yield* combinations(items, count, i + 1, [...prefix, items[i]]);
}

export function findNextDeduction(board, enabled = techniques.map(t => t.id)) {
  const validation = validateBoard(board);
  if (!validation.valid) return { status: 'invalid', validation };
  if (validation.solved) return { status: 'solved' };
  const step = deductions(board, enabled).next().value;
  return step ? { status: 'step', step } : { status: 'stuck' };
}

function* deductions(board, enabled) {
  const active = new Set(enabled), allUnits = units(board), n = board.size;
  const unfinished = allUnits.filter(unit => !unit.cats.length);
  for (const technique of techniques) {
    if (!active.has(technique.id)) continue;
    if (technique.id === 'touch') {
      for (let i = 0; i < board.marks.length; i++) if (board.marks[i] === 1) {
        const step = makeStep(board, technique.id, neighbors(i, n), -1, { kind: 'touch', cat: i }, [i]);
        if (step) yield step;
      }
    } else if (technique.id.endsWith('-cat')) {
      const type = { 'row-cat': 'row', 'column-cat': 'column', 'region-cat': 'region' }[technique.id];
      for (const unit of allUnits.filter(unit => unit.type === type && unit.cats.length)) {
        const step = makeStep(board, technique.id, unit.cells, -1, { kind: 'catUnit', type, index: unit.index, cat: unit.cats[0] }, unit.cats);
        if (step) yield step;
      }
    } else if (technique.id.endsWith('-single')) {
      const type = { 'row-single': 'row', 'column-single': 'column', 'region-single': 'region' }[technique.id];
      for (const unit of unfinished.filter(unit => unit.type === type && unit.candidates.length === 1)) {
        const step = makeStep(board, technique.id, unit.candidates, 1, { kind: 'single', type, index: unit.index }, unit.cells);
        if (step) yield step;
      }
    } else if (technique.id === 'locked') {
      for (const unit of unfinished) {
        if (unit.candidates.length < 2) continue;
        const targetTypes = unit.type === 'region' ? ['row', 'column'] : ['region'];
        for (const type of targetTypes) {
          const ids = [...new Set(unit.candidates.map(i => type === 'row' ? Math.floor(i / n) : type === 'column' ? i % n : board.regions[i]))];
          if (ids.length !== 1) continue;
          const target = allUnits.find(other => other.type === type && other.index === ids[0]);
          const step = makeStep(board, technique.id, target.cells.filter(i => !unit.cells.includes(i)), -1, { kind: 'locked', source: { type: unit.type, index: unit.index }, target: { type, index: ids[0] } }, unit.candidates);
          if (step) yield step;
        }
      }
    } else if (technique.id === 'overlap') {
      for (const unit of unfinished) {
        if (unit.candidates.length < 2) continue;
        const neighborSets = unit.candidates.map(i => new Set(neighbors(i, n)));
        const shared = [...neighborSets[0]].filter(i => !unit.cells.includes(i) && neighborSets.every(set => set.has(i)));
        const step = makeStep(board, technique.id, shared, -1, { kind: 'overlap', type: unit.type, index: unit.index }, unit.candidates);
        if (step) yield step;
      }
    } else if (technique.id === 'pairs') {
      for (const sourceType of ['region', 'row', 'column']) {
        const targetTypes = sourceType === 'region' ? ['row', 'column'] : ['region'];
        const sourceUnits = unfinished.filter(unit => unit.type === sourceType);
        for (const targetType of targetTypes) for (const count of [2, 3]) {
          for (const group of combinations(sourceUnits, count)) {
            const candidateCells = group.flatMap(unit => unit.candidates);
            const ids = [...new Set(candidateCells.map(i => targetType === 'row' ? Math.floor(i / n) : targetType === 'column' ? i % n : board.regions[i]))];
            if (ids.length !== count) continue;
            const sourceCells = new Set(group.flatMap(unit => unit.cells));
            const targetCells = allUnits.filter(unit => unit.type === targetType && ids.includes(unit.index)).flatMap(unit => unit.cells);
            const step = makeStep(board, technique.id, targetCells.filter(i => !sourceCells.has(i)), -1, { kind: 'groups', sourceType, sourceIds: group.map(unit => unit.index), targetType, targetIds: ids }, candidateCells);
            if (step) yield step;
          }
        }
      }
    } else if (technique.id === 'compatibility') {
      for (const unit of unfinished) {
        if (unit.candidates.length < 2) continue;
        const blocked = board.marks.flatMap((mark, index) => mark === 0 && !unit.cells.includes(index) && unit.candidates.every(candidate => conflicts(index, candidate, board)) ? [index] : []);
        const step = makeStep(board, technique.id, blocked, -1, { kind: 'compatibility', type: unit.type, index: unit.index }, unit.candidates);
        if (step) yield step;
      }
    }
  }
}

export function applyDeduction(board, step) {
  const marks = [...board.marks];
  for (const { index, value } of step.changes) {
    if (!Number.isInteger(index) || index < 0 || index >= marks.length || marks[index] !== 0 || ![1, -1].includes(value)) throw new Error('Invalid deduction');
    marks[index] = value;
  }
  return { ...board, marks };
}

export function resolveCurrent(board, enabled = techniques.map(technique => technique.id)) {
  const validation = validateBoard(board);
  if (!validation.valid) return { status: 'invalid', validation, board, steps: [] };
  if (validation.solved) return { status: 'solved', board, steps: [] };
  const changes = new Map(), steps = [];
  // Enumerate every technique against this exact snapshot. Never feed changes
  // back into candidate sets until the user requests another pass.
  for (const step of deductions(board, enabled)) {
    const fresh = [];
    for (const change of step.changes) {
      if (changes.has(change.index) && changes.get(change.index).value !== change.value) return { status: 'invalid', validation: { valid: false, code: 'deductionConflict', cells: [change.index] }, board, steps: [] };
      if (!changes.has(change.index)) { changes.set(change.index, change); fresh.push(change); }
    }
    if (fresh.length) steps.push({ ...step, changes: fresh });
  }
  if (!steps.length) return { status: 'stuck', board, steps: [] };
  const nextBoard = applyDeduction(board, { changes: [...changes.values()] });
  const after = validateBoard(nextBoard);
  if (!after.valid) return { status: 'invalid', validation: after, board, steps: [] };
  return { status: after.solved ? 'solved' : 'step', board: nextBoard, steps };
}

export function resolveUntilStuck(board, enabled = techniques.map(technique => technique.id)) {
  let nextBoard = board;
  const steps = [];
  for (let i = 0; i <= board.marks.length; i++) {
    const result = findNextDeduction(nextBoard, enabled);
    if (result.status !== 'step') return { ...result, board: nextBoard, steps };
    steps.push(result.step); nextBoard = applyDeduction(nextBoard, result.step);
  }
  throw new Error('A deduction did not make progress');
}
