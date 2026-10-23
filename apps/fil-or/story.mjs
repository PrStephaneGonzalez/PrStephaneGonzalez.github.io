// L'histoire du Fil d'Or : douze chapitres originaux, débloqués par le travail réel
// (objets gagnés, salles éveillées ou illuminées, jeux terminés). Chaque chapitre se
// termine par une question de compréhension qui « referme le parchemin » et ouvre la suite.
// {nom} est remplacé par le nom de magicienne.

export const CHAPTERS = [
  {
    id: 'c0',
    title: 'Le fil rompu',
    scene: '🌙',
    need: {},
    text: [
      'Cette nuit-là, {nom} fut réveillée par un bruit étrange : un claquement sec, comme une corde de harpe qui casse. Par la fenêtre du dortoir, elle vit la grande tour de l’École du Fil d’Or s’éteindre. Le fil doré qui s’enroulait autour d’elle depuis mille ans, et qui gardait vivants tous les savoirs de l’école, venait de se rompre.',
      'Au matin, Dame Ysolde, la directrice, réunit les élèves dans la cour. Son visage était grave. « Le Fil d’Or s’est défait en centaines de brins. Ils se sont envolés vers les quatre univers qui entourent l’école. Sans eux, les livres perdent leurs mots et les nombres perdent leur valeur. »',
      'Une petite chouette aux plumes cuivrées se posa sur l’épaule de {nom}. « Je m’appelle Pistache, chuchota-t-elle. Dame Ysolde dit que tu es la seule apprentie capable de voir les brins. Chaque fois que tu réussis un exercice, un brin revient vers toi. Tu veux bien m’aider ? »',
      'Au loin, sur le toit de la tour éteinte, une silhouette en manteau gris regardait la scène. Puis elle disparut.',
    ],
    question: {
      q: 'Que protège le Fil d’Or ?',
      choices: ['Les savoirs de l’école', 'Le trésor de la directrice', 'Les chouettes de la tour'],
    },
    teaser: 'Pistache a entendu un murmure du côté du Château des Récits…',
  },
  {
    id: 'c1',
    title: 'La bibliothèque qui murmure',
    scene: '📚',
    need: { objects: 3, awake: 'recits' },
    text: [
      'Dans le Château des Récits, {nom} poussa la porte de la Bibliothèque des mots. Les étagères étaient pleines de livres… aux pages blanches. Seuls quelques mots flottaient dans l’air, perdus, comme des papillons sans fleur.',
      '« Ils cherchent leur place, expliqua Pistache. Quand tu lis et que tu écris correctement, ils rentrent dans leurs livres. »',
      '{nom} s’approcha d’un vieux livre relié de cuir. Sur la première page, un seul mot était revenu : « ATTENTION ». Elle tourna la page. D’autres lettres apparurent lentement, comme écrites par une main invisible : « Celui qui a coupé le fil se cache parmi ceux qui le connaissent le mieux. »',
      'Pistache ébouriffa ses plumes. « Ça veut dire que le coupable… est quelqu’un de l’école ? » Derrière les étagères, il y eut un frottement de tissu. Quand {nom} courut voir, il n’y avait plus personne. Seulement un petit morceau de laine grise accroché à un clou.',
    ],
    question: {
      q: 'D’après le message du livre, où se cache le coupable ?',
      choices: [
        'Parmi ceux qui connaissent le mieux le fil',
        'Au fond de la forêt',
        'Sous la bibliothèque',
      ],
    },
    teaser: 'Une odeur de fumée monte des Forges des Nombres…',
  },
  {
    id: 'c2',
    title: 'Les étincelles des forges',
    scene: '🔥',
    need: { objects: 8, awake: 'forges' },
    text: [
      'Les Forges des Nombres résonnaient d’ordinaire du bruit des marteaux. Ce jour-là, tout était silencieux. Maître Brasier, le forgeron des nombres, était assis devant son enclume, découragé.',
      '« Regarde, dit-il en montrant une pile de pièces d’or. Ce matin, il y en avait cent vingt. Maintenant, je n’arrive plus à les compter : les chiffres glissent, se mélangent, changent de place. Sans le Fil d’Or, les nombres deviennent fous. »',
      '{nom} prit une pièce. Elle était tiède, et un minuscule brin doré y était collé. Dès qu’elle le toucha, le brin s’enroula autour de son doigt, et les chiffres gravés sur les pièces se remirent en ordre. « Tu as le don ! s’écria Maître Brasier. Chaque calcul juste répare un peu plus la forge. »',
      'En partant, {nom} remarqua une empreinte de pas dans la cendre : une botte pointue, avec le dessin d’une bobine sur la semelle.',
    ],
    question: {
      q: 'Pourquoi Maître Brasier ne peut-il plus compter ses pièces ?',
      choices: [
        'Parce que les chiffres glissent et se mélangent',
        'Parce qu’on les lui a volées',
        'Parce qu’il a oublié comment on compte',
      ],
    },
    teaser: 'Pistache a trouvé un parchemin couvert de symboles dans le Jardin des énigmes.',
  },
  {
    id: 'c3',
    title: 'Le message codé',
    scene: '📜',
    need: { objects: 14, games: 1 },
    text: [
      'Au milieu du Jardin des énigmes, entre les haies taillées en labyrinthe, un parchemin était coincé sous une fiole. Il était couvert de lettres qui ne voulaient rien dire : « KF TVJT MF HBSEJFO ».',
      '« C’est un code, dit Pistache. Les élèves l’utilisaient autrefois pour s’envoyer des messages secrets. Chaque lettre est remplacée par celle qui la suit dans l’alphabet. Pour lire, il faut reculer d’une lettre. »',
      '{nom} prit un crayon et déchiffra, lettre par lettre. K devint J, F devint E… Quand elle eut fini, elle relut à voix haute : « JE SUIS LE GARDIEN ».',
      '« Le gardien ? répéta Pistache. Mais le Fil d’Or n’a plus de gardien depuis cent ans ! Le dernier s’appelait Maître Orfil. Il a quitté l’école un soir d’hiver, et personne ne l’a jamais revu. » Le vent se leva, et le parchemin s’envola par-dessus la haie.',
    ],
    question: {
      q: 'Avec le même code, que veut dire « GJM » ?',
      choices: ['FIL', 'HKN', 'GIL'],
    },
    teaser: 'Les télescopes de l’Observatoire se sont tous tournés vers la même étoile…',
  },
  {
    id: 'c4',
    title: 'L’Observatoire endormi',
    scene: '🔭',
    need: { objects: 20, awake: 'observatoire' },
    text: [
      'L’Observatoire céleste était plongé dans le noir. Ses grands télescopes de cuivre pointaient tous vers une seule étoile, minuscule et pâle, juste au-dessus de l’école.',
      'Une vieille astronome aux lunettes rondes, Madame Lunelle, dormait sur une pile de cartes du ciel. Pistache lui picora l’oreille. « Hein ? Quoi ? Oh, une apprentie ! Enfin ! »',
      'Elle expliqua que cette étoile était l’Étoile-Bobine : c’est d’elle que venait le tout premier brin du Fil d’Or. « Si elle s’éteint, le fil ne pourra jamais être retissé. Pour la garder allumée, il faut mesurer, partager et tracer avec précision. Les fractions, les formes, les longueurs… c’est le langage du ciel. »',
      '{nom} regarda dans le télescope. Sur la surface pâle de l’étoile, elle crut voir une silhouette en manteau gris qui tirait sur un fil très fin, comme pour l’emporter.',
    ],
    question: {
      q: 'Pourquoi l’Étoile-Bobine est-elle si importante ?',
      choices: [
        'C’est d’elle que vient le premier brin du Fil d’Or',
        'Elle éclaire le chemin de la forêt',
        'C’est l’étoile préférée de Madame Lunelle',
      ],
    },
    teaser: 'Quand une salle s’illuminera pour de bon, quelque chose se réveillera dans la tour.',
  },
  {
    id: 'c5',
    title: 'La première lumière',
    scene: '🕯️',
    need: { objects: 26, lit: 1 },
    text: [
      'Ce soir-là, quelque chose changea. Dans une des salles de l’école, une lumière s’alluma… et ne s’éteignit plus. Ce n’était plus une petite lueur fragile, mais une vraie flamme dorée, chaude et tranquille.',
      '« Tu as compris quelque chose pour de bon, dit Dame Ysolde en souriant. Pas une seule fois, par chance, mais plusieurs jours de suite. C’est ça, la vraie magie : un savoir qui reste. »',
      'Au même moment, dans la grande tour éteinte, un premier anneau du Fil d’Or se remit à briller. Un son clair, comme une note de musique, traversa tout le château. Pistache voletait partout. « Regarde la tour ! Regarde ! »',
      'Mais {nom} regardait ailleurs. Sur le chemin de ronde, l’homme au manteau gris avait sursauté en entendant la note. Il porta la main à son cœur, comme si ce son lui rappelait quelque chose de très ancien.',
    ],
    question: {
      q: 'Qu’est-ce qui fait qu’une salle s’illumine pour de bon ?',
      choices: [
        'Un savoir réussi plusieurs jours de suite',
        'Une seule bonne réponse',
        'Un sortilège de Pistache',
      ],
    },
    teaser: 'Des traces de pas grises mènent d’un univers à l’autre…',
  },
  {
    id: 'c6',
    title: 'Les traces du Fileur',
    scene: '👣',
    need: { objects: 35, lit: 2 },
    text: [
      'Grâce aux brins retrouvés, {nom} commençait à voir des choses invisibles pour les autres. Sur les chemins entre les univers brillaient de fines traces grises : des pas, toujours les mêmes, avec la petite bobine sur la semelle.',
      'Elle les suivit, Pistache sur l’épaule. Les traces passaient par la bibliothèque, par la forge, par l’Observatoire… partout où un brin avait été arraché.',
      '« Il ne vole pas les brins pour lui, murmura {nom}. Regarde : il les enroule et il les cache. Dans les livres vides, sous les enclumes, derrière les télescopes. » « Mais pourquoi cacher le savoir ? » demanda Pistache.',
      'Au bout des traces, un nom était gravé dans une pierre : le Fileur d’Ombre. Et en dessous, en tout petit : « Ce qu’on partage, on le perd. » {nom} fronça les sourcils. Elle n’était pas du tout d’accord.',
    ],
    question: {
      q: 'Que fait le Fileur d’Ombre avec les brins ?',
      choices: ['Il les cache', 'Il les vend au marché', 'Il les donne aux chouettes'],
    },
    teaser: 'Un pont de lumière apparaît au-dessus du Jardin des énigmes, mais il lui manque des pierres.',
  },
  {
    id: 'c7',
    title: 'Le pont des énigmes',
    scene: '🌉',
    need: { objects: 45, games: 3 },
    text: [
      'Au-dessus du Jardin des énigmes, un pont de lumière était apparu, suspendu dans le vide. Il menait à une petite île flottante où brillait un brin énorme, gros comme une corde.',
      'Mais le pont avait des trous. Pour chaque pierre manquante, une énigme était gravée sur le bord : relier des fils sans les croiser, verser des potions dans le bon ordre, tourner des tuiles pour faire passer la lumière.',
      '{nom} résolut les énigmes une à une. À chaque réponse, une pierre lumineuse venait se placer dans le pont avec un petit « clic ». Arrivée sur l’île, elle trouva le grand brin… et, assis à côté, un vieil homme en manteau gris, aux yeux fatigués.',
      '« Tu es rapide, apprentie, dit-il. Plus rapide que moi à ton âge. » Avant qu’elle ait pu répondre, il claqua des doigts et disparut dans un nuage de laine grise.',
    ],
    question: {
      q: 'Que faut-il faire pour placer une pierre dans le pont ?',
      choices: ['Résoudre une énigme', 'Payer une pièce d’or', 'Chanter une chanson'],
    },
    teaser: 'La tour du Fil d’Or n’a pas de porte… mais elle a une serrure en forme d’étoile.',
  },
  {
    id: 'c8',
    title: 'La tour sans porte',
    scene: '🗝️',
    need: { objects: 55, lit: 4 },
    text: [
      'La grande tour du Fil d’Or n’avait jamais eu de porte. Autrefois, disaient les anciens, on y entrait par la lumière. Mais depuis que le fil était rompu, plus personne ne pouvait y monter.',
      'En faisant le tour de la tour, {nom} découvrit pourtant une petite serrure dans la pierre, en forme d’étoile à quatre branches. Chaque branche portait un symbole : un livre, une enclume, un télescope et une fleur.',
      '« Les quatre univers ! s’exclama Pistache. Chaque univers doit te donner sa lumière. » {nom} posa la main sur la serrure. Les branches des univers où elle avait illuminé des salles se mirent à briller. Les autres restèrent grises.',
      'Du haut de la tour, une voix grave résonna : « Ne monte pas, petite. Ce qui est là-haut doit rester enfermé. C’est pour le bien de tous. » C’était la voix du vieil homme au manteau gris.',
    ],
    question: {
      q: 'Que représentent les quatre branches de la serrure ?',
      choices: [
        'Les quatre univers autour de l’école',
        'Les quatre saisons',
        'Les quatre amis de Pistache',
      ],
    },
    teaser: 'Quand toutes les salles d’un même univers seront éveillées, un escalier secret apparaîtra.',
  },
  {
    id: 'c9',
    title: 'Le cœur du Fil d’Or',
    scene: '💛',
    need: { objects: 70, lit: 6, fullUniverse: 1 },
    text: [
      'Un matin, en traversant un univers dont toutes les salles étaient désormais éveillées, {nom} entendit un grondement sourd. Le sol trembla doucement, et dans la tour, un escalier de lumière se déroula, marche après marche.',
      'Elle monta, Pistache cramponnée à sa capuche. Tout en haut, dans une pièce ronde, flottait une grosse pelote dorée qui battait comme un cœur : le Cœur du Fil d’Or. Mais il était enfermé dans une cage de laine grise, tricotée serré.',
      'Le vieil homme était là, assis dans l’ombre. « Je m’appelle Orfil, dit-il. J’étais le gardien du fil. Il y a cent ans, j’ai vu des élèves se disputer pour des savoirs, et j’ai eu peur. J’ai cru que le savoir était dangereux, qu’il fallait l’enfermer. Alors j’ai coupé le fil. »',
      '{nom} s’approcha de la cage. « Mais un savoir enfermé, ça ne sert à personne », dit-elle doucement. Orfil baissa les yeux.',
    ],
    question: {
      q: 'Pourquoi Orfil a-t-il coupé le fil ?',
      choices: [
        'Parce qu’il avait peur que le savoir soit dangereux',
        'Parce qu’il voulait devenir directeur',
        'Par accident, en tricotant',
      ],
    },
    teaser: 'Pour ouvrir la cage, il faudra une lumière plus forte que les autres : une flamme étoilée.',
  },
  {
    id: 'c10',
    title: 'La flamme étoilée',
    scene: '🌟',
    need: { objects: 90, lit: 8, star: 1 },
    text: [
      '« Prouve-moi que j’ai eu tort », dit Orfil.',
      '{nom} réfléchit. Puis elle sortit de sa poche la flamme étoilée qu’elle avait gagnée en relevant un défi plus difficile, un jour où elle aurait pu s’arrêter là. Elle la posa contre la cage de laine grise.',
      '« Tu vois ? Quand j’ai appris quelque chose, je ne l’ai pas perdu. Je suis allée plus loin. Et maintenant, je peux l’expliquer à Pistache, à mes amis, à toi. Plus on partage un savoir, plus il grandit. »',
      'La laine grise se mit à fondre comme de la neige au soleil. Le Cœur du Fil d’Or s’échappa de la cage, et des milliers de brins jaillirent vers les quatre univers. Orfil regardait la lumière, les yeux brillants. « J’avais oublié, murmura-t-il. Ce n’est pas le savoir qui est dangereux. C’est de le garder pour soi. » Et son manteau gris devint lentement… doré.',
    ],
    question: {
      q: 'Selon {nom}, que se passe-t-il quand on partage un savoir ?',
      choices: ['Il grandit', 'Il disparaît', 'Il devient gris'],
    },
    teaser: 'Il reste à rallumer les salles de l’école pour que la grande fête commence.',
  },
  {
    id: 'c11',
    title: 'Une école qui brille',
    scene: '🎆',
    need: { objects: 120, lit: 10 },
    text: [
      'Le soir de la grande fête, toute l’École du Fil d’Or brillait. Les livres de la bibliothèque avaient retrouvé leurs mots, les pièces de Maître Brasier s’empilaient en colonnes parfaites, et l’Étoile-Bobine scintillait si fort que Madame Lunelle avait dû mettre des lunettes de soleil.',
      'Dame Ysolde monta sur une estrade. « Ce soir, nous fêtons une apprentie qui n’a jamais abandonné. Elle a appris, elle a recommencé, elle est allée plus loin. {nom}, veux-tu devenir la nouvelle gardienne du Fil d’Or ? Orfil t’apprendra tout ce qu’il sait. »',
      'Orfil, dans son manteau doré, s’inclina devant elle. Pistache se posa sur sa tête, très fière. « Gardienne {nom} ! Ça sonne bien ! »',
      'Tout en haut de la tour, le Fil d’Or se remit à tourner doucement, comme pendant mille ans. Mais cette fois, il avait un brin tout neuf, qui brillait un peu plus que les autres : le tien.',
    ],
    question: {
      q: 'Que propose Dame Ysolde à {nom} ?',
      choices: [
        'Devenir la gardienne du Fil d’Or',
        'Devenir directrice de l’école',
        'Partir vivre à l’Observatoire',
      ],
    },
    teaser: null,
  },
];
export const CHAPTER_BY_ID = Object.fromEntries(CHAPTERS.map((c) => [c.id, c]));

export function restoreStory(raw) {
  const ids = new Set(CHAPTERS.map((c) => c.id));
  const done = Array.isArray(raw?.done) ? raw.done.filter((id) => ids.has(id)) : [];
  return { version: 1, done: [...new Set(done)] };
}
export function mergeStory(a, b) {
  return restoreStory({ done: [...restoreStory(a).done, ...restoreStory(b).done] });
}

const UNIVERSE_WORD = {
  recits: 'du Château des Récits',
  forges: 'des Forges des Nombres',
  observatoire: 'de l’Observatoire céleste',
  jardin: 'du Jardin des énigmes',
};
const plural = (n, one, many) => (n === 1 ? one : n + ' ' + many);
// p = progression calculée par la carte : { objects, awake: {univers: n}, lit, star, games, fullUniverse }
export function missingFor(chapter, p) {
  const n = chapter.need,
    out = [];
  if (n.objects && p.objects < n.objects)
    out.push(plural(n.objects - p.objects, 'un objet magique', 'objets magiques'));
  if (n.awake && !(p.awake[n.awake] > 0)) out.push('une salle ' + UNIVERSE_WORD[n.awake] + ' en éveil');
  if (n.games && p.games < n.games)
    out.push(
      n.games === 1
        ? 'une énigme du Jardin résolue'
        : plural(n.games - p.games, 'un jeu de plus du Jardin', 'jeux de plus du Jardin'),
    );
  if (n.lit && p.lit < n.lit)
    out.push(plural(n.lit - p.lit, 'une salle illuminée', 'salles illuminées') + (p.lit ? ' de plus' : ''));
  if (n.fullUniverse && p.fullUniverse < n.fullUniverse)
    out.push('toutes les salles d’un même univers en éveil');
  if (n.star && p.star < n.star) out.push('une flamme étoilée');
  return out;
}
export function storyStatus(story, p) {
  const s = restoreStory(story);
  const next = CHAPTERS.find((c) => !s.done.includes(c.id));
  if (!next) return { done: s.done.length, next: null, ready: false, missing: [] };
  const missing = missingFor(next, p);
  return { done: s.done.length, next, ready: missing.length === 0, missing };
}
export const withName = (text, name) => text.replaceAll('{nom}', name || 'l’apprentie');
// ordre des réponses mélangé de façon stable pour chaque chapitre
export function choiceOrder(chapter) {
  const seed = [...chapter.id].reduce((h, c) => h * 31 + c.charCodeAt(0), 7);
  return chapter.question.choices
    .map((text, i) => ({ text, good: i === 0, k: (seed * (i + 3)) % 7 }))
    .sort((a, b) => a.k - b.k);
}
