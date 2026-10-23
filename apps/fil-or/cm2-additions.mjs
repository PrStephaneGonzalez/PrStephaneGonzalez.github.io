// Original complementary exercises, mapped to the CM2 programme (BO 17 April 2025).
// Six content rungs are not a standardised difficulty scale.
export const CM2_SKILLS = [];
export const CM2_ACTIVITIES = [];
const fmt = (n) => String(Number(n.toFixed(6))).replace('.', ',');
function series(id, group, label, build, stages) {
  CM2_SKILLS.push({
    id,
    group,
    label,
    route: ['grammar', 'words', 'reading', 'writing', 'oral'].includes(group) ? 'language' : 'math',
    stages,
  });
  for (let tier = 0; tier < 6; tier++)
    for (let v = 0; v < 3; v++) {
      const q = build(tier, v),
        route = CM2_SKILLS.at(-1).route;
      const options = q.options && [...new Set(q.options)];
      const shift = (tier + v) % (options?.length || 1);
      CM2_ACTIVITIES.push({
        id: 'cm2-' + id + '-' + tier + '-' + v,
        skill: id,
        group,
        route,
        tier,
        title: label,
        stageLabel: stages?.[tier],
        type: options ? 'choice' : 'numeric',
        ...q,
        answer: String(q.answer),
        ...(options ? { options: options.slice(shift).concat(options.slice(0, shift)) } : {}),
      });
    }
}
series(
  'million-place',
  'numbers',
  'Lire les grands nombres et les zéros',
  (t, v) => {
    const digit = 3 + v,
      power = [3, 4, 5, 6, 7, 8][t],
      n = digit * 10 ** power + 208;
    return {
      prompt:
        'Dans ' +
        n.toLocaleString('fr-FR') +
        ', quelle est la valeur du chiffre ' +
        digit +
        ' placé le plus à gauche ?',
      answer: digit * 10 ** power,
      explanation:
        'Ce chiffre occupe le rang de ' +
        (10 ** power).toLocaleString('fr-FR') +
        '. Sa valeur est ' +
        (digit * 10 ** power).toLocaleString('fr-FR') +
        '.',
    };
  },
  [
    'Les milliers',
    'Les dizaines de milliers',
    'Les centaines de milliers',
    'Le million',
    'Les dizaines de millions',
    'Les centaines de millions',
  ],
);
series(
  'multiples-divisors',
  'maths',
  'Multiples et diviseurs',
  (t, v) => {
    const d = [2, 5, 10, 3, 4, 9][t],
      n = d * (4 + v);
    return {
      prompt: 'Quel nombre est un multiple de ' + d + ' ?',
      answer: String(n),
      options: [String(n), String(n + 1), String(n - 1)],
      explanation:
        n +
        ' = ' +
        d +
        ' × ' +
        (4 + v) +
        '. Il peut être partagé en groupes de ' +
        d +
        ' sans reste.',
    };
  },
  [
    'Groupes de deux',
    'Groupes de cinq',
    'Groupes de dix',
    'Groupes de trois',
    'Groupes de quatre',
    'Groupes de neuf',
  ],
);
series('fraction-subtract', 'numbers', 'Soustraire des fractions de même dénominateur', (t, v) => {
  const d = [2, 4, 5, 8, 10, 12][t],
    n = d + v + 2,
    k = v + 1;
  return {
    prompt: 'Combien font ' + n + '/' + d + ' − ' + k + '/' + d + ' ?',
    answer: n - k + '/' + d,
    options: [n - k + '/' + d, n + k + '/' + d, n - k + '/' + d * 2],
    explanation:
      'Les parts sont de même taille. On retire ' +
      k +
      ' parts aux ' +
      n +
      ' parts : il en reste ' +
      (n - k) +
      ' de taille 1/' +
      d +
      '.',
  };
});
series('fraction-times-int', 'numbers', 'Multiplier une fraction par un entier', (t, v) => {
  const d = [2, 3, 4, 5, 8, 10][t],
    n = 1 + v,
    k = 2 + (t % 3);
  return {
    prompt: 'Combien font ' + k + ' × ' + n + '/' + d + ' ?',
    answer: k * n + '/' + d,
    options: [k * n + '/' + d, n + '/' + d * k, k * n + 1 + '/' + d],
    explanation:
      'On réunit ' +
      k +
      ' fois ' +
      n +
      ' parts de taille 1/' +
      d +
      '. Cela donne ' +
      k * n +
      '/' +
      d +
      '.',
  };
});
series('decimal-places', 'numbers', 'Des dixièmes aux millièmes', (t, v) => {
  const n = [1.4, 2.07, 3.208, 4.015, 5.302, 6.009][t] + v;
  const power = t === 0 ? 10 : t === 1 ? 100 : 1000,
    answer = Math.round(n * power) % 10;
  return {
    prompt:
      'Dans ' +
      fmt(n) +
      ', quel chiffre occupe le rang des ' +
      (power === 10 ? 'dixièmes' : power === 100 ? 'centièmes' : 'millièmes') +
      ' ?',
    answer,
    explanation:
      'Les rangs après la virgule sont les dixièmes, les centièmes, puis les millièmes. Ici, le chiffre recherché est ' +
      answer +
      '.',
  };
});
series('decimal-subtract', 'maths', 'Soustraire des nombres décimaux', (t, v) => {
  const a = [4.8, 7.3, 12.05, 20, 10.002, 15.206][t] + v,
    b = [1.2, 2.8, 3.17, 4.75, 0.015, 2.108][t];
  return {
    prompt: 'Calcule ' + fmt(a) + ' − ' + fmt(b) + '.',
    answer: fmt(a - b),
    explanation:
      'On conserve les rangs : unités sous unités, dixièmes sous dixièmes. On peut écrire des zéros à droite. La différence est ' +
      fmt(a - b) +
      '.',
  };
});
series('area-convert', 'measures', 'Relier les unités d’aire', (t, v) => {
  const n = 2 + v,
    prompts = [
      [
        'Combien de cm² font ' + n + ' dm² ?',
        n * 100,
        'Un carré de 1 dm de côté contient 10 × 10 carrés de 1 cm².',
      ],
      ['Combien de dm² font ' + n + ' m² ?', n * 100, '1 m² = 100 dm².'],
      ['Combien de m² font ' + n + ' ares ?', n * 100, 'Un are vaut 100 m².'],
      ['Combien de ares font ' + n + ' hectares ?', n * 100, 'Un hectare vaut 100 ares.'],
      ['Combien de m² font ' + n + ' hectares ?', n * 10000, '1 hectare = 10 000 m².'],
      [
        'Combien de dm² font ' + (n * 100 + 50) + ' cm² ?',
        n + 0.5,
        '100 cm² = 1 dm² ; 50 cm² = 0,5 dm².',
      ],
    ][t];
  return { prompt: prompts[0], answer: fmt(prompts[1]), explanation: prompts[2] };
});
series('duration-seconds', 'measures', 'Des secondes aux heures', (t, v) => {
  const n = 2 + v,
    q = [
      ['Combien de secondes durent ' + n + ' minutes ?', n * 60],
      ['Combien de secondes durent ' + n + ' min 15 s ?', n * 60 + 15],
      ['Combien de minutes durent ' + n * 60 + ' secondes ?', n],
      [
        'Une musique dure 2 min 45 s, puis une autre 1 min 30 s. Combien de secondes dure l’ensemble ?',
        255,
      ],
      [
        'Un atelier commence à 10 h 50 et dure ' +
          (15 + v * 5) +
          ' minutes. À quelle minute de 11 h se termine-t-il ?',
        5 + v * 5,
      ],
      ['Un trajet dure 1 h ' + n + ' min. Combien de secondes dure-t-il ?', 3600 + n * 60],
    ][t];
  return {
    prompt: q[0],
    answer: q[1],
    explanation:
      'Une minute contient 60 secondes ; une heure contient 60 minutes. Ici, le résultat demandé est ' +
      q[1] +
      '.',
  };
});
series('chance-count', 'data', 'Compter les chances et les issues', (t, v) => {
  const r = 2 + v,
    b = 3;
  const qs = [
    [
      'Un sac contient ' +
        r +
        ' jetons rouges et ' +
        b +
        ' bleus, tous indiscernables au toucher. Quelles sont les chances de tirer un rouge ?',
      r + ' chances sur ' + (r + b),
      ['1 chance sur 2', b + ' chances sur ' + (r + b)],
      'On compte ' + r + ' jetons rouges parmi ' + (r + b) + ' jetons.',
    ],
    [
      'On lance un dé équilibré à six faces. Quelles sont les chances d’obtenir un nombre pair ?',
      '3 chances sur 6',
      ['2 chances sur 6', '1 chance sur 6'],
      'Les issues favorables sont 2, 4 et 6.',
    ],
    [
      'On lance un dé équilibré à six faces. Quelles sont les chances d’obtenir un nombre supérieur à 4 ?',
      '2 chances sur 6',
      ['4 chances sur 6', '1 chance sur 6'],
      'Les issues favorables sont 5 et 6.',
    ],
    [
      'Un dé équilibré vient de donner 6. Quelles sont les chances d’obtenir encore 6 au prochain lancer ?',
      '1 chance sur 6',
      ['0 chance sur 6', '2 chances sur 6'],
      'Le dé ne garde pas en mémoire le résultat précédent.',
    ],
    [
      'On lance une pièce équilibrée deux fois. Combien de couples ordonnés de résultats sont possibles ?',
      '4',
      ['2', '3'],
      'Les couples sont pile-pile, pile-face, face-pile, face-face.',
    ],
    [
      'Une pièce équilibrée est lancée deux fois. Quelles sont les chances d’obtenir deux fois pile ?',
      '1 chance sur 4',
      ['1 chance sur 2', '2 chances sur 4'],
      'Parmi les quatre couples équiprobables, un seul est pile-pile.',
    ],
  ][t];
  return { prompt: qs[0], answer: qs[1], options: [qs[1], ...qs[2]], explanation: qs[3] };
});
series('program-steps', 'data', 'Suivre un programme de calcul', (t, v) => {
  const n = 3 + v,
    steps = [
      ['ajoute 2', n + 2],
      ['double, puis ajoute 1', n * 2 + 1],
      ['ajoute 3, puis double', (n + 3) * 2],
      ['triple, puis retire 2', n * 3 - 2],
      ['ajoute 5, double, puis retire 4', (n + 5) * 2 - 4],
      ['double, ajoute 6, puis partage en deux', (n * 2 + 6) / 2],
    ][t];
  return {
    prompt: 'Pars de ' + n + ' : ' + steps[0] + '. Quel nombre obtiens-tu ?',
    answer: steps[1],
    explanation: 'On respecte l’ordre des instructions. Le nombre obtenu est ' + steps[1] + '.',
  };
});
series('proportion-reason', 'maths', 'Raisonner dans une situation proportionnelle', (t, v) => {
  const n = 2 + v,
    qs = [
      [
        'Deux carnets identiques coûtent ' + 2 * n + ' €. Combien coûte un carnet ?',
        n,
        'On partage le prix de deux carnets en deux.',
      ],
      [
        'Deux sachets pèsent ' + 2 * n * 10 + ' g. Combien pèsent six sachets identiques ?',
        6 * n * 10,
        'Six sachets, c’est trois fois deux sachets.',
      ],
      [
        'Trois rubans mesurent ensemble ' + 3 * n + ' m. Combien mesurent deux rubans identiques ?',
        2 * n,
        'On cherche la longueur d’un ruban, puis de deux rubans.',
      ],
      [
        'Deux bouquets utilisent ' +
          2 * n +
          ' fleurs et trois bouquets ' +
          3 * n +
          '. Combien de fleurs pour cinq bouquets identiques ?',
        5 * n,
        'Cinq bouquets, c’est deux bouquets plus trois bouquets.',
      ],
      [
        'Pour quatre personnes, il faut ' +
          4 * n * 10 +
          ' g de farine. Combien pour six personnes ?',
        6 * n * 10,
        'Six personnes, c’est quatre personnes plus la moitié de quatre.',
      ],
      [
        'Trois billets coûtent ' +
          3 * n +
          ' €. On achète six billets et on paie avec 50 €. Combien reçoit-on de monnaie ?',
        50 - 6 * n,
        'Six billets coûtent deux fois le prix de trois billets. On retire ce prix de 50 €.',
      ],
    ][t];
  return { prompt: qs[0], answer: qs[1], explanation: qs[2] };
});
series('object-pronouns', 'grammar', 'Les pronoms compléments', (t) => {
  const q = [
    [
      'Dans « Léa regarde le bateau. Elle le dessine. », que remplace « le » ?',
      'le bateau',
      ['Léa', 'Elle'],
    ],
    [
      'Dans « Les gardiens cherchent les clés. Ils les trouvent. », que remplace « les » ?',
      'les clés',
      ['les gardiens', 'Ils'],
    ],
    [
      'Remplace « la cabane » dans « Nacre observe la cabane ».',
      'Nacre l’observe.',
      ['Nacre les observe.', 'Nacre lui observe.'],
    ],
    [
      'Remplace « aux enfants » dans « Plume parle aux enfants ».',
      'Plume leur parle.',
      ['Plume les parle.', 'Plume le parle.'],
    ],
    [
      'Dans « Mousse lui apporte un livre », « lui » remplace « à Orion ». Quelle est sa fonction ?',
      'Complément du verbe',
      ['Sujet', 'Déterminant'],
    ],
    [
      'Dans « Je les ai rangées », que peut remplacer « les » ?',
      'les petites boîtes',
      ['la petite boîte', 'le petit coffre'],
    ],
  ][t];
  return {
    prompt: q[0],
    answer: q[1],
    options: [q[1], ...q[2]],
    explanation:
      'Le pronom reprend un groupe de mots. Pour le comprendre, on retrouve ce groupe dans la phrase ou le contexte.',
  };
});
series('nature-function', 'grammar', 'Distinguer la nature et la fonction', (t) => {
  const q = [
    [
      'Dans « Le petit renard dort », quelle est la nature de « renard » ?',
      'un nom',
      ['un sujet', 'un verbe'],
    ],
    [
      'Dans « Le petit renard dort », quelle est la fonction de « Le petit renard » ?',
      'sujet',
      ['nom', 'adjectif'],
    ],
    [
      'Dans « La lumière dorée brille », quelle est la nature de « dorée » ?',
      'adjectif',
      ['sujet', 'pronom'],
    ],
    [
      'Dans « Derrière la porte attend le gardien », quel est le sujet du verbe « attend » ?',
      'le gardien',
      ['la porte', 'Derrière la porte'],
    ],
    [
      'Dans « La sirène chante doucement », quelle est la nature de « doucement » ?',
      'adverbe',
      ['adjectif', 'nom'],
    ],
    [
      'Dans « La grande tour semble paisible », quelle est la fonction de « paisible » ?',
      'attribut du sujet',
      ['épithète', 'sujet'],
    ],
  ][t];
  return {
    prompt: q[0],
    answer: q[1],
    options: [q[1], ...q[2]],
    explanation:
      'La nature indique ce qu’est un mot (nom, adjectif…). La fonction indique son rôle dans la phrase (sujet, attribut…).',
  };
});
series('noun-expansion', 'grammar', 'Enrichir le nom et accorder l’attribut', (t) => {
  const q = [
    [
      'Quel groupe contient un adjectif qui précise le nom « tour » ?',
      'la tour lumineuse',
      ['la tour brille', 'près de la tour'],
    ],
    [
      'Dans « le jardin du château », quels mots précisent « jardin » ?',
      'du château',
      ['le jardin', 'le'],
    ],
    ['Quel adjectif est épithète dans « Le petit pont est solide » ?', 'petit', ['solide', 'pont']],
    [
      'Quel adjectif est attribut du sujet dans « Le petit pont est solide » ?',
      'solide',
      ['petit', 'pont'],
    ],
    ['Complète : « Les portes semblent … »', 'ouvertes', ['ouverte', 'ouverts']],
    [
      'Complète : « Les petites sirènes sont devenues … »',
      'silencieuses',
      ['silencieux', 'silencieuse'],
    ],
  ][t];
  return {
    prompt: q[0],
    answer: q[1],
    options: [q[1], ...q[2]],
    explanation:
      'L’épithète précise directement le nom. L’attribut, relié au sujet par un verbe comme être ou sembler, s’accorde avec le sujet.',
  };
});
series('compound-spelling', 'grammar', 'Écrire les temps composés et la négation', (t) => {
  const q = [
    ['Complète : « Les gardiens ont … les fleurs. »', 'arrosé', ['arrosés', 'arroser']],
    ['Complète : « Les sirènes ont … une histoire. »', 'écouté', ['écoutées', 'écouter']],
    [
      'Quelle phrase est à la forme négative ?',
      'Léa n’a pas fermé la fenêtre.',
      ['Léa a fermé pas la fenêtre.', 'Léa ne pas a fermé la fenêtre.'],
    ],
    ['Complète : « Nacre est … avant le repas. »', 'arrivée', ['arrivé', 'arriver']],
    ['Complète : « Les portes sont … ouvertes. »', 'restées', ['restés', 'rester']],
    [
      'Quelle phrase est correctement écrite ?',
      'Elles n’ont jamais oublié leurs livres.',
      ['Elles n’ont jamais oubliées leurs livres.', 'Elles ont ne jamais oublié leurs livres.'],
    ],
  ][t];
  return {
    prompt: q[0],
    answer: q[1],
    options: [q[1], ...q[2]],
    explanation:
      t < 3 || t === 5
        ? 'Avec avoir, le participe passé ne s’accorde pas avec le sujet. La négation encadre l’auxiliaire dans « n’a pas fermé ».'
        : 'Avec être, le participe passé s’accorde avec le sujet.',
  };
});
series('dictionary-context', 'words', 'Utiliser le dictionnaire et le contexte', (t) => {
  const q = [
    [
      'Quel ordre convient dans un dictionnaire ?',
      'cabane, câble, cadeau',
      ['cadeau, câble, cabane', 'câble, cabane, cadeau'],
    ],
    [
      'Pour chercher « couraient » dans le dictionnaire, quelle entrée choisir ?',
      'courir',
      ['courant', 'couraient'],
    ],
    [
      'Dans une recette, « incorporer la farine » signifie…',
      'mélanger la farine à la préparation',
      ['ranger la farine sur une étagère', 'acheter un paquet de farine'],
    ],
    [
      'Dans « une voix claire », quel sens de « claire » convient ?',
      'facile à entendre',
      ['bien éclairée', 'de couleur pâle'],
    ],
    [
      'Quel mot de la famille de « terre » désigne un lieu où poussent des plantes ?',
      'terrain',
      ['terrible', 'tendre'],
    ],
    [
      'Quel mot peut remplacer « observer » dans « observer les étoiles avec attention » ?',
      'examiner',
      ['apercevoir par hasard', 'ignorer'],
    ],
  ][t];
  return {
    prompt: q[0],
    answer: q[1],
    options: [q[1], ...q[2]],
    explanation:
      'Le dictionnaire aide à trouver la forme du mot et ses sens. La phrase permet de choisir le sens qui convient.',
  };
});
function missions(id, group, label, steps) {
  const route = ['geometry', 'maths', 'numbers', 'data', 'measures'].includes(group)
    ? 'math'
    : 'language';
  CM2_SKILLS.push({ id, group, label, format: 'accompanied', route });
  steps.forEach((step, tier) =>
    CM2_ACTIVITIES.push({
      id: 'cm2-' + id + '-' + tier,
      skill: id,
      group,
      route,
      tier,
      type: 'mission',
      title: label,
      prompt: step[0],
      explanation: step[1],
      answer: null,
    }),
  );
}
missions('writing-revise', 'writing', 'Écrire, relire et améliorer un texte', [
  [
    'Décris un compagnon en trois phrases. Donne un détail qu’on peut voir et un qu’on peut entendre.',
    'Relis : ton lecteur peut-il imaginer le personnage ? Tu peux faire cet écrit sur papier, puis en parler avec un adulte.',
  ],
  [
    'Raconte une petite découverte : avant, pendant, après.',
    'Lis ton texte à quelqu’un. Les trois moments se suivent-ils clairement ?',
  ],
  [
    'Écris un dialogue entre deux compagnons qui cherchent un objet.',
    'Vérifie qui parle à chaque réplique. Une courte indication peut aider le lecteur.',
  ],
  [
    'Explique en quelques phrases comment fabriquer un marque-page.',
    'Vérifie l’ordre des étapes. Demande à un adulte si l’on peut suivre tes instructions.',
  ],
  [
    'Reprends un de tes textes. Remplace deux mots vagues et ajoute un lien entre deux phrases.',
    'La révision sert à mieux communiquer, pas à effacer toutes les imperfections. Un adulte peut t’aider à sélectionner un seul point à revoir.',
  ],
  [
    'Écris une courte lettre pour proposer un livre à un compagnon. Donne un avis et un exemple.',
    'Relis d’abord le sens, puis un accord choisi avec un adulte. Cette mission n’évalue pas automatiquement l’écriture.',
  ],
]);
missions('literature-passport', 'reading', 'Lire des œuvres et partager ses découvertes', [
  [
    'Choisis un livre avec un adulte. Après quelques pages, raconte ce qui donne envie de continuer.',
    'Un texte bref de l’application ne remplace pas une œuvre entière. Le programme CM2 prévoit sept œuvres dans l’année, dont trois du patrimoine.',
  ],
  [
    'Dans un conte lu à la maison ou à l’école, choisis un héros et explique une de ses décisions.',
    'Appuie ton avis sur un passage. Tu peux être en désaccord avec le personnage.',
  ],
  [
    'Compare une scène merveilleuse dans deux histoires que tu connais.',
    'Qu’est-ce qui est impossible dans la vie ordinaire ? En quoi les deux auteurs l’utilisent-ils différemment ?',
  ],
  [
    'Choisis un poème et un vers que tu aimes. Lis-le avec deux intonations différentes.',
    'Explique ce que les mots, les sons ou l’image te font imaginer.',
  ],
  [
    'Après une fable ou un récit, discute d’une décision des personnages avec un adulte.',
    'Cherche un argument dans le texte. Il est possible de proposer plusieurs interprétations justifiées.',
  ],
  [
    'Présente une œuvre terminée : titre, genre, passage choisi, avis et lien avec une autre lecture.',
    'Garde une trace dans un carnet papier. Les lectures longues et les échanges sont nécessaires en complément des exercices courts.',
  ],
]);
missions('oral-listen', 'oral', 'Écouter, reformuler et échanger', [
  [
    'Avec un adulte, écoute trois consignes simples et reformule-les avant d’agir.',
    'L’adulte vérifie le sens de ta reformulation. Aucun enregistrement n’est fait.',
  ],
  [
    'Demande à un adulte de lire un paragraphe, puis raconte son idée principale.',
    'Discutez de ce qui est essentiel et de ce qui est seulement un détail.',
  ],
  [
    'Explique à un adulte comment tu as résolu un calcul, avec tes propres mots.',
    'Une explication peut utiliser des gestes, un schéma et des mots.',
  ],
  [
    'Lis un petit dialogue à deux, en respectant les tours de parole.',
    'Prépare les pauses et le ton. Cette activité n’est pas chronométrée par l’application.',
  ],
  [
    'Présente un livre ou une découverte en trois idées ordonnées, puis réponds à une question.',
    'Ton interlocuteur peut t’indiquer ce qu’il a compris et demander une précision.',
  ],
  [
    'Discute d’une question avec un adulte : donne un argument, écoute le sien, puis reformule son avis.',
    'Reformuler l’avis de l’autre aide à vérifier qu’on l’a compris avant de répondre.',
  ],
]);
series('data-charts', 'data', 'Lire des diagrammes et des courbes', (t, v) => {
  const labels = ['Lundi', 'Mardi', 'Mercredi'],
    values = [2 + v, 5 + v, 3 + v];
  const kind = t < 2 ? 'school-bars' : t < 4 ? 'school-curve' : 'school-pie';
  if (t >= 4)
    return {
      prompt:
        t === 4
          ? 'Quelle catégorie occupe la moitié du disque ?'
          : 'Combien de quarts du disque occupent ensemble les plantes et les animaux ?',
      answer: t === 4 ? 'Livres' : '2',
      options: t === 4 ? ['Livres', 'Plantes', 'Animaux'] : ['2', '1', '3'],
      visual: { kind, labels: ['Livres', 'Plantes', 'Animaux'], values: [2, 1, 1] },
      explanation:
        'Les livres occupent deux quarts, soit la moitié. Les plantes et les animaux occupent chacun un quart.',
    };
  const answer = t % 2 === 0 ? values[1] : values[1] - values[0];
  return {
    prompt:
      t % 2 === 0
        ? 'Combien de nouveaux livres a-t-on lus mardi ?'
        : 'Combien de livres de plus a-t-on lus mardi que lundi ?',
    answer,
    visual: { kind, labels, values },
    explanation:
      'On lit la valeur du mardi : ' +
      values[1] +
      '.' +
      (t % 2 ? ' Puis on retire les ' + values[0] + ' livres du lundi : ' + answer + '.' : ''),
  };
});
series('equality-unknown', 'maths', 'Chercher le nombre qui manque', (t, v) => {
  const n = 4 + v,
    a = 3 + t,
    qs = [
      ['□ + ' + a + ' = ' + (n + a), n, 'On retire ' + a + ' au total.'],
      ['' + (n + a) + ' − □ = ' + a, n, 'On cherche ce qui a été retiré.'],
      [a + ' × □ = ' + a * n, n, 'On peut utiliser une division ou la table de ' + a + '.'],
      ['□ ÷ ' + a + ' = ' + n, n * a, 'On reconstitue les ' + a + ' groupes.'],
      [
        '(□ + ' + a + ') × 2 = ' + (n + a) * 2,
        n,
        'On partage le résultat en deux, puis on retire ' + a + '.',
      ],
      [
        'Deux boîtes identiques et ' +
          a +
          ' perles libres font ' +
          (2 * n + a) +
          ' perles. Combien par boîte ?',
        n,
        'On retire les perles libres, puis on partage le reste en deux.',
      ],
    ][t];
  return {
    prompt: qs[0],
    answer: qs[1],
    explanation: qs[2] + ' Le nombre recherché est ' + qs[1] + '.',
  };
});
missions('geometry-paper', 'geometry', 'Construire et vérifier sur papier', [
  [
    'Avec une règle et une équerre, trace deux droites perpendiculaires. Explique comment tu vérifies l’angle droit.',
    'Un adulte peut regarder le geste et la vérification. Un écran ne valide pas cette construction.',
  ],
  [
    'Trace un rectangle de 6 cm sur 4 cm. Marque ses angles droits et compare les côtés opposés.',
    'Utilise règle et équerre ; contrôle les quatre angles et les longueurs.',
  ],
  [
    'Trace un cercle de centre O et de rayon 3 cm. Place deux points sur le cercle.',
    'Le compas garde le même écartement. Les deux points sont à 3 cm du centre.',
  ],
  [
    'Sur une feuille quadrillée, dessine une figure et son symétrique par rapport à une droite du quadrillage.',
    'Compte les carreaux perpendiculairement à l’axe. Chaque point et son image sont à la même distance de l’axe.',
  ],
  [
    'Dessine un patron possible d’un cube sur une feuille quadrillée. Découpe et plie avec un adulte si tu le souhaites.',
    'Vérifie que six carrés forment les six faces sans se superposer. Tous les assemblages de six carrés ne conviennent pas.',
  ],
  [
    'Écris un programme pour qu’un adulte construise ton rectangle et un cercle passant par le milieu d’un côté.',
    'Donne le nom des points, les dimensions et le centre du cercle. Comparez les figures et précisez les consignes si nécessaire.',
  ],
]);
