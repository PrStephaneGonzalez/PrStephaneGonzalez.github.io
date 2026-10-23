# L’École de magie du Fil d’Or — v9 (publiée sur stephanegonzalez.eu)

Application CM2 (français, mathématiques, jeux de logique). La v9 reprend la v8.3 sans changer les exercices, les critères d'apprentissage ni les données, et ajoute :

- **Carte du monde** (`world-map.mjs`) : l'École au centre, quatre univers autour — Château des Récits (lecture, mots, grammaire, écriture), Forges des Nombres (nombres, calcul, problèmes), Observatoire céleste (fractions, mesures, formes), Jardin des énigmes (les sept jeux). Les flèches montrent les prérequis existants des salles ; l'apprentie se déplace jusqu'au lieu choisi. Vue en liste conservée.
- **Trois flammes par lieu** : bleue (essayé), dorée (apprentissage confirmé sur plusieurs jours, même critère qu'avant), étoilée (confirmé à au moins deux étapes différentes). Les univers et les chemins s'éclairent avec elles.
- **Défi de maîtrise** : dans une salle déjà illuminée, un bouton propose l'étape suivante (plus difficile, objets plus rares). Les jeux s'ouvrent au premier niveau de difficulté encore inachevé.
- **Histoire du Fil d'Or** (`story.mjs`, `story-ui.mjs`) : douze chapitres originaux, débloqués par le travail réel (objets gagnés, salles éveillées ou illuminées, jeux résolus, flamme étoilée). Chaque chapitre se lit ou s'écoute et se referme par une question de compréhension ; il donne un objet de collection. Pistache, la chouette, annonce ce qu'il manque pour le chapitre suivant. Pas de série quotidienne ni de pénalité.
- **Sauvegarde en ligne** (`supabase-progress.mjs`) : même nom de magicienne + petit code qu'avant ; la progression est stockée dans le projet Supabase partagé avec la Forêt Enchantée (table `filor_parcours`, accessible seulement via les fonctions `filor_*` qui exigent l'empreinte SHA-256 du code). `sync.mjs` (fusion, révisions) est inchangé.
- **Sauvegarde complète** dans l'espace parent (Suivi de la pratique) : télécharger toute la progression, ou ajouter celle d'un fichier — y compris la sauvegarde de l'ancienne version (contenu de la clé `fil-or-v1` de son stockage local).

Sources complètes et tests (129, dont 7 nouveaux dans `tests-v9.mjs`) : dossier de travail de la v9 ; ce dossier ne contient que les fichiers publics.
