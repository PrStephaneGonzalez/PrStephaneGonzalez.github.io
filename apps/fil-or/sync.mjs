import { mergeAcademy } from './academy.mjs';
import { mergeCollection } from './treasures.mjs';
import { mergeTraining } from './training-state.mjs';
import { mergeStory } from './story.mjs';
const KEY = 'fil-or-cloud-v1',
  alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const cp = (x) => JSON.parse(JSON.stringify(x));
const union = (a = [], b = []) => [...new Set([...a, ...b])];
export function normalizeCode(code) {
  return String(code || '')
    .toUpperCase()
    .replace(/[\s-]/g, '');
}
export function newCode() {
  return Array.from(
    crypto.getRandomValues(new Uint8Array(20)),
    (n) => alphabet[n % alphabet.length],
  )
    .join('')
    .match(/.{1,5}/g)
    .join('-');
}
export async function codeKey(code) {
  const c = normalizeCode(code);
  if (c.length !== 20 || [...c].some((x) => !alphabet.includes(x))) throw Error('code');
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode('fil-or-journey-v1:' + c),
  );
  return [...new Uint8Array(hash)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
// A memorable name + small PIN identifies the child's journey inside the
// existing owner-private Site boundary. No email or raw PIN is stored.
export async function accountCode(name, pin) {
  const normalized = String(name || '')
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('fr')
    .replace(/\s+/g, ' ');
  if (!/^[\p{L}\p{N} '\u2019-]{2,24}$/u.test(normalized)) throw Error('name');
  if (!/^\d{4,6}$/.test(String(pin))) throw Error('pin');
  const digest = new Uint8Array(
    await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode('fil-or-school-account-v1:' + normalized + ':' + pin),
    ),
  );
  return [...digest.slice(0, 20)]
    .map((n) => alphabet[n % alphabet.length])
    .join('')
    .match(/.{1,5}/g)
    .join('-');
}
export function snapshot(state) {
  const out = {};
  for (const k of [
    'version',
    'puzzleRevision',
    'messagePolicy',
    'seenStarts',
    'messageCursor',
    'learning',
    'training',
    'academy',
    'collection',
    'extraBoards',
    'extraCompleted',
    'journey',
    'completed',
    'boards',
    'last',
    'story',
  ])
    out[k] = cp(state[k] ?? null);
  if (out.learning) delete out.learning.browseStage;
  return out;
}
export function mergeProgress(a, b) {
  if (!a) return cp(b);
  if (!b) return cp(a);
  const aj = a.journey || {},
    bj = b.journey || {},
    out = { ...a, ...b };
  for (const k of ['completed', 'extraCompleted', 'seenStarts']) out[k] = union(a[k], b[k]);
  out.boards = { ...a.boards, ...b.boards };
  out.extraBoards = { ...a.extraBoards, ...b.extraBoards };
  out.training = mergeTraining(a.training, b.training);
  out.academy = mergeAcademy(a.academy, b.academy);
  out.collection = mergeCollection(a.collection, b.collection);
  out.story = mergeStory(a.story, b.story);
  out.learning = {
    ...a.learning,
    ...b.learning,
    seen: union(a.learning?.seen, b.learning?.seen),
    completed: union(a.learning?.completed, b.learning?.completed),
    outcomes: { ...a.learning?.outcomes, ...b.learning?.outcomes },
    drafts: { ...a.learning?.drafts, ...b.learning?.drafts },
  };
  for (const [id, outcome] of Object.entries(a.learning?.outcomes || {})) {
    const current = out.learning.outcomes[id];
    if (Date.parse(outcome.at) > Date.parse(current?.at || '')) out.learning.outcomes[id] = outcome;
  }
  const newer = (aj.step || 0) > (bj.step || 0) ? aj : bj;
  out.journey = { ...newer, visited: union(aj.visited, bj.visited).slice(-2500), stats: {} };
  for (const skill of union(Object.keys(aj.stats || {}), Object.keys(bj.stats || {}))) {
    const x = aj.stats?.[skill],
      y = bj.stats?.[skill];
    if (!x || !y) {
      out.journey.stats[skill] = cp(x || y);
      continue;
    }
    const high = (x.tier || 0) > (y.tier || 0) ? x : y;
    out.journey.stats[skill] = {
      ...high,
      attempts: Math.max(x.attempts || 0, y.attempts || 0),
      wins: x.tier === y.tier ? union(x.wins, y.wins) : high.wins || [],
      evidence:
        x.tier === y.tier
          ? Object.values(
              Object.fromEntries(
                [...(x.evidence || []), ...(y.evidence || [])].map((e) => [e.id, e]),
              ),
            ).slice(-12)
          : high.evidence || [],
    };
  }
  return out;
}
export function createSync({
  getState,
  apply,
  onStatus,
  storage = globalThis.localStorage,
  fetcher = globalThis.fetch,
}) {
  let link = null,
    timer,
    busy = false,
    again = false,
    generation = 0,
    dirty = false,
    latestStatus = 'Sur cet appareil';
  try {
    link = JSON.parse(storage.getItem(KEY));
    if (!link?.code || !link?.key) link = null;
  } catch {}
  const status = (s) => {
    latestStatus = s;
    onStatus?.(s);
  };
  const remember = () => {
    if (link) storage.setItem(KEY, JSON.stringify(link));
    else storage.removeItem(KEY);
  };
  async function api(method, body) {
    const r = await fetcher('/api/progress', {
      signal: globalThis.AbortSignal?.timeout?.(12000),
      method,
      credentials: 'same-origin',
      cache: 'no-store',
      headers: {
        'X-Journey-Key': link.key,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!r.ok) {
      const e = Error(String(r.status));
      e.status = r.status;
      throw e;
    }
    return r.json();
  }
  async function sync() {
    if (!link) return;
    if (busy) {
      again = true;
      return;
    }
    busy = true;
    const mine = generation;
    status('Synchronisation…');
    try {
      let saved = false;
      for (let attempt = 0; attempt < 4; attempt++) {
        const remote = await api('GET');
        if (mine !== generation) return;
        const merged = mergeProgress(remote.snapshot, snapshot(getState()));
        apply(merged);
        dirty = false;
        try {
          const r = await api('PUT', { revision: remote.revision, snapshot: merged });
          if (mine !== generation) return;
          link.revision = r.revision;
          link.updated = r.updated;
          remember();
          status('Parcours synchronisé');
          saved = true;
          break;
        } catch (e) {
          if (e.status === 409) continue;
          throw e;
        }
      }
      if (!saved) throw Error('conflict');
    } catch (e) {
      dirty = true;
      status(
        e.status === 401
          ? 'Connexion au site à renouveler'
          : e.status === 404
            ? 'Code introuvable · copie locale conservée'
            : 'Sur cet appareil · en attente de connexion',
      );
    } finally {
      busy = false;
      if (again || (dirty && globalThis.navigator?.onLine)) {
        again = false;
        clearTimeout(timer);
        timer = setTimeout(() => sync(), dirty ? 30000 : 1200);
      }
    }
  }
  return {
    get code() {
      return link?.code || null;
    },
    get profile() {
      return link?.profile?.name ? { name: link.profile.name } : null;
    },
    get status() {
      return latestStatus;
    },
    changed() {
      dirty = true;
      if (!link) return;
      if (busy) {
        again = true;
        return;
      }
      clearTimeout(timer);
      timer = setTimeout(() => sync(), 1800);
    },
    async init() {
      if (link) await sync();
    },
    sync,
    async create(code = newCode(), profile = null) {
      if (busy) throw Error('busy');
      const old = link;
      clearTimeout(timer);
      link = { code, key: await codeKey(code), ...(profile ? { profile } : {}) };
      generation++;
      try {
        const r = await api('POST', { snapshot: snapshot(getState()) });
        link.revision = r.revision;
        link.updated = r.updated;
        remember();
        dirty = false;
        status('Parcours synchronisé');
        return code;
      } catch (e) {
        link = old;
        throw e;
      }
    },
    async connect(code, { profile = null, replace = false } = {}) {
      if (busy) throw Error('busy');
      const old = link;
      const formatted = normalizeCode(code)
        .match(/.{1,5}/g)
        ?.join('-');
      const key = await codeKey(code);
      clearTimeout(timer);
      link = { code: formatted, key, ...(profile ? { profile } : {}) };
      generation++;
      try {
        const r = await api('GET');
        apply(replace ? r.snapshot : mergeProgress(r.snapshot, snapshot(getState())), { replace });
        link.revision = r.revision;
        link.updated = r.updated;
        remember();
        await sync();
      } catch (e) {
        link = old;
        throw e;
      }
    },
    async createAccount(name, pin) {
      const code = await accountCode(name, pin);
      if (link) await sync();
      return this.create(code, { name: name.normalize('NFKC').trim().replace(/\s+/g, ' ') });
    },
    async connectAccount(name, pin) {
      const code = await accountCode(name, pin);
      if (link) {
        await sync();
        if (dirty) throw Error('pending');
      }
      return this.connect(code, {
        profile: { name: name.normalize('NFKC').trim().replace(/\s+/g, ' ') },
        replace: true,
      });
    },
    disconnect() {
      generation++;
      clearTimeout(timer);
      link = null;
      remember();
      status('Sur cet appareil');
    },
    async remove() {
      if (busy) throw Error('busy');
      await api('DELETE');
      this.disconnect();
    },
  };
}
