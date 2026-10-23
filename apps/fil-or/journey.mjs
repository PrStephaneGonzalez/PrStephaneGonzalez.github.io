import { CORE_SKILLS } from './guided-data.mjs';
// A local practice itinerary, not an assessment. Stages are independent for each skill.
export function restoreJourney(raw) {
  const j = {
    version: 1,
    seed: 314159,
    step: 0,
    startTier: 0,
    current: null,
    history: [],
    stats: {},
    focusSkills: [...CORE_SKILLS],
    visited: [],
    reward: 0,
  };
  if (!raw || raw.version !== 1) return j;
  j.startTier = Number.isInteger(raw.startTier) ? Math.max(0, Math.min(5, raw.startTier)) : 0;
  if (Array.isArray(raw.focusSkills)) {
    const selected = raw.focusSkills.filter((x) => CORE_SKILLS.includes(x));
    if (selected.length) j.focusSkills = selected;
  }
  j.seed = Number.isInteger(raw.seed) ? raw.seed >>> 0 : j.seed;
  j.step = Number.isInteger(raw.step) && raw.step >= 0 ? raw.step : 0;
  j.reward = Number.isInteger(raw.reward) && raw.reward >= 0 ? raw.reward : 0;
  if (raw.current && typeof raw.current.id === 'string') j.current = raw.current;
  if (Array.isArray(raw.history))
    j.history = raw.history
      .filter(
        (x) =>
          x && typeof x.id === 'string' && ['game', 'language', 'math', 'world'].includes(x.route),
      )
      .slice(-24);
  if (Array.isArray(raw.visited))
    j.visited = [...new Set(raw.visited.filter((x) => typeof x === 'string'))].slice(-2500);
  if (raw.stats && typeof raw.stats === 'object')
    for (const [k, s] of Object.entries(raw.stats))
      if (k.length < 100 && s && typeof s === 'object')
        j.stats[k] = {
          tier: Number.isInteger(s.tier) ? Math.max(0, Math.min(5, s.tier)) : 0,
          attempts: Number.isInteger(s.attempts) ? Math.max(0, s.attempts) : 0,
          evidence: Array.isArray(s.evidence)
            ? s.evidence
                .filter(
                  (e) =>
                    e &&
                    typeof e.id === 'string' &&
                    Number.isFinite(e.at) &&
                    Number.isInteger(e.step),
                )
                .slice(-12)
            : [],
          nextDue: Number.isInteger(s.nextDue) ? s.nextDue : 0,
          wins: Array.isArray(s.wins)
            ? [...new Set(s.wins.filter((id) => typeof id === 'string'))].slice(-10)
            : [],
        };
  return j;
}
function random(j) {
  j.seed = (Math.imul(j.seed, 1664525) + 1013904223) >>> 0;
  return j.seed / 4294967296;
}
export function baseGameTier(l) {
  if (l.type === 'flow') return Math.min(5, Math.floor(l.index / 4));
  if (l.type === 'potion') return Math.min(5, Math.floor(l.index / 2));
  return Math.min(5, Math.floor(l.index / 3));
}
export function makeJourneyCatalog(levels, extras, activities) {
  return [
    ...levels.map((l) => ({
      id: l.id,
      kind: 'game',
      route: 'game',
      skill: `game-${l.type}`,
      type: l.type,
      tier: baseGameTier(l),
    })),
    ...extras.map((l) => ({
      id: l.id,
      kind: 'game',
      route: 'game',
      skill: `game-${l.type}`,
      type: l.type,
      tier: l.tier,
    })),
    ...activities.map((a) => ({
      id: a.id,
      kind: 'activity',
      route: a.route,
      skill: a.skill,
      type: a.group,
      tier: a.tier,
      guided: a.type === 'guided',
      supported: !!a.supported,
      variant: a.variant,
      practiceKey: a.practiceKey,
    })),
  ];
}
const stat = (j, skill) =>
  (j.stats[skill] ??= { tier: j.startTier || 0, attempts: 0, wins: [], evidence: [], nextDue: 0 });
export function chooseNext(j, catalog, disabled = [], options = {}) {
  let available = catalog.filter((c) => c.kind !== 'game' || !disabled.includes(c.type));
  if (!available.length) {
    j.current = null;
    return null;
  }
  if (j.current && !options.force && available.some((x) => x.id === j.current.id)) {
    j.current = { ...available.find((x) => x.id === j.current.id) };
    return j.current;
  }
  const focusedCatalog = available.filter(
    (c) => c.kind === 'game' || (c.guided && j.focusSkills.includes(c.skill)),
  );
  if (!options.skill && focusedCatalog.length) available = focusedCatalog;
  const last = j.history.at(-1),
    prev = j.history.at(-2),
    consecutiveCards = last && last.route !== 'game' && prev && prev.route !== 'game';
  let routes = [...new Set(available.map((x) => x.route))];
  if (last?.route === 'game') routes = routes.filter((r) => r !== 'game');
  else if (consecutiveCards && routes.includes('game')) routes = ['game'];
  else if (last) routes = routes.filter((r) => r !== last.route && r !== 'game');
  if (!routes.length) routes = [...new Set(available.map((x) => x.route))];
  let route;
  if (!last && j.step === 0) {
    const first = available.find((c) => c.guided && j.focusSkills.includes(c.skill));
    if (first) route = first.route;
  }
  if (options.skill) {
    route = available.find((x) => x.skill === options.skill)?.route;
  }
  if (!route) {
    const weights = { game: 4, language: 3, math: 3, world: 2 },
      bag = routes.flatMap((r) => Array(weights[r]).fill(r));
    route = bag[Math.floor(random(j) * bag.length)];
  }
  let pool = available.filter(
    (c) => c.route === route && (!options.skill || c.skill === options.skill),
  );
  if (!pool.length) pool = available;
  if (route === 'game') {
    const previous = j.history.filter((x) => x.route === 'game').at(-1)?.skill,
      other = pool.filter((x) => x.skill !== previous);
    if (other.length) pool = other;
  }
  const focused = pool.filter((c) => j.focusSkills.includes(c.skill));
  if (!options.skill && focused.length && random(j) < 0.85) pool = focused;
  const due = pool.filter((c) => c.guided && (j.stats[c.skill]?.nextDue ?? 0) <= j.step);
  if (!options.skill && due.length) pool = due;
  const skills = [...new Set(pool.map((x) => x.skill))],
    recentSkills = j.history.slice(-3).map((h) => h.skill);
  let candidates = skills.filter((s) => !recentSkills.slice(-1).includes(s));
  if (!candidates.length) candidates = skills;
  const least = Math.min(...candidates.map((s) => j.stats[s]?.attempts || 0));
  candidates = candidates.filter((s) => (j.stats[s]?.attempts || 0) <= least + 1);
  const skill = candidates[Math.floor(random(j) * candidates.length)],
    s = stat(j, skill);
  pool = pool.filter((x) => x.skill === skill);
  const tiers = [...new Set(pool.map((x) => x.tier))].sort((a, b) => a - b),
    tier = tiers.reduce(
      (best, t) => (Math.abs(t - s.tier) < Math.abs(best - s.tier) ? t : best),
      tiers[0],
    );
  pool = pool.filter((x) => x.tier === tier);
  const recent = new Set(j.history.map((x) => x.id));
  let fresh = pool.filter((x) => !j.visited.includes(x.id) && !recent.has(x.id));
  const model = fresh.find((x) => x.guided && x.supported);
  if (model) fresh = [model];
  if (!fresh.length) fresh = pool.filter((x) => !recent.has(x.id));
  if (!fresh.length) fresh = pool;
  j.current = { ...fresh[Math.floor(random(j) * fresh.length)] };
  return j.current;
}
export function finishStep(
  j,
  item,
  {
    correct = null,
    assisted = false,
    skipped = false,
    readingSupported = false,
    now = Date.now(),
  } = {},
  catalog = [],
) {
  if (!item || !j.current || j.current.id !== item.id) return false;
  const s = stat(j, item.skill);
  s.attempts++;
  j.step++;
  j.history.push({ ...item, skipped });
  j.history = j.history.slice(-24);
  if (!j.visited.includes(item.id)) j.visited.push(item.id);
  if (!skipped) j.reward++;
  // Discovery, listening support and an open mission are never evidence of independent reading.
  if (correct === true && !assisted && !skipped && !readingSupported) {
    s.evidence ??= [];
    if (!s.evidence.some((e) => (e.key || e.id) === (item.practiceKey || item.id)))
      s.evidence.push({ id: item.id, key: item.practiceKey || item.id, at: now, step: j.step });
    s.evidence = s.evidence.slice(-12);
    if (!s.wins.includes(item.id)) s.wins.push(item.id);
    const first = Math.min(...s.evidence.map((e) => e.at)),
      hasDelayed = s.evidence.some((e) => e.at - first >= 20 * 60 * 60 * 1000);
    const varied = s.evidence.length >= 3,
      count = catalog.filter(
        (c) => c.skill === item.skill && c.tier === item.tier && !c.supported,
      ).length;
    if (varied && hasDelayed && count >= 3) {
      s.tier = Math.min(5, item.tier + 1);
      s.wins = [];
      s.evidence = [];
    }
  }
  // A short return is scheduled; delayed evidence is still required for automatic advancement.
  s.nextDue = j.step + (skipped ? 10 : correct === true ? 8 : 4);
  j.current = null;
  return true;
}
export function adjustStage(j, skill, delta) {
  const s = stat(j, skill);
  s.tier = Math.max(0, Math.min(5, s.tier + delta));
  s.wins = [];
  s.evidence = [];
  j.current = null;
  return s.tier;
}
export const STAGE_LABELS = [
  'Premiers pas',
  'On prend confiance',
  'Nouvelles pistes',
  'On relie les idées',
  'Un peu plus loin',
  'Vers le collège',
];
