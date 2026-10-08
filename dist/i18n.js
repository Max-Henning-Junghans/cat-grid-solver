export const copy = {
  en: {
    title: 'Cat Grid Solver', subtitle: 'One deduction at a time.', language: 'Language',
    importTitle: 'Import a screenshot', importHint: 'Drop an image here, choose a file, or paste from the clipboard.', chooseFile: 'Choose image', sample: 'Try sample', local: 'Images stay on your device.',
    board: 'Puzzle board', sampleName: 'Sample · Garden puzzle', cats: 'cats', open: 'unmarked cells', steps: 'deductions',
    generatorTitle: 'Generate a puzzle', uniquePuzzle: 'Unique solution', generatorHint: 'Choose a square size and difficulty. Every puzzle can be solved with the available logical techniques.', difficulty: 'Difficulty', easy: 'Easy', medium: 'Medium', hard: 'Hard', extreme: 'Extreme', generate: 'Generate puzzle', generating: 'Creating and checking your puzzle…', generatedName: 'Generated · {difficulty}', generatedEdited: 'Generated puzzle · edited', generatedTitle: 'Your puzzle is ready', generatedHint: 'A new {size} × {size} puzzle with one solution. Use your selected techniques, or solve it yourself.', generationSuccess: '{size} × {size} · {difficulty} · unique solution', generationCanceled: 'Generation canceled. Your current board is unchanged.', generationExhausted: 'No puzzle matching this difficulty was found in time. Try generating again.', generationError: 'Could not generate a puzzle. Your current board is unchanged; try again.', generationSizeError: 'Choose a square size from 4 × 4 to 20 × 20.', difficultyHint: 'Easy uses basic rules. Higher levels need more or stronger advanced deductions. Difficulty is relative to the board size.',
    next: 'Next deduction', undo: 'Undo', redo: 'Redo', reset: 'Reset marks',
    applyAll: 'All current deductions', allWorking: 'Applying current deductions…', allApplied: 'Current deductions applied', allSummary: '{steps} deductions applied: {cats} cat(s) placed and {crosses} cell(s) excluded. {end}', allSolved: 'Every cat has a home.', allCurrentEnd: 'New consequences wait for your next click.', allHint: 'Apply all deductions justified by the board as it is now. New consequences wait until the next click. Undo restores this whole pass.', deductionConflict: 'The current marks imply conflicting deductions. Check cats, X marks, and colors before continuing.',
    run: 'Solve as far as possible', runWorking: 'Applying deductions until no more are available…', runApplied: 'Logical deductions applied', allStuck: 'No further deduction is available with the enabled techniques.', runHint: 'Keep applying enabled techniques until solved or stuck, without guessing. Undo restores the whole run.',
    techniques: 'Solving techniques', techniquesHint: 'Only enabled techniques are used.', basic: 'Basic logic', advanced: 'Advanced logic', all: 'All on', none: 'All off',
    welcomeTitle: 'Where can the next cat go?', welcome: 'Choose your techniques, then apply the next deduction. Click a cell to cycle through cat, X, and empty.',
    explanation: 'Latest deduction', evidence: 'Outlined cells explain the step; highlighted cells changed.',
    stuckTitle: 'No deduction available', stuck: 'The enabled techniques cannot make progress. Enable more techniques or check the imported board. No guessing is used.',
    offTitle: 'Choose a technique', off: 'Enable at least one solving technique to continue.', solvedTitle: 'Every cat has a home!', solved: 'The board satisfies all three rules.',
    edit: 'Edit colors', editing: 'Editing board', cycle: 'Cycle marks', catTool: 'Cat', xTool: 'X', erase: 'Clear', paint: 'Color', color: 'Color', labels: 'Show color labels',
    inputTools: 'Board input tools', inputHint: 'Drag to mark Xs; start on an X to erase Xs. Right-click also marks X. Each stroke is one Undo. Escape cancels a stroke.',
    catInputHint: 'Click or tap to place a cat. Dragging does not place extra cats. Right-click marks X.', clearInputHint: 'Drag or swipe to clear marks, including cats. Each stroke is one Undo. Escape cancels a stroke.', colorInputHint: 'Choose a color below, then drag or swipe to paint its region. Each stroke is one Undo. Escape cancels a stroke.',
    rules: 'One cat per row, column, and color. Cats cannot touch, including diagonally.',
    manualTitle: 'Manual edit', manual: 'You updated the board. Your last move can be undone.',
    invalidTitle: 'Check the board', invalidBoard: 'The board data is invalid.', colorCount: 'Expected {expected} colors, but found {count}. Use Edit colors to correct the color regions.', catConflict: 'Two cats share a row, column, or color, or touch each other. Correct the highlighted cats.', noCandidate: '{unit} has no legal position left for a cat. Check X marks and nearby cats.',
    changed: '{cats} cat(s) placed · {crosses} cell(s) excluded', row: 'Row {n}', column: 'Column {n}', region: 'Color {n}', cell: 'row {r}, column {c}', emptyMark: 'empty', catMark: 'cat', xMark: 'X',
    touch: 'The cat at {cell} rules out all neighboring cells, including diagonals.',
    catUnit: 'There is already a cat in {unit}. Every other cell in it must be X.',
    single: '{unit} has only one unmarked cell left. Its cat must go there.',
    locked: 'All remaining positions in {source} are in {target}. The cat reserves that intersection, so other cells in {target} must be X.',
    overlap: 'Every possible position of the cat in {unit} touches the highlighted cells. Those cells cannot contain a cat.',
    compatibility: 'A cat in any highlighted cell would block every remaining cat position in {unit}, through a shared row, column, color, or touching. Those cells must be X.',
    groups: '{sources} need {count} cats and can use only {targets}. Those lines or colors are reserved, so the highlighted cells are X.',
    importing: 'Reading the board…', importSuccess: 'Screenshot imported. Check the colors and marks; you can correct any cell.', importError: 'Could not read this image. Try a sharper screenshot or adjust the board crop.', fileError: 'Choose a PNG, JPEG, or WebP image.', tooLarge: 'This image is too large. Use an image smaller than 25 MB.',
    screenshot: 'Source screenshot', adjust: 'Adjust crop / size', hideSource: 'Hide screenshot', showSource: 'Show screenshot',
    cropTitle: 'Select the board', cropHint: 'Drag a rectangle tightly around the colored grid, including its outer cells. Confirm the board size, then read it again.', size: 'Board size', auto: 'Auto', parseCrop: 'Read selected board', cancel: 'Cancel', cropMissing: 'Select a rectangle around the board first.',
    reviewTitle: 'Review the import', uncertain: '{count} mark(s) need checking. Amber outlines identify uncertain cells; click to correct them.', reviewColors: 'Check the color regions and existing cats/X marks before solving.',
    enable: 'Enable', disable: 'Disable', colorName: 'Color {n}', importedName: 'Imported puzzle', resetTitle: 'Reset all marks?', resetHint: 'This removes cats and X marks. Colors stay in place, and Undo restores the marks.', resetConfirm: 'Reset marks',
    addColor: 'Add color', newColor: 'New region color',
    close: 'Close', cropAria: 'Select the puzzle board crop',
    helpKeyboard: 'Arrow keys move between cells. Space cycles a mark. C places a cat, X excludes a cell, Delete clears it.', history: 'Deduction history', emptyHistory: 'Your deductions will appear here.', sourceNo: 'No screenshot loaded.', dimensions: '{n} × {n}', busy: 'Please wait for the image to finish loading.',
  },
  de: {
    title: 'Cat Grid Solver', subtitle: 'Schritt für Schritt zur Lösung.', language: 'Sprache',
    importTitle: 'Screenshot importieren', importHint: 'Bild hier ablegen, Datei auswählen oder aus der Zwischenablage einfügen.', chooseFile: 'Bild auswählen', sample: 'Beispiel laden', local: 'Bilder bleiben auf deinem Gerät.',
    board: 'Spielfeld', sampleName: 'Beispiel · Gartenrätsel', cats: 'Katzen', open: 'unmarkierte Felder', steps: 'Lösungsschritte',
    generatorTitle: 'Rätsel erstellen', uniquePuzzle: 'Eindeutige Lösung', generatorHint: 'Wähle eine quadratische Größe und Schwierigkeit. Jedes Rätsel lässt sich mit den verfügbaren logischen Techniken lösen.', difficulty: 'Schwierigkeit', easy: 'Leicht', medium: 'Mittel', hard: 'Schwer', extreme: 'Extrem', generate: 'Rätsel erstellen', generating: 'Dein Rätsel wird erstellt und geprüft …', generatedName: 'Erstellt · {difficulty}', generatedEdited: 'Erstelltes Rätsel · bearbeitet', generatedTitle: 'Dein Rätsel ist bereit', generatedHint: 'Ein neues {size} × {size}-Rätsel mit genau einer Lösung. Nutze deine ausgewählten Techniken oder löse es selbst.', generationSuccess: '{size} × {size} · {difficulty} · eindeutige Lösung', generationCanceled: 'Erstellung abgebrochen. Dein aktuelles Feld bleibt erhalten.', generationExhausted: 'In der verfügbaren Zeit wurde kein passendes Rätsel gefunden. Versuche es erneut.', generationError: 'Das Rätsel konnte nicht erstellt werden. Dein aktuelles Feld bleibt erhalten; versuche es erneut.', generationSizeError: 'Wähle eine quadratische Größe von 4 × 4 bis 20 × 20.', difficultyHint: 'Leicht nutzt die Grundregeln. Höhere Stufen benötigen mehr oder stärkere fortgeschrittene Schritte. Die Schwierigkeit bezieht sich auf die Spielfeldgröße.',
    next: 'Nächster Lösungsschritt', undo: 'Rückgängig', redo: 'Wiederholen', reset: 'Markierungen zurücksetzen',
    applyAll: 'Alle aktuellen Schritte', allWorking: 'Aktuelle Lösungsschritte werden angewendet …', allApplied: 'Aktuelle Schritte angewendet', allSummary: '{steps} Lösungsschritte angewendet: {cats} Katze(n) gesetzt und {crosses} Feld(er) ausgeschlossen. {end}', allSolved: 'Jede Katze hat ein Zuhause.', allCurrentEnd: 'Neue Folgerungen warten auf deinen nächsten Klick.', allHint: 'Alle Schritte anwenden, die das Feld im jetzigen Zustand erlaubt. Neue Folgerungen warten auf den nächsten Klick. Rückgängig stellt das Feld vor diesem Durchlauf wieder her.', deductionConflict: 'Die aktuellen Markierungen führen zu widersprüchlichen Folgerungen. Prüfe Katzen, X-Markierungen und Farben, bevor du fortfährst.',
    run: 'So weit wie möglich', runWorking: 'Lösungsschritte werden angewendet, bis keine mehr möglich sind …', runApplied: 'Logische Schritte angewendet', allStuck: 'Mit den aktiven Techniken ist kein weiterer Schritt möglich.', runHint: 'Aktive Techniken anwenden, bis das Feld gelöst ist oder kein weiterer Schritt möglich ist. Ohne Raten. Rückgängig stellt das Feld vor dem gesamten Lauf wieder her.',
    techniques: 'Lösungstechniken', techniquesHint: 'Nur aktivierte Techniken werden verwendet.', basic: 'Grundlagen', advanced: 'Fortgeschritten', all: 'Alle an', none: 'Alle aus',
    welcomeTitle: 'Wo kommt die nächste Katze hin?', welcome: 'Wähle deine Techniken und wende den nächsten Lösungsschritt an. Ein Klick wechselt zwischen Katze, X und leer.',
    explanation: 'Letzter Lösungsschritt', evidence: 'Umrandete Felder erklären den Schritt; hervorgehobene Felder wurden geändert.',
    stuckTitle: 'Kein Lösungsschritt verfügbar', stuck: 'Die aktiven Techniken kommen nicht weiter. Aktiviere weitere Techniken oder prüfe das importierte Feld. Es wird nicht geraten.',
    offTitle: 'Technik auswählen', off: 'Aktiviere mindestens eine Lösungstechnik, um fortzufahren.', solvedTitle: 'Jede Katze hat ein Zuhause!', solved: 'Das Spielfeld erfüllt alle drei Regeln.',
    edit: 'Farben bearbeiten', editing: 'Spielfeld bearbeiten', cycle: 'Markierung wechseln', catTool: 'Katze', xTool: 'X', erase: 'Leeren', paint: 'Farbe', color: 'Farbe', labels: 'Farbbuchstaben anzeigen',
    inputTools: 'Eingabewerkzeuge für das Spielfeld', inputHint: 'Ziehen markiert X; starte auf einem X, um X zu entfernen. Rechtsklick setzt ebenfalls X. Ein Zug ist ein Rückgängig-Schritt. Escape bricht einen Zug ab.',
    catInputHint: 'Klicken oder Tippen setzt eine Katze. Ziehen setzt keine weiteren Katzen. Rechtsklick markiert X.', clearInputHint: 'Ziehen oder Wischen entfernt Markierungen, auch Katzen. Ein Zug ist ein Rückgängig-Schritt. Escape bricht einen Zug ab.', colorInputHint: 'Wähle unten eine Farbe und male ihre Fläche durch Ziehen oder Wischen. Ein Zug ist ein Rückgängig-Schritt. Escape bricht einen Zug ab.',
    rules: 'Eine Katze pro Zeile, Spalte und Farbe. Katzen dürfen sich nicht berühren, auch nicht diagonal.',
    manualTitle: 'Manuelle Änderung', manual: 'Du hast das Feld geändert. Die letzte Änderung kannst du rückgängig machen.',
    invalidTitle: 'Spielfeld prüfen', invalidBoard: 'Die Daten des Spielfelds sind ungültig.', colorCount: 'Es werden {expected} Farben erwartet, aber {count} wurden erkannt. Korrigiere die Farbflächen über „Farben bearbeiten“.', catConflict: 'Zwei Katzen teilen eine Zeile, Spalte oder Farbe oder berühren sich. Korrigiere die hervorgehobenen Katzen.', noCandidate: '{unit} hat keinen gültigen Platz für eine Katze mehr. Prüfe X-Markierungen und benachbarte Katzen.',
    changed: '{cats} Katze(n) gesetzt · {crosses} Feld(er) ausgeschlossen', row: 'Zeile {n}', column: 'Spalte {n}', region: 'Farbe {n}', cell: 'Zeile {r}, Spalte {c}', emptyMark: 'leer', catMark: 'Katze', xMark: 'X',
    touch: 'Die Katze in {cell} schließt alle benachbarten Felder aus, auch diagonal.',
    catUnit: 'In {unit} steht bereits eine Katze. Alle anderen Felder darin müssen X sein.',
    single: '{unit} hat nur noch ein unmarkiertes Feld. Dort muss die Katze stehen.',
    locked: 'Alle möglichen Positionen in {source} liegen in {target}. Die Katze reserviert diesen Schnittbereich; andere Felder in {target} müssen X sein.',
    overlap: 'Jede mögliche Position der Katze in {unit} berührt die hervorgehobenen Felder. Dort kann keine Katze stehen.',
    compatibility: 'Eine Katze in einem hervorgehobenen Feld würde alle übrigen Katzenplätze in {unit} blockieren: durch gleiche Zeile, Spalte, Farbe oder Berührung. Diese Felder müssen X sein.',
    groups: '{sources} brauchen {count} Katzen und können nur {targets} nutzen. Diese Linien oder Farben sind reserviert; die hervorgehobenen Felder sind X.',
    importing: 'Spielfeld wird erkannt …', importSuccess: 'Screenshot importiert. Prüfe Farben und Markierungen; jedes Feld lässt sich korrigieren.', importError: 'Dieses Bild konnte nicht gelesen werden. Versuche einen schärferen Screenshot oder passe den Ausschnitt an.', fileError: 'Wähle ein PNG-, JPEG- oder WebP-Bild.', tooLarge: 'Das Bild ist zu groß. Verwende ein Bild unter 25 MB.',
    screenshot: 'Original-Screenshot', adjust: 'Ausschnitt / Größe anpassen', hideSource: 'Screenshot ausblenden', showSource: 'Screenshot anzeigen',
    cropTitle: 'Spielfeld auswählen', cropHint: 'Ziehe einen Rahmen eng um das farbige Raster einschließlich der äußeren Felder. Bestätige die Größe und lies es erneut ein.', size: 'Spielfeldgröße', auto: 'Automatisch', parseCrop: 'Auswahl einlesen', cancel: 'Abbrechen', cropMissing: 'Wähle zuerst einen Rahmen um das Spielfeld.',
    reviewTitle: 'Import prüfen', uncertain: '{count} Markierung(en) müssen geprüft werden. Orange umrandete Felder sind unsicher; korrigiere sie per Klick.', reviewColors: 'Prüfe Farbflächen und vorhandene Katzen/X-Markierungen vor dem Lösen.',
    enable: 'Aktivieren', disable: 'Deaktivieren', colorName: 'Farbe {n}', importedName: 'Importiertes Rätsel', resetTitle: 'Alle Markierungen zurücksetzen?', resetHint: 'Katzen und X-Markierungen werden entfernt. Die Farben bleiben erhalten; Rückgängig stellt die Markierungen wieder her.', resetConfirm: 'Markierungen zurücksetzen',
    addColor: 'Farbe hinzufügen', newColor: 'Neue Flächenfarbe',
    close: 'Schließen', cropAria: 'Ausschnitt des Spielfelds auswählen',
    helpKeyboard: 'Pfeiltasten wechseln das Feld. Leertaste wechselt die Markierung. C setzt eine Katze, X schließt ein Feld aus, Entf leert es.', history: 'Lösungsverlauf', emptyHistory: 'Deine Lösungsschritte erscheinen hier.', sourceNo: 'Kein Screenshot geladen.', dimensions: '{n} × {n}', busy: 'Warte, bis das Bild vollständig geladen ist.',
  },
};

export function translate(lang, key, values = {}) {
  let text = copy[lang]?.[key] ?? copy.en[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`));
}
export const colorLetter = index => String.fromCharCode(65 + index);
export function unitName(lang, unit) { return translate(lang, unit.type, { n: unit.type === 'region' ? colorLetter(unit.index) : unit.index + 1 }); }
export function explain(lang, board, step) {
  const r = step.reason;
  const unit = { type: r.type, index: r.index };
  const values = {
    unit: r.type ? unitName(lang, unit) : '',
    cell: Number.isInteger(r.cat) ? translate(lang, 'cell', { r: Math.floor(r.cat / board.size) + 1, c: r.cat % board.size + 1 }) : '',
    source: r.source ? unitName(lang, r.source) : '', target: r.target ? unitName(lang, r.target) : '',
    sources: r.sourceIds ? r.sourceIds.map(index => unitName(lang, { type: r.sourceType, index })).join(', ') : '',
    targets: r.targetIds ? r.targetIds.map(index => unitName(lang, { type: r.targetType, index })).join(', ') : '', count: r.sourceIds?.length || 0,
  };
  return translate(lang, r.kind, values);
}
