import { restoreMath, mergeMath } from './math-core.mjs';
// V7 practice observations are deliberately separate from school-level assessment.
// Durations use a monotonic clock in the UI; dates below only schedule calendar returns.
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const WORD = /^[\p{L}’'-]{1,35}$/u;
const STEPS = ['reading', 'words', 'math', 'game'];
const bounded = (n, min, max) => Number.isFinite(n) && n >= min && n <= max;
const records = (xs, accept, limit) => (Array.isArray(xs) ? xs.filter(accept).slice(-limit) : []);
const safeId = (x) => typeof x === 'string' && /^[\p{L}\p{N}_-]{1,100}$/u.test(x);
export function calendarDay(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
export function addDays(day, count) {
  return new Date(Date.parse(day + 'T12:00:00Z') + count * 86400000).toISOString().slice(0, 10);
}
export function eventId() {
  return (
    globalThis.crypto?.randomUUID?.() ||
    'e-' + Date.now() + '-' + Math.random().toString(36).slice(2)
  );
}
export function eventStamp(day = calendarDay()) {
  return { id: eventId(), day, at: Date.now() };
}
const orderTime = (e) => (Number.isFinite(e.at) ? e.at : Date.parse(e.day + 'T12:00:00Z'));
export function restoreTraining(raw) {
  const t = {
    version: 1,
    readings: [],
    starts: [],
    judgments: [],
    wordEvents: [],
    plans: {},
    planArchive: [],
    school: [],
    games: [],
    math: restoreMath(null),
    castle: { room: null, at: 0 },
  };
  if (!raw || raw.version !== 1) return t;
  t.castle =
    raw.castle && /^[\w-]{1,40}$/.test(raw.castle.room || '')
      ? { room: raw.castle.room, at: Number.isFinite(raw.castle.at) ? raw.castle.at : 0 }
      : { room: null, at: 0 };
  t.math = restoreMath(raw.math);
  const dated = (e) => e && safeId(e.id) && DAY.test(e.day);
  t.starts = records(raw.starts, (e) => dated(e) && safeId(e.textId), 500).map((e) => ({
    id: e.id,
    day: e.day,
    at: orderTime(e),
    textId: e.textId,
  }));
  t.readings = records(
    raw.readings,
    (e) =>
      dated(e) &&
      safeId(e.textId) &&
      Number.isInteger(e.level) &&
      e.level >= 0 &&
      e.level < 3 &&
      bounded(e.duration, 0, 3600000) &&
      Array.isArray(e.answers),
    500,
  ).map((e) => ({
    id: e.id,
    day: e.day,
    at: orderTime(e),
    textId: e.textId,
    level: e.level,
    duration: Math.round(e.duration),
    words: bounded(e.words, 0, 1000) ? Math.round(e.words) : 0,
    eligible: e.eligible === true,
    answers: e.answers
      .filter((a) => a && typeof a === 'object')
      .slice(0, 3)
      .map((a) => ({
        kind: ['literal', 'inference', 'order'].includes(a.kind) ? a.kind : 'literal',
        correct: a.correct === true,
      })),
  }));
  t.judgments = records(
    raw.judgments,
    (e) =>
      dated(e) && typeof e.word === 'string' && WORD.test(e.word) && typeof e.easy === 'boolean',
    1000,
  ).map((e) => ({ id: e.id, day: e.day, at: orderTime(e), word: e.word, easy: e.easy }));
  t.wordEvents = records(
    raw.wordEvents,
    (e) =>
      dated(e) &&
      typeof e.word === 'string' &&
      WORD.test(e.word) &&
      ['flash', 'dictation'].includes(e.kind) &&
      bounded(e.rt, 0, 600000),
    2500,
  ).map((e) => ({
    id: e.id,
    day: e.day,
    at: orderTime(e),
    word: e.word,
    kind: e.kind,
    correct: e.correct === true,
    rt: Math.round(e.rt),
    exposure: bounded(e.exposure, 200, 5000) ? e.exposure : 1000,
    fast: e.fast === true,
    errors: (Array.isArray(e.errors) ? e.errors : [])
      .filter((x) =>
        [
          'graphie complexe',
          'lettre muette',
          'son confondu',
          'inversion',
          'oubli',
          'autre',
        ].includes(x),
      )
      .slice(0, 3),
  }));
  t.school = records(
    raw.school,
    (e) => dated(e) && safeId(e.activityId) && safeId(e.skill),
    1000,
  ).map((e) => ({
    id: e.id,
    day: e.day,
    at: orderTime(e),
    activityId: e.activityId,
    skill: e.skill,
    tier: Number.isInteger(e.tier) && e.tier >= 0 && e.tier < 6 ? e.tier : null,
    format: ['choice', 'text', 'numeric', 'operation', 'guided', 'mission'].includes(e.format)
      ? e.format
      : 'legacy',
    revision: e.revision === 2 ? 2 : 1,
    correct: e.correct === true ? true : e.correct === false ? false : null,
    assisted: e.assisted === true,
  }));
  t.games = records(
    raw.games,
    (e) => dated(e) && safeId(e.gameId) && bounded(e.duration, 0, 14400000),
    500,
  ).map((e) => ({
    id: e.id,
    day: e.day,
    at: orderTime(e),
    gameId: e.gameId,
    duration: Math.round(e.duration),
  }));
  for (const [day, p] of Object.entries(raw.plans || {}).slice(-60)) {
    if (!DAY.test(day) || !p || !safeId(p.id)) continue;
    t.plans[day] = {
      id: p.id,
      day,
      createdAt: Number.isFinite(p.createdAt) && p.createdAt >= 0 ? p.createdAt : 0,
      round: Number.isInteger(p.round) && p.round >= 0 ? Math.min(1000, p.round) : 0,
      ...(p.languageId !== undefined
        ? { languageId: safeId(p.languageId) ? p.languageId : null }
        : {}),
      wordsFinished: p.wordsFinished === true,
      languageFinished: p.languageFinished === true,
      mathMode: ['core', 'school'].includes(p.mathMode) ? p.mathMode : null,
      mathBlock: ['line', 'facts', 'place', 'bars'].includes(p.mathBlock) ? p.mathBlock : null,
      mathTier: Number.isInteger(p.mathTier) ? Math.max(0, Math.min(5, p.mathTier)) : null,
      textId: safeId(p.textId) ? p.textId : null,
      mathId: safeId(p.mathId) ? p.mathId : null,
      gameId: safeId(p.gameId) ? p.gameId : null,
      done: [...new Set((Array.isArray(p.done) ? p.done : []).filter((s) => STEPS.includes(s)))],
      skipped: [
        ...new Set((Array.isArray(p.skipped) ? p.skipped : []).filter((s) => STEPS.includes(s))),
      ],
      readingStarted: p.readingStarted === true,
      readingDraft:
        p.readingDraft &&
        safeId(p.readingDraft.textId) &&
        ['reading', 'questions', 'finished'].includes(p.readingDraft.phase)
          ? {
              textId: p.readingDraft.textId,
              phase: p.readingDraft.phase,
              duration: bounded(p.readingDraft.duration, 0, 3600000)
                ? Math.round(p.readingDraft.duration)
                : 0,
              eligible: p.readingDraft.eligible === true,
              answers: (Array.isArray(p.readingDraft.answers) ? p.readingDraft.answers : [])
                .slice(0, 3)
                .filter((a) => a && ['literal', 'inference', 'order'].includes(a.kind))
                .map((a) => ({ kind: a.kind, correct: a.correct === true })),
            }
          : null,
      judged: p.judged === true,
      wordIds: (Array.isArray(p.wordIds) ? p.wordIds : [])
        .filter((s) => typeof s === 'string' && WORD.test(s))
        .slice(0, 3),
      wordsDone: (Array.isArray(p.wordsDone) ? p.wordsDone : [])
        .filter((s) => typeof s === 'string' && WORD.test(s))
        .slice(0, 3),
    };
  }
  t.planArchive = records(raw.planArchive, (p) => p && safeId(p.id) && DAY.test(p.day), 120).map(
    (p) => ({
      id: p.id,
      day: p.day,
      round: Number.isInteger(p.round) ? p.round : 0,
      gameId: safeId(p.gameId) ? p.gameId : null,
      textId: safeId(p.textId) ? p.textId : null,
    }),
  );
  // Two offline devices can open the same unseen text. Exclude the ambiguous
  // duplicate from speed summaries after merging instead of counting it twice.
  const starts = new Map();
  for (const start of t.starts) starts.set(start.textId, (starts.get(start.textId) || 0) + 1);
  for (const reading of t.readings)
    if ((starts.get(reading.textId) || 0) > 1) reading.eligible = false;
  return t;
}
const unique = (xs) => [...new Map(xs.map((e) => [e.id, e])).values()];
export function mergeTraining(a, b) {
  const x = restoreTraining(a),
    y = restoreTraining(b);
  const out = {
    version: 1,
    plans: { ...x.plans, ...y.plans },
    planArchive: unique([...x.planArchive, ...y.planArchive]),
    castle: x.castle.at > y.castle.at ? x.castle : y.castle,
  };
  for (const day of Object.keys(x.plans))
    if (y.plans[day] && (x.plans[day].round || 0) > (y.plans[day].round || 0))
      out.plans[day] = x.plans[day];
  for (const key of ['readings', 'starts', 'judgments', 'wordEvents', 'school', 'games'])
    out[key] = unique([...x[key], ...y[key]]).sort(
      (a, b) => orderTime(a) - orderTime(b) || a.id.localeCompare(b.id),
    );
  for (const day of Object.keys(y.plans)) {
    const old = x.plans[day],
      local = y.plans[day];
    if (!old || old.id !== local.id) continue;
    out.plans[day] = {
      ...local,
      done: [...new Set([...old.done, ...local.done])],
      skipped: [...new Set([...old.skipped, ...local.skipped])],
      readingStarted: old.readingStarted || local.readingStarted,
      judged: old.judged || local.judged,
      wordsFinished: old.wordsFinished || local.wordsFinished,
      languageFinished: old.languageFinished || local.languageFinished,
      wordsDone: [...new Set([...old.wordsDone, ...local.wordsDone])],
      readingDraft:
        [old.readingDraft, local.readingDraft]
          .filter(Boolean)
          .sort(
            (a, b) =>
              (b.phase === 'finished') - (a.phase === 'finished') ||
              b.answers.length - a.answers.length,
          )[0] || null,
    };
    out.plans[day].skipped = out.plans[day].skipped.filter(
      (step) => !out.plans[day].done.includes(step),
    );
  }
  out.math = mergeMath(x.math, y.math);
  return restoreTraining(out);
}
export function readingSpeed(r) {
  return r.eligible &&
    r.answers.length === 3 &&
    r.answers.filter((a) => a.correct).length >= 2 &&
    r.duration >= 1000 &&
    r.words > 0
    ? Math.round((r.words * 60000) / r.duration)
    : null;
}
export function countWords(text) {
  return (text.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu) || []).length;
}
export function planForDay(
  t,
  { texts, maths, games, level = 0, restart = false },
  day = calendarDay(),
) {
  const previous = t.plans[day];
  if (previous) repairPlanCompletion(t, previous);
  if (previous && (!restart || nextPlanStep(previous))) return previous;
  const round = previous ? (previous.round || 0) + 1 : 0;
  if (previous)
    t.planArchive = [
      ...(t.planArchive || []),
      {
        id: previous.id,
        day,
        round: previous.round || 0,
        gameId: previous.gameId,
        textId: previous.textId,
      },
    ].slice(-120);
  const used = new Set(t.starts.map((s) => s.textId));
  const recentTexts = new Set([
    ...(t.planArchive || []).slice(-3).map((p) => p.textId),
    previous?.textId,
  ]);
  const fresh = texts.filter((text) => text.level === level && !used.has(text.id));
  const unseen = fresh.filter((text) => !recentTexts.has(text.id));
  const lastGenre = texts.find((text) => text.id === t.readings.at(-1)?.textId)?.genre;
  const poolTexts = unseen.length ? unseen : fresh;
  const lastRead = new Map(t.readings.map((r, i) => [r.textId, i]));
  const revisits = texts
    .filter((text) => text.level === level && !recentTexts.has(text.id))
    .sort((a, b) => (lastRead.get(a.id) ?? -1) - (lastRead.get(b.id) ?? -1));
  const text =
    poolTexts.find((text) => text.genre !== lastGenre) ||
    poolTexts[0] ||
    revisits[0] ||
    texts.find((text) => text.level === level);
  const bySkill = [...new Set(maths.map((a) => a.skill))];
  const recent = new Map();
  for (const entry of t.school) recent.set(entry.skill, entry);
  // Due practice is preferred; unsupported/non-ordinal catalogue stages are never auto-promoted.
  const target = bySkill
    .map((skill, i) => ({
      skill,
      i,
      due: recent.has(skill)
        ? addDays(recent.get(skill).day, recent.get(skill).correct ? 4 : 1)
        : '0000',
    }))
    .sort((a, b) => a.due.localeCompare(b.due) || a.i - b.i)[0]?.skill;
  const pool = maths.filter((a) => a.skill === target);
  const doneMath = new Set(t.school.map((s) => s.activityId));
  const math = pool.find((a) => !doneMath.has(a.id)) || pool[0] || maths[0];
  const game = choosePlanGame(t, games);
  return (t.plans[day] = {
    id: eventId(),
    day,
    createdAt: Date.now(),
    round,
    textId: text?.id || null,
    mathId: math?.id || null,
    gameId: game?.id || null,
    done: [],
    skipped: [],
    readingStarted: false,
    readingDraft: null,
    judged: false,
    wordIds: [],
    wordsDone: [],
  });
}
export function repairPlanCompletion(t, plan) {
  const complete = (step) => {
    if (!plan.done.includes(step)) {
      plan.done.push(step);
      plan.skipped = plan.skipped.filter((s) => s !== step);
    }
  };
  if (
    t.readings.some(
      (r) =>
        r.textId === plan.textId &&
        r.day === plan.day &&
        r.answers.length === 3 &&
        (!plan.createdAt || r.at >= plan.createdAt),
    )
  )
    complete('reading');
  if (
    (!plan.languageId || plan.languageFinished) &&
    plan.judged &&
    plan.wordIds.length &&
    plan.wordIds.every((word) => plan.wordsDone.includes(word))
  )
    complete('words');
  if (new Set(t.math.events.filter((e) => e.session === plan.id).map((e) => e.slot)).size === 6)
    complete('math');
  return plan;
}
export function choosePlanGame(t, games) {
  const prior = [
    ...new Map(
      [...(t.planArchive || []), ...Object.values(t.plans)]
        .filter((p) => p.gameId)
        .map((p) => [p.id, p]),
    ).values(),
  ];
  const lastGame = games.find((g) => g.id === prior.at(-1)?.gameId);
  const used = new Set([...prior.map((p) => p.gameId), ...t.games.map((g) => g.gameId)]);
  const counts = new Map();
  for (const p of prior) {
    const type = games.find((g) => g.id === p.gameId)?.type;
    if (type) counts.set(type, (counts.get(type) || 0) + 1);
  }
  const unplayed = games.filter((g) => !used.has(g.id));
  const pool = unplayed.length ? unplayed : games.filter((g) => g.id !== lastGame?.id);
  return (
    [...pool].sort(
      (a, b) =>
        (a.type === lastGame?.type) - (b.type === lastGame?.type) ||
        (counts.get(a.type) || 0) - (counts.get(b.type) || 0),
    )[0] || games[0]
  );
}
export function finishPlanStep(t, day, step, skipped = false) {
  const p = t.plans[day];
  if (!p || !STEPS.includes(step)) return;
  p.done = p.done.filter((s) => s !== step);
  p.skipped = p.skipped.filter((s) => s !== step);
  (skipped ? p.skipped : p.done).push(step);
}
export function nextPlanStep(plan) {
  return STEPS.find((s) => !plan.done.includes(s) && !plan.skipped.includes(s)) || null;
}
export function wordProgress(t, word, day = calendarDay()) {
  const events = t.wordEvents.filter((e) => e.word === word);
  const judgment = t.judgments.filter((e) => e.word === word).at(-1);
  const lastFail = events.findLastIndex((e) => !e.correct);
  const sinceFailure = events.slice(lastFail + 1);
  const flash = sinceFailure.filter((e) => e.kind === 'flash' && e.correct && e.fast);
  const spelling = sinceFailure.filter((e) => e.kind === 'dictation' && e.correct);
  const days = new Set([...flash, ...spelling].map((e) => e.day));
  const mastered = flash.length >= 3 && spelling.length >= 2 && days.size >= 2;
  const last = events.at(-1);
  const successes = new Set(sinceFailure.filter((e) => e.correct).map((e) => e.day)).size;
  const interval = [1, 2, 4, 7, 14][Math.min(4, Math.max(0, successes - 1))];
  const due = last ? addDays(last.day, last.correct ? interval : 1) : judgment?.day || day;
  let exposure = 1000,
    run = 0;
  for (const event of events.filter((e) => e.kind === 'flash')) {
    if (!event.correct) {
      exposure = Math.min(2200, exposure + 250);
      run = 0;
    } else if (++run >= 2) {
      exposure = Math.max(300, exposure - 150);
      run = 0;
    }
  }
  return {
    word,
    mastered,
    active: !mastered && (judgment?.easy === false || events.some((e) => !e.correct)),
    flash: flash.length,
    spelling: spelling.length,
    due,
    exposure,
    firstDay: t.judgments.find((e) => e.word === word)?.day || events[0]?.day || day,
  };
}
export function wordBook(t, day = calendarDay()) {
  const words = [...new Set([...t.judgments, ...t.wordEvents].map((e) => e.word))];
  const progress = words.map((word) => wordProgress(t, word, day));
  const waiting = progress
    .filter((p) => p.active)
    .sort((a, b) => a.firstDay.localeCompare(b.firstDay) || a.word.localeCompare(b.word));
  return {
    active: waiting.slice(0, 15),
    waiting: waiting.slice(15),
    won: progress.filter((p) => p.mastered),
  };
}
export function wordQueue(t, candidates, day = calendarDay()) {
  const book = wordBook(t, day);
  const due = book.active
    .filter((p) => p.due <= day)
    .sort((a, b) => a.due.localeCompare(b.due))
    .map((p) => p.word);
  const active = new Set(book.active.map((p) => p.word));
  const probes = candidates.filter((word) => {
    const p = wordProgress(t, word, day);
    return (
      !p.mastered &&
      (!p.active || active.has(word)) &&
      !t.wordEvents.some((e) => e.word === word && e.day === day)
    );
  });
  return [...new Set([...due, ...probes])].slice(0, 3);
}
const norm = (s) => String(s).trim().normalize('NFC').toLocaleLowerCase('fr');
export function spellingFeedback(expected, actual, focus = '') {
  const target = norm(expected),
    typed = norm(actual);
  if (target === typed)
    return { correct: true, errors: [], message: 'Tu as retrouvé l’orthographe du mot.' };
  let error = 'autre';
  if (focus && target.includes(focus) && !typed.includes(focus)) error = 'graphie complexe';
  else if (target.slice(0, -1) === typed && /[stdxp]$/.test(target)) error = 'lettre muette';
  else if (
    [
      ['p', 'b'],
      ['t', 'd'],
      ['f', 'v'],
      ['ch', 'j'],
      ['an', 'on'],
      ['ou', 'u'],
    ].some(([a, b]) => target.replace(a, b) === typed || target.replace(b, a) === typed)
  )
    error = 'son confondu';
  else if (
    typed.length === target.length &&
    [...target].sort().join('') === [...typed].sort().join('')
  )
    error = 'inversion';
  else if (typed.length < target.length) error = 'oubli';
  let start = 0,
    end = 0;
  while (start < Math.min(target.length, typed.length) && target[start] === typed[start]) start++;
  while (
    end < Math.min(target.length, typed.length) - start &&
    target.at(-1 - end) === typed.at(-1 - end)
  )
    end++;
  const a = typed.slice(start, end ? -end : undefined),
    b = target.slice(start, end ? -end : undefined);
  return {
    correct: false,
    errors: [error],
    message: a
      ? 'Tu as écrit « ' + a + ' ». Ici, on écrit « ' + (b || 'sans cette lettre') + ' ».'
      : 'Dans ce mot, on ajoute « ' + b + ' ».',
  };
}
export function weeklyReadings(t) {
  const weeks = {};
  for (const r of t.readings) {
    const date = new Date(r.day + 'T12:00:00Z');
    const monday = addDays(r.day, -((date.getUTCDay() + 6) % 7));
    const key = monday + ':' + r.level;
    const w = (weeks[key] ??= {
      day: monday,
      level: r.level,
      speeds: [],
      literal: [0, 0],
      inference: [0, 0],
      total: 0,
    });
    const speed = readingSpeed(r);
    if (speed !== null) w.speeds.push(speed);
    for (const a of r.answers) {
      if (a.kind === 'literal' || a.kind === 'inference') {
        w[a.kind][1]++;
        if (a.correct) w[a.kind][0]++;
      }
    }
    w.total++;
  }
  return Object.values(weeks)
    .sort((a, b) => a.day.localeCompare(b.day))
    .map((w) => {
      const speeds = w.speeds.sort((a, b) => a - b),
        n = speeds.length;
      return {
        ...w,
        median: n ? (speeds[Math.floor((n - 1) / 2)] + speeds[Math.ceil((n - 1) / 2)]) / 2 : null,
      };
    });
}
