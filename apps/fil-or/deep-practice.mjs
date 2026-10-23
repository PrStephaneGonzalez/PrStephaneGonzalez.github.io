// Original tasks: rungs change the operation or the linguistic obstacle.
export const DEEP_SKILLS = [
  {
    id: 'written-operations',
    group: 'maths',
    route: 'math',
    label: 'Poser et comprendre les opérations',
    stages: [
      'Additionner sans retenue',
      'Additionner avec retenues',
      'Soustraire avec échanges',
      'Multiplier par un chiffre',
      'Multiplier par deux chiffres',
      'Opérations avec des décimaux',
    ],
  },
  {
    id: 'geometry-properties',
    group: 'geometry',
    route: 'math',
    label: 'Chercher avec les propriétés des figures',
    stages: [
      'Côtés et sommets',
      'Comparer des angles',
      'Propriétés des quadrilatères',
      'Coordonnées et symétrie',
      'Programmes de construction',
      'Vérifier une construction',
    ],
  },
  {
    id: 'sentence-transform',
    group: 'writing',
    route: 'language',
    label: 'Écrire et transformer une phrase',
    stages: [
      'Remplacer le sujet',
      'Mettre au pluriel',
      'Accorder au féminin',
      'Changer de temps',
      'Remplacer par un pronom',
      'Réviser deux accords',
    ],
  },
];
const fmt = (n) => String(Number(n.toFixed(6))).replace('.', ',');
const coloredTokens = (n, color) => `${n} jeton${n > 1 ? 's' : ''} ${color}${n > 1 ? 's' : ''}`;
const chances = (n, total) => `${n} chance${n > 1 ? 's' : ''} sur ${total}`;
const normalize = (s) =>
  String(s)
    .normalize('NFC')
    .trim()
    .toLocaleLowerCase('fr')
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, ' ');
export const normalizeWrittenAnswer = normalize;
export function typedCorrect(a, value) {
  return (a.accepted || [a.answer]).some((answer) => normalize(answer) === normalize(value));
}
export function upgradeActivities(source) {
  return source.map((original) => {
    const a = { ...original };
    const v = Number(a.id.split('-').at(-1)) || 0,
      t = a.tier;
    if (a.skill === 'integer-place' && t === 5) {
      const d = 2 + v,
        n = d * 1e6 + 37;
      Object.assign(a, {
        prompt: `Dans ${n.toLocaleString('fr-FR')}, quelle est la valeur du chiffre ${d} placé le plus à gauche ?`,
        answer: String(d * 1e6),
        explanation: `Le chiffre ${d} est au rang des millions : il vaut ${d} 000 000.`,
      });
    }
    if (a.skill === 'fraction-meaning') {
      const d = [2, 3, 4, 5, 6, 8][v % 6],
        n = 1 + (v % (d - 1));
      const base = {
        type: 'choice',
        prompt: 'Quelle fraction de la bande est colorée ?',
        answer: `${n}/${d}`,
        options: [`${n}/${d}`, `${d}/${n}`, `${n}/${d + 1}`],
        visual: { kind: 'fraction', parts: d, lit: n },
        explanation: `L’unité est partagée en ${d} parts égales ; ${n} sont colorées. On écrit ${n}/${d}.`,
        stageLabel: 'Lire un partage en parts égales',
      };
      if (t === 1)
        Object.assign(base, {
          prompt: `Une unité est partagée en ${d + 2} parts égales. On en colore ${n + 1}. Écris la fraction colorée.`,
          answer: `${n + 1}/${d + 2}`,
          type: 'text',
          options: undefined,
          visual: undefined,
          explanation: `Le nombre de parts colorées est le numérateur ; le nombre de parts égales de l’unité est le dénominateur : ${n + 1}/${d + 2}.`,
          stageLabel: 'Écrire une fraction',
        });
      if (t === 2)
        Object.assign(base, {
          prompt: `Quelle fraction est la plus grande : ${n}/${d + 3} ou ${n + 2}/${d + 3} ?`,
          answer: `${n + 2}/${d + 3}`,
          options: [`${n + 2}/${d + 3}`, `${n}/${d + 3}`, 'Elles sont égales'],
          visual: undefined,
          explanation: `Les parts ont la même taille. ${n + 2} parts représentent plus que ${n} parts.`,
          stageLabel: 'Comparer à dénominateur commun',
        });
      if (t === 3)
        Object.assign(base, {
          prompt: `Complète : ${n}/${d} = …/${d * 2}. Écris seulement le numérateur manquant.`,
          answer: String(n * 2),
          type: 'numeric',
          options: undefined,
          visual: undefined,
          explanation: `Chaque part est coupée en deux. On multiplie aussi le nombre de parts prises par deux : ${n} × 2 = ${n * 2}.`,
          stageLabel: 'Trouver une fraction équivalente',
        });
      if (t === 4) {
        const whole = 1 + (v % 3),
          num = whole * d + n;
        Object.assign(base, {
          prompt: `${num} parts, chacune de taille 1/${d} de gâteau, représentent ${num}/${d} gâteaux. Combien d’unités ENTIÈRES contient cette quantité ?`,
          answer: String(whole),
          type: 'numeric',
          options: undefined,
          visual: undefined,
          explanation: `${num}/${d} = ${whole} + ${n}/${d}. Il y a ${whole} unité(s) entière(s) et ${n}/${d} d’une autre.`,
          stageLabel: 'Dépasser une unité',
        });
      }
      if (t === 5) {
        const [num, den] = [
          [1, 10],
          [25, 100],
          [4, 10],
          [125, 1000],
          [70, 100],
          [150, 100],
        ][v];
        Object.assign(base, {
          prompt: `Écris sous forme décimale ${num}/${den}.`,
          answer: fmt(num / den),
          type: 'numeric',
          options: undefined,
          visual: undefined,
          explanation: `On compte des ${den === 10 ? 'dixièmes' : den === 100 ? 'centièmes' : 'millièmes'}. ${num}/${den} = ${fmt(num / den)}.`,
          stageLabel: 'Relier fraction et décimal',
        });
      }
      Object.assign(a, base);
    }
    if (a.skill === 'missing-number') {
      const x = 8 + v,
        b = 3 + v;
      const equations = [
        `★ + ${b} = ${x + b}`,
        `${x + b} − ★ = ${b}`,
        `★ × ${b} = ${x * b}`,
        `${x * b} ÷ ★ = ${b}`,
        `★ × ${b} + 4 = ${x * b + 4}`,
        `2 × ★ + ${b} = ★ + ${x + b}`,
      ];
      Object.assign(a, {
        prompt: `Quel nombre remplace l’étoile dans ${equations[t]} ?`,
        answer: String(x),
        stageLabel: [
          'Addend manquant',
          'Nombre retiré inconnu',
          'Facteur manquant',
          'Diviseur manquant',
          'Deux opérations successives',
          'Même inconnue des deux côtés',
        ][t],
        explanation: `On peut remplacer chaque étoile par ${x} et vérifier les deux côtés de l’égalité. ${t === 5 ? `Après avoir retiré une étoile et ${b} des deux côtés, il reste ★ = ${x}.` : 'On remonte les opérations avec l’opération inverse.'}`,
      });
    }
    if (a.skill === 'proportion') {
      const p = 3 + v,
        n = 2 + v;
      const rows = [
        [
          `Un carnet coûte ${p} €. Combien coûtent trois carnets identiques ?`,
          3 * p,
          `On triple la quantité : 3 × ${p} = ${3 * p}.`,
        ],
        [
          `Quatre carnets identiques coûtent ${4 * p} €. Combien coûte un carnet ?`,
          p,
          `On partage ${4 * p} en quatre : ${4 * p} ÷ 4 = ${p}.`,
        ],
        [
          `Deux rubans identiques mesurent ensemble ${2 * n} m. Combien mesurent six de ces rubans ?`,
          6 * n,
          `Six rubans, c’est trois fois deux rubans : ${2 * n} × 3 = ${6 * n}.`,
        ],
        [
          `Trois fioles contiennent ${3 * n} cL. Deux fioles contiennent ${2 * n} cL. Combien contiennent cinq fioles identiques ?`,
          5 * n,
          `On réunit les deux groupes : ${3 * n} + ${2 * n} = ${5 * n}.`,
        ],
        [
          `Pour quatre élèves, on utilise ${4 * n * 10} g de farine. Combien faut-il de grammes pour six élèves avec la même recette ?`,
          6 * n * 10,
          `Six, c’est quatre plus la moitié de quatre : ${4 * n * 10} + ${2 * n * 10} = ${6 * n * 10}.`,
        ],
        [
          `Un loueur demande ${p} € fixes puis 2 € par heure. Pour deux heures, on paie ${p + 4} €. Pour quatre heures, quel prix total en euros ?`,
          p + 8,
          `On ajoute les frais fixes une seule fois : ${p} + 4 × 2 = ${p + 8}. Le prix total n’est pas proportionnel à la durée.`,
        ],
      ][t];
      Object.assign(a, {
        prompt: rows[0],
        answer: String(rows[1]),
        explanation: rows[2],
        stageLabel: [
          'Multiplier une quantité',
          'Passer à l’unité',
          'Changer de groupement',
          'Additionner deux groupes',
          'Utiliser une moitié',
          'Repérer une situation non proportionnelle',
        ][t],
      });
    }
    if (a.skill === 'durations') {
      const start = 8 * 60 + 35 + v * 3,
        end = start + 45 + v * 7;
      const h = (n) => `${Math.floor(n / 60) % 24} h ${String(n % 60).padStart(2, '0')}`;
      const rows = [
        [
          `De 9 h ${10 + v} à 9 h ${30 + v * 3}, combien de minutes passent ?`,
          20 + v * 2,
          'On soustrait les minutes, car on reste dans la même heure.',
        ],
        [
          `De ${h(start)} à ${h(end)}, quelle est la durée en minutes ?`,
          end - start,
          'On compte jusqu’à l’heure suivante, puis jusqu’à l’arrivée.',
        ],
        [
          `Un atelier dure ${2 + v} h 15 min. Quelle est sa durée en minutes ?`,
          (2 + v) * 60 + 15,
          'Une heure vaut 60 minutes. On ajoute ensuite les 15 minutes.',
        ],
        [
          `Un train part à ${h(start)}. Il roule ${65 + v * 5} min, puis s’arrête 12 min. Quelle est la durée totale du voyage, arrêt compris, en minutes ?`,
          65 + v * 5 + 12,
          'On additionne le temps de trajet et les 12 minutes d’arrêt. L’heure de départ ne change pas la durée totale.',
        ],
        [
          `Un départ a lieu à 23 h ${40 + v}. L’arrivée est le lendemain à 0 h ${15 + v * 2}. Combien de minutes dure le trajet ?`,
          35 + v,
          'On compte jusqu’à minuit puis jusqu’à l’arrivée.',
        ],
        [
          `Lina lit ${2 + v} min 40 s, puis ${1 + v} min 35 s. Quelle est la durée totale en secondes ?`,
          (3 + 2 * v) * 60 + 75,
          'On convertit chaque minute en 60 secondes avant d’additionner.',
        ],
      ][t];
      Object.assign(a, {
        prompt: rows[0],
        answer: String(rows[1]),
        explanation: `${rows[2]} On obtient ${rows[1]}.`,
        stageLabel: [
          'Dans la même heure',
          'Franchir une heure',
          'Convertir heures et minutes',
          'Ajouter trajet et arrêt',
          'Passer minuit',
          'Calculer avec des secondes',
        ][t],
      });
    }
    if (a.skill === 'money') {
      const p = 125 + v * 15,
        q = 245 + v * 10;
      const rows = [
        [
          `Une plume coûte ${fmt(p / 100)} €. Tu paies 5 €. Quelle monnaie en euros ?`,
          (500 - p) / 100,
        ],
        [
          `Une plume coûte ${fmt(p / 100)} € et un carnet ${fmt(q / 100)} €. Quel prix total en euros ?`,
          (p + q) / 100,
        ],
        [
          `Trois fioles coûtent chacune ${fmt(p / 100)} €. Quel prix total en euros ?`,
          (3 * p) / 100,
        ],
        [
          `Tu achètes deux carnets à ${fmt(q / 100)} € chacun et tu paies 10 €. Quelle monnaie en euros ?`,
          (1000 - 2 * q) / 100,
        ],
        [
          `Un lot de quatre rubans coûte ${fmt((4 * p - 20 - v * 5) / 100)} €. Quatre rubans à l’unité coûtent ${fmt((4 * p) / 100)} €. Quelle économie fait-on avec le lot, en euros ?`,
          (20 + v * 5) / 100,
        ],
        [
          `Un carnet coûte ${fmt(q / 100)} €. Tu as 10 €. Après trois carnets, combien reste-t-il en euros ?`,
          (1000 - 3 * q) / 100,
        ],
      ][t];
      Object.assign(a, {
        prompt: rows[0],
        answer: fmt(rows[1]),
        explanation: `On peut convertir les prix en centimes pour calculer avec des entiers, puis revenir aux euros. Résultat : ${fmt(rows[1])} €.`,
        stageLabel: [
          'Rendre la monnaie',
          'Additionner deux prix',
          'Plusieurs objets identiques',
          'Achat et monnaie',
          'Comparer deux offres',
          'Gérer un budget',
        ][t],
      });
    }
    if (a.skill === 'chance') {
      const red = 2 + v,
        blue = t === 2 ? (v % 3 === 0 ? red : v % 3 === 1 ? red + 1 : red - 1) : 1 + (v % 3),
        total = red + blue;
      const rows = [
        [
          `Un sac contient seulement ${red} jetons rouges. Tirer un ${v % 2 ? 'bleu' : 'rouge'} est…`,
          v % 2 ? 'impossible' : 'certain',
          [v % 2 ? 'certain' : 'impossible', 'incertain'],
          v % 2 ? 'Il n’y a aucun jeton bleu.' : 'Tous les jetons sont rouges.',
        ],
        [
          `Un sac contient ${coloredTokens(red, 'rouge')} et ${coloredTokens(blue, 'bleu')}. Tirer un ${v % 2 ? 'rouge' : 'vert'} est…`,
          v % 2 ? 'possible, sans être certain' : 'impossible',
          [v % 2 ? 'impossible' : 'possible, sans être certain', 'certain'],
          v % 2
            ? 'Il y a des rouges, mais on peut aussi tirer un bleu.'
            : 'Il n’y a aucun jeton vert.',
        ],
        [
          `Un sac contient ${coloredTokens(red, 'rouge')} et ${coloredTokens(blue, 'bleu')}. Quelle couleur a le plus de chances de sortir ?`,
          red === blue ? 'les deux autant' : red > blue ? 'rouge' : 'bleu',
          ['rouge', 'bleu', 'les deux autant'].filter(
            (x) => x !== (red === blue ? 'les deux autant' : red > blue ? 'rouge' : 'bleu'),
          ),
          `On compare les nombres de jetons : ${coloredTokens(red, 'rouge')} et ${coloredTokens(blue, 'bleu')}. Chaque jeton a la même chance d’être pris.`,
        ],
        [
          `Un sac contient ${coloredTokens(red, 'rouge')} et ${coloredTokens(blue, 'bleu')}. Quelle phrase décrit la chance de tirer un bleu ?`,
          chances(blue, total),
          [chances(blue + 1, total), chances(blue, total + 1)],
          `Il y a ${coloredTokens(blue, 'bleu')} parmi ${total} jetons.`,
        ],
        [
          `Un sac contient ${coloredTokens(red, 'rouge')} et ${coloredTokens(blue, 'bleu')}. Un rouge est tiré puis REMIS dans le sac. Au prochain tirage, la chance de rouge…`,
          'reste la même',
          ['augmente', 'diminue'],
          'Remettre le jeton rétablit le contenu initial.',
        ],
        [
          `Un sac contient ${coloredTokens(red, 'rouge')} et ${coloredTokens(blue, 'bleu')}. Un rouge est tiré SANS être remis. Quelle est maintenant la chance de tirer un bleu ?`,
          chances(blue, total - 1),
          [chances(blue, total), chances(blue + 1, total - 1)],
          `Il reste ${total - 1} jetons dont ${coloredTokens(blue, 'bleu')}. On a retiré un rouge, pas un bleu.`,
        ],
      ][t];
      Object.assign(a, {
        prompt: rows[0],
        answer: rows[1],
        options: [rows[1], ...rows[2]],
        explanation: rows[3],
        stageLabel: [
          'Certain ou impossible',
          'Possible et incertain',
          'Comparer les chances',
          'Compter les issues',
          'Avec remise',
          'Sans remise',
        ][t],
      });
    }
    if (a.skill.startsWith('conjug-') || a.skill.startsWith('verb-bank-')) {
      // Existing correct answers come from checked forms. Suppress invented forms entirely.
      if (t >= 1 || a.skill.startsWith('verb-bank-')) {
        a.type = 'text';
        delete a.options;
      } else if (a.options) {
        const lemma = a.prompt.match(/\(([^)]+)\)/)?.[1];
        const valid = source
          .filter((b) => b.skill === 'verb-bank-' + lemma && b.tier === 0 && b.answer !== a.answer)
          .map((b) => b.answer);
        a.options = [a.answer, ...[...new Set(valid)].slice(0, 2)];
        if (a.options.length < 3) {
          a.type = 'text';
          delete a.options;
        }
      }
      a.responseLabel = 'Écris seulement la forme du verbe qui manque.';
      a.hint =
        'Repère le temps et le sujet. Cherche ensuite la forme du verbe qui leur correspond.';
    }
    if (['noun-agreement', 'verb-agreement'].includes(a.skill) && t >= 2) {
      a.type = 'text';
      delete a.options;
      a.responseLabel = 'Écris seulement le mot ou le groupe qui manque.';
    }
    if (a.type === 'text') delete a.options;
    return a;
  });
}
const HOMOPHONES = [
  [
    ['Lina … une baguette.', 'a', 'On peut dire : Lina avait une baguette.'],
    ['Elle va … la bibliothèque.', 'à', 'À introduit ici le lieu.'],
    ['Le livre … ouvert.', 'est', 'On peut remplacer est par était.'],
    ['Lina … Noé lisent.', 'et', 'Et relie les deux sujets.'],
    ['Le chat … faim.', 'a', 'Le verbe avoir indique ici un besoin.'],
    ['Nous rentrons … midi.', 'à', 'À introduit le moment.'],
    ['La cape … douce.', 'est', 'Le verbe être relie cape à douce.'],
    ['Prends la plume … le carnet.', 'et', 'Et relie deux objets à prendre.'],
  ],
  [
    ['Les fioles … rangées.', 'sont', 'On peut remplacer sont par étaient.'],
    ['Lina cherche … chapeau.', 'son', 'Son est placé devant un nom singulier.'],
    ['Les élèves … terminé.', 'ont', 'On peut remplacer ont par avaient.'],
    ['… prépare une potion.', 'On', 'On est le sujet du verbe prépare.'],
    ['Les portes … fermées.', 'sont', 'Le sujet les portes est au pluriel.'],
    ['Noé ferme … livre.', 'son', 'Son accompagne le nom livre.'],
    ['Elles … deux cartes.', 'ont', 'Elles avaient deux cartes.'],
    ['… entend la cloche.', 'On', 'On désigne ici une ou plusieurs personnes.'],
  ],
  [
    ['Regarde … étoiles que je montre !', 'ces', 'Ces sert à montrer.'],
    ['Lina range … propres affaires.', 'ses', 'Ses indique que les affaires lui appartiennent.'],
    ['Noé … prépare pour la fête.', 'se', 'Se accompagne ici le verbe prépare.'],
    ['… grimoire posé devant nous est ancien.', 'Ce', 'Ce désigne le grimoire.'],
    ['Lina a perdu … deux gants.', 'ses', 'Les gants appartiennent à Lina.'],
    ['… arbres que tu montres sont très hauts.', 'Ces', 'Ces sert à montrer les arbres.'],
    ['La chouette … pose sur la branche.', 'se', 'Se pose est le verbe se poser.'],
    ['… matin, la porte est ouverte.', 'Ce', 'Ce accompagne le nom matin.'],
  ],
  [
    ['… une chouette, pas un hibou.', 'C’est', 'On peut dire : cela est une chouette.'],
    ['Lina … lavé les mains.', 's’est', 'Lina a fait l’action de se laver les mains.'],
    ['… le livre dont je t’ai parlé.', 'C’est', 'Cela est le livre dont je t’ai parlé.'],
    ['Le chat … caché sous la table.', 's’est', 'Il s’agit du verbe se cacher au passé composé.'],
    ['… difficile de lire dans le noir.', 'C’est', 'Cela est difficile.'],
    ['La porte … refermée toute seule.', 's’est', 'Il s’agit du verbe se refermer.'],
    ['… ici que commence le chemin.', 'C’est', 'Cela est ici que commence le chemin.'],
    ['Noé … installé près de Lina.', 's’est', 'Noé a fait l’action de s’installer.'],
  ],
  [
    [
      'Chaque élève a un livre. Ils ouvrent … livre.',
      'leur',
      'Un livre par élève : le nom livre est au singulier.',
    ],
    [
      'Les élèves emportent chacun deux livres. Ils rangent … livres.',
      'leurs',
      'Le nom livres est au pluriel.',
    ],
    [
      'Lina parle aux élèves. Elle … explique la règle.',
      'leur',
      'Le pronom leur placé devant un verbe ne prend pas de s.',
    ],
    [
      'Les chouettes ont chacune deux ailes. Elles ouvrent … ailes.',
      'leurs',
      'Ailes est au pluriel.',
    ],
    [
      'Chaque enfant porte un chapeau. Ils retirent … chapeau.',
      'leur',
      'Chapeau reste au singulier dans cette phrase.',
    ],
    ['Noé voit ses amis. Il … donne une carte.', 'leur', 'Le pronom leur signifie à ses amis.'],
    [
      'Les élèves préparent plusieurs potions chacun. Voici … potions.',
      'leurs',
      'Potions est au pluriel.',
    ],
    [
      'Les enfants écoutent. Lina … raconte une histoire.',
      'leur',
      'Le pronom leur est invariable.',
    ],
  ],
  [
    ['… beau château !', 'Quel', 'Quel s’accorde avec le nom masculin singulier château.'],
    ['… belles étoiles !', 'Quelles', 'Quelles s’accorde avec étoiles, féminin pluriel.'],
    [
      'Je crois … viendra demain.',
      'qu’elle',
      'On peut remplacer elle par il : je crois qu’il viendra.',
    ],
    ['… porte faut-il ouvrir ?', 'Quelle', 'Quelle s’accorde avec porte, féminin singulier.'],
    ['Le livre est posé …, près de toi.', 'là', 'Là indique un lieu.'],
    ['Lina avait la clé ; elle … rangée.', 'l’a', 'L’a réunit le pronom l’ et le verbe avoir.'],
    ['… chemins mènent au lac ?', 'Quels', 'Quels s’accorde avec chemins, masculin pluriel.'],
    ['Noé pense … a raison.', 'qu’elle', 'Qu’elle réunit que et elle.'],
  ],
];
export function deepenHomophones(source) {
  const out = source.filter((a) => a.skill !== 'homophones');
  HOMOPHONES.forEach((rows, t) =>
    rows.forEach(([sentence, answer, explanation], v) => {
      out.push({
        id: v === 0 ? `school-homophones-${t}-0` : `deep-homophones-${t}-${v}`,
        skill: 'homophones',
        group: 'words',
        route: 'language',
        tier: t,
        title: 'Choisir et écrire les mots qui se ressemblent',
        stageLabel: [
          'a / à · et / est',
          'son / sont · on / ont',
          'ces / ses · ce / se',
          'c’est / s’est',
          'leur / leurs',
          'quel · qu’elle · là / l’a',
        ][t],
        type: t === 0 ? 'choice' : 'text',
        prompt: `Complète : « ${sentence} »`,
        answer,
        explanation,
        responseLabel: 'Écris seulement le mot ou le groupe qui manque.',
        ...(t === 0
          ? {
              options: [
                answer,
                ...(answer === 'a'
                  ? ['à', 'as']
                  : answer === 'à'
                    ? ['a', 'as']
                    : answer === 'et'
                      ? ['est', 'es']
                      : ['et', 'es']),
              ],
            }
          : {}),
      });
    }),
  );
  return out;
}
export const DEEP_ACTIVITIES = [];
function add(skill, t, v, q) {
  const s = DEEP_SKILLS.find((s) => s.id === skill);
  DEEP_ACTIVITIES.push({
    id: `deep-${skill}-${t}-${v}`,
    skill,
    group: s.group,
    route: s.route,
    tier: t,
    title: s.label,
    stageLabel: s.stages[t],
    ...q,
    answer: String(q.answer),
  });
}
for (let t = 0; t < 6; t++)
  for (let v = 0; v < 8; v++) {
    const n = 3 + v;
    let q;
    if (t === 0)
      q = {
        type: 'numeric',
        prompt: 'Combien de sommets possède ce polygone ?',
        answer: n,
        visual: { kind: 'polygon-count', sides: n, rotation: v * 11 },
        explanation: `Un sommet est le point de rencontre de deux côtés. On en compte ${n} en faisant une fois le tour.`,
      };
    if (t === 1) {
      const degrees = [30, 45, 60, 90, 110, 120, 150, 180][v],
        answer =
          degrees < 90 ? 'aigu' : degrees === 90 ? 'droit' : degrees === 180 ? 'plat' : 'obtus';
      q = {
        type: 'choice',
        prompt: 'Compare cet angle à un angle droit. Comment le nomme-t-on ?',
        answer,
        options: ['aigu', 'droit', 'obtus', 'plat'],
        visual: { kind: 'angle-compare', degrees },
        explanation: `Cet angle mesure ${degrees}°. ${degrees < 90 ? 'Il est plus petit qu’un angle droit.' : degrees === 90 ? 'C’est un angle droit.' : degrees === 180 ? 'Il forme une ligne droite.' : 'Il est plus grand qu’un angle droit et plus petit qu’un angle plat.'}`,
      };
    }
    if (t === 2) {
      const rows = [
        [
          `Un quadrilatère a quatre côtés de ${n} cm et quatre angles droits. Quel nom précis lui donne-t-on ?`,
          'un carré',
          ['un rectangle non carré', 'un triangle'],
          'Les quatre côtés égaux et les quatre angles droits définissent un carré.',
        ],
        [
          `Un quadrilatère a quatre angles droits et deux côtés consécutifs de ${n} cm et ${n + 2} cm. C’est…`,
          'un rectangle non carré',
          ['un carré', 'un losange non carré'],
          'Les côtés consécutifs n’ont pas la même longueur ; les quatre angles sont droits.',
        ],
        [
          `Un quadrilatère a quatre côtés de ${n} cm et aucun angle droit. C’est…`,
          'un losange non carré',
          ['un carré', 'un rectangle'],
          'Ses quatre côtés sont égaux ; l’absence d’angle droit exclut le carré.',
        ],
        [
          `Un triangle a trois côtés de ${n} cm. C’est un triangle…`,
          'équilatéral',
          ['rectangle', 'avec trois côtés de longueurs différentes'],
          'Un triangle équilatéral a trois côtés de même longueur.',
        ],
        [
          `Un triangle a deux côtés de ${n} cm et un troisième de ${n + 1} cm. C’est un triangle…`,
          'isocèle non équilatéral',
          ['équilatéral', 'avec trois côtés différents'],
          'Il a exactement deux côtés égaux.',
        ],
        [
          `Un carré de côté ${n} cm possède-t-il nécessairement quatre angles droits ?`,
          'oui',
          ['non', 'cela dépend de sa position'],
          'Tourner la figure ne change pas ses angles droits.',
        ],
        [
          `Un losange de côté ${n} cm possède-t-il nécessairement quatre angles droits ?`,
          'non',
          ['oui', 'seulement si le côté dépasse 5 cm'],
          'Un losange peut avoir des angles non droits. Les longueurs égales ne suffisent pas.',
        ],
        [
          `Un rectangle de longueur ${n + 2} cm et de largeur ${n} cm a-t-il quatre côtés égaux ?`,
          'non',
          ['oui', 'cela dépend de sa position'],
          'Les côtés opposés sont égaux, mais la longueur diffère de la largeur.',
        ],
      ][v];
      q = {
        type: 'choice',
        prompt: rows[0],
        answer: rows[1],
        options: [rows[1], ...rows[2]],
        explanation: rows[3],
      };
    }
    if (t === 3) {
      const vertical = v % 2 === 0;
      q = {
        type: 'numeric',
        prompt: `Sur un quadrillage, l’axe ${vertical ? 'vertical passe par la colonne' : 'horizontal passe par la ligne'} 12. Un point est sur la ${vertical ? 'colonne' : 'ligne'} ${12 + n}. Sur quelle ${vertical ? 'colonne' : 'ligne'} se trouve son symétrique ?`,
        answer: 12 - n,
        explanation: `Le point est à ${n} carreaux d’un côté de l’axe. Son symétrique est à ${n} carreaux de l’autre côté : 12 − ${n} = ${12 - n}.`,
      };
    }
    if (t === 4) {
      const rows = [
        [
          `ABCD est un rectangle, nommé dans l’ordre des sommets. AB = ${n + 3} cm et BC = ${n} cm. Quelle longueur doit mesurer CD, en cm ?`,
          n + 3,
          'Les côtés opposés d’un rectangle sont égaux : CD = AB.',
        ],
        [
          `On trace un cercle de centre O et de rayon ${n} cm. A est un point du cercle. Quelle est la longueur OA, en cm ?`,
          n,
          'Tous les points du cercle sont à la distance du rayon de son centre.',
        ],
        [
          `Un carré a un périmètre de ${4 * n} cm. Quelle longueur faut-il donner à chacun de ses côtés, en cm ?`,
          n,
          'Ses quatre côtés sont égaux : on partage le périmètre en quatre.',
        ],
        [
          `On construit le symétrique d’un point situé à ${n} cm de l’axe. Quelle distance sépare le point et son symétrique, en cm ?`,
          2 * n,
          'Il y a la même distance de chaque côté de l’axe. On double la distance à l’axe.',
        ],
        [
          `Pour construire un cercle de diamètre ${2 * n} cm, à combien de centimètres faut-il ouvrir le compas ?`,
          n,
          'L’ouverture du compas est le rayon, moitié du diamètre.',
        ],
        [
          `Dans un rectangle ABCD, BC mesure ${n} cm. Quelle longueur faut-il donner à AD, en cm ?`,
          n,
          'AD et BC sont des côtés opposés du rectangle.',
        ],
        [
          `Un triangle équilatéral doit avoir un périmètre de ${3 * n} cm. Quelle longueur doit-on mesurer pour chaque côté, en cm ?`,
          n,
          'On partage le périmètre entre les trois côtés égaux.',
        ],
        [
          `Un cercle est tracé avec une ouverture de compas de ${n} cm. Quel est son diamètre, en cm ?`,
          2 * n,
          'Le diamètre vaut deux rayons.',
        ],
      ][v];
      q = { type: 'numeric', prompt: rows[0], answer: rows[1], explanation: rows[2] };
    }
    if (t === 5) {
      const rows = [
        [
          `Une figure annoncée comme un carré de côté ${n} cm a deux diagonales de longueurs différentes. Peut-elle être un carré ?`,
          'non',
          'Les diagonales d’un carré ont la même longueur.',
        ],
        [
          `Un quadrilatère a quatre côtés égaux de ${n} cm, mais on n’a rien vérifié sur les angles. Peut-on AFFIRMER que c’est un carré ?`,
          'non',
          'Les côtés égaux seuls ne suffisent pas : il faut aussi quatre angles droits.',
        ],
        [
          `ABCD est annoncé comme un rectangle : AB = ${n} cm et CD = ${n + 1} cm. Est-ce possible ?`,
          'non',
          'AB et CD sont opposés et devraient être égaux.',
        ],
        [
          `Un point et son image sont à ${n} cm de l’axe, du MÊME côté. Cette image est-elle son symétrique par rapport à cet axe ?`,
          'non',
          'Pour un point situé hors de l’axe, le symétrique est de l’autre côté.',
        ],
        [
          `Un cercle de rayon ${n} cm a un point A à ${n + 1} cm de son centre. A appartient-il au cercle ?`,
          'non',
          'Un point du cercle doit être exactement à la distance du rayon.',
        ],
        [
          `Un carré de côté ${n} cm est dessiné penché. Ses quatre côtés et ses quatre angles sont conservés. Reste-t-il un carré ?`,
          'oui',
          'L’orientation sur la feuille ne modifie pas les propriétés.',
        ],
        [
          `Pour vérifier un angle annoncé droit sur un rectangle de ${n} cm de long, l’équerre convient-elle ?`,
          'oui',
          'L’équerre permet de vérifier un angle droit.',
        ],
        [
          `Un point situé sur l’axe de symétrie garde-t-il sa place après la symétrie, même si le dessin mesure ${n} cm ?`,
          'oui',
          'Chaque point de l’axe est son propre symétrique.',
        ],
      ][v];
      q = {
        type: 'choice',
        prompt: rows[0],
        answer: rows[1],
        options: ['oui', 'non'],
        explanation: rows[2],
      };
    }
    add('geometry-properties', t, v, q);
  }
const transformations = [
  [
    ['Lina chante.', 'Elle', 'Elle chante.'],
    ['Noé regarde les étoiles.', 'Il', 'Il regarde les étoiles.'],
    ['Les chouettes volent.', 'Elles', 'Elles volent.'],
    ['Les garçons lisent.', 'Ils', 'Ils lisent.'],
  ],
  [
    ['Le chat dort.', 'Les chats dorment.'],
    ['La chouette vole.', 'Les chouettes volent.'],
    ['Le dragon arrive.', 'Les dragons arrivent.'],
    ['Un élève écoute.', 'Des élèves écoutent.'],
  ],
  [
    ['Il est content.', 'Elle est contente.'],
    ['Le chat est petit.', 'La chatte est petite.'],
    ['Un ami arrive.', 'Une amie arrive.'],
    ['Il est prêt.', 'Elle est prête.'],
  ],
  [
    ['Demain, Lina joue.', 'Demain, Lina jouera.'],
    ['Demain, nous chantons.', 'Demain, nous chanterons.'],
    ['Demain, ils arrivent.', 'Demain, ils arriveront.'],
    ['Demain, tu regardes.', 'Demain, tu regarderas.'],
  ],
  [
    ['Lina regarde la carte.', 'Lina la regarde.'],
    ['Noé cherche les clés.', 'Noé les cherche.'],
    ['Elle parle aux enfants.', 'Elle leur parle.'],
    ['Il ouvre le coffre.', 'Il l’ouvre.'],
  ],
  [
    ['les petite chouettes vole.', 'Les petites chouettes volent.'],
    ['les grands dragon arrive.', 'Les grands dragons arrivent.'],
    ['les deux amie chante.', 'Les deux amies chantent.'],
    ['les joli capes brille.', 'Les jolies capes brillent.'],
  ],
];
transformations.forEach((rows, t) =>
  rows.forEach((row, v) =>
    add('sentence-transform', t, v, {
      type: 'text',
      prompt:
        t === 0
          ? `Réécris « ${row[0]} » en remplaçant le sujet par « ${row[1]} ».`
          : t === 1
            ? `Mets cette phrase au pluriel : « ${row[0]} ».`
            : t === 2
              ? `Mets cette phrase au féminin : « ${row[0]} ».`
              : t === 3
                ? `Réécris au futur : « ${row[0]} ».`
                : t === 4
                  ? `Réécris « ${row[0]} » en remplaçant le complément par un pronom.`
                  : `Corrige les deux accords de cette phrase : « ${row[0]} ».`,
      answer: row.at(-1),
      accepted: [row.at(-1), row.at(-1).replace(/\.$/, '')],
      responseLabel: 'Écris la phrase entière.',
      explanation: `Une réponse attendue est : « ${row.at(-1)} » ${['Le pronom sujet garde le même nombre.', 'Le déterminant, le nom et le verbe suivent le pluriel.', 'Les mots concernés prennent le féminin.', 'Le verbe indique une action à venir.', 'Le pronom conserve le sens et se place avant le verbe.', 'On vérifie le groupe nominal puis l’accord du verbe.'][t]}`,
    }),
  ),
);

import { operationTask } from './written-operations.mjs';
for (let t = 0; t < 6; t++)
  for (let v = 0; v < 8; v++) add('written-operations', t, v, operationTask(t, v));

export function balancePracticeChoices(source) {
  return source.map((a) => {
    if (!a.options) return a;
    const options = [...new Set(a.options)];
    let h = 0;
    for (const c of a.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const shift = h % options.length;
    return { ...a, options: options.slice(shift).concat(options.slice(0, shift)) };
  });
}
