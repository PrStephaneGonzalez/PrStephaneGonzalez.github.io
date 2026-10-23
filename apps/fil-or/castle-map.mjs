import { schoolTier } from './school-progress.mjs';
import {
  ACADEMY_ROOMS,
  academyRoomStatus,
  roomAccess,
  roomById,
  roomSkills,
  roomStages,
  nextRoomActivity,
} from './academy-rooms.mjs';
import { MATH_BLOCKS, blockById, suggestedTier } from './math-core.mjs';
import { miniCourse } from './mini-courses.mjs';
import { apprentice } from './academy-art.mjs';
import { roomLight, lightName } from './world-map.mjs';
const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
export const roomStatusLabel = (s) =>
  s === 'lit' ? 'Illuminée' : s === 'warming' ? 'En éveil' : 'À découvrir';
export function castleMapHTML(state, wizard) {
  const statuses = academyRoomStatus(state),
    current = roomById(state.training.castle?.room);
  return `<section class="castle-map" aria-labelledby="castle-map-title"><div class="castle-map-heading"><div><p class="eyebrow">Mon château</p><h2 id="castle-map-title">Où veux-tu aller ?</h2></div><button class="quiet" id="castle-list-toggle" aria-expanded="false">Voir les salles en liste</button></div><p class="castle-map-legend"><span>◇ À découvrir</span><span>◌ En éveil</span><span>✦ Compétence confirmée</span><span>⌑ Porte à ouvrir</span></p><div class="castle-map-scroll"><div class="castle-plan" aria-label="Carte des salles du château"><svg class="castle-plan-art" viewBox="0 0 900 780" aria-hidden="true"><defs><pattern id="castle-stones" width="48" height="26" patternUnits="userSpaceOnUse"><path d="M0 0H48V26H0ZM24 0V13M0 13H48" stroke="#8d819b" stroke-opacity=".15" fill="none"/></pattern></defs><path d="M30 740V82L160 20L290 82H330L450 8L570 82H610L740 20L870 82V740Z" fill="#30334c" stroke="#a79aab" stroke-width="3"/><path d="M30 740V82L160 20L290 82H330L450 8L570 82H610L740 20L870 82V740Z" fill="url(#castle-stones)"/><path d="M160 20V1M450 8V0M740 20V1" stroke="#e6c78c" stroke-width="3"/><path d="M320 110V670M580 110V670M320 220H580M320 365H580M320 515H580M320 670H580" stroke="#171b31" stroke-width="22" stroke-linecap="round"/><path d="M320 110V670M580 110V670M320 220H580M320 365H580M320 515H580M320 670H580" stroke="#897282" stroke-width="2" stroke-dasharray="3 10"/><rect x="345" y="272" width="210" height="210" rx="95" fill="#202c44" stroke="#948ba6" stroke-width="2"/><circle cx="450" cy="373" r="62" fill="#34455b" stroke="#a7c0b2"/><path d="M421 387Q450 343 479 387M450 310V350" fill="none" stroke="#bed1ba" stroke-width="3"/><path d="M408 740V715Q408 670 450 670Q492 670 492 715V740" fill="#171b31" stroke="#be9d7a" stroke-width="3"/><text x="450" y="767" text-anchor="middle" fill="#d3c3b2" font-size="17">L’École du Fil d’Or</text></svg>${ACADEMY_ROOMS.map(
    (r) => {
      const access = roomAccess(state, r.id, statuses),
        label = access.open ? roomStatusLabel(statuses[r.id]) : 'Porte à ouvrir';
      return `<button class="map-room ${statuses[r.id]} ${access.open ? '' : 'sealed'} ${current?.id === r.id ? 'here' : ''}" style="left:${r.x}%;top:${r.y}%" data-hall="${r.id}" aria-label="${esc(r.name)}, ${label}" ${access.open ? '' : 'aria-disabled="true"'}><span class="map-room-symbol" aria-hidden="true">${access.open ? r.icon : '⌑'}</span><strong>${esc(r.name)}</strong><small>${label}</small>${current?.id === r.id ? '<span class="map-here">Tu es ici</span>' : ''}</button>`;
    },
  ).join(
    '',
  )}<button class="map-courtyard" id="castle-games"><span aria-hidden="true">✺</span>Cour des énigmes<small>Choisir un jeu</small></button><span class="map-traveler" aria-hidden="true" style="left:${current ? current.x + 21 : 50}%;top:${current ? current.y + 13 : 90}%">${apprentice(wizard.outfit?.level || wizard.level)}</span></div></div><div id="castle-room-list" class="castle-room-list" hidden>${ACADEMY_ROOMS.map((r) => `<button class="activity-card" data-list-hall="${r.id}"><span><strong>${esc(r.name)}</strong><small>${esc(r.subject)} · ${roomAccess(state, r.id, statuses).open ? roomStatusLabel(statuses[r.id]) : 'Porte à ouvrir'}</small></span><span aria-hidden="true">↗</span></button>`).join('')}</div><p class="castle-map-caption">Une salle s’illumine quand un apprentissage est confirmé sur plusieurs jours. Tes lumières restent allumées.</p></section>`;
}
export function bindCastleMap(main, { onRoom, onGames }) {
  main.querySelectorAll('[data-hall]').forEach((b) => (b.onclick = () => onRoom(b.dataset.hall)));
  main
    .querySelectorAll('[data-list-hall]')
    .forEach((b) => (b.onclick = () => onRoom(b.dataset.listHall)));
  main.querySelector('#castle-games').onclick = onGames;
  main.querySelector('#castle-list-toggle').onclick = () => {
    const list = main.querySelector('#castle-room-list'),
      scroll = main.querySelector('.castle-map-scroll');
    list.hidden = !list.hidden;
    scroll.hidden = !list.hidden;
    main.querySelector('#castle-list-toggle').setAttribute('aria-expanded', String(!list.hidden));
    main.querySelector('#castle-list-toggle').textContent = list.hidden
      ? 'Voir les salles en liste'
      : 'Revenir à la carte';
  };
}
export function renderCastleRoom(main, ctx, roomId) {
  const hall = roomById(roomId),
    access = roomAccess(ctx.state, roomId);
  if (!hall) return ctx.onBack();
  const status = academyRoomStatus(ctx.state)[roomId];
  const head = `<div class="page-head"><button class="back" id="hall-back" aria-label="Retour à la carte">←</button><div><p class="eyebrow">Mon château · ${access.open ? roomStatusLabel(status) : 'Porte à ouvrir'}</p><h1>${esc(hall.name)}</h1><p class="subtle">${esc(hall.subject)}</p></div></div>`;
  if (!access.open) {
    main.innerHTML =
      head +
      `<article class="hall-door"><div class="hall-door-symbol" aria-hidden="true">⌑</div><h2>Cette porte s’ouvrira bientôt.</h2><p>Commence un exercice dans ${access.missing.map((id) => '« ' + esc(roomById(id).name) + ' »').join(' et ')}.</p>${access.missing.map((id) => `<button class="primary" data-prerequisite="${id}">Aller à ${esc(roomById(id).name)} ↗</button>`).join('')}</article>`;
    main.querySelector('#hall-back').onclick = ctx.onBack;
    main
      .querySelectorAll('[data-prerequisite]')
      .forEach((b) => (b.onclick = () => ctx.onRoom(b.dataset.prerequisite)));
    return;
  }
  const skills = roomSkills(roomId),
    core = MATH_BLOCKS.some((b) => b.id === roomId),
    special = ['reading', 'words'].includes(roomId);
  let choice =
    ctx.initialChoice && skills.some((s) => s.id === ctx.initialChoice)
      ? ctx.initialChoice
      : core || special
        ? 'module'
        : skills[0]?.id;
  let tier = Number.isInteger(ctx.initialTier)
    ? ctx.initialTier
    : core
      ? suggestedTier(
          ctx.state.training.math,
          roomId,
          ctx.state.trainingSettings.mathStarts?.[roomId] ?? ctx.state.trainingSettings.mathStart,
        )
      : (ctx.state.learning.browseStages?.[choice] ?? schoolTier(ctx.state.training, choice));
  function draw() {
    const skill = skills.find((s) => s.id === choice),
      activity = skill ? nextRoomActivity(ctx.state, choice, tier) : null;
    const candidateSample = skill
      ? nextRoomActivity({ learning: { completed: activity ? [activity.id] : [] } }, choice, tier)
      : null;
    const sample = candidateSample?.id !== activity?.id ? candidateSample : null;
    const course = miniCourse(roomId, { tier, skillId: skill?.id, sample });
    const stages =
      choice === 'module' && core ? blockById(roomId).tiers : skill ? roomStages(skill) : null;
    const marks = ctx.state.academy?.unlocked || [];
    const learned = marks.filter((m) =>
      skill
        ? m.startsWith(`school:${skill.id}:`) || m.startsWith(`lesson:${skill.id}:`)
        : m.startsWith(`math:${roomId}:`),
    );
    const light = roomLight(ctx.state, roomId);
    const learnedTiers = learned
      .map((m) => m.split(':').at(-1))
      .filter((t) => /^[0-5]$/.test(t))
      .map(Number);
    const best = learnedTiers.length ? Math.max(...learnedTiers) : -1;
    const challenge =
      stages && best >= 0 && best < stages.length - 1
        ? tier <= best
          ? `<div class="mastery-challenge"><p><strong>Défi de maîtrise ✦</strong> Tu as illuminé l’étape ${best + 1}. L’étape ${best + 2} est plus difficile : la réussir plusieurs jours de suite ${light >= 3 ? 'ajoute une nouvelle lumière' : 'donne une flamme étoilée'}, et ses objets sont plus rares.</p><button class="primary" id="hall-challenge">Relever le défi de l’étape ${best + 2} ↗</button></div>`
          : `<div class="mastery-challenge"><p><strong>Défi en cours ✦</strong> Tu travailles une étape au-dessus de ce que tu as déjà illuminé. Courage !</p></div>`
        : '';
    main.innerHTML =
      head +
      `<p class="room-flames"><b aria-hidden="true">${['○', '🔹', '🔸', '🌟'][light]}</b>${lightName(light)}</p>${challenge}<article class="hall-interior ${status}"><div class="hall-banner"><span aria-hidden="true">${hall.icon}</span><p>${status === 'lit' ? 'Une lumière de plus dans ton école.' : 'Un petit entraînement, à ton rythme.'}</p></div><label class="field">Que veux-tu travailler ?<select id="hall-notion">${core || special ? `<option value="module" ${choice === 'module' ? 'selected' : ''}>${core ? esc(blockById(roomId).label) : roomId === 'reading' ? 'Une nouvelle lecture' : 'Mon carnet de mots'}</option>` : ''}${skills.map((s) => `<option value="${s.id}" ${s.id === choice ? 'selected' : ''}>${esc(s.label)}</option>`).join('')}</select></label>${stages ? `<label class="field">Mon étape<select id="hall-tier">${stages.map((label, i) => `<option value="${i}" ${tier === i ? 'selected' : ''}>${i + 1}. ${esc(label)}</option>`).join('')}</select></label><p class="hall-stage"><span aria-hidden="true">${[0, 1, 2, 3, 4, 5].map((i) => `<i class="${i === tier ? 'current' : ''}"></i>`).join('')}</span>Étape ${tier + 1} sur 6${learned.some((m) => m.endsWith(':' + tier)) ? ' · Un apprentissage confirmé ici' : ''}</p>` : ''}<button class="primary" id="hall-start">${choice === 'module' ? (roomId === 'reading' ? 'Commencer une lecture' : roomId === 'words' ? 'Ouvrir mon carnet' : 'Commencer mes six cartes') : 'Commencer un exercice'} ↗</button><details class="hall-course" id="hall-course"><summary>Je découvre la notion · mini-cours</summary><h2>${esc(course.title)}</h2>${course.steps.map((step) => `<p>${esc(step)}</p>`).join('')}<div class="hall-example"><strong>Un exemple</strong><p>${esc(course.example)}</p></div><button class="quiet" id="hall-course-listen">♬ Écouter le mini-cours</button>${course.video ? `<a class="secondary lesson-video" href="${esc(course.video.url)}" target="_blank" rel="noopener noreferrer">▶ ${esc(course.video.title)} · ${course.video.provider} ↗</a><small>La vidéo s’ouvre dans un autre onglet et demande une connexion.</small>` : ''}</details></article>`;
    main.querySelector('#hall-back').onclick = ctx.onBack;
    main.querySelector('#hall-notion').onchange = (e) => {
      choice = e.target.value;
      tier =
        choice === 'module' && core
          ? suggestedTier(
              ctx.state.training.math,
              roomId,
              ctx.state.trainingSettings.mathStarts?.[roomId] ??
                ctx.state.trainingSettings.mathStart,
            )
          : (ctx.state.learning.browseStages?.[choice] ?? schoolTier(ctx.state.training, choice));
      draw();
    };
    if (stages)
      main.querySelector('#hall-tier').onchange = (e) => {
        tier = Number(e.target.value);
        if (skill) {
          ctx.state.learning.browseStages ??= {};
          ctx.state.learning.browseStages[choice] = tier;
          ctx.save();
        }
        draw();
      };
    const ch = main.querySelector('#hall-challenge');
    if (ch)
      ch.onclick = () => {
        tier = best + 1;
        if (skill) {
          ctx.state.learning.browseStages ??= {};
          ctx.state.learning.browseStages[choice] = tier;
          ctx.save();
        }
        draw();
        main.querySelector('#hall-start')?.focus();
      };
    main.querySelector('#hall-course-listen').onclick = () =>
      ctx.speak([course.title, ...course.steps, course.example].join('. '));
    main.querySelector('#hall-start').onclick = () =>
      ctx.onStart({ roomId, tier, skillId: skill?.id || null, activityId: activity?.id || null });
  }
  draw();
}
