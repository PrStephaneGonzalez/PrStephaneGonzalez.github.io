/* Outils pour écrire les compétences : constructeurs d'exercices et notations. */
'use strict';
(function () {
  const { R, T, V, P, num } = CU;
  CU.SKILLS = {};
  CU.ORDER = [];
  CU.addSkill = (s) => {
    CU.SKILLS[s.id] = s;
    CU.ORDER.push(s.id);
  };
  // notations
  const N = (CU.N = {
    vec: (s) => '\\overrightarrow{' + s + '}',
    col: (x, y) => '\\begin{pmatrix}' + num(x) + '\\\\' + num(y) + '\\end{pmatrix}',
    pt: (L, x, y) => L + '(' + num(x) + '\\,;\\,' + num(y) + ')',
    co: (x, y) => '(' + num(x) + '\\,;\\,' + num(y) + ')',
    // a·b avec parenthèses si négatif
    p: (x) => (x < 0 ? '(' + num(x) + ')' : num(x)),
    // coefficient devant une lettre : 1 → '', -1 → '-'
    k: (x) => (x === 1 ? '' : x === -1 ? '-' : num(x)),
    // terme signé « + 3 » / « - 3 » pour l'enchaînement
    s: (x) => (x < 0 ? ' - ' + num(-x) : ' + ' + num(x)),
    lin: (a, b, v = 'x') => P.tex([b, a], v),
    par: (s) => '(' + s + ')',
  });
  const K = (CU.K = {
    expr(q, target, form, sol, hint, label = 'Ta réponse', extra = {}) {
      return { type: 'fields', q, fields: [{ label, kind: 'expr' }], check: (a) => V.expr(a[0], target, form), sol, hint, _tgt: target, ...extra };
    },
    num(q, val, sol, hint, label = 'Ta réponse', extra = {}) {
      return { type: 'fields', q, fields: [{ label, kind: 'num' }], check: (a) => V.num(a[0], val), sol, hint, _vals: [val], ...extra };
    },
    set(q, vals, sol, hint, label = 'Solutions (séparées par ;)', extra = {}) {
      return { type: 'fields', q, fields: [{ label, kind: 'set' }], check: (a) => V.set(a[0], vals), sol, hint, emptyBtn: true, _vals: vals, ...extra };
    },
    // plusieurs nombres : labels, valeurs
    nums(q, labels, vals, sol, hint, extra = {}) {
      return {
        type: 'fields',
        q,
        fields: labels.map((l) => ({ label: l, kind: 'num', short: true })),
        check(a) {
          const rs = a.map((x, i) => V.num(x, vals[i]));
          const bad = rs.findIndex((r) => !r.ok);
          if (bad < 0) return { ok: true };
          const r = rs[bad];
          return { ok: false, msg: (labels.length > 1 ? labels[bad].replace(/\$/g, '') + ' : ' : '') + r.msg, close: rs.some((x) => x.ok), syntax: r.syntax };
        },
        sol,
        hint,
        _vals: vals,
        ...extra,
      };
    },
    vec(q, x, y, sol, hint, names = ['x', 'y']) {
      return K.nums(q, names, [x, y], sol, hint, { inline: true });
    },
    text(q, expected, sol, hint, label = 'Ce qui s’affiche', extra = {}) {
      // Réponse tolérante : « 4 16 », « 4, 16 », « (4, 16) », « a=4 b=16 », « "deux" », « true »… sont équivalents.
      const norm = (s, exp) => {
        let t = String(s).replace(/[−–]/g, '-').toLowerCase();
        t = t.replace(/["'«»“”‘’`]/g, ' ').replace(/\b[a-z_]\w*\s*=\s*(?=-?\d)/g, ' ');
        if (!/[.,]/.test(exp)) t = t.replace(/[,;()\[\]]/g, ' ');
        return t.replace(/\s+/g, ' ').trim();
      };
      return {
        type: 'fields',
        q,
        fields: [{ label, kind: 'text' }],
        check: (a) => (norm(a[0], String(expected)) === norm(expected, String(expected)) ? { ok: true } : { ok: false, msg: 'Ce n’est pas ce qu’affiche le programme. Exécute-le ligne par ligne. (Écris seulement ce qui est affiché, valeurs séparées par un espace.)' }),
        sol,
        hint,
        ...extra,
      };
    },
    // le premier choix est le bon ; ils sont mélangés à l'affichage
    choice(q, choices, sol, hint, extra = {}) {
      const order = extra.keep ? choices.map((_, i) => i) : R.shuffle(choices.map((_, i) => i));
      return { type: 'choice', q, choices: order.map((i) => choices[i]), correct: order.indexOf(0), sol, hint, ...extra };
    },
    // étapes dans le bon ordre + intrus éventuels
    order(q, steps, decoys = [], sol, hint, extra = {}) {
      const items = R.shuffle([...steps.map((s, i) => ({ h: s, k: i })), ...decoys.map((s, i) => ({ h: s, k: 'd' + i }))]);
      return { type: 'order', q, items, n: steps.length, sol, hint, alts: extra.alts || [], ...extra };
    },
  });
  // petit utilitaire : choix parmi des générateurs
  CU.oneOf = (...gens) => () => R.pick(gens)();
  CU.sqTex = (n) => {
    const [k, m] = CU.sqrtSimp(n);
    return m === 1 ? String(k) : (k === 1 ? '' : k) + '\\sqrt{' + m + '}';
  };
})();
