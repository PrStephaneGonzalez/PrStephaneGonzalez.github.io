// Le livre de l'histoire : liste des chapitres, lecture, question de fin de chapitre.
import { CHAPTERS, restoreStory, storyStatus, withName, choiceOrder } from './story.mjs';
import { worldProgress, listFr } from './world-map.mjs';

const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

// ctx : { state, save, speak, stopVoice, name, onBack, onReward(chapter) }
export function renderStoryBook(main, ctx) {
  ctx.state.story = restoreStory(ctx.state.story);
  const wp = worldProgress(ctx.state);
  const st = storyStatus(ctx.state.story, { ...wp, games: wp.gamesPlayed });
  const done = new Set(ctx.state.story.done);
  main.innerHTML = `<div class="page-head"><button class="back" id="story-back" aria-label="Retour à la carte">←</button><div><p class="eyebrow">L’École du Fil d’Or</p><h1>L’histoire du Fil d’Or</h1><p class="subtle">${done.size} chapitre${done.size > 1 ? 's' : ''} sur ${CHAPTERS.length}. Chaque chapitre revient quand tu as assez travaillé dans les univers.</p></div></div>
  <div class="story-thread" aria-hidden="true">${CHAPTERS.map((c) => `<i class="${done.has(c.id) ? 'on' : st.next?.id === c.id && st.ready ? 'ready' : ''}"></i>`).join('')}</div>
  <ol class="story-list">${CHAPTERS.map((c, i) => {
    const isNext = st.next?.id === c.id;
    if (done.has(c.id))
      return `<li><button class="story-card done" data-chapter="${c.id}"><span class="story-scene" aria-hidden="true">${c.scene}</span><span><small>Chapitre ${i + 1}</small><strong>${esc(c.title)}</strong><small>Relire ↗</small></span></button></li>`;
    if (isNext && st.ready)
      return `<li><button class="story-card ready" data-chapter="${c.id}"><span class="story-scene" aria-hidden="true">${c.scene}</span><span><small>Chapitre ${i + 1} · nouveau !</small><strong>${esc(c.title)}</strong><small>Lire maintenant ↗</small></span></button></li>`;
    if (isNext)
      return `<li><div class="story-card locked"><span class="story-scene" aria-hidden="true">🔒</span><span><small>Chapitre ${i + 1}</small><strong>${esc(c.title)}</strong><small>Il te faut encore ${esc(listFr(st.missing))}.</small></span></div></li>`;
    return `<li><div class="story-card far"><span class="story-scene" aria-hidden="true">✦</span><span><small>Chapitre ${i + 1}</small><strong>???</strong></span></div></li>`;
  }).join('')}</ol>`;
  main.querySelector('#story-back').onclick = ctx.onBack;
  main.querySelectorAll('[data-chapter]').forEach((b) => (b.onclick = () => renderChapter(main, ctx, b.dataset.chapter)));
}

export function renderChapter(main, ctx, id) {
  const index = CHAPTERS.findIndex((c) => c.id === id),
    c = CHAPTERS[index];
  if (!c) return renderStoryBook(main, ctx);
  const already = restoreStory(ctx.state.story).done.includes(id);
  const paras = c.text.map((t) => withName(t, ctx.name));
  const order = choiceOrder(c);
  main.innerHTML = `<div class="page-head"><button class="back" id="chapter-back" aria-label="Retour au livre">←</button><div><p class="eyebrow">Chapitre ${index + 1}</p><h1>${esc(c.title)}</h1></div></div>
  <article class="chapter"><div class="chapter-scene" aria-hidden="true">${c.scene}</div>${paras.map((p) => `<p>${esc(p)}</p>`).join('')}
  <button class="quiet" id="chapter-listen">♬ Écouter le chapitre</button>
  <section class="chapter-question" aria-labelledby="chapter-q"><h2 id="chapter-q">${already ? 'Pour se souvenir' : 'Pour refermer le parchemin'}</h2><p>${esc(withName(c.question.q, ctx.name))}</p>
  <div class="chapter-choices">${order.map((o, i) => `<button class="secondary" data-choice="${i}">${esc(withName(o.text, ctx.name))}</button>`).join('')}</div>
  <p id="chapter-feedback" role="status"></p></section></article>`;
  main.querySelector('#chapter-back').onclick = () => {
    ctx.stopVoice?.();
    renderStoryBook(main, ctx);
  };
  main.querySelector('#chapter-listen').onclick = () => ctx.speak([c.title, ...paras].join(' '));
  main.querySelectorAll('[data-choice]').forEach(
    (b) =>
      (b.onclick = () => {
        const o = order[Number(b.dataset.choice)],
          fb = main.querySelector('#chapter-feedback');
        if (!o.good) {
          b.disabled = true;
          fb.textContent = 'Pas tout à fait. Relis le chapitre : la réponse s’y cache.';
          return;
        }
        main.querySelectorAll('[data-choice]').forEach((x) => (x.disabled = true));
        b.classList.add('chosen');
        if (already) {
          fb.textContent = 'Exactement !';
          return;
        }
        ctx.state.story = restoreStory({ done: [...restoreStory(ctx.state.story).done, id] });
        const item = ctx.onReward?.(c, index);
        ctx.save();
        const next = CHAPTERS[index + 1];
        fb.innerHTML = `<strong>Le parchemin se referme dans un éclat doré.</strong> Un anneau du Fil d’Or brille de nouveau autour de la tour.${item ? ` Tu reçois : <em>${esc(item.name)}</em> (${esc(item.rarity)}).` : ''}${next ? ` <br />${esc(c.teaser || '')}` : ' <br />Fin… pour l’instant.'}<br /><button class="primary" id="chapter-done">Retour à la carte ↗</button>`;
        main.querySelector('#chapter-done').onclick = ctx.onBack;
      }),
  );
  window.scrollTo?.({ top: 0, behavior: 'instant' });
}
