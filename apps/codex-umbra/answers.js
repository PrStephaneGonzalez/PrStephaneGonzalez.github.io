/* Types de réponse « ensemble de réels » et « fraction irréductible ».
   - K.interval(énoncé, cible, …) : la réponse est une réunion d'intervalles, un ensemble fini, ℝ, ℝ∖{…} ou ∅.
     La cible s'écrit comme on l'écrirait en classe : ']-∞ ; 2] ∪ [5 ; +∞['.
     Deux écritures sont équivalentes si elles désignent le même ensemble : [1;3] ∪ [3;5] = [1;5],
     ℝ∖{3} = ]-∞;3[ ∪ ]3;+∞[, {3} = [3;3].
   - K.frac(énoncé, p, q, …) : la réponse est la fraction irréductible p/q (q > 0), pas une autre écriture de la même valeur.
   Les corrections expliquent l'erreur typique (crochets, ensemble complémentaire, valeurs en trop ou manquantes,
   fraction non simplifiée). Chargé après kit.js et avant les contenus c-*.js. */
'use strict';
(function () {
  const { V, K, near } = CU;
  const syn = (m) => Object.assign(new Error(m), { syntax: true });
  const mth = (m) => Object.assign(new Error(m), { math: true });
  const eq = (a, b) => a === b || (isFinite(a) && isFinite(b) && near(a, b, 1e-9));
  const lt = (a, b) => a < b && !eq(a, b);
  const gt = (a, b) => a > b && !eq(a, b);
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

  /* ---------- bornes ---------- */
  const INF_RE = /^([+-]?)(?:∞|inf|infini|infinity|oo)$/i;
  function bound(s) {
    const t = String(s).replace(/[−–—]/g, '-').trim();
    if (!t) throw syn('il manque une borne.');
    const m = INF_RE.exec(t.replace(/\s+/g, ''));
    if (m) return { v: m[1] === '-' ? -Infinity : Infinity, tex: (m[1] || '') + '\\infty' };
    if (/[a-zA-Z]/.test(t.replace(/racine|sqrt|rac/gi, ''))) throw syn('une borne est un nombre, sans lettre.');
    let ast;
    try {
      ast = CU.parse(t);
    } catch (e) {
      throw syn(e.message);
    }
    const v = CU.evalAst(ast, 0);
    if (!isFinite(v)) throw syn('cette borne n’existe pas (division par zéro ?).');
    return { v, tex: CU.astTex(ast) };
  }

  /* ---------- calcul sur les réunions d'intervalles {lo, hi, lc, hc} ---------- */
  const empty = (i) => gt(i.lo, i.hi) || (eq(i.lo, i.hi) && !(i.lc && i.hc));
  function norm(ivs) {
    const a = ivs
      .filter((i) => !empty(i))
      .map((i) => (eq(i.lo, i.hi) ? { lo: i.lo, hi: i.lo, lc: true, hc: true } : { ...i }))
      .sort((x, y) => (x.lo < y.lo ? -1 : x.lo > y.lo ? 1 : x.lc === y.lc ? 0 : x.lc ? -1 : 1));
    const out = [];
    for (const i of a) {
      const c = out[out.length - 1];
      if (c && (lt(i.lo, c.hi) || (eq(i.lo, c.hi) && (c.hc || i.lc)))) {
        if (gt(i.hi, c.hi)) {
          c.hi = i.hi;
          c.hc = i.hc;
        } else if (eq(i.hi, c.hi)) c.hc = c.hc || i.hc;
      } else out.push(i);
    }
    return out;
  }
  function complement(ivs) {
    const out = [];
    let pos = -Infinity,
      pc = false;
    for (const i of norm(ivs)) {
      out.push({ lo: pos, lc: pc, hi: i.lo, hc: !i.lc });
      pos = i.hi;
      pc = !i.hc;
    }
    out.push({ lo: pos, lc: pc, hi: Infinity, hc: false });
    return norm(out);
  }
  function intersect(A, B) {
    const out = [];
    for (const a of norm(A))
      for (const b of norm(B)) {
        const lo = gt(a.lo, b.lo) ? a : lt(a.lo, b.lo) ? b : null,
          hi = lt(a.hi, b.hi) ? a : gt(a.hi, b.hi) ? b : null;
        out.push({
          lo: lo ? lo.lo : a.lo,
          lc: lo ? lo.lc : a.lc && b.lc,
          hi: hi ? hi.hi : a.hi,
          hc: hi ? hi.hc : a.hc && b.hc,
        });
      }
    return norm(out);
  }
  const subset = (B, A) => intersect(B, complement(A)).length === 0; // B ⊆ A
  const same = (A, B) => A.length === B.length && A.every((a, i) => eq(a.lo, B[i].lo) && eq(a.hi, B[i].hi) && a.lc === B[i].lc && a.hc === B[i].hc);
  const ends = (A) => A.flatMap((i) => [i.lo, i.hi]).filter(isFinite).map((x) => Math.round(x * 1e9) / 1e9).sort((x, y) => x - y);
  const REAL = [{ lo: -Infinity, hi: Infinity, lc: false, hc: false }];
  const points = (list) => list.map((p) => ({ lo: p.v, hi: p.v, lc: true, hc: true }));

  /* ---------- lecture d'une réponse ---------- */
  const EMPTY_RE = /^(?:aucune?|∅|vide|\{\s*\}|pas de solutions?|ensemble vide)$/i;
  const R_RE = '(?:ℝ|R)';
  function pointsOf(inner) {
    if (!inner.trim()) return { v: [], tex: '' };
    const bs = inner.split(';').map(bound);
    return { v: bs, tex: bs.map((b) => b.tex).join('\\,;\\,') };
  }
  function parsePart(p) {
    if (new RegExp('^' + R_RE + '$').test(p)) return { ivs: REAL, tex: '\\mathbb{R}' };
    if (new RegExp('^' + R_RE + '\\*$').test(p)) return { ivs: intersect(REAL, complement(points([{ v: 0 }]))), tex: '\\mathbb{R}^{*}' };
    let m = new RegExp('^' + R_RE + '\\s*(?:\\\\|∖|-)\\s*\\{(.*)\\}$').exec(p);
    if (m) {
      const pts = pointsOf(m[1]);
      return { ivs: intersect(REAL, complement(points(pts.v))), tex: '\\mathbb{R}\\setminus\\{' + pts.tex + '\\}' };
    }
    m = /^\{(.*)\}$/.exec(p);
    if (m) {
      const pts = pointsOf(m[1]);
      return { ivs: norm(points(pts.v)), tex: '\\left\\{' + pts.tex + '\\right\\}' };
    }
    if (/^\(.*;.*\)$/.test(p)) throw syn('en France, un intervalle s’écrit avec des crochets : [a ; b], ]a ; b[…');
    m = /^([[\]])([^;[\]]*);([^;[\]]*)([[\]])$/.exec(p);
    if (!m) throw syn('écris un intervalle [a ; b], ]a ; b[, un ensemble {a ; b}, ℝ ou ∅ (la réunion se note ∪).');
    const lo = bound(m[2]),
      hi = bound(m[3]),
      lc = m[1] === '[',
      hc = m[4] === ']';
    if (lo.v === Infinity || hi.v === -Infinity || lo.v > hi.v) throw syn('dans un intervalle, la borne de gauche doit être plus petite que celle de droite.');
    if ((lo.v === -Infinity && lc) || (hi.v === Infinity && hc)) throw mth('Du côté de l’infini, le crochet est toujours ouvert (∞ n’est pas un nombre).');
    return { ivs: [{ lo: lo.v, hi: hi.v, lc, hc }], tex: '\\mathopen{' + m[1] + '}' + lo.tex + '\\,;\\,' + hi.tex + '\\mathclose{' + m[4] + '}' };
  }
  function parse(src) {
    const s = String(src || '').replace(/[−–—]/g, '-').trim();
    if (!s) throw syn('réponse vide.');
    if (EMPTY_RE.test(s)) return { ivs: [], tex: '\\emptyset' };
    const parts = s.split(/\s*(?:∪|\bU\b|\bou\b|\bunion\b)\s*/i).map((x) => x.trim());
    if (parts.some((x) => !x)) throw syn('il manque un ensemble à côté de « ∪ ».');
    const rs = parts.map(parsePart);
    return { ivs: norm(rs.flatMap((r) => r.ivs)), tex: rs.map((r) => r.tex).join(' \\cup ') };
  }

  /* ---------- correcteurs ---------- */
  V.interval = function (src, target) {
    let got;
    try {
      got = parse(src);
    } catch (e) {
      return e.math ? { ok: false, msg: e.message, close: true } : { ok: false, msg: e.message, syntax: true };
    }
    const tgt = typeof target === 'string' ? parse(target) : target;
    const g = got.ivs,
      t = tgt.ivs;
    if (same(g, t)) return { ok: true };
    if (!g.length) return { ok: false, msg: 'Tu donnes l’ensemble vide : y a-t-il vraiment aucune solution ?' };
    if (!t.length) return { ok: false, msg: 'Regarde bien : y a-t-il vraiment des solutions ?' };
    if (same(g, complement(t))) return { ok: false, msg: 'Tu donnes l’ensemble complémentaire de la solution : relis le sens de l’inégalité.', close: true };
    const e1 = ends(g),
      e2 = ends(t);
    if (e1.length === e2.length && e1.every((x, i) => x === e2[i]) && g.length === t.length)
      return { ok: false, msg: 'Les extrémités sont les bonnes, mais regarde les crochets : chaque extrémité est-elle incluse (crochet tourné vers l’intérieur) ou exclue ?', close: true };
    if (subset(g, t)) return { ok: false, msg: 'Il manque des solutions dans ton ensemble.', close: true };
    if (subset(t, g)) return { ok: false, msg: 'Ton ensemble contient des valeurs qui ne sont pas solutions.', close: true };
    return { ok: false, msg: 'Ce n’est pas le bon ensemble.' };
  };
  V.frac = function (src, p, d) {
    const s = String(src || '').replace(/[−–—]/g, '-').trim();
    const r = V.num(s, p / d);
    if (!r.ok) return r;
    const m = /^([-+]?)\s*(\d+)\s*(?:\/\s*(-?)\s*(\d+))?$/.exec(s);
    if (!m) return { ok: false, close: true, msg: 'C’est la bonne valeur, mais écris-la sous la forme d’une fraction a/b (entiers), sans décimale ni calcul.' };
    if (m[3]) return { ok: false, close: true, msg: 'C’est la bonne valeur, mais le signe se met au numérateur : −a/b, pas a/(−b).' };
    const n = +m[2],
      q = m[4] === undefined ? 1 : +m[4];
    if (gcd(n, q) !== 1) return { ok: false, close: true, msg: 'C’est la bonne valeur, mais la fraction n’est pas irréductible : simplifie-la.' };
    return { ok: true };
  };

  /* ---------- aperçu (TeX) ---------- */
  const basePreview = CU.preview;
  CU.preview = function (src, kind) {
    if (kind === 'interval') {
      if (!String(src || '').trim()) return '';
      try {
        return parse(src).tex;
      } catch {
        return null;
      }
    }
    if (kind === 'frac') {
      const m = /^\s*([-−+]?)\s*(\d+)\s*\/\s*(\d+)\s*$/.exec(String(src || ''));
      if (m) return (m[1] === '-' || m[1] === '−' ? '-' : '') + '\\dfrac{' + m[2] + '}{' + m[3] + '}';
    }
    return basePreview(src, kind === 'frac' ? 'num' : kind);
  };

  /* ---------- constructeurs d'exercices ---------- */
  K.interval = (q, target, sol, hint, label = 'Ton ensemble', extra = {}) => {
    const t = parse(target); // erreur d'écriture de l'énoncé détectée dès la génération
    return { type: 'fields', q, fields: [{ label, kind: 'interval' }], check: (a) => V.interval(a[0], t), sol, hint, emptyBtn: true, _ans: [target], ...extra };
  };
  K.frac = (q, p, d, sol, hint, label = 'Ta réponse', extra = {}) => {
    if (!Number.isInteger(p) || !Number.isInteger(d) || d <= 0 || gcd(p, d) !== 1) throw new Error('K.frac : ' + p + '/' + d + ' n’est pas une fraction irréductible (dénominateur > 0)');
    return { type: 'fields', q, fields: [{ label, kind: 'frac' }], check: (a) => V.frac(a[0], p, d), sol, hint, _ans: [p + '/' + d], ...extra };
  };
  CU.IV = { parse, norm, complement, intersect, subset, same };
})();
