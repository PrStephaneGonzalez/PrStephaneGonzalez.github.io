import { createGraph } from '../engine/graph.mjs';
import { chooseMove } from './choose.mjs?v=large1';
self.onmessage = ({ data }) => {
 try {
  const graph=createGraph(data.graph);
  const result=chooseMove(graph,{...data.state,remaining:BigInt(data.state.remaining)}, {difficulty:data.difficulty,seed:data.seed,budget:{maxVertices:20,maxStates:200000,timeMs:700}});
  self.postMessage({request:data.request,result});
 }catch(error){self.postMessage({request:data.request,error:String(error)});}
};
