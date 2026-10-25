// Pure helpers for the capture animation. They never decide what is captured:
// the captured set always comes from the engine (`previewMove` / `playMove`).
import { displayedArcs, ids } from '../engine/graph.mjs';

/**
 * Group the captured ids in waves, by distance from the chosen piece along the
 * arrows that are displayed to the player who moves. Wave 0 is the chosen piece.
 * Every captured id appears exactly once, even if the projection ever disagreed.
 */
export function captureWaves(graph, remaining, turn, id, captured) {
  const adjacency = new Map();
  for (const [a, b] of displayedArcs(graph, remaining, turn)) {
    if (!adjacency.has(a)) adjacency.set(a, []);
    adjacency.get(a).push(b);
  }
  const inside = new Set(ids(graph, captured));
  const distance = new Map([[id, 0]]), queue = [id];
  while (queue.length) {
    const v = queue.shift();
    for (const w of adjacency.get(v) ?? []) {
      if (inside.has(w) && !distance.has(w)) { distance.set(w, distance.get(v) + 1); queue.push(w); }
    }
  }
  const waves = [];
  for (const [v, d] of distance) (waves[d] ??= []).push(v);
  const orphans = [...inside].filter(v => !distance.has(v));
  if (orphans.length) waves.push(orphans);
  return waves.filter(Boolean).map(w => w.sort());
}

/**
 * Turn waves into a timeline. `delay` is when a piece starts to fall (ms after
 * the start of the cascade). The whole cascade is capped so long chains stay brisk.
 */
export function cascadeSchedule(waves, { step = 150, stagger = 50, max = 950, fall = 460 } = {}) {
  const gaps = Math.max(1, waves.length - 1);
  const waveStep = Math.min(step, max / gaps);
  const items = [];
  waves.forEach((wave, k) => wave.forEach((id, j) => {
    items.push({ id, delay: Math.round(k * waveStep + Math.min(j * stagger, waveStep * .8)), order: items.length });
  }));
  const last = items.reduce((m, item) => Math.max(m, item.delay), 0);
  return { items, duration: last + fall };
}
