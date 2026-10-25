import assert from 'node:assert/strict';
import { relativeScores } from '../ai/exact.mjs';
import { segment, table1 } from '../levels/reference.mjs';

const max = Number(process.argv.find(s=>s.startsWith('--max='))?.split('=')[1] ?? 24);
if(!Number.isInteger(max)||max<1||max>38)throw new RangeError('max must be 1..38');
const started=performance.now();
for(let n=1;n<=max;n++) {
  const start=performance.now();
  const result=relativeScores(segment(n),{maxVertices:38,maxStates:4_000_000,timeMs:60000});
  assert.deepEqual([result.Ls,result.Rs],table1[n-1],`n=${n}`);
  console.log(JSON.stringify({n,Ls:result.Ls,Rs:result.Rs,states:result.right.stats.cached,elapsedMs:Math.round(performance.now()-start)}));
}
console.log(JSON.stringify({ok:true,verified:max,elapsedMs:Math.round(performance.now()-started)}));
