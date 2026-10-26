import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {createGraph,legalMoves,popcount}from '../engine/graph.mjs';import {createGame,playMove,finishMonochrome}from '../engine/game.mjs';import{relativeScores}from '../ai/exact.mjs';import{chooseMove}from '../ai/choose.mjs';import{table1}from '../levels/reference.mjs';
const levels=JSON.parse(fs.readFileSync(new URL('../levels/catalog.json',import.meta.url)));
test('72 boards: preserved original IDs, unique graphs, exact metadata and usable large geometry',()=>{
 assert.equal(levels.length,72);assert.equal(new Set(levels.map(l=>l.id)).size,72);assert.equal(new Set(levels.map(l=>JSON.stringify([l.vertices,l.arcs]))).size,72);
 assert.deepEqual(levels.slice(60).map(l=>l.id),Array.from({length:12},(_,i)=>`trap-${i+1}`));
 for(const l of levels.slice(12)){const trap=l.id.startsWith('trap-');const g=createGraph(l),n=g.vertices.length;assert.equal(n,l.meta.vertices);assert.equal(l.meta.red,popcount(g.colors.L));assert.equal(l.meta.blue,popcount(g.colors.R));assert.equal(l.arcs.length,l.meta.arcs);
  if(n<=18){const r=relativeScores(g);assert.deepEqual([r.Ls,r.Rs],[l.meta.Ls,l.meta.Rs]);}else {assert.deepEqual([l.meta.Ls,l.meta.Rs],table1[n-1]);assert.equal(g.arcs.length,n-1);g.vertices.forEach((v,i)=>assert.equal(v.color,i%2?'L':'R'));for(let i=0;i<n-1;i++)assert.ok(g.arcs.some(([a,b])=>a===`N${i%2?i+1:i+2}`&&b===`N${i%2?i+2:i+1}`));}
  const pts=Object.values(l.positions);assert.equal(pts.length,n);for(let i=0;i<n;i++){const[x,y]=pts[i];assert.ok(x>=50&&x<=l.viewport.width-50&&y>=50&&y<=l.viewport.height-50);for(let j=i+1;j<n;j++)assert.ok(Math.hypot(x-pts[j][0],y-pts[j][1])>=105);}
  assert.ok(l.meta.sampledMoves.mean>=n*(trap?.3:n<=18?.4:1/3));
 }
 assert.equal(Math.max(...levels.map(l=>l.vertices.length)),33);
});
test('all 60 additions finish legally in both starting orders with the public ending shortcut',()=>{
 let games=0;for(const l of levels.slice(12))for(const first of ['L','R'])for(const difficulty of ['easy','normal']){
  const g=createGraph(l);let s=createGame(g,first),moves=0;
  while(!s.finished){const m=chooseMove(g,s,{difficulty,seed:games+17+moves});assert.ok(legalMoves(g,s.remaining,s.turn).includes(m.id));s=finishMonochrome(g,playMove(g,s,m.id).state);moves++;assert.ok(moves<=g.vertices.length);}
  assert.equal(s.scores.L+s.scores.R,g.vertices.length);games++;
 }assert.equal(games,240);
});
test('large-board Expert returns a legal move under bounded search and leaves the graph unchanged',()=>{
 const g=createGraph(levels.find(l=>l.id==='long-path-33')),s=createGame(g),before=JSON.stringify(g.arcs);
 const options={difficulty:'expert',budget:{maxVertices:20,fallbackTimeMs:10000,fallbackNodes:400}};
 const a=chooseMove(g,s,options),b=chooseMove(g,s,options);assert.ok(legalMoves(g,s.remaining,s.turn).includes(a.id));assert.equal(a.exact,false);assert.equal(a.id,b.id);assert.equal(a.depth,b.depth);assert.ok(a.depth>=2);assert.equal(JSON.stringify(g.arcs),before);
});

// Chapter 5: the greedy opening is a serious mistake for Red, and only one or two pieces win.
test('greedy traps: Red wins, every greedy opening loses, one or two key pieces, diagonal arcs',()=>{
 for(const l of levels.slice(60)){const g=createGraph(l),n=g.vertices.length,r=relativeScores(g),moves=r.left.moves;
  const max=Math.max(...moves.map(m=>m.captured)),greedy=moves.filter(m=>m.captured===max),keys=moves.filter(m=>m.value>0).map(m=>m.id);
  assert.ok(r.Ls>0&&r.Ls<=6,l.id);assert.deepEqual([r.Ls,r.Rs],[l.meta.Ls,l.meta.Rs]);
  assert.ok(greedy.every(m=>m.value<0),`${l.id}: a greedy opening must lose`);
  assert.deepEqual(keys.sort(),[...l.meta.trap.keys].sort());assert.ok(keys.length>=1&&keys.length<=2);
  assert.equal(l.meta.trap.gap,r.Ls-Math.max(...greedy.map(m=>m.value)));assert.ok(l.meta.trap.gap>=6,`${l.id}: gap ${l.meta.trap.gap}`);
  assert.ok(Math.max(...moves.filter(m=>m.value>0).map(m=>m.captured))<=Math.ceil(n/3),'the key piece captures little');
  assert.ok(max-Math.max(...moves.filter(m=>m.value>0).map(m=>m.captured))>=2,'the greedy move is a real temptation');
  const P=l.positions,diagonal=l.arcs.filter(([a,b])=>Math.abs(P[a][0]-P[b][0])>60&&Math.abs(P[a][1]-P[b][1])>60);assert.ok(diagonal.length>=2,`${l.id}: diagonal arcs`);
  // No arc passes over a third piece.
  for(const [a,b] of l.arcs)for(const v of g.vertices)if(v.id!==a&&v.id!==b){const[px,py]=P[v.id],[ax,ay]=P[a],[bx,by]=P[b],dx=bx-ax,dy=by-ay,s=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy)));assert.ok(Math.hypot(px-ax-s*dx,py-ay-s*dy)>=58,`${l.id}: ${a}->${b} crosses ${v.id}`);}
 }
});
