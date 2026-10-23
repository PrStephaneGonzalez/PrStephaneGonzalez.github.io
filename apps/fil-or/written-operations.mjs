const fmt = (n) => String(Number(n.toFixed(6))).replace('.', ',');
export function operationTask(t, v) {
  let top, bottom, operator, steps, answer, explanation;
  if (t === 0) {
    top = 111 + (v % 4) * 10 + Math.floor(v / 4) * 100;
    bottom = 234;
    operator = '+';
    answer = top + bottom;
    steps = [
      { label: 'Chiffre des unités du résultat', answer: answer % 10 },
      { label: 'Chiffre des dizaines du résultat', answer: Math.floor(answer / 10) % 10 },
      { label: 'Chiffre des centaines du résultat', answer: Math.floor(answer / 100) },
    ];
    explanation =
      'On aligne les unités sous les unités, puis les dizaines et les centaines. On commence par les unités.';
  } else if (t === 1) {
    top = 268 + v * 10;
    bottom = 157;
    operator = '+';
    answer = top + bottom;
    steps = [
      { label: 'Chiffre à écrire dans les unités', answer: 5 },
      { label: 'Retenue à reporter dans les dizaines', answer: 1 },
      { label: 'Résultat complet', answer },
    ];
    explanation =
      '8 + 7 = 15 : on écrit 5 unités et on reporte 1 dizaine. On ajoute cette retenue dans la colonne suivante.';
  } else if (t === 2) {
    top = 502 + v * 100;
    bottom = 178;
    operator = '−';
    answer = top - bottom;
    steps = [
      {
        label: 'Dizaines disponibles après échange d’une centaine, avant de passer aux unités',
        answer: 10,
      },
      { label: 'Unités disponibles après échange d’une de ces dizaines', answer: 12 },
      { label: 'Résultat complet', answer },
    ];
    explanation =
      'On échange une centaine contre dix dizaines, puis une dizaine contre dix unités. Il reste neuf dizaines et douze unités. La valeur totale ne change pas.';
  } else if (t === 3) {
    top = 124 + v * 7;
    bottom = 3 + (v % 6);
    operator = '×';
    answer = top * bottom;
    const units = (top % 10) * bottom;
    steps = [
      { label: 'Chiffre des unités à écrire', answer: units % 10 },
      {
        label: 'Retenue à reporter dans les dizaines (0 si aucune)',
        answer: Math.floor(units / 10),
      },
      { label: 'Résultat complet', answer },
    ];
    explanation = `On multiplie d’abord les unités : ${top % 10} × ${bottom} = ${units}. On écrit ${units % 10} et on reporte ${Math.floor(units / 10)} dizaine(s), puis on continue.`;
  } else if (t === 4) {
    top = 134 + v * 3;
    bottom = 12 + v;
    operator = '×';
    answer = top * bottom;
    steps = [
      { label: `Première ligne : ${top} × ${bottom % 10}`, answer: top * (bottom % 10) },
      { label: `Deuxième ligne : ${top} × 10`, answer: top * 10 },
      { label: 'Somme des deux lignes', answer },
    ];
    explanation = `${bottom} = 10 + ${bottom % 10}. On calcule séparément ${top} × ${bottom % 10} et ${top} × 10, puis on additionne. Le zéro de la deuxième ligne marque la multiplication par une dizaine.`;
  } else if (v % 2 === 0) {
    top = (124 + v) / 10;
    bottom = 3;
    operator = '×';
    answer = top * bottom;
    steps = [
      { label: 'Nombre de dixièmes dans le premier nombre', answer: Math.round(top * 10) },
      { label: 'Nombre de dixièmes après multiplication par 3', answer: Math.round(top * 10) * 3 },
      { label: 'Résultat en unités, avec sa virgule', answer },
    ];
    explanation = `${fmt(top)} représente ${Math.round(top * 10)} dixièmes. Après multiplication par 3, on obtient ${Math.round(top * 10) * 3} dixièmes, soit ${fmt(answer)}.`;
  } else {
    answer = (12 + v) / 10;
    bottom = 4;
    top = answer * 4;
    operator = '÷';
    steps = [
      { label: 'Nombre de dixièmes à partager', answer: Math.round(top * 10) },
      { label: 'Nombre de dixièmes dans une part', answer: Math.round(answer * 10) },
      { label: 'Quotient en unités, avec sa virgule', answer },
    ];
    explanation = `On partage ${Math.round(top * 10)} dixièmes en 4 parts égales : ${Math.round(answer * 10)} dixièmes par part, soit ${fmt(answer)}. On peut vérifier ${fmt(answer)} × 4 = ${fmt(top)}.`;
  }
  return {
    type: 'operation',
    prompt: `Pose et complète : ${fmt(top)} ${operator} ${fmt(bottom)}.`,
    answer: String(answer),
    operation: { top: fmt(top), bottom: fmt(bottom), operator, steps },
    explanation,
  };
}
export function operationCorrect(a, values) {
  const parse = (s) =>
    Number(
      String(s)
        .trim()
        .replace(/[\s\u202f]/g, '')
        .replace(',', '.'),
    );
  return a.operation.steps.every(
    (step, i) =>
      String(values[i] ?? '').trim() !== '' && Math.abs(parse(values[i]) - step.answer) < 1e-6,
  );
}
