/* Tests des réponses « ensemble de réels » (K.interval) et « fraction irréductible » (K.frac) :
   node tests/answers-test.js   (code 1 en cas d'échec). KaTeX facultatif : s'il est installé, l'aperçu est compilé. */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const D = path.join(__dirname, '..');
global.window = global;
global.localStorage = { getItem: () => null, setItem() {} };
for (const f of ['core.js', 'ids.js', 'graph.js', 'kit.js', 'rules.js', 'answers.js']) vm.runInThisContext(fs.readFileSync(path.join(D, f), 'utf8'), { filename: f });
let katex = null;
try {
  katex = require('katex');
} catch {}

let n = 0,
  fails = 0;
const ok = (c, m) => {
  n++;
  if (!c) {
    fails++;
    console.error('ÉCHEC : ' + m);
  }
};
const V = CU.V;
const iv = (ans, tgt) => V.interval(ans, tgt);
const yes = (ans, tgt) => ok(iv(ans, tgt).ok === true, `« ${ans} » devrait valoir « ${tgt} » (${JSON.stringify(iv(ans, tgt))})`);
const no = (ans, tgt, frag, flags = {}) => {
  const r = iv(ans, tgt);
  ok(r.ok === false, `« ${ans} » ne devrait pas être accepté pour « ${tgt} »`);
  if (frag) ok(r.msg && r.msg.includes(frag), `« ${ans} » / « ${tgt} » : message attendu contenant « ${frag} », reçu « ${r.msg} »`);
  for (const [k, v] of Object.entries(flags)) ok(!!r[k] === v, `« ${ans} » / « ${tgt} » : drapeau ${k} attendu ${v}`);
};

/* --- équivalences d'écriture --- */
yes(']-∞;2]', ']-∞ ; 2]');
yes(']-inf ; 2]', ']-∞;2]');
yes(']−∞;2]', ']-∞;2]');
yes('[1;3] ∪ [3;5]', '[1;5]');
yes('[1;3]U[3;5]', '[1;5]');
yes('[1;3] ou [3;5]', '[1;5]');
yes('[1;3] union [3;5]', '[1;5]');
yes('[1;3[ ∪ ]3;5]', '[1;3[ ∪ ]3;5]');
yes(']-∞;3[ ∪ ]3;+∞[', 'ℝ\\{3}');
yes('R\\{3}', ']-∞;3[∪]3;+∞[');
yes('ℝ∖{1 ; 2}', ']-∞;1[ ∪ ]1;2[ ∪ ]2;+∞[');
yes('ℝ*', ']-∞;0[ ∪ ]0;+∞[');
yes('{3}', '[3;3]');
yes('{2;5}', '[2;2] ∪ [5;5]');
yes('[1;3[ ∪ {3}', '[1;3]');
yes('aucune', '∅');
yes('∅', ']2;2[');
yes('{}', 'vide');
yes('ℝ', ']-∞;+∞[');
yes('[1/2 ; 3/2]', '[0,5 ; 1,5]');
yes('[-√2 ; √2]', '[-sqrt(2) ; sqrt(2)]');
yes('[-racine(8) ; 2√2]', '[-2√2 ; 2√2]');
yes(']-∞;1] ∪ [0;5]', ']-∞;5]');
yes('[ 2 ; +∞ [', '[2;+∞[');

/* --- erreurs : écriture (syntax) vs mathématiques --- */
no('[3;1]', '[1;3]', 'plus petite', { syntax: true });
no('[1;2', '[1;2]', null, { syntax: true });
no('', '[1;2]', null, { syntax: true });
no('[x;2]', '[1;2]', 'sans lettre', { syntax: true });
no('(1;3)', '[1;3]', 'crochets', { syntax: true });
no('[1;2] ∪', '[1;2]', '∪', { syntax: true });
no('[1;2[3;4]', '[1;4]', null, { syntax: true });
no('[1 ; 1/0]', '[1;2]', null, { syntax: true });
no('[-∞;2]', ']-∞;2]', 'infini', { syntax: false, close: true });
no('[1;+∞]', '[1;+∞[', 'infini', { syntax: false, close: true });

/* --- diagnostics --- */
no('[1;5[', '[1;5]', 'crochets', { close: true });
no(']1;5]', '[1;5]', 'crochets', { close: true });
no(']-∞;2[', ']-∞;2]', 'crochets', { close: true });
no(']-∞;3[ ∪ [3;+∞[', 'ℝ\\{3}', null); // = ℝ : pas la bonne réponse
no('[2;+∞[', ']-∞;2[', 'complémentaire', { close: true });
no(']-∞;2] ∪ [5;+∞[', ']2;5[', 'complémentaire', { close: true });
no('[1;3]', '[1;5]', 'manque', { close: true });
no('[0;5]', '[1;5]', 'pas solutions', { close: true });
no('{3}', '[1;5]', 'manque', { close: true });
no('∅', '[1;5]', 'vide');
no('[1;5]', 'aucune', 'solutions');
no('[1;5]', '[1;2] ∪ [3;4]', 'pas solutions', { close: true });
no('[1;2] ∪ [4;5]', '[1;3] ∪ [4;5]', 'manque', { close: true });
no('[1;3] ∪ [6;7]', '[1;3] ∪ [4;5]', 'pas le bon');

/* --- calcul d'ensembles --- */
const P = (s) => CU.IV.parse(s).ivs;
ok(CU.IV.same(CU.IV.complement(P('ℝ')), []), 'complément de ℝ');
ok(CU.IV.same(CU.IV.complement(P('∅')), P('ℝ')), 'complément de ∅');
ok(CU.IV.same(CU.IV.complement(P('[1;3[')), P(']-∞;1[ ∪ [3;+∞[')), 'complément de [1;3[');
ok(CU.IV.same(CU.IV.complement(CU.IV.complement(P('[1;3] ∪ {5} ∪ ]7;+∞['))), P('[1;3] ∪ {5} ∪ ]7;+∞[')), 'double complément');
ok(CU.IV.same(CU.IV.intersect(P('[1;5]'), P(']3;9[')), P(']3;5]')), 'intersection');
ok(CU.IV.same(CU.IV.intersect(P('[1;5]'), P(']1;5[')), P(']1;5[')), 'intersection : extrémités communes, crochets différents');
ok(CU.IV.same(CU.IV.intersect(P('[1;5]'), P('[5;9]')), P('{5}')), 'intersection réduite à un point');
ok(CU.IV.same(CU.IV.intersect(P('[1;5[') , P(']5;9]')), []), 'intersection vide');
ok(CU.IV.subset(P('[2;3]'), P('[1;5]')) && !CU.IV.subset(P('[0;3]'), P('[1;5]')), 'inclusion');

/* --- écriture d'un ensemble (cible générée) --- */
for (const t of [']-∞ ; 2] ∪ [5 ; +∞[', 'ℝ\\{3}', '{2 ; 5}', '[1/2 ; 7/3[', '∅', 'ℝ', ']-3 ; -1] ∪ {4}'])
  ok(CU.IV.same(P(CU.IV.str(P(t))), P(t)), 'IV.str aller-retour : ' + t + ' → ' + CU.IV.str(P(t)));

/* --- fractions --- */
const fr = (a, p, d) => V.frac(a, p, d);
ok(fr('3/4', 3, 4).ok, '3/4');
ok(fr('-3/4', -3, 4).ok, '-3/4');
ok(fr('−3/4', -3, 4).ok, '−3/4 (signe typographique)');
ok(fr('5', 5, 1).ok, 'entier 5');
ok(fr('5/1', 5, 1).ok, '5/1');
ok(fr('0', 0, 1).ok, '0');
ok(fr(' 3 / 4 ', 3, 4).ok, 'espaces');
let r = fr('6/8', 3, 4);
ok(!r.ok && r.close && /irréductible/.test(r.msg), '6/8 non simplifié : ' + JSON.stringify(r));
r = fr('-6/8', -3, 4);
ok(!r.ok && r.close && /irréductible/.test(r.msg), '-6/8 non simplifié');
r = fr('10/2', 5, 1);
ok(!r.ok && /irréductible/.test(r.msg), '10/2 pour 5');
r = fr('0.75', 3, 4);
ok(!r.ok && r.close && /forme d’une fraction/.test(r.msg), '0.75 : ' + JSON.stringify(r));
r = fr('(1+2)/4', 3, 4);
ok(!r.ok && r.close && /forme d’une fraction/.test(r.msg), 'calcul non effectué');
r = fr('3/-4', -3, 4);
ok(!r.ok && r.close && /signe/.test(r.msg), '3/-4 : ' + JSON.stringify(r));
r = fr('1/2', 3, 4);
ok(!r.ok && !r.close && !r.syntax, '1/2 faux : ' + JSON.stringify(r));
r = fr('0,333', 1, 3);
ok(!r.ok, 'valeur approchée refusée');
r = fr('3/', 3, 4);
ok(!r.ok && r.syntax, 'syntaxe');

/* --- constructeurs --- */
const e1 = CU.K.interval('Q', ']-∞ ; 2] ∪ [5 ; +∞[', 'sol', 'indice');
ok(e1.type === 'fields' && e1.fields[0].kind === 'interval' && e1.emptyBtn && e1.check([e1._ans[0]]).ok, 'K.interval s’auto-valide');
ok(!e1.check([']2;5[']).ok, 'K.interval refuse un faux');
const e2 = CU.K.frac('Q', -3, 4, 'sol', 'indice');
ok(e2.fields[0].kind === 'frac' && e2.check([e2._ans[0]]).ok, 'K.frac s’auto-valide');
for (const bad of [[6, 8], [3, -4], [3, 0], [1.5, 2]]) {
  let threw = false;
  try {
    CU.K.frac('Q', bad[0], bad[1], '', '');
  } catch {
    threw = true;
  }
  ok(threw, `K.frac(${bad}) doit lever une erreur d’écriture`);
}
let threw = false;
try {
  CU.K.interval('Q', '[3;1]', '', '');
} catch {
  threw = true;
}
ok(threw, 'K.interval avec une cible mal écrite doit lever une erreur');

/* --- aperçu --- */
const pv = (s, k = 'interval') => CU.preview(s, k);
ok(pv('') === '', 'aperçu vide');
ok(pv('[1;') === null, 'aperçu d’une saisie incomplète : « … »');
ok(pv(']-∞ ; 2]').includes('\\infty') && pv(']-∞ ; 2]').includes('\\mathopen{]}'), 'aperçu d’un intervalle : ' + pv(']-∞ ; 2]'));
ok(pv('ℝ\\{3}') === '\\mathbb{R}\\setminus\\{3\\}', 'aperçu ℝ∖{3} : ' + pv('ℝ\\{3}'));
ok(pv('aucune') === '\\emptyset', 'aperçu ∅');
ok(pv('-3/4', 'frac') === '-\\dfrac{3}{4}', 'aperçu fraction : ' + pv('-3/4', 'frac'));
ok(pv('2', 'frac') === '2', 'aperçu entier');
if (katex)
  for (const s of [']-∞ ; 2] ∪ [5 ; +∞[', 'ℝ∖{1 ; 2}', '{1;2;3}', '[-√2 ; √2]', '[1/2 ; 3/2[', '∅', 'ℝ*', 'ℝ', ']−∞;+∞[']) {
    try {
      katex.renderToString(pv(s), { throwOnError: true, strict: false });
      ok(true, '');
    } catch (e) {
      ok(false, `TeX invalide pour « ${s} » : ${pv(s)} → ${e.message}`);
    }
  }

console.log(fails ? `${fails} ÉCHEC(S) sur ${n}` : `${n}/${n} vérifications réussies${katex ? '' : ' (KaTeX absent : aperçu non compilé)'}`);
process.exit(fails ? 1 : 0);
