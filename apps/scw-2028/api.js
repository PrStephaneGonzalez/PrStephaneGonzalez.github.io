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

/** Champs d'une tâche enregistrés côté serveur (colonne JSON : un nouveau champ ne demande aucune migration). */
export const TEXT_FIELDS = ['title', 'titleFr', 'domain', 'due', 'priority', 'status', 'person', 'notes', 'planningDate',
  'timing', 'dependsOn', 'startWhen', 'provenance', 'sourceRecord', 'deliverable', 'effort', 'kind', 'topic', 'anchor', 'decision'];

/** Une tâche côté interface : { id, version, updated, updatedBy, ...champs }. */
const toTask = row => ({ ...row.data, id: row.id, version: row.version, updated: row.updated, updatedBy: row.updated_by });
export function toData(t) {
  const d = Object.fromEntries(TEXT_FIELDS.map(k => [k, t[k] == null ? '' : String(t[k])]));
  d.kind = d.kind || 'task';
  d.anchorOffset = Number.isFinite(Number(t.anchorOffset)) ? Number(t.anchorOffset) : 0;
  d.checklist = Array.isArray(t.checklist)
    ? t.checklist.filter(s => s && String(s.text || '').trim()).map(s => ({ text: String(s.text).trim().slice(0, 300), done: !!s.done })).slice(0, 40)
    : [];
  return d;
}

export function createApi(code, who) {
  return {
    /** Toutes les tâches (ou celles modifiées depuis `since`) et les données partagées (jalons, rôles). */
    async list(since = null) {
      const d = await rpc('scw_list', { c: code, since });
      return { now: d.now, ids: d.ids, tasks: d.tasks.map(toTask), meta: d.meta || {} };
    },
    /** Crée la tâche si `version` est absente, sinon la met à jour si personne ne l'a modifiée entre-temps. */
    save: task => rpc('scw_save', { c: code, who, t: { id: task.id, version: task.version ?? null, data: toData(task) } }),
    remove: task => rpc('scw_delete', { c: code, tid: task.id, v: task.version, who }),
    log: (taskId = null, lim = 40) => rpc('scw_log', { c: code, tid: taskId, lim }).then(d => d.log),
    /** Enregistre une donnée partagée (« milestones », « team ») ; version = celle lue, ou null pour créer. */
    saveMeta: (key, value, version) => rpc('scw_meta_save', { c: code, k: key, v: value, ver: version ?? null, who }),
  };
}
