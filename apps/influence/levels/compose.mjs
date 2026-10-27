// Builds the playable list of boards: first steps, then the chapters in the order of journey.json.
// catalog.json stays the reference set of 72 boards; journey.json adds the first steps, the Blue-side
// mirrors of the greedy traps, the measured difficulty and the order. Pure functions, no DOM.

const swapType = { first: 'first', draw: 'draw', red: 'blue', blue: 'red', 'red-draw': 'blue-draw', 'blue-draw': 'red-draw' };

/** Same graph seen from the other side: colours swapped, arcs reversed. Blue starting here is Red starting there. */
export function mirrorLevel(level) {
  const m = level.meta ?? {};
  return {
    ...level,
    id: `${level.id}-blue`,
    name: { fr: `${level.name.fr} · côté bleu`, en: `${level.name.en} · Blue side` },
    vertices: level.vertices.map(v => ({ ...v, color: v.color === 'L' ? 'R' : 'L' })),
    arcs: level.arcs.map(([a, b]) => [b, a]),
    meta: {
      ...m, Ls: -m.Rs, Rs: -m.Ls, red: m.blue, blue: m.red, type: swapType[m.type] ?? m.type,
      ...(m.opening ? { opening: { L: m.opening.R, R: m.opening.L } } : {}),
      ...(m.trap ? { trap: { ...m.trap, side: m.trap.side === 'L' ? 'R' : 'L' } } : {}),
      mirrorOf: level.id,
    },
  };
}

/** Returns { levels, groups } where groups are [start, end, chapterKey] ranges of `levels`. */
export function composeLevels(catalog, journey) {
  const pool = new Map(catalog.map(l => [l.id, l]));
  for (const t of journey.tutorial ?? []) pool.set(t.id, t);
  for (const id of journey.mirrors ?? []) { const l = pool.get(id); if (l) { const m = mirrorLevel(l); pool.set(m.id, m); } }
  const levels = [], groups = [], used = new Set();
  for (const { key, ids } of journey.chapters ?? []) {
    const start = levels.length;
    for (const id of ids) {
      const l = pool.get(id);
      if (!l || used.has(id)) continue;
      used.add(id);
      levels.push({ ...l, meta: { ...l.meta, chapter: key, difficulty: journey.difficulty?.[id] ?? null } });
    }
    if (levels.length > start) groups.push([start, levels.length, key]);
  }
  // Anything in the catalog that the journey forgot is still playable, at the end.
  const rest = catalog.filter(l => !used.has(l.id));
  if (rest.length) { const start = levels.length; levels.push(...rest.map(l => ({ ...l, meta: { ...l.meta, chapter: 'more' } }))); groups.push([start, levels.length, 'more']); }
  return { levels, groups };
}

/** The side and starting player a board imposes (traps and first steps), or null. */
export function imposedSide(level) {
  const s = level?.meta?.tutorial?.side ?? level?.meta?.trap?.side;
  return s === 'L' || s === 'R' ? s : null;
}
