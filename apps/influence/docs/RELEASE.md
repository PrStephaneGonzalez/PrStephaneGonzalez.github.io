# Version jouable — 25 octobre 2026

L'utilisateur a autorisé la poursuite des phases B à D et la livraison
complète après la phase A : « Ok continue jusqu’à la fin. Je suis pressé de
le tester :) ». Les règles de la phase A sont conservées. Le cahier original
et le rapport mathématique restent disponibles.

## Réalisation

- Interface lumineuse, crème et ciel, boutons jaunes, camps corail et bleu.
  La maquette retenue a été retrouvée dans le pack d'origine et inspectée.
- Rouge : ronds ; Bleu : carrés arrondis. Bandeau, noms, formes et compteurs
  indiquent le camp actif sans dépendre uniquement des couleurs.
- SVG orienté selon le joueur actif, aperçu via la fonction du moteur,
  confirmation facultative, captures animées et règle de fin expliquée.
- Solo Facile/Normal/Expert et deux joueurs sur un même écran. Worker de
  calcul avec limites et repli valide ; choix du premier joueur et du camp.
- 12 plateaux accessibles, métadonnées exactes, progression locale et
  reprise de partie. Le premier plateau introduit les règles ; les suivants
  comprennent six types de résultats optimaux, des pièges gloutons et des
  camps minoritaires capables de gagner s'ils commencent.
- Annulation au dernier tour humain en solo ; accord des deux joueurs en
  local. Changement FR/EN pendant une partie sans perte de l'état.
- Aide courte, préférences d'animation, son facultatif, vue figée en solo,
  zoom et déplacement après agrandissement, défi quotidien (rotation UTC),
  copie du résultat et crédits des cinq auteurs.
- Ressources locales, aucune dépendance ni modification du déploiement
  Quarto. Le répertoire seul suffit à héberger l'application.

## Vérification exécutée

`npm test` : **23 tests réussis**, dont **216 parties complètes** (12
plateaux, deux premiers joueurs, neuf combinaisons de difficultés), et
confrontation de tous les plateaux à l'oracle Python sans mémoïsation.
L'Expert contre lui-même reproduit les Ls/Rs enregistrés.

`npm run test:exhaustive` : **67 267 graphes sans divergence**, **410 904
transitions**, 220 963 positions, 591 sommes opposées. Les 38 lignes du
tableau de segments sont vérifiées dans la suite rapide par Python.

Parcours dans Chrome, via l'interface réelle :

- Une partie complète en français contre l'ordinateur : résultat 5–3,
  conservation de huit pions et étoile de progression enregistrée.
- Camp humain Bleu, Bleu commence, difficulté Expert : capture, réponse du
  worker, retour à un tour Bleu. Annulation : retour à 0–0 et huit pions.
- Arcs affichés au tour Bleu vérifiés par leurs origines et destinations
  dans le SVG. Changement FR/EN sans réinitialiser le plateau.
- **Douze parties complètes en mode local, une par plateau, 56 coups au
  total**, par les mêmes boutons et pions que l'utilisateur. Résultats :
  5–3, 4–4, 5–3, 6–2, 3–7, 4–6, 5–5, 4–6, 8–4, 7–5, 7–5, 6–6.
  Attributions anticipées vues sur les plateaux 4 et 8.
- Déplacement entre pions avec les flèches du clavier et capture par Entrée.
- Préférences « confirmation » et « animations réduites » activées et
  désactivées depuis l'interface.
- Mise en page dans des vues de 390 et 320 pixels. À 320, la présence de la
  barre de défilement réduit la zone utile à 305 pixels : aucune largeur
  horizontale excédentaire et cibles de pions mesurées à **46,5 × 46,5 px**.
  Les boutons de zoom ont été déplacés hors du graphe pour ne masquer aucun
  pion. Les textes anglais se replient sur les petits écrans.
- Contrastes des bandeaux : au moins 4,57:1 pour Rouge et 4,72:1 pour Bleu
  avec texte blanc. Le texte principal est sombre sur fond clair.

Les erreurs observées dans les journaux du navigateur concernent son
extension de métadonnées, pas l'application. Aucun blocage de l'application
n'a été observé pendant ces parcours.

## Limites de la vérification

Les vues mobiles sont des vues responsive dans Chrome, pas un essai matériel
sur iPhone/Safari. Les sons et la vue figée restent des options ; leur confort
nécessite les premiers retours utilisateurs. Le défi quotidien réutilise les
12 plateaux et ne constitue pas une nouvelle banque quotidienne. La variété
et la durée des parties doivent être affinées après ces premiers essais.

Le cas du cycle alterné de quatre sommets reste celui documenté dans
PHASE_A.md : (4, −4). Aucune modification des règles n'a été introduite pour
forcer une valeur différente.

## Fin automatique à une seule couleur — 25 octobre 2026

À la demande de l'utilisateur, l'interface attribue immédiatement un reliquat
monochrome au camp correspondant, avec cascade et explication FR/EN. Le moteur
original et le solveur gardent leurs règles ; `finishMonochrome` est un raccourci
équivalent appliqué par l'interface après les coups et lors d'une reprise.
L'historique conserve l'état précédent pour permettre l'annulation.

Validation : 41 tests ; le contrôle indépendant sur 67 267 graphes vérifie
également que ce raccourci conserve le score final sur les positions visitées.
Parcours navigateur du plateau 2 : Rouge A, Bleu F, puis attribution automatique
des deux rouges restants et égalité 4–4, sans troisième clic sur un pion.
