/* Graphe des notions : source unique des prérequis entre Lois.
   Chaque ligne : identifiant, région, intitulé de travail, prérequis.
   - Une Loi « écrite » (présente dans CU.SKILLS) reçoit ses prérequis d'ici ; ne plus les écrire dans c-*.js.
   - Une Loi « prévue » (pas encore écrite) n'existe que dans ce graphe. Tant qu'elle n'est pas écrite,
     elle est ignorée des prérequis des Lois écrites (CU.finalizeGraph), de sorte que le jeu reste jouable.
   - Les identifiants sont figés (ids.js) ; le validateur (tests/graph-test.js) contrôle l'ensemble.
   Source : « Codex Umbra — graphe des notions de seconde » (programme de seconde, BO du 2 avril 2026). */
'use strict';
(function () {
  const laws = {};
  const L = (id, region, title, req = []) => {
    laws[id] = { region, title, req };
  };
  /* ----- Remparts de Vectre ----- */
  L('v1', 'vec', 'Vecteur, translation, coordonnées');
  L('v2', 'vec', 'Somme de vecteurs, Chasles', ['v1']);
  L('v3', 'vec', 'Produit par un réel, colinéarité', ['v2']);
  L('v4', 'vec', 'Norme et distance', ['v1', 'g1', 'n5']);
  L('v5', 'vec', 'Déterminant, alignement, parallélisme', ['v3', 'e1']);
  L('v6', 'vec', 'Milieu, parallélogramme', ['v2', 'n3']);
  L('v7', 'vec', 'Démonstrations vectorielles', ['v5', 'v6', 'l5']);
  /* ----- Cryptes des Sceaux ----- */
  L('f1', 'fac', 'Développer');
  L('f2', 'fac', 'Identités remarquables', ['f1']);
  L('f3', 'fac', 'Factoriser : facteur commun', ['f1']);
  L('f4', 'fac', 'Factoriser : identités remarquables', ['f2', 'f3']);
  L('f5', 'fac', 'Produit nul', ['f4', 'e1']);
  L('f6', 'fac', 'Preuves et contre-exemples', ['f4', 'l5']);
  /* ----- Tour des Arcs (au-delà du programme) ----- */
  L('q1', 'quad', 'Forme canonique', ['f2', 'h5']);
  L('q2', 'quad', 'Sommet, variations, optimisation', ['q1']);
  L('q3', 'quad', 'Discriminant et racines', ['q1', 'f5']);
  L('q4', 'quad', 'Signe d’un trinôme, inéquations', ['q3', 'e7']);
  L('q5', 'quad', 'Somme et produit des racines', ['q3']);
  L('q6', 'quad', 'Démonstrations : le discriminant', ['q4', 'q5']);
  /* ----- Python ----- */
  L('p1', 'py', 'Variables, affectation');
  L('p2', 'py', 'Tests et opérateurs', ['p1']);
  L('p3', 'py', 'Algorithmes, boucles', ['p2']);
  L('p4', 'py', 'Fonctions et types', ['p2']);
  L('p5', 'py', 'Boucles for et while, balayage', ['p3', 'p4', 'n1', 'n4']);
  L('p6', 'py', 'Algorithmes classiques', ['p5', 'n2', 'n8', 'h10']);
  L('p7', 'py', 'Aléatoire, simulation, statistiques', ['p4', 'r6', 's5']);
  /* ----- Logique ----- */
  L('l1', 'log', 'Implication, contraposée, réciproque');
  L('l2', 'log', 'Chevaliers et fripons', ['l1']);
  L('l3', 'log', 'Invariants', ['l1', 'v3']);
  L('l4', 'log', 'Ensembles : réunion, intersection, cardinal, produit cartésien');
  L('l5', 'log', 'Connecteurs, négation, contre-exemple', ['l4']);
  L('l6', 'log', 'Disjonction de cas, absurde', ['l1', 'l5', 'n1']);
  /* ----- Forges des Nombres ----- */
  L('n1', 'num', 'Multiples, diviseurs, parité');
  L('n2', 'num', 'Nombres premiers, fractions irréductibles', ['n1']);
  L('n3', 'num', 'Fractions');
  L('n4', 'num', 'Puissances, notation scientifique', ['n3']);
  L('n5', 'num', 'Racines carrées, équation x² = a', ['n3']);
  L('n6', 'num', 'Rationnels et irrationnels', ['n2', 'n5']);
  L('n7', 'num', 'Droite réelle, intervalles, valeur absolue', ['n3']);
  L('n8', 'num', 'Encadrements, arrondis', ['n7']);
  L('n11', 'num', 'Grandeurs, conversions, agrandissement', ['n3']);
  /* ----- Équations et inégalités ----- */
  L('e1', 'equ', 'Équations du premier degré', ['n3']);
  L('e2', 'equ', 'Isoler une variable', ['e1']);
  L('e3', 'equ', 'Inégalités, comparaison', ['n7', 'e1']);
  L('e4', 'equ', 'Inéquations du premier degré', ['e3']);
  L('e5', 'equ', 'Expressions fractionnaires', ['n3', 'f3']);
  L('e6', 'equ', 'Équations quotient', ['e5', 'f5']);
  L('e7', 'equ', 'Signe d’un produit ou d’un quotient', ['e4', 'f5']);
  L('e8', 'equ', 'Systèmes de deux équations', ['e1']);
  /* ----- Observatoire des Fonctions I : lire et relier ----- */
  L('h1', 'fon', 'Notion de fonction, image, antécédent', ['e1']);
  L('h2', 'fon', 'Courbe, lecture graphique', ['h1']);
  L('h3', 'fon', 'Ensemble de définition', ['h1', 'e5', 'n5']);
  L('h4', 'fon', 'Fonctions affines', ['h2', 'e4']);
  L('h10', 'fon', 'Variations, extremums', ['h2', 'h4']);
  L('h11', 'fon', 'Signe d’une fonction', ['e7', 'h2']);
  L('h13', 'fon', 'Fonctions définies sur N', ['h1', 'n10']);
  /* ----- Observatoire des Fonctions II : les fonctions de référence ----- */
  L('h5', 'ref', 'Fonction carré', ['h2', 'n5']);
  L('h6', 'ref', 'Fonction inverse', ['h2', 'e5']);
  L('h7', 'ref', 'Racine carrée et valeur absolue', ['h5', 'n5', 'n7']);
  L('h8', 'ref', 'Fonction cube, position relative des courbes', ['h5', 'h6', 'h7']);
  L('h9', 'ref', 'Parité, symétries', ['h5', 'h6']);
  L('h12', 'ref', 'Optimisation', ['h10', 'h5']);
  /* ----- Information chiffrée et statistiques ----- */
  L('n9', 'sta', 'Proportions, pourcentages', ['n3']);
  L('n10', 'sta', 'Évolutions, coefficient multiplicateur', ['n9']);
  L('s1', 'sta', 'Lire et représenter des données', ['n9']);
  L('s2', 'sta', 'Moyenne (pondérée), médiane, quartiles', ['n3', 's1']);
  L('s3', 'sta', 'Boîtes à moustaches', ['s2']);
  L('s4', 'sta', 'Classes, histogrammes, fréquences cumulées', ['s2', 'n9']);
  L('s5', 'sta', 'Écart-type', ['s4', 'n5']);
  L('s6', 'sta', 'Tableaux croisés', ['n9']);
  /* ----- Palais des Hasards ----- */
  L('r1', 'pro', 'Univers, événements, loi de probabilité', ['n3']);
  L('r2', 'pro', 'Réunion, intersection, complémentaire', ['r1', 'l4']);
  L('r3', 'pro', 'Dénombrement par tableaux et arbres', ['r1']);
  L('r4', 'pro', 'Probabilité conditionnelle, arbres pondérés', ['r2', 'r3', 'n9']);
  L('r5', 'pro', 'Inversion des conditionnements, tests diagnostiques', ['r4', 's6']);
  L('r6', 'pro', 'Fluctuation d’échantillonnage', ['r1', 'n5', 'n7']);
  /* ----- Géométrie des figures ----- */
  L('g1', 'geo', 'Pythagore', ['n5']);
  L('g2', 'geo', 'Thalès', ['e1', 'n3']);
  L('g3', 'geo', 'Trigonométrie du triangle rectangle', ['g1']);
  L('g4', 'geo', 'Aires et volumes', ['n11', 'e2']);
  L('g6', 'geo', 'Configurations et preuves', ['g1', 'g2']);
  /* ----- Citadelle des Lignes ----- */
  L('g5', 'lig', 'Projeté orthogonal, distance à une droite', ['g1']);
  L('d1', 'lig', 'Équation réduite, pente', ['h4']);
  L('d2', 'lig', 'Vecteur directeur, équation cartésienne', ['v5', 'd1']);
  L('d3', 'lig', 'Intersection de droites', ['e8', 'd2']);
  L('d4', 'lig', 'Parties du plan, inégalités', ['d2', 'e4']);

  CU.GRAPH = {
    laws,
    // régions : les existantes viennent de story.js ; les prévues portent un nom de travail
    regions: {
      vec: { name: 'Les Remparts de Vectre' },
      fac: { name: 'Les Cryptes des Sceaux' },
      quad: { name: 'La Tour des Arcs', beyond: true },
      py: { name: 'Python' },
      log: { name: 'Logique' },
      num: { name: 'Les Forges des Nombres' },
      equ: { name: 'Équations et inégalités', planned: true },
      fon: { name: 'Observatoire des Fonctions I : lire et relier', planned: true },
      ref: { name: 'Observatoire des Fonctions II : les fonctions de référence', planned: true },
      sta: { name: 'Information chiffrée et statistiques', planned: true },
      pro: { name: 'Palais des Hasards', planned: true },
      geo: { name: 'Géométrie des figures', planned: true },
      lig: { name: 'Citadelle des Lignes', planned: true },
    },
  };

  /* À appeler une fois tous les contenus chargés. Donne à chaque Loi écrite ses prérequis
     « effectifs » : ceux du graphe, privés des Lois pas encore écrites. Idempotent. */
  CU.finalizeGraph = () => {
    for (const s of Object.values(CU.SKILLS)) {
      const g = laws[s.id];
      if (!g) continue;
      s.planned = g.req;
      s.req = g.req.filter((r) => CU.SKILLS[r]);
    }
  };
})();
