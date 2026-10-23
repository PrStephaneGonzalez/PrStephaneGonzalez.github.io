import {
  DEEP_SKILLS,
  DEEP_ACTIVITIES,
  upgradeActivities,
  deepenHomophones,
  balancePracticeChoices,
} from './deep-practice.mjs';
import { GUIDED_ACTIVITIES, GUIDED_SKILLS } from './guided-data.mjs';
import { CM2_ACTIVITIES, CM2_SKILLS } from './cm2-additions.mjs';
import { buildPracticeVariants } from './practice-variants.mjs';
import {
  WORKSHOPS as ORIGINAL_WORKSHOPS,
  ACTIVITIES as ORIGINAL_ACTIVITIES,
} from './learning-data.mjs';
import {
  NEW_WORKSHOPS,
  SCHOOL_ACTIVITIES,
  SKILLS,
  COVERAGE_NOTES,
  SOURCES,
} from './curriculum.mjs';
SKILLS.push(...GUIDED_SKILLS, ...CM2_SKILLS, ...DEEP_SKILLS);
export { SKILLS, COVERAGE_NOTES, SOURCES };
const route = (g) =>
  ['sounds', 'words', 'reading', 'writing', 'oral'].includes(g)
    ? 'language'
    : ['numbers', 'maths', 'geometry', 'measures', 'data'].includes(g)
      ? 'math'
      : 'world';
export const WORKSHOPS = [
  ...ORIGINAL_WORKSHOPS.map((w) => ({ ...w, route: route(w.id) })),
  ...NEW_WORKSHOPS,
];
const ALL_ACTIVITIES = balancePracticeChoices(
  deepenHomophones(
    upgradeActivities([
      ...ORIGINAL_ACTIVITIES.map((a, i) => ({
        ...a,
        tier: Math.min(2, Math.floor((Number(a.id.split('-').at(-1)) || 0) / 8)),
        skill: `foundation-${a.group}`,
        route: route(a.group),
        legacy: true,
      })),
      ...SCHOOL_ACTIVITIES,
      ...buildPracticeVariants(SCHOOL_ACTIVITIES),
      ...GUIDED_ACTIVITIES,
      ...CM2_ACTIVITIES,
      ...DEEP_ACTIVITIES,
    ]),
  ),
);
// Old IDs remain resolvable, while identical tasks are offered only once.
export function taskSignature(a) {
  return JSON.stringify([
    a.skill,
    a.tier,
    a.type,
    a.prompt,
    a.text,
    a.answer,
    a.visual,
    a.document,
    a.options?.slice().sort(),
    a.operation,
    a.accepted,
  ]);
}
const canonical = new Map();
export const ACTIVITY_BY_ID = {};
export const ACTIVITIES = [];
export const RETIRED_DUPLICATE_IDS = [];
for (const a of ALL_ACTIVITIES) {
  const eligible = !a.legacy && ['choice', 'numeric', 'text', 'operation'].includes(a.type);
  const key = eligible ? taskSignature(a) : null,
    prior = key && canonical.get(key);
  if (prior) {
    ACTIVITY_BY_ID[a.id] = { ...a, canonicalId: prior.id };
    RETIRED_DUPLICATE_IDS.push(a.id);
  } else {
    ACTIVITIES.push(a);
    ACTIVITY_BY_ID[a.id] = a;
    if (key) canonical.set(key, a);
  }
}
export function coverageRows() {
  return SKILLS.map((s) => ({
    ...s,
    count: ACTIVITIES.filter((a) => a.skill === s.id).length,
    tiers: [...new Set(ACTIVITIES.filter((a) => a.skill === s.id).map((a) => a.tier))],
  }));
}
