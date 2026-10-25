import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { createGraph, opposite, disjointUnion, captureMask, ids, legalMoves, popcount } from '../engine/graph.mjs';
import { createGame, playMove, previewMove } from '../engine/game.mjs';
import { createExactSolver, relativeScores } from '../ai/exact.mjs';
import { chooseMove } from '../ai/choose.mjs';

const start = performance.now();
const python = spawn(process.env.PYTHON ?? 'python3', [fileURLToPath(new URL('./oracle.py', import.meta.url))], { stdio: ['pipe', 'pipe', 'inherit'] });
const exited = new Promise((resolve, reject) => { python.once('error', reject); python.once('exit', code => code === 0 ? resolve() : reject(new Error(`Oracle exited ${code}`))); });
python.stdin.end(JSON.stringify({ max_exhaustive: 4, random_count: 1200, seed: 20261025 }));
let checked = 0, random = 0, sums = 0, transitions = 0, reachable = 0;
const bySize = {};

try {
  for await (const line of createInterface({ input: python.stdout, crlfDelay: Infinity })) {
    const c = JSON.parse(line), graph = createGraph(c.graph), n = graph.vertices.length;
    const solver = createExactSolver(graph, { timeMs: 5000 });
    const left = solver.solve(graph.full, 'L'), right = solver.solve(graph.full, 'R');
    assert(left.exact && right.exact);
    assert.equal(left.value, c.left[0] - c.left[1], line);
    assert.equal(right.value, c.right[0] - c.right[1], line);
    for (const absolute of [c.left, c.right]) assert.equal(absolute[0] + absolute[1], n);
    assert(left.value >= right.value, `zugzwang: ${line}`);
    assert.equal(Math.abs(left.value % 2), n % 2);
    assert.equal(Math.abs(right.value % 2), n % 2);
    const neg = relativeScores(opposite(graph));
    assert.equal(neg.Ls, -right.value || 0);
    assert.equal(neg.Rs, -left.value || 0);
    if (n <= 3 || (c.family === 'random' && random % 20 === 0)) {
      const sum = relativeScores(disjointUnion(graph, opposite(graph)), { maxVertices: 24, timeMs: 5000 });
      assert.equal(sum.Ls, 0); assert.equal(sum.Rs, 0); sums++;
    }
    // Walk actual game transitions; memoization here only avoids revisiting
    // a JS rule state. The Python score oracle above has no memoization.
    const seen = new Set();
    function walk(state) {
      const key = `${state.remaining}/${state.turn}`;
      if (seen.has(key)) return;
      seen.add(key);
      assert.equal(state.scores.L + state.scores.R + popcount(state.remaining), n);
      if (state.finished) { assert.equal(state.scores.L + state.scores.R, n); return; }
      const a = solver.solve(state.remaining, 'L'), b = solver.solve(state.remaining, 'R');
      assert(a.exact && b.exact && a.value >= b.value); reachable++;
      for (const id of legalMoves(graph, state.remaining, state.turn)) {
        const preview = previewMove(graph, state, id), result = playMove(graph, state, id);
        assert.equal(result.captured, preview);
        assert.deepEqual(result.capturedIds, ids(graph, captureMask(graph, state.remaining, state.turn, id)));
        transitions++;
        walk(result.state);
      }
    }
    if (n <= 4 || c.family === 'random' && random < 200) {
      walk(createGame(graph, 'L')); walk(createGame(graph, 'R'));
    }
    if (c.family === 'random') {
      for (const first of ['L', 'R']) {
        const state = createGame(graph, first);
        for (const difficulty of ['easy', 'normal', 'expert']) {
          const a = chooseMove(graph, state, { difficulty, seed: 42 });
          assert.deepEqual(a, { ...chooseMove(graph, state, { difficulty, seed: 42 }), ...(a.stats ? { stats: a.stats } : {}) });
          if (state.finished) assert.equal(a.id, null);
          else {
            assert(legalMoves(graph, state.remaining, state.turn).includes(a.id));
            if (difficulty === 'expert') assert((first === 'L' ? left : right).bestMoves.includes(a.id));
          }
        }
      }
      random++;
    } else bySize[n] = (bySize[n] ?? 0) + 1;
    checked++;
    if (checked % 10000 === 0) console.error(`Compared ${checked} graphs…`);
  }
  await exited;
} catch (e) { python.kill(); throw e; }
assert.deepEqual(bySize, { 0: 1, 1: 2, 2: 16, 3: 512, 4: 65536 });
assert.equal(random, 1200);
console.log(JSON.stringify({ ok: true, checked, exhaustiveBySize: bySize, random, oppositeSums: sums, reachablePositions: reachable, transitions, elapsedMs: Math.round(performance.now() - start) }, null, 2));
