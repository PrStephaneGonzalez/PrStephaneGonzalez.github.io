/* CODEX UMBRA — moteur : hasard, nombres, parseur algébrique, correcteurs, sauvegarde, sons.
   Scripts classiques (pas de modules) : tout est rangé dans l'objet global CU. */
'use strict';
const CU = (window.CU = window.CU || {});

/* ---------- hasard ---------- */
const R = (CU.R = {
  int: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
  nz: (a, b) => {
    let v;
    do v = R.int(a, b);
    while (v === 0);
    return v;
  },
  pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  shuffle: (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },
  sign: () => (Math.random() < 0.5 ? -1 : 1),
});
const T = (CU.T = String.raw);

/* ---------- arithmétique ---------- */
const gcd = (CU.gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
});
const near = (CU.near = (a, b, eps = 1e-7) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(a), Math.abs(b)));
// x ≈ n/d avec d ≤ 2000 ?
function toFrac(x) {
  if (!isFinite(x)) return null;
  for (let d = 1; d <= 2000; d++) {
    const n = Math.round(x * d);
    if (Math.abs(n / d - x) < 1e-9) return [n, d];
  }
  return null;
}
CU.toFrac = toFrac;
// nombre → TeX (entier, fraction, ou décimal)
function num(x) {
  if (Math.abs(x) < 1e-12) return '0';
  const f = toFrac(x);
  if (!f) return String(+x.toFixed(4)).replace('.', '{,}');
  const [n, d] = f;
  if (d === 1) return String(n);
  return (n < 0 ? '-' : '') + '\\frac{' + Math.abs(n) + '}{' + d + '}';
}
CU.num = num;
// k√m simplifié
function sqrtSimp(n) {
  let k = 1,
    m = n;
  for (let p = 2; p * p <= m; p++)
    while (m % (p * p) === 0) {
      m /= p * p;
      k *= p;
    }
  return [k, m];
}
CU.sqrtSimp = sqrtSimp;
// TeX de (p + s·k√m)/q avec réduction ; s = ±1
function surdTex(p, k, m, q, s) {
  if (m === 1) return num((p + s * k) / q);
  let g = gcd(gcd(p, k), q);
  if (q < 0) g = -g;
  p /= g;
  k /= g;
  q /= g;
  const rad = (k === 1 ? '' : k) + '\\sqrt{' + m + '}';
  let top;
  if (p === 0) top = (s < 0 ? '-' : '') + rad;
  else top = p + (s < 0 ? ' - ' : ' + ') + rad;
  if (q === 1) return top;
  if (p === 0) return (s < 0 ? '-' : '') + '\\frac{' + rad + '}{' + q + '}';
  return '\\frac{' + top + '}{' + q + '}';
}
// racines de ax²+bx+c (entiers) : {delta, vals:[...], tex:[...]}
function quadRoots(a, b, c) {
  const D = b * b - 4 * a * c;
  if (D < 0) return { delta: D, vals: [], tex: [] };
  if (D === 0) return { delta: D, vals: [-b / (2 * a)], tex: [num(-b / (2 * a))] };
  const [k, m] = sqrtSimp(D);
  const r1 = (-b - Math.sqrt(D)) / (2 * a),
    r2 = (-b + Math.sqrt(D)) / (2 * a);
  const t1 = surdTex(-b, k, m, 2 * a, -1),
    t2 = surdTex(-b, k, m, 2 * a, +1);
  return r1 < r2 ? { delta: D, vals: [r1, r2], tex: [t1, t2] } : { delta: D, vals: [r2, r1], tex: [t2, t1] };
}
CU.quadRoots = quadRoots;

/* ---------- polynômes (tableaux de coefficients, indice = degré) ---------- */
const P = (CU.P = {
  trim(p) {
    p = p.slice();
    while (p.length > 1 && Math.abs(p[p.length - 1]) < 1e-12) p.pop();
    return p;
  },
  add(a, b) {
    const n = Math.max(a.length, b.length),
      r = [];
    for (let i = 0; i < n; i++) r.push((a[i] || 0) + (b[i] || 0));
    return P.trim(r);
  },
  scale: (a, k) => P.trim(a.map((c) => c * k)),
  sub: (a, b) => P.add(a, P.scale(b, -1)),
  mul(a, b) {
    const r = new Array(a.length + b.length - 1).fill(0);
    a.forEach((x, i) => b.forEach((y, j) => (r[i + j] += x * y)));
    return P.trim(r);
  },
  pow(a, n) {
    let r = [1];
    for (let i = 0; i < n; i++) r = P.mul(r, a);
    return r;
  },
  deg: (a) => P.trim(a).length - 1,
  eq(a, b) {
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) if (!near(a[i] || 0, b[i] || 0, 1e-9)) return false;
    return true;
  },
  at: (a, x) => a.reduce((s, c, i) => s + c * Math.pow(x, i), 0),
  // TeX propre : [c0,c1,c2] → 2x^2 - 3x + 1
  tex(p, v = 'x') {
    p = P.trim(p);
    let out = '';
    for (let i = p.length - 1; i >= 0; i--) {
      const c = p[i];
      if (Math.abs(c) < 1e-12) continue;
      const neg = c < 0,
        a = Math.abs(c);
      let coef = i === 0 ? num(a) : near(a, 1) ? '' : num(a);
      const mon = i === 0 ? '' : i === 1 ? v : v + '^{' + i + '}';
      if (out === '') out = (neg ? '-' : '') + coef + mon;
      else out += (neg ? ' - ' : ' + ') + coef + mon;
    }
    return out || '0';
  },
});
// (ax+b) en TeX
CU.lin = (a, b, v = 'x') => P.tex([b, a], v);
// TeX d'un facteur entre parenthèses
CU.par = (s) => '\\left(' + s + '\\right)';

/* ---------- parseur d'expressions ---------- */
function normalize(s) {
  return String(s || '')
    .replace(/[−–—]/g, '-')
    .replace(/[×·∙⋅]/g, '*')
    .replace(/÷/g, '/')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/⁴/g, '^4')
    .replace(/X/g, 'x')
    .replace(/racine|sqrt|rac/gi, '√')
    .replace(/,/g, '.')
    .replace(/\s+/g, '');
}
function tokenize(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      const t = s.slice(i, j);
      if ((t.match(/\./g) || []).length > 1 || t === '.') throw new Error('Nombre mal écrit : ' + t);
      out.push({ t: 'num', v: parseFloat(t) });
      i = j;
    } else if (/[a-zA-Z]/.test(c)) {
      out.push({ t: 'var', v: c });
      i++;
    } else if ('+-*/^()√'.includes(c)) {
      out.push({ t: c });
      i++;
    } else throw new Error('Caractère inconnu : « ' + c + ' »');
  }
  return out;
}
function parse(src) {
  const toks = tokenize(normalize(src));
  if (!toks.length) throw new Error('Réponse vide');
  let k = 0;
  const peek = () => toks[k],
    eat = (t) => {
      if (!toks[k] || toks[k].t !== t) throw new Error(t === ')' ? 'Parenthèse non fermée' : 'Attendu : ' + t);
      return toks[k++];
    };
  const startsAtom = (tk) => tk && (tk.t === 'num' || tk.t === 'var' || tk.t === '(' || tk.t === '√');
  function expr() {
    let n = unary();
    for (;;) {
      const tk = peek();
      if (tk && (tk.t === '+' || tk.t === '-')) {
        k++;
        n = { t: tk.t === '+' ? 'add' : 'sub', a: n, b: term() };
      } else return n;
    }
  }
  function term() {
    return termFrom(power());
  }
  function termFrom(n) {
    for (;;) {
      const tk = peek();
      if (tk && (tk.t === '*' || tk.t === '/')) {
        k++;
        n = { t: tk.t === '*' ? 'mul' : 'div', a: n, b: signed() };
      } else if (startsAtom(tk)) n = { t: 'mul', a: n, b: power(), imp: true };
      else return n;
    }
  }
  // premier terme d'une somme : peut commencer par un signe
  function unary() {
    const tk = peek();
    if (tk && tk.t === '-') {
      k++;
      return { t: 'neg', a: unaryTerm() };
    }
    if (tk && tk.t === '+') {
      k++;
      return unaryTerm();
    }
    return term();
  }
  function unaryTerm() {
    return termFrom(power());
  }
  function signed() {
    const tk = peek();
    if (tk && tk.t === '-') {
      k++;
      return { t: 'neg', a: signed() };
    }
    return power();
  }
  function power() {
    const base = atom();
    if (peek() && peek().t === '^') {
      k++;
      return { t: 'pow', a: base, b: signed() };
    }
    return base;
  }
  function atom() {
    const tk = peek();
    if (!tk) throw new Error('Expression incomplète');
    k++;
    if (tk.t === 'num') return { t: 'num', v: tk.v };
    if (tk.t === 'var') return { t: 'var', v: tk.v };
    if (tk.t === '(') {
      const e = expr();
      eat(')');
      return { t: 'par', a: e };
    }
    if (tk.t === '√') return { t: 'sqrt', a: atom() };
    throw new Error('Symbole inattendu : ' + tk.t);
  }
  const e = expr();
  if (k < toks.length) throw new Error(toks[k].t === ')' ? 'Parenthèse fermante en trop' : 'Symbole inattendu : ' + toks[k].t);
  return e;
}
CU.parse = parse;
const strip = (n) => {
  while (n && n.t === 'par') n = n.a;
  return n;
};
// valeur numérique (x = valeur donnée)
function evalAst(n, x) {
  switch (n.t) {
    case 'num':
      return n.v;
    case 'var':
      if (n.v === 'x' || n.v === 'n' || n.v === 'm' || n.v === 't') return x;
      throw new Error('Lettre inconnue : ' + n.v);
    case 'par':
      return evalAst(n.a, x);
    case 'neg':
      return -evalAst(n.a, x);
    case 'add':
      return evalAst(n.a, x) + evalAst(n.b, x);
    case 'sub':
      return evalAst(n.a, x) - evalAst(n.b, x);
    case 'mul':
      return evalAst(n.a, x) * evalAst(n.b, x);
    case 'div':
      return evalAst(n.a, x) / evalAst(n.b, x);
    case 'pow':
      return Math.pow(evalAst(n.a, x), evalAst(n.b, x));
    case 'sqrt':
      return Math.sqrt(evalAst(n.a, x));
  }
}
CU.evalAst = evalAst;
const hasVar = (n) => (n.t === 'var' ? true : n.t === 'num' ? false : (n.a && hasVar(n.a)) || (n.b && hasVar(n.b)));
// polynôme en la variable (null si ce n'en est pas un)
function polyOf(n) {
  switch (n.t) {
    case 'num':
      return [n.v];
    case 'var':
      return [0, 1];
    case 'par':
      return polyOf(n.a);
    case 'neg': {
      const a = polyOf(n.a);
      return a && P.scale(a, -1);
    }
    case 'add':
    case 'sub': {
      const a = polyOf(n.a),
        b = polyOf(n.b);
      return a && b && (n.t === 'add' ? P.add(a, b) : P.sub(a, b));
    }
    case 'mul': {
      const a = polyOf(n.a),
        b = polyOf(n.b);
      return a && b && P.mul(a, b);
    }
    case 'div': {
      const a = polyOf(n.a),
        b = polyOf(n.b);
      if (!a || !b || P.deg(b) !== 0 || b[0] === 0) return null;
      return P.scale(a, 1 / b[0]);
    }
    case 'pow': {
      const a = polyOf(n.a),
        b = polyOf(n.b);
      if (!a || !b || P.deg(b) !== 0) return null;
      const e = b[0];
      if (P.deg(a) === 0) return [Math.pow(a[0], e)];
      if (!Number.isInteger(e) || e < 0 || e > 8) return null;
      return P.pow(a, e);
    }
    case 'sqrt': {
      const a = polyOf(n.a);
      if (!a || P.deg(a) !== 0 || a[0] < 0) return null;
      return [Math.sqrt(a[0])];
    }
  }
  return null;
}
CU.polyOf = polyOf;

/* ---------- AST → TeX (aperçu de ce que l'on tape) ---------- */
function prec(n) {
  n = n.t === 'par' ? n : n;
  return { add: 1, sub: 1, neg: 2, mul: 3, div: 3, pow: 5, num: 9, var: 9, par: 9, sqrt: 9 }[n.t];
}
function tex(n) {
  switch (n.t) {
    case 'num':
      return String(n.v).replace('.', '{,}');
    case 'var':
      return n.v;
    case 'par':
      return '\\left(' + tex(n.a) + '\\right)';
    case 'neg':
      return '-' + wrap(n.a, 3);
    case 'add':
      return tex(n.a) + ' + ' + wrap(n.b, 2);
    case 'sub':
      return tex(n.a) + ' - ' + wrap(n.b, 2);
    case 'mul': {
      const l = wrap(n.a, 3),
        r = wrap(n.b, 3);
      const needDot = !n.imp || (strip(n.b).t === 'num' && !(n.b.t === 'par'));
      return l + (needDot ? ' \\times ' : '\\,') + r;
    }
    case 'div':
      return '\\frac{' + tex(strip(n.a)) + '}{' + tex(strip(n.b)) + '}';
    case 'pow':
      return wrap(n.a, 6) + '^{' + tex(strip(n.b)) + '}';
    case 'sqrt':
      return '\\sqrt{' + tex(strip(n.a)) + '}';
  }
}
function wrap(n, p) {
  return prec(n) < p ? '\\left(' + tex(n) + '\\right)' : tex(n);
}
CU.astTex = tex;

/* ---------- formes : développée réduite, factorisée, canonique ---------- */
function sumTerms(n, sign = 1, out = []) {
  n = strip(n);
  if (n.t === 'add') {
    sumTerms(n.a, sign, out);
    sumTerms(n.b, sign, out);
  } else if (n.t === 'sub') {
    sumTerms(n.a, sign, out);
    sumTerms(n.b, -sign, out);
  } else if (n.t === 'neg' && (strip(n.a).t === 'add' || strip(n.a).t === 'sub')) sumTerms(n.a, -sign, out);
  else out.push({ s: sign, n });
  return out;
}
function prodFactors(n, out = []) {
  n = strip(n);
  if (n.t === 'mul') {
    prodFactors(n.a, out);
    prodFactors(n.b, out);
  } else if (n.t === 'neg') {
    out.push({ t: 'num', v: -1 });
    prodFactors(n.a, out);
  } else out.push(n);
  return out;
}
// monôme : produit de nombres, de x et de puissances de x (ou quotient par un nombre)
function isMonomial(n) {
  n = strip(n);
  if (n.t === 'num' || n.t === 'var') return true;
  if (n.t === 'neg') return isMonomial(n.a);
  if (n.t === 'sqrt') return !hasVar(n.a);
  if (n.t === 'pow') return (strip(n.a).t === 'var' || !hasVar(n.a)) && !hasVar(n.b);
  if (n.t === 'mul') return isMonomial(n.a) && isMonomial(n.b);
  if (n.t === 'div') return isMonomial(n.a) && !hasVar(n.b);
  return false;
}
function expandedInfo(ast) {
  const terms = sumTerms(ast);
  if (!terms.every((t) => isMonomial(t.n))) return { ok: false, why: 'Il reste des parenthèses ou des puissances à développer.' };
  const seen = {};
  for (const t of terms) {
    const p = polyOf(t.n);
    if (!p) return { ok: false, why: 'Expression non polynomiale.' };
    const d = P.deg(p);
    if (Math.abs(p[d]) < 1e-12 && terms.length > 1) return { ok: false, why: 'Un terme vaut zéro : réduis.' };
    if (seen[d]) return { ok: false, why: 'Ce n’est pas réduit : regroupe les termes de même degré.' };
    seen[d] = 1;
  }
  return { ok: true };
}
function factoredInfo(ast) {
  const f = prodFactors(ast).filter((x) => !(strip(x).t === 'num'));
  const all = prodFactors(ast);
  const nonConst = all.filter((x) => hasVar(x));
  const sq = all.length === 1 && strip(all[0]).t === 'pow' && hasVar(all[0]);
  if (!sq && (all.length < 2 || nonConst.length < 1)) return { ok: false, why: 'Ce n’est pas un produit : il faut écrire l’expression comme un produit de facteurs.' };
  for (const x of nonConst) {
    let base = strip(x),
      p;
    if (base.t === 'pow') base = strip(base.a);
    p = polyOf(base);
    if (!p) return { ok: false, why: 'Facteur non polynomial.' };
    if (P.deg(p) > 1) return { ok: false, why: 'Un facteur peut encore se factoriser (il est de degré 2).' };
    if (p.every((c) => Number.isInteger(c)) && P.deg(p) === 1) {
      const g = gcd(p[0], p[1]);
      if (g > 1) return { ok: false, why: 'Un facteur contient encore un nombre en facteur commun (' + g + ').' };
    }
  }
  return { ok: true, n: f.length };
}
function canonicalInfo(ast) {
  const terms = sumTerms(ast);
  const withX = terms.filter((t) => hasVar(t.n));
  if (withX.length !== 1) return { ok: false, why: 'La forme canonique s’écrit a(x − α)² + β : un seul terme contient x.' };
  const fs = prodFactors(withX[0].n);
  const sq = fs.filter((x) => hasVar(x));
  if (sq.length !== 1 || strip(sq[0]).t !== 'pow') return { ok: false, why: 'Le terme en x doit être un carré : a(x − α)².' };
  const pw = strip(sq[0]),
    e = polyOf(pw.b),
    base = polyOf(pw.a);
  if (!e || P.deg(e) !== 0 || e[0] !== 2 || !base || P.deg(base) !== 1)
    return { ok: false, why: 'Le terme en x doit être un carré : a(x − α)².' };
  if (!near(base[1], 1) && !near(base[1], -1)) return { ok: false, why: 'Dans la forme canonique, le carré est (x − α)² : sors le coefficient devant.' };
  return { ok: true };
}
CU.forms = { expandedInfo, factoredInfo, canonicalInfo };

/* ---------- correcteurs (renvoient {ok, msg}) ---------- */
const V = (CU.V = {
  // expression équivalente à la cible (polynôme), avec contrainte de forme facultative
  expr(src, target, form) {
    let ast, p;
    try {
      ast = parse(src);
    } catch (e) {
      return { ok: false, msg: e.message, syntax: true };
    }
    p = polyOf(ast);
    if (!p) return { ok: false, msg: 'Je ne reconnais pas un polynôme en x.' };
    if (!P.eq(p, target)) {
      const x0 = [1, 2, -1, 3].find((x) => !near(P.at(p, x), P.at(target, x))) ?? 1;
      return {
        ok: false,
        msg: T`Ce n’est pas égal à l’expression de départ. Test en $x = ${x0}$ : ta réponse vaut $${num(P.at(p, x0))}$, il faudrait $${num(P.at(target, x0))}$.`,
      };
    }
    if (form) {
      const info = CU.forms[form + 'Info'](ast);
      if (!info.ok) return { ok: false, msg: 'C’est bien égal, mais : ' + info.why, close: true };
    }
    return { ok: true };
  },
  // un nombre exact
  num(src, val) {
    let ast;
    try {
      ast = parse(src);
    } catch (e) {
      return { ok: false, msg: e.message, syntax: true };
    }
    if (hasVar(ast)) return { ok: false, msg: 'On attend un nombre, sans x.' };
    const v = evalAst(ast, 0);
    if (!isFinite(v)) return { ok: false, msg: 'Ce nombre n’existe pas (division par zéro ?).' };
    if (near(v, val, 1e-9)) return { ok: true };
    if (near(v, val, 1.5e-2)) return { ok: false, msg: 'Valeur approchée : on veut la valeur exacte (fraction, racine…).', close: true };
    return { ok: false, msg: 'Ce n’est pas la bonne valeur.' };
  },
  // ensemble de nombres séparés par ;
  set(src, vals) {
    const s = String(src || '').trim();
    if (/^(aucune|aucun|∅|vide|pas de solution|\{\})$/i.test(s)) return vals.length ? { ok: false, msg: 'Il y a des solutions.' } : { ok: true };
    if (!vals.length) return { ok: false, msg: 'Regarde bien : y a-t-il vraiment des solutions ?' };
    const parts = s
      .replace(/^[{S=\s]+|[}\s]+$/g, '')
      .split(/;|\bet\b|\bou\b/)
      .map((x) => x.trim())
      .filter(Boolean);
    const got = [];
    for (const p of parts) {
      try {
        const a = parse(p);
        if (hasVar(a)) return { ok: false, msg: 'Écris seulement les valeurs, séparées par « ; ».' };
        got.push(evalAst(a, 0));
      } catch (e) {
        return { ok: false, msg: e.message + ' (sépare les solutions par « ; »)', syntax: true };
      }
    }
    const uniq = [];
    got.forEach((g) => uniq.some((u) => near(u, g)) || uniq.push(g));
    const missing = vals.filter((v) => !uniq.some((g) => near(g, v, 1e-9)));
    const extra = uniq.filter((g) => !vals.some((v) => near(g, v, 1e-9)));
    if (!missing.length && !extra.length) return { ok: true };
    if (!extra.length) return { ok: false, msg: 'Il manque ' + (missing.length > 1 ? 'des solutions.' : 'une solution.'), close: true };
    if (!missing.length) return { ok: false, msg: 'Tu as donné une valeur qui n’est pas solution.' };
    return { ok: false, msg: 'Ce ne sont pas les bonnes solutions.' };
  },
});
// aperçu TeX d'un champ
CU.preview = function (src, kind) {
  if (!String(src || '').trim()) return '';
  if (kind === 'set') {
    if (/^(aucune|aucun|∅)/i.test(src.trim())) return '\\emptyset';
    return (
      '\\left\\{' +
      src
        .split(/;/)
        .map((p) => {
          try {
            return tex(parse(p));
          } catch {
            return '?';
          }
        })
        .join(' \\,;\\, ') +
      '\\right\\}'
    );
  }
  try {
    return tex(parse(src));
  } catch {
    return null;
  }
};

/* ---------- rendu TeX dans du HTML ($...$) ---------- */
CU.render = function (html) {
  if (!html) return '';
  return String(html).replace(/\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g, (m, d, i) => {
    const src = d || i;
    if (!window.katex) return '<span class="tex-fallback">' + src + '</span>';
    try {
      return katex.renderToString(src, { displayMode: !!d, throwOnError: false, strict: false });
    } catch {
      return src;
    }
  });
};

/* ---------- sauvegarde ---------- */
const SB_URL = 'https://hwyckgbmguxhufnlenif.supabase.co',
  SB_KEY = 'sb_publishable_ockdQA7mMQP4fSz02r3nHQ_BOzgZpxM';
CU.save = {
  // « Stéphane » et « Stephane » désignent le même compte : on retire les accents.
  // legacy = ancienne empreinte (accents conservés), relue à la connexion pour ne rien perdre.
  async keyOf(name, pin, legacy = false) {
    let norm = String(name).normalize('NFKC').trim().toLocaleLowerCase('fr').replace(/\s+/g, ' ');
    if (!legacy) norm = norm.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('codex-umbra-v1:' + norm + ':' + pin));
    return [...new Uint8Array(h)].map((x) => x.toString(16).padStart(2, '0')).join('');
  },
  local(key) {
    try {
      return JSON.parse(localStorage.getItem('codex-umbra-v1:' + key) || 'null');
    } catch {
      return null;
    }
  },
  storeLocal(key, st) {
    try {
      localStorage.setItem('codex-umbra-v1:' + key, JSON.stringify(st));
      localStorage.setItem('codex-umbra-last', JSON.stringify({ name: st.name, key }));
    } catch {}
  },
  async rpc(fn, body) {
    const c = new AbortController(),
      t = setTimeout(() => c.abort(), 8000);
    try {
      const r = await fetch(SB_URL + '/rest/v1/rpc/' + fn, {
        method: 'POST',
        signal: c.signal,
        cache: 'no-store',
        headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } finally {
      clearTimeout(t);
    }
  },
  async cloudGet(key) {
    const r = await this.rpc('codex_get', { k: key });
    return r && r.payload ? r.payload : null;
  },
  async cloudPut(key, st) {
    await this.rpc('codex_put', { k: key, p: st });
  },
  // envoi qui survit à la fermeture de la page
  beacon(key, st) {
    try {
      fetch(SB_URL + '/rest/v1/rpc/codex_put', {
        method: 'POST',
        keepalive: true,
        headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ k: key, p: st }),
      }).catch(() => {});
    } catch {}
  },
  // fusion : on garde toujours le meilleur des deux
  merge(a, b) {
    if (!a) return b;
    if (!b) return a;
    const o = JSON.parse(JSON.stringify(a));
    o.xp = Math.max(a.xp || 0, b.xp || 0);
    o.skills = o.skills || {};
    for (const [id, s] of Object.entries(b.skills || {})) {
      const m = o.skills[id];
      if (!m) o.skills[id] = s;
      else {
        const hi = (s.tier || 0) > (m.tier || 0) || ((s.tier || 0) === (m.tier || 0) && (s.prog || 0) > (m.prog || 0)) ? s : m;
        o.skills[id] = { ...m, ...s, tier: hi.tier || 0, prog: hi.prog || 0, last: Math.max(m.last || 0, s.last || 0), seen: m.seen || s.seen, done: Math.max(m.done || 0, s.done || 0) };
      }
    }
    o.bosses = { ...(b.bosses || {}), ...(a.bosses || {}) };
    o.frags = [...new Set([...(a.frags || []), ...(b.frags || [])])];
    o.stats = { solved: Math.max(a.stats?.solved || 0, b.stats?.solved || 0), bestCombo: Math.max(a.stats?.bestCombo || 0, b.stats?.bestCombo || 0) };
    o.prologue = a.prologue || b.prologue;
    o.arena = { best: Math.max(a.arena?.best || 0, b.arena?.best || 0), runs: Math.max(a.arena?.runs || 0, b.arena?.runs || 0) };
    o.updated = Math.max(a.updated || 0, b.updated || 0);
    return o;
  },
};

/* ---------- sons (synthétisés, aucun fichier) ---------- */
// appareil modeste (Android, peu de cœurs ou de mémoire) : moteur audio allégé
CU.LITE = /Android/i.test(navigator.userAgent) || (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 3;
CU.sfx = (function () {
  let ctx = null,
    master = null,
    drone = null;
  const on = () => CU.settings && CU.settings.sound !== false;
  function ac() {
    if (!ctx || ctx.state === 'closed') {
      const A = window.AudioContext || window.webkitAudioContext;
      if (!A) return null;
      try {
        // tampon plus large sur appareil modeste : évite les coupures
        ctx = CU.LITE ? new A({ latencyHint: 'playback' }) : new A();
      } catch {
        ctx = new A();
      }
      master = ctx.createGain();
      master.gain.value = 0.55;
      const comp = ctx.createDynamicsCompressor();
      master.connect(comp);
      comp.connect(ctx.destination);
    }
    // 'suspended' mais aussi 'interrupted' (iOS : appel, verrouillage, changement d'appli)
    if (ctx.state !== 'running') {
      try {
        const p = ctx.resume();
        if (p && p.catch) p.catch(() => {});
      } catch {}
    }
    return ctx;
  }
  function tone(freq, t0, dur, type = 'sine', vol = 0.25, attack = 0.005) {
    const c = ac();
    if (!c) return;
    const o = c.createOscillator(),
      g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, c.currentTime + t0);
    g.gain.exponentialRampToValueAtTime(vol, c.currentTime + t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t0 + dur);
    o.connect(g);
    g.connect(master);
    o.start(c.currentTime + t0);
    o.stop(c.currentTime + t0 + dur + 0.05);
  }
  function noise(t0, dur, vol = 0.3, freq = 400) {
    const c = ac();
    if (!c) return;
    const len = Math.floor(c.sampleRate * dur),
      buf = c.createBuffer(1, len, c.sampleRate),
      d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const s = c.createBufferSource(),
      f = c.createBiquadFilter(),
      g = c.createGain();
    f.type = 'lowpass';
    f.frequency.value = freq;
    g.gain.value = vol;
    s.buffer = buf;
    s.connect(f);
    f.connect(g);
    g.connect(master);
    s.start(c.currentTime + t0);
  }
  // gamme mineure harmonique : la montée suit la série
  const scale = [0, 2, 3, 5, 7, 8, 11, 12, 14, 15, 17, 19];
  const hz = (semi) => 293.66 * Math.pow(2, semi / 12);
  return {
    unlock: () => ac(),
    status: () => (ctx ? ctx.state : 'none'),
    // dernier recours : repartir d'un contexte audio neuf (à appeler pendant un geste)
    reset() {
      try {
        ctx && ctx.close && ctx.close().catch(() => {});
      } catch {}
      ctx = null;
      master = null;
      return ac();
    },
    right(combo = 0) {
      if (!on()) return;
      const s = scale[Math.min(combo, scale.length - 1)];
      tone(hz(s), 0, 0.6, 'triangle', 0.22);
      tone(hz(s + 7), 0.06, 0.7, 'sine', 0.14);
      tone(hz(s + 12), 0.12, 0.9, 'sine', 0.1);
    },
    wrong() {
      if (!on()) return;
      tone(110, 0, 0.35, 'sawtooth', 0.08);
      tone(103, 0.02, 0.4, 'sine', 0.2);
      noise(0, 0.18, 0.15, 300);
    },
    click() {
      if (!on()) return;
      tone(880, 0, 0.06, 'triangle', 0.05);
    },
    place() {
      if (!on()) return;
      tone(520, 0, 0.12, 'triangle', 0.08);
    },
    tier() {
      if (!on()) return;
      [0, 3, 7, 12, 15, 19].forEach((s, i) => tone(hz(s), i * 0.09, 1.6, 'triangle', 0.16));
      tone(hz(-12), 0, 2.2, 'sine', 0.2, 0.05);
      noise(0, 0.6, 0.08, 2500);
    },
    hit() {
      if (!on()) return;
      noise(0, 0.35, 0.5, 900);
      tone(65, 0, 0.5, 'sine', 0.35);
    },
    hurt() {
      if (!on()) return;
      tone(80, 0, 0.6, 'sawtooth', 0.12);
      noise(0, 0.4, 0.3, 200);
    },
    victory() {
      if (!on()) return;
      [0, 7, 12, 15, 19, 24].forEach((s, i) => tone(hz(s), i * 0.13, 2.2, 'triangle', 0.15));
      [0, 7, 12].forEach((s) => tone(hz(s - 12), 0.8, 2.5, 'sine', 0.12, 0.2));
    },
    // le moteur musical (music.js) se branche sur le même contexte audio
    audio: () => (ac() ? { ctx, master } : null),
  };
})();
