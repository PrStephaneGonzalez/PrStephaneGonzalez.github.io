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
  'timing', 'dependsOn', 'startWhen', 'provenance', 'sourceRecord', 'deliverable', 'deliverableFr', 'effort', 'kind', 'topic', 'anchor',
  'decision', 'doneBy', 'doneAt', 'tag'];

/** Une tâche côté interface : { id, version, updated, updatedBy, ...champs }. */
const toTask = row => ({ ...row.data, id: row.id, version: row.version, updated: row.updated, updatedBy: row.updated_by });
export function toData(t) {
  const d = Object.fromEntries(TEXT_FIELDS.map(k => [k, t[k] == null ? '' : String(t[k])]));
  d.kind = d.kind || 'task';
  d.anchorOffset = Number.isFinite(Number(t.anchorOffset)) ? Number(t.anchorOffset) : 0;
  d.checklist = Array.isArray(t.checklist)
    ? t.checklist.filter(s => s && String(s.text || '').trim()).map(s => ({ text: String(s.text).trim().slice(0, 300), done: !!s.done })).slice(0, 40)
    : [];
  // Personnes qui ont cliqué « Je m'en occupe » (prénoms, sans doublon).
  d.takers = Array.isArray(t.takers) ? [...new Map(t.takers.map(n => String(n).trim()).filter(Boolean).map(n => [n.toLowerCase(), n.slice(0, 40)])).values()].slice(0, 20) : [];
  return d;
}

/** Un compte rendu côté interface : { id, version, updated, updatedBy, date, present, decisions[], actions[], notes, next }. */
const toMeeting = row => ({ ...meetingData(row.data), id: row.id, version: row.version, updated: row.updated, updatedBy: row.updated_by });
const isoDate = v => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? String(v) : '');
export function meetingData(m = {}) {
  const clean = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
  return {
    date: isoDate(m.date),
    present: clean(m.present, 300),
    decisions: (Array.isArray(m.decisions) ? m.decisions : []).map(x => clean(x, 600)).filter(Boolean).slice(0, 60),
    actions: (Array.isArray(m.actions) ? m.actions : []).map(a => ({ text: clean(a?.text, 400), who: clean(a?.who, 80), due: isoDate(a?.due), task: clean(a?.task, 12) }))
      .filter(a => a.text).slice(0, 60),
    notes: clean(m.notes, 12000),
    next: isoDate(m.next),
  };
}
/** Identifiant d'un nouveau compte rendu : la date, suivie de -2, -3… s'il y a déjà une réunion ce jour-là. */
export function meetingId(date, ids) {
  if (!ids.includes(date)) return date;
  for (let i = 2; i < 10; i++) if (!ids.includes(`${date}-${i}`)) return `${date}-${i}`;
  return `${date}-9`;
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
    /** Comptes rendus de réunions, du plus récent au plus ancien. */
    async meetings() {
      const d = await rpc('scw_meetings_list', { c: code });
      return d.meetings.map(toMeeting);
    },
    /** Crée (version absente) ou met à jour un compte rendu ; renvoie { id, version, updated }. */
    saveMeeting: m => rpc('scw_meeting_save', { c: code, who, m: { id: m.id, version: m.version ?? null, data: meetingData(m) } }),
    removeMeeting: m => rpc('scw_meeting_delete', { c: code, mid: m.id, v: m.version, who }),
    /** Enregistre une donnée partagée (« milestones », « team ») ; version = celle lue, ou null pour créer. */
    saveMeta: (key, value, version) => rpc('scw_meta_save', { c: code, k: key, v: value, ver: version ?? null, who }),
  };
}
