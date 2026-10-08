// Hit every cell crossed by the pointer, including cells between sparse events.
export function cellsAlongSegment(from,to,rectangles) {
  const dx=to.x-from.x,dy=to.y-from.y,hits=[];
  for(const cell of rectangles) {
    let enter=0,exit=1;
    for(const [position,delta,min,max] of [[from.x,dx,cell.left+.1,cell.right-.1],[from.y,dy,cell.top+.1,cell.bottom-.1]]) {
      if(delta===0) { if(position<min||position>max) { enter=2; break; } }
      else {
        const a=(min-position)/delta,b=(max-position)/delta;
        enter=Math.max(enter,Math.min(a,b)); exit=Math.min(exit,Math.max(a,b));
      }
    }
    if(enter<=exit) hits.push({index:cell.index,enter});
  }
  return hits.sort((a,b)=>a.enter-b.enter).map(hit=>hit.index);
}

export function applyBrush(board,indices,brush) {
  const marks=[...board.marks],regions=[...board.regions],suspected=marks.map((mark,index)=>mark===0&&Boolean(board.suspected?.[index])),changed=[],reviewed=[];
  for(const index of new Set(indices)) {
    if(!Number.isInteger(index)||index<0||index>=marks.length) continue;
    // Personal hints remain ordinary empty cells for the solver, but are
    // protected from manual exclusion strokes, just like confirmed cats.
    if(brush.tool==='x'&&(marks[index]===1||suspected[index])) continue;
    if(brush.tool==='suspected'&&marks[index]===1) continue;
    if(brush.tool==='suspected'&&!brush.value&&!suspected[index]) continue;
    if(brush.tool!=='suspected') reviewed.push(index);
    if(brush.tool==='paint') {
      if(regions[index]!==brush.color) { regions[index]=brush.color; changed.push(index); }
    } else if(brush.tool==='suspected') {
      const value=Boolean(brush.value);
      if(marks[index]!==0||suspected[index]!==value) { marks[index]=0; suspected[index]=value; changed.push(index); }
    } else {
      const value=brush.tool==='erase'?0:brush.value;
      if(marks[index]!==value||suspected[index]) { marks[index]=value; suspected[index]=false; changed.push(index); }
    }
  }
  const next={...board,marks,regions,suspected};
  if(brush.tool==='paint'&&changed.length&&board.generation) next.generation={...board.generation,edited:true};
  return {board:next,changed,reviewed};
}
