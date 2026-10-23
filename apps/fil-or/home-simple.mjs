// Accueil simple, sur le modèle de la Forêt Enchantée :
// on entre son nom → quatre grands mondes → un monde montre ses lieux → un lieu lance l'exercice.
import { ACADEMY_ROOMS, academyRoomStatus, roomAccess, roomById } from './academy-rooms.mjs';
import { UNIVERSES, GAME_SPOTS, worldProgress, universeRooms, lightName } from './world-map.mjs';
import { apprentice } from './academy-art.mjs';

const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

const BLURB = {
  recits: 'Lire, les mots, la grammaire, écrire',
  forges: 'Les nombres, le calcul, les problèmes',
  observatoire: 'Fractions, mesures et formes',
  jardin: 'Des énigmes à résoudre',
};
const flames = (light) =>
  `<span class="sw-flames" aria-hidden="true">${[1, 2, 3].map((i) => `<i class="${light >= i ? 'f' + i : ''}"></i>`).join('')}</span>`;

function members(state, uid, wp, statuses) {
  if (uid === 'jardin')
    return GAME_SPOTS.map((g) => ({
      id: 'game-' + g.id,
      game: g.id,
      icon: g.icon,
      name: g.name,
      light: wp.games[g.id].light,
      open: true,
      sub: `${wp.games[g.id].n} / ${wp.games[g.id].total} énigmes`,
    }));
  return universeRooms(uid).map((id) => {
    const r = roomById(id),
      a = roomAccess(state, id, statuses);
    return {
      id,
      room: id,
      icon: r.icon,
      name: r.name,
      light: wp.lights[id],
      open: a.open,
      sub: a.open ? r.subject : 'Ouvre d’abord : ' + a.missing.map((m) => roomById(m).name).join(' et '),
    };
  });
}

export function welcomeHTML() {
  return `<section class="sw-welcome" aria-labelledby="sw-welcome-title">
  <div class="sw-welcome-art" aria-hidden="true">${apprentice(1)}</div>
  <h1 id="sw-welcome-title">L’École de magie<br /><em>du Fil d’Or</em></h1>
  <form id="welcome-form" class="sw-welcome-form">
    <label class="field">Ton nom de magicienne<input id="welcome-name" autocomplete="username" maxlength="24" minlength="2" required></label>
    <label class="field">Ton code secret (4 à 6 chiffres)<input id="welcome-code" type="password" inputmode="numeric" autocomplete="current-password" pattern="[0-9]{4,6}" minlength="4" maxlength="6" required></label>
    <p id="welcome-status" role="status"></p>
    <button class="primary sw-big" id="welcome-enter" type="submit">Entrer dans l’école ✦</button>
  </form>
  <button class="quiet" id="welcome-guest">Jouer sans compte sur cet appareil</button>
</section>`;
}

export function homeHTML(state, { name = '', level = 1, storyReady = false } = {}) {
  const statuses = academyRoomStatus(state),
    wp = worldProgress(state, statuses);
  return `<section class="sw-home" aria-labelledby="sw-home-title">
  <div class="sw-hello"><span class="sw-avatar" aria-hidden="true">${apprentice(level)}</span><div><h1 id="sw-home-title">${name ? 'Bonjour ' + esc(name) + ' !' : 'Bonjour !'}</h1><p>Choisis un monde.</p></div>${storyReady ? '<button class="sw-story-chip" id="home-story">📜 Un nouveau chapitre !</button>' : ''}</div>
  <div class="sw-worlds">${UNIVERSES.map((u) => {
    const ms = members(state, u.id, wp, statuses),
      lit = ms.filter((m) => m.light >= 2).length;
    return `<button class="sw-world" data-world="${u.id}" style="--uc:${u.color}" aria-label="${esc(u.name)}, ${lit} lieux illuminés sur ${ms.length}"><span class="sw-world-icon" aria-hidden="true">${u.icon}</span><strong>${esc(u.name)}</strong><small>${esc(BLURB[u.id])}</small><span class="sw-dots" aria-hidden="true">${ms.map((m) => `<i class="l${m.light}"></i>`).join('')}</span></button>`;
  }).join('')}</div>
</section>`;
}

export function worldPageHTML(state, uid) {
  const u = UNIVERSES.find((x) => x.id === uid) || UNIVERSES[0];
  const statuses = academyRoomStatus(state),
    wp = worldProgress(state, statuses),
    ms = members(state, u.id, wp, statuses);
  return `<section class="sw-worldpage" style="--uc:${u.color}" aria-labelledby="sw-world-title">
  <div class="sw-worldhead"><button class="back" id="world-back" aria-label="Retour aux mondes">←</button><span class="sw-world-icon" aria-hidden="true">${u.icon}</span><h1 id="sw-world-title">${esc(u.name)}</h1></div>
  <div class="sw-places">${ms
    .map(
      (m) =>
        `<button class="sw-place ${m.open ? '' : 'sealed'} l${m.light}" ${m.room ? `data-hall="${m.room}"` : `data-game="${m.game}"`} aria-label="${esc(m.name)}, ${m.open ? esc(lightName(m.light)) : 'porte à ouvrir'}"><span class="sw-place-icon" aria-hidden="true">${m.open ? m.icon : '🔒'}</span><strong>${esc(m.name)}</strong><small>${esc(m.sub)}</small>${m.open ? flames(m.light) : ''}</button>`,
    )
    .join('')}</div>
  <p class="sw-legend" aria-hidden="true"><span><i class="f1"></i> essayé</span><span><i class="f2"></i> réussi plusieurs jours</span><span><i class="f3"></i> réussi à une étape plus difficile</span></p>
</section>`;
}

export function bindHome(main, { onWorld, onStory }) {
  main.querySelectorAll('[data-world]').forEach((b) => (b.onclick = () => onWorld(b.dataset.world)));
  const s = main.querySelector('#home-story');
  if (s) s.onclick = onStory;
}
export function bindWorldPage(main, { onBack, onRoom, onGame }) {
  main.querySelector('#world-back').onclick = onBack;
  main.querySelectorAll('[data-hall]').forEach((b) => (b.onclick = () => onRoom(b.dataset.hall)));
  main.querySelectorAll('[data-game]').forEach((b) => (b.onclick = () => onGame(b.dataset.game)));
}
export const worldOfRoom = (id) =>
  UNIVERSES.find((u) => universeRooms(u.id).includes(id))?.id ||
  (GAME_SPOTS.some((g) => g.id === id) ? 'jardin' : null);
export const ALL_ROOMS = ACADEMY_ROOMS.map((r) => r.id);
