import { ACTIVITY_BY_ID } from './catalog.mjs';
export const RARITIES = [
  { name: 'Cuivré', color: '#c89171' },
  { name: 'Argenté', color: '#c3d1e0' },
  { name: 'Doré', color: '#f0cd7d' },
  { name: 'Lunaire', color: '#b8a6ed' },
  { name: 'Stellaire', color: '#89d8db' },
  { name: 'Légendaire', color: '#f1afd1' },
];
const OBJECTS = [
  ['Clé des brumes', 'M28 33a12 12 0 1 1 8 8L19 58H9V48Z M36 26a4 4 0 1 0 0 .1'],
  ['Plume de phénix', 'M15 58Q19 25 51 9Q60 29 38 47L25 45M15 58L45 22M25 40L39 40M31 31L45 31'],
  [
    'Fiole enchantée',
    'M25 10H39M28 10V24L16 46Q9 59 23 60H42Q55 59 48 46L36 24V10M21 42H44M25 49L29 54M38 48L41 53',
  ],
  ['Cristal de lune', 'M32 8L51 25L44 52L32 62L20 52L13 25ZM13 25H51M32 8L24 25L32 62L40 25Z'],
  [
    'Grimoire étoilé',
    'M15 10H49V58H15Q9 56 11 51V16Q11 10 15 10ZM18 10V58M33 23L36 30L44 32L37 36L37 44L31 39L24 43L26 35L21 30L29 30Z',
  ],
  [
    'Amulette des étoiles',
    'M20 9Q32 32 44 9M32 29L38 39L50 41L41 49L42 61L32 55L22 61L23 49L14 41L26 39Z',
  ],
  [
    'Boussole des rêves',
    'M32 8V14M32 56V62M8 35H14M50 35H56M32 15a20 20 0 1 0 0 40a20 20 0 1 0 0-40ZM39 25L35 39L25 46L29 32Z',
  ],
  [
    'Chouette de cristal',
    'M17 18L14 8L28 15H36L50 8L47 18Q58 46 32 61Q6 46 17 18ZM32 20V51M20 28a8 8 0 1 0 0 .1M44 28a8 8 0 1 0 0 .1M28 39L32 45L36 39',
  ],
];
const clamp = (n) => (Number.isInteger(n) ? Math.max(0, Math.min(5, n)) : 0);
const hash = (text) =>
  [...text].reduce((h, c) => Math.imul(h ^ c.codePointAt(0), 16777619) >>> 0, 2166136261);
export function restoreCollection(raw) {
  const map = new Map();
  for (const e of Array.isArray(raw?.earned) ? raw.earned : []) {
    if (
      e &&
      typeof e.id === 'string' &&
      /^[\p{L}\p{N}_.:’'-]{1,180}$/u.test(e.id) &&
      Number.isInteger(e.tier) &&
      e.tier >= 0 &&
      e.tier < 6
    )
      map.set(e.id, { id: e.id, tier: e.tier });
  }
  return { version: 1, earned: [...map.values()].slice(-6000) };
}
export function mergeCollection(a, b) {
  return restoreCollection({
    earned: [...restoreCollection(a).earned, ...restoreCollection(b).earned],
  });
}
export function awardTreasure(state, id, tier = 0) {
  state.collection ??= restoreCollection(null);
  if (state.collection.earned.some((e) => e.id === id)) return null;
  const earned = { id, tier: clamp(tier) };
  state.collection.earned.push(earned);
  return treasureFor(earned);
}
export function reconcileCollection(state) {
  state.collection = restoreCollection(state.collection);
  const known = new Set(state.collection.earned.map((e) => e.id));
  const add = (id, tier) => {
    if (!known.has(id)) {
      state.collection.earned.push({ id, tier: clamp(tier) });
      known.add(id);
    }
  };
  for (const e of state.training?.math?.events || []) if (e.correct) add('math:' + e.id, e.tier);
  for (const e of state.training?.wordEvents || [])
    if (e.correct) add('word:' + e.id, e.kind === 'dictation' ? 2 : 1);
  for (const e of state.training?.readings || [])
    if (e.answers.filter((a) => a.correct).length >= 2) add('reading:' + e.id, e.level + 1);
  for (const [id, e] of Object.entries(state.learning?.outcomes || {})) {
    const a = ACTIVITY_BY_ID[id];
    if (a && ['supported', 'independent'].includes(e.kind))
      add('school:' + id + ':' + String(e.at || 'legacy'), a.tier);
  }
  for (const id of state.completed || []) {
    const match = /^([fpc])(\d+)$/.exec(id);
    if (!match || [...known].some((key) => key.startsWith('game:' + id + ':'))) continue;
    const group = match[1] === 'f' ? 20 : match[1] === 'p' ? 10 : 5;
    add('game:' + id + ':legacy', Math.min(5, Math.floor(Number(match[2]) / group) * 2));
  }
  state.collection = restoreCollection(state.collection);
  return collectionProfile(state.collection);
}
export function treasureFor(earned) {
  const type = hash(earned.id) % OBJECTS.length,
    rarity = RARITIES[earned.tier];
  return {
    key: earned.tier + '-' + type,
    tier: earned.tier,
    type,
    name: OBJECTS[type][0],
    rarity: rarity.name,
    color: rarity.color,
  };
}
export function collectionProfile(raw) {
  const entries = restoreCollection(raw).earned,
    objects = new Map();
  for (const e of entries) {
    const item = treasureFor(e);
    const old = objects.get(item.key);
    objects.set(item.key, { ...item, count: (old?.count || 0) + 1 });
  }
  return {
    total: entries.length,
    objects: [...objects.values()].sort((a, b) => b.tier - a.tier || a.type - b.type),
    latest: entries.length ? treasureFor(entries.at(-1)) : null,
  };
}
export const COSTUMES = [
  { at: 0, name: 'Robe d’apprentie' },
  { at: 5, name: 'Cape étoilée' },
  { at: 15, name: 'Baguette de lumière' },
  { at: 35, name: 'Chapeau des constellations' },
  { at: 70, name: 'Broche de la chouette' },
  { at: 120, name: 'Grimoire étoilé' },
];
export function costumeProfile(raw, academicLevel = 1) {
  const total = restoreCollection(raw).earned.length;
  const level = Math.max(academicLevel, COSTUMES.findLastIndex((c) => total >= c.at) + 1);
  return {
    level,
    name: COSTUMES[level - 1].name,
    next: COSTUMES[level]?.name || null,
    remaining: COSTUMES[level] ? Math.max(0, COSTUMES[level].at - total) : 0,
  };
}
export function treasureArt(item) {
  return `<svg viewBox="0 0 64 72" aria-hidden="true"><circle cx="32" cy="35" r="29" fill="${item.color}" opacity=".12"/><path d="${OBJECTS[item.type][1]}" fill="none" stroke="${item.color}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M53 6V14M49 10H57" stroke="${item.color}" stroke-width="1.5"/></svg>`;
}
