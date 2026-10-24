/* Région 4 — La Bibliothèque des Automates (Python)
   Région 5 — Le Labyrinthe des Sophistes (logique, hors programme). */
'use strict';
(function () {
  const { R, T, K, N, P, num } = CU;
  const code = (s) => '<pre class="code"><code>' + CU.hlPy(s) + '</code></pre>';
  CU.hlPy = (s) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/("[^"]*")/g, '<span class="s">$1</span>')
      .replace(/\b(def|return|if|elif|else|for|while|in|range|print|and|or|not|from|import|True|False)\b/g, '<span class="k">$1</span>')
      .replace(/(#.*)$/gm, '<span class="c">$1</span>');
  const sgn = (x) => (x < 0 ? ' - ' + -x : ' + ' + x);

  /* ================= LA BIBLIOTHÈQUE DES AUTOMATES ================= */
  const PY1 = [
    () => {
      const a = R.int(2, 20),
        b = R.int(2, 20);
      return K.text(T`Un automate exécute ce programme. Qu’affiche-t-il ? (écris seulement les valeurs affichées, dans l’ordre, séparées par un espace)` + code(`a = ${a}\nb = ${b}\na = a + b\nb = a - b\na = a - b\nprint(a, b)`), `${b} ${a}`, T`Ligne par ligne : $a=${a+b}$, puis $b = ${a+b}-${b} = ${a}$, puis $a = ${a+b}-${a} = ${b}$. Affichage : <code>${b} ${a}</code>. Ce programme <b>échange</b> les valeurs de $a$ et $b$ sans variable auxiliaire.`, 'Tiens un petit tableau : la valeur de a et de b après chaque ligne.');
    },
    () => {
      const x = R.int(-5, 9),
        k = R.int(2, 5),
        c = R.int(1, 9);
      const y = x * k - c;
      return K.text(T`Qu’affiche ce programme ?` + code(`x = ${x}\ny = x * ${k} - ${c}\nx = y + x\nprint(x)`), String(y + x), T`$y = ${x}\times${k}-${c} = ${y}$, puis $x = ${y} + ${N.p(x)} = ${y + x}$.`, 'Le signe = range une valeur dans une variable : le membre de droite est calculé avec les valeurs actuelles.');
    },
    () => {
      const a = R.int(1, 9);
      return K.text(T`Qu’affiche ce programme ?` + code(`a = ${a}\nb = a\na = a * 2\nprint(a, b)`), `${2 * a} ${a}`, T`<code>b = a</code> copie la valeur ${a} dans b. Changer a ensuite ne change pas b : affichage <code>${2 * a} ${a}</code>.`, 'Après b = a, les deux variables sont indépendantes.');
    },
    () => {
      const a = R.int(2, 6),
        b = R.int(2, 4);
      return K.text(T`Qu’affiche ce programme ? (<code>**</code> est la puissance)` + code(`a = ${a}\nb = ${b}\nc = a ** b - a * b\nprint(c)`), String(a ** b - a * b), T`$${a}^{${b}} - ${a}\times${b} = ${a ** b} - ${a * b} = ${a ** b - a * b}$.`, 'En Python, a ** b est a puissance b.');
    },
  ];
  const PY2 = [
    () => {
      const p = R.int(-6, 6),
        q = R.int(-9, 9),
        v = R.int(-4, 5);
      const f = (x) => x * x + p * x + q;
      return K.text(T`Qu’affiche ce programme ?` + code(`def f(x):\n    return x**2${sgn(p)}*x${sgn(q)}\n\nprint(f(${v}))`).replace('+ 0*x', '+ 0*x'), String(f(v)), T`$f(${v}) = ${N.p(v)}^2 ${N.s(p)}\times${N.p(v)} ${N.s(q)} = ${f(v)}$.`, 'Remplace x par la valeur entre parenthèses.');
    },
    () => {
      const a = R.nz(-3, 3),
        b = R.int(-6, 6),
        c = R.int(-6, 6);
      const d = b * b - 4 * a * c;
      const out = d > 0 ? 'deux' : d === 0 ? 'une' : 'aucune';
      return K.text(T`Qu’affiche ce programme ?` + code(`def nb_racines(a, b, c):\n    d = b**2 - 4*a*c\n    if d > 0:\n        return "deux"\n    elif d == 0:\n        return "une"\n    else:\n        return "aucune"\n\nprint(nb_racines(${a}, ${b}, ${c}))`), out, T`$d = ${N.p(b)}^2-4\times${N.p(a)}\times${N.p(c)} = ${d}$, donc le programme renvoie <code>"${out}"</code> et affiche <code>${out}</code>.`, 'Calcule d, puis suis le premier test qui est vrai.');
    },
    () => {
      const x1 = R.int(-9, 9),
        y1 = R.int(-9, 9),
        x2 = R.int(-9, 9),
        y2 = R.int(-9, 9);
      const d = x1 * y2 - y1 * x2;
      return K.text(T`Qu’affiche ce programme ?` + code(`def colineaires(x1, y1, x2, y2):\n    return x1*y2 - y1*x2 == 0\n\nprint(colineaires(${x1}, ${y1}, ${x2}, ${y2}))`), d === 0 ? 'True' : 'False', T`$${x1}\times${N.p(y2)} - ${N.p(y1)}\times${N.p(x2)} = ${d}$. Le test <code>== 0</code> est ${d === 0 ? 'vrai' : 'faux'} : affichage <code>${d === 0 ? 'True' : 'False'}</code>.`, 'Le programme calcule un déterminant et affiche le résultat d’un test : True ou False.');
    },
    () => {
      const n = R.int(-10, 15);
      const out = n % 2 === 0 ? (n > 0 ? 'A' : 'B') : n > 5 ? 'C' : 'D';
      return K.text(T`Qu’affiche ce programme ? (<code>n % 2</code> est le reste de la division de <code>n</code> par 2)` + code(`n = ${n}\nif n % 2 == 0:\n    if n > 0:\n        print("A")\n    else:\n        print("B")\nelse:\n    if n > 5:\n        print("C")\n    else:\n        print("D")`), out, T`$${n}$ est ${n % 2 === 0 ? 'pair' : 'impair'} ; ${n % 2 === 0 ? (n > 0 ? 'positif' : 'pas strictement positif') : n > 5 ? 'et supérieur à 5' : 'et pas supérieur à 5'} : on affiche <code>${out}</code>.`, 'Suis l’indentation : chaque bloc ne s’exécute que si son test est vrai.');
    },
  ];
  const PY3 = [
    () => {
      const a = R.int(0, 5),
        b = R.int(a + 3, a + 9);
      let s = 0;
      for (let i = a; i < b; i++) s += i;
      return K.text(T`Qu’affiche ce programme ? (<code>range(a, b)</code> parcourt les entiers de <code>a</code> à <code>b - 1</code>)` + code(`s = 0\nfor i in range(${a}, ${b}):\n    s = s + i\nprint(s)`), String(s), T`On additionne les entiers de ${a} à ${b - 1} (attention, ${b} est exclu) : $s = ${s}$.`, 'range(a, b) s’arrête juste avant b.');
    },
    () => {
      const n0 = R.pick([20, 37, 50, 64, 100, 129, 250, 1000]);
      let n = n0,
        c = 0;
      while (n > 1) {
        n = Math.floor(n / 2);
        c++;
      }
      return K.text(T`Qu’affiche ce programme ? (<code>//</code> est la division entière : <code>7 // 2</code> vaut <code>3</code>)` + code(`n = ${n0}\nc = 0\nwhile n > 1:\n    n = n // 2\n    c = c + 1\nprint(c)`), String(c), T`On divise par 2 (division entière) jusqu’à arriver à 1 : il faut ${c} étapes. C’est (presque) le nombre de chiffres de ${n0} en base 2, moins un.`, 'Note les valeurs successives de n.');
    },
    () => {
      const N0 = R.int(10, 40),
        k = R.pick([3, 4, 5, 7]);
      let c = 0;
      for (let i = 1; i <= N0; i++) if (i % k === 0) c++;
      return K.text(T`Qu’affiche ce programme ?` + code(`compte = 0\nfor i in range(1, ${N0 + 1}):\n    if i % ${k} == 0:\n        compte = compte + 1\nprint(compte)`), String(c), T`On compte les multiples de ${k} entre 1 et ${N0} : il y en a $\lfloor ${N0}/${k} \rfloor = ${c}$.`, 'i % k == 0 signifie « i est un multiple de k ».');
    },
    () => {
      const a = R.int(1, 3),
        b = R.int(-9, -1),
        c = R.int(-12, 12);
      const out = [];
      for (let x = -10; x <= 10; x++) if (a * x * x + b * x + c === 0) out.push(x);
      return K.text(T`Qu’affiche ce programme ? (écris les nombres affichés séparés par un espace, ou « rien »)` + code(`for x in range(-10, 11):\n    if ${a}*x**2 ${b < 0 ? '-' : '+'} ${Math.abs(b)}*x ${c < 0 ? '-' : '+'} ${Math.abs(c)} == 0:\n        print(x)`), out.length ? out.join(' ') : 'rien', T`Le programme affiche les racines <b>entières</b> de $${P.tex([c, b, a])}$ comprises entre $-10$ et $10$ : ${out.length ? out.join(' et ') : 'il n’y en a aucune'}. ${(() => { const Q = CU.quadRoots(a, b, c); return T`(Racines réelles : $\Delta = ${Q.delta}$${Q.vals.length ? ', $' + Q.tex.join('$, $') + '$' : ''}.)`; })()}`, 'Cherche les racines entières de ce trinôme (par Δ, ou en essayant).');
    },
  ];
  CU.addSkill({
    id: 'p1',
    region: 'py',
    name: 'Les rouages',
    place: 'La Salle des Rouages',
    glyph: '⚙',
    x: 230,
    y: 820,
    req: [],
    flavor: 'Les automates exécutent sans comprendre. Toi, tu dois comprendre sans exécuter.',
    law: T`Un programme s’exécute ligne par ligne. <code>a = expr</code> calcule <code>expr</code> avec les valeurs actuelles, puis range le résultat dans <code>a</code>.`,
    lessons: [
      T`<p>En Python, <code>a = 5</code> <b>affecte</b> la valeur 5 à la variable <code>a</code>. Ce n’est pas une égalité mathématique : <code>a = a + 1</code> signifie « calcule a + 1, puis range le résultat dans a ».</p>
<p>Opérations : <code>+ - *</code>, <code>/</code> (division), <code>**</code> (puissance), <code>//</code> (division entière), <code>%</code> (reste).</p>
<p>Pour prévoir ce qu’affiche un programme, on tient un tableau des valeurs des variables après chaque ligne.</p>`,
      T`<p>Une <b>fonction</b> reçoit des valeurs et <b>renvoie</b> un résultat :</p>${code('def f(x):\n    return x**2 - 3*x\n\nprint(f(4))   # affiche 4')}
<p>Un <b>test</b> <code>if … elif … else</code> exécute le premier bloc dont la condition est vraie. Le bloc est défini par l’<b>indentation</b> (le décalage vers la droite). <code>==</code> teste l’égalité, et un test vaut <code>True</code> ou <code>False</code>.</p>`,
      T`<p>Une <b>boucle</b> <code>for i in range(a, b):</code> répète son bloc pour <code>i</code> allant de <code>a</code> à <code>b - 1</code> (attention : <code>b</code> est exclu). Une boucle <code>while condition:</code> répète tant que la condition est vraie.</p>${code('s = 0\nfor i in range(1, 4):\n    s = s + i\nprint(s)   # 1 + 2 + 3 = 6')}`,
    ],
    gen: [() => R.pick(PY1)(), () => R.pick(PY2)(), () => R.pick(PY3)()],
  });

  const fill = (q, body, right, wrong, sol, hint) => K.choice(T`${q}` + code(body), [right, ...wrong].map((x) => '<code>' + CU.hlPy(x) + '</code>'), sol, hint);
  const PC1 = [
    () => fill('Quelle ligne complète cette fonction qui calcule le discriminant ?', 'def delta(a, b, c):\n    return ___', 'b**2 - 4*a*c', ['b*2 - 4*a*c', 'b**2 - 4*a*b', '(b**2 - 4*a*c) / 2*a'], 'Δ = b² − 4ac, et le carré s’écrit <code>b**2</code> en Python (<code>b*2</code> est le double).', 'Le carré, en Python, c’est **2.'),
    () => fill('Quelle ligne complète cette fonction qui calcule la norme d’un vecteur ?', 'from math import sqrt\n\ndef norme(x, y):\n    return ___', 'sqrt(x**2 + y**2)', ['sqrt(x + y)**2', 'x**2 + y**2', 'sqrt(x**2) + sqrt(y**2)'], '‖u‖ = √(x² + y²). Attention : √(x²) + √(y²) = |x| + |y|, ce n’est pas la longueur.', 'Pythagore.'),
    () => fill('Quelle ligne renvoie l’abscisse du milieu de [AB] ?', 'def milieu_x(xA, xB):\n    return ___', '(xA + xB) / 2', ['xA + xB / 2', '(xB - xA) / 2', 'xA / 2 + xB'], 'La moyenne des abscisses. Sans parenthèses, <code>xA + xB / 2</code> ne divise que xB (priorité des opérations).', 'Attention aux priorités : la division passe avant l’addition.'),
    () => fill('Quelle ligne complète cette fonction qui teste si x est solution de ax² + bx + c = 0 ?', 'def est_solution(a, b, c, x):\n    return ___', 'a*x**2 + b*x + c == 0', ['a*x**2 + b*x + c = 0', 'a*x**2 + b*x + c', 'a*x*2 + b*x + c == 0'], '<code>==</code> teste une égalité et renvoie True ou False ; un seul <code>=</code> est une affectation (erreur ici).', '= range une valeur, == compare.'),
  ];
  const PC2 = [
    () => fill('Quelle ligne manque pour que la fonction renvoie le nombre de solutions de ax² + bx + c = 0 ?', 'def nb_solutions(a, b, c):\n    d = b**2 - 4*a*c\n    if d > 0:\n        return 2\n    ___\n        return 1\n    else:\n        return 0', 'elif d == 0:', ['if d < 0:', 'elif d = 0:', 'else d == 0:'], '<code>elif</code> (« sinon, si ») avec le test d’égalité <code>==</code>.', 'Il faut un « sinon, si » et un test d’égalité.'),
    () => fill('Quelle ligne complète cette fonction qui renvoie le sommet (α ; β) de f(x) = ax² + bx + c ?', 'def sommet(a, b, c):\n    alpha = ___\n    beta = a*alpha**2 + b*alpha + c\n    return alpha, beta', '-b / (2*a)', ['-b / 2*a', 'b / (2*a)', '-b / (2*c)'], 'α = −b/(2a). Sans parenthèses, <code>-b / 2*a</code> calcule (−b/2)×a.', 'Attention aux parenthèses autour de 2a.'),
    () => fill('Quelle ligne complète cette fonction qui teste si A, B, C sont alignés ?', 'def alignes(xA, yA, xB, yB, xC, yC):\n    ux, uy = xB - xA, yB - yA\n    vx, vy = xC - xA, yC - yA\n    return ___', 'ux*vy - uy*vx == 0', ['ux*vx - uy*vy == 0', 'ux*vy + uy*vx == 0', 'ux == vx and uy == vy'], 'A, B, C alignés ⇔ det(AB, AC) = 0, et det = x·y′ − y·x′.', 'Déterminant des vecteurs AB et AC.'),
  ];
  const PC3 = [
    () => fill('Ce programme cherche le plus petit entier n tel que 2ⁿ dépasse 1000. Quelle condition manque ?', 'n = 0\nwhile ___:\n    n = n + 1\nprint(n)', '2**n <= 1000', ['2**n > 1000', 'n < 1000', '2*n <= 1000'], 'On continue <b>tant que</b> 2ⁿ ne dépasse pas 1000 ; la boucle s’arrête au premier n tel que 2ⁿ > 1000 (n = 10).', 'La condition d’un while est celle pour continuer, pas pour s’arrêter.'),
    () => fill('Ce programme calcule 1² + 2² + … + 10². Quelle ligne manque ?', 's = 0\nfor k in range(1, 11):\n    ___\nprint(s)', 's = s + k**2', ['s = k**2', 's = s + k*2', 's + k**2'], 'On accumule : à chaque tour, on ajoute k² à la somme déjà calculée. Le résultat est 385.', 'Il faut ajouter à s, pas remplacer s.'),
    () => fill('Ce programme approche √2 par la méthode de Héron. Quelle ligne manque ?', 'x = 2\nfor i in range(5):\n    ___\nprint(x)', 'x = (x + 2/x) / 2', ['x = x + 2/x / 2', 'x = (x + 2*x) / 2', 'x = (x + x/2) / 2'], 'Héron : $x_{n+1}=\\frac12\\left(x_n+\\frac2{x_n}\\right)$. Si $x>\\sqrt2$, alors $\\frac2x<\\sqrt2$ : on fait la moyenne d’un nombre trop grand et d’un nombre trop petit. La convergence est fulgurante (le nombre de décimales justes double à chaque tour).', 'Moyenne de x et de 2/x.'),
  ];
  CU.addSkill({
    id: 'p2',
    region: 'py',
    name: 'L’atelier des automates',
    place: 'L’Atelier des Automates',
    glyph: '⌬',
    x: 520,
    y: 580,
    req: ['p1'],
    flavor: 'Il manque une pièce à chaque automate. Une seule convient — les autres le feraient exploser.',
    law: T`<code>==</code> compare, <code>=</code> affecte. <code>**</code> est la puissance. Les parenthèses fixent les priorités : <code>-b / (2*a)</code>.`,
    lessons: [
      T`<p>Pièges classiques : <code>b*2</code> (double) n’est pas <code>b**2</code> (carré) ; <code>=</code> range une valeur, <code>==</code> compare ; la multiplication doit être écrite : <code>4*a*c</code> et non <code>4ac</code>.</p>`,
      T`<p>Priorités : comme en maths, <code>*</code> et <code>/</code> passent avant <code>+</code> et <code>-</code>, et sont calculés de gauche à droite : <code>-b / 2*a</code> vaut $\frac{-b}{2}\times a$. Mets des parenthèses : <code>-b / (2*a)</code>.</p>`,
      T`<p>Une boucle <code>while</code> continue <b>tant que</b> sa condition est vraie. Pour « le premier $n$ tel que… », on écrit la condition contraire. Pour une somme, on <b>accumule</b> : <code>s = s + terme</code>.</p>`,
    ],
    gen: [() => R.pick(PC1)(), () => R.pick(PC2)(), () => R.pick(PC3)()],
  });

  const pars = (q, lines, decoys, sol, hint, alts) => {
    const e = K.order(q, lines.map((l) => '<code class="pl">' + CU.hlPy(l) + '</code>'), decoys.map((l) => '<code class="pl">' + CU.hlPy(l) + '</code>'), sol, hint, { alts: alts || [], code: true });
    return e;
  };
  const PP1 = [
    () => pars('Reconstitue le programme qui affiche les racines entières de x² − x − 6 entre −10 et 10.', ['for x in range(-10, 11):', '    if x**2 - x - 6 == 0:', '        print(x)'], ['    if x**2 - x - 6 = 0:'], 'La boucle parcourt les entiers, le test (avec <code>==</code>) sélectionne les racines : <code>-2</code> et <code>3</code>.', 'D’abord la boucle, puis le test (indenté), puis l’affichage (encore plus indenté).'),
    () => pars('Reconstitue le programme qui affiche le plus petit n tel que n² > 500.', ['n = 0', 'while n**2 <= 500:', '    n = n + 1', 'print(n)'], ['while n**2 > 500:'], 'On initialise, on avance tant que n² ≤ 500, puis on affiche : 23 (car 22² = 484 et 23² = 529).', 'Initialisation, boucle, affichage.'),
  ];
  const PP2 = [
    () => pars('Reconstitue la fonction qui renvoie les solutions de ax² + bx + c = 0 (a ≠ 0).', ['from math import sqrt', 'def solutions(a, b, c):', '    d = b**2 - 4*a*c', '    if d < 0:', '        return []', '    x1 = (-b - sqrt(d)) / (2*a)', '    x2 = (-b + sqrt(d)) / (2*a)', '    return [x1, x2]'], ['    x1 = -b - sqrt(d) / 2*a'], 'On calcule Δ, on traite le cas Δ < 0 (aucune solution), puis la formule. (Si Δ = 0, la fonction renvoie deux fois la même racine.)', 'Calcule d’abord d ; le cas sans solution doit être traité avant de prendre sqrt(d).', [[0, 1, 2, 3, 4, 6, 5, 7]]),
    () => pars('Reconstitue la fonction qui calcule les coordonnées de D pour que ABCD soit un parallélogramme.', ['def quatrieme_sommet(xA, yA, xB, yB, xC, yC):', '    xD = xA + xC - xB', '    yD = yA + yC - yB', '    return xD, yD'], ['    xD = xA + xB - xC'], '$\\overrightarrow{AB}=\\overrightarrow{DC}$ donne $x_D = x_A + x_C - x_B$.', 'AB = DC.', [[0, 2, 1, 3]]),
  ];
  const PP3 = [
    () => pars('Reconstitue l’algorithme de <b>dichotomie</b> qui encadre la racine positive de x² − 2 (c’est-à-dire √2) entre a et b, à 0,001 près.', ['a, b = 1, 2', 'while b - a > 0.001:', '    m = (a + b) / 2', '    if m**2 - 2 > 0:', '        b = m', '    else:', '        a = m', 'print(a, b)'], ['    if m**2 - 2 < 0:', 'while b - a < 0.001:'], 'On coupe l’intervalle en deux à chaque tour : si $m^2>2$, la racine est à gauche de $m$ (on remplace $b$), sinon à droite (on remplace $a$). Après $k$ tours, la largeur est $2^{-k}$ : 10 tours suffisent pour 0,001.', 'L’intervalle [a ; b] contient toujours √2. Si m² > 2, √2 est entre a et m.'),
    () => pars('Reconstitue le programme qui compte les entiers de 1 à 1000 à la fois multiples de 6 et de 15.', ['c = 0', 'for n in range(1, 1001):', '    if n % 6 == 0 and n % 15 == 0:', '        c = c + 1', 'print(c)'], ['    if n % 6 == 0 or n % 15 == 0:'], 'Multiple de 6 et de 15 ⇔ multiple de leur PPCM, 30 : il y en a 33. (Avec <code>or</code>, on compterait autre chose.)', '« à la fois » se dit and.'),
  ];
  CU.addSkill({
    id: 'p3',
    region: 'py',
    name: 'Le grand mécanisme',
    place: 'Le Grand Mécanisme',
    glyph: '⛭',
    x: 760,
    y: 330,
    req: ['p2'],
    flavor: 'Ses pièces ont été dispersées. Remonte-le, et il calculera pour toi ce qu’aucun mage n’oserait.',
    law: T`Un algorithme : initialiser, répéter (boucle), décider (test), produire (renvoyer ou afficher). L’indentation dit ce qui appartient à quoi.`,
    lessons: [
      T`<p>Pour reconstituer un programme, on cherche d’abord ce qui doit exister <b>avant</b> (imports, initialisation des variables), puis la <b>boucle</b>, puis ce qu’elle contient (indenté), et enfin ce qui vient <b>après</b>.</p>`,
      T`<p>Dans une fonction, on traite les cas particuliers <b>avant</b> l’opération qui pourrait échouer : on ne calcule pas <code>sqrt(d)</code> si <code>d &lt; 0</code>.</p>`,
      T`<p>La <b>dichotomie</b> : si une fonction continue change de signe entre $a$ et $b$, elle s’annule entre les deux. On coupe en deux, on garde la moitié où le changement de signe a lieu, et on recommence. Après $k$ étapes, l’intervalle a été divisé par $2^k$.</p>`,
    ],
    gen: [() => R.pick(PP1)(), () => R.pick(PP2)(), () => R.pick(PP3)()],
  });

  /* ================= LE LABYRINTHE DES SOPHISTES ================= */
  const LOG1 = [
    () => {
      const a = R.int(2, 9);
      return K.choice(T`« Pour tout réel $x$ : si $x^2=${a * a}$, alors $x=${a}$. »`, [T`Faux : $x=${-a}$ est un contre-exemple`, 'Vrai', T`Faux : $x=${a}$ est un contre-exemple`, T`Faux : $x = ${a * a}$ est un contre-exemple`], T`$(-${a})^2 = ${a * a}$ mais $-${a}\neq${a}$. La réciproque, elle, est vraie : si $x=${a}$ alors $x^2=${a * a}$.`, 'Un carré a toujours deux racines, sauf zéro.');
    },
    () => {
      const a = R.int(1, 6);
      return K.choice(T`« Pour tout réel $x$ : si $x>${a}$, alors $x^2>${a * a}$. »`, ['Vrai', T`Faux : $x=${-a - 1}$ est un contre-exemple`, T`Faux : $x=${a}$ est un contre-exemple`, 'On ne peut pas savoir'], T`Si $x>${a}>0$, alors $x^2 > ${a}x > ${a * a}$ (on multiplie par un nombre positif). C’est vrai. Le « contre-exemple » $x=${-a - 1}$ ne vérifie pas l’hypothèse $x>${a}$ : il ne prouve rien.`, 'Un contre-exemple doit vérifier l’hypothèse et pas la conclusion.');
    },
    () => {
      const a = R.int(1, 6);
      return {
        ...K.num(T`« Pour tout réel $x$ : si $x^2>${a * a}$, alors $x>${a}$. » C’est faux. Donne un contre-exemple (un nombre $x$).`, 0, T`Il faut $x^2>${a * a}$ mais $x\leqslant${a}$ : n’importe quel $x<${-a}$ convient, par exemple $x=${-a - 1}$.`, 'Il faut que l’hypothèse soit vraie et la conclusion fausse. Pense aux négatifs.', '$x$'),
        _vals: [-a - 1],
        check(ans) {
          try {
            const x = CU.evalAst(CU.parse(ans[0]), 0);
            if (x * x > a * a && x <= a) return { ok: true };
            if (!(x * x > a * a)) return { ok: false, msg: 'Ce nombre ne vérifie même pas l’hypothèse x² > ' + a * a + '.' };
            return { ok: false, msg: 'Pour ce nombre, la conclusion x > ' + a + ' est vraie : ce n’est pas un contre-exemple.' };
          } catch (e) {
            return { ok: false, msg: e.message, syntax: true };
          }
        },
      };
    },
    () => K.choice(T`Un garde déclare : « Si tu es un mage, alors tu portes une rune. » Quelle situation prouverait qu’il <b>ment</b> ?`, ['Un mage sans rune', 'Un non-mage avec une rune', 'Un non-mage sans rune', 'Un mage avec une rune'], T`« Si P alors Q » n’est faux que si P est vrai et Q faux. Un non-mage, avec ou sans rune, ne contredit rien.`, 'Quand une implication est-elle fausse ?'),
  ];
  const LOG2 = [
    () => K.choice(T`Quelle est la <b>contraposée</b> de « S’il pleut, alors le sol est mouillé » ?`, ['Si le sol n’est pas mouillé, alors il ne pleut pas', 'Si le sol est mouillé, alors il pleut', 'S’il ne pleut pas, alors le sol n’est pas mouillé', 'Il pleut et le sol n’est pas mouillé'], T`La contraposée de « $P\Rightarrow Q$ » est « non $Q \Rightarrow$ non $P$ » : elle est <b>équivalente</b> à l’implication. La deuxième proposition est la réciproque, la troisième est la contraposée de la réciproque (équivalente à la réciproque), la quatrième est la négation.`, 'Contraposée : on nie les deux et on les échange.'),
    () => K.choice(T`Quelle est la <b>réciproque</b> de « Si $ABCD$ est un carré, alors ses diagonales ont la même longueur » ? Est-elle vraie ?`, ['« Si les diagonales de $ABCD$ ont la même longueur, alors c’est un carré » ; elle est fausse', '« Si les diagonales de $ABCD$ ont la même longueur, alors c’est un carré » ; elle est vraie', '« Si $ABCD$ n’est pas un carré, ses diagonales ont des longueurs différentes » ; elle est vraie', '« Si $ABCD$ est un carré, ses diagonales sont perpendiculaires » ; elle est vraie'], T`La réciproque échange hypothèse et conclusion. Elle est fausse : un rectangle non carré a des diagonales de même longueur.`, 'Réciproque : on échange les deux parties. Pense au rectangle.'),
    () => K.choice(T`Quelle est la <b>négation</b> de « Tous les dragons crachent du feu » ?`, ['Au moins un dragon ne crache pas de feu', 'Aucun dragon ne crache de feu', 'Tous les dragons ne crachent pas de feu', 'Certains dragons crachent du feu'], T`La négation de « pour tout $x$, $P(x)$ » est « il existe $x$ tel que non $P(x)$ ». Un seul dragon froid suffit à rendre l’affirmation fausse.`, 'Que faut-il trouver pour démentir « tous » ?'),
    () => K.choice(T`Quelle est la négation de « $x\geqslant 2$ et $y<5$ » ?`, ['$x<2$ ou $y\\geqslant5$', '$x<2$ et $y\\geqslant5$', '$x\\leqslant2$ ou $y>5$', '$x>2$ et $y<5$'], T`Non (P et Q) = (non P) ou (non Q). Et la négation de $x\geqslant2$ est $x<2$ (pas $x\leqslant2$).`, 'Lois de De Morgan : la négation d’un « et » est un « ou ».'),
  ];
  const LOG3 = [
    () => K.choice(T`Laquelle de ces phrases est <b>vraie</b> ?`, ['Pour tout réel $x$, il existe un réel $y$ tel que $y>x$', 'Il existe un réel $y$ tel que, pour tout réel $x$, $y>x$', 'Il existe un réel $y$ tel que, pour tout réel $x$, $y\\geqslant x$', 'Pour tout réel $x$, $x^2 > 0$'], T`La première : pour chaque $x$, $y=x+1$ convient ($y$ dépend de $x$). Les deux suivantes affirment l’existence d’un plus grand réel : faux. La dernière est fausse pour $x=0$. <b>L’ordre des quantificateurs change le sens.</b>`, 'Dans « ∀x ∃y », y peut dépendre de x. Dans « ∃y ∀x », non.'),
    () => K.choice(T`Quelle est la négation de « Pour tout $\varepsilon>0$, il existe $n$ tel que $\frac1n<\varepsilon$ » ?`, ['Il existe $\\varepsilon>0$ tel que, pour tout $n$, $\\frac1n\\geqslant\\varepsilon$', 'Pour tout $\\varepsilon>0$, pour tout $n$, $\\frac1n\\geqslant\\varepsilon$', 'Il existe $\\varepsilon\\leqslant0$ tel que, pour tout $n$, $\\frac1n\\geqslant\\varepsilon$', 'Il existe $\\varepsilon>0$ et il existe $n$ tels que $\\frac1n\\geqslant\\varepsilon$'], T`On échange chaque « pour tout » et « il existe », et on nie la propriété finale ; la condition $\varepsilon>0$ fait partie du quantificateur et ne se nie pas. (La phrase de départ est vraie : c’est le fait que $\frac1n$ tend vers $0$, et elle annonce l’analyse de terminale.)`, 'Négation : ∀ devient ∃, ∃ devient ∀, et on nie la fin.'),
    () => K.choice(T`Pour démontrer « $\sqrt2$ est irrationnel » par l’absurde, on commence par supposer…`, ['$\\sqrt2=\\frac pq$ avec $p,q$ entiers et la fraction irréductible', '$\\sqrt2$ est irrationnel', '$\\sqrt2 = 1{,}414$', '$\\sqrt2$ n’est pas un nombre réel'], T`On suppose le contraire : $\sqrt2=\frac pq$ irréductible. Alors $p^2=2q^2$ est pair, donc $p$ pair, $p=2k$, d’où $q^2=2k^2$ et $q$ pair : la fraction n’était pas irréductible. Contradiction.`, 'L’absurde : supposer le contraire de ce qu’on veut prouver.'),
    () => K.choice(T`On veut montrer : « si $n^2$ est pair, alors $n$ est pair ». La méthode la plus simple est…`, ['de démontrer la contraposée : si $n$ est impair, alors $n^2$ est impair', 'de vérifier pour $n = 2, 4, 6$', 'de démontrer la réciproque : si $n$ est pair, $n^2$ est pair', 'de trouver un contre-exemple'], T`Contraposée : $n=2k+1 \Rightarrow n^2=4k^2+4k+1=2(2k^2+2k)+1$ impair. Elle est équivalente à l’énoncé. La réciproque est vraie aussi, mais ne prouve pas l’énoncé.`, 'Partir de « n² pair » est difficile. Et si l’on partait de « n impair » ?'),
  ];
  CU.addSkill({
    id: 'l1',
    region: 'log',
    name: 'La salle des miroirs',
    place: 'La Salle des Miroirs',
    glyph: '⇔',
    x: 230,
    y: 820,
    req: [],
    flavor: 'Chaque miroir renvoie une phrase inversée. Certaines disent encore vrai. D’autres mentent.',
    law: T`« $P\Rightarrow Q$ » est faux seulement quand $P$ est vrai et $Q$ faux. Sa contraposée « non $Q\Rightarrow$ non $P$ » lui est équivalente ; sa réciproque « $Q\Rightarrow P$ » ne l’est pas.`,
    lessons: [
      T`<p>Une <b>implication</b> « si $P$, alors $Q$ » est fausse dans un seul cas : $P$ vrai et $Q$ faux. Un <b>contre-exemple</b> est donc un cas où l’hypothèse est vraie et la conclusion fausse.</p>`,
      T`<p>À partir de « $P\Rightarrow Q$ » :</p><ul><li><b>réciproque</b> : $Q\Rightarrow P$ (peut être fausse !) ;</li><li><b>contraposée</b> : non $Q\Rightarrow$ non $P$ (toujours équivalente) ;</li><li><b>négation</b> : $P$ et non $Q$.</li></ul>
<p>Négations : non(« pour tout ») = « il existe… tel que non » ; non($P$ et $Q$) = non $P$ ou non $Q$.</p>`,
      T`<p>Les <b>quantificateurs</b> : $\forall$ (pour tout), $\exists$ (il existe). Leur ordre compte : « $\forall x\,\exists y$ » laisse $y$ dépendre de $x$, pas « $\exists y\,\forall x$ ».</p>
<p>Trois grandes méthodes : la preuve directe, la <b>contraposée</b>, le <b>raisonnement par l’absurde</b>.</p>`,
    ],
    gen: [() => R.pick(LOG1)(), () => R.pick(LOG2)(), () => R.pick(LOG3)()],
  });

  /* ---------- L2 Chevaliers et fripons ---------- */
  const NAMES = ['Aldric', 'Bérénice', 'Cassian', 'Dagmar'];
  function knights(n) {
    for (let tries = 0; tries < 2000; tries++) {
      const st = [];
      for (let s = 0; s < n; s++) {
        const others = [...Array(n).keys()].filter((i) => i !== s);
        const t = R.pick(others);
        const pool = [
          { txt: `${NAMES[t]} est un fripon.`, f: (k) => !k[t] },
          { txt: `${NAMES[t]} est un chevalier.`, f: (k) => k[t] },
          { txt: `${NAMES[t]} et moi sommes de même nature.`, f: (k) => k[t] === k[s] },
          { txt: `${NAMES[t]} et moi sommes de natures différentes.`, f: (k) => k[t] !== k[s] },
          { txt: `Nous sommes tous des fripons.`, f: (k) => k.every((x) => !x) },
          { txt: `Au moins l’un d’entre nous est un fripon.`, f: (k) => k.some((x) => !x) },
          { txt: `Il y a exactement un chevalier parmi nous.`, f: (k) => k.filter(Boolean).length === 1 },
          { txt: `${NAMES[t]} et moi sommes tous deux des fripons.`, f: (k) => !k[t] && !k[s] },
          { txt: `L’un de nous deux, ${NAMES[t]} ou moi, est un chevalier.`, f: (k) => k[t] || k[s] },
        ];
        if (n >= 3) {
          const u = R.pick(others.filter((i) => i !== t));
          pool.push({ txt: `${NAMES[t]} et ${NAMES[u]} sont de même nature.`, f: (k) => k[t] === k[u] });
          pool.push({ txt: `Il y a exactement deux chevaliers parmi nous.`, f: (k) => k.filter(Boolean).length === 2 });
          pool.push({ txt: `Si ${NAMES[t]} est un chevalier, alors ${NAMES[u]} aussi.`, f: (k) => !k[t] || k[u] });
        }
        st.push(R.pick(pool));
      }
      const sols = [];
      for (let m = 0; m < 1 << n; m++) {
        const k = [...Array(n).keys()].map((i) => !!(m & (1 << i)));
        if (st.every((s, i) => s.f(k) === k[i])) sols.push(k);
      }
      if (sols.length !== 1) continue;
      const k = sols[0];
      if (n === 2 && tries < 300 && k.every(Boolean)) continue;
      return {
        type: 'toggle',
        q: T`Sur l’île des Masques vivent des <b>chevaliers</b>, qui disent toujours la vérité, et des <b>fripons</b>, qui mentent toujours. Tu croises ${n === 2 ? 'deux habitants' : n + ' habitants'}. Qui est quoi ?`,
        people: st.map((s, i) => ({ name: NAMES[i], says: s.txt })),
        answer: k,
        check: (a) => (a.every((x, i) => x === k[i]) ? { ok: true } : { ok: false, msg: 'Cette répartition mène à une contradiction : vérifie chaque phrase.' }),
        sol:
          'L’unique répartition cohérente : ' +
          k.map((x, i) => `<b>${NAMES[i]}</b> est ${x ? 'chevalier' : 'fripon'}`).join(', ') +
          '. Vérification : ' +
          st.map((s, i) => `${NAMES[i]} dit « ${s.txt} », ce qui est ${s.f(k) ? 'vrai' : 'faux'} — cohérent avec un ${k[i] ? 'chevalier' : 'fripon'}`).join(' ; ') +
          '. Toutes les autres répartitions mènent à une contradiction.',
        hint: 'Fais une hypothèse (« ' + NAMES[0] + ' est un chevalier ») et déduis-en tout ce que tu peux. Si tu arrives à une contradiction, l’hypothèse était fausse.',
      };
    }
  }
  CU.addSkill({
    id: 'l2',
    region: 'log',
    name: 'L’île des masques',
    place: 'L’Île des Masques',
    glyph: '☍',
    x: 520,
    y: 580,
    req: ['l1'],
    flavor: 'Chevaliers ou fripons : tous portent le même masque. Seule la logique les distingue.',
    law: T`Un chevalier dit toujours vrai, un fripon toujours faux. Une répartition est cohérente si chaque phrase est vraie exactement quand celui qui la prononce est chevalier.`,
    lessons: [
      T`<p>Méthode : <b>faire une hypothèse</b> et en tirer les conséquences. Si elle mène à une contradiction, elle est fausse — c’est un raisonnement par l’absurde.</p>
<p class="ex">A dit : « B est un fripon. » B dit : « A et moi sommes de même nature. » Si B est chevalier, A et B sont chevaliers ; mais alors A dit vrai et B est fripon : contradiction. Donc B est fripon, sa phrase est fausse, A et B sont de natures différentes : A est chevalier, et sa phrase est bien vraie.</p>`,
      T`<p>Avec trois habitants, il y a $2^3=8$ répartitions possibles. Plutôt que de toutes les essayer, cherche la phrase la plus contraignante. Par exemple, personne ne peut dire « je suis un fripon » (un chevalier mentirait, un fripon dirait vrai).</p>`,
      T`<p>« Si $P$ alors $Q$ » prononcé par un fripon est faux : cela signifie que $P$ est vrai et $Q$ faux. C’est l’une des rares façons d’obtenir beaucoup d’information d’un menteur !</p>`,
    ],
    gen: [() => knights(2), () => knights(3), () => knights(R.pick([3, 4]))],
  });

  /* ---------- L3 Le dédale des invariants ---------- */
  function boardSvg(n, holes) {
    const s = 24;
    let out = `<svg class="board" viewBox="0 0 ${n * s} ${n * s}" width="${Math.min(260, n * s * 1.4)}">`;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const h = holes.some(([a, b]) => a === i && b === j);
        out += `<rect x="${j * s}" y="${i * s}" width="${s}" height="${s}" class="${h ? 'hole' : (i + j) % 2 ? 'dk' : 'lt'}"/>`;
        if (h) out += `<path d="M${j * s + 5} ${i * s + 5}l${s - 10} ${s - 10}M${j * s + s - 5} ${i * s + 5}l${-(s - 10)} ${s - 10}" class="x"/>`;
      }
    return out + '</svg>';
  }
  CU.addSkill({
    id: 'l3',
    region: 'log',
    name: 'Le dédale des invariants',
    place: 'Le Dédale',
    glyph: '⌘',
    x: 760,
    y: 330,
    req: ['l1', 'v3'],
    flavor: 'Le Dédale se moque de ceux qui essaient tous les chemins. Il cède à ceux qui trouvent ce qui ne change jamais.',
    law: T`Un <b>invariant</b> est une quantité que les mouvements autorisés ne changent pas. Si elle diffère entre le départ et l’arrivée, l’arrivée est inaccessible — sans avoir à essayer un seul chemin.`,
    lessons: [
      T`<p>Pour prouver qu’une position est <b>inaccessible</b>, inutile d’essayer tous les chemins (il y en a une infinité). On cherche un <b>invariant</b> : une propriété conservée par chaque mouvement, vraie au départ et fausse à l’arrivée.</p>
<p class="ex">Un pion qui saute de $(\pm1;\pm1)$ change $x$ de 1 et $y$ de 1 : $x+y$ change de $-2$, $0$ ou $+2$. La parité de $x+y$ ne change jamais : depuis $(0;0)$, impossible d’atteindre $(3;4)$.</p>`,
      T`<p>Sur une droite, avec des pas de $\pm a$ et $\pm b$, la position reste toujours un multiple de $d=\mathrm{pgcd}(a,b)$. Réciproquement, on peut atteindre <b>tous</b> les multiples de $d$ : c’est le théorème de Bézout (terminale, maths expertes).</p>
<p class="ex">Pas de $6$ et de $10$ : on n’atteint que des nombres pairs, mais on les atteint tous ($2 = 2\times6-10$).</p>`,
      T`<p><b>Coloriages</b> : sur un échiquier, chaque domino couvre une case blanche et une case noire. Si l’on retire deux cases de même couleur, il reste plus de cases d’une couleur que de l’autre : aucun pavage n’est possible.</p>
<p>Si l’on retire deux cases de couleurs <b>différentes</b>, un pavage existe toujours (théorème de Gomory) : on parcourt l’échiquier par un chemin fermé qui passe une fois par chaque case, et les deux trous le coupent en deux morceaux de longueur paire.</p>
<p><b>Réseau</b> : avec des sauts $\pm\vec u$, $\pm\vec v$, on atteint exactement les points $a\vec u+b\vec v$ avec $a,b$ <b>entiers</b>.</p>`,
    ],
    gen: [
      () => {
        const moves = R.pick([[[1, 1], [1, -1]], [[2, 0], [1, 1]], [[1, 1], [0, 2]], [[3, 1], [1, -1]]]);
        let tx, ty, ok;
        do {
          tx = R.int(-7, 7);
          ty = R.int(-7, 7);
        } while (tx === 0 && ty === 0);
        ok = (tx + ty) % 2 === 0;
        // vérifie que le réseau engendré est bien {x + y pair}
        const mv = moves.map((m) => `$(\\pm${m[0]}\\,;\\,\\pm${m[1]})$`.replace('\\pm0', '0'));
        const ch = ok ? ['Oui', 'Non, car $x+y$ reste toujours pair', 'Non, car $x$ reste toujours pair', 'Non, il faudrait une infinité de sauts'] : ['Non, car $x+y$ reste toujours pair', 'Oui', 'Non, car $x$ reste toujours pair', 'Non, car $y$ reste toujours impair'];
        return K.choice(
          T`Un spectre part de $(0\,;\,0)$. Il saute de ${mv.join(' ou de ')} (chaque signe au choix). Peut-il atteindre $(${tx}\,;\,${ty})$ ?`,
          ch,
          T`Chaque saut change $x+y$ d’un nombre pair : $x+y$ reste pair. ${ok ? T`Ici $${tx}+${N.p(ty)}=${tx + ty}$ est pair, et l’on vérifie que ces sauts permettent d’atteindre tous les points où $x+y$ est pair : la cible est accessible.` : T`Or $${tx}+${N.p(ty)}=${tx + ty}$ est impair : la cible est inaccessible, quel que soit le chemin.`}`,
          'Regarde comment chaque saut modifie x + y.',
          { keep: false },
        );
      },
      () => {
        const [a, b] = R.pick([[6, 10], [4, 6], [6, 9], [10, 15], [12, 18], [8, 12], [9, 15], [5, 7], [4, 9], [14, 21]]);
        const d = CU.gcd(a, b);
        let t;
        do t = R.int(-40, 60);
        while (t === 0);
        const ok = t % d === 0;
        const ch = ok
          ? ['Oui', T`Non, car la position reste un multiple de $${d}$`, T`Non, car la position reste un multiple de $${a}$`, 'Non, car il faudrait des sauts non entiers']
          : [T`Non, car la position reste un multiple de $${d}$`, 'Oui', T`Non, car la position reste un multiple de $${a}$`, 'Non, car elle reste paire'];
        return K.choice(
          T`Sur le pont du Dédale, on avance ou recule par pas de $${a}$ ou de $${b}$ (autant de fois qu’on veut). Partant de $0$, peut-on atteindre la case $${t}$ ?`,
          d === 1 && !ok ? ch : ch,
          T`Toute position est de la forme $${a}m+${b}n$ ($m,n$ entiers relatifs), donc un multiple de $\mathrm{pgcd}(${a},${b})=${d}$. Réciproquement, on peut écrire $${d}$ ${(() => {
            for (let m = -20; m <= 20; m++) for (let n = -20; n <= 20; n++) if (a * m + b * n === d) return T`$= ${a}\times${N.p(m)} + ${b}\times${N.p(n)}$`;
            return '';
          })()}, donc atteindre tous ses multiples. ${ok ? T`$${t}$ est un multiple de $${d}$ : accessible.` : T`$${t}$ n’est pas un multiple de $${d}$ : inaccessible.`}`,
          'Quels nombres peut-on écrire sous la forme ' + a + 'm + ' + b + 'n ?',
        );
      },
      CU.oneOf(
        () => {
          const n = R.pick([4, 6, 8]);
          const same = Math.random() < 0.55;
          let h1, h2;
          do {
            h1 = [R.int(0, n - 1), R.int(0, n - 1)];
            h2 = [R.int(0, n - 1), R.int(0, n - 1)];
          } while ((h1[0] === h2[0] && h1[1] === h2[1]) || ((h1[0] + h1[1]) % 2 === (h2[0] + h2[1]) % 2) !== same);
          const ch = same
            ? ['Impossible : les deux cases retirées sont de la même couleur', 'Possible', T`Impossible : $${n * n - 2}$ n’est pas un multiple de $4$`, 'Impossible : un trou est sur le bord']
            : ['Possible', 'Impossible : les deux cases retirées sont de la même couleur', T`Impossible : $${n * n - 2}$ n’est pas un multiple de $4$`, 'Impossible : les trous ne sont pas voisins'];
          return K.choice(
            T`On retire les deux cases barrées de ce plateau $${n}\times${n}$. Peut-on recouvrir exactement les $${n * n - 2}$ cases restantes avec $${(n * n - 2) / 2}$ dominos $1\times2$ ?` + boardSvg(n, [h1, h2]),
            ch,
            same
              ? T`Chaque domino couvre une case claire et une sombre. Les deux cases retirées sont de même couleur : il reste $${(n * n) / 2 - 2}$ cases d’une couleur et $${(n * n) / 2}$ de l’autre. Impossible.`
              : T`Les deux cases retirées sont de couleurs différentes. Le théorème de Gomory assure qu’un pavage existe toujours : on parcourt le plateau par un chemin fermé passant une fois par chaque case ; les deux trous le coupent en deux tronçons de longueur paire, que l’on découpe en dominos.`,
            'Chaque domino couvre exactement une case claire et une case sombre.',
          );
        },
        () => {
          for (;;) {
            const u = [R.int(-3, 3), R.int(-3, 3)],
              v = [R.int(-3, 3), R.int(-3, 3)];
            const det = u[0] * v[1] - u[1] * v[0];
            if (Math.abs(det) < 2 || Math.abs(det) > 6) continue;
            const w = [R.int(-8, 8), R.int(-8, 8)];
            const a = (w[0] * v[1] - w[1] * v[0]) / det,
              b = (u[0] * w[1] - u[1] * w[0]) / det;
            const ok = Number.isInteger(a) && Number.isInteger(b);
            if (!ok && Math.random() < 0.15) continue;
            return K.choice(
              T`Un spectre ne sait faire que les sauts $\pm\vec u$ et $\pm\vec v$, avec $\vec u${N.col(...u)}$ et $\vec v${N.col(...v)}$. Partant de $O$, peut-il atteindre le point $(${w[0]}\,;\,${w[1]})$ ?`,
              ok ? ['Oui', 'Non', 'Seulement en un nombre infini de sauts', 'On ne peut pas savoir'] : ['Non', 'Oui', 'Seulement en un nombre infini de sauts', 'On ne peut pas savoir'],
              T`Les points atteints sont les $a\vec u+b\vec v$ avec $a,b$ entiers. Comme $\det(\vec u,\vec v)=${det}\neq0$, $(${w[0]};${w[1]})$ s’écrit de façon unique $a\vec u+b\vec v$ avec $a=${num(a)}$, $b=${num(b)}$. ${ok ? 'Ce sont des entiers : accessible.' : 'Ce ne sont pas tous deux des entiers : inaccessible.'}`,
              'Décompose le point cible sur u et v (comme à la Forge des Rafales). Les coefficients sont-ils entiers ?',
              { keep: true },
            );
          }
        },
      ),
    ],
  });
})();
