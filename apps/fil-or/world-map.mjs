// Carte du monde : l'École du Fil d'Or au centre, quatre univers autour, reliés par des chemins.
// Les flèches suivent les prérequis existants des salles (academy-rooms.mjs) ; rien n'est
// bloqué de plus qu'avant. Chaque lieu a une lumière de 0 à 3 :
//   0 sombre · 1 flamme bleue (essayé) · 2 flamme dorée (apprentissage confirmé)
//   3 flamme étoilée (apprentissage confirmé à au moins deux étapes différentes).
import { ACADEMY_ROOMS, academyRoomStatus, roomAccess, roomById, roomSkills } from './academy-rooms.mjs';
import { LEVELS, levelMode } from './engine.mjs';
import { EXTRA_LEVELS } from './extra-games.mjs';
import { apprentice } from './academy-art.mjs';
import { CHAPTERS, storyStatus } from './story.mjs';

const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

export const UNIVERSES = [
  { id: 'recits', name: 'Château des Récits', icon: '📖', color: '#b48cff', cx: 23, cy: 24, rx: 21, ry: 19 },
  { id: 'forges', name: 'Forges des Nombres', icon: '⚒️', color: '#ff9f5a', cx: 77, cy: 24, rx: 21, ry: 19 },
  { id: 'observatoire', name: 'Observatoire céleste', icon: '🔭', color: '#6fb8ff', cx: 77, cy: 76, rx: 21, ry: 19 },
  { id: 'jardin', name: 'Jardin des énigmes', icon: '🌿', color: '#7fd99a', cx: 23, cy: 76, rx: 21, ry: 19 },
];
export const GAME_SPOTS = [
  { id: 'flow', name: 'Les fils de lumière', icon: '⌁', x: 10, y: 61, extra: false },
  { id: 'potion', name: 'Les potions enchantées', icon: '⚗', x: 25, y: 58, extra: false },
  { id: 'circuit', name: 'Les circuits magiques', icon: '✧', x: 38, y: 68, extra: false },
  { id: 'cross', name: 'La croisée des nombres', icon: '⊞', x: 9, y: 77, extra: true },
  { id: 'maze', name: 'Les jardins à colorer', icon: '▧', x: 24, y: 74, extra: true },
  { id: 'pattern', name: 'Les mosaïques de Plume', icon: '◈', x: 37, y: 84, extra: true },
  { id: 'logic', name: 'Le cabinet des énigmes', icon: '◇', x: 22, y: 88, extra: true },
];
// positions des salles (en % de la carte) et univers d'appartenance
const SPOTS = {
  reading: { u: 'recits', x: 13, y: 37 },
  words: { u: 'recits', x: 32, y: 36 },
  grammar: { u: 'recits', x: 31, y: 15 },
  writing: { u: 'recits', x: 13, y: 16 },
  place: { u: 'forges', x: 68, y: 37 },
  facts: { u: 'forges', x: 87, y: 36 },
  bars: { u: 'forges', x: 82, y: 16 },
  line: { u: 'observatoire', x: 66, y: 64 },
  measures: { u: 'observatoire', x: 88, y: 66 },
  geometry: { u: 'observatoire', x: 76, y: 87 },
};
export const HUB = { x: 50, y: 50 };
const GAME_EDGES = [
  ['flow', 'cross'],
  ['potion', 'maze'],
  ['circuit', 'pattern'],
  ['maze', 'logic'],
];
export const spotOf = (id) =>
  id === 'hub'
    ? HUB
    : SPOTS[id] || GAME_SPOTS.find((g) => 'game-' + g.id === id) || null;

const MARK_RX = {
  place: /^(math:place:|lesson:guided-place:)/,
  facts: /^(math:facts:|lesson:guided-calc:)/,
  line: /^(math:line:|lesson:guided-fraction:)/,
  bars: /^math:bars:/,
  words: /^(word:|lesson:guided-words:)/,
  reading: /^(reading:comprehension:|lesson:guided-reading:)/,
};
// nombre d'apprentissages confirmés d'une salle et nombre d'étapes différentes concernées
function roomMarks(state, id) {
  const marks = state.academy?.unlocked || [];
  const skills = new Set(roomSkills(id).map((s) => s.id));
  const mine = marks.filter((m) => {
    if (MARK_RX[id]?.test(m)) return true;
    const p = m.split(':');
    return p[0] === 'school' && skills.has(p[1]);
  });
  const tiers = new Set(
    mine
      .filter((m) => !m.startsWith('word:'))
      .map((m) => m.split(':').at(-1))
      .filter((t) => /^[0-5]$/.test(t)),
  );
  const words = mine.filter((m) => m.startsWith('word:')).length;
  return { count: mine.length, tiers: tiers.size + (words >= 12 ? 2 : words >= 1 ? 1 : 0) };
}
export function roomLight(state, id, statuses = academyRoomStatus(state)) {
  const s = statuses[id];
  if (s === 'dark') return 0;
  if (s === 'warming') return 1;
  return roomMarks(state, id).tiers >= 2 ? 3 : 2;
}
function gameLevels(g) {
  return g.extra
    ? EXTRA_LEVELS.filter((l) => l.type === g.id)
    : LEVELS.filter((l) => l.type === g.id);
}
const levelTier = (g, l) => (g.extra ? l.tier : levelMode(l));
export function gameProgress(state, g) {
  const done = new Set(g.extra ? state.extraCompleted : state.completed);
  const all = gameLevels(g),
    n = all.filter((l) => done.has(l.id)).length;
  const f = all.length ? n / all.length : 0;
  const tiers = [...new Set(all.map((l) => levelTier(g, l)))].sort((a, b) => a - b);
  // le prochain niveau de difficulté encore inachevé : c'est là qu'on emmène l'enfant
  const nextTier = tiers.find((t) => all.some((l) => levelTier(g, l) === t && !done.has(l.id))) ?? tiers.at(-1);
  return { n, total: all.length, light: n === 0 ? 0 : f >= 0.6 ? 3 : f >= 0.25 ? 2 : 1, nextTier };
}
// progression utile à l'histoire et aux univers
export function worldProgress(state, statuses = academyRoomStatus(state)) {
  const lights = Object.fromEntries(ACADEMY_ROOMS.map((r) => [r.id, roomLight(state, r.id, statuses)]));
  const games = Object.fromEntries(GAME_SPOTS.map((g) => [g.id, gameProgress(state, g)]));
  const awake = {},
    full = {};
  for (const u of UNIVERSES) {
    const ids = u.id === 'jardin' ? GAME_SPOTS.map((g) => g.id) : Object.keys(SPOTS).filter((k) => SPOTS[k].u === u.id);
    const ls = ids.map((id) => (u.id === 'jardin' ? games[id].light : lights[id]));
    awake[u.id] = ls.filter((l) => l >= 1).length;
    full[u.id] = ls.every((l) => l >= 1);
  }
  const rooms = Object.values(lights);
  return {
    lights,
    games,
    awake,
    objects: state.collection?.earned?.length || 0,
    lit: rooms.filter((l) => l >= 2).length,
    star: rooms.filter((l) => l >= 3).length,
    gamesPlayed: Object.values(games).filter((g) => g.n > 0).length,
    fullUniverse: Object.values(full).filter(Boolean).length,
  };
}
const FLAME = ['○', '🔹', '🔸', '🌟'];
const LIGHT_NAME = ['À découvrir', 'Flamme bleue · en éveil', 'Flamme dorée · illuminée', 'Flamme étoilée'];
export const lightName = (l) => LIGHT_NAME[l];
export const universeRooms = (uid) => Object.keys(SPOTS).filter((k) => SPOTS[k].u === uid);
export function universeLight(u, wp) {
  const ids = u.id === 'jardin' ? GAME_SPOTS.map((g) => g.id) : Object.keys(SPOTS).filter((k) => SPOTS[k].u === u.id);
  const ls = ids.map((id) => (u.id === 'jardin' ? wp.games[id].light : wp.lights[id]));
  return { sum: ls.reduce((a, b) => a + b, 0), max: ls.length * 3, lit: ls.filter((l) => l >= 2).length, n: ls.length };
}
function edgeD(a, b) {
  const x1 = a.x * 10, y1 = a.y * 9, x2 = b.x * 10, y2 = b.y * 9;
  const mx = (x1 + x2) / 2 + (y2 - y1) * 0.12, my = (y1 + y2) / 2 - (x2 - x1) * 0.12;
  return `M${x1} ${y1}Q${mx} ${my} ${x2} ${y2}`;
}
// petits décors dessinés, qui s'éclairent avec l'univers
function rand(seed) {
  let x = seed;
  return () => ((x = (x * 16807) % 2147483647) / 2147483647);
}
function decor(wp) {
  const r = rand(42),
    out = [];
  for (let i = 0; i < 70; i++)
    out.push(`<circle cx="${(r() * 1000).toFixed(0)}" cy="${(r() * 900).toFixed(0)}" r="${(0.6 + r() * 1.4).toFixed(1)}" fill="#fff" opacity="${(0.15 + r() * 0.35).toFixed(2)}"/>`);
  const k = (id) => {
    const u = UNIVERSES.find((x) => x.id === id),
      ul = universeLight(u, wp);
    return (0.25 + 0.6 * (ul.sum / ul.max)).toFixed(2);
  };
  // Château des Récits : tourelles et livres
  const tower = (x, y, h) => `<path d="M${x} ${y}v-${h}l9 -12l9 12v${h}z" />`;
  out.push(`<g fill="#b48cff" opacity="${k('recits')}">${tower(60, 300, 34)}${tower(380, 120, 26)}${tower(210, 80, 30)}<rect x="185" y="250" width="16" height="22" rx="2"/><rect x="203" y="246" width="14" height="26" rx="2"/></g>`);
  // Forges : enclume et étincelles
  out.push(`<g fill="#ff9f5a" opacity="${k('forges')}"><path d="M880 230h50l-8 10h-12v10h14v8h-46v-8h14v-10h-12z"/>${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${620 + i * 22}" cy="${90 + (i % 3) * 14}" r="3"/>`).join('')}<path d="M560 230l6 -14l6 14z"/></g>`);
  // Observatoire : étoiles et croissant de lune
  const star = (x, y, s) => `<path d="M${x} ${y - s}L${x + s * 0.3} ${y - s * 0.3}L${x + s} ${y}L${x + s * 0.3} ${y + s * 0.3}L${x} ${y + s}L${x - s * 0.3} ${y + s * 0.3}L${x - s} ${y}L${x - s * 0.3} ${y - s * 0.3}Z"/>`;
  out.push(`<g fill="#bfe0ff" opacity="${k('observatoire')}">${star(600, 760, 9)}${star(930, 540, 7)}${star(860, 820, 10)}${star(640, 520, 6)}<path d="M940 700a26 26 0 1 1 -22 -40a20 20 0 1 0 22 40z"/></g>`);
  // Jardin : buissons et fleurs
  const bush = (x, y) => `<circle cx="${x}" cy="${y}" r="12"/><circle cx="${x + 12}" cy="${y - 4}" r="14"/><circle cx="${x + 25}" cy="${y}" r="11"/>`;
  out.push(`<g fill="#7fd99a" opacity="${k('jardin')}">${bush(60, 860)}${bush(400, 760)}${bush(160, 600)}${[0, 1, 2].map((i) => `<circle cx="${300 + i * 26}" cy="${560 + (i % 2) * 10}" r="5" fill="#ffd1ec"/>`).join('')}</g>`);
  return out.join('');
}
export function worldMapHTML(state, wizard, { name = '' } = {}) {
  const statuses = academyRoomStatus(state),
    wp = worldProgress(state, statuses);
  const story = storyStatus(state.story, { ...wp, games: wp.gamesPlayed });
  const here = state.training.castle?.room;
  const herePos = !here || here === 'hub' || !spotOf(here) ? { x: HUB.x + 8, y: HUB.y + 4 } : spotOf(here);
  // chemins : école → salles sans prérequis ; prérequis → salle ; allées du jardin
  const edges = [];
  for (const r of ACADEMY_ROOMS) {
    const to = SPOTS[r.id];
    if (!r.requires.length) edges.push({ a: HUB, b: to, kind: 'path', on: wp.lights[r.id] >= 1, gold: wp.lights[r.id] >= 2 });
    for (const q of r.requires)
      edges.push({
        a: SPOTS[q],
        b: to,
        kind: 'req',
        on: wp.lights[q] >= 1,
        gold: wp.lights[q] >= 2 && wp.lights[r.id] >= 2,
      });
  }
  for (const g of GAME_SPOTS.slice(0, 3))
    edges.push({ a: HUB, b: g, kind: 'path', on: wp.games[g.id].light >= 1, gold: wp.games[g.id].light >= 2 });
  for (const [x, y] of GAME_EDGES) {
    const a = GAME_SPOTS.find((g) => g.id === x),
      b = GAME_SPOTS.find((g) => g.id === y);
    edges.push({ a, b, kind: 'garden', on: wp.games[y].light >= 1, gold: wp.games[y].light >= 2 });
  }
  const ring = CHAPTERS.length,
    doneCh = story.done;
  const ringArcs = Array.from({ length: ring }, (_, i) => {
    const a0 = (i / ring) * Math.PI * 2 - Math.PI / 2 + 0.05,
      a1 = ((i + 1) / ring) * Math.PI * 2 - Math.PI / 2 - 0.05,
      R = 62,
      cx = 500,
      cy = 450;
    return `<path d="M${cx + R * Math.cos(a0)} ${cy + R * Math.sin(a0)}A${R} ${R} 0 0 1 ${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)}" class="ring ${i < doneCh ? 'on' : ''}"/>`;
  }).join('');
  const svg = `<svg class="world-art" viewBox="0 0 1000 900" aria-hidden="true">
    <defs>
      <radialGradient id="wm-glow"><stop offset="0" stop-color="#ffe2a0" stop-opacity=".55"/><stop offset="1" stop-color="#ffe2a0" stop-opacity="0"/></radialGradient>
      <marker id="wm-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="context-stroke"/></marker>
    </defs>
    ${UNIVERSES.map((u) => {
      const ul = universeLight(u, wp),
        k = ul.sum / ul.max;
      return `<ellipse cx="${u.cx * 10}" cy="${u.cy * 9}" rx="${u.rx * 10}" ry="${u.ry * 9}" fill="${u.color}" fill-opacity="${(0.07 + 0.2 * k).toFixed(3)}" stroke="${u.color}" stroke-opacity="${(0.25 + 0.5 * k).toFixed(2)}" stroke-width="2" ${k >= 0.99 ? 'class="u-full"' : ''}/>`;
    }).join('')}
    ${decor(wp)}
    ${edges
      .map(
        (e) =>
          `<path d="${edgeD(e.a, e.b)}" class="edge ${e.kind} ${e.on ? 'on' : ''} ${e.gold ? 'gold' : ''}" ${e.kind === 'req' ? 'marker-end="url(#wm-arrow)"' : ''}/>`,
      )
      .join('')}
    <circle cx="500" cy="450" r="${90 + doneCh * 6}" fill="url(#wm-glow)"/>
    ${ringArcs}
    <g class="tower"><path d="M470 492V420L500 386L530 420V492Z"/><path d="M462 420H538M484 440h8v14h-8zM508 440h8v14h-8zM492 470h16v22h-16z" class="tw"/></g>
  </svg>`;
  const spot = (id, x, y, icon, label, light, extra = '', cls = '') =>
    `<button class="wm-spot l${light} ${cls}" style="left:${x}%;top:${y}%" data-spot="${id}" aria-label="${esc(label)}, ${esc(lightName(light))}${cls.includes('sealed') ? ', porte à ouvrir' : ''}"><span class="wm-icon" aria-hidden="true">${icon}</span><span class="wm-label">${esc(label)}</span><span class="wm-flames" aria-hidden="true">${[1, 2, 3].map((i) => `<i class="${light >= i ? 'f' + i : ''}"></i>`).join('')}</span>${extra}</button>`;
  const rooms = ACADEMY_ROOMS.map((r) => {
    const access = roomAccess(state, r.id, statuses),
      s = SPOTS[r.id];
    return spot(r.id, s.x, s.y, access.open ? r.icon : '🔒', r.name, wp.lights[r.id], '', access.open ? '' : 'sealed').replace('data-spot=', `data-hall="${r.id}" data-spot=`);
  }).join('');
  const games = GAME_SPOTS.map((g) => spot('game-' + g.id, g.x, g.y, g.icon, g.name, wp.games[g.id].light, '', 'game')).join('');
  const labels = UNIVERSES.map((u) => {
    const ul = universeLight(u, wp),
      pos = { recits: [23, 1.5], forges: [77, 1.5], observatoire: [77, 99.5], jardin: [23, 99.5] }[u.id];
    return `<div class="wm-universe ${pos[1] > 50 ? 'bottom' : ''}" style="left:${pos[0]}%;top:${pos[1]}%;--uc:${u.color}"><strong>${u.icon} ${esc(u.name)}</strong><small>${ul.lit} / ${ul.n} ${u.id === 'jardin' ? 'jeux dorés' : 'salles dorées'}</small></div>`;
  }).join('');
  const hint = story.next
    ? story.ready
      ? `<strong>Un nouveau chapitre t’attend !</strong> Touche la tour de l’école pour le lire.`
      : `<strong>Prochain chapitre, « ${esc(story.next.title)} » :</strong> il te faut encore ${esc(listFr(story.missing))}.`
    : '<strong>Tu as lu toute l’histoire.</strong> Le Fil d’Or brille grâce à toi. Continue à allumer les salles et à relever les défis !';
  return `<section class="world-map" aria-labelledby="world-title">
  <div class="castle-map-heading"><div><p class="eyebrow">${name ? esc(name) + ' · ' : ''}Le monde du Fil d’Or</p><h2 id="world-title">Où veux-tu aller ?</h2></div><button class="quiet" id="castle-list-toggle" aria-expanded="false">Voir les lieux en liste</button></div>
  <p class="castle-map-legend"><span>○ à découvrir</span><span>🔹 en éveil</span><span>🔸 illuminée</span><span>🌟 étoilée</span><span>🔒 porte à ouvrir</span></p>
  <div class="world-scroll castle-map-scroll"><div class="world-plan">
    ${svg}${labels}${rooms}${games}
    <button class="wm-hub ${story.ready ? 'ready' : ''}" data-spot="hub" style="left:50%;top:50%" aria-label="L’École du Fil d’Or : l’histoire, ${doneCh} chapitre${doneCh > 1 ? 's' : ''} sur ${ring}${story.ready ? ', nouveau chapitre' : ''}"><span class="wm-hub-badge">${story.ready ? '📜 Nouveau !' : `${doneCh} / ${ring}`}</span><span class="wm-label">École du Fil d’Or</span></button>
    <span class="wm-traveler" aria-hidden="true" style="left:${herePos.x}%;top:${herePos.y}%">${apprentice(wizard.outfit?.level || wizard.level)}</span>
  </div></div>
  <div class="wm-pistache" role="status"><span aria-hidden="true">🦉</span><p>${hint}</p></div>
  <div id="castle-room-list" class="castle-room-list" hidden>
    <button class="activity-card" data-list-spot="hub"><span><strong>📜 L’histoire du Fil d’Or</strong><small>${doneCh} chapitre${doneCh > 1 ? 's' : ''} sur ${ring}${story.ready ? ' · nouveau chapitre' : ''}</small></span><span aria-hidden="true">↗</span></button>
    ${UNIVERSES.map(
      (u) =>
        `<p class="wm-list-head">${u.icon} ${esc(u.name)}</p>` +
        (u.id === 'jardin'
          ? GAME_SPOTS.map((g) => `<button class="activity-card" data-list-spot="game-${g.id}"><span><strong>${esc(g.name)}</strong><small>${FLAME[wp.games[g.id].light]} ${esc(lightName(wp.games[g.id].light))} · ${wp.games[g.id].n} / ${wp.games[g.id].total} énigmes</small></span><span aria-hidden="true">↗</span></button>`).join('')
          : ACADEMY_ROOMS.filter((r) => SPOTS[r.id].u === u.id)
              .map((r) => `<button class="activity-card" data-list-spot="${r.id}" data-list-hall="${r.id}"><span><strong>${esc(r.name)}</strong><small>${roomAccess(state, r.id, statuses).open ? FLAME[wp.lights[r.id]] + ' ' + esc(lightName(wp.lights[r.id])) : '🔒 Porte à ouvrir'} · ${esc(r.subject)}</small></span><span aria-hidden="true">↗</span></button>`)
              .join('')),
    ).join('')}
  </div>
  <p class="castle-map-caption">Une flamme bleue : tu as essayé. Dorée : tu as réussi plusieurs jours de suite. Étoilée : tu as aussi réussi une étape plus difficile. Tes lumières restent allumées.</p>
</section>`;
}
export function listFr(a) {
  return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' et ' + a.at(-1);
}
// déplacement de l'apprentie jusqu'au lieu choisi, puis ouverture
export function bindWorldMap(main, { onRoom, onGame, onStory, motion = true, onMove }) {
  const traveler = main.querySelector('.wm-traveler');
  const go = (id) => {
    const open = () =>
      id === 'hub' ? onStory() : id.startsWith('game-') ? onGame(id.slice(5)) : onRoom(id);
    const p = id === 'hub' ? { x: HUB.x + 8, y: HUB.y + 4 } : spotOf(id);
    onMove?.(id);
    if (!traveler || !p || !motion || typeof globalThis.requestAnimationFrame !== 'function') return open();
    traveler.style.left = p.x + '%';
    traveler.style.top = p.y + '%';
    traveler.classList.add('walking');
    main.querySelectorAll('.wm-spot,.wm-hub').forEach((b) => (b.disabled = true));
    setTimeout(open, 750);
  };
  main.querySelectorAll('[data-spot]').forEach((b) => (b.onclick = () => go(b.dataset.spot)));
  main.querySelectorAll('[data-list-spot]').forEach((b) => (b.onclick = () => go(b.dataset.listSpot)));
  main.querySelector('#castle-list-toggle').onclick = () => {
    const list = main.querySelector('#castle-room-list'),
      scroll = main.querySelector('.world-scroll');
    list.hidden = !list.hidden;
    scroll.hidden = !list.hidden;
    const t = main.querySelector('#castle-list-toggle');
    t.setAttribute('aria-expanded', String(!list.hidden));
    t.textContent = list.hidden ? 'Voir les lieux en liste' : 'Revenir à la carte';
  };
  // centrer la carte sur l'apprentie sur petit écran
  const scroll = main.querySelector('.world-scroll');
  if (scroll && traveler && scroll.scrollWidth > scroll.clientWidth)
    scroll.scrollLeft = Math.max(0, (parseFloat(traveler.style.left) / 100) * scroll.scrollWidth - scroll.clientWidth / 2);
}
