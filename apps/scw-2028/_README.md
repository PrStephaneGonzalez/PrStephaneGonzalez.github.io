# SCW 2028 · Salle d'organisation

Outil de suivi des tâches du comité local d'organisation de SCW 2028 (Lyon et Saint-Étienne).
Adresse : https://stephanegonzalez.eu/apps/scw-2028/ — page **non référencée** (`noindex`), liée nulle part sur le site.
Remplace depuis le 16/11/2026 la version hébergée sur ChatGPT ; c'est désormais cette version qui fait foi.

## Accès et données

- Les tâches ne sont **pas** dans ce dépôt (il est public). Elles sont dans le projet Supabase partagé du site,
  tables `scw_*`, accessibles uniquement par les fonctions `scw_list`, `scw_save`, `scw_delete`, `scw_log`, `scw_meta_save`.
- Chaque appel exige le **code d'équipe**, vérifié côté serveur (empreinte bcrypt dans `scw_access`).
  Le code n'est écrit nulle part dans le dépôt. Pour le changer : voir l'en-tête de `docs/supabase-scw.sql`.
- Chaque modification (tâches, jalons, rôles) est historisée dans `scw_history` avec le prénom saisi à la connexion ;
  le journal de l'application permet de rétablir la version précédente d'une tâche.
- Deux personnes qui modifient la même tâche en même temps : la seconde est prévenue (numéro de version par tâche).
- `scw_meta` contient deux documents partagés : `milestones` (jalons datés) et `team` (rôles et titulaires).

## Une tâche

Colonne JSON `data` ; ajouter un champ ne demande aucune migration (le déclarer dans `TEXT_FIELDS` de `api.js`).

| Champ | Sens |
|---|---|
| `title`, `titleFr` | Titre en anglais simple (langue par défaut de l'outil) et en français |
| `deliverable` | Résultat attendu : à quoi on reconnaît que c'est fait |
| `status`, `priority` | Statut (`To do`, `In progress`, `Waiting`, `Decision needed`, `Blocked`, `Done`) et priorité (`Urgent` … `Low`) |
| `effort` | Charge : `hours`, `days`, `weeks` |
| `person` | Responsables séparés par « / » ; **le premier est le responsable**, les suivants contribuent |
| `dependsOn` | Prérequis, identifiants séparés par des virgules |
| `planningDate`, `due` | Cible interne, échéance ferme (dates ISO) |
| `anchor`, `anchorOffset` | À défaut de date : jalon de référence et décalage en jours (ex. `reg-open`, `-14`) |
| `timing`, `startWhen` | Repères en texte libre (interprétés en dernier recours : « Q2 2027 »…) |
| `kind` | `task`, `rule` (exigence permanente) ou `recurring` (rituel) ; les deux derniers ne bloquent rien |
| `topic` | Sujet transversal qui regroupe des tâches de domaines différents |
| `checklist` | Sous-étapes `[{ text, done }]` |
| `takers` | Prénoms des personnes qui ont cliqué « I'll do it / Je m'en occupe » (plusieurs possibles) |
| `doneBy`, `doneAt` | Qui a marqué la tâche faite, et quand (renseignés automatiquement) |
| `deliverableFr` | Résultat attendu en français (`deliverable` est en anglais simple) |
| `decision` | Décision prise (demandée quand on clôt une « décision à prendre ») |
| `notes`, `provenance`, `sourceRecord` | Contexte (en anglais), origine, fiche d'origine du classeur de septembre 2026 |

## Fichiers (JavaScript sans dépendance, aucune étape de construction)

| Fichier | Rôle |
|---|---|
| `index.html` | Page, balise `noindex`, polices |
| `style.css` | Mise en forme (palette et « fil » décrits en tête du fichier) |
| `model.js` | Logique pure : ordre logique (tri topologique), dates cibles, tâches prêtes, retards, ordre du jour, export |
| `api.js` | Appels aux fonctions Supabase `scw_*` |
| `core.js` | État partagé de l'interface, filtres, libellés |
| `views.js` | Vues : accueil (frise des jalons), mes tâches, à faire, feuille de route, décisions, équipe et repères, journal |
| `drawer.js` | Fiche d'une tâche (modification, sous-étapes, historique) |
| `app.js` | Connexion, synchronisation, actions rapides (faite, je m'en occupe, statut, annuler), événements |
| `xlsx.js` | Fichier Excel généré dans le navigateur (bouton « Download as Excel ») |
| `i18n.js` | Textes de l'interface en français et en anglais, libellés, vocabulaire |
| `docs/supabase-scw.sql` | Schéma et fonctions côté serveur |
| `tests/model.test.mjs` | Tests de `model.js` : `node --test apps/scw-2028/tests/model.test.mjs` |

## Ordre de travail et dates

L'onglet « Tasks » montre toutes les tâches ouvertes dans un seul ordre, calculé dans `model.js` (`analyse`) :

1. **Échéance effective** : date cible de la tâche (échéance ferme, sinon cible interne, sinon jalon + décalage),
   sinon repère en texte libre (fin du mois indiqué). Si une tâche qui l'attend doit finir plus tôt, l'échéance est
   ramenée à « échéance de la suivante − durée de la suivante » (affiché « needed for … »).
2. **Importance effective** : poids Urgent 8, High 4, Medium 2, Low 1 ; un prérequis prend le poids le plus fort
   des tâches qui l'attendent.
3. **Durée** : few hours = 1 jour, few days = 3, several weeks = 10 (non estimée = 3).
4. **Score** (règle ATC, « apparent tardiness cost ») : importance / durée × exp(−marge / 30), avec
   marge = jours restants avant l'échéance − durée (au moins 0).
5. **Liste** : groupée par horizon (en retard, 4 semaines, 3 mois, puis par année, semaine de la conférence, après,
   sans date), puis par score décroissant ; une tâche n'est jamais placée avant un prérequis encore ouvert.

Paramètres modifiables en haut de la section « Paramètres de l'ordonnancement » de `model.js` (WEIGHT, DURATION, TAU).
Une tâche est **prête** quand tous ses prérequis (hors règles et rituels) sont terminés ; sinon la ligne affiche
« First: … ». Modifier un jalon dans « Team and dates » recale toutes les tâches rattachées.
L'interface refuse les prérequis qui créeraient une boucle.

## Révision du 16/11/2026

Les 210 tâches importées ont été révisées (historique conservé, auteur « Claude (révision du 16/11/2026) ») :
titres français, résultat attendu, charge, responsables normalisés, 15 priorités et 9 dépendances corrigées
(raison notée dans chaque tâche), règles et rituels distingués, sujets transversaux, jalons de référence ;
13 tâches ajoutées (prix jeunes chercheurs, lettres de visa, attestations, etc.). Les jalons sont provisoires.

## Modifier l'application

Modifier les fichiers directement puis pousser sur `main` (le site est publié par GitHub Actions).
Tout nouveau texte d'interface va dans les deux langues de `i18n.js`.
Après une modification, changer partout le suffixe de version `?v=…` (dans `index.html` et dans les `import`) :
sinon des navigateurs peuvent mélanger anciens et nouveaux fichiers pendant quelques minutes.

## Révision du 16/11/2026 (soir)

Contenu en anglais simple (« globish ») pour les organisateurs non francophones ; le français reste disponible
(bouton de langue, champs `titleFr`, `deliverableFr`). Chacun peut cliquer « I'll do it » sur une tâche : son prénom
s'affiche dans une pastille de couleur (une couleur par personne) ; un clic sur une pastille filtre les tâches de
cette personne. Les tâches faites restent visibles, barrées et grisées, avec « Done: prénom, date ».
11 tâches ajoutées : GOV-009 (donner l'accès à l'équipe) et INC-001 à INC-010 (accessibilité, allergènes, inclusion).

## Révision du 16/11/2026 (nuit) : interface simplifiée

- Quatre onglets : Tasks (toutes les tâches, ordre de travail), Decisions (avec l'ordre du jour de réunion),
  Team and dates (frise des jalons, personnes, dates clés, règles, glossaire), History.
- Filtres rapides : All, Mine, Nobody on it, Late ; recherche ; « More filters » (domaine, priorité, rôle).
- Chaque tâche a deux gros boutons : « I'll do it » (prend la couleur de la personne) et « Mark done » (vert).
  Après un clic, la tâche reste à sa place, s'éclaire un instant, et un message propose « Undo ».
- Les tâches faites sont regroupées en bas (« Done tasks »), barrées et grisées.
- Export Excel : colonnes « Order » (rang dans l'ordre de travail) et « Do by » (échéance effective) ajoutées.

## Révision du 25/11/2026 : trois groupes de travail

- Chaque tâche porte un groupe (champ `tag` : `admin`, `science` ou `social`), affiché en pastille sur la carte et filtrable en un clic (trois boutons au-dessus de « Toutes / Les miennes… »). Le groupe se change dans la fiche de la tâche.
  - **Administration et financement** (administration, budget, lieu, inscriptions, supervision) : responsable Stephane.
  - **Science et communication** (programme, soumissions, invités, site web, communication) : responsable zoi.
  - **Événements sociaux et inclusion** (repas, soirées, accueil, soutien aux étudiants, accessibilité) : responsable ANTOINETTE.
- Le classement initial vient du domaine de chaque tâche (`tagForDomain` dans `model.js`), avec quelques exceptions décidées une à une (par exemple l'accueil des familles, le code de conduite, la clôture financière). Une tâche sans groupe prend celui de son domaine.
- Le responsable du groupe a été ajouté comme « Je m'en occupe » sur toutes les tâches non faites du groupe ; les autres personnes déjà inscrites sont conservées. Chacun peut se retirer d'une tâche en recliquant sur le bouton.
- Les prénoms sont maintenant comparés sans tenir compte des accents ni des majuscules (« Stéphane » = « stephane »).
- Le comité local (onglet Équipe) : Stéphane, Antoinette, Zoi, Federico, Taï, Federica, Benoît, Lily, Jean-Baptiste, Antoine. Philippe, proposé auparavant, n'y figure plus.
- Export Excel : nouvelle colonne « Groupe ».

