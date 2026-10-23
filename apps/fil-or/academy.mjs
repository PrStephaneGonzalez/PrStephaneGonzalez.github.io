import { schoolMastered } from './school-progress.mjs';
import { blockMastered } from './math-core.mjs';
import { wordBook, calendarDay } from './training-state.mjs';
import { ACTIVITY_BY_ID } from './catalog.mjs';

export const SPELLS = [
  { skill: 'guided-place', name: 'Runes des nombres' },
  { skill: 'guided-calc', name: 'Étincelles de calcul' },
  { skill: 'guided-fraction', name: 'Éclats de fractions' },
  { skill: 'guided-words', name: 'Sortilèges des mots' },
  { skill: 'guided-reading', name: 'Lumière des indices' },
];
export const RANKS = [
  {
    threshold: 0,
    name: 'Apprentie des lueurs',
    gift: 'Ta robe d’apprentie et ton premier grimoire',
    next: 'Une cape doublée d’étoiles',
  },
  {
    threshold: 1,
    name: 'Élève des étincelles',
    gift: 'Ta cape doublée d’étoiles',
    next: 'Une baguette de lumière',
  },
  {
    threshold: 3,
    name: 'Tisseuse de runes',
    gift: 'Ta baguette de lumière',
    next: 'Le chapeau des constellations',
  },
  {
    threshold: 6,
    name: 'Magicienne des constellations',
    gift: 'Ton chapeau des constellations',
    next: 'La broche de la chouette',
  },
  {
    threshold: 10,
    name: 'Gardienne des arcanes',
    gift: 'Ta broche de la chouette',
    next: 'Un grimoire étoilé',
  },
  { threshold: 16, name: 'Magicienne du Fil d’Or', gift: 'Ton grimoire étoilé', next: null },
];
const validMark = (id) =>
  typeof id === 'string' &&
  (/^word:[\p{L}’'-]{1,35}$/u.test(id) ||
    /^lesson:guided-(place|calc|fraction|words|reading):[0-5]$/.test(id) ||
    /^math:(line|facts|place|bars):[0-5]$/.test(id) ||
    /^reading:comprehension:[0-2]$/.test(id) ||
    /^school:[\p{L}\p{N}_-]{1,60}:(?:[0-5]|review)$/u.test(id));
const activityCounts = new Map();
for (const a of Object.values(ACTIVITY_BY_ID)) {
  if (a.type === 'guided') continue;
  const counts = activityCounts.get(a.skill) || new Map();
  counts.set(a.tier, (counts.get(a.tier) || 0) + 1);
  activityCounts.set(a.skill, counts);
}
const variedReviewSkills = new Set(
  [...activityCounts]
    .filter(([, counts]) => [...counts.values()].every((n) => n < 3))
    .map(([skill]) => skill),
);
export function restoreAcademy(raw) {
  return {
    version: 1,
    unlocked: [
      ...new Set((Array.isArray(raw?.unlocked) ? raw.unlocked : []).filter(validMark)),
    ].slice(0, 3000),
  };
}
export function mergeAcademy(a, b) {
  return restoreAcademy({
    unlocked: [...restoreAcademy(a).unlocked, ...restoreAcademy(b).unlocked],
  });
}
// Cosmetic milestones, not a diagnosis or a school grade. No game, help request,
// skipped task or parent-selected starting level can award an appearance.
export function reconcileAcademy(state) {
  const unlocked = new Set(restoreAcademy(state.academy).unlocked);
  if (state.training)
    for (const entry of wordBook(state.training).won) unlocked.add('word:' + entry.word);
  // Confirm comprehension across different, previously unseen texts on at
  // least two days. This milestone makes no claim about reading speed.
  for (let level = 0; level < 3; level++) {
    const readings = (state.training?.readings || [])
      .filter((e) => e.level === level && e.eligible && Array.isArray(e.answers))
      .slice(-3);
    const good = readings.filter((e) => e.answers.filter((a) => a.correct).length >= 2);
    if (
      good.length === 3 &&
      new Set(good.map((e) => e.day)).size >= 2 &&
      new Set(good.map((e) => e.textId)).size === 3
    )
      unlocked.add(`reading:comprehension:${level}`);
  }
  for (const [index, spell] of SPELLS.entries()) {
    for (let tier = 0; tier < 6; tier++) {
      const prefix = `guided-${index}-${tier}-`;
      const attempts = new Map();
      for (const [id, outcome] of Object.entries(state.learning?.outcomes || {})) {
        if (!new RegExp(`^${prefix}[0-5]$`).test(id) || !Number.isFinite(Date.parse(outcome?.at)))
          continue;
        attempts.set(id, {
          id,
          at: Date.parse(outcome.at),
          day: calendarDay(new Date(outcome.at)),
          correct: outcome.kind === 'independent' && !(index === 4 && outcome.listened),
        });
      }
      // The dated observation is authoritative where it exists; merge by date.
      for (const e of state.training?.school || []) {
        if (!new RegExp(`^${prefix}[0-5]$`).test(e.activityId)) continue;
        if (!attempts.has(e.activityId) || e.at >= attempts.get(e.activityId).at)
          attempts.set(e.activityId, {
            id: e.activityId,
            at: e.at,
            day: e.day,
            correct: e.correct === true && !e.assisted,
          });
      }
      const recent = [...attempts.values()].sort((a, b) => a.at - b.at).slice(-10);
      const successes = recent.filter((e) => e.correct);
      if (
        successes.length >= 3 &&
        successes.length / recent.length >= 0.9 &&
        new Set(successes.map((e) => e.day)).size >= 2
      )
        unlocked.add(`lesson:${spell.skill}:${tier}`);
    }
  }
  if (state.training?.math)
    for (const block of ['line', 'facts', 'place', 'bars'])
      for (let tier = 0; tier < 6; tier++)
        if (blockMastered(state.training.math, block, tier)) unlocked.add(`math:${block}:${tier}`);
  const school = new Map(),
    varied = new Map();
  for (const [id, outcome] of Object.entries(state.learning?.outcomes || {})) {
    const a = ACTIVITY_BY_ID[id];
    if (
      !a ||
      a.type === 'guided' ||
      !['language', 'math'].includes(a.route) ||
      !Number.isFinite(Date.parse(outcome?.at))
    )
      continue;
    const key = `school:${a.skill}:${a.tier}`;
    const entries = school.get(key) || [];
    entries.push({
      id,
      day: calendarDay(new Date(outcome.at)),
      at: Date.parse(outcome.at),
      correct: outcome.kind === 'independent' && !(a.group === 'reading' && outcome.listened),
    });
    school.set(key, entries);
    if (variedReviewSkills.has(a.skill)) {
      const all = varied.get(a.skill) || [];
      all.push(entries.at(-1));
      varied.set(a.skill, all);
    }
  }
  const revisedKeys = new Map();
  for (const e of state.training?.school || [])
    if (e.revision === 2 && Number.isInteger(e.tier))
      revisedKeys.set('school:' + e.skill + ':' + e.tier, { skill: e.skill, tier: e.tier });
  for (const [key, entry] of revisedKeys)
    if (schoolMastered(state.training, entry.skill, entry.tier)) unlocked.add(key);
  for (const [key, entries] of school) {
    if (revisedKeys.has(key)) continue;
    const recent = entries.sort((a, b) => a.at - b.at).slice(-10);
    const good = recent.filter((e) => e.correct);
    if (
      good.length >= 3 &&
      good.length / recent.length >= 0.9 &&
      new Set(good.map((e) => e.day)).size >= 2
    )
      unlocked.add(key);
  }
  // Legacy thematic cards sometimes offer one example per theme, rather than
  // several examples of the same rung. A varied-review light is cosmetic and
  // never certifies a rung or changes the proposed difficulty.
  for (const [skill, entries] of varied) {
    const recent = entries.sort((a, b) => a.at - b.at).slice(-10),
      good = recent.filter((e) => e.correct);
    if (
      good.length >= 3 &&
      good.length / recent.length >= 0.9 &&
      new Set(good.map((e) => e.day)).size >= 2
    )
      unlocked.add(`school:${skill}:review`);
  }
  state.academy = restoreAcademy({ unlocked: [...unlocked] });
  return academyProfile(state.academy);
}
export function academyProfile(raw) {
  const marks = restoreAcademy(raw).unlocked;
  const index = RANKS.findLastIndex((rank) => marks.length >= rank.threshold);
  const rank = RANKS[index],
    next = RANKS[index + 1];
  return {
    ...rank,
    level: index + 1,
    count: marks.length,
    marks,
    remaining: next ? next.threshold - marks.length : 0,
  };
}
