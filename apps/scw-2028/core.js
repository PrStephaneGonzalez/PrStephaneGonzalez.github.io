// État partagé de l'interface et petites fonctions utilitaires (aucun rendu ici).
import { analyse, people, labelsFor, concerns, isActionable } from './model.js?v=20261116c';
import { STRINGS, STATUS_LABELS, PRIORITY_LABELS, EFFORT_LABELS, KIND_LABELS, DOMAIN_LABELS_FR, OWNER_LABELS_FR } from './i18n.js?v=20261116c';

export const $ = sel => document.querySelector(sel);
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const store = {
  get(k) { try { return localStorage.getItem('scw2028.' + k); } catch { return null; } },
  set(k, v) { try { v == null ? localStorage.removeItem('scw2028.' + k) : localStorage.setItem('scw2028.' + k, v); } catch { /* stockage indisponible */ } },
  json(k, fallback) { try { return JSON.parse(this.get(k)) ?? fallback; } catch { return fallback; } },
};

export const EMPTY_FILTERS = { q: '', domain: '', person: '', priority: '', showDone: false };

export const state = {
  lang: store.get('lang') || 'fr', // français par défaut ; le bouton de langue bascule en anglais
  api: null, who: '', tasks: new Map(), meta: {}, a: null, since: null,
  view: store.get('view') || 'home',
  f: { ...EMPTY_FILTERS, ...store.json('filters', {}) },
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
export const isMine = t => concerns(t, myLabels());

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
  if (f.person) {
    const ps = people(t.person).map(p => p.toLowerCase());
    if (f.person === '__none' ? ps.length : !ps.includes(f.person)) return false;
  }
  if (f.q) {
    const hay = [t.id, t.title, t.titleFr, t.deliverable, t.notes, t.person, t.domain, domainLabel(t.domain), t.timing, t.dependsOn, t.topic, t.decision]
      .join(' ').toLowerCase();
    if (!f.q.toLowerCase().split(/\s+/).every(w => hay.includes(w))) return false;
  }
  return true;
}
export const inOrder = opts => state.a.order.map(id => state.tasks.get(id)).filter(t => t && matches(t, opts));
export const filtersActive = () => Object.entries(EMPTY_FILTERS).some(([k, v]) => state.f[k] !== v);
export function saveFilters() { store.set('filters', JSON.stringify(state.f)); }

let toastTimer;
/** Message bref ; `action` = { label, run } ajoute un bouton (ex. Annuler). */
export function toast(msg, action = null) {
  const el = $('#toast'); if (!el) return;
  el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button" class="link toast-action">${esc(action.label)}</button>` : ''}`;
  if (action) el.querySelector('.toast-action').onclick = () => { el.classList.remove('show'); action.run(); };
  el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), action ? 7000 : 3000);
}
