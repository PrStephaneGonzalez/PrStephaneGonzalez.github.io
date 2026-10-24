/* CODEX UMBRA — l'application : écrans, progression, épreuves, gardiens. */
'use strict';
(function () {
  const { R } = CU;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const H = (s) => CU.render(s);
  const app = $('#app');
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const TN = CU.TIER_NAMES;
  const DAY = 864e5;

  /* ================= réglages ================= */
  try {
    CU.settings = Object.assign({ sound: true, musicOn: true, musicVol: 0.5 }, JSON.parse(localStorage.getItem('codex-umbra-settings') || '{}'));
  } catch {
    CU.settings = { sound: true, musicOn: true, musicVol: 0.5 };
  }
  // la musique ne peut démarrer qu'après un geste de l'utilisateur
  // iPhone/iPad : le son ne se débloque que sur un vrai « toucher relâché » ou un clic,
  // pas sur pointerdown ; on réessaie donc à chaque geste tant que ce n'est pas joué.
  // Si le contexte audio ne tourne pas après un geste (iOS le met parfois en « interrupted »),
  // on le recrée au geste suivant, jusqu'à 3 fois.
  let needHeal = false,
    heals = 0,
    sessionSet = false;
  // iPhone : le commutateur « silencieux » coupe tout le son web. Une piste muette lue en boucle
  // fait passer la page en « lecture média », ce qui contourne le commutateur (comme une vidéo).
  let hush = null;
  const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function iosUnmute() {
    if (hush || !isIOS()) return;
    try {
      const n = 8000,
        b = new Uint8Array(44 + n),
        dv = new DataView(b.buffer),
        w = (o, s) => [...s].forEach((c, i) => (b[o + i] = c.charCodeAt(0)));
      w(0, 'RIFF');
      dv.setUint32(4, 36 + n, true);
      w(8, 'WAVEfmt ');
      dv.setUint32(16, 16, true);
      dv.setUint16(20, 1, true);
      dv.setUint16(22, 1, true);
      dv.setUint32(24, 8000, true);
      dv.setUint32(28, 8000, true);
      dv.setUint16(32, 1, true);
      dv.setUint16(34, 8, true);
      w(36, 'data');
      dv.setUint32(40, n, true);
      b.fill(128, 44);
      hush = new Audio(URL.createObjectURL(new Blob([b], { type: 'audio/wav' })));
      hush.loop = true;
      hush.setAttribute('playsinline', '');
      hush.play().catch(() => {});
      document.addEventListener('visibilitychange', () => {
        if (!hush) return;
        if (document.hidden) hush.pause();
        else hush.play().catch(() => {});
      });
    } catch {}
  }
  const startMusic = () => {
    iosUnmute();
    if (hush && hush.paused && !document.hidden) hush.play().catch(() => {});
    if (!sessionSet) {
      sessionSet = true;
      try {
        if (navigator.audioSession) navigator.audioSession.type = 'playback';
      } catch {}
    }
    if (needHeal && heals < 3) {
      heals++;
      needHeal = false;
      CU.sfx.reset();
      CU.music && CU.music.rebuild();
    }
    CU.sfx.unlock();
    CU.music && CU.music.start();
    setTimeout(() => {
      if (CU.sfx.status() !== 'running' && !document.hidden) needHeal = true;
    }, 900);
  };
  for (const ev of ['click', 'touchend', 'keydown']) addEventListener(ev, startMusic, { passive: true });
  const mood = (m) => CU.music && CU.music.mode(m);
  const saveSettings = () => {
    try {
      localStorage.setItem('codex-umbra-settings', JSON.stringify(CU.settings));
    } catch {}
  };

  /* ================= état & progression ================= */
  let st = null,
    KEY = null;
  const blank = (name) => ({ v: 1, name, xp: 0, skills: {}, bosses: {}, frags: [], stats: { solved: 0, bestCombo: 0 }, prologue: false, updated: Date.now() });
  const sk = (id) => st.skills[id] || (st.skills[id] = { tier: 0, prog: 0, seen: [], last: 0, done: 0 });
  const tierOf = (id) => (st.skills[id] || {}).tier || 0;
  const S = (id) => CU.SKILLS[id];
  const available = (id) => S(id).req.every((r) => tierOf(r) >= 1);
  // indice (0..2) du palier le plus haut que l'on peut tenter
  const maxAllowed = (id) => (!available(id) ? -1 : S(id).req.every((r) => tierOf(r) >= 2) ? 2 : 1);
  const regionSkills = (rid) => CU.ORDER.filter((id) => S(id).region === rid);
  const regionP = (rid) => {
    const ids = regionSkills(rid);
    return ids.reduce((s, id) => s + tierOf(id), 0) / (3 * ids.length);
  };
  const regionOpen = (rid) => regionSkills(rid).some(available);
  const bossOpen = (rid) => regionSkills(rid).every((id) => tierOf(id) >= 2);
  const finalOpen = () => CU.FINAL.needs.every((r) => st.bosses[r]);
  const totalTiers = () => CU.ORDER.reduce((s, id) => s + tierOf(id), 0);
  const NEED = { v7: 3, f6: 3, q6: 3, p3: 3, l2: 4 };
  const need = (id) => NEED[id] || 5;
  const ember = (id) => tierOf(id) >= 1 && sk(id).last && Date.now() - sk(id).last > 5 * DAY;
  const rankIdx = (xp) => {
    let i = 0;
    CU.RANKS.forEach((r, k) => xp >= r[0] && (i = k));
    return i;
  };
  const rankName = (xp) => CU.RANKS[rankIdx(xp)][1];
  function xpInfo() {
    const i = rankIdx(st.xp),
      lo = CU.RANKS[i][0],
      hi = (CU.RANKS[i + 1] || [lo + 1])[0];
    return { name: CU.RANKS[i][1], pct: i + 1 >= CU.RANKS.length ? 100 : (100 * (st.xp - lo)) / (hi - lo), next: CU.RANKS[i + 1] };
  }

  /* ================= sauvegarde ================= */
  let cloudTimer = null,
    syncState = 'local';
  function save(now = false) {
    st.updated = Date.now();
    CU.save.storeLocal(KEY, st);
    clearTimeout(cloudTimer);
    cloudTimer = setTimeout(pushCloud, now ? 50 : 2500);
  }
  async function pushCloud() {
    if (!navigator.onLine) {
      syncState = 'offline';
      return paintSync();
    }
    try {
      await CU.save.cloudPut(KEY, st);
      syncState = 'ok';
    } catch {
      syncState = 'offline';
    }
    paintSync();
  }
  function paintSync() {
    const el = $('.syncdot');
    if (el) el.textContent = syncState === 'ok' ? '● sauvegardé en ligne' : syncState === 'offline' ? '○ hors ligne — sauvegardé sur l’appareil' : '';
  }
  addEventListener('online', () => st && pushCloud());
  // quand on quitte ou met l'appli en arrière-plan : sauvegarde immédiate, y compris en ligne
  function flushNow() {
    if (!st) return;
    clearTimeout(cloudTimer);
    CU.save.storeLocal(KEY, st);
    CU.save.beacon(KEY, st);
  }
  addEventListener('pagehide', flushNow);
  document.addEventListener('visibilitychange', () => document.hidden && flushNow());

  /* ================= effets ================= */
  const fx = $('#fx');
  function sparks(x, y, color, n = 18) {
    for (let i = 0; i < n; i++) {
      const s = document.createElement('i');
      s.className = 'spark';
      const a = Math.random() * Math.PI * 2,
        d = 40 + Math.random() * 110;
      s.style.cssText = `left:${x}px;top:${y}px;--c:${color};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 30}px;animation-duration:${0.6 + Math.random() * 0.6}s`;
      fx.appendChild(s);
      setTimeout(() => s.remove(), 1300);
    }
  }
  function floatText(x, y, txt) {
    const s = document.createElement('div');
    s.className = 'floatxp';
    s.textContent = txt;
    s.style.left = x - 30 + 'px';
    s.style.top = y - 20 + 'px';
    fx.appendChild(s);
    setTimeout(() => s.remove(), 1400);
  }
  function flash(color) {
    const s = document.createElement('div');
    s.className = 'flashfx';
    s.style.setProperty('--c', color);
    fx.appendChild(s);
    setTimeout(() => s.remove(), 800);
  }
  let toastT;
  function toast(msg) {
    const t = $('#toast');
    t.innerHTML = H(msg);
    t.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('on'), 3200);
  }
  const center = (el) => {
    const r = el.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  };
  function setHue(h, deep) {
    document.documentElement.style.setProperty('--hue', h);
    document.documentElement.style.setProperty('--hueDeep', deep || '#2b2112');
    embers.hue = h;
  }

  /* ---------- braises de fond ---------- */
  const embers = { hue: '#d9ab5b' };
  (function () {
    const cv = $('#embers'),
      cx = cv.getContext('2d');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let W, Hh, ps;
    const n = () => (innerWidth < 600 ? 22 : 40);
    function size() {
      W = cv.width = innerWidth * devicePixelRatio;
      Hh = cv.height = innerHeight * devicePixelRatio;
      ps = [...Array(n())].map(() => mk(true));
    }
    function mk(any) {
      return { x: Math.random() * W, y: any ? Math.random() * Hh : Hh + 10, r: (0.6 + Math.random() * 1.8) * devicePixelRatio, v: (0.15 + Math.random() * 0.5) * devicePixelRatio, w: Math.random() * 6.28, a: 0.2 + Math.random() * 0.6 };
    }
    size();
    addEventListener('resize', size);
    function tick() {
      if (!document.hidden) {
        cx.clearRect(0, 0, W, Hh);
        cx.fillStyle = embers.hue;
        for (const p of ps) {
          p.y -= p.v;
          p.w += 0.01;
          p.x += Math.sin(p.w) * 0.3;
          if (p.y < -10) Object.assign(p, mk(false));
          cx.globalAlpha = p.a * Math.min(1, p.y / Hh + 0.2);
          cx.beginPath();
          cx.arc(p.x, p.y, p.r, 0, 6.283);
          cx.fill();
        }
      }
      requestAnimationFrame(tick);
    }
    tick();
  })();

  /* ================= navigation ================= */
  let view = null; // vue courante (pour quitter proprement une épreuve)
  function go(hash) {
    if (location.hash === hash) route();
    else location.hash = hash;
  }
  addEventListener('hashchange', route);
  function route() {
    closeSheet();
    $$('.cu-ov').forEach((o) => o.remove());
    if (!st) return renderTitle();
    const h = location.hash.slice(1);
    if (h.startsWith('/r/') && CU.region(h.slice(3))) return renderRegion(h.slice(3));
    if (h === '/codex') return renderCodex();
    if (h.startsWith('/t/') && view && view.kind === 'trial') return; // déjà affiché
    if (h.startsWith('/b/') && view && view.kind === 'boss') return;
    if (h === '/a' && view && view.kind === 'arena') return;
    if (h.startsWith('/t/') || h.startsWith('/b/') || h === '/a') {
      const rid = view && view.rid;
      return rid ? go('#/r/' + rid) : renderWorld();
    }
    renderWorld();
  }

  /* ================= écran titre ================= */
  function renderTitle() {
    view = { kind: 'title' }; mood('explore');
    setHue('#d9ab5b');
    let last = null;
    try {
      last = JSON.parse(localStorage.getItem('codex-umbra-last') || 'null');
    } catch {}
    app.innerHTML = `<div class="title-screen"><div class="title-inner">
${CU.ART.sigil()}
<div class="logo">CODEX UMBRA</div>
<div class="tagline">Les Lois du monde brisé</div>
${last && CU.save.local(last.key) ? `<button class="btn primary" id="resume" style="width:100%;margin-bottom:14px">Reprendre — ${esc(last.name)}</button>` : ''}
<form class="login" id="login" autocomplete="off">
<div><label for="nm">Nom d’Arpenteur</label><input class="inp" id="nm" maxlength="24" autocapitalize="words" spellcheck="false" placeholder="ex. Kaël" /></div>
<div><label for="pc">Code secret (4 à 6 chiffres)</label><input class="inp" id="pc" inputmode="numeric" pattern="[0-9]*" maxlength="6" placeholder="••••" type="password" /></div>
<div class="err" id="err"></div>
<button class="btn primary" type="submit">Entrer dans les Terres Brisées</button>
<div class="note">Ta progression est gardée en ligne : avec le même nom et le même code, tu la retrouves sur n’importe quel appareil.</div>
</form>
<div class="foot">Un prototype — vecteurs, calcul littéral, second degré, Python et logique.</div>
</div></div>`;
    $('#login').onsubmit = async (e) => {
      e.preventDefault();
      CU.sfx.unlock();
      const name = $('#nm').value.trim(),
        pin = $('#pc').value.trim();
      if (!/^[\p{L}\p{N} '’-]{2,24}$/u.test(name)) return ($('#err').textContent = 'Choisis un nom de 2 à 24 lettres.');
      if (!/^\d{4,6}$/.test(pin)) return ($('#err').textContent = 'Le code doit faire 4 à 6 chiffres.');
      $('#err').textContent = 'Le Codex te cherche…';
      const key = await CU.save.keyOf(name, pin),
        old = await CU.save.keyOf(name, pin, true);
      await enter(key, name, old !== key ? old : null);
    };
    const r = $('#resume');
    if (r)
      r.onclick = async () => {
        CU.sfx.unlock();
        await enter(last.key, last.name);
      };
  }
  async function enter(key, name, oldKey) {
    KEY = key;
    let all = CU.save.merge(CU.save.local(key), oldKey ? CU.save.local(oldKey) : null);
    try {
      all = CU.save.merge(all, await CU.save.cloudGet(key));
      if (oldKey) all = CU.save.merge(all, await CU.save.cloudGet(oldKey));
      syncState = 'ok';
    } catch {
      syncState = 'offline';
    }
    st = all || blank(name);
    st.name = st.name || name;
    st.frags = st.frags || [];
    st.bosses = st.bosses || {};
    st.stats = st.stats || { solved: 0, bestCombo: 0 };
    save(true);
    startMusic();
    if (!st.prologue) renderPrologue(0);
    else {
      if (!location.hash || location.hash === '#') go('#/world');
      else route();
    }
  }

  /* ================= prologue ================= */
  function renderPrologue(i) {
    view = { kind: 'prologue' };
    setHue('#d9ab5b');
    const last = i === CU.PROLOGUE.length - 1;
    app.innerHTML = `<div class="story">
<div class="who">${i === 2 ? CU.ART.raven(40) + ' CORVIN' : 'PROLOGUE'}</div>
<p>${CU.PROLOGUE[i]}</p>
<div class="row"><div class="dots">${CU.PROLOGUE.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div><div class="grow"></div>
<button class="btn ${last ? 'primary' : ''}" id="nx">${last ? 'Se relever' : 'Continuer'}</button></div></div>`;
    $('#nx').onclick = () => {
      CU.sfx.click();
      if (!last) return renderPrologue(i + 1);
      st.prologue = true;
      save();
      go('#/world');
    };
    $('#nx').focus();
  }

  /* ================= barre du haut ================= */
  function hud(back) {
    const x = xpInfo();
    return `<header class="hud">
${back ? `<button class="back" id="bk" aria-label="Retour">‹ <span>${esc(back.label)}</span></button>` : `<span style="font-size:1.4rem;color:var(--gold)" aria-hidden="true">✦</span>`}
<div class="who"><div class="name">${esc(st.name)}</div><div class="rank">${esc(x.name)} · ${st.xp} XP</div><div class="xpbar" title="${x.next ? 'Prochain rang : ' + esc(x.next[1]) + ' à ' + x.next[0] + ' XP' : 'Rang maximal'}"><i style="width:${x.pct.toFixed(1)}%"></i></div></div>
<button class="icon-btn" id="cdx" aria-label="Le Codex" title="Le Codex">📖</button>
<button class="icon-btn" id="snd" aria-label="Son" title="Son">${CU.settings.sound ? '🔊' : '🔇'}</button>
<button class="icon-btn" id="mnu" aria-label="Menu" title="Menu">☰</button>
</header>`;
  }
  function wireHud(back) {
    if (back) $('#bk').onclick = () => (CU.sfx.click(), go(back.hash));
    $('#cdx').onclick = () => (CU.sfx.click(), go('#/codex'));
    $('#snd').onclick = (e) => {
      CU.settings.sound = !CU.settings.sound;
      saveSettings();
      e.currentTarget.textContent = CU.settings.sound ? '🔊' : '🔇';
      CU.sfx.click();
    };
    $('#mnu').onclick = openMenu;
  }

  /* ================= monde ================= */
  function suggestion() {
    let best = null,
      bs = -1;
    for (const id of CU.ORDER) {
      const t = tierOf(id);
      if (!available(id) || t >= 3 || t > maxAllowed(id)) continue;
      const score = (sk(id).prog || 0) * 10 + (3 - t) * 2 + (S(id).region === 'vec' || S(id).region === 'fac' ? 1 : 0) - CU.ORDER.indexOf(id) * 0.01;
      if (score > bs) {
        bs = score;
        best = id;
      }
    }
    return best;
  }
  function renderWorld() {
    view = { kind: 'world' }; mood('explore');
    setHue('#d9ab5b');
    const regs = CU.REGIONS.map((g) => ({ ...g, p: regionP(g.id), open: regionOpen(g.id), boss: !!st.bosses[g.id] }));
    const tp = totalTiers() / (3 * CU.ORDER.length);
    const sug = suggestion();
    const fo = finalOpen(),
      fd = !!st.bosses.final;
    app.innerHTML =
      hud() +
      `<div class="wrap">
<div class="world-head"><h1>Les Terres Brisées</h1><div class="ital">${tp === 0 ? 'Tout est brume. Choisis où commencer : chaque région se rallume à mesure que tu en comprends les Lois.' : tp < 0.5 ? 'La brume recule là où tu passes. Les Informes, eux, se font plus nerveux.' : 'Le monde se souvient de lui-même. Le Sanctuaire t’attend.'}</div></div>
${
  sug
    ? `<button class="rcard" id="sug" style="--hue:${CU.region(S(sug).region).hue};width:100%;margin:12px 0 4px;display:flex;align-items:center;gap:14px">
<span style="flex:none">${CU.ART.raven(42)}</span><span style="flex:1;min-width:0"><span class="ital" style="font-size:1rem">Corvin suggère :</span><br><b>${esc(S(sug).name)}</b> — ${TN[tierOf(sug)]} <small style="color:var(--mute)">${sk(sug).prog ? '(' + sk(sug).prog + '/' + need(sug) + ' éclats)' : ''}</small></span><span class="btn primary small" style="flex:none">Go</span></button>`
    : ''
}
<div class="mapbox">${CU.ART.world({ regions: regs, total: tp, finalOpen: fo, finalDone: fd })}</div>
<div class="cards">${regs
        .map((g) => {
          const ids = regionSkills(g.id);
          const done = ids.filter((id) => tierOf(id) >= 3).length;
          const lockedWhy = !g.open ? 'Requiert : ' + [...new Set(ids.flatMap((id) => S(id).req.filter((r) => S(r).region !== g.id)))].map((r) => S(r).name).join(', ') : '';
          return `<button class="rcard ${g.open ? '' : 'locked'}" data-region="${g.id}" style="--hue:${g.hue}"><span class="ic">${esc(g.icon)}</span><h3>${esc(g.name)}</h3><div class="sub">${esc(g.open ? g.sub : lockedWhy)}</div><div class="prog"><i style="width:${(100 * g.p).toFixed(0)}%"></i></div><div class="meta"><span>${g.short} · ${done}/${ids.length} Lois maîtrisées</span><span>${g.boss ? '👑 Gardien vaincu' : bossOpen(g.id) ? '⚔ Gardien éveillé' : ''}</span></div></button>`;
        })
        .join('')}
<button class="rcard final-card arena-card ${arenaPool().length ? '' : 'locked'}" id="arena"><span class="ic">⏳</span><h3>L’Arène des Automatismes</h3><div class="sub">${arenaPool().length ? 'Calcul mental, développements, discriminants… contre la montre.' : 'S’ouvre dès ton premier sceau de calcul.'}</div><div class="meta"><span>${st.arena && st.arena.best ? 'Record : ' + st.arena.best : arenaPool().length ? arenaPool().length + ' types de calculs' : ''}</span></div></button>
<button class="rcard final-card ${fo ? '' : 'locked'}" id="fin"><span class="ic">${CU.FINAL.glyph}</span><h3>Le Sanctuaire du Codex</h3><div class="sub">${fd ? 'Le Roi Sans Loi est vaincu. Le Codex t’appartient.' : fo ? 'Le Roi Sans Loi t’attend.' : 'Vaincs les gardiens des Remparts, des Cryptes et de la Tour pour ouvrir le Sanctuaire.'}</div><div class="meta"><span>${CU.FINAL.needs.map((r) => (st.bosses[r] ? '👑' : '◇')).join(' ')}</span></div></button>
</div>
<div class="foot"><span class="syncdot"></span></div>
</div>`;
    wireHud();
    paintSync();
    $$('[data-region]').forEach((el) => {
      el.onclick = () => {
        const id = el.dataset.region;
        if (!regionOpen(id)) {
          CU.sfx.wrong();
          return toast('Cette région est encore scellée. ' + (CU.region(id).id === 'quad' ? 'Commence par le Miroir des trois lois, dans les Cryptes.' : ''));
        }
        CU.sfx.click();
        go('#/r/' + id);
      };
    });
    const fin = () => (fo ? startBoss('final') : (CU.sfx.wrong(), toast('Le Sanctuaire est scellé par trois gardiens.')));
    $('#fin').onclick = fin;
    $('#arena').onclick = () => (CU.sfx.click(), openArenaSheet());
    const fs = $('[data-final]');
    if (fs) fs.onclick = fin;
    if (sug) $('#sug').onclick = () => (CU.sfx.click(), launch(sug, tierOf(sug)));
  }

  /* ================= région ================= */
  function renderRegion(rid, flashId) {
    view = { kind: 'region', rid }; mood('explore');
    const g = CU.region(rid);
    setHue(g.hue, g.deep);
    const ids = regionSkills(rid);
    const nodes = ids.map((id) => ({ id, x: S(id).x, y: S(id).y, name: S(id).name, glyph: S(id).glyph, tier: tierOf(id), state: available(id) ? 'open' : 'locked', isNew: available(id) && tierOf(id) === 0 && !sk(id).prog, ember: ember(id) }));
    const edges = [];
    for (const id of ids) for (const r of S(id).req) if (S(r).region === rid) edges.push({ a: r, b: id, state: tierOf(r) >= 1 ? (tierOf(id) >= 1 ? 'lit' : 'open') : 'locked' });
    app.innerHTML =
      hud({ label: 'Carte', hash: '#/world' }) +
      `<div class="wrap">
<div class="region-title"><h1>${esc(g.name)}</h1><div class="ital">${esc(st.bosses[rid] ? g.healed : g.intro)}</div></div>
<div class="scene">${CU.ART.scene({ region: g, p: regionP(rid), bossDone: !!st.bosses[rid], bossOpen: bossOpen(rid), nodes, edges })}</div>
<div class="list">${ids
        .map((id) => {
          const t = tierOf(id),
            av = available(id);
          return `<button class="lrow ${av ? '' : 'locked'}" data-id="${id}"><span class="g">${esc(S(id).glyph)}</span><span class="t"><b>${esc(S(id).name)}</b><small>${av ? (t === 3 ? 'Loi maîtrisée' : TN[t] + (sk(id).prog ? ' · ' + sk(id).prog + '/' + need(id) + ' éclats' : '')) : '⛓ scellée'}${ember(id) ? ' · 🔥 à raviver' : ''}</small></span><span class="seals">${[0, 1, 2].map((i) => `<i class="${t > i ? (t === 3 ? 'gold' : 'on') : ''}"></i>`).join('')}</span></button>`;
        })
        .join('')}
<button class="lrow" data-boss="1" style="--hue:#e0475b"><span class="g">${esc(g.boss.glyph)}</span><span class="t"><b>${esc(g.boss.name)}</b><small>${st.bosses[rid] ? '👑 Vaincu — tu peux le défier à nouveau' : bossOpen(rid) ? '⚔ Il t’attend' : 'S’éveille quand toutes les Lois de la région sont au rang Adepte'}</small></span></button>
</div>
<div class="foot"><span class="syncdot"></span></div></div>`;
    wireHud({ label: 'Carte', hash: '#/world' });
    paintSync();
    $$('[data-id]').forEach((el) => {
      el.onclick = () => (CU.sfx.click(), openSheet(el.dataset.id));
      el.onkeydown = (e) => e.key === 'Enter' && openSheet(el.dataset.id);
    });
    $$('[data-boss]').forEach((el) => (el.onclick = () => (CU.sfx.click(), openBossSheet(rid))));
    if (flashId) {
      const n = $(`.node[data-id="${flashId}"]`);
      if (n) {
        n.classList.add('flash');
        setTimeout(() => {
          const [x, y] = center(n);
          sparks(x, y, g.hue, 30);
        }, 300);
      }
    }
    window.scrollTo(0, 0);
  }

  /* ================= feuilles ================= */
  function sheet(inner, hue) {
    closeSheet();
    const bg = document.createElement('div');
    bg.className = 'sheet-bg';
    bg.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" style="${hue ? '--hue:' + hue : ''}">${inner}</div>`;
    bg.onclick = (e) => e.target === bg && closeSheet();
    document.body.appendChild(bg);
    return bg;
  }
  function closeSheet() {
    $$('.sheet-bg').forEach((s) => s.remove());
  }
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSheet();
  });

  function openSheet(id) {
    const s = S(id),
      g = CU.region(s.region),
      t = tierOf(id),
      av = available(id),
      ma = maxAllowed(id);
    const reqs = s.req.map((r) => ({ r, met: tierOf(r) >= 1, met2: tierOf(r) >= 2 }));
    let actions = '';
    if (!av) actions = `<button class="btn" data-a="lesson">Lire le Grimoire</button>`;
    else {
      if (t < 3 && t <= ma) actions += `<button class="btn primary" data-a="go">${t === 0 && !sk(id).prog ? 'Commencer' : 'Continuer'} — ${TN[t]}</button>`;
      if (t >= 1) actions += `<button class="btn" data-a="replay">Rejouer — ${TN[Math.min(t, 3) - 1]}</button>`;
      if (ember(id)) actions += `<button class="btn gold" data-a="revive">🔥 Raviver la braise</button>`;
      actions += `<button class="btn ghost" data-a="lesson">Le Grimoire</button>`;
    }
    const bg = sheet(
      `<div class="top"><div class="bigg">${esc(s.glyph)}</div><div><div class="place">${esc(s.place)} · ${esc(g.short)}</div><h2>${esc(s.name)}</h2><div class="ital" style="font-size:1.05rem;margin-top:4px">${esc(s.flavor)}</div></div></div>
<div class="ladder">${TN.map((n, i) => `<div class="rung ${t > i ? 'done' : t === i && av ? 'cur' : ''} ${i > ma ? 'lock' : ''}"><div class="dia"></div><b>${n}</b>${t > i ? 'sceau brisé' : t === i && av ? (sk(id).prog || 0) + '/' + need(id) + ' éclats' : i > ma ? '⛓' : ''}</div>`).join('')}</div>
${
  !av || (t < 3 && t > ma)
    ? `<div class="req"><b>${!av ? 'Cette Loi est scellée.' : 'Le sceau Maître est encore scellé.'}</b> Il faut d’abord :<ul>${reqs.map((q) => `<li class="${(!av ? q.met : q.met2) ? 'met' : ''}">${(!av ? q.met : q.met2) ? '✓' : '◇'} ${esc(S(q.r).name)} — rang ${!av ? 'Novice' : 'Adepte'} (${esc(CU.region(S(q.r).region).short)})</li>`).join('')}</ul></div>`
    : ''
}
${t >= 1 ? `<div class="law">${H(s.law)}</div>` : ''}
<div class="actions">${actions}</div>`,
      g.hue,
    );
    $$('[data-a]', bg).forEach(
      (b) =>
        (b.onclick = () => {
          CU.sfx.click();
          const a = b.dataset.a;
          if (a === 'go') launch(id, t);
          if (a === 'replay') launch(id, Math.min(t, 3) - 1, 'replay');
          if (a === 'revive') launch(id, Math.min(t, 3) - 1, 'revive');
          if (a === 'lesson') openLesson(id, Math.max(0, Math.min(av ? Math.max(t, 0) : 0, 2)));
        }),
    );
  }
  function openLesson(id, ti, then) {
    const s = S(id),
      g = CU.region(s.region);
    const bg = sheet(
      `<div class="top"><div class="bigg">${esc(s.glyph)}</div><div><div class="place">Le Grimoire · ${esc(s.name)}</div><h2>${TN[ti]}</h2></div></div>
<div class="grim"><h3>${TN[ti].toUpperCase()}</h3>${H(s.lessons[ti])}
${ti > 0 ? `<details class="past"><summary>Revoir les paliers précédents</summary>${s.lessons.slice(0, ti).map((l, i) => `<h3>${TN[i].toUpperCase()}</h3>${H(l)}`).join('')}</details>` : ''}</div>
<div class="actions">${then ? `<button class="btn primary" id="lgo">J’ai compris — à l’épreuve</button>` : `<button class="btn" id="lgo">Fermer</button>`}</div>`,
      g.hue,
    );
    $('#lgo', bg).onclick = () => {
      CU.sfx.click();
      closeSheet();
      then && then();
    };
  }
  function openBossSheet(rid) {
    const g = CU.region(rid),
      b = g.boss,
      open = bossOpen(rid);
    const bg = sheet(
      `<div class="top">${CU.ART.boss(b.glyph, '#e0475b', 72)}<div><div class="place" style="color:#ff8494">${esc(b.title)}</div><h2>${esc(b.name)}</h2><div class="taunt">« ${esc(b.taunt)} »</div></div></div>
<p style="color:var(--mute);margin-top:16px">Un combat sans indice : chaque bonne réponse le blesse, chaque erreur te coûte une lueur. Trois bonnes réponses d’affilée portent un <b>coup critique</b>. Les questions viennent de toutes les Lois de la région, aux rangs Adepte et Maître.</p>
${open ? '' : `<div class="req">Le gardien dort encore. Il s’éveillera quand toutes les Lois de la région auront atteint le rang <b>Adepte</b>.<ul>${regionSkills(rid).map((id) => `<li class="${tierOf(id) >= 2 ? 'met' : ''}">${tierOf(id) >= 2 ? '✓' : '◇'} ${esc(S(id).name)}</li>`).join('')}</ul></div>`}
<div class="actions">${open ? `<button class="btn primary blood" id="fight">${st.bosses[rid] ? 'Le défier à nouveau' : 'Affronter le gardien'}</button>` : ''}<button class="btn ghost" id="cl">Fermer</button></div>`,
      '#e0475b',
    );
    $('#cl', bg).onclick = closeSheet;
    if (open) $('#fight', bg).onclick = () => (closeSheet(), startBoss(rid));
  }
  function openMenu() {
    CU.sfx.click();
    const bg = sheet(`<h2 style="margin-bottom:14px">Menu</h2><div class="menu">
<button class="btn" id="m-snd">${CU.settings.sound ? '🔊 Sons activés' : '🔇 Sons coupés'}</button>
<button class="btn" id="m-mus">${CU.settings.musicOn !== false ? '🎵 Musique : oui' : '🎵 Musique : non'}</button>
<button class="btn" id="m-test">🔈 Tester le son</button>
<label class="vol">Volume de la musique<input type="range" id="m-vol" min="0" max="1" step="0.05" value="${CU.settings.musicVol ?? 0.5}" /></label>
<button class="btn" id="m-pro">📜 Revoir le prologue</button>
<button class="btn" id="m-out">🚪 Changer d’Arpenteur</button>
</div><p class="note" style="margin-top:16px">Progression de <b>${esc(st.name)}</b> : ${totalTiers()} sceaux brisés sur ${3 * CU.ORDER.length}, ${st.stats.solved} défis réussis, meilleure série : ${st.stats.bestCombo}. Elle est enregistrée sur cet appareil et en ligne (nom + code). <span class="syncdot"></span></p>`);
    paintSync();
    $('#m-snd', bg).onclick = (e) => {
      CU.settings.sound = !CU.settings.sound;
      saveSettings();
      e.target.textContent = CU.settings.sound ? '🔊 Sons activés' : '🔇 Sons coupés';
      const s = $('#snd');
      if (s) s.textContent = CU.settings.sound ? '🔊' : '🔇';
    };
    $('#m-mus', bg).onclick = (e) => {
      CU.music.enable(CU.settings.musicOn === false);
      saveSettings();
      e.target.textContent = CU.settings.musicOn !== false ? '🎵 Musique : oui' : '🎵 Musique : non';
    };
    $('#m-test', bg).onclick = (e) => {
      const b = e.target;
      if (CU.sfx.status() !== 'running' && heals < 6) {
        heals++;
        CU.sfx.reset();
        CU.music && CU.music.rebuild();
      }
      const wasOff = CU.settings.sound === false;
      CU.settings.sound = true;
      CU.sfx.unlock();
      CU.music && CU.music.start();
      CU.sfx.right(3);
      CU.settings.sound = !wasOff;
      b.textContent = '🔈 Son : ' + CU.sfx.status() + ' — entends-tu une note ?';
      setTimeout(() => (b.textContent = '🔈 Son : ' + CU.sfx.status() + (CU.LITE ? ' (léger)' : '') + (wasOff ? ' (sons coupés dans le jeu)' : '')), 1200);
    };
    $('#m-vol', bg).oninput = (e) => {
      CU.music.volume(+e.target.value);
      saveSettings();
    };
    $('#m-pro', bg).onclick = () => (closeSheet(), renderPrologue(0));
    $('#m-out', bg).onclick = () => {
      closeSheet();
      save(true);
      st = null;
      KEY = null;
      try {
        localStorage.removeItem('codex-umbra-last');
      } catch {}
      history.replaceState(null, '', location.pathname);
      renderTitle();
    };
  }

  /* ================= épreuves ================= */
  function launch(id, ti, mode = 'normal') {
    closeSheet();
    const s = sk(id);
    if (mode === 'normal' && !s.seen[ti])
      return openLesson(id, ti, () => {
        s.seen[ti] = true;
        save();
        startTrial(id, ti, mode);
      });
    startTrial(id, ti, mode);
  }
  const GOOD = ['Juste.', 'La Loi tient.', 'Impeccable.', 'Le Codex frémit.', 'Exact.', 'Corvin approuve d’un croassement.', 'Net et précis.', 'Les Informes reculent.'];
  const COMBO = { 3: 'Série ×3 — le sceau tremble !', 5: 'Série ×5 — inarrêtable !', 8: 'Série ×8 — légendaire !', 12: 'Série ×12 — Ysembre lui-même serait jaloux.' };

  function startTrial(id, ti, mode) {
    const s = S(id),
      g = CU.region(s.region);
    setHue(g.hue, g.deep);
    const ss = sk(id);
    const replay = mode !== 'normal' || ti < ss.tier;
    const T0 = {
      kind: 'trial',
      id,
      ti,
      mode: replay && mode === 'normal' ? 'replay' : mode,
      rid: s.region,
      need: mode === 'revive' ? 3 : need(id),
      got: mode === 'normal' && !replay ? ss.prog || 0 : 0,
      combo: 0,
    };
    view = T0;
    mood('focus');
    history.pushState(null, '', '#/t/' + id);
    app.innerHTML = `<div class="trial">
<div class="trial-head"><button class="back" id="quit" aria-label="Quitter">‹</button><div class="ttl"><small>${T0.mode === 'revive' ? '🔥 Ravivage' : TN[ti]}${T0.mode === 'replay' ? ' · révision' : ''}</small><b>${esc(s.name)}</b></div><div class="combo" id="combo"></div><div class="shards" id="shards"></div></div>
<div id="stage"></div></div>`;
    $('#quit').onclick = () => {
      CU.sfx.click();
      view = null;
      go('#/r/' + s.region);
    };
    paintShards();
    nextQuestion();
  }
  function paintShards() {
    const v = view;
    if (v.kind === 'boss') return paintBoss();
    if (v.kind === 'arena') return paintArena();
    $('#shards').innerHTML = [...Array(v.need)].map((_, i) => `<i class="shard ${i < v.got ? 'on' : ''}"></i>`).join('');
    const c = $('#combo');
    c.textContent = v.combo >= 2 ? '×' + v.combo : '';
    c.classList.toggle('on', v.combo >= 2);
  }
  function nextQuestion() {
    const v = view;
    let ex;
    if (v.kind === 'boss') {
      const id = R.pick(v.pool);
      ex = S(id).gen[R.pick([1, 2, 2])]();
      ex._sid = id;
    } else if (v.kind === 'arena') ex = arenaQuestion();
    else ex = S(v.id).gen[v.ti]();
    v.ex = ex;
    v.tries = 0;
    v.hinted = false;
    v.answered = false;
    renderQuestion();
  }

  /* ---------- rendu d'une question ---------- */
  function renderQuestion() {
    const v = view,
      ex = v.ex,
      boss = v.kind === 'boss' || v.kind === 'arena';
    const stage = $('#stage');
    stage.innerHTML = `<div class="card" id="card">
${boss ? `<div class="place" style="color:var(--hue);font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px">${esc(S(ex._sid).name)}</div>` : ''}
<div class="q">${H(ex.q)}</div>
<div class="zone" id="zone"></div>
<div class="feedback" id="fb" role="status" aria-live="polite"></div>
<div id="extra"></div>
<div class="row" id="btns">
${boss ? '' : `<button class="btn ghost small" id="hint">💡 Indice</button>`}
<div class="grow"></div>
${['fields', 'order', 'grid', 'toggle', 'baliste'].includes(ex.type) ? `<button class="btn primary" id="ok">${ex.type === 'baliste' ? '🎯 Tirer' : 'Valider'}</button>` : ''}
</div></div>`;
    const zone = $('#zone');
    v.ui = RENDER[ex.type](zone, ex);
    const ok = $('#ok');
    if (ok) ok.onclick = () => submit(v.ui.get());
    const hb = $('#hint');
    if (hb) hb.onclick = () => hint();
    // focus sur le premier champ
    const first = $('.inp', zone);
    if (first && matchMedia('(pointer:fine)').matches) first.focus();
    window.scrollTo({ top: 0 });
    if (v.kind === 'arena') arenaClock();
  }
  function hint() {
    const v = view;
    if (v.answered) return;
    CU.sfx.click();
    if (!v.hinted) {
      v.hinted = true;
      v.combo = 0;
      paintShards();
      $('#extra').insertAdjacentHTML('beforeend', `<div class="hintbox">${H(v.ex.hint)}</div>`);
      $('#hint').textContent = '📖 Voir la solution';
    } else reveal(true);
  }
  function reveal(gaveUp) {
    const v = view;
    v.answered = true;
    if (v.ui.reveal) v.ui.reveal();
    $('#extra').insertAdjacentHTML('beforeend', `<div class="sol">${H(v.ex.sol)}</div>`);
    if (gaveUp) {
      $('#fb').className = 'feedback';
      $('#fb').textContent = 'Lis l’explication, puis retente ta chance sur un nouveau défi.';
    }
    nextButton();
  }
  function nextButton(label = 'Suivant →') {
    const b = $('#btns');
    b.innerHTML = `<div class="grow"></div><button class="btn primary" id="nxt">${label}</button>`;
    const n = $('#nxt');
    n.onclick = () => (CU.sfx.click(), afterAnswer());
    setTimeout(() => n.focus({ preventScroll: true }), 50);
  }
  addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || !view || (view.kind !== 'trial' && view.kind !== 'boss' && view.kind !== 'arena')) return;
    if ($('.sheet-bg') || $('.cu-ov')) return;
    if (view.answered) {
      const n = $('#nxt');
      if (n && document.activeElement !== n) {
        e.preventDefault();
        n.click();
      }
    } else if (e.target && e.target.classList && e.target.classList.contains('inp')) {
      e.preventDefault();
      const ok = $('#ok');
      if (ok) ok.click();
    }
  });

  function submit(ans) {
    const v = view,
      ex = v.ex;
    if (v.answered || ans == null) return;
    let res;
    if (ex.type === 'choice') res = { ok: ans === ex.correct };
    else if (ex.type === 'order') {
      const seq = ans.map((it) => it.k);
      const ok = (seq.length === ex.n && seq.every((k, i) => k === i)) || ex.alts.some((a) => a.length === seq.length && a.every((k, i) => k === seq[i]));
      let pre = 0;
      while (pre < seq.length && seq[pre] === pre) pre++;
      res = ok ? { ok: true } : { ok: false, msg: seq.some((k) => typeof k === 'string') ? 'Une étape de ta démonstration est fausse ou inutile : un intrus s’est glissé.' : pre ? `Les ${pre} premières étapes sont bien placées ; la suite cloche.` : 'Dès la première étape, l’enchaînement ne tient pas.' };
    } else if (ex.type === 'jump') res = { ok: ans === true, msg: ans };
    else res = ex.check(ans);
    const card = $('#card'),
      fb = $('#fb');
    if (res.syntax) {
      fb.className = 'feedback bad';
      fb.innerHTML = H('Je ne comprends pas l’écriture : ' + (res.msg || ''));
      CU.sfx.click();
      return;
    }
    if (res.ok) return success();
    // erreur
    v.tries++;
    v.combo = 0;
    CU.sfx.wrong();
    card.classList.remove('bad');
    void card.offsetWidth;
    card.classList.add('bad');
    if (v.ui.wrong) v.ui.wrong(ans);
    fb.className = 'feedback ' + (res.close ? 'close' : 'bad');
    fb.innerHTML = H(res.msg || 'Ce n’est pas ça. ' + (v.tries < 2 ? 'Encore un essai.' : ''));
    paintShards();
    if (v.kind === 'boss') return bossHurt();
    if (v.kind === 'arena') return arenaMiss(false);
    if (v.tries >= 2) reveal(false);
  }

  function success() {
    const v = view,
      first = v.tries === 0 && !v.hinted;
    v.answered = true;
    const card = $('#card');
    card.classList.add('good');
    if (v.ui.lock) v.ui.lock();
    st.stats.solved++;
    let gain;
    if (first) {
      v.combo++;
      st.stats.bestCombo = Math.max(st.stats.bestCombo, v.combo);
    } else v.combo = 0;
    if (v.kind === 'boss') {
      gain = first ? 15 : 5;
    } else if (v.kind === 'arena') {
      gain = 5 + v.cur.t * 2;
      v.score++;
      const s = sk(v.cur.id);
      s.last = Date.now();
    } else {
      const base = [10, 18, 28][v.ti];
      gain = first ? Math.round(base * (1 + 0.1 * Math.min(v.combo - 1, 10))) : 4;
      if (first) v.got = Math.min(v.need, v.got + 1);
      const s = sk(v.id);
      s.last = Date.now();
      s.done = (s.done || 0) + 1;
      if (v.mode === 'normal') s.prog = v.got;
    }
    const before = rankIdx(st.xp);
    st.xp += gain;
    CU.sfx.right(v.combo);
    const [x, y] = center($('#ok') || $('#zone'));
    sparks(x, y, getComputedStyle(document.documentElement).getPropertyValue('--hue').trim() || '#fff', first ? 22 : 10);
    floatText(x, y, '+' + gain + ' XP');
    const fb = $('#fb');
    fb.className = 'feedback good';
    fb.textContent = (COMBO[v.combo] || (first ? R.pick(GOOD) : 'Juste — mais cette fois, sans éclat de sceau (il faut réussir du premier coup, sans indice).')) + '';
    paintShards();
    if (rankIdx(st.xp) > before) setTimeout(() => toast('✦ Nouveau rang : <b>' + rankName(st.xp) + '</b>'), 700);
    save();
    if (v.kind === 'boss') return bossHit(first);
    if (v.kind === 'arena') return arenaHit();
    $('#extra').insertAdjacentHTML('beforeend', `<details class="sol" style="padding:10px 14px"><summary style="cursor:pointer;color:var(--mute)">Voir l’explication</summary>${H(v.ex.sol)}</details>`);
    nextButton(v.got >= v.need ? 'Briser le sceau ✦' : 'Suivant →');
  }
  function afterAnswer() {
    const v = view;
    if (v.kind === 'arena') return v.over ? arenaEnd() : nextQuestion();
    if (v.kind === 'boss') {
      if (v.over) return;
      return nextQuestion();
    }
    if (v.got >= v.need) return tierDone();
    nextQuestion();
  }

  /* ---------- fin de palier ---------- */
  function tierDone() {
    const v = view,
      s = sk(v.id),
      sd = S(v.id),
      g = CU.region(sd.region);
    const gains = [];
    let title, sub;
    const beforeAvail = new Set(CU.ORDER.filter(available));
    const beforeRank = rankIdx(st.xp);
    if (v.mode === 'normal') {
      s.tier = Math.max(s.tier, v.ti + 1);
      s.prog = 0;
      const bonus = 50 * (v.ti + 1);
      st.xp += bonus;
      gains.push(`<b>+${bonus} XP</b> — sceau ${TN[v.ti]} brisé`);
      title = v.ti === 2 ? 'La Loi est maîtrisée' : `Sceau ${TN[v.ti]} brisé`;
      sub = v.ti === 0 ? 'La Loi se réécrit dans le Codex. Autour de toi, quelque chose se rallume.' : v.ti === 1 ? 'La Loi s’affermit. Les Informes de ce lieu reculent.' : 'Plus rien ne peut défaire cette Loi. Elle brille d’or dans le Codex.';
      for (const id of CU.ORDER) if (!beforeAvail.has(id) && available(id)) gains.push(`Nouvelle Loi accessible : <b>${esc(S(id).name)}</b> <small>(${esc(CU.region(S(id).region).name)})</small>`);
      if (bossOpen(sd.region) && !st.bosses[sd.region] && regionSkills(sd.region).filter((id) => tierOf(id) >= 2).length === regionSkills(sd.region).length && v.ti === 1) gains.push(`⚔ <b>${esc(g.boss.name)}</b> s’éveille !`);
    } else if (v.mode === 'revive') {
      st.xp += 30;
      gains.push('<b>+30 XP</b> — braise ravivée');
      title = 'La braise est ravivée';
      sub = 'Une Loi qu’on entretient ne s’éteint pas.';
    } else {
      st.xp += 20;
      gains.push('<b>+20 XP</b> — révision accomplie');
      title = 'Épreuve accomplie';
      sub = 'Revenir sur ses pas, c’est aussi avancer.';
    }
    s.last = Date.now();
    const frs = newFragments();
    if (rankIdx(st.xp) > beforeRank) gains.push(`✦ Nouveau rang : <b>${esc(rankName(st.xp))}</b>`);
    save(true);
    CU.sfx.tier();
    CU.music && CU.music.swell();
    flash(g.hue);
    const canNext = v.mode === 'normal' && s.tier < 3 && s.tier <= maxAllowed(v.id);
    const ov = document.createElement('div');
    ov.className = 'ov cu-ov';
    ov.style.setProperty('--hue', v.ti === 2 && v.mode === 'normal' ? '#f5d79a' : g.hue);
    ov.innerHTML = `<div class="ov-inner">${CU.ART.seal(v.ti === 2 && v.mode === 'normal' ? '#f5d79a' : g.hue, sd.glyph)}
<h2>${esc(title)}</h2><div class="ital">${esc(sub)}</div>
${v.mode === 'normal' && v.ti === 0 ? `<div class="law" style="text-align:left">${H(sd.law)}</div>` : ''}
<div class="gains">${gains.map((x, i) => `<div class="gain" style="animation-delay:${0.6 + i * 0.15}s">${x}</div>`).join('')}</div>
${frs.map((f) => `<div class="frag"><h4>FRAGMENT DU CODEX — ${esc(f.title.toUpperCase())}</h4>${f.text}</div>`).join('')}
<div class="actions">${canNext ? `<button class="btn primary" id="ov-next">Continuer — ${TN[s.tier]}</button>` : ''}<button class="btn ${canNext ? '' : 'primary'}" id="ov-back">Retour : ${esc(g.short)}</button></div></div>`;
    document.body.appendChild(ov);
    if (canNext)
      $('#ov-next', ov).onclick = () => {
        ov.remove();
        launch(v.id, s.tier);
      };
    $('#ov-back', ov).onclick = () => {
      ov.remove();
      view = null;
      history.replaceState(null, '', '#/r/' + sd.region);
      renderRegion(sd.region, v.id);
    };
    setTimeout(() => ($('#ov-next', ov) || $('#ov-back', ov)).focus(), 400);
  }
  function newFragments() {
    const tt = totalTiers(),
      out = [];
    for (const f of CU.FRAGMENTS)
      if (tt >= f.at && !st.frags.includes(f.id)) {
        st.frags.push(f.id);
        out.push(f);
      }
    return out;
  }

  /* ================= gardiens ================= */
  function startBoss(rid) {
    closeSheet();
    const fin = rid === 'final';
    const g = fin ? null : CU.region(rid);
    const b = fin ? CU.FINAL : g.boss;
    setHue('#e0475b', '#3a0f16');
    const pool = fin ? CU.ORDER.filter((id) => CU.FINAL.needs.includes(S(id).region)) : regionSkills(rid);
    view = { kind: 'boss', rid: fin ? null : rid, final: fin, b, pool, hp: b.hp, lives: 3, combo: 0, over: false };
    mood('boss');
    history.pushState(null, '', '#/b/' + rid);
    app.innerHTML = `<div class="trial">
<div class="trial-head"><button class="back" id="quit" aria-label="Fuir">‹</button><div class="ttl"><small style="color:#ff8494">${esc(b.title)}</small><b>${esc(b.name)}</b></div><div class="combo" id="combo"></div><div class="lives" id="lives"></div></div>
<div class="bossbar"><div class="portrait" id="por">${CU.ART.boss(b.glyph, '#e0475b', 64)}</div><div style="flex:1"><div class="taunt" id="taunt">« ${esc(b.taunt)} »</div><div class="hp" id="hp"></div></div></div>
<div id="stage"></div></div>`;
    $('#quit').onclick = () => {
      CU.sfx.click();
      view = null;
      fin ? go('#/world') : go('#/r/' + rid);
    };
    paintBoss();
    CU.sfx.hurt();
    nextQuestion();
  }
  function paintBoss() {
    const v = view;
    $('#hp').innerHTML = [...Array(v.b.hp)].map((_, i) => `<i class="${i >= v.hp ? 'gone' : ''}"></i>`).join('');
    $('#lives').innerHTML = [0, 1, 2].map((i) => `<span class="${i >= v.lives ? 'lost' : ''}">🕯</span>`).join('');
    const c = $('#combo');
    c.textContent = v.combo >= 2 ? '×' + v.combo : '';
    c.classList.toggle('on', v.combo >= 2);
  }
  const HITS = ['Le coup porte !', 'Il chancelle.', 'Sa garde se fissure.', 'Un cri glacial répond à ta réponse.'];
  const HURTS = ['Il frappe : une lueur s’éteint.', 'Sa riposte te glace.', 'Tu recules sous le choc.'];
  function bossHit(first) {
    const v = view;
    const crit = first && v.combo >= 3;
    const dmg = crit ? 2 : 1;
    v.hp = Math.max(0, v.hp - dmg);
    CU.sfx.hit();
    const por = $('#por');
    por.classList.remove('hit');
    void por.offsetWidth;
    por.classList.add('hit');
    const [x, y] = center(por);
    sparks(x, y, '#ff6b7d', crit ? 34 : 18);
    if (crit) floatText(x + 30, y, 'CRITIQUE ×2');
    $('#taunt').textContent = crit ? 'Coup critique ! Le gardien hurle.' : R.pick(HITS);
    paintBoss();
    $('#extra').insertAdjacentHTML('beforeend', `<details class="sol" style="padding:10px 14px"><summary style="cursor:pointer;color:var(--mute)">Voir l’explication</summary>${H(v.ex.sol)}</details>`);
    if (v.hp <= 0) {
      v.over = true;
      return setTimeout(bossWin, 700);
    }
    nextButton('Frapper encore →');
  }
  function bossHurt() {
    const v = view;
    v.lives--;
    v.answered = true;
    CU.sfx.hurt();
    flash('#e0475b');
    $('#taunt').textContent = R.pick(HURTS);
    paintBoss();
    if (v.ui.reveal) v.ui.reveal();
    $('#extra').insertAdjacentHTML('beforeend', `<div class="sol">${H(v.ex.sol)}</div>`);
    if (v.lives <= 0) {
      v.over = true;
      return nextButtonEnd();
    }
    nextButton('Se relever →');
  }
  function nextButtonEnd() {
    const b = $('#btns');
    b.innerHTML = `<div class="grow"></div><button class="btn primary blood" id="nxt">Fin du combat</button>`;
    $('#nxt').onclick = bossLose;
    setTimeout(() => $('#nxt').focus(), 50);
  }
  function bossWin() {
    const v = view;
    const key = v.final ? 'final' : v.rid;
    const firstWin = !st.bosses[key];
    st.bosses[key] = true;
    const gain = firstWin ? (v.final ? 1000 : 300) : 60;
    st.xp += gain;
    save(true);
    CU.sfx.victory();
    CU.music && CU.music.swell();
    flash('#f5d79a');
    const g = v.final ? null : CU.region(v.rid);
    const ov = document.createElement('div');
    ov.className = 'ov cu-ov';
    ov.style.setProperty('--hue', '#f5d79a');
    ov.innerHTML = `<div class="ov-inner">${CU.ART.seal('#f5d79a', v.b.glyph)}<h2>${esc(v.b.name)} est vaincu${v.b.name.startsWith('La ') || v.b.name.startsWith('L’Archère') ? 'e' : ''}</h2>
<div class="gains"><div class="gain"><b>+${gain} XP</b>${firstWin ? '' : ' — revanche'}</div>${firstWin && !v.final ? `<div class="gain">👑 ${esc(g.name)} sont libérés de la brume.</div>` : ''}</div>
${firstWin ? `<div class="frag"><h4>${v.final ? 'ÉPILOGUE' : 'FRAGMENT DU CODEX — ' + esc(g.name.toUpperCase())}</h4>${CU.BOSS_TEXT[key]}</div>` : ''}
<div class="actions"><button class="btn primary" id="ov-back">${v.final ? 'Contempler le monde' : 'Voir la région restaurée'}</button></div></div>`;
    document.body.appendChild(ov);
    $('#ov-back', ov).onclick = () => {
      ov.remove();
      view = null;
      if (v.final) {
        history.replaceState(null, '', '#/world');
        renderWorld();
      } else {
        history.replaceState(null, '', '#/r/' + v.rid);
        renderRegion(v.rid);
      }
    };
  }
  function bossLose() {
    const v = view;
    const ov = document.createElement('div');
    ov.className = 'ov cu-ov';
    ov.style.setProperty('--hue', '#e0475b');
    ov.innerHTML = `<div class="ov-inner">${CU.ART.boss(v.b.glyph, '#e0475b', 120)}<h2>Repoussé</h2><div class="ital">« ${esc(v.b.taunt)} »<br>Corvin se pose sur ton épaule : « Ce n’est qu’un premier assaut. Revois les Lois qui t’ont trahi, puis reviens. »</div>
<div class="actions"><button class="btn primary blood" id="ov-again">Retenter</button><button class="btn" id="ov-back">Battre en retraite</button></div></div>`;
    document.body.appendChild(ov);
    $('#ov-again', ov).onclick = () => (ov.remove(), startBoss(v.final ? 'final' : v.rid));
    $('#ov-back', ov).onclick = () => {
      ov.remove();
      view = null;
      v.final ? go('#/world') : go('#/r/' + v.rid);
    };
  }


  /* ================= arène des automatismes (chronométrée) ================= */
  // seuls les automatismes sont chronométrés ; le temps dépend du type de calcul
  const AUTO = [
    { id: 'v1', t: 2, s: 30 },
    { id: 'v2', t: 1, s: 25 },
    { id: 'v3', t: 0, s: 35 },
    { id: 'v4', t: 0, s: 25 },
    { id: 'v4', t: 1, s: 40 },
    { id: 'v5', t: 0, s: 25 },
    { id: 'v6', t: 0, s: 25 },
    { id: 'f1', t: 0, s: 35 },
    { id: 'f1', t: 1, s: 45 },
    { id: 'f2', t: 0, s: 25 },
    { id: 'f2', t: 1, s: 35 },
    { id: 'f2', t: 2, s: 35 },
    { id: 'f3', t: 0, s: 25 },
    { id: 'f3', t: 1, s: 30 },
    { id: 'f4', t: 0, s: 20 },
    { id: 'f4', t: 1, s: 35 },
    { id: 'f5', t: 0, s: 35 },
    { id: 'q1', t: 0, s: 45 },
    { id: 'q2', t: 0, s: 25 },
    { id: 'q2', t: 1, s: 45 },
    { id: 'q3', t: 0, s: 30 },
  ];
  const arenaPool = () => AUTO.filter((a) => tierOf(a.id) > a.t);
  function openArenaSheet() {
    const pool = arenaPool(),
      best = (st.arena && st.arena.best) || 0;
    const names = [...new Set(pool.map((a) => S(a.id).name))];
    const bg = sheet(
      `<div class="top"><div class="bigg">⏳</div><div><div class="place">Contre la montre</div><h2>L’Arène des Automatismes</h2><div class="ital" style="font-size:1.05rem;margin-top:4px">Ici, on ne démontre pas : on dégaine. Ce qu’on sait vraiment, on doit le savoir vite.</div></div></div>
<p style="color:var(--mute);margin-top:14px">Des calculs tirés des Lois que tu as déjà brisées, l’un après l’autre. Chacun a son temps, plus long pour les calculs plus lourds, et le temps se resserre à mesure que ton score monte. Un temps écoulé ou une erreur te coûtent une lueur ; à la troisième, la partie s’arrête. Pas d’indice.</p>
${best ? `<p class="law" style="text-align:center">Ton record : <b>${best}</b></p>` : ''}
${pool.length ? `<p class="note">${pool.length} types de calculs disponibles : ${names.map(esc).join(', ')}.</p>` : `<div class="req">L’Arène s’ouvre dès que tu as brisé un premier sceau de calcul (vecteurs, calcul littéral ou second degré).</div>`}
<div class="actions">${pool.length ? '<button class="btn primary gold" id="ar-go">Entrer dans l’Arène</button>' : ''}<button class="btn ghost" id="ar-cl">Fermer</button></div>`,
      '#d9ab5b',
    );
    $('#ar-cl', bg).onclick = closeSheet;
    if (pool.length) $('#ar-go', bg).onclick = () => (closeSheet(), startArena());
  }
  function startArena() {
    const pool = arenaPool();
    if (!pool.length) return;
    setHue('#d9ab5b');
    view = { kind: 'arena', pool, lives: 3, score: 0, combo: 0, over: false, last: null, cur: null, xp0: st.xp };
    mood('arena');
    history.pushState(null, '', '#/a');
    app.innerHTML = `<div class="trial">
<div class="trial-head"><button class="back" id="quit" aria-label="Quitter">‹</button><div class="ttl"><small>Contre la montre</small><b>L’Arène des Automatismes</b></div><div class="combo" id="combo"></div><div class="arscore" id="arscore">0</div><div class="lives" id="lives"></div></div>
<div class="clock"><i id="clockbar"></i><span id="clocktxt"></span></div>
<div id="stage"></div></div>`;
    $('#quit').onclick = () => {
      CU.sfx.click();
      stopClock();
      const v = view;
      view = null;
      if (v.score) recordArena(v);
      go('#/world');
    };
    paintArena();
    nextQuestion();
  }
  function arenaQuestion() {
    const v = view;
    let a;
    do a = R.pick(v.pool);
    while (v.pool.length > 1 && a === v.last);
    v.last = a;
    v.cur = a;
    const ex = S(a.id).gen[a.t]();
    ex._sid = a.id;
    // le temps se resserre avec le score, sans descendre sous 60 %
    v.limit = a.s * Math.max(0.6, 1 - 0.015 * v.score);
    return ex;
  }
  function paintArena() {
    const v = view;
    $('#lives').innerHTML = [0, 1, 2].map((i) => `<span class="${i >= v.lives ? 'lost' : ''}">🕯</span>`).join('');
    $('#arscore').textContent = v.score;
    const c = $('#combo');
    c.textContent = v.combo >= 2 ? '×' + v.combo : '';
    c.classList.toggle('on', v.combo >= 2);
  }
  let clockRaf = null;
  function stopClock() {
    cancelAnimationFrame(clockRaf);
    clockRaf = null;
  }
  function arenaClock() {
    const v = view;
    stopClock();
    v.remaining = v.limit * 1000;
    let lastT = performance.now();
    const bar = $('#clockbar'),
      txt = $('#clocktxt');
    const tick = (now) => {
      if (view !== v || v.answered) return;
      // l'horloge s'arrête quand la page est cachée
      if (!document.hidden) v.remaining -= now - lastT;
      lastT = now;
      const f = Math.max(0, v.remaining / (v.limit * 1000));
      bar.style.width = (100 * f).toFixed(1) + '%';
      bar.className = f < 0.25 ? 'low' : '';
      txt.textContent = Math.ceil(Math.max(0, v.remaining) / 1000) + ' s';
      if (v.remaining <= 0) return arenaMiss(true);
      clockRaf = requestAnimationFrame(tick);
    };
    clockRaf = requestAnimationFrame(tick);
  }
  function arenaHit() {
    const v = view;
    stopClock();
    paintArena();
    // on enchaîne vite : c'est le rythme qui fait l'automatisme
    setTimeout(() => {
      if (view === v && !v.over) nextQuestion();
    }, 650);
  }
  function arenaMiss(timeout) {
    const v = view;
    stopClock();
    v.answered = true;
    v.combo = 0;
    v.lives--;
    if (timeout) {
      CU.sfx.wrong();
      const card = $('#card');
      card.classList.add('bad');
      $('#fb').className = 'feedback bad';
      $('#fb').textContent = 'Temps écoulé !';
      if (v.ui.lock) v.ui.lock();
    }
    if (v.ui.reveal) v.ui.reveal();
    $('#extra').insertAdjacentHTML('beforeend', `<div class="sol">${H(v.ex.sol)}</div>`);
    paintArena();
    if (v.lives <= 0) v.over = true;
    nextButton(v.over ? 'Fin de la partie' : 'Suivant →');
  }
  function recordArena(v) {
    st.arena = st.arena || { best: 0, runs: 0 };
    const rec = v.score > st.arena.best;
    st.arena.best = Math.max(st.arena.best, v.score);
    st.arena.runs++;
    if (rec && v.score >= 3) st.xp += 40;
    save(true);
    return rec;
  }
  function arenaEnd() {
    const v = view;
    const prev = (st.arena && st.arena.best) || 0;
    const rec = recordArena(v);
    if (rec && v.score >= 3) {
      CU.sfx.victory();
      CU.music && CU.music.swell();
    }
    const ov = document.createElement('div');
    ov.className = 'ov cu-ov';
    ov.style.setProperty('--hue', '#d9ab5b');
    ov.innerHTML = `<div class="ov-inner"><div class="arena-big">${v.score}</div><h2>${rec && v.score ? 'Nouveau record !' : 'Fin de la partie'}</h2>
<div class="ital">${v.score >= 20 ? 'Tes automatismes sont des réflexes. Les Informes n’ont même pas le temps de te voir.' : v.score >= 10 ? 'Rapide et sûr. Encore un peu, et ce sera un réflexe.' : 'Chaque partie aiguise la lame. Reviens demain : la vitesse vient avec la répétition.'}</div>
<div class="gains"><div class="gain"><b>+${st.xp - v.xp0} XP</b> gagnés dans l’Arène</div><div class="gain">Record : <b>${Math.max(prev, v.score)}</b>${rec && prev ? ` (ancien : ${prev})` : ''}${rec && v.score >= 3 ? ' — bonus de record <b>+40 XP</b>' : ''}</div></div>
<div class="actions"><button class="btn primary gold" id="ov-again">Rejouer</button><button class="btn" id="ov-back">Retour à la carte</button></div></div>`;
    document.body.appendChild(ov);
    $('#ov-again', ov).onclick = () => (ov.remove(), startArena());
    $('#ov-back', ov).onclick = () => {
      ov.remove();
      view = null;
      history.replaceState(null, '', '#/world');
      renderWorld();
    };
    setTimeout(() => $('#ov-again', ov).focus(), 300);
  }

  /* ================= codex ================= */
  function renderCodex(tab = 'lois') {
    view = { kind: 'codex' }; mood('explore');
    setHue('#d9ab5b');
    const tt = totalTiers();
    let body;
    if (tab === 'lois')
      body = CU.REGIONS.map(
        (g) =>
          `<h2 style="font-size:1rem;color:${g.hue};margin:22px 0 10px;letter-spacing:.1em">${esc(g.name.toUpperCase())}</h2><div class="pages">${regionSkills(g.id)
            .map((id) => {
              const t = tierOf(id);
              return t >= 1
                ? `<div class="page" style="--hue:${t === 3 ? '#f5d79a' : g.hue}"><h3>${esc(S(id).glyph)} ${esc(S(id).name)} <span class="seals" style="display:inline-flex;margin-left:8px">${[0, 1, 2].map((i) => `<i class="${t > i ? (t === 3 ? 'gold' : 'on') : ''}"></i>`).join('')}</span></h3><div class="law">${H(S(id).law)}</div></div>`
                : `<div class="page torn">Page arrachée — ${esc(S(id).place)}</div>`;
            })
            .join('')}</div>`,
      ).join('');
    else
      body =
        `<div class="pages"><div class="frag"><h4>PROLOGUE</h4>${CU.PROLOGUE.map((p) => `<p style="margin:0 0 10px">${p}</p>`).join('')}</div>` +
        CU.FRAGMENTS.map((f) => (st.frags.includes(f.id) ? `<div class="frag"><h4>${esc(f.title.toUpperCase())}</h4>${f.text}</div>` : `<div class="page torn">Fragment scellé — se révèle au ${f.at}<sup>e</sup> sceau brisé (${tt}/${f.at}).</div>`)).join('') +
        CU.REGIONS.concat([{ id: 'final', name: 'Épilogue' }])
          .filter((g) => st.bosses[g.id])
          .map((g) => `<div class="frag"><h4>${esc(g.name.toUpperCase())}</h4>${CU.BOSS_TEXT[g.id]}</div>`)
          .join('') +
        '</div>';
    app.innerHTML =
      hud({ label: 'Carte', hash: '#/world' }) +
      `<div class="wrap"><div class="world-head"><h1>Le Codex</h1><div class="ital">${tt} sceaux brisés sur ${3 * CU.ORDER.length}. Chaque Loi comprise s’y réécrit.</div></div>
<div class="tabs"><button class="${tab === 'lois' ? 'on' : ''}" data-tab="lois">Les Lois</button><button class="${tab === 'frag' ? 'on' : ''}" data-tab="frag">L’histoire</button></div>${body}</div>`;
    wireHud({ label: 'Carte', hash: '#/world' });
    $$('[data-tab]').forEach((b) => (b.onclick = () => (CU.sfx.click(), renderCodex(b.dataset.tab))));
  }

  /* ================= composants d'exercice ================= */
  const RENDER = {};
  // champs de saisie avec aperçu et clavier
  RENDER.fields = (zone, ex) => {
    const inline = ex.inline;
    zone.innerHTML =
      `<div class="fieldrow ${inline ? 'inline-wrap' : ''}">${ex.fields
        .map(
          (f, i) =>
            `<div class="fld"><label for="f${i}">${H(f.label)}</label><input class="inp" id="f${i}" data-kind="${f.kind}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" ${f.kind === 'num' && !ex.fields.some((g) => g.kind !== 'num') ? 'inputmode="text"' : ''} placeholder="${f.kind === 'set' ? 'ex. -2 ; 3/2' : f.kind === 'expr' ? 'ex. 3x(2x-1)' : f.kind === 'text' ? '' : 'ex. -3/2'}" />${f.kind !== 'text' ? `<div class="prev" id="p${i}"></div>` : ''}</div>`,
        )
        .join('')}</div>` +
      (ex.fields.some((f) => f.kind !== 'text')
        ? `<div class="keys">${(ex.fields.some((f) => f.kind === 'expr') ? ['x', 'x²', '(', ')', '−', '/', '√'] : ['−', '/', '√', '(', ')']).concat(ex.fields.some((f) => f.kind === 'set') ? [';'] : []).map((k) => `<button type="button" data-k="${k}">${k}</button>`).join('')}${ex.emptyBtn ? `<button type="button" data-k="aucune" style="font-family:var(--font-u)">aucune</button>` : ''}</div>`
        : '');
    let lastInp = $('.inp', zone);
    $$('.inp', zone).forEach((inp, i) => {
      inp.addEventListener('focus', () => (lastInp = inp));
      inp.addEventListener('input', () => paint(inp, i));
    });
    function paint(inp, i) {
      const p = $('#p' + i, zone);
      if (!p) return;
      const t = CU.preview(inp.value, inp.dataset.kind);
      if (t === '' || t == null) {
        p.className = 'prev' + (t == null ? ' badsyn' : '');
        p.textContent = t == null ? '…' : '';
      } else {
        p.className = 'prev';
        p.innerHTML = H('$' + t + '$');
      }
    }
    $$('[data-k]', zone).forEach((b) => {
      b.addEventListener('pointerdown', (e) => e.preventDefault());
      b.onclick = () => {
        const inp = lastInp;
        if (!inp) return;
        const k = b.dataset.k;
        if (k === 'aucune') inp.value = 'aucune';
        else {
          const ins = { 'x²': 'x²', '−': '-', ';': ' ; ' }[k] || k;
          const s0 = inp.selectionStart ?? inp.value.length,
            s1 = inp.selectionEnd ?? inp.value.length;
          inp.value = inp.value.slice(0, s0) + ins + inp.value.slice(s1);
          const c = s0 + ins.length;
          inp.setSelectionRange && inp.setSelectionRange(c, c);
        }
        inp.focus({ preventScroll: true });
        paint(inp, +inp.id.slice(1));
        CU.sfx.click();
      };
    });
    return {
      get() {
        const vals = $$('.inp', zone).map((i) => i.value);
        if (vals.some((x) => !x.trim())) {
          $('#fb').className = 'feedback bad';
          $('#fb').textContent = 'Remplis ' + (vals.length > 1 ? 'tous les champs.' : 'le champ.');
          return null;
        }
        return vals;
      },
      lock() {
        $$('.inp', zone).forEach((i) => (i.disabled = true));
      },
      reveal() {
        $$('.inp', zone).forEach((i) => (i.disabled = true));
      },
    };
  };
  RENDER.choice = (zone, ex) => {
    zone.innerHTML = `<div class="choices">${ex.choices.map((c, i) => `<button class="choice" data-i="${i}">${H(c)}</button>`).join('')}</div>`;
    $$('.choice', zone).forEach((b) => (b.onclick = () => submit(+b.dataset.i)));
    return {
      wrong(i) {
        const b = $(`.choice[data-i="${i}"]`, zone);
        b.classList.add('wrong');
        b.disabled = true;
      },
      lock() {
        $$('.choice', zone).forEach((b) => (b.disabled = true));
        $(`.choice[data-i="${ex.correct}"]`, zone).classList.add('right');
      },
      reveal() {
        this.lock();
      },
    };
  };
  RENDER.order = (zone, ex) => {
    zone.innerHTML = `<div class="ord-zone" id="oz"></div><div class="note" style="margin-top:10px">${ex.items.length > ex.n ? 'Attention : ' + (ex.items.length - ex.n > 1 ? 'des intrus se sont glissés' : 'un intrus s’est glissé') + ' parmi les étapes.' : ''}</div><div class="ord-pool" id="op"></div>`;
    const placed = [];
    const pool = ex.items.slice();
    const cls = 'step' + (ex.code ? ' codey' : '');
    function paint() {
      $('#oz', zone).innerHTML = placed.map((it, i) => `<button class="${cls}" data-p="${i}">${H(it.h)}</button>`).join('');
      $('#op', zone).innerHTML = pool.map((it, i) => `<button class="${cls}" data-q="${i}">${H(it.h)}</button>`).join('');
      $$('[data-p]', zone).forEach((b) => (b.onclick = () => (pool.push(placed.splice(+b.dataset.p, 1)[0]), CU.sfx.click(), paint())));
      $$('[data-q]', zone).forEach((b) => (b.onclick = () => (placed.push(pool.splice(+b.dataset.q, 1)[0]), CU.sfx.place(), paint())));
      const ok = $('#ok');
      if (ok) ok.disabled = placed.length !== ex.n;
    }
    paint();
    return {
      get: () => placed.slice(),
      lock() {
        $$('button', zone).forEach((b) => (b.disabled = true));
      },
      reveal() {
        const right = ex.items.filter((it) => typeof it.k === 'number').sort((a, b) => a.k - b.k);
        $('#oz', zone).innerHTML = right.map((it) => `<div class="${cls}">${H(it.h)}</div>`).join('');
        $('#op', zone).innerHTML = '';
      },
    };
  };
  // ----- grille -----
  const U = 40;
  function gridSvg(g, extra = '', opts = {}) {
    const W = (g.x1 - g.x0 + 1) * U,
      Hh = (g.y1 - g.y0 + 1) * U;
    const px = (x) => (x - g.x0 + 0.5) * U,
      py = (y) => (g.y1 - y + 0.5) * U;
    let s = `<svg viewBox="0 0 ${W} ${Hh}" xmlns="http://www.w3.org/2000/svg"><defs>
<marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--hue)"/></marker>
<marker id="ah2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#f5d79a"/></marker>
<filter id="ggl" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${Hh}"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
    for (let x = g.x0; x <= g.x1; x++) s += `<line x1="${px(x)}" y1="${py(g.y1) - U / 2}" x2="${px(x)}" y2="${py(g.y0) + U / 2}" stroke="${x === 0 ? '#5a5266' : '#1f1b27'}" stroke-width="${x === 0 ? 2 : 1}"/>`;
    for (let y = g.y0; y <= g.y1; y++) s += `<line x1="${px(g.x0) - U / 2}" y1="${py(y)}" x2="${px(g.x1) + U / 2}" y2="${py(y)}" stroke="${y === 0 ? '#5a5266' : '#1f1b27'}" stroke-width="${y === 0 ? 2 : 1}"/>`;
    if (opts.labels !== false) {
      for (let x = g.x0; x <= g.x1; x++) if (x && x % 2 === 0) s += `<text x="${px(x)}" y="${py(0) + 15}" font-size="11" fill="#6f6878" text-anchor="middle">${x}</text>`;
      for (let y = g.y0; y <= g.y1; y++) if (y && y % 2 === 0) s += `<text x="${px(0) - 7}" y="${py(y) + 4}" font-size="11" fill="#6f6878" text-anchor="end">${y}</text>`;
    }
    for (const v of g.vecs || []) {
      const c = v.c === 'w' ? '#f5d79a' : 'var(--hue)';
      s += `<line x1="${px(v.a[0])}" y1="${py(v.a[1])}" x2="${px(v.b[0])}" y2="${py(v.b[1])}" stroke="${c}" stroke-width="3.5" marker-end="url(#${v.c === 'w' ? 'ah2' : 'ah'})" filter="url(#ggl)"/><circle cx="${px(v.a[0])}" cy="${py(v.a[1])}" r="4" fill="${c}"/>`;
      if (v.l) {
        const mx = (px(v.a[0]) + px(v.b[0])) / 2,
          my = (py(v.a[1]) + py(v.b[1])) / 2;
        const dx = py(v.b[1]) - py(v.a[1]),
          dy = -(px(v.b[0]) - px(v.a[0])),
          L = Math.hypot(dx, dy) || 1;
        s += `<text x="${mx + (dx / L) * 16}" y="${my + (dy / L) * 16 + 6}" font-size="20" font-style="italic" font-family="serif" fill="${c}" text-anchor="middle">${v.l}</text>`;
      }
    }
    for (const p of g.pts || []) s += `<circle cx="${px(p.x)}" cy="${py(p.y)}" r="6" fill="#ece6da"/><text x="${px(p.x) + 9}" y="${py(p.y) - 9}" font-size="19" font-family="serif" font-style="italic" fill="#ece6da">${p.l}</text>`;
    s += extra(px, py);
    return s + '</svg>';
  }
  RENDER.grid = (zone, ex) => {
    const g = ex.grid,
      W = (g.x1 - g.x0 + 1) * U;
    let sel = null,
      locked = false;
    function draw() {
      zone.innerHTML =
        `<div class="gridwrap">${gridSvg(g, (px, py) => {
          let s = '';
          if (ex.type === 'grid')
            for (let x = g.x0; x <= g.x1; x++)
              for (let y = g.y0; y <= g.y1; y++) s += `<g class="gp" data-x="${x}" data-y="${y}"><circle class="hit" cx="${px(x)}" cy="${py(y)}" r="${U / 2}" fill="transparent"/><circle cx="${px(x)}" cy="${py(y)}" r="3" fill="#3a3344"/></g>`;
          if (sel) s += `<circle cx="${px(sel[0])}" cy="${py(sel[1])}" r="11" fill="none" stroke="var(--hue)" stroke-width="3" filter="url(#ggl)"/><circle cx="${px(sel[0])}" cy="${py(sel[1])}" r="5" fill="var(--hue)"/>`;
          if (ex._show) s += `<circle cx="${px(ex.answerPt[0])}" cy="${py(ex.answerPt[1])}" r="13" fill="none" stroke="#7ee2a8" stroke-width="3"/>`;
          return s;
        })}</div><div class="note" style="text-align:center;margin-top:6px">${sel ? 'Point choisi : (' + sel[0] + ' ; ' + sel[1] + ')' : 'Touche un nœud de la grille.'}</div>`;
      $$('.gp', zone).forEach(
        (el) =>
          (el.onclick = () => {
            if (locked) return;
            sel = [+el.dataset.x, +el.dataset.y];
            CU.sfx.place();
            draw();
          }),
      );
    }
    draw();
    return {
      get: () => sel || ($('#fb').textContent = 'Touche d’abord un point de la grille.', null),
      lock() {
        locked = true;
      },
      reveal() {
        locked = true;
        ex._show = true;
        draw();
      },
    };
  };
  // Pour les exercices à champs qui s'appuient sur une grille (lecture de vecteur)
  const baseFields = RENDER.fields;
  RENDER.fields = (zone, ex) => {
    if (!ex.showGrid) return baseFields(zone, ex);
    const top = document.createElement('div');
    top.innerHTML = `<div class="gridwrap">${gridSvg(ex.grid, () => '')}</div>`;
    const rest = document.createElement('div');
    rest.style.marginTop = '14px';
    zone.append(top, rest);
    return baseFields(rest, ex);
  };
  RENDER.jump = (zone, ex) => {
    const g = ex.grid;
    let pos = ex.S.slice(),
      path = [ex.S.slice()],
      moves = [],
      locked = false;
    const key = (p) => p[0] + ',' + p[1];
    const pits = new Set(ex.pits.map(key));
    const fmt = (m) => `(${m[0]} ; ${m[1]})`;
    const lbl = { u: ex.u, v: ex.v };
    function expr() {
      const a = moves.reduce((s, m) => s + (m[1] === 'u' ? (m[0] === '+' ? 1 : -1) : 0), 0),
        b = moves.reduce((s, m) => s + (m[1] === 'v' ? (m[0] === '+' ? 1 : -1) : 0), 0);
      const t = (k, n) => (k === 0 ? '' : (k === 1 ? '' : k === -1 ? '-' : k) + n);
      let e = t(a, '\\vec u');
      const tb = t(b, '\\vec v');
      if (tb) e += e && b > 0 ? ' + ' + tb : tb;
      return e || '\\vec 0';
    }
    function draw() {
      zone.innerHTML = `<div class="gridwrap">${gridSvg(
        g,
        (px, py) => {
          let s = '';
          for (const p of ex.pits) s += `<rect x="${px(p[0]) - 15}" y="${py(p[1]) - 15}" width="30" height="30" rx="7" fill="#2a0a10" stroke="#e0475b" stroke-width="1.5"/><text x="${px(p[0])}" y="${py(p[1]) + 6}" font-size="16" text-anchor="middle">☠</text>`;
          s += `<circle cx="${px(ex.Tg[0])}" cy="${py(ex.Tg[1])}" r="15" fill="none" stroke="#f5d79a" stroke-width="3" filter="url(#ggl)"/><text x="${px(ex.Tg[0])}" y="${py(ex.Tg[1]) + 6}" font-size="16" text-anchor="middle" fill="#f5d79a" font-family="Cinzel,serif">R</text>`;
          s += `<text x="${px(ex.S[0])}" y="${py(ex.S[1]) - 14}" font-size="16" fill="#ece6da" text-anchor="middle" font-family="Cinzel,serif">S</text>`;
          if (path.length > 1) s += `<polyline points="${path.map((p) => px(p[0]) + ',' + py(p[1])).join(' ')}" fill="none" stroke="var(--hue)" stroke-width="3" stroke-dasharray="6 5" opacity=".8"/>`;
          s += `<circle cx="${px(pos[0])}" cy="${py(pos[1])}" r="11" fill="var(--hue)" filter="url(#ggl)"/><circle cx="${px(pos[0]) - 3}" cy="${py(pos[1]) - 2}" r="2" fill="#000"/><circle cx="${px(pos[0]) + 3}" cy="${py(pos[1]) - 2}" r="2" fill="#000"/>`;
          return s;
        },
        { labels: false },
      )}</div>
<div class="jumpinfo"><span>Sauts : <b>${moves.length}</b> / ${ex.limit}</span><span>${H('$\\overrightarrow{SM} = ' + expr() + '$')}</span></div>
<div class="movepad"><button data-m="+u">+u ${fmt(lbl.u)}</button><button data-m="-u">−u</button><button data-m="+v">+v ${fmt(lbl.v)}</button><button data-m="-v">−v</button></div>
<div class="row" style="margin-top:8px"><button class="btn ghost small" id="undo">↶ Annuler</button><button class="btn ghost small" id="reset">⟲ Recommencer</button></div>`;
      $$('[data-m]', zone).forEach((b) => (b.onclick = () => move(b.dataset.m)));
      $('#undo', zone).onclick = () => {
        if (locked || !moves.length) return;
        moves.pop();
        path.pop();
        pos = path[path.length - 1].slice();
        draw();
      };
      $('#reset', zone).onclick = () => {
        if (locked) return;
        reset();
        draw();
      };
    }
    function reset() {
      pos = ex.S.slice();
      path = [ex.S.slice()];
      moves = [];
    }
    function move(m) {
      if (locked) return;
      const d = lbl[m[1]],
        sgn = m[0] === '+' ? 1 : -1;
      const n = [pos[0] + sgn * d[0], pos[1] + sgn * d[1]];
      if (n[0] < g.x0 || n[0] > g.x1 || n[1] < g.y0 || n[1] > g.y1) {
        CU.sfx.wrong();
        $('#fb').className = 'feedback close';
        $('#fb').textContent = 'Ce saut sortirait de la carte.';
        return;
      }
      pos = n;
      path.push(n.slice());
      moves.push(m);
      CU.sfx.place();
      draw();
      $('#fb').textContent = '';
      if (pits.has(key(pos))) {
        reset();
        submit('Ton spectre est tombé dans un gouffre ! Il revient en S.');
        draw();
        return;
      }
      if (pos[0] === ex.Tg[0] && pos[1] === ex.Tg[1]) return submit(true);
      if (moves.length >= ex.limit) {
        reset();
        submit(`${ex.limit} sauts, et la rune n’est pas atteinte. Ton spectre revient en S.`);
        draw();
      }
    }
    draw();
    return {
      get: () => null,
      lock() {
        locked = true;
      },
      reveal() {
        locked = true;
      },
    };
  };
  RENDER.toggle = (zone, ex) => {
    const val = ex.people.map(() => null);
    function draw() {
      zone.innerHTML = `<div class="people">${ex.people
        .map((p, i) => `<div class="person"><div class="says"><b>${esc(p.name)}</b> déclare :<i>« ${esc(p.says)} »</i></div><button class="tog ${val[i] === true ? 'k' : val[i] === false ? 'n' : ''}" data-i="${i}">${val[i] === true ? '⚔ Chevalier' : val[i] === false ? '🎭 Fripon' : '? Choisir'}</button></div>`)
        .join('')}</div>`;
      $$('.tog', zone).forEach(
        (b) =>
          (b.onclick = () => {
            const i = +b.dataset.i;
            val[i] = val[i] === null ? true : val[i] === true ? false : true;
            CU.sfx.place();
            draw();
            const ok = $('#ok');
            if (ok) ok.disabled = val.some((x) => x === null);
          }),
      );
    }
    draw();
    setTimeout(() => {
      const ok = $('#ok');
      if (ok) ok.disabled = true;
    });
    return {
      get: () => (val.some((x) => x === null) ? null : val.slice()),
      lock() {
        $$('.tog', zone).forEach((b) => (b.disabled = true));
      },
      reveal() {
        ex.answer.forEach((x, i) => (val[i] = x));
        draw();
        this.lock();
      },
    };
  };
  RENDER.baliste = (zone, ex) => {
    const sc = ex.scene;
    const W = 600,
      Hh = 340,
      m = 30;
    const X = (x) => m + ((x + 0.5) / (sc.xmax + 0.5)) * (W - 2 * m),
      Y = (y) => Hh - m - ((y + 0.5) / (sc.ymax + 0.5)) * (Hh - 2 * m);
    const sceneSvg = (traj, hit) => {
      let s = `<svg viewBox="0 0 ${W} ${Hh}"><defs><filter id="bgl" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${Hh}"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
      for (let x = 0; x <= sc.xmax; x++) s += `<line x1="${X(x)}" y1="${Y(0)}" x2="${X(x)}" y2="${Y(sc.ymax)}" stroke="#1a1622"/>${x % 2 === 0 ? `<text x="${X(x)}" y="${Y(0) + 16}" font-size="11" fill="#6f6878" text-anchor="middle">${x}</text>` : ''}`;
      for (let y = 0; y <= sc.ymax; y++) s += `<line x1="${X(0)}" y1="${Y(y)}" x2="${X(sc.xmax)}" y2="${Y(y)}" stroke="#1a1622"/>${y && y % 2 === 0 ? `<text x="${X(0) - 6}" y="${Y(y) + 4}" font-size="11" fill="#6f6878" text-anchor="end">${y}</text>` : ''}`;
      s += `<rect x="0" y="${Y(0)}" width="${W}" height="${Hh - Y(0)}" fill="#120f18"/><line x1="0" y1="${Y(0)}" x2="${W}" y2="${Y(0)}" stroke="#5a5266" stroke-width="2"/>`;
      if (sc.start[1] > 0) s += `<rect x="${X(sc.start[0]) - 26}" y="${Y(sc.start[1])}" width="26" height="${Y(0) - Y(sc.start[1])}" fill="#1b1724" stroke="#3a3344"/>`;
      if (sc.tower) s += `<rect x="${X(sc.tower[0]) - 14}" y="${Y(sc.tower[1])}" width="28" height="${Y(0) - Y(sc.tower[1])}" fill="#1b1724" stroke="#e0475b"/><path d="M${X(sc.tower[0]) - 14} ${Y(sc.tower[1])} v-8 h8 v8 h4 v-8 h8 v8 h4 v-8 h4" stroke="#e0475b" fill="none"/>`;
      s += `<path d="M${X(sc.start[0]) - 12} ${Y(sc.start[1])} l12 -18 l12 18z" fill="var(--hue)"/>`;
      if (sc.goal) s += `<text x="${X(sc.goal[0])}" y="${Y(sc.goal[1]) - 4}" font-size="26" text-anchor="middle">👹</text>`;
      if (sc.peak) s += `<circle cx="${X(sc.peak[0])}" cy="${Y(sc.peak[1])}" r="6" fill="none" stroke="#f5d79a" stroke-width="2" stroke-dasharray="3 3"/><text x="${X(sc.peak[0]) + 10}" y="${Y(sc.peak[1]) - 8}" font-size="13" fill="#f5d79a">sommet</text>`;
      if (sc.mark) s += `<rect x="${X(sc.mark[0]) - 8}" y="${Y(sc.mark[1])}" width="16" height="${Y(0) - Y(sc.mark[1])}" fill="#1b1724" stroke="#f5d79a"/><circle cx="${X(sc.mark[0])}" cy="${Y(sc.mark[1])}" r="5" fill="#f5d79a"/>`;
      if (traj && traj.length > 1) s += `<polyline points="${traj.map((p) => X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(' ')}" fill="none" stroke="${hit ? '#f5d79a' : 'var(--hue)'}" stroke-width="3" filter="url(#bgl)"/><circle cx="${X(traj[traj.length - 1][0])}" cy="${Y(traj[traj.length - 1][1])}" r="6" fill="#fff" filter="url(#bgl)"/>`;
      return s + '</svg>';
    };
    zone.innerHTML = `<div class="gridwrap" id="bs">${sceneSvg()}</div><div style="margin-top:14px" id="bf"></div>`;
    const ui = baseFields($('#bf', zone), ex);
    let anim = null;
    function fire(poly, hit, done) {
      const pts = [];
      const x0 = sc.start[0];
      for (let x = x0; x <= sc.xmax + 0.5; x += 0.05) {
        const y = CU.P.at(poly, x);
        pts.push([x, y]);
        if (y < -0.4 || y > sc.ymax + 1) break;
      }
      let i = 0;
      cancelAnimationFrame(anim);
      const step = () => {
        i = Math.min(pts.length, i + 3);
        $('#bs', zone).innerHTML = sceneSvg(pts.slice(0, i), hit && i >= pts.length);
        if (i < pts.length) anim = requestAnimationFrame(step);
        else done && done();
      };
      step();
    }
    return {
      get() {
        const a = ui.get();
        if (!a) return null;
        let poly = null;
        try {
          poly = CU.polyOf(CU.parse(a[0]));
        } catch {}
        if (poly && !ex._firing) {
          const ok = CU.P.eq(poly, ex.target);
          ex._firing = true;
          CU.sfx.click();
          fire(poly, ok, () => {
            ex._firing = false;
            submit(a);
          });
          return null;
        }
        return ex._firing ? null : a;
      },
      lock: ui.lock,
      reveal() {
        ui.reveal();
        fire(ex.target, true);
      },
    };
  };

  /* ================= démarrage ================= */
  function boot() {
    if (!CU.ORDER.length) return;
    let last = null;
    try {
      last = JSON.parse(localStorage.getItem('codex-umbra-last') || 'null');
    } catch {}
    // reprise automatique sur cet appareil
    if (last && CU.save.local(last.key)) {
      KEY = last.key;
      st = CU.save.local(last.key);
      if (!st.prologue) return renderPrologue(0);
      if (location.hash.startsWith('#/t/') || location.hash.startsWith('#/b/')) history.replaceState(null, '', '#/world');
      route();
      CU.save
        .cloudGet(KEY)
        .then((c) => {
          if (c && c.updated > st.updated) {
            st = CU.save.merge(st, c);
            CU.save.storeLocal(KEY, st);
            if (view && (view.kind === 'world' || view.kind === 'region')) route();
          }
          syncState = 'ok';
          paintSync();
        })
        .catch(() => {
          syncState = 'offline';
          paintSync();
        });
      document.addEventListener('pointerdown', () => CU.sfx.unlock(), { once: true });
      return;
    }
    renderTitle();
  }
  // KaTeX est chargé en différé : on attend qu'il soit là (ou abandonne après 4 s)
  let waited = 0;
  (function wait() {
    if (window.katex || waited > 4000) return boot();
    waited += 50;
    setTimeout(wait, 50);
  })();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('./sw.js').catch(() => {});
  CU.debug = { get st() { return st; }, set st(x) { st = x; }, get view() { return view; }, save, go, route, available, tierOf, sk, win: () => success(), submit: (a) => submit(a), startTrial, startBoss, renderRegion, startArena };
})();
