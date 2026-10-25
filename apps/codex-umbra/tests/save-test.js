// Tests de la sauvegarde et des identifiants figés. Lancer : node tests/save-test.js [sauvegardes.json]
// Le fichier facultatif contient de vraies sauvegardes ([{payload}, …]) ; il ne doit jamais être
// versionné (noms des joueurs). Sans lui, des sauvegardes synthétiques sont utilisées.
'use strict';
const fs = require('fs'),
  vm = require('vm'),
  path = require('path');
const D = path.join(__dirname, '..');
global.window = global;
global.localStorage = { getItem: () => null, setItem() {} };
for (const f of ['core.js', 'ids.js', 'graph.js', 'kit.js', 'rules.js', 'c-vec.js', 'c-alg.js', 'c-misc.js', 'story.js']) vm.runInThisContext(fs.readFileSync(path.join(D, f), 'utf8'), { filename: f });
const CU = global.CU;
let fails = 0,
  n = 0;
const ok = (cond, msg) => {
  n++;
  if (!cond) {
    fails++;
    console.log('ÉCHEC : ' + msg);
  }
};
const clone = (x) => JSON.parse(JSON.stringify(x));
const eq = (a, b) => JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b));
function sortKeys(x) {
  if (Array.isArray(x)) return x.map(sortKeys);
  if (x && typeof x === 'object') return Object.fromEntries(Object.keys(x).sort().map((k) => [k, sortKeys(x[k])]));
  return x;
}

/* ---------- 1. identifiants figés ---------- */
const lock = JSON.parse(fs.readFileSync(path.join(__dirname, 'ids-lock.json'), 'utf8'));
for (const id of lock.laws) ok(CU.IDS.laws.includes(id), `Loi ${id} retirée de ids.js (interdit : la renommer via renamed)`);
for (const id of lock.regions) ok(CU.IDS.regions.includes(id), `région ${id} retirée de ids.js`);
ok(new Set(CU.IDS.laws).size === CU.IDS.laws.length, 'identifiant de Loi en double dans ids.js');
ok(new Set(CU.IDS.regions).size === CU.IDS.regions.length, 'identifiant de région en double dans ids.js');
for (const id of Object.keys(CU.SKILLS)) ok(CU.IDS.laws.includes(id), `Loi ${id} écrite mais absente de ids.js`);
for (const r of CU.REGIONS) ok(CU.IDS.regions.includes(r.id), `région ${r.id} absente de ids.js`);
for (const [a, b] of Object.entries(CU.IDS.renamed)) ok(CU.IDS.laws.includes(b) && !CU.SKILLS[a], `renommage ${a} → ${b} incohérent`);

/* ---------- 2. sauvegardes de test ---------- */
const synth = [
  { v: 1, xp: 0, name: 'Neuf', frags: [], stats: { solved: 0, bestCombo: 0 }, bosses: {}, skills: {}, updated: 1, prologue: false },
  {
    v: 1,
    xp: 1886,
    name: 'Joueur',
    ach: { r5: 10, x1: 11 },
    cnt: { maxTwo: 2, redress: 8 },
    mem: { 'l1:0': { b: 0, t: 5, due: 9 }, 'v1:2': { b: 1, t: 7, due: 99 }, 'v4:0': { b: 0, t: 3, due: 8 } },
    daily: { day: '2026-10-24', ch: [{ t: 'autel', done: false, goal: 1, prog: 0 }], w: { log: 1 } },
    frags: ['f1', 'f2', 'f1'],
    stats: { solved: 61, bestCombo: 5 },
    bosses: {},
    skills: {
      l1: { done: 13, last: 100, prog: 0, seen: [true, true], tier: 2 },
      p2: { done: 0, last: 0, prog: 0, seen: [true], tier: 0 },
      v1: { done: 15, last: 90, prog: 0, seen: [true, true, true], tier: 3 },
      v4: { done: 5, last: 80, prog: 2, seen: [true], tier: 1 },
    },
    streak: { rep: [], best: 0, days: ['2026-10-23'] },
    updated: 100,
    prologue: true,
  },
];
const extra = process.argv[2] ? JSON.parse(fs.readFileSync(process.argv[2], 'utf8')).map((r) => r.payload || r) : [];
const saves = [...synth, ...extra];

function noLoss(orig, got, label) {
  ok((got.xp || 0) >= (orig.xp || 0), `${label} : XP perdue`);
  for (const [id, s] of Object.entries(orig.skills || {})) {
    const g = got.skills[id];
    ok(!!g, `${label} : Loi ${id} perdue`);
    if (!g) continue;
    ok(g.tier > (s.tier || 0) || (g.tier === (s.tier || 0) && g.prog >= (s.prog || 0)), `${label} : progression de ${id} en baisse`);
    ok(g.done >= (s.done || 0), `${label} : compteur de ${id} en baisse`);
    (s.seen || []).forEach((x, i) => ok(!x || g.seen[i], `${label} : leçon ${id}#${i} oubliée`));
  }
  for (const k of Object.keys(orig.mem || {})) ok(got.mem && got.mem[k], `${label} : mémoire ${k} perdue`);
  for (const f of orig.frags || []) ok(got.frags.includes(f), `${label} : fragment ${f} perdu`);
  for (const k of Object.keys(orig)) ok(k in got, `${label} : champ ${k} perdu`);
}

for (const [i, s0] of saves.entries()) {
  const L = `sauvegarde ${i} (${s0.name})`;
  const m1 = CU.save.migrate(clone(s0));
  ok(m1.v === CU.SAVE_V, `${L} : version non mise à jour`);
  ok(eq(CU.save.migrate(clone(m1)), m1), `${L} : migration non idempotente`);
  noLoss(s0, m1, L + ' / migration');
  // fusion avec soi-même : rien ne change
  ok(eq(CU.save.merge(s0, s0), CU.save.merge(clone(m1), clone(m1))), `${L} : fusion avec soi-même instable`);
  noLoss(s0, CU.save.merge(s0, s0), L + ' / fusion avec soi-même');
  // la fusion avec chaque autre sauvegarde ne perd rien d'aucun côté
  for (const [j, t0] of saves.entries()) {
    if (j === i) continue;
    const ab = CU.save.merge(s0, t0),
      ba = CU.save.merge(t0, s0);
    noLoss(s0, ab, `${L} ⊕ ${j}`);
    noLoss(t0, ab, `${j} ⊕ ${L}`);
    ok(ab.xp === ba.xp && eq(Object.fromEntries(Object.entries(ab.skills).map(([k, v]) => [k, [v.tier, v.prog, v.done]])), Object.fromEntries(Object.entries(ba.skills).map(([k, v]) => [k, [v.tier, v.prog, v.done]]))), `${L} ⊕ ${j} : fusion dépendante de l'ordre`);
  }
}

/* ---------- 3. champs inconnus, version future ---------- */
{
  const a = clone(synth[1]),
    b = clone(synth[1]);
  b.futur = { x: 1 };
  b.skills.v1.nouveau = 'y';
  const m = CU.save.merge(a, b);
  ok(m.futur && m.futur.x === 1, 'champ inconnu perdu à la fusion');
  ok(m.skills.v1.nouveau === 'y', 'sous-champ inconnu perdu à la fusion');
  // leçons lues sur des appareils différents : on garde l'union, dans les deux sens
  const c = clone(synth[1]),
    d = clone(synth[1]);
  c.skills.v4.seen = [true];
  d.skills.v4.seen = [false, true];
  ok(eq(CU.save.merge(c, d).skills.v4.seen, [true, true]) && eq(CU.save.merge(d, c).skills.v4.seen, [true, true]), 'leçons lues : union non conservée');
  const fut = { ...clone(synth[1]), v: CU.SAVE_V + 1, skills: { v1: { tier: 'bizarre' } } };
  ok(eq(CU.save.migrate(clone(fut)), fut), 'une sauvegarde de version future a été modifiée');
}

/* ---------- 4. renommage d'une Loi ---------- */
{
  CU.IDS.renamed.v4 = 'v4bis';
  const m = CU.save.migrate(clone(synth[1]));
  ok(!m.skills.v4 && m.skills.v4bis && m.skills.v4bis.tier === 1 && m.skills.v4bis.prog === 2, 'renommage : progression non transférée');
  ok(!m.mem['v4:0'] && m.mem['v4bis:0'], 'renommage : mémoire non transférée');
  // les deux noms présents (un appareil migré, un autre pas) : on garde le meilleur
  const both = clone(synth[1]);
  both.skills.v4bis = { tier: 2, prog: 0, done: 1, seen: [], last: 1 };
  ok(CU.save.migrate(both).skills.v4bis.tier === 2, 'renommage : la meilleure progression doit l’emporter');
  delete CU.IDS.renamed.v4;
}

/* ---------- 5. fusion sur place (épreuve en cours) ---------- */
{
  const st = CU.save.migrate(clone(synth[1]));
  const ref = st.skills.v4,
    memRef = st.mem['v1:2'];
  const other = clone(synth[1]);
  other.skills.v4.prog = 4;
  other.skills.v2 = { tier: 1, prog: 0, done: 5, seen: [true], last: 50 };
  other.xp = 2000;
  const changed = CU.save.mergeInto(st, other);
  ok(changed, 'fusion sur place : changement non signalé');
  ok(st.skills.v4 === ref && ref.prog === 4, 'fusion sur place : objet de Loi remplacé ou non mis à jour');
  ok(st.mem['v1:2'] === memRef, 'fusion sur place : objet de mémoire remplacé');
  ok(st.skills.v2 && st.skills.v2.tier === 1 && st.xp === 2000, 'fusion sur place : apports de l’autre appareil manquants');
  ref.prog++; // l'épreuve en cours continue d'écrire dans le même objet
  ok(st.skills.v4.prog === 5, 'fusion sur place : écriture ultérieure perdue');
  ok(!CU.save.mergeInto(st, clone(st)), 'fusion sur place : changement signalé à tort');
}

/* ---------- 6. deux appareils qui jouent en même temps ---------- */
{
  let cloud = null;
  // envoi tel que le fait pushCloud : relire, fusionner sur place, écrire
  const push = (st) => {
    if (cloud) CU.save.mergeInto(st, cloud);
    cloud = clone(st);
  };
  const A = CU.save.migrate(clone(synth[1])),
    B = CU.save.migrate(clone(synth[1]));
  push(A);
  A.skills.v4.tier = 2;
  A.skills.v4.prog = 0;
  A.xp += 50;
  push(A); // l'appareil A progresse et envoie
  B.skills.l1.tier = 3;
  B.skills.p2.prog = 1;
  push(B); // B, resté sur l'ancien état, envoie à son tour
  ok(cloud.skills.v4.tier === 2 && cloud.skills.l1.tier === 3 && cloud.skills.p2.prog === 1 && cloud.xp === synth[1].xp + 50, 'deux appareils : une progression a été écrasée');
}

console.log(`${n - fails}/${n} vérifications réussies` + (extra.length ? ` (dont ${extra.length} sauvegardes réelles)` : ''));
process.exit(fails ? 1 : 0);
