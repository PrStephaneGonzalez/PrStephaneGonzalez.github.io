import { other, definition, createGraph, validateMask, popcount, ids, captureMask } from './graph.mjs';

function freezeState(state) {
  return Object.freeze({ ...state, scores: Object.freeze({ ...state.scores }),
    settlement: state.settlement ? Object.freeze({ ...state.settlement, vertices: Object.freeze([...state.settlement.vertices]) }) : null });
}

/** Settle immediately when the player TO MOVE has no vertex; never pass. */
function settle(graph, state) {
  if (!(state.remaining & graph.colors[state.turn])) {
    const recipient = other(state.turn), count = popcount(state.remaining);
    return freezeState({ ...state, remaining: 0n, finished: true,
      scores: { ...state.scores, [recipient]: state.scores[recipient] + count },
      settlement: count ? { reason: 'no-legal-move', player: state.turn, recipient, count, vertices: ids(graph, state.remaining) } : null });
  }
  return freezeState({ ...state, finished: false, settlement: null });
}

export function createGame(graph, first = 'L') {
  other(first);
  return settle(graph, { remaining: graph.full, turn: first, scores: { L: 0, R: 0 }, ply: 0 });
}

/** This function is the single capture API for both preview and commit. */
export function previewMove(graph, state, id) {
  if (state.finished) throw new RangeError('Game finished');
  return captureMask(graph, state.remaining, state.turn, id);
}

export function playMove(graph, state, id) {
  const captured = previewMove(graph, state, id), player = state.turn;
  const next = settle(graph, { remaining: state.remaining & ~captured, turn: other(player),
    scores: { ...state.scores, [player]: state.scores[player] + popcount(captured) }, ply: state.ply + 1 });
  return Object.freeze({ state: next, captured, capturedIds: Object.freeze(ids(graph, captured)), player });
}

export function serializeGame(graph, state) {
  return JSON.stringify({ version: 1, graph: definition(graph), state: { ...state, remaining: state.remaining.toString(16) } });
}

export function deserializeGame(text) {
  const data = JSON.parse(text);
  if (data.version !== 1 || !data.state || !/^[0-9a-f]+$/.test(data.state.remaining)) throw new TypeError('Invalid save');
  const graph = createGraph(data.graph), s = data.state;
  other(s.turn);
  const remaining = BigInt(`0x${s.remaining}`); validateMask(graph, remaining);
  if (!s.scores || !['L', 'R'].every(p => Number.isSafeInteger(s.scores[p]) && s.scores[p] >= 0)
    || !Number.isSafeInteger(s.ply) || s.ply < 0 || s.ply > graph.vertices.length
    || s.scores.L + s.scores.R + popcount(remaining) !== graph.vertices.length
    || typeof s.finished !== 'boolean' || (s.finished && remaining !== 0n)
    || (!s.finished && !(remaining & graph.colors[s.turn]))) throw new TypeError('Inconsistent save');
  // Settlement is a display event, not trusted persisted rule state.
  return { graph, state: freezeState({ remaining, turn: s.turn, scores: s.scores, ply: s.ply, finished: s.finished, settlement: null }) };
}

/** Presentation shortcut: a one-colour remainder has a unique final allocation.
 * Keep createGame/playMove unchanged for the original mathematical rule set.
 */
export function finishMonochrome(graph, state) {
  if (state.finished || !state.remaining) return state;
  const red = state.remaining & graph.colors.L, blue = state.remaining & graph.colors.R;
  if (red && blue) return state;
  const recipient = red ? 'L' : 'R', count = popcount(state.remaining);
  return freezeState({ ...state, remaining: 0n, finished: true,
    scores: { ...state.scores, [recipient]: state.scores[recipient] + count },
    settlement: { reason: 'one-color', player: other(recipient), recipient,
      count, vertices: ids(graph, state.remaining) } });
}
