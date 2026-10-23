export const INTRO_MESSAGES = [
  'Une pensée inquiétante n’est pas forcément une information fiable.',
  'Une pensée n’est pas un ordre.',
  'On peut poursuivre une activité même sans être sûr de tout.',
  'Il n’est pas toujours nécessaire de vérifier ou de recommencer.',
  'Le courage n’exige pas l’absence de peur.',
  'On peut continuer même avec une sensation de « pas tout à fait fini ».',
];
export const SUCCESS_MESSAGES = [
  'Tu as trouvé une façon de faire. Belle découverte !',
  'Tes idées ont fait avancer l’aventure.',
  'Une énigme explorée, une nouvelle découverte.',
  'Bravo pour cette recherche ! Tu choisis la suite.',
  'Tu as fait voyager la lumière à ta façon.',
  'Une belle trouvaille à partager avec les gardiens.',
  'Tu as essayé des idées et trouvé un passage.',
  'Le château a une nouvelle histoire grâce à toi.',
];
// No replay control, no timers, no consequence for skipping. At most two per session.
export function takeIntro(state, id, sessionCount) {
  if (state.seenStarts.includes(id)) return null;
  state.seenStarts.push(id);
  if (!state.settings.messages || sessionCount >= 2 || (state.seenStarts.length - 1) % 3 !== 0)
    return null;
  const text = INTRO_MESSAGES[state.messageCursor % INTRO_MESSAGES.length];
  state.messageCursor++;
  return text;
}
export function successMessage(state, first = true) {
  return first
    ? SUCCESS_MESSAGES[(state.completed.length - 1) % SUCCESS_MESSAGES.length]
    : 'Tu peux explorer un autre endroit, ou garder cette découverte pour aujourd’hui.';
}
