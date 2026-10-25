// Optional online backup of a named profile (victories + game count only).
// Same idea as fil-or: an identifier made of name + small secret code, hashed in the browser.
// Only the SHA-256 fingerprint is sent; the table is reachable only through influence_* functions.
import { cleanRemote, cloudPayload, mergeData, sameData } from './profiles.mjs';

export const SUPABASE_URL = 'https://hwyckgbmguxhufnlenif.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_ockdQA7mMQP4fSz02r3nHQ_BOzgZpxM';

export const normalizeAccountName = raw => String(raw ?? '').normalize('NFKC').trim().toLocaleLowerCase('fr').replace(/\s+/g, ' ');
export const validPin = pin => /^\d{4,6}$/.test(String(pin ?? ''));

/** Hex SHA-256 identifying the account. Throws 'name' or 'pin' for unusable input. */
export async function accountKey(name, pin, subtle = globalThis.crypto?.subtle) {
  const n = normalizeAccountName(name);
  if (n.length < 2) throw Error('name');
  if (!validPin(pin)) throw Error('pin');
  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(`influence-account-v1:${n}:${pin}`));
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, '0')).join('');
}

/** Thin client over the four influence_* functions. Every failure becomes Error('unavailable'). */
export function createApi({ fetcher = globalThis.fetch?.bind(globalThis), url = SUPABASE_URL, key = SUPABASE_KEY, timeout = 8000 } = {}) {
  async function rpc(fn, args) {
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeout) : null;
    try {
      const r = await fetcher(`${url}/rest/v1/rpc/${fn}`, {
        method: 'POST', cache: 'no-store', signal: controller?.signal,
        headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      });
      if (!r.ok) throw Error(String(r.status));
      return await r.json();
    } catch { throw Error('unavailable'); } finally { if (timer) clearTimeout(timer); }
  }
  return {
    get: k => rpc('influence_get', { k }),
    create: (k, p) => rpc('influence_create', { k, p }),
    put: (k, p, rev) => rpc('influence_put', { k, p, rev }),
    remove: k => rpc('influence_delete', { k }),
  };
}

/**
 * Bring a profile and its online copy to the same state (union of victories).
 * Returns { data:{games,levels}, rev, status } with status 'created' | 'same' | 'pulled' | 'merged'.
 * Retries when another device wrote in between; throws Error('unavailable') or Error('conflict').
 */
export async function syncProfile(api, profile, key, known) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const remote = await api.get(key);
    if (!remote) {
      const made = await api.create(key, cloudPayload(profile));
      if (made?.error === 'exists') continue;
      if (!Number.isInteger(made?.revision)) throw Error('unavailable');
      return { data: { games: profile.games, levels: profile.levels }, rev: made.revision, status: 'created' };
    }
    if (!Number.isInteger(remote.revision)) throw Error('unavailable');
    const theirs = cleanRemote(remote.snapshot, known);
    const data = mergeData(profile, theirs);
    if (sameData(data, theirs)) return { data, rev: remote.revision, status: sameData(data, profile) ? 'same' : 'pulled' };
    const saved = await api.put(key, { ...cloudPayload(profile), ...data }, remote.revision);
    if (saved?.error === 'conflict') continue;
    if (!Number.isInteger(saved?.revision)) throw Error('unavailable');
    return { data, rev: saved.revision, status: 'merged' };
  }
  throw Error('conflict');
}
