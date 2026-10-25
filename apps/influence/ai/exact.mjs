import { captureMask, legalMoves, other, popcount, validateMask } from '../engine/graph.mjs';

export class SearchLimit extends Error {
  constructor(reason) { super(reason); this.name = 'SearchLimit'; }
}

/** No forced removal, no dominance pruning, no sum-of-component scores.
 * Values are FUTURE score differences L-R, excluding points already won.
 * One solver instance owns exactly one graph and its transposition table.
 */
export function createExactSolver(graph, { maxVertices = 24, maxStates = 1_000_000, timeMs = 2000 } = {}) {
  if (!Number.isInteger(maxVertices) || maxVertices < 0 || !Number.isInteger(maxStates) || maxStates < 1
      || !Number.isFinite(timeMs) || timeMs <= 0) throw new RangeError('Invalid search budget');
  const cache = new Map();
  let deadline, visited, calls;
  function visit(mask, player) {
    if ((++calls === 1 || calls % 128 === 0) && performance.now() > deadline) throw new SearchLimit('time');
    const key = (mask << 1n) | (player === 'R' ? 1n : 0n);
    if (cache.has(key)) return cache.get(key);
    if (cache.size >= maxStates) throw new SearchLimit('states');
    visited++;
    const moves = legalMoves(graph, mask, player), sign = player === 'L' ? 1 : -1;
    let value = -sign * popcount(mask);
    if (moves.length) {
      value = player === 'L' ? -Infinity : Infinity;
      for (const id of moves) {
        const captured = captureMask(graph, mask, player, id);
        const score = sign * popcount(captured) + visit(mask & ~captured, other(player));
        value = player === 'L' ? Math.max(value, score) : Math.min(value, score);
      }
    }
    if (cache.size >= maxStates) throw new SearchLimit('states');
    cache.set(key, value === 0 ? 0 : value);
    return value === 0 ? 0 : value;
  }
  function solve(remaining = graph.full, player = 'L') {
    validateMask(graph, remaining); other(player);
    const start = performance.now(); deadline = start + timeMs; visited = 0; calls = 0;
    try {
      if (popcount(remaining) > maxVertices) throw new SearchLimit('vertices');
      const value = visit(remaining, player), sign = player === 'L' ? 1 : -1;
      const moves = legalMoves(graph, remaining, player).map(id => {
        const captured = captureMask(graph, remaining, player, id);
        return Object.freeze({ id, captured: popcount(captured), value: sign * popcount(captured) + visit(remaining & ~captured, other(player)) });
      });
      return Object.freeze({ exact: true, value, moves: Object.freeze(moves),
        bestMoves: Object.freeze(moves.filter(m => m.value === value).map(m => m.id)),
        stats: Object.freeze({ visited, cached: cache.size, elapsedMs: performance.now() - start }) });
    } catch (error) {
      if (!(error instanceof SearchLimit)) throw error;
      // Fully evaluated subtrees are safe to retain; incomplete nodes were not cached.
      return Object.freeze({ exact: false, reason: error.message, stats: Object.freeze({ visited, cached: cache.size, elapsedMs: performance.now() - start }) });
    }
  }
  return Object.freeze({ solve, clear: () => cache.clear() });
}

export function relativeScores(graph, options) {
  const solver = createExactSolver(graph, options), left = solver.solve(graph.full, 'L'), right = solver.solve(graph.full, 'R');
  if (!left.exact || !right.exact) throw new SearchLimit(`Unsolved graph: ${left.reason ?? right.reason}`);
  return { Ls: left.value, Rs: right.value, left, right };
}
