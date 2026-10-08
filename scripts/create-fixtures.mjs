// Rebuild the original demo screenshot and regression fixtures. Node only.
// All pixels come from our example board and simple geometric test marks.
import {mkdirSync, writeFileSync} from 'node:fs';
import {deflateSync, gzipSync} from 'node:zlib';
import {example} from '../dist/example.js';

const side = 72, gap = 6, left = 18, top = 105;
const width = example.size * (side + gap) + 36, height = width + 100;
const data = Buffer.alloc(width * height * 4, 255);
const pixel = (x,y,color) => data.set([...color,255], (y*width+x)*4);
const rect = (x,y,w,h,color) => {
  for(let dy=0;dy<h;dy++)for(let dx=0;dx<w;dx++)pixel(x+dx,y+dy,color);
};

// Decorative header bars and small squares exercise grid selection.
rect(18,18,180,10,[30,58,62]);
rect(18,36,110,6,[120,135,138]);
for(let r=0;r<3;r++)for(let c=0;c<3;c++)rect(width-60+c*13,18+r*13,10,10,[155,120,95]);
for(let r=0;r<example.size;r++)for(let c=0;c<example.size;c++) {
  const color=example.colors[example.regions[r*example.size+c]].slice(1).match(/../g).map(value=>parseInt(value,16));
  rect(left+c*(side+gap),top+r*(side+gap),side,side,color);
}

function crc32(bytes) {
  let crc=0xffffffff;
  for(const byte of bytes) {
    crc^=byte;
    for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
  }
  return (crc^0xffffffff)>>>0;
}
function chunk(type,bytes) {
  const body=Buffer.concat([Buffer.from(type),bytes]),length=Buffer.alloc(4),crc=Buffer.alloc(4);
  length.writeUInt32BE(bytes.length);crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length,body,crc]);
}
function png() {
  const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
  const scanlines=Buffer.alloc(height*(width*4+1));
  for(let y=0;y<height;y++)data.copy(scanlines,y*(width*4+1)+1,y*width*4,(y+1)*width*4);
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(scanlines)),chunk('IEND',Buffer.alloc(0))]);
}
const fixtures=new URL('../tests/fixtures/',import.meta.url);
mkdirSync(fixtures,{recursive:true});
function save(name,extra={}) {
  writeFileSync(new URL(`${name}.rgba.gz`,fixtures),gzipSync(data));
  writeFileSync(new URL(`${name}.json`,fixtures),JSON.stringify({width,height,crop:{x:left-gap/2,y:top-gap/2,width:example.size*(side+gap),height:example.size*(side+gap)},...extra})+'\n');
}
save('demo-grid');
writeFileSync(new URL('../dist/assets/demo-grid.png',import.meta.url),png());

const cats=[1,37],crosses=[7,10,20,48,61];
for(const [indices,mark] of [[cats,1],[crosses,-1]])for(const index of indices) {
  const r=Math.floor(index/example.size),c=index%example.size;
  for(let y=0;y<side;y++)for(let x=0;x<side;x++) {
    const u=(x+.5)/side-.5,v=(y+.5)/side-.5;
    // Original geometric face mask and diagonal cross; no app glyphs.
    const face=(u/.23)**2+((v-.05)/.2)**2<=1;
    const ears=v>=-.28&&v<=-.06&&Math.abs(Math.abs(u)-.16)<(v+.28)*.48;
    const cross=Math.abs(u)<.24&&Math.abs(v)<.24&&Math.min(Math.abs(u-v),Math.abs(u+v))<.035;
    if(mark===1&&(face||ears))pixel(left+c*(side+gap)+x,top+r*(side+gap)+y,[28,43,49]);
    if(mark===-1&&cross)pixel(left+c*(side+gap)+x,top+r*(side+gap)+y,[255,255,255]);
  }
}
save('demo-grid-marked',{cats,crosses});
writeFileSync(new URL('demo-grid-marked.png',fixtures),png());
console.log('Rebuilt original demo and synthetic recognition fixtures.');
