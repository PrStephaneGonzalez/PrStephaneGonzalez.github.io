export const WORKSHOPS = [
  {
    id: 'sounds',
    name: 'Les sons du château',
    icon: '♬',
    sub: 'Écouter et reconnaître les graphies',
    color: '#4d546e',
  },
  {
    id: 'words',
    name: 'Les familles de mots',
    icon: '❧',
    sub: 'Sens, orthographe et mots cousins',
    color: '#386455',
  },
  {
    id: 'reading',
    name: 'Les récits de Plume',
    icon: '▤',
    sub: 'Comprendre, imaginer, observer la langue',
    color: '#5b4868',
  },
  {
    id: 'numbers',
    name: 'Le jardin des nombres',
    icon: '◒',
    sub: 'Quantités, droite graduée et fractions',
    color: '#3d626c',
  },
  {
    id: 'maths',
    name: 'L’atelier du CM2',
    icon: '＋',
    sub: 'Calculs, mesures et petits problèmes',
    color: '#665c3e',
  },
  {
    id: 'facts',
    name: 'Le cabinet des merveilles',
    icon: '✧',
    sub: 'Des savoirs à découvrir pour le plaisir',
    color: '#31596b',
  },
];
const rows = [];
function add(group, title, prompt, options, answer, explanation, extra = {}) {
  rows.push({
    id: `${group}-${rows.filter((x) => x.group === group).length}`,
    group,
    title,
    prompt,
    options,
    answer,
    explanation,
    type: 'choice',
    ...extra,
  });
}
const sounds = [
  [
    'ch',
    'chat',
    'château',
    ['cadeau', 'château', 'bateau'],
    'Dans château, ch représente le même son qu’au début de chat.',
  ],
  [
    'ou',
    'loup',
    'mouton',
    ['matin', 'mouton', 'manteau'],
    'Dans mouton, ou se lit comme dans loup.',
  ],
  [
    'on',
    'pont',
    'dragon',
    ['dragon', 'drap', 'dalle'],
    'À la fin de dragon, on représente le même son que dans pont.',
  ],
  [
    'an',
    'vent',
    'ruban',
    ['rubis', 'ruban', 'robot'],
    'Dans ruban, an représente le même son que en dans vent.',
  ],
  [
    'in',
    'lapin',
    'jardin',
    ['journal', 'jardin', 'juron'],
    'À la fin de jardin, in se lit comme dans lapin.',
  ],
  [
    'ph',
    'phare',
    'dauphin',
    ['dauphin', 'dragon', 'dindon'],
    'Le groupe ph représente le son f dans dauphin.',
  ],
  [
    'gn',
    'montagne',
    'champignon',
    ['champion', 'chameau', 'champignon'],
    'Dans champignon, gn se lit comme dans montagne.',
  ],
  ['oi', 'roi', 'étoile', ['étoile', 'étude', 'étage'], 'Le groupe oi se lit comme dans roi.'],
  [
    'eau',
    'bateau',
    'cadeau',
    ['cadenas', 'cadeau', 'cahier'],
    'Le groupe eau représente le son o dans cadeau.',
  ],
  [
    'ai',
    'aile',
    'maison',
    ['mouton', 'maison', 'miroir'],
    'Dans maison, ai représente le même son qu’au début de aile.',
  ],
  [
    'en',
    'vent',
    'dent',
    ['date', 'dent', 'doute'],
    'Dans dent et vent, en représente le même son.',
  ],
  [
    'eau',
    'château',
    'chapeau',
    ['chou', 'chapeau', 'chemin'],
    'Dans chapeau et château, eau se lit o.',
  ],
];
for (const [g, model, word, options, explanation] of sounds)
  add(
    'sounds',
    `Le groupe « ${g} »`,
    `Quel mot contient « ${g} », pour entendre le même son que dans « ${model} » ?`,
    options,
    word,
    explanation,
    {
      audio: `Quel mot contient le groupe de lettres ${g.split('').join(', ')}, comme dans ${model} ?`,
      hint: `Cherche le groupe « ${g} » dans le mot entier.`,
    },
  );
for (const [base, answer, options, explanation] of [
  [
    'jardin',
    'jardinier',
    ['jardinier', 'journal', 'jaune'],
    'Un jardinier s’occupe d’un jardin. Les mots partagent jardin.',
  ],
  [
    'chant',
    'chanteuse',
    ['chance', 'chanteuse', 'château'],
    'Chanteuse appartient à la famille de chanter et de chant.',
  ],
  [
    'dent',
    'dentiste',
    ['danse', 'dentiste', 'dinde'],
    'Le dentiste soigne les dents. Le t final de dent devient audible dans dentiste.',
  ],
  [
    'grand',
    'grandeur',
    ['grandeur', 'grain', 'grange'],
    'Grandeur partage le sens de grand. Le d se retrouve dans grande.',
  ],
  [
    'lait',
    'laitier',
    ['laine', 'laitier', 'lampe'],
    'Laitier est construit sur lait. Le t muet de lait s’entend dans laitier.',
  ],
  [
    'fleur',
    'fleuriste',
    ['flèche', 'fleuve', 'fleuriste'],
    'Un fleuriste travaille avec des fleurs.',
  ],
  [
    'terre',
    'terrestre',
    ['terrestre', 'terrible', 'tendre'],
    'Terrestre signifie qui se rapporte à la Terre ou à la terre.',
  ],
  [
    'jour',
    'journée',
    ['jouet', 'journée', 'joue'],
    'Journée et jour partagent leur sens et leur base.',
  ],
])
  add(
    'words',
    'Des mots cousins',
    `Quel mot appartient à la famille de « ${base} » ?`,
    options,
    answer,
    explanation,
    { hint: 'Cherche un lien de sens, pas seulement des lettres communes.' },
  );
for (const [prompt, options, answer, why] of [
  [
    'Quel mot veut dire presque la même chose que « immense » ?',
    ['minuscule', 'gigantesque', 'proche'],
    'gigantesque',
    'Immense et gigantesque indiquent une très grande taille.',
  ],
  [
    'Quel est le contraire de « fragile » ?',
    ['solide', 'léger', 'rapide'],
    'solide',
    'Un objet solide résiste mieux qu’un objet fragile.',
  ],
  [
    'Quel mot signifie « qui vit la nuit » ?',
    ['nocturne', 'aquatique', 'minuscule'],
    'nocturne',
    'Nocturne se rapporte à la nuit.',
  ],
  [
    'Quel mot désigne un groupe d’étoiles dessiné dans le ciel ?',
    ['constellation', 'collection', 'construction'],
    'constellation',
    'Une constellation est une figure que l’on repère parmi les étoiles vues depuis la Terre.',
  ],
])
  add('words', 'Le sens des mots', prompt, options, answer, why);
const texts = [
  [
    'Nacre et la carte',
    'Nacre pose une carte sur la table. Le vent l’emporte vers le jardin. Mousse la retrouve sous un banc et la rapporte à son amie.',
    'Qui retrouve la carte ?',
    ['Nacre', 'Mousse', 'Le vent'],
    'Mousse',
    'Le texte dit que Mousse retrouve la carte sous un banc.',
  ],
  [
    'La promenade',
    'Plume veut observer le ciel. Elle attend la tombée de la nuit, prend sa carte des étoiles et rejoint Orion sur la colline.',
    'Pourquoi Plume attend-elle la nuit ?',
    ['Pour observer les étoiles', 'Pour aller à la mer', 'Pour ranger la carte'],
    'Pour observer les étoiles',
    'Les étoiles sont plus faciles à observer dans le ciel nocturne.',
  ],
  [
    'Le panier',
    'Brindille met trois pommes et une poire dans son panier. Elle offre la poire à Nacre. Puis elle partage les pommes avec Mousse.',
    'Quel fruit Nacre reçoit-elle ?',
    ['Une pomme', 'Une poire', 'Une prune'],
    'Une poire',
    'Brindille offre la poire à Nacre.',
  ],
  [
    'Le pont',
    'La pluie a rendu le petit pont glissant. Orion propose le chemin des fougères. Ce chemin est plus long, mais son sol est sec.',
    'Pourquoi choisissent-ils le chemin des fougères ?',
    ['Son sol est sec', 'Il est plus court', 'Il mène au marché'],
    'Son sol est sec',
    'Le texte oppose le pont glissant au sol sec du chemin.',
  ],
  [
    'Une surprise',
    'Sous un vieux pot, Mousse découvre une graine. Il la plante et arrose la terre. Plusieurs jours plus tard, une pousse verte apparaît.',
    'Que se passe-t-il en premier ?',
    ['Une pousse apparaît', 'Mousse trouve une graine', 'Mousse arrose la terre'],
    'Mousse trouve une graine',
    'Il faut d’abord trouver la graine, puis la planter et l’arroser.',
  ],
  [
    'Le livre oublié',
    'Plume cherche son livre. Elle regarde dans son sac, puis sur la table. Enfin, elle le retrouve près de la fenêtre, là où elle lisait le matin.',
    'Où était le livre ?',
    ['Dans le sac', 'Sur la table', 'Près de la fenêtre'],
    'Près de la fenêtre',
    'Le dernier passage donne l’endroit où elle le retrouve.',
  ],
];
for (const [title, text, prompt, options, answer, explanation] of texts)
  add('reading', title, prompt, options, answer, explanation, {
    text,
    hint: 'Tu peux relire le petit récit ou l’écouter.',
  });
for (const [prompt, options, answer, why] of [
  [
    'Dans « Les dragons dessinent une carte », quel est le verbe ?',
    ['dragons', 'dessinent', 'carte'],
    'dessinent',
    'Dessinent indique l’action. Le sujet est les dragons.',
  ],
  [
    'Dans « La petite chouette observe le ciel », quel groupe est le sujet ?',
    ['La petite chouette', 'le ciel', 'observe'],
    'La petite chouette',
    'On peut demander : qui observe le ciel ? La petite chouette.',
  ],
  [
    'Choisis la phrase avec les accords au pluriel.',
    ['Les petites fées arrivent.', 'Les petite fée arrivent.', 'Les petites fées arrive.'],
    'Les petites fées arrivent.',
    'Les, petites, fées sont au pluriel ; le verbe arrivent s’accorde avec elles.',
  ],
  [
    'Complète : « Hier, nous … au jardin. »',
    ['allons', 'sommes allés', 'irons'],
    'sommes allés',
    'Hier situe l’action dans le passé. Sommes allés est au passé composé.',
  ],
])
  add('reading', 'Observer la langue', prompt, options, answer, why);
for (const max of [10, 100])
  for (const position of [1, 3, 5, 7]) {
    const answer = String((max * position) / 10);
    add(
      'numbers',
      'La clairière graduée',
      'Quel nombre est indiqué par la luciole ?',
      [String((max * (position - 1)) / 10), answer, String((max * (position + 1)) / 10)],
      answer,
      `La droite va de 0 à ${max}. Chaque intervalle vaut ${max / 10}. La luciole est à ${answer}.`,
      {
        visual: { kind: 'line', max, position },
        hint: `Il y a dix intervalles égaux. Chaque pas vaut ${max / 10}.`,
      },
    );
  }
for (const [parts, lit] of [
  [2, 1],
  [3, 1],
  [3, 2],
  [4, 1],
  [4, 3],
  [5, 2],
  [8, 3],
  [10, 7],
])
  add(
    'numbers',
    'Les morceaux de lune',
    'Quelle fraction de la bande est colorée ?',
    [`${lit}/${parts}`, `${parts}/${lit}`, `${lit}/${parts + 1}`],
    `${lit}/${parts}`,
    `La bande est partagée en ${parts} parts égales. ${lit} ${lit > 1 ? 'sont colorées' : 'est colorée'} : c’est ${lit}/${parts}.`,
    {
      visual: { kind: 'fraction', parts, lit },
      hint: 'Le nombre du bas compte toutes les parts égales. Celui du haut compte les parts colorées.',
    },
  );
for (const [prompt, options, answer, why] of [
  [
    'Dans 3 482, combien vaut le chiffre 4 ?',
    ['4', '40', '400'],
    '400',
    'Le chiffre 4 est à la place des centaines : 4 centaines = 400.',
  ],
  [
    'Quel nombre est le plus grand ?',
    ['0,7', '0,65', '0,09'],
    '0,7',
    'On peut écrire 0,70. Cela fait 70 centièmes, plus que 65 et 9 centièmes.',
  ],
  [
    'Quelle écriture vaut 3 dizaines et 6 unités ?',
    ['306', '36', '63'],
    '36',
    '3 dizaines valent 30. Avec 6 unités : 30 + 6 = 36.',
  ],
  [
    'Quelle fraction représente la moitié ?',
    ['2/4', '1/4', '3/4'],
    '2/4',
    'Deux quarts forment une moitié.',
  ],
])
  add('numbers', 'Les nombres changent de costume', prompt, options, answer, why);
for (const [prompt, options, answer, why, hint] of [
  [
    'Calcule 48 + 27.',
    ['65', '75', '85'],
    '75',
    '48 + 20 = 68, puis 68 + 7 = 75.',
    'Ajoute d’abord 20, puis 7.',
  ],
  [
    'Calcule 92 − 38.',
    ['54', '64', '56'],
    '54',
    '92 − 40 = 52. On remet 2 : 54.',
    'Enlever 38, c’est enlever 40 puis remettre 2.',
  ],
  [
    'Combien font 7 × 8 ?',
    ['48', '54', '56'],
    '56',
    '7 × 8 = 5 × 8 + 2 × 8 = 40 + 16 = 56.',
    'Tu peux décomposer 7 en 5 + 2.',
  ],
  [
    'Calcule 144 ÷ 12.',
    ['11', '12', '14'],
    '12',
    '12 × 12 = 144, donc 144 ÷ 12 = 12.',
    'Cherche combien de fois 12 tient dans 144.',
  ],
  [
    'Calcule 2,4 + 0,35.',
    ['2,39', '2,75', '2,435'],
    '2,75',
    'On écrit 2,4 sous la forme 2,40. Puis on additionne les centièmes : 2,40 + 0,35 = 2,75.',
    'Écris 2,4 sous la forme 2,40.',
  ],
  [
    'Calcule 3,6 × 10.',
    ['0,36', '36', '360'],
    '36',
    'Dix fois 3,6 donne 36.',
    '3,6 correspond à 36 dixièmes.',
  ],
  [
    'Combien vaut 3/4 de 20 ?',
    ['5', '10', '15'],
    '15',
    'Un quart de 20 vaut 5. Trois quarts valent 3 × 5 = 15.',
    'Commence par trouver un quart de 20.',
  ],
  [
    'Combien de centimètres font 2,5 mètres ?',
    ['25 cm', '250 cm', '2 500 cm'],
    '250 cm',
    '1 m = 100 cm. 2 m = 200 cm et 0,5 m = 50 cm.',
    'Un mètre vaut cent centimètres.',
  ],
  [
    'Combien de grammes font 1,2 kilogramme ?',
    ['120 g', '1 200 g', '12 000 g'],
    '1 200 g',
    '1 kg = 1 000 g, et 0,2 kg = 200 g.',
    'Un kilogramme vaut mille grammes.',
  ],
  [
    'Un atelier commence à 14 h 35 et dure 50 minutes. À quelle heure finit-il ?',
    ['15 h 15', '15 h 25', '15 h 35'],
    '15 h 25',
    '25 minutes mènent à 15 h ; il reste 25 minutes.',
    'Compte le temps jusqu’à 15 h, puis ce qui reste.',
  ],
  [
    'Trois carnets coûtent 4 € chacun. Quel est le prix total ?',
    ['7 €', '12 €', '16 €'],
    '12 €',
    '3 groupes de 4 € : 3 × 4 = 12 €.',
    'Dessine trois groupes de quatre si cela t’aide.',
  ],
  [
    'Mousse partage 42 graines entre 6 pots. Combien par pot ?',
    ['6', '7', '8'],
    '7',
    '42 ÷ 6 = 7, car 6 × 7 = 42.',
    'Cherche la multiplication qui donne 42.',
  ],
  [
    'Un rectangle mesure 8 cm sur 3 cm. Quel est son périmètre ?',
    ['11 cm', '22 cm', '24 cm'],
    '22 cm',
    'Le tour mesure 8 + 3 + 8 + 3 = 22 cm.',
    'Le périmètre est la longueur du tour.',
  ],
  [
    'Un rectangle mesure 8 cm sur 3 cm. Quelle est son aire ?',
    ['11 cm²', '22 cm²', '24 cm²'],
    '24 cm²',
    'L’aire vaut longueur × largeur : 8 × 3 = 24 cm².',
    'Imagine trois rangées de huit carrés.',
  ],
  [
    'Quatre parts égales d’un gâteau sont mangées sur huit. Quelle fraction reste ?',
    ['1/4', '1/2', '3/4'],
    '1/2',
    'Il reste 4 parts sur 8 : 4/8 = 1/2.',
    'Combien reste-t-il de parts sur les huit ?',
  ],
  [
    'Brindille a 20 €. Elle achète un livre à 8,50 €. Combien lui reste-t-il ?',
    ['11,50 €', '12,50 €', '28,50 €'],
    '11,50 €',
    '20,00 − 8,50 = 11,50 €.',
    'De 8,50 à 10, il manque 1,50 ; puis 10 jusqu’à 20.',
  ],
])
  add('maths', 'Une énigme du CM2', prompt, options, answer, why, { hint });
const facts = [
  [
    'La lumière de la Lune',
    'La Lune ne fabrique pas sa lumière. Elle nous renvoie une partie de la lumière du Soleil.',
    'https://science.nasa.gov/moon/moonlight/',
    'NASA',
  ],
  [
    'Le voyage du pollen',
    'Les abeilles et d’autres insectes peuvent transporter du pollen entre les fleurs. Ils participent ainsi à la reproduction de nombreuses plantes.',
    'https://www.mnhn.fr/fr/le-declin-des-insectes-pollinisateurs',
    'Muséum national d’histoire naturelle',
  ],
  [
    'Les mots ont une histoire',
    'Le mot nocturne appartient à la famille de nuit par son origine latine. On le rencontre pour parler d’animaux actifs la nuit.',
    'https://www.cnrtl.fr/etymologie/nocturne',
    'CNRTL',
  ],
  [
    'Les nombres ont plusieurs visages',
    'La moitié peut s’écrire 1/2, 0,5 ou 50 %. Trois écritures, une même quantité.',
    'https://eduscol.education.gouv.fr/5712/ressources-d-accompagnement-du-programme-de-mathematiques-au-cycle-3',
    'Éduscol',
  ],
  [
    'Un cercle sans bout',
    'Un cercle n’a ni coin ni extrémité. Son centre est à la même distance de tous ses points.',
    'https://eduscol.education.gouv.fr/5712/ressources-d-accompagnement-du-programme-de-mathematiques-au-cycle-3',
    'Éduscol',
  ],
  [
    'Des mots qui éclairent',
    'Le préfixe re- peut exprimer une nouvelle action : relire, c’est lire à nouveau. Mais tous les mots qui commencent par re ne sont pas construits ainsi.',
    'https://eduscol.education.gouv.fr/4800/ressources-d-accompagnement-du-programme-de-francais-au-cycle-3',
    'Éduscol',
  ],
];
for (const [title, text, url, label] of facts)
  rows.push({
    id: `facts-${rows.filter((x) => x.group === 'facts').length}`,
    group: 'facts',
    type: 'fact',
    title,
    text,
    source: { url, label },
  });
for (const target of [24, 36, 48, 57])
  rows.push({
    id: `numbers-build-${target}`,
    group: 'numbers',
    type: 'compose',
    title: 'Le marché des dizaines',
    prompt: `Compose ${target} avec des dizaines et des unités.`,
    target,
    explanation: `${target} = ${Math.floor(target / 10)} dizaines et ${target % 10} unités. Les dizaines valent ${Math.floor(target / 10) * 10} et les unités valent ${target % 10}.`,
    hint: 'Un paquet de dix unités forme une dizaine.',
  });
for (const [parts, target] of [
  [4, 3],
  [5, 2],
  [8, 5],
])
  rows.push({
    id: `numbers-fraction-${parts}`,
    group: 'numbers',
    type: 'fraction-build',
    title: 'Les rubans de Nacre',
    prompt: `Colore ${target}/${parts} du ruban. Tu peux choisir les morceaux que tu veux.`,
    parts,
    target,
    explanation: `${target}/${parts} signifie ${target} parts colorées parmi ${parts} parts égales. Leur position dans le ruban ne change pas la fraction.`,
    hint: `Le ruban a ${parts} parts égales. Cherche combien doivent être colorées.`,
  });
// Deterministically rotate choices so the answer is not consistently in one position.
for (const row of rows)
  if (row.options) {
    const shift = Number(row.id.split('-').at(-1)) % row.options.length;
    row.options = row.options.slice(shift).concat(row.options.slice(0, shift));
  }
export const ACTIVITIES = rows;
export const ACTIVITY_BY_ID = Object.fromEntries(rows.map((a) => [a.id, a]));
