import { normalizeWrittenAnswer } from './deep-practice.mjs';
export const STARTER_TASKS = [
  { id: 'facts-a', block: 'facts', prompt: 'Calcule 6 × 7.', answer: '42', numeric: true },
  {
    id: 'place-a',
    block: 'place',
    prompt: 'Dans 40 608, quelle est la valeur du chiffre 6 ?',
    answer: '600',
    numeric: true,
  },
  {
    id: 'language-a',
    block: 'language',
    prompt: 'Écris le mot manquant : « Les élèves … deux livres chacun. »',
    answer: 'ont',
  },
  {
    id: 'line-a',
    block: 'line',
    prompt: 'Écris sous forme décimale : 7/10.',
    answer: '0,7',
    numeric: true,
  },
  {
    id: 'bars-a',
    block: 'bars',
    prompt: 'Lina a 3 boîtes de 8 plumes et 5 plumes seules. Combien de plumes a-t-elle ?',
    answer: '29',
    numeric: true,
  },
  { id: 'facts-b', block: 'facts', prompt: 'Calcule 63 ÷ 9.', answer: '7', numeric: true },
  {
    id: 'language-b',
    block: 'language',
    prompt: 'Lina a deux gants qui lui appartiennent. Complète : « Elle range … gants. »',
    answer: 'ses',
  },
  {
    id: 'place-b',
    block: 'place',
    prompt: 'Écris en chiffres : quatre-vingt-dix-sept mille trois cent huit.',
    answer: '97308',
    numeric: true,
  },
  {
    id: 'line-b',
    block: 'line',
    prompt: 'Lequel est le plus grand : 4,07 ou 4,7 ? Écris ce nombre.',
    answer: '4,7',
    numeric: true,
  },
  {
    id: 'bars-b',
    block: 'bars',
    prompt: 'Trois fioles identiques coûtent 12 €. Combien coûtent cinq fioles identiques ?',
    answer: '20',
    numeric: true,
  },
];
export function starterCorrect(task, value) {
  if (task.numeric) {
    const parse = (s) => Number(String(s).replace(/\s/g, '').replace(',', '.'));
    return String(value).trim() !== '' && parse(value) === parse(task.answer);
  }
  return normalizeWrittenAnswer(value) === normalizeWrittenAnswer(task.answer);
}
export function starterSuggestion(outcomes, settings) {
  const mathStarts = { ...settings.mathStarts };
  for (const block of ['facts', 'place', 'line', 'bars']) {
    const trials = outcomes.filter((e) => e.block === block && e.correct !== null);
    if (trials.length !== 2) continue;
    const good = trials.filter((e) => e.correct).length;
    mathStarts[block] = good === 2 ? (block === 'facts' ? 4 : 3) : good === 1 ? 2 : 1;
  }
  const language = outcomes.filter((e) => e.block === 'language' && e.correct !== null);
  return {
    mathStarts,
    languageStart:
      language.length === 2 ? (language.every((e) => e.correct) ? 1 : 0) : settings.languageStart,
  };
}
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
export function mountPositioning(main, ctx) {
  let index = 0;
  const outcomes = [];
  function draw() {
    const task = STARTER_TASKS[index];
    main.innerHTML =
      '<div class="page-head"><button id="starter-exit" class="back" aria-label="Retour">←</button><div><p class="eyebrow">Chercher mon point de départ · ' +
      (index + 1) +
      ' sur ' +
      STARTER_TASKS.length +
      '</p><h1>Une petite recherche</h1></div></div><article class="learning-board"><p>Tu peux passer une question si tu ne sais pas encore.</p><h2>' +
      esc(task.prompt) +
      '</h2><button id="starter-audio" class="quiet">♬ Écouter</button><form id="starter-form"><label class="field">Ta réponse<input id="starter-answer" ' +
      (task.numeric ? 'inputmode="decimal"' : '') +
      ' autocorrect="off" autocomplete="off" autocapitalize="off" spellcheck="false"></label><p id="starter-hint" role="status"></p><button class="primary" type="submit">Continuer ↗</button></form><button id="starter-skip" class="quiet">Je ne sais pas encore</button></article>';
    main.querySelector('#starter-exit').onclick = ctx.onCancel;
    main.querySelector('#starter-audio').onclick = () => ctx.speak(task.prompt);
    let answered = false;
    const advance = (correct) => {
      if (answered) return;
      answered = true;
      outcomes.push({ id: task.id, block: task.block, correct });
      index++;
      if (index < STARTER_TASKS.length) draw();
      else {
        main.innerHTML =
          '<div class="page-head"><h1>Les recherches sont terminées</h1></div><p>Un adulte peut choisir les points de départ à essayer.</p><button id="starter-return" class="primary">Revenir au château</button>';
        main.querySelector('#starter-return').onclick = ctx.onCancel;
        ctx.onDone(outcomes);
      }
    };
    main.querySelector('#starter-skip').onclick = () => advance(null);
    main.querySelector('#starter-form').onsubmit = (e) => {
      e.preventDefault();
      const value = main.querySelector('#starter-answer').value;
      if (!value.trim()) {
        main.querySelector('#starter-hint').textContent =
          'Écris une réponse ou choisis « Je ne sais pas encore ».';
        return;
      }
      advance(starterCorrect(task, value));
    };
  }
  draw();
}
