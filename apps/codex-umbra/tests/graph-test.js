/* Validateur du graphe des notions (graph.js) : `node tests/graph-test.js`.
   Échoue (code 1) si le graphe contient un cycle, un prérequis inconnu, une incohérence avec ids.js
   ou avec les Lois écrites, ou si une Loi/un rang peut rester inaccessible avec les vraies règles
   du jeu (rules.js). Affiche aussi l'avancement de l'écriture région par région. */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const D = path.join(__dirname, '..');
global.window = global;
global.localStorage = { getItem: () => null, setItem() {} };
for (const f of ['core.js', 'ids.js', 'graph.js', 'kit.js', 'rules.js', 'c-vec.js', 'c-alg.js', 'c-misc.js', 'story.js']) vm.runInThisContext(fs.readFileSync(path.join(D, f), 'utf8'), { filename: f });

let fails = 0;
const ok = (c, m) => {
  if (!c) {
    fails++;
    console.error('ÉCHEC : ' + m);
  }
};
const G = CU.GRAPH;
const ids = Object.keys(G.laws);
const written = Object.keys(CU.SKILLS);

/* 1. cohérence avec ids.js */
for (const id of CU.IDS.laws) ok(G.laws[id], `Loi ${id} (ids.js) absente du graphe`);
for (const id of ids) ok(CU.IDS.laws.includes(id), `Loi ${id} du graphe absente de ids.js`);
for (const id of Object.keys(G.regions)) ok(CU.IDS.regions.includes(id), `région ${id} du graphe absente de ids.js`);
for (const r of CU.IDS.regions) ok(G.regions[r], `région ${r} (ids.js) absente du graphe`);

/* 2. prérequis connus, sans doublon, sans auto-référence */
for (const id of ids) {
  const g = G.laws[id];
  ok(G.regions[g.region], `${id} : région inconnue « ${g.region} »`);
  ok(new Set(g.req).size === g.req.length, `${id} : prérequis en double`);
  for (const r of g.req) {
    ok(G.laws[r], `${id} : prérequis inconnu « ${r} »`);
    ok(r !== id, `${id} : prérequis de lui-même`);
  }
}

/* 3. pas de cycle (tri topologique) et profondeur */
const depth = {};
const state = {};
const visit = (id, stack) => {
  if (state[id] === 2) return depth[id];
  if (state[id] === 1) {
    ok(false, 'cycle : ' + [...stack, id].join(' → '));
    return 0;
  }
  state[id] = 1;
  let d = 0;
  for (const r of G.laws[id].req) if (G.laws[r]) d = Math.max(d, visit(r, [...stack, id]) + 1);
  state[id] = 2;
  return (depth[id] = d);
};
for (const id of ids) visit(id, []);

/* 4. entrées du jeu : Lois sans prérequis */
const entries = ids.filter((id) => !G.laws[id].req.length);
ok(entries.length > 0, 'aucune Loi d’entrée');

/* 5. Lois écrites : région et prérequis effectifs conformes */
CU.finalizeGraph();
for (const id of written) {
  const g = G.laws[id];
  ok(g, `Loi écrite ${id} absente du graphe`);
  if (!g) continue;
  ok(CU.SKILLS[id].region === g.region, `${id} : région ${CU.SKILLS[id].region} dans le contenu, ${g.region} dans le graphe`);
  const eff = g.req.filter((r) => CU.SKILLS[r]);
  ok(JSON.stringify(CU.SKILLS[id].req) === JSON.stringify(eff), `${id} : prérequis effectifs incohérents avec le graphe`);
}
for (const id of CU.IDS.laws) if (!G.laws[id]) ok(false, `${id} sans entrée dans le graphe`);

/* 6. aucune région ne dépasse 9 Lois (lisibilité de la carte) */
const perRegion = {};
for (const id of ids) (perRegion[G.laws[id].region] ||= []).push(id);
for (const [r, l] of Object.entries(perRegion)) ok(l.length <= 9, `région ${r} : ${l.length} Lois (max 9)`);

/* 7. aucun blocage : point fixe glouton avec les vraies règles.
   On part d'une sauvegarde vide ; tant qu'un rang est ouvert (maxAllowed), on le brise.
   Les sceaux ne se perdant jamais, le résultat ne dépend pas de l'ordre. */
const skills = {};
for (const id of written) skills[id] = { tier: 0, prog: 0, done: 0 };
const rules = CU.makeRules(() => skills);
let moved = true;
while (moved) {
  moved = false;
  for (const id of written) {
    const m = rules.maxAllowed(id);
    if (m >= 0 && skills[id].tier < Math.min(m + 1, 3)) {
      skills[id].tier++;
      moved = true;
    }
  }
}
for (const id of written) {
  ok(skills[id].tier === 3, `${id} : bloquée au rang ${skills[id].tier}/3 — manquant : ${rules.maxAllowed(id) < 0 ? 'Loi fermée (prérequis ' + CU.SKILLS[id].req.join(',') + ')' : 'variante exigeant ' + [...new Set(rules.allVariants(id, Math.min(skills[id].tier, 2)).flatMap((v) => v.needs || []))].join(',')}`);
}
/* chaque rang a au moins une variante sans condition fine ou une condition satisfiable */
for (const id of written)
  for (let ti = 0; ti < 3; ti++) ok(rules.tierContent(id, ti), `${id} rang ${ti + 1} : aucune variante jouable à la fin`);

/* 8. les besoins fins (needs) visent des Lois écrites */
for (const id of written)
  for (let ti = 0; ti < 3; ti++)
    for (const v of rules.allVariants(id, ti))
      for (const n of v.needs || []) {
        const [t, k] = n.split(':');
        ok(CU.SKILLS[t], `${id} rang ${ti + 1} : besoin « ${n} » vers une Loi non écrite`);
        ok(!k || ['1', '2', '3'].includes(k), `${id} : besoin « ${n} » mal formé`);
      }

/* bilan */
console.log(`Graphe : ${ids.length} Lois (${written.length} écrites, ${ids.length - written.length} prévues), ${Object.keys(G.regions).length} régions, ${entries.length} entrées (${entries.join(', ')}), profondeur max ${Math.max(...Object.values(depth))}`);
for (const [r, l] of Object.entries(perRegion)) {
  const w = l.filter((id) => CU.SKILLS[id]).length;
  console.log(`  ${r.padEnd(5)} ${String(w).padStart(2)}/${String(l.length).padEnd(2)} écrites  ${G.regions[r].name}`);
}
console.log(fails ? `\n${fails} ÉCHEC(S)` : '\nGraphe valide.');
process.exit(fails ? 1 : 0);
