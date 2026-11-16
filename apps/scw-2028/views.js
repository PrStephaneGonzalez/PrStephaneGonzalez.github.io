// Rendu des vues (chaînes HTML). Les interactions sont gérées dans app.js par délégation (attributs data-*).
import { phaseOf, PHASES, STATUSES, PRIORITIES, people, isActionable, agenda, daysBetween, csvCell, addDays } from './model.js?v=20261116e';
import { GLOSSARY } from './i18n.js?v=20261116e';
import {
  $, esc, state, T, fr, statusLabel, priorityLabel, effortLabel, domainLabel, ownerLabel, titleOf, deliverableOf, slug,
  fmtDate, fmtDay, fmtMonth, fmtDateTime, today, milestones, milestoneLabel, myLabels, isMine,
  inOrder, matches, filtersActive, takersOf, iTook, colorFor, same, everyone,
} from './core.js?v=20261116e';

const VIEWS = ['home', 'mine', 'next', 'road', 'decisions', 'team', 'log'];
const VIEW_LABEL = { home: 'viewHome', mine: 'viewMine', next: 'viewNext', road: 'viewRoad', decisions: 'viewDecisions', team: 'viewTeam', log: 'viewLog' };
const WITH_TOOLBAR = new Set(['mine', 'next', 'road', 'decisions']);

/* ---------- Cadre ---------- */

export function renderShell() {
  const t = T();
  const all = [...state.tasks.values()];
  const domains = [...new Set(all.map(x => x.domain))].sort((a, b) => domainLabel(a).localeCompare(domainLabel(b), state.lang));
  const owners = new Map();
  for (const x of all) for (const p of people(x.person)) if (!owners.has(p.toLowerCase())) owners.set(p.toLowerCase(), p);
  const ownerOpts = [...owners].sort((a, b) => ownerLabel(a[1]).localeCompare(ownerLabel(b[1]), state.lang));
  $('#app').innerHTML = `
    <a class="skip" href="#main">${fr() ? 'Aller au contenu' : 'Skip to content'}</a>
    <header class="top">
      <div class="brand"><span class="brand-event">SCW 2028</span><span class="brand-room">${esc(t.appName)}</span></div>
      <div class="countdown" id="countdown"></div>
      <div class="top-actions">
        <button class="btn primary" data-action="new">${esc(t.newTask)}</button>
        <button class="link" data-action="lang" lang="${fr() ? 'en' : 'fr'}">${fr() ? 'English' : 'Français'}</button>
        <span class="who">${esc(state.who)}</span>
        <button class="link" data-action="signout">${esc(t.signOut)}</button>
      </div>
    </header>
    <section class="overview" aria-live="polite"><p id="summary"></p><div class="rail" id="rail" role="img"></div></section>
    <nav class="views" role="tablist" aria-label="${fr() ? 'Vues' : 'Views'}">
      ${VIEWS.map(k => `<button role="tab" id="tab-${k}" data-view="${k}" aria-selected="${state.view === k}" tabindex="${state.view === k ? 0 : -1}">${esc(t[VIEW_LABEL[k]])}<span class="count" data-count="${k}"></span></button>`).join('')}
    </nav>
    <div class="toolbar" id="toolbar">
      <input type="search" id="f-q" placeholder="${esc(t.search)}" value="${esc(state.f.q)}" aria-label="${esc(t.search)}">
      <select id="f-domain" aria-label="${esc(t.allDomains)}"><option value="">${esc(t.allDomains)}</option>
        ${domains.map(d => `<option value="${esc(d)}" ${state.f.domain === d ? 'selected' : ''}>${esc(domainLabel(d))}</option>`).join('')}</select>
      <select id="f-person" aria-label="${esc(t.allPeople)}"><option value="">${esc(t.allPeople)}</option>
        <option value="__none" ${state.f.person === '__none' ? 'selected' : ''}>${esc(t.unassigned)}</option>
        ${ownerOpts.map(([k, v]) => `<option value="${esc(k)}" ${state.f.person === k ? 'selected' : ''}>${esc(ownerLabel(v))}</option>`).join('')}</select>
      <select id="f-taker" aria-label="${esc(t.whoOnIt)}"><option value="">${esc(t.whoOnIt)}${fr() ? ' :' : ':'} ${esc(t.anyone)}</option>
        <option value="__none" ${state.f.taker === '__none' ? 'selected' : ''}>${esc(t.nobodyYet)}</option>
        ${everyone().map(n => `<option value="${esc(n)}" ${same(state.f.taker, n) ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
      <select id="f-priority" aria-label="${esc(t.allPriorities)}"><option value="">${esc(t.allPriorities)}</option>
        ${PRIORITIES.map(p => `<option value="${p}" ${state.f.priority === p ? 'selected' : ''}>${esc(priorityLabel(p))}</option>`).join('')}</select>
      <label class="check"><input type="checkbox" id="f-done" ${state.f.showDone ? 'checked' : ''}> ${esc(t.showDone)}</label>
      <button class="link" data-action="clear" id="clear" hidden>${esc(t.clearFilters)}</button>
    </div>
    <div id="person-banner"></div>
    <main id="main" tabindex="-1" role="tabpanel"></main>
    <footer class="foot"><span id="sync"></span><button class="btn" data-action="export">${esc(t.exportXlsx)}</button></footer>
    <div id="drawer-root"></div>
    <div id="dialog-root"></div>
    <div id="toast" role="status" aria-live="polite"></div>`;
}

function renderOverview() {
  const t = T(), a = state.a, all = [...state.tasks.values()].filter(isActionable);
  const count = s => all.filter(x => x.status === s).length;
  const decisions = count('Decision needed');
  $('#summary').textContent = t.summary(count('Done'), all.length, a.ready.size, a.overdue.size, decisions);
  $('#rail').innerHTML = STATUSES.map(s => { const n = count(s); return n ? `<span class="seg st-${slug(s)}" style="flex-grow:${n}" title="${esc(statusLabel(s))} : ${n}"></span>` : ''; }).join('');
  $('#rail').setAttribute('aria-label', STATUSES.map(s => `${statusLabel(s)} ${count(s)}`).join(', '));
  const conf = a.milestones.get('conf');
  if (conf) $('#countdown').innerHTML = `<b>${esc(t.countdown(daysBetween(today(), conf)))}</b><span>${esc(t.countdownLabel(fmtDate(conf)))}</span>`;
  const mine = all.filter(x => x.status !== 'Done' && isMine(x)).length;
  const counts = { mine: mine || '', next: a.ready.size, decisions, road: all.filter(x => x.status !== 'Done').length };
  document.querySelectorAll('[data-count]').forEach(el => { el.textContent = counts[el.dataset.count] ?? ''; });
  $('#clear').hidden = !filtersActive();
  $('#toolbar').hidden = !WITH_TOOLBAR.has(state.view);
  const ft = state.f.taker;
  $('#person-banner').innerHTML = ft && WITH_TOOLBAR.has(state.view)
    ? `<p class="person-banner">${ft === '__none' ? esc(t.showingNobody) : `${chip(ft)} ${esc(t.showingPerson(ft))}`} <button class="link" data-action="clear-person">${esc(t.clearPerson)}</button></p>` : '';
}

/* ---------- Lignes de tâche ---------- */

function whenHtml(task) {
  const a = state.a, t = T(), tgt = a.target.get(task.id);
  if (tgt) {
    const late = a.overdue.has(task.id);
    let title = '';
    if (tgt.source === 'anchor') {
      const m = milestones().find(x => x.key === task.anchor);
      const off = Number(task.anchorOffset) || 0;
      title = m ? `${off ? `${Math.abs(off)} ${fr() ? 'jours' : 'days'} ${off < 0 ? (fr() ? 'avant' : 'before') : (fr() ? 'après' : 'after')} : ` : ''}${milestoneLabel(m)}` : '';
    }
    const label = (tgt.source === 'anchor' ? t.approx + ' ' : '') + fmtDate(tgt.date);
    return `<span class="m-date${late ? ' m-late' : ''}" ${title ? `title="${esc(title)}"` : ''}>${esc(label)}${late ? ` (${esc(t.targetPassed)})` : ''}</span>`;
  }
  const txt = task.timing || task.startWhen;
  return txt ? `<span class="m-date m-soft">${esc(txt)}</span>` : '';
}

function ownersHtml(task) {
  const ps = people(task.person);
  if (!ps.length) return '';
  const mine = myLabels().map(x => x.toLowerCase());
  const fmt = p => `<span class="${mine.includes(p.toLowerCase()) ? 'is-me' : ''}">${esc(ownerLabel(p))}</span>`;
  return `<span class="m-person"><span class="m-soft">${esc(T().role)}</span> ${ps.map(fmt).join(', ')}</span>`;
}

/** Pastille de couleur d'une personne ; un clic filtre sur ses tâches. */
export function chip(name, { me = false } = {}) {
  const [c, b] = colorFor(name);
  return `<button type="button" class="pchip${me ? ' me' : ''}" data-person="${esc(name)}" style="--c:${c};--b:${b}" title="${esc(T().showingPerson(name))}"><span class="pdot"></span>${esc(name)}</button>`;
}

function peopleHtml(task) {
  const t = T(), done = task.status === 'Done', takers = takersOf(task);
  if (done) return task.doneBy ? `<span class="m-done">${esc(t.doneShort)}${fr() ? ' :' : ':'} ${chip(task.doneBy)}${task.doneAt ? ` <span class="m-soft">${esc(fmtDay(task.doneAt.slice(0, 10)))}</span>` : ''}</span>` : '';
  const mine = iTook(task);
  return `${takers.map(n => chip(n, { me: same(n, state.who) })).join('')}
    <button type="button" class="take${mine ? ' leave' : ''}" data-take="${esc(task.id)}" aria-pressed="${mine}"
      title="${esc(mine ? t.leaveTitle(task.id) : t.takeTitle(task.id))}">${esc(mine ? t.leave : t.take)}</button>`;
}

export function row(task, { rank = false, compact = false } = {}) {
  const t = T(), a = state.a, id = task.id;
  const done = task.status === 'Done';
  const waiting = a.waitingOn.get(id) || [];
  const node = done ? 'done' : a.ready.has(id) ? 'ready' : 'waiting';
  const late = a.overdue.has(id);
  const unl = a.unlocks.get(id) || 0;
  return `
    <li class="task node-${node} st-${slug(task.status)}${late ? ' is-late' : ''}">
      <button class="node" type="button" data-done="${esc(id)}" role="checkbox" aria-checked="${done}"
        aria-label="${esc(done ? t.markOpen(id) : t.markDone(id))}" title="${esc(done ? t.markOpen(id) : t.markDone(id))}"></button>
      ${rank ? `<span class="rank">${a.rank.get(id)}</span>` : ''}
      <div class="task-main">
      <button class="task-btn" type="button" data-open="${esc(id)}">
        <span class="task-title"><span class="tid">${esc(id)}</span> ${esc(titleOf(task))}</span>
        ${!compact && deliverableOf(task) && !done ? `<span class="task-deliv">${esc(deliverableOf(task))}</span>` : ''}
        <span class="task-meta">
          ${ownersHtml(task)}
          ${whenHtml(task)}
          ${!compact && task.effort ? `<span class="m-soft">${esc(effortLabel(task.effort))}</span>` : ''}
          ${!done && waiting.length ? `<span class="m-wait">${esc(t.waitsFor)} ${waiting.map(esc).join(', ')}</span>` : ''}
          ${!done && unl ? `<span class="m-unlock">${esc(t.unlocks(unl))}</span>` : ''}
          ${a.inCycle.has(id) ? `<span class="m-late">${esc(t.loop)}</span>` : ''}
          ${!compact && task.topic ? `<span class="m-topic">${esc(task.topic)}</span>` : ''}
        </span>
      </button>
      <div class="task-people">${peopleHtml(task)}</div>
      </div>
      <span class="task-side">
        <select class="quick-status st-${slug(task.status)}" data-status="${esc(id)}" aria-label="${esc(t.quickStatus(id))}">
          ${STATUSES.map(s => `<option value="${s}" ${s === task.status ? 'selected' : ''}>${esc(statusLabel(s))}</option>`).join('')}
        </select>
        <span class="prio pr-${slug(task.priority)}">${esc(priorityLabel(task.priority))}</span>
      </span>
    </li>`;
}
export const list = (tasks, opts = {}) => tasks.length
  ? `<ol class="route${opts.compact ? ' compact' : ''}">${tasks.map(x => row(x, opts)).join('')}</ol>`
  : `<p class="empty">${esc(opts.empty || T().nothingHere)}</p>`;

/* ---------- Accueil ---------- */

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
            <span class="tl-label"><b>${esc(fmtDay(g.date))}</b> ${g.items.map(m => esc(milestoneLabel(m))).join(' · ')}</span>
          </div>`;
        }).join('')}
      </div>
      <ol class="tl-list">
        ${groups.map(g => `<li class="${g.date < now ? 'past' : ''}"><time>${esc(fmtDate(g.date))}</time> ${g.items.map(m => esc(milestoneLabel(m))).join(' · ')}</li>`).join('')}
      </ol>
      <p class="muted tl-note">${esc(t.timelineNote)} <button class="link small" data-view="team">${esc(t.viewTeam)}</button></p>
    </section>`;
}

function viewHome() {
  const t = T(), a = state.a;
  const open = [...state.tasks.values()].filter(x => x.status !== 'Done' && isActionable(x));
  const critical = open.filter(x => a.unlocks.get(x.id) > 0)
    .sort((x, y) => a.unlocks.get(y.id) - a.unlocks.get(x.id) || a.rank.get(x.id) - a.rank.get(y.id)).slice(0, 6);
  const late = open.filter(x => a.overdue.has(x.id)).sort((x, y) => a.rank.get(x.id) - a.rank.get(y.id));
  const ag = agenda(a);
  const mine = open.filter(iTook).sort((x, y) => (a.ready.has(y.id) - a.ready.has(x.id)) || a.rank.get(x.id) - a.rank.get(y.id));
  const free = open.filter(x => a.ready.has(x.id) && !takersOf(x).length && (x.priority === 'Urgent' || x.priority === 'High'))
    .sort((x, y) => a.unlocks.get(y.id) - a.unlocks.get(x.id) || a.rank.get(x.id) - a.rank.get(y.id));
  return `
    ${timeline()}
    <div class="home-grid">
      <div class="home-main">
        <section class="card" aria-labelledby="h-crit"><div class="card-head"><h2 id="h-crit">${esc(t.criticalTitle)}</h2></div>
          <p class="intro">${esc(t.criticalIntro)}</p>${list(critical, { compact: true })}</section>
        <section class="card" aria-labelledby="h-late"><div class="card-head"><h2 id="h-late">${esc(t.lateTitle)} <span class="n">${late.length}</span></h2></div>
          ${list(late.slice(0, 6), { compact: true, empty: t.lateNone })}
          ${late.length > 6 ? `<details class="more"><summary>${esc(t.showMore(late.length - 6))}</summary>${list(late.slice(6), { compact: true })}</details>` : ''}</section>
      </div>
      <div class="home-side">
        <section class="card meeting" aria-labelledby="h-meet"><div class="card-head"><h2 id="h-meet">${esc(t.meetingTitle)}</h2></div>
          <p>${esc(t.meetingIntro(ag.decisions.length, ag.overdue.length, ag.blocked.length))}</p>
          <div class="btn-row"><button class="btn primary" data-action="agenda-copy">${esc(t.copyAgenda)}</button>
            <button class="btn" data-action="agenda-show">${esc(t.showAgenda)}</button></div></section>
        <section class="card" aria-labelledby="h-mine"><div class="card-head"><h2 id="h-mine">${esc(t.mineTitle)} <span class="n">${mine.length}</span></h2>
          <button class="link" data-view="mine">${esc(t.seeAll)}</button></div>
          ${list(mine.slice(0, 6), { compact: true, empty: t.mineEmpty })}
        </section>
        <section class="card" aria-labelledby="h-free"><div class="card-head"><h2 id="h-free">${esc(t.freeTitle)} <span class="n">${free.length}</span></h2></div>
          <p class="intro">${esc(t.freeIntro)}</p>
          ${list(free.slice(0, 8), { compact: true, empty: t.freeNone })}
        </section>
      </div>
    </div>`;
}

/* ---------- Mes tâches, À faire, Feuille de route, Décisions ---------- */

function viewMine() {
  const t = T(), a = state.a;
  const mine = inOrder().filter(isMine);
  if (!mine.length) return `<p class="intro">${esc(t.mineNoRole)}</p><button class="btn" data-view="next">${esc(t.viewNext)}</button>`;
  const dec = mine.filter(x => x.status === 'Decision needed');
  const ready = mine.filter(x => x.status !== 'Decision needed' && x.status !== 'Done' && a.ready.has(x.id));
  const waiting = mine.filter(x => x.status !== 'Decision needed' && x.status !== 'Done' && !a.ready.has(x.id));
  const done = mine.filter(x => x.status === 'Done');
  const sec = (title, xs) => xs.length ? `<h2 class="phase">${esc(title)} <span class="n">${xs.length}</span></h2>${list(xs)}` : '';
  return `<p class="intro">${esc(t.mineIntro())}</p>
    ${sec(t.mineReady, ready)}${sec(t.mineDecisions, dec)}${sec(t.mineWaiting, waiting)}${sec(t.mineDone, done)}
    ${mine.length ? '' : `<p class="empty">${esc(t.nothingHere)}</p>`}`;
}

function viewNext() {
  const t = T(), a = state.a, pr = p => PRIORITIES.indexOf(p);
  const visible = inOrder();
  const ready = visible.filter(x => a.ready.has(x.id)).sort((x, y) =>
    (a.overdue.has(y.id) - a.overdue.has(x.id)) || (a.unlocks.get(y.id) - a.unlocks.get(x.id)) || (pr(x.priority) - pr(y.priority)) || (a.rank.get(x.id) - a.rank.get(y.id)));
  const almost = visible.filter(x => x.status !== 'Done' && !a.ready.has(x.id) && (a.waitingOn.get(x.id) || []).length === 1);
  return `<p class="intro">${esc(t.nextIntro)}</p>
    <h2 class="phase">${esc(t.readyTitle)} <span class="n">${ready.length}</span></h2>${list(ready)}
    <h2 class="phase">${esc(t.almostTitle)} <span class="n">${almost.length}</span></h2><p class="intro">${esc(t.almostIntro)}</p>${list(almost)}`;
}

function milestonesByPhase() {
  const out = new Map();
  for (const m of milestones()) { if (!m.date) continue; const p = phaseOf(m.date.slice(0, 7), state.a.conference); out.set(p, [...(out.get(p) || []), m]); }
  return out;
}

function viewRoad() {
  const t = T(), a = state.a, groups = new Map(PHASES.map(p => [p, []])), mph = milestonesByPhase();
  for (const x of inOrder()) groups.get(phaseOf(a.slot.get(x.id), a.conference)).push(x);
  const body = [...groups].filter(([, xs]) => xs.length).map(([p, xs]) => {
    const ms = (mph.get(p) || []).slice().sort((x, y) => x.date.localeCompare(y.date));
    return `<h2 class="phase">${esc(t.phases[p])} <span class="n">${xs.length}</span></h2>
      ${ms.length ? `<p class="phase-ms"><span>${esc(t.phaseMilestones)}</span> ${ms.map(m => `<span class="ms-chip"><b>${esc(fmtDay(m.date))}</b> ${esc(milestoneLabel(m))}</span>`).join(' ')}</p>` : ''}
      ${list(xs, { rank: true })}`;
  }).join('');
  return `<p class="intro">${esc(t.roadIntro)}</p>${body || `<p class="empty">${esc(t.nothingHere)}</p>`}`;
}

function viewDecisions() {
  const t = T(), a = state.a;
  const dec = inOrder().filter(x => x.status === 'Decision needed');
  const now = dec.filter(x => a.ready.has(x.id)).sort((x, y) => a.unlocks.get(y.id) - a.unlocks.get(x.id) || a.rank.get(x.id) - a.rank.get(y.id));
  const later = dec.filter(x => !a.ready.has(x.id));
  const taken = state.a.order.map(id => state.tasks.get(id)).filter(x => x && x.status === 'Done' && x.decision);
  return `<p class="intro">${esc(t.decisionsIntro)}</p>
    <h2 class="phase">${esc(t.decisionsReady)} <span class="n">${now.length}</span></h2>${list(now)}
    <h2 class="phase">${esc(t.decisionsLater)} <span class="n">${later.length}</span></h2>${list(later)}
    ${taken.length ? `<h2 class="phase">${esc(t.decisionsTaken)} <span class="n">${taken.length}</span></h2>
      <ul class="decisions-taken">${taken.map(x => `<li><button class="link" data-open="${esc(x.id)}"><span class="tid">${esc(x.id)}</span> ${esc(titleOf(x))}</button><p>${esc(x.decision)}</p></li>`).join('')}</ul>` : ''}`;
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
    <p class="intro">${esc(t.teamIntro)}</p>
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
  const views = { home: viewHome, mine: viewMine, next: viewNext, road: viewRoad, decisions: viewDecisions, team: viewTeam, log: viewLog };
  $('#main').innerHTML = (views[state.view] || viewHome)();
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
    ? ['Number', 'Task', 'Status', 'Who is on it', 'Done by', 'Done on', 'Target date', 'Date type', 'Result we expect', 'Effort', 'Priority', 'Role', 'Area', 'Needs first', 'Topic', 'Kind', 'What we decided', 'Notes', 'Title (French)']
    : ['Numéro', 'Tâche', 'Statut', 'Qui s’en occupe', 'Faite par', 'Faite le', 'Date cible', 'Type de date', 'Résultat attendu', 'Charge', 'Priorité', 'Rôle', 'Domaine', 'Prérequis', 'Sujet', 'Nature', 'Décision', 'Notes', 'Titre (anglais)'];
  const src = { due: E ? 'firm deadline' : 'échéance ferme', planning: E ? 'internal target' : 'cible interne', anchor: E ? 'from a key date' : 'calculée d’un jalon' };
  const rows = a.order.map(id => state.tasks.get(id)).map(x => [x.id, titleOf(x), statusLabel(x.status), takersOf(x).join(', '), x.doneBy || '',
    x.doneAt ? x.doneAt.slice(0, 10) : '', a.target.get(x.id)?.date || '', a.target.get(x.id) ? src[a.target.get(x.id).source] : (x.timing || ''),
    deliverableOf(x), effortLabel(x.effort), priorityLabel(x.priority), people(x.person).map(ownerLabel).join(', '), domainLabel(x.domain),
    x.dependsOn, x.topic, x.kind || 'task', x.decision, x.notes, E ? x.titleFr : x.title]);
  return { head, rows, doneCol: 2, doneLabel: statusLabel('Done') };
}

export function csv() {
  const a = state.a;
  const head = ['id', 'titre', 'title', 'statut', 'priorite', 'responsables', 'domaine', 'date_cible', 'source_date', 'resultat_attendu', 'charge', 'prerequis', 'sujet', 'nature', 'decision', 'notes'];
  const rows = a.order.map(id => state.tasks.get(id)).map(x => [x.id, x.titleFr, x.title, x.status, x.priority, x.person, x.domain,
    a.target.get(x.id)?.date || '', a.target.get(x.id)?.source || x.timing || '', x.deliverable, x.effort, x.dependsOn, x.topic, x.kind || 'task', x.decision, x.notes]);
  return '﻿' + [head, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n');
}
