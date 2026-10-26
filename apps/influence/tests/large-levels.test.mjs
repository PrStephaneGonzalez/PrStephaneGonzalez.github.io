import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {createGraph,legalMoves,popcount}from '../engine/graph.mjs';import {createGame,playMove,finishMonochrome}from '../engine/game.mjs';import{relativeScores}from '../ai/exact.mjs';import{chooseMove}from '../ai/choose.mjs';import{table1}from '../levels/reference.mjs';
const levels=JSON.parse(fs.readFileSync(new URL('../levels/catalog.json',import.meta.url)));
test('60 boards: preserved original IDs, unique graphs, exact metadata and usable large geometry',()=>{
 assert.equal(levels.length,60);assert.equal(new Set(levels.map(l=>l.id)).size,60);assert.equal(new Set(levels.map(l=>JSON.stringify([l.vertices,l.arcs]))).size,60);
 for(const l of levels.slice(12)){const g=createGraph(l),n=g.vertices.length;assert.equal(n,l.meta.vertices);assert.equal(l.meta.red,popcount(g.colors.L));assert.equal(l.meta.blue,popcount(g.colors.R));assert.equal(l.arcs.length,l.meta.arcs);
  if(n<=18){const r=relativeScores(g);assert.deepEqual([r.Ls,r.Rs],[l.meta.Ls,l.meta.Rs]);}else {assert.deepEqual([l.meta.Ls,l.meta.Rs],table1[n-1]);assert.equal(g.arcs.length,n-1);g.vertices.forEach((v,i)=>assert.equal(v.color,i%2?'L':'R'));for(let i=0;i<n-1;i++)assert.ok(g.arcs.some(([a,b])=>a===`N${i%2?i+1:i+2}`&&b===`N${i%2?i+2:i+1}`));}
  const pts=Object.values(l.positions);assert.equal(pts.length,n);for(let i=0;i<n;i++){const[x,y]=pts[i];assert.ok(x>=50&&x<=l.viewport.width-50&&y>=50&&y<=l.viewport.height-50);for(let j=i+1;j<n;j++)assert.ok(Math.hypot(x-pts[j][0],y-pts[j][1])>=105);}
  assert.ok(l.meta.sampledMoves.mean>=n*(n<=18?.4:1/3));
 }
 assert.equal(Math.max(...levels.map(l=>l.vertices.length)),33);
});
test('all 48 additions finish legally in both starting orders with the public ending shortcut',()=>{
 let games=0;for(const l of levels.slice(12))for(const first of ['L','R'])for(const difficulty of ['easy','normal']){
  const g=createGraph(l);let s=createGame(g,first),moves=0;
  while(!s.finished){const m=chooseMove(g,s,{difficulty,seed:games+17+moves});assert.ok(legalMoves(g,s.remaining,s.turn).includes(m.id));s=finishMonochrome(g,playMove(g,s,m.id).state);moves++;assert.ok(moves<=g.vertices.length);}
  assert.equal(s.scores.L+s.scores.R,g.vertices.length);games++;
 }assert.equal(games,192);
});
test('large-board Expert returns a legal move under bounded search and leaves the graph unchanged',()=>{
 const g=createGraph(levels.at(-1)),s=createGame(g),before=JSON.stringify(g.arcs);
 const options={difficulty:'expert',budget:{maxVertices:20,fallbackTimeMs:10000,fallbackNodes:400}};
 const a=chooseMove(g,s,options),b=chooseMove(g,s,options);assert.ok(legalMoves(g,s.remaining,s.turn).includes(a.id));assert.equal(a.exact,false);assert.equal(a.id,b.id);assert.equal(a.depth,b.depth);assert.ok(a.depth>=2);assert.equal(JSON.stringify(g.arcs),before);
});
