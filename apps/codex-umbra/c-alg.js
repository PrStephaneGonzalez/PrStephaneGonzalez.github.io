/* Région 2 — Les Cryptes des Sceaux (calcul littéral, factorisation)
   Région 3 — La Tour des Arcs (second degré). */
'use strict';
(function () {
  const { R, T, K, N, P, num, par } = CU;
  const L = (a, b) => P.tex([b, a]); // ax + b
  const Lp = (a, b) => '(' + L(a, b) + ')';
  const pt = P.tex;
  // k(...) en TeX, avec k = 1 → rien, -1 → -
  const kf = (k, inner) => N.k(k) + '(' + inner + ')';
  const coprimeLin = (lo = 1, hi = 5) => {
    let a, b;
    do {
      a = R.nz(-hi, hi);
      b = R.nz(-9, 9);
    } while (CU.gcd(a, b) !== 1 || Math.abs(a) < lo);
    return [a, b];
  };

  /* ================= LES CRYPTES DES SCEAUX ================= */

  /* ---------- F1 La forge des runes (développer) ---------- */
  CU.addSkill({
    id: 'f1',
    region: 'fac',
    name: 'La forge des runes',
    place: 'La Forge des Runes',
    glyph: 'ᚠ',
    x: 200,
    y: 860,
    req: [],
    flavor: 'Développer, c’est forger : on frappe chaque terme contre chaque autre.',
    law: T`$k(a+b)=ka+kb$ et $(a+b)(c+d)=ac+ad+bc+bd$. On réduit ensuite en regroupant les termes de même degré.`,
    lessons: [
      T`<p><b>Développer</b>, c’est transformer un produit en somme. <b>Réduire</b>, c’est regrouper les termes de même nature ($x^2$ avec $x^2$, $x$ avec $x$, nombres avec nombres).</p>
<p>Distributivité simple : $k(a+b)=ka+kb$. Attention au signe devant la parenthèse : $-3(2x-5)=-6x+15$.</p>
<p class="ex">$2(3x-1)-4(x+2)=6x-2-4x-8=2x-10$.</p>
<p class="tip">Saisie : écris <code>x^2</code> ou <code>x²</code> pour $x^2$ ; <code>3x</code> pour $3x$.</p>`,
      T`<p><b>Double distributivité</b> : chaque terme de la première parenthèse multiplie chaque terme de la seconde. $$(a+b)(c+d)=ac+ad+bc+bd$$</p>
<p class="ex">$(2x-3)(x+4)=2x^2+8x-3x-12=2x^2+5x-12$.</p>`,
      T`<p>Pour une expression longue, on développe chaque produit <b>séparément, entre parenthèses</b>, avant de s’occuper du signe qui le précède : $$A-(B)\;\text{ change le signe de chaque terme de }B.$$</p>
<p class="ex">$(x+1)(x-2)-(x-3)^2=(x^2-x-2)-(x^2-6x+9)=5x-11$.</p>`,
    ],
    gen: [
      () => {
        const k = R.nz(-7, 7),
          m = R.nz(1, 7);
        const [a, b] = [R.nz(-6, 6), R.nz(-9, 9)],
          [c, d] = [R.nz(-6, 6), R.nz(-9, 9)];
        const s = R.sign();
        const tgt = P.add(P.scale([b, a], k), P.scale([d, c], s * m));
        return K.expr(
          T`Développe et réduis : $$A = ${kf(k, L(a, b))} ${s < 0 ? '-' : '+'} ${m === 1 ? '' : m}(${L(c, d)})$$`,
          tgt,
          'expanded',
          T`$A = ${pt(P.scale([b, a], k))} ${s < 0 ? '-' : '+'} (${pt(P.scale([d, c], m))}) = ${pt(tgt)}$.`,
          'Distribue chaque nombre sur sa parenthèse, en gardant son signe. Puis regroupe les x ensemble et les nombres ensemble.',
          '$A =$',
        );
      },
      () => {
        const [a, b] = [R.nz(-5, 5), R.nz(-9, 9)],
          [c, d] = [R.nz(-5, 5), R.nz(-9, 9)];
        const tgt = P.mul([b, a], [d, c]);
        return K.expr(
          T`Développe et réduis : $$B = ${Lp(a, b)}${Lp(c, d)}$$`,
          tgt,
          'expanded',
          T`$B = ${num(a)}x\times${N.p(c)}x ${N.s(a * d)}x ${N.s(b * c)}x ${N.s(b * d)} = ${pt(tgt)}$.`,
          'Chaque terme de la première parenthèse multiplie chaque terme de la seconde : 4 produits.',
          '$B =$',
        );
      },
      CU.oneOf(
        () => {
          const [a, b] = [R.nz(-4, 4), R.nz(-7, 7)],
            [c, d] = [R.nz(-4, 4), R.nz(-7, 7)],
            [e, f] = [R.nz(-4, 4), R.nz(-7, 7)];
          const p1 = P.mul([b, a], [d, c]),
            p2 = P.pow([f, e], 2),
            tgt = P.sub(p1, p2);
          return K.expr(T`Développe et réduis : $$C = ${Lp(a, b)}${Lp(c, d)} - ${Lp(e, f)}^2$$`, tgt, 'expanded', T`$C = (${pt(p1)}) - (${pt(p2)}) = ${pt(tgt)}$.`, 'Développe chaque produit entre parenthèses, puis enlève les parenthèses précédées d’un « − » en changeant tous les signes.', '$C =$');
        },
        () => {
          const k = R.nz(-4, 4),
            a = R.nz(-6, 6),
            b = R.nz(1, 6),
            m = R.nz(2, 4);
          const p1 = P.scale(P.pow([a, 1], 2), k),
            p2 = P.scale(P.mul([b, 1], [-b, 1]), m),
            tgt = P.sub(p1, p2);
          return K.expr(T`Développe et réduis : $$D = ${kf(k, L(1, a))}^2 - ${m}(x+${b})(x-${b})$$`, tgt, 'expanded', T`$D = ${num(k)}(${pt(P.pow([a, 1], 2))}) - ${m}(x^2-${b * b}) = ${pt(tgt)}$.`, 'Développe d’abord les carrés et produits, puis multiplie par les coefficients devant.', '$D =$');
        },
        () => {
          const [a, b, c] = [R.nz(-4, 4), R.nz(-4, 4), R.nz(-4, 4)];
          const tgt = P.mul(P.mul([a, 1], [b, 1]), [c, 1]);
          return K.expr(T`Développe et réduis le produit des trois runes : $$E = ${Lp(1, a)}${Lp(1, b)}${Lp(1, c)}$$`, tgt, 'expanded', T`$${Lp(1, a)}${Lp(1, b)} = ${pt(P.mul([a, 1], [b, 1]))}$, puis on multiplie par $${Lp(1, c)}$ : $E = ${pt(tgt)}$.`, 'Développe d’abord deux des parenthèses, puis multiplie le résultat par la troisième.', '$E =$');
        },
      ),
    ],
  });

  /* ---------- F2 Le miroir des trois lois (identités remarquables) ---------- */
  CU.addSkill({
    id: 'f2',
    region: 'fac',
    name: 'Le miroir des trois lois',
    place: 'Le Miroir des Trois Lois',
    glyph: '⧖',
    x: 480,
    y: 800,
    req: ['f1'],
    flavor: 'Trois inscriptions brillent sur le miroir. Qui les connaît voit à travers les sceaux.',
    law: T`$(a+b)^2=a^2+2ab+b^2$, $(a-b)^2=a^2-2ab+b^2$, $(a+b)(a-b)=a^2-b^2$.`,
    lessons: [
      T`<p>Les trois <b>identités remarquables</b> : $$(a+b)^2=a^2+2ab+b^2 \qquad (a-b)^2=a^2-2ab+b^2 \qquad (a+b)(a-b)=a^2-b^2$$ Elles s’obtiennent par double distributivité, mais les connaître fait gagner un temps précieux.</p>
<p class="ex">$(x-5)^2=x^2-10x+25$ et $(x+7)(x-7)=x^2-49$.</p>`,
      T`<p>Quand $a$ est lui-même un produit, on n’oublie pas de l’élever entièrement au carré : $(3x)^2=9x^2$.</p>
<p class="ex">$(3x-2)^2=9x^2-12x+4$ : le double produit vaut $2\times3x\times2=12x$.</p>`,
      T`<p>Les identités servent aussi au calcul mental : $$103^2=(100+3)^2=10609 \qquad 49\times51=(50-1)(50+1)=2499.$$ Et on peut les lire à l’envers : reconnaître $4x^2+20x+25$ comme $(2x+5)^2$ (le carré du premier, le carré du second, le double produit au milieu).</p>`,
    ],
    gen: [
      () => {
        const a = R.int(1, 12),
          t = R.int(0, 2);
        const tgt = t === 0 ? P.pow([a, 1], 2) : t === 1 ? P.pow([-a, 1], 2) : P.mul([a, 1], [-a, 1]);
        const e = t === 0 ? T`(x+${a})^2` : t === 1 ? T`(x-${a})^2` : R.pick([T`(x+${a})(x-${a})`, T`(x-${a})(x+${a})`]);
        return K.expr(T`Développe à l’aide d’une identité remarquable : $$${e}$$`, tgt, 'expanded', T`$${e} = ${pt(tgt)}$ ${t < 2 ? T`(le double produit vaut $2\times x\times ${a} = ${2 * a}x$)` : T`(c’est $a^2-b^2$ avec $a=x$ et $b=${a}$)`}.`, 'Identifie a et b, puis applique la formule.', 'Développé');
      },
      () => {
        const a = R.int(2, 6),
          b = R.int(1, 9),
          t = R.int(0, 2);
        const tgt = t === 0 ? P.pow([b, a], 2) : t === 1 ? P.pow([-b, a], 2) : P.mul([b, a], [-b, a]);
        const e = t === 0 ? T`(${a}x+${b})^2` : t === 1 ? T`(${a}x-${b})^2` : T`(${a}x+${b})(${a}x-${b})`;
        return K.expr(T`Développe : $$${e}$$`, tgt, 'expanded', T`$${e} = ${pt(tgt)}$. ${t < 2 ? T`Carré du premier : $(${a}x)^2=${a * a}x^2$ ; double produit : $2\times${a}x\times${b}=${2 * a * b}x$ ; carré du second : $${b * b}$.` : T`$(${a}x)^2-${b}^2$.`}`, 'Attention : (3x)² = 9x², pas 3x².', 'Développé');
      },
      CU.oneOf(
        () => {
          const n = R.pick([R.int(21, 99) * 10 + R.pick([1, 2, 3, 9, 8]), 100 + R.int(1, 9), 100 - R.int(1, 9), 1000 + R.int(1, 4), R.int(3, 9) * 10 + R.pick([1, 9])]);
          const base = n > 900 ? Math.round(n / 100) * 100 : Math.round(n / 10) * 10,
            d = n - base;
          return K.num(T`Calcule de tête, sans poser l’opération : $$${n}^2$$`, n * n, T`$${n}^2 = (${base} ${N.s(d)})^2 = ${base * base} ${N.s(2 * base * d)} + ${d * d} = ${n * n}$.`, 'Écris ce nombre comme un nombre rond plus ou moins un petit nombre.', 'Résultat');
        },
        () => {
          const m = R.pick([20, 30, 40, 50, 60, 70, 80, 100]),
            d = R.int(1, 4);
          return K.num(T`Calcule de tête : $$${m - d}\times${m + d}$$`, m * m - d * d, T`$${m - d}\times${m + d}=(${m}-${d})(${m}+${d})=${m * m}-${d * d}=${m * m - d * d}$.`, 'Ces deux nombres sont symétriques autour d’un nombre rond.', 'Résultat');
        },
        () => {
          const a = R.int(2, 7),
            b = R.nz(-9, 9);
          const tgt = P.pow([b, a], 2);
          return K.nums(T`Trouve $a > 0$ et $b$ tels que $$(ax+b)^2 = ${pt(tgt)}$$`, ['$a$', '$b$'], [a, b], T`Le carré du premier terme est $${a * a}x^2 = (${a}x)^2$, donc $a = ${a}$. Le double produit $2\times${a}x\times b$ doit valoir $${num(2 * a * b)}x$, d’où $b = ${num(b)}$ ; on vérifie $b^2 = ${b * b}$.`, 'Commence par le terme en x² : il donne a. Le terme en x donne ensuite b, avec son signe.', { inline: true });
        },
      ),
    ],
  });

  /* ---------- F3 Les sceaux jumeaux (facteur commun) ---------- */
  CU.addSkill({
    id: 'f3',
    region: 'fac',
    name: 'Les sceaux jumeaux',
    place: 'La Crypte des Jumeaux',
    glyph: 'ᛗ',
    x: 220,
    y: 560,
    req: ['f1'],
    flavor: 'Chaque sceau cache un frère dans l’autre. Trouve ce qu’ils ont en commun, et ils se rompent.',
    law: T`$ka+kb=k(a+b)$ : on repère le facteur commun $k$ (nombre, $x$, ou parenthèse entière) et on le met en avant.`,
    lessons: [
      T`<p><b>Factoriser</b>, c’est l’inverse de développer : transformer une somme en <b>produit</b>. La première méthode est le <b>facteur commun</b> : $$ka+kb = k(a+b).$$ On choisit le plus grand facteur commun, pour que ce qui reste ne se factorise plus.</p>
<p class="ex">$12x-18 = 6(2x-3)$ (et pas seulement $2(6x-9)$, qui est incomplet).</p>`,
      T`<p>Le facteur commun peut contenir $x$ : $$6x^2+9x = 3x\times2x + 3x\times3 = 3x(2x+3).$$</p>`,
      T`<p>Le facteur commun peut être une <b>parenthèse entière</b>. On la repère, on la met en avant, et on regroupe ce qui reste (attention aux signes !) :</p>
<p class="ex">$(x+1)(2x-3)-(x+1)(x+4)=(x+1)\big[(2x-3)-(x+4)\big]=(x+1)(x-7)$.</p>
<p>Un carré $(x+1)^2$ contient lui aussi le facteur $(x+1)$ : $(x+1)^2=(x+1)(x+1)$.</p>`,
    ],
    gen: [
      () => {
        const g = R.int(2, 9),
          [a, b] = coprimeLin(1, 6);
        const tgt = P.scale([b, a], g);
        return K.expr(T`Brise le sceau : factorise $$${pt(tgt)}$$`, tgt, 'factored', T`$${pt(tgt)} = ${g}\times${N.p(a)}x + ${g}\times${N.p(b)} = ${g}(${L(a, b)})$.`, 'Cherche le plus grand nombre qui divise les deux coefficients.', 'Forme factorisée');
      },
      () => {
        const g = R.int(1, 6),
          [a, b] = coprimeLin(1, 6);
        const tgt = P.scale([0, b, a], g);
        return K.expr(T`Factorise : $$${pt(tgt)}$$`, tgt, 'factored', T`Les deux termes contiennent $${g === 1 ? '' : g}x$ : $${pt(tgt)} = ${g === 1 ? '' : g}x(${L(a, b)})$.`, 'Les deux termes ont x en commun, et peut-être aussi un nombre.', 'Forme factorisée');
      },
      CU.oneOf(
        () => {
          for (;;) {
            const [a, b] = coprimeLin(1, 3);
            const [c, d] = [R.nz(-5, 5), R.nz(-9, 9)],
              [e, f] = [R.nz(-5, 5), R.nz(-9, 9)];
            const s = R.sign();
            const rest = [d + s * f, c + s * e];
            if (rest[1] === 0) continue;
            const g = CU.gcd(rest[0], rest[1]);
            const tgt = P.mul([b, a], rest);
            return K.expr(
              T`Un sceau jumeau, plus retors : factorise $$${Lp(a, b)}${Lp(c, d)} ${s < 0 ? '-' : '+'} ${Lp(a, b)}${Lp(e, f)}$$`,
              tgt,
              'factored',
              T`Facteur commun $${Lp(a, b)}$ : $${Lp(a, b)}\big[${Lp(c, d)} ${s < 0 ? '-' : '+'} ${Lp(e, f)}\big] = ${Lp(a, b)}(${pt(rest)})${g > 1 ? T` = ${g}${Lp(a, b)}(${pt(P.scale(rest, 1 / g))})` : ''}$.`,
              'Une parenthèse entière apparaît deux fois. Mets-la en facteur, puis réduis le crochet (attention au signe −).',
              'Forme factorisée',
            );
          }
        },
        () => {
          for (;;) {
            const [a, b] = coprimeLin(1, 3);
            const [c, d] = [R.nz(-5, 5), R.nz(-9, 9)];
            if (a === c) continue;
            const rest = [b - d, a - c];
            const g = CU.gcd(rest[0], rest[1]);
            const tgt = P.mul([b, a], rest);
            return K.expr(T`Factorise : $$${Lp(a, b)}^2 - ${Lp(a, b)}${Lp(c, d)}$$`, tgt, 'factored', T`$${Lp(a, b)}^2 = ${Lp(a, b)}${Lp(a, b)}$, d’où $${Lp(a, b)}\big[${Lp(a, b)} - ${Lp(c, d)}\big] = ${Lp(a, b)}(${pt(rest)})${g > 1 ? T` = ${g}${Lp(a, b)}(${pt(P.scale(rest, 1 / g))})` : ''}$.`, 'Le carré contient la parenthèse deux fois : écris-le comme un produit.', 'Forme factorisée');
          }
        },
      ),
    ],
  });

  /* ---------- F4 Le sceau brisé (factoriser avec les identités) ---------- */
  CU.addSkill({
    id: 'f4',
    region: 'fac',
    name: 'Le sceau brisé',
    place: 'Le Sceau Brisé',
    glyph: '⨂',
    x: 520,
    y: 520,
    req: ['f2', 'f3'],
    flavor: 'Le Grand Sceau ne cède qu’à qui lit les trois lois à rebours.',
    law: T`$a^2-b^2=(a-b)(a+b)$, $a^2+2ab+b^2=(a+b)^2$, $a^2-2ab+b^2=(a-b)^2$.`,
    lessons: [
      T`<p>Lues de droite à gauche, les identités remarquables factorisent. La plus utile : la <b>différence de deux carrés</b> $$a^2-b^2=(a-b)(a+b).$$</p>
<p class="ex">$x^2-49=(x-7)(x+7)$ ; $\;25-x^2=(5-x)(5+x)$.</p>`,
      T`<p>On reconnaît un carré parfait : trois termes, dont deux carrés, et le troisième égal au double produit. $$9x^2-12x+4=(3x)^2-2\times3x\times2+2^2=(3x-2)^2.$$ Et $a^2-b^2$ avec $a=4x$ : $16x^2-9=(4x-3)(4x+3)$.</p>`,
      T`<p>Les « carrés » peuvent être des parenthèses : $$(2x+1)^2-(x-3)^2=\big[(2x+1)-(x-3)\big]\big[(2x+1)+(x-3)\big]=(x+4)(3x-2).$$ On réduit chaque crochet, et on n’oublie pas de sortir un éventuel facteur numérique commun.</p>`,
    ],
    gen: [
      () => {
        const a = R.int(1, 12);
        const rev = Math.random() < 0.3;
        const tgt = rev ? [a * a, 0, -1] : [-a * a, 0, 1];
        return K.expr(T`Factorise : $$${pt(tgt)}$$`, tgt, 'factored', rev ? T`$${a * a}-x^2 = ${a}^2-x^2 = (${a}-x)(${a}+x)$.` : T`$x^2-${a * a} = x^2-${a}^2 = (x-${a})(x+${a})$.`, 'Différence de deux carrés : a² − b² = (a − b)(a + b).', 'Forme factorisée');
      },
      CU.oneOf(
        () => {
          let k, m;
          do {
            k = R.int(2, 7);
            m = R.int(1, 11);
          } while (CU.gcd(k, m) !== 1);
          const tgt = [-m * m, 0, k * k];
          return K.expr(T`Factorise : $$${pt(tgt)}$$`, tgt, 'factored', T`$${k * k}x^2-${m * m} = (${k}x)^2-${m}^2 = (${k}x-${m})(${k}x+${m})$.`, 'Les deux termes sont des carrés : de quoi ?', 'Forme factorisée');
        },
        () => {
          let k, m;
          do {
            k = R.int(1, 5);
            m = R.nz(-9, 9);
          } while (CU.gcd(k, m) !== 1);
          const tgt = P.pow([m, k], 2);
          return K.expr(T`Factorise : $$${pt(tgt)}$$`, tgt, 'factored', T`$${pt(tgt)} = ${k === 1 ? 'x^2' : '(' + k + 'x)^2'} ${m < 0 ? '-' : '+'} 2\times ${k === 1 ? '' : k}x\times${Math.abs(m)} + ${Math.abs(m)}^2 = (${L(k, m)})^2$.`, 'Trois termes, deux carrés aux extrémités : vérifie si celui du milieu est le double produit.', 'Forme factorisée');
        },
      ),
      CU.oneOf(
        () => {
          for (;;) {
            const [a, b] = [R.nz(-4, 4), R.nz(-7, 7)],
              [c, d] = [R.nz(-4, 4), R.nz(-7, 7)];
            const f1 = [b - d, a - c],
              f2 = [b + d, a + c];
            if (f1[1] === 0 || f2[1] === 0 || (a === c && b === d)) continue;
            const tgt = P.mul(f1, f2);
            return K.expr(T`Le dernier sceau de la crypte : factorise $$${Lp(a, b)}^2 - ${Lp(c, d)}^2$$`, tgt, 'factored', T`$A^2-B^2=(A-B)(A+B)$ avec $A=${L(a, b)}$, $B=${L(c, d)}$ : $\big[${Lp(a, b)}-${Lp(c, d)}\big]\big[${Lp(a, b)}+${Lp(c, d)}\big]=(${pt(f1)})(${pt(f2)})$. Si un facteur contient un nombre en commun, on le sort.`, 'C’est une différence de deux carrés, dont les « carrés » sont des parenthèses.', 'Forme factorisée');
          }
        },
        () => {
          let k, m;
          do {
            k = R.int(2, 6);
            m = R.nz(-9, 9);
          } while (CU.gcd(k, m) !== 1);
          const g = R.pick([1, 1, 2, 3]);
          const tgt = P.scale(P.pow([m, k], 2), g);
          return K.expr(T`Factorise complètement : $$${pt(tgt)}$$`, tgt, 'factored', T`${g > 1 ? T`On sort d’abord $${g}$ : $${g}(${pt(P.pow([m, k], 2))})$, puis ` : ''}$${pt(P.pow([m, k], 2))}=(${L(k, m)})^2$. Résultat : $${g > 1 ? g : ''}(${L(k, m)})^2$.`, 'Cherche d’abord un facteur commun numérique, puis une identité remarquable.', 'Forme factorisée');
        },
      ),
    ],
  });

  /* ---------- F5 La chambre des deux clés (équation produit nul) ---------- */
  const rootsLin = (a, b) => -b / a;
  CU.addSkill({
    id: 'f5',
    region: 'fac',
    name: 'La chambre des deux clés',
    place: 'La Chambre des Deux Clés',
    glyph: '⚿',
    x: 820,
    y: 660,
    req: ['f4'],
    flavor: 'Deux serrures, deux clés. Il suffit que l’une tourne pour que la porte cède.',
    law: T`Un produit est nul si et seulement si l’un au moins de ses facteurs est nul : $AB=0 \iff A=0$ ou $B=0$.`,
    lessons: [
      T`<p><b>Propriété du produit nul</b> : $A\times B=0$ si et seulement si $A=0$ ou $B=0$. Une équation écrite comme un produit égal à zéro se ramène donc à des équations du premier degré.</p>
<p class="ex">$(2x-3)(x+5)=0 \iff 2x-3=0$ ou $x+5=0 \iff x=\tfrac32$ ou $x=-5$.</p>
<p class="tip">Saisie : sépare les solutions par « ; », par exemple <code>3/2 ; -5</code>.</p>`,
      T`<p>Stratégie : <b>tout passer d’un côté</b>, puis <b>factoriser</b>, puis appliquer le produit nul.</p>
<p class="ex">$x^2=5x \iff x^2-5x=0 \iff x(x-5)=0 \iff x=0$ ou $x=5$.</p>
<p>Ne divise <b>jamais</b> par $x$ : tu perdrais la solution $x=0$.</p>`,
      T`<p>Pour $A^2=B^2$ : $A^2-B^2=0 \iff (A-B)(A+B)=0$. Pour $AB = AC$ : $A(B-C)=0$ — encore une fois, on ne simplifie pas par $A$, qui peut être nul !</p>`,
    ],
    gen: [
      () => {
        const [a, b] = coprimeLin(1, 4),
          [c, d] = coprimeLin(1, 4);
        const vals = [rootsLin(a, b), rootsLin(c, d)];
        return K.set(T`Ouvre la chambre : résous $$${Lp(a, b)}${Lp(c, d)} = 0$$`, vals, T`Produit nul : $${L(a, b)}=0$ ou $${L(c, d)}=0$, donc $x=${num(vals[0])}$ ou $x=${num(vals[1])}$.`, 'Un produit est nul si l’un de ses facteurs l’est. Résous chaque équation du premier degré.');
      },
      CU.oneOf(
        () => {
          const k = R.nz(-9, 9);
          return K.set(T`Résous $$x^2 = ${num(k)}x$$`, [0, k], T`$x^2-${N.p(k)}x=0 \iff x(x ${N.s(-k)})=0 \iff x=0$ ou $x=${num(k)}$.`, 'Ne divise surtout pas par x ! Passe tout du même côté et factorise.');
        },
        () => {
          let k, m;
          do {
            k = R.int(1, 5);
            m = R.int(1, 11);
          } while (CU.gcd(k, m) !== 1);
          return K.set(T`Résous $$${k === 1 ? '' : k * k}x^2 - ${m * m} = 0$$`, [-m / k, m / k], T`$(${k === 1 ? '' : k}x-${m})(${k === 1 ? '' : k}x+${m})=0$, donc $x=${num(m / k)}$ ou $x=${num(-m / k)}$.`, 'Différence de deux carrés.');
        },
        () => {
          const m = R.nz(-9, 9);
          return K.set(T`Résous $$${pt(P.pow([m, 1], 2))} = 0$$`, [-m], T`$${pt(P.pow([m, 1], 2))} = (${L(1, m)})^2$, nul si et seulement si $x = ${-m}$ : une seule solution.`, 'Reconnais une identité remarquable.');
        },
      ),
      CU.oneOf(
        () => {
          for (;;) {
            const [a, b] = [R.nz(-4, 4), R.nz(-7, 7)],
              [c, d] = [R.nz(-4, 4), R.nz(-7, 7)];
            if (a === c || a === -c) continue;
            const vals = [-(b - d) / (a - c), -(b + d) / (a + c)];
            const v = vals.filter((x, i) => vals.findIndex((y) => CU.near(x, y)) === i);
            return K.set(T`Résous $$${Lp(a, b)}^2 = ${Lp(c, d)}^2$$`, v, T`$A^2=B^2 \iff (A-B)(A+B)=0$ : $(${pt([b - d, a - c])})(${pt([b + d, a + c])})=0$, donc $x = ${v.map(num).join('$ ou $x = ')}$.`, 'Passe tout à gauche : A² − B² = 0. Puis factorise.');
          }
        },
        () => {
          for (;;) {
            const [a, b] = coprimeLin(1, 3),
              [c, d] = [R.nz(-4, 4), R.nz(-7, 7)],
              [e, f] = [R.nz(-4, 4), R.nz(-7, 7)];
            if (c === e) continue;
            const vals = [rootsLin(a, b), -(d - f) / (c - e)];
            const v = vals.filter((x, i) => vals.findIndex((y) => CU.near(x, y)) === i);
            return K.set(T`Résous $$${Lp(a, b)}${Lp(c, d)} = ${Lp(a, b)}${Lp(e, f)}$$`, v, T`$${Lp(a, b)}\big[${Lp(c, d)}-${Lp(e, f)}\big]=0 \iff ${Lp(a, b)}(${pt([d - f, c - e])})=0$, donc $x = ${v.map(num).join('$ ou $x = ')}$. Simplifier par $${Lp(a, b)}$ aurait fait perdre $x = ${num(vals[0])}$.`, 'Tentation : simplifier par la parenthèse commune. C’est interdit, elle peut être nulle ! Passe tout à gauche.');
          }
        },
      ),
    ],
  });

  /* ---------- F6 Le tribunal des runes (preuves) ---------- */
  const isPrime = (n) => {
    if (n < 2) return false;
    for (let p = 2; p * p <= n; p++) if (n % p === 0) return false;
    return true;
  };
  const counter = (q, labels, test, sol, hint) => ({
    type: 'fields',
    q,
    fields: labels.map((l) => ({ label: l, kind: 'num', short: true })),
    check(a) {
      const vals = [];
      for (const x of a) {
        try {
          const ast = CU.parse(x);
          vals.push(CU.evalAst(ast, 0));
        } catch (e) {
          return { ok: false, msg: e.message, syntax: true };
        }
      }
      return test(...vals);
    },
    sol,
    hint,
    inline: true,
  });
  const FPROOF1 = [
    () =>
      counter(
        T`Un nécromancien affirme : « Pour tout entier naturel $n$, le nombre $n^2+n+41$ est premier. » Il l’a vérifié pour $n = 0, 1, 2, \dots, 10$. Trouve un <b>contre-exemple</b>.`,
        ['$n$'],
        (n) => (!Number.isInteger(n) || n < 0 ? { ok: false, msg: 'On veut un entier naturel.' } : isPrime(n * n + n + 41) ? { ok: false, msg: T`$${n}^2+${n}+41 = ${n * n + n + 41}$ est premier. Cherche un $n$ qui fait apparaître un facteur évident…`.replace(/\$/g, '') } : { ok: true }),
        T`Par exemple $n=41$ : $41^2+41+41 = 41\times43$. Ou $n=40$ : $40^2+40+41 = 40\times41+41=41^2$. Quelques vérifications ne prouvent jamais un « pour tout » ; un seul contre-exemple suffit à le réfuter.`,
        'Essaie de choisir n pour que chaque terme soit un multiple d’un même nombre…',
      ),
    () =>
      counter(
        T`Un apprenti écrit : « Pour tous réels $a$ et $b$, $(a+b)^2=a^2+b^2$. » Donne des valeurs de $a$ et $b$ qui le réfutent.`,
        ['$a$', '$b$'],
        (a, b) => (CU.near((a + b) ** 2, a * a + b * b) ? { ok: false, msg: 'Avec ces valeurs, l’égalité est vraie. Il faut que 2ab ≠ 0.' } : { ok: true }),
        T`Par exemple $a=b=1$ : $(1+1)^2=4$ mais $1^2+1^2=2$. En fait $(a+b)^2=a^2+b^2 \iff 2ab=0$ : l’égalité n’est vraie que si $a=0$ ou $b=0$.`,
        'Essaie des valeurs simples, non nulles.',
      ),
    () =>
      counter(
        T`« Pour tout réel $x$, $x^2 \geqslant x$. » Vrai ou faux ? Si c’est faux, donne un contre-exemple.`,
        ['$x$'],
        (x) => (x * x >= x - 1e-12 ? { ok: false, msg: 'Pour cette valeur, x² ≥ x est vrai. Regarde du côté des nombres entre 0 et 1.' } : { ok: true }),
        T`C’est faux : pour $x=\tfrac12$, $x^2=\tfrac14 < \tfrac12$. En fait $x^2<x \iff x(x-1)<0 \iff 0<x<1$.`,
        'Que devient un nombre compris entre 0 et 1 quand on le met au carré ?',
      ),
    () =>
      K.choice(
        T`« La somme de deux entiers impairs est toujours paire. » Quelle est la meilleure justification ?`,
        [T`$(2k+1)+(2m+1)=2(k+m+1)$, multiple de $2$`, T`$3+5=8$ et $7+9=16$ sont pairs`, T`Un impair plus un impair, ça fait un pair`, T`$(2k+1)+(2k+1)=4k+2$, qui est pair`],
        T`Il faut deux entiers impairs <b>quelconques</b>, donc deux lettres différentes $k$ et $m$. Des exemples ne prouvent rien, et écrire $2k+1$ deux fois revient à prendre deux fois le même nombre.`,
        'Une preuve doit couvrir tous les cas, et les deux nombres ne sont pas forcément égaux.',
      ),
  ];
  const FPROOF2 = [
    () =>
      K.order(
        T`<b>Théorème.</b> La somme de trois entiers consécutifs est un multiple de $3$. Remets la preuve dans l’ordre.`,
        [T`Soit $n$ un entier ; trois entiers consécutifs s’écrivent $n$, $n+1$, $n+2$.`, T`Leur somme vaut $n+(n+1)+(n+2)=3n+3$.`, T`Or $3n+3=3(n+1)$, et $n+1$ est un entier.`, T`Donc la somme est un multiple de $3$.`],
        [T`Par exemple $4+5+6=15=3\times5$.`],
        T`On nomme un entier quelconque, on calcule, on factorise par $3$. L’exemple, juste, ne démontre rien : ce n’est pas une étape de la preuve.`,
        'Nommer, calculer, factoriser, conclure.',
      ),
    () =>
      K.order(
        T`<b>Théorème.</b> Le produit de deux entiers consécutifs est pair. Remets la preuve (par disjonction des cas) dans l’ordre.`,
        [T`Soit $n$ un entier ; on étudie $n(n+1)$.`, T`Si $n$ est pair, $n=2k$ et $n(n+1)=2\,k(n+1)$ est pair.`, T`Si $n$ est impair, $n=2k+1$, donc $n+1=2(k+1)$ et $n(n+1)=2\,n(k+1)$ est pair.`, T`Tout entier est pair ou impair : dans tous les cas $n(n+1)$ est pair.`],
        [T`Comme $n$ et $n+1$ sont pairs, leur produit est pair.`],
        T`La disjonction des cas couvre toutes les possibilités (pair / impair). L’intrus est faux : deux entiers consécutifs ne sont jamais pairs tous les deux.`,
        'Il faut traiter les deux cas, puis dire pourquoi ils couvrent tout.',
        { alts: [[0, 2, 1, 3]] },
      ),
    () =>
      K.order(
        T`<b>Théorème.</b> Pour tout entier $n$, $(n+1)^2-n^2$ est impair. Remets la preuve dans l’ordre.`,
        [T`Soit $n$ un entier.`, T`$(n+1)^2-n^2=n^2+2n+1-n^2$.`, T`$=2n+1$.`, T`$2n+1$ est impair, ce qui conclut.`],
        [T`$=2n$.`],
        T`On développe avec l’identité remarquable, on réduit, on reconnaît la forme $2n+1$ d’un nombre impair. (Conséquence amusante : les carrés successifs $0,1,4,9,16,\dots$ ont pour écarts les nombres impairs.)`,
        'Développe (n + 1)² avec une identité remarquable.',
      ),
  ];
  const FPROOF3 = [
    () =>
      K.order(
        T`<b>Théorème.</b> Si $n$ est un entier impair, alors $n^2-1$ est divisible par $8$. Remets la preuve dans l’ordre.`,
        [T`$n$ impair s’écrit $n=2k+1$, avec $k$ entier.`, T`$n^2-1=(2k+1)^2-1=4k^2+4k$.`, T`$=4k(k+1)$.`, T`$k(k+1)$ est le produit de deux entiers consécutifs, donc il est pair : $k(k+1)=2m$.`, T`Donc $n^2-1=8m$ est divisible par $8$.`],
        [T`Donc $n^2-1=4k(k+1)$ est divisible par $4$, donc par $8$.`],
        T`L’ingrédient décisif est que $k(k+1)$ est pair, ce qui apporte le facteur $2$ manquant. L’intrus est faux : être divisible par $4$ n’entraîne pas d’être divisible par $8$ (pense à $12$).`,
        'Écris n = 2k + 1 et développe. Que sais-tu du produit de deux entiers consécutifs ?',
      ),
    () =>
      K.choice(
        T`<b>Trouve l’erreur.</b> « Soit $a=b\neq0$. (1) Alors $a^2=ab$. (2) Donc $a^2-b^2=ab-b^2$. (3) Donc $(a-b)(a+b)=b(a-b)$. (4) Donc $a+b=b$. (5) Donc $2b=b$, et $2=1$. » Où est l’erreur ?`,
        ['Le passage de (3) à (4)', 'Le passage de (1) à (2)', 'Le passage de (2) à (3)', 'Le passage de (4) à (5)'],
        T`De (3) à (4), on a divisé par $a-b$, qui vaut $0$ puisque $a=b$. Diviser par zéro est interdit : $(a-b)(a+b)=b(a-b)$ est vrai (c’est $0=0$), mais n’entraîne rien sur $a+b$ et $b$.`,
        'Que vaut a − b ?',
        { keep: true },
      ),
    () =>
      K.order(
        T`<b>Théorème.</b> Pour tout entier $n$, $n^3-n$ est divisible par $6$. Remets la preuve dans l’ordre.`,
        [T`$n^3-n=n(n^2-1)=(n-1)\,n\,(n+1)$.`, T`C’est le produit de trois entiers consécutifs.`, T`Parmi deux entiers consécutifs, l’un est pair : le produit est divisible par $2$.`, T`Parmi trois entiers consécutifs, l’un est multiple de $3$ : le produit est divisible par $3$.`, T`Divisible par $2$ et par $3$, qui sont premiers entre eux, il est divisible par $6$.`],
        [T`Divisible par $2$ et par $3$, il est divisible par $2+3=5$.`],
        T`Factoriser révèle trois entiers consécutifs. Attention : « divisible par $a$ et par $b$ » entraîne « divisible par $ab$ » seulement si $a$ et $b$ sont premiers entre eux ($4$ et $6$ divisent $12$, mais $24$ ne divise pas $12$).`,
        'Factorise d’abord n³ − n complètement.',
        { alts: [[0, 1, 3, 2, 4]] },
      ),
    () =>
      K.choice(
        T`<b>Trouve l’erreur.</b> « Résolvons $x^2=3x$. (1) On divise par $x$ : $x=3$. (2) Vérification : $3^2=9=3\times3$. (3) Donc l’unique solution est $3$. » Qu’est-ce qui ne va pas ?`,
        ['(1) : diviser par $x$ suppose $x\\neq0$ ; on perd la solution $0$', '(2) : le calcul est faux', 'Rien : $3$ est bien l’unique solution', '(3) : il y a une infinité de solutions'],
        T`$x^2=3x \iff x(x-3)=0 \iff x=0$ ou $x=3$. La vérification (2) montre que $3$ est solution, pas qu’elle est la seule.`,
        'Teste x = 0.',
      ),
  ];
  CU.addSkill({
    id: 'f6',
    region: 'fac',
    name: 'Le tribunal des runes',
    place: 'Le Tribunal des Runes',
    glyph: '⚖',
    x: 760,
    y: 320,
    req: ['f4'],
    flavor: 'Ici, nul n’est cru sur parole. Les runes exigent des preuves — et démasquent les faux témoins.',
    law: T`Un exemple ne prouve pas un « pour tout » ; un contre-exemple suffit à le réfuter. Une preuve nomme un objet quelconque ($n$, $2k+1$…) et enchaîne des étapes justifiées.`,
    lessons: [
      T`<p>Pour démontrer qu’une propriété est vraie <b>pour tout</b> entier, des exemples ne suffisent jamais. En revanche, pour la réfuter, un seul <b>contre-exemple</b> suffit.</p>
<p>Écritures utiles : un entier pair s’écrit $2k$, un impair $2k+1$ ($k$ entier) ; deux entiers <b>différents</b> demandent deux lettres différentes.</p>`,
      T`<p>Une démonstration typique : on <b>nomme</b> un objet quelconque, on <b>calcule</b> (développer, factoriser), on <b>reconnaît</b> la forme cherchée ($2\times\dots$, $3\times\dots$), on <b>conclut</b>.</p>
<p>La <b>disjonction des cas</b> : si l’on ne sait pas conclure en général, on traite séparément des cas qui couvrent toutes les possibilités (pair / impair, par exemple).</p>`,
      T`<p>Démontrer, c’est aussi savoir <b>débusquer une erreur</b>. Les plus fréquentes : diviser par une quantité qui peut être nulle, confondre « divisible par $4$ » et « divisible par $8$ », prendre deux fois la même lettre pour deux objets différents, ou croire qu’une vérification prouve l’unicité.</p>`,
    ],
    gen: [() => R.pick(FPROOF1)(), () => R.pick(FPROOF2)(), () => R.pick(FPROOF3)()],
  });

  /* ================= LA TOUR DES ARCS ================= */

  /* ---------- Q1 L'atelier du sommet (forme canonique) ---------- */
  function canon(a, al, be) {
    // a(x - al)^2 + be  → polynôme
    return P.add(P.scale(P.pow([-al, 1], 2), a), [be]);
  }
  const canTex = (a, al, be) => (al === 0 ? N.k(a) + 'x^2' : `${N.k(a)}\\left(x ${al > 0 ? '-' : '+'} ${num(Math.abs(al))}\\right)^2`) + (be ? N.s(be) : '');
  CU.addSkill({
    id: 'q1',
    region: 'quad',
    name: 'L’atelier du sommet',
    place: 'L’Atelier du Sommet',
    glyph: '⌒',
    x: 190,
    y: 860,
    req: ['f2'],
    flavor: 'Les architectes de la Tour réécrivaient chaque courbe pour en voir le sommet.',
    law: T`$x^2+bx+c=\left(x+\frac b2\right)^2-\frac{b^2}4+c$. Forme canonique : $ax^2+bx+c=a(x-\alpha)^2+\beta$ avec $\alpha=-\frac b{2a}$, $\beta=f(\alpha)$.`,
    lessons: [
      T`<p>La <b>forme canonique</b> d’un trinôme est $a(x-\alpha)^2+\beta$. Pour l’obtenir, on « complète le carré » : $x^2+2px$ est le début de $(x+p)^2=x^2+2px+p^2$, donc $$x^2+2px=(x+p)^2-p^2.$$</p>
<p class="ex">$x^2+6x+2=(x+3)^2-9+2=(x+3)^2-7$.</p>
<p class="tip">Saisie : <code>(x+3)^2-7</code>.</p>`,
      T`<p>Même méthode quand le coefficient de $x$ est impair : on prend sa moitié. $$x^2+5x+1=\left(x+\tfrac52\right)^2-\tfrac{25}{4}+1=\left(x+\tfrac52\right)^2-\tfrac{21}4.$$</p>`,
      T`<p>Si $a\neq1$, on met $a$ en facteur dans les termes en $x$ : $$2x^2-12x+5=2(x^2-6x)+5=2\big[(x-3)^2-9\big]+5=2(x-3)^2-13.$$ On retiendra : $\alpha=-\dfrac{b}{2a}$ et $\beta=f(\alpha)$.</p>`,
    ],
    gen: [
      () => {
        const p = R.nz(-9, 9),
          q = R.int(-20, 20);
        const tgt = [q, 2 * p, 1];
        return K.expr(T`Écris sous forme canonique : $$f(x) = ${pt(tgt)}$$`, tgt, 'canonical', T`$x^2 ${N.s(2 * p)}x$ est le début de $(x ${N.s(p)})^2 = ${pt([p * p, 2 * p, 1])}$. Donc $f(x) = (x ${N.s(p)})^2 - ${p * p} ${N.s(q)} = ${canTex(1, -p, q - p * p)}$.`, 'Prends la moitié du coefficient de x : c’est le nombre dans la parenthèse.', '$f(x) =$');
      },
      () => {
        const b = R.pick([-9, -7, -5, -3, -1, 1, 3, 5, 7, 9]),
          c = R.int(-12, 12);
        const tgt = [c, b, 1];
        const al = -b / 2,
          be = c - (b * b) / 4;
        return K.expr(T`Écris sous forme canonique : $$f(x) = ${pt(tgt)}$$`, tgt, 'canonical', T`La moitié de $${b}$ est $${num(b / 2)}$ : $f(x) = \left(x ${N.s(b / 2)}\right)^2 - ${num((b * b) / 4)} ${N.s(c)} = ${canTex(1, al, be)}$.`, 'Même méthode : la moitié du coefficient de x est une fraction, garde-la sous forme fractionnaire (par exemple 5/2).', '$f(x) =$');
      },
      () => {
        const a = R.pick([2, 3, -1, -2, 4, -3]);
        const al = a === 4 && Math.random() < 0.5 ? R.nz(-5, 5) + 0.5 : R.nz(-5, 5);
        const be = R.int(-10, 10);
        const tgt = canon(a, al, be);
        return K.expr(T`Écris sous forme canonique : $$f(x) = ${pt(tgt)}$$`, tgt, 'canonical', T`$\alpha = -\frac{b}{2a} = -\frac{${num(tgt[1])}}{${2 * a}} = ${num(al)}$ et $\beta = f(\alpha) = ${num(be)}$. Donc $f(x) = ${canTex(a, al, be)}$.`, 'Mets a en facteur devant les termes en x² et en x, complète le carré à l’intérieur, puis redistribue a. Ou : α = −b/(2a) et β = f(α).', '$f(x) =$');
      },
    ],
  });

  /* ---------- Q2 La baliste du guet (sommet, variations, trajectoires) ---------- */
  function baliste() {
    const t = R.int(0, 2);
    if (t === 0) {
      const [Lg, H] = R.pick([[4, 4], [8, 8], [6, 9], [8, 4], [12, 9], [6, 3], [10, 5], [4, 2], [10, 10], [12, 6]]);
      const a = -(4 * H) / (Lg * Lg);
      const tgt = P.scale(P.mul([0, 1], [-Lg, 1]), a);
      return {
        type: 'baliste',
        q: T`La baliste tire depuis le sol, en $(0\,;\,0)$. Le carreau doit retomber pile sur le démon, en $(${Lg}\,;\,0)$, après avoir culminé à la hauteur $${H}$. Donne l’équation de la trajectoire $f(x)$.`,
        fields: [{ label: '$f(x) =$', kind: 'expr' }],
        target: tgt,
        scene: { xmax: Lg + 2, ymax: H + 3, start: [0, 0], goal: [Lg, 0], peak: [Lg / 2, H] },
        check: (a) => CU.V.expr(a[0], tgt),
        sol: T`Les racines sont $0$ et $${Lg}$, donc $f(x) = a\,x(x-${Lg})$. Le sommet est au milieu des racines, en $x=${Lg / 2}$ : $f(${Lg / 2}) = a\times${Lg / 2}\times(${-Lg / 2}) = ${-(Lg * Lg) / 4}a = ${H}$, d’où $a = ${num(a)}$. Donc $f(x) = ${num(a)}x(x-${Lg})$.`,
        hint: 'Une parabole qui coupe l’axe en 0 et en L s’écrit f(x) = a·x(x − L). Le sommet est au milieu : utilise sa hauteur pour trouver a.',
      };
    }
    if (t === 1) {
      const al = R.int(2, 6),
        h0 = R.int(1, 4);
      let be, a;
      do {
        be = R.int(h0 + 2, 12);
        a = (h0 - be) / (al * al);
      } while (!CU.toFrac(a) || CU.toFrac(a)[1] > 12);
      const tgt = canon(a, al, be);
      return {
        type: 'baliste',
        q: T`La baliste est sur le rempart, à la hauteur $${h0}$ (en $x=0$). Le carreau doit passer par le sommet $S(${al}\,;\,${be})$ pour franchir la tour ennemie. Donne $f(x)$.`,
        fields: [{ label: '$f(x) =$', kind: 'expr' }],
        target: tgt,
        scene: { xmax: Math.ceil(al + Math.sqrt(-be / a)) + 2, ymax: be + 3, start: [0, h0], peak: [al, be], tower: [al, be - 1] },
        check: (a2) => CU.V.expr(a2[0], tgt),
        sol: T`Forme canonique avec le sommet : $f(x) = a(x-${al})^2+${be}$. Et $f(0) = ${al * al}a + ${be} = ${h0}$, donc $a = \frac{${h0 - be}}{${al * al}} = ${num(a)}$. D’où $f(x) = ${canTex(a, al, be)}$.`,
        hint: 'Quand on connaît le sommet, on écrit f(x) = a(x − α)² + β. Il reste a : utilise le point de départ.',
      };
    }
    let r1, r2, p, h, k;
    do {
      r1 = R.int(0, 3);
      r2 = R.int(r1 + 4, 12);
      p = R.int(r1 + 1, r2 - 1);
      h = R.int(2, 9);
      k = h / ((p - r1) * (p - r2));
    } while (!CU.toFrac(k) || CU.toFrac(k)[1] > 30);
    const tgt = P.scale(P.mul([-r1, 1], [-r2, 1]), k);
    const top = -((r2 - r1) ** 2) * k / 4;
    return {
      type: 'baliste',
      q: T`Le carreau part de $(${r1}\,;\,0)$, doit frôler le créneau en $(${p}\,;\,${h})$ et retomber en $(${r2}\,;\,0)$. Donne $f(x)$.`,
      fields: [{ label: '$f(x) =$', kind: 'expr' }],
      target: tgt,
      scene: { xmax: r2 + 2, ymax: Math.ceil(top) + 3, start: [r1, 0], goal: [r2, 0], mark: [p, h] },
      check: (a) => CU.V.expr(a[0], tgt),
      sol: T`Racines $${r1}$ et $${r2}$ : $f(x)=a(x-${r1})(x-${r2})$. Puis $f(${p}) = a\times${p - r1}\times(${p - r2}) = ${(p - r1) * (p - r2)}a = ${h}$, donc $a = ${num(k)}$.`,
      hint: 'Les deux points au sol sont les racines : f(x) = a(x − x₁)(x − x₂). Le troisième point donne a.',
    };
  }
  CU.addSkill({
    id: 'q2',
    region: 'quad',
    name: 'La baliste du guet',
    place: 'La Baliste du Guet',
    glyph: '⤒',
    x: 480,
    y: 820,
    req: ['q1'],
    flavor: 'La vieille baliste ne rate jamais — pourvu qu’on lui donne la bonne parabole.',
    law: T`$f(x)=a(x-\alpha)^2+\beta$ : sommet $S(\alpha;\beta)$, axe $x=\alpha$. Si $a>0$, $\beta$ est le minimum ; si $a<0$, c’est le maximum.`,
    lessons: [
      T`<p>La courbe de $f(x)=a(x-\alpha)^2+\beta$ est une <b>parabole</b> de sommet $S(\alpha;\beta)$ et d’axe de symétrie la droite $x=\alpha$. Comme un carré est positif ou nul :</p>
<ul><li>si $a>0$, $f(x)\geqslant\beta$ : $\beta$ est le <b>minimum</b>, atteint en $\alpha$ (parabole « vers le haut ») ;</li><li>si $a<0$, $\beta$ est le <b>maximum</b>.</li></ul>`,
      T`<p>Depuis la forme développée $f(x)=ax^2+bx+c$ : $$\alpha=-\frac{b}{2a}, \qquad \beta=f(\alpha).$$ Les variations : pour $a>0$, $f$ décroît sur $]-\infty;\alpha]$ et croît sur $[\alpha;+\infty[$ (l’inverse pour $a<0$).</p>`,
      T`<p>Trois façons d’écrire une parabole, à choisir selon ce que l’on sait :</p>
<ul><li>sommet connu : $a(x-\alpha)^2+\beta$ ;</li><li>deux points au sol (racines $x_1$, $x_2$) : $a(x-x_1)(x-x_2)$ — le sommet est alors au milieu, en $\frac{x_1+x_2}2$ ;</li><li>un point supplémentaire permet toujours de trouver $a$.</li></ul>
<p>C’est aussi l’outil de l’<b>optimisation</b> : un enclos de périmètre $40$ et de côté $x$ a pour aire $x(20-x)=-(x-10)^2+100$, maximale pour $x=10$.</p>`,
    ],
    gen: [
      CU.oneOf(
        () => {
          const a = R.nz(-4, 4),
            al = R.int(-8, 8),
            be = R.int(-10, 10);
          return K.nums(T`La parabole d’un arc est $f(x) = ${canTex(a, al, be)}$. Donne les coordonnées de son sommet.`, ['$\\alpha$', '$\\beta$'], [al, be], T`$f(x)=a(x-\alpha)^2+\beta$ avec $\alpha=${al}$ et $\beta=${be}$ : le sommet est $S(${al}\,;\,${be})$. ${a > 0 ? 'Comme a > 0, c’est un minimum.' : 'Comme a < 0, c’est un maximum.'}`, 'Attention au signe : (x + 3)² = (x − (−3))², donc α = −3.', { inline: true });
        },
        () => {
          const a = R.nz(-4, 4),
            al = R.nz(-8, 8);
          let be;
          do be = R.nz(-10, 10);
          while (Math.abs(be) === Math.abs(al));
          const ch = a > 0 ? [`un minimum égal à $${be}$, atteint en $${al}$`, `un maximum égal à $${be}$, atteint en $${al}$`, `un minimum égal à $${al}$, atteint en $${be}$`, `un minimum égal à $${be}$, atteint en $${-al}$`] : [`un maximum égal à $${be}$, atteint en $${al}$`, `un minimum égal à $${be}$, atteint en $${al}$`, `un maximum égal à $${al}$, atteint en $${be}$`, `un maximum égal à $${be}$, atteint en $${-al}$`];
          return K.choice(T`Sur $\mathbb R$, la fonction $f(x) = ${canTex(a, al, be)}$ admet…`, ch, T`$${a > 0 ? '(x-\\alpha)^2\\geqslant 0' : 'a(x-\\alpha)^2\\leqslant 0'}$ et s’annule seulement en $x=${al}$, donc $f(x) ${a > 0 ? '\\geqslant' : '\\leqslant'} ${be}$ avec égalité en $x = ${al}$.`, 'Le signe de a décide : minimum ou maximum ?');
        },
      ),
      () => {
        const a = R.pick([1, -1, 2, -2, 3, 1]),
          b = R.int(-9, 9),
          c = R.int(-9, 9);
        const tgt = [c, b, a],
          al = -b / (2 * a),
          be = c - (b * b) / (4 * a);
        return K.nums(T`Trouve le sommet de la parabole $f(x) = ${pt(tgt)}$.`, ['$\\alpha$', '$\\beta$'], [al, be], T`$\alpha = -\frac{b}{2a} = -\frac{${num(b)}}{${2 * a}} = ${num(al)}$, puis $\beta = f(${num(al)}) = ${num(be)}$.`, 'α = −b / (2a), puis calcule l’image de α. Les fractions sont acceptées (par exemple 3/2).', { inline: true });
      },
      CU.oneOf(baliste, baliste, () => {
        const t = R.int(0, 2);
        if (t === 0) {
          const P0 = R.pick([20, 24, 28, 32, 36, 40, 48, 60, 100]);
          return K.num(T`Le Guet dispose de $${P0}$ mètres de palissade pour clore un camp rectangulaire. Quelle est la plus grande aire possible (en m²) ?`, (P0 / 4) ** 2, T`Côtés $x$ et $${P0 / 2}-x$ : $A(x)=x(${P0 / 2}-x) = -x^2+${P0 / 2}x = -(x-${num(P0 / 4)})^2+${num((P0 / 4) ** 2)}$. Maximum $${num((P0 / 4) ** 2)}$ m², pour un carré de côté $${num(P0 / 4)}$.`, 'Appelle x un côté : l’autre vaut (périmètre / 2) − x. Écris l’aire, puis sa forme canonique.', 'Aire max');
        }
        if (t === 1) {
          const P0 = R.pick([20, 24, 40, 60, 80, 100]);
          return K.num(T`Adossé à la muraille, le camp n’a besoin de palissade que sur trois côtés. Avec $${P0}$ m de palissade, quelle est l’aire maximale (en m²) ?`, (P0 * P0) / 8, T`Deux côtés $x$ perpendiculaires au mur, un côté $${P0}-2x$ parallèle : $A(x) = x(${P0}-2x) = -2x^2+${P0}x = -2(x-${num(P0 / 4)})^2 + ${num((P0 * P0) / 8)}$. Maximum $${num((P0 * P0) / 8)}$ m² pour $x=${num(P0 / 4)}$.`, 'Appelle x la longueur des deux côtés perpendiculaires au mur.', 'Aire max');
        }
        const S = R.int(6, 30);
        return K.num(T`Deux nombres réels ont pour somme $${S}$. Quel est le plus grand produit possible ?`, (S * S) / 4, T`$P(x) = x(${S}-x) = -(x-${num(S / 2)})^2 + ${num((S * S) / 4)}$. Maximum $${num((S * S) / 4)}$, quand les deux nombres valent $${num(S / 2)}$.`, 'Appelle x l’un des nombres. Le produit est un trinôme.', 'Produit max');
      }),
    ],
  });

  /* ---------- Q3 La salle des racines (discriminant, résolution) ---------- */
  function solveGen() {
    const t = R.int(0, 3);
    let a, b, c;
    if (t === 0) {
      a = R.pick([1, 1, 2, -1, 3]);
      const r1 = R.int(-7, 7),
        r2 = R.int(-7, 7);
      [c, b, a] = P.scale(P.mul([-r1, 1], [-r2, 1]), a);
      if (r1 === r2) return solveGen();
    } else if (t === 1) {
      do {
        a = R.pick([1, 1, 2, -1]);
        b = R.int(-8, 8);
        c = R.int(-10, 10);
      } while (b * b - 4 * a * c <= 0 || Number.isInteger(Math.sqrt(b * b - 4 * a * c)));
    } else if (t === 2) {
      do {
        a = R.nz(-3, 3);
        b = R.int(-6, 6);
        c = R.int(-10, 10);
      } while (b * b - 4 * a * c >= 0);
    } else {
      const r = R.nz(-6, 6),
        k = R.pick([1, 1, 4, -1, 9]);
      const m = Math.sqrt(Math.abs(k));
      [c, b, a] = Math.sign(k) > 0 ? P.pow([-r * m, m], 2) : P.scale(P.pow([-r, 1], 2), -1);
    }
    const Q = CU.quadRoots(a, b, c);
    const D = Q.delta;
    return K.set(
      T`Trouve toutes les racines : $$${pt([c, b, a])} = 0$$`,
      Q.vals,
      T`$\Delta = b^2-4ac = ${N.p(b)}^2 - 4\times${N.p(a)}\times${N.p(c)} = ${D}$. ${D < 0 ? T`$\Delta<0$ : aucune solution réelle.` : D === 0 ? T`$\Delta = 0$ : une seule solution, $x_0 = -\frac{b}{2a} = ${Q.tex[0]}$.` : T`$\Delta>0$ : $x_{1,2} = \frac{-b\pm\sqrt\Delta}{2a}$, soit $${Q.tex[0]}$ et $${Q.tex[1]}$.`}`,
      'Calcule Δ = b² − 4ac. Son signe te dit combien il y a de solutions. Pour une racine, écris par exemple (1+√5)/2 ou (1+racine(5))/2.',
    );
  }
  CU.addSkill({
    id: 'q3',
    region: 'quad',
    name: 'La salle des racines',
    place: 'La Salle des Racines',
    glyph: '√',
    x: 240,
    y: 560,
    req: ['q1', 'f5'],
    flavor: 'Les racines de la Tour plongent dans la terre. On les compte avant de les arracher.',
    law: T`$\Delta=b^2-4ac$. Si $\Delta>0$ : deux racines $\frac{-b\pm\sqrt\Delta}{2a}$ ; si $\Delta=0$ : une racine $-\frac b{2a}$ ; si $\Delta<0$ : aucune racine réelle.`,
    lessons: [
      T`<p>Pour $ax^2+bx+c$ ($a\neq0$), le <b>discriminant</b> est $$\Delta=b^2-4ac.$$ Il vient de la forme canonique : $ax^2+bx+c=a\left[\left(x+\frac b{2a}\right)^2-\frac{\Delta}{4a^2}\right]$.</p>
<p class="ex">$2x^2-3x-5$ : $\Delta=9+40=49$.</p>`,
      T`<p>Le signe de $\Delta$ donne le nombre de solutions de $ax^2+bx+c=0$ :</p>
<ul><li>$\Delta>0$ : deux solutions $x_1=\dfrac{-b-\sqrt\Delta}{2a}$ et $x_2=\dfrac{-b+\sqrt\Delta}{2a}$ ;</li><li>$\Delta=0$ : une solution $x_0=-\dfrac b{2a}$ ;</li><li>$\Delta<0$ : aucune solution réelle.</li></ul>
<p class="tip">Saisie : <code>(3+√5)/2 ; (3-√5)/2</code>, ou le bouton « aucune ».</p>`,
      T`<p>Avant d’appliquer la formule, on ramène l’équation à la forme $ax^2+bx+c=0$ : développer, tout passer d’un côté, réduire.</p>
<p><b>Équation bicarrée</b> $ax^4+bx^2+c=0$ : on pose $X=x^2$, on résout en $X$, puis on cherche les $x$ tels que $x^2=X$ — ce qui n’est possible que si $X\geqslant0$ !</p>`,
    ],
    gen: [
      () => {
        const a = R.nz(-5, 5),
          b = R.int(-9, 9),
          c = R.int(-12, 12);
        return K.num(T`Calcule le discriminant de $$${pt([c, b, a])}$$`, b * b - 4 * a * c, T`$\Delta = ${N.p(b)}^2 - 4\times${N.p(a)}\times${N.p(c)} = ${b * b} ${N.s(-4 * a * c)} = ${b * b - 4 * a * c}$.`, 'Δ = b² − 4ac. Attention : b² est toujours positif, et −4ac change de signe si a et c sont de signes contraires.', '$\\Delta$');
      },
      solveGen,
      CU.oneOf(
        () => {
          const r1 = R.int(-6, 6),
            r2 = R.int(-6, 6);
          const Tg = P.mul([-r1, 1], [-r2, 1]);
          const p = R.nz(-5, 5),
            q = R.nz(-5, 5);
          const lhs = P.mul([p, 1], [q, 1]),
            rhs = P.sub(lhs, Tg);
          const v = r1 === r2 ? [r1] : [r1, r2];
          return K.set(T`Résous $$(x ${N.s(p)})(x ${N.s(q)}) = ${pt(rhs)}$$`, v, T`On développe : $${pt(lhs)} = ${pt(rhs)}$, puis on passe tout à gauche : $${pt(Tg)} = 0$. ${(() => { const Q = CU.quadRoots(1, Tg[1], Tg[0]); return T`$\Delta = ${Q.delta}$, solutions : $${Q.tex.join('$ et $')}$.`; })()}`, 'Développe le membre de gauche, puis passe tout du même côté pour obtenir ax² + bx + c = 0.');
        },
        () => {
          const s = R.int(1, 5);
          let t = R.int(1, 6);
          const neg = Math.random() < 0.35;
          if (!neg && t === s) t = s + 1;
          const X1 = s * s,
            X2 = neg ? -t * t : t * t;
          const B = -(X1 + X2),
            C = X1 * X2;
          const vals = neg ? [-s, s] : [-t, -s, s, t];
          return K.set(T`Équation bicarrée : résous $$x^4 ${N.s(B)}x^2 ${N.s(C)} = 0$$`, vals, T`On pose $X = x^2$ : $X^2 ${N.s(B)}X ${N.s(C)} = 0$, de racines $X = ${X1}$ et $X = ${X2}$. ${neg ? T`$x^2 = ${X2}$ est impossible ; $x^2=${X1}$ donne $x=\pm${s}$.` : T`$x^2 = ${X1}$ donne $x = \pm ${s}$ ; $x^2 = ${X2}$ donne $x = \pm ${t}$.`}`, 'Pose X = x². Résous en X, puis reviens à x — sans oublier qu’un carré n’est jamais négatif.');
        },
      ),
    ],
  });

  /* ---------- Q4 Le seuil des ombres (signe, inéquations) ---------- */
  const itv = {
    in_o: (r1, r2) => T`\left]${num(r1)}\,;\,${num(r2)}\right[`,
    in_c: (r1, r2) => T`\left[${num(r1)}\,;\,${num(r2)}\right]`,
    out_o: (r1, r2) => T`\left]-\infty\,;\,${num(r1)}\right[\,\cup\,\left]${num(r2)}\,;\,+\infty\right[`,
    out_c: (r1, r2) => T`\left]-\infty\,;\,${num(r1)}\right]\,\cup\,\left[${num(r2)}\,;\,+\infty\right[`,
  };
  function ineq(a, r1, r2, op, display) {
    // a(x - r1)(x - r2) op 0, r1 < r2
    const pos = op === '>' || op === '\\geqslant';
    const strict = op === '>' || op === '<';
    const wantSameSignAsA = pos === a > 0;
    const key = (wantSameSignAsA ? 'out' : 'in') + '_' + (strict ? 'o' : 'c');
    const ans = itv[key](r1, r2);
    const others = Object.keys(itv)
      .filter((k) => k !== key)
      .map((k) => '$' + itv[k](r1, r2) + '$');
    return K.choice(
      T`Ombre par ombre : résous $$${display} ${op} 0$$`,
      ['$' + ans + '$', ...others],
      T`Racines $${num(r1)}$ et $${num(r2)}$. Un trinôme est du signe de $a$ (ici $${a > 0 ? '+' : '-'}$) à l’extérieur des racines et du signe opposé entre elles. On cherche ${pos ? 'positif' : 'négatif'}${strict ? '' : ' ou nul'} : $S = ${ans}$.`,
      'Trouve les racines, puis le signe de a : entre les racines, le trinôme est du signe contraire de a.',
    );
  }
  CU.addSkill({
    id: 'q4',
    region: 'quad',
    name: 'Le seuil des ombres',
    place: 'Le Seuil des Ombres',
    glyph: '⋔',
    x: 520,
    y: 500,
    req: ['q3'],
    flavor: 'Au-delà du seuil, l’ombre ; en deçà, la lumière. Tout dépend du signe.',
    law: T`$ax^2+bx+c$ est du signe de $a$ à l’extérieur des racines, du signe de $-a$ entre les racines. Si $\Delta<0$, il est du signe de $a$ partout.`,
    lessons: [
      T`<p>Si $f(x)=a(x-x_1)(x-x_2)$ avec $x_1<x_2$, un tableau de signes montre que $f(x)$ est :</p>
<ul><li>du signe de $a$ quand $x<x_1$ ou $x>x_2$ (« à l’extérieur ») ;</li><li>du signe opposé quand $x_1<x<x_2$ (« entre les racines ») ;</li><li>nul en $x_1$ et $x_2$.</li></ul>
<p>Pour une inégalité large ($\leqslant$, $\geqslant$), les racines sont dans l’ensemble : crochets fermés.</p>`,
      T`<p>Méthode pour $ax^2+bx+c<0$ : on calcule les racines (factorisation ou $\Delta$), on regarde le signe de $a$, on conclut avec la règle « signe de $a$ à l’extérieur ».</p>`,
      T`<p>Cas particuliers :</p><ul><li>$\Delta=0$ : $f(x)=a(x-x_0)^2$ est du signe de $a$ et s’annule seulement en $x_0$ ;</li><li>$\Delta<0$ : $f(x)$ ne s’annule jamais et est du signe de $a$ partout.</li></ul>
<p class="ex">$x^2-6x+9>0 \iff (x-3)^2>0 \iff x\neq3$ : $S=\mathbb R\setminus\{3\}$.</p>`,
    ],
    gen: [
      () => {
        const a = R.pick([1, 2, -1, -2, 3]);
        let r1 = R.int(-8, 7),
          r2 = R.int(r1 + 1, 9);
        const op = R.pick(['>', '<', '\\geqslant', '\\leqslant']);
        return ineq(a, r1, r2, op, T`${N.k(a)}(x ${N.s(-r1)})(x ${N.s(-r2)})`.replace('(x  + 0)', 'x').replace('(x + 0)', 'x'));
      },
      () => {
        const a = R.pick([1, 1, -1, 2]);
        let r1 = R.int(-8, 7),
          r2 = R.int(r1 + 1, 9);
        const op = R.pick(['>', '<', '\\geqslant', '\\leqslant']);
        return ineq(a, r1, r2, op, pt(P.scale(P.mul([-r1, 1], [-r2, 1]), a)));
      },
      () => {
        const t = R.int(0, 2);
        const op = R.pick(['>', '<', '\\geqslant', '\\leqslant']);
        const pos = op === '>' || op === '\\geqslant',
          strict = op === '>' || op === '<';
        const all = ['\\mathbb R', '\\emptyset'];
        if (t === 0) {
          const r = R.nz(-6, 6),
            a = R.pick([1, -1, 2]);
          const f = P.scale(P.pow([-r, 1], 2), a);
          // signe de a partout, nul en r
          const same = pos === a > 0;
          const ans = same ? (strict ? T`\mathbb R\setminus\{${r}\}` : '\\mathbb R') : strict ? '\\emptyset' : T`\{${r}\}`;
          const pool = ['\\mathbb R', T`\mathbb R\setminus\{${r}\}`, '\\emptyset', T`\{${r}\}`].filter((x) => x !== ans);
          return K.choice(T`Résous $$${pt(f)} ${op} 0$$`, ['$' + ans + '$', ...pool.map((x) => '$' + x + '$')], T`$${pt(f)} = ${N.k(a)}(x ${N.s(-r)})^2$ : du signe de $a$ (${a > 0 ? 'positif' : 'négatif'}) et nul seulement en $${r}$. Donc $S = ${ans}$.`, 'Reconnais une identité remarquable : Δ = 0.');
        }
        if (t === 1) {
          let a, b, c;
          do {
            a = R.nz(-3, 3);
            b = R.int(-5, 5);
            c = R.int(-9, 9);
          } while (b * b - 4 * a * c >= 0);
          const ans = pos === a > 0 ? all[0] : all[1];
          return K.choice(T`Résous $$${pt([c, b, a])} ${op} 0$$`, ['$' + ans + '$', '$' + all.find((x) => x !== ans) + '$', '$\\left]-1\\,;\\,1\\right[$', '$\\mathbb R\\setminus\\{0\\}$'], T`$\Delta = ${b * b - 4 * a * c} < 0$ : le trinôme ne s’annule pas et garde le signe de $a$ (${a > 0 ? 'positif' : 'négatif'}) partout. $S = ${ans}$.`, 'Calcule Δ. S’il est négatif, que dire du signe ?');
        }
        const k = R.nz(-9, 9);
        const r1 = Math.min(0, k),
          r2 = Math.max(0, k);
        const e = ineq(1, r1, r2, op, T`x^2 ${N.s(-k)}x`);
        e.q = T`Résous $$x^2 ${op} ${num(k)}x$$`;
        e.sol = T`$x^2 ${op} ${num(k)}x \iff x(x ${N.s(-k)}) ${op} 0$ : racines $${r1}$ et $${r2}$, et $a=1>0$. ` + e.sol;
        e.hint = 'Ne divise pas par x (son signe est inconnu !). Passe tout à gauche et factorise.';
        return e;
      },
    ],
  });

  /* ---------- Q5 Le pacte des racines (somme et produit, paramètres) ---------- */
  CU.addSkill({
    id: 'q5',
    region: 'quad',
    name: 'Le pacte des racines',
    place: 'Le Pacte des Racines',
    glyph: '∞',
    x: 820,
    y: 660,
    req: ['q3'],
    flavor: 'Deux racines liées par un pacte : leur somme et leur produit sont gravés d’avance.',
    law: T`Si $x_1,x_2$ sont les racines de $ax^2+bx+c$ : $x_1+x_2=-\frac ba$ et $x_1x_2=\frac ca$. Deux nombres de somme $S$ et de produit $P$ sont les racines de $X^2-SX+P$.`,
    lessons: [
      T`<p>Si $ax^2+bx+c=a(x-x_1)(x-x_2)$, en développant : $a(x-x_1)(x-x_2)=ax^2-a(x_1+x_2)x+ax_1x_2$. En identifiant : $$x_1+x_2=-\frac ba \qquad x_1x_2=\frac ca.$$ Si l’on connaît une racine, le produit donne l’autre.</p>
<p class="ex">$2x^2-7x+3$ a pour racine $3$ ; l’autre vérifie $3x_2=\tfrac32$, donc $x_2=\tfrac12$.</p>`,
      T`<p>Réciproquement, deux nombres de somme $S$ et de produit $P$ sont les solutions de $$X^2-SX+P=0.$$ S’il n’y a pas de solution ($S^2-4P<0$), de tels nombres n’existent pas !</p>`,
      T`<p><b>Équations à paramètre.</b> Le nombre de solutions dépend du signe de $\Delta$, qui dépend du paramètre $m$ : on étudie l’équation (ou l’inéquation) d’inconnue $m$ obtenue. « Une unique solution » se traduit par $\Delta = 0$.</p>`,
    ],
    gen: [
      () => {
        const a = R.pick([1, 2, 3, -1, -2, 4]);
        const r1 = R.nz(-6, 6);
        const n = R.nz(-9, 9);
        const r2 = n / a;
        if (CU.near(r1, r2)) return CU.SKILLS.q5.gen[0]();
        const f = P.scale(P.mul([-r1, 1], [-r2, 1]), a);
        return K.num(T`On sait que $${r1}$ est une racine de $$${pt(f)}.$$ Trouve l’autre racine, sans calculer $\Delta$.`, r2, T`Produit des racines : $x_1x_2 = \frac ca = \frac{${num(f[0])}}{${a}} = ${num(f[0] / a)}$. Donc $x_2 = \frac{${num(f[0] / a)}}{${r1}} = ${num(r2)}$. (On peut contrôler avec la somme : $${r1} + ${N.p(r2)} = ${num(r1 + r2)} = -\frac ba$.)`, 'Le produit des racines vaut c/a.', '$x_2$');
      },
      () => {
        const none = Math.random() < 0.2;
        let S, Pp, vals;
        if (none) {
          S = R.int(-8, 8);
          Pp = Math.floor((S * S) / 4) + R.int(1, 8);
          vals = [];
        } else {
          const r1 = R.int(-9, 9),
            r2 = R.int(-9, 9);
          S = r1 + r2;
          Pp = r1 * r2;
          vals = r1 === r2 ? [r1] : [r1, r2];
        }
        return K.set(T`Trouve deux nombres dont la somme vaut $${S}$ et le produit $${Pp}$ (donne-les séparés par « ; », ou « aucune » s’ils n’existent pas).`, vals, T`Ce sont les racines de $X^2 ${N.s(-S)}X ${N.s(Pp)} = 0$ : $\Delta = ${S * S - 4 * Pp}$. ${vals.length ? 'Solutions : $' + vals.join('$ et $') + '$.' : 'Δ < 0 : de tels nombres n’existent pas.'}`, 'Ils sont solutions de X² − SX + P = 0.', 'Les deux nombres');
      },
      CU.oneOf(
        () => {
          // x² + m x + (p m + q) = 0 ; Δ = m² − 4pm − 4q = 0
          const p = R.int(-3, 3),
            d = 2 * R.int(1, 4);
          const m1 = 2 * p + d,
            m2 = 2 * p - d,
            q = (d * d) / 4 - p * p;
          const cst = p === 0 ? num(q) : `${N.k(p)}m ${q ? N.s(q) : ''}`;
          return K.set(T`Pour quelles valeurs du paramètre $m$ l’équation $$x^2 + mx + ${cst.trim().startsWith('-') ? '(' + cst + ')' : cst} = 0$$ a-t-elle une <b>unique</b> solution ?`, [m1, m2], T`$\Delta = m^2 - 4(${cst}) = ${pt([-4 * q, -4 * p, 1], 'm')}$. Unique solution $\iff \Delta = 0 \iff m = ${m2}$ ou $m = ${m1}$.`, 'Écris Δ en fonction de m. Une unique solution correspond à Δ = 0 : c’est une équation du second degré d’inconnue m.', undefined, { _noDisplay: true });
        },
        () => {
          const k = R.nz(-5, 5);
          const lim = (k * k) / 4;
          return K.choice(T`Pour quelles valeurs de $m$ l’équation $x^2 ${N.s(k)}x + m = 0$ a-t-elle <b>deux</b> solutions distinctes ?`, [T`$m < ${num(lim)}$`, T`$m > ${num(lim)}$`, T`$m \leqslant ${num(lim)}$`, T`$m = ${num(lim)}$`], T`$\Delta = ${k * k} - 4m > 0 \iff m < ${num(lim)}$.`, 'Deux solutions distinctes ⇔ Δ > 0.');
        },
      ),
    ],
  });

  /* ---------- Q6 L'oracle du discriminant (démonstrations) ---------- */
  const QPROOF1 = [
    () => K.choice(T`Si $a$ et $c$ sont de signes contraires, l’équation $ax^2+bx+c=0$…`, ['a toujours deux solutions distinctes', 'n’a jamais de solution', 'a une solution si et seulement si $b=0$', 'peut avoir 0, 1 ou 2 solutions selon $b$'], T`$ac<0$ donc $-4ac>0$, et $\Delta=b^2-4ac \geqslant -4ac > 0$. Deux solutions, quel que soit $b$.`, 'Quel est le signe de −4ac ? Et de b² ?'),
    () => K.choice(T`Si $\Delta<0$, alors pour tout réel $x$, $ax^2+bx+c$…`, ['est du signe de $a$', 'est négatif', 'est positif', 'change de signe une fois'], T`Il ne s’annule jamais, et vaut $a\left[(x-\alpha)^2-\frac{\Delta}{4a^2}\right]$ où le crochet est strictement positif : il est donc du signe de $a$.`, 'Regarde la forme canonique : le crochet est une somme de termes positifs.'),
    () => K.choice(T`L’axe de symétrie de la parabole $y=ax^2+bx+c$ est la droite…`, ['$x=-\\dfrac{b}{2a}$', '$x=-\\dfrac{b}{a}$', '$y=-\\dfrac{\\Delta}{4a}$', '$x=\\dfrac{b}{2a}$'], T`C’est la droite verticale passant par le sommet, d’abscisse $\alpha=-\frac b{2a}$. C’est aussi la moyenne des racines quand elles existent : $\frac{x_1+x_2}2=-\frac b{2a}$.`, 'Le sommet est sur l’axe.'),
    () => K.choice(T`Une parabole $y=ax^2+bx+c$ coupe l’axe des abscisses en $-1$ et $5$. Que vaut l’abscisse de son sommet ?`, ['$2$', '$3$', '$-3$', 'On ne peut pas savoir sans connaître $a$'], T`Par symétrie, le sommet est au milieu des racines : $\frac{-1+5}2=2$. Le coefficient $a$ ne change rien à cette abscisse.`, 'La parabole est symétrique.'),
    () => K.choice(T`Vrai ou faux : « si $ax^2+bx+c = 0$ a deux solutions, alors $a$ et $c$ sont de signes contraires ».`, ['Faux : par exemple $x^2-3x+2=0$ a deux solutions avec $a, c > 0$', 'Vrai : c’est le théorème vu en cours', 'Vrai, car $\\Delta>0$ impose $ac<0$', 'Faux, car alors $\\Delta = 0$'], T`C’est la <b>réciproque</b> de « $ac<0 \Rightarrow$ deux solutions », et elle est fausse : $x^2-3x+2=(x-1)(x-2)$, avec $a=1$, $c=2$.`, 'Une implication vraie peut avoir une réciproque fausse.'),
  ];
  const QPROOF2 = [
    () =>
      K.order(
        T`<b>Théorème.</b> Pour $a\neq0$ : $ax^2+bx+c = a\left[\left(x+\frac{b}{2a}\right)^2-\frac{\Delta}{4a^2}\right]$ avec $\Delta=b^2-4ac$. Remets la démonstration dans l’ordre.`,
        [T`Comme $a\neq0$ : $ax^2+bx+c = a\left[x^2+\frac ba x + \frac ca\right]$.`, T`Or $x^2+\frac ba x = \left(x+\frac b{2a}\right)^2 - \frac{b^2}{4a^2}$.`, T`Donc $ax^2+bx+c = a\left[\left(x+\frac b{2a}\right)^2 - \frac{b^2}{4a^2}+\frac{4ac}{4a^2}\right]$.`, T`$= a\left[\left(x+\frac b{2a}\right)^2-\frac{b^2-4ac}{4a^2}\right]$, ce qui est le résultat.`],
        [T`Or $x^2+\frac ba x = \left(x+\frac b{a}\right)^2 - \frac{b^2}{a^2}$.`],
        T`On factorise par $a$, on complète le carré avec la <b>moitié</b> du coefficient de $x$ (d’où le $\frac b{2a}$), puis on met au même dénominateur $4a^2$. L’intrus oublie de diviser par $2$.`,
        'Mets a en facteur, puis complète le carré.',
      ),
    () =>
      K.order(
        T`<b>Théorème.</b> Si $\Delta>0$, l’équation $ax^2+bx+c=0$ a pour solutions $\frac{-b\pm\sqrt\Delta}{2a}$. (On part de la forme canonique.)`,
        [T`$ax^2+bx+c=0 \iff \left(x+\frac b{2a}\right)^2-\frac{\Delta}{4a^2}=0$ (car $a\neq0$).`, T`Comme $\Delta>0$, $\frac{\Delta}{4a^2}=\left(\frac{\sqrt\Delta}{2a}\right)^2$.`, T`Différence de deux carrés : $\left(x+\frac b{2a}-\frac{\sqrt\Delta}{2a}\right)\left(x+\frac b{2a}+\frac{\sqrt\Delta}{2a}\right)=0$.`, T`Produit nul : $x=\frac{-b+\sqrt\Delta}{2a}$ ou $x=\frac{-b-\sqrt\Delta}{2a}$.`],
        [T`On divise par $\left(x+\frac b{2a}\right)$.`],
        T`Toute la formule vient de deux outils de la Crypte : l’identité $A^2-B^2=(A-B)(A+B)$ et le produit nul. Le calcul de $\sqrt{4a^2}$ donne $2|a|$, mais le $\pm$ absorbe le signe : on peut écrire $2a$.`,
        'Forme canonique, différence de deux carrés, produit nul.',
      ),
  ];
  const QPROOF3 = [
    () =>
      K.order(
        T`<b>Théorème.</b> Si $\Delta\geqslant0$, les racines $x_1,x_2$ de $ax^2+bx+c$ vérifient $x_1+x_2=-\frac ba$ et $x_1x_2=\frac ca$.`,
        [T`On a $x_1=\frac{-b-\sqrt\Delta}{2a}$ et $x_2=\frac{-b+\sqrt\Delta}{2a}$.`, T`$x_1+x_2=\frac{-2b}{2a}=-\frac ba$.`, T`$x_1x_2=\frac{(-b)^2-(\sqrt\Delta)^2}{4a^2}$ (identité $(A-B)(A+B)$).`, T`$=\frac{b^2-b^2+4ac}{4a^2}=\frac ca$.`],
        [T`$x_1x_2=\frac{b^2+\Delta}{4a^2}$.`],
        T`La somme : les $\sqrt\Delta$ s’annulent. Le produit : c’est $(A-B)(A+B)=A^2-B^2$ avec $A=-b$, $B=\sqrt\Delta$.`,
        'Écris les deux racines, puis calcule.',
        { alts: [[0, 2, 3, 1]] },
      ),
    () =>
      K.order(
        T`<b>Théorème.</b> Si $ac<0$, alors $ax^2+bx+c=0$ a deux solutions distinctes. Remets la preuve dans l’ordre.`,
        [T`Supposons $ac<0$.`, T`Alors $-4ac>0$.`, T`Comme $b^2\geqslant0$, $\Delta=b^2-4ac>0$.`, T`$\Delta>0$ : l’équation a deux solutions distinctes.`],
        [T`Alors $b^2<0$.`],
        T`Un carré est toujours positif ou nul : ajouter un nombre strictement positif donne un nombre strictement positif.`,
        'Hypothèse, puis signe de −4ac, puis signe de Δ.',
      ),
    () =>
      K.choice(
        T`<b>Trouve l’erreur.</b> « Résolvons $x^2+x+1=0$. (1) $\Delta = 1-4=-3$. (2) Donc $\sqrt\Delta = \sqrt{-3}$. (3) Les solutions sont $\frac{-1\pm\sqrt{-3}}2$. » Qu’est-ce qui ne va pas ?`,
        ['(2) : $\\sqrt{-3}$ n’existe pas dans $\\mathbb R$ ; il n’y a aucune solution réelle', '(1) : $\\Delta = 1+4 = 5$', 'Rien : ce sont bien les solutions réelles', '(3) : il faudrait diviser par $a = 1$, pas par $2$'],
        T`La formule n’est valable que pour $\Delta\geqslant0$. Ici $\Delta<0$ : $x^2+x+1=\left(x+\frac12\right)^2+\frac34>0$ ne s’annule jamais. (Les nombres $\frac{-1\pm i\sqrt3}{2}$ existent… mais dans un autre monde : celui des nombres complexes.)`,
        'La racine carrée d’un nombre négatif existe-t-elle dans ℝ ?',
      ),
    () =>
      K.order(
        T`<b>Défi.</b> Montre que l’équation $x^2 + 2025x + 2027 = 0$ n’a pas de solution entière.`,
        [T`Supposons qu’un entier $n$ soit solution : $n^2+2025n+2027=0$.`, T`Alors $n^2+2025n = n(n+2025) = -2027$.`, T`Or $n$ et $n+2025$ n’ont pas la même parité : l’un des deux est pair.`, T`Donc $n(n+2025)$ est pair, alors que $-2027$ est impair : contradiction.`, T`Il n’existe donc aucune solution entière.`],
        [T`Or $\Delta = 2025^2 - 4\times2027 > 0$, donc il y a deux solutions entières.`],
        T`Raisonnement par l’absurde et argument de parité : $n$ et $n+2025$ diffèrent d’un nombre impair, donc l’un est pair. $\Delta>0$ dit qu’il y a deux solutions réelles, rien sur leur caractère entier.`,
        'Suppose qu’un entier n est solution et regarde la parité de n(n + 2025).',
      ),
  ];
  CU.addSkill({
    id: 'q6',
    region: 'quad',
    name: 'L’oracle du discriminant',
    place: 'L’Oracle',
    glyph: 'Δ',
    x: 760,
    y: 300,
    req: ['q4', 'q5'],
    flavor: 'L’Oracle répond à toutes les questions. Mais il exige qu’on lui prouve pourquoi.',
    law: T`Tout le second degré découle de la forme canonique $a\left[\left(x+\frac b{2a}\right)^2-\frac\Delta{4a^2}\right]$ : nombre de racines, formules, signe, somme et produit.`,
    lessons: [
      T`<p>Toutes les règles du second degré se <b>démontrent</b> à partir de la forme canonique. Comprendre ces preuves, c’est ne plus jamais avoir besoin d’apprendre les formules par cœur.</p>
<p>Méfie-toi des <b>réciproques</b> : « $ac<0 \Rightarrow$ deux solutions » est vrai, mais l’implication inverse est fausse.</p>`,
      T`<p>La formule des racines n’est que : forme canonique, puis différence de deux carrés $A^2-B^2=(A-B)(A+B)$ (possible car $\Delta\geqslant0$ a une racine carrée), puis produit nul.</p>`,
      T`<p>Raisonnements de haut niveau : <b>par l’absurde</b> (on suppose le contraire et on aboutit à une contradiction), <b>par la parité</b> (un nombre ne peut être à la fois pair et impair). Ils permettent de démontrer qu’une équation n’a pas de solution entière sans la résoudre.</p>`,
    ],
    gen: [() => R.pick(QPROOF1)(), () => R.pick(QPROOF2)(), () => R.pick(QPROOF3)()],
  });
})();
