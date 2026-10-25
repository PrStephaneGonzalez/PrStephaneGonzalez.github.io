# INFLUENCE — Cahier des charges de développement

**Version :** 1.1 — 25 octobre 2026  
**Destination :** agent de développement (Codex ou Claude Code), dans `PrStephaneGonzalez.github.io/apps/influence/`  
**Statut :** spécification produit ; toute divergence mathématique doit être arbitrée à partir de l'article joint, et non de la maquette.

### Changements par rapport à la v1.0

- §2 : incohérences connues de la maquette retenue listées explicitement.
- §3.4 : la popularité n'est plus un paramètre libre ; l'habillage « propositions » est restreint aux graphes acycliques.
- §5 : métadonnées d'équité (Ls, Rs) obligatoires par niveau ; critères d'intérêt stratégique précisés ; niveaux « position > nombre ».
- §7 : indicateurs de lisibilité supplémentaires (sommets jouables restants, appartenance non colorée, vue figée en solo à tester).
- §8 : contraintes techniques (entiers 32 bits, plafond de l'Expert exact, Vite sur GitHub Pages).
- §9 : test de symétrie énoncé exactement ; valeurs de référence tirées de l'article ; énumération indépendante en deux implémentations.
- §11 : arrêt obligatoire et validation humaine à la fin de chaque phase ; l'agent n'est plus nommé (Codex ou Claude Code).

## 1. Mission et priorité

Créer un **jeu de stratégie web grand public**, accessible sans inscription, jouable immédiatement, en français et en anglais, sur mobile et ordinateur. Il est inspiré directement du jeu combinatoire *influence* défini dans l'article scientifique joint. Le jeu doit être **amusant avant d'être pédagogique** : pas de scénario politique imposé, pas de longues introductions, pas de discours idéologique.

**Priorités, dans l'ordre :** (1) fidélité des règles ; (2) lisibilité du tour et des captures ; (3) plaisir et fluidité ; (4) qualité de l'IA ; (5) variété des niveaux ; (6) habillage scientifique discret.

**Livrables attendus :** code source autonome, tests automatisés, documentation, niveaux validés, version déployable sur GitHub Pages. Ne pas modifier d'autres applications du dépôt.

## 2. Références jointes et direction artistique

- `reference_design_retenu.png` : **référence visuelle prioritaire**. Palette claire, ciel bleu, fonds crème, couleurs franches, formes arrondies, pictogrammes sympathiques, boutons généreux, ambiance de jeu familial. Réinterpréter et améliorer ; **ne pas reproduire les erreurs de l'image générée**, notamment :
  - des scores qui ne correspondent pas au nombre de sommets représentés (par exemple un écran de victoire 6–4 pour un plateau de 8 sommets) ;
  - des arcs à double pointe, incompatibles avec le modèle (un arc est orienté) ;
  - un sommet de couleur verte qui peut se lire comme un troisième camp (voir règle de palette ci-dessous) ;
  - toute flèche dont le sens ne correspond pas à la règle de capture du camp qui joue.
- `reference_design_initial.png` : **référence secondaire**, utile pour la hiérarchie des écrans et le bandeau de tour ; **ne pas reprendre** son fond noir ou son ambiance sombre.
- `article_influence_2021.pdf` : **source normative des règles**.

Style recherché : convivial, mixte et intergénérationnel, expressif, accessible, proche de l'énergie de jeux de plateforme familiaux colorés, sans reprendre de personnages, marques ou éléments protégés. Fond clair sur le plateau, contraste élevé, animations courtes et satisfaisantes. Pas de dominante noire, de néons agressifs ou d'esthétique guerrière. Rouge corail et bleu azur pour les deux camps ; jaune doux pour les actions ; **sur le plateau, un sommet n'est jamais vert ni d'une troisième couleur d'équipe** : le vert et les autres teintes sont réservés aux décors et aux pictogrammes **posés à l'intérieur de sommets rouges ou bleus**.

**Clarté du tour (critère bloquant)** : bandeau large « TOUR DU ROUGE » / « TOUR DU BLEU » (EN : “RED'S TURN” / “BLUE'S TURN”), avec couleur, pictogramme et animation de transition. Surbrillance des sommets jouables de ce camp ; les autres sont visiblement inactifs. Ne jamais signaler le tour uniquement par la couleur : ajouter texte et symbole. Scores rouge et bleu constamment visibles.

## 3. Modèle mathématique — source de vérité

**Article :** Eric Duchêne, Stéphane Gonzalez, Aline Parreau, Eric Rémila, Philippe Solal (2021), “influence: A partizan scoring game on graphs”, *Theoretical Computer Science* 878–879, 26–46, DOI : https://doi.org/10.1016/j.tcs.2021.05.028.

Graphe orienté fini `G=(V,A)` dont chaque sommet porte une couleur parmi deux camps. Dans l'article, le premier camp est Black/Left (noté L) et le second White/Right (noté R) ; **dans l'interface seulement**, les nommer Rouge et Bleu. Mapping canonique : Rouge = Left/Black ; Bleu = Right/White. Ce mapping est interne et indépendant des associations politiques gauche/droite. L'interface n'affiche pas « gauche » ou « droite » comme étiquette fixe.

### 3.1 Coup légal et capture

- **Rouge/Left** : choisit un sommet rouge `x` encore présent ; capture `Succ(G,x)`, l'ensemble de tous les sommets accessibles depuis `x` par un chemin orienté, **y compris `x`**.
- **Bleu/Right** : choisit un sommet bleu `y` encore présent ; capture `Pred(G,y)`, l'ensemble de tous les sommets depuis lesquels `y` est accessible, **y compris `y`**.
- Tous les sommets capturés sont supprimés ; le joueur gagne autant de points que de sommets effectivement capturés ; le jeu continue sur le **sous-graphe induit par les sommets restants**. Les sommets de la couleur adverse peuvent être capturés. La couleur d'un sommet détermine qui peut le **choisir**, pas qui peut le **capturer**.
- Les joueurs alternent. Si le joueur dont c'est le tour n'a **aucun sommet de sa couleur**, la partie s'achève **immédiatement** et **tous les sommets encore présents sont attribués à son adversaire** (règle importante, pas de passage de tour).
- Victoire au plus grand nombre de points ; égalité si les scores sont égaux. Conservation : à la fin, `scoreRouge + scoreBleu = nombreInitialDeSommets`. Si ce nombre est impair, l'égalité est impossible.

### 3.2 Sommets forcés et variantes

L'article définit des sommets *forced* et des graphes *relevant* pour simplifier l'analyse. Un sommet `x` rouge est forcé si `Succ(G,x)` ne contient que des sommets rouges (symétriquement pour Bleu avec `Pred`). **Le mode public joue aux règles originales, sans retrait anticipé des sommets forcés** : jouer un sommet forcé est un coup légal. Leur traitement anticipé est une **optimisation interne facultative** du solveur, autorisée uniquement si l'équivalence des scores est vérifiée par le test d'énumération indépendante (§9, test 9) sur tous les petits graphes, y compris non pertinents. Ne pas afficher de suppressions « magiques » qui troubleraient le joueur.

### 3.3 Graphe et sens des flèches : point crucial

Stocker **un seul graphe canonique orienté** ; ne jamais retourner ses arcs dans l'état logique du moteur.

- Tour Rouge : afficher les flèches dans leur sens canonique ; le coup capture les sommets accessibles **en suivant** les flèches.
- Tour Bleu : afficher les flèches **dans le sens inverse** ; le coup capture les sommets accessibles **en suivant les flèches affichées**, ce qui correspond exactement aux prédécesseurs dans le graphe canonique.
- Cette inversion visuelle est interprétable comme le passage des implications `P ⇒ Q` aux implications contrapositives `¬Q ⇒ ¬P`, **si** les propositions opposées sont bien associées à chaque variable. Il faut simultanément changer le point de vue des propositions si leurs libellés sont affichés. Les arcs et le moteur ne changent jamais.
- Transition animée rapide (~250–400 ms), avec flèches clairement orientées. Une option « réduire les animations » doit exister.
- Prévisualisation d'un coup : au survol sur ordinateur ou au premier toucher sur mobile, éclairer **exactement** les sommets qui seront capturés ; deuxième toucher ou bouton de confirmation pour valider, selon réglage. L'aperçu doit coïncider exactement avec la capture réelle (même fonction de calcul, sans réimplémentation côté UI).
- **À évaluer en test utilisateur (phase C)** : en mode solo, une option « vue figée » où le graphe reste affiché dans le sens canonique pendant tout le jeu, le coup de l'ordinateur (Bleu) étant animé le long des arcs inversés. Elle réduit la fatigue visuelle due au basculement à chaque tour, mais s'écarte de la règle « les deux joueurs suivent les flèches visibles » (§4.5) : ne l'adopter par défaut que si les tests montrent qu'elle ne crée pas de confusion.

### 3.4 Propositions politiques et popularité : habillage facultatif

Un sommet peut afficher un pictogramme abstrait (école, transports, logement, santé, environnement, fiscalité…). Les propositions **ne doivent pas compliquer la partie**. Les noms détaillés sont facultatifs, dans une infobulle ou un panneau secondaire ; les graphes et la mécanique restent prioritaires.

Dans le modèle de la section 6 de l'article, **la couleur d'un sommet *est* la popularité** : un sommet Left correspond à la décision populaire de Left (valeur 1 de la variable dans sa politique), un sommet Right à la décision populaire de Right, et c'est ce qui détermine qui peut l'initier. **L'application n'introduit donc aucune popularité numérique ni paramètre de popularité indépendant de la couleur.** Aucune probabilité de réussite, aucune jauge qui altérerait les règles.

L'interprétation politique de l'article repose sur des décisions binaires, des implications fermées par transitivité et par contraposition, sans équivalence entre variables (ni `x ⇔ y`, ni `x ⇔ ¬y`). Conséquence pratique : **les niveaux à habillage « propositions » doivent être des graphes acycliques** (un circuit orienté impliquerait des équivalences). Le moteur gère les cycles, et les niveaux « réseau abstrait » peuvent en contenir, mais ils ne doivent pas être présentés comme des systèmes de propositions. **Ne pas prétendre qu'un graphe quelconque de pictogrammes représente nécessairement un système cohérent de propositions politiques.** Prévoir un mode « réseau abstrait » par défaut. Des niveaux à interprétation politique pourront être ajoutés ensuite, avec vérification explicite de la cohérence des implications. Aucun message de soutien à un parti ou candidat réel.

## 4. Écrans et parcours

### 4.1 Accueil

Logo `INFLUENCE`, sous-titre discret « Le jeu du pouvoir » / “The game of influence”. Bouton principal **Jouer**. Choix **Contre l'ordinateur** / **Deux joueurs** ; accès **Niveaux**, **Paramètres**, **À propos** ; bascule `FR / EN`. Ne pas obliger à lire le tutoriel. Lancer la première partie en **moins de 10 secondes** pour un utilisateur pressé.

### 4.2 Prépartie

Choix du camp **Rouge / Bleu**, du niveau, de la difficulté de l'ordinateur (Facile, Normal, Expert) et du premier joueur. Choix par défaut raisonnables ; bouton **Jouer maintenant**. Le choix du premier joueur est la principale variable d'équité (voir §5) : prévoir « Rouge commence », « Bleu commence » et « Au hasard ». En mode deux joueurs, les joueurs jouent sur le même écran (pas de multijoueur distant en V1).

### 4.3 Plateau

- Bandeau de tour extrêmement visible ; score permanent ; menu pause, son, aide.
- **Compteur « sommets jouables restants »** pour chaque camp, avec alerte visuelle et textuelle quand un camp n'en a plus qu'un (voir fin anticipée ci-dessous).
- Graphe au centre, **nœuds suffisamment espacés** et grandes zones tactiles (au moins 44 × 44 px), flèches nettes sans ambiguïté ; pas d'animations qui masquent les arcs.
- **L'appartenance d'un sommet à un camp ne repose pas sur la seule couleur** : forme, liseré ou symbole distinct pour Rouge et Bleu, en plus de la couleur.
- Au premier contact avec un sommet légal : prévisualisation de la capture ; validation explicite ou second contact ; possibilité de désactiver la confirmation dans les paramètres.
- Après le coup : animation courte de capture, incrément du score, retrait des nœuds, inversion des flèches, changement de bandeau.
- Si l'adversaire n'a plus de coup, attribution automatique des sommets restants, **avec explication visuelle et comptable** (« Plus aucun sommet bleu : les N sommets restants vont au Rouge »). C'est la règle la plus contre-intuitive du jeu ; le score affiché en cours de partie peut être trompeur à cause d'elle, d'où le compteur ci-dessus.
- Boutons : recommencer, retour accueil, son ; « annuler » uniquement si la politique de mode le permet (en solo : retour au dernier tour humain, sans tricher sur les scores ; en deux joueurs : accord local ou option activée).

### 4.4 Fin de partie

Victoire Rouge / Victoire Bleu / Égalité, scores finaux, petite animation joyeuse, **Rejouer**, **Niveau suivant**, **Accueil**. Proposer de rejouer avec le camp opposé. Partage de résultat facultatif, sans données personnelles.

### 4.5 Tutoriel ultra-court

Trois indications, superposées à un petit plateau jouable, fermables à tout moment :
1. « Choisis un sommet de ta couleur. »
2. « Tu captures ce sommet et tous ceux qu'indiquent les flèches. »
3. « Capture plus de sommets que ton adversaire ! »

Pour le Bleu, les flèches sont déjà retournées : **les deux joueurs suivent toujours les flèches visibles**. Montrer, ne pas raconter. Aide accessible à tout moment, sans bloquer la partie. L'aide (pas le tutoriel de trois indications) explique la règle de fin : « Si tu n'as plus de sommet de ta couleur à ton tour, l'adversaire prend tout ce qui reste. »

## 5. Ordinateur et niveaux

**Moteur de règles indépendant de l'UI** ; positions immuables ou sérialisables ; coups légaux et transitions purs ; tests unitaires.

- **Facile** : stratégie compréhensible, avec erreurs contrôlées, sans coups illégaux.
- **Normal** : heuristique raisonnable, recherche limitée et temps de réponse court.
- **Expert** : recherche exacte minimax / négamax sur les petits graphes, mémoïsation/transpositions (clé = ensemble des sommets restants + joueur au trait), alpha-bêta si adapté ; recherche bornée avec heuristique pour les grands graphes. Toujours optimiser le **score final**, et non seulement le nombre capturé immédiatement. Plafond de taille de l'exact à déterminer par mesure (voir §8, entiers 32 bits).
- Afficher un bref indicateur « L'ordinateur réfléchit… » si nécessaire. Pas de blocage perceptible de l'interface ; Web Worker recommandé.
- Prévoir des budgets de calcul explicites selon appareils et une solution de repli valide en cas de dépassement.

**Optimisation de coups dominés (facultative, solveur uniquement).** D'après l'article (Corollaire 13, établi pour les graphes pertinents), un coup dont l'ensemble capturé est contenu dans celui d'un autre coup du même joueur n'est pas meilleur que ce dernier. Le solveur peut s'en servir pour élaguer, **seulement si** le test d'énumération indépendante (§9, test 9) passe avec l'élagage activé sur des graphes quelconques, non pertinents compris. Ne pas s'en servir pour le niveau Facile ni pour masquer des coups au joueur.

**Ne pas décomposer le calcul par composantes** en s'appuyant sur le Corollaire 14 de l'article : il ne donne que des **bornes** sur le score d'une somme de jeux, pas une égalité.

### Niveaux

Première livraison de **12 plateaux soigneusement validés** (petits chemins, arbres, réseaux), puis extension visée à **30** après tests utilisateurs. Aucun niveau publié sans contrôle automatique : graphe valide, jouabilité, durée, répartition des coups, scores finaux, intérêt stratégique.

**Métadonnées obligatoires par niveau, calculées par le solveur exact et stockées avec le niveau :**
- `Ls` et `Rs`, les scores relatifs de l'article (différence de scores Rouge − Bleu quand Rouge commence, respectivement quand Bleu commence, avec jeu optimal) ; on en déduit le score absolu de chaque camp pour chaque premier joueur : `scoreRouge = (|V| + Ls)/2` si Rouge commence, `(|V| + Rs)/2` si Bleu commence ;
- `|V|`, nombre de sommets de chaque couleur, nombre d'arcs ;
- indicateur « auto-opposé » (le graphe est isomorphe à son opposé : couleurs échangées et arcs inversés) ;
- écart entre le meilleur coup glouton (celui qui capture le plus) et le coup optimal au premier tour ;
- nombre de coups non dominés au premier tour.

**Règles d'équité.** L'article démontre que le jeu est sans zugzwang sur les graphes pertinents (`Ls ≥ Rs`), et le test empirique de la §9 le confirme sur les règles originales pour les petits graphes. Conséquence : il est impossible que le **second** joueur gagne dans les deux ordres de jeu. Un niveau relève donc de l'un de ces types : « celui qui commence gagne » (`Ls > 0 > Rs`), « un camp gagne quel que soit le premier joueur », ou « nul ». Les types doivent être **équilibrés dans la collection** : ne pas publier 12 niveaux « Rouge qui commence gagne ». Les niveaux auto-opposés (`Rs = −Ls`) donnent une manche aller-retour équitable. Pour `|V|` impair, l'égalité est impossible.

**Intérêt stratégique.** Écarter les niveaux dont le coup glouton est toujours optimal et ceux où presque tous les coups mènent au même score. Garder au moins quelques niveaux où le coup optimal n'est pas le coup glouton.

**Niveaux « la position compte plus que le nombre ».** L'article (Théorème 28) montre des familles où le camp minoritaire en nombre capture presque tout grâce à sa position (arbres ternaires `T_n^c`, jeu sur deux copies). Le théorème est asymptotique : utiliser le solveur pour chercher les **plus petites instances** présentant le phénomène (camp minoritaire en nombre mais gagnant), et en retenir une ou deux comme niveaux « surprise ».

Les positions peuvent être asymétriques. Prévoir des positions opposées (couleurs échangées et arcs inversés) pour vérifier la symétrie.

**Défi quotidien** : option V1.1, déterministe par date et fuseau clairement défini, sans serveur ; ne pas retarder la V1.

## 6. Internationalisation et conventions politiques

Internationalisation **FR/EN** dès le départ, via dictionnaires de chaînes ; aucune phrase codée en dur dans les composants. Changement de langue sans perdre la partie ; persistance locale de la préférence.

**Rouge et Bleu désignent uniquement les équipes**. Ne jamais afficher automatiquement « Rouge = gauche / Bleu = droite » : la convention électorale américaine est différente de la convention française. Les éventuelles propositions sont fictives, sans référence à des partis réels. Les deux couleurs doivent fonctionner dans les deux langues sans explication culturelle.

## 7. Accessibilité, mobile et performance

Interface responsive : smartphone portrait, tablette, desktop. Pour les grands graphes, zoom et déplacement du plateau, recentrage, disposition automatique évitant les chevauchements. Interactions souris, tactile et clavier ; focus visible ; étiquettes accessibles ; contrastes vérifiés ; indication du tour et appartenance des sommets non exclusivement colorées ; mode animation réduite (`prefers-reduced-motion`). Audio discret et désactivable, **jamais nécessaire** pour comprendre l'état.

Éviter les dépendances lourdes ; déploiement statique GitHub Pages, sans compte ni collecte de données. Sauvegarde de la progression et des réglages en `localStorage`. Ne pas demander d'autorisations inutiles.

## 8. Architecture proposée

Répertoire `apps/influence/` avec fichiers statiques et ressources locales ; TypeScript + Vite (ou JavaScript modulaire sans build si cela facilite l'intégration au site), SVG pour le graphe et les flèches, CSS pour l'interface, Web Worker pour le solveur si nécessaire. Privilégier la simplicité et la maintenabilité.

Modules distincts :
- `engine/` : graphe canonique, accessibilité, coups, scores, fin de partie ;
- `ai/` : solveur, heuristiques, cache, limites de temps ;
- `levels/` : données validées et métadonnées ;
- `ui/` : écrans, animations, SVG et interactions ;
- `i18n/` : FR/EN ;
- `tests/` : unitaires, propriétés, intégration, parcours.

Le code doit permettre ultérieurement l'ajout de plateaux, d'un éditeur et du partage de défis, sans les imposer dans la V1.

**Contraintes techniques :**
- **Ensembles de sommets en masque de bits** : les opérateurs binaires de JavaScript travaillent sur 32 bits. Au-delà de 31 sommets, utiliser des tableaux de `Uint32` ou des `BigInt`, ou fixer un plafond explicite (par exemple 30 sommets) pour le solveur exact et la mémoïsation, avec repli heuristique au-delà. Tester le comportement aux bornes (31, 32, 33 sommets).
- **Vite et GitHub Pages** : le site est un site utilisateur (dépôt `PrStephaneGonzalez.github.io`) et l'application vit dans un sous-dossier ; fixer `base: './'` (ou le chemin adéquat) pour que les ressources se résolvent. Décider et documenter si le dossier `dist/` est **commité** ou produit par une **Action GitHub** ; vérifier que le déploiement du reste du site n'est pas affecté. Le mode « JavaScript modulaire sans build » évite entièrement ce point.
- **Web Worker** : vérifier le chargement du worker depuis le sous-dossier, en local et en production.

## 9. Tests et critères d'acceptation

**Tests moteur obligatoires :**
1. `Succ` et `Pred` incluent le sommet de départ et suivent les chemins transitifs, pas seulement les voisins directs.
2. La suppression produit bien le sous-graphe induit.
3. Capture de sommets adverses et cycles éventuels correctement gérés.
4. Si le joueur actif n'a plus de sommet, fin immédiate et attribution de **tous** les restants à l'autre camp.
5. Conservation du nombre de sommets dans le score final, y compris fin anticipée.
6. Inversion **visuelle** des flèches au tour Bleu, sans mutation du graphe logique.
7. Pour chaque sommet jouable, prévisualisation = capture réelle (même ensemble de sommets).
8. **Symétrie.** Soit `−H` le graphe obtenu à partir de `H` en échangeant les couleurs Rouge/Bleu et en inversant tous les arcs. Alors `Ls(−H) = −Rs(H)` et `Rs(−H) = −Ls(H)`. Équivalent en scores absolus : le score de Rouge dans `−H` quand Rouge commence égale le score de Bleu dans `H` quand Bleu commence.
9. **Énumération indépendante.** Une seconde implémentation, sans mémoïsation ni élagage, écrite séparément du solveur (idéalement dans un autre langage ou au moins un autre module sans code partagé), fournit les scores de référence. Le solveur exact est comparé à elle sur **tous les graphes orientés étiquetés à au plus 4 sommets avec toutes les colorations** (à 5 sommets : exhaustif si le temps de calcul le permet, sinon par échantillonnage), et sur un grand échantillon aléatoire de graphes jusqu'à 9 ou 10 sommets, graphes cycliques inclus. Si l'élagage par coups dominés ou le retrait anticipé des sommets forcés est activé dans le solveur, ce test est refait avec ces options.
10. IA toujours légale ; niveaux de difficulté reproductibles avec graine contrôlée pour les tests.

**Tests de référence tirés de l'article** (à implémenter en phase A) :
11. **Exemple 3 / Fig. 1** : reconstituer le graphe à six sommets `u, v, w, x, y, z` à partir de la Figure 1 de l'article (le texte extrait du PDF ne rend pas les arcs : lire la figure) et vérifier `sL1 = 4`, `sR2 = 2`, `sR1 = 6`, `sL2 = 0`, d'où `Ls = 2`, `Rs = −6`. Vérifier aussi les deux scénarios de l'introduction (Black commence en `u` : 4 contre 2 ; White commence en `y` : 6 contre 0 par fin anticipée).
12. **Segments** (Définition 16) : sommets `1..n`, sommets pairs = Rouge, impairs = Bleu, arcs de chaque pair vers ses voisins impairs (pour `n` impair, le segment est dans `C−` : les deux extrémités sont bleues). Valeurs `Ls(S_n)` et `Rs(S_n)`, **recalculées de façon indépendante et conformes au Tableau 1 de l'article pour n = 1 à 24** :

   | n | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
   |---|---|---|---|---|---|---|---|---|---|----|----|----|
   | Ls | −1 | 2 | 3 | 4 | 1 | 2 | 3 | 2 | 1 | 2 | 3 | 2 |
   | Rs | −1 | −2 | −3 | −4 | −5 | −2 | −1 | −2 | −3 | −2 | −1 | −2 |

   | n | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 |
   |---|----|----|----|----|----|----|----|----|----|----|----|----|
   | Ls | 1 | 4 | 3 | 2 | 1 | 2 | 3 | 2 | 1 | 4 | 3 | 2 |
   | Rs | −3 | −4 | −3 | −2 | −3 | −2 | −3 | −2 | −5 | −4 | −3 | −2 |

   Le Tableau 1 de l'article donne les valeurs jusqu'à `n = 38` ; les ajouter si le solveur le permet en temps raisonnable (test lent, hors intégration continue rapide).
13. **Théorème 20** : pour tout segment, `Ls > 0` ; si `n` est pair, `Ls ∈ {2, 4}` et `Rs ∈ {−2, −4}` ; si `|L|` est impair dans `C−`, `Ls = 3`.
14. **Cycles** (Corollaire 24) : pour un segment de nombre pair de sommets auquel on ajoute l'arc reliant l'extrémité rouge à l'extrémité bleue, `Ls ∈ {0, 2}`, et `Ls = 0` si `|L|` est impair.
15. **Sommes opposées** (Corollaire 15) : pour tout graphe `H`, `Ls(H + (−H)) = Rs(H + (−H)) = 0`, où `+` désigne l'union disjointe.
16. **Absence de zugzwang** : sur les petits graphes, y compris non pertinents (règles originales), `Ls ≥ Rs` pour toute position atteignable. Une violation signalerait soit une erreur du moteur, soit une divergence entre règles originales et règles « pertinentes » à analyser avant d'activer toute optimisation.
17. **Parité** (Lemme 5) : `Ls`, `Rs` et `|V|` ont la même parité.

**Tests d'interface :** parcours complet FR et EN, souris et tactile, changement de camp, fin par absence de coup, reprise de progression, contraste et tailles tactiles, mise en page mobile, animations réduites, retour accueil, modes 2 joueurs et ordinateur. Vérifier qu'il n'existe aucune confusion sur **qui doit jouer** ni sur **ce qui est capturé**.

**Critères de livraison :** application accessible sur GitHub Pages ; tests automatiques verts ; aucune erreur console bloquante ; au moins 12 niveaux jouables avec leurs métadonnées d'équité et une répartition équilibrée des types (§5) ; tutoriel évitable ; écran final correct ; source et crédits accessibles ; guide de lancement local et de déploiement.

## 10. Crédit scientifique et lien vers l'article

Rubrique discrète **« Derrière le jeu » / “Behind the game”** dans l'accueil et l'aide :

> INFLUENCE est adapté d'un jeu mathématique étudié par Eric Duchêne, Stéphane Gonzalez, Aline Parreau, Eric Rémila et Philippe Solal dans *Theoretical Computer Science* (2021). Les règles de capture sur graphe et leurs propriétés stratégiques sont étudiées dans cet article. Les niveaux, graphismes et modes de jeu sont des adaptations de l'application.

Lien : `https://doi.org/10.1016/j.tcs.2021.05.028` (nouvel onglet, `rel="noopener noreferrer"`). Citation complète visible. Ne pas laisser croire que l'article décrit les graphismes, les niveaux ou l'IA du site.

## 11. Phases de réalisation et méthode de travail

**Phase A — Fondations vérifiables** : inspecter la structure du dépôt ; écrire le moteur, le solveur exact de référence et les tests (§9, tests 1 à 17) ; implémenter les graphes d'exemple de l'article ; prouver par tests la symétrie des deux camps. **Ne pas commencer par l'habillage.**

**Phase B — Prototype complet** : accueil clair, plateau SVG, sens des flèches par joueur, sélection/aperçu/confirmation, scores et compteurs de sommets jouables, fin de partie, 2 joueurs, IA simple, FR/EN, 4 plateaux.

**Phase C — Version grand public** : appliquer la direction artistique retenue, animations, 12 niveaux validés (avec métadonnées d'équité), trois difficultés, tutoriel très court, mobile/accessibilité, rubrique scientifique, évaluation de la « vue figée » en solo.

**Phase D — Audit et publication** : tests exhaustifs sur petits graphes, tests de parcours utilisateur, captures d'écran mobile/desktop, correction des anomalies, intégration propre au site, documentation et déploiement.

**À chaque phase :** fournir un résumé des changements, commandes de test et résultats, captures d'écran de l'interface, limites connues et liste des fichiers modifiés. **Ne pas déclarer un test réussi sans l'avoir exécuté.** **S'arrêter à la fin de chaque phase et attendre la validation explicite de l'utilisateur avant d'entamer la suivante** (en particulier : pas de phase B avant validation du moteur). Ne pas pousser ni publier sans instruction explicite.

Il est utile de placer à la racine de `apps/influence/` un court fichier de consignes (nom selon l'outil utilisé) qui renvoie à ce cahier, rappelle les commandes de test et la règle d'arrêt entre phases.

## 12. Hors périmètre initial

Pas de compte utilisateur, publicité intégrée, monétisation, classement mondial, sondages réels, candidats réels, multijoueur réseau, probabilités de convaincre, simulation électorale complexe, narration longue ou éditeur de graphes. Ces extensions seront discutées après les premiers tests utilisateurs.

## 13. Instruction de démarrage

« Lis `CAHIER_DES_CHARGES.md` (v1.1), les deux images de référence et l'article scientifique joints. Examine le dépôt existant avant toute modification. Commence par la Phase A : propose brièvement une architecture, implémente le moteur fidèle aux règles de l'article, un solveur exact et une énumération de référence indépendante, puis la batterie de tests du §9 (règle de fin de partie, capture transitive, symétrie `Ls(−H) = −Rs(H)`, valeurs de référence de l'article). Exécute les tests et rends compte des résultats. **Arrête-toi à la fin de la phase A et attends ma validation** avant d'entamer la phase B. La direction visuelle définitive est `reference_design_retenu.png`, en corrigeant ses incohérences listées au §2 ; `reference_design_initial.png` n'est qu'une référence secondaire. »