// Small, original variations keep the same linguistic obstacle at a given rung.
// Conjugation forms reuse the already checked verb tables, without changing them.
export function buildPracticeVariants(source) {
  const out = [];
  const add = (skill, tier, prompt, answer, wrong, explanation) => {
    const index = out.filter((a) => a.skill === skill && a.tier === tier).length;
    const options = [answer, ...wrong];
    const rotate = (tier + index) % 3;
    out.push({
      id: `practice-${skill}-${tier}-${index}`,
      skill,
      group: skill === 'noun-agreement' ? 'words' : 'grammar',
      route: 'language',
      type: 'choice',
      title: source.find((a) => a.skill === skill)?.title || 'La langue du château',
      tier,
      prompt,
      answer,
      options: options.slice(rotate).concat(options.slice(0, rotate)),
      explanation,
    });
  };
  const classes = [
    [
      ['la chouette vole', 'chouette'],
      ['le grimoire brille', 'grimoire'],
      ['une cloche sonne', 'cloche'],
      ['la porte grince', 'porte'],
    ],
    [
      ['une cape dorée', 'dorée'],
      ['un chat curieux', 'curieux'],
      ['les tours anciennes', 'anciennes'],
      ['une lune pâle', 'pâle'],
    ],
    [
      ['Elle ouvre la porte', 'Elle'],
      ['Ils dessinent une carte', 'Ils'],
      ['Nous lisons', 'Nous'],
      ['Vous entrez', 'Vous'],
    ],
    [
      ['Elle marche doucement', 'doucement'],
      ['Il revient souvent', 'souvent'],
      ['Elle arrivera demain', 'demain'],
      ['Le chat dort ici', 'ici'],
    ],
    [
      ['Le chat dort sous le banc', 'sous'],
      ['Elle entre dans la tour', 'dans'],
      ['Il part avec sa cape', 'avec'],
      ['Elle avance sans bruit', 'sans'],
    ],
  ];
  const names = ['un nom', 'un adjectif', 'un pronom', 'un adverbe', 'une préposition'];
  classes.forEach((rows, tier) =>
    rows.forEach(([sentence, word]) =>
      add(
        'word-classes',
        tier,
        `Dans « ${sentence} », quelle est la nature du mot « ${word} » ?`,
        names[tier],
        ['un verbe', tier === 0 ? 'un déterminant' : 'un nom'],
        `Ici, « ${word} » est ${names[tier]}. ${['Il désigne un être ou une chose.', 'Il précise une caractéristique du nom.', 'Il peut remplacer un nom ou un groupe nominal.', 'Il apporte une précision sur une action ou une situation.', 'Il introduit un groupe de mots.'][tier]}`,
      ),
    ),
  );
  [
    'Elle entre parce que la porte est ouverte',
    'Il s’abrite car la pluie commence',
    'Elle sourit parce que son amie arrive',
    'Il prend une lampe car le couloir est sombre',
  ].forEach((sentence) =>
    add(
      'word-classes',
      5,
      `Dans « ${sentence} », le mot de liaison explique…`,
      'une cause',
      ['une conséquence', 'une opposition'],
      'Le mot de liaison donne la raison de ce qui se passe.',
    ),
  );
  const subjects = [
    [
      ['Lina ferme le livre', 'Lina', 'ferme', 'le livre'],
      ['Maïa ouvre la porte', 'Maïa', 'ouvre', 'la porte'],
      ['Noé porte une lampe', 'Noé', 'porte', 'une lampe'],
      ['Lou dessine une étoile', 'Lou', 'dessine', 'une étoile'],
    ],
    [
      ['Les grandes chouettes dorment', 'Les grandes chouettes', 'grandes', 'dorment'],
      ['Le petit dragon avance', 'Le petit dragon', 'petit', 'avance'],
      ['Les fenêtres dorées brillent', 'Les fenêtres dorées', 'dorées', 'brillent'],
      ['La vieille porte grince', 'La vieille porte', 'vieille', 'grince'],
    ],
    [
      ['Lina et Maïa', 'elles', 'elle', 'il'],
      ['Noé et Lou', 'ils', 'il', 'elle'],
      ['la chouette', 'elle', 'elles', 'ils'],
      ['les livres', 'ils', 'il', 'elle'],
    ],
    [
      ['Au sommet brillent trois étoiles', 'trois étoiles', 'Au sommet', 'brillent'],
      ['Dans la cour jouent les enfants', 'les enfants', 'Dans la cour', 'jouent'],
      ['Sur le toit dorment deux chats', 'deux chats', 'Sur le toit', 'dorment'],
      ['Derrière la porte attend une élève', 'une élève', 'Derrière la porte', 'attend'],
    ],
    [
      ['… préparent une potion', 'Les apprenties', 'La magicienne', 'Le dragon'],
      ['… dessinent une étoile', 'Les élèves', 'Une élève', 'Le professeur'],
      ['… ouvrent les livres', 'Les enfants', 'L’enfant', 'La bibliothécaire'],
      ['… cherchent la clé', 'Les gardiennes', 'La gardienne', 'Un chat'],
    ],
    [
      ['La troupe de danseuses arrive', 'La troupe de danseuses', 'les danseuses', 'arrive'],
      ['Le groupe de visiteurs avance', 'Le groupe de visiteurs', 'visiteurs', 'avance'],
      ['La bande de chats joue', 'La bande de chats', 'chats', 'joue'],
      ['Le bouquet de fleurs parfume la salle', 'Le bouquet de fleurs', 'fleurs', 'parfume'],
    ],
  ];
  subjects.forEach((rows, tier) =>
    rows.forEach(([sentence, answer, w1, w2]) =>
      add(
        'subject',
        tier,
        tier === 2
          ? `Quel pronom peut remplacer « ${sentence} » ?`
          : tier === 4
            ? `Quel sujet complète « ${sentence} » ?`
            : `Quel est le sujet dans « ${sentence} » ?`,
        answer,
        [w1, w2],
        tier === 2
          ? `Le pronom « ${answer} » remplace ce groupe nominal.`
          : tier === 4
            ? `« ${answer} » est au pluriel, comme le verbe.`
            : `Le sujet complet est « ${answer} ». ${tier === 5 ? 'Son nom principal est au singulier.' : 'C’est ce groupe qui commande l’accord du verbe.'}`,
      ),
    ),
  );
  const verbs = [
    [
      ['Le hibou …', 'chante', 'chantent', 'chantes'],
      ['La porte …', 'grince', 'grincent', 'grinces'],
      ['Une étoile …', 'brille', 'brillent', 'brilles'],
      ['Le chat …', 'joue', 'jouent', 'joues'],
    ],
    [
      ['Les hiboux …', 'chantent', 'chante', 'chantes'],
      ['Les portes …', 'grincent', 'grince', 'grinces'],
      ['Les étoiles …', 'brillent', 'brille', 'brilles'],
      ['Les chats …', 'jouent', 'joue', 'joues'],
    ],
    [
      ['Toi et moi, nous …', 'chantons', 'chantez', 'chantent'],
      ['Lina et moi, nous …', 'jouons', 'jouez', 'jouent'],
      ['Maïa et moi, nous …', 'rêvons', 'rêvez', 'rêvent'],
      ['Toi et moi, nous …', 'entrons', 'entrez', 'entrent'],
    ],
    [
      ['Lina et Maïa …', 'lisent', 'lit', 'lis'],
      ['Lou et Noé …', 'écrivent', 'écrit', 'écris'],
      ['Le chat et le chien …', 'dorment', 'dort', 'dors'],
      ['La chouette et le hibou …', 'volent', 'vole', 'voles'],
    ],
    [
      ['Au loin … deux oiseaux.', 'volent', 'vole', 'voles'],
      ['Sur le toit … trois chats.', 'dorment', 'dort', 'dors'],
      ['Dans la cour … les élèves.', 'jouent', 'joue', 'joues'],
      ['Dans la salle … deux lampes.', 'brillent', 'brille', 'brilles'],
    ],
    [
      ['La troupe de danseuses …', 'arrive', 'arrivent', 'arrives'],
      ['Le groupe de visiteurs …', 'avance', 'avancent', 'avances'],
      ['La bande de chats …', 'joue', 'jouent', 'joues'],
      ['Le bouquet de fleurs …', 'parfume', 'parfument', 'parfumes'],
    ],
  ];
  verbs.forEach((rows, tier) =>
    rows.forEach(([sentence, answer, w1, w2]) =>
      add(
        'verb-agreement',
        tier,
        `Complète : « ${sentence} »`,
        answer,
        [w1, w2],
        `La forme correcte est « ${answer} ». Le verbe s’accorde avec son sujet${tier === 5 ? ', dont le nom principal est au singulier' : ''}.`,
      ),
    ),
  );
  const groups = [
    [
      ['un pont', 'des ponts', 'des pont', 'un ponts'],
      ['une clé', 'des clés', 'des clé', 'une clés'],
      ['un livre', 'des livres', 'des livre', 'un livres'],
      ['une porte', 'des portes', 'des porte', 'une portes'],
    ],
    [
      ['les grandes tours', 'les grande tours', 'les grandes tour'],
      ['les petites lampes', 'les petite lampes', 'les petites lampe'],
      ['les vieux livres', 'les vieux livre', 'les vieil livres'],
      ['des jolies cartes', 'des jolie cartes', 'des jolies carte'],
    ],
    [
      ['un cheval', 'des chevaux', 'des chevals', 'des cheval'],
      ['un journal', 'des journaux', 'des journals', 'des journal'],
      ['un animal', 'des animaux', 'des animals', 'des animal'],
      ['un travail', 'des travaux', 'des travails', 'des travail'],
    ],
    [
      [
        'un sorcier patient',
        'une sorcière patiente',
        'une sorcier patiente',
        'une sorcière patient',
      ],
      [
        'un gardien attentif',
        'une gardienne attentive',
        'une gardien attentive',
        'une gardienne attentif',
      ],
      [
        'un magicien joyeux',
        'une magicienne joyeuse',
        'une magicien joyeuse',
        'une magicienne joyeux',
      ],
      ['un élève curieux', 'une élève curieuse', 'une élève curieux', 'une élèves curieuses'],
    ],
    [
      ['des fleurs blanches', 'des fleurs blanche', 'des fleur blanches'],
      ['des capes vertes', 'des cape vertes', 'des capes vert'],
      ['des robes dorées', 'des robe dorées', 'des robes doré'],
      ['des plumes noires', 'des plumes noir', 'des plume noires'],
    ],
    [
      ['de beaux jardins', 'de beau jardins', 'de beaux jardin'],
      ['de vieux grimoires', 'de vieux grimoire', 'de vieil grimoires'],
      ['de belles histoires', 'de belle histoires', 'de belles histoire'],
      ['de longues capes', 'de longue capes', 'de longues cape'],
    ],
  ];
  groups.forEach((rows, tier) =>
    rows.forEach((row) => {
      const [a, b, c, d] = row,
        transform = [0, 2, 3].includes(tier),
        answer = transform ? b : a,
        wrong = transform ? [c, d] : [b, c];
      add(
        'noun-agreement',
        tier,
        transform
          ? `${tier === 3 ? 'Mets au féminin' : 'Mets au pluriel'} : « ${a} ».`
          : 'Quel groupe est correctement accordé ?',
        answer,
        wrong,
        `On écrit « ${answer} ». Le déterminant, le nom et les adjectifs qui s’y rapportent s’accordent ensemble.`,
      );
    }),
  );
  const complements = [
    [
      ['Lina ouvre le grimoire', 'le grimoire', 'Lina', 'ouvre'],
      ['Noé porte une lampe', 'une lampe', 'Noé', 'porte'],
      ['Maïa prépare la potion', 'la potion', 'Maïa', 'prépare'],
      ['Lou dessine une carte', 'une carte', 'Lou', 'dessine'],
    ],
    [
      ['Elle parle à Maïa', 'à Maïa', 'Elle', 'parle'],
      ['Il écrit à sa sœur', 'à sa sœur', 'Il', 'écrit'],
      ['Elle pense à la fête', 'à la fête', 'Elle', 'pense'],
      ['Il répond au professeur', 'au professeur', 'Il', 'répond'],
    ],
    [
      ['Le matin, Lina lit un conte', 'Le matin', 'Lina', 'un conte'],
      ['Dans la tour, Noé ferme un coffre', 'Dans la tour', 'Noé', 'un coffre'],
      ['Après le repas, Lou range les livres', 'Après le repas', 'Lou', 'les livres'],
      ['Le soir, Maïa prépare sa cape', 'Le soir', 'Maïa', 'sa cape'],
    ],
    [
      ['Lina offre une carte à Lou', 'une carte', 'Lina', 'à Lou'],
      ['Noé donne une lampe à Maïa', 'une lampe', 'Noé', 'à Maïa'],
      ['Lou envoie une lettre à Lina', 'une lettre', 'Lou', 'à Lina'],
      ['Maïa prête un livre à Noé', 'un livre', 'Maïa', 'à Noé'],
    ],
    [
      ['Lina offre une carte à Lou', 'à Lou', 'une carte', 'Lina'],
      ['Noé donne une lampe à Maïa', 'à Maïa', 'une lampe', 'Noé'],
      ['Lou envoie une lettre à Lina', 'à Lina', 'une lettre', 'Lou'],
      ['Maïa prête un livre à Noé', 'à Noé', 'un livre', 'Maïa'],
    ],
    [
      ['La salle devient silencieuse', 'silencieuse', 'La salle', 'devient'],
      ['Le ciel reste sombre', 'sombre', 'Le ciel', 'reste'],
      ['La chouette paraît calme', 'calme', 'La chouette', 'paraît'],
      ['La porte est lourde', 'lourde', 'La porte', 'est'],
    ],
  ];
  complements.forEach((rows, tier) =>
    rows.forEach(([sentence, answer, w1, w2]) =>
      add(
        'complements',
        tier,
        `Dans « ${sentence} », ${['quel groupe complète directement le verbe', 'quel complément est introduit par une préposition', 'quel groupe indique une circonstance et peut se déplacer', 'quel groupe est le COD', 'quel groupe est le COI', 'quel mot est attribut du sujet'][tier]} ?`,
        answer,
        [w1, w2],
        `« ${answer} » ${['complète le verbe sans préposition', 'est introduit par une préposition', 'précise une circonstance et peut être déplacé', 'est le complément d’objet direct', 'est le complément d’objet indirect', 'décrit le sujet après un verbe d’état'][tier]}.`,
      ),
    ),
  );
  for (const [target, tense] of [
    ['conjug-present', 0],
    ['conjug-imparfait', 1],
    ['conjug-futur', 2],
    ['conjug-passe', 3],
  ]) {
    for (const a of source.filter((a) => a.skill.startsWith('verb-bank-') && a.tier === tense)) {
      const person = Number(a.id.split('-').at(-1));
      out.push({
        ...a,
        id: `practice-${target}-${person}-${a.skill.slice(10)}`,
        skill: target,
        tier: person,
        title: source.find((entry) => entry.skill === target).title,
      });
    }
  }
  return out;
}
