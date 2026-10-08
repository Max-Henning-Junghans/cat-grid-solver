export function registerAgentTools(actions) {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  const lifecycle = new AbortController();
  const empty = { type: 'object', properties: {}, additionalProperties: false };
  const requireObject = input => { if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Expected an object'); };
  const tools = [
    { name: 'read_puzzle', description: 'Read the displayed cat grid board, cell marks, enabled techniques, uncertain marks, and rule validation.', inputSchema: empty, annotations: { readOnlyHint: true, untrustedContentHint: false }, execute(input) { requireObject(input); return actions.read(); } },
    { name: 'configure_techniques', description: 'Set the exact enabled solving techniques. Changes the same switches visible beside the board.', inputSchema: { type: 'object', properties: { techniques: { type: 'array', items: { type: 'string' } } }, required: ['techniques'], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute(input) { requireObject(input); return actions.configure(input.techniques); } },
    { name: 'edit_marks', description: 'Edit local board marks in a batch. Cell indices are zero-based in row order. Marks: 1 cat, -1 X, 0 empty. Records one undoable edit.', inputSchema: { type: 'object', properties: { cells: { type: 'array', items: { type: 'object', properties: { index: { type: 'integer', minimum: 0 }, mark: { type: 'integer', enum: [-1,0,1] } }, required: ['index','mark'], additionalProperties: false } } }, required: ['cells'], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute(input) { requireObject(input); return actions.edit(input.cells); } },
    { name: 'apply_next_deduction', description: 'Apply one logical deduction using only enabled techniques, and update the visible board, explanation, and history. Never guesses. Reports stuck, invalid, solved, or review when no deduction can be applied.', inputSchema: empty, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute(input) { requireObject(input); return actions.next(); } },
    { name: 'apply_all_deductions', description: 'Apply all logical deductions justified by the current board snapshot using enabled techniques. No chaining: newly revealed deductions wait for another invocation. Records one undoable pass and updates the board and deduction history.', inputSchema: empty, annotations: { readOnlyHint: false, untrustedContentHint: false }, async execute(input) { requireObject(input); return actions.all(); } },
    { name: 'solve_until_stuck', description: 'Keep applying enabled logical techniques until the board is solved or no more deductions are available. Never guesses. Records one undoable run and updates the board, explanation, and history.', inputSchema: empty, annotations: { readOnlyHint: false, untrustedContentHint: false }, async execute(input) { requireObject(input); return actions.run(); } },
    { name: 'undo_last_change', description: 'Undo the last local deduction, manual edit, reset, or screenshot import, matching the Undo button.', inputSchema: empty, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute(input) { requireObject(input); if (!actions.undo()) throw new Error('Nothing to undo'); return { undone: true }; } },
  ];
  for (const tool of tools) {
    try { Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(error => console.warn('Optional browser tools unavailable:', error.message)); }
    catch (error) { console.warn('Optional browser tools unavailable:', error.message); }
  }
  window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
}
