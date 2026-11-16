// Rendu des vues (chaînes HTML). Les interactions sont gérées dans app.js par délégation (attributs data-*).
import { STATUSES, PRIORITIES, people, isActionable, agenda, daysBetween, csvCell, addDays, horizonRank } from './model.js?v=20261116f';
import { GLOSSARY } from './i18n.js?v=20261116f';
import {
  $, esc, state, T, fr, statusLabel, priorityLabel, effortLabel, domainLabel, ownerLabel, titleOf, deliverableOf, slug,
  fmtDate, fmtDay, fmtMonth, fmtDateTime, today, milestones, milestoneLabel, isMine,
  matches, filtersActive, takersOf, iTook, colorFor, same, everyone,
} from './core.js?v=20261116f';

const VIEWS = ['tasks', 'decisions', 'team', 'log'];
const VIEW_LABEL = { tasks: 'viewTasks', decisions: 'viewDecisions', team: 'viewTeam', log: 'viewLog' };
const WITH_TOOLBAR = new Set(['tasks']);
const SCOPES = ['all', 'mine', 'free', 'late'];

/* ---------- Cadre ---------- */

export function renderShell() {
  const t = T();
  const all = [...state.tasks.values()];
  const domains = [...new Set(all.map(x => x.domain))].sort((a, b) => domainLabel(a).localeCompare(domainLabel(b), state.lang));
  const owners = new Map();
  for (const x of all) for (const p of people(x.person)) if (!owners.has(p.toLowerCase())) owners.set(p.toLowerCase(), p);
  const ownerOpts = [...owners].sort((a, b) => ownerLabel(a[1]).localeCompare(ownerLabel(b[1]), state.lang));
  const extra = !!(state.f.domain || state.f.priority || state.f.person);
  $('#app').innerHTML = `
    <a class="skip" href="#main">${fr() ? 'Aller au contenu' : 'Skip to content'}</a>
    <header class="top">
      <div class="brand"><span class="brand-event">SCW 2028</span><span class="brand-room">${esc(t.appName)}</span></div>
      <div class="top-actions">
        <button class="link" data-action="lang" lang="${fr() ? 'en' : 'fr'}">${fr() ? 'English' : 'Français'}</button>
        <span class="who">${chip(state.who, { me: true })}</span>
        <button class="link" data-action="signout">${esc(t.signOut)}</button>
      </div>
    </header>
    <section class="overview" aria-live="polite">
      <p class="countdown" id="countdown"></p>
      <div class="progress"><div class="bar"><span id="bar"></span></div><p id="summary"></p></div>
    </section>
    <nav class="views" role="tablist" aria-label="${fr() ? 'Vues' : 'Views'}">
      ${VIEWS.map(k => `<button role="tab" id="tab-${k}" data-view="${k}" aria-selected="${state.view === k}" tabindex="${state.view === k ? 0 : -1}">${esc(t[VIEW_LABEL[k]])}<span class="count" data-count="${k}"></span></button>`).join('')}
    </nav>
    <div class="toolbar" id="toolbar">
      <div class="toolbar-row">
        <input type="search" id="f-q" placeholder="${esc(t.search)}" value="${esc(state.f.q)}" aria-label="${esc(t.search)}">
        <button class="btn" data-action="new">+ ${esc(t.newTask)}</button>
      </div>
      <div class="scopes" role="group" aria-label="${esc(t.scopeLabel)}">
        ${SCOPES.map(s => `<button type="button" class="scope" data-scope="${s}" aria-pressed="${state.f.scope === s}">${esc(t.scopes[s])}<span data-scount="${s}"></span></button>`).join('')}
      </div>
      <details class="more-filters" ${extra ? 'open' : ''}><summary>${esc(t.moreFilters)}</summary>
        <div class="filter-grid">
          <select id="f-domain" aria-label="${esc(t.allDomains)}"><option value="">${esc(t.allDomains)}</option>
            ${domains.map(d => `<option value="${esc(d)}" ${state.f.domain === d ? 'selected' : ''}>${esc(domainLabel(d))}</option>`).join('')}</select>
          <select id="f-priority" aria-label="${esc(t.allPriorities)}"><option value="">${esc(t.allPriorities)}</option>
            ${PRIORITIES.map(p => `<option value="${p}" ${state.f.priority === p ? 'selected' : ''}>${esc(priorityLabel(p))}</option>`).join('')}</select>
          <select id="f-person" aria-label="${esc(t.allPeople)}"><option value="">${esc(t.allPeople)}</option>
            <option value="__none" ${state.f.person === '__none' ? 'selected' : ''}>${esc(t.unassigned)}</option>
            ${ownerOpts.map(([k, v]) => `<option value="${esc(k)}" ${state.f.person === k ? 'selected' : ''}>${esc(ownerLabel(v))}</option>`).join('')}</select>
          <button class="link" data-action="clear" id="clear" hidden>${esc(t.clearFilters)}</button>
        </div>
      </details>
    </div>
    <div id="person-banner"></div>
    <main id="main" tabindex="-1" role="tabpanel"></main>
    <footer class="foot"><span id="sync"></span><button class="btn" data-action="export">${esc(t.exportXlsx)}</button></footer>
    <div id="drawer-root"></div>
    <div id="dialog-root"></div>
    <div id="toast" role="status" aria-live="polite"></div>`;
}

/** Nombre de tâches visibles pour chaque portée (avec les autres filtres). */
function scopeCount(scope) {
  return state.a.plan.filter(id => matches(state.tasks.get(id), { scope })).length;
}

function renderOverview() {
  const t = T(), a = state.a, all = [...state.tasks.values()].filter(isActionable);
  const done = all.filter(x => x.status === 'Done').length;
  const decisions = all.filter(x => x.status === 'Decision needed').length;
  $('#summary').textContent = t.progress(done, all.length, a.late.size, decisions);
  $('#bar').style.width = `${all.length ? Math.max(1, done / all.length * 100) : 0}%`;
  const conf = a.milestones.get('conf');
  if (conf) $('#countdown').innerHTML = `<b>${esc(t.countdown(daysBetween(today(), conf)))}</b> ${esc(t.countdownLabel(fmtDate(conf)))}`;
  const counts = { tasks: all.length - done, decisions: all.filter(x => x.status === 'Decision needed').length };
  document.querySelectorAll('[data-count]').forEach(el => { el.textContent = counts[el.dataset.count] ?? ''; });
  document.querySelectorAll('[data-scount]').forEach(el => { el.textContent = scopeCount(el.dataset.scount); });
  document.querySelectorAll('[data-scope]').forEach(el => el.setAttribute('aria-pressed', String(state.f.scope === el.dataset.scope)));
  $('#clear').hidden = !filtersActive();
  $('#toolbar').hidden = !WITH_TOOLBAR.has(state.view);
  const ft = state.f.taker;
  $('#person-banner').innerHTML = ft && WITH_TOOLBAR.has(state.view)
    ? `<p class="person-banner">${chip(ft)} ${esc(t.showingPerson(ft))} <button class="link" data-action="clear-person">${esc(t.clearPerson)}</button></p>` : '';
}

/* ---------- Une tâche ---------- */

/** Échéance affichée : « avant le 15 janv. 2027 », « vers oct. 2026 », ou « pas de date ». */
function whenHtml(task) {
  const a = state.a, t = T(), d = a.deadline.get(task.id);
  if (!d) return `<span class="when soft">${esc(t.noDate)}</span>`;
  const late = a.late.has(task.id);
  const label = d.source === 'hint' ? t.about(fmtMonth(d.date)) : d.source === 'anchor' ? t.about(fmtDate(d.date)) : t.by(fmtDate(d.date));
  const why = d.source === 'needed' ? t.neededFor(d.via) : d.source === 'anchor' ? t.fromKeyDate : '';
  return `<span class="when${late ? ' late' : ''}">${late ? `<b>${esc(t.lateWord)}</b> ` : ''}${esc(label)}</span>${why ? `<span class="why">${esc(why)}</span>` : ''}`;
}

/** Pastille de couleur d'une personne ; un clic filtre sur ses tâches. */
export function chip(name, { me = false } = {}) {
  const [c, b] = colorFor(name);
  return `<button type="button" class="pchip${me ? ' me' : ''}" data-person="${esc(name)}" style="--c:${c};--b:${b}" title="${esc(T().showingPerson(name))}"><span class="pdot"></span>${esc(name)}</button>`;
}

/** Les deux gros boutons : « Je m'en occupe » et « Faite ». Utilisés dans la liste et dans la fiche. */
export function actionsHtml(task) {
  const t = T(), id = task.id, done = task.status === 'Done', mine = iTook(task);
  const [c, b] = colorFor(state.who);
  const take = done ? '' : `<button type="button" class="act act-take" data-take="${esc(id)}" aria-pressed="${mine}" style="--c:${c};--b:${b}"
      title="${esc(mine ? t.leaveTitle(id) : t.takeTitle(id))}"><span class="ico" aria-hidden="true"></span><span>${esc(mine ? t.taken : t.take)}</span></button>`;
  const doneLabel = done ? t.isDone : task.status === 'Decision needed' ? t.decide : t.markDoneShort;
  return `<div class="acts">${take}<button type="button" class="act act-done" data-done="${esc(id)}" aria-pressed="${done}"
      title="${esc(done ? t.markOpen(id) : t.markDone(id))}"><span class="ico" aria-hidden="true"></span><span>${esc(doneLabel)}</span></button></div>`;
}

function peopleHtml(task) {
  const t = T();
  if (task.status === 'Done') return task.doneBy || task.doneAt
    ? `<span class="who-line">${esc(t.doneShort)}${task.doneBy ? ` ${chip(task.doneBy)}` : ''}${task.doneAt ? ` <span class="soft">${esc(fmtDay(task.doneAt.slice(0, 10)))}</span>` : ''}</span>` : '';
  const takers = takersOf(task);
  return takers.length ? `<span class="who-line">${takers.map(n => chip(n, { me: same(n, state.who) })).join('')}</span>` : '';
}

export function row(task) {
  const t = T(), a = state.a, id = task.id, done = task.status === 'Done';
  const waiting = done ? [] : a.waitingOn.get(id) || [];
  const unl = done ? 0 : a.unlocks.get(id) || 0;
  const status = !done && task.status !== 'To do' ? `<span class="badge st-${slug(task.status)}">${esc(statusLabel(task.status))}</span>` : '';
  const cls = ['task', done ? 'is-done' : '', iTook(task) ? 'is-mine' : '', !done && a.late.has(id) ? 'is-late' : '', state.flash === id ? 'flash' : ''].filter(Boolean).join(' ');
  return `
    <li class="${cls}" id="task-${esc(id)}"${iTook(task) ? ` style="--mine:${colorFor(state.who)[0]}"` : ''}>
      <button class="task-open" type="button" data-open="${esc(id)}">
        <span class="task-top"><span class="tid">${esc(id)}</span>
          <span class="prio pr-${slug(task.priority)}">${esc(priorityLabel(task.priority))}</span>
          ${done ? '' : whenHtml(task)}
          ${!done && task.effort ? `<span class="soft">${esc(effortLabel(task.effort))}</span>` : ''}
          ${status}</span>
        <span class="task-title">${esc(titleOf(task))}</span>
        ${!done && deliverableOf(task) ? `<span class="task-deliv">${esc(deliverableOf(task))}</span>` : ''}
        ${waiting.length || unl ? `<span class="task-links">
          ${waiting.length ? `<span class="needs">${esc(t.needsFirst(waiting.join(', ')))}</span>` : ''}
          ${unl ? `<span class="unlocks">${esc(t.unlocks(unl))}</span>` : ''}</span>` : ''}
      </button>
      <div class="task-foot">${peopleHtml(task)}${actionsHtml(task)}</div>
    </li>`;
}
export const list = (tasks, opts = {}) => tasks.length
  ? `<ol class="tasks">${tasks.map(x => row(x)).join('')}</ol>`
  : `<p class="empty">${esc(opts.empty || T().nothingHere)}</p>`;

/* ---------- Toutes les tâches, dans l'ordre de travail ---------- */

function horizonTitle(h) {
  const t = T(), conf = state.a.milestones.get('conf');
  if (/^y\d{4}$/.test(h)) return conf && conf.startsWith(h.slice(1)) ? t.hzBeforeConf(h.slice(1)) : t.hzYear(h.slice(1));
  return t.hz[h] || h;
}
function horizonSub(h) {
  const t = T();
  if (h === 'month') return t.until(fmtDate(addDays(today(), 28)));
  if (h === 'quarter') return t.until(fmtDate(addDays(today(), 91)));
  return t.hzSub[h] || '';
}

function viewTasks() {
  const t = T(), a = state.a, f = state.f;
  const shown = a.plan.map(id => state.tasks.get(id)).filter(x => x && matches(x));
  const groups = new Map();
  for (const x of shown) { const h = a.horizon.get(x.id); groups.set(h, [...(groups.get(h) || []), x]); }
  // Tâches sur lesquelles on vient d'agir : elles restent à leur place (grisées si faites) jusqu'au prochain changement de vue.
  for (const [id, pos] of state.recent) {
    const x = state.tasks.get(id);
    if (!x || shown.includes(x) || !matches(x, { scope: 'all' })) continue;
    const g = groups.get(pos.h) || [];
    const i = pos.before ? g.findIndex(y => y.id === pos.before) : -1;
    i < 0 ? g.push(x) : g.splice(i, 0, x);
    groups.set(pos.h, g);
  }
  const keys = [...groups.keys()].sort((x, y) => horizonRank(x) - horizonRank(y));
  const doneList = f.scope === 'free' || f.scope === 'late' ? []
    : [...state.tasks.values()].filter(x => x.status === 'Done' && isActionable(x) && !state.recent.has(x.id) && matches(x))
      .sort((x, y) => String(y.doneAt || '').localeCompare(String(x.doneAt || '')));
  const empty = f.scope === 'mine' && !filtersActive(['scope']) ? t.mineEmpty : t.nothingHere;
  const body = keys.map(h => `
    <section class="horizon hz-${h}" aria-labelledby="hz-${h}">
      <h2 id="hz-${h}"><span>${esc(horizonTitle(h))}</span> <span class="n">${groups.get(h).length}</span>${horizonSub(h) ? `<small>${esc(horizonSub(h))}</small>` : ''}</h2>
      ${list(groups.get(h))}
    </section>`).join('');
  return `<p class="order-note">${esc(t.orderNote)}</p>
    ${body || `<p class="empty">${esc(empty)}</p>`}
    ${doneList.length ? `<details class="done-group"><summary>${esc(t.doneGroup(doneList.length))}</summary>${list(doneList)}</details>` : ''}`;
}

/* ---------- Frise des jalons ---------- */

function timeline() {
  const t = T(), ms = milestones().filter(m => m.date).slice().sort((x, y) => x.date.localeCompare(y.date));
  if (!ms.length) return '';
  const now = today();
  const start = [now, ms[0].date].sort()[0].slice(0, 7) + '-01';
  const lastDate = ms[ms.length - 1].date;
  const end = addDays(lastDate, 45);
  const span = daysBetween(start, end);
  const pos = d => Math.max(0, Math.min(100, daysBetween(start, d) / span * 100));
  // Jalons du même jour regroupés en un seul repère.
  const groups = [];
  for (const m of ms) { const g = groups.find(x => x.date === m.date); g ? g.items.push(m) : groups.push({ date: m.date, items: [m] }); }
  const years = [];
  for (let y = +start.slice(0, 4) + 1; y <= +end.slice(0, 4); y++) years.push(`${y}-01-01`);
  const nowPct = pos(now);
  return `
    <section class="card timeline-card" aria-labelledby="tl-title">
      <div class="card-head"><h2 id="tl-title">${esc(t.timelineTitle)}</h2></div>
      <div class="timeline" aria-hidden="true">
        <div class="tl-track"></div>
        <div class="tl-done" style="width:${nowPct}%"></div>
        ${years.map(y => `<span class="tl-year" style="left:${pos(y)}%">${y.slice(0, 4)}</span>`).join('')}
        <span class="tl-today" style="left:${nowPct}%"><span>${esc(t.today)}</span></span>
        ${groups.map((g, i) => {
          const tier = ['a2', 'b1', 'a1', 'b2'][i % 4], past = g.date < now, firm = g.items.every(m => m.firm);
          const isConf = g.items.some(m => m.key === 'conf');
          return `<div class="tl-ms tier-${tier}${past ? ' past' : ''}${isConf ? ' conf' : ''}${firm ? ' firm' : ''}" style="left:${pos(g.date)}%">
            <span class="tl-dot"></span><span class="tl-stem"></span>
            <span class="tl-label"><b>${esc(fmtDay(g.date))}</b> ${g.items.map(m => esc(milestoneLabel(m))).join(', ')}</span>
          </div>`;
        }).join('')}
      </div>
      <ol class="tl-list">
        ${groups.map(g => `<li class="${g.date < now ? 'past' : ''}"><time>${esc(fmtDate(g.date))}</time> ${g.items.map(m => esc(milestoneLabel(m))).join(', ')}</li>`).join('')}
      </ol>
      <p class="muted tl-note">${esc(t.timelineNote)}</p>
    </section>`;
}

/* ---------- Décisions ---------- */

function viewDecisions() {
  const t = T(), a = state.a, ag = agenda(a);
  const dec = a.plan.map(id => state.tasks.get(id)).filter(x => x && x.status === 'Decision needed');
  const now = dec.filter(x => a.ready.has(x.id));
  const later = dec.filter(x => !a.ready.has(x.id));
  const taken = [...state.tasks.values()].filter(x => x.status === 'Done' && x.decision)
    .sort((x, y) => String(y.doneAt || '').localeCompare(String(x.doneAt || '')));
  return `
    <section class="card meeting" aria-labelledby="h-meet"><div class="card-head"><h2 id="h-meet">${esc(t.meetingTitle)}</h2></div>
      <p>${esc(t.meetingIntro(ag.decisions.length, ag.overdue.length, ag.blocked.length))}</p>
      <div class="btn-row"><button class="btn primary" data-action="agenda-copy">${esc(t.copyAgenda)}</button>
        <button class="btn" data-action="agenda-show">${esc(t.showAgenda)}</button></div></section>
    <p class="order-note">${esc(t.decisionsIntro)}</p>
    <section class="horizon"><h2><span>${esc(t.decisionsReady)}</span> <span class="n">${now.length}</span></h2>${list(now)}</section>
    <section class="horizon"><h2><span>${esc(t.decisionsLater)}</span> <span class="n">${later.length}</span></h2>${list(later)}</section>
    ${taken.length ? `<section class="horizon"><h2><span>${esc(t.decisionsTaken)}</span> <span class="n">${taken.length}</span></h2>
      <ul class="decisions-taken">${taken.map(x => `<li><button class="link" data-open="${esc(x.id)}"><span class="tid">${esc(x.id)}</span> ${esc(titleOf(x))}</button><p>${esc(x.decision)}</p></li>`).join('')}</ul></section>` : ''}`;
}

/* ---------- Équipe et repères ---------- */

function viewTeam() {
  const t = T(), all = [...state.tasks.values()];
  const openOf = label => all.filter(x => x.status !== 'Done' && isActionable(x) && people(x.person).some(p => p.toLowerCase() === label.toLowerCase())).length;
  const team = state.meta.team?.value || { roles: [] };
  const linked = key => all.filter(x => x.anchor === key && !x.planningDate && !x.due).length;
  const owners = new Map();
  for (const x of all) if (x.status !== 'Done' && isActionable(x)) for (const p of people(x.person)) owners.set(p, (owners.get(p) || 0) + 1);
  const rules = all.filter(x => x.kind === 'rule'), rituals = all.filter(x => x.kind === 'recurring');
  const topics = new Map();
  for (const x of all) if (x.topic) topics.set(x.topic, [...(topics.get(x.topic) || []), x]);
  const mini = xs => `<ul class="mini">${xs.map(x => `<li><button class="link" data-open="${esc(x.id)}"><span class="tid">${esc(x.id)}</span> ${esc(titleOf(x))}</button>${x.status === 'Done' ? ` <span class="m-soft">(${esc(statusLabel('Done'))})</span>` : ''}</li>`).join('')}</ul>`;
  return `
    ${timeline()}
    <section class="card" aria-labelledby="t-people"><div class="card-head"><h2 id="t-people">${esc(t.peopleTitle)}</h2></div>
      <p class="intro">${esc(t.peopleIntro)}</p>
      <table class="grid-table"><thead><tr><th>${esc(t.colPerson)}</th><th class="num">${esc(t.colTaking)}</th><th class="num">${esc(t.colDone)}</th></tr></thead><tbody>
        ${everyone().map(n => `<tr><td>${chip(n, { me: same(n, state.who) })}</td>
          <td class="num">${all.filter(x => x.status !== 'Done' && takersOf(x).some(m => same(m, n))).length}</td>
          <td class="num">${all.filter(x => x.status === 'Done' && same(x.doneBy, n)).length}</td></tr>`).join('')}
      </tbody></table>
      ${team.loc ? `<p class="loc"><b>${esc(t.locLabel)}${fr() ? ' :' : ':'}</b> ${esc(team.loc)}</p>` : ''}
    </section>
    <section class="card" aria-labelledby="t-ms"><div class="card-head"><h2 id="t-ms">${esc(t.milestonesTitle)}</h2></div>
      <p class="intro">${esc(t.milestonesIntro)}</p>
      ${state.meta.milestones?.value?.note ? `<p class="muted">${esc(state.meta.milestones.value.note)}</p>` : ''}
      <form id="ms-form">
        <table class="grid-table"><thead><tr><th>${esc(t.msCol)}</th><th>${esc(t.dateCol)}</th><th>${esc(t.firmCol)}</th><th class="num">${esc(t.linkedCol)}</th></tr></thead><tbody>
          ${milestones().map((m, i) => `<tr><td>${esc(milestoneLabel(m))}</td>
            <td><input type="date" name="date-${i}" value="${esc(m.date)}" required aria-label="${esc(t.dateCol)} : ${esc(milestoneLabel(m))}"></td>
            <td><input type="checkbox" name="firm-${i}" ${m.firm ? 'checked' : ''} aria-label="${esc(t.firmCol)} : ${esc(milestoneLabel(m))}"></td>
            <td class="num">${linked(m.key)}</td></tr>`).join('')}
        </tbody></table>
        <button class="btn primary" type="submit">${esc(t.saveMilestones)}</button>
      </form>
    </section>
    <section class="card" aria-labelledby="t-own"><div class="card-head"><h2 id="t-own">${esc(t.ownersTitle)}</h2></div>
      <p class="intro">${esc(t.ownersIntro)}</p>
      <p class="chips">${[...owners].sort((x, y) => y[1] - x[1]).map(([p, n]) => `<button class="chip" data-owner="${esc(p.toLowerCase())}">${esc(ownerLabel(p))} <span>${n}</span></button>`).join('')}</p>
    </section>
    <section class="card" aria-labelledby="t-topics"><div class="card-head"><h2 id="t-topics">${esc(t.topicsTitle)}</h2></div>
      <p class="intro">${esc(t.topicsIntro)}</p>
      <div class="topics">${[...topics].sort((x, y) => x[0].localeCompare(y[0], 'fr')).map(([k, xs]) => `<div><h3>${esc(k)}</h3>${mini(xs)}</div>`).join('')}</div>
    </section>
    <section class="card" aria-labelledby="t-rules"><div class="card-head"><h2 id="t-rules">${esc(t.rulesTitle)}</h2></div>
      <p class="intro">${esc(t.rulesIntro)}</p>${mini(rules)}
      <h3>${esc(t.recurringTitle)}</h3>${mini(rituals)}
    </section>
    <section class="card" aria-labelledby="t-gl"><div class="card-head"><h2 id="t-gl">${esc(t.glossaryTitle)}</h2></div>
      <dl class="glossary">${GLOSSARY[state.lang].map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
    </section>`;
}

/* ---------- Journal ---------- */

export function changedFields(e) {
  if (!e.before || !e.after) return [];
  return Object.keys({ ...e.before, ...e.after }).filter(k => JSON.stringify(e.before[k] ?? '') !== JSON.stringify(e.after[k] ?? ''));
}
const FIELD_LABEL = k => ({ title: T().fTitleEn, titleFr: T().fTitleFr, deliverable: T().fDeliverable, status: T().fStatus, priority: T().fPriority,
  person: T().fPerson, domain: T().fDomain, planningDate: T().fPlanning, due: T().fDue, timing: T().fTiming, startWhen: T().fStart,
  dependsOn: T().fDeps, notes: T().fNotes, effort: T().fEffort, checklist: T().fChecklist, decision: T().fDecision, anchor: T().fAnchor,
  anchorOffset: T().fOffset, topic: T().fTopic, kind: T().fKind }[k] || k);

export function logItems(entries, { withTask = true } = {}) {
  const t = T();
  if (!entries.length) return `<p class="empty">${esc(t.logEmpty)}</p>`;
  return `<ul class="log">${entries.map(e => {
    const verb = { create: t.created, update: t.updated, delete: t.deleted }[e.action];
    const isMeta = String(e.task_id).startsWith('meta:');
    const data = e.after || e.before || {};
    const title = isMeta ? t.metaChange[e.task_id] || e.task_id : (fr() ? data.titleFr || data.title : data.title || data.titleFr) || '';
    const fields = changedFields(e);
    const statusChange = !isMeta && fields.includes('status') ? `${fr() ? ' :' : ':'} ${statusLabel(e.before.status)} → ${statusLabel(e.after.status)}` : '';
    const target = isMeta ? `<span>${esc(title)}</span>` : e.action === 'delete' || !withTask
      ? (withTask ? `<span class="tid">${esc(e.task_id)}</span> ${esc(title)}` : '')
      : `<button class="link" data-open="${esc(e.task_id)}"><span class="tid">${esc(e.task_id)}</span> ${esc(title)}</button>`;
    const canRestore = !isMeta && e.before && (e.action === 'update' || e.action === 'delete');
    return `<li><time>${esc(fmtDateTime(e.at))}</time>
      <span><b>${esc(e.who || t.someone)}</b> ${esc(verb)} ${target}${esc(statusChange)}
      ${fields.length && !statusChange && !isMeta ? `<small>${esc(t.changed)} ${fields.map(FIELD_LABEL).map(esc).join(', ')}</small>` : ''}
      ${canRestore ? `<button class="link small" data-restore="${esc(e.hid)}">${esc(t.restore)}</button>` : ''}</span></li>`;
  }).join('')}</ul>`;
}

function viewLog() {
  if (!state.log) {
    state.api.log(null, 80).then(entries => { state.log = entries; if (state.view === 'log') render(); }).catch(() => {});
    return `<p class="intro">${esc(T().logIntro)}</p><p class="empty">${esc(T().loading)}</p>`;
  }
  return `<p class="intro">${esc(T().logIntro)}</p>${logItems(state.log)}`;
}

/* ---------- Rendu principal ---------- */

export function render() {
  if (!state.a) return;
  renderOverview();
  document.querySelectorAll('[data-view][role=tab]').forEach(b => {
    const on = b.dataset.view === state.view;
    b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1;
  });
  $('#main').setAttribute('aria-labelledby', `tab-${state.view}`);
  const views = { tasks: viewTasks, decisions: viewDecisions, team: viewTeam, log: viewLog };
  $('#main').innerHTML = (views[state.view] || viewTasks)();
}

/* ---------- Ordre du jour et export ---------- */

export function agendaText() {
  const t = T(), a = state.a, ag = agenda(a);
  const line = x => `- ${x.id} ${titleOf(x)} (${people(x.person).map(ownerLabel).join(', ') || t.unassigned})` +
    (a.unlocks.get(x.id) ? ` — ${t.unlocks(a.unlocks.get(x.id))}` : '') +
    (a.target.get(x.id) ? ` — ${fmtDate(a.target.get(x.id).date)}` : '');
  const soon = milestones().filter(m => m.date >= today() && m.date <= addDays(today(), 120)).sort((x, y) => x.date.localeCompare(y.date));
  const L = fr()
    ? ['Ordre du jour proposé, réunion du comité local SCW 2028', '1. Décisions à prendre', '2. Dates cibles dépassées (nouvelle date ou blocage à expliquer)', '3. Tâches en attente ou bloquées', '4. Jalons des quatre prochains mois', 'Aucune.']
    : ['Proposed agenda, SCW 2028 local committee meeting', '1. Decisions to take', '2. Past target dates (new date or explain the blocker)', '3. Waiting or blocked tasks', '4. Milestones in the next four months', 'None.'];
  const sec = (title, xs) => `${title}\n${xs.length ? xs.map(line).join('\n') : L[5]}`;
  return [`${L[0]} (${fmtDate(today())})`, '', sec(L[1], ag.decisions), '', sec(L[2], ag.overdue), '', sec(L[3], ag.blocked), '',
    `${L[4]}\n${soon.length ? soon.map(m => `- ${fmtDate(m.date)} : ${milestoneLabel(m)}`).join('\n') : L[5]}`].join('\n');
}

/** Lignes du tableau Excel (une par tâche, dans l'ordre de travail). */
export function exportRows() {
  const a = state.a, E = !fr();
  const head = E
    ? ['Order', 'Number', 'Task', 'Status', 'Who is on it', 'Done by', 'Done on', 'Do by', 'Target date', 'Date type', 'Result we expect', 'Effort', 'Priority', 'Role', 'Area', 'Needs first', 'Topic', 'Kind', 'What we decided', 'Notes', 'Title (French)']
    : ['Ordre', 'Numéro', 'Tâche', 'Statut', 'Qui s’en occupe', 'Faite par', 'Faite le', 'À faire avant', 'Date cible', 'Type de date', 'Résultat attendu', 'Charge', 'Priorité', 'Rôle', 'Domaine', 'Prérequis', 'Sujet', 'Nature', 'Décision', 'Notes', 'Titre (anglais)'];
  const src = { due: E ? 'firm deadline' : 'échéance ferme', planning: E ? 'internal target' : 'cible interne', anchor: E ? 'from a key date' : 'calculée d’un jalon' };
  const pos = new Map(a.plan.map((id, i) => [id, i + 1]));
  const rows = a.order.map(id => state.tasks.get(id)).map(x => [pos.get(x.id) ?? '', x.id, titleOf(x), statusLabel(x.status), takersOf(x).join(', '), x.doneBy || '',
    x.doneAt ? x.doneAt.slice(0, 10) : '', x.status === 'Done' ? '' : a.deadline.get(x.id)?.date || '', a.target.get(x.id)?.date || '', a.target.get(x.id) ? src[a.target.get(x.id).source] : (x.timing || ''),
    deliverableOf(x), effortLabel(x.effort), priorityLabel(x.priority), people(x.person).map(ownerLabel).join(', '), domainLabel(x.domain),
    x.dependsOn, x.topic, x.kind || 'task', x.decision, x.notes, E ? x.titleFr : x.title]);
  return { head, rows, doneCol: 3, doneLabel: statusLabel('Done') };
}

export function csv() {
  const a = state.a;
  const head = ['id', 'titre', 'title', 'statut', 'priorite', 'responsables', 'domaine', 'date_cible', 'source_date', 'resultat_attendu', 'charge', 'prerequis', 'sujet', 'nature', 'decision', 'notes'];
  const rows = a.order.map(id => state.tasks.get(id)).map(x => [x.id, x.titleFr, x.title, x.status, x.priority, x.person, x.domain,
    a.target.get(x.id)?.date || '', a.target.get(x.id)?.source || x.timing || '', x.deliverable, x.effort, x.dependsOn, x.topic, x.kind || 'task', x.decision, x.notes]);
  return '﻿' + [head, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n');
}
