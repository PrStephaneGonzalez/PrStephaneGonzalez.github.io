import { LOGIC_LEVELS } from './logic-games.mjs';
const rnd = (seed) => () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
const copy = (x) => JSON.parse(JSON.stringify(x));
export const EXTRA_TYPES = ['cross', 'maze', 'pattern', 'logic'];
export const EXTRA_NAMES = {
  cross: 'La croisée des nombres',
  maze: 'Les jardins à colorer',
  pattern: 'Les mosaïques de Plume',
  logic: 'Le cabinet des énigmes',
};
export const EXTRA_ICONS = { cross: '⊞', maze: '▧', pattern: '◈', logic: '◇' };
export function crossValue(row, ops) {
  return ops[0] === '×' ? row[0] * row[1] + row[2] : row.reduce((a, b) => a + b, 0);
}
function makeCross(tier, index) {
  const random = rnd(733 + tier * 491 + index * 177),
    n = tier < 2 ? 2 : 3,
    count = n * n,
    values = Array.from({ length: count }, (_, i) => i + 1 + (tier === 5 ? 3 : 0));
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  const ops = Array.from({ length: n }, (_, r) => Array(n - 1).fill('+'));
  if (tier >= 4) ops[index % n][0] = '×';
  const fixed = Array.from({ length: count }, (_, i) => i)
    .sort(() => random() - 0.5)
    .slice(0, tier === 0 ? 2 : tier === 1 ? 1 : tier === 2 ? 5 : tier === 3 ? 4 : 3);
  return {
    id: `x-cross-${tier}-${index}`,
    type: 'cross',
    tier,
    index,
    n,
    solution: values,
    initial: values.map((v, i) => (fixed.includes(i) ? v : null)),
    fixed,
    ops,
    rowTargets: Array.from({ length: n }, (_, r) =>
      crossValue(values.slice(r * n, r * n + n), ops[r]),
    ),
    colTargets: Array.from({ length: n }, (_, c) =>
      Array.from({ length: n }, (_, r) => values[r * n + c]).reduce((a, b) => a + b, 0),
    ),
  };
}
export function crossSolved(l, board) {
  if (!Array.isArray(board) || board.length !== l.n * l.n || board.some((v) => !Number.isFinite(v)))
    return false;
  if (
    JSON.stringify(board.slice().sort((a, b) => a - b)) !==
    JSON.stringify(l.solution.slice().sort((a, b) => a - b))
  )
    return false;
  if (l.fixed.some((i) => board[i] !== l.initial[i])) return false;
  for (let r = 0; r < l.n; r++)
    if (crossValue(board.slice(r * l.n, r * l.n + l.n), l.ops[r]) !== l.rowTargets[r]) return false;
  for (let c = 0; c < l.n; c++)
    if (
      Array.from({ length: l.n }, (_, r) => board[r * l.n + c]).reduce((a, b) => a + b, 0) !==
      l.colTargets[c]
    )
      return false;
  return true;
}
const DELTA = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
export function rollMaze(l, pos, direction) {
  const d = DELTA[direction];
  if (!d) return { pos, cells: [] };
  let x = pos % l.n,
    y = Math.floor(pos / l.n),
    cells = [];
  for (;;) {
    const nx = x + d[0],
      ny = y + d[1],
      i = ny * l.n + nx;
    if (nx < 0 || ny < 0 || nx >= l.n || ny >= l.n || l.walls.includes(i)) break;
    x = nx;
    y = ny;
    cells.push(i);
  }
  return { pos: y * l.n + x, cells };
}
export function mazeMove(l, b, direction) {
  const r = rollMaze(l, b.pos, direction);
  return r.cells.length ? { pos: r.pos, painted: [...new Set(b.painted.concat(r.cells))] } : null;
}
export const mazeSolved = (l, b) => b.painted.length === l.n * l.n - l.walls.length;
export function mazeHint(l, b) {
  const q = [{ pos: b.pos, path: [] }],
    seen = new Set([b.pos]),
    paint = new Set(b.painted);
  for (let k = 0; k < q.length; k++) {
    const node = q[k];
    for (const d of Object.keys(DELTA)) {
      const r = rollMaze(l, node.pos, d);
      if (r.cells.some((i) => !paint.has(i))) return node.path.concat(d);
      if (!seen.has(r.pos)) {
        seen.add(r.pos);
        q.push({ pos: r.pos, path: node.path.concat(d) });
      }
    }
  }
  return null;
}
function mazeWitness(l) {
  let b = { pos: l.start, painted: [l.start] },
    moves = [];
  for (let i = 0; i < l.n * l.n && !mazeSolved(l, b); i++) {
    const hint = mazeHint(l, b);
    if (!hint) return null;
    for (const d of hint) {
      b = mazeMove(l, b, d);
      moves.push(d);
    }
  }
  return mazeSolved(l, b) ? moves : null;
}
function makeMaze(tier, index) {
  const n = Math.min(7, 3 + tier),
    random = rnd(15877 + tier * 913 + index * 193);
  for (let a = 0; a < 1800; a++) {
    const walls = Array.from({ length: n * n }, (_, i) => i).filter(
        (i) => i !== 0 && random() < 0.22 + 0.01 * tier,
      ),
      l = { id: `x-maze-${tier}-${index}`, type: 'maze', tier, index, n, start: 0, walls };
    if (walls.length > n * n * 0.4 || walls.length < 1) continue;
    const solution = mazeWitness(l);
    if (solution && solution.length >= 3 + tier * 4) return { ...l, solution };
  }
  // A winding corridor is always paintable; random mirrors make deterministic fallbacks distinct.
  const open = [];
  for (let y = 0; y < n; y++)
    if (y % 2 === 0) for (let x = 0; x < n; x++) open.push(y * n + x);
    else open.push(y * n + (Math.floor(y / 2) % 2 === 0 ? n - 1 : 0));
  const walls = Array.from({ length: n * n }, (_, i) => i).filter((i) => !open.includes(i));
  const l = { id: `x-maze-${tier}-${index}`, type: 'maze', tier, index, n, start: 0, walls };
  return { ...l, solution: mazeWitness(l) };
}
function makePattern(tier, index) {
  const step = 1 + (index % 3),
    start = 1 + Math.floor(index / 3),
    sequence = Array.from({ length: 5 }, (_, i) => start + step * i),
    grid = Array.from(
      { length: 9 },
      (_, i) =>
        1 +
        ((Math.floor(i / 3) * (tier < 4 ? 1 : 2) +
          (i % 3) * (tier < 4 ? 1 : tier === 4 ? 2 : 3) +
          index) %
          5),
    ),
    answer = tier < 3 ? sequence[4] : grid[8];
  let options = [...new Set([answer, answer + 1, Math.max(0, answer - 1), answer + 2])].slice(0, 4);
  const random = rnd(433 + index + tier * 217);
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return {
    id: `x-pattern-${tier}-${index}`,
    type: 'pattern',
    tier,
    index,
    sequence,
    grid,
    answer,
    options,
    explanation:
      tier < 3
        ? `On ajoute ${step} à chaque étape. Après ${sequence[3]}, on obtient ${answer}.`
        : `Dans chaque ligne, on avance de ${tier < 4 ? 1 : tier === 4 ? 2 : 3} point(s) dans le cycle 1, 2, 3, 4, 5, puis on reprend à 1. La dernière case contient ${answer} point(s).`,
  };
}
export const EXTRA_LEVELS = [
  ...LOGIC_LEVELS,
  ...Array.from({ length: 6 }, (_, tier) =>
    Array.from({ length: 6 }, (_, i) => [
      makeCross(tier, i),
      makeMaze(tier, i),
      makePattern(tier, i),
    ]),
  ).flat(2),
];
export const EXTRA_BY_ID = Object.fromEntries(EXTRA_LEVELS.map((l) => [l.id, l]));
export function extraInitial(l) {
  return l.type === 'cross'
    ? l.initial.slice()
    : l.type === 'maze'
      ? { pos: l.start, painted: [l.start] }
      : { answer: null };
}
export function extraValid(l, b) {
  if (l.type === 'cross') {
    if (
      !Array.isArray(b) ||
      b.length !== l.initial.length ||
      l.fixed.some((i) => b[i] !== l.initial[i])
    )
      return false;
    const filled = b.filter((x) => x !== null);
    return filled.every((x) => l.solution.includes(x)) && new Set(filled).size === filled.length;
  }
  if (l.type === 'maze')
    return (
      b &&
      Number.isInteger(b.pos) &&
      b.pos >= 0 &&
      b.pos < l.n * l.n &&
      !l.walls.includes(b.pos) &&
      Array.isArray(b.painted) &&
      new Set(b.painted).size === b.painted.length &&
      b.painted.every(
        (i) => Number.isInteger(i) && i >= 0 && i < l.n * l.n && !l.walls.includes(i),
      ) &&
      b.painted.includes(b.pos) &&
      b.painted.includes(l.start)
    );
  return b && [null, ...l.options].includes(b.answer);
}
export function restoreExtras(raw) {
  const out = {};
  if (raw && typeof raw === 'object')
    for (const [id, b] of Object.entries(raw))
      if (EXTRA_BY_ID[id] && extraValid(EXTRA_BY_ID[id], b)) out[id] = copy(b);
  return out;
}
