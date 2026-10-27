import { createGraph } from '../engine/graph.mjs';
import { chooseMove } from './choose.mjs?v=large1';
import { analyzeGame } from './analysis.mjs?v=journey1';
self.onmessage = ({ data }) => {
 try {
  const graph=createGraph(data.graph);
  if(data.type==='analyze'){
   const states=data.states.map(s=>({...s,remaining:BigInt(s.remaining)}));
   self.postMessage({request:data.request,analysis:analyzeGame(graph,states,{timeMs:data.timeMs??3000})});return;
  }
  const result=chooseMove(graph,{...data.state,remaining:BigInt(data.state.remaining)}, {difficulty:data.difficulty,seed:data.seed,budget:{maxVertices:20,maxStates:200000,timeMs:700}});
  self.postMessage({request:data.request,result});
 }catch(error){self.postMessage({request:data.request,error:String(error)});}
};
