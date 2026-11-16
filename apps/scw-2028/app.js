// Interface de la salle d'organisation SCW 2028 (JavaScript sans dépendance ni étape de construction).
// Organisation : état → fonctions de rendu (chaînes HTML) → délégation d'événements (attributs data-*).
import { analyse, phaseOf, PHASES, STATUSES, PRIORITIES, parseIds, wouldCycle, prefixFor, nextId, people } from './model.js';
import { createApi, ApiError } from './api.js';
import { STRINGS, STATUS_LABELS, PRIORITY_LABELS, DOMAIN_LABELS_FR } from './i18n.js';

const $ = sel => document.querySelector(sel);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k) { try { return localStorage.getItem('scw2028.' + k); } catch { return null; } },
  set(k, v) { try { v == null ? localStorage.removeItem('scw2028.' + k) : localStorage.setItem('scw2028.' + k, v); } catch { /* stockage indisponible */ } },
};

const state = {
  lang: store.get('lang') || ((navigator.language || 'fr').startsWith('fr') ? 'fr' : 'en'),
  api: null, who: '', tasks: new Map(), a: null, since: null,
  view: store.get('view') || 'next',
  f: { q: '', domain: '', person: '', priority: '', showDone: false },
  open: null,      // identifiant de la tâche ouverte, ou '' pour une nouvelle tâche
  dirty: false, busy: false, log: null,
};
const T = () => STRINGS[state.lang];
const statusLabel = s => STATUS_LABELS[state.lang][s] || s;
const priorityLabel = p => PRIORITY_LABELS[state.lang][p] || p;
const domainLabel = d => (state.lang === 'fr' && DOMAIN_LABELS_FR[d]) || d;
const slug = s => String(s).toLowerCase().replace(/[^a-z]+/g, '-');
const fmtDate = iso => new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString(state.lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtDateTime = iso => new Date(iso).toLocaleString(state.lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });

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
        <button class="link lang-switch" data-action="lang">${state.lang === 'fr' ? 'English' : 'Français'}</button>
      </div>
    </main>`;
}

async function signIn(code, who, remember) {
  const api = createApi(code, who);
  const data = await api.list();
  state.api = api; state.who = who;
  store.set('who', who);
  store.set('code', remember ? code : null);
  setTasks(data.tasks, data.ids); state.since = data.now;
  document.body.dataset.mode = 'app';
  renderShell(); render();
}

function signOut() {
  store.set('code', null);
  state.api = null; state.tasks = new Map(); state.open = null;
  showSignIn();
}

/* ---------- Données ---------- */

function setTasks(list, ids = null) {
  for (const t of list) state.tasks.set(t.id, t);
  if (ids) { const keep = new Set(ids); for (const id of [...state.tasks.keys()]) if (!keep.has(id)) state.tasks.delete(id); }
  state.a = analyse([...state.tasks.values()], { today: today() });
}

async function refresh({ full = false } = {}) {
  if (!state.api) return;
  try {
    const d = await state.api.list(full ? null : state.since);
    const changed = d.tasks.length > 0 || d.ids.length !== state.tasks.size;
    setTasks(d.tasks, d.ids); state.since = d.now;
    if (changed) { render(); if (state.open && !state.dirty) renderDrawer(); }
    $('#sync').textContent = `${T().refreshed} ${fmtDateTime(d.now)}`;
  } catch (e) {
    if (e instanceof ApiError && (e.code === 'code' || e.code === 'locked')) return signOut();
    $('#sync').textContent = T().offline;
  }
}

/* ---------- Filtres ---------- */

function matches(t) {
  const f = state.f;
  if (!f.showDone && t.status === 'Done') return false;
  if (f.domain && t.domain !== f.domain) return false;
  if (f.priority && t.priority !== f.priority) return false;
  if (f.person) {
    const ps = people(t.person).map(p => p.toLowerCase());
    if (f.person === '__none' ? ps.length : !ps.includes(f.person)) return false;
  }
  if (f.q) {
    const hay = [t.id, t.title, t.notes, t.person, t.domain, domainLabel(t.domain), t.timing, t.dependsOn].join(' ').toLowerCase();
    if (!f.q.toLowerCase().split(/\s+/).every(w => hay.includes(w))) return false;
  }
  return true;
}
const inOrder = () => state.a.order.map(id => state.tasks.get(id)).filter(matches);

/* ---------- Rendu : cadre ---------- */

function renderShell() {
  const t = T();
  const domains = [...new Set([...state.tasks.values()].map(x => x.domain))]
    .sort((a, b) => domainLabel(a).localeCompare(domainLabel(b), state.lang));
  const persons = new Map();
  for (const x of state.tasks.values()) for (const p of people(x.person)) if (!persons.has(p.toLowerCase())) persons.set(p.toLowerCase(), p);
  const personOpts = [...persons].sort((a, b) => a[1].localeCompare(b[1], state.lang));
  const views = [['next', t.viewNext], ['road', t.viewRoad], ['decisions', t.viewDecisions], ['people', t.viewPeople], ['log', t.viewLog]];
  $('#app').innerHTML = `
    <header class="top">
      <div class="brand"><span class="brand-event">SCW 2028</span><span class="brand-room">${esc(t.appName)}</span></div>
      <div class="top-actions">
        <button class="btn primary" data-action="new">${esc(t.newTask)}</button>
        <button class="link" data-action="lang" title="Language">${state.lang === 'fr' ? 'EN' : 'FR'}</button>
        <span class="who">${esc(state.who)}</span>
        <button class="link" data-action="signout">${esc(t.signOut)}</button>
      </div>
    </header>
    <section class="overview" aria-live="polite"><p id="summary"></p><div class="rail" id="rail"></div></section>
    <nav class="views" role="tablist">
      ${views.map(([k, label]) => `<button role="tab" data-view="${k}" aria-selected="${state.view === k}">${esc(label)}<span class="count" data-count="${k}"></span></button>`).join('')}
    </nav>
    <div class="toolbar" id="toolbar">
      <input type="search" id="f-q" placeholder="${esc(t.search)}" value="${esc(state.f.q)}" aria-label="${esc(t.search)}">
      <select id="f-domain" aria-label="${esc(t.allDomains)}"><option value="">${esc(t.allDomains)}</option>
        ${domains.map(d => `<option value="${esc(d)}" ${state.f.domain === d ? 'selected' : ''}>${esc(domainLabel(d))}</option>`).join('')}</select>
      <select id="f-person" aria-label="${esc(t.allPeople)}"><option value="">${esc(t.allPeople)}</option>
        <option value="__none" ${state.f.person === '__none' ? 'selected' : ''}>${esc(t.unassigned)}</option>
        ${personOpts.map(([k, v]) => `<option value="${esc(k)}" ${state.f.person === k ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>
      <select id="f-priority" aria-label="${esc(t.allPriorities)}"><option value="">${esc(t.allPriorities)}</option>
        ${PRIORITIES.map(p => `<option value="${p}" ${state.f.priority === p ? 'selected' : ''}>${esc(priorityLabel(p))}</option>`).join('')}</select>
      <label class="check"><input type="checkbox" id="f-done" ${state.f.showDone ? 'checked' : ''}> ${esc(t.showDone)}</label>
      <button class="link" data-action="clear" hidden id="clear">${esc(t.clearFilters)}</button>
    </div>
    <main id="main" tabindex="-1"></main>
    <footer class="foot"><span id="sync"></span></footer>
    <div id="drawer-root"></div>
    <div id="toast" role="status" aria-live="polite"></div>`;
}

function renderOverview() {
  const t = T(), a = state.a, all = [...state.tasks.values()];
  const count = s => all.filter(x => x.status === s).length;
  const decisions = all.filter(x => x.status === 'Decision needed').length;
  $('#summary').textContent = t.summary(count('Done'), all.length, a.ready.size, a.overdue.size, decisions);
  $('#rail').innerHTML = STATUSES.map(s => {
    const n = count(s);
    return n ? `<span class="seg st-${slug(s)}" style="flex-grow:${n}" title="${esc(statusLabel(s))} : ${n}"></span>` : '';
  }).join('');
  $('#rail').setAttribute('aria-label', STATUSES.map(s => `${statusLabel(s)} ${count(s)}`).join(', '));
  const open = all.filter(x => x.status !== 'Done');
  const counts = { next: a.ready.size, decisions, road: open.length, people: '', log: '' };
  document.querySelectorAll('[data-count]').forEach(el => { el.textContent = counts[el.dataset.count] === '' ? '' : String(counts[el.dataset.count]); });
  const filtered = state.f.q || state.f.domain || state.f.person || state.f.priority || state.f.showDone;
  $('#clear').hidden = !filtered;
  $('#toolbar').hidden = state.view === 'log';
}

/* ---------- Rendu : lignes de tâche ---------- */

function whenText(task) {
  const t = T();
  if (task.due) return { text: fmtDate(task.due), late: state.a.overdue.has(task.id) };
  if (task.planningDate) return { text: fmtDate(task.planningDate), late: state.a.overdue.has(task.id) };
  return { text: task.timing || task.startWhen || '', late: false, raw: true, t };
}

function row(task, { rank = false } = {}) {
  const t = T(), a = state.a, id = task.id;
  const waiting = a.waitingOn.get(id);
  const ready = a.ready.has(id), late = a.overdue.has(id), loop = a.inCycle.has(id);
  const unl = a.unlocks.get(id);
  const w = whenText(task);
  const node = task.status === 'Done' ? 'done' : ready ? 'ready' : 'waiting';
  return `
    <li class="task node-${node} st-${slug(task.status)}${late ? ' is-late' : ''}">
      <button class="task-btn" data-open="${esc(id)}">
        <span class="node" aria-hidden="true"></span>
        ${rank ? `<span class="rank">${a.rank.get(id)}</span>` : ''}
        <span class="task-main">
          <span class="task-title"><span class="tid">${esc(id)}</span> ${esc(task.title)}</span>
          <span class="task-meta">
            <span>${esc(domainLabel(task.domain))}</span>
            ${task.person ? `<span class="m-person">${esc(task.person)}</span>` : ''}
            ${w.text ? `<span class="${w.late ? 'm-late' : ''}">${esc(w.text)}${w.late ? ` (${esc(t.targetPassed)})` : ''}</span>` : ''}
            ${task.status !== 'Done' && waiting.length ? `<span class="m-wait">${esc(t.waitsFor)} ${waiting.map(esc).join(', ')}</span>` : ''}
            ${task.status !== 'Done' && unl ? `<span class="m-unlock">${esc(t.unlocks(unl))}</span>` : ''}
            ${loop ? `<span class="m-late">${esc(t.loop)}</span>` : ''}
          </span>
        </span>
        <span class="task-side">
          <span class="status st-${slug(task.status)}">${esc(statusLabel(task.status))}</span>
          <span class="prio pr-${slug(task.priority)}">${esc(priorityLabel(task.priority))}</span>
        </span>
      </button>
    </li>`;
}
const list = (tasks, opts) => tasks.length ? `<ol class="route">${tasks.map(x => row(x, opts)).join('')}</ol>` : `<p class="empty">${esc(T().nothingHere)}</p>`;

/* ---------- Rendu : vues ---------- */

function viewNext() {
  const t = T(), a = state.a, pr = p => PRIORITIES.indexOf(p);
  const visible = inOrder();
  const ready = visible.filter(x => a.ready.has(x.id)).sort((x, y) =>
    (a.overdue.has(y.id) - a.overdue.has(x.id)) || (a.unlocks.get(y.id) - a.unlocks.get(x.id)) || (pr(x.priority) - pr(y.priority)) || (a.rank.get(x.id) - a.rank.get(y.id)));
  const almost = visible.filter(x => x.status !== 'Done' && !a.ready.has(x.id) && a.waitingOn.get(x.id).length === 1);
  return `
    <p class="intro">${esc(t.nextIntro)}</p>
    <h2 class="phase">${esc(t.readyTitle)} <span class="n">${ready.length}</span></h2>
    ${list(ready)}
    <h2 class="phase">${esc(t.almostTitle)} <span class="n">${almost.length}</span></h2>
    <p class="intro">${esc(t.almostIntro)}</p>
    ${list(almost)}`;
}

function viewRoad() {
  const t = T(), a = state.a, groups = new Map(PHASES.map(p => [p, []]));
  for (const x of inOrder()) groups.get(phaseOf(a.slot.get(x.id))).push(x);
  return `<p class="intro">${esc(t.roadIntro)}</p>` + [...groups].filter(([, xs]) => xs.length).map(([p, xs]) =>
    `<h2 class="phase">${esc(t.phases[p])} <span class="n">${xs.length}</span></h2>${list(xs, { rank: true })}`).join('')
    || `<p class="empty">${esc(t.nothingHere)}</p>`;
}

function viewDecisions() {
  const t = T(), a = state.a, groups = new Map(PHASES.map(p => [p, []]));
  for (const x of inOrder()) if (x.status === 'Decision needed') groups.get(phaseOf(a.slot.get(x.id))).push(x);
  return `<p class="intro">${esc(t.decisionsIntro)}</p>` + ([...groups].filter(([, xs]) => xs.length).map(([p, xs]) =>
    `<h2 class="phase">${esc(t.phases[p])} <span class="n">${xs.length}</span></h2>${list(xs)}`).join('')
    || `<p class="empty">${esc(t.nothingHere)}</p>`);
}

function viewPeople() {
  const t = T(), groups = new Map();
  for (const x of inOrder()) {
    const ps = people(x.person);
    for (const p of ps.length ? ps : [t.unassigned]) {
      const k = p.toLowerCase();
      if (!groups.has(k)) groups.set(k, { name: p, tasks: [] });
      groups.get(k).tasks.push(x);
    }
  }
  const sorted = [...groups.values()].sort((g, h) => h.tasks.length - g.tasks.length || g.name.localeCompare(h.name, state.lang));
  const single = sorted.length === 1;
  return `<p class="intro">${esc(t.peopleIntro)}</p>` + (sorted.map(g => `
    <details class="person" ${single ? 'open' : ''}>
      <summary><span class="person-name">${esc(g.name)}</span> <span class="n">${g.tasks.length}</span>
        <span class="person-ready">${g.tasks.filter(x => state.a.ready.has(x.id)).length} ${esc(t.readyNow)}</span></summary>
      ${list(g.tasks)}
    </details>`).join('') || `<p class="empty">${esc(t.nothingHere)}</p>`);
}

function changedFields(e) {
  if (!e.before || !e.after) return [];
  return Object.keys({ ...e.before, ...e.after }).filter(k => (e.before[k] ?? '') !== (e.after[k] ?? ''));
}
const FIELD_LABEL = k => ({ title: T().fTitle, status: T().fStatus, priority: T().fPriority, person: T().fPerson, domain: T().fDomain,
  planningDate: T().fPlanning, due: T().fDue, timing: T().fTiming, startWhen: T().fStart, dependsOn: T().fDeps, notes: T().fNotes }[k] || k);

function logItems(entries, { withTask = true } = {}) {
  const t = T();
  if (!entries.length) return `<p class="empty">${esc(t.logEmpty)}</p>`;
  return `<ul class="log">${entries.map(e => {
    const verb = { create: t.created, update: t.updated, delete: t.deleted }[e.action];
    const title = (e.after || e.before || {}).title || '';
    const fields = changedFields(e);
    const statusChange = fields.includes('status') ? `${state.lang === 'fr' ? ' :' : ':'} ${statusLabel(e.before.status)} → ${statusLabel(e.after.status)}` : '';
    return `<li><time>${esc(fmtDateTime(e.at))}</time>
      <span><b>${esc(e.who || t.someone)}</b> ${esc(verb)}
      ${withTask ? (e.action === 'delete' ? `<span class="tid">${esc(e.task_id)}</span> ${esc(title)}` : `<button class="link" data-open="${esc(e.task_id)}"><span class="tid">${esc(e.task_id)}</span> ${esc(title)}</button>`) : ''}
      ${esc(statusChange)}
      ${fields.length && !statusChange ? `<small>${esc(t.changed)} ${fields.map(FIELD_LABEL).map(esc).join(', ')}</small>` : ''}</span></li>`;
  }).join('')}</ul>`;
}

function viewLog() {
  if (!state.log) {
    state.api.log(null, 60).then(entries => { state.log = entries; if (state.view === 'log') render(); }).catch(() => {});
    return `<p class="intro">${esc(T().logIntro)}</p><p class="empty">…</p>`;
  }
  return `<p class="intro">${esc(T().logIntro)}</p>${logItems(state.log)}`;
}

function render() {
  if (!state.a) return;
  renderOverview();
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.view === state.view)));
  const views = { next: viewNext, road: viewRoad, decisions: viewDecisions, people: viewPeople, log: viewLog };
  $('#main').innerHTML = (views[state.view] || viewNext)();
}

/* ---------- Fiche d'une tâche ---------- */

function blankTask() {
  const domain = state.f.domain || 'General';
  const all = [...state.tasks.values()];
  return { id: nextId(all, prefixFor(all, domain)), title: '', domain, due: '', priority: 'Medium', status: 'To do',
    person: '', notes: '', planningDate: '', timing: '', dependsOn: '', startWhen: '', provenance: '', sourceRecord: '' };
}

function depList(ids) {
  if (!ids.length) return `<p class="muted">${esc(T().none)}</p>`;
  return `<ul class="deps">${ids.map(id => { const x = state.tasks.get(id); return x ? `
    <li><button class="link dep st-${slug(x.status)}" data-open="${esc(id)}"><span class="dot"></span><span class="tid">${esc(id)}</span> ${esc(x.title)}
      <small>${esc(statusLabel(x.status))}</small></button></li>` : ''; }).join('')}</ul>`;
}

function sourceBlock(task) {
  if (!task.provenance && !task.sourceRecord) return '';
  let rows = '';
  try { const rec = JSON.parse(task.sourceRecord); rows = Object.entries(rec).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join(''); }
  catch { rows = task.sourceRecord ? `<dd>${esc(task.sourceRecord)}</dd>` : ''; }
  return `<details class="source"><summary>${esc(T().source)}</summary><p>${esc(task.provenance)}</p><dl>${rows}</dl></details>`;
}

function renderDrawer(error = '') {
  const root = $('#drawer-root');
  if (state.open == null) { root.innerHTML = ''; document.body.classList.remove('drawer-open'); return; }
  const t = T(), a = state.a, isNew = state.open === '';
  const task = isNew ? (state.draftNew ||= blankTask()) : state.tasks.get(state.open);
  if (!task) { state.open = null; return renderDrawer(); }
  const domains = [...new Set([...state.tasks.values()].map(x => x.domain).concat(['General']))].sort();
  const opt = (vals, cur, label) => vals.map(v => `<option value="${esc(v)}" ${v === cur ? 'selected' : ''}>${esc(label(v))}</option>`).join('');
  document.body.classList.add('drawer-open');
  root.innerHTML = `
    <div class="scrim" data-action="close"></div>
    <aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="d-title">
      <header class="drawer-head">
        <div>
          <span class="tid big" id="d-id">${esc(task.id)}</span>
          ${isNew ? '' : `<span class="muted">${esc(t.position(a.rank.get(task.id), a.order.length))}</span>`}
        </div>
        <button class="link" data-action="close">${esc(t.close)}</button>
      </header>
      <form id="task-form" novalidate>
        <label class="f-title">${esc(t.fTitle)}<textarea name="title" rows="2" maxlength="300" id="d-title" required>${esc(task.title)}</textarea></label>
        <div class="grid">
          <label>${esc(t.fStatus)}<select name="status">${opt(STATUSES, task.status, statusLabel)}</select></label>
          <label>${esc(t.fPriority)}<select name="priority">${opt(PRIORITIES, task.priority, priorityLabel)}</select></label>
          <label class="wide">${esc(t.fPerson)}<input name="person" maxlength="160" value="${esc(task.person)}"><small>${esc(t.fPersonHelp)}</small></label>
          <label class="wide">${esc(t.fDomain)}<select name="domain">${opt(domains, task.domain, domainLabel)}</select></label>
          <label>${esc(t.fPlanning)}<input name="planningDate" type="date" value="${esc(task.planningDate)}"></label>
          <label>${esc(t.fDue)}<input name="due" type="date" value="${esc(task.due)}"></label>
          <label>${esc(t.fTiming)}<input name="timing" maxlength="500" value="${esc(task.timing)}"></label>
          <label>${esc(t.fStart)}<input name="startWhen" maxlength="500" value="${esc(task.startWhen)}"></label>
          <label class="wide">${esc(t.fDeps)}<input name="dependsOn" maxlength="1000" value="${esc(task.dependsOn)}" spellcheck="false"><small>${esc(t.fDepsHelp)}</small></label>
        </div>
        ${isNew ? '' : `<div class="dep-cols">
          <section><h3>${esc(t.before)}</h3>${depList(a.prereqs.get(task.id) || [])}</section>
          <section><h3>${esc(t.after)}</h3>${depList(a.dependents.get(task.id) || [])}</section>
        </div>`}
        <label>${esc(t.fNotes)}<textarea name="notes" rows="7" maxlength="8000">${esc(task.notes)}</textarea></label>
        <p class="form-error" role="alert">${esc(error)}</p>
        <div class="drawer-actions">
          <button class="btn primary" type="submit" ${state.busy ? 'disabled' : ''}>${esc(state.busy ? t.saving : t.save)}</button>
          ${isNew ? '' : `<button class="link danger" type="button" data-action="delete">${esc(t.delete)}</button>`}
        </div>
      </form>
      ${isNew ? '' : `
        <p class="muted">${task.updatedBy ? esc(t.lastChange(task.updatedBy, fmtDateTime(task.updated))) : ''}</p>
        ${sourceBlock(task)}
        <details class="history" id="history"><summary>${esc(t.history)}</summary><div id="history-body">…</div></details>`}
    </aside>`;
  const form = $('#task-form');
  form.addEventListener('input', () => { state.dirty = true; });
  if (isNew) form.domain.addEventListener('change', () => {
    const all = [...state.tasks.values()];
    state.draftNew.domain = form.domain.value;
    state.draftNew.id = nextId(all, prefixFor(all, form.domain.value));
    $('#d-id').textContent = state.draftNew.id;
  });
  $('#history')?.addEventListener('toggle', async e => {
    if (!e.target.open) return;
    try { $('#history-body').innerHTML = logItems(await state.api.log(task.id, 50), { withTask: false }); }
    catch { $('#history-body').textContent = T().offline; }
  }, { once: true });
}

function openTask(id) {
  if (state.dirty && state.open != null && !confirm(state.lang === 'fr' ? 'Abandonner les modifications non enregistrées ?' : 'Discard unsaved changes?')) return;
  state.open = id; state.dirty = false; state.draftNew = null;
  renderDrawer();
  $('#d-title')?.focus({ preventScroll: true });
}
function closeDrawer() { openTask(null); }

async function saveTask(form) {
  const t = T(), isNew = state.open === '';
  const base = isNew ? state.draftNew : state.tasks.get(state.open);
  const fd = Object.fromEntries(new FormData(form));
  const task = { ...base, ...fd, title: fd.title.trim(), dependsOn: parseIds(fd.dependsOn).join(', ') };
  if (!task.title) return renderDrawerKeep(form, t.fieldsError);
  const deps = parseIds(task.dependsOn);
  const unknown = deps.filter(d => !state.tasks.has(d) || d === task.id);
  if (unknown.length) return renderDrawerKeep(form, t.unknownIds(unknown));
  if (wouldCycle([...state.tasks.values()], task.id, deps)) return renderDrawerKeep(form, t.cycleError);
  state.busy = true; form.querySelector('[type=submit]').disabled = true; form.querySelector('[type=submit]').textContent = t.saving;
  try {
    if (isNew) delete task.version;
    const r = await state.api.save(task);
    state.dirty = false; state.busy = false; state.log = null;
    toast(isNew ? t.createdToast : t.saved);
    await refresh();
    state.open = r.id; state.draftNew = null;
    renderDrawer(); render();
  } catch (e) {
    state.busy = false;
    if (e.code === 'exists' && isNew) { state.draftNew.id = nextId([...state.tasks.values()], task.id.split('-')[0]); }
    if (e.code === 'conflict') { state.dirty = false; await refresh({ full: true }); return renderDrawer(t.conflict); }
    if (e.code === 'code' || e.code === 'locked') return signOut();
    renderDrawerKeep(form, e.code === 'fields' ? t.fieldsError : t.offline);
  }
}

/** Affiche une erreur sans perdre ce qui a été saisi. */
function renderDrawerKeep(form, message) {
  form.querySelector('.form-error').textContent = message;
  const btn = form.querySelector('[type=submit]'); btn.disabled = false; btn.textContent = T().save;
}

async function deleteTask() {
  const task = state.tasks.get(state.open);
  if (!task || !confirm(T().confirmDelete(task.id))) return;
  try {
    await state.api.remove(task);
    state.dirty = false; state.open = null; state.log = null;
    await refresh(); renderDrawer(); render(); toast(T().deletedToast);
  } catch (e) {
    if (e.code === 'conflict') { await refresh({ full: true }); return renderDrawer(T().conflict); }
    renderDrawer(T().offline);
  }
}

let toastTimer;
function toast(msg) {
  const el = $('#toast'); if (!el) return;
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

/* ---------- Événements ---------- */

document.addEventListener('click', e => {
  const open = e.target.closest('[data-open]');
  if (open) { e.preventDefault(); return openTask(open.dataset.open); }
  const view = e.target.closest('[data-view]');
  if (view) { state.view = view.dataset.view; store.set('view', state.view); render(); return; }
  const act = e.target.closest('[data-action]')?.dataset.action;
  if (act === 'close') closeDrawer();
  else if (act === 'new') openTask('');
  else if (act === 'delete') deleteTask();
  else if (act === 'signout') signOut();
  else if (act === 'clear') { state.f = { q: '', domain: '', person: '', priority: '', showDone: false }; renderShell(); render(); }
  else if (act === 'lang') {
    state.lang = state.lang === 'fr' ? 'en' : 'fr'; store.set('lang', state.lang); document.documentElement.lang = state.lang;
    if (state.api) { renderShell(); render(); renderDrawer(); } else showSignIn();
  }
});

document.addEventListener('input', e => {
  if (e.target.id === 'f-q') { state.f.q = e.target.value.trim(); render(); }
});
document.addEventListener('change', e => {
  const k = { 'f-domain': 'domain', 'f-person': 'person', 'f-priority': 'priority' }[e.target.id];
  if (k) { state.f[k] = e.target.value; render(); }
  if (e.target.id === 'f-done') { state.f.showDone = e.target.checked; render(); }
});
document.addEventListener('submit', async e => {
  e.preventDefault();
  if (e.target.id === 'task-form') return saveTask(e.target);
  if (e.target.id === 'signin-form') {
    const f = e.target, btn = f.querySelector('button[type=submit]');
    btn.disabled = true;
    try { await signIn(f.code.value.trim(), f.who.value.trim(), f.remember.checked); }
    catch (err) {
      btn.disabled = false;
      f.querySelector('.form-error').textContent = err.code === 'code' ? T().badCode : err.code === 'locked' ? T().locked : T().offline;
    }
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && state.open != null) closeDrawer(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
setInterval(() => { if (!document.hidden) refresh(); }, 30000);
window.addEventListener('beforeunload', e => { if (state.dirty) e.preventDefault(); });

/* ---------- Démarrage ---------- */

document.documentElement.lang = state.lang;
const saved = store.get('code');
if (saved) signIn(saved, store.get('who') || '', true).catch(() => showSignIn());
else showSignIn();
