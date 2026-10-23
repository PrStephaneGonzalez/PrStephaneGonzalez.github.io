import {
  MATH_BLOCKS,
  blockById,
  makeMathTask,
  formatNumber,
  parseNumber,
  chooseFact,
  factStatus,
} from './math-core.mjs';
import { eventStamp } from './training-state.mjs';
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const input = (label = 'Ta réponse') =>
  `<label class="field math-answer-label">${label}<input id="math-answer" type="text" inputmode="decimal" autocorrect="off" autocomplete="off" autocapitalize="off" spellcheck="false"></label>`;
const modelNames = {
  whole: 'Des parties et un tout',
  compare: 'Deux quantités à comparer',
  equal: 'Des parts égales',
};
export function mountMath(main, ctx, { session, block, tier }) {
  const math = ctx.state.training.math;
  math.sessions[session] ??= { block, tier, seen: [], helped: [] };
  math.strategies ??= [];
  math.sessions[session].helped ??= [];
  math.sessions[session].schemas ??= {};
  const record = math.sessions[session];
  block = record.block;
  tier = record.tier;
  let disposed = false,
    interrupted = false,
    start = null,
    answered = false,
    task = null,
    assisted = false,
    slot = 0,
    placement = null,
    counts = null,
    selected = null,
    assignments = [],
    model = null,
    chosenQuestion = null;
  const q = (s) => main.querySelector(s);
  const items = () => math.events.filter((e) => e.session === session);
  function shell(content) {
    const meta = blockById(block);
    main.innerHTML = `<div class="page-head activity-head"><button class="back" id="math-back" aria-label="Retour">←</button><div><p class="eyebrow">L’école des nombres · Carte ${slot + 1} sur 6</p><h1>${esc(meta.label)}</h1><p class="subtle">${esc(meta.tiers[tier])}</p></div><button class="quiet" id="math-pause">☾ Pause</button></div><article class="learning-board math-work">${content}<div id="math-feedback" role="status" aria-live="polite"></div></article><details class="activity-options" id="activity-options"><summary>Aides et autres choix</summary><button class="quiet" id="math-help">Une méthode</button><button class="quiet" id="math-easier">Un peu plus simple</button><button class="quiet" id="math-harder">Un peu plus difficile</button>${ctx.free ? '' : '<button class="quiet" id="math-skip">Garder cette étape pour plus tard</button>'}</details>`;
    q('#math-back').onclick = ctx.onExit;
    q('#math-pause').onclick = ctx.onExit;
    if (q('#math-skip')) q('#math-skip').onclick = ctx.onSkip || ctx.onExit;
    q('#math-help').onclick = () => {
      assisted = true;
      record.helped = [...new Set([...record.helped, slot])];
      if (block === 'facts' && !math.strategies.includes(task.target))
        math.strategies.push(task.target);
      ctx.save();
      const help = document.createElement('p');
      help.textContent = method();
      q('#math-feedback').append(help);
      q('#math-help').disabled = true;
    };
    for (const [id, delta] of [
      ['#math-easier', -1],
      ['#math-harder', 1],
    ])
      q(id).onclick = () => {
        record.tier = Math.max(0, Math.min(5, tier + delta));
        tier = record.tier;
        for (const p of Object.values(ctx.state.training.plans))
          if (p.id === session) p.mathTier = tier;
        interrupted = true;
        ctx.save();
        show();
      };
  }
  function method() {
    if (block === 'facts') return task.strategy;
    if (block === 'line')
      return 'Repère le milieu, puis les moitiés de chaque côté. Tu peux chercher un emplacement approché.';
    if (block === 'place')
      return 'Chaque colonne vaut dix fois celle de droite. Dix unités s’échangent contre une dizaine ; un zéro garde une place vide.';
    return 'Cherche ce qui est connu, puis ce qui manque. Les barres représentent des quantités : tout, parties ou écart.';
  }
  function show() {
    if (disposed) return;
    const done = new Set(items().map((e) => e.slot));
    slot = Array.from({ length: 6 }, (_, i) => i).find((i) => !done.has(i)) ?? 6;
    if (slot === 6) return finish();
    const resumed = record.seen.includes(slot);
    record.seen = [...new Set([...record.seen, slot])];
    ctx.save();
    answered = false;
    assisted = record.helped.includes(slot);
    interrupted = interrupted || resumed;
    start = performance.now();
    placement = null;
    selected = null;
    assignments = [];
    model = null;
    chosenQuestion = null;
    const seed = session + ':' + tier;
    task = makeMathTask(
      block,
      tier,
      seed,
      slot,
      block === 'facts' ? chooseFact(math, tier, ctx.day, seed + slot, session) : null,
    );
    if (block === 'line') return line();
    if (block === 'bars') return bars();
    if (block === 'place' && task.kind === 'exchange') return exchange();
    if (task.options) return choices();
    let content = `<h2>${esc(task.prompt)}</h2>`;
    if (task.kind === 'transcode')
      content += `<p class="math-number-words">${esc(task.words)}</p>${ctx.hasFrenchVoice() ? '<button class="secondary" id="math-dictate">Écouter le nombre</button><p class="smallnote">Le texte sera caché pendant la dictée.</p>' : '<p class="subtle">La voix française locale est indisponible : cette carte se fait avec le nombre écrit en lettres.</p>'}`;
    content += `<form id="math-form">${input()}<button class="primary" id="math-check" type="submit">Regarder ma réponse</button></form>`;
    shell(content);
    if (q('#math-dictate'))
      q('#math-dictate').onclick = () => {
        q('.math-number-words').hidden = true;
        interrupted = true;
        ctx.speak(task.words);
        q('#math-dictate').textContent = 'Réécouter le nombre';
      };
    q('#math-form').onsubmit = (e) => {
      e.preventDefault();
      if (answered) return;
      const value = parseNumber(q('#math-answer').value);
      if (!Number.isFinite(value)) {
        q('#math-feedback').textContent = 'Écris un nombre pour regarder ta réponse.';
        return;
      }
      const correct = Math.abs(value - task.answer) < 0.00001;
      result(
        { correct },
        task.kind === 'fact'
          ? `${task.prompt} = ${formatNumber(task.answer)}. ${correct ? 'Tu as retrouvé ce fait.' : task.strategy}`
          : task.explanation,
      );
    };
  }
  function choices() {
    shell(
      `<h2>${esc(task.prompt)}</h2><div class="math-choice-list">${task.options.map((o, i) => `<button class="secondary" data-math-choice="${i}">${esc(o)}</button>`).join('')}</div>`,
    );
    main.querySelectorAll('[data-math-choice]').forEach(
      (b) =>
        (b.onclick = () => {
          if (answered) return;
          result({ correct: Number(b.dataset.mathChoice) === task.answerIndex }, task.explanation);
        }),
    );
  }
  function line() {
    if (task.kind === 'compare') return choices();
    const read = task.kind === 'read';
    shell(
      `<h2>${esc(task.prompt)}</h2><p>${read ? 'Une valeur approchée convient. Tu peux écrire une fraction avec / ou un nombre avec une virgule.' : 'Touche la droite ou déplace le repère, puis valide. Cherche une position approchée.'}</p><div class="math-numberline"><svg viewBox="0 0 520 115" role="img" aria-label="Droite de 0 à ${task.max}${read ? ', luciole à estimer' : ''}"><path d="M30 57H490M30 46V68M490 46V68" stroke="#cbd3e6" stroke-width="3"/><text x="30" y="104" fill="#fff6e5" font-size="20" text-anchor="middle">0</text><text x="490" y="104" fill="#fff6e5" font-size="20" text-anchor="middle">${formatNumber(task.max)}</text>${read ? `<circle cx="${30 + (460 * task.value) / task.max}" cy="57" r="10" fill="#f1cf91"/>` : '<circle id="line-guess" cx="260" cy="57" r="9" fill="#bfc9ed" opacity="0"/>'}<g id="line-correction"></g></svg>${read ? '' : `<input id="line-slider" class="line-slider" type="range" min="0" max="1000" step="1" value="500" aria-label="Placer ${esc(task.label)} entre 0 et ${task.max}">`}</div><form id="math-form">${read ? input('Quel nombre ?') : ''}<button class="primary" id="math-check" type="submit">Regarder ma réponse</button></form>`,
    );
    if (!read)
      q('#line-slider').oninput = (e) => {
        placement = (Number(e.target.value) / 1000) * task.max;
        q('#line-guess').setAttribute('cx', 30 + (460 * placement) / task.max);
        q('#line-guess').setAttribute('opacity', '1');
      };
    q('#math-form').onsubmit = (e) => {
      e.preventDefault();
      if (answered) return;
      const value = read ? parseNumber(q('#math-answer').value) : placement;
      if (value === null || !Number.isFinite(value)) {
        q('#math-feedback').textContent = read
          ? 'Écris un nombre.'
          : 'Choisis un emplacement sur la droite.';
        return;
      }
      const error = Math.min(100, (100 * Math.abs(value - task.value)) / task.max);
      q('#line-correction').innerHTML =
        `<path d="M${30 + (460 * task.value) / task.max} 30V70" stroke="#f1cf91" stroke-width="3"/><text x="260" y="20" text-anchor="middle" fill="#f1cf91" font-size="18">${esc(task.label)}</text>`;
      result(
        { correct: error <= 5, error },
        `${read ? 'La luciole indique' : 'Le repère doré montre'} ${task.label}. ${error <= 5 ? 'Ton estimation est proche.' : 'Observe sa place par rapport aux extrémités et au milieu.'}`,
      );
    };
  }
  function exchange() {
    counts = [...task.counts];
    shell(
      `<h2>${esc(task.prompt)}</h2><div class="exchange-columns">${task.labels.map((label, i) => `<div><strong>${esc(label)}</strong><span id="exchange-count-${i}" class="exchange-count">${counts[i]}</span>${i ? `<button class="secondary" data-exchange="${i}">Échanger dix</button>` : '<span class="subtle">Colonne de gauche</span>'}</div>`).join('')}</div><button class="primary" id="math-check">Regarder mes échanges</button>`,
    );
    main.querySelectorAll('[data-exchange]').forEach(
      (b) =>
        (b.onclick = () => {
          if (answered) return;
          const i = Number(b.dataset.exchange);
          if (counts[i] < 10) {
            q('#math-feedback').textContent =
              'Il faut dix éléments dans cette colonne pour faire un échange.';
            return;
          }
          counts[i] -= 10;
          counts[i - 1]++;
          counts.forEach((n, j) => (q('#exchange-count-' + j).textContent = String(n)));
        }),
    );
    q('#math-check').onclick = () => {
      if (answered) return;
      result(
        { correct: counts.every((n, i) => n === task.answerCounts[i]) },
        'Après les échanges : ' +
          task.answerCounts.map((n, i) => n + ' ' + task.labels[i]).join(', ') +
          '. La valeur totale ne change pas.',
      );
    };
  }
  function modelHTML(kind) {
    if (kind === 'whole') return '<span class="bar-drawing whole"><i></i><i></i><b></b></span>';
    if (kind === 'compare') return '<span class="bar-drawing compare"><i></i><i></i><b></b></span>';
    return '<span class="bar-drawing equal"><i></i><i></i><i></i><b></b></span>';
  }
  function bars() {
    shell(
      `<p class="math-story">${esc(task.story)}</p><button class="quiet" id="math-listen">Écouter l’énoncé</button>${task.questionOptions ? `<p>Propose une question à voix haute, puis choisis celle que tu peux résoudre avec les quantités de cette histoire.</p><div class="math-choice-list">${task.questionOptions.map((v, i) => `<button class="secondary" data-question="${i}">${esc(v)}</button>`).join('')}</div>` : ''}<h2>Quel schéma raconte cette histoire ?</h2><div class="bar-models">${Object.entries(
        modelNames,
      )
        .map(
          ([id, label]) =>
            `<button class="bar-model" data-model="${id}" aria-pressed="false">${modelHTML(id)}<span>${label}</span></button>`,
        )
        .join(
          '',
        )}</div><div id="bar-builder" hidden><p>Touche une étiquette, puis sa place dans le schéma.${task.kind === 'irrelevant' ? ' Une étiquette ne sert pas.' : ''}</p><div class="bar-tokens">${task.cards
        .map((c, i) => ({ c, i }))
        .sort(
          (a, b) =>
            ((a.i + hashSeedForUI(session)) % task.cards.length) -
            ((b.i + hashSeedForUI(session)) % task.cards.length),
        )
        .map(
          ({ c, i }) =>
            `<button class="secondary" data-bar-card="${i}" aria-pressed="false">${esc(c)}</button>`,
        )
        .join(
          '',
        )}</div><div class="bar-built-diagram" id="bar-built-diagram"></div><div class="bar-slots">${task.slots.map((s, i) => `<button data-bar-slot="${i}" class="bar-slot"><span>${esc(s)}</span><strong id="bar-value-${i}">…</strong></button>`).join('')}</div><button class="primary" id="bar-check">Regarder mon schéma</button></div>`,
    );
    q('#math-listen').onclick = () => ctx.speak(task.story);
    main.querySelectorAll('[data-question]').forEach(
      (b) =>
        (b.onclick = () => {
          chosenQuestion = Number(b.dataset.question);
          main
            .querySelectorAll('[data-question]')
            .forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        }),
    );
    main.querySelectorAll('[data-model]').forEach(
      (b) =>
        (b.onclick = () => {
          if (answered) return;
          model = b.dataset.model;
          main
            .querySelectorAll('[data-model]')
            .forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
          q('#bar-builder').hidden = false;
          q('#bar-built-diagram').innerHTML = modelHTML(model);
        }),
    );
    main.querySelectorAll('[data-bar-card]').forEach(
      (b) =>
        (b.onclick = () => {
          if (answered) return;
          selected = Number(b.dataset.barCard);
          main
            .querySelectorAll('[data-bar-card]')
            .forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        }),
    );
    main.querySelectorAll('[data-bar-slot]').forEach(
      (b) =>
        (b.onclick = () => {
          if (answered || selected === null) return;
          const i = Number(b.dataset.barSlot),
            old = assignments.indexOf(selected);
          if (old >= 0) {
            assignments[old] = undefined;
            q('#bar-value-' + old).textContent = '…';
          }
          assignments[i] = selected;
          q('#bar-value-' + i).textContent = task.cards[selected];
          selected = null;
          main
            .querySelectorAll('[data-bar-card]')
            .forEach((x) => x.setAttribute('aria-pressed', 'false'));
        }),
    );
    q('#bar-check').onclick = () => {
      if (answered) return;
      if (
        task.slots.some((_, i) => assignments[i] === undefined) ||
        (task.questionOptions && chosenQuestion === null)
      ) {
        q('#math-feedback').textContent =
          'Place une étiquette dans chaque case' +
          (task.questionOptions ? ' et choisis ta question.' : '.');
        return;
      }
      const schema =
        model === task.model &&
        task.slots.every((_, i) => task.cards[assignments[i]] === task.cards[i]) &&
        (!task.questionOptions || chosenQuestion === task.questionAnswer);
      record.schemas[slot] ??= schema;
      const firstSchema = record.schemas[slot];
      ctx.save();
      q('#bar-check').disabled = true;
      q('#math-help').disabled = true;
      main
        .querySelectorAll('[data-model],[data-bar-card],[data-bar-slot],[data-question]')
        .forEach((b) => (b.disabled = true));
      const calc = document.createElement('div');
      calc.id = 'bar-calc';
      calc.innerHTML = `<p>${schema ? 'Ton schéma représente les quantités.' : `Voici le schéma à garder : ${modelNames[task.model]}.`}</p>${schema ? '' : `<div class="bar-built-diagram">${modelHTML(task.model)}</div><p>${task.slots.map((s, i) => esc(s) + ' : ' + esc(task.cards[i])).join(' · ')}</p>`}<form id="math-form">${input('Calcule maintenant la quantité cherchée')}<button class="primary" id="math-check" type="submit">Regarder mon calcul</button></form>`;
      q('#math-feedback').append(calc);
      q('#math-form').onsubmit = (e) => {
        e.preventDefault();
        if (answered) return;
        const value = parseNumber(q('#math-answer').value);
        if (!Number.isFinite(value)) return;
        const correct = Math.abs(value - task.answer) < 0.00001;
        result(
          { correct: firstSchema && correct, schema: firstSchema, calc: correct },
          task.explanation,
        );
      };
    };
  }
  function result(values, explanation) {
    if (answered || disposed) return;
    answered = true;
    const duration =
      ctx.state.trainingSettings.tracking && !interrupted
        ? Math.max(0, performance.now() - start)
        : null;
    const event = {
      ...eventStamp(ctx.day),
      session,
      slot,
      block,
      tier,
      target: task.target,
      kind: task.kind,
      assisted,
      duration,
      fast:
        values.correct &&
        !assisted &&
        duration !== null &&
        duration <= (ctx.state.trainingSettings.mathFast || 6000),
      error: null,
      schema: null,
      calc: null,
      ...values,
    };
    if (
      block === 'facts' &&
      (!event.correct || !event.fast) &&
      !math.strategies.includes(task.target)
    ) {
      math.strategies.push(task.target);
      if (!explanation.includes(task.strategy)) explanation += ' ' + task.strategy;
    }
    math.events.push(event);
    ctx.save();
    ctx.onFeedback?.(event.correct);
    main
      .querySelectorAll('[data-math-choice],#math-answer,#math-check,#line-slider,[data-exchange]')
      .forEach((b) => (b.disabled = true));
    q('#math-easier').disabled = true;
    q('#math-harder').disabled = true;
    q('#math-help').disabled = true;
    const feedback = document.createElement('div');
    feedback.className = 'math-result';
    feedback.innerHTML = `<p>${esc(explanation)}</p><button class="primary" id="math-next">${slot === 5 ? 'Terminer ce bloc' : 'La carte suivante'} ↗</button>`;
    q('#math-feedback').append(feedback);
    const difficult =
      math.events
        .filter((e) => e.block === block && e.tier === tier)
        .slice(-3)
        .filter((e) => !e.correct).length >= 2;
    if (
      difficult &&
      ctx.onLesson &&
      (block === 'facts' || (block === 'place' && tier < 4) || (block === 'line' && tier >= 4))
    ) {
      const lesson = document.createElement('button');
      lesson.className = 'quiet';
      lesson.id = 'math-lesson';
      lesson.textContent = 'Revoir la méthode avec une leçon';
      lesson.onclick = () => ctx.onLesson(block, tier);
      feedback.append(lesson);
    }
    q('#math-next').onclick = () => {
      interrupted = false;
      show();
    };
  }
  function finish() {
    ctx.onStepFinished?.();
    main.innerHTML = `<div class="page-head"><div><p class="eyebrow">L’école des nombres</p><h1>Une étape de plus dans ton grimoire.</h1></div></div><article class="learning-board"><p>Les six cartes de « ${esc(blockById(block).label)} » sont terminées.</p><button class="primary" id="math-complete">${ctx.free ? 'Retour aux maths' : 'Continuer vers le jeu'} ↗</button><button class="quiet" id="math-finish-home">Faire une pause</button></article>`;
    q('#math-complete').onclick = ctx.onDone;
    q('#math-finish-home').onclick = () => {
      ctx.onFinishPause?.();
      ctx.onExit();
    };
  }
  const visibility = () => {
    if (document.hidden && start !== null) interrupted = true;
  };
  document.addEventListener('visibilitychange', visibility);
  show();
  return () => {
    disposed = true;
    document.removeEventListener('visibilitychange', visibility);
    ctx.stopVoice?.();
  };
}
const hashSeedForUI = (s) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0);
