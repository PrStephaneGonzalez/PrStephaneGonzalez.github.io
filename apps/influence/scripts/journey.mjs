// Orders the boards by measured difficulty and adds the Blue-side mirrors of the greedy traps.
// Writes levels/journey.json { tutorial, mirrors, chapters, difficulty } (tutorial kept from tutorial-levels.mjs).
//
// Difficulty = information the player needs to keep the best reachable outcome against perfect play,
// in bits: along the principal variation, each of the player's turns adds log2(legal moves / good moves),
// where a good move keeps the best reachable outcome (win, draw or loss). Measured for the side the player
// has by default (Red, Red starts) or the side a board imposes (traps, first steps).
import { readFileSync, writeFileSync } from 'node:fs';
import { createGraph, captureMask, other } from '../engine/graph.mjs';
import { createExactSolver } from '../ai/exact.mjs';
import { mirrorLevel } from '../levels/compose.mjs';

const root = new URL('../levels/', import.meta.url);
const catalog = JSON.parse(readFileSync(new URL('catalog.json', root)));
const journey = JSON.parse(readFileSync(new URL('journey.json', root)));
const mirrors = catalog.filter(l => l.id.startsWith('trap-')).map(mirrorLevel);
const sign = x => Math.sign(x);

function bits(level) {
  const g = createGraph(level), side = level.meta.trap?.side ?? level.meta.tutorial?.side ?? 'L';
  const solver = createExactSolver(g, { maxVertices: 40, maxStates: 6_000_000, timeMs: 60_000 });
  let mask = g.full, player = side, total = 0, turns = 0, score = 0; // score: L-R points already won
  for (let guard = 0; guard < 64; guard++) {
    if (!(mask & g.colors[player])) break;
    const r = solver.solve(mask, player);
    if (!r.exact) return null;
    const persp = player === 'L' ? 1 : -1, cat = v => sign(persp * (score + v));
    if (player === side) {
      const best = cat(r.value), good = r.moves.filter(m => cat(m.value) === best).length;
      total += Math.log2(r.moves.length / good); turns++;
    }
    const id = r.bestMoves[0], cap = captureMask(g, mask, player, id), n = cap.toString(2).split('1').length - 1;
    score += persp * n; mask &= ~cap; player = other(player);
  }
  return { bits: Math.round(total * 100) / 100, turns };
}

const all = [...catalog, ...mirrors], difficulty = {};
for (const l of all) {
  const t0 = Date.now(), b = bits(l);
  difficulty[l.id] = b ?? { bits: null, turns: null };
  console.error(l.id.padEnd(16), l.vertices.length, b ? `${b.bits} bits over ${b.turns} turns` : 'unsolved', `${Date.now() - t0}ms`);
}
for (const t of journey.tutorial) difficulty[t.id] = bits(t);

// Dots: one, two or three, from absolute thresholds (bits). Unsolved giant paths count as three.
const dots = b => b == null ? 3 : b < 1.5 ? 1 : b < 3 ? 2 : 3;
for (const [id, d] of Object.entries(difficulty)) d.dots = dots(d.bits);

const byChapter = { chapter1: catalog.slice(0, 12), chapter2: catalog.slice(12, 30), chapter3: catalog.slice(30, 48), chapter4: catalog.slice(48, 60) };
// Traps: each original next to its Blue mirror.
byChapter.chapter5 = catalog.slice(60).flatMap(l => [l, mirrors.find(m => m.id === `${l.id}-blue`)]);
const key = l => [difficulty[l.id].bits ?? 99, l.vertices.length];
const sorted = ls => [...ls].sort((a, b) => { const [x, y] = [key(a), key(b)]; return x[0] - y[0] || x[1] - y[1]; });
const order = ['chapter1', 'chapter2', 'chapter5', 'chapter3', 'chapter4'];
journey.chapters = [{ key: 'chapter0', ids: journey.tutorial.map(t => t.id) },
  ...order.map(k => ({ key: k, ids: (k === 'chapter5' ? sortPairs(byChapter[k]) : sorted(byChapter[k])).map(l => l.id) }))];
function sortPairs(ls) { // keep each trap next to its mirror, pairs ordered by the original's difficulty
  const pairs = [];
  for (let i = 0; i < ls.length; i += 2) pairs.push([ls[i], ls[i + 1]]);
  pairs.sort((a, b) => (key(a[0])[0] + key(a[1])[0]) - (key(b[0])[0] + key(b[1])[0]) || key(a[0])[1] - key(b[0])[1]);
  return pairs.flat();
}
journey.mirrors = mirrors.map(m => m.id.replace(/-blue$/, ''));
journey.difficulty = difficulty;
writeFileSync(new URL('journey.json', root), JSON.stringify(journey, null, 1) + '\n');
const med = ids => { const v = ids.map(id => difficulty[id].bits ?? 99).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; };
for (const c of journey.chapters) console.error(c.key, 'median bits', med(c.ids), 'dots', [1, 2, 3].map(d => c.ids.filter(id => difficulty[id].dots === d).length).join('/'));
