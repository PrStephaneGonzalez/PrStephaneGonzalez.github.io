/* Identifiants figés.
   Les sauvegardes des joueurs sont indexées par ces identifiants (skills, mem, bosses, recall,
   défis du jour). Règles :
   - on peut AJOUTER un identifiant, jamais en retirer ni en réutiliser un pour autre chose ;
   - un renommage passe par RENAMED (ancien → nouveau), appliqué à chaque chargement de sauvegarde ;
   - tests/ids-lock.json garde la liste publiée : le test échoue si un identifiant en disparaît.
   Les Lois réservées (pas encore écrites) suivent le graphe des notions de seconde. */
'use strict';
(function () {
  const range = (p, a, b) => Array.from({ length: b - a + 1 }, (_, i) => p + (a + i));
  CU.IDS = {
    laws: [
      // existantes
      ...range('v', 1, 7),
      ...range('f', 1, 6),
      ...range('q', 1, 6),
      ...range('p', 1, 3),
      ...range('l', 1, 3),
      // réservées : graphe des notions de seconde
      ...range('n', 1, 11),
      ...range('e', 1, 8),
      ...range('h', 1, 13),
      ...range('g', 1, 6),
      ...range('d', 1, 4),
      ...range('s', 1, 6),
      ...range('r', 1, 6),
      ...range('l', 4, 6),
      ...range('p', 4, 7),
    ],
    regions: [
      // existantes
      'vec', 'fac', 'quad', 'py', 'log',
      // réservées : nombres, équations, fonctions (I, II), statistiques, probabilités, figures, droites
      'num', 'equ', 'fon', 'ref', 'sta', 'pro', 'geo', 'lig',
    ],
    // clés spéciales utilisées dans les sauvegardes à la place d'une région
    special: ['all'],
    // renommages : { ancien: 'nouveau' } — vide tant que rien n'a été renommé
    renamed: {},
  };
})();
