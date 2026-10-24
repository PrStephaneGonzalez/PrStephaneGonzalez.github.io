// Sons et phrases de retour après une réponse.
// - Sons synthétisés (aucun fichier à charger, fonctionne hors ligne) : timbre de cloche/marimba,
//   clairement audibles mais doux. L'erreur a un son plus grave et tendre, jamais agressif.
// - Phrases : quand c'est juste, une félicitation ; quand ce n'est pas juste, une phrase qui dit
//   franchement que la réponse n'est pas la bonne, tout en encourageant.

export const RIGHT_LINES = [
  'Bravo, c’est la bonne réponse !',
  'Exact ! Ta magie fonctionne.',
  'C’est juste, bien joué !',
  'Parfait, un brin de plus pour le Fil d’Or !',
  'Oui, c’est ça ! Beau travail.',
  'Réussi ! Tu lis bien dans les étoiles.',
  'Excellent, tu as trouvé !',
  'Juste ! Le château s’illumine un peu plus.',
];

export const WRONG_LINES = [
  'Ce n’est pas la bonne réponse, mais chaque essai fait grandir ta magie.',
  'Pas cette fois : ce n’est pas la bonne réponse. Regarde l’explication, tu vas y arriver !',
  'Ce n’est pas ça, mais se tromper fait partie de l’apprentissage. Courage !',
  'Ce n’est pas la bonne réponse. Une magicienne apprend de chaque erreur !',
  'Raté pour celle-ci, mais ça ne fait rien : regarde pourquoi et tu la réussiras la prochaine fois.',
  'Ce n’est pas correct, mais tu as bien essayé. Continue, tu progresses !',
  'Ce n’est pas la bonne réponse cette fois-ci. Prends le temps de comprendre : tu en es capable.',
  'Pas tout à fait : ce n’est pas la bonne réponse. Chaque erreur t’apprend quelque chose.',
];

const cursor = { right: Math.floor(Math.random() * RIGHT_LINES.length), wrong: Math.floor(Math.random() * WRONG_LINES.length) };

export function answerLine(correct) {
  const list = correct ? RIGHT_LINES : WRONG_LINES;
  const key = correct ? 'right' : 'wrong';
  const line = list[cursor[key] % list.length];
  cursor[key] += 1;
  return line;
}

// ---------------------------------------------------------------- sons
let ctx = null;
let master = null;

function ensureAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    ctx = new AC();
    const compressor = ctx.createDynamicsCompressor();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(compressor);
    compressor.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

// Une note de « cloche » : fondamentale + deux harmoniques qui s'éteignent à des vitesses différentes.
function bell(freq, start, { peak = 0.34, length = 0.9, type = 'sine', partials = [1, 2, 3.01] } = {}) {
  partials.forEach((ratio, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const level = peak / (1 + i * 1.8);
    const decay = length / (1 + i * 0.9);
    osc.type = i === 0 ? type : 'sine';
    osc.frequency.value = freq * ratio;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(level, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + decay);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + decay + 0.05);
  });
}

const NOTE = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, C6: 1046.5, E6: 1318.5,
};

const SOUNDS = {
  // Réponse juste : petit arpège ascendant clair (do-mi-sol-do).
  success(t) {
    [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((f, i) =>
      bell(f, t + i * 0.085, { peak: 0.36, length: i === 3 ? 1.1 : 0.55 }),
    );
    bell(NOTE.G5 / 2, t, { peak: 0.14, length: 0.9, partials: [1] });
  },
  // Réponse à revoir : deux notes douces qui redescendent, ton chaleureux (pas de buzzer).
  retry(t) {
    bell(NOTE.G4, t, { peak: 0.3, length: 0.55, type: 'triangle', partials: [1, 2] });
    bell(NOTE.E4, t + 0.16, { peak: 0.3, length: 0.75, type: 'triangle', partials: [1, 2] });
  },
  // Salle qui s'éclaire / flamme gagnée : scintillement magique plus long.
  unlock(t) {
    [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6, NOTE.E6].forEach((f, i) =>
      bell(f, t + i * 0.11, { peak: 0.34, length: i === 4 ? 1.6 : 0.7 }),
    );
    bell(NOTE.C6, t + 0.62, { peak: 0.16, length: 1.2, partials: [1, 2.76] });
  },
};

let lastUnlock = 0;

// `kind` : 'success' | 'retry' | 'unlock'. Retourne vrai si un son a été lancé.
export function playSound(kind, enabled = true) {
  if (!enabled || !SOUNDS[kind]) return false;
  // Un son de déblocage joué juste avant prend le pas sur une réussite simultanée.
  if (kind === 'unlock') lastUnlock = performance.now();
  else if (performance.now() - lastUnlock < 600) return false;
  try {
    if (!ensureAudio()) return false;
    SOUNDS[kind](ctx.currentTime + 0.01);
    return true;
  } catch {
    return false;
  }
}

export function suspendAudio() {
  try {
    if (ctx && ctx.state === 'running') void ctx.suspend();
  } catch {}
}

// ---------------------------------------------------------------- bandeau de phrase
let bannerTimer;

export function showAnswerLine(correct, line = answerLine(correct)) {
  let el = document.querySelector('#answer-banner');
  if (!el) {
    el = document.createElement('div');
    el.id = 'answer-banner';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.append(el);
  }
  el.className = 'answer-banner ' + (correct ? 'right' : 'wrong');
  el.textContent = '';
  const icon = document.createElement('span');
  icon.className = 'answer-banner-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = correct ? '✦' : '✧';
  const text = document.createElement('span');
  text.textContent = line;
  el.append(icon, text);
  // relance l'animation d'entrée
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => el.classList.remove('show'), correct ? 3200 : 5200);
  return line;
}

export function hideAnswerLine() {
  clearTimeout(bannerTimer);
  document.querySelector('#answer-banner')?.classList.remove('show');
}
