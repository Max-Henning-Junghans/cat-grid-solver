import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {parsePixels,classifyMark} from '../dist/importer.js';
import {example} from '../dist/example.js';

function fixture(name) {
  return {...JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`,import.meta.url),'utf8')),data:gunzipSync(readFileSync(new URL(`./fixtures/${name}.rgba.gz`,import.meta.url)))};
}

function syntheticBoard(size,side=40) {
  const width=size*(side+4)+34,height=width+90,data=new Uint8ClampedArray(width*height*4).fill(255);
  const colors=Array.from({length:size},(_,index)=>{
    const hue=index/size*6,sector=Math.floor(hue),f=hue-sector,a=205,b=70,c=Math.round(70+135*f),d=Math.round(205-135*f);
    return [[a,c,b],[d,a,b],[b,a,c],[b,d,a],[c,b,a],[a,b,d]][sector%6];
  });
  const setPixel=(x,y,color)=>data.set([...color,255],(y*width+x)*4);
  for(let row=0;row<size;row++)for(let column=0;column<size;column++) {
    const color=colors[row];
    for(let y=0;y<side;y++)for(let x=0;x<side;x++)setPixel(18+column*(side+4)+x,105+row*(side+4)+y,color);
  }
  // Add unrelated small squares to exercise grid selection.
  for(let row=0;row<3;row++)for(let column=0;column<3;column++)for(let y=0;y<10;y++)for(let x=0;x<10;x++)setPixel(20+column*13+x,20+row*13+y,[160,120,90]);
  return {width,height,data,colors};
}

function markedTile(side,mark,{background=[151,120,214],ink=[255,255,255],stroke=.09,offset=0,noise=.4}={}) {
  const data=new Uint8ClampedArray(side*side*4);
  const segmentDistance=(x,y,a,b)=>{
    const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));
    return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);
  };
  for(let y=0;y<side;y++)for(let x=0;x<side;x++) {
    const u=(x+.5)/side-.5-offset,v=(y+.5)/side-.5+offset;
    let color=background;
    if(mark==='x') {
      const d=Math.min(segmentDistance(u,v,[-.22,-.22],[.22,.22]),segmentDistance(u,v,[-.22,.22],[.22,-.22]));
      const alpha=Math.max(0,Math.min(1,(stroke-d)*side+.5));
      color=background.map((value,i)=>value*(1-alpha)+ink[i]*alpha);
    } else if(mark==='cat') {
      const face=(u/.29)**2+((v-.05)/.25)**2<=1;
      const ears=v>=-.34&&v<=-.06&&Math.abs(Math.abs(u)-.19)<(v+.34)*.55;
      if(face||ears)color=[32,30,34];
      if(face&&(((u-.1)/.14)**2+((v-.18)/.09)**2<1||((u+.1)/.14)**2+((v-.18)/.09)**2<1))color=[241,235,231];
      if(face&&Math.abs(Math.abs(u)-.12)<.035&&Math.abs(v)<.035)color=[187,206,132];
    }
    // Small deterministic color variations also exercise softened mark edges.
    data.set([...color.map((value,channel)=>Math.max(0,Math.min(255,Math.round(value+((x*11+y*7+channel*5)%13-6)*noise)))),255],(y*side+x)*4);
  }
  return {width:side,height:side,data};
}

test('thick rounded crosses are not mistaken for cats across tile sizes, colors, and stroke widths',()=>{
  for(const side of [28,44,72,96])for(const background of [[151,120,214],[168,191,215],[172,111,73],[248,181,208]])for(const stroke of [.035,.065,.09,.115])for(const ink of [[255,255,255],[30,30,30]]) {
    const pixels=markedTile(side,'x',{background,stroke,ink});
    const result=classifyMark(pixels,{cx:(side-1)/2,cy:(side-1)/2,width:side,height:side},background);
    assert.equal(result.mark,-1,`${side}px ${background} stroke ${stroke} ink ${ink}`);
    if(side>=44&&stroke>=.065)assert.equal(result.uncertain,false,`${side}px ${background} stroke ${stroke} ink ${ink} should be recognized confidently`);
  }
});

test('multicolor cat faces remain cats and empty tiles remain empty',()=>{
  for(const side of [28,44,72,96])for(const background of [[151,120,214],[175,215,151],[248,181,208]])for(const offset of [-.025,0,.025])for(const mark of ['cat','empty']) {
    const result=classifyMark(markedTile(side,mark,{background,offset}),{cx:(side-1)/2,cy:(side-1)/2,width:side,height:side},background);
    assert.equal(result.mark,mark==='cat'?1:0);assert.equal(result.uncertain,false);
  }
});

test('a full noisy grid imports bold tinted-white crosses and multicolor cats without invented marks or color uncertainty',()=>{
  const size=10,side=64,pixels=syntheticBoard(size,side),expected=Array(100).fill(0),cats=[63,94];
  let crosses=0;
  for(let k=0;crosses<55;k++) { const index=k*37%100;if(cats.includes(index))continue;expected[index]=-1;crosses++; }
  cats.forEach(index=>expected[index]=1);
  for(let index=0;index<100;index++) {
    const r=Math.floor(index/size),c=index%size;
    const tile=markedTile(side,expected[index]===1?'cat':expected[index]===-1?'x':'empty',{background:pixels.colors[r],ink:[254,249,237],stroke:.115,noise:1.1});
    for(let y=0;y<side;y++)pixels.data.set(tile.data.subarray(y*side*4,(y+1)*side*4),((105+r*(side+4)+y)*pixels.width+18+c*(side+4))*4);
  }
  const result=parsePixels(pixels);
  assert.equal(result.board.size,size);assert.equal(result.board.colors.length,size);
  assert.deepEqual(result.board.regions,Array.from({length:100},(_,index)=>Math.floor(index/10)));
  assert.deepEqual(result.board.marks,expected);assert.deepEqual(result.uncertain,[]);
});

test('the original demo screenshot imports all regions with no invented marks',()=>{
  const result=parsePixels(fixture('demo-grid'));
  assert.equal(result.board.size,example.size);assert.equal(result.board.colors.length,example.size);
  assert.deepEqual(result.board.regions,example.regions);
  assert.deepEqual(result.board.marks,example.marks);assert.deepEqual(result.uncertain,[]);
});

test('original geometric cat and X marks are recognized on a started puzzle',()=>{
  const pixels=fixture('demo-grid-marked'),result=parsePixels(pixels);
  assert.equal(result.board.size,example.size);assert.deepEqual(result.board.regions,example.regions);
  assert.deepEqual(result.board.marks.flatMap((mark,index)=>mark===1?[index]:[]),pixels.cats);
  assert.deepEqual(result.board.marks.flatMap((mark,index)=>mark===-1?[index]:[]),pixels.crosses);
  assert.deepEqual(result.uncertain,[]);
});

test('automatic grid detection supports different square sizes and ignores header icons',()=>{
  for(const size of [2,4,6,8,12,16,20]) {
    const result=parsePixels(syntheticBoard(size));
    assert.equal(result.board.size,size);assert.equal(result.board.colors.length,size);
    assert.deepEqual(result.board.regions,Array.from({length:size*size},(_,i)=>Math.floor(i/size)));
    assert.ok(result.board.marks.every(mark=>mark===0));
  }
});

test('explicit crop and size are honored and invalid input fails intentionally',()=>{
  const pixels=fixture('demo-grid');
  const result=parsePixels(pixels,{crop:pixels.crop,size:example.size});
  assert.equal(result.board.size,example.size);assert.deepEqual(result.board.regions,example.regions);
  assert.throws(()=>parsePixels({width:20,height:20,data:new Uint8ClampedArray(1600).fill(255)}));
  assert.throws(()=>parsePixels({width:2,height:2,data:[]}));
});

test('ambiguous small marks are flagged for review instead of silently trusted',()=>{
  const pixels={width:80,height:80,data:new Uint8ClampedArray(80*80*4)};
  for(let i=0;i<pixels.data.length;i+=4)pixels.data.set([80,180,180,255],i);
  for(let y=38;y<44;y++)for(let x=38;x<44;x++)pixels.data.set([0,0,0,255],(y*80+x)*4);
  const result=classifyMark(pixels,{cx:40,cy:40,width:80,height:80},[80,180,180]);
  assert.equal(result.uncertain,true);
});
