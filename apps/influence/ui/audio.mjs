// Small synthesized sounds (Web Audio, no audio files). Sound is never required
// to understand the game: every sound mirrors something visible on screen.
const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760];

export function createAudio(isEnabled) {
  let ctx = null, master = null;

  function ensure() {
    if (ctx) return ctx;
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = .55;
      master.connect(ctx.destination);
    } catch { ctx = null; }
    return ctx;
  }

  /** Call from a user gesture; browsers keep audio suspended until then. */
  function unlock() {
    const c = ensure();
    if (c && c.state === 'suspended') c.resume().catch(() => {});
  }

  function tone(freq, delay, { peak = .15, length = .5, type = 'sine', partials = [1, 2.01], glide = 0 } = {}) {
    const c = ensure();
    if (!c || !isEnabled()) return;
    try {
      const start = c.currentTime + Math.max(0, delay) / 1000 + .01;
      partials.forEach((ratio, i) => {
        const osc = c.createOscillator(), gain = c.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq * ratio, start);
        if (glide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * ratio * glide), start + length);
        const level = peak / (i + 1) ** 1.6;
        gain.gain.setValueAtTime(.0001, start);
        gain.gain.exponentialRampToValueAtTime(level, start + .008);
        gain.gain.exponentialRampToValueAtTime(.0001, start + length / (1 + i * .6));
        osc.connect(gain).connect(master);
        osc.start(start);
        osc.stop(start + length + .05);
      });
    } catch { /* Audio is a bonus; never break the game for it. */ }
  }

  return {
    unlock,
    /** One note per falling piece, climbing a pentatonic scale. The opponent is an octave lower. */
    drop(order, delay = 0, { opponent = false } = {}) {
      const f = PENTATONIC[Math.min(order, PENTATONIC.length - 1)];
      if (opponent) tone(f / 2, delay, { type: 'triangle', peak: .2, length: .55, partials: [1, 2.0] });
      else tone(f, delay, { peak: .15, length: .5 });
    },
    /** Soft tap when a piece is chosen (player or opponent). */
    tap({ opponent = false } = {}) {
      tone(opponent ? 330 : 660, 0, { type: 'triangle', peak: .12, length: .14, partials: [1], glide: .8 });
    },
    win() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 120, { peak: .17, length: .7 })); },
    lose() { [392, 329.63, 261.63].forEach((f, i) => tone(f, i * 190, { type: 'triangle', peak: .15, length: .7, partials: [1, 2] })); },
    draw() { [523.25, 523.25].forEach((f, i) => tone(f, i * 200, { peak: .13, length: .5 })); },
  };
}
