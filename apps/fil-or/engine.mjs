import { restoreStory } from './story.mjs';
import { restoreAcademy } from './academy.mjs';
import { restoreCollection } from './treasures.mjs';
import { restoreJourney } from './journey.mjs';
import { restoreTraining } from './training-state.mjs';
import { HARD_POTIONS } from './potion-data.mjs';
// Pure puzzle rules, shared by the game and independent validation.
export const COLORS = [
  '#f4bf62',
  '#62d6ca',
  '#ee98bb',
  '#a99bea',
  '#82c87c',
  '#86b4f3',
  '#ef9972',
  '#cee18c',
];
export const SYMBOLS = ['✦', '◆', '♥', '☾', '♣', '●', '▲', '✚'];
export const clone = (x) => JSON.parse(JSON.stringify(x));
export function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const near = (a, b, n) =>
  Math.abs((a % n) - (b % n)) + Math.abs(Math.floor(a / n) - Math.floor(b / n)) === 1;
export function validFlow(level, paths, requireComplete = true) {
  const used = new Set();
  if (!Array.isArray(paths) || paths.length !== level.ends.length) return false;
  for (let c = 0; c < paths.length; c++) {
    const p = paths[c],
      e = level.ends[c];
    if (!Array.isArray(p)) return false;
    if (!p.length) {
      if (requireComplete) return false;
      continue;
    }
    if (!e.includes(p[0])) return false;
    if (requireComplete && (p.length < 2 || !e.includes(p.at(-1)) || p[0] === p.at(-1)))
      return false;
    for (let j = 0; j < p.length; j++) {
      if (!Number.isInteger(p[j]) || p[j] < 0 || p[j] >= level.n ** 2 || used.has(p[j]))
        return false;
      if (j && !near(p[j - 1], p[j], level.n)) return false;
      if (level.ends.some((pair, k) => k !== c && pair.includes(p[j]))) return false;
      if (j > 0 && j < p.length - 1 && e.includes(p[j])) return false;
      used.add(p[j]);
    }
  }
  return true;
}
export function flowLevel(index) {
  const n = index < 6 ? 4 : index < 14 ? 5 : index < 26 ? 6 : index < 34 ? 7 : 8,
    count =
      index < 3
        ? 2
        : index < 10
          ? 3
          : index < 17
            ? 4
            : index < 20
              ? 5
              : index < 30
                ? 6
                : index < 40
                  ? 7
                  : 8;
  const random = rng(811 + index * 311);
  let walk = [];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) walk.push(y * n + (y % 2 ? n - 1 - x : x));
  // Backbite moves turn a serpentine Hamiltonian path into varied valid paths.
  for (let step = 0; step < 160 + index * 9; step++) {
    if (random() < 0.5) walk.reverse();
    const candidates = [];
    for (let k = 2; k < walk.length; k++) if (near(walk[0], walk[k], n)) candidates.push(k);
    if (candidates.length) {
      const k = candidates[Math.floor(random() * candidates.length)];
      walk = [...walk.slice(0, k).reverse(), ...walk.slice(k)];
    }
  }
  const lens = Array(count).fill(3);
  for (let i = count * 3; i < n * n; i++) lens[Math.floor(random() * count)]++;
  let at = 0;
  const solution = lens.map((len) => {
    const p = walk.slice(at, at + len);
    at += len;
    return p;
  });
  const level = {
    id: `f${index}`,
    type: 'flow',
    index,
    n,
    ends: solution.map((p) => [p[0], p.at(-1)]),
    solution,
  };
  if (!validFlow(level, solution)) throw Error('Invalid generated flow');
  return level;
}
export function flowMove(l, paths, active, i, startGesture = true) {
  if (!Number.isInteger(i) || i < 0 || i >= l.n * l.n) return null;
  const endpoint = l.ends.findIndex((e) => e.includes(i));
  const result = clone(paths);
  if (active >= 0 && paths[active]?.length) {
    const p = paths[active],
      last = p.at(-1),
      complete = p.length > 1 && l.ends[active].includes(last);
    if (i === last) return null;
    if (
      !complete &&
      near(last, i, l.n) &&
      !paths.some((q, c) => c !== active && q.includes(i)) &&
      (endpoint < 0 || endpoint === active)
    ) {
      const existing = p.indexOf(i);
      result[active] = existing >= 0 ? p.slice(0, existing + 1) : p.concat(i);
      return { paths: result, active };
    }
    if (
      !startGesture &&
      !complete &&
      (last % l.n === i % l.n || Math.floor(last / l.n) === Math.floor(i / l.n))
    ) {
      const delta = last % l.n === i % l.n ? (i > last ? l.n : -l.n) : i > last ? 1 : -1;
      const seq = [];
      for (let x = last + delta; x !== i + delta; x += delta) seq.push(x);
      if (
        seq.every(
          (x, j) =>
            !paths.some((q, c) => c !== active && q.includes(x)) &&
            !p.includes(x) &&
            !l.ends.some((e, c) => e.includes(x) && (c !== active || j !== seq.length - 1)),
        )
      ) {
        result[active] = p.concat(seq);
        return { paths: result, active };
      }
    }
  }
  if (!startGesture) return null;
  const owner = paths.findIndex((p) => p.includes(i));
  if (endpoint >= 0) {
    const p = paths[endpoint];
    result[endpoint] = p.length && p.at(-1) === i ? p.slice().reverse() : [i];
    return { paths: result, active: endpoint };
  }
  if (owner >= 0) {
    result[owner] = paths[owner].slice(0, paths[owner].indexOf(i) + 1);
    return { paths: result, active: owner };
  }
  return null;
}
export function pour(tubes, from, to, cap = 4) {
  if (from === to || !tubes[from]?.length || !tubes[to] || tubes[to].length >= cap) return null;
  const a = tubes[from],
    b = tubes[to],
    color = a.at(-1);
  if (b.length && b.at(-1) !== color) return null;
  let run = 1;
  while (run < a.length && a[a.length - 1 - run] === color) run++;
  const amount = Math.min(run, cap - b.length),
    result = clone(tubes);
  result[from].splice(-amount);
  result[to].push(...Array(amount).fill(color));
  return result;
}
export const potionSolved = (tubes, cap = 4) =>
  tubes.every((t) => !t.length || (t.length === cap && t.every((c) => c === t[0])));
export const potionKey = (t) => t.map((x) => x.join(',')).join('|');
export function potionLevel(index) {
  const count = 3 + Math.floor(index / 3),
    cap = 4,
    random = rng(151 + index * 107),
    goal = Array.from({ length: count }, (_, c) => Array(cap).fill(c)).concat([[], []]);
  let tubes = clone(goal),
    reverse = [],
    seen = new Set([potionKey(tubes)]);
  const steps = 10 + index * 4;
  for (let step = 0; step < steps; step++) {
    const choices = [];
    for (let a = 0; a < tubes.length; a++)
      for (let b = 0; b < tubes.length; b++) {
        if (a === b || !tubes[a].length || tubes[b].length === cap) continue;
        const color = tubes[a].at(-1);
        let run = 1;
        while (run < tubes[a].length && tubes[a][tubes[a].length - 1 - run] === color) run++;
        for (let k = 1; k <= Math.min(run, cap - tubes[b].length); k++) {
          const next = clone(tubes);
          next[a].splice(-k);
          next[b].push(...Array(k).fill(color));
          const inverse = pour(next, b, a, cap);
          if (inverse && potionKey(inverse) === potionKey(tubes) && !seen.has(potionKey(next)))
            choices.push({ next, move: [b, a] });
        }
      }
    if (!choices.length) break;
    // Prefer mixed tubes; never assume a random scramble is solvable.
    choices.sort((a, b) => mixed(b.next) - mixed(a.next));
    const choice = choices[Math.floor(random() * Math.min(choices.length, 5))];
    tubes = choice.next;
    reverse.push(choice.move);
    seen.add(potionKey(tubes));
  }
  return {
    id: `p${index}`,
    type: 'potion',
    index,
    cap,
    count,
    initial: tubes,
    solution: reverse.reverse(),
  };
}
function mixed(tubes) {
  return tubes.reduce(
    (s, t) => s + t.reduce((a, c, i) => a + (i > 0 && c !== t[i - 1] ? 1 : 0), 0),
    0,
  );
}
export function solvePotion(start, cap = 4, limit = 80000) {
  let visits = 0;
  const visited = new Set();
  function dfs(t, path) {
    if (potionSolved(t, cap)) return path;
    if (++visits > limit || path.length > 130) return null;
    const key = t
      .map((x) => x.join(','))
      .sort()
      .join('|');
    if (visited.has(key)) return null;
    visited.add(key);
    const moves = [];
    let emptyUsed = false;
    for (let b = 0; b < t.length; b++) {
      if (!t[b].length) {
        if (emptyUsed) continue;
        emptyUsed = true;
      }
      for (let a = 0; a < t.length; a++) {
        if (!t[a].length || a === b) continue;
        if (!t[b].length && t[a].every((c) => c === t[a][0])) continue;
        const next = pour(t, a, b, cap);
        if (next) moves.push({ next, a, b, score: t[b].length ? 1 : 0 });
      }
    }
    moves.sort((a, b) => b.score - a.score);
    for (const m of moves) {
      const r = dfs(m.next, path.concat([[m.a, m.b]]));
      if (r) return r;
    }
    return null;
  }
  return dfs(start, []);
}
// Bit masks: north=1, east=2, south=4, west=8. Extra branches are allowed.
export function rotate(mask) {
  return ((mask << 1) & 15) | ((mask >> 3) & 1);
}
export function circuitReach(level, tiles) {
  const seen = new Set([level.source]),
    queue = [level.source],
    n = level.n;
  for (let q = 0; q < queue.length; q++) {
    const a = queue[q];
    for (const [bit, opposite, delta] of [
      [1, 4, -n],
      [2, 8, 1],
      [4, 1, n],
      [8, 2, -1],
    ]) {
      const b = a + delta;
      if (
        b < 0 ||
        b >= n * n ||
        !near(a, b, n) ||
        !(tiles[a] & bit) ||
        !(tiles[b] & opposite) ||
        seen.has(b)
      )
        continue;
      seen.add(b);
      queue.push(b);
    }
  }
  return seen;
}
export const circuitSolved = (l, t) => {
  const reach = circuitReach(l, t);
  return (l.targets || [l.target]).every((i) => reach.has(i));
};
export const turnCircuit = (l, tiles, i) => {
  if (
    !Number.isInteger(i) ||
    i < 0 ||
    i >= tiles.length ||
    !tiles[i] ||
    (l.locked || []).includes(i)
  )
    return null;
  const next = tiles.slice();
  next[i] = rotate(next[i]);
  return next;
};
export function circuitLevel(index) {
  const mode = Math.floor(index / 5),
    n = mode === 0 ? 4 : mode === 1 ? 5 : 6,
    random = rng(9091 + index * 211),
    solution = Array(n * n).fill(0),
    seen = new Set([0]),
    stack = [0];
  const neighbors = (a) =>
    [a - n, a + 1, a + n, a - 1].filter((b) => b >= 0 && b < n * n && near(a, b, n));
  const connect = (a, b) => {
    const diff = b - a,
      bit = diff === 1 ? 2 : diff === -1 ? 8 : diff === n ? 4 : 1,
      op = diff === 1 ? 8 : diff === -1 ? 2 : diff === n ? 1 : 4;
    solution[a] |= bit;
    solution[b] |= op;
  };
  // Random spanning tree: long turns and branches; add loops to permit alternative routes.
  while (stack.length) {
    const a = stack.at(-1),
      next = neighbors(a).filter((b) => !seen.has(b));
    if (!next.length) {
      stack.pop();
      continue;
    }
    const b = next[Math.floor(random() * next.length)];
    connect(a, b);
    seen.add(b);
    stack.push(b);
  }
  for (let a = 0; a < n * n; a++)
    for (const b of neighbors(a)) if (b > a && random() < 0.06) connect(a, b);
  const targets = [n * n - 1];
  const far = Array.from({ length: n * n }, (_, i) => i).filter(
    (i) => i !== 0 && i !== n * n - 1 && Math.floor(i / n) + (i % n) >= n - 1,
  );
  while (targets.length < mode + 2) {
    const pos = Math.floor(random() * far.length);
    targets.push(far.splice(pos, 1)[0]);
  }
  const locked = [0, ...targets];
  let initial;
  const meta = { n, source: 0, target: targets[0], targets };
  for (let attempt = 0; attempt < 100; attempt++) {
    initial = solution.map((mask, i) => {
      if (locked.includes(i)) return mask;
      for (let k = Math.floor(random() * 4); k > 0; k--) mask = rotate(mask);
      return mask;
    });
    if (!circuitSolved(meta, initial)) break;
  }
  return { id: `c${index}`, type: 'circuit', index, ...meta, locked, initial, solution };
}
export function guidedCircuit(l, tier) {
  if (tier >= 4) return clone(l.initial);
  let board = clone(l.solution),
    critical = -1;
  const movable = board
    .map((m, i) => i)
    .filter((i) => !l.locked.includes(i) && rotate(board[i]) !== board[i]);
  for (const i of movable) {
    const trial = clone(board);
    trial[i] = rotate(trial[i]);
    if (!circuitSolved(l, trial)) {
      board = trial;
      critical = i;
      break;
    }
  }
  let changed = critical < 0 ? 0 : 1;
  for (const i of movable) {
    if (i === critical) continue;
    if (changed >= 2 + tier * 3 && !circuitSolved(l, board)) break;
    board[i] = rotate(board[i]);
    changed++;
  }
  if (circuitSolved(l, board)) return clone(l.initial);
  return board;
}
export const LEVELS = [
  ...Array.from({ length: 60 }, (_, i) => flowLevel(i)),
  ...Array.from({ length: 10 }, (_, i) => potionLevel(i)),
  ...HARD_POTIONS,
  ...Array.from({ length: 15 }, (_, i) => circuitLevel(i)),
];
export const BY_ID = Object.fromEntries(LEVELS.map((l) => [l.id, l]));
export const levelMode = (l) =>
  Math.floor(l.index / (l.type === 'flow' ? 20 : l.type === 'potion' ? 10 : 5));
export const levelRoom = (l) =>
  Math.floor(
    (l.index % (l.type === 'flow' ? 20 : l.type === 'potion' ? 10 : 5)) /
      (l.type === 'flow' ? 4 : l.type === 'potion' ? 2 : 1),
  );
export const roomIds = (r, mode = 1) => [
  `f${mode * 20 + r * 4}`,
  `p${mode * 10 + r * 2}`,
  `f${mode * 20 + r * 4 + 1}`,
  `c${mode * 5 + r}`,
  `f${mode * 20 + r * 4 + 2}`,
  `p${mode * 10 + r * 2 + 1}`,
  `f${mode * 20 + r * 4 + 3}`,
];
export function initialBoard(l) {
  return l.type === 'flow' ? l.ends.map(() => []) : clone(l.initial);
}
export function validBoard(l, board) {
  if (!Array.isArray(board)) return false;
  if (l.type === 'flow') return validFlow(l, board, false);
  if (l.type === 'circuit')
    return (
      board.length === l.n * l.n &&
      board.every((m, i) => {
        if (l.locked?.includes(i) && m !== l.initial[i]) return false;
        let x = l.initial[i];
        for (let k = 0; k < 4; k++) {
          if (x === m) return true;
          x = rotate(x);
        }
        return false;
      })
    );
  if (
    board.length !== l.initial.length ||
    !board.every(
      (t) =>
        Array.isArray(t) &&
        t.length <= l.cap &&
        t.every((c) => Number.isInteger(c) && c >= 0 && c < l.count),
    )
  )
    return false;
  const counts = (t) =>
    Array.from({ length: l.count }, (_, c) => t.flat().filter((x) => x === c).length);
  return JSON.stringify(counts(board)) === JSON.stringify(counts(l.initial));
}
export function isSolved(l, b) {
  return l.type === 'flow'
    ? validFlow(l, b)
    : l.type === 'potion'
      ? potionSolved(b, l.cap)
      : circuitSolved(l, b);
}
export function restore(raw) {
  const base = {
    version: 1,
    puzzleRevision: 2,
    messagePolicy: 3,
    seenStarts: [],
    messageCursor: 0,
    learning: { seen: [], completed: [], browseStage: 0, browseStages: {} },
    training: restoreTraining(null),
    academy: restoreAcademy(null),
    collection: restoreCollection(null),
    story: restoreStory(null),
    trainingSettings: {
      tracking: true,
      readingLevel: 0,
      dailyLanguage: true,
      languageFocus: 'homophones',
      languageStart: 0,
      mathFocus: 'auto',
      schoolMathStart: 1,
      tiles: true,
      flashFast: 6000,
      mathStart: 3,
      mathStarts: {},
      mathFast: 6000,
    },
    extraBoards: {},
    extraCompleted: [],
    journey: restoreJourney(null),
    completed: [],
    boards: {},
    last: null,
    notes: [],
    settings: {
      disabled: [],
      transition: 'door',
      font: 1,
      spacing: false,
      motion: true,
      sound: true,
      messages: false,
      difficulty: 1,
      contrast: false,
    },
    pin: null,
  };
  if (!raw || typeof raw !== 'object' || raw.version !== 1) return base;
  base.completed = Array.isArray(raw.completed)
    ? [...new Set(raw.completed.filter((id) => BY_ID[id]))]
    : [];
  if (raw.boards && typeof raw.boards === 'object')
    for (const [id, b] of Object.entries(raw.boards))
      if (
        BY_ID[id] &&
        (raw.puzzleRevision === 2 || BY_ID[id].type !== 'circuit') &&
        validBoard(BY_ID[id], b)
      )
        base.boards[id] = clone(b);
  if (BY_ID[raw.last]) base.last = raw.last;
  base.journey = restoreJourney(raw.journey);
  base.training = restoreTraining(raw.training);
  base.academy = restoreAcademy(raw.academy);
  base.collection = restoreCollection(raw.collection);
  base.story = restoreStory(raw.story);
  if (raw.trainingSettings && typeof raw.trainingSettings === 'object') {
    for (const key of ['tracking', 'tiles', 'dailyLanguage'])
      if (typeof raw.trainingSettings[key] === 'boolean')
        base.trainingSettings[key] = raw.trainingSettings[key];
    if ([4000, 6000, 10000].includes(raw.trainingSettings.flashFast))
      base.trainingSettings.flashFast = raw.trainingSettings.flashFast;
  }
  for (const [key, max] of [
    ['readingLevel', 2],
    ['languageStart', 5],
    ['schoolMathStart', 5],
  ])
    if (Number.isInteger(raw.trainingSettings?.[key]))
      base.trainingSettings[key] = Math.max(0, Math.min(max, raw.trainingSettings[key]));
  if (
    [
      'homophones',
      'verb-agreement',
      'noun-agreement',
      'conjug-present',
      'conjug-imparfait',
      'conjug-futur',
      'conjug-passe',
      'sentence-transform',
      'word-classes',
      'subject',
      'complements',
    ].includes(raw.trainingSettings?.languageFocus)
  )
    base.trainingSettings.languageFocus = raw.trainingSettings.languageFocus;
  if (
    [
      'auto',
      'written-operations',
      'fraction-meaning',
      'proportion',
      'missing-number',
      'durations',
      'money',
      'geometry-properties',
      'decimal-product',
      'decimal-quotient',
      'area',
      'perimeter',
    ].includes(raw.trainingSettings?.mathFocus)
  )
    base.trainingSettings.mathFocus = raw.trainingSettings.mathFocus;
  if (raw.trainingSettings?.mathStarts && typeof raw.trainingSettings.mathStarts === 'object')
    for (const block of ['facts', 'place', 'line', 'bars'])
      if (Number.isInteger(raw.trainingSettings.mathStarts[block]))
        base.trainingSettings.mathStarts[block] = Math.max(
          0,
          Math.min(5, raw.trainingSettings.mathStarts[block]),
        );
  if (Number.isInteger(raw.trainingSettings?.mathStart))
    base.trainingSettings.mathStart = Math.max(0, Math.min(5, raw.trainingSettings.mathStart));
  if ([4000, 6000, 10000].includes(raw.trainingSettings?.mathFast))
    base.trainingSettings.mathFast = raw.trainingSettings.mathFast;
  base.extraBoards = raw.extraBoards && typeof raw.extraBoards === 'object' ? raw.extraBoards : {};
  base.extraCompleted = Array.isArray(raw.extraCompleted)
    ? [
        ...new Set(
          raw.extraCompleted.filter(
            (id) => typeof id === 'string' && /^x-(cross|maze|pattern|logic)-[0-5]-[0-5]$/.test(id),
          ),
        ),
      ]
    : [];
  if (Array.isArray(raw.notes))
    base.notes = raw.notes
      .filter((n) => n && typeof n.text === 'string' && typeof n.date === 'string')
      .slice(-30)
      .map((n) => ({ date: n.date.slice(0, 24), text: n.text.slice(0, 700) }));
  base.seenStarts = Array.isArray(raw.seenStarts)
    ? [
        ...new Set(
          raw.seenStarts.filter(
            (id) =>
              BY_ID[id] ||
              (typeof id === 'string' && /^x-(cross|maze|pattern|logic)-[0-5]-[0-5]$/.test(id)),
          ),
        ),
      ]
    : [];
  base.messageCursor =
    Number.isInteger(raw.messageCursor) && raw.messageCursor >= 0 ? raw.messageCursor : 0;
  if (raw.learning && typeof raw.learning === 'object')
    for (const k of ['seen', 'completed'])
      base.learning[k] = Array.isArray(raw.learning[k])
        ? [
            ...new Set(raw.learning[k].filter((id) => typeof id === 'string' && id.length < 80)),
          ].slice(-3000)
        : [];
  if (
    Number.isInteger(raw.learning?.browseStage) &&
    raw.learning.browseStage >= 0 &&
    raw.learning.browseStage < 6
  )
    base.learning.browseStage = raw.learning.browseStage;
  if (raw.learning?.browseStages && typeof raw.learning.browseStages === 'object')
    base.learning.browseStages = Object.fromEntries(
      Object.entries(raw.learning.browseStages)
        .filter(
          ([id, tier]) =>
            typeof id === 'string' &&
            id.length < 100 &&
            Number.isInteger(tier) &&
            tier >= 0 &&
            tier < 6,
        )
        .slice(-150),
    );
  if (raw.learning?.outcomes && typeof raw.learning.outcomes === 'object')
    base.learning.outcomes = Object.fromEntries(
      Object.entries(raw.learning.outcomes)
        .filter(
          ([id, x]) =>
            id.length < 80 && x && ['explored', 'supported', 'independent'].includes(x.kind),
        )
        .slice(-3000),
    );
  if (raw.learning?.drafts && typeof raw.learning.drafts === 'object')
    base.learning.drafts = Object.fromEntries(
      Object.entries(raw.learning.drafts)
        .filter(
          ([id, x]) =>
            /^guided-[0-4]-[0-5]-[0-5]$/.test(id) &&
            x &&
            ['c', 'd', 'u'].every((k) => Number.isInteger(x[k]) && x[k] >= 0 && x[k] < 50),
        )
        .slice(-180),
    );
  const s = raw.settings;
  if (s && typeof s === 'object') {
    base.settings.disabled = Array.isArray(s.disabled)
      ? s.disabled.filter((x) =>
          ['flow', 'potion', 'circuit', 'cross', 'maze', 'pattern', 'logic'].includes(x),
        )
      : [];
    base.settings.transition = s.transition === 'fade' ? 'fade' : 'door';
    base.settings.font = [1, 1.15, 1.3].includes(s.font) ? s.font : 1;
    if ([0, 1, 2].includes(s.difficulty)) base.settings.difficulty = s.difficulty;
    for (const k of ['spacing', 'motion', 'sound', 'contrast'])
      if (typeof s[k] === 'boolean') base.settings[k] = s[k];
  }
  if (raw.messagePolicy === 3 && typeof s?.messages === 'boolean')
    base.settings.messages = s.messages;
  if (raw.pin && /^[a-f0-9]{32}$/.test(raw.pin.salt) && /^[a-f0-9]{64}$/.test(raw.pin.hash))
    base.pin = raw.pin;
  return base;
}
// Deliberately unavailable in this build. A parent PIN cannot activate exposure.
export const CLINICAL_MODULES = Object.freeze({
  exposure: false,
  interoceptive: false,
  writing: false,
  accommodation: false,
  readingRemediation: false,
});
