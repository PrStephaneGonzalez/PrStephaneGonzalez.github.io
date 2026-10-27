import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGraph, captureMask, popcount, legalMoves, other } from '../engine/graph.mjs';
import { createGame, playMove, finishMonochrome } from '../engine/game.mjs';
import { createExactSolver, relativeScores } from '../ai/exact.mjs';
import { analyzeGame, summarize, moveBetween } from '../ai/analysis.mjs';
import { composeLevels, mirrorLevel, imposedSide } from '../levels/compose.mjs';
import * as P from '../ui/profiles.mjs';

const read = f => JSON.parse(readFileSync(new URL(`../levels/${f}`, import.meta.url)));
const catalog = read('catalog.json'), journey = read('journey.json');
const { levels, groups } = composeLevels(catalog, journey);
const byId = id => levels.find(l => l.id === id);

test('journey: first steps, then every catalog board once, then 12 Blue-side traps, in measured order', () => {
  assert.equal(levels.length, 5 + 72 + 12);
  assert.equal(new Set(levels.map(l => l.id)).size, levels.length);
  for (const l of catalog) assert.ok(byId(l.id), l.id);
  assert.deepEqual(groups.map(g => g[2]), ['chapter0', 'chapter1', 'chapter2', 'chapter5', 'chapter3', 'chapter4']);
  assert.deepEqual(groups.map(g => g[1] - g[0]), [5, 12, 18, 24, 18, 12]);
  assert.ok(levels.slice(0, 5).every(l => l.meta.tutorial) && levels.slice(5).every(l => !l.meta.tutorial));
  for (const l of levels) { assert.ok([1, 2, 3].includes(l.meta.difficulty?.dots), l.id); createGraph(l); }
  // Inside a chapter boards go from the easiest to the hardest (traps: by pairs, each next to its mirror).
  for (const [a, b, key] of groups) {
    const bits = levels.slice(a, b).map(l => l.meta.difficulty.bits);
    if (key === 'chapter5') {
      for (let i = a; i < b; i += 2) assert.equal(levels[i + 1].id, `${levels[i].id}-blue`);
      continue;
    }
    if (key === 'chapter0') continue;
    for (let i = 1; i < bits.length; i++) assert.ok(bits[i] >= bits[i - 1], `${key} order`);
  }
});

test('mirrors: same board seen from Blue; when Blue starts, every greedy opening loses for Blue', () => {
  for (const l of catalog.filter(x => x.id.startsWith('trap-'))) {
    const m = byId(`${l.id}-blue`), g = createGraph(m), r = relativeScores(g);
    assert.deepEqual([r.Ls, r.Rs], [m.meta.Ls, m.meta.Rs]);
    assert.deepEqual([m.meta.Ls, m.meta.Rs], [-l.meta.Rs, -l.meta.Ls]);
    assert.equal(imposedSide(m), 'R'); assert.equal(imposedSide(l), 'L');
    const moves = r.right.moves, max = Math.max(...moves.map(x => x.captured));
    assert.ok(r.Rs < 0, 'Blue wins when it starts');
    assert.ok(moves.filter(x => x.captured === max).every(x => x.value > 0), `${m.id}: greedy loses for Blue`);
    assert.deepEqual(moves.filter(x => x.value < 0).map(x => x.id).sort(), [...l.meta.trap.keys].sort());
  }
  const twice = mirrorLevel(mirrorLevel(catalog[0]));
  assert.deepEqual([twice.vertices, twice.arcs], [catalog[0].vertices, catalog[0].arcs]);
});

/** Red-first principal variation of a tutorial board. */
function line(l) {
  const g = createGraph(l), solver = createExactSolver(g);
  let mask = g.full, player = 'L', plies = 0;
  while (mask & g.colors[player]) { const r = solver.solve(mask, player); mask &= ~captureMask(g, mask, player, r.bestMoves[0]); player = other(player); plies++; }
  return { g, solver, plies, settled: mask ? { to: other(player), count: popcount(mask) } : null };
}

test('first steps: each board teaches its idea (checked with the exact solver)', () => {
  const tut = levels.slice(0, 5), ids = tut.map(l => l.id);
  assert.deepEqual(ids, ['intro-arrows', 'intro-backwards', 'intro-trap', 'intro-ending', 'intro-deeper']);
  for (const l of tut) {
    const g = createGraph(l), r = relativeScores(g), m = l.meta;
    assert.deepEqual([r.Ls, r.Rs], [m.Ls, m.Rs]); assert.ok(m.Ls > 0, `${l.id}: Red can win`);
    assert.equal(imposedSide(l), 'L');
    for (const lang of ['fr', 'en']) { assert.ok(m.tutorial.coach[lang].length >= 1); assert.ok(m.tutorial.lesson[lang].length > 10); }
    const pts = Object.values(l.positions);
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) assert.ok(Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]) >= 190);
  }
  const opening = id => { const r = relativeScores(createGraph(byId(id))).left.moves, max = Math.max(...r.map(x => x.captured)); return { r, greedy: r.filter(x => x.captured === max), wins: r.filter(x => x.value > 0) }; };
  for (const id of ['intro-arrows', 'intro-backwards']) { const o = opening(id); assert.equal(o.greedy.length, 1); assert.equal(o.greedy[0].value, byId(id).meta.Ls, `${id}: the big move is right here`); }
  for (const id of ['intro-trap', 'intro-deeper']) { const o = opening(id); assert.equal(o.wins.length, 1, id); assert.ok(o.greedy.every(x => x.value < 0), `${id}: the big move loses`); assert.ok(o.greedy[0].captured - o.wins[0].captured >= 2); }
  const end = line(byId('intro-ending'));
  assert.equal(end.settled?.to, 'L'); assert.ok(end.settled.count >= 2, 'the end rule decides the game');
  assert.ok(line(byId('intro-deeper')).plies >= 4);
});

function playOut(level, first, pick) {
  const g = createGraph(level), solver = createExactSolver(g);
  let s = createGame(g, first); const states = [s];
  for (let k = 0; !s.finished; k++) { const id = pick(k, s, solver.solve(s.remaining, s.turn)); s = finishMonochrome(g, playMove(g, s, id).state); states.push(s); }
  return { g, states };
}

test('analysis: the greedy move on the trap is decisive; optimal play is flawless; duo judges both sides', () => {
  const trap = byId('intro-trap');
  const greedyId = (s, r) => r.moves.reduce((a, b) => b.captured > a.captured ? b : a).id;
  const lost = playOut(trap, 'L', (k, s, r) => k === 0 ? greedyId(s, r) : r.bestMoves[0]);
  const a = analyzeGame(lost.g, lost.states), rep = summarize(a, 'L');
  assert.ok(a.complete);
  assert.equal(rep.kind, 'decisive'); assert.equal(rep.turn, 1); assert.equal(rep.lost, 1); assert.equal(rep.got, -1);
  assert.deepEqual(rep.move.bestIds, trap.meta.tutorial.keys);
  const won = playOut(trap, 'L', (k, s, r) => r.bestMoves[0]);
  assert.equal(summarize(analyzeGame(won.g, won.states), 'L').kind, 'perfect');
  assert.equal(summarize(analyzeGame(won.g, won.states), null).kind, 'perfect');
  const duo = summarize(analyzeGame(lost.g, lost.states), null);
  assert.equal(duo.kind, 'decisive'); assert.equal(duo.move.player, 'L');
  // A small slip that keeps the win is "improvable", never "decisive".
  const big = byId('first-links'), slip = playOut(big, 'L', (k, s, r) => {
    if (s.turn === 'L') { const keep = r.moves.filter(m => Math.sign(m.value) === Math.sign(r.value) && m.value < r.value); if (keep.length && k === 0) return keep[0].id; }
    return r.bestMoves[0];
  });
  const kind = summarize(analyzeGame(slip.g, slip.states), 'L').kind;
  assert.ok(['improvable', 'perfect'].includes(kind));
});

test('analysis: moves are recovered from positions, ending-only steps are skipped, budget overruns stay unknown', () => {
  const l = byId('intro-ending'), g = createGraph(l), s0 = createGame(g, 'L');
  for (const id of legalMoves(g, s0.remaining, 'L')) {
    const s1 = finishMonochrome(g, playMove(g, s0, id).state), back = moveBetween(g, s0, s1);
    assert.equal(captureMask(g, s0.remaining, 'L', back), captureMask(g, s0.remaining, 'L', id));
  }
  assert.equal(moveBetween(g, s0, s0), null);
  const long = playOut(byId('long-path-22'), 'L', (k, s, r) => r.bestMoves[0]);
  const tight = analyzeGame(long.g, long.states, { timeMs: 1, maxStates: 50 });
  assert.equal(tight.complete, false);
  assert.ok(['unknown', 'perfect', 'improvable', 'decisive'].includes(summarize(tight, 'L').kind));
  assert.notEqual(summarize(tight, 'L').kind, 'perfect');
});

test('stars: success, Expert and perfect score; undo removes the Expert stars; draws count when forced', () => {
  assert.deepEqual(P.gameStars({ res: 2, opt: 4, expert: false }), { success: true, expert: false, perfect: false });
  assert.deepEqual(P.gameStars({ res: 2, opt: 4, expert: true }), { success: true, expert: true, perfect: false });
  assert.deepEqual(P.gameStars({ res: 4, opt: 4, expert: true }), { success: true, expert: true, perfect: true });
  assert.deepEqual(P.gameStars({ res: 4, opt: 4, expert: true, assisted: true }), { success: true, expert: false, perfect: false });
  assert.deepEqual(P.gameStars({ res: 0, opt: 0, expert: true }), { success: true, expert: true, perfect: true });
  assert.deepEqual(P.gameStars({ res: 0, opt: 2, expert: true }), { success: false, expert: false, perfect: false });
  assert.deepEqual(P.gameStars({ res: -2, opt: -2, expert: true }), { success: false, expert: false, perfect: false });
  const known = levels.map(l => l.id), id = known[7], day = '2026-10-27';
  let s = P.createProfile(P.emptyStore(), 'Ada', { id: 'a' }).store;
  s = P.recordGame(s, id, 'L', true, day); assert.equal(P.starsOf(P.activeProfile(s), id), 1);
  s = P.recordGame(s, id, 'R', true, '2026-10-28', { expert: true }); assert.equal(P.starsOf(P.activeProfile(s), id), 2);
  s = P.recordGame(s, id, 'L', true, '2026-10-29', { expert: true, perfect: true }); assert.equal(P.starsOf(P.activeProfile(s), id), 3);
  assert.deepEqual(P.activeProfile(s).levels[id], { L: day, R: '2026-10-28', E: '2026-10-28', P: '2026-10-29' });
  assert.equal(P.summary(P.activeProfile(s), known).stars, 3);
  // The extra stars survive export/import, the online merge and a reload.
  const code = P.exportProfile(s, 'a'), back = P.importProfile(P.emptyStore(), code, known, { id: 'z' }).store;
  assert.equal(P.starsOf(P.activeProfile(back), id), 3);
  assert.equal(P.mergeData({ games: 1, levels: { [id]: { L: day } } }, { games: 2, levels: { [id]: { L: day, E: day } } }).levels[id].E, day);
  assert.equal(P.starsOf(P.activeProfile(P.loadStore(JSON.parse(JSON.stringify(s)), known)), id), 3);
  // A loss records the game but no star.
  assert.equal(P.starsOf(P.activeProfile(P.recordGame(P.emptyStore(), id, 'L', false, day)), id), 0);
});
