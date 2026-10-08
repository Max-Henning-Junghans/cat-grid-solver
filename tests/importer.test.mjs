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
