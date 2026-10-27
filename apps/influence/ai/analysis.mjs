// Post-game analysis: replays a finished game with the exact solver and finds the decisive move.
// Pure functions; runs in the AI worker. Positions too large for the budget are marked inexact.
import { legalMoves, popcount, captureMask } from '../engine/graph.mjs';
import { playMove, finishMonochrome } from '../engine/game.mjs';
import { createExactSolver } from './exact.mjs';

const sameState = (a, b) => a.remaining === b.remaining && a.scores.L === b.scores.L && a.scores.R === b.scores.R;

/** The move that leads from `before` to `after` (any equivalent one), or null for a pure ending step. */
export function moveBetween(graph, before, after) {
  if (before.finished) return null;
  for (const id of legalMoves(graph, before.remaining, before.turn)) {
    const next = finishMonochrome(graph, playMove(graph, before, id).state);
    if (sameState(next, after)) return id;
  }
  return null;
}

/**
 * states: the positions of one game, first to last (history + final state).
 * Returns { moves:[{ply, player, id, exact, best, chosen, bestIds, capturedChosen, capturedBest}], complete }.
 * `best` and `chosen` are final score differences from the mover's point of view, under perfect play afterwards.
 */
export function analyzeGame(graph, states, { timeMs = 3000, maxStates = 1_500_000, maxVertices = 40 } = {}) {
  const deadline = Date.now() + timeMs;
  const solver = createExactSolver(graph, { maxVertices, maxStates, timeMs: Math.max(1, timeMs) });
  const plies = [];
  for (let ply = 0; ply + 1 < states.length; ply++) {
    const id = moveBetween(graph, states[ply], states[ply + 1]);
    if (id) plies.push({ ply, id });
  }
  // Last positions first: they are small, and their values fill the table used by the earlier ones.
  const records = new Map();
  for (const { ply, id } of [...plies].reverse()) {
    const before = states[ply], player = before.turn, persp = player === 'L' ? 1 : -1, d = before.scores.L - before.scores.R;
    const record = { ply, player, id, exact: false, capturedChosen: popcount(captureMask(graph, before.remaining, player, id)) };
    if (Date.now() < deadline) {
      let r = null;
      try { r = solver.solve(before.remaining, player); } catch { r = null; }
      if (r?.exact) {
        const chosen = r.moves.find(m => m.id === id), bestIds = r.bestMoves.slice(), best = r.moves.find(m => m.id === bestIds[0]);
        Object.assign(record, { exact: true, best: persp * (d + r.value), chosen: persp * (d + chosen.value), bestIds, capturedBest: best.captured });
      }
    }
    records.set(ply, record);
  }
  const moves = plies.map(({ ply }) => records.get(ply));
  return { moves, complete: moves.every(m => m.exact) };
}

const outcome = v => Math.sign(v); // 1 win, 0 draw, -1 loss, from the mover's point of view

/**
 * What to tell the player. `side` is the human side in solo, null in duo (both players are judged).
 * kind: 'decisive' (a winning/drawing chance was thrown away), 'improvable' (still the best outcome, fewer points),
 * 'perfect' (every move was optimal), 'unknown' (not enough exact positions). Also `gift` (solo: the computer's error).
 */
export function summarize(analysis, side = null) {
  const mine = analysis.moves.filter(m => side === null || m.player === side);
  const theirs = side === null ? [] : analysis.moves.filter(m => m.player !== side);
  const number = m => analysis.moves.filter(x => x.player === m.player && x.ply <= m.ply).length;
  let report = { kind: 'unknown' };
  for (const m of mine) {
    if (!m.exact) break; // an earlier unknown position: do not blame a later move
    if (outcome(m.chosen) < outcome(m.best)) { report = { kind: 'decisive', move: m, turn: number(m), lost: outcome(m.best), got: outcome(m.chosen) }; break; }
  }
  if (report.kind === 'unknown') {
    const first = mine.find(m => m.exact && m.chosen < m.best);
    if (first && mine.slice(0, mine.indexOf(first)).every(m => m.exact)) report = { kind: 'improvable', move: first, turn: number(first), points: (first.best - first.chosen) / 2 };
    else if (mine.length && mine.every(m => m.exact && m.chosen === m.best)) report = { kind: 'perfect' };
  }
  const gift = theirs.find(m => m.exact && outcome(m.chosen) < outcome(m.best));
  if (gift) report.gift = { move: gift, turn: number(gift) };
  return report;
}
