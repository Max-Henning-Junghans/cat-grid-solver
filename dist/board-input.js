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
  const marks=[...board.marks],regions=[...board.regions],changed=[],reviewed=[];
  for(const index of new Set(indices)) {
    if(!Number.isInteger(index)||index<0||index>=marks.length) continue;
    // Exclusion strokes never replace a cat, including an X-erasing stroke.
    if(brush.tool==='x'&&marks[index]===1) continue;
    reviewed.push(index);
    if(brush.tool==='paint') {
      if(regions[index]!==brush.color) { regions[index]=brush.color; changed.push(index); }
    } else {
      const value=brush.tool==='erase'?0:brush.value;
      if(marks[index]!==value) { marks[index]=value; changed.push(index); }
    }
  }
  const next={...board,marks,regions};
  if(brush.tool==='paint'&&changed.length&&board.generation) next.generation={...board.generation,edited:true};
  return {board:next,changed,reviewed};
}
