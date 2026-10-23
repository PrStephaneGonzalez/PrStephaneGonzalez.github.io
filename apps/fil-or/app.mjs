import { mountPositioning, starterSuggestion } from './positioning.mjs';
import {
  LANGUAGE_TARGETS,
  MATH_TARGETS,
  assignDailyPractice,
  dailyLanguage,
} from './daily-practice.mjs';
import { MATH_BLOCKS, blockById, selectMathBlock, suggestedTier } from './math-core.mjs';
import { mountMath } from './math-ui.mjs';
import { reconcileAcademy, SPELLS, RANKS } from './academy.mjs';
import { apprentice, magicSchool } from './academy-art.mjs';
import { reconcileCollection, awardTreasure, costumeProfile, treasureArt } from './treasures.mjs';
import { roomAccess, roomById } from './academy-rooms.mjs';
import { renderCastleRoom } from './castle-map.mjs';
import { worldMapHTML, bindWorldMap, GAME_SPOTS, gameProgress, worldProgress } from './world-map.mjs';
import { storyStatus } from './story.mjs';
import { renderStoryBook } from './story-ui.mjs';
import { TEXTS, TEXT_LEVELS } from './reading-texts.mjs';
import { mountReading, mountWordWork, renderWordBook } from './reading-ui.mjs';
import {
  calendarDay,
  planForDay,
  nextPlanStep,
  choosePlanGame,
  finishPlanStep,
  eventStamp,
  wordBook,
} from './training-state.mjs';
import { reportHTML, observationsCSV } from './training-parent.mjs';
import { coverageHTML } from './cm2-coverage.mjs';
import { createSync, snapshot, mergeProgress } from './sync.mjs';
import { supabaseFetcher } from './supabase-progress.mjs';
import { createTravelLink, travelCodeFromLink } from './travel-link.mjs';
import { GUIDED_SKILLS } from './guided-data.mjs';
import {
  COLORS,
  SYMBOLS,
  clone,
  flowMove,
  pour,
  turnCircuit,
  circuitReach,
  guidedCircuit,
  LEVELS,
  BY_ID,
  roomIds as baseRoomIds,
  levelMode,
  levelRoom,
  initialBoard,
  isSolved,
  restore,
} from './engine.mjs';
import { ROOMS, animal } from './art.mjs';
import { takeIntro, successMessage } from './messages.mjs';
import { renderLearningHub, renderLearningActivity } from './learning.mjs';
import { ACTIVITIES, ACTIVITY_BY_ID } from './catalog.mjs';
import {
  EXTRA_LEVELS,
  EXTRA_BY_ID,
  EXTRA_NAMES,
  EXTRA_ICONS,
  restoreExtras,
} from './extra-games.mjs';
import { mountExtra } from './extra-ui.mjs';
import { makeJourneyCatalog, finishStep, adjustStage, STAGE_LABELS } from './journey.mjs';
const $ = (s) => document.querySelector(s),
  main = $('#main'),
  modal = $('#modal'),
  KEY = 'fil-or-v1';
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
let storageOK = true,
  state;
try {
  state = restore(JSON.parse(localStorage.getItem(KEY)));
} catch {
  state = restore(null);
  storageOK = false;
}
reconcileAcademy(state);
reconcileCollection(state);
state.extraBoards = restoreExtras(state.extraBoards);
state.extraCompleted = state.extraCompleted.filter((id) => EXTRA_BY_ID[id]);
const JOURNEY_CATALOG = makeJourneyCatalog(LEVELS, EXTRA_LEVELS, ACTIVITIES);
let incomingTravelCode = typeof location === 'undefined' ? null : travelCodeFromLink(location.hash);
if (incomingTravelCode && typeof window.history?.replaceState === 'function')
  window.history.replaceState(null, '', location.pathname + location.search);
let cloud,
  offlineLabel = '',
  screenCleanup = null,
  dailyGame = null,
  gameClock = null;
let pendingTreasure = null;
function wizardProfile() {
  const wizard = reconcileAcademy(state);
  reconcileCollection(state);
  return { ...wizard, outfit: costumeProfile(state.collection, wizard.level) };
}
function showTreasure(item, inDialog = false) {
  pendingTreasure = inDialog ? { item, until: performance.now() + 5000 } : null;
  toast(item.name + ' · ' + item.rarity + ' — dans ta collection');
}
function clearScreen() {
  screenCleanup?.();
  screenCleanup = null;
  stopGameTime();
}
function updateSaveStatus(label = cloud?.status || 'Sur cet appareil') {
  const el = $('#cloud-status');
  if (el)
    el.textContent = !storageOK
      ? 'Sauvegarde indisponible sur cet appareil'
      : label + (offlineLabel ? ' · ' + offlineLabel : '');
}
function hasFrenchVoice() {
  return !!window.speechSynthesis
    ?.getVoices()
    .some((voice) => voice.localService && voice.lang.toLowerCase().startsWith('fr'));
}
function stopGameTime() {
  if (!gameClock) return;
  const duration =
    gameClock.elapsed + (gameClock.start === null ? 0 : performance.now() - gameClock.start);
  if (state.trainingSettings.tracking && duration > 0) {
    state.training.games.push({ ...eventStamp(gameClock.day), gameId: gameClock.id, duration });
    save();
  }
  gameClock = null;
}
function beginGameTime(id) {
  stopGameTime();
  gameClock = {
    id,
    rewardId: eventStamp().id,
    day: calendarDay(),
    start: performance.now(),
    elapsed: 0,
  };
}
function completeDailyGame(id) {
  if (dailyGame?.id === id) finishPlanStep(state.training, dailyGame.day, 'game');
  dailyGame = null;
  stopGameTime();
  save();
}
cloud = createSync({
  fetcher: supabaseFetcher(),
  getState: () => state,
  apply: (progress, { replace = false } = {}) => {
    const local = {
      settings: state.settings,
      trainingSettings: state.trainingSettings,
      pin: state.pin,
      notes: state.notes,
    };
    const restored = restore({ ...progress, ...local });
    if (replace) {
      clearScreen();
      state = restored;
      reconcileAcademy(state);
      reconcileCollection(state);
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
      } catch {}
      return;
    }
    const drafts = state.learning.drafts || {};
    Object.assign(drafts, restored.learning.drafts || {});
    restored.learning.drafts = drafts;
    Object.assign(state.learning, restored.learning);
    restored.learning = state.learning;
    if (activeJourney && (view === 'play' || view === 'learning-play'))
      restored.journey.current = { ...activeJourney };
    if (state.training) {
      const math = state.training.math,
        incoming = restored.training.math;
      for (const [id, record] of Object.entries(incoming.sessions)) {
        if (math.sessions[id]) Object.assign(math.sessions[id], record);
        else math.sessions[id] = record;
      }
      incoming.sessions = math.sessions;
      Object.assign(math, incoming);
      restored.training.math = math;
      if (view === 'daily-play' || dailyGame) {
        const day = calendarDay(),
          active = state.training.plans[day],
          remote = restored.training.plans[day];
        if (active) {
          if (remote?.id === active.id) Object.assign(active, remote);
          restored.training.plans[day] = active;
        }
      }
      Object.assign(state.training, restored.training);
      restored.training = state.training;
    }
    Object.assign(state, restored);
    reconcileAcademy(state);
    reconcileCollection(state);
    state.extraBoards = restoreExtras(state.extraBoards);
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  },
  onStatus: (label) => {
    updateSaveStatus(label);
  },
});
let activeJourney = null,
  journeyAssisted = false;
let guestSession = false;
let view = 'castle',
  trainingGame = false,
  room = 0,
  current = null,
  board = null,
  history = [],
  active = -1,
  selected = -1,
  hint = false,
  hintTiles = [],
  worker = null,
  toastTimer;
let introCount = 0;
const roomIds = (r) => baseRoomIds(r, state.settings.difficulty);
const roomFound = (r) => state.completed.some((id) => BY_ID[id] && levelRoom(BY_ID[id]) === r);
const modeNames = ['Découverte', 'Aventure', 'Défi'];
function difficultyHTML() {
  return `<div class="difficulty" role="group" aria-label="Difficulté des énigmes"><span class="difficulty-label">Niveau des énigmes</span>${modeNames.map((n, i) => `<button data-mode="${i}" class="${state.settings.difficulty === i ? 'selected' : ''}" aria-pressed="${state.settings.difficulty === i}">${n}</button>`).join('')}</div>`;
}
function bindDifficulty(render) {
  main.querySelectorAll('[data-mode]').forEach(
    (b) =>
      (b.onclick = () => {
        state.settings.difficulty = Number(b.dataset.mode);
        save();
        render();
      }),
  );
}
const typeName = {
  ...EXTRA_NAMES,
  flow: 'Les fils de lumière',
  potion: 'Les potions enchantées',
  circuit: 'Les circuits magiques',
};
const typeIcon = { flow: '⌁', potion: '⚗', circuit: '✧' };
const rules = {
  flow: 'Relie les symboles identiques, sans croiser les fils. Tu peux glisser ou toucher les cases une par une. Les cases vides peuvent le rester.',
  potion:
    'Touche une fiole, puis une autre pour verser. Verse sur la même couleur, ou dans une fiole vide. Rassemble chaque couleur dans sa fiole.',
  circuit:
    'Touche les tuiles pour les tourner. Relie le soleil à toutes les étoiles. Les tuiles marquées d’un soleil ou d’une étoile sont fixes ; tourne les autres. Plusieurs chemins sont possibles.',
};
let storyWasReady = null;
function storyReady() {
  try {
    const wp = worldProgress(state);
    return storyStatus(state.story, { ...wp, games: wp.gamesPlayed }).ready;
  } catch {
    return false;
  }
}
function save() {
  const previous = new Set(state.academy?.unlocked || []);
  const before = new Set(state.collection?.earned.map((e) => e.id) || []);
  reconcileAcademy(state);
  const treasures = reconcileCollection(state);
  if (state.collection.earned.some((e) => !before.has(e.id))) showTreasure(treasures.latest);
  if (
    ['daily-play', 'math-play', 'word-play', 'reading-play', 'learning-play'].includes(view) &&
    state.academy.unlocked.some((mark) => !previous.has(mark))
  )
    playCue('unlock');
  const ready = storyReady();
  if (ready && storyWasReady === false)
    setTimeout(() => toast('📜 Un nouveau chapitre de l’histoire t’attend à l’école !'), 2600);
  storyWasReady = ready;
  cloud?.changed();
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    storageOK = true;
  } catch {
    storageOK = false;
    updateSaveStatus();
  }
}
function toast(t) {
  $('#toast').textContent = t;
  $('#toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => document.querySelector('#toast')?.classList.remove('show'), 3600);
}
function applySettings() {
  document.documentElement.style.setProperty('--size', state.settings.font);
  document.documentElement.style.setProperty(
    '--spacing',
    state.settings.spacing ? '.045em' : '0em',
  );
  document.body.classList.toggle('no-motion', !state.settings.motion);
  document.body.classList.toggle('high-contrast', state.settings.contrast);
}
function stopVoice() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}
function speak(t, lang = 'fr-FR') {
  if (!('speechSynthesis' in window)) {
    toast('La lecture audio n’est pas disponible ici.');
    return;
  }
  const voices = speechSynthesis
    .getVoices()
    .filter((v) => v.lang.startsWith(lang.slice(0, 2)) && v.localService);
  if (!voices.length) {
    toast(
      'La voix locale pour cette langue n’est pas disponible. Tu peux lire la carte ou vérifier les réglages de l’appareil.',
    );
    return;
  }
  stopVoice();
  const u = new SpeechSynthesisUtterance(t);
  u.lang = lang;
  u.voice = voices[0];
  u.rate = 0.86;
  speechSynthesis.speak(u);
}
let audio;
function chime() {
  playCue('success');
}
let lastUnlockCue = 0;
function playCue(kind) {
  if (!state.settings.sound) return;
  if (kind !== 'unlock' && performance.now() - lastUnlockCue < 500) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    void audio.resume();
    if (kind === 'unlock') lastUnlockCue = performance.now();
    const notes = kind === 'unlock' ? [523, 659, 784] : kind === 'retry' ? [392, 349] : [523, 659];
    notes.forEach((frequency, i) => {
      const o = audio.createOscillator(),
        g = audio.createGain(),
        t = audio.currentTime + i * (kind === 'unlock' ? 0.14 : 0.09);
      o.type = 'sine';
      o.frequency.value = frequency;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(kind === 'retry' ? 0.012 : 0.025, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (kind === 'unlock' ? 0.42 : 0.24));
      o.connect(g);
      g.connect(audio.destination);
      o.start(t);
      o.stop(t + (kind === 'unlock' ? 0.45 : 0.26));
    });
  } catch {}
}
function setNav(name) {
  document
    .querySelectorAll('.navbtn')
    .forEach((b) => b.classList.toggle('active', b.id === `nav-${name}`));
}
function cancelHint() {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}
function navigate(name, r = room) {
  clearScreen();
  dailyGame = null;
  activeJourney = null;
  trainingGame = false;
  stopVoice();
  cancelHint();
  if (modal.open) modal.close();
  view = name;
  room = r;
  active = -1;
  selected = -1;
  current = null;
  history = [];
  setNav(name === 'progress' ? 'progress' : name === 'library' ? 'library' : 'castle');
  if (name === 'castle') renderCastle();
  if (name === 'progress') renderProgress();
  if (name === 'room') renderRoom();
  if (name === 'friends') renderFriends();
  if (name === 'library') renderLibrary();
  if (name === 'pause') renderPause();
  window.scrollTo({ top: 0, behavior: 'instant' });
  main.focus({ preventScroll: true });
}
const allowed = (l) => !state.settings.disabled.includes(l.type);
function nextLevel() {
  return (
    LEVELS.find(
      (l) =>
        allowed(l) && levelMode(l) === state.settings.difficulty && !state.completed.includes(l.id),
    ) || LEVELS.find((l) => allowed(l) && levelMode(l) === state.settings.difficulty)
  );
}
function mathStartFor(block) {
  return state.trainingSettings.mathStarts?.[block] ?? state.trainingSettings.mathStart;
}
function skillTier(skillId) {
  const tier = state.journey.stats?.[skillId]?.tier ?? state.journey.startTier ?? 0;
  return Math.max(0, Math.min(5, Number(tier) || 0));
}
function currentDayPlan(restart = false) {
  let maths = ACTIVITIES.filter(
    (a) =>
      a.type === 'guided' &&
      a.route === 'math' &&
      state.journey.focusSkills.includes(a.skill) &&
      a.tier === skillTier(a.skill),
  );
  if (!maths.length)
    maths = ACTIVITIES.filter(
      (a) => a.type === 'guided' && a.route === 'math' && a.tier === skillTier(a.skill),
    );
  const games = JOURNEY_CATALOG.filter(
    (a) => a.kind === 'game' && a.tier === 0 && !state.settings.disabled.includes(a.type),
  );
  const day = calendarDay();
  const plan = assignDailyPractice(
    state,
    planForDay(
      state.training,
      { texts: TEXTS, maths, games, restart, level: state.trainingSettings.readingLevel },
      day,
    ),
  );
  if (
    plan.gameId &&
    !games.some((g) => g.id === plan.gameId) &&
    state.settings.disabled.includes((BY_ID[plan.gameId] || EXTRA_BY_ID[plan.gameId])?.type)
  )
    plan.gameId = games[0]?.id || null;
  if (plan.mathMode !== 'school' && (!plan.mathBlock || !Number.isInteger(plan.mathTier))) {
    plan.mathBlock = selectMathBlock(state.training.math, day);
    plan.mathTier = suggestedTier(
      state.training.math,
      plan.mathBlock,
      mathStartFor(plan.mathBlock),
    );
  }
  save();
  return plan;
}
function renderCastle() {
  const wizard = wizardProfile();
  const plan = currentDayPlan(),
    step = nextPlanStep(plan);
  const text = TEXTS.find((t) => t.id === plan.textId);
  const math = ACTIVITY_BY_ID[plan.mathId];
  const names = {
    reading: 'Lire une histoire',
    words: plan.languageId ? 'Mots et phrase du jour' : 'Les mots du carnet',
    math: 'Une étape de maths',
    game: 'Un jeu au choix',
  };
  const details = {
    reading: text?.title || 'Une lecture libre',
    words: plan.languageId
      ? 'Ton carnet · ' + (dailyLanguage(plan)?.title || 'Une courte phrase')
      : 'Des mots à découvrir et à retrouver',
    math: plan.mathBlock
      ? blockById(plan.mathBlock).label + ' · ' + blockById(plan.mathBlock).tiers[plan.mathTier]
      : math?.stageLabel || math?.title || 'Des nombres à explorer',
    game: typeName[(BY_ID[plan.gameId] || EXTRA_BY_ID[plan.gameId])?.type] || 'Choisir une énigme',
  };
  main.innerHTML =
    '<section class="hero school-home"><div class="hero-copy"><p class="eyebrow">' +
    (cloud.profile ? esc(cloud.profile.name) + ' · Ton plan du jour' : 'Ton plan du jour') +
    '</p><h1>' +
    (step ? 'Bienvenue à<br /><em>l’école de magie.</em>' : 'Une belle journée à l’école.') +
    '</h1><p class="subtle">Explore les quatre univers ou suis ta séance du jour.</p><div class="hero-actions"><button class="primary" id="enter-map">Ouvrir la carte du monde ↗</button><button class="secondary" id="start">' +
    (step
      ? plan.done.length || plan.readingStarted
        ? 'Reprendre ma séance'
        : 'Commencer ma séance'
      : 'Commencer une nouvelle séance') +
    ' ↗</button></div></div><div class="hero-picture academy-scene">' +
    magicSchool() +
    '<div class="scene-apprentice">' +
    apprentice(wizard.outfit.level) +
    '</div><button id="wizard-profile" class="wizard-nameplate"><span>Niveau ' +
    wizard.level +
    ' · Mon apprentie</span><strong>' +
    esc(wizard.name) +
    '</strong><small>Voir mes pouvoirs ↗</small></button>' +
    '</div></section>' +
    '<section class="daily-plan" aria-label="Les quatre étapes du jour">' +
    ['reading', 'words', 'math', 'game']
      .map((key, i) => {
        const done = plan.done.includes(key),
          skipped = plan.skipped.includes(key);
        return (
          '<button class="day-step ' +
          (done ? 'done' : skipped ? 'skipped' : key === step ? 'current' : '') +
          '" data-day-step="' +
          key +
          '"><span class="day-step-icon" aria-hidden="true">' +
          (done ? '✓' : skipped ? '↪' : i + 1) +
          '</span><span><strong>' +
          names[key] +
          '</strong><small>' +
          esc(details[key]) +
          '</small>' +
          (skipped
            ? '<small>Gardé pour plus tard</small>'
            : done
              ? '<small>Étape terminée</small>'
              : '') +
          '</span></button>'
        );
      })
      .join('') +
    '</section>' +
    worldMapHTML(state, wizard, { name: cloud.profile?.name }) +
    '<section class="home-shortcuts"><button class="shortcut-card" id="see-progress"><strong>Ma progression</strong><span>Mon carnet et mes apprentissages ↗</span></button><button class="shortcut-card" id="free-training"><strong>S’entraîner</strong><span>Français, mathématiques et jeux ↗</span></button></section>';
  $('#start').onclick = () => {
    if (!step) currentDayPlan(true);
    goAdventure();
  };
  $('#enter-map').onclick = () => {
    const enter = () => {
      renderCastle();
      $('#world-title').setAttribute('tabindex', '-1');
      $('#world-title').focus({ preventScroll: true });
      $('.world-map')?.scrollIntoView?.({
        block: 'start',
        behavior: state.settings.motion ? 'smooth' : 'instant',
      });
    };
    if (!cloud.profile && !guestSession) openSchoolAccount(enter);
    else enter();
  };
  $('#see-progress').onclick = () => navigate('progress');
  $('#wizard-profile').onclick = () => navigate('progress');
  $('#free-training').onclick = () => navigate('library');
  bindWorldMap(main, {
    onRoom: visitCastleRoom,
    onGame: openGameSpot,
    onStory: openStory,
    motion: state.settings.motion,
    onMove: (id) => {
      if (id === 'hub' || id.startsWith('game-')) {
        state.training.castle = { room: id, at: Date.now() };
        save();
      }
    },
  });
  main
    .querySelectorAll('[data-day-step]')
    .forEach((button) => (button.onclick = () => goAdventure({ step: button.dataset.dayStep })));
}
function openGameSpot(type) {
  const g = GAME_SPOTS.find((x) => x.id === type);
  if (!g) return navigate('castle');
  const tier = gameProgress(state, g).nextTier || 0;
  if (g.extra) showExtraMenu(type, tier);
  else showBaseGameMenu(type, tier);
}
function openStory() {
  clearScreen();
  stopVoice();
  dailyGame = null;
  activeJourney = null;
  view = 'story';
  setNav('castle');
  renderStoryBook(main, {
    state,
    save,
    speak,
    stopVoice,
    name: cloud.profile?.name || '',
    onBack: () => navigate('castle'),
    onReward: (chapter, index) => {
      const item = awardTreasure(state, 'story:' + chapter.id, Math.min(5, Math.floor(index / 2)));
      if (item) showTreasure(item);
      playCue('success');
      return item;
    },
  });
  main.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function visitCastleRoom(id, initial = {}) {
  if (!roomById(id)) return navigate('castle');
  if (!cloud.profile && !guestSession) return openSchoolAccount(() => visitCastleRoom(id, initial));
  clearScreen();
  stopVoice();
  dailyGame = null;
  activeJourney = null;
  view = 'castle-room';
  setNav('castle');
  if (roomAccess(state, id).open) {
    state.training.castle = { room: id, at: Date.now() };
    save();
  }
  renderCastleRoom(
    main,
    {
      state,
      save,
      speak,
      onBack: () => navigate('castle'),
      onRoom: visitCastleRoom,
      initialChoice: initial.skillId,
      initialTier: initial.tier,
      onStart: ({ roomId, tier, skillId, activityId }) => {
        const back = () => visitCastleRoom(roomId, { skillId, tier });
        if (skillId && activityId) {
          clearScreen();
          view = 'learning-play';
          renderLearningActivity(
            main,
            {
              state,
              save,
              speak,
              stopVoice,
              story,
              onBrowse: back,
              onPause: back,
              onNext: back,
              onOutcome: (outcome) => {
                save();
                if (typeof outcome.correct === 'boolean')
                  playCue(outcome.correct ? 'success' : 'retry');
              },
            },
            activityId,
          );
        } else if (roomId === 'words') openWordBook(true, back);
        else if (roomId === 'reading') {
          const used = new Set(state.training.starts.map((s) => s.textId));
          const lastRead = new Map(state.training.readings.map((r, i) => [r.textId, i]));
          const text =
            TEXTS.find((t) => t.level === state.trainingSettings.readingLevel && !used.has(t.id)) ||
            TEXTS.filter((t) => t.level === state.trainingSettings.readingLevel).sort(
              (a, b) => (lastRead.get(a.id) ?? -1) - (lastRead.get(b.id) ?? -1),
            )[0];
          clearScreen();
          view = 'reading-play';
          screenCleanup = mountReading(
            main,
            {
              ...readingContext(back, back),
              free: true,
              onExit: back,
              nextLabel: 'Retour à la salle',
            },
            text,
          );
        } else startRoomMath(roomId, tier, back);
        main.focus({ preventScroll: true });
      },
    },
    id,
  );
  main.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function startRoomMath(block, tier, onBack) {
  const pending = Object.entries(state.training.math.sessions).findLast(
    ([id, s]) =>
      id.startsWith('room-') &&
      s.block === block &&
      s.tier === tier &&
      new Set(state.training.math.events.filter((e) => e.session === id).map((e) => e.slot)).size <
        6,
  );
  const session = pending?.[0] || 'room-' + eventStamp().id;
  clearScreen();
  view = 'math-play';
  screenCleanup = mountMath(
    main,
    {
      ...readingContext(onBack, onBack),
      free: true,
      onExit: onBack,
      onLesson: (block, tier) => openMathLesson(block, tier, onBack),
    },
    { session, block, tier },
  );
}
function readingContext(onDone, onSkip, day = calendarDay()) {
  return {
    state,
    day,
    save,
    speak,
    stopVoice,
    hasFrenchVoice,
    onReadingFinished: (record) => {
      if (record.answers.filter((a) => a.correct).length < 2) return;
      const loot = awardTreasure(state, 'reading:' + record.id, record.level + 1);
      if (loot) showTreasure(loot);
    },
    onFeedback: (correct) => playCue(correct ? 'success' : 'retry'),
    onDone,
    onSkip,
    onExit: () => navigate('castle'),
  };
}
function openReadingShelf(fromRoom = false, level = state.trainingSettings.readingLevel) {
  clearScreen();
  view = 'reading-shelf';
  setNav('library');
  main.innerHTML =
    '<div class="page-head"><button class="back" id="shelf-back" aria-label="Retour à l’entraînement">←</button><div><p class="eyebrow">Lire et comprendre</p><h1>Les lectures du château</h1><p class="subtle">Choisis une histoire ou une découverte.</p></div></div><label class="field">Choisir des textes<select id="shelf-level">' +
    TEXT_LEVELS.map(
      (item) =>
        '<option value="' +
        item.id +
        '" ' +
        (item.id === level ? 'selected' : '') +
        '>' +
        esc(item.label) +
        '</option>',
    ).join('') +
    '</select></label><div class="skill-list">' +
    TEXTS.filter((t) => t.level === level)
      .map(
        (text) =>
          '<button class="activity-card" data-read-text="' +
          text.id +
          '"><span><strong>' +
          esc(text.title) +
          '</strong><small>' +
          (state.training.starts.some((s) => s.textId === text.id)
            ? 'Relire librement'
            : 'Découvrir ce texte') +
          '</small></span><span>↗</span></button>',
      )
      .join('') +
    '</div>';
  $('#shelf-level').onchange = (e) => openReadingShelf(fromRoom, Number(e.target.value));
  $('#shelf-back').onclick = () => navigate(fromRoom ? 'castle' : 'library');
  main.querySelectorAll('[data-read-text]').forEach(
    (button) =>
      (button.onclick = () => {
        clearScreen();
        view = 'reading-play';
        const text = TEXTS.find((t) => t.id === button.dataset.readText);
        screenCleanup = mountReading(
          main,
          {
            ...readingContext(() => openWordPractice(null, text)),
            free: true,
            onExit: () => openReadingShelf(fromRoom, level),
            onSkip: () => openReadingShelf(fromRoom, level),
          },
          text,
        );
      }),
  );
}
function openWordPractice(word = null, text = null, fromRoom = false, onBack = null) {
  clearScreen();
  view = 'word-play';
  setNav('library');
  screenCleanup = mountWordWork(
    main,
    {
      ...readingContext(
        () => openWordBook(fromRoom, onBack),
        () => openWordBook(fromRoom, onBack),
      ),
      free: true,
      onExit: () => openWordBook(fromRoom, onBack),
    },
    { onlyWord: word, text },
  );
}
function openWordBook(fromRoom = false, onBack = null) {
  clearScreen();
  view = 'word-book';
  setNav('progress');
  renderWordBook(main, {
    ...readingContext(() => navigate(fromRoom ? 'castle' : 'progress')),
    onExit: onBack || (() => navigate(fromRoom ? 'castle' : 'progress')),
    onWord: (word) => openWordPractice(word, null, fromRoom, onBack),
  });
  const book = wordBook(state.training);
  if (book.active.length) {
    const button = document.createElement('button');
    button.className = 'primary';
    button.textContent = 'Retrouver les mots du carnet';
    button.onclick = () => openWordPractice(null, null, fromRoom, onBack);
    main.append(button);
  }
}
function renderProgress() {
  const wizard = wizardProfile();
  const collection = reconcileCollection(state);
  main.innerHTML = /* HTML */ `<div class="page-head progress-head">
      <div>
        <p class="eyebrow">Ma progression</p>
        <h1>Ma magicienne grandit</h1>
        <p class="subtle">Tes pouvoirs se tissent au fil de tes apprentissages.</p>
      </div>
      <button class="primary" id="progress-continue">Continuer mon aventure ↗</button>
    </div>
    <section class="wizard-profile" aria-label="Mon apprentie et son évolution">
      <div class="wizard-portrait">${apprentice(wizard.outfit.level)}</div>
      <div class="wizard-profile-copy">
        <p class="eyebrow">École du Fil d’Or · Niveau ${wizard.level}</p>
        <h2>${esc(wizard.name)}</h2>
        <p>Ta tenue : ${esc(wizard.outfit.name)}.</p>
        <div class="wizard-ranks" aria-label="Évolution ${wizard.level} sur 6">
          ${RANKS.map(
            (rank, i) =>
              `<span class="${i < wizard.level ? 'earned' : ''}" aria-label="${esc(rank.name)}${i + 1 === wizard.level ? ', niveau actuel' : ''}">${i < wizard.level ? '✦' : '◇'}</span>`,
          ).join('')}
        </div>
        ${wizard.outfit.next
          ? `<p class="next-gift">Prochaine découverte : <strong>${esc(wizard.outfit.next)}</strong>.<br /><small>Encore ${wizard.outfit.remaining} objets à gagner, à ton rythme.</small></p>`
          : '<p class="next-gift">Toutes tes tenues sont découvertes. Ta collection continue !</p>'}
        <details class="wizard-explainer">
          <summary>Comment ma magicienne évolue-t-elle ?</summary>
          <p>
            Un mot gagné dans ton carnet, une leçon ou une compétence de maths consolidée sur
            plusieurs jours fait grandir ta magie. Une aide ou une pause reste toujours possible. Tu
            gardes les tenues déjà découvertes. Les objets gagnés après chaque épreuve réussie te
            permettent aussi de découvrir de nouvelles tenues.
          </p>
        </details>
      </div>
    </section>
    <section class="treasure-collection" aria-labelledby="treasures-title">
      <p class="eyebrow">Mes trésors</p>
      <h2 id="treasures-title">Ma collection d’objets magiques</h2>
      <p class="subtle">
        Un objet par épreuve réussie. Plus elle est difficile, plus l’objet est précieux.
      </p>
      ${collection.total
        ? `<p>${collection.total} objet${collection.total > 1 ? 's' : ''} dans ton coffre.</p>
      <div class="treasure-grid">${collection.objects.map((item) => `<div class="treasure-card" style="--treasure-color:${item.color}">${treasureArt(item)}<strong>${esc(item.name)}</strong><small>${item.rarity}${item.count > 1 ? ' · ×' + item.count : ''}</small></div>`).join('')}</div>`
        : '<p>Ton premier trésor t’attend à la fin d’une épreuve réussie.</p>'}
    </section>
    <div class="spell-shelf" aria-label="Mes pouvoirs">
      ${SPELLS.map((spell) => {
        const related =
          {
            'guided-place': ['place'],
            'guided-calc': ['facts'],
            'guided-fraction': ['line'],
            'guided-reading': ['bars'],
          }[spell.skill] || [];
        const gained = wizard.marks.filter(
          (id) =>
            id.startsWith('lesson:' + spell.skill + ':') ||
            related.some((block) => id.startsWith('math:' + block + ':')),
        );
        return `<div class="spell-card ${gained.length ? 'earned' : ''}"><span aria-hidden="true">${gained.length ? '✦' : '◇'}</span><strong>${esc(spell.name)}</strong><small>${gained.length ? 'Une leçon consolidée' : 'À cultiver'}</small></div>`;
      }).join('')}
      <div class="spell-card ${wizard.marks.some((id) => id.startsWith('word:')) ? 'earned' : ''}">
        <span aria-hidden="true">✧</span><strong>Grimoire des mots</strong
        ><small
          >${wizard.marks.some((id) => id.startsWith('word:'))
            ? 'Des mots gagnés'
            : 'À remplir avec ton carnet'}</small
        >
      </div>
    </div>
    <div class="progress-notebook">
      <button class="secondary" id="progress-book">Ouvrir mon carnet de mots ↗</button>
    </div>
    <div class="progress-list">
      ${GUIDED_SKILLS.map((skill) => {
        const tier = skillTier(skill.id);
        const stats = state.journey.stats?.[skill.id];
        const tried = ACTIVITIES.filter(
          (activity) => activity.skill === skill.id && state.learning.outcomes?.[activity.id],
        ).length;
        const status =
          !stats?.attempts && !tried
            ? 'À découvrir'
            : (stats?.evidence?.length || 0) > 1 || tried > 1
              ? 'Revu plusieurs fois'
              : 'En cours';
        return `<article class="progress-card">
          <div class="progress-card-copy">
            <span class="eyebrow">Palier ${tier + 1} sur 6</span>
            <h2>${esc(skill.label)}</h2>
            <p>${esc(skill.stages[tier])}</p>
            <small>${status}</small>
          </div>
          <div class="stage-dots" aria-label="Palier ${tier + 1} sur 6">
            ${skill.stages.map((_, i) => `<span class="${i < tier ? 'done' : i === tier ? 'current' : ''}"></span>`).join('')}
          </div>
          <button class="secondary" data-practice-skill="${skill.id}">S’entraîner ici</button>
        </article>`;
      }).join('')}
    </div>`;
  $('#progress-continue').onclick = () => goAdventure();
  $('#progress-book').onclick = () => openWordBook();
  main
    .querySelectorAll('[data-practice-skill]')
    .forEach((button) => (button.onclick = () => startSkillPractice(button.dataset.practiceSkill)));
}
function renderRoom() {
  const r = ROOMS[room],
    ids = roomIds(room).filter((id) => allowed(BY_ID[id]));
  main.innerHTML = /* HTML */ `<div class="page-head">
      <button class="back" id="back" aria-label="Retour à l’école">←</button>
      <div>
        <p class="eyebrow">Lieu 0${room + 1}</p>
        <h1>${r.name}</h1>
        <p class="subtle">${r.subtitle}</p>
      </div>
    </div>
    <p class="wide-copy">
      ${r.friend} a préparé quelques énigmes. Tu peux les découvrir dans l’ordre que tu veux.
    </p>
    ${difficultyHTML()}
    <div class="levels">
      ${ids
        .map((id, i) => {
          const l = BY_ID[id];
          return `<button class="level" data-level="${id}">${state.completed.includes(id) ? '<span class="done-badge" aria-label="Déjà découverte">✦</span>' : ''}<span class="type-icon" aria-hidden="true">${typeIcon[l.type]}</span><strong>${typeName[l.type]}</strong><small>${l.type === 'flow' ? `${l.n} × ${l.n} cases` : l.type === 'potion' ? `${l.count} couleurs` : `${l.n} × ${l.n} tuiles`} · Énigme ${(l.index % (l.type === 'flow' ? 20 : l.type === 'potion' ? 10 : 5)) + 1}</small></button>`;
        })
        .join('')}
    </div>
    ${!ids.length
      ? '<p class="wide-copy">Les activités de ce lieu sont en pause. Tu peux rendre visite aux compagnons.</p>'
      : ''}<button class="secondary" id="room-story">Une histoire de ${r.friend} ↗</button>`;
  bindDifficulty(renderRoom);
  $('#back').onclick = () => navigate('castle');
  main.querySelectorAll('[data-level]').forEach((b) => (b.onclick = () => start(b.dataset.level)));
  $('#room-story').onclick = () => story(room);
}
function renderFriends() {
  main.innerHTML = /* HTML */ `<div class="page-head">
      <div>
        <p class="eyebrow">Les habitants du château</p>
        <h1>Des compagnons de voyage</h1>
        <p class="subtle">Résous une énigme dans un lieu pour rencontrer son gardien.</p>
      </div>
    </div>
    <div class="friend-grid">
      ${ROOMS.map((r, i) => {
        const found = roomFound(i);
        return `<article class="friend ${found ? '' : 'locked'}">${animal(r.animal, !found)}<h2>${r.friend}</h2><p>${found ? 'Une nouvelle histoire à partager.' : `À rencontrer dans ${r.name.toLowerCase()}.`}</p><button class="secondary" data-friend="${i}" ${found ? '' : 'disabled'}>Son histoire</button></article>`;
      }).join('')}
    </div>`;
  main
    .querySelectorAll('[data-friend]')
    .forEach((b) => (b.onclick = () => story(Number(b.dataset.friend))));
}
function story(i) {
  dialog(
    /* HTML */ `<div class="success">
      ${animal(ROOMS[i].animal)}
      <h2 id="modal-title">${ROOMS[i].friend}</h2>
      <p class="story-text">${ROOMS[i].story}</p>
      <button class="secondary" id="listen-story">♬ Écouter l’histoire</button
      ><button class="quiet" id="close-story">Fermer</button>
    </div>`,
  );
  $('#listen-story').onclick = () => speak(ROOMS[i].story);
  $('#close-story').onclick = () => modal.close();
}
function renderLibrary() {
  setNav('library');
  renderLearningHub(main, {
    state,
    save,
    speak,
    story,
    stopVoice,
    onGames: renderTrainingGames,
    onRead: () => openReadingShelf(),
    onWords: () => openWordBook(),
    onMath: () => openMathShelf(),
    onCoverage: () => showCoverage(false),
  });
}
function openMathShelf(focusBlock = null, fromRoom = false) {
  clearScreen();
  dailyGame = null;
  view = 'math-shelf';
  setNav('library');
  main.innerHTML =
    '<div class="page-head"><button class="back" id="math-shelf-back" aria-label="Retour">←</button><div><p class="eyebrow">S’entraîner</p><h1>L’école des nombres</h1><p class="subtle">Six cartes courtes. Tu peux t’arrêter et revenir.</p></div></div><div class="math-module-grid">' +
    MATH_BLOCKS.map(
      (block) =>
        '<article class="progress-card"><h2>' +
        esc(block.label) +
        '</h2><p>' +
        esc(block.subtitle) +
        '</p><label class="field">Choisir une étape<select id="math-tier-' +
        block.id +
        '">' +
        block.tiers
          .map(
            (name, i) =>
              '<option value="' +
              i +
              '" ' +
              (i === suggestedTier(state.training.math, block.id, mathStartFor(block.id))
                ? 'selected'
                : '') +
              '>' +
              esc(name) +
              '</option>',
          )
          .join('') +
        '</select></label><button class="primary" data-open-math="' +
        block.id +
        '">S’entraîner ici ↗</button></article>',
    ).join('') +
    '</div><button class="secondary" id="math-cm2-library">Toutes les notions de maths CM2 ↗</button>';
  $('#math-shelf-back').onclick = () => navigate(fromRoom ? 'castle' : 'library');
  $('#math-cm2-library').onclick = () => {
    navigate('library');
    main.querySelector('[data-route="math"]').click();
  };
  main.querySelectorAll('[data-open-math]').forEach(
    (b) =>
      (b.onclick = () => {
        const block = b.dataset.openMath,
          tier = Number($('#math-tier-' + block).value),
          day = calendarDay();
        const pending = Object.entries(state.training.math.sessions).findLast(
          ([id, s]) =>
            s.block === block &&
            s.tier === tier &&
            new Set(state.training.math.events.filter((e) => e.session === id).map((e) => e.slot))
              .size < 6,
        );
        const session = pending?.[0] || eventStamp(day).id;
        clearScreen();
        view = 'math-play';
        screenCleanup = mountMath(
          main,
          {
            ...readingContext(
              () => openMathShelf(focusBlock, fromRoom),
              () => openMathShelf(focusBlock, fromRoom),
              day,
            ),
            onExit: () => openMathShelf(focusBlock, fromRoom),
            free: true,
            onLesson: (block, tier) =>
              openMathLesson(block, tier, () => openMathShelf(focusBlock, fromRoom)),
          },
          { session, block, tier },
        );
      }),
  );
  if (typeof focusBlock === 'string' && MATH_BLOCKS.some((block) => block.id === focusBlock)) {
    const card = main.querySelector(`[data-open-math="${focusBlock}"]`);
    card?.scrollIntoView?.({ block: 'center' });
    card?.focus({ preventScroll: true });
  }
}
function openMathLesson(block, tier, onBack) {
  clearScreen();
  view = 'math-lesson';
  const index = block === 'facts' ? 1 : block === 'line' ? 2 : 0;
  const rung =
    block === 'facts'
      ? tier === 5
        ? 5
        : 4
      : block === 'line'
        ? tier === 4
          ? 2
          : 4
        : Math.min(3, tier);
  renderLearningActivity(
    main,
    { state, save, speak, stopVoice, story, onPause: onBack, onBrowse: onBack, onNext: onBack },
    `guided-${index}-${rung}-0`,
  );
}
function startSkillPractice(skillId) {
  activeJourney = null;
  view = 'learning-play';
  setNav('progress');
  renderLearningHub(main, {
    state,
    save,
    speak,
    story,
    stopVoice,
    initialSkill: skillId,
    onBrowse: () => navigate('progress'),
    onPause: () => navigate('progress'),
  });
}
function renderTrainingGames() {
  clearScreen();
  dailyGame = null;
  activeJourney = null;
  trainingGame = true;
  view = 'training-games';
  setNav('library');
  main.innerHTML = /* HTML */ `<div class="page-head">
      <button class="back" id="games-back" aria-label="Retour à l’entraînement">←</button>
      <div>
        <p class="eyebrow">S’entraîner</p>
        <h1>Jeux et énigmes</h1>
        <p class="subtle">Choisis un jeu. Tu pourras ensuite choisir son niveau.</p>
      </div>
    </div>
    <div class="training-categories">
      ${['flow', 'potion', 'circuit']
        .filter((type) => !state.settings.disabled.includes(type))
        .map(
          (type) =>
            `<button class="shortcut-card" data-base-game="${type}"><strong>${typeName[type]}</strong><span>Choisir un niveau ↗</span></button>`,
        )
        .join('')}
      ${Object.entries(EXTRA_NAMES)
        .filter(([type]) => !state.settings.disabled.includes(type))
        .map(
          ([type, name]) =>
            `<button class="shortcut-card" data-extra-game="${type}"><strong>${name}</strong><span>Choisir un niveau ↗</span></button>`,
        )
        .join('')}
    </div>`;
  $('#games-back').onclick = () => navigate('library');
  main
    .querySelectorAll('[data-base-game]')
    .forEach((button) => (button.onclick = () => showBaseGameMenu(button.dataset.baseGame)));
  main
    .querySelectorAll('[data-extra-game]')
    .forEach((button) => (button.onclick = () => showExtraMenu(button.dataset.extraGame)));
}
function showBaseGameMenu(type, tier = 0) {
  clearScreen();
  dailyGame = null;
  trainingGame = true;
  view = 'game-menu';
  setNav('library');
  const levels = LEVELS.filter((level) => level.type === type && levelMode(level) === tier);
  main.innerHTML = /* HTML */ `<div class="page-head">
      <button class="back" id="base-game-back" aria-label="Retour aux jeux">←</button>
      <div>
        <p class="eyebrow">Jeux et énigmes</p>
        <h1>${typeName[type]}</h1>
      </div>
    </div>
    <div class="difficulty compact-stages" role="group" aria-label="Choisir un niveau">
      ${modeNames
        .map(
          (name, i) =>
            `<button data-game-tier="${i}" class="${i === tier ? 'selected' : ''}">${i + 1} · ${name}</button>`,
        )
        .join('')}
    </div>
    <div class="levels">
      ${levels
        .map(
          (level, i) =>
            `<button class="level" data-game-level="${level.id}"><span class="type-icon">${typeIcon[type]}</span><strong>Énigme ${i + 1}</strong><small>${state.completed.includes(level.id) ? 'Déjà explorée' : 'À découvrir'}</small></button>`,
        )
        .join('')}
    </div>`;
  $('#base-game-back').onclick = renderTrainingGames;
  main
    .querySelectorAll('[data-game-tier]')
    .forEach(
      (button) => (button.onclick = () => showBaseGameMenu(type, Number(button.dataset.gameTier))),
    );
  main
    .querySelectorAll('[data-game-level]')
    .forEach((button) => (button.onclick = () => start(button.dataset.gameLevel)));
}
function renderPause() {
  main.innerHTML = /* HTML */ `<section class="pause-screen">
    <div class="pause-symbol">☾</div>
    <h1>L’aventure peut attendre.</h1>
    <p>
      Tu peux fermer cette page.<br />${storageOK
        ? 'Ta place est gardée sur cet appareil.'
        : 'La sauvegarde n’est pas disponible sur cet appareil.'}
    </p>
    <button class="primary" id="resume">Reprendre</button
    ><button class="quiet" id="pause-home">Revenir au château</button>
  </section>`;
  $('#resume').onclick = () => goAdventure();
  $('#pause-home').onclick = () => navigate('castle');
}
function start(id, inJourney = false) {
  if (!inJourney) activeJourney = null;
  if (EXTRA_BY_ID[id]) return startExtra(EXTRA_BY_ID[id], inJourney);
  const daily = dailyGame?.id === id;
  const practice = trainingGame && !inJourney && !daily;
  const l = BY_ID[id];
  if (!l || !allowed(l)) return navigate('castle');
  cancelHint();
  stopVoice();
  beginGameTime(id);
  if (modal.open) modal.close();
  view = 'play';
  current = l;
  room = levelRoom(l);
  state.settings.difficulty = levelMode(l);
  board = clone(state.boards[id] || initialBoard(l));
  if (isSolved(l, board)) board = initialBoard(l);
  if (inJourney && l.type === 'circuit' && !state.boards[id])
    board = guidedCircuit(l, activeJourney.tier);
  history = [];
  active = -1;
  selected = -1;
  hint = false;
  hintTiles = [];
  state.last = id;
  const intro = takeIntro(state, id, introCount);
  if (intro) introCount++;
  save();
  setNav(practice ? 'library' : 'castle');
  const number = (l.index % (l.type === 'flow' ? 20 : l.type === 'potion' ? 10 : 5)) + 1;
  main.innerHTML = /* HTML */ `<div class="page-head game-top">
      <button id="back" class="back" aria-label="Retour au lieu">←</button>
      <p class="subtle">${ROOMS[room].name}</p>
      <button class="quiet" id="pause" style="margin-left:auto">☾ Faire une pause</button>
    </div>
    ${intro
      ? `<p class="companion-whisper"><small>Un mot de ${ROOMS[room].friend}</small>${intro}</p>`
      : ''}
    <section class="play-layout">
      <aside class="play-info">
        <p class="eyebrow">${modeNames[levelMode(l)]} · Énigme ${number}</p>
        <h1>${typeName[l.type]}</h1>
        <p>${rules[l.type]}</p>
        <button class="quiet" id="speak">♬ Écouter la règle</button>
        <div class="guide-line">
          ${l.type === 'flow'
            ? 'Un fil se modifie en touchant son extrémité ou une case de son chemin.'
            : l.type === 'potion'
              ? 'Tu peux annuler un versement ou changer de fiole.'
              : 'Les étoiles et le soleil restent fixes. Les autres branches peuvent rester ouvertes.'}<br /><br />Tu
          peux aussi choisir une autre énigme.
        </div>
      </aside>
      <div class="board-wrap">
        <div class="board-toolbar">
          <span
            >${l.type === 'flow'
              ? `${l.n} × ${l.n}`
              : l.type === 'potion'
                ? `${l.count} couleurs`
                : `${l.targets.length} étoiles à éclairer`}</span
          ><button id="switch">Changer d’énigme ↗</button>
        </div>
        <div class="board-area" id="board"></div>
        <div class="board-tools">
          <button id="undo" aria-label="Annuler le dernier geste">↶ Annuler</button
          ><button id="hint">✧ Une piste</button><button id="reset">↺ Recommencer</button>
        </div>
        <p class="game-message" id="game-message" aria-live="polite">
          ${l.type === 'flow'
            ? 'Les cases vides peuvent le rester.'
            : l.type === 'circuit'
              ? 'Touche une tuile sans symbole pour la tourner.'
              : 'Choisis une fiole à verser.'}
        </p>
      </div>
    </section>`;
  const leaveGame = () =>
    practice
      ? showBaseGameMenu(l.type, levelMode(l))
      : inJourney || daily
        ? navigate('castle')
        : navigate('room');
  $('#back').onclick = leaveGame;
  $('#switch').onclick = daily ? changeDailyGame : leaveGame;
  $('#pause').onclick = () => (practice ? renderTrainingGames() : navigate('pause'));
  $('#speak').onclick = () => speak(rules[l.type]);
  $('#undo').onclick = undo;
  $('#hint').onclick = requestHint;
  $('#reset').onclick = confirmReset;
  renderBoard();
  if (inJourney) journeyControls();
  if (daily) dailyGameOptions();
  window.scrollTo({ top: 0, behavior: 'instant' });
  main.focus({ preventScroll: true });
}
function remember() {
  history.push(clone(board));
  if (history.length > 180) history.shift();
}
function boardChanged() {
  state.boards[current.id] = clone(board);
  save();
  $('#undo').disabled = !history.length;
}
function message(t) {
  const el = $('#game-message');
  if (el) el.textContent = t;
}
function undo() {
  if (!history.length) return;
  cancelHint();
  board = history.pop();
  active = -1;
  selected = -1;
  hint = false;
  hintTiles = [];
  renderBoard();
  boardChanged();
  message('Le dernier geste est annulé.');
}
function confirmReset() {
  dialog(
    /* HTML */ `<h2 id="modal-title">Recommencer cette énigme ?</h2>
      <p>Tu peux aussi garder ta place et choisir une autre énigme.</p>
      <button class="secondary" id="keep">Garder ma place</button>
      <button class="primary" id="really-reset">Recommencer</button>`,
  );
  $('#keep').onclick = () => modal.close();
  $('#really-reset').onclick = () => {
    remember();
    board = initialBoard(current);
    active = -1;
    selected = -1;
    hint = false;
    hintTiles = [];
    cancelHint();
    modal.close();
    renderBoard();
    boardChanged();
    message('Une nouvelle page pour cette énigme.');
  };
}
function renderBoard() {
  if (!current) return;
  if (current.type === 'flow') drawFlow();
  if (current.type === 'potion') drawPotions();
  if (current.type === 'circuit') drawCircuit();
  $('#undo').disabled = !history.length;
}
function pathD(p, n) {
  return p
    .map((a, i) => `${i ? 'L' : 'M'}${(a % n) * 100 + 50} ${Math.floor(a / n) * 100 + 50}`)
    .join(' ');
}
function flowLines() {
  const l = current;
  $('.flow-svg').innerHTML =
    (hint
      ? l.solution
          .map(
            (p, c) =>
              `<path d="${pathD(p, l.n)}" stroke="${COLORS[c]}" stroke-width="6" opacity=".65" stroke-dasharray="9 12"/>`,
          )
          .join('')
      : '') +
    board
      .map(
        (p, c) =>
          `<path d="${pathD(p, l.n)}" stroke="${COLORS[c]}" stroke-width="20" opacity=".88"/>`,
      )
      .join('');
}
function drawFlow() {
  const l = current;
  $('#board').innerHTML = /* HTML */ `<div class="flow-board" id="flow">
    <div
      class="flow-grid"
      role="group"
      aria-label="Grille des fils de lumière"
      style="grid-template-columns:repeat(${l.n},1fr)"
    >
      ${Array.from({ length: l.n * l.n }, (_, i) => {
        const c = l.ends.findIndex((e) => e.includes(i));
        return `<button class="flow-cell" data-cell="${i}" aria-label="Ligne ${Math.floor(i / l.n) + 1}, colonne ${(i % l.n) + 1}${c >= 0 ? `, symbole ${SYMBOLS[c]}` : ''}">${c >= 0 ? `<span class="gem" style="--c:${COLORS[c]}">${SYMBOLS[c]}</span>` : ''}</button>`;
      }).join('')}
    </div>
    <svg class="flow-svg" viewBox="0 0 ${l.n * 100} ${l.n * 100}" aria-hidden="true"></svg>
  </div>`;
  flowLines();
  let dragging = false,
    last = -1,
    ignoreClick = false;
  const el = $('#flow');
  const cellAt = (e) => {
    const r = el.getBoundingClientRect(),
      x = Math.floor(((e.clientX - r.left) / r.width) * l.n),
      y = Math.floor(((e.clientY - r.top) / r.height) * l.n);
    return x >= 0 && x < l.n && y >= 0 && y < l.n ? y * l.n + x : -1;
  };
  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const i = cellAt(e);
    if (i < 0) return;
    ignoreClick = true;
    dragging = true;
    last = i;
    el.setPointerCapture(e.pointerId);
    flowStep(i, true);
  });
  el.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const i = cellAt(e);
    if (i < 0 || i === last) return;
    last = i;
    flowStep(i, false);
  });
  const end = () => {
    dragging = false;
    last = -1;
    if (current?.type === 'flow' && isSolved(current, board)) win();
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', () => {
    dragging = false;
    last = -1;
  });
  el.addEventListener('click', (e) => {
    if (ignoreClick && e.detail !== 0) {
      ignoreClick = false;
      return;
    }
    ignoreClick = false;
    const b = e.target.closest('[data-cell]');
    if (b) {
      flowStep(Number(b.dataset.cell), true);
      if (isSolved(current, board)) win();
    }
  });
}
function flowStep(i, startGesture) {
  const l = current;
  if (!l || l.type !== 'flow') return;
  const m = flowMove(l, board, active, i, startGesture);
  if (!m) return;
  remember();
  board = m.paths;
  active = m.active;
  flowLines();
  boardChanged();
}
function drawPotions() {
  const l = current;
  $('#board').innerHTML = /* HTML */ `<div
    class="potion-board"
    role="group"
    aria-label="Les fioles"
  >
    ${board
      .map(
        (t, i) =>
          `<button class="tube ${selected === i ? 'selected' : ''} ${hintTiles.includes(i) ? 'hint' : ''}" data-tube="${i}" aria-label="Fiole ${i + 1}, ${t.length ? t.map((c) => SYMBOLS[c]).join(' puis ') : 'vide'}" aria-pressed="${selected === i}"><span class="tube-glass">${t.map((c) => `<span class="liquid" style="--c:${COLORS[c]}">${SYMBOLS[c]}</span>`).join('')}</span><span class="tube-num">${i + 1}</span></button>`,
      )
      .join('')}
  </div>`;
  main.querySelectorAll('[data-tube]').forEach(
    (b) =>
      (b.onclick = () => {
        const to = Number(b.dataset.tube);
        if (selected < 0) {
          if (!board[to].length) {
            message('Choisis d’abord une fiole qui contient une couleur.');
            return;
          }
          selected = to;
          drawPotions();
          return;
        }
        if (selected === to) {
          selected = -1;
          drawPotions();
          return;
        }
        const next = pour(board, selected, to, l.cap);
        if (!next) {
          selected = board[to].length ? to : -1;
          drawPotions();
          message('Verse sur la même couleur ou dans une fiole vide, avec de la place.');
          return;
        }
        remember();
        board = next;
        selected = -1;
        hintTiles = [];
        cancelHint();
        drawPotions();
        boardChanged();
        message('Choisis ta prochaine fiole.');
        if (isSolved(l, board)) win();
      }),
  );
}
function tileSVG(mask, lit, source, target) {
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><g class="pipe" fill="none" stroke-width="14" stroke-linecap="round">${[
    [1, 50, 0],
    [2, 100, 50],
    [4, 50, 100],
    [8, 0, 50],
  ]
    .filter(([bit]) => mask & bit)
    .map(([, x, y]) => `<path d="M50 50L${x} ${y}"/>`)
    .join(
      '',
    )}</g><circle cx="50" cy="50" r="11" fill="${lit ? '#f2c779' : '#95aaa1'}"/>${source || target ? `<circle cx="50" cy="50" r="20" fill="#18363e" stroke="${lit ? '#f2c779' : '#b8cbc6'}" stroke-width="2"/><text x="50" y="57" text-anchor="middle" fill="${lit ? '#f2c779' : '#b8cbc6'}" font-size="25">${source ? '☀' : '✦'}</text>` : ''}</svg>`;
}
function drawCircuit(focusTile = null) {
  const l = current,
    reach = circuitReach(l, board);
  $('#board').innerHTML = /* HTML */ `<div
      class="circuit-board"
      style="grid-template-columns:repeat(${l.n},minmax(0,1fr));grid-template-rows:repeat(${l.n},minmax(0,1fr))"
      role="group"
      aria-label="Circuit : relier le soleil à ${l.targets.length} étoiles"
    >
      ${board
        .map((m, i) => {
          const locked = l.locked.includes(i),
            target = l.targets.includes(i);
          return `<button class="circuit-tile ${locked ? 'locked' : ''} ${reach.has(i) ? 'lit' : ''} ${hintTiles.includes(i) ? 'hint' : ''}" data-tile="${i}" ${locked ? 'disabled' : ''} aria-label="${locked ? 'Tuile fixe' : 'Tourner la tuile'}, ligne ${Math.floor(i / l.n) + 1}, colonne ${(i % l.n) + 1}${i === l.source ? ', soleil' : target ? ', étoile' : ''}">${tileSVG(m, reach.has(i), i === l.source, target)}</button>`;
        })
        .join('')}
    </div>
    <div class="circuit-progress" aria-live="polite">
      <span>Étoiles éclairées</span>${l.targets
        .map(
          (t) =>
            `<span class="${reach.has(t) ? 'on' : 'off'}" aria-label="${reach.has(t) ? 'allumée' : 'à relier'}">${reach.has(t) ? '✦' : '☆'}</span>`,
        )
        .join('')}
    </div>`;
  main.querySelectorAll('[data-tile]:not([disabled])').forEach(
    (b) =>
      (b.onclick = () => {
        const i = Number(b.dataset.tile),
          next = turnCircuit(l, board, i);
        if (!next) return;
        remember();
        board = next;
        hintTiles = [];
        drawCircuit(i);
        boardChanged();
        message(
          `${l.targets.filter((t) => circuitReach(l, board).has(t)).length} étoile(s) éclairée(s) sur ${l.targets.length}.`,
        );
        if (isSolved(l, board)) win();
      }),
  );
  if (focusTile !== null)
    main.querySelector(`[data-tile="${focusTile}"]`)?.focus({ preventScroll: true });
}
function requestHint() {
  const l = current;
  if (!l) return;
  journeyAssisted = true;
  if (l.type === 'flow') {
    hint = !hint;
    flowLines();
    message(
      hint
        ? 'Les pointillés montrent une solution possible. Tu peux aussi inventer un autre chemin.'
        : 'La piste est masquée.',
    );
    return;
  }
  if (l.type === 'circuit') {
    const i = board.findIndex((m, i) => !l.locked.includes(i) && m !== l.solution[i]);
    hintTiles = i < 0 ? [] : [i];
    drawCircuit();
    message(
      i < 0
        ? 'Toutes les étoiles sont reliées.'
        : 'La tuile encadrée peut être tournée pour rejoindre un chemin possible.',
    );
    return;
  }
  if (worker) {
    cancelHint();
    message('La recherche de piste est arrêtée.');
    return;
  }
  message('La chouette cherche une piste…');
  const snapshot = JSON.stringify(board);
  worker = new Worker('./solver-worker.mjs', { type: 'module' });
  const w = worker;
  const t = setTimeout(() => {
    if (worker === w) {
      cancelHint();
      message(
        'Pas de piste trouvée cette fois. Tu peux annuler un geste ou choisir une autre énigme.',
      );
    }
  }, 2500);
  w.onmessage = (e) => {
    clearTimeout(t);
    if (current !== l || JSON.stringify(board) !== snapshot) {
      cancelHint();
      return;
    }
    const moves = e.data.moves;
    cancelHint();
    if (moves?.length) {
      hintTiles = moves[0];
      drawPotions();
      message(`Une piste : verse la fiole ${moves[0][0] + 1} dans la fiole ${moves[0][1] + 1}.`);
    } else
      message(
        moves
          ? 'Les couleurs sont déjà réunies.'
          : 'Pas de piste trouvée cette fois. Tu peux annuler un geste ou changer d’énigme.',
      );
  };
  w.onerror = () => {
    clearTimeout(t);
    cancelHint();
    message('La piste n’est pas disponible. Tu peux continuer ou changer d’énigme.');
  };
  w.postMessage({ board: clone(board), cap: l.cap });
}
function win() {
  if (!current || modal.open) return;
  const wasDaily = dailyGame?.id === current.id;
  const l = current,
    first = !state.completed.includes(l.id),
    newFriend = first && !roomFound(room);
  const loot = awardTreasure(
    state,
    'game:' + l.id + ':' + (gameClock?.rewardId || eventStamp().id),
    levelMode(l) * 2,
  );
  if (loot) showTreasure(loot, true);
  if (first) state.completed.push(l.id);
  completeDailyGame(l.id);
  boardChanged();
  chime();
  const localNext = roomIds(room)
    .map((id) => BY_ID[id])
    .find((x) => x.id !== l.id && allowed(x) && !state.completed.includes(x.id));
  const next = localNext || nextLevel();
  if (activeJourney) {
    finishStep(
      state.journey,
      activeJourney,
      { correct: true, assisted: journeyAssisted },
      JOURNEY_CATALOG,
    );
    save();
  }
  dialog(
    /* HTML */ `<div class="success">
      ${state.settings.transition === 'door'
        ? '<div class="door-frame" aria-hidden="true"><div class="door-panel"></div></div>'
        : '<div class="fade-star" aria-hidden="true">✦</div>'}
      <h2 id="modal-title">
        ${newFriend ? `Voici ${ROOMS[room].friend} !` : 'Une nouvelle lumière au château.'}
      </h2>
      ${newFriend ? animal(ROOMS[room].animal) : ''}
      <p>
        ${newFriend
          ? 'Un compagnon rejoint ton aventure.'
          : 'Tu peux poursuivre, explorer un autre lieu ou faire une pause.'}
      </p>
      <p class="success-positive">${successMessage(state, first)}</p>
      ${next || activeJourney || wasDaily
        ? `<button class="primary" id="next">${wasDaily ? 'Terminer ma séance' : activeJourney ? 'Poursuivre l’aventure' : 'Découvrir une autre énigme'} ↗</button>`
        : ''}<button class="secondary" id="success-map">Explorer le château</button>
      <button class="quiet" id="success-pause">Faire une pause</button>
    </div>`,
  );
  if (next || activeJourney || wasDaily)
    $('#next').onclick = () =>
      wasDaily
        ? navigate('castle')
        : activeJourney
          ? goAdventure({ advance: true })
          : start(next.id);
  $('#success-map').onclick = () => navigate('castle');
  $('#success-pause').onclick = () => navigate('pause');
}
function dialog(html) {
  stopVoice();
  if (modal.open) modal.close();
  if (html.includes('class="success"') && pendingTreasure?.until > performance.now()) {
    const item = pendingTreasure.item;
    const badge =
      '<div class="treasure-earned">' +
      treasureArt(item) +
      '<span><strong>' +
      esc(item.name) +
      '</strong><small>' +
      item.rarity +
      ' · ajouté à ta collection</small></span></div>';
    html = html.replace('<div class="success">', '<div class="success">' + badge);
    pendingTreasure = null;
    $('#toast').classList.remove('show');
  }
  $('#modal-body').innerHTML = html;
  modal.showModal();
}
function dialogTop(title) {
  return `<div class="dialog-top"><h2 id="modal-title">${title}</h2><button class="close" id="close-modal" aria-label="Fermer">×</button></div>`;
}
function bindClose() {
  $('#close-modal').onclick = () => modal.close();
}
function toggle(k, label) {
  return `<label class="toggle">${label}<input type="checkbox" data-setting="${k}" ${state.settings[k] ? 'checked' : ''}></label>`;
}
function settingsHTML() {
  return `<label class="field">Taille du texte<select data-setting="font"><option value="1" ${state.settings.font === 1 ? 'selected' : ''}>Habituelle</option><option value="1.15" ${state.settings.font === 1.15 ? 'selected' : ''}>Grande</option><option value="1.3" ${state.settings.font === 1.3 ? 'selected' : ''}>Très grande</option></select></label>${toggle('spacing', 'Espacer un peu les lettres')}${toggle('contrast', 'Renforcer le contraste')}${toggle('motion', 'Animations douces')}${toggle('sound', 'Petit son de découverte')}<p>La lecture utilise une voix locale française ou anglaise installée sur l’appareil. Les voix en ligne ne sont pas utilisées.</p>`;
}
function bindSettings() {
  modal.querySelectorAll('[data-setting]').forEach(
    (e) =>
      (e.onchange = () => {
        const k = e.dataset.setting;
        state.settings[k] =
          e.type === 'checkbox' ? e.checked : k === 'font' ? Number(e.value) : e.value;
        save();
        applySettings();
      }),
  );
}
function openAccess() {
  if (screenCleanup) navigate('castle');
  dialog(
    `${dialogTop('Lecture & sons')}${settingsHTML()}<button class="primary" id="access-done">C’est prêt</button>`,
  );
  bindClose();
  bindSettings();
  $('#access-done').onclick = () => modal.close();
}
async function hashPin(pin, salt) {
  const raw = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bytes = Uint8Array.from(salt.match(/../g), (x) => parseInt(x, 16));
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: bytes, iterations: 80000, hash: 'SHA-256' },
    raw,
    256,
  );
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}
function openParentGate() {
  if (screenCleanup) navigate('castle');
  if (!crypto?.subtle) {
    toast('L’espace parental nécessite une connexion HTTPS.');
    return;
  }
  const setup = !state.pin;
  dialog(
    `${dialogTop(setup ? 'À configurer par un adulte' : 'Espace des parents')}<p>${setup ? 'Choisissez un code à quatre chiffres pour les réglages des activités et le carnet. Ce verrou reste local à cet appareil.' : 'Entrez votre code à quatre chiffres. Le jeu reste accessible sans ce code.'}</p><form id="pin-form"><label class="field">${setup ? 'Choisir un code' : 'Code parental'}<input type="password" id="pin" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="off" required aria-label="Code parental à quatre chiffres"></label>${setup ? '<label class="field">Confirmer le code<input type="password" id="pin2" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="off" required></label>' : ''}<button class="primary" type="submit">${setup ? 'Enregistrer le code' : 'Ouvrir'}</button><p class="status-line" id="pin-status" role="status"></p></form><p>Code oublié : les données de ce site peuvent être effacées dans les réglages Safari. La progression et les notes seront aussi supprimées.</p>`,
  );
  bindClose();
  $('#pin-form').onsubmit = async (e) => {
    e.preventDefault();
    const pin = $('#pin').value;
    if (!/^\d{4}$/.test(pin)) return;
    if (setup && pin !== $('#pin2').value) {
      $('#pin-status').textContent = 'Les deux codes sont différents.';
      return;
    }
    const salt = setup
      ? Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
          b.toString(16).padStart(2, '0'),
        ).join('')
      : state.pin.salt;
    const button = $('#pin-form button');
    button.disabled = true;
    try {
      const hash = await hashPin(pin, salt);
      if (setup) {
        state.pin = { salt, hash };
        save();
        openParents();
      } else if (hash === state.pin.hash) openParents();
      else {
        $('#pin-status').textContent = 'Ce code ne correspond pas.';
        button.disabled = false;
      }
    } catch {
      $('#pin-status').textContent = 'Ce navigateur ne permet pas de vérifier le code.';
      button.disabled = false;
    }
  };
}
function startPositioning() {
  modal.close();
  clearScreen();
  stopVoice();
  view = 'positioning';
  setNav('library');
  screenCleanup = () => stopVoice();
  mountPositioning(main, {
    speak,
    onCancel: () => {
      navigate('castle');
      openParents();
    },
    onDone: (outcomes) => {
      const suggestion = starterSuggestion(outcomes, state.trainingSettings);
      const names = {
        facts: 'Calcul et tables',
        place: 'Écriture des nombres',
        line: 'Fractions et décimaux',
        bars: 'Problèmes',
      };
      dialog(
        dialogTop('Un point de départ à essayer') +
          '<p>Ces quelques recherches proposent des étapes de départ. Elles ne mesurent pas un niveau scolaire ni une maîtrise. Les prochaines séances permettront d’ajuster.</p><ul>' +
          Object.entries(suggestion.mathStarts)
            .map(
              ([block, tier]) =>
                '<li>' + names[block] + ' : ' + esc(blockById(block).tiers[tier]) + '</li>',
            )
            .join('') +
          '</ul><p>Homophones : palier ' +
          (suggestion.languageStart + 1) +
          '. Le niveau des textes se choisit dans les réglages de lecture.</p><p>Les étapes déjà travaillées gardent leur progression. Ces choix servent aux nouvelles cibles et aux propositions de départ.</p><button id="starter-apply" class="primary">Essayer ces points de départ</button><button id="starter-keep" class="quiet">Garder mes réglages</button>',
      );
      bindClose();
      $('#starter-apply').onclick = () => {
        Object.assign(state.trainingSettings, suggestion);
        save();
        navigate('castle');
      };
      $('#starter-keep').onclick = () => navigate('castle');
    },
  });
}
function openParents() {
  dialog(
    dialogTop('Espace des parents') +
      '<p>Un programme de pratique en lecture, écriture et mathématiques. Les observations ne remplacent ni le bilan ni le suivi orthophonique.</p><div class="parent-actions"><button class="secondary" id="start-positioning">Chercher un point de départ</button><button class="primary" id="reading-report">Voir le suivi de lecture</button><button class="secondary" id="coverage-open">Programme CM2 : domaines et activités</button></div>' +
      '<details class="parent-details"><summary>Lecture et carnet de mots</summary><p>Trois niveaux éditoriaux permettent de garder des textes courts ou d’aller vers des récits plus développés. Choisir selon l’aisance et la compréhension ; les niveaux ne sont pas étalonnés.</p>' +
      '<label class="field">Textes de la séance<select id="reading-level">' +
      TEXT_LEVELS.map(
        (level) =>
          '<option value="' +
          level.id +
          '" ' +
          (state.trainingSettings.readingLevel === level.id ? 'selected' : '') +
          '>' +
          esc(level.label) +
          '</option>',
      ).join('') +
      '</select></label>' +
      '<label class="toggle">Une phrase de français après le carnet<input id="daily-language" type="checkbox" ' +
      (state.trainingSettings.dailyLanguage ? 'checked' : '') +
      '></label><label class="field">Cible de français<select id="language-focus">' +
      LANGUAGE_TARGETS.map(
        ([id, label]) =>
          '<option value="' +
          id +
          '" ' +
          (state.trainingSettings.languageFocus === id ? 'selected' : '') +
          '>' +
          esc(label) +
          '</option>',
      ).join('') +
      '</select></label><label class="field">Point de départ du français<select id="language-start">' +
      [0, 1, 2, 3, 4, 5]
        .map(
          (t) =>
            '<option value="' +
            t +
            '" ' +
            (state.trainingSettings.languageStart === t ? 'selected' : '') +
            '>Palier ' +
            (t + 1) +
            '</option>',
        )
        .join('') +
      '</select></label><p class="subtle">Une cible est gardée dans le temps. Le palier conseillé avance après dix essais, dont neuf sans aide réussis sur plusieurs jours et au moins trois exercices différents. Le niveau d’une nouvelle cible peut être ajusté ici.</p>' +
      '<label class="field">Cible de maths de la séance<select id="math-focus">' +
      MATH_TARGETS.map(
        ([id, label]) =>
          '<option value="' +
          id +
          '" ' +
          (state.trainingSettings.mathFocus === id ? 'selected' : '') +
          '>' +
          esc(label) +
          '</option>',
      ).join('') +
      '</select></label><label class="field">Départ des nouvelles fiches de maths<select id="school-math-start">' +
      [0, 1, 2, 3, 4, 5]
        .map(
          (t) =>
            '<option value="' +
            t +
            '" ' +
            (state.trainingSettings.schoolMathStart === t ? 'selected' : '') +
            '>Palier ' +
            (t + 1) +
            '</option>',
        )
        .join('') +
      '</select></label><p class="subtle">Les changements s’appliquent à la prochaine séance. Un exercice déjà annoncé reste le même.</p>' +
      '<label class="toggle">Conserver les mesures de durée<input id="reading-tracking" type="checkbox" ' +
      (state.trainingSettings.tracking ? 'checked' : '') +
      '></label><p class="subtle">Si ce réglage est désactivé, les mots restent entraînables mais la vitesse n’est pas retenue et aucun mot ne gagne le critère de rapidité.</p>' +
      '<label class="toggle">Clavier à lettres et graphies<input id="word-tiles" type="checkbox" ' +
      (state.trainingSettings.tiles ? 'checked' : '') +
      '></label><p class="subtle">Activé par défaut pour éviter les suggestions du clavier iPad. Pour le clavier système, vérifier aussi ses réglages de correction et prédiction sur l’appareil réel.</p>' +
      '<label class="field">Seuil interne de réponse après lecture flash<select id="flash-fast">' +
      [4000, 6000, 10000]
        .map(
          (ms) =>
            '<option value="' +
            ms +
            '" ' +
            (state.trainingSettings.flashFast === ms ? 'selected' : '') +
            '>' +
            ms / 1000 +
            ' secondes</option>',
        )
        .join('') +
      '</select></label><p>Repère de pratique modifiable, jamais une norme de lecture. La durée d’exposition du mot s’ajuste par petits pas.</p>' +
      '<p id="french-voice-status">' +
      (hasFrenchVoice()
        ? 'Une voix française locale est disponible.'
        : 'Aucune voix française locale détectée : la dictée reste désactivée.') +
      '</p><button class="secondary" id="test-french-voice">Vérifier la voix française</button></details>' +
      '<details class="parent-details"><summary>Lecture, sons et accessibilité</summary>' +
      settingsHTML() +
      '</details>' +
      '<details class="parent-details"><summary>Jeux et messages</summary><p>Les jeux restent accessibles sans condition de résultat. Les messages sur les pensées sont facultatifs.</p>' +
      ['flow', 'potion', 'circuit', 'cross', 'maze', 'pattern', 'logic']
        .map(
          (type) =>
            '<label class="toggle">' +
            typeName[type] +
            '<input type="checkbox" data-family="' +
            type +
            '" ' +
            (state.settings.disabled.includes(type) ? '' : 'checked') +
            '></label>',
        )
        .join('') +
      '<label class="field">Entre les énigmes<select data-setting="transition"><option value="door" ' +
      (state.settings.transition === 'door' ? 'selected' : '') +
      '>Une porte s’ouvre</option><option value="fade" ' +
      (state.settings.transition === 'fade' ? 'selected' : '') +
      '>Une étoile</option></select></label>' +
      toggle('messages', 'Activer de rares messages sur les pensées et l’incertitude') +
      '</details>' +
      '<details class="parent-details"><summary>Leçons explicites et niveau des maths</summary><p>Le bloc de maths revient aux leçons choisies. Les autres compétences du programme sont disponibles dans S’entraîner. Les paliers proposent des contenus : ils ne mesurent pas automatiquement un niveau scolaire.</p>' +
      GUIDED_SKILLS.map(
        (skill) =>
          '<label class="toggle">' +
          skill.label +
          '<input type="checkbox" data-focus="' +
          skill.id +
          '" ' +
          (state.journey.focusSkills.includes(skill.id) ? 'checked' : '') +
          '></label>',
      ).join('') +
      '<label class="field">Point de départ des nouvelles leçons<select id="journey-start-tier">' +
      STAGE_LABELS.map(
        (label, i) =>
          '<option value="' +
          i +
          '" ' +
          (state.journey.startTier === i ? 'selected' : '') +
          '>' +
          label +
          '</option>',
      ).join('') +
      '</select></label></details>' +
      '<details class="parent-details"><summary>Carnet privé des adultes</summary><p>Ces notes restent sur cet appareil.</p><label class="field">Une observation<textarea id="note-text" maxlength="700"></textarea></label><button class="secondary" id="add-note">Garder cette note</button><div id="notes">' +
      notesHTML() +
      '</div><button class="quiet" id="export-notes">Exporter les notes</button><button class="quiet" id="delete-notes">Effacer les notes</button></details>' +
      '<details class="parent-details"><summary>Guide de la première semaine</summary><p>Une séance peut être plus courte que le plan. Chaque étape peut être gardée pour plus tard, sans retard à rattraper. Observez le plaisir, la fatigue et la clarté des consignes avant de chercher une hausse des résultats.</p><p>Aucun exercice de traitement du TOC n’est intégré. L’application reste utilisable sans les messages sur les pensées.</p><p>Installation sur iPad : Safari → Partager → Sur l’écran d’accueil. Disponibilité hors ligne : ' +
      esc(offlineLabel || 'à vérifier avec une connexion') +
      '. Le menu Sauvegarde garde le code et le lien de voyage pour les autres appareils.</p><p>Les données suivies sont décrites dans le rapport parent. Les notes et les réglages restent locaux.</p></details>' +
      mathSettingsHTML() +
      '<button class="primary" id="parent-done">Revenir au jeu</button>',
  );
  bindClose();
  bindSettings();
  $('#start-positioning').onclick = startPositioning;
  modal.querySelectorAll('[data-focus]').forEach(
    (e) =>
      (e.onchange = () => {
        const set = new Set(state.journey.focusSkills);
        if (e.checked) set.add(e.dataset.focus);
        else set.delete(e.dataset.focus);
        if (!set.size) {
          e.checked = true;
          return;
        }
        state.journey.focusSkills = [...set];
        save();
      }),
  );
  $('#journey-start-tier').onchange = (e) => {
    state.journey.startTier = Number(e.target.value);
    save();
  };
  $('#coverage-open').onclick = () => showCoverage(true);
  $('#reading-report').onclick = openReadingReport;
  $('#math-start-tier').onchange = (e) => {
    state.trainingSettings.mathStart = Number(e.target.value);
    state.trainingSettings.mathStarts = {};
    save();
  };
  $('#math-fast').onchange = (e) => {
    state.trainingSettings.mathFast = Number(e.target.value);
    save();
  };
  for (const [id, key] of [
    ['reading-level', 'readingLevel'],
    ['language-start', 'languageStart'],
    ['school-math-start', 'schoolMathStart'],
  ])
    $('#' + id).onchange = (e) => {
      state.trainingSettings[key] = Number(e.target.value);
      save();
    };
  for (const [id, key] of [
    ['language-focus', 'languageFocus'],
    ['math-focus', 'mathFocus'],
  ])
    $('#' + id).onchange = (e) => {
      state.trainingSettings[key] = e.target.value;
      save();
    };
  $('#daily-language').onchange = (e) => {
    state.trainingSettings.dailyLanguage = e.target.checked;
    save();
  };
  $('#reading-tracking').onchange = (e) => {
    state.trainingSettings.tracking = e.target.checked;
    save();
  };
  $('#word-tiles').onchange = (e) => {
    state.trainingSettings.tiles = e.target.checked;
    save();
  };
  $('#flash-fast').onchange = (e) => {
    state.trainingSettings.flashFast = Number(e.target.value);
    save();
  };
  $('#test-french-voice').onclick = () => {
    const available = hasFrenchVoice();
    $('#french-voice-status').textContent = available
      ? 'Une voix française locale est disponible.'
      : 'Aucune voix française locale détectée. La dictée reste désactivée.';
    if (available) speak('Les gardiens préparent une nouvelle histoire.');
  };
  modal.querySelectorAll('[data-family]').forEach(
    (e) =>
      (e.onchange = () => {
        const t = e.dataset.family;
        state.settings.disabled = state.settings.disabled.filter((x) => x !== t);
        if (!e.checked) state.settings.disabled.push(t);
        save();
        if (current?.type === t && !e.checked) {
          current = null;
          view = 'castle';
          cancelHint();
          renderCastle();
        } else if (view === 'castle') renderCastle();
        else if (view === 'room') renderRoom();
      }),
  );
  $('#add-note').onclick = () => {
    const text = $('#note-text').value.trim();
    if (!text) return;
    state.notes.push({ date: new Date().toISOString(), text });
    state.notes = state.notes.slice(-30);
    save();
    $('#note-text').value = '';
    $('#notes').innerHTML = notesHTML();
  };
  $('#export-notes').onclick = () =>
    download(
      'notes-gardiens.json',
      JSON.stringify({ notes: state.notes }, null, 2),
      'application/json',
    );
  $('#delete-notes').onclick = () => {
    if (!state.notes.length) return;
    $('#delete-notes').textContent = 'Confirmer l’effacement';
    $('#delete-notes').onclick = () => {
      state.notes = [];
      save();
      $('#notes').innerHTML = notesHTML();
      $('#delete-notes').textContent = 'Notes effacées';
    };
  };
  $('#parent-done').onclick = () => {
    modal.close();
    if (view === 'castle') renderCastle();
  };
}
function mathSettingsHTML() {
  return `<h3>Point de départ en mathématiques</h3><label class="field">Étape de départ des nouveaux blocs<select id="math-start-tier">${[0, 1, 2, 3, 4, 5].map((i) => `<option value="${i}" ${state.trainingSettings.mathStart === i ? 'selected' : ''}>${i + 1} · ${['Bases CM1', 'Consolider les bases', 'Entrée CM2', 'CM2 intermédiaire', 'CM2 avancé', 'Vers la sixième'][i]}</option>`).join('')}</select></label><label class="field">Repère de réponse rapide pour les faits<select id="math-fast">${[4000, 6000, 10000].map((ms) => `<option value="${ms}" ${state.trainingSettings.mathFast === ms ? 'selected' : ''}>${ms / 1000} secondes</option>`).join('')}</select></label><p class="smallnote">Repères locaux, sans norme clinique. Une étape en cours garde son niveau. Les aides permettent aussi de choisir plus simple ou plus difficile.</p>`;
}
function notesHTML() {
  return state.notes
    .slice()
    .reverse()
    .map(
      (n) =>
        `<div class="note"><time>${esc(new Date(n.date).toLocaleDateString('fr-FR'))}</time>${esc(n.text)}</div>`,
    )
    .join('');
}
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type })),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function journeyControls() {
  if (!activeJourney) return;
  const old = $('#journey-controls');
  if (old) old.remove();
  const el = document.createElement('div');
  el.id = 'journey-controls';
  el.className = 'journey-controls';
  el.innerHTML = /* HTML */ `<button data-journey="easier">Un peu plus simple</button
    ><button data-journey="harder">Un peu plus difficile</button
    ><button data-journey="skip">Une autre étape ↗</button>`;
  const menu = $('#activity-options');
  if (menu) menu.append(el);
  else {
    const details = document.createElement('details');
    details.className = 'activity-options';
    details.innerHTML = '<summary>Aides et autres choix</summary>';
    details.append(el);
    main.append(details);
  }
  el.querySelectorAll('[data-journey]').forEach(
    (b) =>
      (b.onclick = () => {
        const item = activeJourney;
        if (state.journey.current)
          finishStep(state.journey, item, { skipped: true }, JOURNEY_CATALOG);
        if (b.dataset.journey !== 'skip') {
          adjustStage(state.journey, item.skill, b.dataset.journey === 'easier' ? -1 : 1);
          goAdventure({ advance: true, skill: item.skill });
        } else goAdventure({ advance: true });
      }),
  );
}
function goAdventure(options = {}) {
  if (!cloud.profile && !guestSession) {
    openSchoolAccount(() => goAdventure(options));
    return;
  }
  clearScreen();
  stopVoice();
  cancelHint();
  activeJourney = null;
  trainingGame = false;
  if (modal.open) modal.close();
  const plan = currentDayPlan(),
    day = plan.day;
  const step = options.step || nextPlanStep(plan);
  if (!step) return navigate('castle');
  view = 'daily-play';
  setNav('castle');
  const complete = () => {
    finishPlanStep(state.training, day, step);
    save();
    goAdventure();
  };
  const stepFinished = () => {
    finishPlanStep(state.training, day, step);
    save();
  };
  const skip = () => {
    finishPlanStep(state.training, day, step, true);
    save();
    navigate('castle');
  };
  const text = TEXTS.find((t) => t.id === plan.textId);
  if (step === 'reading') {
    if (!text) return skip();
    screenCleanup = mountReading(
      main,
      { ...readingContext(complete, skip, day), onStepFinished: stepFinished },
      text,
    );
  } else if (step === 'words') {
    const phrase = dailyLanguage(plan);
    const openPhrase = () => {
      clearScreen();
      view = 'daily-play';
      renderLearningActivity(
        main,
        {
          state,
          save,
          speak,
          stopVoice,
          story,
          onPause: () => navigate('castle'),
          onBrowse: () => navigate('castle'),
          onNext: complete,
          onOutcome: () => {
            plan.languageFinished = true;
            stepFinished();
          },
        },
        phrase.id,
      );
    };
    if (plan.wordsFinished && !phrase) return complete();
    if (phrase && plan.wordsFinished) openPhrase();
    else
      screenCleanup = mountWordWork(
        main,
        {
          ...readingContext(phrase ? openPhrase : complete, skip, day),
          onStepFinished: () => {
            if (phrase) {
              plan.wordsFinished = true;
              save();
            } else stepFinished();
          },
          nextLabel: phrase ? 'Ma phrase du jour' : 'Continuer',
        },
        { text },
      );
  } else if (step === 'math') {
    if (plan.mathBlock) {
      screenCleanup = mountMath(
        main,
        {
          ...readingContext(complete, skip, day),
          onStepFinished: stepFinished,
          onLesson: (block, tier) =>
            openMathLesson(block, tier, () => goAdventure({ step: 'math' })),
          onFinishPause: () => {
            finishPlanStep(state.training, day, 'math');
            save();
          },
        },
        { session: plan.id, block: plan.mathBlock, tier: plan.mathTier },
      );
      main.focus({ preventScroll: true });
      return;
    }
    const item = ACTIVITY_BY_ID[plan.mathId];
    if (!item) return skip();
    let responded = false;
    renderLearningActivity(
      main,
      {
        state,
        save,
        speak,
        stopVoice,
        story,
        onPause: () => navigate('castle'),
        onBrowse: () => navigate('castle'),
        onNext: () => (responded ? complete() : skip()),
        onOutcome: (outcome) => {
          if (responded) return;
          responded = true;
          stepFinished();
        },
      },
      item.id,
    );
    const menu = $('#activity-options') || document.createElement('details');
    if (!$('#activity-options')) {
      menu.className = 'activity-options';
      menu.innerHTML = '<summary>Aides et autres choix</summary>';
      main.append(menu);
    }
    const button = document.createElement('button');
    button.className = 'quiet';
    button.id = 'day-skip';
    button.textContent = 'Garder cette étape pour plus tard';
    button.onclick = skip;
    menu.append(button);
  } else if (step === 'game') {
    if (!plan.gameId) return skip();
    dailyGame = { id: plan.gameId, day };
    trainingGame = true;
    start(plan.gameId);
  }
  main.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function changeDailyGame() {
  const plan = currentDayPlan();
  const games = JOURNEY_CATALOG.filter(
    (g) => g.kind === 'game' && g.tier === 0 && !state.settings.disabled.includes(g.type),
  );
  plan.gameId = choosePlanGame(state.training, games)?.id || null;
  save();
  goAdventure({ step: 'game' });
}
function dailyGameOptions() {
  const details = document.createElement('details');
  details.className = 'activity-options';
  details.innerHTML =
    '<summary>Autres choix</summary><button class="quiet" id="daily-other-game">Un autre jeu</button><button class="quiet" id="daily-game-skip">Terminer sans ce jeu</button>';
  main.append(details);
  $('#daily-other-game').onclick = changeDailyGame;
  $('#daily-game-skip').onclick = () => {
    const plan = currentDayPlan();
    finishPlanStep(state.training, plan.day, 'game', true);
    save();
    navigate('castle');
  };
}
function startExtra(l, inJourney = false) {
  beginGameTime(l.id);
  if (!inJourney) activeJourney = null;
  const daily = dailyGame?.id === l.id;
  const practice = trainingGame && !inJourney && !daily;
  if (!allowed(l)) return navigate('castle');
  stopVoice();
  cancelHint();
  if (modal.open) modal.close();
  view = 'play';
  current = l;
  setNav(practice ? 'library' : 'castle');
  const intro = takeIntro(state, l.id, introCount);
  if (intro) introCount++;
  save();
  mountExtra(main, l, {
    board: state.extraBoards[l.id],
    intro,
    speak,
    onSave: (b) => {
      state.extraBoards[l.id] = b;
      save();
    },
    onExit: () => (practice ? showExtraMenu(l.type, l.tier) : navigate('castle')),
    onPause: () => (practice ? renderTrainingGames() : navigate('pause')),
    onControls: () => (inJourney ? journeyControls() : null),
    onDone: ({ correct, assisted, explanation }) => {
      if (correct) {
        const loot = awardTreasure(
          state,
          'game:' + l.id + ':' + (gameClock?.rewardId || eventStamp().id),
          l.tier,
        );
        if (loot) showTreasure(loot, true);
      }
      completeDailyGame(l.id);
      if (!state.extraCompleted.includes(l.id)) state.extraCompleted.push(l.id);
      if (activeJourney)
        finishStep(state.journey, activeJourney, { correct, assisted }, JOURNEY_CATALOG);
      save();
      playCue(correct ? 'success' : 'retry');
      dialog(
        /* HTML */ `<div class="success">
          <div class="fade-star">✦</div>
          <h2 id="modal-title">
            ${correct ? 'Une belle trouvaille !' : 'Une idée de plus à emporter.'}
          </h2>
          <p>
            ${correct
              ? 'Tu as exploré cette énigme.'
              : 'Tu peux garder l’explication et continuer vers une autre découverte.'}
          </p>
          ${explanation ? `<p>${esc(explanation)}</p>` : ''}<button class="primary" id="extra-next">
            ${daily
              ? 'Terminer ma séance'
              : practice
                ? 'Choisir une autre énigme'
                : 'Poursuivre l’aventure'}
            ↗</button
          ><button class="quiet" id="extra-done-pause">
            ${practice ? 'Retour aux jeux' : 'Faire une pause'}</button
          ><button class="quiet" id="extra-home">
            ${practice ? 'Retour à l’entraînement' : 'Explorer le château'}
          </button>
        </div>`,
      );
      $('#extra-next').onclick = () =>
        daily
          ? navigate('castle')
          : practice
            ? showExtraMenu(l.type, l.tier)
            : goAdventure({ advance: true });
      $('#extra-done-pause').onclick = () => (practice ? renderTrainingGames() : navigate('pause'));
      $('#extra-home').onclick = () => navigate(practice ? 'library' : 'castle');
    },
  });
  if (daily) dailyGameOptions();
  main.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function showExtraMenu(type, tier = 0) {
  clearScreen();
  dailyGame = null;
  activeJourney = null;
  trainingGame = true;
  view = 'extra-menu';
  setNav('library');
  main.innerHTML = /* HTML */ `<div class="page-head">
      <button class="back" id="extra-menu-back" aria-label="Retour">←</button>
      <div>
        <p class="eyebrow">Jeux et énigmes</p>
        <h1>${EXTRA_NAMES[type]}</h1>
      </div>
    </div>
    <div class="difficulty">
      ${STAGE_LABELS.map(
        (n, i) =>
          `<button data-extra-tier="${i}" class="${i === tier ? 'selected' : ''}">${i + 1} · ${n}</button>`,
      ).join('')}
    </div>
    <div class="levels">
      ${EXTRA_LEVELS.filter((l) => l.type === type && l.tier === tier)
        .map(
          (l) =>
            `<button class="level" data-extra-level="${l.id}"><span class="type-icon">${EXTRA_ICONS[type]}</span><strong>Énigme ${l.index + 1}</strong><small>${state.extraCompleted.includes(l.id) ? 'Déjà explorée' : 'À découvrir'}</small></button>`,
        )
        .join('')}
    </div>`;
  $('#extra-menu-back').onclick = renderTrainingGames;
  main
    .querySelectorAll('[data-extra-tier]')
    .forEach((b) => (b.onclick = () => showExtraMenu(type, Number(b.dataset.extraTier))));
  main
    .querySelectorAll('[data-extra-level]')
    .forEach((b) => (b.onclick = () => start(b.dataset.extraLevel)));
}
function showCoverage(parent = false) {
  dialog(
    dialogTop('La carte du programme CM2') +
      coverageHTML() +
      (parent
        ? '<button class="secondary" id="coverage-back">Réglages parent</button>'
        : '<button class="secondary" id="coverage-close">Fermer</button>'),
  );
  bindClose();
  if (parent) $('#coverage-back').onclick = openParents;
  else $('#coverage-close').onclick = () => modal.close();
}
function openReadingReport() {
  dialog(
    dialogTop('Suivi de la pratique') +
      reportHTML(state) +
      '<details class="parent-details"><summary>Sauvegarde complète de la progression</summary><p>Un fichier qui contient tout le parcours : exercices, lumières, collection, histoire. Utile en secours, ou pour reprendre une progression de l’ancienne version de l’application.</p><button class="secondary" id="save-export">Télécharger la sauvegarde</button><label class="field">Reprendre une sauvegarde : choisir le fichier<input type="file" id="save-import-file" accept=".json,.txt,application/json,text/plain" /></label><label class="field">ou coller son contenu<textarea id="save-import-text" rows="3"></textarea></label><button class="primary" id="save-import">Ajouter cette progression</button><p id="save-import-status" role="status" class="subtle">La progression importée s’ajoute à celle-ci : rien n’est effacé.</p></details>' +
      '<button class="secondary" id="report-back">Réglages parent</button>',
  );
  bindClose();
  $('#report-back').onclick = openParents;
  $('#save-export').onclick = () =>
    download(
      'fil-or-sauvegarde-' + calendarDay() + '.json',
      JSON.stringify(snapshot(state)),
      'application/json',
    );
  $('#save-import').onclick = async () => {
    const status = $('#save-import-status');
    try {
      const file = $('#save-import-file').files?.[0];
      let raw = file ? await file.text() : $('#save-import-text').value;
      raw = raw.trim();
      let data = JSON.parse(raw);
      if (typeof data === 'string') data = JSON.parse(data);
      const incoming = restore(data);
      if (!incoming.completed.length && !incoming.collection.earned.length && !Object.keys(incoming.learning.outcomes || {}).length && !incoming.training.readings.length)
        throw Error('vide');
      const merged = mergeProgress(snapshot(state), snapshot(incoming));
      state = restore({
        ...merged,
        settings: state.settings,
        trainingSettings: state.trainingSettings,
        pin: state.pin,
        notes: state.notes,
      });
      reconcileAcademy(state);
      reconcileCollection(state);
      state.extraBoards = restoreExtras(state.extraBoards);
      save();
      cloud.changed();
      status.textContent = 'Progression ajoutée : ' + state.collection.earned.length + ' objets, ' + (state.academy.unlocked.length) + ' apprentissages confirmés.';
    } catch (e) {
      status.textContent = e.message === 'vide' ? 'Ce fichier ne contient pas de progression.' : 'Ce texte n’est pas une sauvegarde lisible. Vérifiez qu’il est complet.';
    }
  };
  $('#observations-csv').onclick = () =>
    download(
      'observations-gardiens-v7.csv',
      observationsCSV(state.training),
      'text/csv;charset=utf-8',
    );
}
function openSchoolAccount(onReady = null, mode = cloud.profile ? 'manage' : 'create') {
  if (screenCleanup) navigate('castle');
  const enter = () => {
    modal.close();
    renderCastle();
    if (typeof onReady === 'function') onReady();
  };
  if (mode === 'manage' && cloud.profile) {
    dialog(
      `${dialogTop('Mon compte de magicienne')}<div class="school-account"><div class="account-emblem" aria-hidden="true">✦</div><h3>${esc(cloud.profile.name)}</h3><p id="school-account-status" role="status">${esc(cloud.status)}</p><button class="primary" id="school-account-continue">Retour au château</button><button class="secondary" id="school-account-sync">Synchroniser maintenant</button><details class="parent-details"><summary>Changer de compte ou retrouver un ancien code</summary><p>Chaque magicienne garde son propre parcours. Les réglages et notes des parents restent sur cet appareil.</p><button class="quiet" id="school-account-change">Ouvrir un autre compte</button><button class="quiet" id="school-account-legacy">Code de voyage et copie du parcours</button></details></div>`,
    );
    bindClose();
    $('#school-account-continue').onclick = enter;
    $('#school-account-sync').onclick = async () => {
      await cloud.sync();
      $('#school-account-status').textContent = cloud.status;
    };
    $('#school-account-change').onclick = () => openSchoolAccount(onReady, 'login');
    $('#school-account-legacy').onclick = openJourneyAccount;
    return;
  }
  const creating = mode === 'create';
  dialog(
    `${dialogTop(creating ? 'Ton inscription à l’école' : 'Retrouve ton école')}<div class="school-account"><div class="account-emblem" aria-hidden="true">✦</div><p>${creating ? 'Choisis ton nom de magicienne et un petit code. Ton travail déjà fait sera conservé.' : 'Entre le même nom et le même code que sur ton autre appareil.'}</p><form id="school-account-form"><label class="field">Nom de magicienne<input id="school-name" name="username" autocomplete="username" maxlength="24" minlength="2" value="${esc(cloud.profile?.name || '')}" required></label><label class="field">Code secret · 4 à 6 chiffres<input id="school-code" name="password" type="password" inputmode="numeric" autocomplete="${creating ? 'new-password' : 'current-password'}" pattern="[0-9]{4,6}" minlength="4" maxlength="6" required></label><p id="school-account-status" role="status"></p><button class="primary" id="school-account-submit" type="submit">${creating ? 'Créer mon compte' : 'Retrouver ma progression'}</button></form><button class="quiet" id="school-account-mode">${creating ? 'J’ai déjà un compte' : 'Créer un nouveau compte'}</button><details class="parent-details"><summary>Ancienne sauvegarde ou absence de connexion</summary><button class="secondary" id="school-account-legacy">J’ai un code de voyage</button><button class="quiet" id="school-account-local">Continuer sur cet appareil</button><p class="smallnote">Le mode local garde le travail ici. Sur un autre appareil, il suffit d’entrer le même nom et le même petit code.</p></details></div>`,
  );
  bindClose();
  $('#school-account-mode').onclick = () =>
    openSchoolAccount(onReady, creating ? 'login' : 'create');
  $('#school-account-legacy').onclick = openJourneyAccount;
  $('#school-account-local').onclick = () => {
    guestSession = true;
    enter();
  };
  $('#school-account-form').onsubmit = async (event) => {
    event.preventDefault();
    const name = $('#school-name').value.trim(),
      pin = $('#school-code').value;
    const button = $('#school-account-submit'),
      status = $('#school-account-status');
    button.disabled = true;
    status.textContent = creating
      ? 'Enregistrement de ton parcours…'
      : 'Recherche de ton parcours…';
    try {
      if (creating) await cloud.createAccount(name, pin);
      else await cloud.connectAccount(name, pin);
      guestSession = false;
      if (creating) {
        dialog(
          `${dialogTop('Bienvenue à l’école')}<div class="school-account"><div class="account-emblem" aria-hidden="true">✦</div><h3>${esc(name)}</h3><p>Ton parcours est enregistré. Garde ces deux repères pour un autre appareil.</p><dl class="account-reminder"><dt>Nom</dt><dd>${esc(name)}</dd><dt>Code</dt><dd>${esc(pin)}</dd></dl><button class="primary" id="school-account-enter">Ouvrir la carte du monde</button></div>`,
        );
        bindClose();
        $('#school-account-enter').onclick = enter;
      } else enter();
    } catch (error) {
      status.textContent =
        error.message === 'name'
          ? 'Choisis un nom de 2 à 24 lettres ou chiffres.'
          : error.message === 'pin'
            ? 'Choisis un code de 4 à 6 chiffres.'
            : error.status === 409
              ? 'Ce nom et ce code existent déjà. Choisis « J’ai déjà un compte ».'
              : error.status === 404
                ? 'Ce nom et ce code ne retrouvent pas de compte. Vérifie-les tous les deux.'
                : error.message === 'busy'
                  ? 'La sauvegarde termine sa connexion. Réessaie dans un instant.'
                  : 'La connexion ne répond pas. Le travail déjà présent reste sur cet appareil ; tu peux continuer en mode local.';
      button.disabled = false;
    }
  };
}
function openJourneyAccount() {
  if (screenCleanup) navigate('castle');
  dialog(
    `${dialogTop('Mon parcours')}<p>Un code de voyage retrouve les jeux terminés, les ateliers et la place dans l’aventure sur vos appareils.</p><p>Les notes des parents, leur code et les réglages de lecture restent sur cet appareil.</p><p id="account-status" role="status">${esc(cloud.status)}</p>${cloud.code && !incomingTravelCode ? `<button class="secondary" id="account-refresh">Synchroniser maintenant</button><button class="quiet" id="account-show">Afficher mon code de voyage</button><div id="account-code"></div><button class="quiet" id="account-unlink">Déconnecter cet appareil</button><details class="parent-details"><summary>Supprimer la sauvegarde partagée</summary><p>Les copies déjà présentes sur les appareils restent conservées. Pour empêcher leur renvoi, déconnectez aussi les autres appareils.</p><button id="account-delete" class="secondary">Supprimer la sauvegarde du serveur</button></details>` : `${incomingTravelCode ? '<p>Un lien de voyage a prérempli le code. Choisissez « Retrouver mon parcours » pour réunir les découvertes.</p>' : '<button class="primary" id="account-create">Créer mon code et garder ce parcours</button><hr>'}<form id="account-connect"><label class="field">J’ai déjà un code de voyage<input id="travel-code" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="26" placeholder="XXXXX-XXXXX-XXXXX-XXXXX" value="${incomingTravelCode || ''}" required></label><p class="subtle">Les découvertes de cet appareil seront réunies avec celles du parcours retrouvé.</p><button class="secondary" type="submit">Retrouver mon parcours</button></form>`}<button class="quiet" id="account-export">Télécharger une copie du parcours</button><p class="smallnote">Sans connexion, tu peux continuer. Les nouvelles étapes seront envoyées lorsque la connexion reviendra. Conservez le code : il ne peut pas être retrouvé par un nom ou un e-mail.</p>`,
  );
  bindClose();
  const status = (t) => {
    const el = $('#account-status');
    if (el) el.textContent = t;
  };
  const showCode = () => {
    const el = $('#account-code');
    el.innerHTML = /* HTML */ `<label class="field"
        >Code à conserver<input
          readonly
          id="travel-code-copy"
          value="${cloud.code}"
          aria-label="Code de voyage à conserver" /></label
      ><button class="quiet" id="copy-travel-code">Copier le code</button
      ><label class="field"
        >Lien à ouvrir sur l’autre appareil<input
          readonly
          id="travel-link-copy"
          value="${esc(createTravelLink(location.href, cloud.code))}" /></label
      ><button class="secondary" id="copy-travel-link">Copier le lien</button>
      <p class="subtle">
        Ce lien contient le code de voyage : gardez-le pour vous.
      </p>`;
    $('#copy-travel-link').onclick = async () => {
      try {
        await navigator.clipboard.writeText(createTravelLink(location.href, cloud.code));
        status('Lien copié. Ouvrez-le sur l’autre appareil.');
      } catch {
        status('Sélectionnez le lien pour le copier.');
      }
    };
    $('#copy-travel-code').onclick = async () => {
      try {
        await navigator.clipboard.writeText(cloud.code);
        status('Code copié.');
      } catch {
        status('Sélectionnez le code pour le copier.');
      }
    };
  };
  if (cloud.code && !incomingTravelCode) {
    $('#account-show').onclick = showCode;
    $('#account-refresh').onclick = async () => {
      await cloud.sync();
      status(cloud.status);
      if (view === 'castle') renderCastle();
    };
    $('#account-unlink').onclick = () => {
      cloud.disconnect();
      openJourneyAccount();
    };
    $('#account-delete').onclick = () => {
      status('Cliquez une seconde fois pour confirmer la suppression du serveur.');
      $('#account-delete').onclick = async () => {
        try {
          await cloud.remove();
          openJourneyAccount();
        } catch {
          status('Suppression indisponible. Réessayez avec une connexion.');
        }
      };
    };
  } else {
    if ($('#account-create'))
      $('#account-create').onclick = async () => {
        const button = $('#account-create');
        button.disabled = true;
        status('Création de la sauvegarde…');
        try {
          await cloud.create();
          openJourneyAccount();
          showCode();
        } catch {
          status(
            'La sauvegarde partagée n’est pas disponible. Votre parcours reste sur cet appareil.',
          );
          button.disabled = false;
        }
      };
    $('#account-connect').onsubmit = async (e) => {
      e.preventDefault();
      const code = $('#travel-code').value,
        button = $('#account-connect button');
      button.disabled = true;
      status('Recherche du parcours…');
      try {
        await cloud.connect(code);
        incomingTravelCode = null;
        openJourneyAccount();
        if (view === 'castle') renderCastle();
      } catch (error) {
        status(
          error.status === 404
            ? 'Ce code ne correspond pas à un parcours de ce compte.'
            : error.message === 'code'
              ? 'Vérifiez les vingt caractères du code.'
              : 'Connexion indisponible. Votre parcours local est conservé.',
        );
        button.disabled = false;
      }
    };
  }
  $('#account-export').onclick = () =>
    download(
      'parcours-gardiens.json',
      JSON.stringify(
        {
          format: 'fil-or-backup-v1',
          progress: JSON.parse(
            JSON.stringify(state, (k, v) =>
              ['pin', 'notes', 'settings', 'trainingSettings'].includes(k) ? undefined : v,
            ),
          ),
        },
        null,
        2,
      ),
      'application/json',
    );
}
$('#home').onclick = () => navigate('castle');
$('#nav-castle').onclick = () => navigate('castle');
$('#nav-progress').onclick = () => navigate('progress');
$('#nav-library').onclick = () => navigate('library');
$('#parents').onclick = openParentGate;
$('#access').onclick = openAccess;
modal.addEventListener('close', () => {
  stopVoice();
  if (view === 'play') active = -1;
});
document.addEventListener('visibilitychange', () => {
  if (gameClock) {
    if (document.hidden && gameClock.start !== null) {
      gameClock.elapsed += performance.now() - gameClock.start;
      gameClock.start = null;
    } else if (!document.hidden && gameClock.start === null) gameClock.start = performance.now();
  }
  if (document.hidden) {
    stopVoice();
    if (audio) audio.suspend();
  }
});
applySettings();
renderCastle();
if (incomingTravelCode) openJourneyAccount();
$('#journey-account').onclick = () => openSchoolAccount();
cloud.init().then(() => {
  if (view === 'castle') renderCastle();
});
window.addEventListener?.('online', () => cloud.sync());
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) cloud.sync();
});
if (!storageOK) updateSaveStatus();
if ('serviceWorker' in navigator) {
  let refreshing = false;
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !refreshing) {
      refreshing = true;
      if (
        !['play', 'learning-play', 'daily-play', 'reading-play', 'word-play', 'math-play'].includes(
          view,
        ) &&
        !modal.open
      )
        location.reload();
      else toast('Une nouvelle version est prête. Recharge la page quand tu le souhaites.');
    }
  });
  navigator.serviceWorker
    .register('./sw.js', { updateViaCache: 'none' })
    .then(async (reg) => {
      reg.update().catch(() => {});
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) reg.update().catch(() => {});
      });
      await navigator.serviceWorker.ready;
      offlineLabel = 'disponible hors ligne';
      updateSaveStatus();
    })
    .catch(() => {
      offlineLabel = 'hors ligne indisponible';
      updateSaveStatus();
    });
}
