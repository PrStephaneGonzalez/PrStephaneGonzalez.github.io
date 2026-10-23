// Original short tasks. The coverage map describes practice offered, not certified mastery.
export const SOURCES = {
  cycle: 'https://eduscol.education.gouv.fr/4356/enseigner-au-cycle-3',
  french: 'https://www.education.gouv.fr/bo/2025/Hebdo16/MENE2504620A',
  maths: 'https://www.education.gouv.fr/bo/2025/Hebdo16/MENE2504620A',
  other: 'https://www.education.gouv.fr/programmes-et-horaires-l-ecole-elementaire-9011',
  repere:
    'https://eduscol.education.gouv.fr/5277/evaluations-des-acquis-et-besoins-des-eleves-au-cm2',
};
export const NEW_WORKSHOPS = [
  {
    id: 'grammar',
    name: 'Le laboratoire des phrases',
    icon: '✎',
    sub: 'Grammaire, accords et conjugaison',
    color: '#62556d',
    route: 'language',
  },
  {
    id: 'geometry',
    name: 'Les plans du château',
    icon: '△',
    sub: 'Espace, figures et symétrie',
    color: '#455a70',
    route: 'math',
  },
  {
    id: 'measures',
    name: 'Le comptoir des mesures',
    icon: '⌁',
    sub: 'Longueurs, aires, durées et contenances',
    color: '#56634d',
    route: 'math',
  },
  {
    id: 'data',
    name: 'Les cartes et les données',
    icon: '▥',
    sub: 'Tableaux, hasard et programmes',
    color: '#5b4f67',
    route: 'math',
  },
  {
    id: 'writing',
    name: 'La plume des histoires',
    icon: '❧',
    sub: 'Imaginer, expliquer et raconter',
    color: '#5e4e65',
    route: 'language',
  },
  {
    id: 'oral',
    name: 'La scène des conteurs',
    icon: '♬',
    sub: 'Écouter, lire et partager sa voix',
    color: '#495d6d',
    route: 'language',
  },
  {
    id: 'history',
    name: 'Le sablier des siècles',
    icon: '⌛',
    sub: 'Repères, République et transformations',
    color: '#6a5846',
    route: 'world',
  },
  {
    id: 'geography',
    name: 'L’atlas des voyageurs',
    icon: '⌖',
    sub: 'Se déplacer, communiquer, mieux habiter',
    color: '#3d6260',
    route: 'world',
  },
  {
    id: 'science',
    name: 'Le laboratoire de Brindille',
    icon: '⚗',
    sub: 'Matière, vivant, objets et planète',
    color: '#3e6556',
    route: 'world',
  },
  {
    id: 'english',
    name: 'Les mots voyageurs',
    icon: 'Aa',
    sub: 'Premiers échanges en anglais',
    color: '#58516f',
    route: 'world',
  },
  {
    id: 'citizenship',
    name: 'Le conseil des gardiens',
    icon: '☷',
    sub: 'Égalité, respect, information et coopération',
    color: '#556150',
    route: 'world',
  },
  {
    id: 'arts',
    name: 'L’atelier des créateurs',
    icon: '❀',
    sub: 'Images, musique et petites créations',
    color: '#684e62',
    route: 'world',
  },
  {
    id: 'sport',
    name: 'L’esprit d’équipe',
    icon: '⚑',
    sub: 'Règles, coopération et pratique accompagnée',
    color: '#3e6163',
    route: 'world',
  },
];
export const SKILLS = [];
export const SCHOOL_ACTIVITIES = [];
const dec = (n) => Number(n.toFixed(6));
const fmt = (n) => String(dec(n)).replace('.', ',');
export function register(id, group, label, extra = {}) {
  if (!SKILLS.some((s) => s.id === id)) SKILLS.push({ id, group, label, ...extra });
}
export function choice(
  skill,
  group,
  title,
  tier,
  variant,
  prompt,
  answer,
  distractors,
  explanation,
  extra = {},
) {
  const a = String(answer),
    options = [...new Set([a, ...distractors.map(String)])].slice(0, 4);
  if (options.length < 3)
    for (let k = 1; options.length < 3; k++)
      if (!options.includes(String(k))) options.push(String(k));
  const shift = (variant + tier) % options.length;
  SCHOOL_ACTIVITIES.push({
    id: `school-${skill}-${tier}-${variant}`,
    skill,
    group,
    title,
    tier,
    route:
      NEW_WORKSHOPS.find((w) => w.id === group)?.route ||
      (['sounds', 'words', 'reading', 'grammar', 'writing', 'oral'].includes(group)
        ? 'language'
        : 'math'),
    type: 'choice',
    prompt,
    options: options.slice(shift).concat(options.slice(0, shift)),
    answer: a,
    explanation,
    ...extra,
  });
}
function numeric(skill, group, label, build) {
  register(skill, group, label);
  for (let tier = 0; tier < 6; tier++)
    for (let v = 0; v < 6; v++) {
      const q = build(tier, v);
      choice(
        skill,
        group,
        label,
        tier,
        v,
        q.prompt,
        fmt(q.answer),
        [],
        q.explanation,
        q.extra || {},
      );
      const item = SCHOOL_ACTIVITIES.at(-1);
      item.type = 'numeric';
      delete item.options;
    }
}
numeric('integer-place', 'numbers', 'Valeur des chiffres', (t, v) => {
  const pow = Math.min(5, 1 + t),
    digit = 2 + v,
    n = digit * 10 ** pow + 37;
  return {
    prompt: `Dans ${n.toLocaleString('fr-FR')}, combien vaut le chiffre ${digit} placé le plus à gauche ?`,
    answer: digit * 10 ** pow,
    explanation: `Il occupe le rang de valeur ${10 ** pow}. Sa valeur est ${digit} × ${10 ** pow} = ${digit * 10 ** pow}.`,
  };
});
// For the first rung use a number with no carry into the leading digit.
for (const a of SCHOOL_ACTIVITIES.filter((a) => a.skill === 'integer-place' && a.tier === 0)) {
  const v = Number(a.id.split('-').at(-1)),
    digit = 2 + v,
    n = digit * 10 + 3;
  a.prompt = `Dans ${n}, combien vaut le chiffre ${digit} ?`;
  a.answer = String(digit * 10);
  a.options = [String(digit), String(digit * 10), String(digit * 100)];
  a.explanation = `Le chiffre ${digit} occupe les dizaines. ${digit} dizaines valent ${digit * 10}.`;
}
numeric('addition', 'maths', 'Additionner en décomposant', (t, v) => {
  const a = [14, 48, 137, 578, 1240, 3475][t] + v * 3,
    b = [5, 27, 46, 167, 580, 2786][t] + v;
  return {
    prompt: `Calcule ${a} + ${b}.`,
    answer: a + b,
    explanation: `On peut décomposer ${b}, ajouter ses centaines, ses dizaines puis ses unités. ${a} + ${b} = ${a + b}.`,
  };
});
numeric('subtraction', 'maths', 'Soustraire et compléter', (t, v) => {
  const a = [35, 92, 304, 1000, 2087, 5000][t] + v * 9,
    b = [12, 38, 167, 348, 795, 2786][t] + v;
  return {
    prompt: `Calcule ${a} − ${b}.`,
    answer: a - b,
    explanation: `On peut chercher ce qu’il faut ajouter à ${b} pour obtenir ${a}. La différence est ${a - b}.`,
  };
});
numeric('multiplication', 'maths', 'Multiplier et regrouper', (t, v) => {
  const a = [3, 6, 12, 24, 138, 247][t] + v,
    b = [2, 4, 6, 8, 12, 24][t];
  return {
    prompt: `Calcule ${a} × ${b}.`,
    answer: a * b,
    explanation: `${a} groupes de ${b}, ou ${b} groupes de ${a}, donnent ${a * b}. On peut décomposer un facteur en dizaines et unités.`,
  };
});
numeric('division', 'maths', 'Partager et diviser', (t, v) => {
  const d = [2, 4, 6, 8, 12, 25][t],
    q = [5, 8, 14, 23, 34, 41][t] + v;
  return {
    prompt: `${d * q} graines sont partagées également entre ${d} pots. Combien par pot ?`,
    answer: q,
    explanation: `${d} × ${q} = ${d * q}. Donc ${d * q} ÷ ${d} = ${q}.`,
  };
});
numeric('remainder', 'maths', 'Division avec reste', (t, v) => {
  const d = 3 + t,
    r = 1 + (v % (d - 1)),
    q = 4 + t * 3 + v;
  return {
    prompt: `On range ${d * q + r} perles par sachets de ${d}. Quel est le reste après les sachets complets ?`,
    answer: r,
    explanation: `${d * q + r} = ${d} × ${q} + ${r}. Le reste ${r} est inférieur au diviseur ${d}.`,
  };
});
numeric('decimal-calc', 'maths', 'Calculer avec les décimaux', (t, v) => {
  const a = dec(1.2 + t + v / 10),
    b = dec(t < 2 ? 0.3 : (t + v + 2) / 100);
  return {
    prompt: `Calcule ${fmt(a)} + ${fmt(b)}.`,
    answer: dec(a + b),
    explanation: `On aligne les unités, les dixièmes et les centièmes. ${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}.`,
  };
});
numeric('decimal-scale', 'numbers', 'Multiplier ou diviser par 10, 100, 1 000', (t, v) => {
  const a = dec((12 + v * 3) / (t > 1 ? 10 : 1)),
    factor = 10 ** (1 + (t % 3)),
    divide = t >= 3,
    answer = dec(divide ? a / factor : a * factor);
  return {
    prompt: `Calcule ${fmt(a)} ${divide ? '÷' : '×'} ${factor}.`,
    answer,
    explanation: `${divide ? 'Diviser' : 'Multiplier'} par ${factor} rend le nombre ${factor} fois ${divide ? 'plus petit' : 'plus grand'}. On obtient ${fmt(answer)}.`,
  };
});
register('fraction-meaning', 'numbers', 'Représenter et comparer des fractions');
for (let t = 0; t < 6; t++)
  for (let v = 0; v < 6; v++) {
    const d = [2, 4, 5, 8, 10, 12][t],
      n = 1 + (v % (d - 1)),
      answer = `${n}/${d}`;
    choice(
      'fraction-meaning',
      'numbers',
      'Les parts égales',
      t,
      v,
      'Quelle fraction de la bande est colorée ?',
      answer,
      [`${d}/${n}`, `${n}/${d + 1}`],
      `${n} parts sont colorées parmi ${d} parts égales : ${answer}.`,
      { visual: { kind: 'fraction', parts: d, lit: n } },
    );
  }
numeric('fraction-operator', 'numbers', 'Fraction d’une quantité', (t, v) => {
  const d = 2 + t,
    n = 1 + (v % (d - 1)),
    base = 4 + t * 3 + v;
  return {
    prompt: `Combien vaut ${n}/${d} de ${base * d} ?`,
    answer: n * base,
    explanation: `Un ${d}e de ${base * d} vaut ${base}. On en prend ${n} : ${n} × ${base} = ${n * base}.`,
  };
});
register('fraction-calculation', 'numbers', 'Fractions : équivalences et additions');
for (let t = 0; t < 6; t++)
  for (let v = 0; v < 6; v++) {
    const d = 3 + v,
      n = 1 + (v % 2),
      k = 2 + (t % 3);
    if (t < 2)
      choice(
        'fraction-calculation',
        'numbers',
        'Deux écritures d’une fraction',
        t,
        v,
        `Quelle fraction vaut ${n}/${d} ?`,
        `${n * k}/${d * k}`,
        [`${n}/${d * k}`, `${n + k}/${d + k}`],
        `Multiplier le numérateur et le dénominateur par ${k} conserve la quantité.`,
      );
    else
      choice(
        'fraction-calculation',
        'numbers',
        'Additionner des parts',
        t,
        v,
        `Combien font ${n}/${d} + 1/${d} ?`,
        `${n + 1}/${d}`,
        [`${n + 1}/${2 * d}`, `${n}/${d + 1}`],
        `Les parts sont de même taille. On additionne leur nombre : ${n + 1} parts de taille 1/${d}.`,
      );
  }
register('decimal-compare', 'numbers', 'Comparer, ranger et encadrer');
for (let t = 0; t < 6; t++)
  for (let v = 0; v < 6; v++) {
    const base = 1 + v,
      offsets = [
        [0.2, 0.4, 0.6],
        [0.09, 0.1, 0.08],
        [0.7, 0.69, 0.08],
        [0.05, 0.5, 0.005],
        [0.9, 1.01, 0.99],
        [0.999, 1, 1.001],
      ][t],
      nums = offsets.map((n) => dec(base + n));
    choice(
      'decimal-compare',
      'numbers',
      'Qui est le plus grand ?',
      t,
      v,
      'Choisis le plus grand nombre.',
      fmt(Math.max(...nums)),
      nums.filter((x) => x !== Math.max(...nums)).map(fmt),
      'On compare d’abord les parties entières, puis les dixièmes, les centièmes et si besoin les millièmes. Ajouter des zéros à droite de la partie décimale conserve la valeur.',
    );
  }
numeric('proportion', 'maths', 'Proportionnalité et échelles', (t, v) => {
  const p = 2 + v,
    n = 2 + t;
  return {
    prompt: `${t < 3 ? 'Un carnet coûte' : 'Sur un plan, 1 cm représente'} ${p} ${t < 3 ? '€' : 'm'}. ${t < 3 ? `Combien coûtent ${n} carnets identiques ?` : `Quelle longueur réelle représente ${n} cm ?`}`,
    answer: p * n,
    explanation: `On répète la même quantité ${n} fois : ${p} × ${n} = ${p * n} ${t < 3 ? '€' : 'm'}.`,
  };
});
numeric('multi-step', 'maths', 'Résoudre un problème en étapes', (t, v) => {
  const boxes = 2 + t,
    each = 4 + v,
    given = 3 + v;
  return {
    prompt: `Mousse a ${boxes} boîtes de ${each} graines. Il donne ${given} graines. Combien lui en reste-t-il ?`,
    answer: boxes * each - given,
    explanation: `On cherche d’abord le total : ${boxes} × ${each} = ${boxes * each}. Puis on retire ${given} : il reste ${boxes * each - given} graines.`,
  };
});
numeric('lengths', 'measures', 'Longueurs et conversions', (t, v) => {
  const n = 2 + v;
  const questions = [
    { prompt: `Combien de centimètres font ${n} m ?`, answer: n * 100, rule: '1 m = 100 cm.' },
    {
      prompt: `Combien de mètres font ${n * 100 + 50} cm ?`,
      answer: n + 0.5,
      rule: '100 cm = 1 m ; 50 cm = 0,5 m.',
    },
    { prompt: `Combien de mètres font ${n} km ?`, answer: n * 1000, rule: '1 km = 1 000 m.' },
    {
      prompt: `Combien de kilomètres font ${n * 1000 + 250} m ?`,
      answer: n + 0.25,
      rule: '1 000 m = 1 km ; 250 m = 0,25 km.',
    },
    {
      prompt: `Combien de centimètres font ${fmt(n + 0.35)} m ?`,
      answer: n * 100 + 35,
      rule: '1 m = 100 cm ; 0,35 m = 35 cm.',
    },
    {
      prompt: `Convertis ${n} m et 35 cm en centimètres.`,
      answer: n * 100 + 35,
      rule: 'On convertit les mètres en centimètres, puis on ajoute les 35 cm.',
    },
  ];
  const q = questions[t];
  return { ...q, explanation: q.rule + ` On obtient ${fmt(q.answer)}.` };
});
numeric('mass-capacity', 'measures', 'Masses et contenances', (t, v) => {
  const n = 2 + v;
  const questions = [
    { prompt: `Convertis ${n} kg en grammes.`, answer: n * 1000, rule: '1 kg = 1 000 g.' },
    { prompt: `Convertis ${n * 1000} g en kilogrammes.`, answer: n, rule: '1 000 g = 1 kg.' },
    {
      prompt: `Convertis ${fmt(n + 0.5)} L en millilitres.`,
      answer: n * 1000 + 500,
      rule: '1 L = 1 000 mL ; 0,5 L = 500 mL.',
    },
    {
      prompt: `Convertis ${n * 1000 + 250} mL en litres.`,
      answer: n + 0.25,
      rule: '1 000 mL = 1 L ; 250 mL = 0,25 L.',
    },
    {
      prompt: `Convertis ${n} kg et 75 g en grammes.`,
      answer: n * 1000 + 75,
      rule: 'On transforme les kilogrammes en grammes puis on ajoute 75 g.',
    },
    {
      prompt: `Combien de litres font ${n * 100 + 25} cL ?`,
      answer: n + 0.25,
      rule: '100 cL = 1 L ; 25 cL = 0,25 L.',
    },
  ];
  const q = questions[t];
  return { ...q, explanation: q.rule + ` On obtient ${fmt(q.answer)}.` };
});
numeric('durations', 'measures', 'Lire l’heure et calculer une durée', (t, v) => {
  const start = 8 * 60 + 10 + v * 5,
    duration = 15 + t * 20;
  return {
    prompt: `Un départ a lieu à ${Math.floor(start / 60)} h ${String(start % 60).padStart(2, '0')}. L’arrivée est ${duration} minutes plus tard. Combien de minutes dure le trajet ?`,
    answer: duration,
    explanation: `La durée est donnée : ${duration} minutes. Pour obtenir l’heure d’arrivée, on les ajoute à l’heure du départ.`,
  };
});
// Replace duration prompts by actual start/end reasoning, rather than a copied number.
for (const a of SCHOOL_ACTIVITIES.filter((a) => a.skill === 'durations')) {
  const [t, v] = a.id.split('-').slice(-2).map(Number),
    start = 8 * 60 + 10 + v * 5,
    end = start + 15 + t * 20;
  a.prompt = `Du départ à ${Math.floor(start / 60)} h ${String(start % 60).padStart(2, '0')} à l’arrivée à ${Math.floor(end / 60)} h ${String(end % 60).padStart(2, '0')}, combien de minutes se sont écoulées ?`;
  a.explanation = `On peut compter jusqu’à l’heure suivante, puis ajouter les minutes restantes : ${end - start} minutes en tout.`;
}
numeric('perimeter', 'measures', 'Périmètres', (t, v) => {
  const l = 4 + t * 2 + v,
    w = 2 + v;
  return {
    prompt: `Un rectangle mesure ${l} cm sur ${w} cm. Quel est son périmètre en cm ?`,
    answer: 2 * (l + w),
    explanation: `Le tour comprend deux longueurs et deux largeurs : 2 × (${l} + ${w}) = ${2 * (l + w)} cm.`,
    extra: { visual: { kind: 'rectangle', l, w } },
  };
});
numeric('area', 'measures', 'Aires et unités carrées', (t, v) => {
  const l = 3 + t + v,
    w = 2 + v;
  return {
    prompt: `Un rectangle mesure ${l} cm sur ${w} cm. Quelle est son aire en cm² ?`,
    answer: l * w,
    explanation: `On compte ${w} rangées de ${l} carrés d’un cm² : ${l} × ${w} = ${l * w} cm².`,
    extra: { visual: { kind: 'rectangle', l, w } },
  };
});
numeric('money', 'measures', 'Monnaie et nombres décimaux', (t, v) => {
  const price = dec(3.5 + t + v / 10),
    paid = 20;
  return {
    prompt: `Un livre coûte ${fmt(price)} €. Tu paies ${paid} €. Combien reçoit-on de monnaie ?`,
    answer: paid - price,
    explanation: `On complète le prix jusqu’à 20 € : 20 − ${fmt(price)} = ${fmt(paid - price)} €.`,
  };
});
register('data-read', 'data', 'Lire tableaux et graphiques');
for (let t = 0; t < 6; t++)
  for (let v = 0; v < 6; v++) {
    const a = 4 + t + v,
      b = a + 3,
      c = a + 1;
    choice(
      'data-read',
      'data',
      'Le carnet des récoltes',
      t,
      v,
      t < 2
        ? 'Combien de pommes Plume a-t-elle récoltées ?'
        : 'Combien de fruits ont été récoltés en tout ?',
      String(t < 2 ? b : a + b + c),
      [String(a), String(c), String(a + b)],
      t < 2
        ? `La ligne Plume indique ${b}.`
        : `On additionne les trois récoltes : ${a} + ${b} + ${c} = ${a + b + c}.`,
      {
        document: {
          headers: ['Gardien', 'Fruits'],
          rows: [
            ['Mousse', a],
            ['Plume', b],
            ['Nacre', c],
          ],
        },
      },
    );
  }
numeric('data-average', 'data', 'Lire une série et raisonner', (t, v) => {
  const a = 4 + v,
    d = 1 + t;
  return {
    prompt: `Trois paniers contiennent ${a}, ${a + d} et ${a + 2 * d} fruits. Combien chacun en aurait-il si on partageait le total également ?`,
    answer: a + d,
    explanation: `Le total est ${3 * (a + d)}. Partagé entre 3 paniers : ${3 * (a + d)} ÷ 3 = ${a + d}.`,
  };
});
register('chance', 'data', 'Hasard : possible, certain et comparaison');
for (let t = 0; t < 6; t++)
  for (let v = 0; v < 6; v++) {
    const red = 2 + v,
      blue = t < 2 ? 0 : 1;
    choice(
      'chance',
      'data',
      'Le sac des jetons',
      t,
      v,
      `Un sac contient ${red} jetons rouges et ${blue} bleu${blue > 1 ? 's' : ''}. On tire sans regarder. ${t < 2 ? 'Tirer un rouge est…' : 'Quelle couleur est la plus probable ?'}`,
      t < 2 ? 'certain' : 'rouge',
      t < 2 ? ['impossible', 'incertain'] : ['bleu', 'les deux autant'],
      t < 2
        ? 'Tous les jetons sont rouges. Tout tirage donne donc un rouge.'
        : `Il y a plus de jetons rouges (${red}) que bleus (${blue}). Un rouge a plus de chances d’être tiré.`,
    );
  }
register('algorithm', 'data', 'Déplacements et pensée informatique');
for (let t = 0; t < 6; t++)
  for (let v = 0; v < 6; v++) {
    const start = 2 + v,
      step = 1 + t,
      count = 2 + t;
    choice(
      'algorithm',
      'data',
      'Le petit automate',
      t,
      v,
      `Un automate part de ${start}. Il répète ${count} fois « ajouter ${step} ». Où arrive-t-il ?`,
      String(start + step * count),
      [String(start + step), String(start + count)],
      `On effectue ${count} additions de ${step} : ${start} + ${count} × ${step} = ${start + step * count}.`,
    );
  }
export function series(skill, group, label, entries, extra = {}) {
  register(skill, group, label, extra);
  for (let tier = 0; tier < 6; tier++) {
    const e = entries[Math.min(entries.length - 1, tier)];
    const [prompt, answer, others, explanation, opt = {}] = e;
    choice(skill, group, label, tier, 0, prompt, answer, others, explanation, opt);
  }
}
export function missions(skill, group, label, entries, extra = {}) {
  register(skill, group, label, { format: 'accompanied', ...extra });
  for (let tier = 0; tier < 6; tier++) {
    const [prompt, explanation] = entries[Math.min(entries.length - 1, tier)];
    SCHOOL_ACTIVITIES.push({
      id: `school-${skill}-${tier}-0`,
      skill,
      group,
      title: label,
      tier,
      type: 'mission',
      route: NEW_WORKSHOPS.find((w) => w.id === group)?.route || 'language',
      prompt,
      explanation,
      accompanied: true,
    });
  }
}
series('shapes', 'geometry', 'Reconnaître les figures', [
  [
    'Quelle figure a trois côtés ?',
    'triangle',
    ['carré', 'cercle'],
    'Un triangle possède trois côtés et trois sommets.',
  ],
  [
    'Quelle figure a quatre angles droits ?',
    'rectangle',
    ['triangle quelconque', 'pentagone'],
    'Un rectangle possède quatre angles droits.',
  ],
  [
    'Un carré est aussi…',
    'un rectangle',
    ['un cercle', 'un triangle'],
    'Ses quatre angles sont droits ; il satisfait la définition du rectangle.',
  ],
  [
    'Un quadrilatère a quatre côtés égaux. Il s’agit toujours…',
    'd’un losange',
    ['d’un rectangle', 'd’un cercle'],
    'Quatre côtés égaux caractérisent un losange ; ses angles ne sont pas forcément droits.',
  ],
  [
    'Un triangle a deux côtés égaux. Il est…',
    'isocèle',
    ['nécessairement rectangle', 'un carré'],
    'Un triangle isocèle possède au moins deux côtés de même longueur.',
  ],
  [
    'Quel énoncé est vrai ?',
    'Tout carré est un losange',
    ['Tout losange est un carré', 'Tout rectangle est un carré'],
    'Un carré a quatre côtés égaux. Un losange n’a pas nécessairement quatre angles droits.',
  ],
]);
series('lines', 'geometry', 'Parallèles et perpendiculaires', [
  [
    'Deux droites se croisent en formant un angle droit. Elles sont…',
    'perpendiculaires',
    ['parallèles', 'confondues'],
    'Perpendiculaire signifie former un angle droit.',
  ],
  [
    'Deux droites distinctes d’un même plan ne se rencontrent jamais. Elles sont…',
    'parallèles',
    ['perpendiculaires', 'sécantes'],
    'Les droites parallèles distinctes ne se coupent pas.',
  ],
  [
    'Quel outil aide à contrôler un angle droit ?',
    'une équerre',
    ['un compas seul', 'une balance'],
    'L’équerre possède un angle droit de référence.',
  ],
  [
    'Deux côtés consécutifs d’un rectangle sont…',
    'perpendiculaires',
    ['toujours parallèles', 'toujours égaux'],
    'Ils se rencontrent selon un angle droit.',
  ],
  [
    'Deux droites perpendiculaires à une même droite sont, dans un plan…',
    'parallèles',
    ['toujours sécantes', 'nécessairement confondues'],
    'Elles ont la même direction.',
  ],
  [
    'Un segment a…',
    'deux extrémités',
    ['aucune extrémité', 'une seule extrémité'],
    'Le segment relie deux points ; une droite se prolonge sans extrémités.',
  ],
]);
series('angles', 'geometry', 'Angles et comparaison', [
  [
    'Quel angle ressemble au coin d’une feuille rectangulaire ?',
    'un angle droit',
    ['un angle plat', 'un angle aigu'],
    'Le coin d’une feuille rectangulaire est un angle droit.',
  ],
  [
    'Un angle plus petit qu’un angle droit est…',
    'aigu',
    ['obtus', 'plat'],
    'Un angle aigu est inférieur à un angle droit.',
  ],
  [
    'Un angle plus grand qu’un angle droit et plus petit qu’un angle plat est…',
    'obtus',
    ['aigu', 'droit'],
    'L’angle obtus est compris entre un angle droit et un angle plat.',
  ],
  [
    'Combien de degrés mesure un angle droit ?',
    '90°',
    ['45°', '180°'],
    'L’angle droit mesure 90 degrés.',
  ],
  [
    'Quel angle est obtus ?',
    '120°',
    ['40°', '90°'],
    '120° est supérieur à 90° et inférieur à 180°.',
  ],
  [
    'Quel outil sert à mesurer un angle en degrés ?',
    'un rapporteur',
    ['une balance', 'un chronomètre'],
    'Le rapporteur est gradué en degrés.',
  ],
]);
series('solids', 'geometry', 'Solides et représentations', [
  [
    'Quel solide ressemble à un dé ?',
    'un cube',
    ['un cône', 'une sphère'],
    'Un dé ordinaire a la forme d’un cube.',
  ],
  ['Combien de faces possède un cube ?', '6', ['4', '8'], 'Un cube a six faces carrées.'],
  [
    'Quel solide a deux bases circulaires et une surface courbe ?',
    'un cylindre',
    ['un cube', 'un pavé droit'],
    'Le cylindre possède deux bases circulaires parallèles.',
  ],
  [
    'Combien d’arêtes possède un cube ?',
    '12',
    ['6', '8'],
    'Ses six faces se rencontrent selon douze arêtes.',
  ],
  [
    'Combien de sommets possède un pavé droit ?',
    '8',
    ['6', '12'],
    'Un pavé droit possède huit sommets.',
  ],
  [
    'Le patron d’un cube est formé de…',
    'six carrés reliés de façon à pouvoir se replier',
    ['six disques', 'quatre triangles'],
    'Les six faces carrées doivent pouvoir se rejoindre sans se superposer.',
  ],
]);
series('symmetry', 'geometry', 'Symétrie et repérage', [
  [
    'Plier une figure sur un axe de symétrie permet…',
    'de superposer ses deux parties',
    ['de changer sa taille', 'de créer un troisième côté'],
    'Les deux parties se correspondent par réflexion.',
  ],
  [
    'Combien d’axes de symétrie possède un carré ?',
    '4',
    ['1', '2'],
    'Deux axes passent par les milieux des côtés opposés et deux sont les diagonales.',
  ],
  [
    'Le symétrique d’un point est situé…',
    'à la même distance de l’axe, de l’autre côté',
    ['toujours sur l’axe', 'deux fois plus loin'],
    'L’axe est la médiatrice du segment reliant le point à son image.',
  ],
  [
    'Un point situé sur l’axe de symétrie…',
    'reste au même endroit',
    ['disparaît', 'change nécessairement de place'],
    'Il est sa propre image.',
  ],
  [
    'Sur un quadrillage, un point est à trois cases à droite d’un axe vertical. Son image est…',
    'à trois cases à gauche',
    ['à six cases à gauche', 'à trois cases plus haut'],
    'On conserve la distance à l’axe et la hauteur.',
  ],
  [
    'Une symétrie axiale conserve…',
    'les longueurs et les angles',
    ['seulement les couleurs', 'ni longueurs ni angles'],
    'La réflexion transforme la position et l’orientation mais conserve la forme et les dimensions.',
  ],
]);
missions('construction', 'geometry', 'Un plan à construire', [
  [
    'Avec un adulte, décris un carré que tu vois autour de toi.',
    'Un carré a quatre côtés égaux et quatre angles droits.',
  ],
  [
    'Sur papier si tu le souhaites, imagine un rectangle puis indique sa longueur et sa largeur à un adulte.',
    'On peut aussi le décrire oralement sans tracer.',
  ],
  [
    'Avec une règle et un adulte, essaie un segment de 5 cm, ou explique comment tu le construirais.',
    'La graduation zéro se place à une extrémité.',
  ],
  [
    'Explique à un adulte comment utiliser l’équerre pour construire un angle droit.',
    'On utilise le coin droit de l’équerre.',
  ],
  [
    'Avec un compas et un adulte, décris comment tracer un cercle de rayon 3 cm ; tu peux choisir seulement d’expliquer.',
    'Le centre reste fixe et l’ouverture du compas correspond au rayon.',
  ],
  [
    'Invente un petit programme de construction d’un rectangle. Tu peux le dicter à un adulte.',
    'On précise les dimensions, les angles droits et l’ordre des étapes.',
  ],
]);
numeric('operation-order', 'maths', 'Ordre des opérations', (t, v) => {
  const a = 2 + v,
    b = 3 + t,
    c = 2 + (v % 3);
  return {
    prompt: t < 3 ? `Calcule (${a} + ${b}) × ${c}.` : `Calcule ${a} + ${b} × ${c}.`,
    answer: t < 3 ? (a + b) * c : a + b * c,
    explanation:
      t < 3
        ? `On calcule d’abord la parenthèse : ${a + b}. Puis on multiplie par ${c}.`
        : `La multiplication se calcule avant l’addition : ${b} × ${c} = ${b * c}, puis on ajoute ${a}.`,
  };
});
series('homophones', 'words', 'Les mots qui se ressemblent', [
  [
    'Complète : « Mousse … un panier. »',
    'a',
    ['à', 'as'],
    'A peut être remplacé par avait : Mousse avait un panier.',
  ],
  [
    'Complète : « Il va … la bibliothèque. »',
    'à',
    ['a', 'as'],
    'À est une préposition ; on ne peut pas le remplacer par avait.',
  ],
  ['Complète : « Nacre … Plume jouent. »', 'et', ['est', 'es'], 'Et relie les deux noms.'],
  [
    'Complète : « Les gardiens … dehors. »',
    'sont',
    ['son', 'sons'],
    'Sont est le verbe être au présent, avec un sujet pluriel.',
  ],
  [
    'Complète : « … livre est sur la table. »',
    'Son',
    ['Sont', 'Sons'],
    'Son est un déterminant placé devant livre.',
  ],
  [
    'Complète : « … vont-ils ? Au jardin ! »',
    'Où',
    ['Ou', 'Houx'],
    'Où pose une question de lieu. Ou propose un choix.',
  ],
]);
series('word-classes', 'grammar', 'Les classes de mots', [
  [
    'Dans « le dragon », dragon est…',
    'un nom',
    ['un verbe', 'un déterminant'],
    'Dragon désigne un être ; c’est un nom.',
  ],
  [
    'Dans « une petite fée », petite est…',
    'un adjectif',
    ['un pronom', 'une préposition'],
    'Petite apporte une précision sur le nom fée.',
  ],
  [
    'Dans « Elle chante », Elle est…',
    'un pronom',
    ['un nom commun', 'un adverbe'],
    'Elle remplace un nom ou un groupe nominal.',
  ],
  [
    'Dans « Il avance lentement », lentement est…',
    'un adverbe',
    ['un déterminant', 'un verbe'],
    'Lentement précise la manière d’avancer.',
  ],
  [
    'Dans « Le livre de Plume », de est…',
    'une préposition',
    ['un adjectif', 'un pronom'],
    'De introduit un complément du nom livre.',
  ],
  [
    'Dans « Il lit parce qu’il aime les histoires », parce que introduit…',
    'une cause',
    ['une quantité', 'une comparaison'],
    'La locution relie une explication à ce qui précède.',
  ],
]);
series('subject', 'grammar', 'Trouver le sujet', [
  [
    'Qui fait l’action dans « Mousse court » ?',
    'Mousse',
    ['court', 'la phrase'],
    'Mousse est le sujet du verbe court.',
  ],
  [
    'Quel est le sujet de « Les petites fées arrivent » ?',
    'Les petites fées',
    ['arrivent', 'petites'],
    'On demande : qui arrive ? Les petites fées.',
  ],
  [
    'Quel pronom remplace « Plume et Nacre » ?',
    'elles',
    ['elle', 'ils'],
    'Les deux personnages sont désignés ici au féminin pluriel.',
  ],
  [
    'Dans « Dans le jardin poussent des roses », le sujet est…',
    'des roses',
    ['Dans le jardin', 'poussent'],
    'Les roses poussent. Le sujet peut être après le verbe.',
  ],
  [
    'Quel sujet convient à « … découvrent une grotte » ?',
    'Les exploratrices',
    ['L’exploratrice', 'Elle'],
    'Découvrent correspond ici au pluriel.',
  ],
  [
    'Dans « Le groupe de visiteurs entre », le sujet commande…',
    'entre au singulier',
    ['entrent au pluriel', 'entrer à l’infinitif'],
    'Le noyau du sujet est groupe, qui est singulier.',
  ],
]);
series('complements', 'grammar', 'Les compléments de la phrase', [
  [
    'Dans « Mousse mange une pomme », que mange-t-il ?',
    'une pomme',
    ['Mousse', 'mange'],
    'Une pomme est le complément du verbe mange.',
  ],
  [
    'Dans « Elle parle à Plume », à Plume est…',
    'un complément introduit par une préposition',
    ['le sujet', 'le verbe'],
    'On demande à qui elle parle.',
  ],
  [
    'Dans « Le matin, Orion lit », quel groupe peut-on déplacer facilement ?',
    'Le matin',
    ['Orion', 'lit'],
    'Le matin indique quand et peut se placer à la fin.',
  ],
  [
    'Dans « Plume offre un livre à Nacre », quel est le COD ?',
    'un livre',
    ['à Nacre', 'Plume'],
    'Plume offre quoi ? Un livre.',
  ],
  [
    'Dans « Plume offre un livre à Nacre », quel groupe est le COI ?',
    'à Nacre',
    ['un livre', 'Plume'],
    'Plume offre un livre à qui ? À Nacre.',
  ],
  [
    'Dans « Le ciel devient sombre », sombre est…',
    'un attribut du sujet',
    ['un COD', 'le sujet'],
    'Il décrit le ciel avec le verbe devenir.',
  ],
]);
series('noun-agreement', 'words', 'Les accords dans le groupe nominal', [
  [
    'Choisis le pluriel de « un arbre ».',
    'des arbres',
    ['des arbre', 'un arbres'],
    'Au pluriel, le déterminant change et le nom prend un s.',
  ],
  [
    'Choisis le groupe bien accordé.',
    'les petites fées',
    ['les petite fée', 'les petites fée'],
    'Le déterminant, l’adjectif et le nom portent les marques du pluriel.',
  ],
  [
    'Mets « un cheval » au pluriel.',
    'des chevaux',
    ['des chevals', 'des cheval'],
    'Cheval forme ici son pluriel en chevaux.',
  ],
  [
    'Choisis le féminin de « un gardien curieux ».',
    'une gardienne curieuse',
    ['une gardien curieux', 'une gardienne curieux'],
    'Les deux mots varient au féminin.',
  ],
  [
    'Choisis le groupe bien accordé.',
    'des fleurs blanches',
    ['des fleurs blanc', 'des fleur blanches'],
    'Blanches s’accorde avec fleurs, féminin pluriel.',
  ],
  [
    'Quel groupe est correctement accordé ?',
    'de beaux jardins',
    ['de beau jardins', 'de beaux jardin'],
    'Beau devient beaux devant le nom pluriel jardins.',
  ],
]);
const atTense = (t) => (t === 'imparfait' ? 'à l’imparfait' : `au ${t}`);
const beforeVerb = (subject, form) =>
  subject === 'Je' && /^[aeiouyàâéèêëîïôùûüœ]/i.test(form) ? 'J’' : subject + ' ';
const conjugations = {
  present: [
    ['Je', 'jouer', 'joue'],
    ['Tu', 'finir', 'finis'],
    ['Nous', 'aller', 'allons'],
    ['Vous', 'faire', 'faites'],
    ['Elles', 'prendre', 'prennent'],
    ['Il', 'pouvoir', 'peut'],
  ],
  imparfait: [
    ['Je', 'chanter', 'chantais'],
    ['Tu', 'finir', 'finissais'],
    ['Elle', 'être', 'était'],
    ['Nous', 'faire', 'faisions'],
    ['Vous', 'aller', 'alliez'],
    ['Ils', 'prendre', 'prenaient'],
  ],
  futur: [
    ['Je', 'jouer', 'jouerai'],
    ['Tu', 'finir', 'finiras'],
    ['Elle', 'avoir', 'aura'],
    ['Nous', 'être', 'serons'],
    ['Vous', 'aller', 'irez'],
    ['Ils', 'faire', 'feront'],
  ],
  passe: [
    ['Il', 'jouer', 'a joué'],
    ['Elles', 'finir', 'ont fini'],
    ['Elle', 'aller', 'est allée'],
    ['Nous', 'avoir', 'avons eu'],
    ['Vous', 'prendre', 'avez pris'],
    ['Ils', 'être', 'ont été'],
  ],
};
for (const [tense, forms] of Object.entries(conjugations)) {
  const label = {
    present: 'présent',
    imparfait: 'imparfait',
    futur: 'futur',
    passe: 'passé composé',
  }[tense];
  register(`conjug-${tense}`, 'grammar', `Conjuguer ${atTense(label)}`);
  forms.forEach(([person, verb, answer], tier) =>
    choice(
      `conjug-${tense}`,
      'grammar',
      `Le verbe ${atTense(label)}`,
      tier,
      0,
      `Complète ${atTense(label)} : « ${beforeVerb(person, answer)}… » (${verb}).`,
      answer,
      [verb, tense === 'futur' ? 'a joué' : verb + 'ons'],
      `${beforeVerb(person, answer)}${answer} : le verbe ${verb} s’accorde avec ${person.toLowerCase()} ${atTense(label)}.`,
    ),
  );
}
series('verb-agreement', 'grammar', 'Accorder le verbe avec son sujet', [
  [
    'Complète : « Le renard … »',
    'chante',
    ['chantent', 'chantes'],
    'Le sujet est au singulier : chante.',
  ],
  [
    'Complète : « Les renards … »',
    'chantent',
    ['chante', 'chantes'],
    'Le sujet est au pluriel : chantent.',
  ],
  [
    'Complète : « Toi et moi, nous … »',
    'jouons',
    ['jouent', 'jouez'],
    'Le sujet correspond à nous.',
  ],
  [
    'Complète : « Plume et Nacre … au lac. »',
    'vont',
    ['va', 'vas'],
    'Le sujet correspond à elles.',
  ],
  [
    'Complète : « Au loin … deux dragons. »',
    'apparaissent',
    ['apparaît', 'apparaîs'],
    'Le sujet est deux dragons, placé après le verbe.',
  ],
  [
    'Complète : « La bande de renards … »',
    'arrive',
    ['arrivent', 'arriver'],
    'Le noyau du sujet est bande, au singulier.',
  ],
]);
series('complex-sentences', 'grammar', 'Relier et comprendre les propositions', [
  [
    'Quel signe termine une question ?',
    '?',
    ['.', '!'],
    'Le point d’interrogation marque la question.',
  ],
  [
    'Quelle phrase exprime une négation ?',
    'Plume ne dort pas.',
    ['Plume dort.', 'Dors-tu ?'],
    'Ne… pas encadre ici le verbe.',
  ],
  [
    'Deux actions sont reliées dans…',
    'Plume lit et Nacre dessine.',
    ['Le grand jardin fleuri.', 'Une jolie carte.'],
    'Cette phrase contient deux verbes conjugués.',
  ],
  [
    'Dans « Il pleut, donc je prends un parapluie », donc indique…',
    'une conséquence',
    ['une cause', 'une opposition'],
    'Prendre le parapluie est une conséquence de la pluie.',
  ],
  [
    'Dans « Je lis pendant que tu dessines », combien y a-t-il de verbes conjugués ?',
    '2',
    ['1', '3'],
    'Lis et dessines sont les deux verbes conjugués.',
  ],
  [
    'Dans « La carte que Plume dessine est belle », que Plume dessine précise…',
    'la carte',
    ['belle', 'est'],
    'Cette proposition donne une information sur la carte.',
  ],
]);
series('morphology', 'words', 'Familles, préfixes et suffixes', [
  [
    'Quel mot est de la famille de jardin ?',
    'jardinier',
    ['jaune', 'journal'],
    'Un jardinier s’occupe du jardin.',
  ],
  [
    'Dans « relire », re- signifie ici…',
    'lire à nouveau',
    ['lire très vite', 'ne pas lire'],
    'Le préfixe indique une répétition de l’action.',
  ],
  [
    'Quel mot est le contraire de possible ?',
    'impossible',
    ['possibilité', 'possiblement'],
    'Le préfixe im- exprime ici la négation.',
  ],
  [
    'Dans « maisonnette », -ette indique…',
    'une petite maison',
    ['une maison très haute', 'plusieurs maisons'],
    'Le suffixe apporte une idée de petite taille.',
  ],
  [
    'Quel mot est construit à partir de terre ?',
    'terrestre',
    ['terrible', 'tendre'],
    'Le sens de terrestre se rattache à la terre.',
  ],
  [
    'Dans « défaire », dé- indique ici…',
    'une action inverse',
    ['une action plus rapide', 'un futur'],
    'Défaire revient à annuler ce qui a été fait.',
  ],
]);
series('lexical-meaning', 'words', 'Synonymes, contraires et sens en contexte', [
  [
    'Quel est le contraire de grand ?',
    'petit',
    ['immense', 'haut'],
    'Petit et grand s’opposent selon la taille.',
  ],
  [
    'Quel mot est proche de joyeux ?',
    'heureux',
    ['furieux', 'fatigué'],
    'Heureux et joyeux ont ici des sens proches.',
  ],
  [
    'Dans « une mer calme », calme signifie…',
    'peu agitée',
    ['silencieuse comme une personne', 'très froide'],
    'Le contexte aide à choisir le sens du mot.',
  ],
  [
    'Dans « le pied de la montagne », pied est employé…',
    'au sens figuré',
    ['pour un orteil réel', 'comme un verbe'],
    'Il désigne la partie basse de la montagne.',
  ],
  [
    'Quel mot est le plus précis pour désigner un animal qui chasse d’autres animaux ?',
    'prédateur',
    ['être', 'objet'],
    'Prédateur exprime cette relation alimentaire.',
  ],
  [
    'Dans « une nouvelle fraîche », fraîche signifie surtout…',
    'récente',
    ['très froide', 'mouillée'],
    'Un même mot peut avoir plusieurs sens selon son contexte.',
  ],
]);
series('decoding', 'sounds', 'Lire des graphies de plus en plus complexes', [
  [
    'Quel mot contient « ou » pour le son de loup ?',
    'mouton',
    ['matin', 'manteau'],
    'Dans mouton, ou représente le son entendu dans loup.',
  ],
  [
    'Quel mot contient « ph » pour le son de phare ?',
    'dauphin',
    ['dragon', 'dindon'],
    'Le groupe ph se lit f dans dauphin.',
  ],
  [
    'Dans quel mot « c » se lit comme dans cerise ?',
    'citron',
    ['cabane', 'colline'],
    'Devant i, c se lit ici comme le son de cerise.',
  ],
  [
    'Quel mot écrit le son de montagne avec « gn » ?',
    'champignon',
    ['champion', 'chameau'],
    'Le groupe gn de champignon correspond au son de montagne.',
  ],
  [
    'Quel mot contient le groupe « tion » comme dans attention ?',
    'invention',
    ['intérieur', 'intervalle'],
    'Dans invention, tion se prononce comme dans attention.',
  ],
  [
    'Quel mot est correctement écrit ?',
    'extraordinaire',
    ['extraordinnère', 'extrordinaire'],
    'Extraordinaire comporte extra- puis ordinaire. On peut s’appuyer sur ces éléments pour le lire.',
  ],
]);
register('read-explicit', 'reading', 'Prélever des informations');
register('read-infer', 'reading', 'Relier les indices et faire une inférence');
const stories = [
  [
    'Plume pose son livre sur le banc. Elle rejoint Nacre près du lac.',
    'Où Plume laisse-t-elle le livre ?',
    'sur le banc',
    ['dans le lac', 'dans son sac'],
    'Le premier énoncé donne directement le lieu.',
    'Qui rejoint Nacre ?',
    'Plume',
    ['Mousse', 'Orion'],
    'Elle reprend le personnage nommé Plume.',
  ],
  [
    'Mousse apporte un panier à Orion. Celui-ci y range trois pommes avant de le poser sur la table.',
    'Combien de pommes Orion range-t-il ?',
    'trois',
    ['deux', 'quatre'],
    'Le texte indique trois pommes.',
    'Qui désigne « Celui-ci » ?',
    'Orion',
    ['le panier', 'Mousse'],
    'Celui-ci reprend le destinataire du panier, Orion.',
  ],
  [
    'Brindille veut peindre dehors. Quand elle entend la pluie, elle emporte ses couleurs dans l’atelier.',
    'Où Brindille emporte-t-elle ses couleurs ?',
    'dans l’atelier',
    ['au lac', 'sur la colline'],
    'La fin du texte indique le lieu.',
    'Pourquoi change-t-elle de lieu ?',
    'pour peindre à l’abri',
    ['pour aller nager', 'parce qu’elle a terminé'],
    'La pluie et son projet de peinture permettent de déduire cette raison.',
  ],
  [
    'Une affiche annonce : « Atelier des étoiles : samedi à 15 h, bibliothèque. » Plume arrive un quart d’heure avant pour installer les cartes.',
    'Quel jour a lieu l’atelier ?',
    'samedi',
    ['vendredi', 'dimanche'],
    'Le jour apparaît explicitement dans l’affiche.',
    'À quelle heure Plume arrive-t-elle ?',
    '14 h 45',
    ['15 h 15', '14 h 15'],
    'Un quart d’heure avant 15 h correspond à 14 h 45.',
  ],
  [
    'Le chemin du lac est fermé pour réparer une passerelle. Nacre consulte la carte et propose le sentier des saules. Le groupe suit sa proposition.',
    'Quel sentier le groupe prend-il ?',
    'le sentier des saules',
    ['le chemin du lac', 'le chemin de la gare'],
    'Le groupe suit la proposition de Nacre.',
    'Pourquoi le groupe consulte-t-il une carte ?',
    'pour trouver un autre chemin',
    ['pour compter les saules', 'pour connaître la météo'],
    'La fermeture du chemin oblige à chercher un itinéraire différent.',
  ],
  [
    'Dans son carnet, Orion note que les pousses près de la fenêtre sont plus hautes. Il veut savoir si la lumière joue un rôle. Il prépare deux pots identiques, arrosés de la même façon.',
    'Quel facteur Orion veut-il étudier ?',
    'la lumière',
    ['la couleur du carnet', 'le nom des plantes'],
    'Son questionnement porte explicitement sur la lumière.',
    'Pourquoi garde-t-il le même arrosage ?',
    'pour comparer l’effet de la lumière',
    ['pour changer tous les facteurs', 'pour éviter toute observation'],
    'Garder les autres conditions comparables aide à isoler le facteur étudié.',
  ],
];
stories.forEach(([text, p, a, o, e, p2, a2, o2, e2], tier) => {
  choice('read-explicit', 'reading', 'Le récit des gardiens', tier, 0, p, a, o, e, { text });
  choice('read-infer', 'reading', 'Les indices du récit', tier, 0, p2, a2, o2, e2, { text });
});
series('text-genres', 'reading', 'Reconnaître les formes de textes', [
  [
    '« Il était une fois un renard qui parlait. » Cela annonce plutôt…',
    'un conte',
    ['un tableau de mesures', 'une règle de grammaire'],
    'La formule et l’élément merveilleux évoquent un conte.',
  ],
  [
    '« Mélange la farine, ajoute l’eau, remue. » Il s’agit plutôt…',
    'd’une recette',
    ['d’un poème', 'd’un dialogue de théâtre'],
    'Le texte donne des actions à réaliser dans un ordre.',
  ],
  [
    'Un texte présente des répliques précédées des noms des personnages. C’est plutôt…',
    'du théâtre',
    ['une carte', 'un dictionnaire'],
    'Les noms permettent de savoir qui prononce chaque réplique.',
  ],
  [
    'Un texte décrit les ailes, l’alimentation et l’habitat d’un papillon. C’est plutôt…',
    'un documentaire',
    ['une recette', 'un bulletin de notes'],
    'Il apporte des informations organisées sur un sujet.',
  ],
  [
    '« Le ciel déroule son tapis de velours. » Cette image poétique…',
    'compare le ciel à un tapis sans dire comme',
    ['décrit un vrai tapis dans le ciel', 'donne une mesure'],
    'C’est une image : le ciel est présenté comme un tapis.',
  ],
  [
    'Une fable peut raconter une aventure d’animaux pour…',
    'inviter à réfléchir à des comportements',
    ['donner seulement des données zoologiques', 'remplacer toutes les lois'],
    'Le récit peut conduire à une réflexion ou à une morale.',
  ],
]);
series('documents', 'reading', 'Lire et croiser des documents', [
  [
    'Une étiquette indique « 5 graines ». Combien contient le sachet ?',
    '5',
    ['2', '10'],
    'L’étiquette apporte directement l’information.',
  ],
  [
    'Une affiche annonce « Ouverture : 10 h ». À quelle heure peut-on entrer ?',
    'à partir de 10 h',
    ['à 9 h', 'à minuit'],
    'Ouverture désigne le début de l’accueil.',
  ],
  [
    'Sur un plan, la légende indique qu’un carré bleu représente un lac. À quoi sert la légende ?',
    'à expliquer les symboles',
    ['à mesurer le vent', 'à raconter un conte'],
    'La légende relie un symbole à sa signification.',
  ],
  [
    'Affiche : « 3 € l’entrée ». Message : « Nous venons à quatre. » Quel est le prix total ?',
    '12 €',
    ['7 €', '9 €'],
    'Il faut combiner les deux informations : 4 × 3 € = 12 €.',
  ],
  [
    'Un tableau donne la hauteur d’une plante chaque semaine. Quel document aiderait à voir son évolution ?',
    'un graphique des hauteurs au fil des semaines',
    ['une liste des couleurs préférées', 'une carte du monde'],
    'Les axes peuvent représenter le temps et la hauteur.',
  ],
  [
    'Deux documents donnent des nombres différents. Que faire d’abord ?',
    'comparer leurs dates, sources et ce qu’ils mesurent',
    ['choisir le plus grand nombre', 'additionner automatiquement'],
    'Les données ne décrivent pas forcément la même population ou la même période.',
  ],
]);
missions('oral-reading', 'oral', 'Lire et faire vivre un texte', [
  [
    'Lis ou écoute : « La lune éclaire le lac. » Tu peux proposer une voix douce à un adulte.',
    'Le but est de partager le sens, sans chronomètre.',
  ],
  [
    'Lis ou fais lire : « Mousse appelle : Nacre, viens voir ! » Imagine la voix du personnage.',
    'La ponctuation peut aider à choisir l’intonation.',
  ],
  [
    'Choisis deux phrases d’une histoire que tu aimes et raconte pourquoi elles te plaisent.',
    'Un avis personnel peut s’appuyer sur un détail du texte.',
  ],
  [
    'Avec un adulte, lisez chacun une réplique d’un petit dialogue.',
    'On écoute son partenaire et l’on attend la fin de sa réplique.',
  ],
  [
    'Présente à un adulte un personnage de livre et une raison de ton choix.',
    'Une présentation peut comporter le nom, une action et une impression.',
  ],
  [
    'Raconte un court passage d’un livre, puis explique un indice qui t’a aidée à comprendre un personnage.',
    'Distingue ce que dit le texte de ce que tu en déduis.',
  ],
]);
missions('oral-exchange', 'oral', 'Écouter, expliquer et échanger', [
  [
    'Demande à un adulte de nommer deux animaux. Redis-les si tu en as envie.',
    'On peut écouter une deuxième fois ; ce n’est pas un test de mémoire.',
  ],
  [
    'Explique à un adulte la règle d’un jeu que tu connais.',
    'Commence par le but, puis les actions possibles.',
  ],
  [
    'Demande à un adulte ce qu’il préfère dans une histoire, puis reformule son idée.',
    'Reformuler, c’est dire avec ses mots en gardant le sens.',
  ],
  [
    'Propose un avis sur une histoire et donne une raison.',
    'Un échange peut accueillir plusieurs avis différents.',
  ],
  [
    'Explique deux façons de résoudre un petit calcul.',
    'Tu peux utiliser un dessin, des objets ou seulement ta voix.',
  ],
  [
    'Après avoir écouté une courte explication, résume l’idée principale et pose une question utile.',
    'Une question peut demander une précision sur ce que tu n’as pas compris.',
  ],
]);
missions('written-production', 'writing', 'Inventer de petits écrits', [
  [
    'Invente une phrase sur un animal imaginaire. Tu peux la dire, la dicter ou la taper.',
    'Choisis d’abord qui agit et ce qu’il fait. Aucune copie manuscrite n’est demandée.',
  ],
  [
    'Imagine deux phrases : un personnage trouve un objet, puis décide quoi en faire. Tu peux les dicter.',
    'Les deux phrases racontent une petite suite d’événements.',
  ],
  [
    'Prépare un message pour inviter un ami au château : quand, où, pour quoi faire ?',
    'Un message utile contient les informations dont le destinataire a besoin.',
  ],
  [
    'Imagine un début, un petit problème et une fin pour une histoire. Tu peux tout raconter à un adulte.',
    'On peut préparer un plan avant de rédiger.',
  ],
  [
    'Dicte ou tape un court paragraphe qui décrit un lieu, en choisissant quelques détails précis.',
    'Les détails permettent au lecteur d’imaginer le lieu.',
  ],
  [
    'Prépare un court texte qui défend ton lieu préféré du château avec deux raisons. Si tu veux, discute d’une amélioration avec un adulte.',
    'Une révision porte sur le sens ou l’organisation ; aucune répétition jusqu’à perfection n’est imposée.',
  ],
]);
missions('literary-culture', 'reading', 'Partager des œuvres et des idées', [
  [
    'Choisis un livre, un album ou un conte que tu aimes. Dis le nom d’un personnage.',
    'Les lectures choisies pour le plaisir ont leur place dans le parcours.',
  ],
  [
    'Compare deux animaux d’histoires : qu’ont-ils de commun ?',
    'On peut rapprocher des personnages sans choisir un vainqueur.',
  ],
  [
    'Avec un adulte, choisis un conte merveilleux à lire ou écouter par petits épisodes.',
    'Une œuvre entière se découvre en plusieurs moments, en dehors d’une carte courte.',
  ],
  [
    'Dans un livre, choisis une action courageuse ou généreuse et explique ton avis.',
    'Tu peux citer le passage ou le reformuler.',
  ],
  [
    'Compare un récit et un poème sur un même thème, par exemple la forêt.',
    'Les formes d’écriture peuvent produire des impressions différentes.',
  ],
  [
    'Présente un livre à quelqu’un en distinguant son résumé et ton avis personnel.',
    'Le résumé raconte l’essentiel ; l’avis explique ce que tu en penses.',
  ],
]);
series('history-method', 'history', 'Se repérer et lire une source', [
  [
    'Quel mot désigne ce qui a eu lieu avant aujourd’hui ?',
    'le passé',
    ['le futur', 'demain'],
    'Le passé rassemble les événements déjà survenus.',
  ],
  [
    'Quel événement est le plus ancien ?',
    '1789',
    ['1882', '1945'],
    'Sur une frise croissante, 1789 vient avant les deux autres dates.',
  ],
  [
    'Le XIXe siècle correspond principalement aux années…',
    '1801 à 1900',
    ['1701 à 1800', '1901 à 2000'],
    'Le premier siècle commence en l’an 1 ; le XIXe va de 1801 à 1900.',
  ],
  [
    'Une photographie de 1900 peut être…',
    'une source pour étudier cette époque',
    ['une preuve de tout ce qui s’est passé', 'un document du futur'],
    'Une source renseigne sur certains aspects et doit être interprétée.',
  ],
  [
    'Pourquoi comparer deux témoignages ?',
    'pour confronter leurs points de vue',
    ['pour effacer leurs différences', 'pour choisir automatiquement le plus long'],
    'Deux personnes peuvent observer des aspects différents d’un événement.',
  ],
  [
    'Avant d’utiliser un document historique, on cherche notamment…',
    'sa date, son auteur et son contexte',
    ['seulement sa couleur', 'uniquement sa longueur'],
    'Ces éléments aident à comprendre ce que le document peut nous apprendre.',
  ],
]);
series('republic', 'history', 'Le temps de la République', [
  [
    'Quelle devise est celle de la République française ?',
    'Liberté, Égalité, Fraternité',
    ['Force, Vitesse, Richesse', 'Ordre, Silence, Secret'],
    'La devise réunit ces trois principes.',
  ],
  [
    'Quel symbole représente la République française ?',
    'Marianne',
    ['un personnage de conte', 'un roi actuel de France'],
    'Marianne est une figure symbolique de la République.',
  ],
  [
    'Quel changement associe-t-on aux lois scolaires de 1881 et 1882 ?',
    'l’école primaire publique gratuite et l’instruction obligatoire',
    ['la création d’internet', 'la fin de toute école'],
    'Les lois de cette période transforment l’accès à l’instruction.',
  ],
  [
    'La laïcité de l’école publique implique notamment…',
    'le respect des convictions et la neutralité de l’enseignement public',
    [
      'l’obligation d’avoir tous la même religion',
      'l’interdiction de toute connaissance des religions',
    ],
    'La neutralité permet d’accueillir des élèves de convictions différentes.',
  ],
  [
    'Quand les femmes obtiennent-elles le droit de vote en France ?',
    '1944',
    ['1789', '1882'],
    'Le droit est reconnu en 1944 et elles votent pour la première fois en 1945.',
  ],
  [
    'Dans une république démocratique, une élection permet notamment…',
    'de choisir des représentants selon des règles',
    ['de supprimer les droits de la minorité', 'de rendre un avis impossible à discuter'],
    'La décision majoritaire s’exerce dans le cadre de droits et de règles.',
  ],
]);
series('industrial', 'history', 'L’âge industriel et les transformations', [
  [
    'Quel moyen de transport se développe avec le chemin de fer ?',
    'le train',
    ['le sous-marin antique', 'le satellite'],
    'Le train circule sur des rails.',
  ],
  [
    'Une machine à vapeur utilise notamment…',
    'de la vapeur pour produire un mouvement',
    ['une connexion internet', 'des piles uniquement'],
    'La vapeur peut entraîner une machine ou une locomotive.',
  ],
  [
    'Une usine réunit souvent…',
    'des machines et des travailleurs pour produire',
    ['uniquement des champs', 'seulement des livres'],
    'L’usine est un lieu de production industrielle.',
  ],
  [
    'L’industrialisation favorise souvent…',
    'le développement de villes ouvrières',
    ['la disparition de tous les transports', 'la fin de tout commerce'],
    'Des populations se rapprochent des lieux de travail industriel.',
  ],
  [
    'Pourquoi comparer une ville avant et après l’arrivée du train ?',
    'pour étudier les changements de circulation et d’activité',
    ['pour savoir sa météo du lendemain', 'pour dater chaque pierre'],
    'Les réseaux de transport transforment les échanges et les lieux.',
  ],
  [
    'Au XIXe siècle, tous les habitants bénéficient-ils de la même façon des transformations ?',
    'non, les conditions de vie et de travail restent inégales',
    ['oui, sans aucune exception', 'aucun changement n’a eu lieu'],
    'Les transformations industrielles s’accompagnent d’inégalités et de revendications sociales.',
  ],
]);
series('wars-europe', 'history', 'Des guerres mondiales à la construction européenne', [
  [
    'Quel événement est le plus récent ?',
    'la création de l’Union européenne',
    ['la Révolution française', 'le début du chemin de fer en France'],
    'L’Union européenne prend ce nom avec le traité de Maastricht, entré en vigueur en 1993.',
  ],
  [
    'Quelles dates encadrent la Première Guerre mondiale ?',
    '1914–1918',
    ['1939–1945', '1789–1799'],
    'La Première Guerre mondiale se déroule de 1914 à 1918.',
  ],
  [
    'Quelles dates encadrent la Seconde Guerre mondiale ?',
    '1939–1945',
    ['1914–1918', '1881–1882'],
    'La Seconde Guerre mondiale se déroule de 1939 à 1945.',
  ],
  [
    'Après 1945, la coopération européenne vise notamment…',
    'à construire la paix et des liens entre pays',
    ['à supprimer toute langue différente', 'à effacer toute histoire'],
    'Des projets communs cherchent à rapprocher durablement les pays.',
  ],
  [
    'Pourquoi les lieux de mémoire sont-ils importants ?',
    'pour connaître, comprendre et transmettre l’histoire',
    ['pour transformer le passé', 'pour éviter toute recherche'],
    'La mémoire et l’histoire contribuent à la transmission, avec des démarches distinctes.',
  ],
  [
    'L’Union européenne et le continent européen…',
    'ne désignent pas exactement le même ensemble',
    ['sont exactement identiques', 'n’ont aucun lien'],
    'L’Union regroupe des États membres ; le continent comprend aussi d’autres pays.',
  ],
]);
series('mobility', 'geography', 'Se déplacer et lire un itinéraire', [
  [
    'Sur un plan, à quoi sert une flèche indiquant le nord ?',
    'à orienter la carte',
    ['à donner l’heure', 'à compter les routes'],
    'Le nord est un repère pour les directions.',
  ],
  [
    'Pour un déplacement court, quel mode peut se faire sans moteur ?',
    'la marche',
    ['l’avion', 'le train électrique'],
    'Marcher est un déplacement sans moteur.',
  ],
  [
    'Un trajet combine bus puis train. On utilise…',
    'plusieurs modes de transport',
    ['un seul véhicule', 'aucun réseau'],
    'Les déplacements peuvent associer plusieurs réseaux.',
  ],
  [
    'Une carte montre une ligne ferroviaire et une gare. Ce sont…',
    'des éléments d’un réseau de transport',
    ['des frontières de continents', 'des reliefs naturels'],
    'Les infrastructures organisent la circulation.',
  ],
  [
    'Deux trajets ont la même distance. Le temps de trajet est-il forcément identique ?',
    'non, il dépend aussi du mode et des conditions',
    ['oui, toujours', 'seulement si les noms sont courts'],
    'Les vitesses, arrêts et correspondances influencent la durée.',
  ],
  [
    'Pour choisir un itinéraire, on peut comparer…',
    'durée, coût, accessibilité et effets sur l’environnement',
    ['seulement la couleur du véhicule', 'uniquement le nombre de lettres'],
    'Le choix dépend de plusieurs critères et de la situation.',
  ],
]);
series('internet', 'geography', 'Communiquer et comprendre les réseaux', [
  [
    'Internet permet notamment…',
    'd’échanger des informations à distance',
    ['de rendre tous les objets gratuits', 'de remplacer toutes les routes'],
    'Des appareils reliés peuvent échanger des données.',
  ],
  [
    'Une information en ligne est-elle vraie parce qu’elle est souvent partagée ?',
    'non',
    ['oui, toujours', 'seulement si elle est courte'],
    'La popularité ne garantit pas l’exactitude.',
  ],
  [
    'Les données circulent notamment par…',
    'des câbles et des réseaux de communication',
    ['uniquement des nuages réels', 'des lettres en papier'],
    'Les réseaux reposent sur des équipements matériels.',
  ],
  [
    'Pourquoi trouve-t-on des câbles sous-marins ?',
    'pour relier des territoires à travers les océans',
    ['pour déplacer des poissons', 'pour mesurer chaque vague'],
    'Ils transportent des données entre des régions du monde.',
  ],
  [
    'Tout le monde a-t-il le même accès à internet ?',
    'non, l’équipement et les connexions sont inégaux',
    ['oui, exactement', 'personne n’y a accès'],
    'L’accès varie selon les territoires et les situations.',
  ],
  [
    'Un message traverse plusieurs équipements. Cela montre que communiquer dépend…',
    'd’un réseau matériel organisé',
    ['seulement de la pensée', 'd’un seul écran isolé'],
    'Les communications mobilisent des infrastructures et des services.',
  ],
]);
series('habitat', 'geography', 'Mieux habiter et préserver les milieux', [
  [
    'Un espace vert en ville peut accueillir…',
    'des plantes et des animaux',
    ['uniquement du béton', 'aucun être vivant'],
    'Les espaces verts peuvent constituer des habitats.',
  ],
  [
    'Quel aménagement facilite les déplacements de personnes à mobilité réduite ?',
    'une rampe adaptée',
    ['un escalier sans alternative', 'une porte inaccessible'],
    'L’accessibilité permet à davantage de personnes d’utiliser les lieux.',
  ],
  [
    'Quel geste aide à limiter les déchets ?',
    'réutiliser un objet encore utilisable',
    ['jeter un objet neuf', 'multiplier les emballages'],
    'Réutiliser peut éviter de produire un déchet et un nouvel objet.',
  ],
  [
    'Un quartier associe logements, commerces et transports proches. Cela peut…',
    'réduire certains déplacements longs',
    ['supprimer tout besoin de transport', 'empêcher toute vie de quartier'],
    'La proximité de services peut modifier les trajets quotidiens.',
  ],
  [
    'Pourquoi préserver des sols perméables ?',
    'ils favorisent notamment l’infiltration de l’eau',
    ['ils empêchent toute pluie', 'ils remplacent les rivières'],
    'L’eau peut plus facilement pénétrer certains sols non imperméabilisés.',
  ],
  [
    'Pour étudier un projet d’écoquartier, il faut…',
    'examiner plusieurs effets et les besoins des habitants',
    ['croire automatiquement son nom', 'regarder seulement une couleur verte'],
    'Le nom ne suffit pas : on examine les aménagements et leurs usages.',
  ],
]);
series('matter', 'science', 'Matière et transformations', [
  [
    'Un glaçon est de l’eau à l’état…',
    'solide',
    ['gazeux', 'liquide'],
    'La glace est l’état solide de l’eau.',
  ],
  [
    'Quand un glaçon fond, il devient…',
    'de l’eau liquide',
    ['une autre matière sans rapport', 'du sable'],
    'Le changement d’état conserve la substance eau.',
  ],
  [
    'La vapeur d’eau est…',
    'de l’eau à l’état gazeux',
    ['toujours une fumée noire', 'un solide'],
    'La vapeur d’eau est un gaz ; les petites gouttes visibles sont de l’eau liquide.',
  ],
  [
    'Du sel dissous dans l’eau…',
    'est encore présent dans le mélange',
    ['a forcément disparu de toute matière', 's’est changé en métal'],
    'La dissolution ne signifie pas disparition de la matière.',
  ],
  [
    'Pour séparer du sable de l’eau, on peut utiliser…',
    'une filtration adaptée',
    ['un aimant pour tout le sable', 'une loupe seule'],
    'Le filtre peut retenir les grains et laisser passer l’eau.',
  ],
  [
    'Dans un récipient fermé, une transformation conserve généralement…',
    'la masse totale de matière',
    ['nécessairement le volume de chaque partie', 'la forme de tous les objets'],
    'La matière ne disparaît pas du système fermé ; ses formes peuvent changer.',
  ],
]);
series('energy-motion', 'science', 'Mouvement, énergie et information', [
  [
    'Une balle qui change de position est…',
    'en mouvement par rapport au repère choisi',
    ['forcément immobile', 'sans masse'],
    'Décrire un mouvement suppose de choisir un repère.',
  ],
  [
    'Pour comparer deux déplacements, on peut mesurer…',
    'distance et durée',
    ['seulement la couleur', 'le nom des personnes'],
    'Ces mesures permettent notamment de comparer des vitesses moyennes.',
  ],
  [
    'Un panneau solaire photovoltaïque transforme de l’énergie lumineuse en…',
    'énergie électrique',
    ['uniquement du sable', 'aucune autre forme'],
    'Il produit de l’électricité à partir du rayonnement reçu.',
  ],
  [
    'Une pile fournit…',
    'de l’énergie à un circuit adapté',
    ['de l’électricité infinie', 'aucune énergie'],
    'Sa réserve n’est pas illimitée.',
  ],
  [
    'Un signal lumineux peut servir…',
    'à transmettre une information',
    ['uniquement à chauffer', 'à remplacer toute matière'],
    'Un signal doit être interprété selon un code ou un contexte.',
  ],
  [
    'Deux objets parcourent 100 m en 20 s et 25 s. Lequel a la plus grande vitesse moyenne ?',
    'celui qui met 20 s',
    ['celui qui met 25 s', 'ils ont forcément la même vitesse'],
    'À distance identique, une durée plus courte correspond à une vitesse moyenne plus grande.',
  ],
]);
series('living', 'science', 'Le vivant et ses fonctions', [
  [
    'Une plante a notamment besoin…',
    'd’eau et de conditions adaptées',
    ['de plastique seulement', 'd’aucune matière'],
    'Ses besoins dépendent de l’espèce et de son milieu.',
  ],
  [
    'Pour grandir, un être vivant…',
    'utilise de la matière et de l’énergie',
    ['ne change jamais', 'n’a aucun besoin'],
    'La croissance s’accompagne de transformations.',
  ],
  [
    'Les aliments apportent à notre organisme…',
    'de la matière et de l’énergie',
    ['uniquement des couleurs', 'aucun élément utile'],
    'Les besoins de l’organisme expliquent l’importance de l’alimentation.',
  ],
  [
    'Une fleur peut participer à…',
    'la reproduction d’une plante à fleurs',
    ['la fabrication d’un caillou', 'la disparition de toute graine'],
    'Après certaines étapes de reproduction, des graines peuvent se former.',
  ],
  [
    'Classer des êtres vivants scientifiquement consiste notamment à…',
    'regrouper selon des caractères partagés',
    ['les classer seulement par préférence', 'séparer au hasard'],
    'Les caractères observables servent à justifier des regroupements.',
  ],
  [
    'Dans un réseau alimentaire, une flèche peut représenter…',
    'un transfert de matière entre êtres vivants',
    ['uniquement une direction du vent', 'la taille exacte des animaux'],
    'Il faut lire la convention utilisée dans le schéma et sa légende.',
  ],
]);
series('earth', 'science', 'La Terre et les milieux', [
  [
    'Pourquoi observe-t-on le jour et la nuit ?',
    'la Terre tourne sur elle-même',
    ['le Soleil s’éteint chaque soir', 'la Lune cache toujours le Soleil'],
    'La rotation change la partie de la Terre éclairée par le Soleil.',
  ],
  [
    'La Lune produit-elle sa propre lumière visible comme une étoile ?',
    'non, elle réfléchit la lumière du Soleil',
    ['oui, comme le Soleil', 'elle éclaire sans aucune lumière reçue'],
    'La lumière lunaire vient principalement du Soleil.',
  ],
  [
    'Une année correspond approximativement…',
    'à un tour de la Terre autour du Soleil',
    ['à un tour de la Terre sur elle-même', 'à une semaine'],
    'La révolution de la Terre dure environ un an.',
  ],
  [
    'Un écosystème comprend…',
    'des êtres vivants et leur milieu, avec leurs relations',
    ['seulement un animal isolé', 'uniquement les pierres'],
    'On étudie les relations entre les éléments du milieu.',
  ],
  [
    'Pourquoi une modification d’un habitat peut-elle affecter plusieurs espèces ?',
    'les espèces dépendent de relations et de ressources communes',
    ['elles ont toutes le même nom', 'aucune espèce ne dépend du milieu'],
    'Les relations écologiques relient les êtres vivants.',
  ],
  [
    'La météo et le climat décrivent…',
    'des échelles de temps différentes',
    ['exactement la même chose', 'uniquement la température d’un instant'],
    'La météo concerne des conditions à court terme ; le climat se décrit sur de longues durées.',
  ],
]);
series('technology', 'science', 'Objets techniques et démarche scientifique', [
  [
    'Une roue sur une valise sert principalement à…',
    'faciliter son déplacement',
    ['mesurer sa couleur', 'lire l’heure'],
    'La fonction d’usage décrit à quoi sert un objet.',
  ],
  [
    'Pour tester une idée, il est utile de…',
    'faire une observation ou une expérience adaptée',
    ['choisir au hasard la conclusion', 'changer tous les facteurs sans les noter'],
    'Une démarche explicite permet de confronter une idée à des résultats.',
  ],
  [
    'Pour comparer l’effet de la lumière sur deux plantes, on garde si possible…',
    'les autres conditions comparables',
    ['un arrosage volontairement différent', 'deux espèces toujours différentes'],
    'On cherche à isoler le facteur étudié.',
  ],
  [
    'Dans un objet, un matériau se choisit notamment selon…',
    'ses propriétés et l’usage prévu',
    ['seulement son nom', 'le hasard uniquement'],
    'Résistance, masse ou conductivité peuvent être pertinentes.',
  ],
  [
    'Si une expérience ne confirme pas une hypothèse, on peut…',
    'revoir l’hypothèse ou le protocole en examinant les résultats',
    ['effacer les résultats gênants', 'déclarer automatiquement une réussite'],
    'Les résultats servent à discuter les explications.',
  ],
  [
    'Un schéma technique est utile s’il…',
    'représente clairement les éléments et leurs relations',
    ['cache toutes les informations', 'n’a aucun lien avec l’objet'],
    'Il aide à comprendre ou réaliser une solution technique.',
  ],
]);
series('english-words', 'english', 'Comprendre des mots anglais', [
  ['Quel mot anglais signifie chat ?', 'cat', ['dog', 'bird'], 'Cat signifie chat.'],
  ['Quelle couleur désigne blue ?', 'bleu', ['rouge', 'vert'], 'Blue signifie bleu.'],
  ['Quel nombre désigne twelve ?', 'douze', ['deux', 'vingt'], 'Twelve signifie douze.'],
  [
    'Que signifie between ?',
    'entre',
    ['derrière', 'au-dessus'],
    'Between situe entre deux éléments.',
  ],
  [
    'Que signifie usually ?',
    'habituellement',
    ['jamais', 'demain'],
    'Usually indique ce qui arrive habituellement.',
  ],
  ['Que signifie because ?', 'parce que', ['mais', 'avant'], 'Because introduit une raison.'],
]);
series('english-sentences', 'english', 'Comprendre de petites phrases', [
  [
    'Que signifie « Hello! » ?',
    'Bonjour !',
    ['Au revoir !', 'Bonne nuit !'],
    'Hello est une salutation.',
  ],
  [
    'Que signifie « My name is Nora » ?',
    'Je m’appelle Nora',
    ['Je cherche Nora', 'Nora est absente'],
    'My name is… permet de se présenter.',
  ],
  [
    'Que signifie « I like animals » ?',
    'J’aime les animaux',
    ['Je suis un animal', 'Je n’aime pas lire'],
    'I like exprime ce que l’on aime.',
  ],
  [
    'Que signifie « The book is under the table » ?',
    'Le livre est sous la table',
    ['Le livre est sur la table', 'Le livre est dans le sac'],
    'Under signifie sous.',
  ],
  [
    'Que signifie « Can you help me, please? » ?',
    'Peux-tu m’aider, s’il te plaît ?',
    ['Quel âge as-tu ?', 'J’ai fini mon livre.'],
    'Can you…? peut servir à demander poliment une action.',
  ],
  [
    'Que signifie « She is reading while I am drawing » ?',
    'Elle lit pendant que je dessine',
    ['Elle dessine et je dors', 'Elle a lu hier'],
    'While indique que les deux actions se déroulent en même temps.',
  ],
]);
missions('english-speaking', 'english', 'Essayer quelques échanges en anglais', [
  [
    'Avec un adulte, essaie de saluer : Hello! Tu peux aussi simplement écouter.',
    'Hello permet de dire bonjour.',
  ],
  ['Présente un personnage avec My name is…', 'Tu peux inventer un nom de personnage.'],
  ['Dis une chose que tu aimes avec I like…', 'I like books signifie j’aime les livres.'],
  ['Imagine une question avec Where is…?', 'Where is the book? demande où est le livre.'],
  [
    'Imagine un échange de deux répliques pour demander de l’aide poliment.',
    'Can you help me, please? peut être suivi de Yes, of course.',
  ],
  [
    'Présente un personnage en trois idées : son nom, ce qu’il aime et une activité.',
    'On cherche à communiquer ; aucune reconnaissance vocale automatique ne te note.',
  ],
]);
series('rights-respect', 'citizenship', 'Respect, égalité et consentement', [
  [
    'Une personne dit non à un jeu. Que peut-on faire ?',
    'respecter son choix',
    ['l’obliger', 'se moquer'],
    'Le choix de participer doit être respecté.',
  ],
  [
    'Un camarade ne peut pas accéder à un lieu. Une réponse utile est…',
    'chercher un aménagement avec un adulte',
    ['l’exclure', 'dire que cela ne compte pas'],
    'L’accessibilité aide à rendre les activités plus inclusives.',
  ],
  [
    'Avant de publier la photo d’une personne, on doit…',
    'demander son accord et respecter les règles applicables',
    ['publier sans rien demander', 'supposer qu’un sourire suffit'],
    'Une image concerne la personne représentée ; on demande l’aide d’un adulte.',
  ],
  [
    'L’égalité entre filles et garçons implique…',
    'les mêmes droits et possibilités',
    ['des métiers obligatoires selon le sexe', 'des préférences imposées'],
    'Les stéréotypes ne doivent pas limiter les choix.',
  ],
  [
    'Un débat respectueux permet…',
    'de discuter les idées sans attaquer les personnes',
    ['d’insulter pour gagner', 'd’empêcher toute différence'],
    'Une argumentation porte sur les raisons et les idées.',
  ],
  [
    'La liberté d’expression s’exerce…',
    'avec des droits et des responsabilités',
    ['sans aucune règle', 'en supprimant tout désaccord'],
    'L’échange respecte les personnes et le cadre commun.',
  ],
]);
series('information', 'citizenship', 'Information, vie privée et esprit critique', [
  [
    'Un mot de passe doit être…',
    'gardé privé',
    ['affiché pour tout le monde', 'identique au prénom dans tous les cas'],
    'Un adulte de confiance peut aider à protéger les accès.',
  ],
  [
    'Un message inconnu demande des informations personnelles. Le bon réflexe est…',
    'en parler à un adulte de confiance',
    ['envoyer toutes les informations', 'répondre au hasard'],
    'On évite de communiquer des données sans vérifier la situation.',
  ],
  [
    'Quelle question aide à examiner une information ?',
    'Qui l’a publiée et sur quoi s’appuie-t-elle ?',
    ['Est-elle écrite en gros ?', 'Est-elle très répétée ?'],
    'La source et les éléments vérifiables comptent.',
  ],
  [
    'Un fait et une opinion…',
    'ne jouent pas le même rôle',
    ['sont toujours identiques', 'ne peuvent jamais être distingués'],
    'Une opinion exprime un point de vue ; un fait peut être confronté à des éléments observables.',
  ],
  [
    'Une image en ligne peut être trompeuse si…',
    'son contexte ou sa date sont modifiés',
    ['elle a plusieurs couleurs', 'elle est petite'],
    'Le contexte change la façon de comprendre une image.',
  ],
  [
    'Pour comparer deux affirmations contradictoires, on peut…',
    'chercher des sources indépendantes et des preuves',
    ['choisir seulement la plus populaire', 'croire la première lue'],
    'On examine les raisons, les méthodes et les sources.',
  ],
]);
missions('art-making', 'arts', 'Créer et décrire des images', [
  [
    'Choisis deux couleurs pour imaginer un jardin. Dis ce qu’elles te font penser.',
    'Plusieurs réponses sont possibles ; il s’agit d’explorer une intention.',
  ],
  [
    'Imagine une créature avec des formes simples. Tu peux la décrire ou la dessiner si tu le souhaites.',
    'Des cercles, rectangles et triangles peuvent se combiner.',
  ],
  [
    'Compare deux images autour de toi : que remarques-tu dans leur cadrage ?',
    'Le cadrage choisit ce que l’on montre et ce que l’on laisse hors de l’image.',
  ],
  [
    'Prépare une petite création avec du papier déjà utilisé, avec un adulte si nécessaire. Tu peux aussi décrire ton projet.',
    'Le choix des matériaux peut transformer l’effet produit.',
  ],
  [
    'Imagine deux façons de représenter le même lieu : réaliste et imaginaire.',
    'Une représentation ne se limite pas à reproduire exactement ce que l’on voit.',
  ],
  [
    'Présente une création en expliquant une intention et un choix de forme, couleur ou matériau.',
    'Expliquer un choix permet de partager sa démarche artistique.',
  ],
]);
missions('music', 'arts', 'Écouter et inventer en musique', [
  [
    'Avec un adulte, écoute un court morceau que tu aimes. Décris une impression.',
    'Une écoute peut susciter des impressions différentes.',
  ],
  [
    'Repère dans un morceau un son grave et un son aigu.',
    'Grave et aigu décrivent la hauteur du son.',
  ],
  [
    'Écoute si la musique semble rapide ou lente, puis explique ton impression.',
    'Le tempo concerne la vitesse de la pulsation.',
  ],
  [
    'Invente un petit rythme de quatre sons en les disant, sans obligation de frapper ou de bouger.',
    'On peut varier les durées et les silences.',
  ],
  [
    'Compare deux interprétations d’une même chanson avec un adulte.',
    'Voix, instruments, tempo et intensité peuvent différer.',
  ],
  [
    'Imagine une courte ambiance sonore pour une scène du château et explique tes choix.',
    'Une création sonore peut utiliser voix, objets ou instruments, selon le contexte.',
  ],
]);
missions('art-history', 'arts', 'Rencontrer des œuvres et les situer', [
  [
    'Choisis une image d’œuvre dans un livre ou avec un adulte. Décris ce que tu vois.',
    'Observer précède l’interprétation.',
  ],
  [
    'Cherche avec un adulte le nom de l’artiste et le titre d’une œuvre que tu apprécies.',
    'Ces informations aident à identifier l’œuvre.',
  ],
  [
    'Demande de quelle époque date une œuvre et place-la approximativement avant ou après une autre.',
    'Un repère temporel aide à situer les créations.',
  ],
  [
    'Compare une peinture et une photographie d’un même thème.',
    'Les techniques et les intentions peuvent produire des effets différents.',
  ],
  [
    'Relie une œuvre à son contexte avec l’aide d’un adulte ou d’une notice.',
    'Le contexte peut éclairer certains choix de l’artiste.',
  ],
  [
    'Présente une œuvre en distinguant description, contexte et avis personnel.',
    'On peut apprécier différemment une œuvre tout en échangeant des raisons.',
  ],
]);
series('sport-rules', 'sport', 'Coopérer et comprendre les activités physiques', [
  [
    'Dans un jeu d’équipe, une règle commune sert notamment à…',
    'permettre de jouer ensemble',
    ['exclure au hasard', 'changer le résultat après coup'],
    'Les règles rendent l’activité compréhensible et partagée.',
  ],
  [
    'Avant une activité physique, on vérifie avec l’adulte…',
    'les consignes et un espace adapté',
    ['seulement la couleur des vêtements', 'le nombre de publicités'],
    'L’organisation dépend de l’activité et des besoins des participants.',
  ],
  [
    'Dans une course, que mesure-t-on habituellement pour comparer deux temps ?',
    'une durée',
    ['une masse', 'une température'],
    'Le chronométrage concerne une durée ; aucun chronomètre n’est imposé ici.',
  ],
  [
    'En activité d’orientation, une carte sert à…',
    'se repérer et préparer un déplacement',
    ['mesurer la force', 'garantir qu’aucune erreur n’existe'],
    'Les repères du terrain se mettent en relation avec ceux de la carte.',
  ],
  [
    'Un rôle d’arbitre demande notamment…',
    'd’appliquer les règles de façon équitable',
    ['de favoriser son équipe', 'de changer chaque règle sans prévenir'],
    'L’arbitrage contribue à l’équité du jeu.',
  ],
  [
    'Pour rendre une activité plus inclusive, on peut…',
    'adapter les règles ou le matériel avec l’adulte',
    ['exiger la même performance de tous', 'exclure toute différence'],
    'Les adaptations se réfléchissent selon les objectifs et les participants.',
  ],
]);
missions('sport-practice', 'sport', 'Une pratique à choisir avec un adulte', [
  [
    'Avec un adulte, nomme une activité physique que tu aimes ou aimerais observer.',
    'Cette carte ne demande aucun exercice corporel.',
  ],
  [
    'Observe un jeu ou une activité et explique son but.',
    'On peut apprendre à distinguer le but et les règles.',
  ],
  [
    'Avec un adulte, repère un rôle utile dans une activité collective : joueur, observateur, arbitre…',
    'Les rôles se complètent.',
  ],
  [
    'Discute d’un trajet d’orientation simple sur un plan, sans devoir le réaliser.',
    'Les repères aident à préparer un déplacement.',
  ],
  [
    'Avec l’adulte qui t’accompagne, imagine une adaptation qui permettrait à plus de personnes de participer.',
    'Une pratique réelle doit rester adaptée à la situation de chacun.',
  ],
  [
    'Si une activité physique est déjà prévue avec un adulte, échangez après sur une stratégie ou une coopération. Sinon, choisis simplement une autre carte.',
    'Le jeu ne prescrit ni entraînement, ni effort, ni performance corporelle.',
  ],
]);
// Make a separate English listening button read English, not French phonetic approximations.
for (const a of SCHOOL_ACTIVITIES.filter((a) => a.group === 'english' && a.type === 'choice')) {
  a.audio =
    a.prompt.match(/« (.*?) »/)?.[1] ||
    a.options.filter((x) => /^[A-Za-z !?]+$/.test(x)).join('. ');
  a.audioLang = 'en-GB';
}
export const COVERAGE_NOTES = {
  principle:
    'Les domaines ci-dessous sont abordés par des activités courtes. Ce repérage ne garantit ni une couverture exhaustive de tous les objectifs, ni leur acquisition.',
  practical:
    'Oral, rédaction, œuvres complètes, constructions, arts et pratique physique nécessitent aussi des situations accompagnées. Les missions ne sont pas évaluées automatiquement. L’écriture manuscrite n’est pas entraînée par le jeu.',
  schedule:
    'CM2 2026–2027 : français et mathématiques 2025 ; autres domaines selon le tableau officiel Éduscol. Les nouveaux programmes d’histoire-géographie et d’EPS de 2026 s’appliqueront au CM2 à la rentrée 2027.',
  logic:
    'Les énigmes sont des jeux de raisonnement originaux. Aucun score de QI, diagnostic ou étalonnage national n’est calculé.',
};
numeric('decimal-product', 'maths', 'Multiplier un décimal par un entier', (t, v) => {
  const a = dec((12 + t * 7 + v) / 10),
    b = 2 + t;
  return {
    prompt: `Calcule ${fmt(a)} × ${b}.`,
    answer: a * b,
    explanation: `On peut multiplier ${a * 10} dixièmes par ${b}, puis exprimer le résultat en unités : ${fmt(a * b)}.`,
  };
});
numeric('decimal-quotient', 'maths', 'Quotients décimaux simples', (t, v) => {
  const d = 2 + t,
    q = dec(1.5 + v / 2),
    n = d * q;
  return {
    prompt: `Une ficelle de ${fmt(n)} m est partagée en ${d} morceaux égaux. Quelle longueur pour chacun, en m ?`,
    answer: q,
    explanation: `${fmt(q)} × ${d} = ${fmt(n)}. Chaque morceau mesure ${fmt(q)} m.`,
  };
});
numeric('missing-number', 'maths', 'Égalités et nombres inconnus', (t, v) => {
  const a = 4 + v,
    b = 6 + t * 8 + v;
  return {
    prompt: `Quel nombre remplace l’étoile dans ★ + ${a} = ${b + a} ?`,
    answer: b,
    explanation: `On cherche l’addend manquant : ${b + a} − ${a} = ${b}. On vérifie ${b} + ${a} = ${b + a}.`,
  };
});
numeric('volume-cubes', 'measures', 'Assemblages et premiers volumes', (t, v) => {
  const l = 2 + (v % 3),
    w = 2 + (t % 2),
    h = t < 2 ? 1 : t - 1;
  return {
    prompt: `Un assemblage a ${h} couche(s) de ${l} × ${w} petits cubes. Combien de cubes en tout ?`,
    answer: l * w * h,
    explanation: `Chaque couche contient ${l * w} cubes. Avec ${h} couche(s), on en compte ${l * w * h}. Si chaque cube mesure 1 cm³, c’est aussi le volume en cm³.`,
  };
});
series('estimate', 'numbers', 'Estimer et contrôler un résultat', [
  ['29 + 31 est proche de…', '60', ['6', '600'], '30 + 30 = 60 donne un ordre de grandeur.'],
  ['198 + 203 est proche de…', '400', ['40', '4 000'], '200 + 200 = 400.'],
  ['49 × 6 est proche de…', '300', ['30', '3 000'], '50 × 6 = 300.'],
  [
    'Une pomme pèse plutôt…',
    'environ 150 g',
    ['environ 150 kg', 'environ 150 tonnes'],
    'On compare avec des masses usuelles.',
  ],
  ['12,4 × 8 est proche de…', '100', ['10', '1 000'], '12,5 × 8 = 100 est un repère proche.'],
  [
    'Si un calcul de monnaie donne plus que la somme payée pour un achat positif, on doit…',
    'revoir le calcul',
    ['l’accepter sans regarder', 'ajouter encore le prix'],
    'Le contexte aide à contrôler si le résultat est plausible.',
  ],
]);
const verbRows = [
  ['être', 'suis|es|est|sommes|êtes|sont', 'ét', 'ser', 'été', 'fus|fus|fut|fûmes|fûtes|furent'],
  ['avoir', 'ai|as|a|avons|avez|ont', 'av', 'aur', 'eu', 'eus|eus|eut|eûmes|eûtes|eurent'],
  [
    'chanter',
    'chante|chantes|chante|chantons|chantez|chantent',
    'chant',
    'chanter',
    'chanté',
    'chantai|chantas|chanta|chantâmes|chantâtes|chantèrent',
  ],
  [
    'finir',
    'finis|finis|finit|finissons|finissez|finissent',
    'finiss',
    'finir',
    'fini',
    'finis|finis|finit|finîmes|finîtes|finirent',
  ],
  [
    'aller',
    'vais|vas|va|allons|allez|vont',
    'all',
    'ir',
    'allé',
    'allai|allas|alla|allâmes|allâtes|allèrent',
  ],
  [
    'faire',
    'fais|fais|fait|faisons|faites|font',
    'fais',
    'fer',
    'fait',
    'fis|fis|fit|fîmes|fîtes|firent',
  ],
  [
    'dire',
    'dis|dis|dit|disons|dites|disent',
    'dis',
    'dir',
    'dit',
    'dis|dis|dit|dîmes|dîtes|dirent',
  ],
  [
    'venir',
    'viens|viens|vient|venons|venez|viennent',
    'ven',
    'viendr',
    'venu',
    'vins|vins|vint|vînmes|vîntes|vinrent',
  ],
  [
    'pouvoir',
    'peux|peux|peut|pouvons|pouvez|peuvent',
    'pouv',
    'pourr',
    'pu',
    'pus|pus|put|pûmes|pûtes|purent',
  ],
  [
    'voir',
    'vois|vois|voit|voyons|voyez|voient',
    'voy',
    'verr',
    'vu',
    'vis|vis|vit|vîmes|vîtes|virent',
  ],
  [
    'vouloir',
    'veux|veux|veut|voulons|voulez|veulent',
    'voul',
    'voudr',
    'voulu',
    'voulus|voulus|voulut|voulûmes|voulûtes|voulurent',
  ],
  [
    'prendre',
    'prends|prends|prend|prenons|prenez|prennent',
    'pren',
    'prendr',
    'pris',
    'pris|pris|prit|prîmes|prîtes|prirent',
  ],
];
for (const [verb, present, stem, future, part, simple] of verbRows) {
  const skill = `verb-bank-${verb}`;
  register(skill, 'grammar', `Le verbe ${verb} : six temps`);
  const subjects = ['Je', 'Tu', 'Il', 'Nous', 'Vous', 'Ils'];
  for (let tier = 0; tier < 6; tier++)
    for (let v = 0; v < 6; v++) {
      const tense = [
        'présent',
        'imparfait',
        'futur',
        'passé composé',
        'passé simple',
        'plus-que-parfait',
      ][tier];
      let form;
      if (tier === 0) form = present.split('|')[v];
      else if (tier === 1) form = stem + ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'][v];
      else if (tier === 2) form = future + ['ai', 'as', 'a', 'ons', 'ez', 'ont'][v];
      else if (tier === 4) form = simple.split('|')[v];
      else {
        const aux = verb === 'aller' || verb === 'venir' ? 'être' : 'avoir',
          auxForms =
            tier === 3
              ? aux === 'être'
                ? 'suis|es|est|sommes|êtes|sont'
                : 'ai|as|a|avons|avez|ont'
              : aux === 'être'
                ? 'étais|étais|était|étions|étiez|étaient'
                : 'avais|avais|avait|avions|aviez|avaient';
        form = auxForms.split('|')[v] + ' ' + part + (aux === 'être' && v >= 3 ? 's' : '');
      }
      choice(
        skill,
        'grammar',
        `Les temps du récit : ${verb}`,
        tier,
        v,
        `${tense === 'imparfait' ? 'À l’imparfait' : `Au ${tense}`}, quelle forme complète « ${beforeVerb(subjects[v], form)}… » avec ${verb}${(verb === 'aller' || verb === 'venir') && [3, 5].includes(tier) ? ' (accord au masculin)' : ''} ?`,
        form,
        [verb, tier === 0 ? stem + 'ais' : present.split('|')[v]],
        `${beforeVerb(subjects[v], form)}${form} est la forme attendue ${atTense(tense)}. ${tier === 3 || tier === 5 ? 'Ce temps composé réunit un auxiliaire et un participe passé.' : 'Le verbe varie avec la personne et le temps.'}`,
      );
    }
}

for (const a of SCHOOL_ACTIVITIES.filter((a) => a.group === 'english')) {
  if (a.skill === 'english-words')
    a.audio = ['cat. dog. bird.', 'blue', 'twelve', 'between', 'usually', 'because'][a.tier];
  if (a.skill === 'english-speaking')
    a.audio = [
      'Hello!',
      'My name is Mousse.',
      'I like books.',
      'Where is the book?',
      'Can you help me, please? Yes, of course.',
      'My name is Plume. I like books. I am reading.',
    ][a.tier];
  a.audioLang = 'en-GB';
}
