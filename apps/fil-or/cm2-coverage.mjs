export const PROGRAMME_SOURCES = {
  decree: 'https://www.education.gouv.fr/bo/2025/Hebdo16/MENE2504620A',
  french:
    'https://www.education.gouv.fr/sites/default/files/programme-de-fran-ais-pour-le-cycle-3-439824.pdf',
  maths:
    'https://www.education.gouv.fr/sites/default/files/programme-de-math-matiques-pour-le-cycle-3-439827.pdf',
};
// Documentary mapping of the CM2 learning domains; presence is not proof of mastery.
export const CM2_COVERAGE = [
  {
    subject: 'Français',
    label: 'Lecture fluide, graphies et reconnaissance des mots',
    skills: ['decoding', 'guided-words'],
    module: 'Lecture et carnet',
    note: 'Trois niveaux éditoriaux : 30 textes courts, 15 textes intermédiaires et 15 plus développés. La lecture silencieuse est observée séparément de la lecture à voix haute.',
  },
  {
    subject: 'Français',
    label: 'Comprendre l’explicite, l’implicite, les reprises et les documents',
    skills: ['guided-reading', 'read-explicit', 'read-infer', 'documents'],
    module: 'Lecture et bibliothèque',
  },
  {
    subject: 'Français',
    label: 'Genres, œuvres et culture littéraire',
    skills: ['text-genres', 'literary-culture', 'literature-passport'],
    accompanied: true,
    note: 'Héros, merveilleux, autres vies, morale, poésie et rapport aux autres : lectures et échanges. Sept œuvres complètes, dont trois du patrimoine, à lire aussi hors application.',
  },
  {
    subject: 'Français',
    label: 'Écriture manuscrite et écrits pour réfléchir',
    skills: ['sentence-transform', 'writing-revise', 'written-production'],
    accompanied: true,
    note: 'Les gestes d’écriture, la prise de notes et les brouillons sont à pratiquer sur papier et à observer avec un adulte.',
  },
  {
    subject: 'Français',
    label: 'Produire et réviser des écrits variés',
    skills: ['sentence-transform', 'writing-revise', 'written-production'],
    accompanied: true,
    note: 'Récit, description, dialogue, explication et lettre ; sens, organisation puis révision ciblée.',
  },
  {
    subject: 'Français',
    label: 'Écouter, reformuler, parler et participer aux échanges',
    skills: ['oral-listen', 'oral-reading', 'oral-exchange'],
    accompanied: true,
    note: 'Lecture expressive, présentation et argumentation avec un interlocuteur. Aucun son enregistré.',
  },
  {
    subject: 'Français',
    label: 'Vocabulaire, dictionnaire et relations entre les mots',
    skills: ['morphology', 'lexical-meaning', 'dictionary-context', 'guided-words'],
  },
  {
    subject: 'Français',
    label: 'Mémoriser et réemployer l’orthographe lexicale',
    skills: ['homophones', 'dictionary-context', 'writing-revise'],
    module: 'Carnet, dictées et missions',
    note: 'Les mots sont revus dans une phrase. Les homophones comprennent 48 situations contextualisées. Le clavier à graphies évite les suggestions du clavier système.',
  },
  {
    subject: 'Français',
    label: 'Nature et fonction ; constituants de la phrase simple',
    skills: [
      'word-classes',
      'subject',
      'complements',
      'nature-function',
      'object-pronouns',
      'noun-expansion',
    ],
  },
  {
    subject: 'Français',
    label: 'Se repérer dans la phrase complexe',
    skills: ['complex-sentences'],
    note: 'Repérer les verbes conjugués et comprendre les relations entre propositions ; approfondissements distincts de sixième.',
  },
  {
    subject: 'Français',
    label: 'Accords dans le groupe nominal et avec le sujet',
    skills: ['noun-agreement', 'verb-agreement', 'noun-expansion', 'compound-spelling'],
  },
  {
    subject: 'Français',
    label: 'Conjugaison et orthographe grammaticale',
    skills: [
      'conjug-present',
      'conjug-imparfait',
      'conjug-futur',
      'conjug-passe',
      'verb-bank-être',
      'verb-bank-avoir',
      'compound-spelling',
    ],
    note: 'Les formes sont travaillées en reconnaissance et en réponse écrite. Les six temps sont des thèmes à revoir, pas une échelle étalonnée de difficulté. Le programme 2025 applicable en CM2 en 2026 ne limite pas le passé simple aux troisièmes personnes.',
  },
  {
    subject: 'Mathématiques',
    label: 'Entiers jusqu’aux centaines de millions ; numération positionnelle',
    skills: ['integer-place', 'million-place', 'guided-place'],
  },
  {
    subject: 'Mathématiques',
    label: 'Fractions : sens, comparaison, calcul et fraction d’une quantité',
    skills: [
      'fraction-meaning',
      'guided-fraction',
      'fraction-calculation',
      'fraction-subtract',
      'fraction-times-int',
      'fraction-operator',
    ],
  },
  {
    subject: 'Mathématiques',
    label: 'Décimaux jusqu’aux millièmes : lire, comparer et calculer',
    skills: [
      'decimal-places',
      'decimal-compare',
      'decimal-scale',
      'decimal-calc',
      'decimal-subtract',
      'decimal-product',
      'decimal-quotient',
    ],
  },
  {
    subject: 'Mathématiques',
    label: 'Calcul mental, automatismes, multiples et quatre opérations',
    skills: [
      'guided-calc',
      'addition',
      'subtraction',
      'multiplication',
      'division',
      'remainder',
      'multiples-divisors',
      'estimate',
      'written-operations',
    ],
    note: 'Les opérations posées demandent de compléter les étapes et les retenues à l’écran. Elles sont aussi à réaliser sur papier pour observer la disposition et les échanges.',
  },
  {
    subject: 'Mathématiques',
    label: 'Problèmes à plusieurs étapes et pensée algébrique',
    skills: ['multi-step', 'money', 'missing-number', 'equality-unknown', 'operation-order'],
  },
  {
    subject: 'Mathématiques',
    label: 'Grandeurs, unités, aires, périmètres, angles et durées',
    skills: [
      'lengths',
      'mass-capacity',
      'area',
      'area-convert',
      'perimeter',
      'angles',
      'durations',
      'duration-seconds',
    ],
  },
  {
    subject: 'Mathématiques',
    label: 'Géométrie plane, solides, symétrie et déplacements',
    skills: [
      'geometry-properties',
      'shapes',
      'lines',
      'solids',
      'symmetry',
      'construction',
      'geometry-paper',
      'algorithm',
    ],
    accompanied: true,
    note: 'Les propriétés se travaillent à l’écran ; les constructions avec instruments, patrons et déplacements se pratiquent aussi hors écran.',
  },
  {
    subject: 'Mathématiques',
    label: 'Tableaux, diagrammes en barres, courbes et diagrammes circulaires',
    skills: ['data-read', 'data-charts'],
    note: 'Lecture et problèmes à l’écran. Réaliser aussi une petite enquête et construire sa représentation avec un adulte.',
  },
  {
    subject: 'Mathématiques',
    label: 'Probabilités : chances sur, indépendance et deux étapes',
    skills: ['chance', 'chance-count'],
  },
  {
    subject: 'Mathématiques',
    label: 'Proportionnalité : raisonner sur les grandeurs',
    skills: ['proportion', 'proportion-reason'],
    note: 'Passage à l’unité, linéarité multiplicative et additive, puis distinction des situations non proportionnelles. Le programme CM2 privilégie le raisonnement en mots, sans tableau de proportionnalité ni produit en croix.',
  },
  {
    subject: 'Mathématiques',
    label: 'Pensée informatique : instructions, suites et programmes',
    skills: ['algorithm', 'program-steps', 'geometry-paper'],
  },
];
export function coverageHTML() {
  return (
    '<p>Référence : programme du cycle 3 publié le 17 avril 2025, applicable au CM2 depuis septembre 2026. Cette carte indique où travailler les domaines ; elle ne certifie ni une couverture exhaustive de chaque objectif ni leur acquisition.</p>' +
    '<p>Le parcours quotidien travaille peu de cibles. La bibliothèque Français CM2 et Mathématiques CM2 permet de retrouver les autres domaines. Les lectures longues, l’oral, les productions et les constructions accompagnent les exercices numériques.</p>' +
    ['Français', 'Mathématiques']
      .map(
        (subject) =>
          '<h3>' +
          subject +
          '</h3><div class="coverage-list">' +
          CM2_COVERAGE.filter((row) => row.subject === subject)
            .map(
              (row) =>
                '<details class="parent-details" data-cm2-domain="' +
                row.skills[0] +
                '"><summary>' +
                row.label +
                '</summary><p>' +
                (row.accompanied
                  ? 'Exercices et activités accompagnées : la participation n’est pas comptée comme une acquisition.'
                  : 'Exercices numériques de découverte et de révision.') +
                '</p>' +
                (row.module ? '<p>' + row.module + '.</p>' : '') +
                (row.note ? '<p>' + row.note + '</p>' : '') +
                '</details>',
            )
            .join('') +
          '</div>',
      )
      .join('') +
    '<p><a href="' +
    PROGRAMME_SOURCES.decree +
    '" target="_blank" rel="noopener">Arrêté</a> · <a href="' +
    PROGRAMME_SOURCES.french +
    '" target="_blank" rel="noopener">Programme de français</a> · <a href="' +
    PROGRAMME_SOURCES.maths +
    '" target="_blank" rel="noopener">Programme de mathématiques</a></p>'
  );
}
