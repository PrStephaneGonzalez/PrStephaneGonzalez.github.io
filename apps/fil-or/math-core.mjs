// Deterministic tasks and minimal observations: no typed answers are stored.
export const MATH_BLOCKS = [
  {
    id: 'line',
    label: 'La carte des nombres',
    subtitle: 'Placer, lire et comparer sur une droite',
    tiers: [
      'Entiers de 0 à 100',
      'Entiers de 0 à 1 000',
      'Entiers de 0 à 10 000',
      'Décimaux de 0 à 1 et de 0 à 10',
      'Fractions de 0 à 1 et de 0 à 2',
      'Fractions et décimaux',
    ],
  },
  {
    id: 'facts',
    label: 'Les étincelles de calcul',
    subtitle: 'Retrouver des faits et des stratégies',
    tiers: [
      'Compléments à 10, doubles',
      'Compléments à 100, moitiés',
      'Tables de 2, 5 et 10',
      'Tables de 3, 4 et 6',
      'Tables de 7, 8 et 9',
      'Divisions associées et calculs mêlés',
    ],
  },
  {
    id: 'place',
    label: 'L’atelier des échanges',
    subtitle: 'Construire, échanger et écrire les nombres',
    tiers: [
      'Dizaines et unités',
      'Centaines et zéros',
      'Milliers et nombres particuliers',
      'Grands nombres et zéros intermédiaires',
      'Dixièmes et centièmes',
      'Millièmes et nombres décimaux',
    ],
  },
  {
    id: 'bars',
    label: 'Les énigmes en barres',
    subtitle: 'Représenter une histoire avant de calculer',
    tiers: [
      'Parties et tout',
      'Comparaison',
      'Parts égales et partage',
      'Problèmes en deux étapes',
      'Choisir les données utiles',
      'Trouver la question et résoudre',
    ],
  },
];
export const blockById = (id) => MATH_BLOCKS.find((b) => b.id === id);
const idOK = (x) => typeof x === 'string' && /^[\w-]{1,120}$/.test(x);
const dayOK = (x) => /^\d{4}-\d{2}-\d{2}$/.test(x);
export const clampTier = (x) => (Number.isInteger(x) ? Math.max(0, Math.min(5, x)) : 2);
export function restoreMath(raw) {
  const out = { version: 1, events: [], sessions: {}, strategies: [] };
  if (!raw || raw.version !== 1) return out;
  out.strategies = [
    ...new Set((Array.isArray(raw.strategies) ? raw.strategies : []).filter(idOK)),
  ].slice(0, 400);
  out.events = (Array.isArray(raw.events) ? raw.events : [])
    .filter(
      (e) =>
        e &&
        idOK(e.id) &&
        idOK(e.session) &&
        blockById(e.block) &&
        dayOK(e.day) &&
        Number.isInteger(e.slot) &&
        e.slot >= 0 &&
        e.slot < 6 &&
        Number.isInteger(e.tier) &&
        e.tier >= 0 &&
        e.tier < 6 &&
        idOK(e.target),
    )
    .slice(-2000)
    .map((e) => ({
      id: e.id,
      session: e.session,
      slot: e.slot,
      day: e.day,
      at: Number.isFinite(e.at) ? e.at : Date.parse(e.day + 'T12:00:00Z'),
      block: e.block,
      tier: e.tier,
      target: e.target,
      kind: [
        'position',
        'read',
        'compare',
        'fact',
        'transcode',
        'exchange',
        'reverse',
        'part-whole',
        'comparison',
        'equal',
        'two-step',
        'irrelevant',
        'question',
      ].includes(e.kind)
        ? e.kind
        : 'fact',
      correct: e.correct === true,
      assisted: e.assisted === true,
      duration:
        Number.isFinite(e.duration) && e.duration >= 0 && e.duration <= 3600000
          ? Math.round(e.duration)
          : null,
      fast: e.fast === true,
      error: Number.isFinite(e.error) && e.error >= 0 && e.error <= 100 ? e.error : null,
      schema: typeof e.schema === 'boolean' ? e.schema : null,
      calc: typeof e.calc === 'boolean' ? e.calc : null,
    }));
  for (const [id, s] of Object.entries(raw.sessions || {}).slice(-120))
    if (idOK(id) && s && blockById(s.block))
      out.sessions[id] = {
        block: s.block,
        tier: clampTier(s.tier),
        schemas: Object.fromEntries(
          Object.entries(s.schemas || {}).filter(
            ([i, v]) => /^[0-5]$/.test(i) && typeof v === 'boolean',
          ),
        ),
        helped: (Array.isArray(s.helped) ? s.helped : []).filter(
          (i) => Number.isInteger(i) && i >= 0 && i < 6,
        ),
        seen: [
          ...new Set(
            (Array.isArray(s.seen) ? s.seen : []).filter(
              (i) => Number.isInteger(i) && i >= 0 && i < 6,
            ),
          ),
        ],
      };
  return out;
}
export function mergeMath(a, b) {
  const x = restoreMath(a),
    y = restoreMath(b),
    sessions = { ...x.sessions, ...y.sessions };
  for (const id of Object.keys(y.sessions))
    if (x.sessions[id])
      sessions[id] = {
        ...y.sessions[id],
        schemas: { ...x.sessions[id].schemas, ...y.sessions[id].schemas },
        seen: [...new Set([...x.sessions[id].seen, ...y.sessions[id].seen])],
        helped: [...new Set([...(x.sessions[id].helped || []), ...(y.sessions[id].helped || [])])],
      };
  // A synced response to the same question is one observation, never two successes.
  const bySlot = new Map();
  for (const e of [...x.events, ...y.events].sort(
    (a, b) => a.at - b.at || a.id.localeCompare(b.id),
  )) {
    const key = e.session + ':' + e.slot,
      old = bySlot.get(key);
    bySlot.set(
      key,
      old && old.id !== e.id
        ? {
            ...e,
            correct: old.correct && e.correct,
            assisted: old.assisted || e.assisted,
            duration: null,
            fast: false,
            schema:
              old.schema === null
                ? e.schema
                : e.schema === null
                  ? old.schema
                  : old.schema && e.schema,
            calc: old.calc === null ? e.calc : e.calc === null ? old.calc : old.calc && e.calc,
          }
        : e,
    );
  }
  return restoreMath({
    version: 1,
    events: [...bySlot.values()],
    strategies: [...x.strategies, ...y.strategies],
    sessions,
  });
}
export function hashSeed(value) {
  let n = 2166136261;
  for (const c of String(value)) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  return n >>> 0;
}
export const formatNumber = (n) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(n);
export function parseNumber(value) {
  const s = String(value)
    .trim()
    .replace(/[\s\u202f\u00a0]/g, '')
    .replace(',', '.');
  if (/^-?\d+\/\d+$/.test(s)) {
    const [a, b] = s.split('/').map(Number);
    return b ? a / b : NaN;
  }
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : NaN;
}
const units = [
  'zéro',
  'un',
  'deux',
  'trois',
  'quatre',
  'cinq',
  'six',
  'sept',
  'huit',
  'neuf',
  'dix',
  'onze',
  'douze',
  'treize',
  'quatorze',
  'quinze',
  'seize',
];
export function numberWords(n) {
  if (n < 17) return units[n];
  if (n < 20) return 'dix-' + units[n - 10];
  if (n < 70) {
    const t = Math.floor(n / 10),
      u = n % 10;
    return (
      ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'][t] +
      (u === 1 ? ' et un' : u ? '-' + units[u] : '')
    );
  }
  if (n < 80) return 'soixante' + (n === 71 ? ' et ' : '-') + numberWords(n - 60);
  if (n < 100) return 'quatre-vingt' + (n === 80 ? 's' : '-' + numberWords(n - 80));
  if (n < 1000) {
    const h = Math.floor(n / 100),
      r = n % 100;
    return (
      (h === 1 ? 'cent' : units[h] + ' cent' + (!r ? 's' : '')) + (r ? ' ' + numberWords(r) : '')
    );
  }
  if (n < 1000000) {
    const h = Math.floor(n / 1000),
      r = n % 1000;
    return (
      (h === 1
        ? 'mille'
        : numberWords(h)
            .replace(/vingts$/, 'vingt')
            .replace(/cents$/, 'cent') + ' mille') + (r ? ' ' + numberWords(r) : '')
    );
  }
  const h = Math.floor(n / 1000000),
    r = n % 1000000;
  return numberWords(h) + ' million' + (h > 1 ? 's' : '') + (r ? ' ' + numberWords(r) : '');
}
function decimalWords(n, tier) {
  const denom = tier === 5 ? 1000 : 100;
  const whole = Math.floor(n);
  const part = Math.round((n - whole) * denom);
  return (
    numberWords(whole) +
    ' unité' +
    (whole > 1 ? 's' : '') +
    (part
      ? ' et ' +
        numberWords(part) +
        ' ' +
        (denom === 1000 ? 'millième' : 'centième') +
        (part > 1 ? 's' : '')
      : '')
  );
}
export function factBank(tier) {
  const out = [],
    add = (id, prompt, answer, strategy) => out.push({ id, prompt, answer, strategy });
  if (tier === 0) {
    for (let a = 0; a <= 10; a++) {
      add('c10-' + a, `${a} + ? = 10`, 10 - a, `Pour aller de ${a} à 10, cherche ce qui manque.`);
      add('double-' + a, `Le double de ${a}`, a * 2, `Le double, c’est ${a} + ${a}.`);
    }
  } else if (tier === 1)
    for (let a = 0; a <= 20; a++) {
      add(
        'c100-' + a * 5,
        `${a * 5} + ? = 100`,
        100 - a * 5,
        `100 − ${a * 5} donne le complément.`,
      );
      add(
        'half-' + a * 2,
        `La moitié de ${a * 2}`,
        a,
        `Cherche le nombre qui, ajouté à lui-même, donne ${a * 2}.`,
      );
    }
  else {
    const tables =
      tier === 2
        ? [2, 5, 10]
        : tier === 3
          ? [3, 4, 6]
          : tier === 4
            ? [7, 8, 9]
            : [2, 3, 4, 5, 6, 7, 8, 9, 10];
    for (const a of tables)
      for (let b = 2; b <= 10; b++) {
        const strategy =
          a === 9
            ? `9 × ${b} = 10 × ${b} − ${b}.`
            : a === 8
              ? `8 × ${b} : double ${b}, puis double encore, puis une dernière fois.`
              : a === 7
                ? `7 × ${b} = 5 × ${b} + 2 × ${b}.`
                : a === 6
                  ? `6 × ${b} = 5 × ${b} + ${b}.`
                  : `${a} × ${b} = ${a} × ${b - 1} + ${a}.`;
        add('mul-' + a + '-' + b, `${a} × ${b}`, a * b, strategy);
        if (tier === 5)
          add('div-' + a + '-' + b, `${a * b} ÷ ${a}`, b, `Cherche : ${a} × ? = ${a * b}.`);
      }
  }
  return out;
}
export function factStatus(math, id) {
  const es = math.events
    .filter((e) => e.block === 'facts' && e.target === id)
    .sort((a, b) => a.at - b.at);
  const failed = es.findLastIndex((e) => !e.correct || e.assisted || !e.fast);
  const good = es.slice(failed + 1).filter((e) => e.correct && !e.assisted && e.fast);
  const days = new Set(good.map((e) => e.day));
  const last = es.at(-1);
  const interval = [1, 2, 4, 7, 14][Math.min(4, Math.max(0, days.size - 1))];
  return {
    mastered: days.size >= 2,
    due: last
      ? new Date(
          Date.parse(last.day + 'T12:00:00Z') +
            (last.correct && !last.assisted && last.fast ? interval : 1) * 86400000,
        )
          .toISOString()
          .slice(0, 10)
      : '0000',
    last,
  };
}
export function chooseFact(math, tier, day, seed, session) {
  const seen = new Set(math.events.filter((e) => e.session === session).map((e) => e.target));
  const bank = factBank(tier);
  const candidates = bank.filter((f) => !seen.has(f.id));
  const rank = (f) => {
    const status = factStatus(math, f.id);
    return status.last
      ? status.due <= day
        ? !status.last.correct || !status.last.fast || status.last.assisted
          ? 0
          : 1
        : 3
      : 2;
  };
  return (candidates.length ? candidates : bank).sort(
    (a, b) => rank(a) - rank(b) || hashSeed(seed + a.id) - hashSeed(seed + b.id),
  )[0];
}
export function blockMastered(math, block, tier) {
  const es = math.events.filter((e) => e.block === block && e.tier === tier).slice(-12);
  const good = es.filter((e) => e.correct && !e.assisted && (block !== 'facts' || e.fast));
  return (
    es.length >= 10 && good.length / es.length >= 0.9 && new Set(good.map((e) => e.day)).size >= 2
  );
}
export function suggestedTier(math, block, start = 2) {
  const es = math.events.filter((e) => e.block === block);
  const last = es.at(-1);
  if (!last) return clampTier(start);
  const tier = last.tier;
  const recent = es.filter((e) => e.tier === tier).slice(-5);
  if (recent.length === 5 && recent.filter((e) => e.correct && !e.assisted).length <= 2)
    return Math.max(0, tier - 1);
  return blockMastered(math, block, tier) ? Math.min(5, tier + 1) : tier;
}
export function selectMathBlock(math, day) {
  const due = MATH_BLOCKS.map((b, i) => {
    const last = math.events.filter((e) => e.block === b.id).at(-1);
    return {
      ...b,
      i,
      due: last
        ? new Date(
            Date.parse(last.day + 'T12:00:00Z') +
              (last.correct && !last.assisted ? 4 : 1) * 86400000,
          )
            .toISOString()
            .slice(0, 10)
        : '0000',
      at: last?.at || 0,
    };
  });
  return due.sort((a, b) => a.due.localeCompare(b.due) || a.at - b.at || a.i - b.i)[0].id;
}
export function makeMathTask(block, tier, seed, slot = 0, fact = null) {
  const n = hashSeed(seed + ':' + slot),
    pick = (lo, hi) => lo + (n % (hi - lo + 1));
  const base = { block, tier, slot, id: `${block}-${tier}-${n}`, kind: 'fact' };
  if (block === 'facts') {
    const f = fact || factBank(tier)[n % factBank(tier).length];
    return { ...base, target: f.id, ...f, kind: 'fact' };
  }
  if (block === 'line') {
    const max = [100, 1000, 10000, slot % 2 ? 10 : 1, slot % 2 ? 2 : 1, 2][tier];
    const ratio =
      tier < 3
        ? pick(13, 87) / 100
        : tier === 3
          ? pick(1, 19) / 20
          : tier === 4
            ? pick(1, 7) / 8
            : pick(1, 15) / 16;
    const value = Math.round(max * ratio * 1000) / 1000;
    const denom = tier >= 4 ? (tier === 5 ? 8 : 4) : null;
    const fraction = denom ? `${Math.round(max * ratio * denom)}/${denom}` : null;
    const targetValue = denom ? Math.round(max * ratio * denom) / denom : value;
    if (tier === 5 && slot % 3 === 2) {
      const f = pick(1, 7),
        d = f / 8 + (n % 2 ? 0.125 : -0.125);
      const options = [`${f}/8`, formatNumber(d)];
      return {
        ...base,
        kind: 'compare',
        target: 'fraction-decimal',
        prompt: `Quel nombre est le plus grand : ${f}/8 ou ${formatNumber(d)} ?`,
        options,
        answerIndex: d > f / 8 ? 1 : 0,
        explanation: `${f}/8 = ${formatNumber(f / 8)}. ${d > f / 8 ? formatNumber(d) : `${f}/8`} est plus grand.`,
      };
    }
    return {
      ...base,
      kind: slot % 3 === 1 ? 'read' : 'position',
      target: tier < 3 ? 'integers-' + max : tier === 3 ? 'decimals-' + max : 'fractions-' + max,
      max,
      value: targetValue,
      label: fraction || formatNumber(value),
      prompt:
        slot % 3 === 1
          ? 'Quel nombre indique la luciole ?'
          : `Place ${fraction || formatNumber(value)} sur la droite.`,
      answer: targetValue,
    };
  }
  if (block === 'place') {
    const nums =
      tier === 0
        ? [17, 28, 36, 42, 59, 71]
        : tier === 1
          ? [208, 307, 406, 580, 709, 890]
          : tier === 2
            ? [1708, 4090, 7080, 9708, 8071, 6097]
            : tier === 3
              ? [970308, 4070008, 708090001, 19007000, 807001, 60097000]
              : tier === 4
                ? [3.07, 12.09, 40.08, 7.25, 90.71, 6.04]
                : [3.007, 12.009, 40.008, 7.205, 90.071, 6.004];
    const value = nums[n % nums.length],
      words = tier >= 4 ? decimalWords(value, tier) : numberWords(value);
    if (slot % 3 === 2) {
      const labels =
        tier === 0
          ? ['dizaines', 'unités']
          : tier === 2
            ? ['milliers', 'centaines', 'dizaines', 'unités']
            : tier === 3
              ? ['millions', 'centaines de milliers', 'dizaines de milliers']
              : tier >= 4
                ? ['unités', 'dixièmes', 'centièmes', ...(tier === 5 ? ['millièmes'] : [])]
                : ['centaines', 'dizaines', 'unités'];
      const counts = labels.map((_, i) =>
        i === labels.length - 1
          ? 10 + pick(1, 9)
          : i === labels.length - 2 && tier > 0
            ? 9
            : pick(1, 4),
      );
      const target = [...counts];
      for (let i = target.length - 1; i > 0; i--) {
        target[i - 1] += Math.floor(target[i] / 10);
        target[i] %= 10;
      }
      return {
        ...base,
        kind: 'exchange',
        target: 'exchange-' + (tier >= 4 ? 'decimal' : 'integer'),
        labels,
        counts,
        answerCounts: target,
        prompt:
          'Échange les paquets de dix pour obtenir moins de dix éléments dans chaque colonne.',
      };
    }
    if (slot % 3 === 1) {
      const alternatives = [
        value,
        value + (tier >= 4 ? 0.1 : 10),
        value + (tier >= 4 ? 0.01 : 100),
      ];
      const options = alternatives.map((v) =>
        tier >= 4 ? decimalWords(Math.round(v * 1000) / 1000, tier) : numberWords(v),
      );
      const shift = n % 3;
      return {
        ...base,
        kind: 'reverse',
        target: tier >= 4 ? 'decimal-read' : 'integer-read',
        prompt: `Comment lit-on ${formatNumber(value)} ?`,
        options: options.slice(shift).concat(options.slice(0, shift)),
        answerIndex: (3 - shift) % 3,
        explanation: `${formatNumber(value)} s’écrit « ${words} ».`,
      };
    }
    return {
      ...base,
      kind: 'transcode',
      target: tier >= 4 ? 'decimal-zeros' : 'integer-zeros',
      words,
      answer: value,
      prompt: 'Écris ce nombre en chiffres.',
      explanation: `${words} : ${formatNumber(value)}.`,
    };
  }
  return { ...base, ...makeBarProblem(tier, n), target: 'bars-' + tier };
}
function makeBarProblem(tier, n) {
  const a = 12 + (n % 17),
    b = 5 + (n % 7),
    groups = 3 + (n % 4);
  if (tier === 0)
    return {
      kind: 'part-whole',
      model: 'whole',
      story: `Lina range ${a} plumes bleues et ${b} plumes dorées. Combien de plumes range-t-elle en tout ?`,
      cards: [String(a), String(b), '?'],
      slots: ['Partie bleue', 'Partie dorée', 'Tout'],
      answer: a + b,
      explanation: `Les deux parties composent le tout : ${a} + ${b} = ${a + b}.`,
    };
  if (tier === 1)
    return {
      kind: 'comparison',
      model: 'compare',
      story: `Lina possède ${a + b} pierres. Malo en possède ${a}. Combien de pierres Lina a-t-elle de plus que Malo ?`,
      cards: [String(a + b), String(a), '?'],
      slots: ['Lina', 'Malo', 'Écart'],
      answer: b,
      explanation: `L’écart est ${a + b} − ${a} = ${b}.`,
    };
  if (tier === 2) {
    if (n % 2)
      return {
        kind: 'equal',
        model: 'equal',
        story: `${groups} élèves se partagent ${groups * b} cartes à parts égales. Combien de cartes reçoit chaque élève ?`,
        cards: [String(groups * b), String(groups), '?'],
        slots: ['Tout', 'Nombre de parts', 'Une part'],
        answer: b,
        explanation: `${groups * b} ÷ ${groups} = ${b} cartes par élève.`,
      };
    return {
      kind: 'equal',
      model: 'equal',
      story: `Il y a ${groups} boîtes contenant chacune ${b} craies. Combien de craies y a-t-il en tout ?`,
      cards: ['?', String(groups), String(b)],
      slots: ['Tout', 'Nombre de parts', 'Une part'],
      answer: groups * b,
      explanation: `${groups} × ${b} = ${groups * b} craies.`,
    };
  }
  if (tier === 3) {
    const boxes = 4 + (n % 5),
      perBox = 12 + (n % 25),
      used = 17 + (n % 24);
    return {
      kind: 'two-step',
      model: 'equal',
      story: `La classe reçoit ${boxes} boîtes de ${perBox} bougies. Elle utilise ${used} bougies. Combien de bougies reste-t-il ?`,
      cards: ['?', String(boxes), String(perBox), String(used)],
      slots: ['Tout reçu', 'Nombre de parts', 'Une part', 'À retirer'],
      answer: boxes * perBox - used,
      explanation: `D’abord ${boxes} × ${perBox} = ${boxes * perBox}. Puis ${boxes * perBox} − ${used} = ${boxes * perBox - used}.`,
    };
  }
  if (tier === 4) {
    const price = [1.25, 2.35, 3.75, 4.5][n % 4];
    return {
      kind: 'irrelevant',
      model: 'equal',
      story: `La bibliothèque achète ${a} marque-pages à ${formatNumber(price)} € chacun. Elle ouvre à 9 heures. Combien coûtent les marque-pages en tout ?`,
      cards: ['?', String(a), formatNumber(price), '9'],
      slots: ['Tout en euros', 'Nombre de parts', 'Une part en euros'],
      answer: Math.round(a * price * 100) / 100,
      explanation: `${a} × ${formatNumber(price)} = ${formatNumber(a * price)} €. L’heure d’ouverture ne sert pas au calcul.`,
    };
  }
  const g = 4 + (n % 5),
    each = 12 + (n % 13),
    other = g - 1,
    otherEach = each + 2;
  const left = g * each,
    right = other * otherEach;
  return {
    kind: 'question',
    model: 'compare',
    story: `Lina récolte ${g} paniers de ${each} feuilles. Malo récolte ${other} paniers de ${otherEach} feuilles.`,
    questionOptions: [
      'Quel est l’écart entre leurs deux récoltes ?',
      'De quelle couleur sont les feuilles ?',
      'Quelle distance ont-ils parcourue ?',
    ],
    questionAnswer: 0,
    cards: [`${g} × ${each}`, `${other} × ${otherEach}`, '?'],
    slots: ['Lina', 'Malo', 'Écart'],
    answer: Math.abs(left - right),
    explanation: `Lina : ${g} × ${each} = ${left}. Malo : ${other} × ${otherEach} = ${right}. L’écart est ${Math.max(left, right)} − ${Math.min(left, right)} = ${Math.abs(left - right)} feuilles.`,
  };
}
