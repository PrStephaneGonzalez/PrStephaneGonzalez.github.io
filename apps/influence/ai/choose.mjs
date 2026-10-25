import { captureMask, legalMoves, other, popcount } from '../engine/graph.mjs';
import { createExactSolver } from './exact.mjs';

export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}

/** Phase-A adapters; UI difficulty calibration comes in phase C. */
export function chooseMove(graph, state, { difficulty = 'expert', seed = 1, budget } = {}) {
  if (!['easy', 'normal', 'expert'].includes(difficulty)) throw new TypeError('Unknown difficulty');
  if (state.finished) return { id: null, exact: true, reason: 'finished' };
  const moves = legalMoves(graph, state.remaining, state.turn);
  if (!moves.length) return { id: null, exact: true, reason: 'terminal' };
  if (difficulty === 'expert') {
    const result = createExactSolver(graph, budget).solve(state.remaining, state.turn);
    if (result.exact) return { id: result.bestMoves[0], exact: true, value: result.value, stats: result.stats };
    return { ...chooseMove(graph, state, { difficulty: 'normal', seed }), exact: false, reason: result.reason };
  }
  const random = seededRandom(seed);
  if (difficulty === 'easy') return { id: moves[Math.floor(random() * moves.length)], exact: false };
  // Deterministic two-ply capture heuristic, including immediate terminal allocation.
  const evaluations = moves.map(id => {
    const capture = captureMask(graph, state.remaining, state.turn, id), rest = state.remaining & ~capture;
    const replies = legalMoves(graph, rest, other(state.turn));
    const response = replies.length ? Math.max(...replies.map(r => {
      const c = captureMask(graph, rest, other(state.turn), r), after = rest & ~c;
      return popcount(c) + (legalMoves(graph, after, state.turn).length ? 0 : popcount(after));
    })) : -popcount(rest);
    return { id, score: popcount(capture) - response };
  });
  const best = Math.max(...evaluations.map(m => m.score));
  const tied = evaluations.filter(m => m.score === best);
  return { id: tied[Math.floor(random() * tied.length)].id, exact: false };
}
