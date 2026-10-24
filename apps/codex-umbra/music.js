/* Musique d'ambiance générée en direct (aucun fichier) : nappes lentes en ré mineur,
   cloches lointaines, réverbération. Pas de mélodie à suivre : elle doit accompagner
   la réflexion, pas la capter. Quatre humeurs :
   - explore : la carte et les régions ;
   - focus   : les épreuves, plus sombre, plus feutré, très peu de cloches ;
   - boss    : pulsation grave et accords plus tendus ;
   - arena   : léger battement régulier pour les automatismes chronométrés. */
'use strict';
(function () {
  const D2 = 73.42;
  const hz = (semi, base = D2) => base * Math.pow(2, semi / 12);
  // accords en demi-tons au-dessus de ré
  const CH = {
    i: [0, 3, 7, 14],
    VI: [-4, 0, 3, 10],
    iv: [5, 8, 12, 15],
    v: [7, 10, 14, 17],
    III: [3, 7, 10, 14],
    bII: [1, 5, 8, 12],
    sus: [0, 5, 7, 12],
  };
  const MODES = {
    explore: { prog: ['i', 'VI', 'iv', 'i', 'III', 'VI', 'v', 'i'], len: 13, cut: 900, vol: 1, bells: [7, 14], pulse: 0, tick: 0 },
    focus: { prog: ['i', 'VI', 'i', 'iv', 'sus', 'i', 'VI', 'v'], len: 17, cut: 560, vol: 0.8, bells: [16, 30], pulse: 0, tick: 0 },
    boss: { prog: ['i', 'bII', 'i', 'v', 'i', 'bII', 'iv', 'v'], len: 6.5, cut: 1100, vol: 1, bells: [9, 16], pulse: 0.8, tick: 0 },
    arena: { prog: ['i', 'iv', 'VI', 'v'], len: 8, cut: 800, vol: 0.85, bells: [12, 20], pulse: 0, tick: 0.6 },
  };
  const PENTA = [0, 3, 5, 7, 10, 12, 15, 17];
  let A = null,
    bus = null,
    pad = null,
    rev = null,
    on = false,
    mode = 'explore',
    timer = null,
    nextChord = 0,
    nextBell = 0,
    nextBeat = 0,
    step = 0;

  function level() {
    const v = CU.settings.musicVol ?? 0.5;
    return 0.06 + 0.22 * v;
  }
  function init() {
    if (A) return true;
    const au = CU.sfx.audio();
    if (!au) return false;
    A = au.ctx;
    bus = A.createGain();
    bus.gain.value = 0.0001;
    bus.connect(au.master);
    pad = A.createBiquadFilter();
    pad.type = 'lowpass';
    pad.frequency.value = MODES[mode].cut;
    pad.Q.value = 0.5;
    // réverbération : réponse impulsionnelle de bruit décroissant
    rev = A.createConvolver();
    const len = Math.floor(A.sampleRate * 4.2),
      ir = A.createBuffer(2, len, A.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    rev.buffer = ir;
    const wet = A.createGain();
    wet.gain.value = 0.55;
    const dry = A.createGain();
    dry.gain.value = 0.6;
    pad.connect(dry);
    pad.connect(rev);
    rev.connect(wet);
    dry.connect(bus);
    wet.connect(bus);
    document.addEventListener('visibilitychange', () => {
      if (!A) return;
      if (document.hidden) A.suspend && A.suspend();
      else A.resume && A.resume();
    });
    return true;
  }
  // une voix de nappe : deux oscillateurs légèrement désaccordés, enveloppe très lente
  function voice(f, t0, dur, vol) {
    const g = A.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(4, dur * 0.35));
    g.gain.setValueAtTime(vol, t0 + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 4);
    g.connect(pad);
    for (const [type, det] of [
      ['triangle', 0],
      ['sawtooth', 6],
    ]) {
      const o = A.createOscillator();
      o.type = type;
      o.frequency.value = f;
      o.detune.value = det;
      const og = A.createGain();
      og.gain.value = type === 'sawtooth' ? 0.35 : 1;
      o.connect(og);
      og.connect(g);
      o.start(t0);
      o.stop(t0 + dur + 4.2);
    }
  }
  function chord(t0) {
    const M = MODES[mode];
    const name = M.prog[step % M.prog.length];
    step++;
    const notes = CH[name];
    const dur = M.len + 2;
    voice(hz(notes[0] % 12 < 0 ? notes[0] + 12 : notes[0] % 12), t0, dur, 0.09 * M.vol); // basse
    notes.forEach((s, i) => voice(hz(s + 12), t0 + i * 0.25, dur, (i === 3 ? 0.025 : 0.04) * M.vol));
  }
  function bell(t0) {
    const s = PENTA[Math.floor(Math.random() * PENTA.length)] + 36;
    const f = hz(s);
    const g = A.createGain();
    const v = 0.035 * MODES[mode].vol;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 5);
    g.connect(rev);
    const g2 = A.createGain();
    g2.gain.value = 0.25;
    g.connect(g2);
    g2.connect(bus);
    for (const [k, a] of [
      [1, 1],
      [2.01, 0.35],
      [3.02, 0.15],
    ]) {
      const o = A.createOscillator(),
        og = A.createGain();
      o.frequency.value = f * k;
      og.gain.value = a;
      o.connect(og);
      og.connect(g);
      o.start(t0);
      o.stop(t0 + 5.1);
    }
  }
  function thump(t0, v) {
    const o = A.createOscillator(),
      g = A.createGain();
    o.frequency.setValueAtTime(70, t0);
    o.frequency.exponentialRampToValueAtTime(38, t0 + 0.35);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
    o.connect(g);
    g.connect(bus);
    o.start(t0);
    o.stop(t0 + 0.55);
  }
  function tick(t0, v) {
    const len = Math.floor(A.sampleRate * 0.05),
      b = A.createBuffer(1, len, A.sampleRate),
      d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
    const s = A.createBufferSource(),
      f = A.createBiquadFilter(),
      g = A.createGain();
    f.type = 'bandpass';
    f.frequency.value = 3200;
    g.gain.value = v;
    s.buffer = b;
    s.connect(f);
    f.connect(g);
    g.connect(rev);
    s.start(t0);
  }
  function schedule() {
    if (!on || !A) return;
    const now = A.currentTime,
      M = MODES[mode];
    if (now + 0.6 >= nextChord) {
      chord(Math.max(now + 0.05, nextChord));
      nextChord = Math.max(now, nextChord) + M.len;
    }
    if (now + 0.3 >= nextBell) {
      bell(Math.max(now + 0.05, nextBell));
      nextBell = Math.max(now, nextBell) + M.bells[0] + Math.random() * (M.bells[1] - M.bells[0]);
    }
    if ((M.pulse || M.tick) && now + 0.3 >= nextBeat) {
      const t = Math.max(now + 0.02, nextBeat);
      if (M.pulse) thump(t, 0.16 * M.pulse);
      if (M.tick) tick(t, 0.05 * M.tick);
      nextBeat = t + (M.pulse ? 0.86 : 0.75);
    }
  }

  CU.music = {
    // démarre (si la musique est activée) ; à appeler après un geste de l'utilisateur
    start() {
      if (CU.settings.musicOn === false || on) return;
      if (!init()) return;
      on = true;
      const t = A.currentTime;
      bus.gain.cancelScheduledValues(t);
      bus.gain.setValueAtTime(Math.max(0.0001, bus.gain.value), t);
      bus.gain.exponentialRampToValueAtTime(level(), t + 4);
      nextChord = t + 0.1;
      nextBell = t + 5;
      nextBeat = t + 0.5;
      clearInterval(timer);
      timer = setInterval(schedule, 200);
      schedule();
    },
    stop() {
      if (!on || !A) return;
      on = false;
      const t = A.currentTime;
      bus.gain.cancelScheduledValues(t);
      bus.gain.setValueAtTime(Math.max(0.0001, bus.gain.value), t);
      bus.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
      clearInterval(timer);
    },
    enable(x) {
      CU.settings.musicOn = !!x;
      x ? this.start() : this.stop();
    },
    volume(v) {
      CU.settings.musicVol = v;
      if (on && A) bus.gain.setTargetAtTime(level(), A.currentTime, 0.4);
    },
    mode(m) {
      if (!MODES[m] || m === mode) return;
      mode = m;
      step = 0;
      if (!A) return;
      pad.frequency.setTargetAtTime(MODES[m].cut, A.currentTime, 1.5);
      // l'accord suivant arrive vite, pour que le changement d'humeur s'entende
      nextChord = Math.min(nextChord, A.currentTime + 1.2);
      nextBeat = A.currentTime + 0.6;
    },
    // éclat de lumière : le filtre s'ouvre, une cascade de cloches
    swell() {
      if (!on || !A) return;
      const t = A.currentTime;
      pad.frequency.cancelScheduledValues(t);
      pad.frequency.setValueAtTime(pad.frequency.value, t);
      pad.frequency.linearRampToValueAtTime(2600, t + 1.2);
      pad.frequency.setTargetAtTime(MODES[mode].cut, t + 2.5, 1.5);
      [0, 0.35, 0.7].forEach((d) => bell(t + d));
    },
    get playing() {
      return on;
    },
  };
})();
