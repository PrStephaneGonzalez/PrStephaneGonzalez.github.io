import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createGraph,captureMask,popcount,legalMoves} from '../engine/graph.mjs';
import {createGame,playMove,finishMonochrome} from '../engine/game.mjs';
import {relativeScores} from '../ai/exact.mjs';
import {seededRandom,chooseMove} from '../ai/choose.mjs';
const path=new URL('../levels/catalog.json',import.meta.url),levels=JSON.parse(fs.readFileSync(path)).slice(0,12),random=seededRandom(20261026);
const classify=(Ls,Rs)=>Ls>0&&Rs>0?'red':Ls<0&&Rs<0?'blue':Ls>0&&Rs<0?'first':Ls===0&&Rs===0?'draw':Ls>0?'red-draw':'blue-draw';
function lengths(g){const runs=[];for(const first of ['L','R'])for(let seed=1;seed<=6;seed++){let s=createGame(g,first),moves=0;while(!s.finished){s=finishMonochrome(g,playMove(g,s,chooseMove(g,s,{difficulty:seed%2?'normal':'easy',seed:seed*31+moves}).id).state);moves++;}runs.push(moves);}return {min:Math.min(...runs),max:Math.max(...runs),mean:runs.reduce((a,b)=>a+b)/runs.length};}
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

function metadata(g,r){const opening=(result,p)=>{const sign=p==='L'?1:-1,max=Math.max(...result.moves.map(m=>m.captured)),greedy=result.moves.filter(m=>m.captured===max).map(m=>m.value),caps=result.moves.map(m=>captureMask(g,g.full,p,m.id));return {greedyGap:sign*(result.value-(p==='L'?Math.max(...greedy):Math.min(...greedy)))||0,choices:new Set(result.moves.map(m=>m.value)).size,nonDominated:caps.filter((m,i)=>!caps.some((o,j)=>i!==j&&m!==o&&(m&o)===m)).length};};return {Ls:r.Ls,Rs:r.Rs,type:classify(r.Ls,r.Rs),vertices:g.vertices.length,red:popcount(g.colors.L),blue:popcount(g.colors.R),arcs:g.arcs.length,selfOpposed:selfOpposed(g),opening:{L:opening(r.left,'L'),R:opening(r.right,'R')}};}
const words=[['Les passerelles','Footbridges'],['Les carrefours','Crossroads'],['Les jardins liés','Linked gardens'],['Les détours','Detours'],['Les vallées','Valleys'],['Les petits ponts','Little bridges']];
const seenGraphs=new Set();
let attempts=0;while(levels.length<48&&attempts++<60000){const k=levels.length-12,n=[14,16,18][Math.floor(k/12)],cols=3,rows=Math.ceil(n/cols),vertices=Array.from({length:n},(_,i)=>({id:`N${i+1}`,color:(Math.floor(i/cols)+i%cols)%2?'L':'R'}));
 const positions=Object.fromEntries(vertices.map((v,i)=>[v.id,[100+i%cols*180,80+Math.floor(i/cols)*145]])),arcs=[];
 for(let i=0;i<n;i++)for(const j of [i%cols<cols-1?i+1:-1,i+cols])if(j>=0&&j<n&&random()<.73){const from=vertices[i].color==='L'?i:j,to=from===i?j:i;arcs.push([vertices[from].id,vertices[to].id]);}
 const degree=vertices.map(v=>arcs.filter(a=>a.includes(v.id)).length);if(degree.some(d=>d===0||d>3))continue;
 const seen=new Set([vertices[0].id]);for(let z=0;z<n;z++)for(const[a,b]of arcs)if(seen.has(a)||seen.has(b)){seen.add(a);seen.add(b);}if(seen.size<n)continue;
 const key=JSON.stringify(arcs);if(seenGraphs.has(n+key))continue;seenGraphs.add(n+key);
 const g=createGraph({vertices,arcs}),duration=lengths(g);if(duration.min<Math.floor(n/3)||duration.mean<n*.42)continue;
 let r;try{r=relativeScores(g,{maxVertices:24,maxStates:500000,timeMs:8000});}catch{continue;}
 const meta=metadata(g,r);if(Math.max(meta.opening.L.choices,meta.opening.R.choices)<2)continue;
 const serial=k+1,word=words[k%words.length];levels.push({id:`expedition-${serial}`,name:{fr:`${word[0]} ${Math.floor(k/6)+1}`,en:`${word[1]} ${Math.floor(k/6)+1}`},vertices,arcs,positions,viewport:{width:560,height:rows*145+15},meta:{...meta,sampledMoves:duration}});console.log(`Network ${levels.length}: n=${n}, moves=${duration.mean.toFixed(1)}`);
}
if(levels.length!==48)throw Error(`Only ${levels.length} levels`);
// Structural Python oracle resolves whole path positions (never sums component values).
const py=`import sys,json\nsys.path.insert(0,'tests')\nfrom path_oracle import absolute,canonical\nrows=[]\nfor n in range(22,34):\n results=[]\n for p in [0,1]:\n  a=absolute(canonical([(n,1)]),p);value=a[0]-a[1];moves=[]\n  for i in range(n):\n   if (1+i)%2!=p:continue\n   lo,hi=max(0,i-1),min(n,i+2)\n   l,r=absolute(canonical([(lo,1),(n-hi,(1+hi)%2)]),1-p)\n   moves.append({'id':'N'+str(i+1),'captured':hi-lo,'value':l-r+(1 if p==0 else -1)*(hi-lo)})\n  results.append({'value':value,'moves':moves})\n rows.append({'n':n,'Ls':results[0]['value'],'Rs':results[1]['value'],'left':results[0],'right':results[1]})\nprint(json.dumps(rows))`;
const paths=JSON.parse(execFileSync('python3',['-c',py],{encoding:'utf8'}));
for(const r of paths){const n=r.n,cols=4,rows=Math.ceil(n/cols),vertices=Array.from({length:n},(_,i)=>({id:`N${i+1}`,color:i%2?'L':'R'})),positions={};for(let i=0;i<n;i++){const row=Math.floor(i/cols),col=row%2?cols-1-i%cols:i%cols;positions[vertices[i].id]=[90+col*150,80+row*140];}const arcs=vertices.slice(1).map((v,i)=>vertices[i].color==='L'?[vertices[i].id,v.id]:[v.id,vertices[i].id]),g=createGraph({vertices,arcs});levels.push({id:`long-path-${n}`,name:{fr:`La grande traversée ${n-21}`,en:`The long crossing ${n-21}`},vertices,arcs,positions,viewport:{width:630,height:rows*140+20},meta:{...metadata(g,r),selfOpposed:n%2===0,analysis:'exact-structural-path',sampledMoves:lengths(g)}});}
fs.writeFileSync(path,'[\n'+levels.map(l=>JSON.stringify(l)).join(',\n')+'\n]\n');console.log(`Saved ${levels.length} boards after ${attempts} candidates`);
