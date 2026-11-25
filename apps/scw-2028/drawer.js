// Fiche d'une tâche (panneau latéral) : lecture, modification, sous-étapes, historique.
import { STATUSES, PRIORITIES, EFFORTS, KINDS, parseIds, wouldCycle, prefixFor, nextId, targetDate, milestoneDates, TAGS, tagOf, tagForDomain } from './model.js?v=20261125a';
import {
  $, esc, state, T, fr, statusLabel, priorityLabel, effortLabel, kindLabel, domainLabel, titleOf, slug,
  fmtDate, fmtDateTime, fmtDay, milestones, milestoneLabel, recompute, toast, takersOf, same, tagLabel } from './core.js?v=20261125a';
import { logItems, chip, actionsHtml } from './views.js?v=20261125a';

export const hooks = { refresh: async () => {}, render: () => {}, signOut: () => {} };

function blankTask() {
  const all = [...state.tasks.values()];
  const domain = state.f.domain || 'General';
  return { id: nextId(all, prefixFor(all, domain)), title: '', titleFr: '', domain, tag: state.f.tag || tagForDomain(domain), due: '', priority: 'Medium', status: 'To do',
    person: '', notes: '', planningDate: '', timing: '', dependsOn: '', startWhen: '', provenance: '', sourceRecord: '',
    deliverable: '', effort: '', kind: 'task', topic: '', anchor: '', anchorOffset: 0, checklist: [], decision: '' };
}

const depList = ids => ids.length
  ? `<ul class="deps">${ids.map(id => { const x = state.tasks.get(id); return x ? `<li><button type="button" class="link dep st-${slug(x.status)}" data-open="${esc(id)}"><span class="dot"></span><span class="tid">${esc(id)}</span> ${esc(titleOf(x))}<small>${esc(statusLabel(x.status))}</small></button></li>` : ''; }).join('')}</ul>`
  : `<p class="muted">${esc(T().none)}</p>`;

function sourceBlock(task) {
  if (!task.provenance && !task.sourceRecord) return '';
  let rows = '';
  try { rows = Object.entries(JSON.parse(task.sourceRecord)).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join(''); }
  catch { rows = task.sourceRecord ? `<dd>${esc(task.sourceRecord)}</dd>` : ''; }
  return `<details class="source"><summary>${esc(T().source)}</summary><p>${esc(task.provenance)}</p><dl>${rows}</dl></details>`;
}

/** Qui s'en occupe, et les deux gros boutons (enregistrés tout de suite, indépendamment du formulaire). */
function peopleBlock(task) {
  const t = T();
  const who = task.status === 'Done'
    ? `<b>${esc(t.doneShort)}</b> ${task.doneBy ? chip(task.doneBy) : ''} ${task.doneAt ? esc(fmtDate(task.doneAt.slice(0, 10))) : ''}`
    : `<b>${esc(t.fTakers)}${fr() ? ' :' : ':'}</b> ${takersOf(task).map(n => chip(n, { me: same(n, state.who) })).join('') || `<span class="soft">${esc(t.nobodyOnIt)}</span>`}`;
  return `<div class="drawer-people"><p>${who}</p>${actionsHtml(task)}</div>`;
}

function checklistHtml(steps) {
  const t = T();
  return `<ul class="steps">${steps.map((s, i) => `
      <li><label class="check"><input type="checkbox" data-step-toggle="${i}" ${s.done ? 'checked' : ''}> <span class="${s.done ? 'step-done' : ''}">${esc(s.text)}</span></label>
      <button type="button" class="link small" data-step-remove="${i}" aria-label="${esc(t.removeStep)} : ${esc(s.text)}">${esc(t.removeStep)}</button></li>`).join('')}</ul>
    <div class="step-add"><input id="step-new" placeholder="${esc(t.stepPlaceholder)}" maxlength="300" aria-label="${esc(t.stepPlaceholder)}">
      <button type="button" class="btn" data-action="step-add">${esc(t.addStep)}</button></div>`;
}

/** Lit le formulaire dans le brouillon (pour ne rien perdre lors d'un nouveau rendu). */
function readForm() {
  const form = $('#task-form');
  if (!form || !state.draft) return;
  const fd = Object.fromEntries(new FormData(form));
  for (const k of ['titleFr', 'title', 'deliverable', 'deliverableFr', 'status', 'priority', 'effort', 'kind', 'person', 'domain', 'tag', 'topic', 'planningDate', 'due',
    'anchor', 'timing', 'startWhen', 'dependsOn', 'decision', 'notes']) if (k in fd) state.draft[k] = fd[k];
  if ('anchorOffset' in fd) state.draft.anchorOffset = Number(fd.anchorOffset) || 0;
}

export function renderDrawer(error = '') {
  const root = $('#drawer-root');
  if (!root) return;
  if (state.open == null) { root.innerHTML = ''; document.body.classList.remove('drawer-open'); return; }
  const t = T(), a = state.a, isNew = state.open === '';
  const stored = isNew ? null : state.tasks.get(state.open);
  if (!isNew && !stored) { state.open = null; state.draft = null; return renderDrawer(); }
  if (!state.draft) state.draft = isNew ? blankTask() : { ...stored, checklist: (stored.checklist || []).map(s => ({ ...s })) };
  const d = state.draft;
  const all = [...state.tasks.values()];
  const domains = [...new Set(all.map(x => x.domain).concat(['General']))].sort((x, y) => domainLabel(x).localeCompare(domainLabel(y), state.lang));
  const topics = [...new Set(all.map(x => x.topic).filter(Boolean))].sort();
  const opt = (vals, cur, label) => vals.map(v => `<option value="${esc(v)}" ${v === cur ? 'selected' : ''}>${esc(label(v))}</option>`).join('');
  const tgt = targetDate(d, milestoneDates(milestones()));
  const isDecision = d.status === 'Decision needed' || d.decision;
  document.body.classList.add('drawer-open');
  root.innerHTML = `
    <div class="scrim" data-action="close"></div>
    <aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="d-title">
      <header class="drawer-head">
        <div><span class="tid big" id="d-id">${esc(d.id)}</span>
          ${d.kind && d.kind !== 'task' ? `<span class="chip-static">${esc(kindLabel(d.kind))}</span>` : ''}
          ${d.topic ? `<span class="chip-static">${esc(d.topic)}</span>` : ''}
          ${isNew ? '' : `<span class="muted">${esc(t.position(a.rank.get(d.id), a.order.length))}</span>`}</div>
        <button type="button" class="link" data-action="close">${esc(t.close)}</button>
      </header>
      <form id="task-form" novalidate>
        <label class="f-title">${esc(fr() ? t.fTitleFr : t.fTitleEn)}
          <textarea name="${fr() ? 'titleFr' : 'title'}" rows="2" maxlength="300" id="d-title" required>${esc(fr() ? d.titleFr : d.title)}</textarea></label>
        ${isNew ? '' : peopleBlock(stored)}
        <label class="f-deliv">${esc(t.fDeliverable)}<small>${esc(t.fDeliverableHelp)}</small>
          <textarea name="${fr() ? 'deliverableFr' : 'deliverable'}" rows="2" maxlength="500">${esc(fr() ? d.deliverableFr : d.deliverable)}</textarea></label>
        <div class="grid">
          <label>${esc(t.fStatus)}<select name="status">${opt(STATUSES, d.status, statusLabel)}</select></label>
          <label>${esc(t.fPriority)}<select name="priority">${opt(PRIORITIES, d.priority, priorityLabel)}</select></label>
          <label>${esc(t.fEffort)}<select name="effort">${opt(['', ...EFFORTS], d.effort || '', effortLabel)}</select></label>
          <label>${esc(t.fKind)}<select name="kind">${opt(KINDS, d.kind || 'task', kindLabel)}</select></label>
          <label class="wide">${esc(t.fPerson)}<input name="person" maxlength="160" value="${esc(d.person)}"><small>${esc(t.fPersonHelp)}</small></label>
          <label>${esc(t.fDomain)}<select name="domain">${opt(domains, d.domain, domainLabel)}</select></label>
          <label>${esc(t.fTag)}<select name="tag">${opt(TAGS, tagOf(d), tagLabel)}</select></label>
          <label>${esc(t.fTopic)}<input name="topic" maxlength="80" value="${esc(d.topic)}" list="topic-list"><datalist id="topic-list">${topics.map(x => `<option value="${esc(x)}">`).join('')}</datalist></label>
        </div>
        <fieldset class="when"><legend>${esc(t.fWhen)}</legend>
          <div class="grid">
            <label>${esc(t.fPlanning)}<input name="planningDate" type="date" value="${esc(d.planningDate)}"></label>
            <label>${esc(t.fDue)}<input name="due" type="date" value="${esc(d.due)}"></label>
            <label>${esc(t.fAnchor)}<select name="anchor"><option value="">${esc(t.noAnchor)}</option>${milestones().map(m => `<option value="${esc(m.key)}" ${m.key === d.anchor ? 'selected' : ''}>${esc(milestoneLabel(m))}</option>`).join('')}</select></label>
            <label>${esc(t.fOffset)}<input name="anchorOffset" type="number" step="1" value="${esc(d.anchorOffset || 0)}"></label>
            <label>${esc(t.fTiming)}<input name="timing" maxlength="500" value="${esc(d.timing)}"></label>
            <label>${esc(t.fStart)}<input name="startWhen" maxlength="500" value="${esc(d.startWhen)}"></label>
          </div>
          <p class="muted" id="computed">${tgt ? esc(t.computedDate(fmtDate(tgt.date))) : ''}</p>
        </fieldset>
        <label>${esc(t.fDeps)}<input name="dependsOn" maxlength="1000" value="${esc(d.dependsOn)}" spellcheck="false" id="deps-input"><small>${esc(t.fDepsHelp)}</small></label>
        <label class="dep-add">${esc(t.addDep)}<input id="dep-pick" list="dep-list" autocomplete="off">
          <datalist id="dep-list">${state.a.order.filter(id => id !== d.id).map(id => `<option value="${esc(id)} — ${esc(titleOf(state.tasks.get(id)))}">`).join('')}</datalist></label>
        ${isNew ? '' : `<div class="dep-cols">
          <section><h3>${esc(t.before)}</h3>${depList(a.prereqs.get(d.id) || [])}</section>
          <section><h3>${esc(t.after)}</h3>${depList(a.dependents.get(d.id) || [])}</section></div>`}
        <fieldset class="steps-box"><legend>${esc(t.fChecklist)}</legend>${checklistHtml(d.checklist || [])}</fieldset>
        <label class="${isDecision ? 'f-decision' : ''}">${esc(t.fDecision)}<small>${esc(t.fDecisionHelp)}</small>
          <textarea name="decision" rows="${isDecision ? 3 : 2}" maxlength="2000">${esc(d.decision)}</textarea></label>
        <label>${esc(t.fNotes)}<textarea name="notes" rows="7" maxlength="8000">${esc(d.notes)}</textarea></label>
        ${fr() ? `<label>${esc(t.fTitleEn)}<input name="title" maxlength="300" value="${esc(d.title)}"></label>` : `<label>${esc(t.fTitleFr)}<input name="titleFr" maxlength="300" value="${esc(d.titleFr)}"></label>`}
        <p class="form-error" role="alert">${esc(error)}</p>
        <div class="drawer-actions">
          <button class="btn primary" type="submit" ${state.busy ? 'disabled' : ''}>${esc(state.busy ? t.saving : t.save)}</button>
          ${isNew ? '' : `<button class="link danger" type="button" data-action="delete">${esc(t.delete)}</button>`}
        </div>
      </form>
      ${isNew ? '' : `
        <p class="muted">${d.updatedBy ? esc(t.lastChange(d.updatedBy, fmtDateTime(d.updated))) : ''}</p>
        ${sourceBlock(d)}
        <details class="history" id="history"><summary>${esc(t.history)}</summary><div id="history-body">${esc(t.loading)}</div></details>`}
    </aside>`;
  const form = $('#task-form');
  form.addEventListener('input', e => {
    state.dirty = true;
    if (['planningDate', 'due', 'anchor', 'anchorOffset'].includes(e.target.name)) {
      readForm();
      const g = targetDate(state.draft, milestoneDates(milestones()));
      $('#computed').textContent = g ? T().computedDate(fmtDate(g.date)) : '';
    }
  });
  if (isNew) form.domain.addEventListener('change', () => {
    readForm();
    state.draft.id = nextId(all, prefixFor(all, form.domain.value));
    state.draft.tag = form.tag.value = tagForDomain(form.domain.value);
    $('#d-id').textContent = state.draft.id;
  });
  $('#dep-pick').addEventListener('change', e => {
    const id = parseIds(e.target.value)[0];
    if (!id) return;
    const input = $('#deps-input');
    input.value = [...new Set([...parseIds(input.value), id])].join(', ');
    e.target.value = ''; state.dirty = true;
  });
  $('#history')?.addEventListener('toggle', async e => {
    if (!e.target.open) return;
    try { $('#history-body').innerHTML = logItems(await state.api.log(d.id, 50), { withTask: false }); }
    catch { $('#history-body').textContent = T().offline; }
  }, { once: true });
  trapFocus(root.querySelector('.drawer'));
}

function trapFocus(panel) {
  panel.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const items = [...panel.querySelectorAll('button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])')].filter(x => !x.disabled && x.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}

/** Sous-étapes : ajout, case cochée, retrait (le brouillon est conservé, l'enregistrement se fait avec la fiche). */
export function stepAction(kind, index) {
  readForm();
  const steps = state.draft.checklist || (state.draft.checklist = []);
  if (kind === 'add') { const v = $('#step-new').value.trim(); if (!v) return; steps.push({ text: v, done: false }); }
  if (kind === 'toggle') steps[index].done = !steps[index].done;
  if (kind === 'remove') steps.splice(index, 1);
  state.dirty = true;
  const scroll = $('.drawer')?.scrollTop;
  renderDrawer();
  if (scroll != null) $('.drawer').scrollTop = scroll;
  if (kind === 'add') $('#step-new')?.focus();
}

let lastFocus = null;
export function openTask(id) {
  if (state.dirty && state.open != null && !confirm(T().discard)) return;
  if (state.open == null) lastFocus = document.activeElement;
  state.open = id; state.dirty = false; state.draft = null;
  renderDrawer();
  $('#d-title')?.focus({ preventScroll: true });
}
export function closeDrawer() {
  openTask(null);
  if (state.open == null && lastFocus && document.contains(lastFocus)) lastFocus.focus();
}

export async function saveTask() {
  const t = T(), isNew = state.open === '';
  readForm();
  const d = state.draft;
  const task = { ...d, titleFr: (d.titleFr || '').trim(), title: (d.title || '').trim(), dependsOn: parseIds(d.dependsOn).join(', ') };
  if (!task.titleFr && !task.title) return showError(t.fieldsError);
  if (!task.title) task.title = task.titleFr;
  if (!task.titleFr) task.titleFr = task.title;
  const deps = parseIds(task.dependsOn);
  const unknown = deps.filter(x => !state.tasks.has(x) || x === task.id);
  if (unknown.length) return showError(t.unknownIds(unknown));
  if (wouldCycle([...state.tasks.values()], task.id, deps)) return showError(t.cycleError);
  state.busy = true; setBusy(true);
  try {
    if (isNew) delete task.version;
    const r = await state.api.save(task);
    state.dirty = false; state.busy = false; state.log = null;
    toast(isNew ? t.createdToast : t.saved);
    await hooks.refresh();
    state.open = r.id; state.draft = null;
    renderDrawer(); hooks.render();
  } catch (e) {
    state.busy = false; setBusy(false);
    if (e.code === 'exists' && isNew) { state.draft.id = nextId([...state.tasks.values()], task.id.split('-')[0]); $('#d-id').textContent = state.draft.id; return showError(t.offline); }
    if (e.code === 'conflict') { state.dirty = false; state.draft = null; await hooks.refresh({ full: true }); return renderDrawer(t.conflict); }
    if (e.code === 'code' || e.code === 'locked') return hooks.signOut();
    showError(e.code === 'fields' ? t.fieldsError : t.offline);
  }
}
function setBusy(on) {
  const btn = $('#task-form [type=submit]'); if (!btn) return;
  btn.disabled = on; btn.textContent = on ? T().saving : T().save;
}
function showError(msg) { const el = $('#task-form .form-error'); if (el) el.textContent = msg; setBusy(false); }

export async function deleteTask() {
  const task = state.tasks.get(state.open);
  if (!task || !confirm(T().confirmDelete(task.id))) return;
  try {
    await state.api.remove(task);
    state.dirty = false; state.open = null; state.draft = null; state.log = null;
    state.tasks.delete(task.id); recompute();
    await hooks.refresh(); renderDrawer(); hooks.render(); toast(T().deletedToast);
  } catch (e) {
    if (e.code === 'conflict') { state.draft = null; await hooks.refresh({ full: true }); return renderDrawer(T().conflict); }
    showError(T().offline);
  }
}
