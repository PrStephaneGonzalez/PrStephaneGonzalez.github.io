// Original short lessons. External videos are optional, selected links rather
// than a search feed; none is loaded until the child follows the link.
const video = (slug, title) => ({
  url: 'https://www.lumni.fr/video/' + slug,
  title,
  provider: 'Lumni',
});
const tables = video(
  'construire-les-tables-de-multiplication-de-6-a-9',
  'Construire les tables de 6 à 9',
);
const smallTables = video(
  'construire-les-tables-de-multiplication-de-1-a-5',
  'Construire les tables de 1 à 5',
);
const fraction = video(
  'les-fractions-sur-la-droite-graduee',
  'Les fractions sur la droite graduée',
);
const subjects = video(
  'reconnaitre-le-groupe-nominal-sujet',
  'Reconnaître le groupe nominal sujet',
);
const base = {
  reading: {
    title: 'Suivre les indices du texte',
    steps: [
      'Repère qui agit, ce qui se passe et ce qui change.',
      'Pour une réponse écrite dans le texte, cherche les mots qui la prouvent.',
      'Pour déduire, relie plusieurs indices sans inventer un événement.',
    ],
    example:
      '« Maïa ferme son parapluie en entrant. » Le texte ne dit pas « il pleut », mais le parapluie donne un indice sur le temps.',
  },
  words: {
    title: 'Lire et mémoriser un mot',
    steps: [
      'Repère les groupes de lettres qui font un son.',
      'Lis le mot en entier, puis observe la partie difficile.',
      'Cache le mot, écris-le, puis compare avec le modèle.',
    ],
    example:
      'Dans « château », le groupe eau écrit le son /o/. On peut observer châ · teau, cacher le mot, puis l’écrire.',
  },
  grammar: {
    title: 'Comprendre les liens dans la phrase',
    steps: [
      'Repère le verbe conjugué en changeant le temps.',
      'Cherche son sujet : qui est-ce qui fait l’action ?',
      'Observe les mots qui vont ensemble pour choisir leurs accords.',
    ],
    example:
      '« Les petites chouettes volent. » Le sujet « les petites chouettes » est au pluriel : le verbe s’écrit « volent ».',
    video: subjects,
  },
  writing: {
    title: 'Écrire puis améliorer une phrase',
    steps: [
      'Choisis d’abord ce que tu veux raconter et à qui.',
      'Écris une phrase qui transmet ton idée.',
      'Relis une fois pour le sens, puis vérifie le point précis demandé : accord, mot de liaison ou ponctuation.',
    ],
    example:
      '« La porte grince. Maïa entre. » peut devenir « Malgré le grincement de la porte, Maïa entre dans la tour. »',
  },
  geometry: {
    title: 'Décrire une figure par ses propriétés',
    steps: [
      'Observe les côtés, les angles et les éventuelles lignes de symétrie.',
      'Distingue ce que le dessin suggère de ce que les informations permettent d’affirmer.',
      'Pour une construction, prépare règle, équerre ou compas selon la consigne.',
    ],
    example:
      'Un rectangle a quatre angles droits. Un carré possède aussi cette propriété, avec quatre côtés de même longueur.',
  },
  measures: {
    title: 'Choisir et comparer les mesures',
    steps: [
      'Repère la grandeur : longueur, masse, durée, aire ou angle.',
      'Choisis une unité adaptée.',
      'Pour comparer ou calculer, exprime d’abord les mesures dans la même unité.',
    ],
    example: '2 m 35 cm = 235 cm. On peut alors comparer cette longueur à 240 cm.',
  },
};
const math = {
  line: [
    [
      'Se repérer entre deux bornes',
      'Trouve le milieu de la droite, puis les moitiés de chaque côté. La position dépend de la part du chemin déjà parcourue.',
      'Sur une droite de 0 à 100, 50 est au milieu et 25 au milieu entre 0 et 50.',
    ],
    [
      'Placer des centaines',
      'La moitié de 1 000 est 500. Utilise ce repère, puis estime les positions entre les repères.',
      'Sur une droite de 0 à 1 000, 750 est aux trois quarts du chemin.',
    ],
    [
      'Placer des milliers',
      'Garde les mêmes proportions même si les nombres deviennent plus grands.',
      'Sur une droite de 0 à 10 000, 2 500 est au quart du chemin.',
    ],
    [
      'Repérer les décimaux',
      'Une unité peut se partager en dix dixièmes ou en cent centièmes. Lis la borne de droite avant de placer le nombre.',
      '0,5 est au milieu entre 0 et 1. Sur une droite de 0 à 10, le milieu vaut 5.',
    ],
    [
      'Placer une fraction',
      'Le dénominateur dit en combien de parts égales on partage une unité. Le numérateur compte ces parts.',
      '3/4 correspond à trois pas d’un quart à partir de zéro.',
      fraction,
    ],
    [
      'Relier fractions et décimaux',
      'Traduis les écritures pour les comparer. Les repères 0, 1/2 et 1 sont utiles.',
      '1/2 = 0,5 ; 3/4 = 0,75 ; 1/8 = 0,125.',
      fraction,
    ],
  ],
  facts: [
    [
      'Compléter et doubler',
      'Pour compléter à 10, cherche ce qui manque. Pour doubler, ajoute le nombre à lui-même.',
      '6 + 4 = 10 ; le double de 7 est 7 + 7 = 14.',
    ],
    [
      'Compléter à 100 et prendre la moitié',
      'Passe par une dizaine connue pour compléter. Pour prendre la moitié, partage en deux parts égales.',
      'Pour 38 : 2 pour arriver à 40, puis 60 pour arriver à 100. Le complément est 62.',
    ],
    [
      'Les tables de 2, 5 et 10',
      'Multiplier, c’est prendre plusieurs fois la même quantité. Appuie-toi sur les doubles et les groupes de cinq ou dix.',
      '4 × 5 = 20, car quatre groupes de cinq donnent vingt.',
      smallTables,
    ],
    [
      'Les tables de 3, 4 et 6',
      'Pars d’un résultat connu. La table de 4 peut se construire en doublant deux fois.',
      '6 × 4 : le double de 6 est 12, puis le double de 12 est 24.',
      smallTables,
    ],
    [
      'Les tables de 7, 8 et 9',
      'Décompose un calcul difficile en calculs connus : doubler, ajouter un groupe ou retirer un groupe de dix.',
      '9 × 7 = 10 × 7 − 7 = 70 − 7 = 63.',
      tables,
    ],
    [
      'Retrouver une division',
      'Une division demande combien de groupes on peut faire, ou quelle quantité reçoit chaque part. Cherche la multiplication associée.',
      '56 ÷ 8 = 7, car 8 × 7 = 56.',
      video('comprendre-la-division-methode-et-exemples', 'Comprendre la division'),
    ],
  ],
  place: [
    [
      'Échanger dix unités',
      'Chaque colonne vaut dix fois celle qui est à sa droite. Dix unités font une dizaine.',
      '2 dizaines et 14 unités deviennent 3 dizaines et 4 unités : 34.',
    ],
    [
      'Garder la place des zéros',
      'Un zéro garde la place d’une colonne vide. On ne le supprime pas dans l’écriture du nombre.',
      'Dans 406, il y a 4 centaines, 0 dizaine et 6 unités.',
    ],
    [
      'Lire les milliers',
      'Lis les groupes de trois chiffres, puis leur unité : mille, million…',
      '7 038 se lit « sept mille trente-huit ».',
    ],
    [
      'Lire les grands nombres',
      'Sépare les nombres en classes de trois chiffres. Les zéros gardent leur place même si on ne les prononce pas tous.',
      '4 007 020 se lit « quatre millions sept mille vingt ».',
    ],
    [
      'Comprendre dixièmes et centièmes',
      'Un dixième vaut dix centièmes. Les chiffres après la virgule occupent eux aussi des positions.',
      '3,07 = 3 unités et 7 centièmes ; ce n’est pas 3,7.',
    ],
    [
      'Comprendre les millièmes',
      'Un centième vaut dix millièmes. Lis chaque colonne et conserve les zéros intermédiaires.',
      '2,305 = 2 unités, 3 dixièmes, 0 centième et 5 millièmes.',
    ],
  ],
  bars: [
    [
      'Représenter des parties et un tout',
      'Une grande barre représente le tout. Les petites barres représentent les parties. Marque l’inconnue avant de calculer.',
      'Une boîte contient 18 billes, dont 7 bleues. La partie restante vaut 18 − 7 = 11.',
    ],
    [
      'Représenter une comparaison',
      'Dessine deux barres avec la même origine. Le morceau qui dépasse représente l’écart.',
      'Léa a 12 cartes, soit 4 de plus que Noé. Noé a 12 − 4 = 8 cartes.',
    ],
    [
      'Représenter des parts égales',
      'Dessine autant de parts identiques que de groupes. Repère si tu cherches le tout, une part ou le nombre de parts.',
      '24 pierres partagées entre 6 sacs : chaque sac reçoit 24 ÷ 6 = 4 pierres.',
    ],
    [
      'Organiser deux étapes',
      'Dessine la situation puis cherche une première quantité utile. Écris ce que représente chaque calcul.',
      '3 paquets de 6 cartes donnent 18 cartes. Après un don de 5 cartes, il en reste 13.',
    ],
    [
      'Choisir les données utiles',
      'Lis la question, puis relie chaque donnée à ce que tu cherches. Certaines informations ne servent pas au calcul.',
      'Pour le prix de 4 plumes à 3 pièces, la couleur des plumes ne change pas le calcul : 4 × 3.',
    ],
    [
      'Formuler la question',
      'Une question doit utiliser les informations disponibles et demander une quantité inconnue. Dessine ce que tu veux chercher.',
      '« Il y a 5 coffres avec 8 pièces chacun. » On peut demander : combien y a-t-il de pièces en tout ?',
    ],
  ],
};
const grammar = [
  [
    /word-classes|nature-function/,
    'Distinguer nature et fonction',
    'La nature dit ce qu’est un mot : nom, verbe, déterminant… La fonction dit son rôle dans cette phrase : sujet, complément…',
    'Dans « Le chat dort », chat est un nom. Le groupe « le chat » est sujet de dort.',
  ],
  [
    /subject|verb-agreement/,
    'Trouver le sujet et accorder le verbe',
    'Change le temps pour repérer le verbe, puis cherche de qui ou de quoi il parle. Accorde le verbe avec ce sujet.',
    '« Les oiseaux chantent. » devient « Ils chantent ». Le sujet est au pluriel.',
    subjects,
  ],
  [
    /noun-agreement|noun-expansion/,
    'Accorder le groupe nominal',
    'Repère le nom principal, son genre et son nombre. Les déterminants et les adjectifs qui s’y rapportent s’accordent avec lui.',
    '« une petite étoile » devient « des petites étoiles ».',
  ],
  [
    /complements|object-pronouns/,
    'Repérer les compléments',
    'Observe si le groupe complète le verbe ou apporte une circonstance. Essaie de le déplacer ou de le supprimer, puis vérifie le sens.',
    'Dans « Maïa ouvre la porte le matin », « la porte » complète ouvre ; « le matin » indique quand.',
  ],
  [
    /conjug-imparfait/,
    'Conjuguer à l’imparfait',
    'Prends le radical de nous au présent, sans -ons, puis ajoute -ais, -ais, -ait, -ions, -iez, -aient. Être utilise le radical ét-.',
    'nous chantons → je chantais ; nous étions.',
  ],
  [
    /conjug-futur/,
    'Conjuguer au futur',
    'Pour beaucoup de verbes, pars de l’infinitif et ajoute -ai, -as, -a, -ons, -ez, -ont. Certains verbes ont un radical particulier.',
    'demain, elle chantera ; demain, nous irons.',
  ],
  [
    /conjug-present|verb-bank/,
    'Relier sujet et forme du verbe',
    'Repère la personne et le nombre du sujet. Le présent a plusieurs modèles : observe le verbe demandé et compare les formes.',
    'je prends, nous prenons ; elle est, elles sont.',
  ],
  [
    /conjug-passe|compound-spelling/,
    'Construire un temps composé',
    'Un temps composé utilise un auxiliaire et un participe passé. Repère d’abord avoir ou être, puis la forme du participe.',
    'Elle a chanté. Elles sont arrivées. Avec être, le participe s’accorde avec le sujet.',
  ],
  [
    /complex-sentences/,
    'Relier les propositions',
    'Repère les verbes conjugués : chaque proposition s’organise autour d’un verbe. Les mots de liaison précisent le rapport entre les idées.',
    '« Elle entre parce que la porte est ouverte » contient entre et est : deux propositions.',
  ],
];
const targeted = {
  homophones: [
    'Choisir un homophone avec le sens',
    'Des mots peuvent se prononcer de la même façon et s’écrire différemment. Lis la phrase et cherche le rôle du mot. Une substitution peut aider.',
    '« Elle a une cape » devient « Elle avait une cape » : on écrit a, le verbe avoir.',
  ],
  morphology: [
    'Construire les familles de mots',
    'Cherche une partie commune qui porte le sens. Un préfixe se place avant cette base, un suffixe après.',
    'Faire → refaire : re- indique que l’on fait de nouveau.',
  ],
  'lexical-meaning': [
    'Comprendre les relations entre les mots',
    'Le sens d’un mot dépend du contexte. Deux synonymes ont des sens proches ; des contraires s’opposent.',
    'Dans « une lourde valise », lourd parle du poids. Dans « un lourd silence », le sens est figuré.',
  ],
  'dictionary-context': [
    'Chercher le bon sens dans le dictionnaire',
    'Cherche le mot dans l’ordre alphabétique, puis compare ses différents sens à la phrase.',
    'Une « feuille » peut appartenir à un arbre ou servir à écrire : la phrase permet de choisir.',
  ],
  'text-genres': [
    'Reconnaître le type de texte',
    'Observe comment le texte est écrit et ce qu’il cherche à faire : raconter, expliquer, décrire ou faire ressentir.',
    'Un documentaire apporte des informations ; un récit présente des personnages et des événements.',
  ],
  shapes: [
    'Décrire les figures',
    'Utilise les propriétés des côtés et des angles, plutôt que la position du dessin.',
    'Un carré garde quatre côtés égaux et quatre angles droits même si on le tourne.',
  ],
  lines: [
    'Comparer deux droites',
    'Des droites parallèles gardent le même écart. Des droites perpendiculaires se coupent en formant quatre angles droits.',
    'L’équerre permet de vérifier un angle droit.',
  ],
  angles: [
    'Reconnaître un angle',
    'Un angle mesure l’ouverture entre deux directions. Compare-le à un angle droit.',
    'Un angle aigu est plus petit qu’un angle droit ; un angle obtus est plus grand qu’un angle droit et plus petit qu’un angle plat.',
  ],
  solids: [
    'Décrire un solide',
    'Repère ses faces, ses arêtes et ses sommets. Une vue de face ne montre pas forcément tout le solide.',
    'Un cube possède six faces carrées, douze arêtes et huit sommets.',
  ],
  symmetry: [
    'Utiliser un axe de symétrie',
    'Deux points symétriques sont de part et d’autre de l’axe, à la même distance. Leur segment est perpendiculaire à l’axe.',
    'Avec un pliage sur l’axe, les deux parties se superposent.',
  ],
  construction: [
    'Suivre un programme de construction',
    'Prépare les instruments puis exécute une instruction à la fois. Vérifie les longueurs et les angles demandés.',
    'Pour tracer un rectangle, on utilise la règle pour mesurer et l’équerre pour les angles droits.',
  ],
  lengths: [
    'Convertir les longueurs',
    'Pour comparer, utilise la même unité. Un mètre vaut cent centimètres ; un kilomètre vaut mille mètres.',
    '3 m 25 cm = 325 cm.',
  ],
  'mass-capacity': [
    'Convertir masses et contenances',
    'Distingue la masse, mesurée en grammes ou kilogrammes, de la contenance, mesurée en litres.',
    '2 kg 300 g = 2 300 g ; 1 L = 100 cL.',
  ],
  durations: [
    'Calculer une durée',
    'Les heures se partagent en soixante minutes. Pour une durée, passe par une heure repère.',
    'De 9 h 45 à 10 h 20 : 15 minutes jusqu’à 10 h, puis 20 minutes, soit 35 minutes.',
  ],
  perimeter: [
    'Calculer le périmètre',
    'Le périmètre est la longueur du contour. Additionne les côtés après les avoir exprimés dans la même unité.',
    'Un rectangle de 6 cm sur 4 cm a un périmètre de 6 + 4 + 6 + 4 = 20 cm.',
  ],
  area: [
    'Calculer une aire',
    'L’aire mesure la surface. On peut compter des carrés unités. L’aire d’un rectangle est longueur × largeur.',
    'Un rectangle de 6 cm sur 4 cm a une aire de 24 cm².',
  ],
  'area-convert': [
    'Convertir les unités d’aire',
    'Quand chaque côté d’un carré est multiplié par dix, son aire est multipliée par cent.',
    '1 m² = 10 000 cm² : ce n’est pas 100 cm².',
  ],
  'duration-seconds': [
    'Relier heures, minutes et secondes',
    'Une minute vaut soixante secondes et une heure vaut soixante minutes.',
    '2 min 15 s = 120 s + 15 s = 135 s.',
  ],
  'fraction-calculation': [
    'Additionner des fractions de même dénominateur',
    'Le dénominateur conserve la taille des parts. Additionne les nombres de parts.',
    '2/7 + 3/7 = 5/7.',
  ],
  'fraction-subtract': [
    'Soustraire des fractions de même dénominateur',
    'Retire les parts demandées sans changer leur taille.',
    '5/8 − 2/8 = 3/8.',
  ],
  'fraction-times-int': [
    'Multiplier une fraction par un entier',
    'Répète la même fraction. Le nombre de parts est multiplié, leur taille reste la même.',
    '3 × 2/5 = 6/5.',
  ],
  'fraction-operator': [
    'Prendre une fraction d’une quantité',
    'Partage la quantité en autant de parts égales que l’indique le dénominateur, puis prends le nombre de parts indiqué au numérateur.',
    'Les 3/4 de 20 : 20 ÷ 4 = 5, puis 3 × 5 = 15.',
  ],
  'data-read': [
    'Lire un tableau ou un diagramme',
    'Lis le titre, les étiquettes et l’unité. Repère ensuite les données utiles à la question.',
    'Une barre qui atteint 12 sur l’axe « livres » représente douze livres.',
  ],
  'data-charts': [
    'Choisir et lire une représentation',
    'Le titre, la légende et les axes indiquent ce qui est mesuré. Compare les valeurs avec la même échelle.',
    'Un diagramme en barres permet de comparer plusieurs quantités.',
  ],
  chance: [
    'Raisonner sur les chances',
    'Compte les issues favorables parmi toutes les issues possibles, quand elles ont les mêmes chances.',
    'Dans un sac contenant trois billes bleues et une rouge, tirer une rouge a une chance sur quatre.',
  ],
  'chance-count': [
    'Dénombrer les issues possibles',
    'Dresse la liste ou dessine un arbre pour ne pas oublier de cas. Compte ensuite les cas favorables.',
    'Deux pièces peuvent donner : pile-pile, pile-face, face-pile, face-face.',
  ],
  proportion: [
    'Reconnaître une proportionnalité',
    'Dans une situation proportionnelle, quand une quantité est multipliée par un nombre, l’autre est multipliée par ce même nombre.',
    'Si 2 plumes coûtent 6 pièces, 4 plumes identiques coûtent 12 pièces.',
  ],
  'proportion-reason': [
    'Passer par une quantité connue',
    'Utilise un regroupement, une décomposition ou le prix d’une unité pour trouver la quantité demandée.',
    'Si 3 carnets coûtent 12 pièces, un carnet coûte 4 pièces, puis 5 carnets coûtent 20 pièces.',
  ],
};
export function miniCourse(roomId, { tier = 0, skillId = null, sample = null } = {}) {
  let course;
  if (skillId === 'written-operations') {
    const rows = [
      [
        'Aligner les colonnes',
        'Place les unités sous les unités, les dizaines sous les dizaines et les centaines sous les centaines. Additionne de droite à gauche.',
        '123 + 234 : 3 + 4 = 7 unités, 2 + 3 = 5 dizaines, 1 + 2 = 3 centaines, donc 357.',
      ],
      [
        'Reporter une retenue',
        'Une colonne peut produire dix unités ou plus. Écris les unités et reporte les dizaines dans la colonne suivante.',
        '8 + 7 = 15 : on écrit 5 et on reporte 1. Cette retenue s’ajoute aux dizaines.',
      ],
      [
        'Échanger pour soustraire',
        'Une centaine peut être échangée contre dix dizaines ; une dizaine contre dix unités. La valeur totale reste la même.',
        'Dans 302, échange une centaine contre dix dizaines, puis une dizaine contre dix unités : 2 centaines, 9 dizaines et 12 unités.',
      ],
      [
        'Multiplier colonne par colonne',
        'Commence par les unités. La retenue représente des dizaines à ajouter au produit de la colonne suivante.',
        '24 × 3 : 4 × 3 = 12, on écrit 2 et reporte 1 ; 2 × 3 + 1 = 7, donc 72.',
      ],
      [
        'Deux lignes de multiplication',
        'Décompose le multiplicateur en dizaines et unités. Calcule une ligne pour chaque partie, puis additionne les deux résultats.',
        '123 × 14 = 123 × 4 + 123 × 10 = 492 + 1 230 = 1 722.',
      ],
      [
        'Garder la valeur des décimales',
        'Les chiffres après la virgule représentent des dixièmes ou des centièmes. Garde cette unité quand tu multiplies ou partages.',
        '2,4 × 3 : 24 dixièmes × 3 = 72 dixièmes, soit 7,2. Pour partager 7,2 en 3, on partage 72 dixièmes.',
      ],
    ][tier];
    course = { title: rows[0], steps: [rows[1]], example: rows[2] };
  }
  if (skillId === 'geometry-properties')
    course = {
      title: 'Justifier avec les propriétés',
      steps: [
        'Repère ce qui est donné : côtés, angles, centre ou axe.',
        'Cherche la propriété qui permet de conclure ; une figure tournée garde ses propriétés.',
      ],
      example:
        'Quatre côtés égaux suffisent pour un losange. Pour affirmer que c’est un carré, il faut aussi quatre angles droits.',
    };
  if (skillId === 'sentence-transform')
    course = {
      title: 'Transformer en gardant le sens',
      steps: [
        'Repère exactement ce qui change : sujet, nombre, genre, temps ou pronom.',
        'Modifie les mots qui dépendent de ce changement, puis relis la phrase.',
      ],
      example:
        'Le petit chat dort. → Les petits chats dorment. Le déterminant, le nom, l’adjectif et le verbe suivent le pluriel.',
    };

  if (skillId === 'proportion') {
    const rows = [
      [
        'Répéter la même quantité',
        'Quand on triple le nombre d’objets identiques, on triple leur prix.',
        'Un carnet à 4 € : trois carnets coûtent 3 × 4 = 12 €.',
      ],
      [
        'Passer par un seul objet',
        'On cherche d’abord le prix ou la quantité pour une unité, puis on adapte à la quantité demandée.',
        'Quatre carnets coûtent 20 € ; un carnet coûte 20 ÷ 4 = 5 €.',
      ],
      [
        'Changer de groupement',
        'Compare le nombre de groupes avant de calculer.',
        'Deux rubans mesurent 6 m ; six rubans, c’est trois fois plus, donc 18 m.',
      ],
      [
        'Additionner des groupes',
        'Quand les quantités se réunissent, leurs valeurs se réunissent aussi.',
        'Si deux fioles contiennent 8 cL et trois fioles 12 cL, cinq fioles contiennent 20 cL.',
      ],
      [
        'Utiliser une moitié',
        'Pour passer de quatre à six, on ajoute à quatre sa moitié.',
        'Farine pour quatre : 200 g. Pour six : 200 + 100 = 300 g.',
      ],
      [
        'Repérer des frais fixes',
        'Une somme fixe ne se répète pas avec chaque objet ou chaque heure. Le total n’est alors pas proportionnel.',
        '3 € fixes et 2 € par heure : deux heures coûtent 7 €, quatre heures coûtent 11 €, pas 14 €.',
      ],
    ][tier];
    course = { title: rows[0], steps: [rows[1]], example: rows[2] };
  }
  const specific = targeted[skillId];
  if (specific && !course)
    course = { title: specific[0], steps: [specific[1]], example: specific[2] };
  if (skillId?.startsWith('verb-bank-')) {
    const pattern = ['conjug-present', 'conjug-imparfait', 'conjug-futur', 'conjug-passe'][tier];
    const item = pattern ? grammar.find(([p]) => p.test(pattern)) : null;
    course = item
      ? { title: item[1], steps: [item[2]], example: item[3] }
      : tier === 4
        ? {
            title: 'Reconnaître le passé simple',
            steps: [
              'Le passé simple raconte souvent les actions achevées d’un récit écrit. Observe le modèle du verbe et la personne.',
            ],
            example: 'Elle entra, il prit sa cape, puis ils partirent.',
          }
        : {
            title: 'Construire le plus-que-parfait',
            steps: [
              'Utilise avoir ou être à l’imparfait, puis le participe passé. Ce temps situe une action avant une autre action passée.',
            ],
            example: 'Quand elle arriva, il avait déjà ouvert le livre.',
          };
  }
  if (!course && skillId && roomId === 'grammar') {
    const item = grammar.find(([pattern]) => pattern.test(skillId));
    if (item) course = { title: item[1], steps: [item[2]], example: item[3], video: item[4] };
  }
  if (!course && math[roomId] && !skillId) {
    const row = math[roomId][Math.max(0, Math.min(5, tier))];
    course = { title: row[0], steps: [row[1]], example: row[2], video: row[3] };
  }
  if (!course && skillId && sample?.hint)
    course = {
      title: sample.stageLabel || sample.title,
      steps: [sample.hint],
      example: sample.explanation,
    };
  course ||= base[roomId] || {
    title: 'Représenter avant de calculer',
    steps: ['Lis ce que tu cherches. Représente les quantités, puis choisis les calculs.'],
    example: 'Un dessin ou un schéma aide à voir les liens entre les données.',
  };
  course = { ...course };
  if (roomId === 'reading' && !skillId)
    course.video = {
      url: 'https://maitrelucas.fr/lecons/lire-un-texte-narratif/',
      title: 'Lire et comprendre un récit',
      provider: 'Maître Lucas',
    };
  if (roomId === 'place' && !skillId && tier === 3)
    course.video = video(
      'lire-et-ecrire-les-grands-nombres-jusqu-au-milliard',
      'Lire et écrire les grands nombres',
    );
  if (roomId === 'line' && !skillId && tier < 3)
    course.video = video(
      'comment-reperer-des-nombres-sur-une-droite-graduee',
      'Se repérer sur une droite graduée',
    );
  if (roomId === 'bars' && !skillId && tier < 4)
    course.video = video(
      'resoudre-les-problemes-quelle-operation-utiliser',
      'Choisir une opération dans un problème',
    );
  if (roomId === 'geometry' && skillId === 'shapes')
    course.video = video('decrire-le-carre', 'Décrire le carré');
  if (roomId === 'measures' && skillId === 'lengths')
    course.video = video(
      'des-ordres-de-grandeur-entre-le-metre-et-le-centimetre',
      'Le mètre et le centimètre',
    );
  if (roomId === 'words' && /morphology/.test(skillId || ''))
    course.video = video('le-prefixe', 'Le préfixe');
  if (roomId === 'measures' && /^(area|perimeter)/.test(skillId || ''))
    course.video = video(
      'quelle-est-la-difference-entre-laire-et-le-perimetre-5-mai',
      'Aire et périmètre',
    );
  return { ...course, steps: [...course.steps] };
}
