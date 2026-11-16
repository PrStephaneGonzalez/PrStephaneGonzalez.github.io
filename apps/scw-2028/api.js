// Accès aux données partagées : fonctions scw_* du projet Supabase partagé du site
// (schéma et règles dans docs/supabase-scw.sql). Chaque appel transmet le code d'équipe,
// vérifié côté serveur ; sans lui, aucune donnée n'est lisible.
export const SUPABASE_URL = 'https://hwyckgbmguxhufnlenif.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_ockdQA7mMQP4fSz02r3nHQ_BOzgZpxM';

/** Erreur métier : e.code vaut 'code', 'locked', 'conflict', 'fields', 'exists', 'id' ou 'offline'. */
export class ApiError extends Error {
  constructor(code) { super(code); this.code = code; }
}

async function rpc(fn, args, timeout = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  let r;
  try {
    r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST', cache: 'no-store', signal: controller.signal,
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
  } catch { throw new ApiError('offline'); } finally { clearTimeout(timer); }
  if (!r.ok) throw new ApiError('offline');
  const data = await r.json();
  if (data && data.error) throw new ApiError(data.error);
  return data;
}

/** Une tâche côté interface : { id, version, updated, updatedBy, ...champs de data }. */
const toTask = row => ({ ...row.data, id: row.id, version: row.version, updated: row.updated, updatedBy: row.updated_by });
const DATA_FIELDS = ['title', 'domain', 'due', 'priority', 'status', 'person', 'notes', 'planningDate', 'timing', 'dependsOn', 'startWhen', 'provenance', 'sourceRecord'];
const toData = t => Object.fromEntries(DATA_FIELDS.map(k => [k, t[k] == null ? '' : String(t[k])]));

export function createApi(code, who) {
  return {
    /** Toutes les tâches, ou seulement celles modifiées depuis `since` (horodatage serveur). */
    async list(since = null) {
      const d = await rpc('scw_list', { c: code, since });
      return { now: d.now, ids: d.ids, tasks: d.tasks.map(toTask) };
    },
    /** Crée la tâche si `version` est absente, sinon la met à jour si personne ne l'a modifiée entre-temps. */
    save: task => rpc('scw_save', { c: code, who, t: { id: task.id, version: task.version ?? null, data: toData(task) } }),
    remove: task => rpc('scw_delete', { c: code, tid: task.id, v: task.version, who }),
    log: (taskId = null, lim = 40) => rpc('scw_log', { c: code, tid: taskId, lim }).then(d => d.log),
  };
}
