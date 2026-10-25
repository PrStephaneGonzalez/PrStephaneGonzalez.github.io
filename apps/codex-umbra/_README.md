# Codex Umbra — prototype

Jeu de dark fantasy (15–25 ans) où comprendre les mathématiques reconstruit un monde brisé. Prérequis : le programme de 3e. Site statique, sans compilation.

## Le principe

Le Codex, qui tenait le monde par ses Lois, a été déchiré. Chaque compétence est une **Loi** à restaurer, en trois **sceaux** : Novice, Adepte, Maître. Un sceau se brise avec 5 **éclats** (3 pour les démonstrations et le dernier atelier Python, 4 pour l'île des Masques) ; un éclat = un défi réussi **du premier coup, sans indice**. Les autres réussites rapportent un peu d'XP mais pas d'éclat.

- **Graphe de prérequis** : une Loi s'ouvre quand ses prérequis sont au rang Novice ; son sceau Maître demande que ses prérequis soient au rang Adepte. Les dépendances traversent les régions (le second degré demande les identités remarquables et le produit nul ; les invariants demandent les combinaisons de vecteurs).
- **Le monde se transforme** : brume, ciel, lune, fenêtres éclairées, ombres aux yeux rouges (les Informes) qui disparaissent quand une Loi est comprise, aurore et bannières quand le gardien est vaincu.
- **Leçon avant l'épreuve** : le Grimoire de chaque palier s'ouvre automatiquement la première fois.
- **Gardiens** : un par région, éveillé quand toutes les Lois de la région sont Adepte. Combat sans indice, 3 vies, coups critiques sur série de 3. Le Roi Sans Loi (Sanctuaire) demande les gardiens des Remparts, des Cryptes et de la Tour.
- **Histoire** : prologue, 8 fragments débloqués par le nombre de sceaux brisés, un texte par gardien, épilogue.
- **Braises** : une Loi non pratiquée depuis 5 jours affiche 🔥 et peut être « ravivée » (3 défis, bonus d'XP).

## Les 25 Lois

| Région | Lois |
|---|---|
| Les Remparts de Vectre (vecteurs) | v1 coordonnées et translations · v2 somme, Chasles · v3 produit par un réel, combinaisons, « Saut du Spectre » · v4 norme · v5 colinéarité, déterminant · v6 milieu, parallélogramme · v7 démonstrations (Varignon, centre de gravité, trouver l'erreur) |
| Les Cryptes des Sceaux (calcul littéral) | f1 développer · f2 identités remarquables · f3 facteur commun · f4 factoriser par identités · f5 produit nul · f6 preuves arithmétiques, contre-exemples, erreurs |
| La Tour des Arcs (second degré) | q1 forme canonique · q2 sommet, optimisation, « baliste » (on écrit l'équation de la trajectoire, le tir suit la parabole tapée) · q3 discriminant, équations bicarrées · q4 signe et inéquations · q5 somme et produit, paramètres · q6 démonstrations |
| La Bibliothèque des Automates (Python) | p1 prévoir l'affichage · p2 compléter une ligne · p3 reconstituer un programme (dichotomie…) |
| Le Labyrinthe des Sophistes (logique) | l1 implication, réciproque, contraposée, quantificateurs · l2 chevaliers et fripons (énigmes générées, solution unique vérifiée) · l3 invariants (parité, Bézout, échiquier de Gomory, réseaux) |

Presque tous les exercices sont **générés** (nombres tirés au hasard). Les démonstrations sont des banques écrites à la main : remettre une preuve dans l'ordre avec des intrus, trouver l'étape fausse, donner un contre-exemple.

## Correction automatique

`core.js` contient un petit analyseur d'expressions (implicite `3x(2x-1)`, `x²`, `√`, fractions). Une réponse algébrique est comparée au résultat attendu **comme polynôme** (égalité exacte des coefficients), puis sa **forme** est vérifiée : développée et réduite, factorisée complètement (facteurs de degré 1, sans facteur numérique commun oublié), ou canonique `a(x − α)² + β`. Quand la réponse est fausse, le jeu donne la valeur en un point (« en x = 1 ta réponse vaut 2, il faudrait 3 »). Les nombres doivent être exacts (`√50`, `5√2`, `(1+√5)/2`, `3/2`).

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html`, `style.css` | page et style |
| `core.js` | hasard, nombres exacts, analyseur, correcteurs, sauvegarde, sons synthétisés |
| `kit.js` | constructeurs d'exercices |
| `c-vec.js`, `c-alg.js`, `c-misc.js` | les 25 Lois : leçons, générateurs, solutions, indices |
| `story.js` | régions, gardiens, rangs, histoire |
| `art.js` | dessins SVG (carte, scènes qui se transforment, gardiens) |
| `app.js` | écrans, progression, épreuves, combats |
| `sw.js`, `manifest.webmanifest`, `icon*` | installation et hors connexion (changer `VERSION` dans `sw.js` à chaque publication) |

Ajouter une Loi : un appel `CU.addSkill({...})` avec `id`, `region`, `req`, position `x`/`y` sur la scène (0–1000), trois leçons et trois générateurs.

## Sauvegarde

Nom d'Arpenteur + code de 4 à 6 chiffres. Progression dans le navigateur et dans le projet Supabase partagé avec les autres applications (table `codex_saves`, accessible seulement via les fonctions `codex_get` / `codex_put`, qui exigent l'empreinte SHA-256 de « nom + code »). Fusion « le meilleur des deux » entre appareils.

## Limites du prototype

- Pas de vraie rédaction de démonstration libre : les preuves passent par l'ordre des étapes, la détection d'erreurs et les contre-exemples.
- Le Python est lu, complété et réordonné, pas exécuté (pas d'interpréteur embarqué).
- Les seuils (5 éclats, rang Adepte pour les gardiens) sont à ajuster en regardant jouer.

## Ajouts d’octobre 2026

- **Carte cliquable** : chaque Loi se touche directement sur la scène de la région (la brume décorative ne capte plus les touchers) ; son rang et ses éclats s’affichent sous son nom. La liste reste disponible, repliée.
- **Grimoire enrichi** : pour chaque Loi et chaque rang, trois onglets (Novice, Adepte, Maître) avec l’essentiel, une **méthode pas à pas** (`methods.js`, avec pièges et format de saisie) et des **exemples résolus tirés en direct des générateurs** (un par variante d’exercice, solution repliée). Les pages du Codex ouvrent ce Grimoire.
- **Bouton « 📖 Cours »** pendant les épreuves : ouvre le Grimoire du rang en cours sans quitter l’exercice (sans pénalité en épreuve normale).
- **Autels du Souvenir** (un par région) et **Cloître de la Mémoire** (toutes régions) : révision **espacée** (boîtes de Leitner, intervalles 1, 3, 7, 15, 30, 60 jours), **entrelacée** (Lois mélangées, sans leur nom) et **sans indice**. Une Loi manquée revient en fin de séance et le lendemain ; consulter le Grimoire la compte comme à revoir. Trois lueurs par séance.
- Graver un premier souvenir à l’Autel est désormais une condition pour éveiller le gardien de la région ; graver un souvenir au Cloître, une condition pour ouvrir le Sanctuaire final.
- Les braises 🔥 signalent un palier dont la révision a plus de deux jours de retard.
- Sauvegarde : `mem` (état de chaque palier) et `recall` (séances) sont fusionnés entre appareils.
- Son : musique adaptative générée (`music.js`), Arène chronométrée réservée aux automatismes, moteur allégé sur Android, contournement du commutateur silencieux de l’iPhone.
- **Barre d’expérience centrale** : fixée en bas de l’écran, XP qui volent vers elle, célébration des montées de rang, barre qui se remplit sur les écrans de fin.
- **Défis du jour** (3 par jour : un de mémoire, un de progression, un de variété), tirés selon l’état du joueur ; le jour change à 4 h. Les défis ne récompensent que des comportements utiles à l’apprentissage (premier coup, redressement après erreur, révision à l’échéance, variété des mondes), jamais le volume.
- **Série de jours** : un jour compte quand les 3 défis sont accomplis. Une série d’au moins 3 jours interrompue la veille se rachète le jour même avec les 3 défis + 2 défis de rattrapage (au plus un rachat par semaine). Paliers 3, 7, 10, 30, 100 jours, récompensés une seule fois.
- **Exploits** : 39, rangés par famille dans un onglet du Codex (constance, mémoire, erreurs fécondes, variété, maîtrise, démonstration, arène, secrets), sans compteur global ; les plus proches apparaissent en « Presque ». Certains donnent un **titre**, affiché sous le nom.
- **« Presque »** pendant le jeu : dernier éclat avant le sceau, gardien qui vacille, record égalé dans l’Arène.
- **Prérequis fins** : chaque variante d’exercice déclare les notions d’autres Lois qu’elle mobilise (`CU.needs(['q3:2'], …)` = sceau Adepte de la Salle des racines brisé). Une variante n’est tirée que si ses notions sont acquises ; un rang n’est ouvert que si au moins une de ses variantes l’est, et la fiche de la Loi dit quel sceau l’ouvrira. Les sceaux ne se perdant jamais, tout ce qui s’ouvre reste ouvert. Un test simule tous les ordres de progression : aucun blocage définitif. Variantes annotées : Python (discriminant, déterminant, norme, milieu, sommet, quatrième sommet), Alignement Maître (équation du second degré en m), Tribunal Maître (produit nul), Dédale Maître (système).
- **Le discriminant se démontre** (Salle des racines, rang Maître) : trois exercices guidés s’ajoutent aux deux précédents. (1) Redécouverte sur un trinôme numérique : on écrit ax²+bx+c = a[(x+u)² − v], on calcule u, v et Δ, et l’on constate que 4a²v = Δ. (2) Pourquoi le signe de Δ décide : choix entre des raisonnements, dont un piège de signe (−4ac). (3) Le terme manquant d’une étape de la démonstration (complétion du carré, mise au même dénominateur, factorisation du signe). L’Oracle (q6) garde la démonstration complète à remettre dans l’ordre.
- **Sauvegarde v2 et identifiants figés** (`ids.js`) : les 25 Lois existantes et les 61 Lois prévues par le graphe des notions de seconde ont des identifiants réservés pour toujours, ainsi que les 13 régions. On peut en ajouter, jamais en retirer ni en réutiliser ; un renommage passe par `CU.IDS.renamed` et est appliqué au chargement. `tests/ids-lock.json` garde la liste publiée.
- `CU.save.migrate()` met toute sauvegarde au format v2 (valeurs normalisées, renommages appliqués) sans jamais faire baisser une progression ; une sauvegarde écrite par une version plus récente n’est pas modifiée. La fusion conserve désormais les champs inconnus et l’union des leçons lues.
- **Deux appareils** : avant chaque envoi, le jeu relit le cloud et fusionne (l’envoi remplace la sauvegarde distante). Au démarrage, la fusion avec le cloud est systématique (elle ne dépend plus des horloges). La fusion se fait sur place, sans remplacer les objets qu’une épreuve en cours utilise. Limite connue : l’XP gagnée en même temps sur deux appareils n’est pas additionnée (on garde le maximum).
- **Droits acquis** : si le graphe change, une Loi commencée reste ouverte et un rang entamé (au moins un éclat) aussi ; les nouveaux prérequis ne s’appliquent qu’à ce qui n’a pas été entamé.
- **Graphe des notions en données** (`graph.js`) : source unique des prérequis entre Lois (86 Lois, 13 régions). On n'écrit plus `req:` dans `c-*.js`. Une Loi prévue (pas encore écrite) est ignorée des prérequis des Lois écrites (`CU.finalizeGraph`), donc le jeu reste jouable pendant l'écriture ; `s.planned` garde les prérequis complets. `rules.js` contient les règles d'ouverture (partagées par le jeu et les tests).
- Validateur : `node tests/graph-test.js` (code 1 si échec) — pas de cycle, prérequis connus, cohérence avec `ids.js` et avec les Lois écrites, régions ≤ 9 Lois, et point fixe avec les vraies règles prouvant qu'aucune Loi ni aucun rang ne peut rester bloqué. Affiche l'avancement par région. À lancer après toute modification de `graph.js` ou d'une annotation `CU.needs`.
- **Réponses « ensemble » et « fraction »** (`answers.js`, chargé avant les contenus) : `K.interval(énoncé, ']-∞ ; 2] ∪ [5 ; +∞[', sol, indice)` accepte toute écriture du même ensemble ([1;3] ∪ [3;5] = [1;5], ℝ∖{3} = ]-∞;3[ ∪ ]3;+∞[, {3} = [3;3], ∅/aucune ; ASCII toléré : `inf`, `U`, `ou`, `R\{3}`) et explique les erreurs typiques (crochets, ensemble complémentaire, valeurs en trop ou manquantes, crochet fermé en ±∞). `K.frac(énoncé, p, q, …)` exige la fraction irréductible (6/8, 0,75, a/(−b) sont refusés avec une explication). Clavier d'exercice et aperçu TeX adaptés. Les exercices portent `_ans` (réponse canonique) pour les tests. Non géré : ℝ⁺, ℝ₋, intersections.
- Tests : `node tests/answers-test.js` (KaTeX facultatif : `NODE_PATH=…/node_modules`).
- **Les Forges des Nombres** (`c-num.js`, région `num`, 9 Lois n1–n8, n11) : multiples et parité, nombres premiers, fractions, puissances et notation scientifique, racines carrées et $x^2=a$, rationnels et irrationnels, intervalles et valeur absolue, encadrements et arrondis, grandeurs. Rang Maître au-delà de la seconde (congruences, PGCD/PPCM, fractions continues, sommes télescopiques et géométriques, quantité conjuguée, radicaux imbriqués, quantificateurs ∀/∃, dichotomie, inégalité triangulaire). Méthodes du Grimoire dans la Loi (`methods`). Ces Lois étant prérequises (graph.js), v4 demande désormais n5 et v6 demande n3 (droits acquis préservés). Corvin suggère d'abord les Lois dont beaucoup d'autres dépendent.
- Contre-vérification : `node tests/num-test.js [répétitions]` recalcule chaque réponse par une autre méthode (force brute, BigInt, échantillonnage) et vérifie qu'une mauvaise réponse est refusée.
- `V.num` : le message « valeur approchée » n'apparaît plus que si l'élève a tapé un décimal proche (en relatif) de la valeur exacte.
- **Rang Légende** (facultatif) : une Loi peut avoir un quatrième rang `gen[3]` (avec `lessons[3]` et `methods[3]`), ouvert une fois la Loi maîtrisée. Il ne bloque rien : les prérequis, les gardiens et la progression des régions ne regardent que les trois premiers rangs. Sauvegarde : `legend: 1` quand il est réussi, `lg` = éclats en cours (fusion entre appareils : gravé si l'un des deux l'a gravé). Les 9 Lois des Forges en ont un (Legendre, congruences, indicatrice d'Euler, Euclide, fractions égyptiennes, Stern-Brocot, logarithme décimal, solutions parasites, radicaux infinis, définition de la limite, Héron, analyse dimensionnelle…).
- Tests : `node tests/save-test.js [sauvegardes.json]` (identifiants, migration, fusion, renommage, fusion sur place, deux appareils). Le fichier de vraies sauvegardes est facultatif et ne doit jamais être versionné.
