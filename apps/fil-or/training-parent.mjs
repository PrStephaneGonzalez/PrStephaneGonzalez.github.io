import { schoolGroups } from './school-progress.mjs';
import { ACTIVITY_BY_ID } from './catalog.mjs';
import { mathReportHTML } from './math-parent.mjs';
import { calendarDay, addDays, weeklyReadings, wordBook, readingSpeed } from './training-state.mjs';
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const ratio = ([yes, total]) =>
  total
    ? Math.round((100 * yes) / total) + ' % (' + yes + '/' + total + ')'
    : 'Pas encore de données';
function plot(values, label, unit, min = 0) {
  const points = values.filter((p) => Number.isFinite(p.value));
  if (!points.length)
    return '<p class="report-empty">La courbe apparaîtra après des séances enregistrées.</p>';
  const max = unit.includes('%') ? 100 : Math.max(min + 1, ...points.map((p) => p.value)) * 1.12;
  const coords = points.map((p, i) => ({
    ...p,
    x: points.length === 1 ? 250 : 55 + (i * 420) / (points.length - 1),
    y: 170 - (140 * (p.value - min)) / (max - min),
  }));
  return (
    '<figure class="report-chart"><figcaption>' +
    esc(label) +
    '</figcaption><svg viewBox="0 0 530 220" role="img" aria-label="' +
    esc(label + ', valeurs dans le tableau ci-dessous') +
    '"><path d="M55 25V170H490" fill="none" stroke="#9ab8b0"/><text x="5" y="35" fill="#bfd0cf" font-size="13">' +
    Math.round(max) +
    '</text><text x="25" y="175" fill="#bfd0cf" font-size="13">0</text><polyline points="' +
    coords.map((p) => p.x + ',' + p.y).join(' ') +
    '" fill="none" stroke="#f2c779" stroke-width="3"/>' +
    coords
      .map(
        (p) =>
          '<circle cx="' +
          p.x +
          '" cy="' +
          p.y +
          '" r="5" fill="#f2c779"/><text x="' +
          p.x +
          '" y="195" text-anchor="middle" fill="#bfd0cf" font-size="11">' +
          p.day.slice(5) +
          '</text>',
      )
      .join('') +
    '</svg><details><summary>Valeurs de la courbe</summary><table class="school-table"><thead><tr><th>Semaine du</th><th>' +
    esc(unit) +
    '</th><th>Effectif</th></tr></thead><tbody>' +
    points
      .map(
        (p) =>
          '<tr><td>' +
          esc(p.day) +
          '</td><td>' +
          Math.round(p.value) +
          '</td><td>' +
          p.n +
          '</td></tr>',
      )
      .join('') +
    '</tbody></table></details></figure>'
  );
}
export function reportHTML(state) {
  const t = state.training,
    weekly = weeklyReadings(t).slice(-12),
    book = wordBook(t);
  const valid = t.readings.filter((r) => readingSpeed(r) !== null);
  const easy = t.judgments.filter(
    (j, i, xs) => j.easy && xs.findIndex((x) => x.word === j.word) === i,
  );
  const hard = t.judgments.filter(
    (j, i, xs) => !j.easy && xs.findIndex((x) => x.word === j.word) === i,
  );
  const firstTrials = (js) =>
    js.map((j) => t.wordEvents.find((e) => e.word === j.word)).filter(Boolean);
  const easyTrials = firstTrials(easy),
    hardTrials = firstTrials(hard);
  const errors = {};
  for (const e of t.wordEvents.filter((e) => e.kind === 'dictation'))
    for (const kind of e.errors) errors[kind] = (errors[kind] || 0) + 1;
  const days = new Set(
    [...t.readings, ...t.wordEvents, ...t.school, ...(t.math?.events || [])].map((e) => e.day),
  );
  const today = calendarDay();
  const readingPlots = [...new Set(weekly.map((w) => w.level))]
    .map((level) =>
      plot(
        weekly
          .filter((w) => w.level === level && w.median !== null)
          .map((w) => ({
            day: w.day,
            value: w.median,
            n: w.speeds.length,
          })),
        'Lecture silencieuse · niveau ' + (level + 1) + ' · médiane hebdomadaire',
        'Mots/minute',
      ),
    )
    .join('');
  return (
    '<div class="parent-report"><p class="eyebrow">Observations de pratique</p><h2>Lecture et carnet de mots</h2>' +
    '<p>Ces mesures décrivent les essais dans l’application. Les textes sont harmonisés par rédaction et longueur, sans étalonnage clinique ni base de fréquence lexicale. Une variation isolée ne prouve pas un progrès.</p>' +
    '<div class="report-counters"><div><strong>' +
    valid.length +
    '</strong><span>lectures avec vitesse interprétable</span></div><div><strong>' +
    book.active.length +
    '</strong><span>mots actifs</span></div><div><strong>' +
    book.won.length +
    '</strong><span>mots gagnés</span></div></div>' +
    (readingPlots || plot([], 'Lecture silencieuse', 'Mots/minute')) +
    '<p class="subtle">Vitesse retenue seulement après trois questions et au moins deux réponses justes, pour un texte jamais ouvert, sans interruption. La médiane regroupe les lectures de la semaine au même niveau. Un seul point est une observation, pas une tendance. Cette série ne se compare pas aux normes de lecture à voix haute.</p>' +
    [...new Set(weekly.map((w) => w.level))]
      .map(
        (level) =>
          '<details class="parent-details"><summary>Compréhension · niveau ' +
          (level + 1) +
          '</summary>' +
          ['literal', 'inference']
            .map((kind) =>
              plot(
                weekly
                  .filter((w) => w.level === level && w[kind][1])
                  .map((w) => ({
                    day: w.day,
                    value: (100 * w[kind][0]) / w[kind][1],
                    n: w[kind][1],
                  })),
                kind === 'literal' ? 'Compréhension littérale' : 'Compréhension inférentielle',
                'Réponses justes (%)',
              ),
            )
            .join('') +
          '</details>',
      )
      .join('') +
    '<h3>Jugement de l’enfant et premier essai</h3><p>Mots jugés faciles, puis ratés : ' +
    ratio([easyTrials.filter((e) => !e.correct).length, easyTrials.length]) +
    '</p><p>Mots jugés à travailler, puis réussis : ' +
    ratio([hardTrials.filter((e) => e.correct).length, hardTrials.length]) +
    '</p><p class="subtle">Il s’agit du premier exercice de reconnaissance, pas d’un test de conscience des difficultés ni d’une mesure de lecture orale.</p>' +
    '<h3>Erreurs observées en dictée</h3>' +
    (Object.keys(errors).length
      ? '<ul>' +
        Object.entries(errors)
          .map(([kind, n]) => '<li>' + esc(kind) + ' : ' + n + '</li>')
          .join('') +
        '</ul>'
      : '<p>Pas encore de dictée analysée.</p>') +
    '<p class="subtle">Le classement automatique propose une piste à vérifier avec l’orthophoniste. La réponse saisie n’est pas conservée.</p>' +
    '<h3>Le carnet</h3><p>Actifs : ' +
    (book.active.map((p) => esc(p.word)).join(', ') || 'aucun pour l’instant') +
    '</p><p>Gagnés : ' +
    (book.won.map((p) => esc(p.word)).join(', ') || 'aucun pour l’instant') +
    '</p><p>En réserve : ' +
    book.waiting.length +
    '. Le carnet actif reste limité à quinze mots, avec au plus trois mots travaillés par séance.</p>' +
    '<h3>Jours de pratique sur quatre semaines</h3><div class="practice-calendar" aria-label="Jours de pratique">' +
    Array.from({ length: 28 }, (_, i) => {
      const day = addDays(today, i - 27);
      return (
        '<span class="' +
        (days.has(day) ? 'practised' : '') +
        '" title="' +
        day +
        '">' +
        day.slice(-2) +
        '</span>'
      );
    }).join('') +
    '</div><p class="subtle">Les jours sans séance ne créent aucune dette ni série à préserver.</p>' +
    mathReportHTML(t, plot) +
    schoolReportHTML(t) +
    '<h3>Jeux</h3><p>Temps actif enregistré : ' +
    Math.round(t.games.reduce((sum, e) => sum + e.duration, 0) / 60000) +
    ' min. Aucun résultat de jeu n’entre dans les indicateurs scolaires.</p>' +
    '<details class="parent-details"><summary>Données et limites du suivi</summary><p>La sauvegarde peut réunir les textes ouverts, les réponses justes ou non, les mots du carnet, les durées et les étapes terminées. Aucun nom d’enfant, son, dictée brute ni diagnostic n’est enregistré. Jusqu’à 500 lectures et 2 500 essais de mots sont conservés ; les plus anciens sont ensuite retirés. Les réglages et les notes adultes restent sur l’appareil. Le menu Sauvegarde permet d’exporter une copie et de supprimer la sauvegarde partagée.</p><p>Pour le premier essai, observez surtout le plaisir, la fatigue et la compréhension des consignes. Une semaine ne valide pas un effet pédagogique.</p></details>' +
    '<button class="secondary" id="observations-csv">Exporter les observations (CSV)</button></div>'
  );
}
export function observationsCSV(training) {
  const rows = [
    [
      'date',
      'module',
      'cible',
      'résultat',
      'durée_ms',
      'exposition_ms',
      'étape',
      'schéma_juste',
      'calcul_juste',
      'erreur_droite_pct',
    ],
  ];
  for (const r of training.readings)
    rows.push([
      r.day,
      'lecture',
      r.textId,
      r.answers.filter((a) => a.correct).length + '/3',
      r.eligible ? r.duration : '',
      '',
    ]);
  for (const r of training.wordEvents)
    rows.push([
      r.day,
      r.kind,
      r.word,
      r.correct ? 'juste' : 'à retravailler',
      r.rt || '',
      r.kind === 'flash' ? r.exposure : '',
    ]);
  for (const r of training.school)
    rows.push([
      r.day,
      ACTIVITY_BY_ID[r.activityId]?.route === 'language' ? 'français' : 'mathématiques',
      r.skill + (r.revision === 2 ? ' · palier ' + (r.tier + 1) + ' · ' + r.format : ''),
      r.correct === null
        ? 'exploré'
        : r.correct
          ? r.assisted
            ? 'juste avec soutien'
            : 'juste'
          : 'à retravailler',
      '',
      '',
    ]);
  for (const r of training.math?.events || [])
    rows.push([
      r.day,
      'maths-' + r.block,
      r.target,
      r.correct ? (r.assisted ? 'juste avec soutien' : 'juste') : 'à retravailler',
      r.duration ?? '',
      '',
      r.tier + 1,
      r.schema ?? '',
      r.calc ?? '',
      r.error ?? '',
    ]);
  const cell = (value) =>
    '"' +
    String(value)
      .replace(/^[=+@-]/, "'$&")
      .replace(/"/g, '""') +
    '"';
  return (
    '\ufeff' +
    rows
      .map((row) =>
        Array.from({ length: 10 }, (_, i) => row[i] ?? '')
          .map(cell)
          .join(';'),
      )
      .join('\r\n')
  );
}

function schoolReportHTML(training) {
  const labels = {
    choice: 'Choisir une réponse',
    text: 'Écrire une réponse',
    numeric: 'Écrire un nombre',
    operation: 'Étapes d’une opération',
    guided: 'Manipulation guidée',
  };
  const groups = schoolGroups(training).sort((a, b) => b.events.at(-1).at - a.events.at(-1).at);
  if (!groups.length)
    return '<h3>Français et autres fiches de maths</h3><p>Les observations des nouvelles fiches apparaîtront ici, avec le palier et le type de réponse.</p>';
  return (
    '<h3>Français et autres fiches de maths</h3><p>Les réponses écrites, les choix et les opérations sont suivis séparément, à palier constant. Les anciens essais restent conservés mais ne sont pas mélangés à cette nouvelle série. Une réussite après aide ne valide pas un essai autonome.</p>' +
    groups
      .slice(0, 16)
      .map((g) => {
        const weeks = new Map();
        for (const e of g.events) {
          const date = new Date(e.day + 'T12:00:00Z');
          date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
          const day = date.toISOString().slice(0, 10),
            es = weeks.get(day) || [];
          es.push(e);
          weeks.set(day, es);
        }
        const points = [...weeks]
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-12)
          .map(([day, es]) => ({
            day,
            value: (100 * es.filter((e) => e.correct && !e.assisted).length) / es.length,
            n: es.length,
          }));
        const recent = g.events.slice(-10),
          good = recent.filter((e) => e.correct && !e.assisted).length;
        return (
          '<details class="parent-details"><summary>' +
          esc(g.label) +
          ' · palier ' +
          (g.tier + 1) +
          ' · ' +
          esc(labels[g.format] || g.format) +
          '</summary><p>Derniers essais sans aide : ' +
          ratio([good, recent.length]) +
          '.</p>' +
          plot(points, 'Réussite autonome par semaine', '%') +
          '</details>'
        );
      })
      .join('')
  );
}
