// Original recreational puzzles. No standardized items, timing, IQ score or normative ranking.
const rotate = (m) => {
  let out = 0;
  for (let i = 0; i < 9; i++) if (m & (1 << i)) out |= 1 << ((i % 3) * 3 + 2 - Math.floor(i / 3));
  return out;
};
export const rotateMotif = rotate;
const shuffle = (arr, seed) => {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};
export const LOGIC_LEVELS = [];
for (let tier = 0; tier < 6; tier++)
  for (let index = 0; index < 6; index++) {
    const motif = [11, 75, 147, 39, 263, 23][index];
    let l = { id: `x-logic-${tier}-${index}`, type: 'logic', tier, index };
    if (tier === 0) {
      const a = 1 + index,
        b = index < 3 ? 4 + index : index - 2;
      Object.assign(l, {
        kind: 'alternation',
        cells: [a, b, a, b, a, null],
        answer: b,
        options: shuffle([a, b, 7, 8], index + 19),
        explanation:
          'Les deux symboles alternent : le premier, le deuxième, puis à nouveau le premier et le deuxième.',
      });
    }
    if (tier === 1) {
      const first = rotate(motif),
        second = rotate(first),
        answer = rotate(second);
      Object.assign(l, {
        kind: 'rotation',
        cells: [motif, first, second, null],
        answer,
        options: shuffle([motif, first, second, answer], index + 57),
        explanation:
          'Le même dessin tourne d’un quart de tour dans le sens des aiguilles d’une montre à chaque étape.',
      });
    }
    if (tier === 2 || tier === 3) {
      // The last two variants use new component motifs, not a repeated rotation.
      const parts =
        tier === 2
          ? index < 4
            ? [3, 72, 5, 192, 17, 288]
            : index === 4
              ? [19, 132, 40, 258, 65, 144]
              : [7, 72, 56, 258, 73, 36]
          : index < 4
            ? [3, 10, 5, 36, 17, 48]
            : index === 4
              ? [19, 22, 73, 88, 145, 400]
              : [11, 26, 38, 50, 164, 176];
      const [a, b, c, d, e, f] = parts;
      const combine = tier === 2 ? (x, y) => x | y : (x, y) => x ^ y;
      const answer = combine(e, f);
      Object.assign(l, {
        kind: 'matrix',
        cells: [a, b, combine(a, b), c, d, combine(c, d), e, f, null],
        answer,
        options: shuffle([answer, e, f, tier === 2 ? e ^ 1 : e | f], index + 93),
        explanation:
          tier === 2
            ? 'Dans chaque ligne, la troisième case réunit les points des deux premières. Aucun point ne disparaît.'
            : 'Dans chaque ligne, on superpose les deux premières cases. Les points présents dans les deux dessins disparaissent ; les autres restent.',
      });
      // Rotate the entire point system to vary placement while preserving the relation.
      for (let r = 0; r < index % 4; r++) {
        l.cells = l.cells.map((x) => (x === null ? null : rotate(x)));
        l.answer = rotate(l.answer);
        l.options = l.options.map(rotate);
      }
    }
    if (tier === 4) {
      const a = motif,
        b = rotate(a),
        c = rotate(b);
      Object.assign(l, {
        kind: 'matrix',
        cells: [a, b, c, b, c, rotate(c), c, rotate(c), null],
        answer: a,
        options: shuffle([a, b, c, rotate(c)], index + 149),
        explanation:
          'Vers la droite comme vers le bas, le dessin tourne d’un quart de tour. Après quatre quarts de tour, il retrouve sa position de départ.',
      });
    }
    if (tier === 5) {
      const star = 2 + index,
        circle = 3 + index;
      Object.assign(l, {
        kind: 'balance',
        star,
        circle,
        equations: [`★ + ★ = ${star * 2}`, `★ + ● = ${star + circle}`],
        answer: circle,
        options: shuffle([circle, star, star + circle, circle + 2], index + 201),
        explanation: `Deux étoiles valent ${star * 2}, donc une étoile vaut ${star}. Dans la deuxième égalité, il reste ${star + circle} − ${star} = ${circle} pour le rond.`,
      });
    }
    l.options = [...new Set(l.options)];
    LOGIC_LEVELS.push(l);
  }
export function motifHTML(mask) {
  return `<span class="motif" role="img" aria-label="Motif : points aux positions ${Array.from(
    { length: 9 },
    (_, i) => (mask & (1 << i) ? i + 1 : null),
  )
    .filter(Boolean)
    .join(
      ', ',
    )}">${Array.from({ length: 9 }, (_, i) => `<i class="${mask & (1 << i) ? 'on' : ''}"></i>`).join('')}</span>`;
}
export function logicSymbol(n) {
  return ['', '○', '△', '□', '◇', '☆', '＋', '⌁', '✦'][n];
}
export function logicFace(l, n) {
  if (n === null) return '<span class="missing-piece">?</span>';
  if (l.kind === 'alternation') return `<span class="logic-symbol">${logicSymbol(n)}</span>`;
  if (l.kind === 'balance') return `<span class="logic-symbol">${n}</span>`;
  return motifHTML(n);
}
export function logicHTML(l) {
  return l.kind === 'balance'
    ? `<div class="balance-equations">${l.equations.map((e) => `<p>${e}</p>`).join('')}<p>● = ?</p></div>`
    : `<div class="${l.kind === 'matrix' ? 'pattern-matrix' : 'pattern-sequence'}">${l.cells.map((n) => `<span>${logicFace(l, n)}</span>`).join('')}</div>`;
}
