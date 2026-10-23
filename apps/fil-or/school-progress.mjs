import { ACTIVITIES, ACTIVITY_BY_ID } from './catalog.mjs';
// Recognition, written production and changed content revisions stay separate.
const formatCache = new Map();
export function practiceFormat(skill, tier) {
  const key = skill + ':' + tier;
  if (formatCache.has(key)) return formatCache.get(key);
  const formats = new Set(
    ACTIVITIES.filter((a) => a.skill === skill && a.tier === tier).map((a) => a.type),
  );
  const type = ['operation', 'text', 'numeric', 'guided', 'choice'].find((type) =>
    formats.has(type),
  );
  formatCache.set(key, type);
  return type;
}
export function schoolTrials(training, skill, tier) {
  return (training?.school || []).filter(
    (e) =>
      e.skill === skill &&
      e.revision === 2 &&
      e.tier === tier &&
      e.format === practiceFormat(skill, tier) &&
      typeof e.correct === 'boolean',
  );
}
export function schoolMastered(training, skill, tier) {
  const trials = schoolTrials(training, skill, tier).slice(-10),
    good = trials.filter((e) => e.correct && !e.assisted);
  return (
    trials.length === 10 &&
    good.length >= 9 &&
    new Set(good.map((e) => e.day)).size >= 2 &&
    new Set(good.map((e) => e.activityId)).size >= 3
  );
}
export function schoolTier(training, skill, start = 0) {
  const last = (training?.school || []).findLast(
    (e) => e.skill === skill && e.revision === 2 && Number.isInteger(e.tier),
  );
  if (!last) return start;
  const recent = schoolTrials(training, skill, last.tier).slice(-5);
  if (recent.length === 5 && recent.filter((e) => e.correct && !e.assisted).length <= 2)
    return Math.max(0, last.tier - 1);
  return schoolMastered(training, skill, last.tier) ? Math.min(5, last.tier + 1) : last.tier;
}
export function schoolGroups(training) {
  const groups = new Map();
  for (const e of training?.school || []) {
    if (e.revision !== 2 || e.correct === null) continue;
    const a = ACTIVITY_BY_ID[e.activityId];
    if (!a) continue;
    const key = [e.skill, e.tier, e.format].join(':');
    const g = groups.get(key) || {
      skill: e.skill,
      tier: e.tier,
      format: e.format,
      label: a.title,
      events: [],
    };
    g.events.push(e);
    groups.set(key, g);
  }
  return [...groups.values()];
}
