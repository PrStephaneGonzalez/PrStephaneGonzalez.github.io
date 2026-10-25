import test from 'node:test';
import assert from 'node:assert/strict';
import { createGraph, definition, ids, captureMask, reachMask, displayedArcs, inducedGraph, opposite, disjointUnion, legalMoves } from '../engine/graph.mjs';
import { createGame, previewMove, playMove, serializeGame, deserializeGame } from '../engine/game.mjs';
import { createExactSolver, relativeScores } from '../ai/exact.mjs';
import { chooseMove } from '../ai/choose.mjs';
import { figure1 } from '../levels/reference.mjs';

function graph(colors, arcs = []) {
  return createGraph({ vertices: [...colors].map((color, i) => ({ id: `${i}`, color })), arcs: arcs.map(a => a.map(String)) });
}

test('1: Succ and Pred include origin and follow transitive paths', () => {
  const g = graph('LLRR', [[0,1],[1,2],[2,3]]);
  assert.deepEqual(ids(g, captureMask(g,g.full,'L','0')), ['0','1','2','3']);
  assert.deepEqual(ids(g, captureMask(g,g.full,'R','3')), ['0','1','2','3']);
  assert.deepEqual(ids(g, reachMask(g,g.full,'2','L')), ['2','3']);
});

test('2: removed intermediates break paths in the induced graph', () => {
  const g = graph('LRR', [[0,1],[1,2]]), rest = g.full & ~g.bits[1];
  assert.deepEqual(ids(g, captureMask(g,rest,'L','0')), ['0']);
  assert.deepEqual(definition(inducedGraph(g,rest)), { vertices: [{id:'0',color:'L'},{id:'2',color:'R'}], arcs: [] });
});

test('3: cycles, opposing colors, self-loops; canonical graph deeply frozen', () => {
  const g = graph('LRL', [[0,1],[1,2],[2,0],[1,1]]);
  assert.equal(captureMask(g,g.full,'L','0'),g.full);
  assert.equal(captureMask(g,g.full,'R','1'),g.full);
  assert.throws(() => {g.arcs[0][0]='1';},TypeError);
  assert.throws(() => {g.vertices[0].color='R';},TypeError);
});

test('4: no move ends immediately, including an initially monochromatic or empty graph', () => {
  const g = figure1();
  const result = playMove(g,createGame(g,'R'),'y');
  assert.equal(result.state.finished,true);
  assert.deepEqual(result.state.scores,{L:0,R:6});
  assert.deepEqual(result.state.settlement,{reason:'no-legal-move',player:'L',recipient:'R',count:1,vertices:['z']});
  assert.deepEqual(createGame(graph('RRR'),'L').scores,{L:0,R:3});
  assert.equal(createGame(graph('')).finished,true);
  assert.throws(() => playMove(g,result.state,'z'),/finished/);
});

test('5 and 7: every continuation conserves vertices and preview equals capture', () => {
  const g=figure1();
  function walk(s) {
    assert.equal(s.scores.L+s.scores.R+ids(g,s.remaining).length,6);
    for(const id of s.finished ? [] : legalMoves(g,s.remaining,s.turn)) {
      const snapshot=serializeGame(g,s), preview=previewMove(g,s,id), r=playMove(g,s,id);
      assert.equal(r.captured,preview); assert.equal(serializeGame(g,s),snapshot);
      walk(r.state);
    }
  }
  walk(createGame(g,'L')); walk(createGame(g,'R'));
});

test('6: both players follow the projected arrows; no mutation of canonical arcs', () => {
  const g=figure1(), before=JSON.stringify(definition(g));
  for(const p of ['L','R']) {
    const view=createGraph({vertices:g.vertices,arcs:displayedArcs(g,g.full,p)});
    for(const id of legalMoves(g,g.full,p)) assert.deepEqual(ids(view,reachMask(view,view.full,id,'L')),ids(g,captureMask(g,g.full,p,id)));
  }
  assert.equal(JSON.stringify(definition(g)),before);
});

test('8 and 15: opposition and disjoint sum are distinct from adding scores', () => {
  const g=figure1(), a=relativeScores(g), b=relativeScores(opposite(g));
  assert.equal(b.Ls,-a.Rs); assert.equal(b.Rs,-a.Ls);
  const sum=relativeScores(disjointUnion(g,opposite(g)));
  assert.equal(sum.Ls,0); assert.equal(sum.Rs,0);
  assert.notEqual(sum.Ls,a.Ls+b.Ls); // Rules forbid component-score addition.
});

test('10: deterministic legal AI and explicit budget fallback', () => {
  const g=figure1(), s=createGame(g);
  for(const difficulty of ['easy','normal','expert']) {
    const a=chooseMove(g,s,{difficulty,seed:42}),b=chooseMove(g,s,{difficulty,seed:42});
    assert.equal(a.id,b.id); assert(legalMoves(g,s.remaining,s.turn).includes(a.id));
  }
  const capped=chooseMove(g,s,{difficulty:'expert',budget:{maxVertices:2}});
  assert.equal(capped.exact,false); assert.equal(capped.reason,'vertices');
  assert(legalMoves(g,s.remaining,s.turn).includes(capped.id));
  assert.equal(createExactSolver(g,{maxStates:1}).solve().reason,'states');
  assert.equal(createExactSolver(g,{timeMs:1e-9}).solve().reason,'time');
});

test('31/32/33 vertices: BigInt bits and transitions have no 32-bit truncation', () => {
  for(const n of [31,32,33]) {
    const g=graph('L'+'R'.repeat(n-1),Array.from({length:n-1},(_,i)=>[i,i+1]));
    assert.equal(captureMask(g,g.full,'L','0'),g.full);
    assert.equal(captureMask(g,g.full,'R',`${n-1}`),g.full);
    assert.deepEqual(playMove(g,createGame(g),'0').state.scores,{L:n,R:0});
    assert.equal(createExactSolver(g).solve().reason,'vertices');
    assert.equal(createExactSolver(g,{maxVertices:40}).solve().value,n);
  }
});

test('save round-trip and malformed-state rejection', () => {
  const g=figure1(),s=playMove(g,createGame(g),'w').state;
  const restored=deserializeGame(serializeGame(g,s));
  assert.deepEqual(definition(restored.graph),definition(g));
  assert.deepEqual(restored.state,s);
  const bad=JSON.parse(serializeGame(g,s));bad.state.scores.L=100;
  assert.throws(()=>deserializeGame(JSON.stringify(bad)),/Inconsistent/);
  assert.throws(()=>deserializeGame('{"version":2}'),/Invalid/);
});

test('input validation: colors, IDs, edges, masks and illegal moves', () => {
  assert.throws(()=>graph('X'),TypeError);
  assert.throws(()=>createGraph({vertices:[{id:'x',color:'L'},{id:'x',color:'R'}],arcs:[]}),TypeError);
  assert.throws(()=>graph('LR',[[0,2]]),TypeError);
  assert.throws(()=>graph('LR',[[0,1],[0,1]]),TypeError);
  assert.throws(()=>createGraph({vertices:[{id:'0',color:'L'}],arcs:[[0,0]]}),TypeError);
  const g=graph('LR');
  assert.throws(()=>captureMask(g,g.full,'L','1'),RangeError);
  assert.throws(()=>captureMask(g,0n,'L','0'),RangeError);
  assert.throws(()=>reachMask(g,-1n,'0','L'),RangeError);
  assert.throws(()=>reachMask(g,4n,'0','L'),RangeError);
});

test('level classification must include a tie for only one starting player', () => {
  const g=graph('LRRR',[[0,2],[1,2],[3,0]]),v=relativeScores(g);
  assert.deepEqual([v.Ls,v.Rs],[0,-4]);
});
