// Chapter 5, « Pièges gloutons »: boards where grabbing the most pieces is a big mistake.
// Grids with diagonal arcs, solved exactly. A board is kept only if, Red starting:
//  - Red wins with correct play (Ls > 0),
//  - every greedy opening (largest immediate capture) LOSES for Red (value < 0),
//  - at most two opening moves win (the « key pieces »),
//  - the greedy move captures clearly more than a winning move (a real temptation).
import fs from 'node:fs';
import {createGraph,captureMask,popcount} from '../engine/graph.mjs';
import {createGame,playMove,finishMonochrome} from '../engine/game.mjs';
import {relativeScores,createExactSolver} from '../ai/exact.mjs';
import {seededRandom,chooseMove} from '../ai/choose.mjs';

const path=new URL('../levels/catalog.json',import.meta.url);
const catalog=JSON.parse(fs.readFileSync(path)).filter(l=>!l.id.startsWith('trap-'));
const random=seededRandom(Number(process.env.SEED??20261026));
const classify=(Ls,Rs)=>Ls>0&&Rs>0?'red':Ls<0&&Rs<0?'blue':Ls>0&&Rs<0?'first':Ls===0&&Rs===0?'draw':Ls>0?'red-draw':'blue-draw';
function lengths(g){const runs=[];for(const first of ['L','R'])for(let seed=1;seed<=6;seed++){let s=createGame(g,first),moves=0;while(!s.finished){s=finishMonochrome(g,playMove(g,s,chooseMove(g,s,{difficulty:seed%2?'normal':'easy',seed:seed*31+moves}).id).state);moves++;}runs.push(moves);}return {min:Math.min(...runs),max:Math.max(...runs),mean:runs.reduce((a,b)=>a+b)/runs.length};}
function opening(g,result,p){const sign=p==='L'?1:-1,max=Math.max(...result.moves.map(m=>m.captured)),greedy=result.moves.filter(m=>m.captured===max).map(m=>m.value),caps=result.moves.map(m=>captureMask(g,g.full,p,m.id));
 return {greedyGap:sign*(result.value-(p==='L'?Math.max(...greedy):Math.min(...greedy)))||0,choices:new Set(result.moves.map(m=>m.value)).size,nonDominated:caps.filter((m,i)=>!caps.some((o,j)=>i!==j&&m!==o&&(m&o)===m)).length};}
const segDist=([px,py],[ax,ay],[bx,by])=>{const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy)));return Math.hypot(px-ax-t*dx,py-ay-t*dy);};

// Geometry: a jittered 4-column grid. Every square may carry one diagonal (never both).
function geometry(n){
 const cols=4,rows=Math.ceil(n/cols),sx=150,sy=135;
 const cells=[];for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)cells.push([r,c]);
 let keep=cells.slice(0,(rows-1)*cols),last=cells.slice((rows-1)*cols).sort(()=>random()-.5).slice(0,n-keep.length).sort((a,b)=>a[1]-b[1]);keep=keep.concat(last);
 const pos=keep.map(([r,c])=>[90+c*sx+Math.round((random()-.5)*44),80+r*sy+Math.round((random()-.5)*40)]);
 for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(Math.hypot(pos[i][0]-pos[j][0],pos[i][1]-pos[j][1])<110)return null;
 const at=new Map(keep.map(([r,c],i)=>[`${r},${c}`,i])),pairs=[];
 for(const [i,[r,c]] of keep.entries()){
  for(const [dr,dc] of [[0,1],[1,0]]){const j=at.get(`${r+dr},${c+dc}`);if(j!==undefined)pairs.push({i,j,diag:false});}
  // One diagonal per square: from the top-left corner (\) or from the top-right corner (/).
  const d=at.get(`${r+1},${c+1}`),e=at.get(`${r},${c+1}`),f=at.get(`${r+1},${c}`);
  if(d!==undefined&&e!==undefined&&f!==undefined)pairs.push({i,j:d,alt:[e,f],diag:true});
  else if(d!==undefined)pairs.push({i,j:d,diag:true});else if(e!==undefined&&f!==undefined)pairs.push({i:e,j:f,diag:true});
 }
 for(const p of pairs)for(const q of [[p.i,p.j],...(p.alt?[p.alt]:[])])for(let k=0;k<n;k++)if(k!==q[0]&&k!==q[1]&&segDist(pos[k],pos[q[0]],pos[q[1]])<58)return null;
 return {n,keep,pos,pairs};
}
// State: per pair 0 = absent, 1 = i→j, 2 = j→i (diagonals with an alternative: 3/4 = the other diagonal); colours.
function randomState(geo){return {arcs:geo.pairs.map(p=>random()<(p.diag?.4:.62)?1+Math.floor(random()*(p.alt?4:2)):0),colors:Array.from({length:geo.n},()=>random()<.5?'L':'R')};}
function mutate(geo,s){const x={arcs:s.arcs.slice(),colors:s.colors.slice()},k=1+Math.floor(random()*2);
 for(let z=0;z<k;z++){if(random()<.72){const i=Math.floor(random()*geo.pairs.length),p=geo.pairs[i],m=p.alt?5:3;x.arcs[i]=(x.arcs[i]+1+Math.floor(random()*(m-1)))%m;}
  else{const i=Math.floor(random()*geo.n),j=Math.floor(random()*geo.n);[x.colors[i],x.colors[j]]=[x.colors[j],x.colors[i]];if(random()<.3)x.colors[i]=x.colors[i]==='L'?'R':'L';}}
 return x;}
function build(geo,s){
 const n=geo.n,vertices=geo.keep.map((_,i)=>({id:`N${i+1}`,color:s.colors[i]})),arcs=[];let diagonals=0;
 geo.pairs.forEach((p,k)=>{const v=s.arcs[k];if(!v)return;const [a,b]=v<=2?[p.i,p.j]:p.alt;const fwd=v===1||v===3;arcs.push(fwd?[vertices[a].id,vertices[b].id]:[vertices[b].id,vertices[a].id]);if(p.diag)diagonals++;});
 if(diagonals<2)return null;
 const degree=vertices.map(v=>arcs.filter(a=>a.includes(v.id)).length);if(degree.some(d=>d===0||d>4))return null;
 const seen=new Set([vertices[0].id]);for(let z=0;z<n;z++)for(const[a,b]of arcs)if(seen.has(a)||seen.has(b)){seen.add(a);seen.add(b);}if(seen.size<n)return null;
 const red=s.colors.filter(c=>c==='L').length;if(red<3||n-red<3)return null;
 const minX=Math.min(...geo.pos.map(p=>p[0])),minY=Math.min(...geo.pos.map(p=>p[1])),shift=[90-minX,80-minY];
 const positions=Object.fromEntries(vertices.map((v,i)=>[v.id,[geo.pos[i][0]+shift[0],geo.pos[i][1]+shift[1]]]));
 const width=Math.max(...Object.values(positions).map(p=>p[0]))+90,height=Math.max(...Object.values(positions).map(p=>p[1]))+80;
 return {vertices,arcs,positions,viewport:{width,height},diagonals};
}
// Exact evaluation of the trap seen by Red, who starts.
function evaluate(c){
 const g=createGraph(c);let r;try{r=relativeScores(g,{maxVertices:24,maxStates:3_000_000,timeMs:20000});}catch{return null;}
 const moves=r.left.moves,max=Math.max(...moves.map(m=>m.captured)),greedy=moves.filter(m=>m.captured===max),winners=moves.filter(m=>m.value>0);
 const greedyBest=Math.max(...greedy.map(m=>m.value)),temptation=winners.length?max-Math.max(...winners.map(m=>m.captured)):0,gap=r.Ls-greedyBest;
 const n=g.vertices.length,keyCap=winners.length?Math.max(...winners.map(m=>m.captured)):n,third=Math.ceil(n/3);
 const valid=r.Ls>0&&r.Ls<=6&&greedyBest<0&&winners.length>=1&&winners.length<=2&&temptation>=2&&keyCap<=third;
 const f=3*gap+Math.min(r.Ls,4)-3*Math.max(0,r.Ls-6)-3*Math.max(0,keyCap-third)-4*Math.max(0,greedyBest+1)-2*Math.max(0,winners.length-2)-2*Math.max(0,2-temptation)-(r.Ls>0?0:8)+(winners.length===1?1:0);
 return {g,r,gap,temptation,winners:winners.map(m=>m.id),greedy:greedy.map(m=>m.id),valid,f};
}
function principalLength(g,first){const solver=createExactSolver(g,{maxVertices:24,maxStates:3_000_000,timeMs:20000});let s=finishMonochrome(g,playMove(g,createGame(g,'L'),first).state),moves=1;
 while(!s.finished){const res=solver.solve(s.remaining,s.turn);if(!res.exact)return 0;s=finishMonochrome(g,playMove(g,s,res.bestMoves[0]).state);moves++;}return moves;}
function search(n,restarts,steps){
 const found=[];
 for(let rs=0;rs<restarts;rs++){let geo=null;while(!geo)geo=geometry(n);
  let s=randomState(geo),c=build(geo,s),e=c&&evaluate(c);let tries=0;while(!e&&tries++<200){s=randomState(geo);c=build(geo,s);e=c&&evaluate(c);}if(!e)continue;
  for(let k=0;k<steps;k++){const s2=mutate(geo,s),c2=build(geo,s2);if(!c2)continue;const e2=evaluate(c2);if(!e2)continue;
   if(e2.f>=e.f||random()<Math.exp((e2.f-e.f)/Math.max(.4,2*(1-k/steps)))){s=s2;c=c2;e=e2;if(e.valid)found.push({c,...e});}}
 }
 return found;
}
const sizes=(process.env.SIZES??'10,10,11,11,12,12,13,13,14,14,15,16').split(',').map(Number);
const names=[['L’appât','The bait'],['Le cadeau empoisonné','The poisoned gift'],['Trop beau pour être vrai','Too good to be true'],['Le pion clé','The key piece'],['La fausse bonne affaire','The false bargain'],['Gourmandise','Greed'],['Le coup patient','The patient move'],['La clé de voûte','The keystone'],['Qui trop embrasse…','Grasp all, lose all'],['Le sacrifice','The sacrifice'],['Le pion décisif','The decisive piece'],['Le dernier piège','The last trap']];
const traps=[],seenGraphs=new Set(catalog.map(l=>JSON.stringify([l.vertices,l.arcs])));let tried=0,solved=0;
for(const [k,n] of sizes.entries()){
 const pool=search(n,Number(process.env.RESTARTS??30),Number(process.env.STEPS??600)),uniq=new Map();
 if(process.env.REPORT){const h={};for(const x of pool)h[x.gap]=(h[x.gap]||0)+1;console.log('n',n,'gaps',JSON.stringify(h));}
 for(const x of pool){const key=JSON.stringify([x.c.vertices,x.c.arcs]);if(!seenGraphs.has(key)&&!uniq.has(key))uniq.set(key,{...x,key});}
 const ranked=[...uniq.values()].sort((a,b)=>(b.gap*3+b.temptation+(b.winners.length===1?3:0)+b.c.diagonals*.3)-(a.gap*3+a.temptation+(a.winners.length===1?3:0)+a.c.diagonals*.3));
 let best=null;for(const x of ranked.slice(0,80)){const pv=principalLength(x.g,x.winners[0]);if(pv<Math.ceil(n/3))continue;const d=lengths(x.g);if(process.env.REPORT)console.log('  cand gap',x.gap,'Ls',x.r.Ls,'keys',x.winners.length,'tempt',x.temptation,'pv',pv,'len',d.min,d.mean.toFixed(1));if(d.mean>=n*.3&&d.min>=3){best={...x,duration:d,pv};break;}}
 if(!best)throw Error(`No trap found for n=${n}`);
 const {c,g,r,duration}=best;seenGraphs.add(best.key);
 const meta={Ls:r.Ls,Rs:r.Rs,type:classify(r.Ls,r.Rs),vertices:n,red:popcount(g.colors.L),blue:popcount(g.colors.R),arcs:g.arcs.length,selfOpposed:false,opening:{L:opening(g,r.left,'L'),R:opening(g,r.right,'R')},trap:{side:'L',keys:best.winners,greedy:best.greedy,gap:best.gap,temptation:best.temptation,principalMoves:best.pv},sampledMoves:duration};
 traps.push({id:`trap-${k+1}`,name:{fr:names[k][0],en:names[k][1]},vertices:c.vertices,arcs:c.arcs,positions:c.positions,viewport:c.viewport,meta});
 console.log(`trap-${k+1} n=${n} Ls=${r.Ls} greedy ${best.greedy.join('/')} → ${r.Ls-best.gap} (gap ${best.gap}, +${best.temptation} pieces) · key ${best.winners.join('/')} · diag ${c.diagonals} · pv ${best.pv} · len ${duration.mean.toFixed(1)} · pool ${uniq.size}`);
}
const out=catalog.concat(traps);
fs.writeFileSync(path,'[\n'+out.map(l=>JSON.stringify(l)).join(',\n')+'\n]\n');console.log(`Saved ${out.length} boards`);
