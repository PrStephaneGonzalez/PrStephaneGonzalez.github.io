// Teaching sequences: each rung changes the mathematical or linguistic obstacle.
export const CORE_SKILLS = [
  'guided-place',
  'guided-calc',
  'guided-fraction',
  'guided-words',
  'guided-reading',
];
export const GUIDED_SKILLS = [
  {
    id: CORE_SKILLS[0],
    group: 'numbers',
    label: 'Construire les nombres et échanger',
    stages: [
      'Dix unités font une dizaine',
      'Échanger dans un nombre à deux chiffres',
      'Dix dizaines font une centaine',
      'Deux échanges successifs',
      'Défaire une dizaine pour soustraire',
      'Défaire une centaine pour soustraire',
    ],
  },
  {
    id: CORE_SKILLS[1],
    group: 'maths',
    label: 'Décomposer les calculs',
    stages: [
      'Additionner dizaines et unités',
      'Franchir une dizaine',
      'Décomposer une addition',
      'Soustraire en passant par une dizaine',
      'Décomposer une multiplication',
      'Partager en décomposant',
    ],
  },
  {
    id: CORE_SKILLS[2],
    group: 'numbers',
    label: 'Comprendre les fractions',
    stages: [
      'Partager une unité en parts égales',
      'Construire une fraction',
      'Repérer une fraction entre zéro et un',
      'Dépasser une unité',
      'Reconnaître deux fractions égales',
      'Prendre une fraction d’une quantité',
    ],
  },
  {
    id: CORE_SKILLS[3],
    group: 'words',
    label: 'Construire les mots et leurs familles',
    stages: [
      'Assembler des syllabes simples',
      'Assembler avec un groupe de lettres',
      'Trouver une lettre avec la famille',
      'Comprendre un préfixe',
      'Comprendre un suffixe',
      'Choisir un mot grâce à la phrase',
    ],
  },
  {
    id: CORE_SKILLS[4],
    group: 'reading',
    label: 'Comprendre et trouver un indice',
    stages: [
      'Retrouver une information',
      'Remettre des actions en ordre',
      'Comprendre une cause implicite',
      'Retrouver qui désigne un pronom',
      'Croiser deux indices',
      'Relier un texte et un tableau',
    ],
  },
].map((s) => ({
  ...s,
  format: 'guided',
  route: ['words', 'reading'].includes(s.group) ? 'language' : 'math',
}));
export const GUIDED_ACTIVITIES = [];
function add(k, t, v, props) {
  const s = GUIDED_SKILLS[k];
  GUIDED_ACTIVITIES.push({
    id: `guided-${k}-${t}-${v}`,
    skill: s.id,
    group: s.group,
    title: s.label,
    tier: t,
    stageLabel: s.stages[t],
    route: s.route,
    type: 'guided',
    supported: v === 0,
    variant: v,
    ...props,
  });
}
for (let t = 0; t < 6; t++)
  for (let v = 0; v < 6; v++) {
    let start,
      remove = 0;
    if (t === 0) start = { c: 0, d: 0, u: 12 + v };
    if (t === 1) start = { c: 0, d: 1 + v, u: 12 + v };
    if (t === 2) start = { c: 0, d: 12 + v, u: 3 };
    if (t === 3) start = { c: 1, d: 9, u: 12 + v };
    if (t === 4) {
      start = { c: 0, d: 5 + v, u: 2 };
      remove = 18;
    }
    if (t === 5) {
      start = { c: 1 + v, d: 0, u: 2 };
      remove = 37;
    }
    const total = start.c * 100 + start.d * 10 + start.u,
      answer = total - remove;
    add(0, t, v, {
      mode: 'exchange',
      start,
      remove,
      answer,
      prompt: remove
        ? `Le coffre contient ${total} perles. Retire ${remove} perles, puis range ce qui reste en centaines, dizaines et unités.`
        : 'Range les perles en centaines, dizaines et unités. Échange les paquets sans changer la quantité.',
      model: remove
        ? 'Pour retirer des unités lorsqu’il en manque, on peut ouvrir une dizaine : elle devient dix unités. Si les dizaines manquent, on peut ouvrir une centaine. La quantité totale ne change pas pendant un échange.'
        : 'Dix unités peuvent être échangées contre une dizaine. Dix dizaines deviennent une centaine. La quantité totale reste la même.',
      explanation: `${total}${remove ? ' − ' + remove : ''} = ${answer}. On obtient ${Math.floor(answer / 100)} centaine(s), ${Math.floor((answer % 100) / 10)} dizaine(s) et ${answer % 10} unité(s).`,
      success: 'Tu as utilisé les échanges entre unités, dizaines et centaines.',
    });
    let a, b, op, steps, model;
    if (t === 0) {
      a = 23 + v * 10;
      b = 14;
      op = '+';
      steps = [
        ['Les dizaines ensemble', Math.floor(a / 10) * 10 + 10],
        ['Les unités ensemble', (a % 10) + 4],
        ['Le total', a + b],
      ];
      model = 'Pour 32 + 15 : 30 + 10 = 40 ; 2 + 5 = 7 ; 40 + 7 = 47.';
    }
    if (t === 1) {
      a = 28 + v * 10;
      b = 7;
      op = '+';
      steps = [
        ['Pour atteindre la dizaine suivante, j’ajoute', 2],
        ['Sur les 7, il reste à ajouter', 5],
        ['Le total', a + b],
      ];
      model = 'Pour 38 + 6 : j’ajoute 2 pour atteindre 40, puis encore 4. Cela donne 44.';
    }
    if (t === 2) {
      a = 48 + v * 10;
      b = 27;
      op = '+';
      steps = [
        ['Après avoir ajouté les 20', a + 20],
        ['Après avoir ajouté les 7', a + b],
      ];
      model = 'Pour 46 + 28 : je sépare 28 en 20 et 8. 46 + 20 = 66 ; 66 + 8 = 74.';
    }
    if (t === 3) {
      a = 52 + v * 10;
      b = 18;
      op = '−';
      steps = [
        ['Après avoir retiré les 10', a - 10],
        ['Après avoir retiré les 8', a - b],
      ];
      model = 'Pour 63 − 17 : je retire 10, puis 7. 63 − 10 = 53 ; 53 − 7 = 46.';
    }
    if (t === 4) {
      a = 16 + v;
      b = 4;
      op = '×';
      steps = [
        ['10 × 4', 40],
        [`${a - 10} × 4`, (a - 10) * 4],
        ['Les deux résultats réunis', a * 4],
      ];
      model = 'Pour 14 × 3 : 10 × 3 = 30 et 4 × 3 = 12. Je réunis 30 et 12 : 42.';
    }
    if (t === 5) {
      a = 156 + v * 6;
      b = 3;
      op = '÷';
      steps = [
        ['150 partagés en 3', 50],
        [`${a - 150} partagés en 3`, (a - 150) / 3],
        ['Chaque part au total', a / 3],
      ];
      model =
        'Pour partager 126 en 3 : je partage 120 en 3, soit 40 ; puis 6 en 3, soit 2. Chaque part vaut 42.';
    }
    add(1, t, v, {
      mode: 'steps',
      prompt: `Le coffre des calculs : ${a} ${op} ${b}. Complète les étapes de cette méthode.`,
      steps,
      answer: steps.at(-1)[1],
      model,
      explanation:
        steps.map(([label, n]) => `${label} : ${n}`).join('. ') +
        '. Une autre méthode juste est possible.',
      success: 'Tu as décomposé le calcul en étapes.',
    });
    const d =
      t === 0
        ? [2, 3, 4, 5, 6, 8][v]
        : t === 1
          ? [4, 5, 6, 4, 5, 6][v]
          : [2, 3, 4].includes(t)
            ? [4, 4, 4, 3, 3, 5][v]
            : 4;
    const n =
      t === 0
        ? 1
        : t === 1
          ? [1, 2, 3, 3, 4, 5][v]
          : t === 2 || t === 4
            ? [1, 2, 3, 1, 2, 2][v]
            : t === 3
              ? [5, 6, 7, 4, 5, 7][v]
              : 3;
    const fraction = {
      mode: 'fraction',
      parts: d,
      numerator: n,
      units: t === 3 ? 2 : 1,
      model:
        'La fraction se rapporte à une unité. Le dénominateur indique en combien de parts égales on la partage. Le numérateur compte combien de ces parts on prend.',
      success: 'Tu as relié la fraction à sa représentation.',
    };
    if (t < 2)
      Object.assign(fraction, {
        interaction: 'paint',
        prompt: `La bande entière vaut une unité. Colorie ${n}/${d} de cette bande.`,
        answer: n,
        explanation: `${n}/${d}, c’est ${n} part(s) parmi ${d} parts égales d’une unité.`,
      });
    if (t === 0) {
      const equal = Array(d).fill(1),
        unequal = Array(d).fill(1);
      unequal[0] = 2;
      const partitions = [equal, unequal, Array(d + 1).fill(1)];
      const shift = v % 3;
      fraction.partitions = partitions.slice(shift).concat(partitions.slice(0, shift));
      Object.assign(fraction, {
        interaction: 'partition',
        prompt: `Chaque bande représente une unité entière. Choisis celle qui est partagée en ${d} parts égales.`,
        answer: (3 - shift) % 3,
        model:
          'Pour partager une unité, il faut le nombre de parts demandé ET des parts de même taille. Quatre parts égales auraient chacune la même largeur.',
        explanation: `Le bon partage comporte ${d} parts de même taille. L’un des autres partages a des parts inégales ; le dernier n’a pas le nombre de parts demandé.`,
        success: 'Tu as reconnu un partage en parts égales.',
      });
    }
    if (t === 2 || t === 3)
      Object.assign(fraction, {
        interaction: 'line',
        prompt: `Place ${n}/${d} sur la droite. Chaque unité est partagée en ${d} parts égales.`,
        answer: n,
        explanation: `On part de zéro et on avance de ${n} graduation(s), chacune vaut 1/${d} de l’unité. ${t === 3 ? `${n}/${d} est plus grand que 1, car ${d}/${d} = 1.` : ''}`,
      });
    if (t === 4)
      Object.assign(fraction, {
        interaction: 'equivalent',
        targetParts: d * 2,
        prompt: `La première bande montre ${n}/${d}. Colorie la même quantité sur la seconde, partagée en ${d * 2} parts égales.`,
        answer: n * 2,
        explanation: `Chaque part de 1/${d} correspond à deux parts de 1/${d * 2}. ${n}/${d} = ${n * 2}/${d * 2} : la quantité et la taille de l’unité restent identiques.`,
        model:
          'Si l’on coupe chaque part en deux, on double le nombre total de parts et le nombre de parts colorées. La quantité représentée et la taille de l’unité restent les mêmes.',
      });
    if (t === 5) {
      const quantity = 12 + v * 4;
      Object.assign(fraction, {
        interaction: 'quantity',
        quantity,
        prompt: `Le sac contient ${quantity} perles. Combien représentent les trois quarts du sac ?`,
        answer: (quantity / 4) * 3,
        steps: [
          ['Un quart du sac', quantity / 4],
          ['Trois quarts du sac', (quantity / 4) * 3],
        ],
        explanation: `On partage ${quantity} en quatre groupes égaux : ${quantity / 4} dans chaque groupe. On prend trois groupes : ${quantity / 4} × 3 = ${(quantity / 4) * 3}.`,
        model:
          'Pour trouver les trois quarts de 8 perles, on fait quatre groupes de 2 perles, puis on prend trois groupes : 6 perles.',
      });
    }
    add(2, t, v, fraction);
  }
const words = [
  [
    ['lapin', ['la', 'pin'], 'la-pi'],
    ['vélo', ['vé', 'lo'], 'lo-vé'],
    ['tomate', ['to', 'ma', 'te'], 'ma-to'],
    ['pirate', ['pi', 'ra', 'te'], 'ra-pi'],
    ['domino', ['do', 'mi', 'no'], 'mi-do'],
    ['salade', ['sa', 'la', 'de'], 'la-sa'],
  ],
  [
    ['chapeau', ['cha', 'peau'], 'cha-po'],
    ['mouton', ['mou', 'ton'], 'mou-tin'],
    ['bateau', ['ba', 'teau'], 'ba-to'],
    ['jardin', ['jar', 'din'], 'jar-don'],
    ['poussin', ['pous', 'sin'], 'pou-son'],
    ['bouchon', ['bou', 'chon'], 'bou-chin'],
  ],
  [
    ['dent', 'dentiste', 't'],
    ['chant', 'chanter', 't'],
    ['grand', 'grande', 'd'],
    ['petit', 'petite', 't'],
    ['lait', 'laitier', 't'],
    ['long', 'longue', 'g'],
  ],
  [['relire', 'lire à nouveau', ['lire très vite', 'lire sans comprendre']], '', ''],
];
const wordClues = [
  [
    'Je suis un animal aux longues oreilles.',
    'Je roule sur deux roues et j’ai des pédales.',
    'Je suis un fruit rouge que l’on mange souvent en salade.',
    'Je suis un personnage d’aventure qui navigue sur les mers.',
    'Je suis une petite pièce de jeu marquée de points.',
    'Je suis un plat qui peut réunir des feuilles vertes et des crudités.',
  ],
  [
    'On me porte sur la tête.',
    'Je suis un animal qui porte de la laine.',
    'Je flotte sur l’eau pour transporter des voyageurs.',
    'On y fait pousser des fleurs ou des légumes.',
    'Je suis le petit de la poule.',
    'Je ferme le goulot d’une bouteille.',
  ],
];
const prefixes = [
  ['relire', 'lire à nouveau', ['lire très vite', 'lire à voix basse']],
  ['défaire', 'annuler ce qui a été fait', ['faire deux fois', 'faire ensemble']],
  ['impossible', 'qui ne peut pas se faire', ['qui se fait vite', 'qui vient après']],
  ['préhistoire', 'période avant l’histoire', ['période après l’histoire', 'histoire inventée']],
  ['recommencer', 'commencer à nouveau', ['commencer plus tard', 'finir ensemble']],
  ['désobéir', 'ne pas obéir', ['obéir rapidement', 'obéir deux fois']],
];
const suffixes = [
  ['chanteur', 'une personne qui chante', ['un lieu pour chanter', 'une petite chanson']],
  ['maisonnette', 'une petite maison', ['plusieurs maisons', 'la personne qui bâtit']],
  ['lavable', 'que l’on peut laver', ['qui lave les autres', 'qui a déjà été lavé']],
  ['jardinier', 'une personne qui s’occupe du jardin', ['un petit jardin', 'un outil de jardin']],
  ['rapidement', 'de manière rapide', ['une personne rapide', 'le contraire de rapide']],
  ['fillette', 'une petite fille', ['plusieurs filles', 'une fille qui chante']],
];
const contexts = [
  ['Le cheval court dans le…', 'pré', ['près', 'prêt'], 'Le pré est un terrain couvert d’herbe.'],
  ['Le gardien est… à partir.', 'prêt', ['pré', 'près'], 'Prêt signifie préparé.'],
  ['Le chat dort… de la cheminée.', 'près', ['pré', 'prêt'], 'Près indique la proximité.'],
  [
    'Elle… une carte du château.',
    'a',
    ['à', 'as'],
    'On peut remplacer a par avait : elle avait une carte.',
  ],
  ['Ils… dans la bibliothèque.', 'sont', ['son', 'sons'], 'On peut remplacer sont par étaient.'],
  ['Il ouvre… livre.', 'son', ['sont', 'sons'], 'Son accompagne le nom livre.'],
];
for (let t = 0; t < 6; t++)
  for (let v = 0; v < 6; v++) {
    const base = {
      mode: 'words',
      success: 'Tu as utilisé la structure du mot ou le sens de la phrase.',
    };
    if (t < 2) {
      const [word, pieces] = words[t][v];
      Object.assign(base, {
        interaction: 'assemble',
        word,
        pieces,
        prompt: `${wordClues[t][v]} Assemble mon nom avec les morceaux. Tu peux écouter le mot.`,
        model:
          'Pour construire un mot, on peut lire ses morceaux dans l’ordre, puis relire le mot entier. Pour « moto », on assemble mo et to.',
        explanation: `${pieces.join(' + ')} → ${word}. Cette activité entraîne l’assemblage et l’orthographe ; elle ne mesure pas la lecture à voix haute.`,
        listen: word,
      });
    }
    if (t === 2) {
      const [word, family, letter] = words[t][v];
      Object.assign(base, {
        interaction: 'choice',
        prompt: `Dans « ${word.slice(0, -1)}… », quelle lettre finale retrouve-t-on grâce au mot « ${family} » ?`,
        options: [letter, ...['d', 't', 'g', 's'].filter((x) => x !== letter).slice(0, 2)],
        answer: letter,
        model:
          'Les mots d’une même famille peuvent aider à écrire une lettre qu’on entend peu ou pas : dans « haut », le t se retrouve dans « hauteur ».',
        explanation: `${word} et ${family} appartiennent à la même famille. Le mot ${family} aide à retrouver le ${letter}.`,
      });
    }
    if (t === 3 || t === 4) {
      const [word, answer, others] = (t === 3 ? prefixes : suffixes)[v];
      Object.assign(base, {
        interaction: 'choice',
        prompt: `Que signifie « ${word} » ?`,
        options: [answer, ...others],
        answer,
        model:
          t === 3
            ? 'Un préfixe est placé au début d’un mot. Il peut changer son sens : refaire signifie faire à nouveau.'
            : 'Un suffixe termine un mot et peut préciser son sens : un pommier est un arbre qui porte des pommes.',
        explanation: `« ${word} » signifie « ${answer} ». Le sens des morceaux aide à comprendre le mot entier.`,
      });
    }
    if (t === 5) {
      const [prompt, answer, others, explanation] = contexts[v];
      Object.assign(base, {
        interaction: 'choice',
        prompt,
        options: [answer, ...others],
        answer,
        model:
          'Des mots peuvent se prononcer de la même manière et s’écrire différemment. La phrase aide à choisir. « Un verre » désigne un récipient ; « vert » désigne une couleur.',
        explanation,
      });
    }
    add(3, t, v, base);
  }
const readingVariants = [
  [
    [
      'Mousse pose une clé sous un coussin. Il range ensuite une carte dans le tiroir.',
      'Où se trouve la clé ?',
      ['sous le coussin', 'dans le tiroir', 'sur la carte'],
      'sous le coussin',
      [
        'Le coussin cache la clé.',
        'Le coussin cache une carte.',
        'Une carte est rangée dans le tiroir.',
      ],
    ],
    [
      'Plume porte un ruban bleu. Nacre porte un ruban vert. Elles préparent un spectacle.',
      'Quelle couleur porte Nacre ?',
      ['vert', 'bleu', 'rouge'],
      'vert',
      [
        'Le ruban de Nacre est de couleur verte.',
        'Le ruban de Nacre est bleu.',
        'Les deux amies préparent un spectacle.',
      ],
    ],
    [
      'Brindille récolte trois pommes et cinq poires. Les fruits vont dans deux paniers.',
      'Quels fruits sont les plus nombreux ?',
      ['les poires', 'les pommes', 'il y en a autant'],
      'les poires',
      [
        'La récolte compte plus de poires que de pommes : cinq contre trois.',
        'La récolte compte plus de pommes que de poires.',
        'Les fruits sont mis dans deux paniers.',
      ],
    ],
    [
      'Orion visite la serre le matin et la bibliothèque après le déjeuner.',
      'Quand visite-t-il la bibliothèque ?',
      ['après le déjeuner', 'le matin', 'avant le petit déjeuner'],
      'après le déjeuner',
      [
        'Orion a déjà déjeuné quand il va à la bibliothèque.',
        'Orion va à la bibliothèque avant de déjeuner.',
        'Orion va dans la serre le matin.',
      ],
    ],
    [
      'Lina prête un livre à Plume. Elle offre une carte à Mousse.',
      'Que reçoit Mousse ?',
      ['une carte', 'un livre', 'un ruban'],
      'une carte',
      [
        'Mousse reçoit une carte en cadeau.',
        'Mousse reçoit un livre en cadeau.',
        'Plume reçoit un livre en prêt.',
      ],
    ],
    [
      'Nacre prend le chemin du jardin. Le chemin de la tour est choisi par Orion.',
      'Qui va au jardin ?',
      ['Nacre', 'Orion', 'Mousse'],
      'Nacre',
      [
        'Nacre se dirige vers le jardin.',
        'Orion se dirige vers le jardin.',
        'Orion choisit le chemin de la tour.',
      ],
    ],
  ],
  [
    [
      'Avant de planter, Brindille creuse un trou. Elle dépose la graine, puis remet la terre.',
      'Que fait-elle juste avant de remettre la terre ?',
      ['déposer la graine', 'creuser le trou', 'arroser la plante'],
      'déposer la graine',
      ['Elle dépose la graine, puis remet la terre', 'Avant de planter'],
    ],
    [
      'Plume commence par découper une étoile. Après l’avoir coloriée, elle la suspend.',
      'Quelle action vient en dernier ?',
      ['suspendre l’étoile', 'colorier l’étoile', 'découper l’étoile'],
      'suspendre l’étoile',
      ['Après l’avoir coloriée, elle la suspend', 'commence par découper'],
    ],
    [
      'Pour le goûter, Mousse lave les pommes, les coupe, puis les apporte à table.',
      'Que fait-il avant de couper les pommes ?',
      ['il les lave', 'il les apporte', 'il les mange'],
      'il les lave',
      ['lave les pommes, les coupe', 'les apporte à table'],
    ],
    [
      'Lina écrit le titre après avoir choisi son histoire. Elle dessine la couverture en dernier.',
      'Que fait-elle en premier ?',
      ['choisir son histoire', 'écrire le titre', 'dessiner la couverture'],
      'choisir son histoire',
      ['après avoir choisi son histoire', 'en dernier'],
    ],
    [
      'Orion remplit son arrosoir. Il arrose les fleurs avant de ranger l’arrosoir.',
      'Que fait-il entre le remplissage et le rangement ?',
      ['arroser les fleurs', 'remplir l’arrosoir', 'cueillir les fleurs'],
      'arroser les fleurs',
      ['Il arrose les fleurs avant de ranger', 'remplit son arrosoir'],
    ],
    [
      'Nacre cherche une feuille. Avant de dessiner, elle taille son crayon. Elle commence ensuite le portrait.',
      'Quelle action précède immédiatement le dessin ?',
      ['tailler le crayon', 'commencer le portrait', 'chercher une gomme'],
      'tailler le crayon',
      ['Avant de dessiner, elle taille son crayon', 'Elle commence ensuite'],
    ],
  ],
  [
    [
      'Mousse veut dessiner dehors. Des gouttes frappent les vitres. Il installe ses crayons dans la bibliothèque.',
      'Pourquoi dessine-t-il probablement à l’intérieur ?',
      ['il pleut', 'il a perdu ses crayons', 'la bibliothèque est fermée'],
      'il pleut',
      ['Des gouttes frappent les vitres', 'installe ses crayons'],
    ],
    [
      'Plume arrive devant une longue table. Toutes les chaises sont occupées. Elle apporte un tabouret du couloir.',
      'Pourquoi apporte-t-elle un tabouret ?',
      ['pour pouvoir s’asseoir', 'pour allonger la table', 'pour ranger les livres'],
      'pour pouvoir s’asseoir',
      ['Toutes les chaises sont occupées', 'une longue table'],
    ],
    [
      'Brindille verse un peu d’eau dans un pot. La terre est sèche et se détache en petits morceaux.',
      'Pourquoi arrose-t-elle probablement ?',
      ['la terre manque d’eau', 'le pot est trop grand', 'la plante doit être coupée'],
      'la terre manque d’eau',
      ['La terre est sèche', 'un pot'],
    ],
    [
      'Lina suit la ligne avec son doigt. Le texte du panneau est minuscule. Elle se rapproche pour le lire.',
      'Pourquoi se rapproche-t-elle ?',
      ['les lettres sont petites', 'le panneau bouge', 'elle veut écrire dessus'],
      'les lettres sont petites',
      ['Le texte du panneau est minuscule', 'suit la ligne'],
    ],
    [
      'Orion examine deux ponts. L’un rejoint directement la serre ; l’autre fait un grand détour. Il choisit le premier.',
      'Pourquoi choisit-il probablement le premier pont ?',
      ['le trajet est plus court', 'la serre est fermée', 'les deux trajets sont identiques'],
      'le trajet est plus court',
      ['directement la serre ; l’autre fait un grand détour', 'examine deux ponts'],
    ],
    [
      'Nacre essaie de nouer un paquet. Le ruban ne fait pas le tour. Elle prend un ruban plus long.',
      'Pourquoi change-t-elle de ruban ?',
      ['le premier est trop court', 'la couleur ne lui plaît pas', 'le paquet est vide'],
      'le premier est trop court',
      ['Le ruban ne fait pas le tour', 'un paquet'],
    ],
  ],
  [
    [
      'Lina trouve une boîte. Elle ouvre cette boîte et la pose sur une étagère.',
      'Que remplace « la » dans « la pose » ?',
      ['la boîte', 'Lina', 'l’étagère'],
      'la boîte',
      ['ouvre cette boîte et la pose', 'sur une étagère'],
    ],
    [
      'Mousse ramasse des feuilles. Il les glisse dans son carnet.',
      'Que remplace « les » ?',
      ['les feuilles', 'les carnets', 'les arbres'],
      'les feuilles',
      ['ramasse des feuilles', 'dans son carnet'],
    ],
    [
      'Plume rencontre Orion. Elle lui prête sa carte.',
      'À qui renvoie « lui » ?',
      ['Orion', 'Plume', 'la carte'],
      'Orion',
      ['Plume rencontre Orion', 'sa carte'],
    ],
    [
      'Brindille regarde le jardin. Elle y retourne après le repas.',
      'Quel lieu remplace « y » ?',
      ['le jardin', 'le repas', 'la cuisine'],
      'le jardin',
      ['regarde le jardin', 'après le repas'],
    ],
    [
      'Nacre achète trois pommes. Elle en donne une à Lina.',
      'De quoi parle « en » ?',
      ['des pommes', 'de Lina', 'de pièces de monnaie'],
      'des pommes',
      ['achète trois pommes', 'à Lina'],
    ],
    [
      'Orion écrit à ses amis. Il leur annonce son retour.',
      'Qui est désigné par « leur » ?',
      ['ses amis', 'Orion', 'son retour'],
      'ses amis',
      ['écrit à ses amis', 'son retour'],
    ],
  ],
  [
    [
      'Le dernier départ pour la tour est à seize heures. L’horloge indique seize heures dix. Mousse visite le jardin.',
      'Pourquoi ne part-il probablement pas pour la tour ?',
      ['le dernier départ est passé', 'la tour a disparu', 'le jardin est fermé'],
      'le dernier départ est passé',
      ['dernier départ à seize heures ; horloge à seize heures dix', 'Mousse visite le jardin'],
    ],
    [
      'La serre ouvre à neuf heures et ferme à midi. Plume arrive à onze heures trente. La visite dure vingt minutes.',
      'Peut-elle finir la visite avant la fermeture ?',
      [
        'oui, à onze heures cinquante',
        'non, elle finit après midi',
        'non, la serre est déjà fermée',
      ],
      'oui, à onze heures cinquante',
      [
        'arrivée à onze heures trente ; durée vingt minutes ; fermeture à midi',
        'la serre ouvre à neuf heures',
      ],
    ],
    [
      'Il faut quatre boutons pour une cape. Brindille a dix boutons et veut fabriquer trois capes.',
      'A-t-elle assez de boutons ?',
      ['non, il en manque deux', 'oui, il en reste deux', 'oui, elle utilise dix boutons'],
      'non, il en manque deux',
      [
        'quatre boutons par cape ; trois capes ; dix boutons disponibles',
        'Brindille fabrique des capes',
      ],
    ],
    [
      'La boîte choisie doit être bleue et ronde. La boîte A est bleue et carrée. La boîte B est rouge et ronde. La boîte C est bleue et ronde.',
      'Quelle boîte respecte les deux conditions ?',
      ['C', 'A', 'B'],
      'C',
      ['C est bleue et ronde', 'A est bleue'],
    ],
    [
      'Lina cherche un livre de moins de cent pages sur les animaux. Un livre de quatre-vingts pages parle des oiseaux. Un livre de cent vingt pages parle des chevaux.',
      'Quel livre correspond à sa recherche ?',
      ['celui sur les oiseaux', 'celui sur les chevaux', 'aucun des deux'],
      'celui sur les oiseaux',
      ['oiseaux : quatre-vingts pages ; moins de cent pages demandé', 'chevaux : cent vingt pages'],
    ],
    [
      'Le spectacle a lieu le jeudi. Orion répète deux jours avant. Le mercredi, il prépare seulement les costumes.',
      'Quel jour répète-t-il ?',
      ['mardi', 'mercredi', 'vendredi'],
      'mardi',
      ['spectacle jeudi ; répétition deux jours avant', 'mercredi : costumes'],
    ],
  ],
];
const names = ['Mousse', 'Brindille', 'Plume', 'Nacre', 'Orion', 'Lina'];
for (let t = 0; t < 6; t++)
  for (let v = 0; v < 6; v++) {
    const name = names[v],
      base = {
        mode: 'reading',
        interaction: 'choice',
        success: 'Tu as relié ta réponse à un indice du document.',
      };
    if (t === 5) {
      const start = 9 + v;
      Object.assign(base, {
        text: `${name} cherche un atelier qui commence après ${start} h et qui dure au moins une heure. Le tableau donne les horaires des ateliers du château.`,
        document: {
          headers: ['Atelier', 'Début', 'Fin'],
          rows: [
            ['Étoiles', `${start} h`, `${start + 1} h`],
            ['Jardin', `${start + 1} h`, `${start + 2} h`],
            ['Cartes', `${start + 1} h`, `${start + 1} h 30`],
          ],
        },
        prompt: 'Quel atelier respecte les deux conditions ?',
        options: ['Jardin', 'Étoiles', 'Cartes'],
        answer: 'Jardin',
        evidence: ['Jardin commence plus tard et dure une heure', 'Cartes commence plus tard'],
        evidenceAnswer: 0,
        explanation: `Jardin commence à ${start + 1} h, après ${start} h, et dure une heure. Étoiles ne commence pas après l’heure demandée ; Cartes ne dure que trente minutes.`,
      });
    }
    if (t < 5) {
      const [text, prompt, options, answer, evidence] = readingVariants[t][v];
      Object.assign(base, {
        text,
        prompt,
        options,
        answer,
        evidence,
        evidenceAnswer: 0,
        explanation: `L’indice utile est : « ${evidence[0]} ». Il permet de choisir : ${answer}.${t === 0 ? ' Une autre phrase parle bien du texte, mais ne répond pas à la question ; la dernière change une information.' : ''}`,
      });
    }
    Object.assign(base, {
      model:
        'Je repère la question, je cherche les informations utiles, puis je relie les indices. Je peux retourner au texte pendant que je réponds.',
    });
    // Rotate options so the correct answer is not always in the first position.
    const shift = v % 3;
    base.options = base.options.slice(shift).concat(base.options.slice(0, shift));
    if (v % 2) {
      base.evidence.reverse();
      base.evidenceAnswer = base.evidence.length - 1;
    }
    add(4, t, v, base);
  }
export function guidedCorrect(a, response) {
  if (a.mode === 'exchange')
    return (
      response.c * 100 + response.d * 10 + response.u === a.answer &&
      response.d < 10 &&
      response.u < 10
    );
  if (a.mode === 'steps' || a.interaction === 'quantity')
    return a.steps.every(
      ([, n], i) => Number(response[i]) === n && String(response[i]).trim() !== '',
    );
  if (a.mode === 'fraction') return response === a.answer;
  if (a.interaction === 'assemble') return response === a.word;
  return response === a.answer;
}

for (const a of GUIDED_ACTIVITIES)
  a.practiceKey = JSON.stringify([
    a.skill,
    a.tier,
    a.mode === 'exchange'
      ? a.start
      : a.mode === 'steps'
        ? a.steps
        : a.mode === 'fraction'
          ? [a.parts, a.numerator, a.quantity, a.interaction, a.partitions]
          : a.mode === 'reading'
            ? [a.text, a.prompt]
            : [a.word, a.prompt],
  ]);
