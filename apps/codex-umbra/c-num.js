/* Région — Les Forges des Nombres (nombres et calculs, programme de seconde).
   n1 multiples et parité · n2 nombres premiers · n3 fractions · n4 puissances · n5 racines carrées
   n6 rationnels et irrationnels · n7 droite réelle, intervalles, valeur absolue · n8 encadrements · n11 grandeurs.
   Les prérequis sont dans graph.js. Le rang Maître va au-delà de la seconde ; les notions nouvelles
   (congruences, PGCD, radicaux imbriqués…) sont expliquées dans l'énoncé ou la correction. */
'use strict';
(function () {
  const { R, T, K, V, num, gcd } = CU;

  /* ================= outils ================= */
  const lcm = (a, b) => (a / gcd(a, b)) * b;
  const red = (p, q) => {
    if (q < 0) (p = -p), (q = -q);
    const g = gcd(p, q) || 1;
    return [p / g, q / g];
  };
  // TeX d'une fraction réduite
  const ft = (p, q) => {
    const [a, b] = red(p, q);
    return b === 1 ? String(a) : (a < 0 ? '-' : '') + '\\frac{' + Math.abs(a) + '}{' + b + '}';
  };
  // exercice « fraction irréductible » à partir d'une fraction quelconque
  const kfrac = (q, p, d, sol, hint, label) => {
    const [a, b] = red(p, d);
    return K.frac(q, a, b, sol, hint, label);
  };
  const divisors = (n) => {
    const out = [];
    for (let d = 1; d <= n; d++) if (n % d === 0) out.push(d);
    return out;
  };
  const isPrime = (n) => {
    if (n < 2) return false;
    for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
    return true;
  };
  const PRIMES = [...Array(200).keys()].filter(isPrime);
  const factorTex = (n) => {
    const parts = [];
    for (const p of PRIMES) {
      let e = 0;
      while (n % p === 0) (n /= p), e++;
      if (e) parts.push(e === 1 ? String(p) : p + '^{' + e + '}');
    }
    if (n > 1) parts.push(String(n));
    return parts.join('\\times');
  };
  // décimal exact : entier I et k décimales → TeX « 3{,}14 » et saisie « 3.14 »
  const decParts = (I, k) => {
    const neg = I < 0,
      s = String(Math.abs(I)).padStart(k + 1, '0');
    const ip = k ? s.slice(0, -k) : s,
      fp = k ? s.slice(-k) : '';
    return { tex: (neg ? '-' : '') + ip + (k ? '{,}' + fp : ''), txt: (neg ? '-' : '') + ip + (k ? '.' + fp : ''), v: I / 10 ** k };
  };
  const dtex = (I, k) => decParts(I, k).tex;
  // valeur d'une saisie (ou null)
  const valOf = (s) => {
    try {
      return CU.evalAst(CU.parse(s), 0);
    } catch {
      return null;
    }
  };
  // exercice à correcteur sur mesure (un champ)
  const custom = (q, check, ans, sol, hint, label = 'Ta réponse', kind = 'num', extra = {}) => ({ type: 'fields', q, fields: [{ label, kind }], check: (a) => check(a[0]), sol, hint, _ans: [ans], ...extra });
  // valeur exacte attendue ; une erreur d'un facteur 10ⁿ est signalée comme telle
  const convEx = (q, val, sol, hint, label = 'Ta réponse') =>
    custom(
      q,
      (s) => {
        const r = V.num(s, val);
        if (r.ok || r.syntax) return r;
        const v = valOf(s);
        if (v !== null && v * val > 0) {
          const e = Math.log10(v / val);
          if (Math.abs(e - Math.round(e)) < 1e-9 && Math.round(e) !== 0) return { ok: false, close: true, msg: 'Les chiffres sont bons, mais tu t’es trompé d’un facteur ' + 10 ** Math.abs(Math.round(e)) + ' : revois le passage d’une unité (ou d’une puissance de 10) à l’autre.' };
        }
        return { ok: false, msg: r.close ? r.msg : 'Ce n’est pas la bonne valeur.' };
      },
      String(+val.toPrecision(12)),
      sol,
      hint,
      label,
    );
  // « \frac{p}{q} » suivi de sa forme réduite si elle diffère
  const fr2 = (p, q) => '\\frac{' + p + '}{' + q + '}' + (gcd(p, q) > 1 ? '=' + ft(p, q) : '');
  const iv = (s) => CU.IV.parse(s).ivs;
  const ivTex = (s) => CU.IV.tex(s);
  const B = (s) => '<b>' + s + '</b>';
  CU.NUMH = { red, ft, divisors, isPrime, decParts, valOf, custom };

  /* ================= N1 — Le crible (multiples, diviseurs, parité) ================= */
  const PAR = [
    { t: 'n(n+1)', f: (n) => n * (n + 1), why: T`deux entiers consécutifs : l’un des deux est pair, donc le produit aussi` },
    { t: 'n^2+n+1', f: (n) => n * n + n + 1, why: T`$n^2+n=n(n+1)$ est pair (produit de deux consécutifs), donc $n^2+n+1$ est impair` },
    { t: '2n+1', f: (n) => 2 * n + 1, why: T`$2n$ est pair, donc $2n+1$ est impair` },
    { t: 'n^2', f: (n) => n * n, why: T`$2^2=4$ est pair mais $3^2=9$ est impair : cela dépend de $n$` },
    { t: '3n', f: (n) => 3 * n, why: T`$3\times2=6$ est pair, $3\times1=3$ est impair : cela dépend de $n$` },
    { t: 'n^2-n', f: (n) => n * n - n, why: T`$n^2-n=(n-1)n$ : produit de deux entiers consécutifs, donc pair` },
    { t: '(n+1)(n+2)', f: (n) => (n + 1) * (n + 2), why: T`produit de deux entiers consécutifs, donc pair` },
    { t: '2n^2+3', f: (n) => 2 * n * n + 3, why: T`$2n^2+2$ est pair, donc $2n^2+3$ est impair` },
    { t: 'n^2+3n', f: (n) => n * n + 3 * n, why: T`$n^2+3n=n(n+1)+2n$ : somme de deux nombres pairs` },
    { t: 'n+3', f: (n) => n + 3, why: T`$1+3=4$ est pair mais $2+3=5$ est impair : cela dépend de $n$` },
  ];
  const parityOf = (e) => {
    const ps = [0, 1, 2, 3, 4, 5].map((n) => ((e.f(n) % 2) + 2) % 2);
    return ps.every((x) => x === 0) ? 0 : ps.every((x) => x === 1) ? 1 : 2;
  };
  const PARL = ['Toujours pair', 'Toujours impair', 'Cela dépend de $n$'];
  const N1A = [
    () => {
      const n = R.pick([36, 48, 60, 72, 84, 90, 96, 108, 120, 126, 132, 150, 168, 180, 198]);
      const ds = divisors(n).filter((d) => d > 2 && d < n && d <= 60);
      const good = R.pick(ds);
      const bad = [];
      while (bad.length < 3) {
        const c = R.int(4, Math.min(n - 1, 45));
        if (n % c && !bad.includes(c)) bad.push(c);
      }
      return K.choice(
        T`Lequel de ces nombres est un ${B('diviseur')} de $${n}$ ?`,
        [good, ...bad].map((x) => '$' + x + '$'),
        T`$${n}=${good}\times${n / good}$ : la division de $${n}$ par $${good}$ tombe juste. Les autres laissent un reste : ` + bad.map((b) => T`$${n}=${b}\times${Math.floor(n / b)}+${n % b}$`).join(', ') + '.',
        'Un diviseur de n est un nombre d par lequel la division de n tombe juste : n = d × k avec k entier.',
      );
    },
    () => {
      const b = R.int(7, 23),
        n = R.int(150, 999);
      const q = Math.floor(n / b),
        r = n % b;
      if (r === 0) return N1A[1]();
      return K.num(
        T`Quel est le plus grand multiple de $${b}$ inférieur ou égal à $${n}$ ?`,
        b * q,
        T`$${n}=${b}\times${q}+${r}$ avec $0\leqslant${r}<${b}$. Le plus grand multiple de $${b}$ qui ne dépasse pas $${n}$ est $${b}\times${q}=${b * q}$ ; le suivant, $${b * (q + 1)}$, est trop grand.`,
        'Fais la division euclidienne de n par b : le multiple cherché est b × (quotient).',
      );
    },
    () => {
      const e = R.pick(PAR),
        p = parityOf(e);
      return K.choice(T`$n$ désigne un entier quelconque. Le nombre $${e.t}$ est…`, [PARL[p], ...PARL.filter((_, i) => i !== p)], T`${PARL[p]} : ${e.why}.`, 'Essaie n = 1 et n = 2. Si les deux résultats ont la même parité, cherche une raison générale.');
    },
    () => {
      const k = R.pick([3, 9, 4, 5]);
      const ok = (x) => x % k === 0;
      let good;
      do good = R.int(1000, 9999);
      while (!ok(good));
      const bad = [];
      while (bad.length < 3) {
        const c = good + R.pick([1, 2, 3, 10, 20, 100, -1, -2, -10]) * R.pick([1, 1, 1, 3]);
        if (!ok(c) && !bad.includes(c) && c > 999) bad.push(c);
      }
      const ds = (x) => String(x).split('').map(Number);
      const why =
        k === 3 || k === 9
          ? T`La somme des chiffres de $${good}$ vaut $${ds(good).join('+')}=${ds(good).reduce((a, b) => a + b)}$, multiple de $${k}$. Pour les autres : ` + bad.map((b) => T`$${ds(b).reduce((a, c) => a + c)}$`).join(', ') + T`, qui ne sont pas des multiples de $${k}$.`
          : k === 4
            ? T`Un nombre est divisible par $4$ si le nombre formé par ses deux derniers chiffres l’est : $${good % 100}=4\times${(good % 100) / 4}$.`
            : T`Un nombre est divisible par $5$ s’il se termine par $0$ ou $5$.`;
      return K.choice(T`Lequel de ces nombres est divisible par $${k}$ ?`, [good, ...bad].map((x) => '$' + x + '$'), why, k === 3 || k === 9 ? `Critère : la somme des chiffres doit être un multiple de ${k}.` : k === 4 ? 'Regarde les deux derniers chiffres.' : 'Regarde le dernier chiffre.');
    },
  ];
  const ODDPROOF = [
    {
      th: 'La somme de deux entiers impairs est paire.',
      steps: [T`Soient $a$ et $b$ impairs : il existe des entiers $k$ et $m$ tels que $a=2k+1$ et $b=2m+1$.`, T`$a+b=2k+1+2m+1=2k+2m+2$.`, T`$a+b=2(k+m+1)$.`, T`$k+m+1$ est un entier, donc $a+b$ est pair.`],
      decoys: [T`Il existe un entier $k$ tel que $a=2k+1$ et $b=2k+1$.`, T`Par exemple $3+5=8$ est pair, donc c’est vrai.`],
    },
    {
      th: 'Le produit de deux entiers impairs est impair.',
      steps: [T`Soient $a=2k+1$ et $b=2m+1$, avec $k$ et $m$ entiers.`, T`$ab=(2k+1)(2m+1)=4km+2k+2m+1$.`, T`$ab=2(2km+k+m)+1$.`, T`$2km+k+m$ est un entier, donc $ab$ est impair.`],
      decoys: [T`Il existe un entier $k$ tel que $a=2k+1$ et $b=2k+1$.`, T`$ab=4km+1$.`],
    },
    {
      th: 'Le carré d’un entier impair est impair.',
      steps: [T`Soit $n$ impair : $n=2k+1$ avec $k$ entier.`, T`$n^2=(2k+1)^2=4k^2+4k+1$.`, T`$n^2=2(2k^2+2k)+1$.`, T`$2k^2+2k$ est un entier, donc $n^2$ est impair.`],
      decoys: [T`$n^2=4k^2+1$.`, T`$1^2=1$, $3^2=9$, $5^2=25$ : c’est toujours impair.`],
    },
    {
      th: 'La somme d’un entier pair et d’un entier impair est impaire.',
      steps: [T`Soient $a$ pair et $b$ impair : $a=2k$ et $b=2m+1$, avec $k$ et $m$ entiers.`, T`$a+b=2k+2m+1$.`, T`$a+b=2(k+m)+1$.`, T`$k+m$ est un entier, donc $a+b$ est impair.`],
      decoys: [T`$a=2k$ et $b=2k+1$ avec le même entier $k$.`, T`$2+3=5$ est impair, donc c’est vrai.`],
    },
  ];
  const N1B = [
    () => {
      const n = R.pick([12, 16, 18, 20, 24, 28, 30, 32, 36, 40, 42, 44, 45, 48, 50, 54, 56, 60, 63, 64, 66, 70, 72, 75, 78, 80, 84, 88, 90, 96, 98, 100]);
      const ds = divisors(n);
      const pairs = ds.filter((d) => d * d <= n).map((d) => T`$${d}\times${n / d}$`);
      return K.num(T`Combien l’entier $${n}$ a-t-il de diviseurs positifs ?`, ds.length, T`On cherche les diviseurs par paires $d\times\frac{${n}}{d}$, en s’arrêtant dès que $d^2>${n}$ : ${pairs.join(', ')}. Diviseurs : $${ds.join(',\\,')}$, soit $${ds.length}$ diviseurs.`, 'Liste-les par paires : 1 × n, 2 × …, et arrête-toi quand le premier facteur dépasse la racine de n.', 'Nombre de diviseurs');
    },
    () => {
      const b = R.int(6, 29),
        a = R.int(100, 999);
      const q = Math.floor(a / b),
        r = a % b;
      return K.nums(T`Effectue la ${B('division euclidienne')} de $${a}$ par $${b}$ : trouve les entiers $q$ et $r$ tels que $${a}=${b}q+r$ avec $0\leqslant r<${b}$.`, ['$q$', '$r$'], [q, r], T`$${b}\times${q}=${b * q}$ et $${a}-${b * q}=${r}$, avec $0\leqslant${r}<${b}$. Donc $${a}=${b}\times${q}+${r}$.`, 'Le reste doit être positif et strictement plus petit que le diviseur.', { inline: true });
    },
    () => {
      const p = R.pick(ODDPROOF);
      return K.order(T`${B('Théorème.')} ${p.th} Remets la démonstration dans l’ordre.`, p.steps, R.shuffle(p.decoys).slice(0, 1), T`On ${B('nomme')} les entiers avec des lettres ${B('différentes')} (deux impairs n’ont aucune raison d’être égaux), on calcule, on fait apparaître $2\times(\text{entier})$ ou $2\times(\text{entier})+1$, on conclut. Un exemple ne prouve rien.`, 'Pair : 2k. Impair : 2k + 1. Deux nombres distincts demandent deux lettres distinctes.');
    },
    () => {
      const k = R.pick([3, 4, 5, 6, 7]);
      const off = (k * (k - 1)) / 2;
      const g = gcd(k, off);
      const terms = [...Array(k).keys()].map((i) => (i ? 'n+' + i : 'n')).join(')+(');
      return K.num(
        T`Quel est le plus grand entier qui divise ${B('toujours')} la somme de $${k}$ entiers consécutifs $n,\,n+1,\,\dots,\,n+${k - 1}$ ?`,
        g,
        T`$(${terms})=${k}n+${off}=${g}\left(${k / g === 1 ? '' : k / g}n+${off / g}\right)$ : c’est toujours un multiple de $${g}$. On ne peut pas faire mieux : pour $n=0$ la somme vaut $${off}$ et pour $n=1$ elle vaut $${k + off}$, et le plus grand entier qui divise ces deux nombres est $${g}$.`,
        'Écris la somme sous la forme k n + c, puis teste n = 0 et n = 1.',
      );
    },
  ];
  const N1C = [
    () =>
      R.pick([
        () =>
          K.order(
            T`${B('Théorème.')} Pour tout entier $n$, $n^2+3n$ est pair. Remets la démonstration (${B('disjonction des cas')}) dans l’ordre.`,
            [T`Tout entier est pair ou impair : on distingue deux cas.`, T`Si $n=2k$, alors $n^2+3n=4k^2+6k=2(2k^2+3k)$ : pair.`, T`Si $n=2k+1$, alors $n^2+3n=4k^2+4k+1+6k+3=2(2k^2+5k+2)$ : pair.`, T`Dans les deux cas, $n^2+3n$ est pair.`],
            [T`Pour $n=1,\,2,\,3$ on trouve $4,\,10,\,18$ : c’est donc toujours pair.`],
            T`Les deux cas couvrent tous les entiers ; dans chacun on fait apparaître $2\times(\text{entier})$. Variante plus courte : $n^2+3n=n(n+1)+2n$.`,
            'Traite le cas pair (n = 2k) puis le cas impair (n = 2k + 1).',
            { alts: [[0, 2, 1, 3]] },
          ),
        () =>
          K.order(
            T`${B('Théorème.')} Pour tout entier $n$, $n^3-n$ est un multiple de $3$. Remets la démonstration dans l’ordre.`,
            [T`$n^3-n=n(n^2-1)=(n-1)\,n\,(n+1)$.`, T`C’est le produit de trois entiers consécutifs.`, T`Parmi trois entiers consécutifs, l’un est un multiple de $3$.`, T`Donc le produit $n^3-n$ est un multiple de $3$.`],
            [T`$n^3-n=n(n-1)^2$.`],
            T`On factorise : $n^3-n=(n-1)n(n+1)$. Les restes de $n-1$, $n$, $n+1$ dans la division par $3$ sont trois restes consécutifs : l’un vaut $0$.`,
            'Factorise par n, puis reconnais une identité remarquable.',
          ),
      ])(),
    () => {
      const v = R.pick([
        { q: T`$n$ est impair. Quel est le reste de la division de $n^2$ par $8$ ?`, a: 1, s: T`$n=2k+1$ : $n^2=4k^2+4k+1=4k(k+1)+1$. Or $k(k+1)$ est pair, donc $4k(k+1)$ est un multiple de $8$ : le reste vaut $1$. (On note $n^2\equiv1\pmod 8$ : « congruent à 1 modulo 8 ».)` },
        { q: T`$n$ est impair. Quel est le reste de la division de $n^2$ par $4$ ?`, a: 1, s: T`$n=2k+1$ : $n^2=4(k^2+k)+1$. Le reste vaut $1$.` },
        { q: T`$n$ est pair. Quel est le reste de la division de $n^2$ par $4$ ?`, a: 0, s: T`$n=2k$ : $n^2=4k^2$ est un multiple de $4$. Le reste vaut $0$. Conséquence : un carré n’a jamais pour reste $2$ ou $3$ dans la division par $4$.` },
        { q: T`$n$ n’est pas un multiple de $3$. Quel est le reste de la division de $n^2$ par $3$ ?`, a: 1, s: T`Deux cas : $n=3k+1$ donne $n^2=3(3k^2+2k)+1$ ; $n=3k+2$ donne $n^2=9k^2+12k+4=3(3k^2+4k+1)+1$. Dans les deux cas, le reste vaut $1$.` },
        { q: T`Quel est le reste de la division de $n^2+n$ par $2$, pour tout entier $n$ ?`, a: 0, s: T`$n^2+n=n(n+1)$, produit de deux entiers consécutifs : il est pair, le reste vaut $0$.` },
      ]);
      return K.num(v.q, v.a, v.s, 'Écris n selon son cas (2k, 2k + 1, 3k + 1…), développe, et fais apparaître le diviseur.', 'Reste');
    },
    () => {
      const [a, b] = R.pick([[2, 3], [2, 5], [3, 5], [3, 4], [4, 6], [6, 9], [4, 10], [5, 7], [6, 8], [3, 7]]),
        n = R.int(100, 400);
      const m = lcm(a, b);
      const r = Math.floor(n / a) + Math.floor(n / b) - Math.floor(n / m);
      return K.num(
        T`Combien d’entiers compris entre $1$ et $${n}$ sont multiples de $${a}$ ${B('ou')} de $${b}$ ?`,
        r,
        T`Multiples de $${a}$ : $${Math.floor(n / a)}$. Multiples de $${b}$ : $${Math.floor(n / b)}$. Mais les multiples communs, c’est-à-dire les multiples de $${m}$ (le plus petit multiple commun), sont comptés deux fois : il y en a $${Math.floor(n / m)}$. Total : $${Math.floor(n / a)}+${Math.floor(n / b)}-${Math.floor(n / m)}=${r}$.`,
        'Compte les multiples de chacun, puis retire ceux que tu as comptés deux fois.',
      );
    },
    () => {
      const b = R.int(3, 12),
        a = R.int(20, 150);
      const q = -Math.ceil(a / b),
        r = -a - b * q;
      if (r === 0) return N1C[3]();
      return K.nums(
        T`On étend la division euclidienne aux entiers négatifs : pour $a$ entier et $b>0$, il existe un unique couple $(q,r)$ d’entiers avec $a=bq+r$ et $0\leqslant r<b$. Trouve $q$ et $r$ pour $a=-${a}$ et $b=${b}$.`,
        ['$q$', '$r$'],
        [q, r],
        T`$${b}\times(${q})=${b * q}$ et $-${a}-(${b * q})=${r}$, avec $0\leqslant ${r}<${b}$. Donc $-${a}=${b}\times(${q})+${r}$. Le piège : $-${a}=${b}\times(${q + 1})-${a % b}$ a un reste négatif, interdit.`,
        'Le reste doit rester positif : le quotient est donc plus petit (plus négatif) qu’on ne le croit.',
        { inline: true },
      );
    },
  ];
  CU.addSkill({
    id: 'n1',
    region: 'num',
    name: 'Le crible',
    place: 'Le Crible des Fondeurs',
    glyph: '÷',
    x: 170,
    y: 850,
    flavor: 'Le crible laisse passer ce qui tombe juste. Le reste, il le garde — et c’est souvent le reste qui parle.',
    law: T`$d$ divise $n$ s’il existe un entier $k$ tel que $n=dk$. Un entier pair s’écrit $2k$, un impair $2k+1$. Division euclidienne : $a=bq+r$ avec $0\leqslant r<b$.`,
    lessons: [
      T`<p>Un entier $d$ est un ${B('diviseur')} de $n$ (et $n$ un ${B('multiple')} de $d$) s’il existe un entier $k$ tel que $n=d\times k$. Un entier est ${B('pair')} s’il s’écrit $2k$, ${B('impair')} s’il s’écrit $2k+1$ ($k$ entier).</p>
<p>Critères : divisible par $2$ si le dernier chiffre est pair, par $5$ s’il est $0$ ou $5$, par $4$ si le nombre formé par les deux derniers chiffres l’est, par $3$ (ou $9$) si la ${B('somme des chiffres')} l’est.</p>
<p class="ex">$84=7\times12$ : $7$ divise $84$. Somme des chiffres de $5\,271$ : $15$, multiple de $3$ mais pas de $9$.</p>`,
      T`<p>${B('Division euclidienne')} de $a$ par $b>0$ : il existe un unique couple d’entiers $(q,r)$ tel que $$a=bq+r \quad\text{et}\quad 0\leqslant r<b.$$ $b$ divise $a$ exactement quand $r=0$.</p>
<p>Pour ${B('démontrer')} une propriété des entiers, on les nomme : « soit $a=2k+1$ et $b=2m+1$ ». Deux nombres différents ont des lettres différentes. Un exemple illustre, il ne prouve pas.</p>
<p class="ex">$2k+1+2m+1=2(k+m+1)$ : la somme de deux impairs est paire.</p>`,
      T`<p>${B('Disjonction des cas')} : tout entier est pair ou impair ($2k$ ou $2k+1$), ou s’écrit $3k$, $3k+1$ ou $3k+2$. On traite chaque cas : ensemble, ils couvrent tout.</p>
<p>${B('Congruences')} (hors programme, très utiles) : on écrit $a\equiv b\pmod n$ (« $a$ congru à $b$ modulo $n$ ») quand $a$ et $b$ ont le même reste dans la division par $n$. Par exemple, tout carré impair est $\equiv1\pmod 8$.</p>
<p>${B('Dénombrer')} des multiples : de $1$ à $N$, il y a $\lfloor N/a\rfloor$ multiples de $a$ (partie entière). Pour « multiples de $a$ ${B('ou')} de $b$ », on retire ceux comptés deux fois : les multiples du plus petit multiple commun.</p>`,
    ],
    methods: [
      T`<ol class="meth"><li>Pour tester si $d$ divise $n$ : la division tombe-t-elle juste ? Sinon, utilise un critère (dernier chiffre, somme des chiffres).</li><li>Pour le plus grand multiple de $b$ sous $n$ : division euclidienne $n=bq+r$, la réponse est $bq$.</li><li>Pour une parité : teste deux valeurs de $n$ (une paire, une impaire) ; si les parités diffèrent, « cela dépend ». Sinon cherche la raison : produit de deux consécutifs, $2\times\ldots$, etc.</li></ol><p class="pit"><b>Piège</b> — $3$ divise $5\,271$ ne dit rien de $9$ : la somme $15$ est multiple de $3$ mais pas de $9$.</p>`,
      T`<ol class="meth"><li>Diviseurs : liste-les par paires $d\times\frac nd$ et arrête-toi quand $d^2>n$.</li><li>Division euclidienne : $q$ = partie entière de $a/b$, puis $r=a-bq$. Vérifie $0\leqslant r<b$.</li><li>Démonstration : nomme les entiers ($2k$, $2m+1$…), calcule, factorise par $2$ (ou $3$…), conclus en disant pourquoi le facteur est entier.</li></ol><p class="pit"><b>Piège</b> — écrire $a=2k+1$ et $b=2k+1$ avec la même lettre impose $a=b$.</p>`,
      T`<ol class="meth"><li>Choisis la bonne partition des entiers : pair/impair pour les questions modulo $2$, $4$ ou $8$ ; $3k$, $3k+1$, $3k+2$ pour le modulo $3$.</li><li>Développe dans chaque cas et fais apparaître le diviseur : $n^2=4(k^2+k)+1$.</li><li>Pour compter « multiples de $a$ ou de $b$ » : $\lfloor N/a\rfloor+\lfloor N/b\rfloor-\lfloor N/m\rfloor$ où $m$ est le plus petit multiple commun.</li></ol><p class="pit"><b>Piège</b> — avec un dividende négatif, le reste reste positif : $-47=5\times(-10)+3$, pas $5\times(-9)-2$.</p>`,
    ],
    gen: [CU.oneOf(...N1A), CU.oneOf(...N1B), CU.oneOf(...N1C)],
  });

  /* ================= N2 — Les lingots premiers ================= */
  const COMPOSITE_TRAPS = [51, 57, 87, 91, 111, 117, 119, 123, 129, 133, 141, 143, 147, 153, 159, 161, 169, 171, 177, 183, 187, 189, 201, 203, 207, 209, 213, 217, 219, 221];
  const N2A = [
    () => {
      const good = R.pick(PRIMES.filter((p) => p > 40 && p < 200));
      const bad = R.shuffle(COMPOSITE_TRAPS).slice(0, 3);
      return K.choice(
        T`Lequel de ces nombres est ${B('premier')} ?`,
        [good, ...bad].map((x) => '$' + x + '$'),
        T`$${good}$ n’est divisible par aucun nombre premier inférieur ou égal à $\sqrt{${good}}\approx${Math.sqrt(good).toFixed(1).replace('.', '{,}')}$. Les autres se décomposent : ` + bad.map((b) => T`$${b}=${factorTex(b)}$`).join(', ') + '.',
        'Un nombre premier a exactement deux diviseurs : 1 et lui-même. Teste 3, 7, 11, 13, 17…',
      );
    },
    () => {
      let a, b, c, n;
      do {
        a = R.int(0, 5);
        b = R.int(0, 3);
        c = R.int(0, 2);
        n = 2 ** a * 3 ** b * 5 ** c;
      } while (n > 3000 || n < 30 || [a, b, c].filter(Boolean).length < 2);
      return K.nums(T`Décompose $${n}$ en produit de facteurs premiers : trouve les entiers $a,\,b,\,c$ tels que $$${n}=2^a\times3^b\times5^c$$`, ['$a$', '$b$', '$c$'], [a, b, c], T`$${n}=${factorTex(n)}$, donc $a=${a}$, $b=${b}$, $c=${c}$${[a, b, c].includes(0) ? T` (un exposant nul : $p^0=1$)` : ''}.`, 'Divise par 2 tant que possible, puis par 3, puis par 5, en comptant.', { inline: true });
    },
    () => {
      let p, q;
      do {
        p = R.int(1, 20);
        q = R.int(2, 25);
      } while (gcd(p, q) !== 1);
      const g = R.int(2, 12);
      return K.frac(T`Écris sous forme de ${B('fraction irréductible')} : $$\frac{${p * g}}{${q * g}}$$`, p, q, T`$${p * g}=${factorTex(p * g)}$ et $${q * g}=${factorTex(q * g)}$ : on simplifie par leur plus grand diviseur commun, $${g}$. $\frac{${p * g}}{${q * g}}=\frac{${p}\times${g}}{${q}\times${g}}=\frac{${p}}{${q}}$.`, 'Décompose numérateur et dénominateur en facteurs premiers et barre les facteurs communs.');
    },
  ];
  const N2B = [
    () => {
      let p, q;
      do {
        p = R.pick([7, 11, 13, 17, 19, 23, 29, 31]);
        q = R.pick([11, 13, 17, 19, 23, 29, 31, 37, 41, 43]);
      } while (q <= p);
      const n = p * q;
      return K.num(T`Quel est le plus petit diviseur premier de $${n}$ ?`, p, T`$${n}$ n’est divisible ni par $2$, ni par $3$, ni par $5$${p > 7 ? T`, ni par $7$` : ''}${p > 11 ? T`, ni par $11$` : ''}${p > 13 ? '…' : ''} mais $${n}=${p}\times${q}$. Il suffisait de tester les premiers jusqu’à $\sqrt{${n}}\approx${Math.sqrt(n).toFixed(1).replace('.', '{,}')}$.`, 'Teste les nombres premiers dans l’ordre : 2, 3, 5, 7, 11, 13…');
    },
    () => {
      const n = R.int(120, 1000);
      const s = Math.floor(Math.sqrt(n));
      const p = PRIMES.filter((x) => x <= s).pop();
      return K.num(T`Pour prouver qu’un entier $n$ est premier, il suffit de vérifier qu’aucun nombre premier $p\leqslant\sqrt n$ ne le divise. Pour $n=${n}$, quel est le ${B('plus grand')} nombre premier à tester ?`, p, T`$\sqrt{${n}}\approx${Math.sqrt(n).toFixed(2).replace('.', '{,}')}$ : on teste les premiers jusqu’à $${s}$, le dernier est $${p}$. Pourquoi cela suffit : si $n=ab$ avec $1<a\leqslant b$, alors $a^2\leqslant ab=n$, donc $n$ a un diviseur $a\leqslant\sqrt n$, et un facteur premier de $a$ aussi.`, 'Calcule la racine carrée de n, puis prends le plus grand nombre premier qui ne la dépasse pas.');
    },
    () => {
      const g = R.pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15]);
      let a, b;
      do {
        a = R.int(2, 9);
        b = R.int(2, 9);
      } while (gcd(a, b) !== 1 || a === b);
      const x = g * a,
        y = g * b;
      return K.num(T`Quel est le plus grand diviseur commun (PGCD) de $${x}$ et $${y}$ ?`, g, T`$${x}=${factorTex(x)}$ et $${y}=${factorTex(y)}$. Le PGCD est le produit des facteurs premiers communs, chacun avec le plus petit exposant : $${g}$. On a d’ailleurs $\frac{${x}}{${y}}=\frac{${a}}{${b}}$ irréductible.`, 'Décompose les deux nombres et garde ce qu’ils ont en commun.', 'PGCD');
    },
    () => {
      const irr = R.int(0, 1);
      let p, q, g;
      do {
        p = R.pick([2, 3, 5, 7]) ** R.int(1, 2) * R.pick([1, 3, 7, 11]);
        q = R.pick([2, 3, 5, 7]) ** R.int(1, 2) * R.pick([1, 5, 11, 13]);
        g = gcd(p, q);
      } while (p === q || p > 600 || q > 600 || (irr ? g !== 1 : g === 1));
      return K.choice(
        T`La fraction $\dfrac{${p}}{${q}}$ est-elle irréductible ?`,
        irr ? [T`Oui : $${p}=${factorTex(p)}$ et $${q}=${factorTex(q)}$ n’ont aucun facteur premier commun`, T`Non : on peut simplifier par $${R.pick([2, 3, 5].filter((x) => p % x || q % x))}$`, T`Non : le numérateur n’est pas premier`, T`Oui : le dénominateur est plus grand que le numérateur`] : [T`Non : $${p}=${factorTex(p)}$ et $${q}=${factorTex(q)}$ ont $${g}$ en commun`, T`Oui : ni $${p}$ ni $${q}$ n’est premier`, T`Oui : $${p}$ et $${q}$ sont impairs`, T`Non : le numérateur n’est pas premier`],
        irr ? T`Une fraction est irréductible quand numérateur et dénominateur n’ont aucun facteur premier commun (PGCD égal à $1$). Ils n’ont pas besoin d’être premiers.` : T`$\frac{${p}}{${q}}=\frac{${p / g}}{${q / g}}$ en simplifiant par $${g}$.`,
        'Décompose les deux nombres en facteurs premiers.',
      );
    },
  ];
  const N2C = [
    () =>
      K.order(
        T`${B('Théorème (Euclide).')} Il existe une infinité de nombres premiers. Remets la démonstration ${B('par l’absurde')} dans l’ordre.`,
        [T`Supposons qu’il n’existe qu’un nombre fini de nombres premiers : $p_1,\,p_2,\,\dots,\,p_n$.`, T`Posons $N=p_1\times p_2\times\cdots\times p_n+1$.`, T`$N>1$ admet un diviseur premier $p$, qui est forcément l’un des $p_i$.`, T`$p$ divise $p_1\cdots p_n$ et $N$, donc leur différence $1$ : impossible.`, T`L’hypothèse est fausse : il existe une infinité de nombres premiers.`],
        [R.pick([T`$N$ est donc un nombre premier.`, T`On vérifie que $2\times3\times5\times7+1=211$ est premier.`])],
        T`L’argument ne dit pas que $N$ est premier (c’est faux en général : $2\times3\times5\times7\times11\times13+1=30\,031=59\times509$). Il dit seulement qu’un diviseur premier de $N$ ne peut pas être dans la liste.`,
        'Suppose le contraire, fabrique un nombre qu’aucun premier de la liste ne divise.',
      ),
    () => {
      let a, b, c, n;
      do {
        a = R.int(1, 6);
        b = R.int(0, 3);
        c = R.int(0, 2);
        n = 2 ** a * 3 ** b * 5 ** c;
      } while (n > 5000 || n < 40);
      const fs = [[2, a, 'i'], [3, b, 'j'], [5, c, 'k']].filter((f) => f[1] > 0);
      const tot = fs.reduce((x, f) => x * (f[1] + 1), 1);
      return K.num(T`$${n}=${factorTex(n)}$. Combien $${n}$ a-t-il de diviseurs positifs ?`, tot, T`Un diviseur s’écrit $${fs.map((f) => f[0] + '^' + f[2]).join('\\times ')}$ avec ${fs.map((f) => T`$0\leqslant ${f[2]}\leqslant${f[1]}$`).join(', ')} : ${fs.map((f) => T`$${f[1] + 1}$ choix pour $${f[2]}$`).join(', ')}. Total : $${fs.map((f) => f[1] + 1).join('\\times')}=${tot}$.`, 'Un diviseur prend chaque facteur premier avec un exposant entre 0 et celui de n.', 'Nombre de diviseurs');
    },
    () => {
      const [a, b] = R.pick([[12, 18], [8, 12], [15, 20], [14, 21], [10, 15], [18, 24], [20, 30], [9, 12], [16, 24], [21, 28], [6, 10], [12, 15]]);
      const m = lcm(a, b);
      return K.num(T`Quel est le plus petit dénominateur commun pour calculer $\dfrac{1}{${a}}+\dfrac{1}{${b}}$ ?`, m, T`C’est le plus petit multiple commun de $${a}=${factorTex(a)}$ et $${b}=${factorTex(b)}$ : on prend chaque facteur premier avec le plus grand exposant, $${factorTex(m)}=${m}$. Alors $\frac1{${a}}+\frac1{${b}}=\frac{${m / a}}{${m}}+\frac{${m / b}}{${m}}=${ft(m / a + m / b, m)}$. (Le produit $${a * b}$ marche aussi, mais oblige à simplifier.)`, 'Cherche le plus petit nombre qui est à la fois multiple des deux dénominateurs.', 'Dénominateur');
    },
    () =>
      R.pick([
        () => K.num(T`$p$ est un nombre premier strictement supérieur à $3$. Quel est le plus grand entier qui divise $p^2-1$ ${B('pour tous')} ces $p$ ?`, 24, T`$p^2-1=(p-1)(p+1)$. $p$ est impair, donc $p-1$ et $p+1$ sont deux pairs consécutifs : l’un est multiple de $4$, le produit est multiple de $8$. Parmi $p-1,\,p,\,p+1$, l’un est multiple de $3$ et ce n’est pas $p$ : le produit est multiple de $3$. Donc $24$ divise $p^2-1$. Et $5^2-1=24$ : on ne peut pas faire mieux.`, 'Factorise p² − 1, et teste p = 5, 7, 11.'),
        () => K.num(T`$p$ est un nombre premier strictement supérieur à $3$. Quel est le reste de la division de $p^2$ par $3$ ?`, 1, T`$p$ n’est pas multiple de $3$, donc $p=3k+1$ ou $p=3k+2$. Dans le premier cas $p^2=3(3k^2+2k)+1$ ; dans le second $p^2=3(3k^2+4k+1)+1$. Le reste vaut $1$.`, 'Écris p = 3k + 1 ou p = 3k + 2.', 'Reste'),
      ])(),
  ];
  CU.addSkill({
    id: 'n2',
    region: 'num',
    name: 'Les lingots premiers',
    place: 'La Salle des Lingots',
    glyph: 'ℙ',
    x: 125,
    y: 600,
    flavor: 'Certains lingots se brisent en morceaux égaux. D’autres jamais : ce sont eux qui font tenir tous les autres.',
    law: T`Un nombre ${B('premier')} a exactement deux diviseurs, $1$ et lui-même. Tout entier $\geqslant2$ se décompose de façon unique en produit de facteurs premiers. Une fraction est irréductible quand numérateur et dénominateur n’ont aucun facteur premier commun.`,
    lessons: [
      T`<p>Un entier $p\geqslant2$ est ${B('premier')} s’il a exactement deux diviseurs positifs : $1$ et $p$. Les premiers : $2,3,5,7,11,13,17,19,23,29,\dots$ ($1$ n’est pas premier.)</p>
<p>Tout entier $n\geqslant2$ se ${B('décompose')} en produit de facteurs premiers, de façon unique à l’ordre près : $360=2^3\times3^2\times5$.</p>
<p>Une fraction est ${B('irréductible')} quand numérateur et dénominateur n’ont aucun facteur premier commun. Pour simplifier, on barre les facteurs communs.</p>
<p class="ex">$\frac{84}{126}=\frac{2^2\times3\times7}{2\times3^2\times7}=\frac23$.</p>`,
      T`<p>${B('Test de primalité')} : si $n$ n’est divisible par aucun nombre premier $p\leqslant\sqrt n$, alors $n$ est premier. En effet, si $n=ab$ avec $1<a\leqslant b$, alors $a\leqslant\sqrt n$.</p>
<p>${B('PGCD')} (plus grand diviseur commun, hors programme) : produit des facteurs premiers communs avec le plus petit exposant. Diviser numérateur et dénominateur par le PGCD rend la fraction irréductible d’un coup.</p>`,
      T`<p>${B('Euclide')} : il y a une infinité de nombres premiers (preuve par l’absurde avec $N=p_1\cdots p_n+1$).</p>
<p>${B('Nombre de diviseurs')} : si $n=p^a q^b r^c$, un diviseur est $p^iq^jr^k$ avec $0\leqslant i\leqslant a$… il y en a $(a+1)(b+1)(c+1)$.</p>
<p>Le ${B('plus petit multiple commun')} des dénominateurs (PPCM) donne le plus petit dénominateur commun : chaque facteur premier avec le plus grand exposant.</p>`,
    ],
    methods: [
      T`<ol class="meth"><li>Premier ? Teste la division par $2,3,5,7,11,13\dots$ jusqu’à $\sqrt n$.</li><li>Décomposer : divise par $2$ tant que possible, puis $3$, puis $5$… en comptant les divisions.</li><li>Simplifier une fraction : décompose les deux termes et barre les facteurs communs.</li></ol><p class="pit"><b>Piège</b> — $91=7\times13$ et $51=3\times17$ ont l’air premiers.</p>`,
      T`<ol class="meth"><li>Calcule $\sqrt n$ : seuls les premiers jusqu’à cette valeur doivent être testés.</li><li>PGCD : facteurs communs, plus petits exposants.</li><li>Une fraction est irréductible si le PGCD vaut $1$ ; ses termes n’ont pas besoin d’être premiers ($\frac{8}{9}$).</li></ol>`,
      T`<ol class="meth"><li>Nombre de diviseurs : ajoute $1$ à chaque exposant et multiplie.</li><li>PPCM : facteurs de l’un ou l’autre, plus grands exposants.</li><li>Pour un premier $p>3$ : $p$ est impair et n’est pas multiple de $3$ ; écris $p=2k+1$ ou $p=3k\pm1$.</li></ol><p class="pit"><b>Piège</b> — dans la preuve d’Euclide, $N$ n’est pas forcément premier.</p>`,
    ],
    gen: [CU.oneOf(...N2A), CU.oneOf(...N2B), CU.oneOf(...N2C)],
  });

  /* ================= N3 — Les balances (fractions) ================= */
  const rf = (dmax = 12) => {
    let p, q;
    do {
      q = R.int(2, dmax);
      p = R.nz(-2 * q, 2 * q);
    } while (gcd(p, q) !== 1);
    return [p, q];
  };
  const fx = ([p, q]) => (p < 0 ? '-' : '') + '\\dfrac{' + Math.abs(p) + '}{' + q + '}';
  const fxp = (f) => (f[0] < 0 ? '\\left(' + fx(f) + '\\right)' : fx(f));
  const N3A = [
    () => {
      const a = rf(),
        b = rf();
      const s = R.pick([1, -1]);
      const m = lcm(a[1], b[1]);
      const P = a[0] * b[1] + s * b[0] * a[1],
        Q = a[1] * b[1];
      return kfrac(T`Calcule et donne le résultat sous forme irréductible : $$${fx(a)} ${s > 0 ? '+' : '-'} ${fxp(b)}$$`, P, Q, T`Dénominateur commun $${m}$ : $${fx(a)}=\frac{${(a[0] * m) / a[1]}}{${m}}$ et $${fx(b)}=\frac{${(b[0] * m) / b[1]}}{${m}}$. Donc le résultat vaut $\frac{${(a[0] * m) / a[1]} ${s > 0 ? '+' : '-'} ${b[0] < 0 ? '(' + (b[0] * m) / b[1] + ')' : (b[0] * m) / b[1]}}{${m}}=${ft(P, Q)}$.`, 'Réduis au même dénominateur (un multiple commun des deux), puis ajoute les numérateurs.');
    },
    () => {
      const a = rf(),
        b = rf();
      return kfrac(T`Calcule et donne le résultat sous forme irréductible : $$${fx(a)}\times${fxp(b)}$$`, a[0] * b[0], a[1] * b[1], T`On multiplie les numérateurs entre eux et les dénominateurs entre eux : $\frac{${a[0]}\times${b[0] < 0 ? '(' + b[0] + ')' : b[0]}}{${a[1]}\times${b[1]}}=${ft(a[0] * b[0], a[1] * b[1])}$. (Simplifier avant de multiplier évite les grands nombres.)`, 'Numérateur × numérateur, dénominateur × dénominateur, puis simplifie.');
    },
    () => {
      const a = rf(),
        b = rf();
      return kfrac(T`Calcule et donne le résultat sous forme irréductible : $$${fx(a)}\div${fxp(b)}$$`, a[0] * b[1], a[1] * b[0], T`Diviser par $${fx(b)}$, c’est multiplier par son inverse $${fx([b[1] * Math.sign(b[0]), Math.abs(b[0])])}$ : $${fx(a)}\times${fxp([b[1] * Math.sign(b[0]), Math.abs(b[0])])}=${ft(a[0] * b[1], a[1] * b[0])}$.`, 'Diviser par une fraction = multiplier par son inverse (on la retourne).');
    },
    () => {
      let p, q;
      do {
        q = R.int(3, 12);
        p = R.int(1, q - 1);
      } while (gcd(p, q) !== 1);
      const Q = q * R.int(3, 25);
      return K.num(T`Le forgeron dispose de $${Q}$ kg de fer. Il en utilise les $\dfrac{${p}}{${q}}$. Combien de kilogrammes utilise-t-il ?`, (p * Q) / q, T`$\frac{${p}}{${q}}\times${Q}=\frac{${p}\times${Q}}{${q}}=${p}\times${Q / q}=${(p * Q) / q}$ kg.`, 'Prendre une fraction d’une quantité, c’est multiplier.', 'Masse (kg)');
    },
  ];
  const N3B = [
    () => {
      const a = rf(9),
        b = rf(9),
        c = rf(9);
      const P = a[0] * b[1] * c[1] + b[0] * c[0] * a[1],
        Q = a[1] * b[1] * c[1];
      return kfrac(T`Calcule (attention aux priorités) et donne le résultat sous forme irréductible : $$${fx(a)}+${fxp(b)}\times${fxp(c)}$$`, P, Q, T`La multiplication passe avant l’addition : $${fxp(b)}\times${fxp(c)}=${ft(b[0] * c[0], b[1] * c[1])}$, puis $${fx(a)}+${ft(b[0] * c[0], b[1] * c[1]).startsWith('-') ? '\\left(' + ft(b[0] * c[0], b[1] * c[1]) + '\\right)' : ft(b[0] * c[0], b[1] * c[1])}=${ft(P, Q)}$.`, 'Multiplication d’abord, addition ensuite.');
    },
    () => {
      const a = rf(9),
        b = rf(9),
        c = rf(9);
      const P = (a[0] * b[1] - b[0] * a[1]) * c[1],
        Q = a[1] * b[1] * c[0];
      if (P === 0) return N3B[1]();
      const d = red(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
      return kfrac(T`Calcule et donne le résultat sous forme irréductible : $$\left(${fx(a)}-${fxp(b)}\right)\div${fxp(c)}$$`, P, Q, T`Parenthèses d’abord : $${fx(a)}-${fxp(b)}=${ft(d[0], d[1])}$. Puis on multiplie par l’inverse de $${fx(c)}$ : $${ft(d[0], d[1])}\times\frac{${c[1] * Math.sign(c[0])}}{${Math.abs(c[0])}}=${ft(P, Q)}$.`, 'Les parenthèses d’abord ; diviser revient à multiplier par l’inverse.');
    },
    () => {
      const fs = [];
      while (fs.length < 4) {
        const q = R.int(3, 15),
          p = R.int(1, q - 1);
        if (gcd(p, q) === 1 && !fs.some((f) => f[0] * q === p * f[1])) fs.push([p, q]);
      }
      const big = R.int(0, 1);
      const ord = fs.slice().sort((x, y) => (big ? y[0] / y[1] - x[0] / x[1] : x[0] / x[1] - y[0] / y[1]));
      if (Math.abs(ord[0][0] / ord[0][1] - ord[1][0] / ord[1][1]) < 0.01) return N3B[2]();
      return K.choice(T`Laquelle de ces fractions est la plus ${big ? 'grande' : 'petite'} ?`, ord.map((f) => '$' + fx(f) + '$'), T`Avec un dénominateur commun (ou des valeurs approchées) : ` + ord.map((f) => T`$${fx(f)}\approx${(f[0] / f[1]).toFixed(3).replace('.', '{,}')}$`).join(', ') + '.', 'Compare les produits en croix : a/b < c/d quand a × d < c × b (b et d positifs).');
    },
    () => {
      const a = rf(),
        k = R.int(2, 9);
      const [p, q] = [Math.abs(a[0]), a[1]];
      return K.num(T`Trouve l’entier $x$ tel que $$\frac{${p}}{${q}}=\frac{x}{${q * k}}$$`, p * k, T`On passe de $${q}$ à $${q * k}$ en multipliant par $${k}$ ; on fait de même au numérateur : $x=${p}\times${k}=${p * k}$. Vérification par produits en croix : $${p}\times${q * k}=${q}\times${p * k}$.`, 'Par combien a-t-on multiplié le dénominateur ?', '$x$');
    },
    () => {
      let a, b, c, d;
      do {
        b = R.int(3, 8);
        a = R.int(1, b - 1);
        d = R.int(3, 8);
        c = R.int(1, d - 1);
      } while (gcd(a, b) !== 1 || gcd(c, d) !== 1);
      return kfrac(T`Un forgeron coule $\dfrac{${a}}{${b}}$ de son métal en épées, puis $\dfrac{${c}}{${d}}$ ${B('du reste')} en boucliers. Quelle fraction du métal ${B('initial')} lui reste-t-il ?`, (b - a) * (d - c), b * d, T`Après les épées il reste $1-\frac{${a}}{${b}}=\frac{${b - a}}{${b}}$. Les boucliers prennent $\frac{${c}}{${d}}$ de ce reste, il en reste donc $\frac{${d - c}}{${d}}$ : $\frac{${b - a}}{${b}}\times\frac{${d - c}}{${d}}=${ft((b - a) * (d - c), b * d)}$.`, '« Du reste » : la deuxième fraction s’applique à ce qui reste, pas au total.');
    },
  ];
  const cfTex = (xs) => (xs.length === 1 ? String(xs[0]) : xs[0] + '+\\cfrac{1}{' + cfTex(xs.slice(1)) + '}');
  const cfVal = (xs) => {
    let [p, q] = [xs[xs.length - 1], 1];
    for (let i = xs.length - 2; i >= 0; i--) [p, q] = [xs[i] * p + q, p];
    return [p, q];
  };
  const N3C = [
    () => {
      const xs = [R.int(1, 3), R.int(1, 4), R.int(1, 4), R.int(2, 5)].slice(0, R.int(3, 4));
      const [p, q] = cfVal(xs);
      return kfrac(T`Calcule et donne le résultat sous forme irréductible : $$${cfTex(xs)}$$`, p, q, T`On part du bas : ` + (() => {
        const steps = [];
        for (let i = xs.length - 2; i >= 0; i--) {
          const [a, b] = cfVal(xs.slice(i));
          steps.push(T`$${cfTex(xs.slice(i)).length > 40 ? '\\dots' : cfTex(xs.slice(i))}=${ft(a, b)}$`);
        }
        return steps.join(', puis ');
      })() + '. (On appelle cela une ' + B('fraction continue') + ' ; elles donnent les meilleures approximations des irrationnels.)', 'Commence par la fraction la plus basse et remonte : 1/(a/b) = b/a.');
    },
    () => {
      const n = R.int(5, 30);
      return kfrac(T`Calcule et donne le résultat sous forme irréductible : $$\frac{1}{1\times2}+\frac{1}{2\times3}+\frac{1}{3\times4}+\cdots+\frac{1}{${n}\times${n + 1}}$$ (Indice : vérifie que $\frac{1}{k(k+1)}=\frac1k-\frac{1}{k+1}$.)`, n, n + 1, T`$\frac1k-\frac1{k+1}=\frac{k+1-k}{k(k+1)}=\frac1{k(k+1)}$. La somme vaut $\left(1-\frac12\right)+\left(\frac12-\frac13\right)+\cdots+\left(\frac1{${n}}-\frac1{${n + 1}}\right)$ : tout se simplifie sauf le premier et le dernier terme (somme ${B('télescopique')}) : $1-\frac1{${n + 1}}=\frac{${n}}{${n + 1}}$.`, 'Écris chaque terme comme une différence et regarde ce qui se simplifie.');
    },
    () => {
      let a, b, c, d;
      do {
        b = R.int(3, 13);
        a = R.int(1, b - 1);
        d = R.int(3, 13);
        c = R.int(1, d - 1);
      } while (gcd(a, b) !== 1 || gcd(c, d) !== 1 || a * d >= c * b || c * b - a * d !== 1);
      const lo = a / b,
        hi = c / d;
      return custom(
        T`Donne une fraction strictement comprise entre $\dfrac{${a}}{${b}}$ et $\dfrac{${c}}{${d}}$.`,
        (s) => {
          const r = V.num(s, (a + c) / (b + d));
          if (r.syntax) return r;
          const v = valOf(s);
          if (v === null) return { ok: false, msg: 'Écris une fraction, par exemple 5/12.', syntax: true };
          if (v > lo + 1e-12 && v < hi - 1e-12) return { ok: true };
          if (Math.abs(v - lo) < 1e-12 || Math.abs(v - hi) < 1e-12) return { ok: false, msg: 'Strictement comprise : les bornes elles-mêmes ne conviennent pas.', close: true };
          return { ok: false, msg: 'Ce nombre n’est pas entre les deux fractions.' };
        },
        `${a + c}/${b + d}`,
        T`Par exemple la ${B('médiante')} $\frac{${a}+${c}}{${b}+${d}}=\frac{${a + c}}{${b + d}}$ convient toujours. Ou bien : $\frac{${a}}{${b}}=\frac{${2 * a * d}}{${2 * b * d}}$ et $\frac{${c}}{${d}}=\frac{${2 * b * c}}{${2 * b * d}}$, et $\frac{${2 * a * d + 1}}{${2 * b * d}}$ est entre les deux. Ces deux fractions sont « voisines » : $${c}\times${b}-${a}\times${d}=1$, aucune fraction de dénominateur plus petit que $${b + d}$ ne s’intercale.`,
        'Mets-les au même dénominateur, puis double ce dénominateur pour faire de la place.',
        'Une fraction',
      );
    },
    () => {
      const n = R.int(4, 8);
      const k = R.pick([2, 3]);
      // 1 + 1/k + 1/k^2 + ... + 1/k^n
      const P = (k ** (n + 1) - 1),
        Q = (k - 1) * k ** n;
      return kfrac(T`Calcule et donne le résultat sous forme irréductible : $$1+\frac1{${k}}+\frac1{${k}^2}+\cdots+\frac1{${k}^{${n}}}$$`, P, Q, T`Notons $S$ cette somme. $\frac1{${k}}S=\frac1{${k}}+\cdots+\frac1{${k}^{${n + 1}}}$, donc $S-\frac1{${k}}S=1-\frac1{${k}^{${n + 1}}}$ : tous les autres termes s’annulent. Ainsi $\frac{${k - 1}}{${k}}S=\frac{${k ** (n + 1) - 1}}{${k ** (n + 1)}}$ et $S=${ft(P, Q)}$. (C’est une somme ${B('géométrique')} ; elle tend vers $${ft(k, k - 1)}$ quand $n$ grandit.)`, 'Multiplie la somme par 1/k et soustrais : presque tout disparaît.');
    },
  ];
  CU.addSkill({
    id: 'n3',
    region: 'num',
    name: 'Les balances',
    place: 'La Halle des Balances',
    glyph: '½',
    x: 500,
    y: 850,
    flavor: 'Sur ces plateaux, on ne pèse pas le métal : on pèse ses parts. Une fraction mal réduite fait pencher la balance.',
    law: T`$\frac ab+\frac cd=\frac{ad+bc}{bd}$, $\frac ab\times\frac cd=\frac{ac}{bd}$, $\frac ab\div\frac cd=\frac ab\times\frac dc$. On simplifie jusqu’à la forme irréductible.`,
    lessons: [
      T`<p>Pour ${B('additionner')} deux fractions, on les écrit avec un ${B('même dénominateur')}, puis on ajoute les numérateurs : $\frac23+\frac14=\frac8{12}+\frac3{12}=\frac{11}{12}$.</p>
<p>Pour ${B('multiplier')} : $\frac ab\times\frac cd=\frac{ac}{bd}$. Pour ${B('diviser')} : on multiplie par l’inverse, $\frac ab\div\frac cd=\frac ab\times\frac dc$.</p>
<p>Prendre « les $\frac34$ de $60$ », c’est calculer $\frac34\times60=45$.</p>`,
      T`<p>Les ${B('priorités')} s’appliquent : parenthèses, puis multiplications et divisions, puis additions et soustractions.</p>
<p>${B('Comparer')} : avec des dénominateurs positifs, $\frac ab<\frac cd\iff ad<bc$ (produits en croix).</p>
<p>« $\frac23$ ${B('du reste')} » s’applique à ce qui reste, pas au total : après avoir pris $\frac14$, il reste $\frac34$, et $\frac23$ de ce reste font $\frac23\times\frac34=\frac12$ du total.</p>`,
      T`<p>Quelques constructions au-delà de la seconde :</p><ul><li>${B('Fractions continues')} : $1+\cfrac{1}{2+\cfrac{1}{3}}$ se calcule de bas en haut.</li><li>${B('Sommes télescopiques')} : $\frac1{k(k+1)}=\frac1k-\frac1{k+1}$, et dans la somme presque tout s’annule.</li><li>${B('Sommes géométriques')} : $S=1+q+\cdots+q^n$ vérifie $S-qS=1-q^{n+1}$.</li><li>Entre deux fractions il y en a toujours une autre, par exemple la ${B('médiante')} $\frac{a+c}{b+d}$.</li></ul>`,
    ],
    methods: [
      T`<ol class="meth"><li>Somme : cherche un dénominateur commun (le plus petit multiple commun, ou le produit), transforme chaque fraction, ajoute les numérateurs.</li><li>Produit : numérateurs ensemble, dénominateurs ensemble — simplifie avant de multiplier.</li><li>Quotient : retourne la seconde fraction et multiplie.</li><li>Simplifie à la fin : la réponse doit être irréductible.</li></ol><p class="tip"><b>Saisie</b> — écris <code>-7/12</code> ; un entier s’écrit sans barre.</p><p class="pit"><b>Piège</b> — $\frac23+\frac14\neq\frac37$ : on n’ajoute jamais les dénominateurs.</p>`,
      T`<ol class="meth"><li>Repère les priorités et souligne ce qui se calcule en premier.</li><li>Pour comparer, ramène au même dénominateur ou compare les produits en croix.</li><li>Pour « une fraction du reste », calcule d’abord le reste ($1-\frac ab$), puis multiplie.</li></ol>`,
      T`<ol class="meth"><li>Fraction continue : de bas en haut, en utilisant $\frac1{p/q}=\frac qp$.</li><li>Somme de nombreux termes : cherche une écriture en différence (télescopage) ou multiplie par la raison (somme géométrique).</li><li>Entre deux fractions : la médiante, ou un dénominateur commun doublé.</li></ol>`,
    ],
    gen: [CU.oneOf(...N3A), CU.oneOf(...N3B), CU.oneOf(...N3C)],
  });

  /* ================= N4 — Les soufflets (puissances, notation scientifique) ================= */
  const decT = (x) => String(+x.toFixed(8)).replace('.', '{,}');
  // écriture décimale de m × 10^e (m entier) avec séparateurs de milliers
  const bigDec = (m, e) => {
    if (e < 0) return dtex(m, -e);
    const s = String(m) + '0'.repeat(e);
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, '\\,');
  };
  const N4A = [
    () => {
      const b = R.pick([2, 3, 5, 7, 10, 'x']);
      const t = R.int(0, 3);
      const m = R.nz(-6, 9),
        n = R.nz(-6, 9),
        p = R.nz(-5, 6);
      const B0 = String(b);
      const pe = (e) => B0 + '^{' + e + '}';
      const [tex, k, why] =
        t === 0
          ? [pe(m) + '\\times ' + pe(n), m + n, T`$a^m\times a^n=a^{m+n}$ : $${m}+${n < 0 ? '(' + n + ')' : n}=${m + n}$.`]
          : t === 1
            ? ['\\dfrac{' + pe(m) + '}{' + pe(n) + '}', m - n, T`$\frac{a^m}{a^n}=a^{m-n}$ : $${m}-${n < 0 ? '(' + n + ')' : n}=${m - n}$.`]
            : t === 2
              ? ['\\left(' + pe(m) + '\\right)^{' + n + '}', m * n, T`$(a^m)^n=a^{mn}$ : $${m}\times${n < 0 ? '(' + n + ')' : n}=${m * n}$.`]
              : ['\\dfrac{' + pe(m) + '\\times ' + pe(n) + '}{' + pe(p) + '}', m + n - p, T`$${m}+${n < 0 ? '(' + n + ')' : n}-${p < 0 ? '(' + p + ')' : p}=${m + n - p}$.`];
      return K.num(T`Écris sous la forme $${B0}^k$${b === 'x' ? T` ($x\neq0$)` : ''} et donne l’exposant $k$ : $$${tex}$$`, k, why, 'Produit : on ajoute les exposants. Quotient : on soustrait. Puissance de puissance : on multiplie.', '$k$');
    },
    () => {
      let m;
      do m = R.int(11, 99);
      while (m % 10 === 0);
      const e = R.pick([-7, -6, -5, -4, -3, -2, 3, 4, 5, 6, 7, 8, 9]);
      const d = bigDec(m, e - 1);
      return K.nums(T`Écris ce nombre en ${B('notation scientifique')} $a\times10^n$, avec $1\leqslant a<10$ : $$${d}$$`, ['$a$', '$n$'], [m / 10, e], T`$${d}=${decT(m / 10)}\times10^{${e}}$ : on place la virgule après le premier chiffre non nul ($${decT(m / 10)}$), puis on compte de combien de rangs on l’a déplacée${e < 0 ? ' vers la droite : l’exposant est négatif' : ' vers la gauche'}.`, 'a a un seul chiffre non nul avant la virgule. Un nombre plus petit que 1 a un exposant négatif.', { inline: true });
    },
    () =>
      R.pick([
        () => {
          const k = R.int(1, 5);
          return convEx(T`Donne l’écriture décimale de $$10^{-${k}}$$`, 10 ** -k, T`$10^{-${k}}=\frac1{10^{${k}}}=${dtex(1, k)}$ : le $1$ est au ${k === 1 ? 'premier' : k + '<sup>e</sup>'} rang après la virgule.`, 'Un exposant négatif donne un inverse : 10⁻ⁿ = 1/10ⁿ.');
        },
        () => {
          const b = R.pick([2, 3, 4, 5, 6]),
            k = R.int(1, b === 2 ? 5 : 3);
          return K.frac(T`Écris sous forme de fraction : $$${b}^{-${k}}$$`, 1, b ** k, T`$${b}^{-${k}}=\frac1{${b}^{${k}}}=\frac1{${b ** k}}$.`, 'a⁻ⁿ est l’inverse de aⁿ.');
        },
        () => {
          const b = R.int(2, 5),
            k = R.pick([2, 3, 4]);
          const neg = R.int(0, 1);
          return K.num(T`Calcule : $$${neg ? '-' + b + '^{' + k + '}' : '(-' + b + ')^{' + k + '}'}$$`, neg ? -(b ** k) : (-b) ** k, neg ? T`L’exposant ne porte que sur $${b}$ : $-${b}^{${k}}=-(${b}^{${k}})=${-(b ** k)}$.` : T`L’exposant porte sur $-${b}$ (parenthèses) : $(-${b})^{${k}}=${(-b) ** k}$ (${k % 2 ? 'exposant impair : signe −' : 'exposant pair : signe +'}).`, 'Regarde sur quoi porte l’exposant : avec ou sans parenthèses ?');
        },
      ])(),
  ];
  const N4B = [
    () => {
      const b = R.pick([2, 3, 5, 10]),
        p = R.nz(-5, 7),
        q = R.nz(-4, 5),
        r = R.int(2, 3),
        s = R.nz(-6, 8);
      const k = p + q * r - s;
      return K.num(T`Écris sous la forme $${b}^k$ et donne $k$ : $$\dfrac{${b}^{${p}}\times\left(${b}^{${q}}\right)^{${r}}}{${b}^{${s}}}$$`, k, T`$\left(${b}^{${q}}\right)^{${r}}=${b}^{${q * r}}$, puis numérateur $${b}^{${p}+${q * r < 0 ? '(' + q * r + ')' : q * r}}=${b}^{${p + q * r}}$, puis quotient : $k=${p + q * r}-${s < 0 ? '(' + s + ')' : s}=${k}$.`, 'Une règle à la fois : puissance de puissance, produit, quotient.', '$k$');
    },
    () => {
      const M = [12, 15, 2, 25, 3, 4, 5, 6, 8].map((x) => (x < 10 ? x * 10 : x));
      const m1 = R.pick(M),
        m2 = R.pick(M),
        e1 = R.int(-8, 9),
        e2 = R.int(-8, 9);
      let v = (m1 * m2) / 100,
        e = e1 + e2;
      if (v >= 10) (v /= 10), e++;
      return K.nums(T`Calcule et donne le résultat en notation scientifique $a\times10^n$ : $$\left(${decT(m1 / 10)}\times10^{${e1}}\right)\times\left(${decT(m2 / 10)}\times10^{${e2}}\right)$$`, ['$a$', '$n$'], [+v.toFixed(6), e], T`On regroupe : $${decT(m1 / 10)}\times${decT(m2 / 10)}=${decT((m1 * m2) / 100)}$ et $10^{${e1}}\times10^{${e2}}=10^{${e1 + e2}}$. ${(m1 * m2) / 100 >= 10 ? T`Comme $${decT((m1 * m2) / 100)}\geqslant10$, on écrit $${decT((m1 * m2) / 100)}=${decT(v)}\times10$ : ` : ''}Résultat : $${decT(v)}\times10^{${e}}$.`, 'Multiplie les nombres entre eux, les puissances de 10 entre elles, puis remets a entre 1 et 10.', { inline: true });
    },
    () => {
      const p = R.nz(-3, 4),
        q = R.nz(-3, 3),
        r = R.int(2, 3),
        s = R.nz(-5, 5),
        t = R.nz(-5, 5);
      const A = p * r + s,
        Bb = q * r + t;
      return K.nums(T`Pour $a\neq0$ et $b\neq0$, écris sous la forme $a^m b^n$ : $$\left(a^{${p}}b^{${q}}\right)^{${r}}\times a^{${s}}b^{${t}}$$`, ['$m$', '$n$'], [A, Bb], T`$\left(a^{${p}}b^{${q}}\right)^{${r}}=a^{${p * r}}b^{${q * r}}$ (la puissance porte sur chaque facteur). Puis $m=${p * r}+${s < 0 ? '(' + s + ')' : s}=${A}$ et $n=${q * r}+${t < 0 ? '(' + t + ')' : t}=${Bb}$.`, '(ab)ⁿ = aⁿbⁿ : la puissance s’applique à chaque facteur.', { inline: true });
    },
    () => {
      const E = R.int(40, 90);
      let ts;
      do {
        ts = [E + R.int(-6, 6), 2 * R.int(Math.ceil((E - 6) / 2), Math.floor((E + 6) / 2)), 3 * R.int(Math.ceil((E - 6) / 3), Math.floor((E + 6) / 3)), 4 * R.int(Math.ceil((E - 6) / 4), Math.floor((E + 6) / 4))];
      } while (new Set(ts).size < 4);
      const big = R.int(0, 1);
      const items = ts.map((t, i) => ({ t, tex: (2 ** (i + 1)) + '^{' + t / (i + 1) + '}' }));
      const ord = items.slice().sort((x, y) => (big ? y.t - x.t : x.t - y.t));
      return K.choice(T`Lequel de ces nombres est le plus ${big ? 'grand' : 'petit'} ?`, ord.map((x) => '$' + x.tex + '$'), T`On écrit tout en puissances de $2$ : ` + items.map((x) => T`$${x.tex}=2^{${x.t}}$`).join(', ') + T`. La plus ${big ? 'grande' : 'petite'} puissance de $2$ est $2^{${ord[0].t}}$.`, '4 = 2², 8 = 2³, 16 = 2⁴ : ramène tout à la même base.');
    },
  ];
  const N4C = [
    () => {
      const a = R.pick([2, 3, 7, 8, 4, 9, 12, 13, 17]),
        n = R.int(50, 2026);
      const cyc = [];
      let x = a % 10;
      while (!cyc.includes(x)) cyc.push(x), (x = (x * a) % 10);
      const L = cyc.length,
        r = ((n - 1) % L) + 1,
        ans = cyc[r - 1];
      return K.num(T`Quel est le chiffre des unités de $${a}^{${n}}$ ?`, ans, T`Seul le chiffre des unités de $${a}$ compte. Les chiffres des unités des puissances successives forment un cycle : ` + cyc.map((c, i) => T`$${a}^{${i + 1}}\to${c}$`).join(', ') + T`, puis cela recommence (période $${L}$). Or $${n}=${L}\times${Math.floor((n - 1) / L)}+${r}$, donc $${a}^{${n}}$ a le même chiffre des unités que $${a}^{${r}}$ : $${ans}$.`, 'Calcule les chiffres des unités de a, a², a³, a⁴… et repère quand ça se répète.', 'Chiffre');
    },
    () => {
      const base = R.pick([2, 3]);
      const a = R.int(1, 8),
        b = R.int(1, 6),
        c = R.int(0, 12);
      const [B2, B3] = base === 2 ? [4, 8] : [9, 27];
      const x = 2 * a + 3 * b - c;
      return K.num(T`Résous dans les entiers : $$${base}^x=\dfrac{${B2}^{${a}}\times${B3}^{${b}}}{${base}^{${c}}}$$`, x, T`$${B2}=${base}^2$ et $${B3}=${base}^3$ : le membre de droite vaut $${base}^{${2 * a}}\times${base}^{${3 * b}}\div${base}^{${c}}=${base}^{${x}}$. Deux puissances de $${base}$ égales ont le même exposant : $x=${x}$.`, `Écris tout en puissances de ${base}.`, '$x$');
    },
    () => {
      const n = R.int(10, 99);
      const v = R.pick([
        { q: T`2^{${n}}+2^{${n}}`, b: 2, k: n + 1, s: T`$2^{${n}}+2^{${n}}=2\times2^{${n}}=2^{${n + 1}}$.` },
        { q: T`3^{${n}}+3^{${n}}+3^{${n}}`, b: 3, k: n + 1, s: T`$3\times3^{${n}}=3^{${n + 1}}$.` },
        { q: T`4^{${n}}+4^{${n}}`, b: 2, k: 2 * n + 1, s: T`$4^{${n}}=2^{${2 * n}}$, donc la somme vaut $2\times2^{${2 * n}}=2^{${2 * n + 1}}$.` },
        { q: T`2^{${n}}+2^{${n}}+2^{${n}}+2^{${n}}`, b: 2, k: n + 2, s: T`$4\times2^{${n}}=2^2\times2^{${n}}=2^{${n + 2}}$.` },
        { q: T`8^{${n}}+8^{${n}}`, b: 2, k: 3 * n + 1, s: T`$8^{${n}}=2^{${3 * n}}$, donc la somme vaut $2^{${3 * n + 1}}$.` },
      ]);
      return K.num(T`Écris sous la forme $${v.b}^k$ et donne $k$ : $$${v.q}$$`, v.k, v.s + T` Attention : $2^{${n}}+2^{${n}}\neq2^{${2 * n}}$, on n’ajoute pas les exposants d’une ${B('somme')}.`, 'Une somme de termes égaux est un produit : x + x = 2x.', '$k$');
    },
    () => {
      let a, b;
      do {
        a = R.int(3, 20);
        b = R.int(3, 20);
      } while (a === b);
      const m = Math.min(a, b),
        rest = a > b ? 2 ** (a - b) : 5 ** (b - a);
      const digits = m + String(rest).length;
      return K.num(T`Combien de chiffres l’entier $2^{${a}}\times5^{${b}}$ a-t-il ?`, digits, T`$2^{${a}}\times5^{${b}}=(2\times5)^{${m}}\times${a > b ? '2^{' + (a - b) + '}' : '5^{' + (b - a) + '}'}=10^{${m}}\times${rest}$. Multiplier par $10^{${m}}$ ajoute $${m}$ zéros à $${rest}$ (${String(rest).length} chiffre${String(rest).length > 1 ? 's' : ''}) : $${String(rest).length}+${m}=${digits}$ chiffres.`, 'Regroupe des paires 2 × 5 = 10.', 'Nombre de chiffres');
    },
  ];
  CU.addSkill({
    id: 'n4',
    region: 'num',
    name: 'Les soufflets',
    place: 'Les Grands Soufflets',
    glyph: 'xⁿ',
    x: 625,
    y: 600,
    flavor: 'Chaque coup de soufflet multiplie la chaleur. Dix coups, et la forge brûle mille fois plus fort — ou mille fois moins, si l’on aspire.',
    law: T`$a^m\times a^n=a^{m+n}$, $\frac{a^m}{a^n}=a^{m-n}$, $(a^m)^n=a^{mn}$, $(ab)^n=a^nb^n$, $a^{-n}=\frac1{a^n}$, $a^0=1$ ($a\neq0$). Notation scientifique : $a\times10^n$ avec $1\leqslant a<10$.`,
    lessons: [
      T`<p>Pour $a\neq0$ et $n$ entier : $a^n=a\times\cdots\times a$ ($n$ facteurs), $a^0=1$ et $a^{-n}=\frac1{a^n}$.</p>
<p>Règles : $$a^m\times a^n=a^{m+n}\qquad\frac{a^m}{a^n}=a^{m-n}\qquad(a^m)^n=a^{mn}\qquad(ab)^n=a^nb^n.$$</p>
<p>${B('Notation scientifique')} : tout décimal non nul s’écrit $a\times10^n$ avec $1\leqslant a<10$. $0{,}00034=3{,}4\times10^{-4}$ et $52\,000\,000=5{,}2\times10^7$.</p>
<p class="ex">Attention : $-3^2=-9$ mais $(-3)^2=9$.</p>`,
      T`<p>Pour calculer en notation scientifique, on regroupe les nombres d’un côté, les puissances de $10$ de l’autre, puis on remet $a$ entre $1$ et $10$ : $(3\times10^4)\times(5\times10^{-7})=15\times10^{-3}=1{,}5\times10^{-2}$.</p>
<p>Pour ${B('comparer')} des puissances, on les écrit dans une même base : $8^{20}=(2^3)^{20}=2^{60}$.</p>`,
      T`<p>Au-delà de la seconde :</p><ul><li>une ${B('somme')} de puissances n’obéit à aucune règle d’exposants : $2^n+2^n=2\times2^n=2^{n+1}$ ;</li><li>les chiffres des unités des puissances successives sont ${B('périodiques')} : on travaille « modulo $10$ » ;</li><li>$2\times5=10$ : regrouper ces paires dit combien un nombre a de chiffres.</li></ul>`,
    ],
    methods: [
      T`<ol class="meth"><li>Identifie la règle : produit (on ajoute), quotient (on soustrait), puissance de puissance (on multiplie).</li><li>Attention aux exposants négatifs : $3-(-2)=5$.</li><li>Notation scientifique : place la virgule après le premier chiffre non nul et compte les rangs.</li></ol><p class="tip"><b>Saisie</b> — dans « $a$ » écris <code>3,4</code> ; dans « $n$ », l’exposant, par exemple <code>-4</code>.</p><p class="pit"><b>Piège</b> — $0{,}005=5\times10^{-3}$, pas $5\times10^{3}$.</p>`,
      T`<ol class="meth"><li>Calcule une règle à la fois, en écrivant chaque étape.</li><li>Notation scientifique : nombres ensemble, puissances de $10$ ensemble, puis on corrige si $a\geqslant10$.</li><li>Comparer des puissances : même base d’abord.</li></ol><p class="pit"><b>Piège</b> — $(a^2b)^3=a^6b^3$ : la puissance porte aussi sur $b$.</p>`,
      T`<ol class="meth"><li>Chiffre des unités : liste les unités de $a,a^2,a^3,\dots$ jusqu’au retour, puis prends le reste de l’exposant.</li><li>Équation entre puissances : même base des deux côtés, puis égalité des exposants.</li><li>Somme de termes égaux : c’est un produit.</li></ol>`,
    ],
    gen: [CU.oneOf(...N4A), CU.oneOf(...N4B), CU.oneOf(...N4C)],
  });

  /* ================= N5 — Le creuset (racines carrées, x² = a) ================= */
  const SQF = [2, 3, 5, 6, 7];
  const rt = (n) => {
    const [k, m] = CU.sqrtSimp(n);
    return m === 1 ? String(k) : (k === 1 ? '' : k) + '\\sqrt{' + m + '}';
  };
  const N5A = [
    () =>
      R.pick([
        () => {
          const m = R.pick(SQF),
            s = R.int(1, 4),
            t = R.int(1, 5);
          return K.num(T`Calcule : $$\sqrt{${m * s * s}}\times\sqrt{${m * t * t}}$$`, m * s * t, T`$\sqrt a\times\sqrt b=\sqrt{ab}$ : $\sqrt{${m * s * s}\times${m * t * t}}=\sqrt{${m * m * s * s * t * t}}=${m * s * t}$.`, '√a × √b = √(ab), pour a et b positifs.');
        },
        () => {
          const m = R.pick(SQF),
            u = R.int(2, 9);
          return K.num(T`Calcule : $$\frac{\sqrt{${m * u * u}}}{\sqrt{${m}}}$$`, u, T`$\frac{\sqrt a}{\sqrt b}=\sqrt{\frac ab}$ : $\sqrt{\frac{${m * u * u}}{${m}}}=\sqrt{${u * u}}=${u}$.`, '√a / √b = √(a/b).');
        },
      ])(),
    () => {
      const m = R.pick(SQF),
        k = R.int(2, 9);
      return K.nums(T`Écris $\sqrt{${k * k * m}}$ sous la forme $k\sqrt m$, avec $k$ et $m$ entiers et $m$ le plus petit possible.`, ['$k$', '$m$'], [k, m], T`$${k * k * m}=${k * k}\times${m}$ et $${k * k}$ est un carré : $\sqrt{${k * k * m}}=\sqrt{${k * k}}\times\sqrt{${m}}=${k}\sqrt{${m}}$.`, 'Cherche le plus grand carré parfait (4, 9, 16, 25…) qui divise le nombre.', { inline: true });
    },
    () => {
      const t = R.pick([0, 0, 1, 1, 2, 3]);
      const a = t === 0 ? R.int(1, 15) ** 2 : t === 1 ? R.pick([2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 15, 18, 20]) : t === 2 ? 0 : -R.int(1, 30);
      const vals = a > 0 ? [-Math.sqrt(a), Math.sqrt(a)] : a === 0 ? [0] : [];
      return K.set(
        T`Résous dans $\mathbb R$ : $$x^2=${a}$$`,
        vals,
        a > 0 ? T`Si $a>0$, l’équation $x^2=a$ a deux solutions, $\sqrt a$ et $-\sqrt a$ : ici $${rt(a)}$ et $-${rt(a)}$. (Oublier $-${rt(a)}$ est l’erreur la plus fréquente.)` : a === 0 ? T`$x^2=0$ a une seule solution : $0$.` : T`Un carré est toujours positif ou nul : $x^2=${a}$ n’a ${B('aucune')} solution réelle.`,
        'Un carré est positif. Et (−3)² = 3² : deux nombres opposés ont le même carré.',
      );
    },
    () => {
      const a = R.int(2, 12);
      return K.num(T`Calcule : $$\sqrt{(-${a})^2}$$`, a, T`$(-${a})^2=${a * a}$ et $\sqrt{${a * a}}=${a}$. Une racine carrée est toujours positive : $\sqrt{x^2}=|x|$, pas $x$.`, 'Calcule d’abord le carré.');
    },
  ];
  const N5B = [
    () => {
      const m = R.pick([2, 3, 5]);
      const ks = [R.int(1, 5), R.int(2, 6), R.int(1, 4)],
        sg = [1, R.pick([1, -1]), R.pick([1, -1])];
      const c = ks.reduce((s, k, i) => s + sg[i] * k, 0);
      if (c === 0) return N5B[0]();
      const tex = ks.map((k, i) => (i ? (sg[i] > 0 ? '+' : '-') : '') + '\\sqrt{' + k * k * m + '}').join('');
      return K.num(T`Écris sous la forme $c\sqrt{${m}}$ et donne $c$ : $$${tex}$$`, c, T`On simplifie chaque racine : ` + ks.map((k) => T`$\sqrt{${k * k * m}}=${k === 1 ? '' : k}\sqrt{${m}}$`).join(', ') + T`. Total : $(${ks.map((k, i) => (i ? (sg[i] > 0 ? '+' : '-') : '') + k).join('')})\sqrt{${m}}=${c}\sqrt{${m}}$. Attention : $\sqrt a+\sqrt b\neq\sqrt{a+b}$, on ne peut additionner que des racines « semblables ».`, `Fais apparaître √${m} dans chaque terme.`, '$c$');
    },
    () => {
      const m = R.pick([2, 3, 5, 6, 7]),
        k = R.int(1, 6);
      return K.num(T`Écris sans racine au dénominateur, sous la forme $k\sqrt{${m}}$, et donne $k$ : $$\frac{${k * m}}{\sqrt{${m}}}$$`, k, T`On multiplie en haut et en bas par $\sqrt{${m}}$ : $\frac{${k * m}\sqrt{${m}}}{\sqrt{${m}}^2}=\frac{${k * m}\sqrt{${m}}}{${m}}=${k === 1 ? '' : k}\sqrt{${m}}$.`, 'Multiplie numérateur et dénominateur par la racine du dénominateur.', '$k$');
    },
    CU.needs(['f2'], () =>
      R.pick([
        () => {
          const a = R.int(2, 9),
            b = R.pick([2, 3, 5, 6, 7, 10, 11]);
          return K.num(T`Calcule : $$\left(${a}+\sqrt{${b}}\right)\left(${a}-\sqrt{${b}}\right)$$`, a * a - b, T`C’est $(x+y)(x-y)=x^2-y^2$ avec $x=${a}$ et $y=\sqrt{${b}}$ : $${a * a}-${b}=${a * a - b}$. Les racines disparaissent : c’est l’idée de la « quantité conjuguée ».`, 'Identité remarquable (a + b)(a − b).');
        },
        () => {
          let a, b;
          do {
            a = R.int(3, 15);
            b = R.int(2, 14);
          } while (a === b);
          return K.num(T`Calcule : $$\left(\sqrt{${a}}+\sqrt{${b}}\right)\left(\sqrt{${a}}-\sqrt{${b}}\right)$$`, a - b, T`$(\sqrt{${a}})^2-(\sqrt{${b}})^2=${a}-${b}=${a - b}$.`, 'Identité remarquable (a + b)(a − b).');
        },
      ])(),
    ),
    () => {
      const a = R.nz(-6, 6),
        t = R.pick([0, 1, 1, 2]);
      const b = t === 0 ? R.int(1, 8) ** 2 : t === 1 ? R.pick([2, 3, 5, 6, 7, 10]) : -R.int(1, 9);
      const vals = b > 0 ? [a - Math.sqrt(b), a + Math.sqrt(b)] : [];
      const lhs = a > 0 ? `(x-${a})^2` : `(x+${-a})^2`;
      return K.set(T`Résous dans $\mathbb R$ : $$${lhs}=${b}$$`, vals, b > 0 ? T`$X^2=${b}$ avec $X=x${a > 0 ? '-' + a : '+' + -a}$ : $X=${rt(b)}$ ou $X=-${rt(b)}$, donc $x=${a}+${rt(b)}$ ou $x=${a}-${rt(b)}$${t === 0 ? T`, soit $x=${a + Math.sqrt(b)}$ ou $x=${a - Math.sqrt(b)}$` : ''}.` : T`Un carré ne peut pas valoir $${b}$ : aucune solution.`, 'Pose X = ce qui est au carré, et résous X² = b.');
    },
    () => {
      let a, b;
      do {
        a = R.int(1, 6);
        b = R.int(2, 50);
      } while (Math.sqrt(b) <= a || Number.isInteger(Math.sqrt(b)));
      return K.choice(T`Simplifie : $$\sqrt{\left(${a}-\sqrt{${b}}\right)^2}$$`, [T`$\sqrt{${b}}-${a}$`, T`$${a}-\sqrt{${b}}$`, T`$${a}+\sqrt{${b}}$`, T`$${a * a + b}$`], T`$\sqrt{x^2}=|x|$. Ici $\sqrt{${b}}>\sqrt{${a * a}}=${a}$, donc $${a}-\sqrt{${b}}<0$ et $|${a}-\sqrt{${b}}|=\sqrt{${b}}-${a}$. Une racine carrée n’est jamais négative.`, '√(x²) = |x|. Quel est le signe de ce qui est au carré ?');
    },
  ];
  const N5C = [
    CU.needs(['f2'], () => {
      let a, b, k, r;
      do {
        a = R.int(2, 12);
        b = R.int(2, 12);
        [k, r] = CU.sqrtSimp(a * b);
      } while (a === b || r === 1);
      return K.nums(T`Développe et écris sous la forme $p+q\sqrt r$ (entiers, $r$ le plus petit possible) : $$\left(\sqrt{${a}}+\sqrt{${b}}\right)^2$$`, ['$p$', '$q$', '$r$'], [a + b, 2 * k, r], T`$(\sqrt{${a}}+\sqrt{${b}})^2=${a}+2\sqrt{${a}}\sqrt{${b}}+${b}=${a + b}+2\sqrt{${a * b}}$${k > 1 ? T` et $\sqrt{${a * b}}=${rt(a * b)}$, d’où $${a + b}+${2 * k}\sqrt{${r}}$` : ''}.`, 'Identité (x + y)², puis simplifie la racine du double produit.', { inline: true });
    }),
    CU.needs(['f2'], () => {
      let p, q;
      do {
        p = R.int(3, 15);
        q = R.int(2, p - 1);
      } while (Number.isInteger(Math.sqrt(p)) || Number.isInteger(Math.sqrt(q)) || Number.isInteger(Math.sqrt(p * q)));
      const c = (p - q) * R.int(1, 4);
      const x = c / (p - q);
      return K.nums(T`Écris sans racine au dénominateur, sous la forme $x\sqrt{${p}}+y\sqrt{${q}}$ : $$\frac{${c}}{\sqrt{${p}}-\sqrt{${q}}}$$`, ['$x$', '$y$'], [x, x], T`On multiplie en haut et en bas par la ${B('quantité conjuguée')} $\sqrt{${p}}+\sqrt{${q}}$ : le dénominateur devient $(\sqrt{${p}})^2-(\sqrt{${q}})^2=${p - q}$. Donc $\frac{${c}(\sqrt{${p}}+\sqrt{${q}})}{${p - q}}=${x === 1 ? '' : x}\sqrt{${p}}+${x === 1 ? '' : x}\sqrt{${q}}$.`, '(√p − √q)(√p + √q) = p − q : la conjuguée fait disparaître les racines.', { inline: true });
    }),
    CU.needs(['f2'], () => {
      let x, y;
      do {
        y = R.int(1, 6);
        x = R.int(y + 1, 10);
      } while (Number.isInteger(Math.sqrt(x * y)));
      return K.nums(T`Trouve deux entiers $x>y>0$ tels que $$\sqrt{${x + y}+2\sqrt{${x * y}}}=\sqrt x+\sqrt y$$`, ['$x$', '$y$'], [x, y], T`On élève au carré : $(\sqrt x+\sqrt y)^2=x+y+2\sqrt{xy}$. Il suffit que $x+y=${x + y}$ et $xy=${x * y}$ : ce sont les deux nombres de somme $${x + y}$ et de produit $${x * y}$, soit $${x}$ et $${y}$. (Les deux membres sont positifs, donc l’égalité des carrés suffit.) Ce « radical imbriqué » se dénoue ainsi.`, 'Élève au carré : il faut x + y = … et xy = …', { inline: true });
    }),
    CU.needs(['f2'], () =>
      K.order(
        T`${B('Théorème.')} Pour tous réels $a>0$ et $b>0$ : $\sqrt{a+b}<\sqrt a+\sqrt b$. Remets la démonstration dans l’ordre.`,
        [T`Les deux membres sont positifs : il suffit de comparer leurs carrés.`, T`$\left(\sqrt a+\sqrt b\right)^2=a+2\sqrt{ab}+b$.`, T`$2\sqrt{ab}>0$, donc $\left(\sqrt a+\sqrt b\right)^2>a+b=\left(\sqrt{a+b}\right)^2$.`, T`Donc $\sqrt{a+b}<\sqrt a+\sqrt b$.`],
        [R.pick([T`$\sqrt{a+b}=\sqrt a+\sqrt b$ d’après les règles sur les racines.`, T`Pour $a=b=1$ : $\sqrt2<2$, donc c’est vrai.`])],
        T`Pour comparer deux nombres ${B('positifs')}, on peut comparer leurs carrés (la fonction carré est croissante sur $[0;+\infty[$). Le double produit $2\sqrt{ab}$ fait toute la différence.`,
        'Compare les carrés des deux membres.',
      ),
    ),
    () => {
      const m = R.pick([2, 3, 5]),
        k = R.nz(-3, 3);
      const good = T`$\sqrt{${m}}\times10^{${k}}$`;
      return K.choice(T`Simplifie : $$\sqrt{${m}\times10^{${2 * k}}}$$`, [good, T`$\sqrt{${m}}\times10^{${2 * k}}$`, T`$${m}\times10^{${k}}$`, T`$\sqrt{${m}}\times10^{${-k}}$`], T`$\sqrt{10^{${2 * k}}}=\sqrt{\left(10^{${k}}\right)^2}=10^{${k}}$ (un nombre positif). Donc $\sqrt{${m}\times10^{${2 * k}}}=\sqrt{${m}}\times10^{${k}}$. Par exemple $\sqrt{${m}\times10^{${2 * k}}}\approx${(Math.sqrt(m) * 10 ** k).toPrecision(4).replace('.', '{,}')}$.`, '√(a²b) = a√b pour a ≥ 0 : quelle puissance de 10 a pour carré 10^(2k) ?');
    },
    CU.needs(['f2'], () => {
      let a, b, c, d;
      do {
        const s = R.int(8, 20);
        a = R.int(1, s - 1);
        b = s - a;
        c = R.int(1, s - 1);
        d = s - c;
      } while (a * b === c * d || Math.min(a, b) === Math.min(c, d) || [a, b, c, d].some((x) => Number.isInteger(Math.sqrt(x))));
      const first = a * b > c * d;
      return K.choice(T`Sans calculatrice : lequel est le plus grand, $A=\sqrt{${a}}+\sqrt{${b}}$ ou $B=\sqrt{${c}}+\sqrt{${d}}$ ?`, [first ? '$A$' : '$B$', first ? '$B$' : '$A$', 'Ils sont égaux', 'On ne peut pas savoir sans calculatrice'], T`Ils sont positifs : comparons leurs carrés. $A^2=${a + b}+2\sqrt{${a * b}}$ et $B^2=${c + d}+2\sqrt{${c * d}}$. Même partie sans racine, $${a + b}$ ; et $${a * b}${first ? '>' : '<'}${c * d}$ donc $${first ? 'A' : 'B'}$ est le plus grand.`, 'Compare leurs carrés.');
    }),
  ];
  CU.addSkill({
    id: 'n5',
    region: 'num',
    name: 'Le creuset carré',
    place: 'Le Creuset',
    glyph: '√',
    x: 375,
    y: 600,
    flavor: 'Dans le creuset, un métal fondu se change en son carré. Retrouver ce qui y est entré demande une racine — et parfois deux.',
    law: T`Pour $a\geqslant0$, $\sqrt a$ est le nombre positif dont le carré vaut $a$. $\sqrt{ab}=\sqrt a\sqrt b$, $\sqrt{x^2}=|x|$, mais $\sqrt{a+b}\neq\sqrt a+\sqrt b$. Si $a>0$, $x^2=a$ a deux solutions : $\sqrt a$ et $-\sqrt a$.`,
    lessons: [
      T`<p>Pour $a\geqslant0$, $\sqrt a$ est le nombre ${B('positif')} dont le carré vaut $a$ : $\sqrt{49}=7$, et $(\sqrt a)^2=a$.</p>
<p>Pour $a,b\geqslant0$ : $\sqrt{ab}=\sqrt a\times\sqrt b$ et $\sqrt{\frac ab}=\frac{\sqrt a}{\sqrt b}$ ($b>0$). On en tire $\sqrt{50}=\sqrt{25\times2}=5\sqrt2$.</p>
<p>${B('L’équation')} $x^2=a$ : deux solutions $\pm\sqrt a$ si $a>0$, une seule ($0$) si $a=0$, aucune si $a<0$.</p>
<p class="ex">$\sqrt{x^2}=|x|$ : $\sqrt{(-5)^2}=5$.</p>`,
      T`<p>$\sqrt a+\sqrt b\neq\sqrt{a+b}$ ($\sqrt9+\sqrt{16}=7$ mais $\sqrt{25}=5$). On n’additionne que des racines semblables : $\sqrt{50}+\sqrt{18}=5\sqrt2+3\sqrt2=8\sqrt2$.</p>
<p>${B('Rendre rationnel un dénominateur')} : $\frac{6}{\sqrt3}=\frac{6\sqrt3}{3}=2\sqrt3$. Avec l’identité $(x+y)(x-y)=x^2-y^2$, $(5+\sqrt3)(5-\sqrt3)=22$ : les racines disparaissent.</p>
<p>$(x-a)^2=b$ se résout en posant $X=x-a$.</p>`,
      T`<p>La ${B('quantité conjuguée')} de $\sqrt p-\sqrt q$ est $\sqrt p+\sqrt q$ : leur produit vaut $p-q$. Elle débarrasse un dénominateur de ses racines.</p>
<p>Pour comparer deux nombres positifs, on compare leurs carrés. On en déduit $\sqrt{a+b}<\sqrt a+\sqrt b$ pour $a,b>0$.</p>
<p>${B('Radicaux imbriqués')} : $\sqrt{5+2\sqrt6}=\sqrt3+\sqrt2$ car $(\sqrt3+\sqrt2)^2=5+2\sqrt6$.</p>`,
    ],
    methods: [
      T`<ol class="meth"><li>Simplifier $\sqrt n$ : cherche le plus grand carré ($4,9,16,25,36,49\dots$) qui divise $n$.</li><li>Produit ou quotient de racines : regroupe sous une seule racine.</li><li>$x^2=a$ : regarde le signe de $a$ ; si $a>0$, n’oublie pas $-\sqrt a$.</li></ol><p class="tip"><b>Saisie</b> — <code>√7</code> s’obtient avec la touche √ ; sépare les solutions par « ; » : <code>-√7 ; √7</code>.</p>`,
      T`<ol class="meth"><li>Fais apparaître la même racine dans chaque terme, puis additionne les coefficients.</li><li>Dénominateur $\sqrt m$ : multiplie en haut et en bas par $\sqrt m$.</li><li>$\sqrt{x^2}=|x|$ : étudie le signe de $x$.</li></ol><p class="pit"><b>Piège</b> — $\sqrt{(2-\sqrt5)^2}=\sqrt5-2$, car $2-\sqrt5<0$.</p>`,
      T`<ol class="meth"><li>Dénominateur $\sqrt p-\sqrt q$ : multiplie par $\sqrt p+\sqrt q$.</li><li>Pour comparer deux sommes de racines positives : compare les carrés.</li><li>$\sqrt{s+2\sqrt t}$ : cherche $x,y$ de somme $s$ et de produit $t$.</li></ol>`,
    ],
    gen: [CU.oneOf(...N5A), CU.oneOf(...N5B), CU.oneOf(...N5C)],
  });

  /* ================= N6 — L'alliage impossible (rationnels, irrationnels) ================= */
  const SETS = ['\\mathbb N', '\\mathbb Z', '\\mathbb D', '\\mathbb Q', '\\mathbb R'];
  const SETN = ['entiers naturels', 'entiers relatifs', 'décimaux', 'rationnels', 'réels'];
  const classify = () => {
    const c = R.int(0, 4);
    const k = R.int(2, 12);
    const items = [
      [() => [T`\sqrt{${k * k}}`, T`$\sqrt{${k * k}}=${k}$`], () => [T`\dfrac{${k * 3}}{3}`, T`$\frac{${3 * k}}{3}=${k}$`], () => [T`\left(\sqrt{${k}}\right)^2`, T`$\left(\sqrt{${k}}\right)^2=${k}$`], () => [T`\dfrac{\sqrt{${2 * k * k}}}{\sqrt2}`, T`$\frac{\sqrt{${2 * k * k}}}{\sqrt2}=\sqrt{${k * k}}=${k}$`]],
      [() => [T`-\dfrac{${4 * k}}{4}`, T`$-\frac{${4 * k}}{4}=-${k}$`], () => [T`-\sqrt{${k * k}}`, T`$-\sqrt{${k * k}}=-${k}$`], () => [T`${k - 1}-\sqrt{${(k + 2) ** 2}}`, T`$${k - 1}-${k + 2}=-3$`]],
      [() => {
        const q = R.pick([4, 8, 20, 25, 40, 50]);
        let p;
        do p = R.int(1, 3 * q);
        while (gcd(p, q) !== 1);
        return [T`\dfrac{${p}}{${q}}`, T`$\frac{${p}}{${q}}=${decT(p / q)}$ : division qui tombe juste`];
      }, () => {
        const I = R.int(101, 999);
        return I % 10 ? [dtex(I, 2), T`$${dtex(I, 2)}=\frac{${I}}{100}$`] : [dtex(I + 1, 2), T`$${dtex(I + 1, 2)}=\frac{${I + 1}}{100}$`];
      }],
      [() => {
        const q = R.pick([3, 6, 7, 9, 11, 12, 15]);
        let p;
        do p = R.int(1, 2 * q);
        while (gcd(p, q) !== 1);
        return [T`\dfrac{${p}}{${q}}`, T`$\frac{${p}}{${q}}$ est irréductible et $${q}$ a un facteur premier autre que $2$ et $5$ : pas décimal`];
      }, () => {
        const j = k % 3 ? k : k + 1;
        return [T`\sqrt{\dfrac{${j * j}}{${(j + 1) ** 2 * 9}}}`, T`$\sqrt{\frac{${j * j}}{${9 * (j + 1) ** 2}}}=\frac{${j}}{${3 * (j + 1)}}$, irréductible, avec un facteur $3$ au dénominateur : rationnel non décimal`];
      }],
      [() => [T`\sqrt{${R.pick([2, 3, 5, 6, 7, 10, 12, 18])}}`, T`la racine carrée d’un entier qui n’est pas un carré parfait est irrationnelle`], () => [T`\pi`, T`$\pi$ est irrationnel (Lambert, 1761)`], () => [T`${k}+\sqrt{${R.pick([2, 3, 5])}}`, T`un rationnel plus un irrationnel est irrationnel`], () => [T`\dfrac{\sqrt{${R.pick([8, 12, 18, 20])}}}{2}`, T`c’est un entier fois $\sqrt2$, $\sqrt3$ ou $\sqrt5$ divisé par $2$ : irrationnel`]],
    ];
    const [tex, why] = R.pick(items[c])();
    return { c, tex, why };
  };
  const N6A = [
    () => {
      const { c, tex, why } = classify();
      return K.choice(T`Quel est le ${B('plus petit')} des ensembles $\mathbb N\subset\mathbb Z\subset\mathbb D\subset\mathbb Q\subset\mathbb R$ qui contient $$${tex}\ ?$$`, [c, ...[0, 1, 2, 3, 4].filter((i) => i !== c)].map((i) => '$' + SETS[i] + '$ (' + SETN[i] + ')'), T`${why}. Le plus petit ensemble qui le contient est $${SETS[c]}$.${c === 4 ? T` On note $\mathbb R\setminus\mathbb Q$ l’ensemble des irrationnels.` : ''}`, 'Simplifie d’abord le nombre : une racine ou une fraction peut cacher un entier.');
    },
    () => {
      const dec = R.int(0, 1);
      let p, q, g;
      do {
        q = dec ? 2 ** R.int(0, 3) * 5 ** R.int(0, 2) : R.pick([3, 6, 7, 9, 12, 14, 15]);
        p = R.int(1, 4 * q);
        g = R.pick([3, 7, 9, 11, 13]);
      } while (gcd(p, q) !== 1 || q === 1);
      const P = p * g,
        Q = q * g;
      return K.choice(
        T`Le nombre $\dfrac{${P}}{${Q}}$ est-il un nombre ${B('décimal')} ?`,
        dec
          ? [T`Oui : $\frac{${P}}{${Q}}=\frac{${p}}{${q}}$ et $${q}$ n’a que $2$ et $5$ comme facteurs premiers`, T`Non : $${Q}$ est divisible par $${g}$`, T`Non : la division de $${P}$ par $${Q}$ ne tombe jamais juste`, T`Oui : tout quotient d’entiers est décimal`]
          : [T`Non : $\frac{${P}}{${Q}}=\frac{${p}}{${q}}$ irréductible et $${q}$ a un facteur premier autre que $2$ et $5$`, T`Oui : on peut simplifier par $${g}$`, T`Oui : tout quotient d’entiers est décimal`, T`On ne peut pas savoir sans poser la division`],
        T`Une fraction ${B('irréductible')} $\frac pq$ est décimale si et seulement si $q$ n’a pas d’autre facteur premier que $2$ et $5$ (car $10=2\times5$). Il faut donc ${B('d’abord simplifier')} : $\frac{${P}}{${Q}}=\frac{${p}}{${q}}${dec ? '=' + decT(p / q) : ''}$.`,
        'Simplifie, puis décompose le dénominateur.',
      );
    },
  ];
  const N6B = [
    () => {
      const t = R.int(0, 3);
      if (t === 0) {
        const d = R.int(1, 8);
        return kfrac(T`Écris sous forme de fraction irréductible : $$0{,}\overline{${d}}=0{,}${String(d).repeat(6)}\ldots$$`, d, 9, T`Soit $x=0{,}${String(d).repeat(3)}\ldots$ Alors $10x=${d}{,}${String(d).repeat(3)}\ldots$ et $10x-x=${d}$, donc $9x=${d}$ et $x=${fr2(d, 9)}$.`, 'Multiplie par 10 : la partie après la virgule ne change pas. Soustrais.');
      }
      if (t === 1) {
        let n;
        do n = R.int(1, 98);
        while (n % 11 === 0);
        const s = String(n).padStart(2, '0');
        return kfrac(T`Écris sous forme de fraction irréductible : $$0{,}\overline{${s}}=0{,}${s.repeat(4)}\ldots$$`, n, 99, T`Soit $x=0{,}${s}${s}\ldots$ La période a deux chiffres : $100x=${n}{,}${s}${s}\ldots$, donc $100x-x=${n}$, $99x=${n}$ et $x=${fr2(n, 99)}$.`, 'La période a deux chiffres : multiplie par 100.');
      }
      if (t === 2) {
        const a = R.int(1, 9),
          b = R.pick([...Array(10).keys()].filter((x) => x !== a && x !== 9 && x !== 0));
        return kfrac(T`Écris sous forme de fraction irréductible : $$0{,}${a}\overline{${b}}=0{,}${a}${String(b).repeat(5)}\ldots$$`, 10 * a + b - a, 90, T`Soit $x=0{,}${a}${b}${b}\ldots$ Alors $100x=${a}${b}{,}${b}${b}\ldots$ et $10x=${a}{,}${b}${b}\ldots$ : $100x-10x=${10 * a + b}-${a}=${10 * a + b - a}$, donc $x=${fr2(9 * a + b, 90)}$.`, 'Décale la virgule pour aligner deux écritures qui ont la même partie périodique.');
      }
      const a = R.int(1, 5),
        b = R.int(1, 8);
      return kfrac(T`Écris sous forme de fraction irréductible : $$${a}{,}\overline{${b}}=${a}{,}${String(b).repeat(6)}\ldots$$`, 9 * a + b, 9, T`$${a}{,}\overline{${b}}=${a}+0{,}\overline{${b}}=${a}+\frac{${b}}{9}=${ft(9 * a + b, 9)}$.`, 'Sépare la partie entière.');
    },
    () =>
      K.order(
        T`${B('Théorème.')} $\frac13$ n’est pas un nombre décimal. Remets la démonstration ${B('par l’absurde')} dans l’ordre.`,
        [T`Supposons que $\frac13$ soit décimal : $\frac13=\frac{a}{10^n}$ avec $a$ entier et $n$ entier naturel.`, T`Alors $10^n=3a$ : $10^n$ serait un multiple de $3$.`, T`Or la somme des chiffres de $10^n$ vaut $1$, qui n’est pas un multiple de $3$.`, T`Contradiction : $\frac13$ n’est pas décimal.`],
        [R.pick([T`$\frac13=0{,}333$, donc il est décimal.`, T`La calculatrice affiche une infinité de 3, donc $\frac13$ n’est pas décimal.`])],
        T`Un décimal s’écrit $\frac{a}{10^n}$. Si $\frac13$ en était un, $3$ diviserait une puissance de $10$ ; impossible ($10^n=2^n5^n$ n’a pas le facteur $3$). Un affichage de calculatrice, tronqué, ne prouve rien.`,
        'Un décimal s’écrit a/10ⁿ. Que deviendrait l’égalité 1/3 = a/10ⁿ ?',
      ),
    () => {
      const v = R.pick([
        { q: T`Laquelle de ces affirmations est ${B('vraie')} ?`, c: [T`La somme d’un rationnel et d’un irrationnel est toujours irrationnelle`, T`La somme de deux irrationnels est toujours irrationnelle`, T`Le produit de deux irrationnels est toujours irrationnel`, T`Le carré d’un irrationnel est toujours irrationnel`], s: T`Si $r+x=s$ avec $r,s$ rationnels, alors $x=s-r$ serait rationnel : donc $r+x$ est irrationnel. Les autres sont fausses : $\sqrt2+(-\sqrt2)=0$, $\sqrt2\times\sqrt2=2$, $(\sqrt2)^2=2$.` },
        { q: T`Laquelle de ces affirmations est ${B('fausse')} ?`, c: [T`Le produit de deux irrationnels est toujours irrationnel`, T`Le produit d’un rationnel non nul et d’un irrationnel est irrationnel`, T`L’inverse d’un irrationnel est irrationnel`, T`La somme d’un rationnel et d’un irrationnel est irrationnelle`], s: T`Contre-exemple : $\sqrt2\times\sqrt8=4$. Les trois autres sont vraies : si $rx=s$ avec $r\neq0$ rationnel, $x=\frac sr$ serait rationnel ; si $\frac1x=s$, $x=\frac1s$ serait rationnel ; si $r+x=s$, $x=s-r$ serait rationnel.` },
      ]);
      return K.choice(v.q, v.c, v.s, 'Pense à √2 et −√2, ou à √2 et √8.');
    },
  ];
  const N6C = [
    () =>
      K.order(
        T`${B('Théorème.')} $\sqrt2$ est irrationnel. Remets la démonstration ${B('par l’absurde')} dans l’ordre.`,
        [T`Supposons $\sqrt2=\frac pq$ avec $p,q$ entiers strictement positifs et la fraction irréductible.`, T`Alors $p^2=2q^2$ : $p^2$ est pair.`, T`Donc $p$ est pair (le carré d’un impair est impair) : $p=2k$.`, T`Alors $4k^2=2q^2$, soit $q^2=2k^2$ : $q$ est pair lui aussi.`, T`$p$ et $q$ sont pairs : la fraction n’était pas irréductible. Contradiction : $\sqrt2$ est irrationnel.`],
        [R.pick([T`$p^2$ est pair, donc $p^2=2k$ et $p=\sqrt{2k}$.`, T`$\sqrt2\approx1{,}41421356$ n’a pas de période visible, donc il est irrationnel.`])],
        T`Le cœur de la preuve : « $p^2$ pair $\Rightarrow p$ pair », qui se démontre par contraposée (si $p$ est impair, $p^2$ l’est). Ensuite on obtient que $p$ et $q$ sont pairs, ce qui contredit l’irréductibilité.`,
        'Suppose √2 = p/q irréductible, élève au carré, et montre que p et q sont pairs.',
      ),
    () => {
      const v = R.pick([
        { q: T`On adapte la preuve de l’irrationalité de $\sqrt2$ à $\sqrt3$ : $\sqrt3=\frac pq$ irréductible donne $p^2=3q^2$. Quel argument remplace « $p^2$ pair, donc $p$ pair » ?`, c: [T`Si $p^2$ est un multiple de $3$, alors $p$ aussi (sinon $p=3k\pm1$ et $p^2=3(3k^2\pm2k)+1$)`, T`$p^2$ est impair, donc $p$ est impair`, T`$3$ est premier, donc $p=3$`, T`$p^2=3q^2$ donc $p=3q$`], s: T`Si $p$ n’est pas multiple de $3$, $p=3k+1$ ou $3k-1$, et $p^2=9k^2\pm6k+1$ a pour reste $1$ : pas multiple de $3$. Par contraposée, $3\mid p^2\Rightarrow3\mid p$. Ensuite $p=3k$, $9k^2=3q^2$, $q^2=3k^2$ et $q$ est aussi multiple de $3$ : contradiction.` },
        { q: T`Pourquoi la même preuve ne montre-t-elle pas que $\sqrt4$ est irrationnel ?`, c: [T`« $p^2$ multiple de $4$ $\Rightarrow$ $p$ multiple de $4$ » est faux ($p=2$)`, T`Parce que $4$ n’est pas premier, donc $\sqrt4$ n’existe pas`, T`Parce que la preuve est fausse aussi pour $\sqrt2$`, T`Parce que $p^2=4q^2$ n’a pas de solution`], s: T`$\sqrt4=2=\frac21$ est rationnel, heureusement ! L’étape qui casse : $2^2=4$ est multiple de $4$ mais $2$ ne l’est pas. La preuve pour $\sqrt2$ utilisait précisément « $2\mid p^2\Rightarrow2\mid p$ », vrai parce que $2$ est premier.` },
        { q: T`On veut montrer : « si $x$ est irrationnel, alors $3x-2$ l’est aussi ». Quelle preuve est correcte ?`, c: [T`Par l’absurde : si $3x-2=r$ avec $r$ rationnel, alors $x=\frac{r+2}{3}$ est rationnel, contradiction`, T`Pour $x=\sqrt2$, $3\sqrt2-2$ est irrationnel, donc c’est vrai`, T`$3$ et $2$ sont rationnels, donc $3x-2$ est rationnel`, T`On montre la réciproque : si $3x-2$ est irrationnel, alors $x$ l’est`], s: T`On suppose le contraire de la conclusion et on obtient que $x$ serait rationnel (les rationnels sont stables par $+,-,\times,\div$). Un exemple ne prouve pas un « pour tout » ; la réciproque est un autre énoncé.` },
      ]);
      return K.choice(v.q, v.c, v.s, 'Cherche l’étape qui utilise une propriété des entiers.');
    },
    () => {
      const a = R.int(0, 6),
        b = R.int(0, 8);
      const P = 10 * a + b + 1;
      return kfrac(T`Écris sous forme de fraction irréductible : $$${a}{,}${b}\overline{9}=${a}{,}${b}999\ldots$$`, P, 10, T`Soit $x=${a}{,}${b}99\ldots$ Alors $100x=${100 * a + 10 * b + 9}{,}99\ldots$ et $10x=${10 * a + b}{,}99\ldots$, donc $90x=${10 * (10 * a + b) + 9}-${10 * a + b}=${9 * P}$ et $x=\frac{${9 * P}}{90}=${ft(P, 10)}$. Ainsi $${a}{,}${b}\overline{9}=${decT(P / 10)}$ : un décimal a ${B('deux')} écritures, dont une se termine par une infinité de $9$ (comme $0{,}\overline{9}=1$).`, 'Même méthode que pour toute écriture périodique.');
    },
    CU.needs(['f2'], () =>
      K.choice(
        T`On veut montrer que $\sqrt2+\sqrt3$ est irrationnel, sachant que $\sqrt6$ l’est. Quelle est la bonne idée ?`,
        [T`Si $\sqrt2+\sqrt3=r$ rationnel, alors $r^2=5+2\sqrt6$, donc $\sqrt6=\frac{r^2-5}2$ serait rationnel`, T`$\sqrt2$ et $\sqrt3$ sont irrationnels, donc leur somme aussi`, T`$\sqrt2+\sqrt3=\sqrt5$, qui est irrationnel`, T`$\sqrt2+\sqrt3\approx3{,}146$ n’est pas périodique`],
        T`On raisonne par l’absurde en élevant au carré : $(\sqrt2+\sqrt3)^2=2+2\sqrt6+3$. Si la somme était un rationnel $r$, alors $\sqrt6=\frac{r^2-5}{2}$ le serait aussi. « Deux irrationnels ont une somme irrationnelle » est faux en général ($\sqrt2+(-\sqrt2)=0$) ; « $\sqrt2+\sqrt3=\sqrt5$ » confond $\sqrt{a+b}$ et $\sqrt a+\sqrt b$ ; une valeur approchée ne dit rien de la périodicité.`,
        'Élève au carré.',
      ),
    ),
  ];
  CU.addSkill({
    id: 'n6',
    region: 'num',
    name: 'L’alliage impossible',
    place: 'La Fonderie scellée',
    glyph: 'ℚ',
    x: 250,
    y: 350,
    flavor: 'Les Archivistes cherchaient deux lingots entiers dont le rapport donnerait la diagonale du carré. Ils ont cherché des siècles. Il n’y en a pas.',
    law: T`$\mathbb N\subset\mathbb Z\subset\mathbb D\subset\mathbb Q\subset\mathbb R$. Un rationnel s’écrit $\frac pq$ ; une fraction irréductible est décimale si et seulement si son dénominateur n’a que $2$ et $5$ pour facteurs premiers. $\frac13\notin\mathbb D$, $\sqrt2\notin\mathbb Q$.`,
    lessons: [
      T`<p>$\mathbb N$ : entiers naturels ; $\mathbb Z$ : entiers relatifs ; $\mathbb D$ : ${B('décimaux')}, de la forme $\frac{a}{10^n}$ ; $\mathbb Q$ : ${B('rationnels')}, de la forme $\frac pq$ ; $\mathbb R$ : tous les réels. Un réel non rationnel est ${B('irrationnel')} : $\sqrt2$, $\pi$.</p>
<p>Une fraction irréductible $\frac pq$ est décimale exactement quand $q$ n’a que $2$ et $5$ comme facteurs premiers : $\frac7{20}=0{,}35$, mais $\frac16$ ne l’est pas.</p>
<p class="ex">Avant de classer un nombre, on le simplifie : $\sqrt{49}=7\in\mathbb N$.</p>`,
      T`<p>Un rationnel a une écriture décimale ${B('finie ou périodique')} : $\frac3{11}=0{,}\overline{27}$. Réciproquement, une écriture périodique se convertit en fraction : $x=0{,}\overline{27}$, $100x-x=27$, $x=\frac{27}{99}=\frac3{11}$.</p>
<p>Si $r$ est rationnel et $x$ irrationnel, $r+x$ est irrationnel (sinon $x=(r+x)-r$ serait rationnel).</p>
<p>${B('Démonstration')} : $\frac13$ n’est pas décimal, car $3$ ne divise aucune puissance de $10$.</p>`,
      T`<p>${B('Démonstration')} : $\sqrt2$ est irrationnel (par l’absurde, avec $\frac pq$ irréductible et « $p^2$ pair $\Rightarrow p$ pair »). La même idée prouve que $\sqrt p$ est irrationnel pour tout nombre premier $p$.</p>
<p>Un décimal a deux écritures : $0{,}\overline9=1$, $2{,}4\overline9=2{,}5$.</p>`,
    ],
    methods: [
      T`<ol class="meth"><li>Simplifie le nombre (racine d’un carré, fraction réductible).</li><li>Entier ? Positif ($\mathbb N$) ou négatif ($\mathbb Z$).</li><li>Fraction irréductible : dénominateur avec seulement $2$ et $5$ → $\mathbb D$ ; sinon → $\mathbb Q$.</li><li>Racine d’un non-carré, $\pi$ → irrationnel ($\mathbb R$).</li></ol><p class="pit"><b>Piège</b> — $\frac{21}{60}$ a un $3$ au dénominateur, mais $\frac{21}{60}=\frac7{20}=0{,}35$ est décimal.</p>`,
      T`<ol class="meth"><li>Écriture périodique : appelle-la $x$, multiplie par $10^k$ ($k$ = longueur de la période), soustrais.</li><li>Pour une partie non périodique avant la période, décale d’abord la virgule.</li><li>Affirmation « toujours » : cherche un contre-exemple avec $\sqrt2$ et $-\sqrt2$, ou $\sqrt2$ et $\sqrt8$.</li></ol>`,
      T`<ol class="meth"><li>Irrationalité : par l’absurde, suppose $\frac pq$ irréductible.</li><li>Élève au carré et utilise une propriété de divisibilité ($2\mid p^2\Rightarrow2\mid p$).</li><li>Conclus par une contradiction avec l’irréductibilité.</li></ol>`,
    ],
    gen: [CU.oneOf(...N6A), CU.oneOf(...N6B), CU.oneOf(...N6C)],
  });

  /* ================= N7 — La règle infinie (droite réelle, intervalles, valeur absolue) ================= */
  const N0 = (a) => (a < 0 ? '(' + a + ')' : a);
  const xm = (a) => (a > 0 ? 'x-' + a : a < 0 ? 'x+' + -a : 'x');
  const ivOf = (lo, hi, lc, hc) => [{ lo, hi, lc, hc }];
  const randIv = () => {
    let a = R.int(-9, 6),
      b = R.int(a + 1, 10);
    const t = R.int(0, 5);
    if (t === 4) return ivOf(-Infinity, b, false, R.int(0, 1) === 1);
    if (t === 5) return ivOf(a, Infinity, R.int(0, 1) === 1, false);
    return ivOf(a, b, R.int(0, 1) === 1, R.int(0, 1) === 1);
  };
  const N7A = [
    () => {
      const a = R.int(-9, 5),
        b = R.int(a + 1, 12),
        t = R.int(0, 6);
      const F = [
        [T`${a}\leqslant x\leqslant ${b}`, `[${a} ; ${b}]`],
        [T`${a}<x\leqslant ${b}`, `]${a} ; ${b}]`],
        [T`${a}\leqslant x<${b}`, `[${a} ; ${b}[`],
        [T`x>${a}`, `]${a} ; +∞[`],
        [T`x\leqslant ${b}`, `]-∞ ; ${b}]`],
        [T`x<${b}`, `]-∞ ; ${b}[`],
        [T`x\geqslant ${a}`, `[${a} ; +∞[`],
      ][t];
      return K.interval(T`Écris sous forme d’intervalle l’ensemble des réels $x$ tels que $${F[0]}$.`, F[1], T`$${F[0]}\iff x\in${ivTex(F[1])}$. Le crochet est ${B('fermé')} (tourné vers le nombre) quand l’extrémité est incluse ($\leqslant$), ${B('ouvert')} quand elle est exclue ($<$) ; il est toujours ouvert du côté de l’infini.`, 'Inégalité large (≤) : crochet fermé. Stricte (<) : crochet ouvert.');
    },
    () => {
      const a = R.int(-8, 4),
        b = R.int(a + 2, 9);
      const lc = R.int(0, 1) === 1,
        hc = R.int(0, 1) === 1;
      const S = (lc ? '[' : ']') + a + ' ; ' + b + (hc ? ']' : '[');
      const inside = (x) => (x > a || (lc && x === a)) && (x < b || (hc && x === b));
      const cand = [a, b, a - 1, b + 1, a + 0.5, b - 0.5, (a + b) / 2, a - 0.5, b + 0.5];
      const good = R.pick(cand.filter(inside));
      const bad = R.shuffle([...new Set(cand.filter((x) => !inside(x)))]).slice(0, 3);
      const sh = (x) => '$' + decT(x) + '$';
      return K.choice(T`Lequel de ces nombres appartient à l’intervalle $${ivTex(S)}$ ?`, [good, ...bad].map(sh), T`$${ivTex(S)}$ contient les réels $x$ tels que $${a}${lc ? '\\leqslant ' : '<'}x${hc ? '\\leqslant ' : '<'}${b}$. $${decT(good)}$ convient ; ` + bad.map((x) => T`$${decT(x)}$ ${x === a || x === b ? 'est une extrémité exclue (crochet ouvert)' : 'est en dehors'}`).join(', ') + '.', 'Un crochet ouvert exclut l’extrémité.');
    },
    () => {
      const a = R.int(-20, 20) / R.pick([1, 1, 2]),
        b = R.int(-20, 20) / R.pick([1, 1, 2]);
      if (a === b) return N7A[2]();
      return K.num(T`Sur la droite graduée, quelle est la distance entre les points d’abscisses $${decT(a)}$ et $${decT(b)}$ ? (C’est $|${decT(a)}-${b < 0 ? '(' + decT(b) + ')' : decT(b)}|$.)`, Math.abs(a - b), T`La distance entre $a$ et $b$ est $|a-b|$ : $|${decT(a)}-${b < 0 ? '(' + decT(b) + ')' : decT(b)}|=|${decT(a - b)}|=${decT(Math.abs(a - b))}$.`, 'Une distance est positive : c’est la valeur absolue de la différence.', 'Distance');
    },
    () => {
      const t = R.pick([0, 0, 0, 1, 2]);
      const a = t === 0 ? R.int(1, 15) : t === 1 ? 0 : -R.int(1, 9);
      return K.set(T`Résous dans $\mathbb R$ l’équation $|x|=${a}$.`, a > 0 ? [-a, a] : a === 0 ? [0] : [], a > 0 ? T`$|x|$ est la distance de $x$ à $0$ : les deux réels à distance $${a}$ de $0$ sont $${a}$ et $-${a}$.` : a === 0 ? T`Seul $0$ est à distance $0$ de $0$.` : T`Une valeur absolue (une distance) n’est jamais négative : aucune solution.`, '|x| est la distance entre x et 0.');
    },
  ];
  const N7B = [
    () => {
      const a = R.int(-8, 8),
        r = R.int(1, 8),
        t = R.int(0, 3);
      const op = ['\\leqslant', '<', '\\geqslant', '>'][t];
      const tgt = [`[${a - r} ; ${a + r}]`, `]${a - r} ; ${a + r}[`, `]-∞ ; ${a - r}] ∪ [${a + r} ; +∞[`, `]-∞ ; ${a - r}[ ∪ ]${a + r} ; +∞[`][t];
      return K.interval(T`Écris sous forme d’intervalle (ou de réunion d’intervalles) l’ensemble des réels $x$ tels que $|${xm(a)}|${op}${r}$.`, tgt, T`$|${xm(a)}|$ est la distance entre $x$ et $${a}$. ${t < 2 ? T`Être à distance ${t ? 'strictement inférieure' : 'au plus'} $${r}$ de $${a}$, c’est être dans $${ivTex(tgt)}$ (centre $${a}$, rayon $${r}$).` : T`Être à distance ${t === 2 ? 'au moins' : 'strictement plus de'} $${r}$ de $${a}$, c’est être hors de l’intervalle centré en $${a}$ de rayon $${r}$ : $${ivTex(tgt)}$.`}`, `Place ${a} sur la droite et marque les points à distance ${r}.`);
    },
    () => {
      const a = R.int(-9, 9),
        r = R.int(1, 9);
      return K.set(T`Résous dans $\mathbb R$ l’équation $|${xm(a)}|=${r}$.`, [a - r, a + r], T`$|${xm(a)}|$ est la distance entre $x$ et $${a}$. Les deux réels à distance $${r}$ de $${a}$ sont $${a}-${r}=${a - r}$ et $${a}+${r}=${a + r}$.`, `Quels nombres sont à distance ${r} de ${a} ?`);
    },
    () => {
      let I, J;
      do {
        I = randIv();
        J = randIv();
      } while (CU.IV.same(I, J));
      const inter = R.int(0, 1) === 1;
      const res = inter ? CU.IV.intersect(I, J) : CU.IV.norm(I.concat(J));
      const sI = CU.IV.str(I),
        sJ = CU.IV.str(J),
        sR = CU.IV.str(res);
      return K.interval(T`On donne $I=${ivTex(sI)}$ et $J=${ivTex(sJ)}$. Écris $I${inter ? '\\cap ' : '\\cup '}J$.`, sR, T`${inter ? T`$I\cap J$ (« $I$ inter $J$ ») contient les réels qui sont ${B('à la fois')} dans $I$ et dans $J$` : T`$I\cup J$ (« $I$ union $J$ ») contient les réels qui sont dans $I$ ${B('ou')} dans $J$ (ou les deux)`} : $${ivTex(sR)}$. Représente les deux intervalles sur une même droite pour le voir.`, 'Dessine les deux intervalles l’un au-dessus de l’autre sur une droite graduée.');
    },
    () => {
      let a, b;
      do {
        a = R.int(-10, 8);
        b = R.int(a + 1, 12);
      } while ((a + b) % 2 && R.int(0, 2));
      return K.nums(T`L’intervalle $[${a}\,;\,${b}]$ est l’ensemble des réels $x$ tels que $|x-c|\leqslant r$. Donne son centre $c$ et son rayon $r$.`, ['$c$', '$r$'], [(a + b) / 2, (b - a) / 2], T`Le centre est le milieu, $c=\frac{${a}+${b}}{2}=${decT((a + b) / 2)}$ ; le rayon est la demi-longueur, $r=\frac{${b}-(${a})}{2}=${decT((b - a) / 2)}$.`, 'Centre : milieu des extrémités. Rayon : moitié de la longueur.', { inline: true });
    },
  ];
  const N7C = [
    () => {
      const a = R.int(-9, 7),
        b = R.int(a + 1, 10);
      const m = (a + b) / 2,
        t = R.int(0, 2);
      const ivs = [ivOf(-Infinity, m, false, true), ivOf(-Infinity, m, false, false), ivOf(m, Infinity, true, false)][t];
      const op = ['\\leqslant', '<', '\\geqslant'][t];
      return K.interval(T`Résous l’inéquation $|${xm(a)}|${op}|${xm(b)}|$ ; donne l’ensemble des solutions sous forme d’intervalle.`, CU.IV.str(ivs), T`$|${xm(a)}|$ est la distance de $x$ à $${a}$, $|${xm(b)}|$ sa distance à $${b}$. ${t === 2 ? T`Être au moins aussi loin de $${a}$ que de $${b}$` : T`Être ${t ? 'strictement plus' : 'au moins aussi'} proche de $${a}$ que de $${b}$`}, c’est être ${t === 2 ? 'à droite' : 'à gauche'} du milieu $${ft(a + b, 2)}$${t === 1 ? ' (exclu)' : ' (inclus)'} : $${ivTex(CU.IV.str(ivs))}$. Par le calcul : les deux membres sont positifs, on compare leurs carrés, $(x-${N0(a)})^2${op}(x-${N0(b)})^2\iff${2 * (b - a)}x${op}${b * b - a * a}$.`, 'Interprète les deux valeurs absolues comme des distances.');
    },
    () => {
      const k = R.int(2, 5),
        a = R.int(-9, 9),
        r = R.int(1, 7),
        strict = R.int(0, 1) === 1;
      const ivs = ivOf((a - r) / k, (a + r) / k, !strict, !strict);
      return K.interval(T`Résous l’inéquation $|${k}x${a > 0 ? '-' + a : a < 0 ? '+' + -a : ''}|${strict ? '<' : '\\leqslant'}${r}$.`, CU.IV.str(ivs), T`$|${k}x${a > 0 ? '-' + a : a < 0 ? '+' + -a : ''}|=${k}\left|x-${a < 0 ? '\\left(' + ft(a, k) + '\\right)' : ft(a, k)}\right|$, donc l’inéquation équivaut à $\left|x-${a < 0 ? '\\left(' + ft(a, k) + '\\right)' : ft(a, k)}\right|${strict ? '<' : '\\leqslant'}${ft(r, k)}$ : intervalle de centre $${ft(a, k)}$ et de rayon $${ft(r, k)}$, soit $${ivTex(CU.IV.str(ivs))}$.`, 'Factorise le coefficient de x dans la valeur absolue : |kx − a| = k|x − a/k|.');
    },
    () => {
      const a = R.int(-8, 5),
        b = R.int(a + 1, 9),
        t = R.int(0, 2);
      const c = t === 0 ? b - a : t === 1 ? b - a + 2 * R.int(1, 4) : Math.max(0, b - a - R.int(1, b - a));
      const ivs = t === 0 ? ivOf(a, b, true, true) : t === 1 ? [...ivOf((a + b - c) / 2, (a + b - c) / 2, true, true), ...ivOf((a + b + c) / 2, (a + b + c) / 2, true, true)] : [];
      return K.interval(
        T`Donne l’ensemble des réels $x$ tels que $|${xm(a)}|+|${xm(b)}|=${c}$. (Réponse possible : un intervalle, un ensemble de nombres $\{\dots\}$, ou $\varnothing$.)`,
        CU.IV.str(ivs),
        T`$|${xm(a)}|+|${xm(b)}|$ est la somme des distances de $x$ à $${a}$ et à $${b}$. Si $x$ est entre $${a}$ et $${b}$, cette somme vaut exactement $${b - a}$ ; s’il est à l’extérieur, elle vaut $${b - a}$ plus deux fois la distance qui le sépare de l’intervalle. ${t === 0 ? T`Donc la somme vaut $${c}$ exactement sur $[${a}\,;\,${b}]$.` : t === 1 ? T`Pour obtenir $${c}$, il faut sortir de $${(c - (b - a)) / 2}$ de chaque côté : $x=${ft(a + b - c, 2)}$ ou $x=${ft(a + b + c, 2)}$.` : T`Elle vaut toujours au moins $${b - a}>${c}$ : aucune solution.`}`,
        'Pense « somme de deux distances » et dessine.',
      );
    },
    () => {
      let I, J, res;
      do {
        I = randIv();
        J = randIv();
        res = CU.IV.complement(CU.IV.norm(I.concat(J)));
      } while (CU.IV.same(I, J));
      const sI = CU.IV.str(I),
        sJ = CU.IV.str(J),
        sR = CU.IV.str(res);
      return K.interval(T`On donne $I=${ivTex(sI)}$ et $J=${ivTex(sJ)}$. Écris le complémentaire $\mathbb R\setminus(I\cup J)$ : les réels qui ne sont ni dans $I$ ni dans $J$.`, sR, T`$I\cup J=${ivTex(CU.IV.str(CU.IV.norm(I.concat(J))))}$. Son complémentaire est ce qui reste sur la droite : $${ivTex(sR)}$. Aux extrémités, les crochets ${B('s’inversent')} : un point inclus dans $I\cup J$ est exclu du complémentaire, et réciproquement.`, 'Hachure I ∪ J sur la droite : la réponse est ce qui reste.');
    },
    () => {
      const v = R.pick([
        { c: [T`$\forall x\in[0\,;1],\ x^2\leqslant x$`, T`$\exists x\in\,]0\,;1[,\ x^2>x$`, T`$\forall x\in\mathbb R,\ |x|=x$`, T`$\exists x\in\mathbb R,\ |x|<0$`], s: T`Vraie : « $\forall x\in[0;1],\ x^2\leqslant x$ », car pour $0\leqslant x\leqslant1$, $x^2=x\times x\leqslant 1\times x=x$. « $\exists x\in\,]0;1[,\ x^2>x$ » est donc fausse, puisque $x^2\leqslant x$ sur tout $[0;1]$. « $\forall x,\ |x|=x$ » : faux, $|-1|=1\neq-1$. « $\exists x,\ |x|<0$ » : faux, une valeur absolue n’est jamais négative.` },
        { c: [T`$\forall x\in\mathbb R,\ \exists y\in\mathbb R,\ y>x$`, T`$\exists y\in\mathbb R,\ \forall x\in\mathbb R,\ y>x$`, T`$\forall x\in\mathbb R,\ x^2>0$`, T`$\exists x\in\mathbb R,\ x^2=-1$`], s: T`Vraie : « $\forall x\ \exists y,\ y>x$ », car pour chaque $x$, $y=x+1$ convient ($y$ dépend de $x$). « $\exists y\ \forall x,\ y>x$ » dirait qu’un réel dépasse tous les autres, y compris lui-même : faux. « $\forall x,\ x^2>0$ » : faux pour $x=0$. « $\exists x,\ x^2=-1$ » : faux, un carré n’est jamais négatif. L’${B('ordre')} des quantificateurs change tout.` },
        { c: [T`$\exists x\in\mathbb R,\ |x-3|<|x-5|$`, T`$\forall x\in\mathbb R,\ |x-3|<|x-5|$`, T`$\forall x\in\mathbb R,\ |x|\geqslant x+1$`, T`$\exists x\in\mathbb R,\ |x-3|+|x-5|<2$`], s: T`Vraie : « $\exists x,\ |x-3|<|x-5|$ » : $x=0$ est plus proche de $3$ que de $5$. « $\forall x,\ |x-3|<|x-5|$ » : faux pour $x=5$. « $\forall x,\ |x|\geqslant x+1$ » : faux pour $x=0$. « $\exists x,\ |x-3|+|x-5|<2$ » : faux, la somme des distances à $3$ et à $5$ vaut au moins $2$.` },
      ]);
      return K.choice(T`$\forall$ se lit « pour tout », $\exists$ se lit « il existe ». Laquelle de ces affirmations est ${B('vraie')} ?`, v.c, v.s, 'Pour réfuter un « pour tout », un contre-exemple suffit. Pour prouver un « il existe », un exemple suffit.');
    },
  ];
  CU.addSkill({
    id: 'n7',
    region: 'num',
    name: 'La règle sans fin',
    place: 'La Galerie de la Règle',
    glyph: 'ℝ',
    x: 875,
    y: 600,
    flavor: 'La règle des Archivistes n’a ni début ni fin. Chaque point y a sa place, et la distance entre deux points ne ment jamais.',
    law: T`Un intervalle s’écrit avec des crochets : $[a\,;b]$ ($a\leqslant x\leqslant b$), $]a\,;b[$ ($a<x<b$), $[a\,;+\infty[$… La distance entre $a$ et $b$ est $|a-b|$. $|x-a|\leqslant r\iff x\in[a-r\,;a+r]$.`,
    lessons: [
      T`<p>Chaque réel est l’${B('abscisse')} d’un point de la droite graduée. Les ${B('intervalles')} décrivent des morceaux de droite :</p>
<ul><li>$[a\,;b]$ : $a\leqslant x\leqslant b$ (crochets fermés : extrémités incluses) ;</li><li>$]a\,;b[$ : $a<x<b$ (crochets ouverts : extrémités exclues) ;</li><li>$[a\,;+\infty[$ : $x\geqslant a$ — le côté de l’infini est toujours ouvert.</li></ul>
<p>La ${B('valeur absolue')} $|x|$ est la distance de $x$ à $0$ : $|-3|=3$. La distance entre $a$ et $b$ est $|a-b|$.</p>`,
      T`<p>$|x-a|$ est la distance entre $x$ et $a$. Donc $|x-a|\leqslant r$ décrit l’intervalle de ${B('centre')} $a$ et de ${B('rayon')} $r$ : $[a-r\,;a+r]$ ; et $|x-a|=r$ a deux solutions, $a-r$ et $a+r$.</p>
<p>${B('Intersection')} $I\cap J$ : dans $I$ et dans $J$. ${B('Réunion')} $I\cup J$ : dans $I$ ou dans $J$. On les lit sur un dessin.</p>
<p class="ex">$|x+2|<3\iff x\in\,]-5\,;1[$, car $|x+2|=|x-(-2)|$.</p>`,
      T`<p>Penser « distance » résout beaucoup de problèmes : $|x-a|\leqslant|x-b|$ signifie « plus proche de $a$ que de $b$ » ; $|x-a|+|x-b|$ est une somme de distances.</p>
<p>Le ${B('complémentaire')} $\mathbb R\setminus A$ contient les réels hors de $A$ ; aux extrémités, les crochets s’inversent.</p>
<p>${B('Quantificateurs')} : $\forall$ (« pour tout ») et $\exists$ (« il existe »). Un contre-exemple réfute un « pour tout » ; un exemple prouve un « il existe ». L’ordre compte : « $\forall x\,\exists y$ » n’est pas « $\exists y\,\forall x$ ».</p>`,
    ],
    methods: [
      T`<ol class="meth"><li>Inégalité large ($\leqslant$) : crochet fermé ; stricte ($<$) : crochet ouvert ; infini : toujours ouvert.</li><li>Appartenance : vérifie les deux inégalités, en faisant attention aux extrémités.</li><li>Distance : $|a-b|$, toujours positive.</li></ol><p class="tip"><b>Saisie</b> — utilise les touches <code>[</code> <code>]</code> <code>;</code> <code>∞</code> <code>∪</code> : <code>]-∞ ; 2]</code>.</p>`,
      T`<ol class="meth"><li>Réécris $|x+a|$ en $|x-(-a)|$ pour lire le centre.</li><li>$\leqslant r$ : un intervalle centré ; $\geqslant r$ : deux demi-droites.</li><li>$\cap$, $\cup$ : dessine les deux intervalles sur une droite, l’un au-dessus de l’autre.</li></ol><p class="pit"><b>Piège</b> — $|x-a|\geqslant r$ donne une réunion, pas un intervalle.</p>`,
      T`<ol class="meth"><li>Interprète chaque valeur absolue comme une distance et dessine.</li><li>$|kx-a|=k\left|x-\frac ak\right|$ pour $k>0$.</li><li>Complémentaire : prends ce qui reste, en inversant les crochets.</li></ol>`,
    ],
    gen: [CU.oneOf(...N7A), CU.oneOf(...N7B), CU.oneOf(...N7C)],
  });

  /* ================= N8 — Le trébuchet (encadrements, arrondis) ================= */
  const RANG = ['à l’unité', 'au dixième', 'au centième', 'au millième'];
  const N8A = [
    () => {
      let I;
      do I = R.int(100000, 9999999);
      while (I % 10 === 0);
      const k = R.int(0, 3);
      const p = 10 ** (5 - k);
      const Rd = Math.floor((I + p / 2) / p),
        Tr = Math.floor(I / p);
      const x = dtex(I, 5),
        r = decParts(Rd, k);
      return custom(
        T`Donne l’${B('arrondi')} ${RANG[k]} de $${x}$.`,
        (s) => {
          const v = V.num(s, r.v);
          if (v.ok || v.syntax) return v;
          const y = valOf(s);
          if (y !== null && Tr !== Rd && Math.abs(y - Tr / 10 ** k) < 1e-9) return { ok: false, close: true, msg: 'Tu as tronqué (coupé les décimales) : pour arrondir, regarde le chiffre suivant.' };
          return { ok: false, msg: 'Ce n’est pas le bon arrondi.' };
        },
        r.txt,
        T`On regarde le chiffre qui suit le rang demandé : ${Rd > Tr ? T`il vaut $5$ ou plus, on arrondit ${B('au-dessus')}` : T`il est inférieur à $5$, on garde`} : $${x}\approx${r.tex}$.${Rd > Tr ? T` (La troncature, $${dtex(Tr, k)}$, est la valeur par défaut.)` : ''}`,
        'Regarde le chiffre juste après le rang demandé : 5 ou plus, on monte.',
      );
    },
    () => {
      let a, b;
      do {
        b = R.pick([3, 6, 7, 9, 11, 12, 13, 14]);
        a = R.int(1, 5 * b);
      } while (gcd(a, b) !== 1);
      const k = R.int(1, 2);
      const L = Math.floor((a * 10 ** k) / b);
      return K.nums(T`Donne l’encadrement de $\dfrac{${a}}{${b}}$ par deux décimaux consécutifs ${RANG[k]} : $$m<\frac{${a}}{${b}}<M,\qquad M-m=${dtex(1, k)}$$`, ['$m$', '$M$'], [L / 10 ** k, (L + 1) / 10 ** k], T`$\frac{${a}}{${b}}=${dtex(Math.floor((a * 10 ** (k + 3)) / b), k + 3)}\ldots$ donc $${dtex(L, k)}<\frac{${a}}{${b}}<${dtex(L + 1, k)}$. ($\frac{${a}}{${b}}$ n’est pas décimal : les inégalités sont strictes.)`, 'Pose la division jusqu’au rang voulu.', { inline: true });
    },
    () => {
      let n;
      do n = R.int(5, 300);
      while (Number.isInteger(Math.sqrt(n)));
      const s = Math.floor(Math.sqrt(n));
      return K.nums(T`Encadre $\sqrt{${n}}$ par deux entiers consécutifs : $m<\sqrt{${n}}<m+1$. Donne $m$ et $m+1$.`, ['$m$', '$m+1$'], [s, s + 1], T`$${s}^2=${s * s}<${n}<${(s + 1) ** 2}=${s + 1}^2$, et la fonction racine carrée est croissante : $${s}<\sqrt{${n}}<${s + 1}$.`, 'Cherche les deux carrés parfaits qui entourent le nombre.', { inline: true });
    },
  ];
  const N8B = [
    () => {
      let n;
      do n = R.int(2, 99);
      while (Number.isInteger(Math.sqrt(n)));
      const L = Math.floor(Math.sqrt(100 * n));
      return K.nums(T`Encadre $\sqrt{${n}}$ ${RANG[1]} : $m<\sqrt{${n}}<M$ avec $M-m=0{,}1$.`, ['$m$', '$M$'], [L / 10, (L + 1) / 10], T`$${dtex(L, 1)}^2=${dtex(L * L, 2)}<${n}<${dtex((L + 1) ** 2, 2)}=${dtex(L + 1, 1)}^2$, donc $${dtex(L, 1)}<\sqrt{${n}}<${dtex(L + 1, 1)}$.`, 'Encadre d’abord à l’unité, puis essaie les dixièmes en les élevant au carré.', { inline: true });
    },
    () => {
      const a = R.int(-6, 4),
        b = R.int(a + 1, 8),
        c = R.int(-6, 4),
        d = R.int(c + 1, 8);
      const t = R.int(0, 2);
      const [tex, lo, hi, why] =
        t === 0
          ? ['x+y', a + c, b + d, T`On ajoute membre à membre : $${a}+${N0(c)}\leqslant x+y\leqslant${b}+${N0(d)}$.`]
          : t === 1
            ? ['x-y', a - d, b - c, T`$x-y=x+(-y)$ et $-${d < 0 ? '(' + d + ')' : d}\leqslant -y\leqslant -${c < 0 ? '(' + c + ')' : c}$ (multiplier par $-1$ ${B('renverse')} les inégalités). Donc $${a}-${N0(d)}\leqslant x-y\leqslant ${b}-${N0(c)}$.`]
            : ['2x-3y', 2 * a - 3 * d, 2 * b - 3 * c, T`$${2 * a}\leqslant 2x\leqslant${2 * b}$ et $${-3 * d}\leqslant -3y\leqslant${-3 * c}$ (le facteur $-3$ renverse les inégalités). En ajoutant : $${2 * a - 3 * d}\leqslant 2x-3y\leqslant${2 * b - 3 * c}$.`];
      return K.nums(T`On sait que $${a}\leqslant x\leqslant ${b}$ et $${c}\leqslant y\leqslant ${d}$. Donne le meilleur encadrement possible de $${tex}$ : $m\leqslant ${tex}\leqslant M$.`, ['$m$', '$M$'], [lo, hi], why, t ? 'Écris −y avec un encadrement retourné, puis ajoute.' : 'On peut ajouter des inégalités de même sens.', { inline: true });
    },
    () => {
      const a = R.int(1, 8),
        b = R.int(a + 1, 12);
      return K.nums(T`On sait que $${a}\leqslant x\leqslant ${b}$. Encadre $\dfrac1x$ : $m\leqslant\frac1x\leqslant M$.`, ['$m$', '$M$'], [1 / b, 1 / a], T`La fonction inverse est ${B('décroissante')} sur $]0\,;+\infty[$ : elle renverse l’ordre des nombres positifs. Donc $\frac1{${b}}\leqslant\frac1x\leqslant\frac1{${a}}$.`, 'Pour des nombres positifs, le plus grand a le plus petit inverse.', { inline: true });
    },
  ];
  const N8C = [
    () => {
      const k = R.int(1, 2),
        I = R.int(11, 999);
      const lo = decParts(10 * I - 5, k + 1),
        hi = decParts(10 * I + 5, k + 1),
        d = decParts(I, k);
      return K.interval(T`Quel est l’ensemble des réels $x>0$ dont l’arrondi ${RANG[k]} vaut $${d.tex}$ ? Donne-le sous forme d’intervalle.`, `[${lo.txt} ; ${hi.txt}[`, T`On arrondit à $${d.tex}$ tout ce qui est à moins d’un demi-${k === 1 ? 'dixième' : 'centième'} : de $${lo.tex}$ (inclus, car $5$ arrondit au-dessus) jusqu’à $${hi.tex}$ (exclu, qui s’arrondit à $${dtex(I + 1, k)}$) : $[${lo.tex}\,;\,${hi.tex}[$.`, 'Quels nombres s’arrondissent à cette valeur ? Regarde les deux « demi » de part et d’autre.');
    },
    () => {
      const t = R.int(0, 1);
      if (t === 0) {
        const a = R.int(1, 7),
          b = R.int(1, 9);
        return K.nums(T`On sait que $-${a}\leqslant x\leqslant ${b}$. Donne le meilleur encadrement de $x^2$ : $m\leqslant x^2\leqslant M$.`, ['$m$', '$M$'], [0, Math.max(a, b) ** 2], T`Piège : on ne peut pas élever au carré membre à membre, car $x$ change de signe. $x$ peut valoir $0$, donc $m=0$. Le carré est le plus grand quand $|x|$ est le plus grand, c’est-à-dire $|x|=${Math.max(a, b)}$ : $M=${Math.max(a, b) ** 2}$. (Écrire $${a * a}\leqslant x^2\leqslant${b * b}$ serait faux.)`, 'x change de signe dans l’intervalle : où le carré est-il le plus petit ?', { inline: true });
      }
      const a = R.int(1, 6),
        b = R.int(a + 1, 9);
      return K.nums(T`On sait que $-${b}\leqslant x\leqslant -${a}$. Encadre $x^2$ : $m\leqslant x^2\leqslant M$.`, ['$m$', '$M$'], [a * a, b * b], T`La fonction carré est ${B('décroissante')} sur $]-\infty\,;0]$ : elle renverse l’ordre. Donc $(-${a})^2\leqslant x^2\leqslant(-${b})^2$, soit $${a * a}\leqslant x^2\leqslant${b * b}$.`, 'Pour des nombres négatifs, élever au carré renverse l’ordre.', { inline: true });
    },
    () => {
      let n;
      do n = R.int(3, 60);
      while (Number.isInteger(Math.sqrt(n)));
      let lo = Math.floor(Math.sqrt(n)),
        hi = lo + 1;
      const steps = [];
      for (let i = 0; i < 3; i++) {
        const m = (lo + hi) / 2;
        const below = m * m < n;
        steps.push(T`$m=${decT(m)}$, $m^2=${decT(m * m)}${below ? '<' : '>'}${n}$ donc $\sqrt{${n}}\in${below ? `[${decT(m)}\\,;\\,${decT(hi)}]` : `[${decT(lo)}\\,;\\,${decT(m)}]`}$`);
        if (below) lo = m;
        else hi = m;
      }
      return K.nums(
        T`${B('Dichotomie')} : on part de $[${Math.floor(Math.sqrt(n))}\,;\,${Math.floor(Math.sqrt(n)) + 1}]$, qui contient $\sqrt{${n}}$. À chaque étape, on calcule le milieu $m$ ; si $m^2<${n}$, on garde la moitié droite, sinon la moitié gauche. Après ${B('trois')} étapes, quel intervalle $[a\,;b]$ obtient-on ?`,
        ['$a$', '$b$'],
        [lo, hi],
        steps.join(' ; ') + T`. Chaque étape divise la longueur par $2$ : après trois étapes, elle vaut $\frac18=0{,}125$.`,
        'Fais les trois étapes une par une, en élevant le milieu au carré.',
        { inline: true },
      );
    },
    () => {
      const v = R.pick([
        { q: T`x+y`, a: 0.01, s: T`$|x+y-(p+q)|\leqslant|x-p|+|y-q|\leqslant0{,}005+0{,}005=0{,}01$.` },
        { q: T`x-y`, a: 0.01, s: T`$|x-y-(p-q)|\leqslant|x-p|+|y-q|\leqslant0{,}01$ : les erreurs s’ajoutent même dans une différence.` },
        { q: T`3x`, a: 0.015, s: T`$|3x-3p|=3|x-p|\leqslant3\times0{,}005=0{,}015$.` },
        { q: T`2x+y`, a: 0.015, s: T`$|2x+y-(2p+q)|\leqslant2|x-p|+|y-q|\leqslant0{,}01+0{,}005=0{,}015$.` },
      ]);
      const p = dtex(R.int(100, 999), 2),
        q = dtex(R.int(100, 999), 2);
      return K.num(T`Deux longueurs $x$ et $y$ ont été mesurées puis arrondies au centième : $x\approx${p}$ et $y\approx${q}$, c’est-à-dire $|x-p|\leqslant0{,}005$ et $|y-q|\leqslant0{,}005$ avec $p=${p}$ et $q=${q}$. Au plus, de combien la valeur exacte de $${v.q}$ peut-elle s’écarter de la valeur calculée avec $p$ et $q$ ?`, v.a, v.s + T` C’est l’${B('inégalité triangulaire')} : $|a+b|\leqslant|a|+|b|$.`, 'Chaque arrondi au centième fait une erreur d’au plus 0,005.', 'Écart maximal');
    },
  ];
  CU.addSkill({
    id: 'n8',
    region: 'num',
    name: 'Le trébuchet',
    place: 'Le Cabinet des Essayeurs',
    glyph: '≈',
    x: 750,
    y: 350,
    flavor: 'Le trébuchet des essayeurs pèse au grain près. Une pièce n’est jamais « à peu près » juste : on dit entre quoi et quoi elle se trouve.',
    law: T`Arrondir : on regarde le chiffre suivant ($5$ ou plus : on monte). Encadrer : $m\leqslant x\leqslant M$. On ajoute des encadrements membre à membre ; multiplier par un négatif, passer à l’inverse (positifs) ou au carré (négatifs) renverse l’ordre.`,
    lessons: [
      T`<p>${B('Arrondir')} au centième : on regarde le chiffre des millièmes ; s’il vaut $5$ ou plus, on augmente le chiffre des centièmes : $3{,}14159\approx3{,}14$ et $2{,}71828\approx2{,}72$. ${B('Tronquer')}, c’est couper sans regarder.</p>
<p>Un ${B('encadrement')} d’amplitude $10^{-n}$ par deux décimaux : $3{,}14<\pi<3{,}15$.</p>
<p>Pour $\sqrt n$ : cherche les carrés qui l’entourent, $16<20<25$ donne $4<\sqrt{20}<5$.</p>`,
      T`<p>On peut ${B('ajouter')} deux encadrements membre à membre. Pour une différence, on encadre d’abord $-y$ : multiplier par un nombre négatif ${B('renverse')} les inégalités.</p>
<p>Pour des nombres positifs, passer à l’${B('inverse')} renverse l’ordre : $2\leqslant x\leqslant5\Rightarrow\frac15\leqslant\frac1x\leqslant\frac12$.</p>`,
      T`<p>Les réels dont l’arrondi au dixième vaut $2{,}4$ forment l’intervalle $[2{,}35\,;2{,}45[$.</p>
<p>${B('Dichotomie')} : on coupe un intervalle en deux et on garde la moitié qui contient la solution ; la longueur est divisée par $2$ à chaque étape.</p>
<p>${B('Inégalité triangulaire')} : $|a+b|\leqslant|a|+|b|$. Les erreurs d’arrondi s’ajoutent.</p>
<p>Si $x$ change de signe, on ne peut pas élever un encadrement au carré membre à membre.</p>`,
    ],
    methods: [
      T`<ol class="meth"><li>Repère le rang demandé, puis le chiffre juste après.</li><li>$0,1,2,3,4$ : on garde ; $5,6,7,8,9$ : on ajoute $1$ au rang demandé.</li><li>Encadrement d’une fraction : pose la division un rang plus loin que demandé.</li></ol><p class="pit"><b>Piège</b> — $2{,}96$ arrondi au dixième donne $3{,}0$, c’est-à-dire $3$.</p>`,
      T`<ol class="meth"><li>Somme : ajoute les bornes inférieures, puis les bornes supérieures.</li><li>Différence $x-y$ : borne inf de $x$ moins borne ${B('sup')} de $y$.</li><li>Inverse (positifs) : on échange les bornes et on prend les inverses.</li></ol><p class="pit"><b>Piège</b> — $x-y$ ne s’encadre pas par $a-c$ et $b-d$.</p>`,
      T`<ol class="meth"><li>Ensemble des nombres d’arrondi donné : demi-pas de chaque côté, crochet fermé en bas, ouvert en haut.</li><li>Carré : si $x$ change de signe, le minimum est $0$ ; si $x$ est négatif, l’ordre s’inverse.</li><li>Dichotomie : milieu, carré, comparaison, on garde une moitié.</li></ol>`,
    ],
    gen: [CU.oneOf(...N8A), CU.oneOf(...N8B), CU.oneOf(...N8C)],
  });

  /* ================= N11 — Les moules (grandeurs, conversions, agrandissement) ================= */
  const N11A = [
    () => {
      if (R.int(0, 1)) {
        const v = 18 * R.int(1, 8);
        return K.num(T`Une charrette roule à $${v}$ km/h. Quelle est sa vitesse en m/s ?`, (v * 5) / 18, T`$1$ km/h $=\frac{1000\text{ m}}{3600\text{ s}}=\frac1{3{,}6}$ m/s. Donc $${v}$ km/h $=\frac{${v}}{3{,}6}=${(v * 5) / 18}$ m/s.`, 'En une heure il y a 3600 s, et 1 km = 1000 m : on divise par 3,6.', 'Vitesse (m/s)');
      }
      const w = R.int(2, 40);
      return K.num(T`Un faucon vole à $${w}$ m/s. Quelle est sa vitesse en km/h ?`, (w * 36) / 10, T`En une heure ($3600$ s) il parcourt $${w}\times3600=${w * 3600}$ m, soit $${decT((w * 36) / 10)}$ km : $${decT((w * 36) / 10)}$ km/h (on multiplie par $3{,}6$).`, 'm/s → km/h : on multiplie par 3,6.', 'Vitesse (km/h)');
    },
    () => {
      const U = [
        ['m^2', 'cm^2', 4, 'un mètre carré est un carré de $100$ cm de côté : $100\\times100=10^4$ cm²'],
        ['cm^2', 'm^2', -4, 'il faut $10^4$ cm² pour faire un m²'],
        ['km^2', 'ha', 2, '$1$ km² $=10^6$ m² et $1$ ha $=10^4$ m², donc $1$ km² $=100$ ha'],
        ['ha', 'm^2', 4, 'un hectare est un carré de $100$ m de côté : $10^4$ m²'],
        ['dm^2', 'm^2', -2, '$1$ m² $=10\\times10=100$ dm²'],
        ['mm^2', 'cm^2', -2, '$1$ cm² $=10\\times10=100$ mm²'],
      ];
      const [from, to, e, w0] = R.pick(U);
      const why = w0[0].toUpperCase() + w0.slice(1);
      const I = R.int(2, 999),
        k = R.int(0, 2);
      const x = decParts(I, k);
      const val = (I * 10 ** (e + 4)) / 10 ** (k + 4);
      return convEx(T`Convertis : $${x.tex}\ \mathrm{${from}}$ en $\mathrm{${to}}$.`, val, T`${why}. Donc $${x.tex}\ \mathrm{${from}}=${decT(val)}\ \mathrm{${to}}$ (${e > 0 ? 'multiplier' : 'diviser'} par $${10 ** Math.abs(e)}$).`, 'En aire, chaque changement d’unité de longueur compte deux fois : 1 m = 100 cm donne 1 m² = 10 000 cm².', T`Aire`);
    },
    () => {
      const U = [
        ['L', 'cm^3', 3, '$1$ L $=1$ dm³ $=1000$ cm³'],
        ['m^3', 'L', 3, '$1$ m³ $=1000$ dm³ $=1000$ L'],
        ['cm^3', 'mL', 0, '$1$ mL $=1$ cm³'],
        ['mL', 'L', -3, '$1$ L $=1000$ mL'],
        ['dm^3', 'cm^3', 3, '$1$ dm³ $=10\\times10\\times10=1000$ cm³'],
        ['cm^3', 'L', -3, '$1$ L $=1000$ cm³'],
      ];
      const [from, to, e, w0] = R.pick(U);
      const why = w0[0].toUpperCase() + w0.slice(1);
      const I = R.int(2, 999),
        k = R.int(0, 2);
      const x = decParts(I, k);
      const val = (I * 10 ** (e + 4)) / 10 ** (k + 4);
      return convEx(T`Convertis : $${x.tex}\ \mathrm{${from}}$ en $\mathrm{${to}}$.`, val, T`${why}. Donc $${x.tex}\ \mathrm{${from}}=${decT(val)}\ \mathrm{${to}}$.`, '1 L = 1 dm³ ; en volume, chaque changement d’unité de longueur compte trois fois.', 'Volume');
    },
  ];
  const N11B = [
    () => {
      const k = R.pick([2, 3, 4, 0.5, 1.5]),
        t = R.int(0, 1);
      const A = R.int(2, 40) * (k === 1.5 ? 4 : k === 0.5 ? 8 : 1);
      const val = t ? A * k ** 3 : A * k ** 2;
      return K.num(T`Un moule est ${k > 1 ? 'agrandi' : 'réduit'} : toutes ses longueurs sont multipliées par $${decT(k)}$. ${t ? T`Son volume était de $${A}$ cm³. Quel est son nouveau volume (en cm³) ?` : T`L’aire de sa base était de $${A}$ cm². Quelle est la nouvelle aire (en cm²) ?`}`, val, T`Quand les longueurs sont multipliées par $k$, les aires sont multipliées par $k^2$ et les volumes par $k^3$. Ici $${decT(k)}^${t ? 3 : 2}=${decT(k ** (t ? 3 : 2))}$, donc $${A}\times${decT(k ** (t ? 3 : 2))}=${decT(val)}$.`, 'Aires : k². Volumes : k³.', t ? 'Volume (cm³)' : 'Aire (cm²)');
    },
    () => {
      const E = R.pick([25000, 50000, 100000, 200000]),
        t = R.int(0, 1);
      const d = R.int(2, 30) / 2;
      const km = (d * E) / 100000;
      if (t) return K.num(T`Sur une carte à l’échelle $1/${E}$, deux tours sont à $${decT(d)}$ cm l’une de l’autre. Quelle est la distance réelle, en km ?`, km, T`$1$ cm sur la carte représente $${E}$ cm en réalité, soit $${decT(E / 100000)}$ km. Donc $${decT(d)}\times${decT(E / 100000)}=${decT(km)}$ km.`, '1 km = 100 000 cm.', 'Distance (km)');
      return K.num(T`Sur une carte à l’échelle $1/${E}$, quelle longueur (en cm) représente une distance réelle de $${decT(km)}$ km ?`, d, T`$${decT(km)}$ km $=${decT(km * 100000)}$ cm, et on divise par $${E}$ : $${decT(d)}$ cm.`, '1 km = 100 000 cm, puis on divise par l’échelle.', 'Longueur (cm)');
    },
    () => {
      const v = R.pick([40, 45, 48, 50, 60, 72, 75, 80, 90, 100, 120]);
      let d, t;
      do {
        t = R.int(5, 150);
        d = (v * t) / 60;
      } while (!Number.isInteger(d * 2));
      return K.num(T`Un messager parcourt $${decT(d)}$ km à la vitesse constante de $${v}$ km/h. Combien de ${B('minutes')} dure le trajet ?`, t, T`$t=\frac dv=\frac{${decT(d)}}{${v}}$ h, soit $\frac{${decT(d)}}{${v}}\times60=${t}$ min.`, 'Temps = distance ÷ vitesse, en heures ; puis convertis en minutes.', 'Durée (min)');
    },
  ];
  const N11C = [
    () => {
      const A = R.pick([4, 9, 16, 25, 2, 3]);
      const reverse = R.int(0, 1) && Number.isInteger(Math.sqrt(A));
      if (reverse) {
        const k = Math.sqrt(A);
        return K.num(T`Lors d’un agrandissement, le ${B('volume')} d’une statue est multiplié par $${k ** 3}$. Par combien son ${B('aire')} est-elle multipliée ?`, A, T`Si les longueurs sont multipliées par $k$, le volume l’est par $k^3=${k ** 3}$, donc $k=${k}$, et l’aire par $k^2=${A}$.`, 'Retrouve d’abord le coefficient des longueurs.', 'Coefficient');
      }
      return K.num(T`Lors d’un agrandissement, l’${B('aire')} d’une statue est multipliée par $${A}$. Par combien son ${B('volume')} est-il multiplié ? (Valeur exacte.)`, A ** 1.5, T`Les longueurs sont multipliées par $k$ avec $k^2=${A}$, donc $k=${rt(A)}$, et le volume par $k^3=${Number.isInteger(Math.sqrt(A)) ? Math.sqrt(A) + '^3=' + A ** 1.5 : '\\left(\\sqrt{' + A + '}\\right)^3=' + A + '\\sqrt{' + A + '}'}$.`, 'Coefficient des longueurs k : aire × k², volume × k³.', 'Coefficient');
    },
    () => {
      const [v1, v2] = R.pick([[40, 60], [30, 60], [60, 90], [20, 30], [50, 75], [45, 90], [80, 120], [36, 72], [30, 70], [40, 120]]);
      const m = (2 * v1 * v2) / (v1 + v2);
      return K.num(T`Un cavalier fait l’aller à $${v1}$ km/h et le retour, sur la même route, à $${v2}$ km/h. Quelle est sa vitesse moyenne sur l’aller-retour (en km/h) ?`, m, T`Ce n’est pas $\frac{${v1}+${v2}}{2}=${(v1 + v2) / 2}$ : il passe plus de temps à la vitesse lente. Pour une distance $d$ : durée totale $\frac d{${v1}}+\frac d{${v2}}$, distance $2d$. Vitesse moyenne $=\frac{2d}{\frac d{${v1}}+\frac d{${v2}}}=\frac{2\times${v1}\times${v2}}{${v1}+${v2}}=${decT(m)}$ km/h (moyenne ${B('harmonique')}).`, 'Choisis une distance (par exemple 120 km) et calcule les durées.', 'Vitesse (km/h)');
    },
    () => {
      const v = R.pick([
        () => {
          const r = R.int(5, 199) / 10;
          return { q: T`La masse volumique du fer est d’environ $${decT(r)}$ g/cm³. Exprime-la en kg/m³.`, a: r * 1000, s: T`$1$ g/cm³ : $1$ m³ $=10^6$ cm³ pèse $10^6$ g $=1000$ kg. Donc $${decT(r)}$ g/cm³ $=${decT(r * 1000)}$ kg/m³.`, l: 'kg/m³' };
        },
        () => {
          const r = R.int(1, 80);
          return { q: T`Une source débite $${r}$ L/min. Exprime ce débit en m³/h.`, a: (r * 60) / 1000, s: T`En une heure : $${r}\times60=${r * 60}$ L $=${decT((r * 60) / 1000)}$ m³ (car $1$ m³ $=1000$ L).`, l: 'm³/h' };
        },
        () => {
          const E = R.pick([1000, 2000, 5000, 10000]),
            A = R.pick([1, 2, 4, 5, 10, 25]);
          return { q: T`Un champ de $${A}$ ha est dessiné sur un plan à l’échelle $1/${E}$. Quelle est l’aire du dessin, en cm² ?`, a: (A * 1e8) / (E * E), s: T`$${A}$ ha $=${A}\times10^4$ m² $=${A}\times10^8$ cm². Les longueurs sont divisées par $${E}$, donc les aires par $${E}^2$ : $\frac{${A}\times10^8}{${E}^2}=${decT((A * 1e8) / (E * E))}$ cm².`, l: 'Aire (cm²)' };
        },
      ])();
      return K.num(v.q, v.a, v.s, 'Convertis séparément chaque unité (masse, volume, temps…).', v.l);
    },
    CU.needs(['n4'], () => {
      return K.nums(T`La lumière parcourt environ $3\times10^5$ km par seconde, et une année dure environ $3{,}15\times10^7$ s. Combien de kilomètres mesure une ${B('année-lumière')} ? Donne le résultat en notation scientifique $a\times10^n$.`, ['$a$', '$n$'], [9.45, 12], T`$3\times10^5\times3{,}15\times10^7=9{,}45\times10^{12}$ km : près de dix mille milliards de kilomètres.`, 'Multiplie les nombres entre eux et les puissances de 10 entre elles.', { inline: true });
    }),
  ];
  CU.addSkill({
    id: 'n11',
    region: 'num',
    name: 'Les moules',
    place: 'L’Atelier des Moules',
    glyph: '∝',
    x: 830,
    y: 850,
    flavor: 'Les fondeurs agrandissaient leurs moules d’un simple geste. Mais doubler la taille d’une cloche ne double pas le bronze qu’elle demande.',
    law: T`$1$ m² $=10^4$ cm², $1$ L $=1$ dm³, $1$ m/s $=3{,}6$ km/h. Si les longueurs sont multipliées par $k$, les aires le sont par $k^2$ et les volumes par $k^3$.`,
    lessons: [
      T`<p>Pour convertir, on remplace chaque unité par sa valeur : $1$ km/h $=\frac{1000\text{ m}}{3600\text{ s}}=\frac1{3{,}6}$ m/s.</p>
<p>${B('Aires')} : $1$ m $=100$ cm donc $1$ m² $=100\times100=10^4$ cm². $1$ ha $=10^4$ m², $1$ km² $=100$ ha.</p>
<p>${B('Volumes')} : $1$ dm³ $=1$ L $=1000$ cm³, $1$ m³ $=1000$ L, $1$ cm³ $=1$ mL.</p>`,
      T`<p>Dans un ${B('agrandissement')} ou une réduction de rapport $k$, les longueurs sont multipliées par $k$, les ${B('aires')} par $k^2$, les ${B('volumes')} par $k^3$.</p>
<p>Une ${B('échelle')} $1/E$ : $1$ cm sur la carte représente $E$ cm en réalité.</p>
<p>$\text{temps}=\frac{\text{distance}}{\text{vitesse}}$ ; une durée en heures se convertit en minutes en multipliant par $60$.</p>`,
      T`<p>Raisonner sur les coefficients : si l’aire est multipliée par $9$, les longueurs le sont par $3$ et le volume par $27$.</p>
<p>La ${B('vitesse moyenne')} d’un aller-retour n’est pas la moyenne des vitesses : $v=\frac{2v_1v_2}{v_1+v_2}$ (moyenne harmonique).</p>
<p>Une unité composée (g/cm³, L/min) se convertit unité par unité.</p>`,
    ],
    methods: [
      T`<ol class="meth"><li>km/h → m/s : divise par $3{,}6$ ; m/s → km/h : multiplie par $3{,}6$.</li><li>Aire : le facteur de conversion des longueurs est ${B('au carré')} ; volume : ${B('au cube')}.</li><li>Écris l’égalité de base ($1$ m² $=10^4$ cm²) avant de convertir.</li></ol><p class="pit"><b>Piège</b> — $1$ m² $\neq100$ cm².</p>`,
      T`<ol class="meth"><li>Agrandissement de rapport $k$ : aire $\times k^2$, volume $\times k^3$.</li><li>Échelle : convertis en cm, puis multiplie ou divise par $E$.</li><li>Durée : $t=\frac dv$ en heures, puis $\times60$.</li></ol>`,
      T`<ol class="meth"><li>Retrouve d’abord le coefficient des longueurs.</li><li>Vitesse moyenne : distance totale divisée par durée totale.</li><li>Unités composées : convertis le numérateur et le dénominateur séparément.</li></ol>`,
    ],
    gen: [CU.oneOf(...N11A), CU.oneOf(...N11B), CU.oneOf(...N11C)],
  });

  /* ================= Rang Légende (facultatif, au-delà de la seconde) ================= */
  const powmod = (a, n, m) => {
    let r = 1n,
      b = BigInt(a) % BigInt(m),
      e = BigInt(n);
    const M = BigInt(m);
    while (e > 0n) {
      if (e & 1n) r = (r * b) % M;
      b = (b * b) % M;
      e >>= 1n;
    }
    return Number(r);
  };
  const cycleMod = (a, m) => {
    const c = [];
    let x = a % m;
    while (!c.includes(x)) c.push(x), (x = (x * a) % m);
    return c;
  };
  const lcmRange = (k) => [...Array(k - 1).keys()].map((i) => i + 2).reduce(lcm, 1);
  const LEG = {
    n1: [
      () => {
        const n = R.int(30, 500);
        let z = 0,
          p = 5;
        const parts = [];
        while (p <= n) z += Math.floor(n / p), parts.push(T`\left\lfloor\frac{${n}}{${p}}\right\rfloor=${Math.floor(n / p)}`), (p *= 5);
        return K.num(T`On note $n!=1\times2\times3\times\cdots\times n$ (« factorielle $n$ »). Par combien de zéros se termine l’écriture de $${n}!$ ?`, z, T`Chaque zéro final vient d’un facteur $10=2\times5$. Les facteurs $2$ sont bien plus nombreux que les facteurs $5$ : il suffit de compter les $5$. Les multiples de $5$ en apportent un, ceux de $25$ un de plus, ceux de $125$ encore un… : $${parts.join('+')}$, soit $${z}$ zéros. (Formule de Legendre.)`, 'Un zéro final = un facteur 10 = un 2 et un 5. Compte les facteurs 5, sans oublier que 25 en contient deux.', 'Nombre de zéros');
      },
      () => {
        let a, m;
        do {
          a = R.pick([2, 3, 5, 7, 10]);
          m = R.pick([3, 7, 9, 11, 13]);
        } while (gcd(a, m) !== 1);
        const n = R.int(50, 2026);
        const c = cycleMod(a, m),
          L = c.length,
          r = ((n - 1) % L) + 1;
        return K.num(T`Quel est le reste de la division de $${a}^{${n}}$ par $${m}$ ?`, powmod(a, n, m), T`On ne calcule pas $${a}^{${n}}$ : on suit seulement les restes. Ceux de $${a}^1,${a}^2,\dots$ par $${m}$ sont $${c.join(',\\,')}$, puis cela recommence car $${a}^{${L}}$ a pour reste $1$ (période $${L}$). Comme $${n}=${L}\times${Math.floor((n - 1) / L)}+${r}$, le reste est celui de $${a}^{${r}}$ : $${c[r - 1]}$. On écrit $${a}^{${n}}\equiv${c[r - 1]}\pmod{${m}}$.`, 'Calcule les restes de a, a², a³… jusqu’à retomber sur 1.', 'Reste');
      },
      () => {
        const k = R.int(4, 10),
          L = lcmRange(k),
          t = R.int(0, 1);
        return K.num(
          t ? T`Quel est le plus petit entier $n>1$ dont le reste vaut $1$ dans la division par $2$, par $3$, … et par $${k}$ ?` : T`Quel est le plus petit entier $n>0$ dont le reste vaut $d-1$ dans la division par chaque $d\in\{2,3,\dots,${k}\}$ (reste $1$ par $2$, $2$ par $3$, …, $${k - 1}$ par $${k}$) ?`,
          t ? L + 1 : L - 1,
          t ? T`$n-1$ doit être un multiple commun de $2,3,\dots,${k}$ : le plus petit non nul est leur PPCM, $${L}$. Donc $n=${L + 1}$.` : T`Reste $d-1$ dans la division par $d$ signifie que $n+1$ est un multiple de $d$. $n+1$ est donc un multiple commun de $2,\dots,${k}$ : le plus petit est le PPCM, $${L}$, d’où $n=${L - 1}$.`,
          t ? 'Que dire de n − 1 ?' : 'Que dire de n + 1 ?',
        );
      },
    ],
    n2: [
      () => {
        let a, b, c, n;
        do {
          a = R.int(0, 6);
          b = R.int(0, 3);
          c = R.int(0, 2);
          n = 2 ** a * 3 ** b * 5 ** c;
        } while (n > 2000 || n < 30 || [a, b, c].filter(Boolean).length < 2);
        const f = [[2, a], [3, b], [5, c]].filter((x) => x[1]);
        const sig = f.reduce((x, [p, e]) => (x * (p ** (e + 1) - 1)) / (p - 1), 1);
        return K.num(T`$${n}=${factorTex(n)}$. Quelle est la ${B('somme')} de tous ses diviseurs positifs ?`, sig, T`En développant le produit $${f.map(([p, e]) => '(1+' + [...Array(e).keys()].map((i) => (i ? p + '^{' + (i + 1) + '}' : p)).join('+') + ')').join('')}$, on obtient chaque diviseur exactement une fois. Donc la somme vaut $${f.map(([p, e]) => (p ** (e + 1) - 1) / (p - 1)).join('\\times')}=${sig}$.`, 'Chaque diviseur est un produit 2^i 3^j 5^k : pense à développer (1 + 2 + 4 + …)(1 + 3 + …)…', 'Somme');
      },
      () => {
        const n = R.int(12, 150);
        let phi = 0;
        for (let k = 1; k <= n; k++) if (gcd(k, n) === 1) phi++;
        const ps = PRIMES.filter((p) => n % p === 0);
        return K.num(T`Combien y a-t-il de fractions ${B('irréductibles')} $\frac pn$ avec $1\leqslant p\leqslant n$, pour $n=${n}$ ? (C’est l’${B('indicatrice d’Euler')} $\varphi(${n})$.)`, phi, T`$\frac p{${n}}$ est irréductible quand $p$ n’a aucun facteur premier commun avec $${n}=${factorTex(n)}$. On retire les multiples de ${ps.map((p) => '$' + p + '$').join(', ')} (sans les compter deux fois) : $\varphi(${n})=${n}${ps.map((p) => T`\left(1-\frac1{${p}}\right)`).join('')}=${phi}$.`, 'Compte les p qui ne partagent aucun facteur premier avec n.', '$\\varphi(n)$');
      },
      () => {
        let g, x, y;
        do {
          g = R.int(2, 60);
          x = R.int(20, 300);
          y = R.int(20, 300);
        } while (gcd(x, y) !== 1 || x === y || g * Math.max(x, y) > 9999);
        let a = g * Math.max(x, y),
          b = g * Math.min(x, y);
        const steps = [];
        while (b) steps.push(T`$${a}=${b}\times${Math.floor(a / b)}+${a % b}$`), ([a, b] = [b, a % b]);
        return K.num(T`${B('Algorithme d’Euclide')} : $\text{PGCD}(a,b)=\text{PGCD}(b,r)$ où $r$ est le reste de la division de $a$ par $b$. Calcule $\text{PGCD}(${g * Math.max(x, y)},${g * Math.min(x, y)})$.`, g, steps.join(' ; ') + T`. Le dernier reste non nul est $${g}$ : c’est le PGCD. (Tout diviseur commun à $a$ et $b$ divise $r=a-bq$, et réciproquement.)`, 'Remplace (a, b) par (b, r) jusqu’à obtenir un reste nul.', 'PGCD');
      },
    ],
    n3: [
      () => {
        let x, y, a, b, X, Y;
        do {
          x = R.int(2, 7);
          y = R.int(x + 1, 30);
          [a, b] = red(x + y, x * y);
          X = 0;
          for (let t = Math.ceil(b / a); t <= x; t++) {
            const [u, v] = red(a * t - b, b * t);
            if (u === 1 && v > t) {
              X = t;
              Y = v;
              break;
            }
          }
        } while (!X || a === 1);
        return K.nums(T`Les Égyptiens écrivaient les fractions comme sommes de fractions « unitaires » $\frac1n$. Écris $\dfrac{${a}}{${b}}=\dfrac1x+\dfrac1y$ avec $x<y$ entiers, ${B('$x$ le plus petit possible')}.`, ['$x$', '$y$'], [X, Y], T`$\frac1x<\frac{${a}}{${b}}$ impose $x>\frac{${b}}{${a}}$, donc $x\geqslant${Math.ceil(b / a + 1e-9)}$. On essaie les valeurs dans l’ordre : la première pour laquelle $\frac{${a}}{${b}}-\frac1x$ est une fraction unitaire est $x=${X}$, et $\frac{${a}}{${b}}-\frac1{${X}}=\frac1{${Y}}$.`, 'Essaie x = ⌈b/a⌉, puis x + 1… et regarde si le reste est de la forme 1/y.', { inline: true });
      },
      () => {
        const n = R.int(4, 30);
        return kfrac(T`Calcule et donne le résultat sous forme irréductible : $$\sum_{k=1}^{${n}}\frac1{k(k+1)(k+2)}=\frac1{1\times2\times3}+\frac1{2\times3\times4}+\cdots+\frac1{${n}\times${n + 1}\times${n + 2}}$$ (Le symbole $\sum$ se lit « somme ».)`, n * (n + 3), 4 * (n + 1) * (n + 2), T`$\frac1{k(k+1)(k+2)}=\frac12\left(\frac1{k(k+1)}-\frac1{(k+1)(k+2)}\right)$ (vérifie-le en réduisant au même dénominateur). La somme est télescopique : $\frac12\left(\frac1{1\times2}-\frac1{${n + 1}\times${n + 2}}\right)=${ft(n * (n + 3), 4 * (n + 1) * (n + 2))}$.`, 'Écris chaque terme comme une différence de deux termes consécutifs d’une même suite.');
      },
      () => {
        let a, b, c, d;
        do {
          b = R.int(3, 15);
          a = R.int(1, b - 1);
          d = R.int(3, 15);
          c = R.int(1, d - 1);
        } while (gcd(a, b) !== 1 || gcd(c, d) !== 1 || a * d >= c * b || c * b - a * d < 2);
        let q = 1,
          p;
        for (;; q++) {
          p = Math.floor((q * a) / b) + 1;
          if (p * d < c * q) break;
        }
        return K.frac(T`Quelle est la fraction de ${B('plus petit dénominateur')} strictement comprise entre $\dfrac{${a}}{${b}}$ et $\dfrac{${c}}{${d}}$ ?`, p, q, T`On essaie les dénominateurs $q=1,2,3,\dots$ : pour chacun, le plus petit numérateur $p$ avec $\frac pq>\frac{${a}}{${b}}$ est $\left\lfloor\frac{${a}q}{${b}}\right\rfloor+1$, et on regarde s’il reste sous $\frac{${c}}{${d}}$. Le premier qui convient est $q=${q}$ : $\frac{${a}}{${b}}<\frac{${p}}{${q}}<\frac{${c}}{${d}}$. (Cette fraction est unique : c’est un résultat de l’arbre de Stern-Brocot.)`, 'Teste les dénominateurs un par un, en partant de 1.');
      },
    ],
    n4: [
      () => {
        const a = R.pick([3, 7, 9, 11, 13, 17, 19]),
          n = R.int(100, 2026);
        const c = cycleMod(a, 100),
          L = c.length,
          r = ((n - 1) % L) + 1;
        return K.num(T`Quel nombre forment les ${B('deux derniers chiffres')} de $${a}^{${n}}$ ? (Réponds par un entier de $0$ à $99$.)`, powmod(a, n, 100), T`On travaille modulo $100$. Les deux derniers chiffres des puissances de $${a}$ reviennent avec une période $${L}$ (car $${a}^{${L}}\equiv1\pmod{100}$). Or $${n}=${L}\times${Math.floor((n - 1) / L)}+${r}$, donc $${a}^{${n}}\equiv${a}^{${r}}\equiv${c[r - 1]}\pmod{100}$.`, 'Calcule les deux derniers chiffres de a, a², a³… jusqu’à retomber sur 01.', 'Deux derniers chiffres');
      },
      () => {
        let ps;
        do {
          ps = [];
          while (ps.length < 4) {
            const b = R.int(2, 9),
              k = R.int(1, 4);
            if (!ps.some((p) => p.b === b || p.v === b ** k)) ps.push({ b, k, v: b ** k });
          }
          ps.sort((x, y) => y.v - x.v);
        } while (ps[0].v / ps[1].v < 1.15);
        const g = R.pick([5, 10, 12]);
        return K.choice(T`Lequel de ces nombres est le plus grand ?`, ps.map((p) => T`$${p.b}^{${g * p.k}}$`), T`On écrit tout avec le même exposant $${g}$ : ` + ps.map((p) => T`$${p.b}^{${g * p.k}}=\left(${p.b}^{${p.k}}\right)^{${g}}=${p.v}^{${g}}$`).join(', ') + T`. Comme $x\mapsto x^{${g}}$ est croissante sur les positifs, il suffit de comparer $${ps.map((p) => p.v).join(',\\,')}$.`, 'Les exposants ont un diviseur commun : fais-le apparaître.');
      },
      () => {
        let n, f;
        do {
          n = R.int(50, 1000);
          f = n * Math.log10(2) - Math.floor(n * Math.log10(2));
        } while (f < 0.003 || f > 0.997);
        const d = Math.floor(n * Math.log10(2)) + 1;
        return K.num(T`On admet que $10^{0{,}30103}\approx2$ (on dit que $\log_{10}2\approx0{,}30103$). Combien de chiffres l’entier $2^{${n}}$ a-t-il ?`, d, T`$2^{${n}}\approx10^{${n}\times0{,}30103}=10^{${(n * 0.30103).toFixed(3).replace('.', '{,}')}}$. Un entier compris entre $10^{${d - 1}}$ et $10^{${d}}$ a $${d}$ chiffres.`, 'Écris 2ⁿ comme une puissance de 10, puis encadre l’exposant entre deux entiers.', 'Nombre de chiffres');
      },
    ],
    n5: [
      CU.needs(['q3'], () => {
        let d, r, c, sols;
        do {
          d = R.int(0, 4);
          r = R.int(d + 1, d + 8);
          c = (r - d) ** 2 - r;
          const s = 2 * d + 1 - r;
          sols = [r];
          if (s >= d && s !== r) sols.push(s);
        } while (c === 0 && d === 0);
        const other = 2 * d + 1 - r;
        const lhs = c === 0 ? '\\sqrt{x}' : '\\sqrt{x' + (c > 0 ? '+' + c : c) + '}',
          rhs = d ? 'x-' + d : 'x';
        return K.set(T`Résous dans $\mathbb R$ l’équation $${lhs}=${rhs}$.`, sols.sort((x, y) => x - y), T`Une racine est positive : il faut $${rhs}\geqslant0$, soit $x\geqslant${d}$. Sous cette condition, on élève au carré : $x${c > 0 ? '+' + c : c < 0 ? c : ''}=(${rhs})^2$, soit $x^2-${2 * d + 1}x+${d * d - c < 0 ? '(' + (d * d - c) + ')' : d * d - c}=0$, de racines $${r}$ et $${other}$. ${other < d ? T`Mais $${other}<${d}$ : cette racine ne vérifie pas la condition (on l’a introduite en élevant au carré, qui n’est pas une équivalence).` : other === r ? '' : T`Les deux vérifient $x\geqslant${d}$.`} Solutions : $${sols.join(' ; ')}$.`, 'Pose la condition x ≥ … (une racine est positive), puis élève au carré et vérifie les solutions.');
      }),
      () => {
        const m = R.int(2, 9),
          a = m * (m - 1);
        return K.num(T`On construit $u_1=\sqrt{${a}}$, $u_2=\sqrt{${a}+\sqrt{${a}}}$, $u_3=\sqrt{${a}+\sqrt{${a}+\sqrt{${a}}}}$… Ces nombres se rapprochent d’une ${B('limite')} $\ell$, qu’on note $\sqrt{${a}+\sqrt{${a}+\sqrt{${a}+\cdots}}}$. Que vaut $\ell$ ?`, m, T`Sous le premier radical, on retrouve la même expression : $\ell=\sqrt{${a}+\ell}$, donc $\ell^2=${a}+\ell$ et $\ell\geqslant0$. $\ell^2-\ell-${a}=(\ell-${m})(\ell+${m - 1})=0$ et $\ell\geqslant0$ : $\ell=${m}$. (Que la suite converge vraiment se démontre en terminale.)`, 'L’expression se contient elle-même : ℓ = √(a + ℓ).');
      },
      () => {
        let x, y;
        do {
          y = R.int(1, 7);
          x = R.int(y + 1, 12);
        } while (Number.isInteger(Math.sqrt(x * y)));
        return K.nums(T`Trouve deux entiers $x>y>0$ tels que $$\sqrt{${x + y}-2\sqrt{${x * y}}}=\sqrt x-\sqrt y$$`, ['$x$', '$y$'], [x, y], T`$(\sqrt x-\sqrt y)^2=x+y-2\sqrt{xy}$ : il faut $x+y=${x + y}$ et $xy=${x * y}$, d’où $x=${x}$ et $y=${y}$. Et $x>y$ assure $\sqrt x-\sqrt y>0$ : sans cette condition, on aurait trouvé l’opposé d’une racine carrée, qui ne peut pas être négative.`, 'Élève au carré, et fais attention au signe.', { inline: true });
      },
    ],
    n6: [
      () => {
        const q = R.pick([7, 13, 17, 19, 21, 27, 37, 41]);
        let p;
        do p = R.int(1, q - 1);
        while (gcd(p, q) !== 1);
        const n = R.int(100, 3000);
        const digs = [];
        let r = p;
        do {
          digs.push(Math.floor((10 * r) / q));
          r = (10 * r) % q;
        } while (r !== p);
        const L = digs.length,
          k = ((n - 1) % L) + 1;
        return K.num(T`Quel est le $${n}$<sup>e</sup> chiffre après la virgule dans l’écriture décimale de $\dfrac{${p}}{${q}}$ ?`, digs[k - 1], T`La division de $${p}$ par $${q}$ retombe sur le reste $${p}$ après $${L}$ chiffres : $\frac{${p}}{${q}}=0{,}\overline{${digs.join('')}}$ (période $${L}$). Comme $${n}=${L}\times${Math.floor((n - 1) / L)}+${k}$, le chiffre cherché est le $${k}$<sup>e</sup> de la période : $${digs[k - 1]}$.`, 'Pose la division jusqu’à retrouver un reste déjà vu : l’écriture est alors périodique.', 'Chiffre');
      },
      CU.needs(['f2'], () => {
        const RAT = [[T`\left(\sqrt3-1\right)\left(\sqrt3+1\right)`, T`$(\sqrt3)^2-1=2$`], [T`\sqrt8\times\sqrt2`, T`$\sqrt{16}=4$`], [T`\dfrac{\sqrt{12}}{\sqrt3}`, T`$\sqrt4=2$`], [T`\left(\sqrt5+1\right)^2-2\sqrt5`, T`$5+2\sqrt5+1-2\sqrt5=6$`]];
        const IRR = [[T`\sqrt2+\sqrt8`, T`$3\sqrt2$`], [T`\dfrac{\sqrt{12}}{\sqrt2}`, T`$\sqrt6$`], [T`\left(1+\sqrt2\right)^2`, T`$3+2\sqrt2$`], [T`\sqrt3\times\sqrt6`, T`$3\sqrt2$`], [T`\pi-3`, T`irrationnel`]];
        const good = R.pick(RAT),
          bad = R.shuffle(IRR).slice(0, 3);
        return K.choice(T`Lequel de ces nombres est ${B('rationnel')} ?`, [good, ...bad].map((x) => '$' + x[0] + '$'), T`$${good[0]}=${good[1].slice(1, -1)}$. Les autres : ` + bad.map((x) => T`$${x[0]}$ vaut ${x[1]}`).join(', ') + T`, irrationnels (un rationnel non nul fois $\sqrt2$, ou $\sqrt6$, ne peut pas être rationnel).`, 'Simplifie chaque nombre.');
      }),
      () =>
        K.order(
          T`On note $\log_{10}2$ le nombre $x$ tel que $10^x=2$. ${B('Théorème.')} $\log_{10}2$ est irrationnel. Remets la démonstration dans l’ordre.`,
          [T`Supposons $\log_{10}2=\frac pq$ avec $p,q$ entiers strictement positifs.`, T`Alors $10^{p/q}=2$, donc $10^p=2^q$ (en élevant à la puissance $q$).`, T`Donc $2^p\times5^p=2^q$ : le facteur $5$ apparaît à gauche ($p\geqslant1$) mais pas à droite.`, T`C’est impossible (décomposition unique en facteurs premiers) : $\log_{10}2$ est irrationnel.`],
          [R.pick([T`$\log_{10}2\approx0{,}30103$ n’est pas périodique, donc il est irrationnel.`, T`Donc $10=2$, contradiction.`])],
          T`On suppose le contraire, on élimine l’exposant fractionnaire en élevant à la puissance $q$, et l’unicité de la décomposition en facteurs premiers conclut. ($p>0$ car $1<2<10$.)`,
          'Que devient 10^(p/q) = 2 si on élève à la puissance q ?',
        ),
    ],
    n7: [
      () => {
        const a = R.int(-8, 4),
          b = R.int(a + 1, 9),
          strict = R.int(0, 1) === 1;
        const c = b - a + R.pick([-1, 0, 2, 4, 6]);
        const ivs = c > b - a || (c === b - a && !strict) ? ivOf((a + b - c) / 2, (a + b + c) / 2, !strict, !strict) : [];
        const op = strict ? '<' : '\\leqslant';
        return K.interval(T`Donne l’ensemble des réels $x$ tels que $|${xm(a)}|+|${xm(b)}|${op}${c}$.`, CU.IV.str(ivs), T`La somme des distances de $x$ à $${a}$ et à $${b}$ vaut $${b - a}$ entre les deux points, et augmente de $2$ par unité d’éloignement à l’extérieur. ${ivs.length ? T`Elle est ${strict ? 'strictement inférieure à' : 'au plus'} $${c}$ quand on ne s’éloigne pas de plus de $${ft(c - (b - a), 2)}$ de chaque côté : $${ivTex(CU.IV.str(ivs))}$.` : T`Elle vaut toujours au moins $${b - a}$, donc ne peut pas être ${strict ? 'strictement inférieure à' : 'inférieure ou égale à'} $${c}$ : $\varnothing$.`}`, 'Somme de deux distances : dessine les deux points.');
      },
      () => {
        const a = R.int(2, 9),
          r = R.int(1, a + 2);
        const ivs = [...ivOf(-a - r, -a + r, true, true), ...ivOf(a - r, a + r, true, true)];
        return K.interval(T`Donne l’ensemble des réels $x$ tels que $\big||x|-${a}\big|\leqslant${r}$.`, CU.IV.str(ivs), T`$\big||x|-${a}\big|\leqslant${r}\iff${a - r}\leqslant|x|\leqslant${a + r}$. ${r < a ? T`Comme $${a - r}>0$, $|x|$ est entre $${a - r}$ et $${a + r}$ : $x$ est dans l’un des deux intervalles symétriques $[${-a - r}\,;\,${-a + r}]$ et $[${a - r}\,;\,${a + r}]$.` : T`Comme $${a - r}\leqslant0$, la condition de gauche est toujours vraie : il reste $|x|\leqslant${a + r}$.`} Réponse : $${ivTex(CU.IV.str(ivs))}$.`, 'Commence par encadrer |x|, puis reviens à x.');
      },
      () => {
        const j = R.int(2, 4),
          k = R.pick([1, 2, 3, 4, 6, 7, 8, 9]);
        const n = Math.floor(10 ** j / k) + 1;
        return K.num(T`Pour $\varepsilon=${dtex(k, j)}$, quel est le plus petit entier $n\geqslant1$ tel que $\frac1n<\varepsilon$ ? (C’est la clé de « $\frac1n$ tend vers $0$ » : $\forall\varepsilon>0,\ \exists N,\ \forall n\geqslant N,\ \frac1n<\varepsilon$.)`, n, T`$\frac1n<${dtex(k, j)}\iff n>\frac1{${dtex(k, j)}}=${decT(10 ** j / k)}$${10 ** j % k ? '' : ' (inégalité stricte : on exclut cette valeur)'}. Le plus petit entier qui convient est $${n}$.`, 'Inverse l’inégalité (tout est positif).', '$n$');
      },
    ],
    n8: [
      () => {
        let n;
        do n = R.int(2, 60);
        while (Number.isInteger(Math.sqrt(n)));
        const x0 = Math.floor(Math.sqrt(n));
        const [p1, q1] = red(x0 * x0 + n, 2 * x0);
        const [p2, q2] = red(p1 * p1 + n * q1 * q1, 2 * p1 * q1);
        return K.frac(T`${B('Méthode de Héron')} pour approcher $\sqrt{${n}}$ : on part de $x_0=${x0}$ et on calcule $x_{k+1}=\frac12\left(x_k+\frac{${n}}{x_k}\right)$. Donne $x_2$ sous forme de fraction irréductible.`, p2, q2, T`$x_1=\frac12\left(${x0}+\frac{${n}}{${x0}}\right)=${ft(p1, q1)}$, puis $x_2=\frac12\left(${ft(p1, q1)}+\frac{${n}}{${ft(p1, q1)}}\right)=${ft(p2, q2)}\approx${(p2 / q2).toFixed(6).replace('.', '{,}')}$, alors que $\sqrt{${n}}\approx${Math.sqrt(n).toFixed(6).replace('.', '{,}')}$. Le nombre de décimales justes double à peu près à chaque étape.`, 'Calcule x₁ puis x₂ en fractions, sans arrondir.');
      },
      () => {
        const a = R.int(2, 20),
          b = R.int(2, 20);
        return K.num(T`On sait que $|x-${a}|\leqslant0{,}1$ et $|y-${b}|\leqslant0{,}1$. Quel est le plus grand écart possible entre $xy$ et $${a}\times${b}$ ?`, (a + b) / 10 + 1 / 100, T`Écrivons $x=${a}+u$ et $y=${b}+v$ avec $|u|,|v|\leqslant0{,}1$ : $xy-${a * b}=${b}u+${a}v+uv$. L’écart est maximal pour $u=v=0{,}1$ : $${b}\times0{,}1+${a}\times0{,}1+0{,}01=${decT((a + b) / 10 + 0.01)}$. Les erreurs relatives s’ajoutent, à peu près, dans un produit.`, 'Écris x = a + u, y = b + v et développe.', 'Écart maximal');
      },
      () => {
        const k = R.int(1, 6);
        const n = Math.floor(k * Math.log2(10)) + 1;
        return K.num(T`On part d’un intervalle de longueur $1$ et on applique la dichotomie (chaque étape divise la longueur par $2$). Combien d’étapes faut-il au minimum pour obtenir une longueur strictement inférieure à $10^{-${k}}$ ?`, n, T`Après $n$ étapes, la longueur vaut $\frac1{2^n}$. Il faut $2^n>10^{${k}}$ : $2^{${n - 1}}=${2 ** (n - 1)}${2 ** (n - 1) > 10 ** k ? '>' : '\\leqslant'}10^{${k}}$ mais $2^{${n}}=${2 ** n}>10^{${k}}$. Il faut donc $${n}$ étapes (environ $3{,}32$ par décimale, car $2^{10}\approx10^3$).`, 'Cherche la plus petite puissance de 2 qui dépasse 10ᵏ.', 'Étapes');
      },
    ],
    n11: [
      () => {
        const v = R.pick([
          { q: T`La période $T$ (en s) d’un pendule ne dépend que de sa longueur $L$ (en m) et de la pesanteur $g$ (en m·s⁻²) : $T=k\,L^a g^b$ avec $k$ sans unité.`, a: 0.5, b: -0.5, s: T`Unités : $\text{m}^a\,(\text{m}\,\text{s}^{-2})^b=\text{m}^{a+b}\,\text{s}^{-2b}$ doit valoir $\text{s}$. Donc $-2b=1$ et $a+b=0$ : $b=-\frac12$, $a=\frac12$, et $T=k\sqrt{L/g}$ (on trouve $k=2\pi$ en terminale).` },
          { q: T`La vitesse $v$ (en m/s) d’une vague en eau peu profonde ne dépend que de $g$ (en m·s⁻²) et de la profondeur $h$ (en m) : $v=k\,g^a h^b$ avec $k$ sans unité.`, a: 0.5, b: 0.5, s: T`$(\text{m}\,\text{s}^{-2})^a\,\text{m}^b=\text{m}^{a+b}\,\text{s}^{-2a}$ doit valoir $\text{m}\,\text{s}^{-1}$ : $-2a=-1$ et $a+b=1$, donc $a=b=\frac12$ et $v=k\sqrt{gh}$.` },
          { q: T`La durée $t$ (en s) de la chute d’un objet lâché d’une hauteur $h$ (en m) ne dépend que de $h$ et de $g$ (en m·s⁻²) : $t=k\,h^a g^b$ avec $k$ sans unité.`, a: 0.5, b: -0.5, s: T`$\text{m}^a(\text{m}\,\text{s}^{-2})^b=\text{m}^{a+b}\text{s}^{-2b}=\text{s}$ : $b=-\frac12$, $a=\frac12$, donc $t=k\sqrt{h/g}$ (et $k=\sqrt2$).` },
          { q: T`L’énergie cinétique $E$ (en kg·m²·s⁻²) d’un objet ne dépend que de sa masse $m$ (en kg) et de sa vitesse $v$ (en m/s) : $E=k\,m^a v^b$ avec $k$ sans unité.`, a: 1, b: 2, s: T`$\text{kg}^a(\text{m}\,\text{s}^{-1})^b=\text{kg}^a\text{m}^b\text{s}^{-b}$ doit valoir $\text{kg}\,\text{m}^2\text{s}^{-2}$ : $a=1$, $b=2$, donc $E=k\,mv^2$ (et $k=\frac12$).` },
        ]);
        return K.nums(T`${B('Analyse dimensionnelle.')} ${v.q} Trouve $a$ et $b$ pour que les unités soient cohérentes.`, ['$a$', '$b$'], [v.a, v.b], v.s, 'Écris les unités de chaque côté et identifie les exposants de m, s, kg.', { inline: true });
      },
      () => {
        const v1 = R.pick([4, 5, 6, 8, 10, 12, 15]),
          v2 = R.pick([3, 5, 6, 9, 10, 12, 20]);
        let d;
        do d = R.int(2, 60);
        while (((60 * d) % (v1 + v2)) !== 0);
        return K.num(T`Deux messagers partent au même instant de deux tours distantes de $${d}$ km et marchent l’un vers l’autre, à $${v1}$ km/h et $${v2}$ km/h. Au bout de combien de ${B('minutes')} se rencontrent-ils ?`, (60 * d) / (v1 + v2), T`La distance qui les sépare diminue de $${v1}+${v2}=${v1 + v2}$ km chaque heure (vitesse ${B('relative')}). Durée : $\frac{${d}}{${v1 + v2}}$ h $=${(60 * d) / (v1 + v2)}$ min.`, 'De combien la distance diminue-t-elle chaque heure ?', 'Durée (min)');
      },
      () => {
        const k = R.pick([10, 20, 25, 50]),
          m = R.pick([40, 80, 120, 200, 250, 400]);
        return K.num(T`Une maquette au $1/${k}$ d’une statue de bronze, faite du même bronze, a une masse de $${m}$ g. Quelle est la masse de la statue, en ${B('kilogrammes')} ?`, (m * k ** 3) / 1000, T`Toutes les longueurs sont multipliées par $${k}$, donc le volume (et la masse, même matériau) par $${k}^3=${k ** 3}$ : $${m}\times${k ** 3}=${m * k ** 3}$ g $=${decT((m * k ** 3) / 1000)}$ kg.`, 'Même matériau : la masse suit le volume.', 'Masse (kg)');
      },
    ],
  };
  const LEG_TXT = {
    n1: [T`<p>Au rang ${B('Légende')}, l’arithmétique devient un jeu de restes. On écrit $a\equiv b\pmod n$ quand $a$ et $b$ ont le même reste dans la division par $n$ ; on peut additionner et multiplier ces congruences. Les restes des puissances $a,a^2,a^3,\dots$ sont périodiques.</p><p>La ${B('factorielle')} $n!=1\times2\times\cdots\times n$ se termine par autant de zéros qu’elle contient de facteurs $5$.</p>`, T`<ol class="meth"><li>Puissance modulo $m$ : liste les restes de $a,a^2,\dots$ jusqu’au retour à $1$, puis réduis l’exposant modulo la période.</li><li>Zéros de $n!$ : $\lfloor n/5\rfloor+\lfloor n/25\rfloor+\lfloor n/125\rfloor+\cdots$</li><li>Restes imposés : regarde $n-1$ ou $n+1$, multiple commun de tous les diviseurs.</li></ol>`],
    n2: [T`<p>Avec la décomposition $n=p^aq^b\cdots$ on calcule tout : le nombre de diviseurs $(a+1)(b+1)\cdots$, leur somme $(1+p+\cdots+p^a)(1+q+\cdots+q^b)\cdots$, et l’${B('indicatrice d’Euler')} $\varphi(n)=n\left(1-\frac1p\right)\left(1-\frac1q\right)\cdots$, nombre d’entiers de $1$ à $n$ premiers avec $n$.</p><p>L’${B('algorithme d’Euclide')} donne le PGCD sans décomposer : $\text{PGCD}(a,b)=\text{PGCD}(b,r)$.</p>`, T`<ol class="meth"><li>Somme des diviseurs : un facteur $1+p+\cdots+p^a=\frac{p^{a+1}-1}{p-1}$ par nombre premier.</li><li>$\varphi(n)$ : retire la proportion $\frac1p$ pour chaque facteur premier $p$.</li><li>Euclide : divisions successives ; le dernier reste non nul est le PGCD.</li></ol>`],
    n3: [T`<p>Au-delà : les ${B('fractions égyptiennes')} (sommes de $\frac1n$), les sommes télescopiques plus fines ($\frac1{k(k+1)(k+2)}$), et la recherche de la fraction la plus « simple » dans un intervalle, qui mène à l’arbre de Stern-Brocot.</p>`, T`<ol class="meth"><li>Égyptienne : $x>\frac ba$ ; essaie les $x$ dans l’ordre.</li><li>Télescopage : écris le terme comme différence de deux termes consécutifs.</li><li>Plus petit dénominateur : teste $q=1,2,3,\dots$</li></ol>`],
    n4: [T`<p>Modulo $100$, les deux derniers chiffres des puissances sont périodiques. Le ${B('logarithme décimal')} $\log_{10}x$ est l’exposant $y$ tel que $10^y=x$ : $\log_{10}2\approx0{,}30103$ dit que $2^{n}$ a environ $0{,}3n$ chiffres.</p>`, T`<ol class="meth"><li>Deux derniers chiffres : calcule modulo $100$.</li><li>Comparer $a^{gm}$ et $b^{gn}$ : compare $a^m$ et $b^n$.</li><li>Nombre de chiffres de $2^n$ : $\lfloor0{,}30103\,n\rfloor+1$.</li></ol>`],
    n5: [T`<p>Élever au carré n’est pas une équivalence : $\sqrt{A}=B$ équivaut à « $B\geqslant0$ et $A=B^2$ ». Les solutions parasites se reconnaissent à la condition.</p><p>Un ${B('radical infini')} $\sqrt{a+\sqrt{a+\cdots}}$ vérifie $\ell=\sqrt{a+\ell}$.</p>`, T`<ol class="meth"><li>$\sqrt A=B$ : pose $B\geqslant0$, élève au carré, résous, vérifie.</li><li>Expression qui se répète : appelle-la $\ell$ et écris l’équation qu’elle vérifie.</li><li>$\sqrt{s-2\sqrt t}=\sqrt x-\sqrt y$ avec $x>y$.</li></ol>`],
    n6: [T`<p>L’écriture décimale de $\frac pq$ est périodique, de période au plus $q-1$. L’irrationalité de $\log_{10}2$ repose, comme celle de $\sqrt2$, sur l’unicité de la décomposition en facteurs premiers.</p>`, T`<ol class="meth"><li>$n$<sup>e</sup> chiffre : trouve la période, puis le reste de $n$ dans la division par sa longueur.</li><li>Rationnel ou non : simplifie l’expression.</li><li>Irrationalité : par l’absurde, ramène à une égalité entre entiers impossible.</li></ol>`],
    n7: [T`<p>Les valeurs absolues imbriquées se traitent couche par couche : $\big||x|-a\big|\leqslant r\iff a-r\leqslant|x|\leqslant a+r$.</p><p>« $\frac1n$ tend vers $0$ » s’écrit $\forall\varepsilon>0,\ \exists N,\ \forall n\geqslant N,\ \frac1n<\varepsilon$ : c’est la définition d’une ${B('limite')}.</p>`, T`<ol class="meth"><li>Somme de distances : dessine, la somme est constante entre les deux points.</li><li>Couches : encadre d’abord ce qui est dans la valeur absolue extérieure.</li><li>$\frac1n<\varepsilon\iff n>\frac1\varepsilon$.</li></ol>`],
    n8: [T`<p>La ${B('méthode de Héron')} approche $\sqrt n$ en remplaçant $x$ par la moyenne de $x$ et $\frac nx$ : le nombre de décimales justes double à chaque étape. La dichotomie, elle, gagne une décimale toutes les $3$ ou $4$ étapes.</p><p>Dans un produit, les incertitudes se combinent : $(a+u)(b+v)-ab=bu+av+uv$.</p>`, T`<ol class="meth"><li>Héron : calcule en fractions exactes.</li><li>Incertitude d’un produit : $|b|\,|u|+|a|\,|v|+|u|\,|v|$.</li><li>Dichotomie : plus petit $n$ avec $2^n>10^k$.</li></ol>`],
    n11: [T`<p>L’${B('analyse dimensionnelle')} : une formule physique doit avoir les mêmes unités des deux côtés. Cela suffit souvent à trouver sa forme, à une constante près. La ${B('vitesse relative')} de deux mobiles qui se rapprochent est la somme de leurs vitesses.</p>`, T`<ol class="meth"><li>Écris les unités de chaque grandeur avec des exposants (m, s, kg).</li><li>Égalise les exposants de chaque unité : on obtient un système.</li><li>Masse d’une maquette : même matériau, donc rapport des volumes $k^3$.</li></ol>`],
  };
  for (const [id, gens] of Object.entries(LEG)) {
    const s = CU.SKILLS[id];
    s.gen[3] = CU.oneOf(...gens);
    s.lessons[3] = LEG_TXT[id][0];
    s.methods[3] = LEG_TXT[id][1];
  }
})();
