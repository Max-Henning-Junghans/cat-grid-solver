import { example, cloneBoard } from './example.js';
import { techniques, findNextDeduction, applyDeduction, validateBoard, resolveCurrent, resolveUntilStuck } from './solver.js';
import { translate, colorLetter, unitName, explain } from './i18n.js';
import { registerAgentTools } from './webmcp.js';

const $ = selector => document.querySelector(selector);
let language = 'en';
try { language = localStorage.getItem('cat-grid-language') === 'de' ? 'de' : 'en'; } catch { /* Still works when storage is disabled. */ }
let enabled = new Set(techniques.map(technique => technique.id));
try {
  const saved = JSON.parse(localStorage.getItem('cat-grid-techniques'));
  if (Array.isArray(saved)) enabled = new Set(saved.filter(id => techniques.some(t => t.id === id)));
} catch { /* Preferences are optional. */ }
let board = cloneBoard(example), isSample = true, currentStep = null, message = null;
let editing = false, tool = 'cycle', selectedColor = 0, uncertain = new Set();
let undoStack = [], redoStack = [], source = null, busy = false;
let cropSelection = null, cropStart = null;
const t = (key, values) => translate(language, key, values);
const techniqueName = id => techniques.find(technique => technique.id === id)?.name[language === 'de' ? 1 : 0] || id;

function textInk(color) {
  const values = color.replace('#', '').match(/.{2}/g)?.map(value => parseInt(value, 16)) || [0,0,0];
  const linear = values.map(value => value / 255 <= .04045 ? value / 255 / 12.92 : ((value / 255 + .055) / 1.055) ** 2.4);
  const luminance = .2126*linear[0]+.7152*linear[1]+.0722*linear[2];
  return 1.05/(luminance+.05) > (luminance+.05)/.05 ? '#ffffff' : '#000000';
}

function snapshot() {
  return { board: cloneBoard(board), isSample, currentStep, message, uncertain: [...uncertain], source };
}
function restore(state) {
  board = cloneBoard(state.board); isSample = state.isSample; currentStep = state.currentStep; message = state.message;
  uncertain = new Set(state.uncertain); source = state.source;
  selectedColor = Math.min(selectedColor, board.colors.length - 1);
}
function record(action) {
  undoStack.push({ before: snapshot(), action });
  if (undoStack.length > 300) undoStack.shift();
  redoStack = [];
}
function setStatus(key, values = {}, error = false) {
  const element = $('#import-status');
  element.dataset.key = key;
  element.dataset.values = JSON.stringify(values);
  element.hidden = !key;
  element.textContent = key ? t(key, values) : '';
  element.classList.toggle('error', error);
}
function markSummary(step) {
  return t('changed', { cats: step.changes.filter(change => change.value === 1).length, crosses: step.changes.filter(change => change.value === -1).length });
}
const historySteps = () => undoStack.flatMap(entry => entry.action.steps || (entry.action.step ? [entry.action.step] : []));

function renderBoard() {
  const activeCell = document.activeElement?.dataset?.index;
  const element = $('#board');
  element.style.setProperty('--size', board.size);
  element.classList.toggle('no-labels', !$('#color-labels').checked);
  element.setAttribute('aria-label', t('board'));
  element.setAttribute('aria-rowcount', board.size);
  element.setAttribute('aria-colcount', board.size);
  const changes = new Set(currentStep?.changes.map(change => change.index) || []);
  const evidence = new Set(currentStep?.evidence || []);
  const validation = validateBoard(board);
  const conflictCells = new Set(validation.valid ? [] : validation.cells);
  element.replaceChildren();
  for (let rowIndex = 0; rowIndex < board.size; rowIndex++) {
    const row = document.createElement('div'); row.className = 'board-row'; row.setAttribute('role','row');
    for (let columnIndex = 0; columnIndex < board.size; columnIndex++) {
      const i = rowIndex * board.size + columnIndex, region = board.regions[i], mark = board.marks[i];
      const cell = document.createElement('button');
      cell.type = 'button'; cell.className = 'cell'; cell.dataset.index = i;
      cell.style.setProperty('--cell-color', board.colors[region]);
      cell.style.setProperty('--cell-ink', textInk(board.colors[region]));
      cell.setAttribute('role', 'gridcell'); cell.setAttribute('aria-rowindex', rowIndex + 1); cell.setAttribute('aria-colindex', columnIndex + 1);
      cell.setAttribute('aria-label', `${t('cell', { r: rowIndex + 1, c: columnIndex + 1 })}, ${t('colorName', { n: colorLetter(region) })}, ${t(mark === 1 ? 'catMark' : mark === -1 ? 'xMark' : 'emptyMark')}`);
      cell.tabIndex = activeCell != null ? (Number(activeCell) === i ? 0 : -1) : i === 0 ? 0 : -1;
      cell.classList.toggle('changed', changes.has(i)); cell.classList.toggle('evidence', evidence.has(i) && !changes.has(i));
      cell.classList.toggle('uncertain', uncertain.has(i)); cell.classList.toggle('conflict', conflictCells.has(i));
      const label = document.createElement('span'); label.className = 'color-letter'; label.textContent = colorLetter(region); label.setAttribute('aria-hidden','true');
      const symbol = document.createElement('span'); symbol.className = `mark${mark === -1 ? ' x-mark' : ''}`; symbol.textContent = mark === 1 ? '🐱' : mark === -1 ? '×' : ''; symbol.setAttribute('aria-hidden','true');
      cell.append(label, symbol); row.append(cell);
    }
    element.append(row);
  }
  for (const selector of ['#row-labels', '#column-labels']) {
    const labels = $(selector); labels.style.setProperty('--size', board.size); labels.replaceChildren();
    for (let i = 1; i <= board.size; i++) { const label = document.createElement('span'); label.textContent = i; labels.append(label); }
  }
  if (activeCell != null) element.querySelector(`[data-index="${activeCell}"]`)?.focus({ preventScroll: true });
}

function renderTechniques() {
  const list = $('#technique-list'); list.replaceChildren();
  for (const level of ['basic', 'advanced']) {
    const heading = document.createElement('h3'); heading.className = 'technique-group-title'; heading.textContent = t(level); list.append(heading);
    for (const technique of techniques.filter(item => item.level === level)) {
      const label = document.createElement('label'); label.className = `technique${enabled.has(technique.id) ? '' : ' disabled'}`;
      const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.value = technique.id; checkbox.checked = enabled.has(technique.id); checkbox.disabled = busy;
      const text = document.createElement('div');
      const title = document.createElement('strong'); title.textContent = technique.name[language === 'de' ? 1 : 0];
      const description = document.createElement('p'); description.textContent = technique.description[language === 'de' ? 1 : 0];
      text.append(title, description); label.append(checkbox, text); list.append(label);
    }
  }
  $('#enabled-count').textContent = `${enabled.size} / ${techniques.length}`;
}

function renderTools() {
  $('#edit-toggle').setAttribute('aria-expanded', editing);
  $('#edit-panel').hidden = !editing;
  $('#tools').replaceChildren();
  for (const [id, key] of [['cycle','cycle'],['cat','catTool'],['x','xTool'],['erase','erase'],['paint','paint']]) {
    const button = document.createElement('button'); button.className = 'tool-button'; button.dataset.tool = id; button.textContent = t(key); button.setAttribute('aria-pressed', tool === id); $('#tools').append(button);
  }
  $('#palette').hidden = tool !== 'paint'; $('#palette').replaceChildren();
  board.colors.forEach((color, index) => {
    const swatch = document.createElement('button'); swatch.className = 'swatch'; swatch.dataset.color = index;
    swatch.style.setProperty('--swatch', color); swatch.style.setProperty('--swatch-ink', textInk(color));
    swatch.textContent = colorLetter(index); swatch.setAttribute('aria-label', t('colorName', { n: colorLetter(index) })); swatch.setAttribute('aria-pressed', selectedColor === index); $('#palette').append(swatch);
  });
  if(board.colors.length<26) {
    const color=document.createElement('input');color.type='color';color.id='new-color';color.value='#c180d4';color.setAttribute('aria-label',t('newColor'));color.disabled=busy;
    const add=document.createElement('button');add.className='text-button';add.dataset.addColor='true';add.textContent=t('addColor');add.disabled=busy;$('#palette').append(color,add);
  }
}

function renderDeduction() {
  const element = $('#deduction'); element.replaceChildren(); element.classList.remove('error', 'success');
  const validation = validateBoard(board);
  let headingText, bodyText, detailText = '';
  if (!validation.valid) {
    headingText = t('invalidTitle'); bodyText = t(validation.code, { ...validation, unit: validation.unit ? unitName(language, validation.unit) : '' }); element.classList.add('error');
  } else if (validation.solved) {
    headingText = t('solvedTitle'); bodyText = t('solved'); element.classList.add('success');
    if (['allApplied','runApplied'].includes(message?.title)) detailText = t(message.body, { ...message.values, end: t(message.values.endKey) });
    else if (currentStep) detailText = `${techniqueName(currentStep.technique)}: ${explain(language, board, currentStep)}`;
  } else if (message) {
    headingText = t(message.title); bodyText = t(message.body, message.values?.endKey ? { ...message.values, end: t(message.values.endKey) } : message.values || {});
  } else if (currentStep) {
    const eyebrow = document.createElement('p'); eyebrow.className = 'eyebrow'; eyebrow.textContent = t('explanation'); element.append(eyebrow);
    headingText = techniqueName(currentStep.technique); bodyText = explain(language, board, currentStep); detailText = `${markSummary(currentStep)}. ${t('evidence')}`;
  } else { headingText = t('welcomeTitle'); bodyText = t('welcome'); }
  const heading = document.createElement('h2'); heading.textContent = headingText;
  const body = document.createElement('p'); body.textContent = bodyText; element.append(heading, body);
  if (detailText) { const detail = document.createElement('small'); detail.textContent = detailText; element.append(detail); }
}

function renderHistory() {
  const steps = historySteps();
  $('#history').replaceChildren();
  steps.forEach(step => {
    const item = document.createElement('li'), title = document.createElement('strong'), detail = document.createElement('span');
    title.textContent = techniqueName(step.technique); detail.textContent = markSummary(step); item.append(title, detail); $('#history').append(item);
  });
  $('#history-empty').hidden = steps.length > 0;
}

function render() {
  document.documentElement.lang = language;
  document.title = `Cat Grid Solver · ${language === 'de' ? 'Lösungsstudio' : 'Logic studio'}`;
  document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = t(element.dataset.i18n); });
  document.querySelectorAll('[data-i18n-aria]').forEach(element => { element.setAttribute('aria-label',t(element.dataset.i18nAria)); });
  $('#language').value = language; $('#language').setAttribute('aria-label', t('language'));
  $('#board-name').textContent = isSample ? t('sampleName') : board.name || t('importedName');
  $('#board-size').textContent = t('dimensions', { n: board.size });
  $('#stats').replaceChildren();
  const catCount = board.marks.filter(mark => mark === 1).length;
  for (const [count, label] of [[`${catCount}/${board.size}`, 'cats'], [board.marks.filter(mark => mark === 0).length, 'open'], [historySteps().length, 'steps']]) {
    const stat = document.createElement('span'), number = document.createElement('strong'); number.textContent = count; stat.append(number, document.createTextNode(t(label))); $('#stats').append(stat);
  }
  $('#undo').disabled = busy || undoStack.length === 0; $('#redo').disabled = busy || redoStack.length === 0;
  $('#next').disabled = busy; $('#choose-image').disabled = busy; $('#sample').disabled = busy;
  $('#apply-all').disabled = busy; $('#apply-all').title = t('allHint');
  $('#run').disabled = busy; $('#run').title = t('runHint');
  $('#all-on').disabled = busy; $('#all-off').disabled = busy;
  $('#reset').disabled = busy || board.marks.every(mark => mark === 0);
  renderBoard(); renderTechniques(); renderTools(); renderDeduction(); renderHistory();
  $('#source-panel').hidden = !source;
  if (source) { $('#source-image').src = source.url; $('#source-image').alt = t('screenshot'); }
  const status = $('#import-status'); if (status.dataset.key) status.textContent = t(status.dataset.key, JSON.parse(status.dataset.values || '{}'));
}

function nextDeduction() {
  if (busy) return { status: 'busy' };
  if (uncertain.size) {
    message = { title: 'reviewTitle', body: 'uncertain', values: { count: uncertain.size } }; currentStep = null; render(); return { status: 'review', count: uncertain.size };
  }
  if (!enabled.size) { message = { title: 'offTitle', body: 'off' }; currentStep = null; render(); return { status: 'disabled' }; }
  const result = findNextDeduction(board, [...enabled]);
  if (result.status === 'step') {
    record({ step: result.step }); board = applyDeduction(board, result.step); currentStep = result.step; message = null;
  } else if (result.status === 'stuck') { message = { title: 'stuckTitle', body: 'stuck' }; currentStep = null; }
  render(); return result;
}

async function applyDeductions(mode = 'current') {
  if (busy) return { status: 'busy' };
  if (uncertain.size || !enabled.size) return nextDeduction();
  busy = true; setStatus(mode === 'until' ? 'runWorking' : 'allWorking'); render();
  await new Promise(resolve => requestAnimationFrame(resolve));
  try {
    const result = mode === 'until' ? resolveUntilStuck(board,[...enabled]) : resolveCurrent(board, [...enabled]);
    if (result.steps.length) {
      record({ steps: result.steps }); board = result.board;
      const changes = result.steps.flatMap(step => step.changes);
      currentStep = { ...result.steps.at(-1), changes };
      message = { title: mode === 'until' ? 'runApplied' : 'allApplied', body: 'allSummary', values: { steps: result.steps.length, cats: changes.filter(change => change.value === 1).length, crosses: changes.filter(change => change.value === -1).length, endKey: result.status === 'solved' ? 'allSolved' : mode === 'until' ? 'allStuck' : 'allCurrentEnd' } };
    } else if (result.status === 'stuck') { currentStep = null; message = { title: 'stuckTitle', body: 'stuck' }; }
    else if (result.status === 'invalid') { currentStep = null; message = { title: 'invalidTitle', body: result.validation.code, values: { ...result.validation, unit: result.validation.unit ? unitName(language,result.validation.unit) : '' } }; }
    return { status: result.status, deductions: result.steps.length, changes: result.steps.flatMap(step => step.changes).length };
  } finally { busy = false; setStatus(null); render(); }
}

function editCell(index, forcedTool) {
  if (busy || !Number.isInteger(index) || index < 0 || index >= board.marks.length) return;
  const currentTool = forcedTool || (editing ? tool : 'cycle');
  const nextMark = currentTool === 'cycle' ? board.marks[index] === 0 ? 1 : board.marks[index] === 1 ? -1 : 0 : currentTool === 'cat' ? 1 : currentTool === 'x' ? -1 : 0;
  if (currentTool === 'paint' ? board.regions[index] === selectedColor : board.marks[index] === nextMark && !uncertain.has(index)) return;
  record({ manual: true }); board = cloneBoard(board);
  if (currentTool === 'paint') board.regions[index] = selectedColor; else board.marks[index] = nextMark;
  uncertain.delete(index); currentStep = null; message = { title: 'manualTitle', body: 'manual' }; render();
}

function undo() {
  if (busy || !undoStack.length) return false;
  const entry = undoStack.pop(); redoStack.push({ state: snapshot(), entry }); restore(entry.before); render(); return true;
}
function redo() {
  if (busy || !redoStack.length) return false;
  const entry = redoStack.pop(); undoStack.push(entry.entry); restore(entry.state); render(); return true;
}
function persistTechniques() { try { localStorage.setItem('cat-grid-techniques', JSON.stringify([...enabled])); } catch { /* Still works without storage. */ } }

$('#language').addEventListener('change', event => { language = event.target.value; try { localStorage.setItem('cat-grid-language', language); } catch { /* Optional. */ } render(); });
$('#next').addEventListener('click', nextDeduction); $('#undo').addEventListener('click', undo); $('#redo').addEventListener('click', redo);
$('#apply-all').addEventListener('click', () => applyDeductions('current'));
$('#run').addEventListener('click', () => applyDeductions('until'));
$('#technique-list').addEventListener('change', event => {
  if (!event.target.matches('input[type=checkbox]')) return;
  if (event.target.checked) enabled.add(event.target.value); else enabled.delete(event.target.value);
  persistTechniques(); message = null; renderTechniques(); renderDeduction();
});
for (const [id, on] of [['all-on',true],['all-off',false]]) $(`#${id}`).addEventListener('click', () => { enabled = new Set(on ? techniques.map(technique => technique.id) : []); persistTechniques(); message = null; renderTechniques(); renderDeduction(); });
$('#edit-toggle').addEventListener('click', () => { editing = !editing; renderTools(); });
$('#tools').addEventListener('click', event => { const button = event.target.closest('[data-tool]'); if (button) { tool = button.dataset.tool; renderTools(); } });
$('#palette').addEventListener('click', event => {
  if(busy)return;
  const button = event.target.closest('[data-color]'); if (button) { selectedColor = Number(button.dataset.color); renderTools(); }
  if(event.target.closest('[data-add-color]')) { const color=$('#new-color').value;record({manual:true});board=cloneBoard(board);selectedColor=board.colors.length;board.colors.push(color);currentStep=null;message={title:'manualTitle',body:'manual'};render(); }
});
$('#color-labels').addEventListener('change', renderBoard);
$('#board').addEventListener('click', event => { const cell = event.target.closest('[data-index]'); if (cell) editCell(Number(cell.dataset.index)); });
$('#board').addEventListener('keydown', event => {
  const cell = event.target.closest('[data-index]'); if (!cell) return;
  const index = Number(cell.dataset.index), r = Math.floor(index / board.size), c = index % board.size;
  const destination = { ArrowLeft: r * board.size + Math.max(0,c-1), ArrowRight: r * board.size + Math.min(board.size-1,c+1), ArrowUp: Math.max(0,r-1)*board.size+c, ArrowDown: Math.min(board.size-1,r+1)*board.size+c }[event.key];
  if (destination != null) { event.preventDefault(); $('#board').querySelectorAll('[data-index]').forEach(button => { button.tabIndex = Number(button.dataset.index) === destination ? 0 : -1; }); $(`[data-index="${destination}"]`).focus(); }
  else if ([' ','c','C','x','X','Delete','Backspace'].includes(event.key)) { event.preventDefault(); editCell(index, event.key === ' ' ? 'cycle' : ['c','C'].includes(event.key) ? 'cat' : ['x','X'].includes(event.key) ? 'x' : 'erase'); }
});
document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.target.matches('input,textarea,select') && !document.querySelector('dialog[open]')) { event.preventDefault(); event.shiftKey ? redo() : undo(); }
});
$('#reset').addEventListener('click', () => $('#reset-dialog').showModal());
$('#reset-confirm').addEventListener('click', () => { record({ reset: true }); board = { ...board, marks: board.marks.map(() => 0) }; uncertain.clear(); currentStep = null; message = null; $('#reset-dialog').close(); render(); });

// Image recognition is loaded only when importing; no server receives image data.
async function importImage(input, sample = false, crop = null, forcedSize = 0) {
  if (busy) return;
  if (input instanceof File && (!/^image\/(png|jpeg|webp)$/.test(input.type))) { setStatus('fileError', {}, true); return; }
  if (input instanceof Blob && input.size > 25 * 1024 * 1024) { setStatus('tooLarge', {}, true); return; }
  busy = true; setStatus('importing'); render();
  let loadedSource = source;
  try {
    const { loadImage, parseScreenshot } = await import('./importer.js');
    if (input) loadedSource = await loadImage(input);
    // Preserve the source even when automatic detection fails, so crop recovery is available.
    const parsed = parseScreenshot(loadedSource.image, { crop, size: forcedSize });
    record({ imported: true });
    board = parsed.board; isSample = sample; board.name = sample ? example.name : '';
    source = { ...loadedSource, crop: parsed.crop }; uncertain = new Set(parsed.uncertain);
    selectedColor = 0; currentStep = null;
    message = { title: 'reviewTitle', body: uncertain.size ? 'uncertain' : 'reviewColors', values: { count: uncertain.size } };
    setStatus('importSuccess'); $('#crop-dialog').close();
  } catch (error) {
    if (loadedSource?.image) source = loadedSource;
    setStatus('importError', {}, true);
    message = { title: 'reviewTitle', body: 'importError' };
    console.warn('Image recognition failed:', error.message);
  } finally { busy = false; render(); }
}
$('#choose-image').addEventListener('click', () => $('#image-file').click());
$('#image-file').addEventListener('change', event => { const file = event.target.files[0]; if (file) importImage(file); event.target.value = ''; });
$('#sample').addEventListener('click', () => importImage('./assets/demo-grid.png', true));
$('#dropzone').addEventListener('dragover', event => { event.preventDefault(); $('#dropzone').classList.add('dragging'); });
$('#dropzone').addEventListener('dragleave', () => $('#dropzone').classList.remove('dragging'));
$('#dropzone').addEventListener('drop', event => { event.preventDefault(); $('#dropzone').classList.remove('dragging'); const file = [...event.dataTransfer.files].find(file => file.type.startsWith('image/')); if (file) importImage(file); else setStatus('fileError', {}, true); });
document.addEventListener('paste', event => { const file = [...(event.clipboardData?.items || [])].find(item => item.type.startsWith('image/'))?.getAsFile(); if (file) { event.preventDefault(); importImage(file); } });

function drawCrop() {
  if (!source) return;
  const canvas = $('#crop-canvas'), context = canvas.getContext('2d');
  context.drawImage(source.image, 0, 0, canvas.width, canvas.height);
  if (cropSelection) {
    const { x, y, width, height } = cropSelection;
    context.fillStyle = '#15343d66'; context.fillRect(0,0,canvas.width,canvas.height);
    context.drawImage(source.image, x * source.image.width / canvas.width, y * source.image.height / canvas.height, width * source.image.width / canvas.width, height * source.image.height / canvas.height, x,y,width,height);
    context.strokeStyle = '#12b99c'; context.lineWidth = 3; context.strokeRect(x,y,width,height);
  }
}
function cropPoint(event) {
  const canvas = $('#crop-canvas'), rect = canvas.getBoundingClientRect();
  return { x: Math.max(0,Math.min(canvas.width,(event.clientX - rect.left)*canvas.width/rect.width)), y: Math.max(0,Math.min(canvas.height,(event.clientY - rect.top)*canvas.height/rect.height)) };
}
$('#adjust').addEventListener('click', () => {
  if (!source || busy) return;
  const canvas = $('#crop-canvas'), ratio = Math.min(1,900/source.image.width,1200/source.image.height);
  canvas.width = Math.round(source.image.width*ratio); canvas.height = Math.round(source.image.height*ratio);
  cropSelection = source.crop ? { x: source.crop.x*ratio, y: source.crop.y*ratio, width: source.crop.width*ratio, height: source.crop.height*ratio } : null;
  $('#crop-size').value = board.size; $('#crop-status').hidden = true; drawCrop(); $('#crop-dialog').showModal();
});
$('#crop-canvas').addEventListener('pointerdown', event => { cropStart = cropPoint(event); $('#crop-canvas').setPointerCapture(event.pointerId); cropSelection = null; drawCrop(); });
$('#crop-canvas').addEventListener('pointermove', event => { if (!cropStart) return; const end = cropPoint(event); cropSelection = { x: Math.min(cropStart.x,end.x), y: Math.min(cropStart.y,end.y), width: Math.abs(cropStart.x-end.x), height: Math.abs(cropStart.y-end.y) }; drawCrop(); });
$('#crop-canvas').addEventListener('pointerup', () => { cropStart = null; });
$('#crop-canvas').addEventListener('pointercancel', () => { cropStart = null; });
$('#parse-crop').addEventListener('click', () => {
  if (!cropSelection || cropSelection.width < 20 || cropSelection.height < 20) { $('#crop-status').hidden = false; $('#crop-status').textContent = t('cropMissing'); return; }
  const canvas = $('#crop-canvas');
  importImage(null, isSample, { x: cropSelection.x*source.image.width/canvas.width, y: cropSelection.y*source.image.height/canvas.height, width: cropSelection.width*source.image.width/canvas.width, height: cropSelection.height*source.image.height/canvas.height }, Number($('#crop-size').value));
});
for (let n = 2; n <= 20; n++) { const option = document.createElement('option'); option.value = n; option.textContent = `${n} × ${n}`; $('#crop-size').append(option); }

render();

// Shared application actions also power optional browser agent tools.
export const appActions = {
  read: () => ({ board: cloneBoard(board), enabled: [...enabled], language, uncertain: [...uncertain], validation: validateBoard(board) }),
  next: nextDeduction, all: () => applyDeductions('current'), run: () => applyDeductions('until'), undo,
  configure(ids) {
    if (!Array.isArray(ids) || ids.some(id => !techniques.some(technique => technique.id === id))) throw new Error('Unknown technique');
    enabled = new Set(ids); persistTechniques(); render(); return { enabled: [...enabled] };
  },
  edit(cells) {
    if (!Array.isArray(cells) || cells.some(cell => !Number.isInteger(cell.index) || cell.index < 0 || cell.index >= board.marks.length || ![0,1,-1].includes(cell.mark))) throw new Error('Invalid cell edit');
    if (busy) throw new Error('Image import in progress');
    record({ manual: true }); board = cloneBoard(board);
    for (const cell of cells) { board.marks[cell.index] = cell.mark; uncertain.delete(cell.index); }
    currentStep = null; message = { title: 'manualTitle', body: 'manual' }; render(); return { changed: cells.length };
  },
};
registerAgentTools(appActions);
