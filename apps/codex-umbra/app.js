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
  const blank = (name) => ({ v: CU.SAVE_V, name, xp: 0, skills: {}, bosses: {}, frags: [], stats: { solved: 0, bestCombo: 0 }, prologue: false, updated: Date.now() });
  const sk = (id) => st.skills[id] || (st.skills[id] = { tier: 0, prog: 0, seen: [], last: 0, done: 0 });
  CU.finalizeGraph(); // prérequis des Lois écrites, tirés du graphe (graph.js)
  const S = (id) => CU.SKILLS[id];
  /* Règles d'ouverture des Lois et des rangs : rules.js (partagées avec les tests). */
  const { tierOf, needMet, allVariants, openVariants, tierContent, started, available, maxAllowed } = CU.makeRules(() => st.skills);
  // un exercice tiré uniquement parmi les variantes accessibles
  const genFor = (id, ti) => {
    const vs = openVariants(id, ti);
    return (vs.length ? R.pick(vs) : S(id).gen[ti])();
  };
  const needLabel = (n) => {
    const [id, k] = n.split(':');
    return `${S(id).name} — sceau ${TN[(+k || 1) - 1]} (${CU.region(S(id).region).short})`;
  };
  // ce qu'il manque pour ouvrir un rang : une liste d'alternatives (une par variante)
  const missingFor = (id, ti) => ti > 2 ? [] : [...new Set(allVariants(id, ti).map((v) => (v.needs || []).filter((n) => !needMet(n)).map(needLabel).join(' et ')).filter(Boolean))];
  const regionSkills = (rid) => CU.ORDER.filter((id) => S(id).region === rid);
  const regionP = (rid) => {
    const ids = regionSkills(rid);
    return ids.reduce((s, id) => s + tierOf(id), 0) / (3 * ids.length);
  };
  const regionOpen = (rid) => regionSkills(rid).some(available);
  const allAdept = (rid) => regionSkills(rid).every((id) => tierOf(id) >= 2);
  const recallWins = (sc) => ((st.recall || {})[sc] || {}).wins || 0;
  // le gardien s'éveille quand toutes les Lois sont au rang Adepte ET qu'un souvenir a été gravé à l'Autel
  const bossOpen = (rid) => allAdept(rid) && recallWins(rid) >= 1;
  const finalOpen = () => CU.FINAL.needs.every((r) => st.bosses[r]) && recallWins('all') >= 1;
  const totalTiers = () => CU.ORDER.reduce((s, id) => s + tierOf(id), 0);
  const NEED = { v7: 3, f6: 3, q6: 3, p3: 3, l2: 4 };
  const need = (id) => NEED[id] || 5;
  /* ---------- mémoire : répétition espacée (boîtes de Leitner) ----------
     Chaque palier acquis (Loi × rang) a une boîte b et une date de révision due.
     Réussi du premier coup à l'échéance : boîte suivante, révision repoussée (1, 3, 7, 15, 30, 60 jours).
     Manqué : on recule de deux boîtes et l'on revoit dès le lendemain. */
  const IV = [1, 3, 7, 15, 30, 60];
  const mk = (id, ti) => id + ':' + ti;
  function memOf(id, ti) {
    st.mem = st.mem || {};
    // progression antérieure à la mémoire : à revoir tout de suite
    return st.mem[mk(id, ti)] || (st.mem[mk(id, ti)] = { b: 0, due: (st.skills[id] && st.skills[id].last) || Date.now(), t: 0 });
  }
  function memSet(id, ti, ok) {
    const m = memOf(id, ti),
      now = Date.now();
    if (ok) {
      if (m.due > now) return; // pas encore à l'échéance : rien ne change
      m.b = Math.min(IV.length - 1, m.b + 1);
    } else m.b = Math.max(0, m.b - 2);
    m.due = now + IV[m.b] * DAY;
    m.t = now;
  }
  function memFresh(id, ti) {
    st.mem = st.mem || {};
    st.mem[mk(id, ti)] = { b: 0, due: Date.now() + DAY, t: Date.now() };
  }
  const scopeIds = (sc) => (sc === 'all' ? CU.ORDER : regionSkills(sc));
  function memItems(sc) {
    const out = [];
    for (const id of scopeIds(sc)) for (let ti = 0; ti < Math.min(3, tierOf(id)); ti++) out.push({ id, ti, m: memOf(id, ti) });
    return out;
  }
  const dueN = (sc) => memItems(sc).filter((x) => x.m.due <= Date.now()).length;
  const RECALL_MIN = (sc) => (sc === 'all' ? 6 : 3);
  const recallOpen = (sc) => memItems(sc).length >= RECALL_MIN(sc);
  // braise : un palier dont la révision est en retard de plus de deux jours
  const emberTier = (id) => {
    let best = -1,
      d = Infinity;
    for (let ti = 0; ti < Math.min(3, tierOf(id)); ti++) {
      const m = memOf(id, ti);
      if (m.due < Date.now() - 2 * DAY && m.due < d) {
        d = m.due;
        best = ti;
      }
    }
    return best;
  };
  const ember = (id) => tierOf(id) >= 1 && emberTier(id) >= 0;
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

  /* ---------- barre d'expérience : toujours visible, elle monte à chaque gain ---------- */
  const xpPct = (xp) => {
    const i = rankIdx(xp),
      lo = CU.RANKS[i][0],
      hi = (CU.RANKS[i + 1] || [lo + 1])[0];
    return i + 1 >= CU.RANKS.length ? 100 : Math.max(0, Math.min(100, (100 * (xp - lo)) / (hi - lo)));
  };
  const xpLabel = (xp) => {
    const i = rankIdx(xp),
      nx = CU.RANKS[i + 1];
    return nx ? `${xp - CU.RANKS[i][0]} / ${nx[0] - CU.RANKS[i][0]}` : `${xp} XP`;
  };
  let shownXp = null,
    dockEl = null,
    dockTimer = null;
  function paintXp() {
    dockEl = dockEl || $('#xpdock');
    if (!dockEl) return;
    if (!st || !st.prologue) {
      dockEl.classList.remove('on');
      document.body.classList.remove('hasdock');
      shownXp = null;
      return;
    }
    if (!dockEl.firstChild)
      dockEl.innerHTML = `<div class="xd-in"><div class="xd-flame" id="xd-flame"></div><div class="xd-rank"><small>RANG</small><b id="xd-name"></b></div><div class="xd-track"><i class="xd-fill" id="xd-fill"></i><i class="xd-spark" id="xd-spark"></i><span class="xd-txt" id="xd-txt"></span></div><div class="xd-next" id="xd-next"></div></div>`;
    dockEl.classList.add('on');
    document.body.classList.add('hasdock');
    const fl = $('#xd-flame');
    if (fl && st.streak) {
      const today = dk(Date.now());
      fl.textContent = '🔥' + streakCur();
      fl.className = 'xd-flame' + (hasDay(today) ? ' lit' : '');
      fl.title = hasDay(today) ? 'Défis du jour accomplis' : 'Défis du jour à accomplir';
    }
    const fill = $('#xd-fill'),
      name = $('#xd-name'),
      txt = $('#xd-txt'),
      nx = $('#xd-next');
    const setStatic = (xp) => {
      const nxr = CU.RANKS[rankIdx(xp) + 1];
      name.textContent = CU.RANKS[rankIdx(xp)][1];
      nx.textContent = nxr ? '→ ' + nxr[1] : '✦ max';
      txt.textContent = xpLabel(xp);
      fill.style.width = xpPct(xp) + '%';
    };
    if (shownXp === null || st.xp < shownXp) {
      shownXp = st.xp;
      return setStatic(st.xp);
    }
    if (st.xp === shownXp) return;
    const from = shownXp,
      to = st.xp;
    shownXp = to;
    const up = rankIdx(to) > rankIdx(from);
    clearTimeout(dockTimer);
    dockEl.classList.remove('gain');
    void dockEl.offsetWidth;
    dockEl.classList.add('gain');
    txt.textContent = xpLabel(up ? from : to);
    if (!up) {
      fill.style.width = xpPct(to) + '%';
      dockTimer = setTimeout(() => dockEl.classList.remove('gain'), 1400);
      return;
    }
    // changement de rang : la barre se remplit, éclate, puis repart du nouveau rang
    fill.style.width = '100%';
    dockTimer = setTimeout(() => {
      dockEl.classList.add('rankup');
      CU.sfx.tier();
      const [x, y] = center($('#xd-fill'));
      sparks(x, y, '#f5d79a', 36);
      banner('✦ Nouveau rang', CU.RANKS[rankIdx(to)][1]);
      fill.style.transition = 'none';
      fill.style.width = '0%';
      void fill.offsetWidth;
      fill.style.transition = '';
      setStatic(to);
      setTimeout(() => dockEl.classList.remove('rankup', 'gain'), 1800);
    }, 950);
  }
  function banner(top, big) {
    const b = document.createElement('div');
    b.className = 'rankbanner' + (String(big).length > 22 ? ' long' : '');
    b.innerHTML = `<small>${top}</small><b>${esc(big)}</b>`;
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 3200);
  }
  // le « +N XP » vole vers la barre
  function flyXp(x, y, n) {
    const d = $('#xpdock');
    if (!d || !d.classList.contains('on')) return floatText(x, y, '+' + n + ' XP');
    const t = $('#xd-fill').getBoundingClientRect();
    const e = document.createElement('div');
    e.className = 'flyxp';
    e.textContent = '+' + n + ' XP';
    e.style.left = x - 30 + 'px';
    e.style.top = y - 20 + 'px';
    fx.appendChild(e);
    requestAnimationFrame(() => {
      e.style.transform = `translate(${Math.min(innerWidth - 80, t.left + t.width) - x}px, ${t.top - y}px) scale(.7)`;
      e.style.opacity = '.15';
    });
    setTimeout(() => e.remove(), 900);
  }
  // barre intégrée aux écrans de fin : de l'XP du début de l'épreuve à l'XP actuel
  function xpInline(from) {
    const to = st.xp,
      i = rankIdx(to),
      up = rankIdx(from) < i;
    const p0 = up ? 0 : xpPct(from);
    return `<div class="xpin" data-p="${xpPct(to).toFixed(1)}"><div class="xpin-h"><b>${esc(CU.RANKS[i][1])}</b><span>${xpLabel(to)}${CU.RANKS[i + 1] ? ' → ' + esc(CU.RANKS[i + 1][1]) : ''}</span></div><div class="xd-track big"><i class="xd-fill" style="width:${p0.toFixed(1)}%"></i></div>${to > from ? `<div class="xpin-g">+${to - from} XP${up ? ' · <b>nouveau rang !</b>' : ''}</div>` : ''}</div>`;
  }
  function growInline(root) {
    const el = $('.xpin', root);
    if (!el) return;
    setTimeout(() => ($('.xd-fill', el).style.width = el.dataset.p + '%'), 900);
  }

  /* ================= sauvegarde ================= */
  let cloudTimer = null,
    syncState = 'local';
  function save(now = false) {
    st.updated = Date.now();
    paintXp();
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
      // on relit d'abord le cloud : un autre appareil a pu y écrire depuis notre dernier passage,
      // et l'envoi remplace la sauvegarde distante. La fusion garde le meilleur des deux.
      const c = await CU.save.cloudGet(KEY);
      if (c && CU.save.mergeInto(st, c)) {
        CU.save.storeLocal(KEY, st);
        paintXp();
      }
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
    paintXp();
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
    if (h.startsWith('/m/') && view && view.kind === 'recall') return;
    if (h.startsWith('/t/') || h.startsWith('/b/') || h.startsWith('/m/') || h === '/a') {
      const rid = view && view.rid;
      return rid ? go('#/r/' + rid) : renderWorld();
    }
    renderWorld();
  }

  /* ================= écran titre ================= */
  function renderTitle() {
    paintXp();
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
    st = all ? CU.save.migrate(all) : blank(name);
    st.name = st.name || name;
    st.frags = st.frags || [];
    st.bosses = st.bosses || {};
    st.stats = st.stats || { solved: 0, bestCombo: 0 };
    qinit();
    dailyRoll();
    checkAch();
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
<div class="who"><div class="name">${esc(st.name)}${st.title ? ` <small class="wtitle">${esc(st.title)}</small>` : ''}</div><div class="rank">${esc(x.name)} · ${st.xp} XP</div></div>
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
    dailyRoll();
    checkAch();
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
${questPanel()}
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
          const dn = recallOpen(g.id) ? dueN(g.id) : 0;
          return `<button class="rcard ${g.open ? '' : 'locked'}" data-region="${g.id}" style="--hue:${g.hue}"><span class="ic">${esc(g.icon)}</span><h3>${esc(g.name)}</h3><div class="sub">${esc(g.open ? g.sub : lockedWhy)}</div><div class="prog"><i style="width:${(100 * g.p).toFixed(0)}%"></i></div><div class="meta"><span>${g.short} · ${done}/${ids.length} Lois maîtrisées</span><span>${dn ? `<span class="memdot">◈ ${dn}</span> ` : ''}${g.boss ? '👑 Gardien vaincu' : bossOpen(g.id) ? '⚔ Gardien éveillé' : ''}</span></div></button>`;
        })
        .join('')}
${(() => {
  const op = recallOpen('all'),
    dn = op ? dueN('all') : 0;
  return `<button class="rcard final-card memory-card ${op ? '' : 'locked'}" id="cloister"><span class="ic">◈</span><h3>Le Cloître de la Mémoire</h3><div class="sub">${op ? (dn ? `${dn} souvenir${dn > 1 ? 's' : ''} s’estompe${dn > 1 ? 'nt' : ''}, toutes régions mêlées.` : 'Tous tes souvenirs tiennent. Reviens quand l’Oubli rôdera.') : 'S’ouvre au 6e sceau brisé : on y revoit, mélangé, tout ce que tu as appris.'}</div><div class="meta"><span>${recallWins('all') ? 'Souvenirs gravés : ' + recallWins('all') : ''}</span><span>${dn ? '<span class="memdot">◈ ' + dn + '</span>' : ''}</span></div></button>`;
})()}
<button class="rcard final-card arena-card ${arenaPool().length ? '' : 'locked'}" id="arena"><span class="ic">⏳</span><h3>L’Arène des Automatismes</h3><div class="sub">${arenaPool().length ? 'Calcul mental, développements, discriminants… contre la montre.' : 'S’ouvre dès ton premier sceau de calcul.'}</div><div class="meta"><span>${st.arena && st.arena.best ? 'Record : ' + st.arena.best : arenaPool().length ? arenaPool().length + ' types de calculs' : ''}</span></div></button>
<button class="rcard final-card ${fo ? '' : 'locked'}" id="fin"><span class="ic">${CU.FINAL.glyph}</span><h3>Le Sanctuaire du Codex</h3><div class="sub">${fd ? 'Le Roi Sans Loi est vaincu. Le Codex t’appartient.' : fo ? 'Le Roi Sans Loi t’attend.' : 'Vaincs les gardiens des Remparts, des Cryptes et de la Tour, et grave un souvenir au Cloître, pour ouvrir le Sanctuaire.'}</div><div class="meta"><span>${CU.FINAL.needs.map((r) => (st.bosses[r] ? '👑' : '◇')).join(' ')} ${recallWins('all') ? '◈' : '◇'}</span></div></button>
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
    const fin = () => (fo ? startBoss('final') : (CU.sfx.wrong(), toast(CU.FINAL.needs.every((r) => st.bosses[r]) ? 'Le Sanctuaire attend un souvenir gravé au Cloître de la Mémoire.' : 'Le Sanctuaire est scellé par trois gardiens.')));
    $('#fin').onclick = fin;
    $('#cloister').onclick = () => (CU.sfx.click(), openRecallSheet('all'));
    $('#arena').onclick = () => (CU.sfx.click(), openArenaSheet());
    const fs = $('[data-final]');
    if (fs) fs.onclick = fin;
    if (sug) $('#sug').onclick = () => (CU.sfx.click(), launch(sug, tierOf(sug)));
  }

  /* ================= région ================= */
  // emplacement de l'Autel du Souvenir sur chaque scène (repère 1000 × 1000)
  const ALTAR = { vec: [270, 300], fac: [260, 300], quad: [260, 290], py: [250, 470], log: [250, 470] };
  function renderRegion(rid, flashId) {
    view = { kind: 'region', rid }; mood('explore');
    const g = CU.region(rid);
    setHue(g.hue, g.deep);
    const ids = regionSkills(rid);
    const status = (id) => {
      const t = tierOf(id);
      if (!available(id)) return '⛓ scellée';
      if (t === 3) return '✦ Maîtrisée';
      return TN[t] + (sk(id).prog ? ' · ' + sk(id).prog + '/' + need(id) : '');
    };
    const nodes = ids.map((id) => ({ id, x: S(id).x, y: S(id).y, name: S(id).name, glyph: S(id).glyph, tier: tierOf(id), state: available(id) ? 'open' : 'locked', isNew: available(id) && tierOf(id) === 0 && !sk(id).prog, ember: ember(id), sub: status(id) }));
    const edges = [];
    for (const id of ids) for (const r of S(id).req) if (S(r).region === rid) edges.push({ a: r, b: id, state: tierOf(r) >= 1 ? (tierOf(id) >= 1 ? 'lit' : 'open') : 'locked' });
    const aOpen = recallOpen(rid),
      aDue = aOpen ? dueN(rid) : 0;
    const altar = { x: ALTAR[rid][0], y: ALTAR[rid][1], open: aOpen, due: aDue, wins: recallWins(rid), sub: aOpen ? (aDue ? aDue + ' à raviver' : recallWins(rid) ? '✦ ' + recallWins(rid) + ' gravé' + (recallWins(rid) > 1 ? 's' : '') : 'S’entraîner') : '⛓ ' + RECALL_MIN(rid) + ' sceaux' };
    const bossWhy = st.bosses[rid] ? '👑 Vaincu — tu peux le défier à nouveau' : bossOpen(rid) ? '⚔ Il t’attend' : !allAdept(rid) ? 'S’éveille quand toutes les Lois de la région sont au rang Adepte et qu’un souvenir est gravé à l’Autel' : 'Toutes les Lois sont Adepte : grave un souvenir à l’Autel pour l’éveiller';
    app.innerHTML =
      hud({ label: 'Carte', hash: '#/world' }) +
      `<div class="wrap">
<div class="region-title"><h1>${esc(g.name)}</h1><div class="ital">${esc(st.bosses[rid] ? g.healed : g.intro)}</div></div>
<div class="scene">${CU.ART.scene({ region: g, p: regionP(rid), bossDone: !!st.bosses[rid], bossOpen: bossOpen(rid), nodes, edges, altar })}</div>
<div class="maphint">Touche une Loi sur la carte, l’Autel du Souvenir ◈ pour réviser, ou le gardien.</div>
<details class="listwrap"><summary>Liste des Lois</summary><div class="list">${ids
        .map((id) => {
          const t = tierOf(id),
            av = available(id);
          return `<button class="lrow ${av ? '' : 'locked'}" data-id="${id}"><span class="g">${esc(S(id).glyph)}</span><span class="t"><b>${esc(S(id).name)}</b><small>${av ? (t === 3 ? 'Loi maîtrisée' : TN[t] + (sk(id).prog ? ' · ' + sk(id).prog + '/' + need(id) + ' éclats' : '')) : '⛓ scellée'}${ember(id) ? ' · 🔥 à raviver' : ''}</small></span><span class="seals">${[0, 1, 2].map((i) => `<i class="${t > i ? (t === 3 ? 'gold' : 'on') : ''}"></i>`).join('')}</span></button>`;
        })
        .join('')}
<button class="lrow ${aOpen ? '' : 'locked'}" data-recall="1" style="--hue:#c8b6ff"><span class="g">◈</span><span class="t"><b>L’Autel du Souvenir</b><small>${aOpen ? (aDue ? aDue + ' souvenir' + (aDue > 1 ? 's' : '') + ' à raviver' : 'Aucun souvenir ne s’estompe') + ' · gravés : ' + recallWins(rid) : 's’allume au ' + RECALL_MIN(rid) + 'e sceau brisé de la région'}</small></span></button>
<button class="lrow" data-boss="1" style="--hue:#e0475b"><span class="g">${esc(g.boss.glyph)}</span><span class="t"><b>${esc(g.boss.name)}</b><small>${bossWhy}</small></span></button>
</div></details>
<div class="foot"><span class="syncdot"></span></div></div>`;
    wireHud({ label: 'Carte', hash: '#/world' });
    paintSync();
    $$('[data-id]').forEach((el) => {
      el.onclick = () => (CU.sfx.click(), openSheet(el.dataset.id));
      el.onkeydown = (e) => e.key === 'Enter' && openSheet(el.dataset.id);
    });
    $$('[data-boss]').forEach((el) => {
      el.onclick = () => (CU.sfx.click(), openBossSheet(rid));
      el.onkeydown = (e) => e.key === 'Enter' && openBossSheet(rid);
    });
    $$('[data-recall]').forEach((el) => {
      el.onclick = () => (CU.sfx.click(), openRecallSheet(rid));
      el.onkeydown = (e) => e.key === 'Enter' && openRecallSheet(rid);
    });
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

  // pourquoi un rang est fermé, et ce qui l'ouvrira
  function lockHtml(id) {
    const s = S(id),
      t = tierOf(id);
    const reqList = (lvl) =>
      `<ul>${s.req
        .map((r) => {
          const met = tierOf(r) >= lvl;
          return `<li class="${met ? 'met' : ''}">${met ? '✓' : '◇'} ${esc(S(r).name)} — rang ${TN[lvl - 1]} (${esc(CU.region(S(r).region).short)})</li>`;
        })
        .join('')}</ul>`;
    // droits acquis : le rang ouvert d'une Loi commencée n'est jamais présenté comme fermé
    if (started(id) && t < 3 && t <= maxAllowed(id)) return '';
    if (!s.req.every((r) => tierOf(r) >= 1)) return `<div class="req"><b>Cette Loi est scellée.</b> Il faut d’abord :${reqList(1)}</div>`;
    if (t >= 3) return '';
    if (t >= 2 && !s.req.every((r) => tierOf(r) >= 2)) return `<div class="req"><b>Le sceau Maître est encore scellé.</b> Il faut d’abord :${reqList(2)}</div>`;
    if (!tierContent(id, t)) {
      const alts = missingFor(id, t);
      return `<div class="req"><b>${t === 0 ? 'Cette Loi' : 'Le sceau ' + TN[t]} utilise des notions vues dans d’autres régions.</b> ${alts.length > 1 ? 'Il s’ouvrira dès que tu auras brisé l’un de ces sceaux :' : 'Il s’ouvrira dès que tu auras brisé :'}<ul>${alts.map((a) => `<li>◇ ${esc(a)}</li>`).join('')}</ul></div>`;
    }
    return '';
  }
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
<div class="ladder">${TN.map((n, i) => `<div class="rung ${t > i ? 'done' : t === i && av && i <= ma ? 'cur' : ''} ${i > ma && t <= i ? 'lock' : ''}"><div class="dia"></div><b>${n}</b>${t > i ? 'sceau brisé' : i > ma ? '⛓' : t === i && av ? (sk(id).prog || 0) + '/' + need(id) + ' éclats' : ''}</div>`).join('')}</div>
${lockHtml(id)}
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
          if (a === 'revive') launch(id, Math.max(0, emberTier(id)), 'revive');
          if (a === 'lesson') openLesson(id, Math.max(0, Math.min(av ? Math.max(t, 0) : 0, 2)));
        }),
    );
  }
  /* ---------- le Grimoire : cours, méthode, exemples résolus ---------- */
  // exemples tirés en direct des générateurs : un par variante d'exercice (au plus trois)
  function examplesFor(id, ti) {
    const gfun = S(id).gen[ti],
      ov = openVariants(id, ti),
      vs = gfun.variants ? (ov.length ? ov : gfun.variants) : [gfun, gfun, gfun],
      out = [],
      seen = new Set();
    for (const v of vs) {
      for (let k = 0; k < 5; k++) {
        let ex;
        try {
          ex = v();
        } catch {
          continue;
        }
        const key = ex.q + (ex.type || '');
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(ex);
        break;
      }
      if (out.length >= (gfun.variants ? 3 : 2)) break;
    }
    return out;
  }
  const answerPtSvg = (ex) => (px, py) => `<circle cx="${px(ex.answerPt[0])}" cy="${py(ex.answerPt[1])}" r="13" fill="none" stroke="#7ee2a8" stroke-width="3"/><circle cx="${px(ex.answerPt[0])}" cy="${py(ex.answerPt[1])}" r="5" fill="#7ee2a8"/>`;
  function jumpSvg(ex) {
    return gridSvg(
      ex.grid,
      (px, py) => {
        let s = '';
        for (const p of ex.pits) s += `<rect x="${px(p[0]) - 15}" y="${py(p[1]) - 15}" width="30" height="30" rx="7" fill="#2a0a10" stroke="#e0475b" stroke-width="1.5"/><text x="${px(p[0])}" y="${py(p[1]) + 6}" font-size="16" text-anchor="middle">☠</text>`;
        s += `<circle cx="${px(ex.Tg[0])}" cy="${py(ex.Tg[1])}" r="15" fill="none" stroke="#f5d79a" stroke-width="3"/><text x="${px(ex.Tg[0])}" y="${py(ex.Tg[1]) + 6}" font-size="16" text-anchor="middle" fill="#f5d79a" font-family="Cinzel,serif">R</text>`;
        s += `<circle cx="${px(ex.S[0])}" cy="${py(ex.S[1])}" r="9" fill="var(--hue)"/><text x="${px(ex.S[0])}" y="${py(ex.S[1]) - 14}" font-size="16" fill="#ece6da" text-anchor="middle" font-family="Cinzel,serif">S</text>`;
        return s;
      },
      { labels: false },
    );
  }
  // ce que l'élève voit de l'énoncé (figure, choix, étapes…)
  function exFigure(ex) {
    if (ex.type === 'grid') return `<div class="gridwrap mini">${gridSvg(ex.grid)}</div>`;
    if (ex.type === 'jump') return `<div class="gridwrap mini">${jumpSvg(ex)}</div><p class="note">Sauts : $\\vec u${CU.N.col(...ex.u)}$ et $\\vec v${CU.N.col(...ex.v)}$ (et leurs opposés), ${ex.limit} au plus.</p>`;
    if (ex.grid && ex.showGrid) return `<div class="gridwrap mini">${gridSvg(ex.grid)}</div>`;
    if (ex.type === 'choice') return `<ul class="wch">${ex.choices.map((c) => `<li>${c}</li>`).join('')}</ul>`;
    if (ex.type === 'toggle') return `<ul class="wch">${ex.people.map((p) => `<li><b>${esc(p.name)}</b> : « ${esc(p.says)} »</li>`).join('')}</ul>`;
    if (ex.type === 'order') return `<p class="note">${ex.items.length} étapes proposées, ${ex.n} à garder et à ordonner.</p>`;
    return '';
  }
  // la réponse attendue, avant l'explication
  function exAnswer(ex) {
    if (ex.type === 'grid') return `<div class="gridwrap mini">${gridSvg(ex.grid, answerPtSvg(ex))}</div>`;
    if (ex.type === 'choice') return `<p><b>Réponse :</b> ${ex.choices[ex.correct]}</p>`;
    if (ex.type === 'toggle') return `<p><b>Réponse :</b> ${ex.people.map((p, i) => esc(p.name) + ' est ' + (ex.answer[i] ? 'chevalier' : 'fripon')).join(', ')}.</p>`;
    if (ex.type === 'order') {
      const right = ex.items.filter((it) => typeof it.k === 'number').sort((a, b) => a.k - b.k);
      const bad = ex.items.filter((it) => typeof it.k !== 'number');
      return `<ol class="wsteps ${ex.code ? 'codey' : ''}">${right.map((it) => `<li>${it.h}</li>`).join('')}</ol>${bad.length ? `<p class="note"><b>Intrus :</b> ${bad.map((it) => it.h).join(' — ')}</p>` : ''}`;
    }
    return '';
  }
  function exampleHtml(ex, i) {
    return `<div class="wex"><div class="wq"><b>Exemple ${i + 1}.</b> ${ex.q}</div>${exFigure(ex)}<details><summary>Voir la solution</summary>${exAnswer(ex)}<div class="wsol">${ex.sol}</div></details></div>`;
  }
  function openLesson(id, ti, then, opts = {}) {
    const s = S(id),
      g = CU.region(s.region);
    let cur = Math.max(0, Math.min(2, ti));
    const bg = sheet('<div id="grim-root"></div>', g.hue);
    bg.querySelector('.sheet').classList.add('wide');
    const root = $('#grim-root', bg);
    function paintExamples() {
      const box = $('#exs', root);
      try {
        box.innerHTML = H(examplesFor(id, cur).map(exampleHtml).join(''));
      } catch (e) {
        box.innerHTML = '<p class="note">Les exemples n’ont pas pu être tirés.</p>';
      }
    }
    function paint() {
      root.innerHTML = `<div class="top"><div class="bigg">${esc(s.glyph)}</div><div><div class="place">Le Grimoire · ${esc(g.short)}</div><h2>${esc(s.name)}</h2></div></div>
<div class="gtabs" role="tablist">${TN.map((n, i) => `<button role="tab" class="${i === cur ? 'on' : ''}" data-gt="${i}">${n}${tierOf(id) > i ? ' ✓' : ''}</button>`).join('')}</div>
<div class="grim">
<h3>L’essentiel</h3>${H(s.lessons[cur])}
${s.methods ? `<h3>Méthode</h3>${H(s.methods[cur])}` : ''}
<h3>Exemples résolus</h3><p class="note">Tirés au hasard, comme dans l’épreuve. Cherche d’abord, puis ouvre la solution.</p><div id="exs"></div>
<div class="row"><button class="btn ghost small" id="moreex">↻ D’autres exemples</button></div>
<h3>La Loi à retenir</h3><div class="law">${H(s.law)}</div>
</div>
<div class="actions">${then ? `<button class="btn primary" id="lgo">J’ai compris — à l’épreuve</button>` : `<button class="btn" id="lgo">${esc(opts.back || 'Fermer')}</button>`}</div>`;
      $$('[data-gt]', root).forEach(
        (b) =>
          (b.onclick = () => {
            CU.sfx.click();
            cur = +b.dataset.gt;
            paint();
            bg.querySelector('.sheet').scrollTop = 0;
          }),
      );
      $('#moreex', root).onclick = () => (CU.sfx.click(), paintExamples());
      $('#lgo', root).onclick = () => {
        CU.sfx.click();
        closeSheet();
        then && then();
      };
      paintExamples();
    }
    paint();
  }
  function openBossSheet(rid) {
    const g = CU.region(rid),
      b = g.boss,
      open = bossOpen(rid);
    const bg = sheet(
      `<div class="top">${CU.ART.boss(b.glyph, '#e0475b', 72)}<div><div class="place" style="color:#ff8494">${esc(b.title)}</div><h2>${esc(b.name)}</h2><div class="taunt">« ${esc(b.taunt)} »</div></div></div>
<p style="color:var(--mute);margin-top:16px">Un combat sans indice : chaque bonne réponse le blesse, chaque erreur te coûte une lueur. Trois bonnes réponses d’affilée portent un <b>coup critique</b>. Les questions viennent de toutes les Lois de la région, aux rangs Adepte et Maître.</p>
${open ? '' : `<div class="req">Le gardien dort encore. Il s’éveillera quand toutes les Lois de la région auront atteint le rang <b>Adepte</b> et qu’un souvenir aura été gravé à l’Autel.<ul>${regionSkills(rid).map((id) => `<li class="${tierOf(id) >= 2 ? 'met' : ''}">${tierOf(id) >= 2 ? '✓' : '◇'} ${esc(S(id).name)}</li>`).join('')}<li class="${recallWins(rid) ? 'met' : ''}">${recallWins(rid) ? '✓' : '◇'} Un souvenir gravé à l’Autel du Souvenir</li></ul></div>`}
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
      xp0: st.xp,
      pure: true,
      need: mode === 'revive' ? 3 : need(id),
      got: mode === 'normal' && !replay ? ss.prog || 0 : 0,
      combo: 0,
    };
    T0.pure = T0.got === 0;
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
    if (v.kind === 'recall') return paintRecall();
    $('#shards').innerHTML = [...Array(v.need)].map((_, i) => `<i class="shard ${i < v.got ? 'on' : ''}"></i>`).join('');
    const c = $('#combo');
    c.textContent = v.combo >= 2 ? '×' + v.combo : '';
    c.classList.toggle('on', v.combo >= 2);
  }
  // une erreur : la série d'affilée du monde retombe, et la question suivante devient un « redressement »
  function koEvent(v) {
    const sid = v.kind === 'trial' ? v.id : v.kind === 'arena' ? v.cur && v.cur.id : v.kind === 'recall' ? v.item && v.item.id : v.ex && v.ex._sid;
    if (sid) quest('ko', { rid: S(sid).region });
  }
  function nextQuestion() {
    const v = view;
    v.prevKo = !!(v.ex && (v.tries > 0 || v.gaveUp));
    v.grimKo = false;
    v.gaveUp = false;
    let ex;
    if (v.kind === 'boss') {
      const id = R.pick(v.pool);
      const ti = R.pick([1, 2, 2].filter((t) => tierContent(id, t))) ?? 0;
      ex = genFor(id, ti);
      ex._sid = id;
    } else if (v.kind === 'arena') ex = arenaQuestion();
    else if (v.kind === 'recall') ex = recallQuestion();
    else ex = genFor(v.id, v.ti);
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
      boss = v.kind === 'boss' || v.kind === 'arena' || v.kind === 'recall',
      cours = v.kind === 'trial' || v.kind === 'recall';
    const stage = $('#stage');
    stage.innerHTML = `<div class="card" id="card">
${boss && v.kind !== 'recall' ? `<div class="place" style="color:var(--hue);font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px">${esc(S(ex._sid).name)}</div>` : ''}
<div class="q">${H(ex.q)}</div>
<div class="zone" id="zone"></div>
<div class="feedback" id="fb" role="status" aria-live="polite"></div>
<div id="extra"></div>
<div class="row" id="btns">
${boss ? '' : `<button class="btn ghost small" id="hint">💡 Indice</button>`}
${cours ? `<button class="btn ghost small" id="cours">📖 Cours</button>` : ''}
<div class="grow"></div>
${['fields', 'order', 'grid', 'toggle', 'baliste'].includes(ex.type) ? `<button class="btn primary" id="ok">${ex.type === 'baliste' ? '🎯 Tirer' : 'Valider'}</button>` : ''}
</div></div>`;
    const zone = $('#zone');
    v.ui = RENDER[ex.type](zone, ex);
    const ok = $('#ok');
    if (ok) ok.onclick = () => submit(v.ui.get());
    const hb = $('#hint');
    if (hb) hb.onclick = () => hint();
    const cb = $('#cours');
    if (cb)
      cb.onclick = () => {
        CU.sfx.click();
        const sid = v.kind === 'recall' ? v.item.id : v.id,
          ti = v.kind === 'recall' ? v.item.ti : v.ti;
        if (v.prevKo && !v.answered) v.grimKo = true;
        if (v.kind === 'recall' && !v.answered && !v.peek) {
          v.peek = true;
          toast('Grimoire ouvert : ce souvenir comptera comme à revoir.');
        }
        openLesson(sid, ti, null, { back: 'Retour à l’épreuve' });
      };
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
      v.pure = false;
      v.combo = 0;
      paintShards();
      $('#extra').insertAdjacentHTML('beforeend', `<div class="hintbox">${H(v.ex.hint)}</div>`);
      $('#hint').textContent = '📖 Voir la solution';
    } else reveal(true);
  }
  function reveal(gaveUp) {
    const v = view;
    v.answered = true;
    if (gaveUp) {
      v.gaveUp = true;
      koEvent(v);
    }
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
    if (e.key !== 'Enter' || !view || (view.kind !== 'trial' && view.kind !== 'boss' && view.kind !== 'arena' && view.kind !== 'recall')) return;
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
    v.pure = false;
    koEvent(v);
    fb.className = 'feedback ' + (res.close ? 'close' : 'bad');
    fb.innerHTML = H(res.msg || 'Ce n’est pas ça. ' + (v.tries < 2 ? 'Encore un essai.' : ''));
    paintShards();
    if (v.kind === 'boss') return bossHurt();
    if (v.kind === 'arena') return arenaMiss(false);
    if (v.kind === 'recall') return recallMiss();
    if (v.tries >= 2) reveal(false);
  }

  function success() {
    const v = view,
      first = v.tries === 0 && !v.hinted && !v.peek;
    // ce que les défis et exploits ont besoin de savoir, mesuré AVANT la mise à jour
    const sid = v.kind === 'trial' ? v.id : v.kind === 'arena' ? v.cur.id : v.kind === 'recall' ? v.item.id : v.ex._sid;
    const sk0 = st.skills[sid] || {};
    const qe = {
      kind: v.kind,
      first,
      mode: v.mode,
      sid,
      rid: S(sid).region,
      type: v.ex.type,
      code: !!v.ex.code,
      afterKo: !!v.prevKo,
      grim: !!v.grimKo,
      stale: tierOf(sid) >= 1 && (sk0.last || 0) > 0 && Date.now() - sk0.last > 7 * DAY,
      fresh: !sk0.done,
      wasDue: v.kind === 'recall' && memOf(v.item.id, v.item.ti).due <= Date.now(),
    };
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
    } else if (v.kind === 'recall') {
      gain = first ? 8 + 4 * v.item.ti : 3;
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
    flyXp(x, y, gain);
    const fb = $('#fb');
    fb.className = 'feedback good';
    fb.textContent = (COMBO[v.combo] || (first ? R.pick(GOOD) : v.kind === 'recall' ? 'Juste — mais avec le Grimoire ouvert : ce souvenir reviendra plus tôt.' : 'Juste — mais cette fois, sans éclat de sceau (il faut réussir du premier coup, sans indice).')) + '';
    paintShards();
    if (first && v.kind === 'trial' && v.got === v.need - 1) fb.textContent += ' Plus qu’un éclat avant le sceau !';
    quest('ok', qe);
    save();
    if (v.kind === 'boss') return bossHit(first);
    if (v.kind === 'arena') return arenaHit();
    if (v.kind === 'recall') return recallHit(first);
    $('#extra').insertAdjacentHTML('beforeend', `<details class="sol" style="padding:10px 14px"><summary style="cursor:pointer;color:var(--mute)">Voir l’explication</summary>${H(v.ex.sol)}</details>`);
    nextButton(v.got >= v.need ? 'Briser le sceau ✦' : 'Suivant →');
  }
  function afterAnswer() {
    const v = view;
    if (v.kind === 'arena') return v.over ? arenaEnd() : nextQuestion();
    if (v.kind === 'recall') return v.over || v.pos >= v.queue.length ? recallEnd() : nextQuestion();
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
    const beforeMax = Object.fromEntries(CU.ORDER.map((id) => [id, maxAllowed(id)]));
    const beforeRank = rankIdx(st.xp);
    if (v.mode === 'normal') {
      const fresh = s.tier <= v.ti;
      s.tier = Math.max(s.tier, v.ti + 1);
      s.prog = 0;
      if (fresh) memFresh(v.id, v.ti);
      const bonus = 50 * (v.ti + 1);
      st.xp += bonus;
      gains.push(`<b>+${bonus} XP</b> — sceau ${TN[v.ti]} brisé`);
      title = v.ti === 2 ? 'La Loi est maîtrisée' : `Sceau ${TN[v.ti]} brisé`;
      sub = v.ti === 0 ? 'La Loi se réécrit dans le Codex. Autour de toi, quelque chose se rallume.' : v.ti === 1 ? 'La Loi s’affermit. Les Informes de ce lieu reculent.' : 'Plus rien ne peut défaire cette Loi. Elle brille d’or dans le Codex.';
      for (const id of CU.ORDER) if (!beforeAvail.has(id) && available(id)) gains.push(`Nouvelle Loi accessible : <b>${esc(S(id).name)}</b> <small>(${esc(CU.region(S(id).region).name)})</small>`);
      // un sceau d'une autre Loi qui attendait une notion de celle-ci
      for (const id of CU.ORDER) {
        const tt = tierOf(id);
        if (id !== v.id && beforeAvail.has(id) && tt < 3 && tt > beforeMax[id] && tt <= maxAllowed(id)) gains.push(`Nouveau sceau accessible : <b>${esc(S(id).name)}</b> — ${TN[tt]} <small>(${esc(CU.region(S(id).region).name)})</small>`);
      }
      if (v.ti === 1 && allAdept(sd.region) && !st.bosses[sd.region]) gains.push(bossOpen(sd.region) ? `⚔ <b>${esc(g.boss.name)}</b> s’éveille !` : `◈ Toutes les Lois de la région sont Adepte : grave un souvenir à l’<b>Autel du Souvenir</b> pour éveiller ${esc(g.boss.name)}.`);
      if (memItems(sd.region).length === RECALL_MIN(sd.region)) gains.push('◈ L’<b>Autel du Souvenir</b> s’allume dans cette région.');
      if (memItems('all').length === RECALL_MIN('all')) gains.push('◈ Le <b>Cloître de la Mémoire</b> s’ouvre sur la carte du monde.');
    } else if (v.mode === 'revive') {
      memSet(v.id, v.ti, true);
      st.xp += 30;
      gains.push('<b>+30 XP</b> — braise ravivée');
      title = 'La braise est ravivée';
      sub = 'Une Loi qu’on entretient ne s’éteint pas.';
    } else {
      memSet(v.id, v.ti, true);
      st.xp += 20;
      gains.push('<b>+20 XP</b> — révision accomplie');
      title = 'Épreuve accomplie';
      sub = 'Revenir sur ses pas, c’est aussi avancer.';
    }
    s.last = Date.now();
    quest('tier', { mode: v.mode, id: v.id, ti: v.ti, pure: v.mode === 'normal' && v.pure });
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
${xpInline(v.xp0)}
${frs.map((f) => `<div class="frag"><h4>FRAGMENT DU CODEX — ${esc(f.title.toUpperCase())}</h4>${f.text}</div>`).join('')}
<div class="actions">${canNext ? `<button class="btn primary" id="ov-next">Continuer — ${TN[s.tier]}</button>` : ''}<button class="btn ${canNext ? '' : 'primary'}" id="ov-back">Retour : ${esc(g.short)}</button></div></div>`;
    document.body.appendChild(ov);
    growInline(ov);
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
    view = { kind: 'boss', rid: fin ? null : rid, final: fin, b, pool, hp: b.hp, lives: 3, combo: 0, over: false, xp0: st.xp };
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
    if (v.hp === 1) $('#taunt').textContent = 'Il vacille : encore un coup et il tombe !';
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
    quest('boss', { rid: key, flawless: v.lives === 3 });
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
${xpInline(v.xp0)}
${firstWin ? `<div class="frag"><h4>${v.final ? 'ÉPILOGUE' : 'FRAGMENT DU CODEX — ' + esc(g.name.toUpperCase())}</h4>${CU.BOSS_TEXT[key]}</div>` : ''}
<div class="actions"><button class="btn primary" id="ov-back">${v.final ? 'Contempler le monde' : 'Voir la région restaurée'}</button></div></div>`;
    document.body.appendChild(ov);
    growInline(ov);
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
    const ex = genFor(a.id, a.t);
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
    if (st.arena && st.arena.best && v.score === st.arena.best) toast('Record égalé — encore un pour le battre !');
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
    quest('arena', { score: v.score });
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
${xpInline(v.xp0)}
<div class="actions"><button class="btn primary gold" id="ov-again">Rejouer</button><button class="btn" id="ov-back">Retour à la carte</button></div></div>`;
    document.body.appendChild(ov);
    growInline(ov);
    $('#ov-again', ov).onclick = () => (ov.remove(), startArena());
    $('#ov-back', ov).onclick = () => {
      ov.remove();
      view = null;
      history.replaceState(null, '', '#/world');
      renderWorld();
    };
    setTimeout(() => $('#ov-again', ov).focus(), 300);
  }

  /* ================= défis du jour, série de jours, exploits =================
     Principe : on ne récompense que des comportements qui servent l'apprentissage
     (réussir du premier coup, se corriger après une erreur, revoir à temps, varier
     les sujets), jamais le simple volume ni la simple présence. */
  const pad2 = (n) => String(n).padStart(2, '0');
  // le jour change à 4 h du matin : une partie à minuit compte pour la veille
  const dk = (ts) => {
    const d = new Date(ts - 4 * 3600e3);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  };
  const dshift = (key, n) => {
    const [y, m, d] = key.split('-').map(Number);
    const t = new Date(y, m - 1, d + n, 12);
    return t.getFullYear() + '-' + pad2(t.getMonth() + 1) + '-' + pad2(t.getDate());
  };
  const ddiff = (a, b) => {
    const p = (k) => {
      const [y, m, d] = k.split('-').map(Number);
      return Date.UTC(y, m - 1, d);
    };
    return Math.round((p(b) - p(a)) / DAY);
  };
  function qinit() {
    st.streak = st.streak || { days: [], rep: [], best: 0 };
    st.cnt = st.cnt || {};
    st.ach = st.ach || {};
  }
  const hasDay = (k) => st.streak.days.includes(k);
  // longueur de la série qui se termine le jour k
  function runTo(k) {
    let n = 0;
    while (hasDay(k)) {
      n++;
      k = dshift(k, -1);
    }
    return n;
  }
  function streakCur() {
    if (!st || !st.streak) return 0;
    const t = dk(Date.now());
    return hasDay(t) ? runTo(t) : runTo(dshift(t, -1));
  }
  function addDay(k) {
    if (!hasDay(k)) st.streak.days.push(k);
    st.streak.days.sort();
    if (st.streak.days.length > 400) st.streak.days = st.streak.days.slice(-400);
    st.streak.best = Math.max(st.streak.best || 0, streakCur());
  }
  // une série d'au moins 3 jours, interrompue hier seulement, et pas de rachat depuis 7 jours
  function repairable(t) {
    const y = dshift(t, -1),
      y2 = dshift(t, -2);
    return !hasDay(y) && hasDay(y2) && runTo(y2) >= 3 && !(st.streak.rep || []).some((k) => ddiff(k, t) < 7);
  }
  // hasard reproductible : mêmes défis pour un même jour, sur tous les appareils
  function seeded(str) {
    let h = 1779033703;
    for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 3432918353), (h = (h << 13) | (h >>> 19));
    return () => {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return ((h ^= h >>> 16) >>> 0) / 4294967296;
    };
  }
  const openRegions = () => CU.REGIONS.filter((g) => regionOpen(g.id)).length;
  const PROOFS = ['v7', 'f6', 'q6'];
  // catalogue des défis du jour, en trois familles : mémoire, progression, variété
  const CH = {
    revenant: { fam: 'M', goal: 1, txt: () => 'Réussis du premier coup une Loi que tu n’as pas travaillée depuis 7 jours', ok: (e) => e.first && e.stale, can: () => CU.ORDER.some((id) => tierOf(id) >= 1 && (sk(id).last || 0) < Date.now() - 7 * DAY) },
    raviver: { fam: 'M', goal: 2, txt: (g) => `Ravive ${g} souvenirs à l’Autel ou au Cloître (du premier coup)`, ok: (e) => e.kind === 'recall' && e.first && e.wasDue, can: () => dueN('all') >= 2 },
    autel: { fam: 'M', goal: 1, txt: () => 'Mène une séance d’Autel ou du Cloître jusqu’au bout', on: 'recall', test: (e) => e.win, can: () => CU.REGIONS.some((g) => recallOpen(g.id)) },
    eclats: { fam: 'P', goal: 4, txt: (g) => `Gagne ${g} éclats de sceau`, ok: (e) => e.kind === 'trial' && e.mode === 'normal' && e.first, can: () => !!suggestion() },
    sceau: { fam: 'P', goal: 1, txt: () => 'Brise un nouveau sceau', on: 'tier', test: (e) => e.mode === 'normal', can: () => !!suggestion() },
    preuve: { fam: 'P', goal: 1, txt: () => 'Réussis une démonstration du premier coup', ok: (e) => e.first && e.type === 'order' && !e.code, can: () => PROOFS.some((id) => tierOf(id) >= 1) },
    nouveau: { fam: 'P', goal: 1, txt: () => 'Réussis une Loi que tu n’as encore jamais travaillée', ok: (e) => e.first && e.fresh, can: () => CU.ORDER.some((id) => available(id) && !(st.skills[id] && st.skills[id].done)) },
    deux: { fam: 'V', goal: 2, txt: (g) => `Dans ${g} mondes différents, réussis 2 défis d’affilée du premier coup`, count: (d) => Object.keys(d.two).length, can: () => openRegions() >= 2 },
    redresseur: { fam: 'V', goal: 2, txt: (g) => `Après une erreur, réussis le défi suivant du premier coup (${g} fois)`, ok: (e) => e.first && e.afterKo, can: () => true },
    mondes: { fam: 'V', goal: 3, txt: (g) => `Réussis un défi dans ${g} mondes différents`, count: (d) => Object.keys(d.w).length, can: () => openRegions() >= 3 },
  };
  function genCh(day) {
    const rnd = seeded(day + '|' + st.name),
      pick = (a) => a[Math.floor(rnd() * a.length)];
    const ok = Object.keys(CH).filter((t) => CH[t].can());
    const out = [];
    for (const fam of ['M', 'P', 'V']) {
      const c = ok.filter((t) => CH[t].fam === fam && !out.includes(t));
      if (c.length) out.push(pick(c));
    }
    while (out.length < 3) {
      const c = ok.filter((t) => !out.includes(t));
      if (!c.length) break;
      out.push(pick(c));
    }
    const rep = repairable(day) ? ok.filter((t) => !out.includes(t)).sort(() => rnd() - 0.5).slice(0, 2) : [];
    return out.map((t) => ({ t, goal: CH[t].goal, prog: 0, done: false })).concat(rep.map((t) => ({ t, goal: CH[t].goal, prog: 0, done: false, rep: true })));
  }
  function dailyRoll() {
    if (!st) return;
    qinit();
    const t = dk(Date.now());
    if (st.daily && st.daily.day === t) return;
    const last = st.streak.days[st.streak.days.length - 1];
    st.daily = { day: t, ch: genCh(t), w: {}, two: {}, rc: {}, done: false, repDone: false, lost: false, absent: last ? ddiff(last, t) : 0 };
  }
  const chTxt = (c) => CH[c.t].txt(c.goal);
  // file d'annonces : une à la fois
  const bannerQ = [];
  let bannerBusy = false;
  function announce(top, big) {
    bannerQ.push([top, big]);
    if (bannerBusy) return;
    const next = () => {
      const b = bannerQ.shift();
      if (!b) return (bannerBusy = false);
      bannerBusy = true;
      banner(b[0], b[1]);
      setTimeout(next, 2600);
    };
    next();
  }
  // tout ce qui se passe en jeu passe par ici
  function quest(type, e = {}) {
    if (!st) return;
    dailyRoll();
    const d = st.daily,
      c = st.cnt;
    if (type === 'ok') {
      d.w[e.rid] = 1;
      d.rc[e.rid] = e.first ? (d.rc[e.rid] || 0) + 1 : 0;
      if (d.rc[e.rid] >= 2) d.two[e.rid] = 1;
      if (e.first && e.afterKo) c.redress = (c.redress || 0) + 1;
      if (e.first && e.grim) c.grim = (c.grim || 0) + 1;
      if (e.first && e.type === 'order' && !e.code) c.proofs = (c.proofs || 0) + 1;
      c.maxWorlds = Math.max(c.maxWorlds || 0, Object.keys(d.w).length);
      c.maxTwo = Math.max(c.maxTwo || 0, Object.keys(d.two).length);
    }
    if (type === 'ko' && e.rid) d.rc[e.rid] = 0;
    if (type === 'recall') {
      if (!e.win) d.lost = true;
      else {
        if (d.lost) c.phoenix = 1;
        if (e.perfect) c.perfectRecall = 1;
      }
    }
    if (type === 'boss' && e.flawless) c.flawless = 1;
    if (type === 'tier' && e.pure) c.pure = 1;
    for (const ch of d.ch) {
      if (ch.done) continue;
      const def = CH[ch.t];
      if (def.count) ch.prog = Math.min(ch.goal, def.count(d));
      else if (type === 'ok' && def.ok && def.ok(e)) ch.prog++;
      else if (def.on === type && def.test(e)) ch.prog++;
      if (ch.prog >= ch.goal) {
        ch.done = true;
        st.xp += 15;
        announce(ch.rep ? '◈ Rattrapage accompli · +15 XP' : '✦ Défi accompli · +15 XP', chTxt(ch));
      }
    }
    const base = d.ch.filter((x) => !x.rep),
      extra = d.ch.filter((x) => x.rep);
    if (!d.done && base.length && base.every((x) => x.done)) {
      d.done = true;
      addDay(d.day);
      c.days = (c.days || 0) + 1;
      if (d.absent >= 14) c.retour = 1;
      st.xp += 30;
      announce('🔥 Défis du jour accomplis · +30 XP', streakCur() > 1 ? `Série : ${streakCur()} jours` : 'Une série commence');
    }
    if (d.done && extra.length && !d.repDone && extra.every((x) => x.done)) {
      d.repDone = true;
      addDay(dshift(d.day, -1));
      st.streak.rep = (st.streak.rep || []).concat(d.day).slice(-20);
      c.rachat = 1;
      st.xp += 20;
      announce('🔥 La braise est rallumée · +20 XP', `Série : ${streakCur()} jours`);
    }
    checkAch();
  }

  /* ---------- exploits : nombreux, discrets, jamais au centre ---------- */
  const maxBox = () => Math.max(0, ...Object.values(st.mem || {}).map((m) => m.b || 0));
  const boxN = (b) => Object.values(st.mem || {}).filter((m) => (m.b || 0) >= b).length;
  const goldN = () => CU.ORDER.filter((id) => tierOf(id) >= 3).length;
  const regionsWon = () => CU.REGIONS.filter((g) => recallWins(g.id) >= 1).length;
  const ACH = [
    // constance
    { id: 's3', fam: 'Constance', name: 'Première braise', desc: 'Une série de 3 jours', goal: 3, xp: 40, p: () => st.streak.best },
    { id: 's7', fam: 'Constance', name: 'Semaine de feu', desc: 'Une série de 7 jours', goal: 7, xp: 80, title: 'Gardien de la Flamme', p: () => st.streak.best },
    { id: 's10', fam: 'Constance', name: 'Dix veilles', desc: 'Une série de 10 jours', goal: 10, xp: 120, p: () => st.streak.best },
    { id: 's30', fam: 'Constance', name: 'Une lune entière', desc: 'Une série de 30 jours', goal: 30, xp: 300, title: 'Veilleur', p: () => st.streak.best },
    { id: 's100', fam: 'Constance', name: 'Cent nuits', desc: 'Une série de 100 jours', goal: 100, xp: 800, title: 'Flamme d’Ysembre', p: () => st.streak.best },
    { id: 'd7', fam: 'Constance', name: 'Fidèle aux défis', desc: 'Accomplir les défis du jour 7 jours (pas forcément de suite)', goal: 7, xp: 60, p: () => st.cnt.days || 0 },
    { id: 'd30', fam: 'Constance', name: 'Pèlerin', desc: 'Accomplir les défis du jour 30 jours', goal: 30, xp: 200, title: 'Pèlerin', p: () => st.cnt.days || 0 },
    // mémoire
    { id: 'm7', fam: 'Mémoire', name: 'Souvenir tenace', desc: 'Repousser une révision à 7 jours', goal: 2, xp: 30, p: maxBox, unit: 'boîte' },
    { id: 'm15', fam: 'Mémoire', name: 'Souvenir ancré', desc: 'Repousser une révision à 15 jours', goal: 3, xp: 50, p: maxBox, unit: 'boîte' },
    { id: 'm30', fam: 'Mémoire', name: 'Souvenir de 30 jours', desc: 'Repousser une révision à 30 jours : la preuve d’un vrai souvenir', goal: 4, xp: 120, p: maxBox, unit: 'boîte' },
    { id: 'm60', fam: 'Mémoire', name: 'Mémoire de pierre', desc: 'Repousser une révision à 60 jours', goal: 5, xp: 200, title: 'Mémoire vive', p: maxBox, unit: 'boîte' },
    { id: 'm30x5', fam: 'Mémoire', name: 'Cinq souvenirs gravés dans la pierre', desc: 'Cinq paliers repoussés à 30 jours ou plus', goal: 5, xp: 200, p: () => boxN(4) },
    { id: 'a1', fam: 'Mémoire', name: 'Premier souvenir gravé', desc: 'Mener une séance d’Autel jusqu’au bout', goal: 1, xp: 30, p: () => Object.values(st.recall || {}).reduce((s, r) => s + (r.wins || 0), 0) },
    { id: 'aall', fam: 'Mémoire', name: 'Les cinq autels', desc: 'Graver un souvenir dans l’autel de chaque région', goal: 5, xp: 150, p: regionsWon },
    { id: 'clo', fam: 'Mémoire', name: 'Le Cloître', desc: 'Graver un souvenir au Cloître de la Mémoire', goal: 1, xp: 60, p: () => recallWins('all') },
    { id: 'aperf', fam: 'Mémoire', name: 'Mémoire sans faille', desc: 'Une séance d’Autel sans aucune erreur', goal: 1, xp: 80, p: () => st.cnt.perfectRecall || 0 },
    // erreurs fécondes
    { id: 'r5', fam: 'Erreurs fécondes', name: 'Le Redresseur', desc: 'Après une erreur, réussir le défi suivant du premier coup — 5 fois', goal: 5, xp: 40, p: () => st.cnt.redress || 0 },
    { id: 'r25', fam: 'Erreurs fécondes', name: 'Le Phénix', desc: 'Se redresser après une erreur 25 fois', goal: 25, xp: 120, title: 'Phénix', p: () => st.cnt.redress || 0 },
    { id: 'g3', fam: 'Erreurs fécondes', name: 'Lecteur avisé', desc: 'Après une erreur, ouvrir le Grimoire puis réussir du premier coup — 3 fois', goal: 3, xp: 50, p: () => st.cnt.grim || 0 },
    // variété
    { id: 'w3', fam: 'Variété', name: 'Trois horizons', desc: 'Réussir dans 3 mondes le même jour', goal: 3, xp: 40, p: () => st.cnt.maxWorlds || 0 },
    { id: 'w5', fam: 'Variété', name: 'Les cinq terres', desc: 'Réussir dans les 5 mondes le même jour', goal: 5, xp: 120, p: () => st.cnt.maxWorlds || 0 },
    { id: 'tour', fam: 'Variété', name: 'Le Grand Tour', desc: 'Dans les 5 mondes, 2 réussites d’affilée du premier coup, le même jour', goal: 5, xp: 200, title: 'Arpenteur des Terres', p: () => st.cnt.maxTwo || 0 },
    // maîtrise
    { id: 'x1', fam: 'Maîtrise', name: 'Première Loi d’or', desc: 'Une Loi au rang Maître', goal: 1, xp: 50, p: goldN },
    { id: 'x10', fam: 'Maîtrise', name: 'Dix Lois d’or', desc: 'Dix Lois au rang Maître', goal: 10, xp: 200, p: goldN },
    { id: 'xr', fam: 'Maîtrise', name: 'Une terre restaurée', desc: 'Toutes les Lois d’une région au rang Maître', goal: 1, xp: 250, p: () => CU.REGIONS.filter((g) => regionSkills(g.id).every((id) => tierOf(id) >= 3)).length },
    { id: 'b1', fam: 'Maîtrise', name: 'Premier gardien', desc: 'Vaincre un gardien', goal: 1, xp: 60, p: () => CU.REGIONS.filter((g) => st.bosses[g.id]).length },
    { id: 'b3', fam: 'Maîtrise', name: 'Trois gardiens', desc: 'Vaincre trois gardiens', goal: 3, xp: 150, p: () => CU.REGIONS.filter((g) => st.bosses[g.id]).length },
    { id: 'roi', fam: 'Maîtrise', name: 'Le Roi Sans Loi', desc: 'Vaincre le Roi Sans Loi', goal: 1, xp: 400, title: 'Libérateur d’Aldmor', p: () => (st.bosses.final ? 1 : 0) },
    // démonstration
    { id: 'p1', fam: 'Démonstration', name: 'Première preuve', desc: 'Réussir une démonstration du premier coup', goal: 1, xp: 40, p: () => st.cnt.proofs || 0 },
    { id: 'p10', fam: 'Démonstration', name: 'Dix preuves', desc: 'Réussir dix démonstrations du premier coup', goal: 10, xp: 150, title: 'Logicien', p: () => st.cnt.proofs || 0 },
    { id: 'pall', fam: 'Démonstration', name: 'Le Tribunal suprême', desc: 'Les trois Lois de démonstration au rang Maître', goal: 3, xp: 250, p: () => PROOFS.filter((id) => tierOf(id) >= 3).length },
    // arène
    { id: 'ar10', fam: 'Arène', name: 'Réflexes', desc: 'Un score de 10 dans l’Arène', goal: 10, xp: 50, p: () => (st.arena && st.arena.best) || 0 },
    { id: 'ar20', fam: 'Arène', name: 'Éclair', desc: 'Un score de 20 dans l’Arène', goal: 20, xp: 120, p: () => (st.arena && st.arena.best) || 0 },
    { id: 'ar30', fam: 'Arène', name: 'Foudre', desc: 'Un score de 30 dans l’Arène', goal: 30, xp: 250, title: 'Foudre', p: () => (st.arena && st.arena.best) || 0 },
    // secrets
    { id: 'xcombo', fam: 'Secrets', secret: true, name: 'Sans filet', desc: '10 réussites du premier coup d’affilée', goal: 10, xp: 100, p: () => st.stats.bestCombo || 0 },
    { id: 'xpure', fam: 'Secrets', secret: true, name: 'Sceau pur', desc: 'Briser un sceau sans la moindre erreur ni le moindre indice', goal: 1, xp: 60, p: () => st.cnt.pure || 0 },
    { id: 'xboss', fam: 'Secrets', secret: true, name: 'Intouchable', desc: 'Vaincre un gardien sans perdre une seule lueur', goal: 1, xp: 120, title: 'Intouchable', p: () => st.cnt.flawless || 0 },
    { id: 'xphoe', fam: 'Secrets', secret: true, name: 'Renaissance', desc: 'Perdre une séance d’Autel, puis en réussir une le même jour', goal: 1, xp: 60, p: () => st.cnt.phoenix || 0 },
    { id: 'xback', fam: 'Secrets', secret: true, name: 'Le Retour', desc: 'Revenir après deux semaines d’absence et accomplir les défis du jour', goal: 1, xp: 80, p: () => st.cnt.retour || 0 },
    { id: 'xrach', fam: 'Secrets', secret: true, name: 'La braise rallumée', desc: 'Racheter une série interrompue', goal: 1, xp: 50, p: () => st.cnt.rachat || 0 },
  ];
  function checkAch() {
    if (!st) return;
    qinit();
    // première fois : on reconnaît la progression déjà faite, sans fanfare
    const silent = !st.cnt.achInit;
    let quiet = 0;
    for (const a of ACH) {
      if (st.ach[a.id]) continue;
      if (a.p() >= a.goal) {
        st.ach[a.id] = Date.now();
        st.xp += a.xp;
        if (silent) quiet++;
        else announce('🏆 Exploit · +' + a.xp + ' XP', a.name + (a.title ? ' — titre « ' + a.title + ' »' : ''));
      }
    }
    if (silent) {
      st.cnt.achInit = 1;
      if (quiet) setTimeout(() => toast(`🏆 ${quiet} exploit${quiet > 1 ? 's' : ''} reconnu${quiet > 1 ? 's' : ''} d’après ta progression : vois le Codex.`), 1200);
    }
  }
  // les exploits les plus proches : le « presque » qui donne envie de continuer
  function nearAch(n = 3) {
    return ACH.filter((a) => !a.secret && !st.ach[a.id])
      .map((a) => ({ a, f: Math.min(1, a.p() / a.goal) }))
      .filter((x) => x.f > 0 && x.f < 1)
      .sort((x, y) => y.f - x.f)
      .slice(0, n);
  }
  const titles = () => ACH.filter((a) => a.title && st.ach[a.id]).map((a) => a.title);
  const MILES = [3, 7, 10, 30, 100];
  // le panneau des défis, en tête de la carte du monde
  function questPanel() {
    dailyRoll();
    checkAch();
    const d = st.daily,
      t = d.day,
      cur = streakCur(),
      y = dshift(t, -1);
    const base = d.ch.filter((x) => !x.rep),
      extra = d.ch.filter((x) => x.rep);
    const next = MILES.find((m) => !st.ach['s' + m]);
    const nextA = next && ACH.find((a) => a.id === 's' + next);
    const lastDay = st.streak.days[st.streak.days.length - 1];
    let note = '';
    if (extra.length && !d.repDone)
      note = `<div class="qnote warm">🔥 Ta série de <b>${runTo(dshift(t, -2))} jours</b> vacille : hier, la braise est restée froide. Accomplis les défis du jour <b>et</b> les deux défis de rattrapage avant demain 4 h pour la rallumer.</div>`;
    else if (!d.done && lastDay && lastDay < y && runTo(lastDay) >= 2)
      note = `<div class="qnote">La braise s’est éteinte : ta série de ${runTo(lastDay)} jours s’arrête là (record : ${st.streak.best}). Une nouvelle commence aujourd’hui.</div>`;
    const row = (c) => `<li class="${c.done ? 'done' : ''}"><span class="qk">${c.done ? '✓' : c.rep ? '◈' : '◇'}</span><span class="qt">${esc(chTxt(c))}</span><span class="qp"><i style="width:${(100 * Math.min(c.prog, c.goal)) / c.goal}%"></i></span><span class="qn">${Math.min(c.prog, c.goal)}/${c.goal}</span></li>`;
    const near = nearAch(1)[0];
    return `<section class="quests ${d.done ? 'alldone' : ''}">
<div class="qhead"><div><small>DÉFIS DU JOUR</small><b>${d.done ? 'Accomplis — reviens demain' : base.filter((x) => x.done).length + ' sur ' + base.length}</b></div><div class="qflame ${hasDay(t) ? 'lit' : ''}"><span>🔥 ${cur}</span><small>${cur > 1 ? 'jours' : 'jour'} · record ${st.streak.best || 0}</small></div></div>
${note}
<ul class="qlist">${base.map(row).join('')}</ul>
${extra.length && !d.repDone ? `<div class="qsub">Rattrapage</div><ul class="qlist">${extra.map(row).join('')}</ul>` : ''}
<div class="qfoot">${nextA ? `<span>Prochain palier : <b>${next} jours</b> (+${nextA.xp} XP)</span>` : ''}${near ? `<span>Presque : <b>${esc(near.a.name)}</b></span>` : ''}</div>
</section>`;
  }

  /* ================= autels du souvenir (révision espacée et entrelacée) ================= */
  const days = (ms) => (ms < DAY ? 'demain' : 'dans ' + Math.ceil(ms / DAY) + ' j');
  function openRecallSheet(sc) {
    const all = memItems(sc),
      now = Date.now(),
      open = recallOpen(sc),
      due = all.filter((x) => x.m.due <= now);
    const reg = sc === 'all' ? null : CU.region(sc);
    const title = sc === 'all' ? 'Le Cloître de la Mémoire' : 'L’Autel du Souvenir';
    const rows = all
      .slice()
      .sort((a, b) => a.m.due - b.m.due)
      .map((x) => `<li class="${x.m.due <= now ? 'due' : ''}"><span>${esc(S(x.id).name)} <small>· ${TN[x.ti]}</small></span><span>${x.m.due <= now ? 'à raviver' : days(x.m.due - now)}</span></li>`)
      .join('');
    const bg = sheet(
      `<div class="top"><div class="bigg" style="color:#c8b6ff">◈</div><div><div class="place">${reg ? esc(reg.name) : 'Toutes les régions'}</div><h2>${title}</h2><div class="ital" style="font-size:1.05rem;margin-top:4px">L’Oubli ronge en silence ce que tu as compris. Ici, on ne découvre rien : on se souvient.</div></div></div>
<p style="color:var(--mute);margin-top:14px">Des épreuves tirées des Lois que tu as déjà brisées${sc === 'all' ? ', toutes régions mêlées' : ''}, dans le désordre, <b>sans indice et sans le nom de la Loi</b> : reconnaître la bonne méthode fait partie de l’épreuve. Un souvenir retrouvé du premier coup reviendra de plus en plus tard (1, 3, 7, 15, 30, puis 60 jours) ; un souvenir manqué revient en fin de séance, puis dès le lendemain. Trois lueurs : à la troisième erreur, la séance s’arrête. Le Grimoire reste accessible, mais une Loi consultée compte comme à revoir.</p>
${reg && !st.bosses[sc] ? `<p class="note">Graver un premier souvenir ici est l’une des conditions pour éveiller <b>${esc(reg.boss.name)}</b>.</p>` : ''}
${sc === 'all' && !st.bosses.final ? `<p class="note">Graver un premier souvenir au Cloître est l’une des conditions pour ouvrir le Sanctuaire du Codex.</p>` : ''}
${
  open
    ? `<div class="law" style="text-align:center">${due.length ? `<b>${due.length}</b> souvenir${due.length > 1 ? 's' : ''} s’estompe${due.length > 1 ? 'nt' : ''}` : 'Aucun souvenir ne s’estompe : tu peux t’entraîner quand même.'} · gravés : <b>${recallWins(sc)}</b></div>
<details class="memlist"><summary>L’état de tes souvenirs (${all.length})</summary><ul>${rows}</ul></details>`
    : `<div class="req">${sc === 'all' ? 'Le Cloître' : 'L’Autel'} s’allume dès que tu as brisé ${RECALL_MIN(sc)} sceaux ${sc === 'all' ? 'au total' : 'dans cette région'} (${all.length} pour l’instant).</div>`
}
<div class="actions">${open ? `<button class="btn primary" id="rc-go" style="--hue:#c8b6ff">${due.length ? 'Raviver les souvenirs' : 'S’entraîner'}</button>` : ''}<button class="btn ghost" id="rc-cl">Fermer</button></div>`,
      '#c8b6ff',
    );
    $('#rc-cl', bg).onclick = closeSheet;
    if (open) $('#rc-go', bg).onclick = () => (closeSheet(), startRecall(sc));
  }
  // évite deux questions d'affilée sur la même Loi (entrelacement)
  function spread(q) {
    for (let i = 1; i < q.length; i++)
      if (q[i].id === q[i - 1].id) {
        const j = q.findIndex((x, k) => k > i && x.id !== q[i - 1].id && (k + 1 >= q.length || q[k + 1].id !== q[i].id));
        if (j > 0) [q[i], q[j]] = [q[j], q[i]];
      }
    return q;
  }
  function startRecall(sc) {
    closeSheet();
    const all = memItems(sc);
    if (all.length < RECALL_MIN(sc)) return;
    const N = sc === 'all' ? 12 : 8,
      now = Date.now();
    const due = all.filter((x) => x.m.due <= now).sort((a, b) => a.m.due - b.m.due);
    const rest = all.filter((x) => x.m.due > now).sort((a, b) => a.m.due - b.m.due);
    const pick = due.slice(0, N).concat(rest.slice(0, Math.max(0, N - due.length)));
    // peu de Lois acquises : on en revoit certaines deux fois, sous une autre forme
    while (pick.length < Math.min(N, 2 * all.length)) pick.push(R.pick(all));
    const queue = spread(R.shuffle(pick).map((x) => ({ id: x.id, ti: x.ti })));
    const hue = sc === 'all' ? '#c8b6ff' : CU.region(sc).hue;
    setHue(hue, sc === 'all' ? '#1c1430' : CU.region(sc).deep);
    view = { kind: 'recall', sc, rid: sc === 'all' ? null : sc, queue, pos: 0, lives: 3, score: 0, combo: 0, over: false, requeued: 0, res: [], xp0: st.xp, due0: due.length };
    mood('focus');
    history.pushState(null, '', '#/m/' + sc);
    app.innerHTML = `<div class="trial">
<div class="trial-head"><button class="back" id="quit" aria-label="Quitter">‹</button><div class="ttl"><small>${sc === 'all' ? 'Toutes les régions' : esc(CU.region(sc).short)} · sans indice</small><b>${sc === 'all' ? 'Le Cloître de la Mémoire' : 'L’Autel du Souvenir'}</b></div><div class="combo" id="combo"></div><div class="arscore" id="rcount"></div><div class="lives" id="lives"></div></div>
<div class="clock mem"><i id="rbar"></i></div>
<div id="stage"></div></div>`;
    $('#quit').onclick = () => {
      CU.sfx.click();
      view = null;
      save(true);
      go(sc === 'all' ? '#/world' : '#/r/' + sc);
    };
    paintRecall();
    nextQuestion();
  }
  function recallQuestion() {
    const v = view,
      it = v.queue[v.pos];
    v.item = it;
    v.peek = false;
    const ex = genFor(it.id, it.ti);
    ex._sid = it.id;
    return ex;
  }
  function paintRecall() {
    const v = view;
    $('#lives').innerHTML = [0, 1, 2].map((i) => `<span class="${i >= v.lives ? 'lost' : ''}">🕯</span>`).join('');
    $('#rcount').textContent = Math.min(v.pos + (v.answered ? 0 : 1), v.queue.length) + '/' + v.queue.length;
    $('#rbar').style.width = ((100 * v.pos) / v.queue.length).toFixed(1) + '%';
    const c = $('#combo');
    c.textContent = v.combo >= 2 ? '×' + v.combo : '';
    c.classList.toggle('on', v.combo >= 2);
  }
  function recallHit(first) {
    const v = view,
      it = v.item;
    memSet(it.id, it.ti, first);
    if (first) v.score++;
    v.res.push({ id: it.id, ti: it.ti, ok: first });
    v.pos++;
    save();
    paintRecall();
    $('#extra').insertAdjacentHTML('beforeend', `<p class="note" style="margin-top:8px">C’était : <b>${esc(S(it.id).name)}</b> · ${TN[it.ti]}</p><details class="sol" style="padding:10px 14px"><summary style="cursor:pointer;color:var(--mute)">Voir l’explication</summary>${H(v.ex.sol)}</details>`);
    nextButton(v.pos >= v.queue.length ? 'Graver les souvenirs ✦' : 'Suivant →');
  }
  function recallMiss() {
    const v = view,
      it = v.item;
    v.answered = true;
    v.lives--;
    memSet(it.id, it.ti, false);
    v.res.push({ id: it.id, ti: it.ti, ok: false });
    let again = false;
    if (v.requeued < 4 && v.lives > 0) {
      v.queue.push({ id: it.id, ti: it.ti, again: true });
      v.requeued++;
      again = true;
    }
    v.pos++;
    flash('#8a7bb8');
    if (v.ui.reveal) v.ui.reveal();
    $('#extra').insertAdjacentHTML('beforeend', `<div class="sol">${H(v.ex.sol)}</div><p class="note" style="margin-top:8px">C’était : <b>${esc(S(it.id).name)}</b> · ${TN[it.ti]}.${again ? ' Cette Loi reviendra en fin de séance, sous une autre forme.' : ''}</p>`);
    if (v.lives <= 0) v.over = true;
    save();
    paintRecall();
    nextButton(v.over ? 'Fin de la séance' : 'Suivant →');
  }
  function recallEnd() {
    const v = view,
      win = !v.over;
    st.recall = st.recall || {};
    const r = (st.recall[v.sc] = st.recall[v.sc] || { wins: 0, runs: 0 });
    r.runs++;
    const firstWin = win && !r.wins;
    const gains = [];
    if (win) {
      r.wins++;
      const bonus = v.sc === 'all' ? 80 : 40;
      st.xp += bonus;
      gains.push(`<b>+${bonus} XP</b> — séance menée à son terme`);
      if (firstWin && v.sc !== 'all' && allAdept(v.sc) && !st.bosses[v.sc]) gains.push(`⚔ <b>${esc(CU.region(v.sc).boss.name)}</b> s’éveille !`);
      if (firstWin && v.sc === 'all' && CU.FINAL.needs.every((x) => st.bosses[x]) && !st.bosses.final) gains.push('⚔ <b>Le Sanctuaire du Codex</b> s’ouvre !');
    }
    quest('recall', { sc: v.sc, win, perfect: win && v.res.every((x) => x.ok) });
    gains.unshift(`<b>+${st.xp - v.xp0} XP</b> en tout · ${v.score} souvenir${v.score > 1 ? 's' : ''} retrouvé${v.score > 1 ? 's' : ''} du premier coup`);
    save(true);
    if (win) {
      CU.sfx.tier();
      CU.music && CU.music.swell();
      flash('#c8b6ff');
    } else CU.sfx.hurt();
    // état de chaque souvenir revu
    const seen = [],
      keys = new Set();
    for (const x of v.res)
      if (!keys.has(mk(x.id, x.ti))) {
        keys.add(mk(x.id, x.ti));
        seen.push(x);
      }
    const now = Date.now();
    const rows = seen
      .map((x) => {
        const m = memOf(x.id, x.ti),
          ok = v.res.filter((y) => y.id === x.id && y.ti === x.ti).every((y) => y.ok);
        return `<li class="${ok ? 'ok' : 'ko'}"><span>${ok ? '✓' : '✗'} ${esc(S(x.id).name)} <small>· ${TN[x.ti]}</small></span><span>${m.due <= now ? 'à raviver' : 'revoir ' + days(m.due - now)}</span></li>`;
      })
      .join('');
    const ov = document.createElement('div');
    ov.className = 'ov cu-ov';
    ov.style.setProperty('--hue', '#c8b6ff');
    ov.innerHTML = `<div class="ov-inner">${win ? CU.ART.seal('#c8b6ff', '◈') : '<div class="arena-big" style="color:#c8b6ff">◈</div>'}
<h2>${win ? 'Les souvenirs sont gravés' : 'L’Oubli l’emporte — pour cette fois'}</h2>
<div class="ital">${win ? 'Ce que l’on retrouve sans aide, on le garde. Chaque séance repousse l’Oubli un peu plus loin.' : 'Les Lois manquées reviendront dès demain. C’est en se trompant ici, et non le jour du combat, qu’on apprend le mieux.'}</div>
<div class="gains">${gains.map((x, i) => `<div class="gain" style="animation-delay:${0.5 + i * 0.15}s">${x}</div>`).join('')}</div>
${xpInline(v.xp0)}
<details class="memlist" open><summary>Tes souvenirs</summary><ul>${rows}</ul></details>
<div class="actions">${!win ? '<button class="btn primary" id="ov-again">Recommencer</button>' : ''}<button class="btn ${win ? 'primary' : ''}" id="ov-back">${v.sc === 'all' ? 'Retour à la carte' : 'Retour : ' + esc(CU.region(v.sc).short)}</button></div></div>`;
    document.body.appendChild(ov);
    growInline(ov);
    const again = $('#ov-again', ov);
    if (again) again.onclick = () => (ov.remove(), startRecall(v.sc));
    $('#ov-back', ov).onclick = () => {
      ov.remove();
      view = null;
      if (v.sc === 'all') {
        history.replaceState(null, '', '#/world');
        renderWorld();
      } else {
        history.replaceState(null, '', '#/r/' + v.sc);
        renderRegion(v.sc);
      }
    };
    setTimeout(() => ($('#ov-again', ov) || $('#ov-back', ov)).focus(), 400);
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
                ? `<button class="page openable" data-lesson="${id}" style="--hue:${t === 3 ? '#f5d79a' : g.hue}"><h3>${esc(S(id).glyph)} ${esc(S(id).name)} <span class="seals" style="display:inline-flex;margin-left:8px">${[0, 1, 2].map((i) => `<i class="${t > i ? (t === 3 ? 'gold' : 'on') : ''}"></i>`).join('')}</span></h3><div class="law">${H(S(id).law)}</div><span class="more">📖 Cours, méthode et exemples →</span></button>`
                : `<div class="page torn">Page arrachée — ${esc(S(id).place)}</div>`;
            })
            .join('')}</div>`,
      ).join('');
    else if (tab === 'exp') {
      checkAch();
      const fams = [...new Set(ACH.map((a) => a.fam))];
      const card = (a) => {
        const got = st.ach[a.id];
        if (!got && a.secret) return `<div class="ach secret"><b>??? </b><small>Exploit secret — il se révélera de lui-même.</small></div>`;
        const p = Math.min(a.goal, a.p());
        return `<div class="ach ${got ? 'got' : ''}"><div class="ach-h"><b>${got ? '🏆 ' : ''}${esc(a.name)}</b><span>+${a.xp} XP${a.title ? ' · titre' : ''}</span></div><small>${esc(a.desc)}${a.title ? ` — titre « ${esc(a.title)} »` : ''}</small>${got ? `<small class="ach-d">Obtenu le ${new Date(got).toLocaleDateString('fr-FR')}</small>` : a.goal > 1 && !a.unit ? `<div class="ach-bar"><i style="width:${(100 * p) / a.goal}%"></i></div><small class="ach-d">${p} / ${a.goal}</small>` : ''}</div>`;
      };
      const near = nearAch(3);
      const tl = titles();
      body =
        `<div class="achtitles"><small>TITRE PORTÉ</small><div class="chips"><button class="chip ${!st.title ? 'on' : ''}" data-title="">Aucun</button>${tl.map((t) => `<button class="chip ${st.title === t ? 'on' : ''}" data-title="${esc(t)}">${esc(t)}</button>`).join('')}</div>${tl.length ? '' : '<small class="note">Certains exploits donnent un titre, affiché sous ton nom.</small>'}</div>` +
        (near.length ? `<h2 class="achfam">PRESQUE</h2><div class="achs">${near.map((x) => card(x.a)).join('')}</div>` : '') +
        fams.map((f) => `<h2 class="achfam">${esc(f.toUpperCase())}</h2><div class="achs">${ACH.filter((a) => a.fam === f).map(card).join('')}</div>`).join('');
    } else
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
${tab === 'lois' ? '<p class="note" style="text-align:center">Touche une Loi pour ouvrir son Grimoire : cours, méthode pas à pas et exemples résolus, pour chaque rang.</p>' : ''}<div class="tabs"><button class="${tab === 'lois' ? 'on' : ''}" data-tab="lois">Les Lois</button><button class="${tab === 'frag' ? 'on' : ''}" data-tab="frag">L’histoire</button><button class="${tab === 'exp' ? 'on' : ''}" data-tab="exp">Exploits</button></div>${body}</div>`;
    wireHud({ label: 'Carte', hash: '#/world' });
    $$('[data-tab]').forEach((b) => (b.onclick = () => (CU.sfx.click(), renderCodex(b.dataset.tab))));
    $$('[data-lesson]').forEach((b) => (b.onclick = () => (CU.sfx.click(), openLesson(b.dataset.lesson, Math.min(2, Math.max(0, tierOf(b.dataset.lesson) - 1))))));
    $$('[data-title]').forEach(
      (b) =>
        (b.onclick = () => {
          CU.sfx.click();
          st.title = b.dataset.title || '';
          save();
          renderCodex('exp');
        }),
    );
  }

  /* ================= composants d'exercice ================= */
  const RENDER = {};
  // champs de saisie avec aperçu et clavier
  // touches du clavier d'exercice selon les types de champs
  const keysFor = (ex) => {
    const has = (k) => ex.fields.some((f) => f.kind === k);
    if (has('interval')) return ['[', ']', ';', '∞', '∪', 'ℝ', '∖', '{', '}', '−', '/', '√', '(', ')'];
    if (ex.fields.every((f) => f.kind === 'frac')) return ['−', '/'];
    return (has('expr') ? ['x', 'x²', '(', ')', '−', '/', '√'] : ['−', '/', '√', '(', ')']).concat(has('set') ? [';'] : []);
  };
  RENDER.fields = (zone, ex) => {
    const inline = ex.inline;
    zone.innerHTML =
      `<div class="fieldrow ${inline ? 'inline-wrap' : ''}">${ex.fields
        .map(
          (f, i) =>
            `<div class="fld"><label for="f${i}">${H(f.label)}</label><input class="inp" id="f${i}" data-kind="${f.kind}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" ${(f.kind === 'num' || f.kind === 'frac') && !ex.fields.some((g) => g.kind !== 'num' && g.kind !== 'frac') ? 'inputmode="text"' : ''} placeholder="${f.kind === 'set' ? 'ex. -2 ; 3/2' : f.kind === 'expr' ? 'ex. 3x(2x-1)' : f.kind === 'text' ? '' : f.kind === 'interval' ? 'ex. ]-∞ ; 2] ∪ [5 ; +∞[' : f.kind === 'frac' ? 'ex. -3/4' : 'ex. -3/2'}" />${f.kind !== 'text' ? `<div class="prev" id="p${i}"></div>` : ''}</div>`,
        )
        .join('')}</div>` +
      (ex.fields.some((f) => f.kind !== 'text')
        ? `<div class="keys">${keysFor(ex).map((k) => `<button type="button" data-k="${k}">${k}</button>`).join('')}${ex.emptyBtn ? `<button type="button" data-k="aucune" style="font-family:var(--font-u)">aucune</button>` : ''}</div>`
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
          const ins = { 'x²': 'x²', '−': '-', ';': ' ; ', '∪': ' ∪ ' }[k] || k;
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
  function gridSvg(g, extra = () => '', opts = {}) {
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
      st = CU.save.migrate(CU.save.local(last.key));
      if (!st.prologue) return renderPrologue(0);
      if (location.hash.startsWith('#/t/') || location.hash.startsWith('#/b/')) history.replaceState(null, '', '#/world');
      route();
      CU.save
        .cloudGet(KEY)
        .then((c) => {
          // toujours fusionner (les horloges des appareils peuvent différer) ; sur place, sans
          // remplacer les objets que l'écran affiché utilise déjà
          if (c && CU.save.mergeInto(st, c)) {
            CU.save.storeLocal(KEY, st);
            paintXp();
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
  CU.debug = { get st() { return st; }, set st(x) { st = x; }, get view() { return view; }, save, go, route, available, tierOf, sk, win: () => success(), submit: (a) => submit(a), startTrial, startBoss, renderRegion, startArena, openLesson, startRecall, openRecallSheet, dep: { available, maxAllowed, tierContent, openVariants, missingFor, genFor }, q: { dk, dshift, streakCur, quest, dailyRoll, repairable, ACH, checkAch } };
})();
