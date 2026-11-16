// Logique pure de la salle d'organisation SCW 2028 (aucun accès au DOM ni au réseau).
// Testée par tests/model.test.mjs (node --test apps/scw-2028/tests/).
//
// Idée centrale : chaque tâche peut dépendre d'autres tâches (champ dependsOn, ex. « CAL-008, BUD-001 »).
// L'ordre logique est un tri topologique : une tâche n'apparaît jamais avant ses prérequis.
// À égalité, on place d'abord ce qui est daté le plus tôt, puis le plus prioritaire.
//
// Dates : une tâche a une date cible si elle a une échéance ferme (due), une cible interne (planningDate),
// ou un jalon de référence (anchor + anchorOffset en jours, ex. « 14 jours avant l'ouverture des inscriptions »).
// À défaut, un repère approximatif est tiré du texte libre (« Q2 2027 »).
//
// Nature (kind) : 'task' (par défaut), 'rule' (exigence permanente, jamais « à faire ») ou
// 'recurring' (rituel sans fin). Les règles et rituels ne bloquent jamais les autres tâches.

export const STATUSES = ['To do', 'In progress', 'Waiting', 'Decision needed', 'Blocked', 'Done'];
export const PRIORITIES = ['Urgent', 'High', 'Medium', 'Low'];
export const EFFORTS = ['hours', 'days', 'weeks'];
export const KINDS = ['task', 'rule', 'recurring'];

// Mois de la conférence si aucun jalon « conf » n'est fourni (préférence provisoire : 6–9 juin 2028).
export const CONFERENCE_MONTH = '2028-06';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const SEASONS = { spring: 3, summer: 6, autumn: 9, fall: 9, winter: 12 };
const ISO = /^\d{4}-\d{2}-\d{2}$/;

const pad = n => String(n).padStart(2, '0');
const ym = (y, m) => `${y}-${pad(m)}`;
function addMonths(month, delta) {
  const [y, m] = month.split('-').map(Number);
  const i = y * 12 + (m - 1) + delta;
  return ym(Math.floor(i / 12), (i % 12) + 1);
}
/** Ajoute n jours à une date ISO (calcul en UTC, sans dépendre du fuseau). */
export function addDays(iso, n) {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
/** Nombre de jours entiers de a à b (dates ISO). */
export function daysBetween(a, b) {
  return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000);
}

/** Identifiants de tâches cités dans un texte (« CAL-008, BUD-001 » → ['CAL-008','BUD-001']). */
export function parseIds(text) {
  return [...new Set(String(text || '').toUpperCase().match(/[A-Z]{2,5}-\d{3}/g) || [])];
}

/**
 * Repère temporel approximatif (« YYYY-MM ») tiré d'un texte libre, ou null.
 * Exemples : « Internal target: 15/12/2026 » → 2026-12 ; « Q2-Q3 2027 » → 2027-04 ;
 * « October–November 2026 » → 2026-10 ; « 30 days before the conference » → 2028-05.
 */
export function parseHint(text, conference = CONFERENCE_MONTH) {
  const s = String(text || '').toLowerCase();
  if (!s.trim()) return null;
  let m;
  if ((m = s.match(/(\d{4})-(\d{2})-\d{2}/))) return ym(m[1], +m[2]);
  if ((m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/))) return ym(m[3], +m[2]);
  if ((m = s.match(/q([1-4])(?:\s*[-–]\s*q?[1-4])?\s*(\d{4})/))) return ym(m[2], (m[1] - 1) * 3 + 1);
  if ((m = s.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b[^0-9]{0,20}(\d{4})/))) return ym(m[2], MONTHS.indexOf(m[1]) + 1);
  if ((m = s.match(/\b(spring|summer|autumn|fall|winter)\s+(\d{4})/))) return ym(m[2], SEASONS[m[1]]);
  if ((m = s.match(/(\d+)\s+days?\s+(before|after)\s+the\s+(conference|meeting)/))) {
    const months = Math.round(+m[1] / 30);
    return addMonths(conference, m[2] === 'before' ? -months : months);
  }
  if (/after the (conference|meeting)|post-conference|financial clos/.test(s)) return addMonths(conference, 1);
  if (/before the (conference|meeting)|on site|conference days|during the preceding week|each evening|1 day before/.test(s)) return conference;
  if ((m = s.match(/\b(20\d\d)\b/))) return ym(m[1], 1);
  return null;
}

/** Table des jalons { clé → date ISO } à partir de la liste [{ key, date }]. */
export const milestoneDates = list => new Map((list || []).filter(m => m && ISO.test(m.date || '')).map(m => [m.key, m.date]));

/**
 * Date cible d'une tâche et sa provenance, ou null.
 * provenance : 'due' (échéance ferme), 'planning' (cible interne), 'anchor' (jalon + décalage).
 */
export function targetDate(t, milestones = new Map()) {
  if (ISO.test(t.due || '')) return { date: t.due, source: 'due' };
  if (ISO.test(t.planningDate || '')) return { date: t.planningDate, source: 'planning' };
  if (t.anchor && milestones.has(t.anchor)) return { date: addDays(milestones.get(t.anchor), Number(t.anchorOffset) || 0), source: 'anchor' };
  return null;
}

/** Repère propre d'une tâche (« YYYY-MM ») : date cible, sinon indications textuelles. */
export function ownMonth(t, conference = CONFERENCE_MONTH, milestones = new Map()) {
  const d = targetDate(t, milestones);
  if (d) return d.date.slice(0, 7);
  return parseHint(t.timing, conference) || parseHint(t.startWhen, conference);
}

const priorityRank = p => { const i = PRIORITIES.indexOf(p); return i < 0 ? PRIORITIES.length : i; };
const max = (a, b) => (!a ? b : !b ? a : a > b ? a : b);
export const isActionable = t => (t.kind || 'task') === 'task';

/**
 * Analyse complète de la liste : graphe, ordre logique, tâches prêtes, boucles, dates.
 * tasks : [{ id, title, status, priority, dependsOn, planningDate, due, anchor, anchorOffset, kind, ... }]
 * options : { today: 'YYYY-MM-DD', milestones: [{ key, date }] }
 */
export function analyse(tasks, { today = new Date().toISOString().slice(0, 10), milestones = [] } = {}) {
  const ms = milestoneDates(milestones);
  const conference = (ms.get('conf') || '').slice(0, 7) || CONFERENCE_MONTH;
  const byId = new Map(tasks.map(t => [t.id, t]));
  const prereqs = new Map(), dependents = new Map(), missing = new Map();
  for (const t of tasks) { prereqs.set(t.id, []); dependents.set(t.id, []); }
  for (const t of tasks) {
    for (const p of parseIds(t.dependsOn)) {
      if (p === t.id) continue;
      if (!byId.has(p)) { missing.set(t.id, [...(missing.get(t.id) || []), p]); continue; }
      prereqs.get(t.id).push(p);
      dependents.get(p).push(t.id);
    }
  }

  const target = new Map(tasks.map(t => [t.id, targetDate(t, ms)]));
  const own = new Map(tasks.map(t => [t.id, ownMonth(t, conference, ms)]));
  const month = new Map(); // repère effectif : jamais avant celui des prérequis
  const indeg = new Map(tasks.map(t => [t.id, prereqs.get(t.id).length]));
  // Une tâche sans repère est placée au plus tôt des repères des tâches qui l'attendent (« à faire avant »).
  const needBy = new Map(), visiting = new Set();
  const need = id => {
    if (needBy.has(id)) return needBy.get(id);
    if (visiting.has(id)) return null;
    visiting.add(id);
    let best = null;
    for (const d of dependents.get(id)) { const m = own.get(d) || need(d); if (m && (!best || m < best)) best = m; }
    visiting.delete(id);
    needBy.set(id, best);
    return best;
  };
  const key = id => [byId.get(id).status === 'Done' && !month.get(id) ? '0000-00' : month.get(id) || need(id) || '9999-99',
    priorityRank(byId.get(id).priority), id];
  const cmp = (a, b) => { const ka = key(a), kb = key(b); for (let i = 0; i < 3; i++) { if (ka[i] < kb[i]) return -1; if (ka[i] > kb[i]) return 1; } return 0; };
  const queue = [];
  for (const t of tasks) if (!indeg.get(t.id)) { month.set(t.id, own.get(t.id)); queue.push(t.id); }
  const order = [];
  while (queue.length) {
    queue.sort(cmp);
    const id = queue.shift();
    order.push(id);
    for (const d of dependents.get(id)) {
      month.set(d, max(month.get(d), month.get(id)));
      indeg.set(d, indeg.get(d) - 1);
      if (!indeg.get(d)) { month.set(d, max(month.get(d), own.get(d))); queue.push(d); }
    }
  }
  // Tâches prises dans une boucle de dépendances : ajoutées à la fin et signalées.
  const placed = new Set(order);
  const inCycle = new Set(tasks.map(t => t.id).filter(id => !placed.has(id)));
  for (const id of [...inCycle].sort()) { month.set(id, own.get(id)); order.push(id); }
  const rank = new Map(order.map((id, i) => [id, i + 1]));
  // Repère servant à la feuille de route : le sien (ou hérité des prérequis), sinon celui des tâches qui l'attendent.
  const slot = new Map(order.map(id => [id, month.get(id) || need(id) || null]));

  const done = id => byId.get(id)?.status === 'Done';
  const blocking = id => !done(id) && isActionable(byId.get(id));
  const waitingOn = new Map(tasks.map(t => [t.id, prereqs.get(t.id).filter(blocking)]));
  const open = t => !done(t.id) && isActionable(t);
  const ready = new Set(tasks.filter(t => open(t) && waitingOn.get(t.id).length === 0).map(t => t.id));

  // Nombre de tâches ouvertes qui attendent, directement ou non, chaque tâche.
  const unlocks = new Map();
  for (const t of tasks) {
    const seen = new Set(), stack = [...dependents.get(t.id)];
    while (stack.length) { const x = stack.pop(); if (seen.has(x) || x === t.id) continue; seen.add(x); stack.push(...dependents.get(x)); }
    unlocks.set(t.id, [...seen].filter(x => open(byId.get(x))).length);
  }

  const overdue = new Set(tasks.filter(t => open(t) && target.get(t.id) && target.get(t.id).date < today).map(t => t.id));

  return { byId, order, rank, month, slot, target, prereqs, dependents, waitingOn, ready, unlocks, overdue, inCycle, missing, milestones: ms, conference };
}

/** Tâches qui deviendraient prêtes si `id` était terminée. */
export function wouldUnlock(a, id) {
  return (a.dependents.get(id) || []).filter(d => {
    const t = a.byId.get(d);
    if (!t || t.status === 'Done' || !isActionable(t)) return false;
    const w = a.waitingOn.get(d) || [];
    return w.length === 1 && w[0] === id;
  });
}

/** Phase de la feuille de route d'après le repère effectif. */
export const PHASES = ['now', '2027h1', '2027h2', '2028pre', 'conference', 'after', 'undated'];
export function phaseOf(month, conference = CONFERENCE_MONTH) {
  if (!month) return 'undated';
  if (month <= '2026-12') return 'now';
  if (month <= '2027-06') return '2027h1';
  if (month <= '2027-12') return '2027h2';
  if (month < conference) return '2028pre';
  if (month === conference) return 'conference';
  return 'after';
}

/** Vrai si donner à `id` les prérequis `deps` créerait une boucle. */
export function wouldCycle(tasks, id, deps) {
  const map = new Map(tasks.map(t => [t.id, parseIds(t.dependsOn)]));
  map.set(id, deps);
  const seen = new Set(), stack = [...deps];
  while (stack.length) {
    const x = stack.pop();
    if (x === id) return true;
    if (seen.has(x)) continue;
    seen.add(x);
    stack.push(...(map.get(x) || []));
  }
  return false;
}

/** Préfixe d'identifiant le plus utilisé pour un domaine (ex. « Budget & funding » → « BUD »). */
export function prefixFor(tasks, domain) {
  const count = {};
  for (const t of tasks) if (t.domain === domain) { const p = t.id.split('-')[0]; count[p] = (count[p] || 0) + 1; }
  const best = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
  return best ? best[0] : 'GEN';
}

/** Identifiant libre suivant pour un préfixe (« BUD » → « BUD-013 »). */
export function nextId(tasks, prefix) {
  const nums = tasks.filter(t => t.id.startsWith(prefix + '-')).map(t => +t.id.slice(prefix.length + 1)).filter(Number.isFinite);
  return `${prefix}-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0')}`;
}

/** Personnes ou rôles cités dans le champ « person » (« Taï / Lyon 2 » → ['Taï', 'Lyon 2']). Le premier est le responsable. */
export function people(person) {
  return String(person || '').split('/').map(s => s.trim()).filter(Boolean);
}

/**
 * Libellés (personnes et rôles) qui désignent quelqu'un, d'après l'annuaire des rôles.
 * roles : [{ role, holder }] où holder liste des prénoms séparés par des virgules.
 */
export function labelsFor(name, roles = []) {
  const n = String(name || '').trim().toLowerCase();
  if (!n) return [];
  const out = [name.trim()];
  for (const r of roles) {
    const holders = String(r.holder || '').split(/[,;/]/).map(s => s.trim().toLowerCase()).filter(Boolean);
    if (holders.includes(n)) out.push(r.role);
  }
  return out;
}

/** Vrai si la tâche concerne l'une des étiquettes (comparaison sans casse). */
export const concerns = (t, labels) => {
  const ps = people(t.person).map(p => p.toLowerCase());
  return labels.some(l => ps.includes(String(l).toLowerCase()));
};

/** Ordre du jour d'une réunion du comité : décisions mûres, retards, tâches bloquées. */
export function agenda(a) {
  const open = [...a.byId.values()].filter(t => t.status !== 'Done' && isActionable(t));
  const byRank = (x, y) => a.rank.get(x.id) - a.rank.get(y.id);
  return {
    decisions: open.filter(t => t.status === 'Decision needed' && a.ready.has(t.id)).sort((x, y) => a.unlocks.get(y.id) - a.unlocks.get(x.id) || byRank(x, y)),
    overdue: open.filter(t => a.overdue.has(t.id)).sort(byRank),
    blocked: open.filter(t => t.status === 'Blocked' || t.status === 'Waiting').sort(byRank),
  };
}

/** Échappe une valeur pour un fichier CSV (séparateur virgule, guillemets doublés). */
export const csvCell = v => {
  const s = String(v ?? '');
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
