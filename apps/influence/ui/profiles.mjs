// Local player profiles: a nickname and a progression kept on this device only.
// Pure functions over a plain object, so they are easy to test and never touch the DOM.
export const MAX_PROFILES = 8, NAME_MIN = 2, NAME_MAX = 16;
const SIDES = ['L', 'R', 'U'];            // won as Red, won as Blue, won (side unknown: older saves)
const CODE_PREFIX = 'INF1.';

const guestProfile = () => ({ id: 'guest', name: '', levels: {}, games: 0 });
export const emptyStore = () => ({ version: 1, active: 'guest', profiles: [guestProfile()] });

/** Trim, collapse spaces, drop control characters; null if the name is not acceptable. */
export function sanitizeName(raw) {
  if (typeof raw !== 'string') return null;
  const name = raw.normalize('NFC').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim();
  const length = [...name].length;
  return length >= NAME_MIN && length <= NAME_MAX ? name : null;
}

const sameName = (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }) === 0;
const isDay = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

function cleanLevels(raw, known) {
  const levels = {};
  if (!raw || typeof raw !== 'object') return levels;
  for (const [id, wins] of Object.entries(raw)) {
    if (!known.includes(id) || !wins || typeof wins !== 'object') continue;
    const kept = {};
    for (const side of SIDES) if (isDay(wins[side])) kept[side] = wins[side];
    if (Object.keys(kept).length) levels[id] = kept;
  }
  return levels;
}

function cleanProfile(raw, known) {
  if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || !/^[\w-]{1,24}$/.test(raw.id)) return null;
  const isGuest = raw.id === 'guest';
  const name = isGuest ? '' : sanitizeName(raw.name);
  if (!isGuest && !name) return null;
  const games = Number.isSafeInteger(raw.games) && raw.games >= 0 ? Math.min(raw.games, 1e6) : 0;
  return { id: raw.id, name, levels: cleanLevels(raw.levels, known), games };
}

/**
 * Rebuild a trustworthy store from whatever is in localStorage (never throws).
 * `legacyCompleted` is the list saved by the first version, before profiles existed.
 */
export function loadStore(raw, known, legacyCompleted = [], today = '1970-01-01') {
  let store = null;
  if (raw && typeof raw === 'object' && raw.version === 1 && Array.isArray(raw.profiles)) {
    const seen = new Set(), profiles = [];
    for (const p of raw.profiles) {
      const clean = cleanProfile(p, known);
      if (clean && !seen.has(clean.id) && profiles.length < MAX_PROFILES + 1) { seen.add(clean.id); profiles.push(clean); }
    }
    if (!seen.has('guest')) profiles.unshift(guestProfile());
    store = { version: 1, active: profiles.some(p => p.id === raw.active) ? raw.active : 'guest', profiles };
  }
  if (!store) {
    store = emptyStore();
    for (const id of Array.isArray(legacyCompleted) ? legacyCompleted : []) {
      if (typeof id === 'string' && known.includes(id)) store.profiles[0].levels[id] = { U: today };
    }
  }
  return store;
}

export const activeProfile = store => store.profiles.find(p => p.id === store.active) ?? store.profiles[0];
const update = (store, id, change) => ({ ...store, profiles: store.profiles.map(p => p.id === id ? change(p) : p) });
export const isWon = (profile, levelId) => Boolean(profile.levels[levelId]);

export function summary(profile, levelIds) {
  let won = 0, red = 0, blue = 0;
  for (const id of levelIds) {
    const w = profile.levels[id];
    if (!w) continue;
    won++; if (w.L) red++; if (w.R) blue++;
  }
  return { won, red, blue, games: profile.games };
}

/** Record a finished solo game for the active profile; `side` is the side the player had. */
export function recordGame(store, levelId, side, won, today) {
  if (!SIDES.includes(side) || side === 'U') return store;
  return update(store, store.active, p => {
    const next = { ...p, games: p.games + 1, levels: { ...p.levels } };
    if (won) next.levels[levelId] = { ...(p.levels[levelId] ?? {}), [side]: p.levels[levelId]?.[side] ?? today };
    return next;
  });
}

const newId = () => 'p' + (globalThis.crypto?.randomUUID?.().replace(/-/g, '').slice(0, 10) ?? Math.random().toString(36).slice(2, 12));

/** Create a profile and make it active. The guest's progress moves to the first named profile. */
export function createProfile(store, rawName, { id = newId() } = {}) {
  const name = sanitizeName(rawName);
  if (!name) return { error: 'invalid' };
  if (store.profiles.filter(p => p.id !== 'guest').length >= MAX_PROFILES) return { error: 'limit' };
  if (store.profiles.some(p => p.id !== 'guest' && sameName(p.name, name))) return { error: 'duplicate' };
  const guest = store.profiles.find(p => p.id === 'guest');
  const adopt = store.active === 'guest' && guest && (guest.games > 0 || Object.keys(guest.levels).length > 0);
  const profile = { id, name, levels: adopt ? guest.levels : {}, games: adopt ? guest.games : 0 };
  const profiles = store.profiles.map(p => p.id === 'guest' && adopt ? guestProfile() : p).concat(profile);
  return { store: { ...store, active: id, profiles } };
}

export function switchProfile(store, id) {
  return store.profiles.some(p => p.id === id) ? { ...store, active: id } : store;
}

export function deleteProfile(store, id) {
  if (id === 'guest') return store;
  const profiles = store.profiles.filter(p => p.id !== id);
  return { ...store, active: store.active === id ? 'guest' : store.active, profiles };
}

const toBase64 = text => btoa(String.fromCharCode(...new TextEncoder().encode(text))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromBase64 = code => new TextDecoder().decode(Uint8Array.from(atob(code.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)));

/** A copyable backup code for one named profile (the guest has nothing worth exporting by name). */
export function exportProfile(store, id) {
  const p = store.profiles.find(x => x.id === id);
  if (!p) return null;
  return CODE_PREFIX + toBase64(JSON.stringify({ v: 1, name: p.name, games: p.games, levels: p.levels }));
}

/** Merge a backup code into the store (union of victories). Never trusts the content. */
export function importProfile(store, code, known, { id = newId() } = {}) {
  if (typeof code !== 'string') return { error: 'invalid' };
  const text = code.trim().replace(/\s+/g, '');
  if (!text.startsWith(CODE_PREFIX) || text.length > 20000) return { error: 'invalid' };
  let data;
  try { data = JSON.parse(fromBase64(text.slice(CODE_PREFIX.length))); } catch { return { error: 'invalid' }; }
  if (!data || data.v !== 1) return { error: 'invalid' };
  const name = sanitizeName(data.name);
  if (!name) return { error: 'invalid' };
  const levels = cleanLevels(data.levels, known);
  const games = Number.isSafeInteger(data.games) && data.games >= 0 ? Math.min(data.games, 1e6) : 0;
  const existing = store.profiles.find(p => p.id !== 'guest' && sameName(p.name, name));
  if (existing) {
    const merged = { ...existing, games: Math.max(existing.games, games), levels: { ...existing.levels } };
    for (const [levelId, wins] of Object.entries(levels)) merged.levels[levelId] = { ...wins, ...(existing.levels[levelId] ?? {}) };
    return { store: { ...update(store, existing.id, () => merged), active: existing.id } };
  }
  if (store.profiles.filter(p => p.id !== 'guest').length >= MAX_PROFILES) return { error: 'limit' };
  return { store: { ...store, active: id, profiles: store.profiles.concat({ id, name, levels, games }) } };
}
