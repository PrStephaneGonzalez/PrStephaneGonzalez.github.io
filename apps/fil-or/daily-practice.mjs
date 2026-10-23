import { ACTIVITIES, ACTIVITY_BY_ID } from './catalog.mjs';
import { schoolTier, practiceFormat } from './school-progress.mjs';
export const LANGUAGE_TARGETS = [
  ['homophones', 'Les mots qui se ressemblent'],
  ['verb-agreement', 'L’accord sujet-verbe'],
  ['noun-agreement', 'Les accords du nom'],
  ['conjug-present', 'Le présent'],
  ['conjug-imparfait', 'L’imparfait'],
  ['conjug-futur', 'Le futur'],
  ['conjug-passe', 'Le passé composé'],
  ['sentence-transform', 'Transformer une phrase'],
  ['word-classes', 'Les classes de mots'],
  ['subject', 'Le sujet'],
  ['complements', 'Les compléments'],
];
export const MATH_TARGETS = [
  ['auto', 'Les quatre modules suivis'],
  ['written-operations', 'Les opérations posées'],
  ['fraction-meaning', 'Le sens des fractions'],
  ['proportion', 'Le raisonnement proportionnel'],
  ['missing-number', 'Les égalités à compléter'],
  ['durations', 'Les durées'],
  ['money', 'La monnaie'],
  ['geometry-properties', 'Les propriétés des figures'],
  ['decimal-product', 'Multiplier un décimal'],
  ['decimal-quotient', 'Diviser un décimal'],
  ['area', 'Les aires'],
  ['perimeter', 'Les périmètres'],
];
export function choosePractice(state, skill, start = 0) {
  const tier = schoolTier(state.training, skill, start);
  const format = practiceFormat(skill, tier);
  const candidates = ACTIVITIES.filter(
    (a) => a.skill === skill && a.tier === tier && a.type === format,
  );
  const seen = new Map(
    (state.training.school || []).filter((e) => e.revision === 2).map((e) => [e.activityId, e.at]),
  );
  return [...candidates].sort((a, b) => (seen.get(a.id) || 0) - (seen.get(b.id) || 0))[0] || null;
}
export function assignDailyPractice(state, plan) {
  // Existing plans keep their announced exercises across reloads and setting changes.
  if (plan.languageId === undefined) {
    plan.languageId =
      !plan.done.includes('words') && state.trainingSettings.dailyLanguage
        ? choosePractice(
            state,
            state.trainingSettings.languageFocus,
            state.trainingSettings.languageStart,
          )?.id || null
        : null;
    plan.wordsFinished = false;
    plan.languageFinished = false;
  }
  if (plan.languageId && !ACTIVITY_BY_ID[plan.languageId]) plan.languageId = null;
  if (!plan.mathMode) {
    const focus = state.trainingSettings.mathFocus;
    if (!plan.mathBlock && focus && focus !== 'auto' && !plan.done.includes('math')) {
      const a = choosePractice(state, focus, state.trainingSettings.schoolMathStart);
      if (a) {
        plan.mathId = a.id;
        plan.mathMode = 'school';
      }
    }
    if (!plan.mathMode) plan.mathMode = 'core';
  }
  return plan;
}
export const dailyLanguage = (plan) => ACTIVITY_BY_ID[plan.languageId] || null;
