import { guidedCorrect } from './guided-data.mjs';
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
export function mountGuided(main, a, ctx) {
  let done = false,
    assisted = a.supported,
    listened = false,
    selected = new Set(),
    position = null,
    assembled = [],
    response = { ...a.start },
    grouped = false;
  const drafts = (ctx.state.learning.drafts ??= {}),
    draft = drafts[a.id];
  if (
    draft &&
    a.mode === 'exchange' &&
    ['c', 'd', 'u'].every((k) => Number.isInteger(draft[k]) && draft[k] >= 0 && draft[k] < 50)
  )
    response = { ...draft };
  function storeDraft() {
    drafts[a.id] = { ...response };
    ctx.save();
  }
  main.innerHTML = /* HTML */ `<div class="page-head activity-head">
      <button class="back" id="activity-back" aria-label="Retour">←</button>
      <div>
        <p class="eyebrow">${esc(a.title)} · Palier ${a.tier + 1} sur 6</p>
        <h1>${esc(a.stageLabel)}</h1>
        <div class="stage-dots" aria-label="Palier ${a.tier + 1} sur 6">
          ${Array.from(
            { length: 6 },
            (_, i) =>
              `<span class="${i < a.tier ? 'done' : i === a.tier ? 'current' : ''}"></span>`,
          ).join('')}
        </div>
      </div>
      <button class="quiet" id="activity-stop">☾ Pause</button>
    </div>
    <article class="learning-board guided-board">
      ${a.supported ? '<p class="subtle">Observe la méthode, puis essaie.</p>' : ''}
      ${a.text ? `<p class="reading-passage" id="guided-text">${esc(a.text)}</p>` : ''}${a.document
        ? `<div class="table-scroll"><table class="school-table"><thead><tr>${a.document.headers.map((x) => `<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${a.document.rows.map((row) => `<tr>${row.map((x) => `<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
        : ''}
      <h2>${esc(a.prompt)}</h2>
      <div id="guided-model" class="method-box" ${a.supported ? '' : 'hidden'}>
        <strong>Une façon de chercher</strong>
        <p>${esc(a.model)}</p>
      </div>
      <div id="guided-task"></div>
      <button class="primary" id="guided-check">Regarder ma réponse</button>
      <p id="guided-notice" role="status"></p>
      <div id="learning-feedback" aria-live="polite"></div>
      <div class="learning-bottom">
        <button class="primary" id="activity-next" hidden>
          ${ctx.onNext ? 'Poursuivre l’aventure' : 'Une autre carte'} ↗
        </button>
      </div>
      <details class="activity-options" id="activity-options">
        <summary>Aides et autres choix</summary>
        <div class="option-buttons">
          <button class="secondary" id="activity-audio">
            ♬ ${a.listen ? 'Écouter le mot' : 'Écouter la consigne'}</button
          >${a.text
            ? '<button class="quiet" id="read-passage">♬ Écouter le texte</button>'
            : ''}<button class="quiet" id="activity-hint">Une méthode</button
          ><button class="quiet" id="read-method">♬ Écouter la méthode</button
          ><button class="quiet" id="show-answer">Voir l’explication</button>
        </div>
      </details>
    </article>`;
  const q = (s) => main.querySelector(s),
    task = q('#guided-task');
  q('#activity-back').onclick = ctx.onBrowse;
  q('#activity-stop').onclick = ctx.onPause;
  q('#activity-audio').onclick = () => ctx.speak(a.listen || a.prompt);
  if (a.text)
    q('#read-passage').onclick = () => {
      listened = true;
      ctx.speak(
        a.text + (a.document ? ' ' + a.document.rows.map((r) => r.join(', ')).join('. ') : ''),
      );
    };
  q('#activity-hint').onclick = () => {
    assisted = true;
    q('#guided-model').hidden = false;
  };
  q('#read-method').onclick = () => {
    assisted = true;
    q('#guided-model').hidden = false;
    ctx.speak(a.model);
  };
  q('#activity-next').onclick = () => {
    if (done) ctx.onNext?.({ skipped: false });
  };
  function finish(correct, solution = false) {
    if (done) return;
    done = true;
    assisted = assisted || solution;
    delete drafts[a.id];
    const feedback = correct ? a.success : 'Voici une façon de comprendre cette étape.';
    q('#learning-feedback').innerHTML = /* HTML */ `<div class="explanation">
      <strong>${esc(feedback)}</strong>
      <p>${esc(a.explanation)}</p>
      ${a.mode === 'reading' && listened
        ? '<p class="subtle">Texte écouté : cette activité a travaillé la compréhension avec un soutien audio.</p>'
        : ''}<button class="quiet" id="read-explanation">♬ Écouter l’explication</button>
    </div>`;
    q('#activity-next').hidden = false;
    q('#guided-check').hidden = true;
    q('#activity-next').focus();
    q('#read-explanation').onclick = () => ctx.speak(a.explanation);
    task.querySelectorAll('button,input').forEach((b) => (b.disabled = true));
    q('#guided-check').disabled = true;
    q('#show-answer').disabled = true;
    ctx.state.learning.completed = [...new Set([...ctx.state.learning.completed, a.id])];
    ctx.state.learning.outcomes ??= {};
    ctx.state.learning.outcomes[a.id] = {
      kind: solution
        ? 'explored'
        : correct
          ? assisted || (a.mode === 'reading' && listened)
            ? 'supported'
            : 'independent'
          : 'explored',
      listened,
      at: new Date().toISOString(),
    };
    ctx.onOutcome?.({
      id: a.id,
      correct,
      assisted,
      listened,
      readingSupported: a.mode === 'reading' && listened,
    });
    ctx.save();
  }
  q('#show-answer').onclick = () => finish(false, true);
  const inputs = (steps) =>
    `<div class="strategy-steps">${steps.map(([label], i) => `<label class="field">${esc(label)}<input data-step-answer="${i}" inputmode="decimal" autocomplete="off" aria-label="${esc(label)}"></label>`).join('')}</div>`;
  const bands = (parts, lit = 0, interactive = false) =>
    `<div class="fraction-band ${interactive ? 'interactive' : ''}">${Array.from({ length: parts }, (_, i) => (interactive ? `<button data-fraction="${i}" class="fraction-part ${selected.has(i) ? 'filled' : ''}" aria-label="Part ${i + 1} sur ${parts}" aria-pressed="${selected.has(i)}"></button>` : `<span class="${i < lit ? 'filled' : ''}"></span>`)).join('')}</div>`;
  function drawExchange() {
    task.innerHTML = /* HTML */ `<div class="place-grid">
        ${[
          ['c', 'Centaines', 100],
          ['d', 'Dizaines', 10],
          ['u', 'Unités', 1],
        ]
          .map(
            ([k, label, value]) =>
              `<section><h3>${label}</h3><strong>${response[k]}</strong><div class="quantity-blocks" aria-label="${response[k]} ${label.toLowerCase()}">${Array.from({ length: response[k] }, () => `<i class="${k === 'c' ? 'hundreds' : k === 'd' ? 'tens' : 'ones'}"></i>`).join('')}</div>${a.remove ? `<button data-remove="${k}" ${response[k] === 0 ? 'disabled' : ''}>Retirer ${value === 1 ? 'une unité' : value === 10 ? 'une dizaine' : 'une centaine'}</button>` : ''}</section>`,
          )
          .join('')}
      </div>
      <div class="exchange-actions">
        <button data-exchange="u:d" ${response.u < 10 ? 'disabled' : ''}>
          10 unités → 1 dizaine</button
        ><button data-exchange="d:c" ${response.d < 10 ? 'disabled' : ''}>
          10 dizaines → 1 centaine</button
        >${a.remove
          ? `<button data-exchange="d:u" ${response.d < 1 ? 'disabled' : ''}>Ouvrir 1 dizaine → 10 unités</button><button data-exchange="c:d" ${response.c < 1 ? 'disabled' : ''}>Ouvrir 1 centaine → 10 dizaines</button>`
          : ''}<button id="exchange-reset">Revenir au coffre de départ</button>
      </div>
      <p class="subtle">
        ${a.remove
          ? 'Tu peux ouvrir un paquet avant de retirer les perles.'
          : 'Chaque échange conserve toutes les perles.'}
      </p>`;
    task.querySelectorAll('[data-exchange]').forEach(
      (b) =>
        (b.onclick = () => {
          const [from, to] = b.dataset.exchange.split(':'),
            pack = ['u:d', 'd:c'].includes(b.dataset.exchange);
          response[from] -= pack ? 10 : 1;
          response[to] += pack ? 1 : 10;
          storeDraft();
          drawExchange();
        }),
    );
    task.querySelectorAll('[data-remove]').forEach(
      (b) =>
        (b.onclick = () => {
          response[b.dataset.remove]--;
          storeDraft();
          drawExchange();
        }),
    );
    q('#exchange-reset').onclick = () => {
      response = { ...a.start };
      storeDraft();
      drawExchange();
    };
  }
  function drawFraction() {
    if (a.interaction === 'partition') {
      task.innerHTML = /* HTML */ `<div
        class="partition-choices"
        role="group"
        aria-label="Choisir un partage"
      >
        ${a.partitions
          .map(
            (widths, i) =>
              `<button class="partition-choice ${partition === i ? 'selected' : ''}" data-partition="${i}" aria-pressed="${partition === i}" aria-label="Choisir la bande ${i + 1}"><span>Bande ${i + 1}</span><span class="partition-band" aria-hidden="true">${widths.map((w) => `<i style="flex:${w}"></i>`).join('')}</span></button>`,
          )
          .join('')}
      </div>`;
      task.querySelectorAll('[data-partition]').forEach(
        (b) =>
          (b.onclick = () => {
            partition = Number(b.dataset.partition);
            drawFraction();
          }),
      );
      return;
    }

    if (a.interaction === 'quantity') {
      task.innerHTML = /* HTML */ `<p>Le sac entier contient ${a.quantity} perles.</p>
        <div class="pearl-groups ${grouped ? 'grouped' : ''}">
          ${Array.from(
            { length: grouped ? 4 : 1 },
            () =>
              `<span>${Array.from({ length: grouped ? a.quantity / 4 : a.quantity }, () => '<i class="pearl"></i>').join('')}</span>`,
          ).join('')}
        </div>
        <button class="quiet" id="share-four">Voir quatre groupes égaux</button>${inputs(a.steps)}`;
      q('#share-four').onclick = () => {
        const values = [...task.querySelectorAll('[data-step-answer]')].map((x) => x.value);
        assisted = true;
        grouped = true;
        drawFraction();
        task.querySelectorAll('[data-step-answer]').forEach((x, i) => (x.value = values[i]));
      };
      return;
    }
    if (a.interaction === 'line') {
      task.innerHTML = /* HTML */ `<div
          class="fraction-line"
          role="group"
          aria-label="Droite de zéro à ${a.units}"
        >
          ${Array.from(
            { length: a.units * a.parts + 1 },
            (_, i) =>
              `<button data-position="${i}" class="${position === i ? 'selected' : ''}" aria-label="Graduation ${i} depuis zéro" aria-pressed="${position === i}"><span>${i % a.parts === 0 ? i / a.parts : '│'}</span>${position === i ? '<b>●</b>' : ''}</button>`,
          ).join('')}
        </div>
        <p class="subtle">Touche une graduation. Les nombres indiquent les unités entières.</p>`;
      task.querySelectorAll('[data-position]').forEach(
        (b) =>
          (b.onclick = () => {
            position = Number(b.dataset.position);
            drawFraction();
          }),
      );
      return;
    }
    task.innerHTML =
      a.interaction === 'equivalent'
        ? `<p>Même unité · première bande : ${a.numerator}/${a.parts}</p>${bands(a.parts, a.numerator)}<p>Seconde bande : ${a.targetParts || 8} parts égales</p>${bands(a.targetParts || 8, 0, true)}`
        : `<p>Une bande entière = une unité</p>${bands(a.parts, 0, true)}`;
    task.querySelectorAll('[data-fraction]').forEach(
      (b) =>
        (b.onclick = () => {
          const i = Number(b.dataset.fraction);
          selected.has(i) ? selected.delete(i) : selected.add(i);
          drawFraction();
        }),
    );
  }
  function drawWords() {
    if (a.interaction === 'assemble') {
      const pieces = a.pieces
        .map((p, i) => ({ p, i }))
        .sort(
          (x, y) => ((x.i + a.variant) % a.pieces.length) - ((y.i + a.variant) % a.pieces.length),
        )
        .reverse();
      task.innerHTML = /* HTML */ `<p class="assembled-word" aria-live="polite">
          ${assembled.map((i) => esc(a.pieces[i])).join('') || '…'}
        </p>
        <div class="number-pool">
          ${pieces
            .map(
              ({ p, i }) =>
                `<button data-piece="${i}" ${assembled.includes(i) ? 'disabled' : ''}>${esc(p)}</button>`,
            )
            .join('')}
        </div>
        <button class="quiet" id="word-undo">↶ Retirer le dernier morceau</button>
        <p class="subtle">
          L’audio donne le mot à construire. La lecture à voix haute peut se faire avec un adulte,
          sans enregistrement.
        </p>`;
      task.querySelectorAll('[data-piece]').forEach(
        (b) =>
          (b.onclick = () => {
            assembled.push(Number(b.dataset.piece));
            drawWords();
          }),
      );
      q('#word-undo').onclick = () => {
        assembled.pop();
        drawWords();
      };
    } else drawChoices();
  }
  let choice = null,
    evidence = null,
    partition = null;
  function drawChoices() {
    task.innerHTML = /* HTML */ `<div class="answer-choices">
        ${a.options
          .map(
            (o, i) =>
              `<button data-guided-option="${i}" class="answer ${choice === o ? 'selected' : ''}" aria-pressed="${choice === o}">${esc(o)}</button>`,
          )
          .join('')}
      </div>
      ${a.mode === 'reading'
        ? `<h3>Quel indice du texte aide à répondre ?</h3><p class="subtle">Il peut être reformulé : cherche le lien avec la question.</p><div class="answer-choices">${a.evidence.map((e, i) => `<button class="answer ${evidence === i ? 'selected' : ''}" data-evidence="${i}" aria-pressed="${evidence === i}">${esc(e)}</button>`).join('')}</div>`
        : ''}`;
    task.querySelectorAll('[data-guided-option]').forEach(
      (b) =>
        (b.onclick = () => {
          choice = a.options[Number(b.dataset.guidedOption)];
          drawChoices();
        }),
    );
    task.querySelectorAll('[data-evidence]').forEach(
      (b) =>
        (b.onclick = () => {
          evidence = Number(b.dataset.evidence);
          drawChoices();
        }),
    );
  }
  if (a.mode === 'exchange') drawExchange();
  if (a.mode === 'steps') task.innerHTML = inputs(a.steps);
  if (a.mode === 'fraction') drawFraction();
  if (a.mode === 'words') drawWords();
  if (a.mode === 'reading') drawChoices();
  q('#guided-check').onclick = () => {
    let value;
    if (a.mode === 'exchange') value = response;
    else if (a.mode === 'steps' || a.interaction === 'quantity') {
      value = [...task.querySelectorAll('[data-step-answer]')].map((x) =>
        x.value.replace(',', '.').trim(),
      );
      if (value.some((x) => x === '')) {
        q('#guided-notice').textContent =
          'Il reste une étape vide. Tu peux la compléter ou ouvrir l’explication.';
        return;
      }
    } else if (a.mode === 'fraction') {
      value =
        a.interaction === 'partition'
          ? partition
          : a.interaction === 'line'
            ? position
            : selected.size;
      if (value === null) {
        q('#guided-notice').textContent =
          a.interaction === 'partition'
            ? 'Choisis une bande, ou ouvre les aides.'
            : 'Choisis une graduation, ou ouvre les aides.';
        return;
      }
    } else if (a.interaction === 'assemble') value = assembled.map((i) => a.pieces[i]).join('');
    else {
      value = choice;
      if (value === null || (a.mode === 'reading' && evidence === null)) {
        q('#guided-notice').textContent =
          a.mode === 'reading'
            ? 'Choisis une réponse et l’indice qui t’aide, ou découvre l’explication.'
            : 'Choisis une réponse, ou découvre l’explication.';
        return;
      }
    }
    const correct =
      guidedCorrect(a, value) && (a.mode !== 'reading' || evidence === a.evidenceAnswer);
    finish(correct);
  };
}
