import test from 'node:test';
import assert from 'node:assert/strict';
import { example, cloneBoard } from '../dist/example.js';
import { techniques, findNextDeduction, applyDeduction, validateBoard, neighbors, resolveCurrent, resolveUntilStuck } from '../dist/solver.js';

// Independent exhaustive oracle, used only in tests; the app never guesses.
function solutions(board) {
  const result = [];
  function visit(row, cats, columns, colors) {
    if (row === board.size) { result.push(cats); return; }
    const fixed = board.marks.flatMap((mark, i) => mark === 1 && Math.floor(i / board.size) === row ? [i] : []);
    for (let column = 0; column < board.size; column++) {
      const index = row * board.size + column, color = board.regions[index];
      if (fixed.length && !fixed.includes(index) || board.marks[index] === -1 || columns.has(column) || colors.has(color)) continue;
      if (row && Math.abs(column - cats[row - 1] % board.size) <= 1) continue;
      visit(row + 1, [...cats,index], new Set([...columns,column]), new Set([...colors,color]));
    }
  }
  visit(0, [], new Set(), new Set()); return result;
}

test('adjacency includes diagonals and stays within the board', () => {
  assert.deepEqual(neighbors(0,4), [1,4,5]);
  assert.equal(neighbors(5,4).length,8);
});

test('sample is solved by logical steps with no guessing', () => {
  let board = cloneBoard(example), result, steps = 0;
  while ((result = findNextDeduction(board)).status === 'step') {
    assert.ok(++steps < 200); board = applyDeduction(board, result.step); assert.equal(validateBoard(board).valid,true);
  }
  assert.equal(result.status,'solved');
  assert.deepEqual(board.marks.flatMap((mark,index) => mark === 1 ? [index] : []), [1,12,23,26,37,40,51,62]);
});

test('disabling techniques never applies an unselected trick', () => {
  assert.equal(findNextDeduction(cloneBoard(example), []).status,'stuck');
  const board = cloneBoard(example); board.marks[1] = 1;
  const result = findNextDeduction(board, ['row-cat']);
  assert.equal(result.step.technique,'row-cat');
  assert.ok(result.step.changes.every(change => Math.floor(change.index / board.size) === 0));
  assert.ok(result.step.changes.every(change => change.value === -1));
  assert.equal(findNextDeduction(board,[]).status,'stuck');
});

test('all current deductions use one board snapshot, respect switches, and do not cascade', () => {
  const board = cloneBoard(example);
  const result = resolveCurrent(board);
  assert.equal(result.status,'step'); assert.ok(result.steps.length>1);
  assert.deepEqual(result.board.marks.flatMap((mark,index)=>mark===1?[index]:[]),[12,62]);
  assert.notEqual(findNextDeduction(result.board).status,'solved');
  assert.ok(board.marks.every(mark=>mark===0));
  const limited = resolveCurrent(board,['overlap']);
  assert.equal(limited.status,'step'); assert.ok(limited.steps.length>0);
  assert.ok(limited.steps.every(step=>step.technique==='overlap'));
  assert.equal(resolveCurrent(board,[]).steps.length,0);
  const withCat=cloneBoard(example);withCat.marks[1]=1;
  const onePass=resolveCurrent(withCat,['touch','row-cat','region-single']);
  assert.deepEqual(onePass.board.marks.flatMap((mark,index)=>mark===1?[index]:[]),[1,12,62]);
  const cascade={size:4,colors:Array(4).fill('#aabbcc'),regions:[1,0,0,0,0,0,0,1,2,2,2,2,3,3,3,3],marks:Array(16).fill(0)};
  cascade.marks[1]=1;
  const snapshot=resolveCurrent(cascade,['row-cat','region-single']);
  assert.equal(snapshot.board.marks[7],0);
  assert.equal(findNextDeduction(snapshot.board,['region-single']).step.changes[0].index,7);
});

test('the third mode chains until solved or stuck and never uses disabled techniques', () => {
  const board=cloneBoard(example),solved=resolveUntilStuck(board);
  assert.equal(solved.status,'solved');assert.ok(solved.steps.length>1);
  assert.ok(board.marks.every(mark=>mark===0));
  const limited=resolveUntilStuck(board,['overlap']);
  assert.equal(limited.status,'stuck');assert.ok(limited.steps.every(step=>step.technique==='overlap'));
  assert.equal(findNextDeduction(limited.board,['overlap']).status,'stuck');
});

test('invalid cats, exhausted units, and incorrect color counts are detected', () => {
  const board = cloneBoard(example); board.marks[0] = 1; board.marks[example.size+1] = 1;
  assert.equal(validateBoard(board).code, 'catConflict');
  const exhausted = cloneBoard(example); exhausted.marks.fill(-1,0,example.size);
  assert.equal(validateBoard(exhausted).code,'noCandidate');
  const colors = cloneBoard(example); colors.regions = colors.regions.map(region => region === example.size-1 ? 0 : region);
  assert.equal(validateBoard(colors).code,'colorCount');
});

test('the solver leaves an ambiguous board without inventing a cat', () => {
  const board = {size:5, colors:Array(5).fill('#aabbcc'), regions:Array.from({length:25},(_,i)=>Math.floor(i/5)), marks:Array(25).fill(0)};
  assert.ok(solutions(board).length > 1);
  assert.equal(findNextDeduction(board).status,'stuck');
});

test('personal hints never affect validation, selected deductions, snapshot passes, or chained solving',()=>{
  const plain=cloneBoard(example),hinted={...cloneBoard(example),suspected:Array(example.marks.length).fill(true)};
  assert.deepEqual(validateBoard(hinted),validateBoard(plain));
  for(const technique of techniques) assert.deepEqual(findNextDeduction(hinted,[technique.id]),findNextDeduction(plain,[technique.id]));
  assert.equal(findNextDeduction(hinted,[]).status,'stuck');
  for(const solve of [resolveCurrent,resolveUntilStuck]) {
    const expected=solve(plain),actual=solve(hinted);
    assert.equal(actual.status,expected.status);assert.deepEqual(actual.steps,expected.steps);assert.deepEqual(actual.board.marks,expected.board.marks);
    for(const step of actual.steps) for(const {index} of step.changes) assert.equal(actual.board.suspected[index],false);
    assert.ok(hinted.suspected.every(Boolean),'solving must not mutate hints in the input or Undo snapshot');
  }
  const first=findNextDeduction(hinted),changed=applyDeduction(hinted,first.step);
  assert.equal(changed.suspected[12],false);assert.equal(changed.marks[12],1);
  assert.equal(changed.suspected[0],true,'unresolved hints stay visible');
});

test('every technique is sound against all solutions of seeded variable-size boards', () => {
  let seed = 87231;
  const random = () => { seed = (Math.imul(seed,1664525)+1013904223)>>>0; return seed / 2**32; };
  const covered = new Set();
  for (const size of [4,5,6,7]) {
    const base = {size,colors:Array(size).fill('#aabbcc'),regions:Array.from({length:size*size},(_,i)=>Math.floor(i/size)),marks:Array(size*size).fill(0)};
    const placements = solutions(base);
    for (let iteration = 0; iteration < 50; iteration++) {
      const cats = placements[Math.floor(random()*placements.length)];
      const board = {...base,regions:base.regions.map(()=>Math.floor(random()*size)),marks:[...base.marks]};
      cats.forEach((index,row) => {board.regions[index]=row;});
      for (let i=0;i<board.marks.length;i++) if (!cats.includes(i) && random()<.45) board.marks[i]=-1;
      cats.forEach(index => { if(random()<.2)board.marks[index]=1; });
      const possible = solutions(board); assert.ok(possible.length);
      for (const technique of techniques) {
        const result = findNextDeduction(board,[technique.id]);
        if(result.status !== 'step')continue;
        covered.add(technique.id);
        for(const change of result.step.changes)for(const solution of possible)assert.equal(solution.includes(change.index),change.value===1, `${technique.id} made an unsound change on a ${size}×${size} board`);
      }
      const batch=resolveCurrent(board);assert.notEqual(batch.status,'invalid');
      for(const step of batch.steps)for(const change of step.changes)for(const solution of possible)assert.equal(solution.includes(change.index),change.value===1,'Snapshot batch made an unsound deduction');
    }
  }
  assert.deepEqual([...covered].sort(), techniques.map(technique=>technique.id).sort());
});
