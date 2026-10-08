import test from 'node:test';
import assert from 'node:assert/strict';
import {cellsAlongSegment,applyBrush} from '../dist/board-input.js';

const cells=Array.from({length:9},(_,index)=>{
  const row=Math.floor(index/3),column=index%3;
  return {index,left:column*12,right:column*12+10,top:row*12,bottom:row*12+10};
});
const puzzle=()=>({size:3,colors:['#112233','#445566','#778899'],regions:[0,0,0,1,1,1,2,2,2],marks:[0,-1,1,0,0,0,0,0,0]});

test('fast, diagonal, reversed, and partly off-board strokes hit crossed cells without filling gaps',()=>{
  assert.deepEqual(cellsAlongSegment({x:5,y:5},{x:29,y:5},cells),[0,1,2]);
  assert.deepEqual(cellsAlongSegment({x:29,y:5},{x:5,y:5},cells),[2,1,0]);
  assert.deepEqual(cellsAlongSegment({x:5,y:5},{x:29,y:29},cells),[0,4,8]);
  assert.deepEqual(cellsAlongSegment({x:-20,y:17},{x:60,y:17},cells),[3,4,5]);
  assert.deepEqual(cellsAlongSegment({x:5,y:11},{x:29,y:11},cells),[]);
  assert.deepEqual(cellsAlongSegment({x:5,y:5},{x:5,y:5},cells),[0]);
  assert.deepEqual(cellsAlongSegment({x:100,y:100},{x:110,y:110},cells),[]);
});

test('X strokes preserve cats, never toggle revisited cells, and keep the input board unchanged',()=>{
  const board=puzzle();
  const result=applyBrush(board,[0,1,2,0,1,5],{tool:'x',value:-1});
  assert.deepEqual(result.board.marks,[-1,-1,1,0,0,-1,0,0,0]);
  assert.deepEqual(result.changed,[0,5]);
  assert.deepEqual(result.reviewed,[0,1,5]);
  assert.deepEqual(board.marks,[0,-1,1,0,0,0,0,0,0]);
  assert.deepEqual(applyBrush(result.board,[5,0,2],{tool:'x',value:-1}).changed,[]);
  const erased=applyBrush(result.board,[0,1,2,3,5],{tool:'x',value:0});
  assert.deepEqual(erased.board.marks,board.marks.map(mark=>mark===-1?0:mark));
  assert.equal(erased.board.marks[2],1);
});

test('clear and color brushes batch edits and preserve generation metadata in the original',()=>{
  const board=puzzle();board.generation={difficulty:'medium',unique:true};
  assert.deepEqual(applyBrush(board,[0,1,2],{tool:'erase'}).board.marks,Array(9).fill(0));
  const painted=applyBrush(board,[0,1,2,0],{tool:'paint',color:2});
  assert.deepEqual(painted.board.regions,[2,2,2,1,1,1,2,2,2]);
  assert.deepEqual(painted.changed,[0,1,2]);
  assert.deepEqual(painted.board.marks,board.marks);
  assert.equal(painted.board.generation.edited,true);
  assert.equal(board.generation.edited,undefined);
  assert.deepEqual(board.regions,[0,0,0,1,1,1,2,2,2]);
});
