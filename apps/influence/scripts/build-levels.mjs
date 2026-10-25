import { writeFileSync } from 'node:fs';
import { createGraph, captureMask, popcount, opposite } from '../engine/graph.mjs';
import { relativeScores } from '../ai/exact.mjs';
import { seededRandom } from '../ai/choose.mjs';
const random=seededRandom(753104);
function selfOpposed(g) {
 const n=g.vertices.length;if(popcount(g.colors.L)*2!==n)return false;
 const edge=new Set(g.arcs.map(([a,b])=>`${g.index[a]},${g.index[b]}`));
 const out=g.outgoing.map(popcount), inc=g.incoming.map(popcount), mapping=[],used=new Set();
 function dfs(i){if(i===n)return true;for(let j=0;j<n;j++){
  if(used.has(j)||g.vertices[i].color===g.vertices[j].color||out[i]!==inc[j]||inc[i]!==out[j])continue;
  let ok=true;for(let k=0;k<i;k++)if(edge.has(`${i},${k}`)!==edge.has(`${mapping[k]},${j}`)||edge.has(`${k},${i}`)!==edge.has(`${j},${mapping[k]}`)){ok=false;break;}
  if(ok){mapping[i]=j;used.add(j);if(dfs(i+1))return true;used.delete(j);}
 }return false;}return dfs(0);
}
function analyze(def){const g=createGraph(def), {Ls,Rs,left,right}=relativeScores(g);
 const opening=(r,p)=>{const sign=p==='L'?1:-1, greedy=Math.max(...r.moves.map(m=>m.captured));const gs=r.moves.filter(m=>m.captured===greedy);return {greedyGap:sign*(r.value-(p==='L'?Math.max(...gs.map(m=>m.value)):Math.min(...gs.map(m=>m.value)))),choices:new Set(r.moves.map(m=>m.value)).size,nonDominated:r.moves.filter(m=>!r.moves.some(o=>o.id!==m.id&&captureMask(g,g.full,p,m.id)!==captureMask(g,g.full,p,o.id)&&(captureMask(g,g.full,p,m.id)&captureMask(g,g.full,p,o.id))===captureMask(g,g.full,p,m.id))).length};};
 let type=Ls>0&&Rs>0?'red':Ls<0&&Rs<0?'blue':Ls>0&&Rs<0?'first':Ls===0&&Rs===0?'draw':Ls>0?'red-draw':'blue-draw';
 return {Ls,Rs,type,vertices:g.vertices.length,red:popcount(g.colors.L),blue:popcount(g.colors.R),arcs:g.arcs.length,selfOpposed:selfOpposed(g),opening:{L:opening(left,'L'),R:opening(right,'R')}};
}
const ring=[[150,70],[300,70],[450,70],[450,260],[450,450],[300,450],[150,450],[150,260]];
const first={vertices:ring.map((p,i)=>({id:String.fromCharCode(65+i),color:i%2?'R':'L'})),arcs:ring.map((_,i)=>i%2?[(String.fromCharCode(65+(i+1)%8)),String.fromCharCode(65+i)]:[String.fromCharCode(65+i),String.fromCharCode(65+(i+1)%8)]),positions:Object.fromEntries(ring.map((p,i)=>[String.fromCharCode(65+i),p]))};
const levels=[{id:'first-links',name:{fr:'Les premiers liens',en:'First connections'},...first,meta:analyze(first)}];
const names=[['Le petit détour','The little detour'],['À contre-courant','Against the current'],['Les deux jardins','Two gardens'],['Le bon carrefour','The right crossroads'],['Petit mais malin','Small but clever'],['Le vent tourne','A change of wind'],['La passerelle','The footbridge'],['Le grand détour','The scenic route'],['La force du lien','Strength in connections'],['L’effet domino','The domino effect'],['Tout peut basculer','Turn the tables']];
// A disjoint pair of opposite segments gives a verified, neutral board.
const twin={vertices:Array.from({length:8},(_,i)=>({id:String.fromCharCode(65+i),color:(i<4?i%2===0:i%2===1)?'L':'R'})),arcs:[['A','B'],['C','B'],['C','D'],['F','E'],['F','G'],['H','G']],positions:{A:[80,80],B:[240,80],C:[240,245],D:[80,245],E:[360,280],F:[520,280],G:[520,445],H:[360,445]}};
const targets=['first','first','red','draw','blue','minority','red-draw','blue-draw','first','red','blue','minority'];
const seen=new Set();let tries=0;
// Connected planar grid networks, with different orientations and colour assignments.
while(levels.length<12&&tries++<100000){
 if(levels.length===3){levels.push({id:'two-gardens',name:{fr:names[2][0],en:names[2][1]},...twin,meta:analyze(twin)});continue;}
 const n=levels.length<4?8:levels.length<8?10:12;
 const cols=levels.length<4?3:3,rows=Math.ceil(n/cols);
 const pts=Array.from({length:n},(_,i)=>[100+(i%cols)*200,65+Math.floor(i/cols)*(390/(rows-1))]);
 const vertices=pts.map((_,i)=>({id:String.fromCharCode(65+i),color:random()<.5?'L':'R'}));
 const edges=[];for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if((j===i+1&&i%cols<cols-1)||j===i+cols){if(random()<.85)edges.push(random()<.5?[vertices[i].id,vertices[j].id]:[vertices[j].id,vertices[i].id]);}
 const def={vertices,arcs:edges,positions:Object.fromEntries(pts.map((p,i)=>[vertices[i].id,p]))};
 const reached=new Set([vertices[0].id]);let old=-1;while(old!==reached.size){old=reached.size;for(const [a,b]of edges)if(reached.has(a)||reached.has(b)){reached.add(a);reached.add(b);}}if(reached.size!==n)continue;
 const meta=analyze(def);if(meta.red<2||meta.blue<2)continue;
 const maxGap=Math.max(meta.opening.L.greedyGap,meta.opening.R.greedyGap), variation=Math.max(meta.opening.L.choices,meta.opening.R.choices);
 if(variation<2)continue;
 const target=targets[levels.length];
 if(target==='minority'){if(!((meta.red<meta.blue&&meta.Ls>0)||(meta.blue<meta.red&&meta.Rs<0)))continue;}
 else if(meta.type!==target)continue;
 if(Math.max(Math.abs(meta.Ls),Math.abs(meta.Rs))>n-2)continue;
 if(Math.min(meta.opening.L.nonDominated,meta.opening.R.nonDominated)<2)continue;
 if(levels.length>6&&maxGap===0)continue;
 const key=JSON.stringify(def);if(seen.has(key))continue;seen.add(key);
 const i=levels.length-1;levels.push({id:`network-${levels.length+1}`,name:{fr:names[i][0],en:names[i][1]},...def,meta});
}
if(levels.length!==12)throw new Error(`Only ${levels.length} levels after ${tries}`);
writeFileSync(new URL('../levels/catalog.json',import.meta.url),JSON.stringify(levels,null,2)+'\n');
console.log(JSON.stringify({tries,levels:levels.map(l=>({id:l.id,...l.meta}))},null,2));
