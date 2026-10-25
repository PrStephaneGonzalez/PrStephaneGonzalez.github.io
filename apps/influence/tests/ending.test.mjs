import test from 'node:test';
import assert from 'node:assert/strict';
import {createGraph,opposite} from '../engine/graph.mjs';
import {createGame,playMove,finishMonochrome,serializeGame,deserializeGame} from '../engine/game.mjs';
const graph=createGraph({vertices:[{id:'a',color:'L'},{id:'b',color:'R'},{id:'c',color:'R'}],arcs:[]});
test('one-colour tail finishes immediately for either team without changing the original score',()=>{
 for(const g of [graph,opposite(graph)]){
  const first=g.vertices[0].color,initial=createGame(g,first),after=playMove(g,initial,'a').state;
  assert.equal(after.finished,false,'original engine retains its mathematical rules');
  const originalFinal=playMove(g,after,'b').state,short=finishMonochrome(g,after);
  assert.equal(short.finished,true);assert.deepEqual(short.scores,originalFinal.scores);assert.equal(short.remaining,0n);
  assert.equal(short.settlement.count,2);assert.deepEqual(short.settlement.vertices,['b','c']);assert.equal(short.settlement.reason,'one-color');
  assert.deepEqual(finishMonochrome(g,deserializeGame(serializeGame(g,after)).state).scores,short.scores,'legacy save');
  assert.equal(short.ply,after.ply,'no artificial move');assert.equal(after.remaining,6n,'immutable undo position');
  assert.equal(finishMonochrome(g,short),short);assert.deepEqual(deserializeGame(serializeGame(g,short)).state.scores,short.scores);
 }
});
test('mixed, already finished and empty positions are unchanged',()=>{
 const mixed=createGame(graph);assert.equal(finishMonochrome(graph,mixed),mixed);
 const ended=createGame(createGraph({vertices:[],arcs:[]}));assert.equal(finishMonochrome(graph,ended),ended);
});
