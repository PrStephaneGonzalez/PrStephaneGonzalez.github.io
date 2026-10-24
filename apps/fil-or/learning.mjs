import { eventStamp } from './training-state.mjs';
import { schoolTier } from './school-progress.mjs';
import { typedCorrect } from './deep-practice.mjs';
import { operationCorrect } from './written-operations.mjs';
import { mountGuided } from './guided-ui.mjs';
import { answerLine } from './feedback.mjs';
import { WORKSHOPS, ACTIVITIES, ACTIVITY_BY_ID, SKILLS } from './catalog.mjs';
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
export function visualHTML(v) {
  if (!v) return '';
  if (v.kind === 'polygon-count') {
    const points = Array.from({ length: v.sides }, (_, i) => {
      const a = (((i * 360) / v.sides + v.rotation) * Math.PI) / 180;
      return [220 + 115 * Math.cos(a), 140 + 115 * Math.sin(a)];
    });
    return (
      '<svg class="geometry-picture" viewBox="0 0 440 290" role="img" aria-label="Polygone dont les sommets sont marqués par des points"><polygon points="' +
      points.map((p) => p.join(',')).join(' ') +
      '" fill="#244b50" stroke="#f2c779" stroke-width="4"/>' +
      points
        .map(
          ([x, y], i) =>
            '<circle cx="' +
            x +
            '" cy="' +
            y +
            '" r="5" fill="#fff6e5"/><text x="' +
            (x + 10) +
            '" y="' +
            (y - 8) +
            '" fill="#fff6e5" font-size="16">' +
            String.fromCharCode(65 + i) +
            '</text>',
        )
        .join('') +
      '</svg>'
    );
  }
  if (v.kind === 'angle-compare') {
    const a = (v.degrees * Math.PI) / 180,
      x = 210 + 105 * Math.cos(a),
      y = 145 - 105 * Math.sin(a);
    return (
      '<svg class="geometry-picture" viewBox="0 0 440 220" role="img" aria-label="Angle de ' +
      v.degrees +
      ' degrés"><path d="M315 145H210L' +
      x +
      ' ' +
      y +
      '" fill="none" stroke="#f2c779" stroke-width="5"/><circle cx="210" cy="145" r="5" fill="#fff6e5"/>' +
      (v.degrees === 90
        ? '<path d="M230 145V125H210" fill="none" stroke="#bfd0cf" stroke-width="2"/>'
        : '') +
      '</svg>'
    );
  }
  if (v.kind === 'school-bars' || v.kind === 'school-curve') {
    const max = Math.max(...v.values) + 1;
    const y = (n) => 175 - (n / max) * 140;
    const points = v.values.map((n, i) => ({ x: 100 + i * 120, y: y(n), n, label: v.labels[i] }));
    return (
      '<svg class="geometry-picture" viewBox="0 0 440 230" role="img" aria-label="' +
      v.labels.map((label, i) => label + ' : ' + v.values[i] + ' livres').join(', ') +
      '"><path d="M55 25V175H410" stroke="#bfd0cf" fill="none"/>' +
      (v.kind === 'school-bars'
        ? points
            .map(
              (p) =>
                '<rect x="' +
                (p.x - 25) +
                '" y="' +
                p.y +
                '" width="50" height="' +
                (175 - p.y) +
                '" fill="#f2c779"/>',
            )
            .join('')
        : '<polyline points="' +
          points.map((p) => p.x + ',' + p.y).join(' ') +
          '" fill="none" stroke="#f2c779" stroke-width="3"/>') +
      points
        .map(
          (p) =>
            '<circle cx="' +
            p.x +
            '" cy="' +
            p.y +
            '" r="4" fill="#f2c779"/><text x="' +
            p.x +
            '" y="' +
            (p.y - 10) +
            '" text-anchor="middle" fill="#fff6e5" font-size="18">' +
            p.n +
            '</text><text x="' +
            p.x +
            '" y="205" text-anchor="middle" fill="#bfd0cf" font-size="16">' +
            p.label +
            '</text>',
        )
        .join('') +
      '</svg>'
    );
  }
  if (v.kind === 'school-pie')
    return '<svg class="geometry-picture" viewBox="0 0 440 230" role="img" aria-label="Diagramme : Livres, moitié du disque ; Plantes et Animaux, un quart chacun"><circle cx="120" cy="110" r="85" fill="#f2c779"/><path d="M120 25A85 85 0 0 1 120 195V110Z" fill="#6fa9a4"/><path d="M120 110H205A85 85 0 0 1 120 195Z" fill="#ae8bbe"/><rect x="240" y="55" width="18" height="18" fill="#f2c779"/><text x="270" y="71" fill="#fff6e5" font-size="18">Livres</text><rect x="240" y="95" width="18" height="18" fill="#6fa9a4"/><text x="270" y="111" fill="#fff6e5" font-size="18">Plantes</text><rect x="240" y="135" width="18" height="18" fill="#ae8bbe"/><text x="270" y="151" fill="#fff6e5" font-size="18">Animaux</text></svg>';
  if (v.kind === 'rectangle')
    return `<svg class="geometry-picture" viewBox="0 0 420 200" role="img" aria-label="Rectangle de longueur ${v.l} et largeur ${v.w}"><rect x="80" y="40" width="${Math.round(v.l * Math.min(260 / v.l, 110 / v.w))}" height="${Math.round(v.w * Math.min(260 / v.l, 110 / v.w))}" rx="2" fill="#28544f" stroke="#f2c779" stroke-width="3"/><text x="210" y="25" text-anchor="middle" fill="#fff6e5" font-size="20">${v.l} cm</text><text x="365" y="105" text-anchor="middle" fill="#fff6e5" font-size="20">${v.w} cm</text><text x="210" y="185" text-anchor="middle" fill="#bfd0cf" font-size="13">Schéma indicatif, pas à l’échelle</text></svg>`;
  if (v.kind === 'fraction')
    return `<div class="fraction-band" role="img" aria-label="Bande en ${v.parts} parts égales, ${v.lit} colorées">${Array.from({ length: v.parts }, (_, i) => `<span class="${i < v.lit ? 'filled' : ''}"></span>`).join('')}</div>`;
  if (v.kind === 'line')
    return `<svg class="number-line" viewBox="0 0 500 130" role="img" aria-label="Droite de 0 à ${v.max}, graduée par pas de ${v.max / 10}, luciole sur la graduation à trouver"><path d="M30 80H470" stroke="#b4cdc4" stroke-width="3"/>${Array.from({ length: 11 }, (_, i) => `<path d="M${30 + i * 44} 72V88" stroke="#b4cdc4" stroke-width="2"/>${i % 2 === 0 ? `<text x="${30 + i * 44}" y="114" text-anchor="middle" fill="#e6eddf" font-size="19">${(i * v.max) / 10}</text>` : ''}`).join('')}<path d="M${30 + v.position * 44} 39V65" stroke="#f2c779" stroke-width="3"/><circle cx="${30 + v.position * 44}" cy="30" r="13" fill="#f2c779"/><text x="${30 + v.position * 44}" y="37" text-anchor="middle" fill="#19383f" font-size="18">?</text></svg>`;
  return '';
}
export function renderLearningHub(
  main,
  {
    state,
    save,
    speak,
    story,
    stopVoice,
    initialId,
    initialSkill,
    onNext,
    nextLabel,
    listLabel,
    onOutcome: notifyOutcome,
    onPause,
    onBrowse,
    onGames,
    onRead,
    onMath,
    onWords,
    onCoverage,
  },
) {
  stopVoice();
  const onOutcome = (outcome) => {
    const a = ACTIVITY_BY_ID[outcome.id];
    if (a && a.type !== 'fact')
      state.training.school.push({
        ...eventStamp(),
        activityId: a.canonicalId || a.id,
        skill: a.skill,
        tier: a.tier,
        format: a.type,
        revision: 2,
        correct: typeof outcome.correct === 'boolean' ? outcome.correct : null,
        assisted: !!outcome.assisted || !!outcome.readingSupported,
      });
    notifyOutcome?.(outcome);
  };
  function home() {
    stopVoice();
    const recent = Object.entries(state.learning.outcomes || {})
      .sort(([, a], [, b]) => String(b.at || '').localeCompare(String(a.at || '')))
      .map(([id]) => ACTIVITIES.find((activity) => activity.id === id))
      .filter((activity) => activity && ['language', 'math'].includes(activity.route))
      .slice(0, 4);
    main.innerHTML = /* HTML */ `<div class="page-head">
        <div>
          <p class="eyebrow">S’entraîner</p>
          <h1>Que veux-tu retrouver ?</h1>
          <p class="subtle">Choisis une matière, puis une compétence.</p>
        </div>
      </div>
      ${recent.length
        ? `<section class="training-section"><h2>Reprendre</h2><div class="resume-list">${recent
            .map(
              (a) =>
                `<button class="activity-card" data-recent="${a.id}"><span><strong>${esc(a.title)}</strong><small>${esc(a.stageLabel || 'Dernier exercice essayé')}</small></span><span aria-hidden="true">↗</span></button>`,
            )
            .join('')}</div></section>`
        : ''}
      <section class="training-section">
        <h2>Choisir un entraînement</h2>
        <div class="training-categories">
          <button class="shortcut-card" id="training-reading">
            <strong>Lire et comprendre</strong><span>Les lectures du château ↗</span>
          </button>
          <button class="shortcut-card" id="training-words">
            <strong>Mon carnet de mots</strong><span>Retrouver les mots à travailler ↗</span>
          </button>
          <button class="shortcut-card" data-route="language">
            <strong>Français CM2</strong><span>Lire et écrire ↗</span>
          </button>
          <button class="shortcut-card" id="training-math-blocks">
            <strong>L’école des nombres</strong
            ><span>Droite, calcul, échanges et problèmes ↗</span></button
          ><button class="shortcut-card" data-route="math">
            <strong>Mathématiques CM2</strong><span>Nombres, calculs, mesures et géométrie ↗</span>
          </button>

          <button class="shortcut-card" id="training-games">
            <strong>Jeux et énigmes</strong><span>Choisir un jeu ↗</span>
          </button>
        </div>
      </section>
      <button class="quiet" id="training-coverage">Voir les domaines du programme CM2</button>
      <details class="story-drawer">
        <summary>Écouter une histoire</summary>
        <div class="story-buttons">
          ${['Mousse', 'Brindille', 'Plume', 'Nacre', 'Orion']
            .map((n, i) => `<button class="secondary" data-story="${i}">${n}</button>`)
            .join('')}
        </div>
      </details>`;
    main
      .querySelectorAll('[data-story]')
      .forEach((button) => (button.onclick = () => story(Number(button.dataset.story))));
    main
      .querySelectorAll('[data-route]')
      .forEach((button) => (button.onclick = () => category(button.dataset.route)));
    main
      .querySelectorAll('[data-recent]')
      .forEach((button) => (button.onclick = () => activity(button.dataset.recent)));
    main.querySelector('#training-math-blocks').onclick = () => onMath?.();
    main.querySelector('#training-reading').onclick = () => onRead?.();
    main.querySelector('#training-words').onclick = () => onWords?.();
    main.querySelector('#training-coverage').onclick = () => onCoverage?.();
    const games = main.querySelector('#training-games');
    if (games) games.onclick = () => onGames?.();
  }
  function category(route) {
    const labels = {
      language: ['Français CM2', 'Lire et écrire'],
      math: ['Nombres et calculs', 'Mathématiques'],
      world: ['Autres matières', 'Sciences, histoire, anglais et découvertes'],
    };
    const [title, subtitle] = labels[route];
    const workshops = WORKSHOPS.filter((workshop) => workshop.route === route);
    main.innerHTML = /* HTML */ `<div class="page-head">
        <button class="back" id="category-back" aria-label="Retour à l’entraînement">←</button>
        <div>
          <p class="eyebrow">S’entraîner</p>
          <h1>${title}</h1>
          <p class="subtle">${subtitle}. Choisis un atelier.</p>
        </div>
      </div>
      <section class="workshop-grid">
        ${workshops
          .map(
            (w) =>
              `<button class="workshop-card" data-workshop="${w.id}" style="--workshop:${w.color}"><span class="workshop-icon" aria-hidden="true">${w.icon}</span><h2>${w.name}</h2><p>${w.sub}</p><span class="quiet">Voir les compétences ↗</span></button>`,
          )
          .join('')}
      </section>`;
    main.querySelector('#category-back').onclick = home;
    main
      .querySelectorAll('[data-workshop]')
      .forEach((button) => (button.onclick = () => workshop(button.dataset.workshop)));
  }
  function workshop(id) {
    stopVoice();
    const w = WORKSHOPS.find((w) => w.id === id),
      all = ACTIVITIES.filter((a) => a.group === id),
      skillIds = [...new Set(all.map((activity) => activity.skill))];
    main.innerHTML = /* HTML */ `<div class="page-head">
        <button class="back" id="atelier-back" aria-label="Retour aux ateliers">←</button>
        <div>
          <p class="eyebrow">Un atelier du château</p>
          <h1>${w.name}</h1>
          <p class="subtle">${w.sub}. Choisis une compétence.</p>
        </div>
      </div>
      <div class="skill-list">
        ${skillIds
          .map((skillId) => {
            const activities = all.filter((activity) => activity.skill === skillId);
            const skill = SKILLS.find((entry) => entry.id === skillId);
            const tried = activities.some((activity) => state.learning.outcomes?.[activity.id]);
            return `<button class="activity-card" data-skill="${skillId}"><span><strong>${esc(skill?.label || activities[0]?.title || w.sub)}</strong><small>${tried ? 'Déjà essayé · tu peux y revenir' : 'À découvrir'}</small></span><span aria-hidden="true">↗</span></button>`;
          })
          .join('')}
      </div>`;
    main.querySelector('#atelier-back').onclick = () => category(w.route);
    main
      .querySelectorAll('[data-skill]')
      .forEach((button) => (button.onclick = () => skillView(button.dataset.skill)));
  }
  function skillView(skillId) {
    const all = ACTIVITIES.filter((activity) => activity.skill === skillId);
    const skill = SKILLS.find((entry) => entry.id === skillId);
    const workshopId = all[0]?.group;
    const workshopInfo = WORKSHOPS.find((entry) => entry.id === workshopId);
    const available = [...new Set(all.map((activity) => activity.tier))];
    state.learning.browseStages ??= {};
    let tier = state.learning.browseStages[skillId] ?? schoolTier(state.training, skillId);
    if (!available.includes(tier)) tier = available[0] ?? 0;
    const candidates = all.filter((activity) => activity.tier === tier);
    const nextActivity =
      candidates.find((activity) => !state.learning.completed.includes(activity.id)) ||
      [...candidates].sort((a, b) =>
        String(state.learning.outcomes?.[a.id]?.at || '').localeCompare(
          String(state.learning.outcomes?.[b.id]?.at || ''),
        ),
      )[0];
    const tried = candidates.filter((activity) => state.learning.outcomes?.[activity.id]).length;
    main.innerHTML = /* HTML */ `<div class="page-head">
        <button class="back" id="skill-back" aria-label="Retour aux compétences">←</button>
        <div>
          <p class="eyebrow">${esc(workshopInfo?.name || 'S’entraîner')}</p>
          <h1>${esc(skill?.label || nextActivity?.title || 'Une compétence')}</h1>
          <p class="subtle">Choisis ton palier, puis commence un exercice.</p>
        </div>
      </div>
      <div class="difficulty compact-stages" role="group" aria-label="Choisir un palier">
        ${[0, 1, 2, 3, 4, 5]
          .map(
            (stage) =>
              `<button data-skill-stage="${stage}" class="${stage === tier ? 'selected' : ''}" ${available.includes(stage) ? '' : 'disabled'}>${stage + 1}</button>`,
          )
          .join('')}
      </div>
      <article class="skill-start-card">
        <span class="eyebrow">Palier ${tier + 1} sur 6</span>
        <h2>
          ${esc(
            skill?.stages?.[tier] ||
              nextActivity?.stageLabel ||
              nextActivity?.title ||
              'Exercice court',
          )}
        </h2>
        <p>
          ${tried
            ? `${tried} exercice${tried > 1 ? 's' : ''} déjà essayé${tried > 1 ? 's' : ''} à ce palier.`
            : 'Un exercice court à découvrir.'}
        </p>
        <button class="primary" id="skill-start" ${nextActivity ? '' : 'disabled'}>
          Commencer l’exercice ↗
        </button>
      </article>`;
    main.querySelector('#skill-back').onclick = () => workshop(workshopId);
    main.querySelectorAll('[data-skill-stage]').forEach(
      (button) =>
        (button.onclick = () => {
          state.learning.browseStages[skillId] = Number(button.dataset.skillStage);
          save();
          skillView(skillId);
        }),
    );
    main.querySelector('#skill-start').onclick = () => activity(nextActivity.id);
  }
  function activity(id) {
    stopVoice();
    const a = ACTIVITY_BY_ID[id];
    if (a.type === 'guided') {
      const peers = ACTIVITIES.filter((entry) => entry.skill === a.skill && entry.tier === a.tier);
      const peerIndex = peers.findIndex((entry) => entry.id === (a.canonicalId || a.id));
      mountGuided(main, a, {
        state,
        save,
        speak,
        onPause:
          onPause || (() => renderLearningHub(main, { state, save, speak, story, stopVoice })),
        onBrowse: onBrowse || (() => skillView(a.skill)),
        onNext: onNext || (() => activity(peers[(peerIndex + 1) % peers.length].id)),
        onOutcome,
      });
      return;
    }
    const group = ACTIVITIES.filter((x) => x.group === a.group);
    let answered = false,
      revealed = false,
      reported = false,
      assisted = false,
      listened = false,
      chosen = new Set(),
      tens = 0,
      ones = 0;
    if (!state.learning.seen.includes(id)) state.learning.seen.push(id);
    save();
    main.innerHTML = /* HTML */ `<div class="page-head">
        <button class="back" id="activity-back" aria-label="Retour aux cartes">←</button>
        <div>
          <p class="eyebrow">
            ${WORKSHOPS.find((w) => w.id === a.group).name} · Palier ${a.tier + 1} sur 6
          </p>
          <h1>${a.title}</h1>
        </div>
        <button class="quiet" id="activity-stop" style="margin-left:auto">
          ☾ Quitter l’atelier
        </button>
      </div>
      <article class="learning-board">
        ${a.text ? `<p class="reading-passage">${esc(a.text)}</p>` : ''}${a.type === 'fact'
          ? `<div class="fact-art" aria-hidden="true">${a.id === 'facts-0' ? '☾' : a.id === 'facts-1' ? '❀' : '✧'}</div>`
          : ''}${a.prompt ? `<h2>${a.prompt}</h2>` : ''}${visualHTML(a.visual)}${a.document
          ? `<div class="table-scroll"><table class="school-table"><thead><tr>${a.document.headers.map((x) => `<th>${x}</th>`).join('')}</tr></thead><tbody>${a.document.rows.map((r) => `<tr>${r.map((x) => `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
          : ''}
        <div class="learning-controls">
          <button class="secondary" id="activity-audio">
            ♬ ${a.audioLang === 'en-GB' ? 'Écouter l’anglais' : 'Écouter'}</button
          >${a.type !== 'fact'
            ? '<button class="quiet" id="activity-hint">Une aide</button><button class="quiet" id="show-answer">Voir l’explication</button>'
            : ''}
        </div>
        ${a.type === 'mission'
          ? '<div class="mission-note">Une petite mission, à choisir avec un adulte. Tu peux la dire, la dicter ou simplement y réfléchir.</div><button class="secondary" id="mission-tried">J’ai essayé</button>'
          : ''}${['compose', 'fraction-build'].includes(a.type)
          ? '<div id="manipulative"></div><button class="secondary" id="check-build">Regarder ma réponse</button>'
          : ''}${a.type === 'text'
          ? '<form id="written-form"><label class="field">' +
            esc(a.responseLabel || 'Ta réponse') +
            '<input id="written-answer" type="text" autocorrect="off" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="200" enterkeyhint="done"></label><div class="written-accents" aria-label="Lettres et signes">' +
            ['é', 'è', 'ê', 'à', 'â', 'î', 'ï', 'ô', 'ù', 'û', 'ç', 'œ', '’']
              .map(
                (c) =>
                  '<button type="button" class="quiet" data-letter="' + c + '">' + c + '</button>',
              )
              .join('') +
            '</div><button class="primary" type="submit">Regarder ma réponse</button></form>'
          : ''}${a.type === 'operation'
          ? '<form id="operation-form"><div class="posed-operation" aria-label="Opération alignée"><div>' +
            esc(a.operation.top) +
            '</div><div><span>' +
            esc(a.operation.operator) +
            '</span>' +
            esc(a.operation.bottom) +
            '</div><hr></div><div class="operation-steps">' +
            a.operation.steps
              .map(
                (step, i) =>
                  '<label class="field">' +
                  esc(step.label) +
                  '<input data-operation-step="' +
                  i +
                  '" inputmode="decimal" autocomplete="off" aria-label="' +
                  esc(step.label) +
                  '"></label>',
              )
              .join('') +
            '</div><button class="primary" type="submit">Regarder mes étapes</button></form>'
          : ''}${a.type === 'numeric'
          ? '<label class="field">Ta réponse<input id="numeric-answer" inputmode="decimal" autocomplete="off"></label><button class="primary" id="numeric-check">Regarder ma réponse</button>'
          : ''}${a.options
          ? `<div class="answer-choices">${a.options.map((text, i) => `<button class="answer" data-answer="${i}">${esc(text)}</button>`).join('')}</div>`
          : ''}
        <p class="learning-hint" id="learning-hint" aria-live="polite"></p>
        <div id="learning-feedback" aria-live="polite"></div>
        <div class="learning-bottom">
          <button class="primary" id="activity-next" ${a.type === 'fact' ? '' : 'hidden'}>
            ${nextLabel
              ? nextLabel
              : onNext
              ? 'Poursuivre l’aventure'
              : a.type === 'fact'
                ? 'Une autre découverte'
                : 'Une autre carte'}
            ↗</button
          ><button class="quiet" id="activity-list">${listLabel || 'Retour à la compétence'}</button>
        </div>
        ${a.source
          ? `<p class="fact-source">Pour les curieux : <a href="${a.source.url}" target="_blank" rel="noopener">${a.source.label}</a></p>`
          : ''}
      </article>`;
    const readText = [
      a.text || '',
      a.audio || a.prompt || '',
      a.visual?.kind === 'fraction'
        ? `La bande comprend ${a.visual.parts} parts égales dont ${a.visual.lit} sont colorées.`
        : '',
      a.options ? 'Les propositions sont : ' + a.options.join(' ; ') : '',
    ]
      .filter(Boolean)
      .join(' ');
    main.querySelector('#activity-audio').onclick = () => {
      listened = true;
      speak(a.audio || readText, a.audioLang || 'fr-FR');
    };
    main.querySelector('#activity-back').onclick = () =>
      onBrowse ? onBrowse() : skillView(a.skill);
    main.querySelector('#activity-list').onclick = () =>
      onBrowse ? onBrowse() : skillView(a.skill);
    main.querySelector('#activity-stop').onclick = () => (onPause ? onPause() : home());
    const complete = (correct = null) => {
      if (!state.learning.completed.includes(a.id)) state.learning.completed.push(a.id);
      if (!reported && onOutcome) {
        reported = true;
        onOutcome({
          id: a.id,
          correct,
          assisted,
          listened,
          readingSupported: listened && a.group === 'sounds',
          revealed,
        });
      }
      save();
    };
    if (a.type === 'fact') complete();
    main.querySelector('#activity-next').onclick = () => {
      if (onNext) onNext({ skipped: !reported });
      else {
        const peers = group.filter((entry) => entry.skill === a.skill && entry.tier === a.tier);
        const peerIndex = peers.findIndex((entry) => entry.id === (a.canonicalId || a.id));
        activity(peers[(peerIndex + 1) % peers.length].id);
      }
    };
    if (a.type === 'fact') return;
    if (a.type === 'text') {
      main.querySelector('#written-form').onsubmit = (e) => {
        e.preventDefault();
        if (answered) return;
        const value = main.querySelector('#written-answer').value;
        if (!value.trim()) {
          main.querySelector('#learning-hint').textContent =
            'Écris ta réponse avant de la regarder.';
          return;
        }
        explain(typedCorrect(a, value));
      };
      main.querySelectorAll('[data-letter]').forEach(
        (b) =>
          (b.onclick = () => {
            const input = main.querySelector('#written-answer');
            const at = input.selectionStart ?? input.value.length,
              end = input.selectionEnd ?? at;
            input.value = input.value.slice(0, at) + b.dataset.letter + input.value.slice(end);
            input.focus();
            input.setSelectionRange?.(at + 1, at + 1);
          }),
      );
    }
    if (a.type === 'operation')
      main.querySelector('#operation-form').onsubmit = (e) => {
        e.preventDefault();
        if (answered) return;
        const values = [...main.querySelectorAll('[data-operation-step]')].map(
          (input) => input.value,
        );
        if (values.some((v) => !v.trim())) {
          main.querySelector('#learning-hint').textContent =
            'Complète chaque étape, ou ouvre une aide.';
          return;
        }
        explain(operationCorrect(a, values));
      };
    if (a.type === 'numeric')
      main.querySelector('#numeric-check').onclick = () => {
        const value = main.querySelector('#numeric-answer').value.trim();
        if (!value) {
          main.querySelector('#learning-hint').textContent =
            'Tu peux saisir un nombre ou découvrir l’explication.';
          return;
        }
        explain(isLearningCorrect(a, value));
      };
    if (a.type === 'mission') {
      main.querySelector('#mission-tried').onclick = () => explain(null);
    }
    main.querySelector('#activity-hint').onclick = () => {
      assisted = true;
      main.querySelector('#learning-hint').textContent =
        a.hint || 'Tu peux écouter la consigne, prendre ton temps et regarder l’explication.';
    };
    function explain(correct) {
      answered = true;
      state.learning.outcomes ??= {};
      state.learning.outcomes[a.id] = {
        kind:
          correct === true
            ? assisted || (listened && a.group === 'sounds')
              ? 'supported'
              : 'independent'
            : 'explored',
        listened,
        at: new Date().toISOString(),
      };
      main
        .querySelectorAll(
          '[data-part],[data-step],#check-build,#numeric-answer,#numeric-check,#written-form input,#written-form button,#operation-form input,#operation-form button',
        )
        .forEach((b) => (b.disabled = true));
      main.querySelectorAll('[data-answer]').forEach((b) => {
        b.disabled = true;
        if (a.options[Number(b.dataset.answer)] === a.answer) b.classList.add('correct');
      });
      main.querySelector('#learning-feedback').innerHTML = /* HTML */ `<div
          class="discovery-stamp"
          aria-hidden="true"
        >
          ✦
        </div>
        <div class="explanation">
          <strong
            >${correct === true
              ? 'Belle trouvaille !'
              : correct === null
                ? 'Une découverte de plus.'
                : revealed
                  ? 'Voici comment chercher.'
                  : esc(answerLine(false))}</strong
          >
          <p>
            ${a.type === 'text'
              ? 'Réponse attendue : <strong>' + esc(a.answer) + '</strong>. '
              : ''}${a.explanation}
          </p>
          ${a.type === 'operation'
            ? '<ul>' +
              a.operation.steps
                .map(
                  (step) =>
                    '<li>' +
                    esc(step.label) +
                    ' : <strong>' +
                    esc(String(step.answer).replace('.', ',')) +
                    '</strong></li>',
                )
                .join('') +
              '</ul>'
            : ''}
          <button class="quiet" id="read-explanation">♬ Écouter l’explication</button>
        </div>`;
      main.querySelector('#read-explanation').onclick = () => speak(a.explanation);
      main.querySelector('#activity-next').hidden = false;
      complete(correct);
    }
    function drawManipulative() {
      const holder = main.querySelector('#manipulative');
      if (!holder) return;
      if (a.type === 'fraction-build') {
        holder.innerHTML = /* HTML */ `<div class="fraction-band interactive" style="height:80px">
            ${Array.from(
              { length: a.parts },
              (_, i) =>
                `<button class="fraction-part ${chosen.has(i) ? 'filled' : ''}" data-part="${i}" aria-label="Morceau ${i + 1}" aria-pressed="${chosen.has(i)}"></button>`,
            ).join('')}
          </div>
          <p class="subtle">${chosen.size} part(s) colorée(s) sur ${a.parts}</p>`;
        holder.querySelectorAll('[data-part]').forEach(
          (b) =>
            (b.onclick = () => {
              if (answered) return;
              const i = Number(b.dataset.part);
              chosen.has(i) ? chosen.delete(i) : chosen.add(i);
              drawManipulative();
            }),
        );
      } else {
        holder.innerHTML = /* HTML */ `<div class="number-builder">
            ${[
              ['tens', 'Dizaines', tens],
              ['ones', 'Unités', ones],
            ]
              .map(
                ([kind, label, n]) =>
                  `<div><h3>${label}</h3><div class="stepper"><button data-step="${kind}:-1" aria-label="Retirer une ${kind === 'tens' ? 'dizaine' : 'unité'}">−</button><strong>${n}</strong><button data-step="${kind}:1" aria-label="Ajouter une ${kind === 'tens' ? 'dizaine' : 'unité'}">＋</button></div><div class="quantity-blocks" aria-label="${n} ${label.toLowerCase()}">${Array.from({ length: n }, () => `<i class="${kind}"></i>`).join('')}</div></div>`,
              )
              .join('')}
          </div>
          <p class="subtle">Tu as composé ${10 * tens + ones}.</p>`;
        holder.querySelectorAll('[data-step]').forEach(
          (b) =>
            (b.onclick = () => {
              if (answered) return;
              const [k, d] = b.dataset.step.split(':');
              if (k === 'tens') tens = Math.max(0, Math.min(9, tens + Number(d)));
              else ones = Math.max(0, Math.min(9, ones + Number(d)));
              drawManipulative();
            }),
        );
      }
    }
    if (['compose', 'fraction-build'].includes(a.type)) {
      drawManipulative();
      main.querySelector('#check-build').onclick = () =>
        explain(isLearningCorrect(a, a.type === 'compose' ? 10 * tens + ones : chosen.size));
    }
    main.querySelector('#show-answer').onclick = () => {
      assisted = true;
      revealed = true;
      explain(a.type === 'mission' ? null : false);
    };
    main.querySelectorAll('[data-answer]').forEach(
      (b) =>
        (b.onclick = () => {
          if (answered) return;
          explain(a.options[Number(b.dataset.answer)] === a.answer);
        }),
    );
  }
  if (initialId && ACTIVITY_BY_ID[initialId]) activity(initialId);
  else if (initialSkill && ACTIVITIES.some((a) => a.skill === initialSkill))
    skillView(initialSkill);
  else home();
}

export function isLearningCorrect(a, value) {
  if (a.type === 'text') return typedCorrect(a, value);
  if (a.type === 'operation') return operationCorrect(a, value);
  if (a.type === 'numeric') {
    const text = String(value).replace(/\s/g, '').replace(',', '.');
    return (
      text !== '' &&
      Number.isFinite(Number(text)) &&
      Math.abs(Number(text) - Number(a.answer.replace(',', '.'))) < 1e-6
    );
  }
  return ['compose', 'fraction-build'].includes(a.type) ? value === a.target : value === a.answer;
}

export function renderLearningActivity(main, ctx, id) {
  renderLearningHub(main, { ...ctx, initialId: id });
}
