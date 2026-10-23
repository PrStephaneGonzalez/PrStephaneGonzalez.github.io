// Sauvegarde en ligne sur Supabase (projet partagé avec la Forêt Enchantée).
// Remplace l'API /api/progress de l'ancien hébergement en imitant ses réponses,
// pour que sync.mjs (fusion, révisions, conflits) reste inchangé.
// La table n'est pas lisible directement : seules les fonctions filor_* y accèdent,
// et chacune exige l'empreinte SHA-256 du code (jamais le nom ni le code en clair).
import { restoreAcademy } from './academy.mjs';
import { restoreCollection } from './treasures.mjs';
import { restoreTraining } from './training-state.mjs';
import { restoreStory } from './story.mjs';

export const SUPABASE_URL = 'https://hwyckgbmguxhufnlenif.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_ockdQA7mMQP4fSz02r3nHQ_BOzgZpxM';
const KEYS = [
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
];
// Même nettoyage que l'ancien serveur (lib/progress-api.mjs), fait ici avant l'envoi.
export function cleanProgress(x) {
  if (
    !x ||
    x.version !== 1 ||
    !x.journey ||
    typeof x.journey !== 'object' ||
    !Array.isArray(x.completed)
  )
    throw Error('payload');
  const p = {};
  for (const k of KEYS) if (x[k] !== undefined) p[k] = x[k];
  p.training = restoreTraining(p.training);
  p.academy = restoreAcademy(p.academy);
  p.collection = restoreCollection(p.collection);
  p.story = restoreStory(p.story);
  if (p.learning)
    p.learning = {
      seen: p.learning.seen || [],
      completed: p.learning.completed || [],
      outcomes: p.learning.outcomes || {},
      drafts: p.learning.drafts || {},
    };
  return p;
}
const response = (status, body) => ({ ok: status < 300, status, json: async () => body });
export function supabaseFetcher(fetcher = null) {
  const rpc = async (fn, args, signal) => {
    const r = await (fetcher || globalThis.fetch)(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      signal,
      cache: 'no-store',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
    });
    if (!r.ok) {
      const e = Error(String(r.status));
      e.status = r.status >= 500 ? 503 : 400;
      throw e;
    }
    return r.json();
  };
  return async (_url, { method = 'GET', headers = {}, body, signal } = {}) => {
    const k = headers['X-Journey-Key'];
    if (!/^[a-f0-9]{64}$/.test(k || '')) return response(400, { error: 'code' });
    try {
      if (method === 'GET') {
        const row = await rpc('filor_get', { k }, signal);
        return row ? response(200, row) : response(404, { error: 'missing' });
      }
      if (method === 'DELETE') {
        await rpc('filor_delete', { k }, signal);
        return response(200, { deleted: true });
      }
      const data = JSON.parse(body || '{}');
      let p;
      try {
        p = cleanProgress(data.snapshot);
      } catch {
        return response(400, { error: 'payload' });
      }
      if (method === 'POST') {
        const r = await rpc('filor_create', { k, p }, signal);
        return r?.error ? response(409, r) : response(201, r);
      }
      if (!Number.isInteger(data.revision) || data.revision < 1)
        return response(400, { error: 'revision' });
      const r = await rpc('filor_put', { k, p, rev: data.revision }, signal);
      return r?.error ? response(409, r) : response(200, r);
    } catch (e) {
      if (e.status) return response(e.status, { error: 'unavailable' });
      return response(503, { error: 'unavailable' });
    }
  };
}
