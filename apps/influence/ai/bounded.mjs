import {legalMoves,captureMask,popcount,other} from '../engine/graph.mjs';
/** Iterative deepening of the entire position. Incomplete iterations are discarded. */
export function boundedMove(graph,state,fallback,{timeMs=650,maxNodes=40000}={}){
 const deadline=performance.now()+timeMs;let calls=0,best=fallback,completed=0;
 const sign=p=>p==='L'?1:-1;
 function leaf(mask){return popcount(mask&graph.colors.L)-popcount(mask&graph.colors.R);}
 function visit(mask,p,depth,alpha,beta){
  if(++calls>maxNodes||calls%32===0&&performance.now()>deadline)throw Error('budget');
  const moves=legalMoves(graph,mask,p);if(!moves.length)return -sign(p)*popcount(mask);if(!depth)return leaf(mask);
  let value=p==='L'?-Infinity:Infinity;
  const ordered=moves.map(id=>{const c=captureMask(graph,mask,p,id);return {id,c,n:popcount(c)};}).sort((a,b)=>b.n-a.n);
  for(const m of ordered){const gain=sign(p)*m.n,v=gain+visit(mask&~m.c,other(p),depth-1,alpha-gain,beta-gain);
   value=p==='L'?Math.max(value,v):Math.min(value,v);if(p==='L')alpha=Math.max(alpha,value);else beta=Math.min(beta,value);if(alpha>=beta)break;}
  return value;
 }
 for(let depth=2;depth<=8;depth++)try{
  let choice=best,value=state.turn==='L'?-Infinity:Infinity;
  for(const id of legalMoves(graph,state.remaining,state.turn)){
   const c=captureMask(graph,state.remaining,state.turn,id),v=sign(state.turn)*popcount(c)+visit(state.remaining&~c,other(state.turn),depth-1,-Infinity,Infinity);
   if(state.turn==='L'?v>value:v<value){value=v;choice=id;}
  }
  best=choice;completed=depth;
 }catch{break;}
 return {id:best,exact:false,reason:'bounded-search',depth:completed};
}
