// Builds the five boards of the guided first steps (levels/journey.json → tutorial).
// Each board teaches one idea, and the idea is checked with the exact solver:
//  1 follow the arrows · 2 Blue reads them backwards · 3 the biggest capture is a trap
//  4 the end rule · 5 a deeper trap. Red always starts and the player is Red.
// Usage: node scripts/tutorial-levels.mjs   (deterministic, SEED env optional)
import { readFileSync, writeFileSync } from 'node:fs';
import { createGraph, captureMask, legalMoves, popcount, other } from '../engine/graph.mjs';
import { createExactSolver } from '../ai/exact.mjs';

const seedArg = Number(process.env.SEED ?? 7);
function rng(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
const random = rng(seedArg);
const pick = a => a[Math.floor(random() * a.length)];
const letters = 'ABCDEFGHIJKL';

function grid(cols, rows, step = 200) {
  const cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push([c, r]);
  const pos = cells.map(([c, r]) => [100 + c * step, 100 + r * step]);
  const edges = [];
  const at = (c, r) => cells.findIndex(([x, y]) => x === c && y === r);
  for (const [c, r] of cells) {
    if (c + 1 < cols) edges.push([at(c, r), at(c + 1, r), false]);
    if (r + 1 < rows) edges.push([at(c, r), at(c, r + 1), false]);
    if (c + 1 < cols && r + 1 < rows) edges.push(random() < .5 ? [at(c, r), at(c + 1, r + 1), true] : [at(c + 1, r), at(c, r + 1), true]);
  }
  return { n: cells.length, pos, edges };
}

function candidate(cols, rows, { keep = .7, diagonals = 0 } = {}) {
  const g = grid(cols, rows);
  const straight = g.edges.filter(e => !e[2]), diag = g.edges.filter(e => e[2]);
  let chosen = straight.filter(() => random() < keep);
  const shuffled = diag.sort(() => random() - .5).slice(0, diagonals);
  chosen = chosen.concat(shuffled);
  // connected?
  const adj = Array.from({ length: g.n }, () => []);
  for (const [a, b] of chosen) { adj[a].push(b); adj[b].push(a); }
  const seen = new Set([0]), stack = [0];
  while (stack.length) for (const x of adj[stack.pop()]) if (!seen.has(x)) { seen.add(x); stack.push(x); }
  if (seen.size !== g.n) return null;
  const reds = Math.ceil(g.n / 2) - (random() < .5 && g.n % 2 === 0 ? 0 : 0);
  const colours = Array.from({ length: g.n }, (_, i) => i < reds ? 'L' : 'R').sort(() => random() - .5);
  const ids = Array.from({ length: g.n }, (_, i) => letters[i]);
  const arcs = chosen.map(([a, b]) => random() < .5 ? [ids[a], ids[b]] : [ids[b], ids[a]]);
  return {
    vertices: ids.map((id, i) => ({ id, color: colours[i] })), arcs,
    positions: Object.fromEntries(ids.map((id, i) => [id, g.pos[i]])),
  };
}

/** Red-first analysis: values of each opening, principal variation length, greedy info. */
function analyse(def) {
  const g = createGraph(def), solver = createExactSolver(g, { maxVertices: 30, maxStates: 2e6, timeMs: 4000 });
  const root = solver.solve(g.full, 'L');
  if (!root.exact) return null;
  const moves = root.moves, max = Math.max(...moves.map(m => m.captured));
  const greedy = moves.filter(m => m.captured === max);
  // principal variation
  let mask = g.full, player = 'L', plies = 0;
  const line = [];
  while (true) {
    const r = solver.solve(mask, player);
    if (!r.moves.length) break;
    const id = r.bestMoves[0], cap = captureMask(g, mask, player, id);
    line.push({ player, id, captured: popcount(cap), mask });
    mask &= ~cap; player = other(player); plies++;
    if (!(mask & g.colors[player])) break;
  }
  const settled = mask && !(mask & g.colors[player]) ? { to: other(player), count: popcount(mask) } : null;
  return { g, solver, root, moves, greedy, max, plies, line, settled };
}

const specs = [
  { id: 'intro-arrows', cols: 3, rows: 2, keep: .75, diagonals: 0, difficulty: 'normal',
    name: { fr: 'Suivre les flèches', en: 'Follow the arrows' },
    test: a => {
      const { root, greedy, moves, g } = a;
      if (root.value <= 0 || greedy.length !== 1 || greedy[0].value !== root.value || a.max < 3) return false;
      if (!moves.some(m => m.captured === 1)) return false;
      // the greedy capture goes through at least two steps
      const cap = captureMask(g, g.full, 'L', greedy[0].id), direct = new Set(g.arcs.filter(([x]) => x === greedy[0].id).map(([, y]) => y));
      return a.plies >= 3 && a.max <= g.vertices.length - 3 && [...g.vertices].some((v, i) => (cap & g.bits[i]) && v.id !== greedy[0].id && !direct.has(v.id)) && g.arcs.length <= 7;
    } },
  { id: 'intro-backwards', cols: 4, rows: 2, keep: .75, diagonals: 1, difficulty: 'normal',
    name: { fr: 'Le bleu lit à l’envers', en: 'Blue reads backwards' },
    test: a => {
      const { root, greedy, g, solver } = a;
      if (root.value <= 0 || greedy.length !== 1 || greedy[0].value !== root.value) return false;
      const after = g.full & ~captureMask(g, g.full, 'L', greedy[0].id);
      const reply = solver.solve(after, 'R');
      if (!reply.moves.length) return false;
      const best = reply.moves.find(m => m.id === reply.bestMoves[0]);
      return best.captured >= 2 && a.plies >= 3 && a.max <= g.vertices.length - 3;
    } },
  { id: 'intro-trap', cols: 3, rows: 3, keep: .75, diagonals: 2, difficulty: 'expert',
    name: { fr: 'Le gros coup piégé', en: 'The tempting big move' },
    test: a => {
      const { root, greedy, moves } = a;
      const wins = moves.filter(m => m.value > 0);
      return root.value > 0 && greedy.length === 1 && greedy[0].value < 0 && wins.length === 1
        && a.max - wins[0].captured >= 2 && a.plies >= 3;
    } },
  { id: 'intro-ending', cols: 4, rows: 2, keep: .8, diagonals: 1, difficulty: 'expert',
    name: { fr: 'Plus de pion, plus de jeu', en: 'No piece, no move' },
    test: a => {
      const { root, moves } = a;
      const wins = moves.filter(m => m.value > 0);
      // with perfect play the game ends by the end rule: Blue is stuck and Red collects at least two pieces
      return root.value > 0 && wins.length <= 2 && a.settled?.to === 'L' && a.settled.count >= 2 && a.plies >= 2
        && moves.some(m => m.value <= 0);
    } },
  { id: 'intro-deeper', cols: 4, rows: 3, keep: .7, diagonals: 3, difficulty: 'expert',
    name: { fr: 'Deux coups d’avance', en: 'Two moves ahead' },
    test: a => {
      const { root, greedy, moves } = a;
      const wins = moves.filter(m => m.value > 0);
      return root.value > 0 && greedy.length === 1 && greedy[0].value <= -2 && wins.length === 1
        && a.max - wins[0].captured >= 2 && a.plies >= 4;
    } },
];

const coach = {
  'intro-arrows': {
    fr: ['Touche un pion rouge : tu captures ce pion et tout ce que ses flèches atteignent, même en plusieurs étapes.', 'Chaque pion capturé vaut un point. Astuce : un appui long montre une capture sans jouer.'],
    en: ['Tap a red piece: you capture it and everything its arrows reach, even through several steps.', 'Each captured piece is worth one point. Tip: a long press shows a capture without playing.'] },
  'intro-backwards': {
    fr: ['Regarde bien les flèches quand c’est au bleu : elles changent de sens.', 'Le bleu suit les flèches à l’envers. Pense à ce qu’il pourra prendre ensuite.'],
    en: ['Watch the arrows on Blue’s turn: they change direction.', 'Blue follows the arrows backwards. Think about what it can take next.'] },
  'intro-trap': {
    fr: ['Un seul pion rouge mène à la victoire, et ce n’est pas celui qui capture le plus.', 'L’ordinateur joue parfaitement ici. Chaque pion laissé peut se retourner contre toi.'],
    en: ['Only one red piece leads to victory, and it is not the one that captures the most.', 'The computer plays perfectly here. Every piece you leave can turn against you.'] },
  'intro-ending': {
    fr: ['Dernière règle : si un camp n’a plus de pion de sa couleur à son tour, l’adversaire prend tout ce qui reste.', 'Prive le bleu de ses derniers pions bleus.'],
    en: ['Last rule: if a side has no piece of its colour on its turn, the opponent takes everything left.', 'Leave Blue without blue pieces.'] },
  'intro-deeper': {
    fr: ['Dernier essai : un seul pion gagne. Regarde ce que le bleu pourra répondre.', 'Avant de jouer, demande-toi ce que l’autre camp prendra juste après.'],
    en: ['Final test: only one piece wins. Look at what Blue can answer.', 'Before you play, ask yourself what the other side takes right after.'] },
};
const lesson = {
  'intro-arrows': { fr: 'Une capture suit les flèches de proche en proche.', en: 'A capture follows the arrows step by step.' },
  'intro-backwards': { fr: 'Rouge suit les flèches, bleu les remonte : un même graphe, deux lectures.', en: 'Red follows the arrows, Blue goes against them: one graph, two readings.' },
  'intro-trap': { fr: 'Le coup qui rapporte le plus tout de suite n’est pas toujours le meilleur. C’est tout l’intérêt du jeu.', en: 'The move that scores most right now is not always the best. That is the whole game.' },
  'intro-ending': { fr: 'Sans pion de sa couleur, on ne passe pas : l’adversaire ramasse tout ce qui reste.', en: 'With no piece of your colour you do not pass: your opponent collects everything left.' },
  'intro-deeper': { fr: 'Tu connais l’essentiel. Les plateaux suivants t’attendent, du plus simple au plus retors.', en: 'You know the essentials. The next boards await, from the simplest to the trickiest.' },
};

const out = [];
for (const spec of specs) {
  let best = null, tries = 0;
  while (tries++ < 400000) {
    const def = candidate(spec.cols, spec.rows, spec);
    if (!def) continue;
    const a = analyse(def);
    if (!a || !spec.test(a)) continue;
    const score = def.arcs.length + (spec.id === 'intro-arrows' ? 0 : 0);
    if (!best || score < best.score) best = { def, a, score };
    if (tries > 2000 && best) break;
  }
  if (!best) throw Error(`no board for ${spec.id}`);
  const { def, a } = best, neg = createExactSolver(a.g).solve(a.g.full, 'R');
  out.push({
    id: spec.id, name: spec.name, ...def,
    meta: {
      Ls: a.root.value, Rs: neg.value, vertices: def.vertices.length, red: def.vertices.filter(v => v.color === 'L').length,
      blue: def.vertices.filter(v => v.color === 'R').length, arcs: def.arcs.length, chapter: 'chapter0',
      tutorial: { side: 'L', first: 'L', difficulty: spec.difficulty, coach: coach[spec.id], lesson: lesson[spec.id],
        keys: a.moves.filter(m => m.value === a.root.value).map(m => m.id), greedy: a.greedy.map(m => m.id), plies: a.plies },
    },
  });
  console.error(spec.id, 'arcs', def.arcs.length, 'Ls', a.root.value, 'plies', a.plies, 'keys', out.at(-1).meta.tutorial.keys, 'greedy', out.at(-1).meta.tutorial.greedy);
}
const path = new URL('../levels/journey.json', import.meta.url);
let journey = {};
try { journey = JSON.parse(readFileSync(path)); } catch { /* first run */ }
journey.tutorial = out;
writeFileSync(path, JSON.stringify(journey, null, 1) + '\n');
