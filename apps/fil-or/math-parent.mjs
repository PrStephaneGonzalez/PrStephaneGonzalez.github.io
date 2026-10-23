import { MATH_BLOCKS, factBank, factStatus } from './math-core.mjs';
const pct = (xs) =>
  xs.length
    ? Math.round((100 * xs.filter((e) => e.correct).length) / xs.length) +
      ' % (' +
      xs.filter((e) => e.correct).length +
      '/' +
      xs.length +
      ')'
    : 'Pas encore de données';
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
function weekly(es, measure) {
  const groups = new Map();
  for (const e of es) {
    const date = new Date(e.day + 'T12:00:00Z');
    date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    const key = date.toISOString().slice(0, 10);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([day, xs]) => ({ day, n: xs.length, value: measure(xs) }));
}
export function mathReportHTML(training, plot) {
  const math = training.math || { events: [] };
  const es = math.events;
  const direct = es.filter((e) => !e.assisted);
  let html =
    '<h2>Mathématiques · quatre blocs</h2><p>Les résultats sont séparés par domaine et par étape. Les estimations sur la droite tolèrent un écart de 5 % de sa longueur. Les temps restent cachés à l’enfant ; un essai interrompu ne mesure aucune vitesse.</p>';
  html += '<h3>Droite numérique : erreur de placement</h3>';
  const lines = direct.filter((e) => e.block === 'line' && e.error !== null);
  for (const axis of [...new Set(lines.map((e) => e.target))])
    html += plot(
      weekly(
        lines.filter((e) => e.target === axis),
        (xs) => xs.reduce((s, e) => s + e.error, 0) / xs.length,
      ),
      'Droite · ' + axis.replaceAll('-', ' '),
      'Erreur moyenne (%)',
    );
  if (!lines.length) html += '<p>La courbe apparaîtra après les premiers placements.</p>';
  const facts = [...new Map([0, 1, 2, 3, 4, 5].flatMap(factBank).map((f) => [f.id, f])).values()];
  const mastered = facts.filter((f) => factStatus(math, f.id).mastered);
  html +=
    '<h3>Faits numériques</h3><p>' +
    mastered.length +
    ' faits consolidés sur ' +
    facts.length +
    ' disponibles. Un fait est consolidé après des réponses justes sans aide, rapides, lors de deux jours différents. Une réponse lente ou fausse le remet en révision.</p><div class="fact-grid" aria-label="Grille des multiplications">' +
    [2, 3, 4, 5, 6, 7, 8, 9, 10]
      .map(
        (a) =>
          '<div><strong>Table de ' +
          a +
          '</strong>' +
          [2, 3, 4, 5, 6, 7, 8, 9, 10]
            .map((b) => {
              const id = 'mul-' + a + '-' + b,
                status = factStatus(math, id);
              return (
                '<span class="' +
                (status.mastered ? 'mastered' : status.last ? 'practised' : '') +
                '" title="' +
                a +
                ' × ' +
                b +
                ' : ' +
                (status.mastered
                  ? 'consolidé'
                  : status.last
                    ? 'à revoir'
                    : 'pas encore travaillé') +
                '">' +
                a +
                '×' +
                b +
                '</span>'
              );
            })
            .join('') +
          '</div>',
      )
      .join('') +
    '</div>';
  html +=
    '<p class="smallnote">Doré : consolidé ; violet : déjà travaillé ; contour : pas encore travaillé. Les compléments, doubles, moitiés et divisions sont inclus dans le compteur.</p>';
  html +=
    '<h3>Écriture des nombres et échanges</h3><table class="school-table"><thead><tr><th>Type de nombre</th><th>Étape</th><th>Précision sans aide</th></tr></thead><tbody>';
  const place = direct.filter((e) => e.block === 'place');
  for (let tier = 0; tier < 6; tier++)
    for (const kind of ['transcode', 'reverse', 'exchange']) {
      const xs = place.filter((e) => e.tier === tier && e.kind === kind);
      if (xs.length)
        html +=
          '<tr><td>' +
          esc(MATH_BLOCKS[2].tiers[tier]) +
          '</td><td>' +
          {
            transcode: 'Lettres ou dictée → chiffres',
            reverse: 'Chiffres → lettres',
            exchange: 'Échanges',
          }[kind] +
          '</td><td>' +
          pct(xs) +
          '</td></tr>';
    }
  html += '</tbody></table>';
  for (let tier = 0; tier < 6; tier++) {
    const xs = place.filter((e) => e.tier === tier);
    if (xs.length)
      html += plot(
        weekly(xs, (xs) => (100 * xs.filter((e) => e.correct).length) / xs.length),
        'Échanges et transcodage · ' + MATH_BLOCKS[2].tiers[tier],
        'Réponses justes (%)',
      );
  }
  html +=
    '<h3>Problèmes : schéma et calcul séparés</h3><p>Le calcul suit toujours le choix du schéma. Si le schéma était erroné, le modèle corrigé est fourni avant le calcul : les deux courbes décrivent donc des étapes différentes.</p>';
  for (let tier = 0; tier < 6; tier++) {
    const xs = direct.filter((e) => e.block === 'bars' && e.tier === tier);
    if (xs.length) {
      html += plot(
        weekly(
          xs.filter((e) => e.schema !== null),
          (ys) => (100 * ys.filter((e) => e.schema).length) / ys.length,
        ),
        'Schéma · ' + MATH_BLOCKS[3].tiers[tier],
        'Schémas justes (%)',
      );
      html += plot(
        weekly(
          xs.filter((e) => e.calc !== null),
          (ys) => (100 * ys.filter((e) => e.calc).length) / ys.length,
        ),
        'Calcul · ' + MATH_BLOCKS[3].tiers[tier],
        'Calculs justes (%)',
      );
    }
  }
  html +=
    '<details class="parent-details"><summary>Ajustement et limites</summary><p>Le départ se règle dans l’espace parent. Après cinq essais, deux réussites ou moins proposent une étape plus simple au bloc suivant. Le passage automatique à l’étape supérieure exige au moins dix essais, environ 90 % de réussites sans aide et des réussites sur deux jours ; les faits doivent aussi être rapides. Le repère de rapidité se règle localement. Ces seuils ne sont pas des normes scolaires ou cliniques. Les six niveaux ne remplacent pas le travail accompagné, les figures instrumentées, les mesures réelles ou l’explication orale.</p><p>Une pause garde les cartes terminées ; la carte quittée revient sans mesure de rapidité. Jusqu’à 2 000 essais de maths sont conservés. Aucune réponse tapée ni voix n’est enregistrée.</p></details>';
  return html;
}
