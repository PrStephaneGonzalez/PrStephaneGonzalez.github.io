import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { table1, segment } from '../levels/reference.mjs';
import { relativeScores } from '../ai/exact.mjs';

test('Independent structural Python checker reproduces all 38 published path values',()=>{
  const text=execFileSync(process.env.PYTHON??'python3',[fileURLToPath(new URL('./path_oracle.py',import.meta.url)),'38'],{encoding:'utf8',timeout:60000});
  const rows=text.trim().split('\n').map(JSON.parse);
  assert.equal(rows.length,38);
  for(const row of rows) {
    assert.deepEqual([row.Ls,row.Rs],table1[row.n-1],`Python/table n=${row.n}`);
    if(row.n<=24) {
      const v=relativeScores(segment(row.n),{timeMs:10000});
      assert.deepEqual([v.Ls,v.Rs],[row.Ls,row.Rs],`JS/Python n=${row.n}`);
    }
  }
  console.log(JSON.stringify({independentPaths:38,...rows.at(-1)}));
});
