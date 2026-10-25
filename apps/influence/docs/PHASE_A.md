# Rapport de phase A — 25 octobre 2026

## Résultat et point à valider

Le moteur, le solveur exact et les vérifications indépendantes sont réalisés.
Ils appliquent les règles originales : captures transitives dans le graphe
induit courant, sommets forcés jouables, alternance et attribution immédiate
des restants si le joueur au trait ne peut plus jouer.

**Une exigence littérale du cahier doit être corrigée avant validation : le
corollaire 24 imprimé dans l'article a une exception à quatre sommets.** Les
tests conservent les règles et enregistrent explicitement cette exception.
La phase B n'a pas été commencée. Aucune publication ni aucun push.

## Exception du cycle à quatre sommets

Sommets `1,2,3,4`, Rouge = `2,4`, Bleu = `1,3`.
Arcs : `2→1`, `2→3`, `4→3`, `4→1`.

- Rouge commence en `2` : il capture `1,2,3`. Bleu n'a plus de sommet ;
  Rouge reçoit `4`. Score 4–0, donc **Ls = 4**.
- Bleu commence en `1` : il capture `1,2,4`. Rouge n'a plus de sommet ;
  Bleu reçoit `3`. Score 0–4, donc **Rs = −4**.

L'ensemble `{0,2}` du corollaire 24 exclut cette valeur. Ce graphe entre
pourtant dans la définition de la classe, p.36. L'observation reste vraie en
retirant immédiatement le sommet forcé : cette exception ne vient pas de
notre choix des règles originales. L'oracle Python sans mémoïsation confirme
le résultat dans l'énumération exhaustive.

La preuve imprimée invoque le théorème 20 sur le segment restant ; pour ce
cycle, il ne reste qu'un sommet, hors du domaine de ce théorème.
**Correction proposée pour le cahier :** tester `(4,−4)` pour le cycle de
quatre sommets, puis l'ensemble annoncé sur les cycles alternés d'au moins
six sommets. Cette dernière propriété a été vérifiée pour 6,8,…,20 ; le test
ne constitue pas à lui seul une preuve pour toutes les tailles. Le cas
dégénéré à deux sommets est un segment et n'est pas créé comme un cycle.

## Autres précisions au cahier

Le théorème 20 concerne les segments d'au moins deux sommets. La ligne
`n=1` du tableau a bien `Ls=Rs=−1`, et fait l'objet d'un test distinct.

La classification des niveaux du §5 doit aussi prévoir une égalité pour un
seul ordre de départ. Exemple : `0` Rouge, `1,2,3` Bleus, arcs `0→2`, `1→2`,
`3→0` ; les valeurs exactes sont `(Ls,Rs)=(0,−4)`. Rouge commence : égalité ;
Bleu commence : Bleu gagne. L'énumération Python et un test de régression
confirment ce cas. Pour la phase C, distinguer les six cas suivants lorsque
`Ls≥Rs` :

| Condition | Résultat optimal |
| --- | --- |
| `Ls>0`, `Rs>0` | Rouge gagne dans les deux ordres |
| `Ls<0`, `Rs<0` | Bleu gagne dans les deux ordres |
| `Ls>0>Rs` | Le premier gagne |
| `Ls=Rs=0` | Égalité dans les deux ordres |
| `Ls>0`, `Rs=0` | Rouge gagne s'il commence, sinon égalité |
| `Ls=0`, `Rs<0` | Bleu gagne s'il commence, sinon égalité |

## Vérification des sources

Le dépôt a été cloné et inspecté à partir de
`2c9e9daa66ab10af4c7d544c94255fbabf3368cf`, branche de travail locale
`influence-phase-a`. Aucun fichier AGENTS.md n'était présent dans l'arbre
du dépôt inspecté. Le site utilise Quarto et copie `apps/**` comme ressources.
Les autres applications sont statiques. Il n'existait pas d'application
INFLUENCE dans cet arbre.

Le PDF publié fourni a été extrait et sa figure 1 a été rendue et inspectée
visuellement. Transcription : Rouge `u,w` ; Bleu `v,x,y,z` ; arcs `u→w`,
`v→w`, `x→v`, `w→y`, `w→z`, `x→z`. Les scores absolus sont bien 4,2,6,0.
Les nombres du tableau 1 sont transcrits littéralement jusqu'à 38 et sont
séparés des calculs utilisés pour les contrôler.

## Architecture livrée

| Fichier | Responsabilité |
| --- | --- |
| `engine/graph.mjs` | Validation, graphe immuable, BigInt, parcours, graphes induits, projection visuelle, opposé et union disjointe |
| `engine/game.mjs` | États immuables, aperçu/capture par une même fonction, scores, règlement final expliqué, sauvegarde JSON |
| `ai/exact.mjs` | Minimax exact, cache par graphe, valeurs futures Rouge − Bleu, budgets explicites |
| `ai/choose.mjs` | Adaptateurs Facile/Normal/Expert, graine contrôlée, repli légal si budget dépassé |
| `levels/reference.mjs` | Figure 1, segments, cycles alternés et transcription du tableau 1 |
| `tests/oracle.py` | Oracle indépendant : matrice de fermeture, scores absolus, aucune mémoïsation ni aucun élagage |
| `tests/verify.mjs` | Comparaison systématique, symétrie, parité, sommes opposées, transitions et légalité IA |
| `tests/path_oracle.py` | Second contrôle Python, spécialisé dans les chemins, mémoïsation par isomorphismes de positions entières |
| `tests/engine.test.mjs` | Règles, sauvegardes, budgets et limites 31/32/33 sommets |
| `tests/article.test.mjs` | Valeurs de l'article, théorème 20 et exception au corollaire 24 |
| `tests/path-oracle.test.mjs` | Confrontation Python/tableau jusqu'à 38 et Python/JS jusqu'à 24 |
| `tests/segments.mjs` | Mesure reproductible du solveur général sur les segments |
| `package.json` | Commandes de test, sans dépendances |
| `README.md` | API, commandes et intégration future |
| `AGENTS.md` | Consignes locales et arrêt entre phases |
| `CAHIER_DES_CHARGES.md` | Copie intacte du document transmis |
| `docs/PHASE_A.md` | Présent rapport |
| `docs/validation.json` | Résultats mesurés, graine et portée de vérification |

## Commandes exécutées et résultats

Environnement : Node 24.22.1, Python 3.12.14, aucune installation nécessaire.

```sh
node --test tests/engine.test.mjs tests/article.test.mjs tests/path-oracle.test.mjs
node tests/verify.mjs
node tests/segments.mjs --max=30
```

La suite de règles et de références comporte **19 tests réussis sur 19**, sans
test ignoré. Le test du cycle à quatre sommets vérifie explicitement
l'exception documentée, plutôt que d'affirmer le corollaire imprimé pour ce cas.

La comparaison indépendante est terminée sans divergence sur **67 267
graphes**, pour les deux premiers joueurs :

- **66 067 graphes exhaustifs** : 0 à 4 sommets étiquetés, tous les arcs
  possibles entre sommets distincts et toutes les colorations, y compris les
  graphes non pertinents et les circuits orientés ; répartition 1,2,16,512,65536.
- **1 200 graphes aléatoires**, 200 par taille de 5 à 10, graine 20261025,
  densités variées, boucles comprises.
- **591 unions opposées**, toutes nulles, sans addition de valeurs de composantes.
- **220 963 positions au trait** et **410 904 transitions** vérifiées pour
  l'absence de zugzwang, la conservation et l'identité aperçu/capture.

Les boucles ne sont pas réénumérées dans le corpus exhaustif : l'accessibilité
inclut déjà le sommet de départ, donc ajouter une boucle ne peut changer une
capture. Des tests unitaires et le corpus aléatoire vérifient leur traitement.
À cinq sommets, le contrôle est échantillonné, pas exhaustif.

Le corpus Python des petits graphes n'utilise ni le parcours BFS du moteur,
ni ses masques BigInt, ni son calcul de score relatif. Il reconstruit la
fermeture par matrice à chaque état et retourne les scores absolus.

Le solveur général JS reproduit **le tableau 1 jusqu'à n=30** (environ 12 s
pour toute la série ; 567 284 états en cache à n=30). La commande rapide
de test ne dépasse pas 24 pour ce solveur.
Le vérificateur structurel Python reproduit **les 38 lignes** en environ
0,9 s, avec 38 705 états. Ce second vérificateur mémoïse ; il ne remplace pas
l'oracle exhaustif sans mémoïsation. Il regroupe les positions isomorphes,
mais cherche les coups dans l'ensemble de la position, sans additionner
les scores des composantes.

Les durées dépendent de la machine ; elles ne garantissent pas les performances
sur téléphone. Le résultat exact de chaque recherche est distingué de son
repli heuristique. La limite de 24 n'empêche pas le moteur de représenter
plus de sommets : les bornes 31,32,33 sont vérifiées avec BigInt.

## Limites et prochaine étape

La phase A prépare la projection des flèches et vérifie qu'en les suivant on
retrouve exactement la capture du moteur. Elle ne teste pas encore le rendu,
les animations, le tactile, les traductions ni le chargement d'un Worker.
Il n'y a donc aucune capture d'écran d'interface à fournir à ce stade.

Les adaptateurs de difficulté sont testés pour leur légalité et leur
reproductibilité ; leur agrément de jeu sera évalué aux phases B/C.
Les 12 niveaux publics, leurs métadonnées et les maquettes relèvent également
des phases suivantes. Les images de référence ne sont pas présentes dans
la pièce jointe de ce tour ; il faudra les retrouver avant la phase C.

Le cahier, §11, demande : « S'arrêter à la fin de chaque phase et attendre la
validation explicite de l'utilisateur avant d'entamer la suivante ».
**Arrêt à la phase A : validation attendue avant toute interface.** Aucun
fichier extérieur à `apps/influence/` n'a été modifié.
