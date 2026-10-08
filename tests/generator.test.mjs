import test from 'node:test';
import assert from 'node:assert/strict';
import {generatePuzzle,ratePuzzle,difficulties,regionsConnected} from '../dist/generator.js';
import {resolveUntilStuck,validateBoard,techniques} from '../dist/solver.js';

// Independent exact search: choose the most constrained unfilled row and
// enumerate placements. This does not use the app's deductions or rating code.
function solutionCount(board,limit=2) {
  const n=board.size,rows=new Map(),columns=new Set(),colors=new Set();
  let count=0;
  function visit() {
    if(rows.size===n) { count++; return; }
    let selected=-1,candidates=null;
    for(let r=0;r<n;r++) if(!rows.has(r)) {
      const cells=[];
      for(let c=0;c<n;c++) {
        const color=board.regions[r*n+c];
        if(columns.has(c)||colors.has(color)) continue;
        if(rows.has(r-1)&&Math.abs(c-rows.get(r-1))<=1 || rows.has(r+1)&&Math.abs(c-rows.get(r+1))<=1) continue;
        cells.push(c);
      }
      if(!cells.length) return;
      if(!candidates||cells.length<candidates.length) { selected=r; candidates=cells; }
    }
    for(const c of candidates) {
      const color=board.regions[selected*n+c];
      rows.set(selected,c); columns.add(c); colors.add(color);
      visit();
      rows.delete(selected); columns.delete(c); colors.delete(color);
      if(count>=limit) return;
    }
  }
  visit(); return count;
}

const basic=techniques.filter(technique=>technique.level==='basic').map(technique=>technique.id);
const medium=[...basic,'locked','overlap'];

test('all four levels produce empty, connected, unique puzzles at small and large sizes',()=>{
  for(const size of [4,8,12,20]) for(const difficulty of difficulties) {
    const {board,rating}=generatePuzzle({size,difficulty,seed:812381,maxMs:60000});
    assert.equal(board.size,size);
    assert.equal(board.regions.length,size*size);
    assert.equal(new Set(board.regions).size,size);
    assert.equal(new Set(board.colors).size,size);
    assert.ok(board.colors.every(color=>/^#[a-f0-9]{6}$/.test(color)));
    assert.ok(board.marks.every(mark=>mark===0));
    assert.ok(regionsConnected(board));
    assert.ok(validateBoard(board).valid);
    assert.equal(solutionCount(board),1,`${size}×${size} ${difficulty} must have exactly one solution`);
    assert.equal(resolveUntilStuck(board).status,'solved');
    assert.equal(ratePuzzle(board).difficulty,difficulty);
    assert.deepEqual(ratePuzzle(board),rating);
    if(difficulty==='easy') assert.equal(resolveUntilStuck(board,basic).status,'solved');
    else assert.equal(resolveUntilStuck(board,basic).status,'stuck');
    if(difficulty==='medium') { assert.ok(rating.score>=1&&rating.score<=2); assert.equal(resolveUntilStuck(board,medium).status,'solved'); }
    if(difficulty==='hard') assert.ok(rating.score>=3&&rating.score<=4);
    if(difficulty==='extreme') assert.ok(rating.score>=5);
  }
});

test('seeds are reproducible and fresh seeds produce distinct layouts',()=>{
  const layouts=new Set();
  for(const seed of [0,1,42,81393,0xffffffff]) {
    const options={size:7,difficulty:'medium',seed,maxMs:60000};
    const first=generatePuzzle(options),second=generatePuzzle(options);
    assert.deepEqual(first,second);
    assert.equal(solutionCount(first.board),1);
    layouts.add(first.board.regions.join(','));
  }
  assert.equal(layouts.size,5);
});

test('invalid sizes, levels, seeds, and exhausted searches fail without a substitute puzzle',()=>{
  for(const size of [2,3,21,4.5,NaN]) assert.throws(()=>generatePuzzle({size}),RangeError);
  assert.throws(()=>generatePuzzle({difficulty:'impossible'}),RangeError);
  assert.throws(()=>generatePuzzle({seed:-1}),RangeError);
  assert.throws(()=>generatePuzzle({seed:2**32}),RangeError);
  assert.throws(()=>generatePuzzle({maxAttempts:0}),RangeError);
  assert.throws(()=>generatePuzzle({maxMs:0}),RangeError);
  assert.throws(()=>generatePuzzle({size:8,difficulty:'extreme',seed:812381,maxAttempts:1}),{code:'generationExhausted'});
  const ambiguous={size:5,colors:Array(5).fill('#aabbcc'),regions:Array.from({length:25},(_,i)=>Math.floor(i/5)),marks:Array(25).fill(0)};
  assert.equal(ratePuzzle(ambiguous),null);
});
