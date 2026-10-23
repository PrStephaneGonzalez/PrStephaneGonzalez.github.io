// Original code-native illustrations; no remote assets, fonts or tracking.
export function castle() {
  return `<svg class="castle-art" viewBox="0 0 650 430" aria-label="Un château aux fenêtres dorées, au-dessus d’un jardin et d’un lac" role="img"><defs><linearGradient id="hill" x2="0" y2="1"><stop stop-color="#406f65"/><stop offset="1" stop-color="#193c42"/></linearGradient><linearGradient id="wall" x2="1" y2="1"><stop stop-color="#7b9f8a"/><stop offset="1" stop-color="#345e5b"/></linearGradient><radialGradient id="halo"><stop stop-color="#e8c983" stop-opacity=".17"/><stop offset="1" stop-color="#e8c983" stop-opacity="0"/></radialGradient><linearGradient id="roof" x2="1" y2="1"><stop stop-color="#24414c"/><stop offset="1" stop-color="#456570"/></linearGradient></defs><circle cx="361" cy="196" r="210" fill="url(#halo)"/><circle cx="493" cy="66" r="30" fill="#f0d5a0"/><circle cx="504" cy="56" r="28" fill="#23474b"/><g fill="#e5cc91">${[
    [128, 92],
    [209, 44],
    [556, 146],
    [441, 28],
    [83, 176],
    [584, 61],
    [306, 68],
    [540, 228],
  ]
    .map(
      ([x, y]) =>
        `<path d="M${x - 3} ${y}h6M${x} ${y - 3}v6" stroke="#e5cc91" stroke-width="1.2"/>`,
    )
    .join(
      '',
    )}</g><ellipse cx="357" cy="371" rx="240" ry="29" fill="#102c35"/><path d="M102 344Q175 237 265 290Q350 191 468 290Q541 276 594 350Z" fill="#244c49"/><path d="M89 358Q160 276 299 317Q415 253 579 349Q455 393 279 387Z" fill="url(#hill)"/><g fill="url(#wall)" stroke="#9db29a" stroke-width="1"><path d="M242 177h181v155H242Z"/><path d="M204 154h58v177h-58Z"/><path d="M405 133h58v194h-58Z"/><path d="M306 112h54v216h-54Z"/><path d="M272 207h125v121H272Z"/></g><g fill="url(#roof)" stroke="#8da292"><path d="M192 154l41-67 41 67Z"/><path d="M393 133l41-71 41 71Z"/><path d="M293 112l40-81 40 81Z"/><path d="M264 206l71-59 70 59Z"/></g><g fill="#f2d292">${[
    [224, 184],
    [224, 228],
    [224, 273],
    [323, 134],
    [323, 175],
    [424, 163],
    [424, 207],
    [424, 253],
    [286, 232],
    [367, 232],
  ]
    .map(([x, y]) => `<path d="M${x} ${y + 15}v-10a6 6 0 0 1 12 0v10Z"/>`)
    .join(
      '',
    )}<path d="M318 329v-33a17 17 0 0 1 34 0v33Z"/></g><g stroke="#bea16d" stroke-width="2"><path d="M233 88V64m201-2V42m-101-11V12"/></g><g fill="#d5b279"><path d="M233 64l24 5-24 9Zm201-22 24 5-24 9Zm-101-30 27 6-27 9Z"/></g><path d="M335 330Q309 356 359 365T438 398" fill="none" stroke="#dab16b" stroke-width="5" stroke-linecap="round"/><path d="M335 330Q309 356 359 365T438 398" fill="none" stroke="#ffe2a3" stroke-width="1.5" stroke-linecap="round"/><path d="M90 377Q158 348 208 372T307 408H83Z" fill="#3d7775" opacity=".65"/><g fill="#31564f" stroke="#6f9580">${[
    [173, 303, 1],
    [501, 283, 1.2],
    [536, 309, 0.8],
    [125, 327, 0.7],
  ]
    .map(
      ([x, y, s]) =>
        `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 20V-45"/><path d="M0-66-23-22h12l-18 29h57L12-22h12Z"/></g>`,
    )
    .join('')}</g><g fill="#e2c78b">${[
    [202, 337],
    [485, 336],
    [276, 366],
    [414, 352],
    [155, 354],
    [464, 378],
  ]
    .map(
      ([x, y]) =>
        `<circle cx="${x}" cy="${y}" r="2"/><circle cx="${x}" cy="${y}" r="7" opacity=".1"/>`,
    )
    .join('')}</g></svg>`;
}
export const ROOMS = [
  {
    name: 'Le jardin des brumes',
    subtitle: 'Des lucioles dans les fougères',
    color: '#2b6258',
    friend: 'Mousse',
    animal: 'fox',
    story:
      'Sous les grandes fougères, Mousse le renard rangeait ses cartes. « Il y a plusieurs chemins vers le lac », dit-il. Il choisit le sentier des mûres. Les autres attendraient une autre promenade.',
  },
  {
    name: 'L’atelier des aurores',
    subtitle: 'Un dragon et des couleurs',
    color: '#514266',
    friend: 'Brindille',
    animal: 'dragon',
    story:
      'Brindille avait inventé une couleur qui ne portait pas encore de nom. Elle en peignit une seule aile de son cerf-volant. « Je vais voir comment il vole », annonça-t-elle, avant de courir vers la colline.',
  },
  {
    name: 'La bibliothèque lunaire',
    subtitle: 'Les secrets d’une chouette',
    color: '#344b72',
    friend: 'Plume',
    animal: 'owl',
    story:
      'Plume trouva une carte sans légende. Elle ne savait pas encore à quoi servait la petite île. Elle glissa la carte dans sa poche et partit regarder le vrai lac, par la fenêtre de l’observatoire.',
  },
  {
    name: 'Le palais des marées',
    subtitle: 'Une amie sous les étoiles',
    color: '#286577',
    friend: 'Nacre',
    animal: 'otter',
    story:
      'Nacre collectionnait les histoires, pas les coquillages. Ce soir-là, elle raconta comment une minuscule crevette avait découvert un courant nouveau. Le lendemain, les poissons vinrent lui demander la suite.',
  },
  {
    name: 'L’observatoire des vents',
    subtitle: 'Le ciel appartient aux curieux',
    color: '#625838',
    friend: 'Orion',
    animal: 'deer',
    story:
      'Orion regarda les nuages passer devant la lune. Il n’avait pas besoin de voir toutes les étoiles pour aimer le ciel. Il déroula sa couverture et invita ses amis à partager le pique-nique.',
  },
];
export function animal(kind, muted = false) {
  const c = muted ? '#718d87' : '#d4a36c',
    eye = '#14343b';
  let body = '';
  if (kind === 'fox')
    body = `<path d="M40 93Q-3 72 24 44Q17 80 52 71" fill="#bb835c"/><ellipse cx="78" cy="82" rx="31" ry="24" fill="${c}"/><path d="m51 45-5-29 25 18m19-1 24-19-5 34" fill="${c}"/><path d="M45 43Q80 18 113 43L99 74H61Z" fill="${c}"/><path d="m49 49 28 13 32-15-12 26H65Z" fill="#f4dfb3"/><circle cx="66" cy="47" r="3" fill="${eye}"/><circle cx="94" cy="47" r="3" fill="${eye}"/><path d="m74 60 7 8 7-8Z" fill="${eye}"/>`;
  if (kind === 'owl')
    body = `<ellipse cx="80" cy="70" rx="38" ry="43" fill="#aaab8b"/><path d="m44 45-3-26 30 15m17 0 30-15-4 28" fill="#aaab8b"/><ellipse cx="64" cy="57" rx="18" ry="21" fill="#f4dfb3"/><ellipse cx="95" cy="57" rx="18" ry="21" fill="#f4dfb3"/><circle cx="64" cy="57" r="6" fill="${eye}"/><circle cx="95" cy="57" r="6" fill="${eye}"/><path d="m75 70 5 10 5-10Z" fill="#d49f57"/><path d="M47 74q15 6 13 30m52-30q-15 6-13 30" fill="none" stroke="#657c6f" stroke-width="5"/>`;
  if (kind === 'dragon')
    body = `<path d="M52 67 20 29l5 46 29 16m53-24 30-38-3 47-27 15" fill="#a49ac7"/><ellipse cx="80" cy="82" rx="32" ry="28" fill="#81b3a0"/><path d="M60 42 57 22l17 14m14 0 17-14-2 25" fill="#c9b178"/><rect x="52" y="34" width="57" height="43" rx="22" fill="#91c2a9"/><circle cx="68" cy="50" r="3" fill="${eye}"/><circle cx="93" cy="50" r="3" fill="${eye}"/><path d="M70 64q11 6 21 0" fill="none" stroke="#31584d" stroke-width="2"/><ellipse cx="81" cy="86" rx="17" ry="20" fill="#dfd6a2"/>`;
  if (kind === 'otter')
    body = `<path d="M49 98Q3 111 26 73" fill="none" stroke="#ba9b80" stroke-width="17" stroke-linecap="round"/><ellipse cx="83" cy="84" rx="29" ry="29" fill="#bc9f87"/><circle cx="57" cy="36" r="10" fill="#bc9f87"/><circle cx="103" cy="36" r="10" fill="#bc9f87"/><ellipse cx="80" cy="53" rx="34" ry="29" fill="#c9ae94"/><ellipse cx="80" cy="66" rx="22" ry="13" fill="#ead8b7"/><circle cx="67" cy="49" r="3" fill="${eye}"/><circle cx="94" cy="49" r="3" fill="${eye}"/><ellipse cx="81" cy="59" rx="5" ry="3" fill="${eye}"/><path d="M63 87q20 15 35 0" fill="none" stroke="#765c50" stroke-width="5"/>`;
  if (kind === 'deer')
    body = `<path d="M67 31 52 12m3 5-12 1m15 6-2-15m37 23 15-20m-4 6 13-1m-17 8 3-16" stroke="#dbc28f" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="80" cy="84" rx="28" ry="26" fill="${c}"/><path d="M60 37 39 28q-1 23 24 22m33-12 24-10q2 21-23 24" fill="${c}"/><path d="M56 44q24-23 47 0L95 76H66Z" fill="${c}"/><ellipse cx="80" cy="69" rx="15" ry="11" fill="#ead8b7"/><circle cx="67" cy="49" r="3" fill="${eye}"/><circle cx="93" cy="49" r="3" fill="${eye}"/><ellipse cx="80" cy="65" rx="5" ry="3" fill="${eye}"/>`;
  return `<svg viewBox="0 0 160 130" role="img" aria-label="${{ fox: 'Renard', owl: 'Chouette', dragon: 'Dragon', otter: 'Loutre', deer: 'Cerf' }[kind]}"><ellipse cx="80" cy="116" rx="53" ry="7" fill="#102e36" opacity=".35"/>${body}<g fill="#eac980"><path d="m126 19 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/><circle cx="24" cy="92" r="2"/></g></svg>`;
}
