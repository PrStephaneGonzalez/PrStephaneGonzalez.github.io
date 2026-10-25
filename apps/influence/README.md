# INFLUENCE

Jeu de stratégie bilingue FR/EN, sans installation, sans dépendances, sans
service distant (les profils sont locaux à l'appareil, voir ci-dessous). Ouvrir `index.html` via un serveur HTTP.

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
la prise directe d'un pion (la confirmation reste une option), l'annulation, un défi quotidien (rotation de plateaux
existants, date UTC), le zoom et le déplacement après agrandissement. Les
préférences, la partie et les victoires sont sauvées localement.
Une restriction du stockage privé n'empêche pas de jouer.

La vue suit le joueur actif par défaut. Une option de vue figée en solo est
expérimentale et indique explicitement que l'ordinateur joue dans le sens
inverse. L'option ne change jamais le graphe canonique ni les captures.

## Expérience de jeu (v1.1)

- **Prise directe** : toucher un pion le joue aussitôt ; les pions capturés
  tombent en cascade, par vagues le long des flèches (`ui/cascade.mjs`).
  L'option « confirmer avant de jouer » (réglages) rétablit aperçu + bouton.
- **Tour de l'ordinateur** : courte pause, une main désigne le pion choisi,
  aperçu des pions visés, puis cascade. Vitesse réglable (calme / normal /
  rapide) ; un toucher sur le plateau passe les pauses ; « animations
  réduites » supprime la main et raccourcit les pauses.
- **Sons** (`ui/audio.mjs`) : synthèse Web Audio, aucun fichier audio ; une
  note de gamme pentatonique par pion tombé, l'ordinateur une octave plus
  bas. Bouton muet dans l'en-tête. Le son n'est jamais nécessaire au jeu.
- **Profils locaux** (`ui/profiles.mjs`) : un prénom (2 à 16 caractères, 8
  profils maximum) conserve la progression sur l'appareil, avec médailles
  Rouge/Bleu par plateau. La progression d'avant (invité) est reprise par le
  premier profil créé. Aucune donnée ne quitte l'appareil ; pour changer
  d'appareil, exporter un code `INF1.…` et l'importer ailleurs (fusion par
  union des victoires).
- **Sauvegarde en ligne facultative** (`ui/cloud.mjs`, `docs/supabase-influence.sql`) :
  en ajoutant un code secret de 4 à 6 chiffres à son nom, la progression est
  aussi sauvegardée dans le projet Supabase partagé avec les autres applis, et
  retrouvée sur tout appareil avec le même nom et le même code (comme fil-or).
  Seule l'empreinte SHA-256 de « nom + code » est envoyée, avec les victoires et
  le nombre de parties ; la table n'est lisible que par quatre fonctions
  `influence_*`. Fusion par union des victoires, révisions contre les écritures
  concurrentes, jamais bloquant : sans réseau on joue normalement. Le code ne
  peut pas être récupéré s'il est oublié.
- Clés `localStorage` : `influence.v1.settings` (`confirm`, `sound`, `speed`,
  `ver`, …), `influence.v1.profiles` (`version:1`, avec `cloud:{key,rev,at}` si la sauvegarde en ligne est activée), `influence.v1.progress`
  (ancien format, migré).

## Vérifier

Node >=20 et Python >=3.9. Aucune installation de paquets.

```sh
npm test
npm run test:exhaustive
npm run test:segments
```

`npm test` : 37 tests dont 216 parties complètes, les métadonnées des 12
plateaux, les traductions FR/EN, les cascades et profils locaux (`tests/ui-modules.test.mjs`, `tests/cloud.test.mjs`), les règles et valeurs de référence de
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
