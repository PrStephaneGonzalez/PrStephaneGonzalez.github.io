/* Région 1 — Les Remparts de Vectre : les vecteurs. */
'use strict';
(function () {
  const { R, T, K, N, num, sqTex } = CU;
  const G = (pts = [], vecs = []) => ({ x0: -7, x1: 7, y0: -5, y1: 5, pts, vecs });
  const inG = (x, y, m = 0) => x >= -7 + m && x <= 7 - m && y >= -5 + m && y <= 5 - m;
  const LET = ['A', 'B', 'C', 'D', 'E', 'F'];
  // point de grille au hasard dans un cadre
  const gp = (m = 1) => [R.int(-7 + m, 7 - m), R.int(-5 + m, 5 - m)];
  const pickTarget = (q, ans, sol, hint, grid) => ({
    type: 'grid',
    q,
    grid,
    check: (p) => (p[0] === ans[0] && p[1] === ans[1] ? { ok: true } : { ok: false, msg: T`Tu as visé $${N.co(p[0], p[1])}$. Recompte les carreaux.` }),
    answerPt: ans,
    sol,
    hint,
  });

  /* ---------- V1 Les flèches du vent ---------- */
  CU.addSkill({
    id: 'v1',
    region: 'vec',
    name: 'Les flèches du vent',
    place: 'La Girouette brisée',
    glyph: '➶',
    x: 180,
    y: 860,
    flavor: 'Ici, le vent ne souffle plus. Il attend qu’on lui dise où aller.',
    law: T`Un vecteur est un déplacement. $\vec u\begin{pmatrix}x\\y\end{pmatrix}$ : $x$ carreaux à droite (à gauche si $x<0$), $y$ vers le haut (vers le bas si $y<0$). Pour $A(x_A;y_A)$ et $B(x_B;y_B)$ : $\overrightarrow{AB}\begin{pmatrix}x_B-x_A\\y_B-y_A\end{pmatrix}$.`,
    lessons: [
      T`<p>Un <b>vecteur</b> décrit un <b>déplacement</b> : une direction, un sens, une longueur. Il ne dépend pas de l’endroit d’où l’on part : la même flèche peut être dessinée partout.</p>
<p>Ses <b>coordonnées</b> $\vec u\begin{pmatrix}x\\y\end{pmatrix}$ disent de combien on se déplace : $x$ horizontalement (positif vers la droite), $y$ verticalement (positif vers le haut).</p>
<p class="ex">Exemple : la flèche qui va de $(1;2)$ à $(4;1)$ se déplace de $3$ vers la droite et de $1$ vers le bas : $\vec u\begin{pmatrix}3\\-1\end{pmatrix}$.</p>`,
      T`<p>La <b>translation de vecteur</b> $\vec u$ envoie chaque point $M$ sur le point $M'$ tel que $\overrightarrow{MM'}=\vec u$ : on applique le déplacement à partir de $M$.</p>
<p class="ex">Si $A(2;-1)$ et $\vec u\begin{pmatrix}-3\\4\end{pmatrix}$, l’image de $A$ est $A'(2-3\,;\,-1+4)=A'(-1;3)$.</p>`,
      T`<p>Pour deux points $A(x_A;y_A)$ et $B(x_B;y_B)$ : $$\overrightarrow{AB}\begin{pmatrix}x_B-x_A\\y_B-y_A\end{pmatrix}$$ « arrivée moins départ ». Inversement, si l’on connaît $A$ et $\overrightarrow{AB}$, on trouve $B$ en ajoutant : $x_B = x_A + x$, $y_B = y_A + y$.</p>
<p class="ex">$A(-12;7)$, $B(5;-3)$ : $\overrightarrow{AB}\begin{pmatrix}5-(-12)\\-3-7\end{pmatrix}=\begin{pmatrix}17\\-10\end{pmatrix}$.</p>`,
    ],
    gen: [
      () => {
        let a, d;
        do {
          a = gp(0);
          d = [R.int(-6, 6), R.int(-5, 5)];
        } while (!inG(a[0] + d[0], a[1] + d[1]) || (d[0] === 0 && d[1] === 0) || Math.abs(d[0]) + Math.abs(d[1]) < 3);
        const b = [a[0] + d[0], a[1] + d[1]];
        return {
          ...K.vec(
            T`Le vent spectral a tracé la flèche $\vec u$. Quelles sont ses coordonnées ?`,
            d[0],
            d[1],
            T`De l’origine de la flèche à sa pointe : ${d[0] >= 0 ? d[0] + ' vers la droite' : -d[0] + ' vers la gauche'}, ${d[1] >= 0 ? d[1] + ' vers le haut' : -d[1] + ' vers le bas'}. Donc $\vec u${N.col(d[0], d[1])}$.`,
            'Compte les carreaux de l’origine de la flèche jusqu’à sa pointe : d’abord horizontalement, puis verticalement. Vers la gauche ou vers le bas, c’est négatif.',
          ),
          grid: G([], [{ a, b, l: 'u', c: 'v' }]),
          showGrid: true,
        };
      },
      () => {
        let a, d;
        do {
          a = gp(0);
          d = [R.nz(-6, 6), R.nz(-5, 5)];
        } while (!inG(a[0] + d[0], a[1] + d[1]));
        const b = [a[0] + d[0], a[1] + d[1]];
        return pickTarget(
          T`Applique au point $A$ la translation de vecteur $\vec u${N.col(d[0], d[1])}$. Touche l’image $A'$.`,
          b,
          T`$A${N.co(a[0], a[1])}$, on ajoute les coordonnées de $\vec u$ : $A'(${num(a[0])}${N.s(d[0])}\,;\,${num(a[1])}${N.s(d[1])}) = A'${N.co(b[0], b[1])}$.`,
          'Pars de A et déplace-toi d’autant de carreaux que l’indiquent les coordonnées de u : la première horizontalement, la seconde verticalement.',
          G([{ x: a[0], y: a[1], l: 'A' }]),
        );
      },
      CU.oneOf(
        () => {
          const A = [R.int(-20, 20), R.int(-20, 20)],
            B = [R.int(-20, 20), R.int(-20, 20)];
          return K.vec(
            T`Les deux pierres de guet sont en $${N.pt('A', ...A)}$ et $${N.pt('B', ...B)}$. Donne les coordonnées de $${N.vec('AB')}$.`,
            B[0] - A[0],
            B[1] - A[1],
            T`Arrivée moins départ : $${N.vec('AB')}\begin{pmatrix}${num(B[0])}-${N.p(A[0])}\\${num(B[1])}-${N.p(A[1])}\end{pmatrix} = ${N.col(B[0] - A[0], B[1] - A[1])}$.`,
            'Coordonnées de AB : (x_B − x_A ; y_B − y_A). Attention aux soustractions de nombres négatifs.',
          );
        },
        () => {
          const A = [R.int(-15, 15), R.int(-15, 15)],
            u = [R.nz(-15, 15), R.nz(-15, 15)];
          const B = [A[0] + u[0], A[1] + u[1]];
          return K.vec(
            T`On part de $${N.pt('A', ...A)}$ et l’on sait que $${N.vec('AB')}${N.col(...u)}$. Où se trouve $B$ ?`,
            B[0],
            B[1],
            T`$x_B = x_A + ${N.p(u[0])} = ${num(B[0])}$ et $y_B = y_A + ${N.p(u[1])} = ${num(B[1])}$, donc $${N.pt('B', ...B)}$.`,
            'x_B − x_A doit valoir la première coordonnée de AB : donc x_B = x_A + cette coordonnée.',
            ['$x_B$', '$y_B$'],
          );
        },
        () => {
          const B = [R.int(-15, 15), R.int(-15, 15)],
            u = [R.nz(-12, 12), R.nz(-12, 12)];
          const A = [B[0] - u[0], B[1] - u[1]];
          return K.vec(
            T`La flèche $${N.vec('AB')}${N.col(...u)}$ arrive en $${N.pt('B', ...B)}$. D’où est-elle partie ?`,
            A[0],
            A[1],
            T`$x_B - x_A = ${num(u[0])}$ donc $x_A = ${num(B[0])} - ${N.p(u[0])} = ${num(A[0])}$ ; de même $y_A = ${num(B[1])} - ${N.p(u[1])} = ${num(A[1])}$.`,
            'Cette fois on connaît l’arrivée : remonte le déplacement en soustrayant.',
            ['$x_A$', '$y_A$'],
          );
        },
      ),
    ],
  });

  /* ---------- V2 Le carrefour des vents (somme, Chasles) ---------- */
  function chasles() {
    const k = R.int(3, 4);
    const pts = R.shuffle(LET.slice(0, 5)).slice(0, k + 1);
    if (Math.random() < 0.2) pts[k] = pts[0];
    const terms = [];
    for (let i = 0; i < k; i++) {
      const [p, q] = [pts[i], pts[i + 1]];
      terms.push(Math.random() < 0.45 ? { s: -1, v: q + p } : { s: 1, v: p + q });
    }
    const tt = R.shuffle(terms);
    const expr = tt.map((t, i) => (i === 0 ? (t.s < 0 ? '-' : '') : t.s < 0 ? ' - ' : ' + ') + N.vec(t.v)).join('');
    const ans = pts[0] === pts[k] ? '\\vec{0}' : N.vec(pts[0] + pts[k]);
    const others = new Set();
    if (pts[0] !== pts[k]) others.add(N.vec(pts[k] + pts[0]));
    while (others.size < 3) {
      const a = R.pick(pts),
        b = R.pick(LET.slice(0, 5));
      const c = a === b ? '\\vec{0}' : N.vec(a + b);
      if (c !== ans) others.add(c);
    }
    const chain = terms.map((t) => (t.s < 0 ? T`$-${N.vec(t.v)} = ${N.vec(t.v[1] + t.v[0])}$` : '')).filter(Boolean);
    return K.choice(
      T`Simplifie la formule de vent : $$${expr}$$`,
      ['$' + ans + '$', ...[...others].slice(0, 3).map((o) => '$' + o + '$')],
      T`${chain.length ? 'On retourne d’abord les flèches soustraites : ' + chain.join(', ') + '. ' : ''}Puis on les met bout à bout (relation de Chasles) : on va de $${pts[0]}$ ${pts
        .slice(1, -1)
        .map((p) => 'à $' + p + '$')
        .join(', ')}, puis à $${pts[k]}$. Résultat : $${ans}$.`,
      'Retourne d’abord chaque vecteur soustrait : −AB = BA. Puis enchaîne les flèches dont l’arrivée de l’une est le départ de la suivante.',
    );
  }
  CU.addSkill({
    id: 'v2',
    region: 'vec',
    name: 'Le carrefour des vents',
    place: 'Le Carrefour des Vents',
    glyph: '✣',
    x: 380,
    y: 700,
    flavor: 'Deux vents se croisent. Lequel l’emporte ? Les deux, si l’on sait les additionner.',
    law: T`$\vec u+\vec v$ : on met les flèches bout à bout ; en coordonnées, on additionne. Relation de Chasles : $\overrightarrow{AB}+\overrightarrow{BC}=\overrightarrow{AC}$, et $-\overrightarrow{AB}=\overrightarrow{BA}$.`,
    lessons: [
      T`<p>Faire le déplacement $\vec u$ puis le déplacement $\vec v$, c’est faire le déplacement $\vec u+\vec v$. Graphiquement : on place l’origine de $\vec v$ au bout de $\vec u$ ; la somme va du départ de $\vec u$ jusqu’au bout de $\vec v$.</p>`,
      T`<p>En coordonnées, on additionne composante par composante : $$\begin{pmatrix}x\\y\end{pmatrix}+\begin{pmatrix}x'\\y'\end{pmatrix}=\begin{pmatrix}x+x'\\y+y'\end{pmatrix}$$ Le vecteur opposé $-\vec v$ a les coordonnées opposées, et $\vec u-\vec v=\vec u+(-\vec v)$.</p>
<p><b>Relation de Chasles</b> : $\overrightarrow{AB}+\overrightarrow{BC}=\overrightarrow{AC}$ (aller de $A$ à $B$ puis de $B$ à $C$, c’est aller de $A$ à $C$).</p>`,
      T`<p>Pour simplifier une somme de vecteurs : on remplace chaque $-\overrightarrow{XY}$ par $\overrightarrow{YX}$, on réordonne les termes (l’addition est commutative) pour que chaque flèche parte où la précédente arrive, puis on applique Chasles. Une boucle qui revient à son point de départ donne $\vec 0$.</p>
<p class="ex">$\overrightarrow{AB}-\overrightarrow{CB}+\overrightarrow{CD} = \overrightarrow{AB}+\overrightarrow{BC}+\overrightarrow{CD}=\overrightarrow{AD}$.</p>`,
    ],
    gen: [
      () => {
        let u, v, O;
        do {
          u = [R.nz(-4, 4), R.int(-3, 3)];
          v = [R.int(-4, 4), R.nz(-3, 3)];
          O = gp(0);
        } while (!inG(O[0] + u[0] + v[0], O[1] + u[1] + v[1]) || !inG(O[0] + u[0], O[1] + u[1]) || (u[0] === v[0] && u[1] === v[1]));
        const s = [O[0] + u[0] + v[0], O[1] + u[1] + v[1]];
        // place les flèches ailleurs sur la grille
        const place = (w) => {
          for (let t = 0; t < 200; t++) {
            const a = gp(0);
            if (inG(a[0] + w[0], a[1] + w[1]) && !(a[0] === O[0] && a[1] === O[1])) return a;
          }
          return [0, 0];
        };
        const a1 = place(u),
          a2 = place(v);
        return pickTarget(
          T`Deux vents soufflent : $\vec u$ puis $\vec v$. Pars de $O$ et touche le point $M$ tel que $\overrightarrow{OM}=\vec u+\vec v$.`,
          s,
          T`$\vec u${N.col(...u)}$ et $\vec v${N.col(...v)}$, donc $\vec u+\vec v${N.col(u[0] + v[0], u[1] + v[1])}$ : depuis $O${N.co(...O)}$, on arrive en $M${N.co(...s)}$.`,
          'Fais d’abord le déplacement de u à partir de O, puis, depuis le point atteint, le déplacement de v.',
          G([{ x: O[0], y: O[1], l: 'O' }], [
            { a: a1, b: [a1[0] + u[0], a1[1] + u[1]], l: 'u', c: 'v' },
            { a: a2, b: [a2[0] + v[0], a2[1] + v[1]], l: 'v', c: 'w' },
          ]),
        );
      },
      CU.oneOf(
        () => {
          const u = [R.int(-9, 9), R.int(-9, 9)],
            v = [R.int(-9, 9), R.int(-9, 9)];
          const minus = Math.random() < 0.5;
          const r = minus ? [u[0] - v[0], u[1] - v[1]] : [u[0] + v[0], u[1] + v[1]];
          return K.vec(
            T`$\vec u${N.col(...u)}$ et $\vec v${N.col(...v)}$. Calcule les coordonnées de $\vec u ${minus ? '-' : '+'} \vec v$.`,
            ...r,
            T`$${minus ? T`\vec u-\vec v\begin{pmatrix}${num(u[0])}-${N.p(v[0])}\\${num(u[1])}-${N.p(v[1])}\end{pmatrix}` : T`\vec u+\vec v\begin{pmatrix}${num(u[0])}+${N.p(v[0])}\\${num(u[1])}+${N.p(v[1])}\end{pmatrix}`}=${N.col(...r)}$.`,
            'On opère coordonnée par coordonnée : les x entre eux, les y entre eux.',
          );
        },
        () => {
          const [a, b, c] = R.shuffle(LET.slice(0, 4));
          return K.choice(T`Que vaut $${N.vec(a + b)}+${N.vec(b + c)}$ ?`, ['$' + N.vec(a + c) + '$', '$' + N.vec(c + a) + '$', '$\\vec 0$', '$' + N.vec(b + a) + '$'], T`Relation de Chasles : de $${a}$ à $${b}$, puis de $${b}$ à $${c}$, c’est aller de $${a}$ à $${c}$.`, 'La seconde flèche part là où arrive la première.');
        },
        chasles,
      ),
      chasles,
    ],
  });

  /* ---------- V3 La forge des rafales (produit par un réel, combinaisons, Saut du Spectre) ---------- */
  function jump() {
    // u, v non colinéaires, petits ; cible = a u + b v ; obstacles
    for (;;) {
      const u = R.pick([[2, 1], [1, 2], [2, -1], [1, -2], [3, 1], [1, 3], [3, -1], [-1, 3], [2, 3], [3, 2]]);
      const v = R.pick([[1, 1], [1, -1], [0, 2], [2, 0], [-1, 2], [2, 1], [1, -2], [-2, 1]]);
      if (u[0] * v[1] - u[1] * v[0] === 0) continue;
      const a = R.nz(-3, 3),
        b = R.nz(-3, 3);
      if (Math.abs(a) + Math.abs(b) < 3) continue;
      const S = [R.int(-6, 6), R.int(-4, 4)];
      const Tg = [S[0] + a * u[0] + b * v[0], S[1] + a * u[1] + b * v[1]];
      if (!inG(...Tg)) continue;
      // obstacles
      const pits = [];
      const key = (p) => p[0] + ',' + p[1];
      const nPits = R.int(3, 6);
      for (let t = 0; t < 60 && pits.length < nPits; t++) {
        const p = gp(0);
        if ((p[0] === S[0] && p[1] === S[1]) || (p[0] === Tg[0] && p[1] === Tg[1]) || pits.some((q) => q[0] === p[0] && q[1] === p[1])) continue;
        pits.push(p);
      }
      const block = new Set(pits.map(key));
      // BFS
      const moves = [u, [-u[0], -u[1]], v, [-v[0], -v[1]]];
      const dist = { [key(S)]: 0 },
        q = [S];
      while (q.length) {
        const p = q.shift();
        for (const m of moves) {
          const n = [p[0] + m[0], p[1] + m[1]];
          if (!inG(...n) || block.has(key(n)) || key(n) in dist) continue;
          dist[key(n)] = dist[key(p)] + 1;
          q.push(n);
        }
      }
      const d = dist[key(Tg)];
      if (d === undefined || d < 3 || d > 7) continue;
      return {
        type: 'jump',
        q: T`<b>Le Saut du Spectre.</b> Ton spectre ne connaît que deux sauts : $\vec u${N.col(...u)}$ et $\vec v${N.col(...v)}$ (et leurs opposés). Mène-le de $S$ jusqu’à la rune $R$ en <b>${d} sauts</b> au plus, sans tomber dans un gouffre.`,
        u,
        v,
        S,
        Tg,
        pits,
        limit: d,
        grid: G(),
        sol: T`Il faut $\overrightarrow{SR}${N.col(Tg[0] - S[0], Tg[1] - S[1])}$, et l’on peut écrire $\overrightarrow{SR}=${num(a)}\vec u ${b < 0 ? '-' : '+'} ${num(Math.abs(b))}\vec v$ (par exemple). L’ordre des sauts ne change pas l’arrivée (la somme est commutative), mais il permet d’éviter les gouffres.`,
        hint: T`Calcule d’abord $\overrightarrow{SR}$, puis cherche combien de $\vec u$ et de $\vec v$ il faut. Ensuite, choisis un ordre qui évite les gouffres.`,
      };
    }
  }
  CU.addSkill({
    id: 'v3',
    region: 'vec',
    name: 'La forge des rafales',
    place: 'La Forge des Rafales',
    glyph: '⟿',
    x: 640,
    y: 800,
    flavor: 'Le forgeron d’autrefois savait doubler un vent, l’inverser, le mêler à un autre.',
    law: T`$k\vec u\begin{pmatrix}kx\\ky\end{pmatrix}$ : même direction, longueur multipliée par $|k|$, sens inversé si $k<0$. Si $\vec u$ et $\vec v$ ne sont pas colinéaires, tout vecteur s’écrit de façon unique $a\vec u+b\vec v$.`,
    lessons: [
      T`<p>Multiplier un vecteur par un réel $k$, c’est répéter ou réduire le déplacement : $$k\begin{pmatrix}x\\y\end{pmatrix}=\begin{pmatrix}kx\\ky\end{pmatrix}$$ Si $k<0$, le sens s’inverse. On combine : $2\vec u-3\vec v$ se calcule coordonnée par coordonnée.</p>`,
      T`<p>Avec deux sauts $\vec u$ et $\vec v$, faire $a$ fois $\vec u$ et $b$ fois $\vec v$ (dans n’importe quel ordre) déplace de $a\vec u+b\vec v$. L’ordre ne change pas l’arrivée, mais il change le chemin suivi.</p>`,
      T`<p>Pour écrire $\vec w = a\vec u + b\vec v$, on résout le système $$\begin{cases} a\,x_u + b\,x_v = x_w\\ a\,y_u+b\,y_v=y_w\end{cases}$$ Il a une solution unique dès que $\vec u$ et $\vec v$ ne sont pas colinéaires, c’est-à-dire $x_u y_v - y_u x_v \neq 0$ (on dit que $(\vec u,\vec v)$ est une <b>base</b>).</p>
<p class="ex">Méthode : par combinaison des lignes, ou par substitution, comme pour un système d’équations de 3e.</p>`,
    ],
    gen: [
      () => {
        const u = [R.int(-6, 6), R.int(-6, 6)],
          v = [R.int(-6, 6), R.int(-6, 6)];
        const a = R.nz(-4, 4),
          b = R.nz(-4, 4);
        const r = [a * u[0] + b * v[0], a * u[1] + b * v[1]];
        const e = T`${N.k(a)}\vec u ${b < 0 ? '-' : '+'} ${N.k(Math.abs(b))}\vec v`;
        return K.vec(
          T`$\vec u${N.col(...u)}$, $\vec v${N.col(...v)}$. Calcule les coordonnées de $\vec w = ${e}$.`,
          ...r,
          T`$${num(a)}\vec u${N.col(a * u[0], a * u[1])}$ et $${num(b)}\vec v${N.col(b * v[0], b * v[1])}$, donc $\vec w${N.col(...r)}$.`,
          'Calcule d’abord chaque multiple séparément (attention aux signes), puis additionne.',
        );
      },
      jump,
      () => {
        let u, v, a, b;
        do {
          u = [R.int(-5, 5), R.int(-5, 5)];
          v = [R.int(-5, 5), R.int(-5, 5)];
          a = R.pick([-3, -2, -1, 1, 2, 3, 0.5, -0.5, 1.5]);
          b = R.pick([-3, -2, -1, 1, 2, 3, 0.5, -1.5]);
        } while (u[0] * v[1] - u[1] * v[0] === 0 || !Number.isInteger(a * u[0] + b * v[0]) || !Number.isInteger(a * u[1] + b * v[1]));
        const w = [a * u[0] + b * v[0], a * u[1] + b * v[1]];
        const det = u[0] * v[1] - u[1] * v[0];
        return K.nums(
          T`$\vec u${N.col(...u)}$, $\vec v${N.col(...v)}$ et $\vec w${N.col(...w)}$. Trouve les réels $a$ et $b$ tels que $\vec w = a\vec u + b\vec v$.`,
          ['$a$', '$b$'],
          [a, b],
          T`On résout $\begin{cases} ${num(u[0])}a ${N.s(v[0])}b = ${num(w[0])}\\ ${num(u[1])}a ${N.s(v[1])}b = ${num(w[1])}\end{cases}$. Ici $x_uy_v-y_ux_v = ${num(det)} \neq 0$, la solution est unique : $a = ${num(a)}$, $b = ${num(b)}$. Vérification : $${num(a)}${N.col(...u)} ${b < 0 ? '-' : '+'}${num(Math.abs(b))}${N.col(...v)} = ${N.col(...w)}$.`,
          'Écris le système des deux coordonnées. Élimine une inconnue en combinant les deux lignes.',
          { inline: true },
        );
      },
    ],
  });

  /* ---------- V4 Le puits des distances (norme) ---------- */
  function triangleNature() {
    // fabrique un triangle et sa nature
    for (;;) {
      const kind = R.pick(['rect', 'iso', 'rectiso', 'none']);
      const A = [R.int(-6, 6), R.int(-6, 6)];
      let B, C;
      const a = R.nz(-4, 4),
        b = R.nz(-4, 4);
      if (kind === 'rect') {
        const k = R.pick([2, 3, -2]);
        B = [A[0] + a, A[1] + b];
        C = [A[0] - k * b, A[1] + k * a];
      } else if (kind === 'rectiso') {
        B = [A[0] + a, A[1] + b];
        C = [A[0] - b, A[1] + a];
      } else if (kind === 'iso') {
        B = [A[0] + a, A[1] + b];
        C = [A[0] + b, A[1] + a];
      } else {
        B = [A[0] + a, A[1] + b];
        C = [A[0] + R.nz(-5, 5), A[1] + R.nz(-5, 5)];
      }
      const d2 = (P, Q) => (P[0] - Q[0]) ** 2 + (P[1] - Q[1]) ** 2;
      const AB = d2(A, B),
        AC = d2(A, C),
        BC = d2(B, C);
      if ((B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]) === 0) continue;
      const iso = AB === AC || AB === BC || AC === BC;
      const rect = AB + AC === BC || AB + BC === AC || AC + BC === AB;
      const nat = rect && iso ? 2 : rect ? 0 : iso ? 1 : 3;
      if ((kind === 'none' && nat !== 3) || (kind === 'iso' && nat !== 1) || (kind === 'rect' && nat !== 0) || (kind === 'rectiso' && nat !== 2)) continue;
      const labels = ['rectangle (et pas isocèle)', 'isocèle (et pas rectangle)', 'rectangle et isocèle', 'ni rectangle, ni isocèle'];
      const ch = [labels[nat], ...labels.filter((_, i) => i !== nat)];
      return K.choice(
        T`Trois menhirs : $${N.pt('A', ...A)}$, $${N.pt('B', ...B)}$, $${N.pt('C', ...C)}$. Quelle est la nature du triangle $ABC$ ?`,
        ch,
        T`$AB^2 = ${AB}$, $AC^2 = ${AC}$, $BC^2 = ${BC}$. ${iso ? 'Deux longueurs sont égales : le triangle est isocèle. ' : 'Les trois longueurs sont différentes. '}${rect ? 'La somme de deux carrés égale le troisième : par la réciproque du théorème de Pythagore, il est rectangle.' : 'Aucune somme de deux carrés n’égale le troisième : par la contraposée de Pythagore, il n’est pas rectangle.'}`,
        'Calcule les carrés des trois longueurs (inutile de prendre les racines) et compare-les.',
      );
    }
  }
  CU.addSkill({
    id: 'v4',
    region: 'vec',
    name: 'Le puits des distances',
    place: 'Le Puits des Distances',
    glyph: '◎',
    x: 170,
    y: 530,
    flavor: 'Le puits répond à qui lui demande une longueur exacte. Il se tait devant les à-peu-près.',
    law: T`$\|\vec u\| = \sqrt{x^2+y^2}$ et $AB = \sqrt{(x_B-x_A)^2+(y_B-y_A)^2}$ : c’est le théorème de Pythagore.`,
    lessons: [
      T`<p>La <b>norme</b> $\|\vec u\|$ est la longueur de la flèche. Le déplacement horizontal $x$ et le déplacement vertical $y$ forment un triangle rectangle : par Pythagore, $$\|\vec u\| = \sqrt{x^2+y^2}.$$</p>
<p class="ex">$\vec u\begin{pmatrix}-6\\8\end{pmatrix}$ : $\|\vec u\| = \sqrt{36+64}=\sqrt{100}=10$.</p>`,
      T`<p>La distance $AB$ est la norme de $\overrightarrow{AB}$ : $$AB=\sqrt{(x_B-x_A)^2+(y_B-y_A)^2}.$$ On donne la valeur <b>exacte</b> : on simplifie la racine, $\sqrt{50}=\sqrt{25\times2}=5\sqrt2$ (on peut aussi écrire $\sqrt{50}$).</p>`,
      T`<p>Pour reconnaître un triangle, on compare les <b>carrés</b> des longueurs (pas de racines !). Isocèle : deux carrés égaux. Rectangle : la somme de deux carrés vaut le troisième (réciproque de Pythagore) ; sinon il n’est pas rectangle (contraposée).</p>
<p class="ex">Curiosité : un triangle dont les sommets sont sur la grille ne peut jamais être équilatéral. Saurais-tu le démontrer ? (Indice : son aire serait à la fois un multiple de $\tfrac12$ et un multiple de $\sqrt3$…)</p>`,
    ],
    gen: [
      () => {
        const [a, b, c] = R.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 6, 10], [9, 12, 15], [8, 15, 17], [12, 5, 13], [0, 7, 7]]);
        const u = R.pick([[a, b], [b, a]]).map((t) => t * R.sign());
        return K.num(T`Quelle est la longueur du vent $\vec u${N.col(...u)}$ ?`, c, T`$\|\vec u\|=\sqrt{${N.p(u[0])}^2+${N.p(u[1])}^2}=\sqrt{${u[0] ** 2 + u[1] ** 2}}=${c}$.`, 'Pythagore : x² + y², puis la racine carrée.', '$\\|\\vec u\\|$');
      },
      () => {
        const A = [R.int(-9, 9), R.int(-9, 9)];
        let d;
        do d = [R.int(-8, 8), R.int(-8, 8)];
        while (d[0] * d[1] === 0 && Math.random() < 0.8);
        const B = [A[0] + d[0], A[1] + d[1]];
        const s = d[0] ** 2 + d[1] ** 2;
        if (!s) return CU.SKILLS.v4.gen[1]();
        return K.num(
          T`Calcule la distance exacte $AB$ pour $${N.pt('A', ...A)}$ et $${N.pt('B', ...B)}$.`,
          Math.sqrt(s),
          T`$AB=\sqrt{(${num(B[0])}-${N.p(A[0])})^2+(${num(B[1])}-${N.p(A[1])})^2}=\sqrt{${d[0] ** 2}+${d[1] ** 2}}=\sqrt{${s}}${sqTex(s) !== '\\sqrt{' + s + '}' ? '=' + sqTex(s) : ''}$.`,
          'Calcule les écarts en x et en y, élève-les au carré, additionne, puis prends la racine. Écris √ pour la racine (ou « racine(50) »).',
          '$AB$',
        );
      },
      triangleNature,
    ],
  });

  /* ---------- V5 L'alignement des menhirs (colinéarité) ---------- */
  CU.addSkill({
    id: 'v5',
    region: 'vec',
    name: 'L’alignement des menhirs',
    place: 'Le Cercle des Menhirs',
    glyph: '⫽',
    x: 520,
    y: 480,
    flavor: 'Trois pierres alignées ouvrent un passage. Deux suffisent pour tromper l’œil.',
    law: T`$\vec u$ et $\vec v$ sont colinéaires $\iff \det(\vec u,\vec v)=xy'-yx'=0$. Trois points $A,B,C$ sont alignés $\iff \overrightarrow{AB}$ et $\overrightarrow{AC}$ sont colinéaires.`,
    lessons: [
      T`<p>Deux vecteurs sont <b>colinéaires</b> quand l’un est un multiple de l’autre : ils ont la même direction. Pour $\vec u\begin{pmatrix}x\\y\end{pmatrix}$ et $\vec v\begin{pmatrix}x'\\y'\end{pmatrix}$, on calcule le <b>déterminant</b> $$\det(\vec u,\vec v)=xy'-yx'.$$ Il est nul si et seulement si les vecteurs sont colinéaires.</p>
<p class="ex">$\det\left(\begin{pmatrix}2\\3\end{pmatrix},\begin{pmatrix}-4\\-6\end{pmatrix}\right)=2\times(-6)-3\times(-4)=0$ : colinéaires.</p>`,
      T`<p>Une condition de colinéarité devient une <b>équation</b> : on écrit $\det = 0$ et on résout. Si $\vec u\begin{pmatrix}m\\3\end{pmatrix}$ et $\vec v\begin{pmatrix}4\\6\end{pmatrix}$ : $6m-12=0$, donc $m=2$.</p>`,
      T`<p><b>Alignement</b> : $A$, $B$, $C$ sont alignés si et seulement si $\overrightarrow{AB}$ et $\overrightarrow{AC}$ sont colinéaires. <b>Parallélisme</b> : $(AB)\parallel(CD)$ si et seulement si $\overrightarrow{AB}$ et $\overrightarrow{CD}$ sont colinéaires.</p>
<p>L’équation $\det=0$ peut être du second degré ! Pour $m^2+m-6=0$, on factorise : $(m-2)(m+3)=0$, d’où $m=2$ ou $m=-3$ (produit nul).</p>`,
    ],
    gen: [
      () => {
        const u = [R.int(-9, 9), R.int(-9, 9)],
          v = [R.int(-9, 9), R.int(-9, 9)];
        const d = u[0] * v[1] - u[1] * v[0];
        return K.num(T`Calcule $\det(\vec u,\vec v)$ pour $\vec u${N.col(...u)}$ et $\vec v${N.col(...v)}$.`, d, T`$\det(\vec u,\vec v) = ${N.p(u[0])}\times${N.p(v[1])}-${N.p(u[1])}\times${N.p(v[0])} = ${num(u[0] * v[1])}-${N.p(u[1] * v[0])} = ${num(d)}$. ${d === 0 ? 'Les vecteurs sont colinéaires.' : 'Ils ne sont pas colinéaires.'}`, 'x × y′ − y × x′ : produit en croix, en faisant très attention aux signes.', '$\\det$');
      },
      CU.oneOf(
        () => {
          // u(m, a), v(b, c) colinéaires : mc - ab = 0
          let a, b, c;
          do {
            a = R.nz(-9, 9);
            b = R.nz(-9, 9);
            c = R.nz(-9, 9);
          } while (!Number.isInteger((2 * a * b) / c));
          const m = (a * b) / c;
          return K.num(T`Pour quelle valeur de $m$ les vecteurs $\vec u\begin{pmatrix}m\\${num(a)}\end{pmatrix}$ et $\vec v${N.col(b, c)}$ sont-ils colinéaires ?`, m, T`$\det(\vec u,\vec v)= m\times${N.p(c)} - ${N.p(a)}\times${N.p(b)} = ${num(c)}m ${N.s(-a * b)}$. Il s’annule pour $m = ${num(m)}$.`, 'Écris det(u, v) = 0 : c’est une équation du premier degré en m.', '$m$');
        },
        () => {
          const A = [R.int(-8, 8), R.int(-8, 8)],
            u = [R.nz(-4, 4), R.nz(-4, 4)];
          const k = R.pick([2, 3, -1, -2, 0.5]);
          let C = [A[0] + k * u[0], A[1] + k * u[1]];
          const aligned = Math.random() < 0.5 && Number.isInteger(C[0]) && Number.isInteger(C[1]);
          if (!aligned) C = [A[0] + R.nz(-6, 6), A[1] + R.nz(-6, 6)];
          const B = [A[0] + u[0], A[1] + u[1]];
          const d = u[0] * (C[1] - A[1]) - u[1] * (C[0] - A[0]);
          const yes = d === 0;
          return K.choice(
            T`Les menhirs $${N.pt('A', ...A)}$, $${N.pt('B', ...B)}$, $${N.pt('C', ...C)}$ sont-ils alignés ?`,
            yes ? ['Oui : $\\det(\\overrightarrow{AB},\\overrightarrow{AC})=0$', 'Non : $\\det(\\overrightarrow{AB},\\overrightarrow{AC})\\neq0$'] : ['Non : $\\det(\\overrightarrow{AB},\\overrightarrow{AC})\\neq0$', 'Oui : $\\det(\\overrightarrow{AB},\\overrightarrow{AC})=0$'],
            T`$${N.vec('AB')}${N.col(...u)}$, $${N.vec('AC')}${N.col(C[0] - A[0], C[1] - A[1])}$ et $\det = ${num(d)}$.`,
            'Calcule les coordonnées de AB et AC, puis leur déterminant.',
            { keep: false },
          );
        },
      ),
      CU.oneOf(
        CU.needs(['q3:2'], () => {
          // u(m, p), v(q, m + r) : m² + r m - pq = 0, racines entières m1, m2
          for (;;) {
            const m1 = R.nz(-6, 6),
              m2 = R.nz(-6, 6);
            if (m1 === m2) continue;
            const r = -(m1 + m2),
              pq = -m1 * m2;
            const divs = [];
            for (let p = -Math.abs(pq); p <= Math.abs(pq); p++) if (p && pq % p === 0) divs.push(p);
            const p = R.pick(divs),
              q = pq / p;
            return K.set(
              T`Pour quelles valeurs de $m$ les vecteurs $\vec u\begin{pmatrix}m\\${num(p)}\end{pmatrix}$ et $\vec v\begin{pmatrix}${num(q)}\\${CU.P.tex([r, 1], 'm')}\end{pmatrix}$ sont-ils colinéaires ?`,
              [m1, m2],
              T`$\det(\vec u,\vec v)=m(${CU.P.tex([r, 1], 'm')})-${N.p(p)}\times${N.p(q)} = ${CU.P.tex([-p * q, r, 1], 'm')}$. Or $${CU.P.tex([-p * q, r, 1], 'm')} = (${CU.P.tex([-m1, 1], 'm')})(${CU.P.tex([-m2, 1], 'm')})$, nul pour $m = ${m1}$ ou $m = ${m2}$.`,
              'Écris det = 0 : tu obtiens une équation du second degré. Cherche deux nombres dont la somme et le produit conviennent pour factoriser.',
            );
          }
        }),
        () => {
          const A = [R.int(-8, 8), R.int(-8, 8)],
            u = [R.nz(-5, 5), R.nz(-5, 5)];
          const B = [A[0] + u[0], A[1] + u[1]];
          let xc;
          do xc = R.int(-10, 10);
          while ((xc - A[0]) * u[1] % u[0] !== 0 || xc === A[0]);
          const yc = A[1] + ((xc - A[0]) * u[1]) / u[0];
          return K.num(
            T`Les menhirs $${N.pt('A', ...A)}$ et $${N.pt('B', ...B)}$ sont dressés. On veut planter $C(${xc}\,;\,y)$ dans leur alignement. Que vaut $y$ ?`,
            yc,
            T`$${N.vec('AB')}${N.col(...u)}$, $${N.vec('AC')}\begin{pmatrix}${xc - A[0]}\\y ${N.s(-A[1])}\end{pmatrix}$. Alignés $\iff ${num(u[0])}(y ${N.s(-A[1])}) - ${N.p(u[1])}\times${N.p(xc - A[0])} = 0$, d’où $y = ${num(yc)}$.`,
            'A, B, C alignés ⇔ det(AB, AC) = 0. Écris cette équation avec l’inconnue y.',
            '$y$',
          );
        },
      ),
    ],
  });

  /* ---------- V6 La porte jumelle (milieu, parallélogramme) ---------- */
  CU.addSkill({
    id: 'v6',
    region: 'vec',
    name: 'La porte jumelle',
    place: 'La Porte Jumelle',
    glyph: '⏥',
    x: 830,
    y: 600,
    flavor: 'Ses deux battants ne s’ouvrent que s’ils sont parfaitement parallèles.',
    law: T`$ABCD$ est un parallélogramme $\iff \overrightarrow{AB}=\overrightarrow{DC}$ $\iff$ $[AC]$ et $[BD]$ ont le même milieu. Milieu de $[AB]$ : $\left(\frac{x_A+x_B}2;\frac{y_A+y_B}2\right)$.`,
    lessons: [
      T`<p>Le <b>milieu</b> $I$ de $[AB]$ a pour coordonnées les moyennes : $$I\left(\frac{x_A+x_B}{2}\,;\,\frac{y_A+y_B}{2}\right).$$</p>`,
      T`<p>$ABCD$ est un <b>parallélogramme</b> (sommets dans cet ordre) si et seulement si $\overrightarrow{AB}=\overrightarrow{DC}$. On s’en sert pour construire le quatrième sommet : $D$ s’obtient en appliquant à $C$ le déplacement $\overrightarrow{BA}$.</p>`,
      T`<p>En coordonnées : $\overrightarrow{AB}=\overrightarrow{DC}$ donne $x_B-x_A = x_C - x_D$, donc $x_D = x_A + x_C - x_B$ (de même pour $y$). Attention à l’<b>ordre des lettres</b> : $ABDC$ n’est pas $ABCD$ ! Autre caractérisation : les diagonales se coupent en leur milieu.</p>`,
    ],
    gen: [
      () => {
        const A = [R.int(-12, 12), R.int(-12, 12)],
          B = [R.int(-12, 12), R.int(-12, 12)];
        return K.vec(T`Où se trouve le milieu $I$ de $[AB]$, avec $${N.pt('A', ...A)}$ et $${N.pt('B', ...B)}$ ?`, (A[0] + B[0]) / 2, (A[1] + B[1]) / 2, T`$I\left(\frac{${num(A[0])}+${N.p(B[0])}}{2}\,;\,\frac{${num(A[1])}+${N.p(B[1])}}{2}\right)=I${N.co((A[0] + B[0]) / 2, (A[1] + B[1]) / 2)}$.`, 'Fais la moyenne des abscisses, puis celle des ordonnées. Une fraction comme 3/2 est acceptée.', ['$x_I$', '$y_I$']);
      },
      () => {
        let A, B, C, D;
        do {
          A = gp(0);
          B = gp(0);
          C = gp(0);
          D = [A[0] + C[0] - B[0], A[1] + C[1] - B[1]];
        } while (!inG(...D) || (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]) === 0);
        return pickTarget(
          T`Touche le point $D$ qui fait de $ABCD$ un parallélogramme (les sommets dans cet ordre).`,
          D,
          T`Il faut $\overrightarrow{DC}=\overrightarrow{AB}${N.col(B[0] - A[0], B[1] - A[1])}$ : depuis $C$, on recule de ce déplacement. $D${N.co(...D)}$.`,
          'Dans ABCD, le côté [DC] est parallèle à [AB] et de même longueur, dans le même sens : AB = DC.',
          G([
            { x: A[0], y: A[1], l: 'A' },
            { x: B[0], y: B[1], l: 'B' },
            { x: C[0], y: C[1], l: 'C' },
          ]),
        );
      },
      () => {
        const A = [R.int(-15, 15), R.int(-15, 15)],
          B = [R.int(-15, 15), R.int(-15, 15)],
          C = [R.int(-15, 15), R.int(-15, 15)];
        const name = R.pick(['ABCD', 'ABDC', 'ADBC']);
        let D, eq;
        if (name === 'ABCD') {
          D = [A[0] + C[0] - B[0], A[1] + C[1] - B[1]];
          eq = T`\overrightarrow{AB}=\overrightarrow{DC}`;
        } else if (name === 'ABDC') {
          D = [B[0] + C[0] - A[0], B[1] + C[1] - A[1]];
          eq = T`\overrightarrow{AB}=\overrightarrow{CD}`;
        } else {
          D = [A[0] + B[0] - C[0], A[1] + B[1] - C[1]];
          eq = T`\overrightarrow{AD}=\overrightarrow{CB}`;
        }
        return K.vec(
          T`$${N.pt('A', ...A)}$, $${N.pt('B', ...B)}$, $${N.pt('C', ...C)}$. Trouve $D$ pour que <b>$${name}$</b> soit un parallélogramme.`,
          ...D,
          T`$${name}$ parallélogramme $\iff ${eq}$, ce qui donne $D${N.co(...D)}$. Vérification : les diagonales ont le même milieu.`,
          'Repère les côtés opposés dans le nom : pour ' + name + ', le premier côté est [' + name.slice(0, 2) + '] et son opposé est [' + name.slice(2) + '], parcouru dans l’autre sens.',
          ['$x_D$', '$y_D$'],
        );
      },
    ],
  });

  /* ---------- V7 Le scriptorium des vents (démonstrations) ---------- */
  const VPROOF1 = [
    () => K.choice(T`On sait que $\overrightarrow{AB}=3\overrightarrow{AC}$. Que peut-on en déduire ?`, ['$A$, $B$, $C$ sont alignés', '$ABC$ est un triangle rectangle', '$AB = AC + 3$', '$C$ est le milieu de $[AB]$'], T`$\overrightarrow{AB}$ et $\overrightarrow{AC}$ sont colinéaires et ont le point $A$ en commun : les trois points sont alignés. ($C$ est au tiers de $[AB]$ en partant de $A$, pas au milieu.)`, 'Deux vecteurs multiples l’un de l’autre sont colinéaires. Ils partent ici du même point.'),
    () => K.choice(T`On sait que $\overrightarrow{IA}+\overrightarrow{IB}=\vec 0$. Que peut-on en déduire ?`, ['$I$ est le milieu de $[AB]$', '$A$ et $B$ sont confondus', '$I$, $A$, $B$ forment un triangle isocèle', '$IA = 0$'], T`$\overrightarrow{IB}=-\overrightarrow{IA}=\overrightarrow{AI}$ : on fait le même pas de $A$ à $I$ que de $I$ à $B$. Donc $I$ est le milieu de $[AB]$.`, 'Transforme l’égalité : IB = −IA = AI.'),
    () => K.choice(T`On sait que $\overrightarrow{AB}=\overrightarrow{DC}$ et que $A$, $B$, $C$ ne sont pas alignés. Que peut-on en déduire ?`, ['$ABCD$ est un parallélogramme', '$ABDC$ est un parallélogramme', '$ABCD$ est un rectangle', 'les droites $(AC)$ et $(BD)$ sont parallèles'], T`C’est la définition (vectorielle) du parallélogramme $ABCD$ : les côtés opposés $[AB]$ et $[DC]$ sont parallèles, de même longueur et de même sens.`, 'Regarde l’ordre des lettres : A→B et D→C.'),
    () => K.choice(T`Pour démontrer que $(AB)\parallel(CD)$, il suffit de montrer que…`, ['$\\det(\\overrightarrow{AB},\\overrightarrow{CD})=0$', '$AB = CD$', '$\\overrightarrow{AC}=\\overrightarrow{BD}$ et $AB = CD$', '$\\overrightarrow{AB}+\\overrightarrow{CD}=\\vec 0$ est faux'], T`Deux droites sont parallèles si et seulement si leurs vecteurs directeurs sont colinéaires, ce qui se teste par un déterminant nul. (Une égalité de longueurs ne dit rien de la direction.)`, 'Le parallélisme est une question de direction, pas de longueur.'),
    () => K.choice(T`Vrai ou faux : « si $AB = AC$, alors $\overrightarrow{AB}=\overrightarrow{AC}$ ».`, ['Faux : deux vecteurs de même longueur peuvent avoir des directions différentes', 'Vrai : même longueur, même vecteur', 'Vrai, car ils partent tous deux de $A$', 'Faux, car $\\overrightarrow{AB}=-\\overrightarrow{AC}$ toujours'], T`Contre-exemple : $A(0;0)$, $B(1;0)$, $C(0;1)$. $AB = AC = 1$ mais $\overrightarrow{AB}\neq\overrightarrow{AC}$. Égalité de vecteurs : même direction, même sens, même longueur.`, 'Cherche un contre-exemple avec trois points simples.'),
  ];
  const VPROOF2 = [
    () =>
      K.order(
        T`<b>Théorème.</b> Les diagonales d’un parallélogramme $ABCD$ se coupent en leur milieu. Remets la démonstration dans l’ordre (une étape est un intrus).`,
        [T`Soit $I$ le milieu de $[AC]$ : $\overrightarrow{AI}=\overrightarrow{IC}$.`, T`Comme $ABCD$ est un parallélogramme, $\overrightarrow{BA}=\overrightarrow{CD}$.`, T`Par Chasles, $\overrightarrow{BI}=\overrightarrow{BA}+\overrightarrow{AI}=\overrightarrow{CD}+\overrightarrow{IC}=\overrightarrow{ID}$.`, T`Donc $\overrightarrow{BI}=\overrightarrow{ID}$ : $I$ est aussi le milieu de $[BD]$.`],
        [T`Comme $AC = BD$, les diagonales ont le même milieu.`],
        T`On nomme le milieu d’une diagonale, on utilise l’égalité de vecteurs du parallélogramme, puis Chasles pour montrer que ce point est aussi le milieu de l’autre diagonale. L’intrus est faux : dans un parallélogramme quelconque, les diagonales n’ont pas la même longueur.`,
        'Commence par nommer le point qui t’intéresse, finis par la conclusion.',
      ),
    () =>
      K.order(
        T`<b>Théorème.</b> Si $\overrightarrow{AB}=k\,\overrightarrow{AC}$ ($k$ réel), alors $A$, $B$, $C$ sont alignés. Remets la preuve en coordonnées dans l’ordre.`,
        [T`Notons $\overrightarrow{AC}\begin{pmatrix}x\\y\end{pmatrix}$ ; alors $\overrightarrow{AB}\begin{pmatrix}kx\\ky\end{pmatrix}$.`, T`$\det(\overrightarrow{AB},\overrightarrow{AC}) = kx\cdot y - ky\cdot x$.`, T`Ce déterminant vaut $0$, donc les vecteurs sont colinéaires.`, T`Ils ont l’origine $A$ en commun : les droites $(AB)$ et $(AC)$ sont confondues, $A$, $B$, $C$ sont alignés.`],
        [T`Donc $AB = AC$.`],
        T`Le déterminant de deux vecteurs proportionnels est toujours nul. La colinéarité seule donne des droites parallèles ; c’est le point commun $A$ qui les rend confondues.`,
        'Pars des coordonnées, calcule le déterminant, conclus.',
      ),
    () =>
      K.order(
        T`<b>Théorème.</b> $I$ est le milieu de $[AB]$ si et seulement si, pour tout point $M$, $\overrightarrow{MA}+\overrightarrow{MB}=2\overrightarrow{MI}$. Démontre le sens direct.`,
        [T`Soit $I$ le milieu de $[AB]$ : $\overrightarrow{IA}+\overrightarrow{IB}=\vec 0$.`, T`Soit $M$ un point quelconque.`, T`Par Chasles : $\overrightarrow{MA}+\overrightarrow{MB}=(\overrightarrow{MI}+\overrightarrow{IA})+(\overrightarrow{MI}+\overrightarrow{IB})$.`, T`$=2\overrightarrow{MI}+(\overrightarrow{IA}+\overrightarrow{IB})=2\overrightarrow{MI}$.`],
        [T`Donc $MA + MB = 2MI$ pour les longueurs.`],
        T`On fait passer chaque vecteur par $I$ (Chasles), puis on utilise que $\overrightarrow{IA}+\overrightarrow{IB}=\vec 0$. L’intrus confond vecteurs et longueurs : en général $MA+MB\neq 2MI$.`,
        'La clé : « insérer » le point I dans chaque vecteur.',
        { alts: [[1, 0, 2, 3]] },
      ),
  ];
  const VPROOF3 = [
    () =>
      K.order(
        T`<b>Théorème de Varignon.</b> Les milieux $I,J,K,L$ des côtés $[AB],[BC],[CD],[DA]$ d’un quadrilatère quelconque forment un parallélogramme. Remets la démonstration dans l’ordre.`,
        [T`Dans le triangle $ABC$ : $\overrightarrow{IJ}=\overrightarrow{IB}+\overrightarrow{BJ}=\tfrac12\overrightarrow{AB}+\tfrac12\overrightarrow{BC}=\tfrac12\overrightarrow{AC}$.`, T`Dans le triangle $ADC$ : $\overrightarrow{LK}=\overrightarrow{LD}+\overrightarrow{DK}=\tfrac12\overrightarrow{AD}+\tfrac12\overrightarrow{DC}=\tfrac12\overrightarrow{AC}$.`, T`Donc $\overrightarrow{IJ}=\overrightarrow{LK}$.`, T`Ainsi $IJKL$ est un parallélogramme.`],
        [T`Donc $\overrightarrow{IJ}=\overrightarrow{KL}$.`, T`Comme $ABCD$ est un parallélogramme, $\overrightarrow{AB}=\overrightarrow{DC}$.`],
        T`Les deux côtés $[IJ]$ et $[LK]$ sont égaux à la moitié de la même diagonale $\overrightarrow{AC}$. Attention : c’est $\overrightarrow{IJ}=\overrightarrow{LK}$ (et non $\overrightarrow{KL}$) qui caractérise le parallélogramme $IJKL$. Et $ABCD$ est quelconque : on ne peut pas supposer que c’est un parallélogramme.`,
        'Exprime IJ et LK à l’aide de la diagonale AC.',
        { alts: [[1, 0, 2, 3]] },
      ),
    () =>
      K.order(
        T`<b>Centre de gravité.</b> Soit $G$ tel que $\overrightarrow{GA}+\overrightarrow{GB}+\overrightarrow{GC}=\vec 0$ et $A'$ le milieu de $[BC]$. Montre que $\overrightarrow{AG}=\tfrac23\overrightarrow{AA'}$.`,
        [T`$A'$ milieu de $[BC]$ donne $\overrightarrow{GB}+\overrightarrow{GC}=2\overrightarrow{GA'}$.`, T`L’hypothèse devient $\overrightarrow{GA}+2\overrightarrow{GA'}=\vec 0$.`, T`Chasles : $\overrightarrow{GA}+2(\overrightarrow{GA}+\overrightarrow{AA'})=\vec 0$, soit $3\overrightarrow{GA}+2\overrightarrow{AA'}=\vec 0$.`, T`Donc $\overrightarrow{AG}=\tfrac23\overrightarrow{AA'}$ : $G$ est sur la médiane, aux deux tiers depuis $A$.`],
        [T`Donc $GA = GB = GC$.`],
        T`On utilise la propriété du milieu ($\overrightarrow{MB}+\overrightarrow{MC}=2\overrightarrow{MA'}$ avec $M=G$), puis on fait passer par $A$. Par symétrie des rôles, $G$ est sur les trois médianes : elles sont concourantes. L’intrus est faux ($G$ n’est pas en général équidistant des sommets).`,
        'Utilise d’abord le milieu A′, puis fais apparaître AA′ par Chasles.',
      ),
    () =>
      K.choice(
        T`<b>Trouve l’erreur.</b> « Soit $ABCD$ avec $AB = DC$. (1) Donc $\overrightarrow{AB}=\overrightarrow{DC}$. (2) Donc $ABCD$ est un parallélogramme. (3) Donc $\overrightarrow{AD}=\overrightarrow{BC}$. » Quelle étape est fausse ?`,
        ['L’étape (1)', 'L’étape (2)', 'L’étape (3)', 'Aucune, la preuve est juste'],
        T`L’étape (1) confond longueur et vecteur. Des segments de même longueur peuvent avoir des directions différentes (pense à un trapèze isocèle $ABCD$ : $AB = DC$ ne suffit pas, il faudrait aussi le parallélisme et le même sens). Les étapes (2) et (3) seraient justes si (1) l’était.`,
        'Une égalité de longueurs donne-t-elle une égalité de vecteurs ?',
        { keep: true },
      ),
    () =>
      K.choice(
        T`<b>Trouve l’erreur.</b> « Soit $\overrightarrow{AM}=2\overrightarrow{AB}-\overrightarrow{AC}$. (1) Donc $\overrightarrow{AM}-\overrightarrow{AB}=\overrightarrow{AB}-\overrightarrow{AC}$. (2) Donc $\overrightarrow{BM}=\overrightarrow{CB}$. (3) Donc $B$ est le milieu de $[CM]$. (4) Donc $M$, $B$, $C$ ne sont pas alignés. » Quelle étape est fausse ?`,
        ['L’étape (4)', 'L’étape (1)', 'L’étape (2)', 'L’étape (3)'],
        T`(1) on retranche $\overrightarrow{AB}$ ; (2) Chasles : $\overrightarrow{AM}-\overrightarrow{AB}=\overrightarrow{BM}$ et $\overrightarrow{AB}-\overrightarrow{AC}=\overrightarrow{CB}$ ; (3) $\overrightarrow{CB}=\overrightarrow{BM}$ veut dire que $B$ est le milieu de $[CM]$. La conclusion (4) contredit (3) : le milieu d’un segment est aligné avec ses extrémités.`,
        'Vérifie chaque étape avec Chasles.',
        { keep: true },
      ),
  ];
  CU.addSkill({
    id: 'v7',
    region: 'vec',
    name: 'Le scriptorium des vents',
    place: 'Le Scriptorium',
    glyph: '✒',
    x: 760,
    y: 310,
    flavor: 'Les moines-cartographes n’écrivaient rien qui ne fût démontré. Leurs pages brûlent encore.',
    law: T`Démontrer avec des vecteurs : traduire l’hypothèse en égalité de vecteurs, insérer des points par Chasles, conclure par colinéarité ou égalité de vecteurs.`,
    lessons: [
      T`<p>Une démonstration enchaîne des affirmations, chacune justifiée par l’hypothèse, une définition ou un théorème. En géométrie vectorielle, quelques traductions reviennent sans cesse :</p>
<ul><li>$I$ milieu de $[AB]$ $\iff \overrightarrow{AI}=\overrightarrow{IB} \iff \overrightarrow{IA}+\overrightarrow{IB}=\vec0$ ;</li><li>$ABCD$ parallélogramme $\iff \overrightarrow{AB}=\overrightarrow{DC}$ ;</li><li>$A,B,C$ alignés $\iff \overrightarrow{AB}$ et $\overrightarrow{AC}$ colinéaires.</li></ul>
<p>Et on se méfie de la confusion entre <b>longueur</b> et <b>vecteur</b>.</p>`,
      T`<p>L’outil central est la <b>relation de Chasles</b>, utilisée pour « insérer » un point : $\overrightarrow{MA}=\overrightarrow{MI}+\overrightarrow{IA}$. On choisit le point à insérer en regardant ce que l’on veut faire apparaître.</p>`,
      T`<p>Une démonstration se lit aussi d’un œil critique : chaque étape doit découler des précédentes. Pour trouver une erreur, on vérifie chaque implication isolément. Une erreur classique : passer d’une égalité de longueurs à une égalité de vecteurs.</p>`,
    ],
    gen: [CU.oneOf(...VPROOF1), CU.oneOf(...VPROOF2), CU.oneOf(...VPROOF3)],
  });
})();
