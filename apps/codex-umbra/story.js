/* Régions, gardiens, rangs et fragments d'histoire. */
'use strict';
(function () {
  CU.REGIONS = [
    {
      id: 'num',
      healed: 'Les enclumes sonnent de nouveau juste. Chaque nombre forgé ici a retrouvé son poids exact, et la fausse monnaie a fondu.',
      name: 'Les Forges des Nombres',
      short: 'Nombres',
      sub: 'Divisibilité, fractions, puissances, racines, réels, encadrements',
      hue: '#7fb2ff',
      deep: '#13234a',
      icon: '⚒',
      map: [500, 175],
      scene: 'forge',
      intro: 'Dans les Forges, les Archivistes frappaient les nombres comme on frappe la monnaie : chacun avait son poids exact. Depuis la Déchirure, les balances mentent et la fausse monnaie circule.',
      boss: { name: 'Le Faussaire', title: 'Gardien des Forges', hp: 6, glyph: '¤', taunt: 'Mes pièces sonnent toutes juste. Sauras-tu dire lesquelles sont fausses ?' },
    },
    {
      id: 'vec',
    healed: 'Les vents de Vectre soufflent de nouveau dans des directions certaines. Sur les remparts, les bannières claquent.',
      name: 'Les Remparts de Vectre',
      short: 'Vecteurs',
      sub: 'Déplacements, coordonnées, colinéarité, démonstrations',
      hue: '#5eead4',
      deep: '#0f3b3a',
      icon: '➶',
      map: [250, 300],
      scene: 'ramparts',
      intro: 'Autrefois, les vents de Vectre obéissaient aux flèches gravées sur ses remparts. Aujourd’hui ils tournent en rond, et la brume a tout englouti.',
      boss: { name: 'Le Colosse des Vents', title: 'Gardien des Remparts', hp: 6, glyph: '♅', taunt: 'Tu crois savoir où souffle le vent ? Prouve-le.' },
    },
    {
      id: 'fac',
    healed: 'Les Cryptes respirent. Ce qui était scellé a livré ses facteurs, et les runes brillent au lieu de brûler.',
      name: 'Les Cryptes des Sceaux',
      short: 'Calcul littéral',
      sub: 'Développer, factoriser, identités remarquables, preuves',
      hue: '#c4a1ff',
      deep: '#2a1748',
      icon: 'ᛗ',
      map: [230, 720],
      scene: 'crypt',
      intro: 'Sous la terre, les Archivistes ont scellé ce qu’ils craignaient. Chaque sceau est une expression : qui sait la décomposer, l’ouvre.',
      boss: { name: 'La Liche aux Sceaux', title: 'Gardienne des Cryptes', hp: 6, glyph: '☠', taunt: 'Mes sceaux ont mille formes. Tu n’en briseras aucun.' },
    },
    {
      id: 'quad',
    healed: 'Étage après étage, la Tour s’est rallumée. Chaque flèche qui en part retombe exactement où on l’attend.',
      name: 'La Tour des Arcs',
      short: 'Second degré',
      sub: 'Forme canonique, paraboles, discriminant, signe, paramètres',
      hue: '#ff9a52',
      deep: '#4a1f0c',
      icon: '⌒',
      map: [760, 290],
      scene: 'tower',
      intro: 'Du haut de la Tour, les archers d’Aldmor ne manquaient jamais leur cible : ils savaient que toute flèche décrit une parabole.',
      boss: { name: 'L’Archère Spectrale', title: 'Gardienne de la Tour', hp: 6, glyph: '⚸', taunt: 'Mes flèches retombent où je veux. Où retomberont les tiennes ?' },
    },
    {
      id: 'py',
    healed: 'Les automates ont repris leur ronde. Ils calculent pour toi, maintenant — et tu sais pourquoi ils ont raison.',
      name: 'La Bibliothèque des Automates',
      short: 'Python',
      sub: 'Lire, compléter et construire des programmes',
      hue: '#8cf0a6',
      deep: '#0f3a1f',
      icon: '⚙',
      map: [780, 710],
      scene: 'library',
      intro: 'Les automates de la Bibliothèque calculaient pour les Archivistes. Privés d’instructions, ils errent entre les rayonnages.',
      boss: { name: 'L’Automate Primordial', title: 'Gardien de la Bibliothèque', hp: 5, glyph: '⌬', taunt: 'J’exécute. Je ne comprends pas. Et toi ?' },
    },
    {
      id: 'log',
    healed: 'Le Labyrinthe s’est déplié en une seule allée. Les phrases s’y tiennent droites : vraies ou fausses, mais jamais trompeuses.',
      name: 'Le Labyrinthe des Sophistes',
      short: 'Logique',
      sub: 'Implications, chevaliers et fripons, invariants',
      hue: '#efdcaa',
      deep: '#3a311a',
      icon: '⇔',
      map: [500, 820],
      scene: 'maze',
      intro: 'Les Sophistes ont bâti un labyrinthe de phrases. Certaines disent vrai, d’autres mentent, et toutes se ressemblent.',
      boss: { name: 'Le Sphinx Menteur', title: 'Gardien du Labyrinthe', hp: 5, glyph: '☥', taunt: 'Je ne mens jamais… sauf quand je dis la vérité.' },
    },
  ];
  CU.FINAL = { name: 'Le Roi Sans Loi', title: 'Maître des Informes', hp: 9, glyph: '♛', needs: ['vec', 'fac', 'quad'], taunt: 'Rien ne tient. Rien n’a jamais tenu. Montre-moi une seule chose qui soit vraie.' };
  CU.region = (id) => CU.REGIONS.find((r) => r.id === id);

  CU.RANKS = [
    [0, 'Égaré'],
    [120, 'Initié'],
    [350, 'Arpenteur'],
    [750, 'Lecteur des Lois'],
    [1300, 'Brise-Sceau'],
    [2100, 'Archiviste'],
    [3200, 'Archimage'],
    [4800, 'Main du Codex'],
    [7000, 'Héritier d’Ysembre'],
  ];
  CU.TIER_NAMES = ['Novice', 'Adepte', 'Maître'];

  CU.PROLOGUE = [
    'Il fut un temps où le monde d’Aldmor tenait debout parce qu’il était écrit. Dans le <b>Codex</b>, les Archivistes avaient consigné ses Lois : celles qui guident les vents, scellent les portes, courbent la course des flèches. Tant que le Codex était entier, le monde l’était aussi.',
    'Puis vint la <b>Nuit de la Déchirure</b>. Une main inconnue arracha les pages du Codex et les jeta dans l’ombre. Sans ses Lois, le monde se défait : les remparts flottent dans la brume, les tours s’effritent, et des créatures sans forme — les <b>Informes</b> — rôdent là où plus rien n’est certain.',
    'Tu t’éveilles parmi les ruines. Sur une pierre, un corbeau à l’œil d’argent t’observe. « Je suis <b>Corvin</b>, dernier serviteur des Archivistes. Ils ont tous disparu. Mais toi, tu sais encore lire les Lois. Comprends-en une, et elle se réécrira dans le Codex — et le monde s’en souviendra. Ne crois rien sur parole, Arpenteur. Ici, seule la preuve fait loi. »',
  ];

  // fragments débloqués par le nombre de sceaux brisés (paliers)
  CU.FRAGMENTS = [
    { id: 'f1', at: 2, title: 'La première lueur', text: 'Quand la première Loi s’est réécrite, Corvin a frémi. « Tu vois cette lueur ? C’est le monde qui se souvient. Les Informes la craignent : une chose comprise ne peut plus être dévorée par l’ombre. »' },
    { id: 'f2', at: 5, title: 'Les sept Archivistes', text: 'Ils étaient sept, dit Corvin. Chacun gardait une partie du Codex : les vents, les sceaux, les arcs, les automates, les phrases… Il récite six noms d’une voix égale. Le septième, il ne le prononce jamais.' },
    { id: 'f3', at: 9, title: 'La page signée', text: 'Dans les cendres d’une crypte, tu trouves un morceau de page couvert d’une écriture fine : « Une Loi que l’on ne sait pas démontrer n’est qu’une croyance. Et une croyance, on peut l’arracher. » En bas, une seule initiale : <b>Y</b>.' },
    { id: 'f4', at: 14, title: 'Le Roi Sans Loi', text: 'Les Informes ont un maître. On l’appelle le Roi Sans Loi. Il ne détruit rien : il défait. À chaque chose, il retire la raison pour laquelle elle tient — et elle s’écroule d’elle-même.' },
    { id: 'f5', at: 20, title: 'Ysembre', text: 'Le septième Archiviste s’appelait <b>Ysembre</b>. Le plus brillant de tous, celui qui posait toujours une question de trop. Corvin finit par l’avouer, sans te regarder : c’était son maître.' },
    { id: 'f6', at: 27, title: 'La question de trop', text: 'Ysembre avait demandé au Conseil : « Et si les Lois n’étaient pas vraies parce qu’elles sont écrites, mais écrites parce qu’elles sont vraies ? Alors le Codex ne sert à rien. Il suffit de comprendre. » Les six autres l’ont banni pour ces mots.' },
    { id: 'f7', at: 35, title: 'La Déchirure', text: 'Ce n’est pas le Roi Sans Loi qui a déchiré le Codex. C’est Ysembre. Il voulait prouver qu’un monde pouvait tenir sans livre, par la seule compréhension de ceux qui l’habitent. Mais personne, alors, ne comprenait vraiment. Le monde s’est effondré — et de son désespoir est né le Roi Sans Loi.' },
    { id: 'f8', at: 44, title: 'Ce que tu es', text: '« Tu ne retrouves pas des pages, dit enfin Corvin. Les pages ont brûlé, toutes. Ce qui se réécrit dans le Codex, ce sont les Lois que <i>tu</i> as comprises. Ysembre avait raison. Il lui manquait seulement quelqu’un comme toi. »' },
  ];
  CU.BOSS_TEXT = {
    num: 'Le Faussaire laisse tomber sa dernière pièce : elle sonne creux. Autour de toi, les balances se redressent ; dans les Forges, chaque nombre a retrouvé son poids exact.',
    vec: 'Le Colosse des Vents s’effondre en une pluie de flèches lumineuses. Sur les Remparts de Vectre, les vents se lèvent à nouveau — et, pour la première fois depuis la Déchirure, ils savent où aller.',
    fac: 'La Liche aux Sceaux se brise comme ses propres runes, en facteurs de poussière. Les Cryptes s’ouvrent une à une ; ce qui était scellé respire.',
    quad: 'La dernière flèche de l’Archère Spectrale décrit une parabole parfaite… et retombe exactement où tu l’avais prédit. Elle sourit, puis se dissipe. La Tour des Arcs se rallume, étage par étage.',
    py: 'L’Automate Primordial s’arrête net, puis redémarre — mais c’est toi qu’il écoute désormais. Dans la Bibliothèque, mille rouages se remettent à tourner.',
    log: 'Le Sphinx Menteur ne trouve plus rien à te faire croire. Il s’incline : « Qui sait reconnaître le faux est libre. » Le Labyrinthe se déplie en une seule allée, droite et claire.',
    final: 'Le Roi Sans Loi se dissout comme une ombre au lever du jour. Derrière lui se tient une silhouette en manteau gris. Ysembre. « Tu as fait ce que j’espérais. Le monde tient parce que quelqu’un le comprend. » Il te tend une plume d’argent. « Au-delà de ces terres, d’autres Lois dorment encore : les suites, les fonctions, le hasard… Le Codex n’a pas fini de s’écrire. »',
  };
})();
