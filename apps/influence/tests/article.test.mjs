import test from 'node:test';
import assert from 'node:assert/strict';
import { ids, captureMask, opposite, disjointUnion } from '../engine/graph.mjs';
import { createGame, playMove } from '../engine/game.mjs';
import { relativeScores } from '../ai/exact.mjs';
import { figure1, segment, alternatingCycle, table1 } from '../levels/reference.mjs';

test('11: Figure 1 / Example 3, relative and absolute scores', () => {
  const g=figure1(),v=relativeScores(g);
  assert.equal(v.Ls,2); assert.equal(v.Rs,-6);
  assert.deepEqual([(6+v.Ls)/2,(6-v.Ls)/2,(6-v.Rs)/2,(6+v.Rs)/2],[4,2,6,0]);
  assert.deepEqual(ids(g,captureMask(g,g.full,'L','u')),['u','w','y','z']);
  let s=playMove(g,createGame(g),'u').state;
  s=playMove(g,s,'v').state;
  assert.deepEqual(s.scores,{L:4,R:2});assert(s.finished);
  s=playMove(g,createGame(g,'R'),'y').state;
  assert.deepEqual(s.scores,{L:0,R:6});assert(s.finished);
});

test('12: published Table 1, n=1..24, original public rules', () => {
  for(let n=1;n<=24;n++) {
    const {Ls,Rs}=relativeScores(segment(n),{timeMs:10000});
    assert.deepEqual([Ls,Rs],table1[n-1],`n=${n}`);
  }
});

test('13: Theorem 20 on C=, C- and C+ (n >= 2)', () => {
  for(let n=2;n<=20;n++) for(const start of [1,2]) {
    const {Ls,Rs}=relativeScores(segment(n,start));
    assert(Ls>0 && Rs<0);
    if(n%2===0) {assert([2,4].includes(Ls));assert([-2,-4].includes(Rs));}
    else if(start===1) {assert([1,3].includes(Ls));assert([-1,-3,-5].includes(Rs));if(((n-1)/2)%2)assert.equal(Ls,3);}
    else {assert([1,3,5].includes(Ls));assert([-1,-3].includes(Rs));if(((n+1)/2)%2===0)assert.equal(Rs,-3);}
  }
});

test('14: four-vertex cycle is an explicit small-case exception to printed Corollary 24', () => {
  const g=alternatingCycle(4),v=relativeScores(g);
  assert.deepEqual([v.Ls,v.Rs],[4,-4]);
  const red=playMove(g,createGame(g,'L'),'2').state;
  assert(red.finished);assert.deepEqual(red.scores,{L:4,R:0});
  assert.equal(red.settlement.count,1);
  const blue=playMove(g,createGame(g,'R'),'1').state;
  assert(blue.finished);assert.deepEqual(blue.scores,{L:0,R:4});
});

test('14: Corollary 24, alternating cycles n=6..20', () => {
  for(let n=6;n<=20;n+=2) {
    const {Ls,Rs}=relativeScores(alternatingCycle(n));
    assert([0,2].includes(Ls));assert.equal(Rs,-Ls || 0);
    if((n/2)%2)assert.equal(Ls,0);
  }
});

test('15-17: opposite sums, nonzugzwang and parity including non-relevant graphs', () => {
  for(const g of [figure1(),...Array.from({length:10},(_,i)=>segment(i))]) {
    const {Ls,Rs}=relativeScores(g),n=g.vertices.length;
    assert(Ls>=Rs);assert.equal(Math.abs(Ls%2),n%2);assert.equal(Math.abs(Rs%2),n%2);
    const v=relativeScores(disjointUnion(g,opposite(g)));
    assert.equal(v.Ls,0);assert.equal(v.Rs,0);
  }
});
