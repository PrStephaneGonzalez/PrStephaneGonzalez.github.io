# Les Gardiens de la Forêt Enchantée

Jeu éducatif pour une enfant de grande section au début du CP : lettres (capitales, minuscules, cursives), syllabes, lecture de mots et de phrases, dénombrement jusqu'à 20, formes, repérage, grandeurs, petits problèmes, logique (potions, chemins hamiltoniens, suites, sudokus, devinettes).

C'est un site statique : un seul fichier `index.html`, sans dépendance ni étape de compilation.

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `index.html` | Tout le jeu (HTML, CSS, JavaScript) |
| `manifest.webmanifest` | Nom et icônes quand le site est installé sur l'écran d'accueil |
| `sw.js` | Fonctionnement hors connexion (après une première visite) |
| `icons/` | Icônes 180, 192 et 512 px |
| `sons/` | Sons en voix française : `ph/` sons isolés, `sy/` syllabes, `w/` mots, `mo/` petits mots (MP3), page d'écoute `index.html`, `CREDITS.txt`. Régénérables avec le script `gen.py` (Piper) |

## Essayer chez soi

Depuis ce dossier :

```
python3 -m http.server 8000
```

puis ouvrir http://localhost:8000. Le service worker ne fonctionne que sur `localhost` ou en HTTPS, pas en ouvrant le fichier directement.

## Publier (gratuit)

Il suffit de déposer le contenu du dossier à la racine d'un hébergeur statique :

- **Netlify** : glisser-déposer le dossier sur app.netlify.com/drop.
- **Cloudflare Pages** : « Upload assets » avec le dossier.
- **GitHub Pages** : créer un dépôt, y mettre les fichiers, activer Pages sur la branche principale.

Quand vous publiez une nouvelle version, changez `VERSION` dans `sw.js` (par exemple `foret-v2`) pour que les appareils rechargent la page.

## Installer sur l'iPad

Ouvrir l'adresse dans Safari, toucher Partager, puis « Sur l'écran d'accueil ». Le jeu se lance ensuite en plein écran, comme une application. Faire une première partie avec du réseau pour que les polices et la page soient gardées en mémoire.

## Le Royaume des Nuages (lecture pas à pas)

Quatrième territoire, ouvert dès que le hibou est libéré.

- **Perroquet 🦜, les sons des lettres.** Paliers : a i o → u é e → l m r → s f v → n j p → t d b → c g z. Un palier ne s'ouvre que lorsque tous les sons des paliers précédents sont acquis (3 réussites du premier coup, clés `Sn:`). Exercices : écouter et toucher, lire et choisir le son, cherche et trouve, memory.
- **Colombe 🕊️, les trois écritures.** Chaque lettre en grand, en petit et en attaché, par paliers de lettres (clés `Fo:`), avec les lettres qui se confondent (b d p q, m n u…).
- **Abeille 🐝, les syllabes.** S'ouvre quand a, i, o et deux consonnes sont acquis. Ne propose que des syllabes faites de sons déjà acquis (clés `S:`, partagées avec le dragon). Exercices : écouter et toucher, lire et choisir, cherche et trouve, memory, fabriquer la syllabe.
- **Cygne 🦢, les sons magiques** (ou, ch, on, an, oi, in, au, eu, ai, gn), par paires, chacun avec un mot-repère et son image (ou comme dans loup…). S'ouvre quand toutes les voyelles et quatre consonnes sont acquises (clés `Sc:`). Au dernier niveau, syllabes avec ces sons.
- **Coccinelle 🐞, les petits mots** (le, la, un, une, et, les, il, elle, est, dans, sur, de, je, tu, des, avec, pas, mon), reconnus globalement, avec des phrases à compléter (clés `Mo:`).
- **Aigle 🦅, les mots à lire.** Un mot n'apparaît que si tous ses sons sont acquis (les lettres muettes, en gris, ne comptent pas). Les intrus commencent par la même lettre que le bon mot, pour qu'on ne puisse pas deviner avec la première lettre (clés `W:`, partagées avec la biche).
- **Six licornes** : des sons, des trois écritures, des syllabes magiques, des sons magiques, des petits mots, et la **super licorne du ciel** (lire 15 mots ; elle demande toutes les autres licornes du ciel). Elle libère l'arc-en-ciel, qui apparaît alors sur toutes les cartes.

Dans la Prairie, la biche demande maintenant l'aigle.

## Formes magiques et étoiles d'illumination

Chaque niveau gagné transforme l'animal (étincelant, d'argent, d'or, arc-en-ciel), puis il devient légendaire avec une couronne quand tous ses niveaux sont réussis. Une étoile d'illumination tourne autour de lui pour chaque niveau gagné, et chaque nouvelle série de cinq étoiles après la couronne en ajoute une (`bonus`). La fenêtre de fin de niveau montre la prochaine transformation, et le bouton « Encore ! » est le bouton principal. Pendant le jeu, la prochaine forme est affichée à droite des étoiles.

Une mauvaise bulle fait entendre son propre son, puis la consigne revient. Dans la Prairie, le dragon demande désormais l'abeille, et les licornes des syllabes et de la lecture demandent le perroquet et l'abeille : on ne lit pas de syllabes écrites avant d'en connaître les sons.

Les sons sont produits par la synthèse vocale Piper avec la voix française « siwis » (corpus SIWIS, Université d'Édimbourg, CC BY 4.0), son par son à partir de phonèmes choisis explicitement : les consonnes qui se prolongent sont tenues (« fff »), les autres sont suivies d'un petit « e » (« pe »). Les syllabes, les mots et les petits mots ont aussi leur fichier ; seules les consignes de la fée passent par la voix de l'appareil. Page d'écoute : `sons/index.html`.

## Où sont les données

Chaque joueur choisit son prénom au démarrage. La progression est enregistrée dans le navigateur (clé `gardiens-foret-v1:<prénom>`) et envoyée à une base Supabase (table `profils`, une ligne par prénom : niveaux, étoiles, réussites, aucune autre donnée). Sur un autre appareil, il suffit de saisir le même prénom : les deux sauvegardes sont fusionnées (on garde toujours le meilleur de chacune). Hors connexion, le jeu continue et renvoie la progression au retour du réseau (pastille « hors connexion » en bas à gauche de la carte).

Le projet Supabase gratuit est mis en pause après une semaine sans activité : `.github/workflows/supabase-keepalive.yml` l'interroge chaque lundi. La clé publique (`SB_KEY` dans `index.html`) peut rester visible dans le code ; la table n'accepte que lecture, création et mise à jour, jamais la suppression. N'importe qui connaissant un prénom peut ouvrir ce profil : choisir des prénoms ou pseudos peu devinables si le lien circule beaucoup.

## Organisation du code

Tout se trouve dans la balise `<script>` de `index.html`, dans cet ordre :

1. **Territoires, animaux, licornes** : `TERR`, `GAMES` (chaque animal : compétence, niveaux maximum, animaux requis), `UNI` (licornes : critère, défi), `POS` (positions sur la carte).
2. **État et maîtrise** : `st`, `load`, `save`, `record`, `status`. Une notion est acquise après 3 réussites du premier coup (`status`).
3. **Voix et sons** : `say` (synthèse vocale du navigateur, en français) et `sfx`.
4. **Carte** : `renderMap`, `drawScene` (le décor est dessiné en canvas, il se grise tant que les animaux ne sont pas libérés).
5. **Moteur de séance** : `A.right`, `A.wrong`, `levelComplete`. Cinq étoiles font passer un animal au niveau suivant. Un tour sur quatre revient sur un niveau déjà passé (`levelFor`).
6. **Données de langue** : `WB` (mots à écouter), `WR` (mots à lire), `SYC` (syllabes), `PH` (phrases vrai ou faux), `ANI` et `CL` (devinettes).
7. **Les jeux** : un objet `MODS.<identifiant>` par animal, avec une fonction `round(niveau, A)`.
8. **Espace parents** : tableau de suivi.

### Ajouter du contenu

- **Un mot à lire** : ajouter une ligne dans `WR` (`['mot','🙂',['syl','labes'],palier]`, palier 1 à 3).
- **Un mot à écouter** : ajouter une ligne dans `WB` (mot, image, syllabes prononcées, rime, premier son).
- **Un animal** : ajouter une entrée dans `GAMES`, une position dans `POS`, et un objet dans `MODS` qui expose `round`.
- **Une licorne** : ajouter une entrée dans `UNI` avec `keys()` (les clés de notions suivies) et `round`.

Chaque bonne réponse appelle `A.right('clé')`. La clé identifie la notion (par exemple `L:A` pour la capitale A, `N:7` pour sept noisettes) et alimente le suivi.

## Limites connues

- La voix est celle de l'appareil. Elle convient aux noms de lettres, aux syllabes et aux consignes, mais prononce mal les sons isolés (« fff », « chhh »). Pour un travail de phonologie fin, il faut enregistrer des voix et les jouer avec `new Audio(...)`.
- Les polices viennent de Google Fonts (Andika, Grandstander, Playwrite FR Trad pour la cursive). Hors connexion, elles ne s'affichent que si l'appareil les a déjà gardées. Pour être totalement autonome, les télécharger et les déclarer avec `@font-face`.
- Le tracé des lettres à la main n'est pas travaillé ; le jeu fait reconnaître, pas écrire.
- Les cases de suivi par notion, les seuils d'acquisition et les niveaux sont à ajuster en regardant l'enfant jouer.
