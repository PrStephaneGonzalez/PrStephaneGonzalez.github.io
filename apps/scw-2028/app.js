// Point d'entrée : connexion, synchronisation, actions rapides et délégation des événements.
// Organisation des fichiers : model.js (logique pure) · api.js (serveur) · core.js (état) ·
// views.js (vues) · drawer.js (fiche d'une tâche) · i18n.js (textes).
import { wouldUnlock } from './model.js?v=20261116f';
import { createApi, ApiError } from './api.js?v=20261116f';
import { $, esc, state, T, fr, store, statusLabel, recompute, toast, saveFilters, EMPTY_FILTERS, fmtDateTime, takersOf, same } from './core.js?v=20261116f';
import { workbook } from './xlsx.js?v=20261116f';
import { renderShell, render, agendaText, exportRows } from './views.js?v=20261116f';
import { hooks, renderDrawer, openTask, closeDrawer, saveTask, deleteTask, stepAction } from './drawer.js?v=20261116f';

/* ---------- Connexion ---------- */

function showSignIn(message = '') {
  document.body.dataset.mode = 'signin';
  const t = T();
  $('#app').innerHTML = `
    <main class="signin">
      <div class="signin-card">
        <p class="signin-conf">${esc(t.conference)}</p>
        <h1>${esc(t.appName)}</h1>
        <p>${esc(t.signInText)}</p>
        <form id="signin-form" autocomplete="on">
          <label>${esc(t.codeLabel)}<input name="code" type="password" required autocomplete="current-password" autofocus></label>
          <label>${esc(t.nameLabel)}<input name="who" required maxlength="40" value="${esc(store.get('who') || '')}" autocomplete="given-name">
            <small>${esc(t.nameHelp)}</small></label>
          <label class="check"><input name="remember" type="checkbox" checked> ${esc(t.remember)}</label>
          <p class="form-error" role="alert">${esc(message)}</p>
          <button class="btn primary" type="submit">${esc(t.signIn)}</button>
        </form>
        <button class="link lang-switch" data-action="lang">${fr() ? 'English' : 'Français'}</button>
      </div>
    </main>`;
}

async function signIn(code, who, remember) {
  const api = createApi(code, who);
  const data = await api.list();
  state.api = api; state.who = who;
  store.set('who', who);
  store.set('code', remember ? code : null);
  applyData(data, true);
  document.body.dataset.mode = 'app';
  renderShell(); render();
}

function signOut() {
  store.set('code', null);
  state.api = null; state.tasks = new Map(); state.open = null; state.draft = null;
  showSignIn();
}

/* ---------- Données ---------- */

function applyData(d, full = false) {
  if (full) state.tasks = new Map();
  for (const t of d.tasks) state.tasks.set(t.id, t);
  const keep = new Set(d.ids);
  for (const id of [...state.tasks.keys()]) if (!keep.has(id)) state.tasks.delete(id);
  state.meta = d.meta || state.meta;
  state.since = d.now;
  recompute();
}

async function refresh({ full = false } = {}) {
  if (!state.api) return;
  try {
    const before = JSON.stringify([state.tasks.size, Object.values(state.meta).map(m => m.version)]);
    const d = await state.api.list(full ? null : state.since);
    applyData(d, full);
    const changed = full || d.tasks.length > 0 || before !== JSON.stringify([state.tasks.size, Object.values(state.meta).map(m => m.version)]);
    if (changed) {
      const focusId = document.activeElement?.id;
      if (!isEditingPage()) render();
      if (state.open && !state.dirty) { state.draft = null; renderDrawer(); }
      if (focusId && $('#' + focusId)) $('#' + focusId).focus();
    }
    $('#sync').textContent = `${T().refreshed} ${fmtDateTime(d.now)}`;
  } catch (e) {
    if (e instanceof ApiError && (e.code === 'code' || e.code === 'locked')) return signOut();
    if ($('#sync')) $('#sync').textContent = T().offline;
  }
}
/** Ne pas redessiner la page pendant qu'on remplit les rôles ou les jalons. */
const isEditingPage = () => state.view === 'team' && document.activeElement?.closest('#roles-form, #ms-form');

Object.assign(hooks, { refresh, render, signOut });

/* ---------- Actions rapides ---------- */

/**
 * Modifie une tâche depuis la liste (statut, prise en charge). `change` reçoit la version la plus récente
 * et renvoie les champs à changer ; si quelqu'un a modifié la tâche entre-temps, on recharge et on réessaie une fois.
 */
async function mutate(id, change) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const task = state.tasks.get(id);
    if (!task) return null;
    const next = { ...task, ...change(task) };
    try {
      const r = await state.api.save(next);
      state.tasks.set(id, { ...next, version: r.version, updated: r.updated, updatedBy: state.who });
      recompute(); state.log = null; render();
      if (state.open === id && !state.dirty) { state.draft = null; renderDrawer(); }
      return task;
    } catch (e) {
      if (e.code === 'conflict' && attempt === 0) { await refresh({ full: true }); continue; }
      if (e.code === 'code' || e.code === 'locked') { signOut(); return null; }
      toast(e.code === 'conflict' ? T().conflict : T().offline); render();
      return null;
    }
  }
  return null;
}

/** Change le statut ; « fait » garde qui l'a fait et quand. Annulation possible. */
async function setStatus(id, status, { decision = null, silent = false } = {}) {
  const cur = state.tasks.get(id);
  if (!cur || (cur.status === status && decision == null)) return;
  const unlockedBefore = status === 'Done' ? wouldUnlock(state.a, id) : [];
  const before = await mutate(id, t => ({
    status, decision: decision ?? t.decision ?? '',
    doneBy: status === 'Done' ? (t.status === 'Done' ? t.doneBy : state.who) : '',
    doneAt: status === 'Done' ? (t.status === 'Done' ? t.doneAt : new Date().toISOString()) : '',
  }));
  if (!before || silent) return;
  const t = T();
  const msg = status === 'Done' ? t.doneToast(id, unlockedBefore.join(', ')) : before.status === 'Done' ? t.reopenToast(id) : t.statusToast(id, statusLabel(status));
  toast(msg, { label: t.undo, run: () => mutate(id, () => ({ status: before.status, decision: before.decision || '', doneBy: before.doneBy || '', doneAt: before.doneAt || '' }))
    .then(r => r && toast(t.statusToast(id, statusLabel(before.status)))) });
}

/** Garde la tâche à sa place dans la liste après une action, et la fait briller un instant. */
function remember(id) {
  const a = state.a, i = a.plan.indexOf(id);
  if (i >= 0) state.recent.set(id, { h: a.horizon.get(id), before: a.plan[i + 1] || null });
  state.flash = id;
  clearTimeout(remember.timer);
  remember.timer = setTimeout(() => { state.flash = null; document.querySelector('.task.flash')?.classList.remove('flash'); }, 1400);
}
const refocus = sel => requestAnimationFrame(() => document.querySelector(sel)?.focus({ preventScroll: true }));

/** « Je m'en occupe » / « Me retirer » : ajoute ou retire le prénom de la personne connectée. */
async function toggleTake(id) {
  const task = state.tasks.get(id);
  if (!task) return;
  const leaving = takersOf(task).some(n => same(n, state.who));
  remember(id);
  const r = await mutate(id, t => ({
    takers: leaving ? takersOf(t).filter(n => !same(n, state.who)) : [...takersOf(t).filter(n => !same(n, state.who)), state.who],
  }));
  refocus(`#main [data-take="${id}"]`);
  if (r) toast(leaving ? T().leaveToast(id) : T().takeToast(id), { label: T().undo, run: () => toggleTake(id) });
}

function toggleDone(id) {
  const task = state.tasks.get(id);
  if (!task) return;
  if (task.status === 'Decision needed') return askDecision(id);
  remember(id);
  setStatus(id, task.status === 'Done' ? 'To do' : 'Done').then(() => refocus(`#main [data-done="${id}"]`));
}

/** Petite fenêtre pour noter la décision prise avant de clore une « décision à prendre ». */
function askDecision(id) {
  const t = T(), task = state.tasks.get(id);
  $('#dialog-root').innerHTML = `
    <div class="scrim" data-action="dialog-close"></div>
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
      <form id="decision-form">
        <h2 id="dlg-title">${esc(t.decisionPrompt)}</h2>
        <p class="muted"><span class="tid">${esc(id)}</span> ${esc(fr() ? task.titleFr || task.title : task.title)}</p>
        <label>${esc(t.fDecision)}<small>${esc(t.decisionHelp)}</small><textarea name="decision" rows="4" maxlength="2000" required>${esc(task.decision || '')}</textarea></label>
        <div class="btn-row"><button class="btn primary" type="submit">${esc(t.decisionSave)}</button>
          <button class="link" type="button" data-action="dialog-close">${esc(t.cancel)}</button></div>
      </form>
    </div>`;
  $('#decision-form').dataset.id = id;
  $('#decision-form textarea').focus();
}

function showAgenda() {
  const t = T();
  $('#dialog-root').innerHTML = `
    <div class="scrim" data-action="dialog-close"></div>
    <div class="dialog wide" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
      <h2 id="dlg-title">${esc(t.meetingTitle)}</h2>
      <pre class="agenda">${esc(agendaText())}</pre>
      <div class="btn-row"><button class="btn primary" data-action="agenda-copy">${esc(t.copyAgenda)}</button>
        <button class="btn" data-action="print">${fr() ? 'Imprimer' : 'Print'}</button>
        <button class="link" data-action="dialog-close">${esc(t.close)}</button></div>
    </div>`;
  $('#dialog-root .btn').focus();
}

async function copyAgenda() {
  const text = agendaText();
  try { await navigator.clipboard.writeText(text); toast(T().copied); }
  catch { showAgenda(); }
}

function exportExcel() {
  const { head, rows } = exportRows();
  const widths = [7, 10, 60, 14, 22, 14, 12, 12, 12, 16, 50, 16, 10, 28, 24, 22, 24, 10, 40, 60, 60];
  const done = statusLabel('Done');
  const blob = workbook({ sheet: fr() ? 'Tâches' : 'Tasks', head, rows, widths, greyRow: r => r[3] === done });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `SCW2028-tasks-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function restore(hid) {
  const entry = (state.log || []).find(e => String(e.hid) === String(hid));
  if (!entry || !entry.before || !confirm(T().confirmRestore(entry.task_id))) return;
  await refresh({ full: true });
  const current = state.tasks.get(entry.task_id);
  try {
    await state.api.save({ ...entry.before, id: entry.task_id, version: current ? current.version : null });
    state.log = null; await refresh(); render(); toast(T().restored);
  } catch (e) { toast(e.code === 'conflict' ? T().conflict : T().offline); }
}

async function saveMeta(key, value, okMsg) {
  const cur = state.meta[key];
  try {
    const r = await state.api.saveMeta(key, value, cur ? cur.version : null);
    state.meta[key] = { value, version: r.version, updated: r.updated, updated_by: state.who };
    recompute(); state.log = null; render(); toast(okMsg);
  } catch (e) {
    if (e.code === 'conflict') { await refresh({ full: true }); toast(T().conflict); return; }
    toast(T().offline);
  }
}

/* ---------- Événements ---------- */

function setView(v) {
  state.view = v; store.set('view', v); state.recent.clear();
  render();
  window.scrollTo({ top: 0 });
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-done],[data-take],[data-scope],[data-person],[data-open],[data-view],[data-owner],[data-restore],[data-step-remove],[data-action]');
  if (!el) return;
  if (el.dataset.done) return toggleDone(el.dataset.done);
  if (el.dataset.take) return toggleTake(el.dataset.take);
  if (el.dataset.scope) { state.f.scope = el.dataset.scope; saveFilters(); state.recent.clear(); render(); return; }
  if (el.dataset.person) {
    state.f = { ...state.f, taker: el.dataset.person, scope: 'all' }; saveFilters(); renderShell();
    if (state.open != null) closeDrawer();
    return setView('tasks');
  }
  if (el.dataset.open) { e.preventDefault(); return openTask(el.dataset.open); }
  if (el.dataset.view) return setView(el.dataset.view);
  if (el.dataset.owner) { state.f = { ...EMPTY_FILTERS, person: el.dataset.owner }; saveFilters(); renderShell(); return setView('tasks'); }
  if (el.dataset.restore) return restore(el.dataset.restore);
  if (el.dataset.stepRemove) return stepAction('remove', +el.dataset.stepRemove);
  const act = el.dataset.action;
  if (act === 'close') closeDrawer();
  else if (act === 'new') openTask('');
  else if (act === 'delete') deleteTask();
  else if (act === 'signout') signOut();
  else if (act === 'step-add') stepAction('add');
  else if (act === 'clear') { state.f = { ...EMPTY_FILTERS }; saveFilters(); renderShell(); render(); }
  else if (act === 'agenda-copy') copyAgenda();
  else if (act === 'agenda-show') showAgenda();
  else if (act === 'print') window.print();
  else if (act === 'export') exportExcel();
  else if (act === 'clear-person') { state.f.taker = ''; saveFilters(); renderShell(); render(); }
  else if (act === 'dialog-close') $('#dialog-root').innerHTML = '';
  else if (act === 'lang') {
    state.lang = fr() ? 'en' : 'fr'; store.set('lang', state.lang); document.documentElement.lang = state.lang;
    if (state.api) { renderShell(); render(); if (state.open != null) renderDrawer(); } else showSignIn();
  }
});

document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.status) {
    if (el.value === 'Done' && state.tasks.get(el.dataset.status)?.status === 'Decision needed') { askDecision(el.dataset.status); render(); return; }
    return setStatus(el.dataset.status, el.value);
  }
  if (el.dataset.stepToggle != null) return stepAction('toggle', +el.dataset.stepToggle);
  const k = { 'f-domain': 'domain', 'f-person': 'person', 'f-priority': 'priority' }[el.id];
  if (k) { state.f[k] = el.value; saveFilters(); render(); }
});

let searchTimer;
document.addEventListener('input', e => {
  if (e.target.id !== 'f-q') return;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { state.f.q = e.target.value.trim(); saveFilters(); render(); }, 150);
});

document.addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target;
  if (f.id === 'task-form') return saveTask();
  if (f.id === 'decision-form') {
    const text = f.decision.value.trim();
    if (!text) return;
    $('#dialog-root').innerHTML = '';
    remember(f.dataset.id);
    return setStatus(f.dataset.id, 'Done', { decision: text });
  }
  if (f.id === 'roles-form') {
    const team = structuredClone(state.meta.team?.value || { roles: [] });
    team.roles.forEach((r, i) => { r.holder = (f[`holder-${i}`]?.value || '').trim(); });
    return saveMeta('team', team, T().rolesSaved);
  }
  if (f.id === 'ms-form') {
    const ms = structuredClone(state.meta.milestones?.value || { items: [] });
    ms.items.forEach((m, i) => { m.date = f[`date-${i}`]?.value || m.date; m.firm = !!f[`firm-${i}`]?.checked; });
    return saveMeta('milestones', ms, T().milestonesSaved);
  }
  if (f.id === 'signin-form') {
    const btn = f.querySelector('button[type=submit]');
    btn.disabled = true;
    try { await signIn(f.code.value.trim().toLowerCase(), f.who.value.trim(), f.remember.checked); }
    catch (err) {
      btn.disabled = false;
      f.querySelector('.form-error').textContent = err.code === 'code' ? T().badCode : err.code === 'locked' ? T().locked : T().offline;
    }
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if ($('#dialog-root')?.innerHTML) { $('#dialog-root').innerHTML = ''; return; }
    if (state.open != null) closeDrawer();
  }
  // Onglets : flèches gauche et droite.
  if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && e.target.getAttribute('role') === 'tab') {
    const tabs = [...document.querySelectorAll('[role=tab]')];
    const i = tabs.indexOf(e.target) + (e.key === 'ArrowRight' ? 1 : -1);
    const next = tabs[(i + tabs.length) % tabs.length];
    setView(next.dataset.view); $('#tab-' + next.dataset.view)?.focus();
  }
});
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
setInterval(() => { if (!document.hidden) refresh(); }, 30000);
window.addEventListener('beforeunload', e => { if (state.dirty) e.preventDefault(); });

/* ---------- Démarrage ---------- */

document.documentElement.lang = state.lang;
const saved = store.get('code');
if (saved) signIn(saved, store.get('who') || '', true).catch(() => showSignIn());
else showSignIn();
