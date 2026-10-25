import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createGraph,legalMoves,popcount,displayedArcs,definition} from '../engine/graph.mjs';
import {createGame,previewMove,playMove,serializeGame,deserializeGame} from '../engine/game.mjs';
import {relativeScores} from '../ai/exact.mjs';
import {chooseMove} from '../ai/choose.mjs';
import {strings} from '../i18n/strings.mjs';
const levels=JSON.parse(readFileSync(new URL('../levels/catalog.json',import.meta.url)));

test('12 valid boards: geometry, exact metadata, symmetry and varied strategies',()=>{
 assert.equal(levels.length,12);const types=new Set();let traps=0,minorities=0;
 for(const l of levels){const g=createGraph(l),r=relativeScores(g);assert.equal(l.meta.Ls,r.Ls,l.id);assert.equal(l.meta.Rs,r.Rs,l.id);assert.equal(l.meta.vertices,g.vertices.length);assert.equal(l.meta.red,popcount(g.colors.L));assert.equal(l.meta.blue,popcount(g.colors.R));assert.equal(l.meta.arcs,g.arcs.length);
  assert.ok(r.Ls>=r.Rs);assert.ok(l.meta.opening.L.nonDominated>0);assert.ok(l.meta.opening.R.nonDominated>0);
  if(l.meta.selfOpposed)assert.equal(r.Ls,-r.Rs||0);
  for(const p of ['L','R']){const opening=p==='L'?r.left:r.right,greedy=Math.max(...opening.moves.map(m=>m.captured)),greedyValues=opening.moves.filter(m=>m.captured===greedy).map(m=>m.value),value=p==='L'?Math.max(...greedyValues):Math.min(...greedyValues);assert.equal(l.meta.opening[p].greedyGap,((p==='L'?1:-1)*(opening.value-value))||0);}
  const pts=Object.values(l.positions);for(let i=0;i<pts.length;i++){const[x,y]=pts[i];assert.ok(x>=50&&x<=550&&y>=50&&y<=470);for(let j=i+1;j<pts.length;j++)assert.ok(Math.hypot(x-pts[j][0],y-pts[j][1])>=105,'Touch targets must not overlap');}
  assert.equal(new Set(l.vertices.map(v=>v.id)).size,pts.length);
  types.add(l.meta.type);if(l.meta.opening.L.greedyGap||l.meta.opening.R.greedyGap)traps++;
  if(l.meta.red<l.meta.blue&&r.Ls>0||l.meta.blue<l.meta.red&&r.Rs<0)minorities++;
 }
 assert.ok(types.size>=5);assert.ok(types.has('draw'));assert.ok(traps>=4);assert.ok(minorities>=2);
});

test('216 complete games: all boards, both starts, every AI difficulty pairing',()=>{
 let games=0,settlements=0;
 for(const l of levels)for(const first of ['L','R'])for(const red of ['easy','normal','expert'])for(const blue of ['easy','normal','expert']){
  const g=createGraph(l),canonical=JSON.stringify(definition(g));let s=createGame(g,first),ply=0;
  while(!s.finished){const difficulty=s.turn==='L'?red:blue,id=chooseMove(g,s,{difficulty,seed:++ply*31+games}).id;
   assert.ok(legalMoves(g,s.remaining,s.turn).includes(id));const preview=previewMove(g,s,id),next=playMove(g,s,id);assert.equal(next.captured,preview);
   const projected=displayedArcs(g,s.remaining,s.turn),adj=new Map();for(const[a,b]of projected){if(!adj.has(a))adj.set(a,[]);adj.get(a).push(b);}const reachable=new Set([id]),queue=[id];while(queue.length){for(const b of adj.get(queue.shift())??[])if(!reachable.has(b)){reachable.add(b);queue.push(b);}}assert.deepEqual([...reachable].sort(),[...next.capturedIds].sort());
   s=next.state;assert.equal(s.scores.L+s.scores.R+popcount(s.remaining),g.vertices.length);
   const loaded=deserializeGame(serializeGame(g,s));assert.equal(loaded.state.remaining,s.remaining);assert.deepEqual(loaded.state.scores,s.scores);
   assert.ok(ply<=g.vertices.length);assert.equal(JSON.stringify(definition(g)),canonical);
  }
  assert.equal(s.scores.L+s.scores.R,g.vertices.length);if(s.settlement)settlements++;
  if(red==='expert'&&blue==='expert')assert.equal(s.scores.L-s.scores.R,first==='L'?l.meta.Ls:l.meta.Rs);games++;
 }
 assert.equal(games,216);assert.ok(settlements>0);
});

test('FR/EN dictionaries have matching keys and interpolation parameters',()=>{
 assert.deepEqual(Object.keys(strings.fr).sort(),Object.keys(strings.en).sort());
 for(const key of Object.keys(strings.fr)){const params=s=>[...s.matchAll(/\{([a-z]+)\}/g)].map(m=>m[1]).sort();assert.deepEqual(params(strings.fr[key]),params(strings.en[key]),key);}
});


test('independent Python oracle validates all 12 published boards, both starting players',()=>{
 const run=spawnSync('python3',[fileURLToPath(new URL('./oracle.py',import.meta.url))],{input:JSON.stringify({max_exhaustive:-1,random_count:0,graphs:levels.map(l=>({vertices:l.vertices,arcs:l.arcs}))}),encoding:'utf8',timeout:30000});
 assert.equal(run.status,0,run.stderr);const values=run.stdout.trim().split('\n').map(JSON.parse);assert.equal(values.length,12);
 for(let i=0;i<12;i++){assert.equal(values[i].left[0]-values[i].left[1],levels[i].meta.Ls,levels[i].id);assert.equal(values[i].right[0]-values[i].right[1],levels[i].meta.Rs,levels[i].id);}
});
