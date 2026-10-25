# INFLUENCE

Jeu de stratégie bilingue FR/EN, sans installation, sans dépendances, sans
compte et sans service distant. Ouvrir `index.html` via un serveur HTTP.

## Jouer et déployer

```sh
# Depuis le dépôt :
python3 -m http.server 8000
# Puis http://localhost:8000/apps/influence/
```

Les fichiers sont directement déployables sur GitHub Pages. Le site Quarto
copie déjà `apps/**` : aucun build JavaScript ni changement du workflow
n'est nécessaire. Le worker est chargé relativement à `ui/app.mjs`.
Ne pas ouvrir l'application via `file://` : les modules et le worker
nécessitent HTTP(S).

L'application comprend 12 plateaux, deux joueurs sur le même écran, un mode
solo à trois difficultés, le choix du camp et du premier joueur, l'aperçu
puis la confirmation, l'annulation, un défi quotidien (rotation de plateaux
existants, date UTC), le zoom et le déplacement après agrandissement. Les
préférences, la partie et les étoiles de victoire sont sauvées localement.
Une restriction du stockage privé n'empêche pas de jouer.

La vue suit le joueur actif par défaut. Une option de vue figée en solo est
expérimentale et indique explicitement que l'ordinateur joue dans le sens
inverse. L'option ne change jamais le graphe canonique ni les captures.

## Vérifier

Node >=20 et Python >=3.9. Aucune installation de paquets.

```sh
npm test
npm run test:exhaustive
npm run test:segments
```

`npm test` : 23 tests dont 216 parties complètes, les métadonnées des 12
plateaux, les traductions FR/EN, les règles et valeurs de référence de
l'article. Le second oracle Python structurel contrôle les 38 segments.

`test:exhaustive` confronte le solveur à un oracle Python indépendant sans
mémoïsation : 67 267 graphes, dont tous les graphes orientés sans boucle et
toutes leurs colorations jusqu'à quatre sommets. Les boucles sont couvertes
par les tests de règles et le corpus aléatoire.

`npm run levels:rebuild` recrée le catalogue de façon déterministe et écrit
ses analyses exactes. Les positions sont sélectionnées selon leurs types,
la variété des valeurs des coups, les pièges gloutons, et les distances
entre cibles tactiles. Le premier plateau est volontairement symétrique et
simple pour apprendre. Le plateau « Les deux jardins » est une somme de
graphes opposés ; ses valeurs sont résolues sur le graphe entier.

## Architecture

- `engine/` : graphe immuable, BigInt, captures, scores et sauvegardes.
- `ai/` : minimax exact, heuristique à deux coups, choix aléatoire facile,
  et Web Worker. Expert : 20 sommets restants, 200 000 états, 1 200 ms ;
  repli légal Normal en cas de limite, de panne du worker ou après 2 200 ms.
  Les 12 plateaux ont 8 à 12 sommets et ont été résolus exactement.
- `levels/catalog.json` : positions, noms FR/EN, Ls/Rs et métadonnées.
- `ui/` : SVG, interface, interactions, clavier et responsive.
- `i18n/` : dictionnaires FR/EN.
- `tests/` : règles, article, oracles et parties complètes.
- `docs/PHASE_A.md` : vérification mathématique et exception du cycle à 4.
- `docs/RELEASE.md` : validation de la version jouable.

Rouge = L/Black, Bleu = R/White. Aucun retrait anticipé des sommets forcés,
aucun élagage par dominance, aucune addition des scores des composantes.
Aperçu et capture partagent strictement la même fonction de règles.

## Référence

Eric Duchêne, Stéphane Gonzalez, Aline Parreau, Eric Rémila, Philippe Solal
(2021), *influence: A partizan scoring game on graphs*, Theoretical Computer
Science 878–879, 26–46. https://doi.org/10.1016/j.tcs.2021.05.028

Les règles viennent de l'article. Le design, l'IA et les plateaux sont des
adaptations pour l'application. Le cahier v1.1 d'origine est conservé ; les
précisions mathématiques sont documentées dans le rapport de phase A.
