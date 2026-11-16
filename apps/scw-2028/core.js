// État partagé de l'interface et petites fonctions utilitaires (aucun rendu ici).
import { analyse, people, labelsFor, concerns, isActionable } from './model.js?v=20261116e';
import { STRINGS, STATUS_LABELS, PRIORITY_LABELS, EFFORT_LABELS, KIND_LABELS, DOMAIN_LABELS_FR, OWNER_LABELS_FR } from './i18n.js?v=20261116e';

export const $ = sel => document.querySelector(sel);
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const store = {
  get(k) { try { return localStorage.getItem('scw2028.' + k); } catch { return null; } },
  set(k, v) { try { v == null ? localStorage.removeItem('scw2028.' + k) : localStorage.setItem('scw2028.' + k, v); } catch { /* stockage indisponible */ } },
  json(k, fallback) { try { return JSON.parse(this.get(k)) ?? fallback; } catch { return fallback; } },
};

// Les tâches faites restent visibles par défaut (barrées et grisées). « taker » = qui a dit « Je m'en occupe ».
export const EMPTY_FILTERS = { q: '', domain: '', person: '', taker: '', priority: '', showDone: true };

export const state = {
  lang: store.get('lang') || 'en', // anglais simple par défaut (organisateurs internationaux) ; bouton pour le français
  api: null, who: '', tasks: new Map(), meta: {}, a: null, since: null,
  view: store.get('view') || 'home',
  f: { ...EMPTY_FILTERS, ...store.json('filters2', {}) },
  open: null,       // identifiant de la tâche ouverte, ou '' pour une nouvelle tâche
  draft: null,      // brouillon de la fiche ouverte (sous-étapes comprises)
  dirty: false, busy: false, log: null,
};

export const T = () => STRINGS[state.lang];
export const fr = () => state.lang === 'fr';
export const statusLabel = s => STATUS_LABELS[state.lang][s] || s;
export const priorityLabel = p => PRIORITY_LABELS[state.lang][p] || p;
export const effortLabel = e => EFFORT_LABELS[state.lang][e || ''] ?? e;
export const kindLabel = k => KIND_LABELS[state.lang][k || 'task'] || k;
export const domainLabel = d => (fr() && DOMAIN_LABELS_FR[d]) || d;
export const ownerLabel = o => (fr() && OWNER_LABELS_FR[o]) || o;
export const titleOf = t => (fr() ? t.titleFr || t.title : t.title || t.titleFr) || '';
export const deliverableOf = t => (fr() ? t.deliverableFr || t.deliverable : t.deliverable || t.deliverableFr) || '';

/** Personnes qui ont dit « Je m'en occupe ». */
export const takersOf = t => (Array.isArray(t.takers) ? t.takers : []);
export const same = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
export const iTook = t => takersOf(t).some(n => same(n, state.who));

/** Couleur stable par personne (même prénom = même couleur pour tout le monde). */
const PALETTE = [['#1d6f6a', '#dcefec'], ['#2f5d8a', '#e1ebf6'], ['#8a3b6e', '#f5e2ee'], ['#8a5d0c', '#f6ead3'], ['#5b4a9e', '#eae6f7'],
  ['#a03a2a', '#f8e2dd'], ['#3f6b2a', '#e4efdc'], ['#1f6f8b', '#dbeef5'], ['#7a3d9a', '#efe2f6'], ['#6b4f3a', '#efe6dd'], ['#9a2f55', '#f7e1e9'], ['#2e6b52', '#ddefe6']];
export function colorFor(name) {
  let h = 0;
  for (const c of String(name || '').trim().toLowerCase()) h = (h * 31 + c.codePointAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
/** Tout le monde : qui a pris ou fait une tâche, plus la personne connectée. */
export function everyone() {
  const m = new Map();
  const add = n => { const k = String(n || '').trim(); if (k && !m.has(k.toLowerCase())) m.set(k.toLowerCase(), k); };
  add(state.who);
  for (const t of state.tasks.values()) { takersOf(t).forEach(add); add(t.doneBy); }
  return [...m.values()].sort((a, b) => a.localeCompare(b));
}
export const slug = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-');

const locale = () => (fr() ? 'fr-FR' : 'en-GB');
export const fmtDate = iso => new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' });
export const fmtDay = iso => new Date(iso + 'T12:00:00').toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
export const fmtMonth = iso => new Date(iso + 'T12:00:00').toLocaleDateString(locale(), { month: 'short', year: 'numeric' });
export const fmtDateTime = iso => new Date(iso).toLocaleString(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });

export const milestones = () => state.meta.milestones?.value?.items || [];
export const milestoneLabel = m => (fr() ? m.fr : m.en) || m.key;
export const roles = () => state.meta.team?.value?.roles || [];
export const myLabels = () => labelsFor(state.who, roles());
/** « Mes tâches » : celles que j'ai prises, que j'ai faites, ou où mon prénom est cité comme responsable. */
export const isMine = t => iTook(t) || same(t.doneBy, state.who) || concerns(t, myLabels());

/** Recalcule l'analyse (ordre, prêtes, retards) après tout changement de tâches ou de jalons. */
export function recompute() {
  state.a = analyse([...state.tasks.values()], { today: today(), milestones: milestones() });
}

/** Filtres de la barre d'outils ; les règles et rituels sont exclus des listes de travail. */
export function matches(t, { includeNonTasks = false } = {}) {
  const f = state.f;
  if (!includeNonTasks && !isActionable(t)) return false;
  if (!f.showDone && t.status === 'Done') return false;
  if (f.domain && t.domain !== f.domain) return false;
  if (f.priority && t.priority !== f.priority) return false;
  if (f.taker) {
    if (f.taker === '__none' ? takersOf(t).length || t.status === 'Done' : !(takersOf(t).some(n => same(n, f.taker)) || same(t.doneBy, f.taker))) return false;
  }
  if (f.person) {
    const ps = people(t.person).map(p => p.toLowerCase());
    if (f.person === '__none' ? ps.length : !ps.includes(f.person)) return false;
  }
  if (f.q) {
    const hay = [t.id, t.title, t.titleFr, t.deliverable, t.deliverableFr, ...takersOf(t), t.doneBy, t.notes, t.person, t.domain, domainLabel(t.domain), t.timing, t.dependsOn, t.topic, t.decision]
      .join(' ').toLowerCase();
    if (!f.q.toLowerCase().split(/\s+/).every(w => hay.includes(w))) return false;
  }
  return true;
}
export const inOrder = opts => state.a.order.map(id => state.tasks.get(id)).filter(t => t && matches(t, opts));
export const filtersActive = () => Object.entries(EMPTY_FILTERS).some(([k, v]) => state.f[k] !== v);
export function saveFilters() { store.set('filters2', JSON.stringify(state.f)); }

let toastTimer;
/** Message bref ; `action` = { label, run } ajoute un bouton (ex. Annuler). */
export function toast(msg, action = null) {
  const el = $('#toast'); if (!el) return;
  el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button" class="link toast-action">${esc(action.label)}</button>` : ''}`;
  if (action) el.querySelector('.toast-action').onclick = () => { el.classList.remove('show'); action.run(); };
  el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), action ? 7000 : 3000);
}
