import { logicHTML, logicFace } from './logic-games.mjs';
import {
  EXTRA_NAMES,
  extraInitial,
  extraValid,
  crossSolved,
  crossValue,
  mazeMove,
  mazeSolved,
  mazeHint,
} from './extra-games.mjs';
import { answerLine } from './feedback.mjs';
const cp = (x) => JSON.parse(JSON.stringify(x));
const desc = {
  cross:
    'Place les nombres pour obtenir les résultats de chaque ligne et de chaque colonne. Touche une case libre, puis un nombre. Les cases sombres sont déjà placées.',
  maze: 'Fais glisser la petite bille jusqu’au prochain mur pour colorer le jardin. Tu peux utiliser les flèches ou balayer le plateau. Colore toutes les cases du chemin.',
  logic:
    'Observe les exemples et cherche la pièce manquante. Tu peux demander une piste, continuer ou t’arrêter. Ces énigmes sont des jeux, sans score de QI.',
  pattern: 'Observe les changements d’une case à l’autre, puis choisis la pièce manquante.',
};
export function mountExtra(main, l, ctx) {
  let board = extraValid(l, ctx.board) ? cp(ctx.board) : extraInitial(l),
    history = [],
    selected = l.type === 'cross' ? board.findIndex((x) => x === null) : -1,
    assisted = false,
    done = false;
  function persist() {
    ctx.onSave(cp(board));
  }
  function render() {
    main.innerHTML = /* HTML */ `<div class="page-head">
        <button class="back" id="extra-back" aria-label="Retour">←</button>
        <div>
          <p class="eyebrow">Une petite énigme des gardiens</p>
          <h1>${EXTRA_NAMES[l.type]}</h1>
        </div>
        <button class="quiet" id="extra-pause" style="margin-left:auto">☾ Pause</button>
      </div>
      ${ctx.intro
        ? `<p class="companion-whisper"><small>Un mot de Plume</small>${ctx.intro}</p>`
        : ''}
      <section class="extra-layout">
        <p class="wide-copy">${desc[l.type]}</p>
        <button class="quiet" id="extra-audio">♬ Écouter la règle</button>
        <div class="extra-board" id="extra-board"></div>
        <div class="board-tools">
          <button id="extra-undo" ${history.length ? '' : 'disabled'}>↶ Annuler</button
          ><button id="extra-hint">✧ Une piste</button
          ><button id="extra-reset">↺ Recommencer</button>
        </div>
        <p class="game-message" id="extra-feedback" aria-live="polite"></p>
        ${l.type === 'cross'
          ? '<button class="primary" id="extra-check">Regarder les calculs</button>'
          : ''}
      </section>`;
    main.querySelector('#extra-back').onclick = ctx.onExit;
    main.querySelector('#extra-pause').onclick = ctx.onPause;
    main.querySelector('#extra-audio').onclick = () => ctx.speak(desc[l.type]);
    main.querySelector('#extra-undo').onclick = () => {
      if (history.length) {
        board = history.pop();
        done = false;
        persist();
        render();
      }
    };
    main.querySelector('#extra-reset').onclick = () => {
      history.push(cp(board));
      board = extraInitial(l);
      selected = l.type === 'cross' ? board.findIndex((x) => x === null) : -1;
      done = false;
      persist();
      render();
    };
    main.querySelector('#extra-hint').onclick = hint;
    if (l.type === 'cross') drawCross();
    if (l.type === 'maze') drawMaze();
    if (l.type === 'pattern') drawPattern();
    if (l.type === 'logic') drawLogic();
    if (ctx.onControls) ctx.onControls();
  }
  function success(correct = true) {
    if (done) return;
    done = true;
    ctx.onDone({ correct, assisted, explanation: l.type === 'logic' ? l.explanation : null });
  }
  function drawCross() {
    const root = main.querySelector('#extra-board');
    root.innerHTML = /* HTML */ `<div
        class="cross-grid"
        style="grid-template-columns:repeat(${l.n * 2 + 1},minmax(0,1fr))"
      >
        ${Array.from({ length: l.n }, (_, r) => {
          let row = '';
          for (let c = 0; c < l.n; c++) {
            const i = r * l.n + c;
            row += `<button class="cross-cell ${l.fixed.includes(i) ? 'fixed' : ''} ${i === selected ? 'selected' : ''}" data-cross="${i}" ${l.fixed.includes(i) ? 'disabled' : ''} aria-label="Ligne ${r + 1}, colonne ${c + 1}, ${board[i] ?? 'à remplir'}">${board[i] ?? '·'}</button>`;
            if (c < l.n - 1) row += `<span class="cross-op">${l.ops[r][c]}</span>`;
          }
          return (
            row +
            `<span class="cross-op">=</span><span class="cross-target">${l.rowTargets[r]}</span>`
          );
        }).join('')}${Array.from({ length: l.n * 2 + 1 }, (_, c) =>
          c % 2 === 0 && c < l.n * 2
            ? `<span class="cross-total" title="Somme de la colonne">↓ ${l.colTargets[c / 2]}</span>`
            : '<span></span>',
        ).join('')}
      </div>
      <p class="subtle">
        Les résultats sous les flèches sont les sommes des
        colonnes.${l.ops.some((o) => o[0] === '×')
          ? ' Dans les lignes, la multiplication se calcule avant l’addition.'
          : ''}
      </p>
      <div class="number-pool">
        ${l.solution
          .map(
            (v, i) =>
              `<button data-number="${i}" ${l.fixed.includes(i) ? 'disabled' : ''} class="${board.includes(v) ? 'used' : ''}">${v}</button>`,
          )
          .join('')}
      </div>`;
    root.querySelectorAll('[data-cross]:not([disabled])').forEach(
      (b) =>
        (b.onclick = () => {
          selected = Number(b.dataset.cross);
          drawCross();
        }),
    );
    root.querySelectorAll('[data-number]:not([disabled])').forEach(
      (b) =>
        (b.onclick = () => {
          if (selected < 0 || done) return;
          const value = l.solution[Number(b.dataset.number)],
            old = board.indexOf(value);
          history.push(cp(board));
          if (old >= 0) board[old] = null;
          board[selected] = value;
          selected = board.findIndex((x) => x === null);
          persist();
          drawCross();
          main.querySelector('#extra-undo').disabled = false;
        }),
    );
    main.querySelector('#extra-check').onclick = () => {
      if (crossSolved(l, board)) success();
      else {
        const completed = board.every((x) => x !== null);
        main.querySelector('#extra-feedback').textContent = completed
          ? 'Ce n’est pas encore la bonne solution : ces nombres ne donnent pas tous les résultats. Tu peux les déplacer ou demander une piste.'
          : 'Il reste des cases à compléter. Tu peux aussi demander une piste.';
        if (completed) ctx.onWrong?.();
      }
    };
  }
  function move(direction) {
    if (done) return;
    const next = mazeMove(l, board, direction);
    if (!next) return;
    history.push(cp(board));
    board = next;
    persist();
    drawMaze();
    main.querySelector('#extra-undo').disabled = false;
    if (mazeSolved(l, board)) success();
  }
  function drawMaze() {
    const root = main.querySelector('#extra-board');
    root.innerHTML = /* HTML */ `<div
        class="maze-grid"
        id="maze-swipe"
        tabindex="0"
        aria-label="Jardin à colorer, utiliser les flèches"
        style="grid-template-columns:repeat(${l.n},minmax(0,1fr));grid-template-rows:repeat(${l.n},minmax(0,1fr))"
      >
        ${Array.from(
          { length: l.n * l.n },
          (_, i) =>
            `<span class="maze-cell ${l.walls.includes(i) ? 'wall' : board.painted.includes(i) ? 'painted' : ''} ${board.pos === i ? 'ball' : ''}">${board.pos === i ? '<span aria-hidden="true">●</span>' : ''}</span>`,
        ).join('')}
      </div>
      <div class="maze-arrows" role="group" aria-label="Direction">
        <button data-direction="up" aria-label="Monter">↑</button
        ><button data-direction="left" aria-label="Aller à gauche">←</button
        ><button data-direction="down" aria-label="Descendre">↓</button
        ><button data-direction="right" aria-label="Aller à droite">→</button>
      </div>
      <p class="subtle">
        ${board.painted.length} cases colorées sur ${l.n * l.n - l.walls.length}
      </p>`;
    root
      .querySelectorAll('[data-direction]')
      .forEach((b) => (b.onclick = () => move(b.dataset.direction)));
    let sx, sy;
    const area = root.querySelector('#maze-swipe');
    area.onpointerdown = (e) => {
      sx = e.clientX;
      sy = e.clientY;
      area.setPointerCapture(e.pointerId);
    };
    area.onpointerup = (e) => {
      if (sx === undefined) return;
      const dx = e.clientX - sx,
        dy = e.clientY - sy;
      sx = undefined;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
      move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
    };
    area.onpointercancel = () => (sx = undefined);
    area.onkeydown = (e) => {
      const d = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[e.key];
      if (d) {
        e.preventDefault();
        move(d);
        main.querySelector('#maze-swipe')?.focus();
      }
    };
  }
  const dots = (n) =>
    `<span class="pattern-dots" role="img" aria-label="${n} points, groupés par cinq">${Array.from({ length: Math.ceil(n / 5) }, (_, g) => `<span class="five-frame" aria-hidden="true">${Array.from({ length: 5 }, (_, i) => `<i class="${g * 5 + i < n ? 'filled' : 'empty'}"></i>`).join('')}</span>`).join('')}</span>`;
  function drawPattern() {
    main.querySelector('#extra-board').innerHTML =
      l.tier < 3
        ? `<div class="pattern-sequence">${l.sequence.map((n, i) => `<span>${i === 4 ? '?' : dots(n)}</span>`).join('')}</div>`
        : `<div class="pattern-matrix">${l.grid.map((n, i) => `<span>${i === 8 ? '?' : dots(n)}</span>`).join('')}</div>`;
    main.querySelector('#extra-board').innerHTML +=
      `<div class="answer-choices">${l.options.map((n) => `<button class="answer" data-pattern="${n}">${dots(n)}</button>`).join('')}</div>`;
    main.querySelectorAll('[data-pattern]').forEach(
      (b) =>
        (b.onclick = () => {
          if (done) return;
          const correct = Number(b.dataset.pattern) === l.answer;
          board.answer = Number(b.dataset.pattern);
          persist();
          main.querySelector('#extra-feedback').textContent = l.explanation;
          if (correct) success();
          else {
            assisted = true;
            main.querySelector('#extra-feedback').textContent = answerLine(false) + ' ' + l.explanation;
            ctx.onWrong?.();
            main.querySelectorAll('[data-pattern]').forEach((x) => {
              x.disabled = true;
              if (Number(x.dataset.pattern) === l.answer) x.classList.add('correct');
            });
            const go = document.createElement('button');
            go.className = 'primary';
            go.textContent = 'Une découverte de plus · Continuer ↗';
            go.onclick = () => success(false);
            main.querySelector('#extra-board').append(go);
          }
        }),
    );
  }
  function drawLogic() {
    main.querySelector('#extra-board').innerHTML =
      logicHTML(l) +
      `<div class="answer-choices">${l.options.map((n, i) => `<button class="answer" data-logic="${i}" aria-label="Proposition ${i + 1}">${logicFace(l, n)}</button>`).join('')}</div>`;
    main.querySelectorAll('[data-logic]').forEach(
      (b) =>
        (b.onclick = () => {
          if (done) return;
          const value = l.options[Number(b.dataset.logic)];
          board.answer = value;
          persist();
          if (value === l.answer) success();
          else {
            assisted = true;
            main.querySelector('#extra-feedback').textContent = answerLine(false) + ' ' + l.explanation;
            ctx.onWrong?.();
            main.querySelectorAll('[data-logic]').forEach((x) => {
              x.disabled = true;
              if (l.options[Number(x.dataset.logic)] === l.answer) x.classList.add('correct');
            });
            const next = document.createElement('button');
            next.className = 'primary';
            next.textContent = 'Une idée découverte · Continuer ↗';
            next.onclick = () => success(false);
            main.querySelector('#extra-board').append(next);
          }
        }),
    );
  }
  function hint() {
    assisted = true;
    if (l.type === 'cross') {
      const i = board.findIndex((v, i) => !l.fixed.includes(i) && v !== l.solution[i]);
      if (i >= 0) {
        selected = i;
        drawCross();
        main.querySelector('#extra-feedback').textContent =
          `Une solution possible place ${l.solution[i]} dans la case sélectionnée.`;
      }
    } else if (l.type === 'maze') {
      const path = mazeHint(l, board);
      main.querySelector('#extra-feedback').textContent = path
        ? `Une piste : ${{ up: 'vers le haut', down: 'vers le bas', left: 'vers la gauche', right: 'vers la droite' }[path[0]]}.`
        : 'Tu peux annuler un mouvement ou recommencer ce jardin.';
    } else main.querySelector('#extra-feedback').textContent = l.explanation;
  }
  render();
  persist();
  return { getBoard: () => cp(board) };
}
