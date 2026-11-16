# SCW 2028 · Salle d'organisation

Outil de suivi des tâches du comité local d'organisation de SCW 2028 (Lyon et Saint-Étienne).
Adresse : https://stephanegonzalez.eu/apps/scw-2028/ — page **non référencée** (`noindex`), liée nulle part sur le site.

Remplace depuis le 16/11/2026 la version hébergée sur ChatGPT (scw-2028-organising-room.g1stephane.chatgpt.site),
dont les 210 tâches ont été importées ce jour-là. C'est désormais cette version qui fait foi.

## Accès et données

- Les tâches ne sont **pas** dans ce dépôt (il est public). Elles sont dans le projet Supabase partagé du site,
  tables `scw_*`, accessibles uniquement par les fonctions `scw_list`, `scw_save`, `scw_delete`, `scw_log`.
- Chaque appel exige le **code d'équipe**, vérifié côté serveur (empreinte bcrypt dans `scw_access`).
  Le code n'est écrit nulle part dans le dépôt. Pour le changer : voir l'en-tête de `docs/supabase-scw.sql`.
- Chaque modification est historisée (`scw_history`) avec le prénom saisi à la connexion.
- Deux personnes qui modifient la même tâche en même temps : la seconde est prévenue et doit refaire sa modification
  (numéro de version par tâche).

## Fichiers (JavaScript sans dépendance, aucune étape de construction)

| Fichier | Rôle |
|---|---|
| `index.html` | Page, balise `noindex`, polices |
| `style.css` | Mise en forme (palette et « fil » décrits en tête du fichier) |
| `model.js` | Logique pure : ordre logique (tri topologique), tâches prêtes, retards, boucles, phases |
| `api.js` | Appels aux fonctions Supabase `scw_*` |
| `i18n.js` | Textes de l'interface en français et en anglais, libellés des statuts et domaines |
| `app.js` | Interface : vues, fiche d'une tâche, filtres, connexion |
| `docs/supabase-scw.sql` | Schéma et fonctions côté serveur |
| `tests/model.test.mjs` | Tests de `model.js` : `node --test apps/scw-2028/tests/model.test.mjs` |

## Ordre logique

Le champ « Prérequis » (`dependsOn`, ex. `CAL-008, BUD-001`) relie les tâches. L'ordre affiché est un tri topologique :
une tâche n'apparaît jamais avant ses prérequis. À égalité, la tâche au repère le plus tôt passe d'abord
(date cible interne, sinon texte « Calendrier »/« Démarrage » interprété : `Q2 2027`, `30 days before the conference`…),
puis la plus prioritaire. Une tâche est **prête** quand tous ses prérequis sont terminés.
La conférence est supposée en juin 2028 (`CONFERENCE_MONTH` dans `model.js`) pour situer les repères relatifs.

L'interface refuse d'enregistrer des prérequis qui créeraient une boucle. Quatre boucles présentes dans les données
d'origine ont été levées à l'import (PHD-001, BUD-011, DIN-001, SCI-008) ; chaque tâche concernée le signale dans ses notes.

## Modifier l'application

Modifier les fichiers directement puis pousser sur `main` (le site est publié par GitHub Actions).
Pour un nouveau texte d'interface : l'ajouter dans les deux langues de `i18n.js`.
Pour un nouveau champ de tâche : l'ajouter à `DATA_FIELDS` dans `api.js` et au formulaire dans `app.js`
(le serveur stocke les champs dans une colonne JSON, aucune migration n'est nécessaire).
