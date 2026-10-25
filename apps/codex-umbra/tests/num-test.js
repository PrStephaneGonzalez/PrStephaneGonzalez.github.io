/* Contre-vérification des Forges des Nombres : `node tests/num-test.js [répétitions]`.
   Pour chaque type d'exercice, la réponse attendue est recalculée ici par une autre méthode
   (force brute, BigInt, échantillonnage de points…) à partir de l'énoncé affiché,
   puis on vérifie que le correcteur accepte la bonne réponse et refuse une mauvaise. */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const D = path.join(__dirname, '..');
global.window = global;
global.localStorage = { getItem: () => null, setItem() {} };
for (const f of ['core.js', 'ids.js', 'graph.js', 'kit.js', 'rules.js', 'answers.js', 'c-vec.js', 'c-alg.js', 'c-misc.js', 'c-num.js']) vm.runInThisContext(fs.readFileSync(path.join(D, f), 'utf8'), { filename: f });
CU.finalizeGraph();

const REP = +process.argv[2] || 150;
let n = 0,
  fails = 0;
const seen = {};
const ok = (c, key, m) => {
  n++;
  if (!c) {
    fails++;
    seen[key] = (seen[key] || 0) + 1;
    if (seen[key] <= 3) console.error('ÉCHEC ' + key + ' : ' + m);
  }
};
const V = (id, t, i) => CU.SKILLS[id].gen[t].variants[i];
const nums = (s) => (String(s).replace(/\{,\}/g, '.').match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
const disp = (q) => (q.match(/\$\$([\s\S]+?)\$\$/) || [])[1];
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const isPrime = (p) => {
  if (p < 2) return false;
  for (let d = 2; d * d <= p; d++) if (p % d === 0) return false;
  return true;
};
const close = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(a), Math.abs(b));
// TeX numérique → valeur (fractions, racines, puissances, \cfrac)
function texVal(t) {
  let s = t
    .replace(/\\left|\\right/g, '')
    .replace(/\\[,;!]|\\ /g, '')
    .replace(/\{,\}/g, '.')
    .replace(/\\times/g, '*')
    .replace(/\\div/g, '/')
    .replace(/\\[dc]?frac/g, '\\frac');
  s = s.replace(/\\sqrt(\d)/g, '√($1)').replace(/\\frac(\d)(\d)/g, '(($1)/($2))').replace(/\\frac(\d)\{/g, '\\frac{$1}{');
  for (let k = 0; k < 12; k++)
    s = s
      .replace(/\\sqrt\{([^{}]*)\}/g, '√($1)')
      .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))')
      .replace(/\^\{([^{}]*)\}/g, '^($1)');
  s = s.replace(/[{}]/g, '');
  return CU.evalAst(CU.parse(s), 0);
}
// réponse attendue (valeurs numériques) d'un exercice à champs
const expected = (e) => (e._vals ? e._vals : e._ans.map((a) => CU.evalAst(CU.parse(a), 0)));
const accepts = (e, arr) => e.check(arr.map(String)).ok;
const run = (key, f) => {
  for (let r = 0; r < REP; r++) {
    let e;
    try {
      e = f.gen();
    } catch (er) {
      ok(false, key, 'exception ' + er.message);
      continue;
    }
    try {
      f.test(e, key);
    } catch (er) {
      ok(false, key, 'test : ' + er.message + ' :: ' + (e.q || '').slice(0, 120));
    }
  }
};
// choix : renvoie l'indice du choix vérifiant pred ; doit être unique et égal à e.correct
const choiceCheck = (e, key, pred) => {
  const good = e.choices.map((c, i) => [pred(c), i]).filter((x) => x[0]);
  ok(good.length === 1 && good[0][1] === e.correct, key, 'choix correct ambigu ou faux : ' + e.choices.join(' | '));
};

/* ---------- N1 ---------- */
run('n1 diviseur', { gen: V('n1', 0, 0), test: (e, k) => {
  const N = nums(e.q)[0];
  choiceCheck(e, k, (c) => N % nums(c)[0] === 0);
} });
run('n1 plus grand multiple', { gen: V('n1', 0, 1), test: (e, k) => {
  const [b, N] = nums(e.q);
  let m = 0;
  for (let x = 0; x <= N; x += b) m = x;
  ok(close(expected(e)[0], m), k, `${b} ${N} → ${m}`);
  ok(!accepts(e, [m + b]), k, 'accepte faux');
} });
run('n1 parité', { gen: V('n1', 0, 2), test: (e, k) => {
  const ex = e.q.match(/nombre \$([^$]+)\$/)[1];
  const f = (x) => CU.evalAst(CU.parse(ex.replace(/n/g, '(' + x + ')')), 0);
  const ps = [...Array(9).keys()].map((x) => ((f(x - 4) % 2) + 2) % 2);
  const want = ps.every((x) => x === 0) ? 'Toujours pair' : ps.every((x) => x === 1) ? 'Toujours impair' : 'Cela dépend';
  choiceCheck(e, k, (c) => c.startsWith(want));
} });
run('n1 critères', { gen: V('n1', 0, 3), test: (e, k) => {
  const d = nums(e.q)[0];
  choiceCheck(e, k, (c) => nums(c)[0] % d === 0);
} });
run('n1 nombre de diviseurs', { gen: V('n1', 1, 0), test: (e, k) => {
  const N = nums(e.q)[0];
  let c = 0;
  for (let d = 1; d <= N; d++) if (N % d === 0) c++;
  ok(expected(e)[0] === c, k, N + ' → ' + c);
} });
run('n1 division euclidienne', { gen: V('n1', 1, 1), test: (e, k) => {
  const [a, b] = nums(e.q);
  const [q, r] = expected(e);
  ok(a === b * q + r && r >= 0 && r < b, k, `${a}=${b}×${q}+${r}`);
  ok(!accepts(e, [q - 1, r + b]), k, 'accepte un reste trop grand');
} });
run('n1 somme de k consécutifs', { gen: V('n1', 1, 3), test: (e, k) => {
  const kk = nums(e.q)[0];
  let g = 0;
  for (let m = -20; m <= 40; m++) {
    let s = 0;
    for (let i = 0; i < kk; i++) s += m + i;
    g = gcd(g, s);
  }
  ok(expected(e)[0] === g, k, kk + ' → ' + g);
} });
run('n1 restes de carrés', { gen: V('n1', 2, 1), test: (e, k) => {
  const q = e.q;
  const mod = nums(q.match(/par \$(\d+)\$/)[0])[0];
  const cond = /impair/.test(q) ? (x) => x % 2 !== 0 : /est pair/.test(q) ? (x) => x % 2 === 0 : /multiple de \$3\$/.test(q) ? (x) => x % 3 !== 0 : () => true;
  const sq = /n\^2\+n/.test(q) ? (x) => x * x + x : (x) => x * x;
  const rs = new Set();
  for (let x = -60; x <= 60; x++) if (cond(x)) rs.add(((sq(x) % mod) + mod) % mod);
  ok(rs.size === 1 && [...rs][0] === expected(e)[0], k, q.slice(0, 80) + ' → ' + [...rs]);
} });
run('n1 multiples de a ou b', { gen: V('n1', 2, 2), test: (e, k) => {
  const [, N, a, b] = nums(e.q);
  let c = 0;
  for (let x = 1; x <= N; x++) if (x % a === 0 || x % b === 0) c++;
  ok(expected(e)[0] === c, k, `${a},${b},${N} → ${c}`);
} });
run('n1 division négative', { gen: V('n1', 2, 3), test: (e, k) => {
  const m = e.q.match(/a=-(\d+)\$ et \$b=(\d+)/);
  const a = -+m[1],
    b = +m[2];
  const [q, r] = expected(e);
  ok(a === b * q + r && r >= 0 && r < b, k, `${a}=${b}×${q}+${r}`);
} });
/* ---------- N2 ---------- */
run('n2 premier', { gen: V('n2', 0, 0), test: (e, k) => choiceCheck(e, k, (c) => isPrime(nums(c)[0])) });
run('n2 décomposition', { gen: V('n2', 0, 1), test: (e, k) => {
  const N = nums(disp(e.q))[0];
  const [a, b, c] = expected(e);
  ok(2 ** a * 3 ** b * 5 ** c === N, k, N);
} });
run('n2 fraction irréductible', { gen: V('n2', 0, 2), test: (e, k) => {
  const v = texVal(disp(e.q));
  const [p, q] = e._ans[0].split('/').map(Number);
  ok(close(p / q, v) && gcd(p, q) === 1, k, e._ans[0]);
  const [P, Q] = nums(disp(e.q));
  ok(!accepts(e, [P + '/' + Q]), k, 'accepte la fraction non simplifiée');
} });
run('n2 plus petit facteur premier', { gen: V('n2', 1, 0), test: (e, k) => {
  const N = nums(e.q)[0];
  let p = 2;
  while (N % p) p++;
  ok(expected(e)[0] === p, k, N);
} });
run('n2 test jusqu’à √n', { gen: V('n2', 1, 1), test: (e, k) => {
  const N = nums(e.q.split('Pour $n=')[1])[0];
  let p = Math.floor(Math.sqrt(N));
  while (!isPrime(p)) p--;
  ok(expected(e)[0] === p, k, N);
} });
run('n2 PGCD', { gen: V('n2', 1, 2), test: (e, k) => {
  const [a, b] = nums(e.q.split('PGCD')[1]);
  ok(expected(e)[0] === gcd(a, b), k, a + ',' + b);
} });
run('n2 irréductible ?', { gen: V('n2', 1, 3), test: (e, k) => {
  const [p, q] = nums(disp('$$' + e.q.match(/\\dfrac\{(\d+)\}\{(\d+)\}/).slice(1).join('/') + '$$'));
  const irr = gcd(p, q) === 1;
  ok(e.choices[e.correct].startsWith(irr ? 'Oui' : 'Non'), k, p + '/' + q);
} });
run('n2 nombre de diviseurs', { gen: V('n2', 2, 1), test: (e, k) => {
  const N = nums(e.q)[0];
  let c = 0;
  for (let d = 1; d <= N; d++) if (N % d === 0) c++;
  ok(expected(e)[0] === c, k, N);
} });
run('n2 PPCM', { gen: V('n2', 2, 2), test: (e, k) => {
  const m = e.q.match(/\\dfrac\{1\}\{(\d+)\}\+\\dfrac\{1\}\{(\d+)\}/);
  const a = +m[1],
    b = +m[2];
  ok(expected(e)[0] === (a * b) / gcd(a, b), k, a + ',' + b);
} });
/* ---------- N3 ---------- */
for (const [t, i, lab] of [[0, 0, 'somme'], [0, 1, 'produit'], [0, 2, 'quotient'], [1, 0, 'priorité'], [1, 1, 'parenthèses'], [2, 0, 'fraction continue']])
  run('n3 ' + lab, { gen: V('n3', t, i), test: (e, k) => {
    const v = texVal(disp(e.q));
    const [p, q] = e._ans[0].split('/').map(Number);
    ok(close(v, p / (q || 1)), k, disp(e.q) + ' ≠ ' + e._ans[0]);
    ok(!accepts(e, [p + 1 + '/' + (q || 1)]), k, 'accepte faux');
  } });
run('n3 fraction d’une quantité', { gen: V('n3', 0, 3), test: (e, k) => {
  const [Q, p, q] = nums(e.q);
  ok(close(expected(e)[0], (p * Q) / q), k, e.q);
} });
run('n3 comparer', { gen: V('n3', 1, 2), test: (e, k) => {
  const vals = e.choices.map((c) => texVal(c.replace(/\$/g, '')));
  const want = /grande/.test(e.q) ? Math.max(...vals) : Math.min(...vals);
  choiceCheck(e, k, (c) => close(texVal(c.replace(/\$/g, '')), want));
} });
run('n3 égalité de fractions', { gen: V('n3', 1, 3), test: (e, k) => {
  const [p, q, Q] = nums(disp(e.q));
  ok(close(expected(e)[0] / Q, p / q), k, disp(e.q));
} });
run('n3 fraction du reste', { gen: V('n3', 1, 4), test: (e, k) => {
  const f = [...e.q.matchAll(/\\dfrac\{(\d+)\}\{(\d+)\}/g)].map((m) => +m[1] / +m[2]);
  const [p, q] = e._ans[0].split('/').map(Number);
  ok(close((1 - f[0]) * (1 - f[1]), p / (q || 1)), k, e._ans[0]);
} });
run('n3 télescopique', { gen: V('n3', 2, 1), test: (e, k) => {
  const N = +disp(e.q).match(/\{(\d+)\\times(\d+)\}\$*$/m)?.[1] || nums(disp(e.q)).slice(-2)[0];
  let s = 0;
  for (let i = 1; i <= N; i++) s += 1 / (i * (i + 1));
  const [p, q] = e._ans[0].split('/').map(Number);
  ok(close(s, p / q), k, N);
} });
run('n3 entre deux fractions', { gen: V('n3', 2, 2), test: (e, k) => {
  const [a, b, c, d] = nums(e.q.replace(/\\dfrac\{(\d+)\}\{(\d+)\}/g, ' $1 $2 '));
  ok(accepts(e, e._ans) && !accepts(e, [a + '/' + b]) && !accepts(e, [c + '/' + d]) && !accepts(e, ['5']), k, `${a}/${b} ${c}/${d}`);
  const m = (a + c) / (b + d);
  ok(m > a / b && m < c / d, k, 'médiante hors intervalle');
} });
run('n3 géométrique', { gen: V('n3', 2, 3), test: (e, k) => {
  const d = disp(e.q);
  const base = +d.match(/\\frac1\{(\d+)\}/)[1],
    N = +d.match(/\^\{(\d+)\}\}$/)[1];
  let s = 0;
  for (let i = 0; i <= N; i++) s += 1 / base ** i;
  const [p, q] = e._ans[0].split('/').map(Number);
  ok(close(s, p / q), k, d);
} });
/* ---------- N4 ---------- */
const expOf = (b, v) => Math.log(Math.abs(v)) / Math.log(b);
for (const [t, i] of [[0, 0], [1, 0]])
  run('n4 exposant ' + t, { gen: V('n4', t, i), test: (e, k) => {
    const d = disp(e.q);
    const b = +(e.q.match(/forme \$(\w+)\^k/) || [])[1];
    if (!b) return;
    ok(close(expOf(b, texVal(d)), expected(e)[0], 1e-6), k, d);
  } });
run('n4 notation scientifique', { gen: V('n4', 0, 1), test: (e, k) => {
  const v = texVal(disp(e.q).replace(/\\,/g, ''));
  const [a, m] = expected(e);
  ok(a >= 1 && a < 10 && close(a * 10 ** m, v), k, disp(e.q));
} });
run('n4 produit scientifique', { gen: V('n4', 1, 1), test: (e, k) => {
  const v = texVal(disp(e.q));
  const [a, m] = expected(e);
  ok(a >= 1 && a < 10 && close(a * 10 ** m, v), k, disp(e.q) + ' → ' + a + 'e' + m);
} });
run('n4 deux lettres', { gen: V('n4', 1, 2), test: (e, k) => {
  const d = disp(e.q);
  const f = (a, b) => texVal(d.replace(/a/g, '(' + a + ')').replace(/b/g, '(' + b + ')'));
  const [m, nn] = expected(e);
  ok(close(f(2, 3), 2 ** m * 3 ** nn) && close(f(5, 7), 5 ** m * 7 ** nn), k, d);
} });
run('n4 comparer des puissances', { gen: V('n4', 1, 3), test: (e, k) => {
  const L = (c) => {
    const [b, x] = nums(c);
    return x * Math.log2(b);
  };
  const vals = e.choices.map(L);
  const want = /grand/.test(e.q) ? Math.max(...vals) : Math.min(...vals);
  choiceCheck(e, k, (c) => L(c) === want);
} });
run('n4 chiffre des unités', { gen: V('n4', 2, 0), test: (e, k) => {
  const m = e.q.match(/\$(\d+)\^\{(\d+)\}\$/);
  const u = Number(BigInt(m[1]) ** BigInt(m[2]) % 10n);
  ok(expected(e)[0] === u, k, m[0]);
} });
run('n4 équation exponentielle', { gen: V('n4', 2, 1), test: (e, k) => {
  const d = disp(e.q);
  const [lhs, rhs] = d.split('=');
  const b = +lhs.match(/^(\d)\^x/)[1];
  ok(close(expOf(b, texVal(rhs)), expected(e)[0], 1e-6), k, d);
} });
run('n4 somme de puissances', { gen: V('n4', 2, 2), test: (e, k) => {
  const d = disp(e.q);
  const b = +e.q.match(/forme \$(\d)\^k/)[1];
  const terms = d.split('+').map((t) => t.match(/(\d+)\^\{(\d+)\}/));
  let s = 0n;
  for (const t of terms) s += BigInt(t[1]) ** BigInt(t[2]);
  ok(s === BigInt(b) ** BigInt(expected(e)[0]), k, d);
} });
run('n4 nombre de chiffres', { gen: V('n4', 2, 3), test: (e, k) => {
  const m = e.q.match(/2\^\{(\d+)\}\\times5\^\{(\d+)\}/);
  ok(String(2n ** BigInt(m[1]) * 5n ** BigInt(m[2])).length === expected(e)[0], k, m[0]);
} });
/* ---------- N5 ---------- */
run('n5 produits de racines', { gen: V('n5', 0, 0), test: (e, k) => ok(close(texVal(disp(e.q)), expected(e)[0]), k, disp(e.q)) });
run('n5 simplifier', { gen: V('n5', 0, 1), test: (e, k) => {
  const N = +e.q.match(/\\sqrt\{(\d+)\}/)[1];
  const [a, m] = expected(e);
  let sqf = true;
  for (let p = 2; p * p <= m; p++) if (m % (p * p) === 0) sqf = false;
  ok(a * a * m === N && sqf, k, N);
} });
run('n5 x²=a', { gen: V('n5', 0, 2), test: (e, k) => {
  const a = +disp(e.q).split('=')[1];
  const want = a > 0 ? [-Math.sqrt(a), Math.sqrt(a)] : a === 0 ? [0] : [];
  ok(want.length === e._vals.length && want.every((w) => e._vals.some((v) => close(v, w))), k, a);
} });
run('n5 √((−a)²)', { gen: V('n5', 0, 3), test: (e, k) => ok(close(texVal(disp(e.q)), expected(e)[0]), k, disp(e.q)) });
run('n5 somme de racines', { gen: V('n5', 1, 0), test: (e, k) => {
  const m = +e.q.match(/c\\sqrt\{(\d+)\}/)[1];
  ok(close(texVal(disp(e.q)), expected(e)[0] * Math.sqrt(m)), k, disp(e.q));
} });
run('n5 dénominateur', { gen: V('n5', 1, 1), test: (e, k) => {
  const m = +e.q.match(/k\\sqrt\{(\d+)\}/)[1];
  ok(close(texVal(disp(e.q)), expected(e)[0] * Math.sqrt(m)), k, disp(e.q));
} });
run('n5 conjugués', { gen: V('n5', 1, 2), test: (e, k) => ok(close(texVal(disp(e.q)), expected(e)[0]), k, disp(e.q)) });
run('n5 (x−a)²=b', { gen: V('n5', 1, 3), test: (e, k) => {
  const d = disp(e.q);
  const a = -+d.match(/\(x([+-]\d+)\)/)[1],
    b = +d.split('=')[1];
  for (const v of e._vals) ok(close((v - a) ** 2, b), k, d + ' ' + v);
  ok(b < 0 ? e._vals.length === 0 : b === 0 ? e._vals.length === 1 : e._vals.length === 2, k, 'nombre de solutions ' + d);
} });
run('n5 √((a−√b)²)', { gen: V('n5', 1, 4), test: (e, k) => {
  const v = texVal(disp(e.q));
  choiceCheck(e, k, (c) => close(texVal(c.replace(/\$/g, '')), v));
} });
run('n5 (√a+√b)²', { gen: V('n5', 2, 0), test: (e, k) => {
  const [p, q, r] = expected(e);
  ok(close(texVal(disp(e.q)), p + q * Math.sqrt(r)), k, disp(e.q));
} });
run('n5 conjuguée', { gen: V('n5', 2, 1), test: (e, k) => {
  const [x, y] = expected(e);
  const m = e.q.match(/x\\sqrt\{(\d+)\}\+y\\sqrt\{(\d+)\}/);
  ok(close(texVal(disp(e.q)), x * Math.sqrt(+m[1]) + y * Math.sqrt(+m[2])), k, disp(e.q));
} });
run('n5 radical imbriqué', { gen: V('n5', 2, 2), test: (e, k) => {
  const [x, y] = expected(e);
  const lhs = disp(e.q).split('=')[0];
  ok(x > y && close(texVal(lhs), Math.sqrt(x) + Math.sqrt(y)), k, lhs);
} });
run('n5 racine et puissances de 10', { gen: V('n5', 2, 4), test: (e, k) => {
  const v = texVal(disp(e.q));
  choiceCheck(e, k, (c) => close(texVal(c.replace(/\$/g, '')), v));
} });
run('n5 comparer des sommes', { gen: V('n5', 2, 5), test: (e, k) => {
  const [A, B] = [...e.q.matchAll(/=(\\sqrt\{\d+\}\+\\sqrt\{\d+\})/g)].map((m) => texVal(m[1]));
  ok(e.choices[e.correct] === (A > B ? '$A$' : '$B$'), k, A + ' ' + B);
} });
/* ---------- N6 ---------- */
run('n6 classer', { gen: V('n6', 0, 0), test: (e, k) => {
  const t = disp(e.q).replace(/\\ \?$/, '').replace(/\\pi/g, String(Math.PI));
  const v = texVal(t);
  const f = CU.toFrac(v);
  let c;
  if (!f || /\\pi/.test(disp(e.q))) c = 4;
  else if (f[1] === 1) c = v >= 0 ? 0 : 1;
  else {
    let q = f[1];
    while (q % 2 === 0) q /= 2;
    while (q % 5 === 0) q /= 5;
    c = q === 1 ? 2 : 3;
  }
  const L = ['\\mathbb N', '\\mathbb Z', '\\mathbb D', '\\mathbb Q', '\\mathbb R'];
  ok(e.choices[e.correct].startsWith('$' + L[c] + '$'), k, t + ' → ' + L[c] + ' ; jeu : ' + e.choices[e.correct]);
} });
run('n6 décimal ?', { gen: V('n6', 0, 1), test: (e, k) => {
  const [P, Q] = e.q.match(/\\dfrac\{(\d+)\}\{(\d+)\}/).slice(1).map(Number);
  let q = Q / gcd(P, Q);
  while (q % 2 === 0) q /= 2;
  while (q % 5 === 0) q /= 5;
  ok(e.choices[e.correct].startsWith(q === 1 ? 'Oui' : 'Non'), k, P + '/' + Q);
} });
for (const [t, i, lab] of [[1, 0, 'périodique'], [2, 2, 'période de 9']])
  run('n6 ' + lab, { gen: V('n6', t, i), test: (e, k) => {
    const expand = disp(e.q).split('=').pop().replace(/\\ldots/, '');
    const v = texVal(expand);
    const [p, q] = e._ans[0].split('/').map(Number);
    ok(Math.abs(v - p / (q || 1)) < 2e-3, k, expand + ' ≈ ' + e._ans[0]);
  } });
/* ---------- N7 ---------- */
const inSet = (ivs, x) => ivs.some((i) => (x > i.lo || (i.lc && x === i.lo)) && (x < i.hi || (i.hc && x === i.hi)));
const grid = [];
for (let x = -30; x <= 30; x += 0.25) grid.push(x);
for (const x of [...grid]) grid.push(x + 1 / 3, x + 1 / 5, x + 1 / 7);
const sameOnGrid = (e, k, pred, extra = []) => {
  const ivs = CU.IV.parse(e._ans[0]).ivs;
  const ends = ivs.flatMap((i) => [i.lo, i.hi]).filter(isFinite);
  const pts = grid.filter((x) => !ends.some((t) => Math.abs(t - x) < 1e-9)).concat(extra);
  const bad = pts.filter((x) => inSet(ivs, x) !== pred(x));
  ok(bad.length === 0, k, e.q.slice(0, 120) + ' → ' + e._ans[0] + ' ; écart en ' + bad.slice(0, 3));
};
const ineq = (s) => {
  const m = s.match(/(\\leqslant|\\geqslant|<|>)/);
  return { '\\leqslant': (a, b) => a <= b + 1e-12, '\\geqslant': (a, b) => a >= b - 1e-12, '<': (a, b) => a < b - 1e-12, '>': (a, b) => a > b + 1e-12 }[m[1]];
};
const absArg = (s) => {
  const m = s.match(/\|(\d*)x([+-]\d+)?\|/);
  const kk = m[1] ? +m[1] : 1,
    c = m[2] ? +m[2] : 0;
  return (x) => Math.abs(kk * x + c);
};
run('n7 inégalité → intervalle', { gen: V('n7', 0, 0), test: (e, k) => {
  const s = e.q.match(/tels que \$([^$]+)\$/)[1];
  const parts = s.split(/(\\leqslant|\\geqslant|<|>)/).map((x) => x.trim());
  const pred = (x) => {
    for (let i = 1; i < parts.length; i += 2) {
      const L = parts[i - 1] === 'x' ? x : +parts[i - 1],
        Rr = parts[i + 1] === 'x' ? x : +parts[i + 1];
      if (!ineq(parts[i])(L, Rr)) return false;
    }
    return true;
  };
  sameOnGrid(e, k, pred);
} });
run('n7 appartenance', { gen: V('n7', 0, 1), test: (e, k) => {
  const S = CU.IV.parse(e.q.match(/intervalle \$([^$]+)\$/)[1].replace(/\\mathopen\{(.)\}/g, '$1').replace(/\\mathclose\{(.)\}/g, '$1').replace(/\\,;\\,/, ';')).ivs;
  choiceCheck(e, k, (c) => inSet(S, texVal(c.replace(/\$/g, ''))));
} });
run('n7 |x−a| op r', { gen: V('n7', 1, 0), test: (e, k) => {
  const s = e.q.match(/tels que \$([^$]+)\$/)[1];
  const f = absArg(s),
    op = ineq(s),
    r = +s.split(/\\leqslant|\\geqslant|<|>/)[1];
  sameOnGrid(e, k, (x) => op(f(x), r));
} });
run('n7 |x−a| = r', { gen: V('n7', 1, 1), test: (e, k) => {
  const s = e.q.match(/équation \$([^$]+)\$/)[1];
  const f = absArg(s),
    r = +s.split('=')[1];
  const sols = grid.filter((x) => Number.isInteger(x) && f(x) === r);
  ok(sols.length === e._vals.length && sols.every((x) => e._vals.includes(x)), k, s);
} });
run('n7 |x−a| op |x−b|', { gen: V('n7', 2, 0), test: (e, k) => {
  const s = e.q.match(/inéquation \$([^$]+)\$/)[1];
  const [l, r] = s.split(/\\leqslant|\\geqslant|<|>/);
  const op = ineq(s);
  sameOnGrid(e, k, (x) => op(absArg(l)(x), absArg(r)(x)), grid.map((x) => x + 0.5));
} });
run('n7 |kx−a| op r', { gen: V('n7', 2, 1), test: (e, k) => {
  const s = e.q.match(/inéquation \$([^$]+)\$/)[1];
  const f = absArg(s),
    op = ineq(s),
    r = +s.split(/\\leqslant|<|>/)[1];
  const ivs = CU.IV.parse(e._ans[0]).ivs;
  sameOnGrid(e, k, (x) => op(f(x), r), [ivs[0].lo, ivs[0].hi]);
} });
run('n7 somme de distances', { gen: V('n7', 2, 2), test: (e, k) => {
  const s = e.q.match(/tels que \$([^$]+)\$/)[1];
  const [l, r] = s.split('=');
  const [A, Bf] = l.split('|+|').map((t) => absArg('|' + t.replace(/\|/g, '') + '|'));
  sameOnGrid(e, k, (x) => Math.abs(A(x) + Bf(x) - +r) < 1e-9, grid.map((x) => x + 0.5));
} });
for (const [i, lab] of [[2, 'inter/union'], [3, 'complémentaire']])
  run('n7 ' + lab, { gen: V('n7', 1 + (i === 3 ? 1 : 0), i), test: (e, k) => {
    const raw = (t) => t.replace(/\\mathopen\{(.)\}/g, '$1').replace(/\\mathclose\{(.)\}/g, '$1').replace(/\\,;\\,/g, ';').replace(/\\infty/g, '∞').replace(/\\cup/g, '∪').replace(/\\left\\\{|\\right\\\}/g, (m) => (m.includes('left') ? '{' : '}'));
    const I = CU.IV.parse(raw(e.q.match(/I=([^$]+)\$/)[1])).ivs,
      J = CU.IV.parse(raw(e.q.match(/J=([^$]+)\$/)[1])).ivs;
    const op = /complémentaire/.test(e.q) ? (x) => !inSet(I, x) && !inSet(J, x) : /cap/.test(e.q.split('Écris')[1]) ? (x) => inSet(I, x) && inSet(J, x) : (x) => inSet(I, x) || inSet(J, x);
    sameOnGrid(e, k, op, grid.map(Math.round));
  } });
/* ---------- N8 ---------- */
run('n8 arrondi', { gen: V('n8', 0, 0), test: (e, k) => {
  const x = e.q.match(/de \$([\d{},]+)\$/)[1].replace('{,}', '.');
  const rank = ['à l’unité', 'au dixième', 'au centième', 'au millième'].findIndex((r) => e.q.includes(r));
  const [ip, fp] = x.split('.');
  const digits = BigInt(ip + fp.slice(0, rank)),
    next = +fp[rank];
  const r = Number(digits + (next >= 5 ? 1n : 0n)) / 10 ** rank;
  ok(close(expected(e)[0], r), k, x + ' ' + rank + ' → ' + r);
  if (next >= 5) ok(!accepts(e, [Number(digits) / 10 ** rank]), k, 'accepte la troncature');
} });
run('n8 encadrement fraction', { gen: V('n8', 0, 1), test: (e, k) => {
  const [a, b] = e.q.match(/\\dfrac\{(\d+)\}\{(\d+)\}/).slice(1).map(Number);
  const [m, M] = expected(e);
  ok(m < a / b && a / b < M && close(M - m, /centième/.test(e.q) ? 0.01 : 0.1), k, a + '/' + b);
} });
run('n8 encadrement √ entier', { gen: V('n8', 0, 2), test: (e, k) => {
  const N = nums(e.q)[0];
  const [m, M] = expected(e);
  ok(m * m < N && N < M * M && M === m + 1, k, N);
} });
run('n8 encadrement √ dixième', { gen: V('n8', 1, 0), test: (e, k) => {
  const N = nums(e.q)[0];
  const [m, M] = expected(e);
  ok(m * m < N && N < M * M && close(M - m, 0.1), k, N);
} });
run('n8 opérations sur encadrements', { gen: V('n8', 1, 1), test: (e, k) => {
  const [a, b, c, d] = nums(e.q.split('Donne')[0]);
  const ex = e.q.match(/encadrement possible de \$([^$]+)\$/)[1];
  const f = (x, y) => CU.evalAst(CU.parse(ex.replace(/x/g, '(' + x + ')').replace(/y/g, '(' + y + ')')), 0);
  const vs = [f(a, c), f(a, d), f(b, c), f(b, d)];
  const [m, M] = expected(e);
  ok(close(m, Math.min(...vs)) && close(M, Math.max(...vs)), k, ex + ' ' + [a, b, c, d]);
} });
run('n8 inverse', { gen: V('n8', 1, 2), test: (e, k) => {
  const [a, b] = nums(e.q);
  const [m, M] = expected(e);
  ok(close(m, 1 / b) && close(M, 1 / a), k, a + ' ' + b);
} });
run('n8 ensemble d’arrondi', { gen: V('n8', 2, 0), test: (e, k) => {
  const d = +e.q.match(/vaut \$([\d{},]+)\$/)[1].replace('{,}', '.');
  const rank = /centième/.test(e.q) ? 2 : 1;
  const ivs = CU.IV.parse(e._ans[0]).ivs;
  for (let j = -200; j <= 200; j++) {
    const x = d + j / 10 ** (rank + 2) / 2;
    if (x <= 0) continue;
    const rr = Math.round((x + 1e-12) * 10 ** rank) / 10 ** rank;
    ok(inSet(ivs, +x.toFixed(10)) === close(rr, d), k, 'x=' + x + ' arrondi ' + rr + ' ; ' + e._ans[0]);
  }
} });
run('n8 carré', { gen: V('n8', 2, 1), test: (e, k) => {
  const m = e.q.match(/\$(-?\d+)\\leqslant x\\leqslant (-?\d+)\$/);
  const lo = +m[1],
    hi = +m[2];
  let mn = lo <= 0 && hi >= 0 ? 0 : Infinity,
    mx = -Infinity;
  for (let i = 0; i <= 1000; i++) {
    const x = lo + ((hi - lo) * i) / 1000;
    mn = Math.min(mn, x * x);
    mx = Math.max(mx, x * x);
  }
  const [a, b] = expected(e);
  ok(close(a, mn, 1e-6) && close(b, mx), k, m[0]);
} });
run('n8 dichotomie', { gen: V('n8', 2, 2), test: (e, k) => {
  const N = nums(e.q.match(/contient \$\\sqrt\{(\d+)\}/)[0])[0];
  const [a, b] = expected(e);
  ok(a * a < N && N < b * b && close(b - a, 0.125) && Number.isInteger(a * 8), k, N + ' ' + a + ' ' + b);
} });
/* ---------- N11 ---------- */
run('n11 conversions d’aires', { gen: V('n11', 0, 1), test: (e, k) => {
  const m = e.q.match(/\$([\d{},]+)\\ \\mathrm\{([a-z^0-9]+)\}\$ en \$\\mathrm\{([a-z^0-9]+)\}\$/);
  const x = +m[1].replace('{,}', '.');
  const U = { 'mm^2': 1e-6, 'cm^2': 1e-4, 'dm^2': 1e-2, 'm^2': 1, ha: 1e4, 'km^2': 1e6 };
  ok(close(expected(e)[0], (x * U[m[2]]) / U[m[3]]), k, m[0]);
  ok(!accepts(e, [expected(e)[0] * 10]), k, 'accepte ×10');
} });
run('n11 conversions de volumes', { gen: V('n11', 0, 2), test: (e, k) => {
  const m = e.q.match(/\$([\d{},]+)\\ \\mathrm\{([A-Za-z^0-9]+)\}\$ en \$\\mathrm\{([A-Za-z^0-9]+)\}\$/);
  const x = +m[1].replace('{,}', '.');
  const U = { 'cm^3': 1e-3, mL: 1e-3, L: 1, 'dm^3': 1, 'm^3': 1e3 };
  ok(close(expected(e)[0], (x * U[m[2]]) / U[m[3]]), k, m[0]);
} });
run('n11 vitesse moyenne', { gen: V('n11', 2, 1), test: (e, k) => {
  const [v1, v2] = nums(e.q);
  const dist = 360;
  ok(close(expected(e)[0], (2 * dist) / (dist / v1 + dist / v2)), k, v1 + ' ' + v2);
} });

/* ---------- toutes les Lois : la bonne réponse est acceptée, une mauvaise refusée ---------- */
for (const id of ['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n11'])
  for (let t = 0; t < 3; t++)
    for (const [i, v] of CU.SKILLS[id].gen[t].variants.entries())
      for (let r = 0; r < REP; r++) {
        const e = v(),
          key = `${id}/${t + 1}#${i}`;
        if (e.type === 'fields') {
          const good = e._ans || (e.fields.length === 1 && e._vals.length !== 1 ? [e._vals.length ? e._vals.map((x) => String(x)).join(' ; ') : 'aucune'] : e._vals.map(String));
          ok(e.check(good).ok, key, 'refuse sa propre réponse ' + good + ' :: ' + e.q.slice(0, 100));
          ok(!e.check(good.map(() => '12345')).ok, key, 'accepte 12345');
        } else if (e.type === 'choice') ok(e.correct >= 0 && new Set(e.choices).size === e.choices.length, key, 'choix');
        else if (e.type === 'order') ok(e.n === e.items.filter((x) => typeof x.k === 'number').length && e.items.length > e.n, key, 'ordre');
      }

console.log(fails ? `${fails} ÉCHEC(S) sur ${n}` : `${n}/${n} vérifications réussies`);
process.exit(fails ? 1 : 0);
