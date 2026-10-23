import { WORD_DETAILS } from './reading-texts.mjs';
import {
  eventStamp,
  countWords,
  wordProgress,
  wordQueue,
  wordBook,
  spellingFeedback,
} from './training-state.mjs';
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const clock = () => performance.now();
const heading = (title, subtitle = '') =>
  '<div class="page-head activity-head"><button class="back" id="training-back" aria-label="Retour au plan">←</button><div><p class="eyebrow">L’école des mots</p><h1>' +
  esc(title) +
  '</h1>' +
  (subtitle ? '<p class="subtle">' + esc(subtitle) + '</p>' : '') +
  '</div><button class="quiet" id="training-pause">☾ Pause</button></div>';
function bindHead(main, ctx) {
  main.querySelector('#training-back').onclick = ctx.onExit;
  main.querySelector('#training-pause').onclick = ctx.onExit;
}
const leaveOption =
  '<details class="activity-options"><summary>Autre choix</summary><button class="quiet" id="training-skip">Garder cette étape pour plus tard</button></details>';
export function mountReading(main, ctx, text) {
  let started = null,
    duration = 0,
    eligible = false,
    question = 0,
    answers = [];
  const t = ctx.state.training,
    day = ctx.day;
  const p = () =>
    !ctx.free && ctx.state.training.plans[day]?.textId === text.id
      ? ctx.state.training.plans[day]
      : null;
  function remember(phase) {
    if (p())
      p().readingDraft = { textId: text.id, phase, duration, eligible, answers: [...answers] };
    ctx.save();
  }
  const used = () => t.starts.some((e) => e.textId === text.id);
  const q = (s) => main.querySelector(s);
  function shell(content, subtitle = '') {
    main.innerHTML =
      heading(text.title, subtitle) +
      '<article class="learning-board reading-work">' +
      content +
      '</article>' +
      leaveOption;
    bindHead(main, ctx);
    q('#training-skip').onclick = ctx.onSkip || ctx.onExit;
  }
  function entry() {
    shell(
      '<p>Lis le texte en silence. Quand tu as terminé, touche « J’ai fini ».</p><p class="subtle">' +
        (used()
          ? 'Ce texte est déjà ouvert : tu peux le relire librement.'
          : 'L’application garde une trace de tes essais pour suivre ton évolution avec un adulte.') +
        '</p><button class="primary" id="reading-start">Je commence</button>',
      text.genre === 'documentary' ? 'Un texte pour découvrir' : 'Une histoire à découvrir',
    );
    q('#reading-start').onclick = () => {
      eligible = !used() && ctx.state.trainingSettings.tracking;
      if (!used()) t.starts.push({ ...eventStamp(day), textId: text.id });
      if (p()) p().readingStarted = true;
      remember('reading');
      started = clock();
      shell(
        '<p class="reading-passage measured-passage" id="reading-text">' +
          esc(text.text) +
          '</p><button class="primary" id="reading-finished">J’ai fini</button>',
      );
      q('#reading-finished').onclick = () => {
        duration = Math.max(0, clock() - started);
        started = null;
        showQuestion();
      };
    };
  }
  function showQuestion() {
    remember('questions');
    const item = text.questions[question];
    shell(
      '<p class="eyebrow">Les indices de l’histoire</p><h2>' +
        esc(item.prompt) +
        '</h2><div class="answer-choices">' +
        item.options
          .map(
            (option, i) =>
              '<button class="answer" data-reading-answer="' + i + '">' + esc(option) + '</button>',
          )
          .join('') +
        '</div><p class="subtle">Choisis ce qui correspond au texte.</p>',
    );
    main.querySelectorAll('[data-reading-answer]').forEach((button) => {
      button.onclick = () => {
        ctx.onFeedback?.(Number(button.dataset.readingAnswer) === item.answer);
        answers.push({
          kind: item.kind,
          correct: Number(button.dataset.readingAnswer) === item.answer,
        });
        question++;
        if (question < text.questions.length) showQuestion();
        else finish();
      };
    });
  }
  function finish() {
    const record = {
      ...eventStamp(day),
      textId: text.id,
      level: text.level,
      words: countWords(text.text),
      duration: Math.round(duration),
      eligible,
      answers,
    };
    if (ctx.state.trainingSettings.tracking) t.readings.push(record);
    ctx.onReadingFinished?.(record);
    remember('finished');
    ctx.onStepFinished?.();
    // The child sees explanations, never a speed, ratio or percentage.
    shell(
      '<h2>Les indices se rejoignent</h2>' +
        text.questions
          .map((item) => '<p class="reading-explanation">' + esc(item.explanation) + '</p>')
          .join('') +
        '<button class="primary" id="reading-next">' +
        esc(ctx.nextLabel || 'Continuer vers les mots') +
        ' ↗</button>',
    );
    q('#reading-next').onclick = () => ctx.onDone(record);
  }
  const onVisibility = () => {
    if (document.hidden && started !== null) {
      eligible = false;
      started = null;
      remember('reading');
      shell(
        '<h2>Ta lecture t’attend.</h2><p>Reprends le texte quand tu veux.</p><button class="primary" id="reading-restart">Reprendre le texte</button>',
      );
      q('#reading-restart').onclick = entry;
    }
  };
  document.addEventListener('visibilitychange', onVisibility);
  const draft = p()?.readingDraft;
  if (
    draft?.textId === text.id &&
    draft.phase === 'questions' &&
    draft.answers.length < text.questions.length
  ) {
    answers = [...draft.answers];
    duration = draft.duration;
    eligible = draft.eligible;
    question = answers.length;
    showQuestion();
  } else entry();
  return () => {
    eligible = false;
    document.removeEventListener?.('visibilitychange', onVisibility);
  };
}

export function mountWordWork(main, ctx, { text, onlyWord = null } = {}) {
  const day = ctx.day,
    t = ctx.state.training;
  let timer = null,
    alive = true,
    judged = 0,
    wordIndex = 0,
    localQueue = null,
    phase = '';
  let responseStarted = 0,
    shownAt = 0,
    exposureActual = 0,
    currentWord = null,
    typed = '';
  const plan = () => (onlyWord || ctx.free ? null : ctx.state.training.plans[day]);
  const q = (s) => main.querySelector(s);
  const candidates = text?.words || [];
  function shell(title, content) {
    clearTimeout(timer);
    main.innerHTML =
      heading(title) +
      '<article class="learning-board word-work">' +
      content +
      '</article>' +
      leaveOption;
    bindHead(main, ctx);
    q('#training-skip').onclick = ctx.onSkip || ctx.onExit;
  }
  function judge() {
    phase = 'judgment';
    if (judged >= candidates.length || plan()?.judged || onlyWord) return startQueue();
    const word = candidates[judged];
    shell(
      'Les mots du texte',
      '<p>Ce mot te semble-t-il facile ou difficile à lire ?</p><p class="word-model">' +
        esc(word) +
        '</p><div class="judgment-buttons"><button class="secondary" id="word-easy">Facile pour moi</button><button class="secondary" id="word-hard">À travailler</button></div>',
    );
    const choose = (easy) => {
      t.judgments.push({ ...eventStamp(day), word, easy });
      judged++;
      ctx.save();
      judge();
    };
    q('#word-easy').onclick = () => choose(true);
    q('#word-hard').onclick = () => choose(false);
  }
  function startQueue() {
    if (plan()) {
      plan().judged = true;
      if (!plan().wordIds.length) plan().wordIds = wordQueue(t, candidates, day);
      localQueue = plan().wordIds.filter((word) => !plan().wordsDone.includes(word));
    } else localQueue = onlyWord ? [onlyWord] : wordQueue(t, candidates, day);
    localQueue = localQueue.filter((word) => WORD_DETAILS[word]);
    ctx.save();
    nextWord();
  }
  function nextWord() {
    if (!alive) return;
    phase = 'entry';
    currentWord = localQueue[wordIndex];
    if (!currentWord) return finish();
    shell(
      'Retrouve le mot',
      '<p>Un mot va apparaître. Regarde-le, puis retrouve-le parmi les propositions.</p>' +
        '<div class="flash-window" id="flash-window" aria-live="polite">✦</div><button class="primary" id="flash-start">Découvrir le mot</button>',
    );
    q('#flash-start').onclick = () => {
      phase = 'flash';
      const exposure = wordProgress(t, currentWord, day).exposure;
      shownAt = clock();
      q('#flash-window').textContent = currentWord;
      q('#flash-start').hidden = true;
      timer = setTimeout(() => {
        if (!alive) return;
        exposureActual = clock() - shownAt;
        if (document.hidden || exposureActual > exposure + 300) return nextWord();
        showOptions(exposure);
      }, exposure);
    };
  }
  function showOptions(exposure) {
    phase = 'options';
    const details = WORD_DETAILS[currentWord];
    const rotate =
      (t.wordEvents.filter((e) => e.word === currentWord).length + wordIndex + day.charCodeAt(9)) %
      4;
    const options = details.options.slice(rotate).concat(details.options.slice(0, rotate));
    shell(
      'Retrouve le mot',
      '<div class="flash-window" aria-hidden="true">✦</div><div class="answer-choices">' +
        options
          .map(
            (word, i) =>
              '<button class="answer" data-flash-answer="' + i + '">' + esc(word) + '</button>',
          )
          .join('') +
        '</div>',
    );
    responseStarted = clock();
    main.querySelectorAll('[data-flash-answer]').forEach((button) => {
      button.onclick = () => {
        const rt = Math.max(0, clock() - responseStarted),
          correct = options[Number(button.dataset.flashAnswer)] === currentWord;
        ctx.onFeedback?.(correct);
        t.wordEvents.push({
          ...eventStamp(day),
          word: currentWord,
          kind: 'flash',
          correct,
          rt: ctx.state.trainingSettings.tracking ? rt : 0,
          exposure,
          fast:
            ctx.state.trainingSettings.tracking &&
            correct &&
            exposure <= 1000 &&
            rt <= ctx.state.trainingSettings.flashFast,
          errors: [],
        });
        ctx.save();
        learn();
      };
    });
  }
  function learn() {
    phase = 'learn';
    const d = WORD_DETAILS[currentWord];
    const focus =
      d.focus && currentWord.includes(d.focus)
        ? esc(currentWord).replace(
            esc(d.focus),
            '<mark class="grapheme">' + esc(d.focus) + '</mark>',
          )
        : esc(currentWord);
    const canDictate = ctx.hasFrenchVoice();
    shell(
      'Regarder, puis écrire',
      '<p class="word-model">' +
        focus +
        '</p><p class="syllable-model">' +
        d.syllables.map(esc).join(' · ') +
        '</p><p>Observe le mot. Quand tu es prête, cache-le et écris-le en l’écoutant.</p>' +
        (canDictate
          ? '<button class="secondary" id="word-listen">♬ Écouter le mot</button><button class="primary" id="dictation-start">Cacher et écrire</button>'
          : '<p class="voice-note">La dictée a besoin d’une voix française locale sur cet appareil. Un adulte peut la vérifier dans les réglages de voix.</p><button class="secondary" id="voice-retry">Vérifier les voix</button><button class="primary" id="word-continue">Continuer sans dictée</button>'),
    );
    if (canDictate) {
      q('#word-listen').onclick = () => ctx.speak(currentWord);
      q('#dictation-start').onclick = () => {
        typed = '';
        dictation();
      };
    } else {
      q('#voice-retry').onclick = learn;
      q('#word-continue').onclick = advance;
    }
  }
  function dictation() {
    phase = 'dictation';
    const d = WORD_DETAILS[currentWord],
      tiles = ctx.state.trainingSettings.tiles;
    shell(
      'Écris le mot entendu',
      '<button class="secondary" id="dictation-listen">♬ Réécouter</button><form id="dictation-form">' +
        '<label class="field">Le mot<input id="dictation-input" type="text" value="" autocorrect="off" autocomplete="off" autocapitalize="off" spellcheck="false" ' +
        (tiles ? 'readonly inputmode="none"' : '') +
        '></label>' +
        (tiles
          ? '<div class="letter-keyboard" role="group" aria-label="Lettres et graphies">' +
            [
              ...'abcdefghijklmnopqrstuvwxyzàâéèêëîïôùûüçœ',
              'eau',
              'ou',
              'an',
              'on',
              'en',
              'ch',
              'gn',
              'ill',
              'ph',
            ]
              .map(
                (letter) =>
                  '<button type="button" data-letter="' + letter + '">' + letter + '</button>',
              )
              .join('') +
            '<button type="button" id="letter-back" aria-label="Effacer la dernière lettre">⌫</button></div>'
          : '') +
        '<button class="primary" type="submit" id="dictation-check">Comparer avec le mot</button></form><p id="dictation-notice" role="status"></p>',
    );
    const listen = () => {
      if (!ctx.hasFrenchVoice()) {
        learn();
        return;
      }
      ctx.speak(currentWord + '. ' + d.sentence + '. ' + currentWord + '.');
    };
    q('#dictation-listen').onclick = listen;
    main.querySelectorAll('[data-letter]').forEach((button) => {
      button.onclick = () => {
        typed = (typed + button.dataset.letter).slice(0, 40);
        q('#dictation-input').value = typed;
      };
    });
    if (tiles)
      q('#letter-back').onclick = () => {
        typed = typed.slice(0, -1);
        q('#dictation-input').value = typed;
      };
    responseStarted = clock();
    listen();
    q('#dictation-form').onsubmit = (e) => {
      e.preventDefault();
      typed = q('#dictation-input').value;
      if (!typed.trim()) {
        q('#dictation-notice').textContent = 'Écris un mot, ou garde cette étape pour plus tard.';
        return;
      }
      const accepted = (d.acceptedSpellings || []).some(
        (word) =>
          word.toLocaleLowerCase('fr') === typed.trim().normalize('NFC').toLocaleLowerCase('fr'),
      );
      const feedback = accepted
        ? { correct: true, errors: [], message: 'Cette orthographe est également admise.' }
        : spellingFeedback(currentWord, typed, d.focus);
      t.wordEvents.push({
        ...eventStamp(day),
        word: currentWord,
        kind: 'dictation',
        correct: feedback.correct,
        rt: ctx.state.trainingSettings.tracking ? Math.max(0, clock() - responseStarted) : 0,
        exposure: 1000,
        fast: false,
        errors: feedback.errors,
      });
      ctx.stopVoice();
      ctx.save();
      ctx.onFeedback?.(feedback.correct);
      shell(
        'Le mot et son écriture',
        '<p class="subtle">Ton essai : ' +
          esc(typed) +
          '</p><p class="word-model">' +
          esc(currentWord) +
          '</p><p>' +
          esc(feedback.message) +
          '</p><button class="primary" id="word-continue">Continuer ↗</button>',
      );
      q('#word-continue').onclick = advance;
    };
  }
  function advance() {
    if (plan() && !plan().wordsDone.includes(currentWord)) plan().wordsDone.push(currentWord);
    wordIndex++;
    ctx.save();
    nextWord();
  }
  function finish() {
    phase = 'done';
    ctx.onStepFinished?.();
    shell(
      'Les mots font leur chemin',
      '<p>Ton carnet garde les mots à retrouver une autre fois.</p><button class="primary" id="words-next">' +
        esc(ctx.nextLabel || 'Continuer') +
        ' ↗</button>',
    );
    q('#words-next').onclick = ctx.onDone;
  }
  const onVisibility = () => {
    if (!document.hidden || !['flash', 'options', 'dictation'].includes(phase)) return;
    clearTimeout(timer);
    ctx.stopVoice();
    shell(
      'Le mot t’attend',
      '<p>Reprends quand tu es prête.</p><button class="primary" id="word-resume">Reprendre</button>',
    );
    q('#word-resume').onclick = () => (phase === 'dictation' ? learn() : nextWord());
  };
  document.addEventListener('visibilitychange', onVisibility);
  if (!text && !onlyWord) startQueue();
  else judge();
  return () => {
    alive = false;
    clearTimeout(timer);
    ctx.stopVoice();
    document.removeEventListener?.('visibilitychange', onVisibility);
  };
}

export function renderWordBook(main, ctx) {
  const book = wordBook(ctx.state.training, ctx.day);
  main.innerHTML =
    heading('Mon carnet de mots') +
    '<section class="word-book"><h2>À retrouver</h2><div class="word-chips">' +
    (book.active.length
      ? book.active
          .map(
            (p) =>
              '<button class="secondary" data-book-word="' +
              esc(p.word) +
              '">' +
              esc(p.word) +
              '</button>',
          )
          .join('')
      : '<p>Les mots que tu choisiras viendront se poser ici.</p>') +
    '</div><h2>Les mots gagnés</h2><div class="word-chips">' +
    (book.won.length
      ? book.won
          .map(
            (p) =>
              '<button class="word-won" data-book-word="' +
              esc(p.word) +
              '">✦ ' +
              esc(p.word) +
              '</button>',
          )
          .join('')
      : '<p>Ils arriveront après plusieurs retrouvailles.</p>') +
    '</div></section>';
  bindHead(main, ctx);
  main.querySelectorAll('[data-book-word]').forEach((button) => {
    button.onclick = () => ctx.onWord(button.dataset.bookWord);
  });
}
