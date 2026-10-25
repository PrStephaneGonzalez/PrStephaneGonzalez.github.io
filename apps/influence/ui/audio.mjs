// Small synthesized sounds (Web Audio, no audio files). Sound is never required
// to understand the game: every sound mirrors something visible on screen.
const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760];

export function createAudio(isEnabled) {
  let ctx = null, master = null, resuming = null;

  function ensure() {
    if (ctx && ctx.state !== 'closed') return ctx;
    ctx = null; resuming = null;
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return null;
    try {
      // Safari exposes this to route game audio as playback (including silent mode).
      try { if (globalThis.navigator?.audioSession) globalThis.navigator.audioSession.type = 'playback'; } catch {}
      ctx = new AC({ latencyHint: 'interactive' });
      master = ctx.createGain();
      master.gain.value = .55;
      master.connect(ctx.destination);
    } catch { ctx = null; }
    return ctx;
  }

  /** Call from a user gesture; browsers keep audio suspended until then. */
  function unlock() {
    if (!isEnabled()) return Promise.resolve(false);
    const c = ensure();
    if (!c) return Promise.resolve(false);
    // Start a silent source INSIDE the click/touchend gesture, before awaiting.
    // This also primes the output on mobile WebKit.
    try {
      const buffer = c.createBuffer(1, 1, c.sampleRate);
      const source = c.createBufferSource();
      source.buffer = buffer;
      source.connect(master);
      source.onended = () => source.disconnect();
      source.start(0);
    } catch {}
    if (c.state === 'running') return Promise.resolve(true);
    if (!resuming) {
      try {
        resuming = Promise.resolve(c.resume()).then(() => c.state === 'running', () => false)
          .finally(() => { resuming = null; });
      } catch { return Promise.resolve(false); }
    }
    return resuming;
  }

  function tone(freq, delay, { peak = .15, length = .5, type = 'sine', partials = [1, 2], glide = 0 } = {}) {
    const c = ensure();
    if (!c || !isEnabled()) return;
    const play = () => {
    if (!isEnabled() || c.state !== 'running') return;
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
    };
    if (c.state === 'running') play();
    else unlock().then(ready => { if (ready) play(); });
  }

  return {
    unlock,
    /** One note per falling piece, climbing a pentatonic scale. The opponent is an octave lower. */
    drop(order, delay = 0, { opponent = false } = {}) {
      const f = PENTATONIC[Math.min(order, PENTATONIC.length - 1)];
      if (opponent) tone(f / 2, delay, { type: 'triangle', peak: .2, length: .55, partials: [1, 2.0] });
      else {
        tone(f, delay, { peak: .18, length: .38, partials: [1, 2, 3] });
        tone(f / 2, delay, { peak: .09, length: .09, partials: [1], glide: .7 });
      }
    },
    /** Soft tap when a piece is chosen (player or opponent). */
    tap({ opponent = false } = {}) {
      tone(opponent ? 330 : 660, 0, { type: 'triangle', peak: .12, length: .14, partials: [1], glide: .8 });
    },
    /** Victory: a quick rising arpeggio, a warm major chord, then a few sparkles. */
    win() {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 110, { peak: .17, length: .45 }));
      [523.25, 659.25, 783.99, 1046.5].forEach(f => tone(f, 470, { peak: .13, length: 1.3, partials: [1, 2.01, 3.02] }));
      [1567.98, 2093, 1760, 2349.32].forEach((f, i) => tone(f, 650 + i * 130, { peak: .07, length: .45, partials: [1] }));
    },
    /** Defeat: soft and kind, a slow falling phrase that ends on a gentle slide. Never harsh. */
    lose() {
      [[392, 0], [349.23, 260], [293.66, 520]].forEach(([f, d]) => tone(f, d, { type: 'triangle', peak: .26, length: .55, partials: [1, 2] }));
      tone(261.63, 800, { type: 'triangle', peak: .28, length: 1.1, partials: [1, 2], glide: .88 });
    },
    draw() { [523.25, 659.25, 523.25].forEach((f, i) => tone(f, i * 190, { peak: .13, length: .5 })); },
  };
}
