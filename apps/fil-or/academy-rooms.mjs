import { ACTIVITIES, ACTIVITY_BY_ID, SKILLS } from './catalog.mjs';
const room = (id, name, icon, subject, kind, x, y, requires = []) => ({
  id,
  name,
  icon,
  subject,
  kind,
  x,
  y,
  requires,
});
export const ACADEMY_ROOMS = [
  room('reading', 'Salle des récits', '✧', 'Lire et comprendre', 'reading', 7, 32),
  room('words', 'Bibliothèque des mots', '✦', 'Mots, graphies et vocabulaire', 'words', 7, 51),
  room('place', 'Tour des nombres', '◇', 'Construire et écrire les nombres', 'math', 68, 13),
  room('facts', 'Atelier des calculs', '✳', 'Calcul mental et tables', 'math', 68, 32),
  room(
    'line',
    'Observatoire des fractions',
    '◈',
    'Fractions, décimaux et droites',
    'math',
    68,
    51,
    ['place'],
  ),
  room('bars', 'Galerie des problèmes', '✣', 'Problèmes, données et proportions', 'math', 68, 70, [
    'facts',
  ]),
  room('grammar', 'Salon des accords', '¶', 'Grammaire et conjugaison', 'school', 7, 13, ['words']),
  room('writing', 'Cabinet des plumes', '✎', 'Écrire et réviser', 'school', 7, 70, [
    'reading',
    'grammar',
  ]),
  room('geometry', 'Tour des formes', '△', 'Géométrie et déplacements', 'school', 37.5, 13),
  room(
    'measures',
    'Laboratoire des mesures',
    '⚖',
    'Longueurs, aires et durées',
    'school',
    37.5,
    70,
    ['place'],
  ),
];
export const roomById = (id) => ACADEMY_ROOMS.find((r) => r.id === id);
export function roomForActivity(a) {
  if (a.route === 'language')
    return a.group === 'grammar' || a.skill === 'noun-agreement'
      ? 'grammar'
      : a.group === 'writing'
        ? 'writing'
        : ['words', 'sounds'].includes(a.group)
          ? 'words'
          : 'reading';
  if (a.route !== 'math') return null;
  if (a.group === 'geometry') return 'geometry';
  if (a.group === 'measures') return 'measures';
  if (
    a.group === 'data' ||
    /^(multi-step|money|missing-number|equality-unknown|operation-order|proportion|proportion-reason)$/.test(
      a.skill,
    )
  )
    return 'bars';
  if (/fraction|decimal/.test(a.skill)) return 'line';
  if (a.group === 'numbers' || ['integer-place', 'million-place', 'guided-place'].includes(a.skill))
    return 'place';
  return 'facts';
}
export function roomSkills(id) {
  return skillsByRoom.get(id) || [];
}
export function roomStages(skill) {
  if (skill.stages) return skill.stages;
  const labels = {
    'word-classes': [
      'Les noms',
      'Les adjectifs',
      'Les pronoms',
      'Les adverbes',
      'Les prépositions',
      'Les mots de liaison',
    ],
    subject: [
      'Un sujet simple',
      'Le groupe sujet complet',
      'Remplacer par un pronom',
      'Un sujet après le verbe',
      'Choisir le sujet',
      'Le nom principal du sujet',
    ],
    complements: [
      'Compléter le verbe',
      'Un groupe avec préposition',
      'Les circonstances',
      'Le COD',
      'Le COI',
      'L’attribut du sujet',
    ],
    'verb-agreement': [
      'Un sujet au singulier',
      'Un sujet au pluriel',
      'Un sujet avec moi',
      'Deux sujets reliés par et',
      'Un sujet après le verbe',
      'Un sujet collectif',
    ],
    'noun-agreement': [
      'Le pluriel des noms',
      'Accorder tout le groupe',
      'Des pluriels particuliers',
      'Le féminin',
      'Accorder les adjectifs',
      'Accorder un groupe plus complexe',
    ],
  };
  if (labels[skill.id]) return labels[skill.id];
  if (skill.id.startsWith('verb-bank-'))
    return ['Présent', 'Imparfait', 'Futur', 'Passé composé', 'Passé simple', 'Plus-que-parfait'];
  if (skill.id.startsWith('conjug-'))
    return Array.from({ length: 6 }, (_, i) => `Série ${i + 1} · ${skill.label}`);
  return Array.from(
    { length: 6 },
    (_, tier) =>
      ACTIVITIES.find((a) => a.skill === skill.id && a.tier === tier)?.stageLabel ||
      `Fiche ${tier + 1} · ${skill.label}`,
  );
}
const skillsByRoom = new Map(
  ACADEMY_ROOMS.map((r) => {
    const ids = new Set(ACTIVITIES.filter((a) => roomForActivity(a) === r.id).map((a) => a.skill));
    return [r.id, SKILLS.filter((s) => ids.has(s.id))];
  }),
);
const hasPrefix = (marks, ...prefixes) =>
  marks.some((mark) => prefixes.some((p) => mark.startsWith(p)));
export function academyRoomStatus(state) {
  const marks = state.academy?.unlocked || [],
    t = state.training || {},
    events = t.math?.events || [];
  const outcomes = state.learning?.outcomes || {};
  const completed = new Set(state.learning?.completed || []);
  const triedRooms = new Set(
    [...new Set([...Object.keys(outcomes), ...completed])]
      .map((id) => ACTIVITY_BY_ID[id])
      .filter(Boolean)
      .map(roomForActivity),
  );
  return Object.fromEntries(
    ACADEMY_ROOMS.map((r) => {
      const guided = {
        place: 'guided-place',
        facts: 'guided-calc',
        line: 'guided-fraction',
        words: 'guided-words',
        reading: 'guided-reading',
      }[r.id];
      let mastered = hasPrefix(marks, `math:${r.id}:`, ...(guided ? [`lesson:${guided}:`] : []));
      let tried = triedRooms.has(r.id) || events.some((e) => e.block === r.id);
      if (r.id === 'reading') {
        mastered ||= hasPrefix(marks, 'reading:comprehension:');
        tried ||= !!t.readings?.length;
      }
      if (r.id === 'words') {
        mastered ||= hasPrefix(marks, 'word:');
        tried ||= !!t.wordEvents?.length || !!t.judgments?.length;
      }
      mastered ||= roomSkills(r.id).some((skill) => hasPrefix(marks, `school:${skill.id}:`));
      return [r.id, mastered ? 'lit' : tried ? 'warming' : 'dark'];
    }),
  );
}
export function roomAccess(state, id, statuses = academyRoomStatus(state)) {
  const hall = roomById(id);
  if (!hall) return { open: false, missing: [] };
  // Existing work always remains reachable after migration, even if its earlier
  // prerequisite observations were not saved by a previous version.
  const missing =
    statuses[id] !== 'dark' ? [] : hall.requires.filter((key) => statuses[key] === 'dark');
  return { open: missing.length === 0, missing };
}
export function nextRoomActivity(state, skill, tier, exceptId = null) {
  const pool = ACTIVITIES.filter((a) => a.skill === skill && a.tier === tier && a.id !== exceptId);
  const outcomes = state.learning?.outcomes || {};
  const completed = new Set(state.learning?.completed || []);
  return (
    pool.find((a) => !outcomes[a.id] && !completed.has(a.id)) ||
    [...pool].sort((a, b) =>
      String(outcomes[a.id]?.at || '').localeCompare(String(outcomes[b.id]?.at || '')),
    )[0]
  );
}
