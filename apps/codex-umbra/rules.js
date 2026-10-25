/* Règles d'ouverture des Lois et des rangs, indépendantes de l'interface : le jeu (app.js) et les
   tests (tests/graph-test.js) utilisent le même code, de sorte que le validateur teste les
   vraies règles et non une copie.

   - Une Loi s'ouvre quand le sceau Novice (rang 1) de chacun de ses prérequis est brisé ;
     son rang Maître exige le sceau Adepte (rang 2) de chacun.
   - Prérequis fins : une variante d'exercice peut exiger le sceau d'une autre Loi
     (needs : 'q3' = Novice, 'q3:2' = Adepte). Un rang n'est ouvert que si au moins une de ses
     variantes l'est. Les sceaux ne se perdant jamais, tout ce qui s'ouvre reste ouvert.
   - Droits acquis : si le graphe change, une Loi déjà commencée reste ouverte, et un rang déjà
     entamé (au moins un éclat) aussi. Un rang que l'on vient seulement d'atteindre suit les règles
     normales : sinon un sceau brisé ouvrirait le rang suivant même quand il utilise une notion
     pas encore acquise. */
'use strict';
CU.makeRules = function (getSkills) {
  const S = (id) => CU.SKILLS[id];
  const sk = (id) => getSkills()[id];
  const tierOf = (id) => (sk(id) || {}).tier || 0;
  const needMet = (n) => {
    const [id, k] = n.split(':');
    return tierOf(id) >= (+k || 1);
  };
  const allVariants = (id, ti) => S(id).gen[ti].variants || [S(id).gen[ti]];
  const openVariants = (id, ti) => allVariants(id, ti).filter((v) => !v.needs || v.needs.every(needMet));
  const tierContent = (id, ti) => openVariants(id, ti).length > 0;
  const started = (id) => {
    const s = sk(id);
    return !!s && ((s.tier || 0) > 0 || (s.prog || 0) > 0 || (s.done || 0) > 0);
  };
  const available = (id) => started(id) || (S(id).req.every((r) => tierOf(r) >= 1) && tierContent(id, 0));
  // indice (0..2) du palier le plus haut que l'on peut tenter ; -1 si la Loi est fermée
  const maxAllowed = (id) => {
    if (!available(id)) return -1;
    const m = S(id).req.every((r) => tierOf(r) >= 2) ? 2 : 1;
    let r = m;
    for (let ti = 0; ti <= m; ti++)
      if (!tierContent(id, ti)) {
        r = ti - 1;
        break;
      }
    const s = sk(id);
    return s && (s.prog || 0) > 0 && (s.tier || 0) < 3 ? Math.max(r, s.tier || 0) : r;
  };
  return { tierOf, needMet, allVariants, openVariants, tierContent, started, available, maxAllowed };
};
