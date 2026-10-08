// Screenshot recognition is deterministic and runs entirely in the browser.
// The pixel core is also usable in Node for regression tests without a browser.
const distance = (a,b) => Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const hex = color => '#' + color.map(value => Math.max(0,Math.min(255,Math.round(value))).toString(16).padStart(2,'0')).join('');
const rgb = (pixels,x,y) => { const i=(Math.max(0,Math.min(pixels.height-1,Math.round(y)))*pixels.width+Math.max(0,Math.min(pixels.width-1,Math.round(x))))*4; return [pixels.data[i],pixels.data[i+1],pixels.data[i+2]]; };

function boundedCrop(pixels,crop) {
  if(!crop)return {x:0,y:0,width:pixels.width,height:pixels.height};
  if(![crop.x,crop.y,crop.width,crop.height].every(Number.isFinite) || crop.width<8 || crop.height<8)throw new Error('Invalid crop');
  const x=Math.max(0,Math.floor(crop.x)),y=Math.max(0,Math.floor(crop.y));
  return {x,y,width:Math.min(pixels.width-x,Math.ceil(crop.width)),height:Math.min(pixels.height-y,Math.ceil(crop.height))};
}

export function coloredComponents(pixels,crop) {
  const {width,height,data}=pixels, mask=new Uint8Array(width*height);
  for(let y=crop.y;y<crop.y+crop.height;y++)for(let x=crop.x;x<crop.x+crop.width;x++) {
    const index=y*width+x,k=index*4,r=data[k],g=data[k+1],b=data[k+2],max=Math.max(r,g,b),min=Math.min(r,g,b);
    if(data[k+3]>200 && ((max-min>18&&max>75)||(max<232&&max>60)))mask[index]=1;
  }
  const queue=new Int32Array(width*height),result=[];
  for(let y=crop.y;y<crop.y+crop.height;y++)for(let x=crop.x;x<crop.x+crop.width;x++) {
    const initial=y*width+x;if(!mask[initial])continue;
    let head=0,tail=1,minX=x,maxX=x,minY=y,maxY=y;queue[0]=initial;mask[initial]=0;
    while(head<tail) {
      const index=queue[head++],cy=Math.floor(index/width),cx=index%width;
      minX=Math.min(minX,cx);maxX=Math.max(maxX,cx);minY=Math.min(minY,cy);maxY=Math.max(maxY,cy);
      for(const neighbor of [cx>0?index-1:-1,cx<width-1?index+1:-1,cy>0?index-width:-1,cy<height-1?index+width:-1]) {
        if(neighbor>=0&&mask[neighbor]){mask[neighbor]=0;queue[tail++]=neighbor;}
      }
    }
    const w=maxX-minX+1,h=maxY-minY+1;
    if(w>=7&&h>=7&&w/h>.65&&w/h<1.55&&tail/(w*h)>.45)result.push({x:minX,y:minY,width:w,height:h,cx:(minX+maxX)/2,cy:(minY+maxY)/2,side:(w+h)/2});
  }
  return result;
}

function centers(values,tolerance) {
  const sorted=[...values].sort((a,b)=>a-b),groups=[];
  for(const value of sorted) {
    const last=groups.at(-1);
    if(last&&Math.abs(value-last.mean)<tolerance){last.values.push(value);last.mean=last.values.reduce((a,b)=>a+b,0)/last.values.length;}
    else groups.push({mean:value,values:[value]});
  }
  return groups.map(group=>group.values[Math.floor(group.values.length/2)]);
}

function regularRuns(values,side,forcedSize) {
  const result=[];
  for(let start=0;start<values.length-1;start++) {
    for(let second=start+1;second<values.length;second++) {
      const pitch=values[second]-values[start];
      if(pitch<side*.85||pitch>side*1.6)continue;
      const run=[values[start]];
      for(let count=2;count<=20;count++) {
        const expected=values[start]+(count-1)*pitch;
        const candidate=values.filter(value=>value>run.at(-1)&&Math.abs(value-expected)<pitch*.18).sort((a,b)=>Math.abs(a-expected)-Math.abs(b-expected))[0];
        if(candidate===undefined)break;
        run.push(candidate);
        if(!forcedSize||count===forcedSize)result.push({values:[...run],pitch,size:count});
      }
    }
  }
  return result;
}

export function locateGrid(pixels,{crop=null,size=0}={}) {
  const selection=boundedCrop(pixels,crop),components=coloredComponents(pixels,selection);
  const sideSeeds=[...new Set(components.map(component=>Math.round(component.side/3)*3))];
  let best=null;
  for(const side of sideSeeds) {
    const family=components.filter(component=>Math.abs(component.side-side)<side*.18);
    if(family.length<4)continue;
    const xRuns=regularRuns(centers(family.map(c=>c.cx),side*.35),side,size);
    const yRuns=regularRuns(centers(family.map(c=>c.cy),side*.35),side,size);
    for(const xs of xRuns)for(const ys of yRuns) {
      if(xs.size!==ys.size||Math.abs(xs.pitch-ys.pitch)>Math.max(xs.pitch,ys.pitch)*.18)continue;
      let hits=0;
      for(const cy of ys.values)for(const cx of xs.values)if(family.some(component=>Math.abs(component.cx-cx)<side*.3&&Math.abs(component.cy-cy)<side*.3))hits++;
      const occupancy=hits/(xs.size*ys.size);
      if(occupancy<.86)continue;
      const score=hits*side*side*occupancy;
      if(!best||score>best.score)best={size:xs.size,xs:xs.values,ys:ys.values,pitchX:xs.pitch,pitchY:ys.pitch,tileWidth:side,tileHeight:side,score};
    }
  }
  if(!best&&crop&&size>=2&&size<=20) {
    const pitchX=selection.width/size,pitchY=selection.height/size;
    best={size,xs:Array.from({length:size},(_,i)=>selection.x+(i+.5)*pitchX),ys:Array.from({length:size},(_,i)=>selection.y+(i+.5)*pitchY),pitchX,pitchY,tileWidth:pitchX*.88,tileHeight:pitchY*.88,score:0};
  }
  if(!best)throw new Error('No square colored grid detected');
  best.crop={x:Math.max(0,best.xs[0]-best.pitchX/2),y:Math.max(0,best.ys[0]-best.pitchY/2),width:best.pitchX*best.size,height:best.pitchY*best.size};
  return best;
}

function backgroundColor(pixels,cx,cy,width,height) {
  const bins=new Map(),samples=[];
  const stride=Math.max(1,Math.floor(Math.min(width,height)/36));
  for(let y=cy-height*.37;y<cy+height*.37;y+=stride)for(let x=cx-width*.37;x<cx+width*.37;x+=stride) {
    const color=rgb(pixels,x,y),max=Math.max(...color),min=Math.min(...color);
    // Favor tile paint over dark cats, bright X marks, and JPEG edge artifacts.
    if(max<65||min>245)continue;
    const key=color.map(value=>Math.round(value/12)).join(',');
    if(!bins.has(key))bins.set(key,{color,count:0});bins.get(key).count++;samples.push(color);
  }
  const winner=[...bins.values()].sort((a,b)=>b.count-a.count)[0];
  if(!winner)return {color:rgb(pixels,cx,cy),uncertain:true};
  const near=samples.filter(color=>distance(color,winner.color)<20);
  const color=[0,1,2].map(channel=>near.reduce((sum,sample)=>sum+sample[channel],0)/near.length);
  return {color,uncertain:winner.count/samples.length<.18};
}

export function classifyMark(pixels,{cx,cy,width,height},background) {
  const points=[], stride=Math.max(1,Math.floor(Math.min(width,height)/60));
  let samples=0;
  for(let y=cy-height*.34;y<=cy+height*.34;y+=stride)for(let x=cx-width*.34;x<=cx+width*.34;x+=stride) {
    const color=rgb(pixels,x,y);samples++;
    if(distance(color,background)>48)points.push({x,y,color});
  }
  const ratio=points.length/samples;
  if(ratio<.009)return {mark:0,uncertain:false,confidence:1-ratio};
  const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
  const w=maxX-minX+stride,h=maxY-minY+stride;
  if(w<width*.1||h<height*.1)return {mark:0,uncertain:true,confidence:.3};
  let diagonal=0;const arms=[0,0,0,0];
  for(const point of points) {
    const x=(point.x-minX)/w,y=(point.y-minY)/h;
    if(Math.min(Math.abs(x-y),Math.abs(x+y-1))<.155)diagonal++;
    if(x<.35&&y<.35)arms[0]++;if(x>.65&&y<.35)arms[1]++;if(x<.35&&y>.65)arms[2]++;if(x>.65&&y>.65)arms[3]++;
  }
  const diagonality=diagonal/points.length,aspect=w/h;
  if(diagonality>.76&&arms.every(count=>count>points.length*.025)&&aspect>.6&&aspect<1.65)return {mark:-1,uncertain:false,confidence:diagonality};
  const fill=points.length*stride*stride/(w*h);
  if(ratio>.05&&fill>.28&&diagonality<.72)return {mark:1,uncertain:false,confidence:Math.min(.96,.65+ratio)};
  return {mark:diagonality>.7?-1:ratio>.04?1:0,uncertain:true,confidence:.45};
}

export function parsePixels(pixels,options={}) {
  if(!Number.isInteger(pixels.width)||!Number.isInteger(pixels.height)||pixels.data.length!==pixels.width*pixels.height*4)throw new Error('Invalid pixels');
  const grid=locateGrid(pixels,options),palette=[],regions=[],marks=[],uncertain=[];
  for(let r=0;r<grid.size;r++)for(let c=0;c<grid.size;c++) {
    const box={cx:grid.xs[c],cy:grid.ys[r],width:grid.tileWidth,height:grid.tileHeight};
    const sample=backgroundColor(pixels,box.cx,box.cy,box.width,box.height);
    let bestIndex=-1,bestDistance=Infinity;
    palette.forEach((entry,index)=>{const d=distance(entry.color,sample.color);if(d<bestDistance){bestIndex=index;bestDistance=d;}});
    if(bestDistance>27){bestIndex=palette.length;palette.push({color:sample.color,count:1});}
    else {const entry=palette[bestIndex];entry.color=entry.color.map((value,k)=>(value*entry.count+sample.color[k])/(entry.count+1));entry.count++;}
    regions.push(bestIndex);
    const mark=classifyMark(pixels,box,sample.color);marks.push(mark.mark);
    if(mark.uncertain||sample.uncertain)uncertain.push(r*grid.size+c);
  }
  if(palette.length<2||palette.length>26)throw new Error('Could not separate board colors');
  return {board:{size:grid.size,name:'',colors:palette.map(entry=>hex(entry.color)),regions,marks},crop:grid.crop,uncertain};
}

export async function loadImage(input) {
  const url=input instanceof Blob?URL.createObjectURL(input):input;
  const image=new Image();
  try {
    await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('Image cannot be decoded'));image.src=url;});
    if(!image.naturalWidth||!image.naturalHeight)throw new Error('Empty image');
    return {image,url};
  } catch(error) {if(input instanceof Blob)URL.revokeObjectURL(url);throw error;}
}

export function parseScreenshot(image,{crop=null,size=0}={}) {
  const scale=Math.min(1,2200/Math.max(image.naturalWidth||image.width,image.naturalHeight||image.height));
  const canvas=document.createElement('canvas');canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);
  const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0,canvas.width,canvas.height);
  const scaledCrop=crop?{x:crop.x*scale,y:crop.y*scale,width:crop.width*scale,height:crop.height*scale}:null;
  const result=parsePixels(context.getImageData(0,0,canvas.width,canvas.height),{crop:scaledCrop,size});
  result.crop={x:result.crop.x/scale,y:result.crop.y/scale,width:result.crop.width/scale,height:result.crop.height/scale};
  return result;
}
