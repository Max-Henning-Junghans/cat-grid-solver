import {resolveUntilStuck, validateBoard} from './solver.js';

export const difficulties = ['easy', 'medium', 'hard', 'extreme'];
const weights = {locked: 1, overlap: 1, pairs: 3, compatibility: 5};

function analyze(board) {
  const result = resolveUntilStuck(board);
  if(result.status !== 'solved') return null;
  const advancedSteps = result.steps.filter(step => weights[step.technique]);
  const score = advancedSteps.reduce((sum,step) => sum + weights[step.technique],0);
  return {
    difficulty: score === 0 ? 'easy' : score <= 2 ? 'medium' : score <= 4 ? 'hard' : 'extreme',
    score, advancedSteps: advancedSteps.length, totalSteps: result.steps.length,
    solution: result.board.marks.flatMap((mark,index) => mark === 1 ? [index] : []),
  };
}

export function ratePuzzle(board) {
  const result = analyze(board);
  if(!result) return null;
  const {solution, ...rating} = result;
  return rating;
}

function randomSource(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state,1664525) + 1013904223) >>> 0;
    return state / 2**32;
  };
}

function shuffle(items, random) {
  for(let i=items.length-1;i>0;i--) {
    const j=Math.floor(random()*(i+1));
    [items[i],items[j]]=[items[j],items[i]];
  }
  return items;
}

function placement(size, random) {
  const columns=[];
  function visit(row) {
    if(row===size) return true;
    for(const column of shuffle(Array.from({length:size},(_,i)=>i),random)) {
      if(columns.includes(column) || row && Math.abs(column-columns[row-1])<=1) continue;
      columns.push(column);
      if(visit(row+1)) return true;
      columns.pop();
    }
    return false;
  }
  if(!visit(0)) throw new Error('No legal placement');
  return columns;
}

function adjacent(index,size) {
  return [index%size>0?index-1:-1,index%size<size-1?index+1:-1,index>=size?index-size:-1,index<size*(size-1)?index+size:-1].filter(i=>i>=0);
}

function grow(size, random) {
  const columns=placement(size,random), regions=Array(size*size).fill(-1);
  const growth=columns.map(()=>.005+random()**5*3);
  columns.forEach((column,row)=>{ regions[row*size+column]=row; });
  // Each region grows from its cat through shared edges, so it stays connected.
  for(let remaining=size*size-size;remaining>0;remaining--) {
    const frontier=[];
    for(let i=0;i<regions.length;i++) if(regions[i]>=0) {
      for(const neighbor of adjacent(i,size)) if(regions[neighbor]===-1) frontier.push({index:neighbor,region:regions[i]});
    }
    let choice=random()*frontier.reduce((sum,edge)=>sum+growth[edge.region],0);
    let selected=frontier.at(-1);
    for(const edge of frontier) {
      choice-=growth[edge.region];
      if(choice<0) { selected=edge; break; }
    }
    regions[selected.index]=selected.region;
  }
  return {size,name:'',colors:Array(size).fill('#aabbcc'),regions,marks:Array(size*size).fill(0)};
}

export function regionsConnected(board) {
  for(const region of new Set(board.regions)) {
    const cells=board.regions.flatMap((value,index)=>value===region?[index]:[]), visited=new Set([cells[0]]), queue=[cells[0]];
    for(let i=0;i<queue.length;i++) for(const neighbor of adjacent(queue[i],board.size)) {
      if(board.regions[neighbor]===region&&!visited.has(neighbor)) { visited.add(neighbor); queue.push(neighbor); }
    }
    if(visited.size!==cells.length) return false;
  }
  return true;
}

function insertion(board, row, column) {
  const n=board.size, size=n+1, regions=[];
  for(let r=0;r<size;r++) for(let c=0;c<size;c++) {
    if(r===row&&c===column) { regions.push(n); continue; }
    // Bridge matching old neighbors through the inserted row/column. Every
    // original edge within a region stays connected through that bridge.
    const oldRow=r===row?Math.max(0,row-1):r-(r>row?1:0);
    const oldColumn=c===column?Math.max(0,column-1):c-(c>column?1:0);
    regions.push(board.regions[oldRow*n+oldColumn]);
  }
  return {size,name:'',colors:Array(size).fill('#aabbcc'),regions,marks:Array(size*size).fill(0)};
}

function enlarge(board, analysis, requested, random, expired) {
  while(board.size<requested) {
    const n=board.size, positions=[];
    for(let row=0;row<=n;row++) for(let column=0;column<=n;column++) {
      const safe=analysis.solution.every(index=>{
        const r=Math.floor(index/n),c=index%n;
        return Math.abs(row-(r+(r>=row?1:0)))>1 || Math.abs(column-(c+(c>=column?1:0)))>1;
      });
      if(safe) positions.push([row,column]);
    }
    let accepted=false;
    for(const [row,column] of shuffle(positions,random)) {
      if(expired()) return null;
      const candidate=insertion(board,row,column), rating=analyze(candidate);
      if(rating?.difficulty!==analysis.difficulty || !regionsConnected(candidate)) continue;
      board=candidate; analysis=rating; accepted=true; break;
    }
    if(!accepted) return null;
  }
  return {board,analysis};
}

function palette(size,random) {
  const offset=random()*360;
  return shuffle(Array.from({length:size},(_,i)=>{
    const h=((offset+i*360/size)%360)/60,s=.55,l=i%2?.7:.6;
    const a=s*Math.min(l,1-l);
    return '#'+[0,8,4].map(n=>{
      const k=(n+h*2)%12;
      return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1)))).toString(16).padStart(2,'0');
    }).join('');
  }),random);
}

export function generatePuzzle({size=8,difficulty='medium',seed=Date.now()>>>0,maxAttempts=12000,maxMs=20000,onProgress=()=>{}}={}) {
  if(!Number.isInteger(size)||size<4||size>20) throw new RangeError('Generation size must be between 4 and 20');
  if(!difficulties.includes(difficulty)) throw new RangeError('Unknown difficulty');
  if(!Number.isInteger(seed)||seed<0||seed>0xffffffff) throw new RangeError('Invalid seed');
  if(!Number.isInteger(maxAttempts)||maxAttempts<1||!Number.isFinite(maxMs)||maxMs<=0) throw new RangeError('Invalid generation budget');
  const random=randomSource(seed), start=performance.now(), expired=()=>performance.now()-start>=maxMs;
  let lastProgress=start;
  for(let attempt=1;attempt<=maxAttempts&&!expired();attempt++) {
    // Grow fresh layouts on smaller grids, then insert safe cats and connected
    // bridges for large sizes. Re-rate every expansion; never relabel a puzzle.
    let board=grow(Math.min(size,8),random), analysis=analyze(board);
    if(analysis?.difficulty===difficulty) {
      const expanded=enlarge(board,analysis,size,random,expired);
      if(expanded) {
        board=expanded.board; analysis=expanded.analysis;
        const order=[...new Set(board.regions)];
        board.regions=board.regions.map(region=>order.indexOf(region));
        board.colors=palette(size,random);
        // A complete sequence of sound deductions fixes every cat, certifying
        // uniqueness without accepting an arbitrary solution from a search.
        const proof=analyze(board);
        if(proof?.difficulty!==difficulty || !regionsConnected(board) || !validateBoard(board).valid) continue;
        const {solution,...rating}=proof;
        board.generation={...rating,seed,unique:true};
        return {board,rating,attempts:attempt};
      }
    }
    if(performance.now()-lastProgress>250) { onProgress({attempts:attempt}); lastProgress=performance.now(); }
  }
  const error=new Error('Could not generate a puzzle at the requested difficulty within the time limit');
  error.code='generationExhausted';
  throw error;
}
