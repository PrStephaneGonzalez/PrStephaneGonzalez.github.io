/* Dessins vectoriels : sceau-titre, carte du monde, scènes des régions, gardiens. */
'use strict';
(function () {
  const A = (CU.ART = {});
  // hasard déterministe
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const mix = (c1, c2, t) => {
    const h = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
    const a = h(c1),
      b = h(c2);
    return '#' + a.map((x, i) => Math.round(x + (b[i] - x) * t).toString(16).padStart(2, '0')).join('');
  };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function stars(r, n, w, h, ymax) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const x = r() * w,
        y = r() * ymax,
        rad = 0.8 + r() * 2.2;
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(1)}" fill="#fff" opacity="${(0.35 + r() * 0.6).toFixed(2)}" class="${r() < 0.4 ? 'twinkle' : ''}" style="animation-delay:${(r() * 3).toFixed(1)}s"/>`;
    }
    return s;
  }

  A.sigil = () => `<svg class="sigil" viewBox="0 0 200 200" aria-hidden="true">
<defs><radialGradient id="sg" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#f5d79a" stop-opacity=".35"/><stop offset="1" stop-color="#f5d79a" stop-opacity="0"/></radialGradient></defs>
<circle cx="100" cy="100" r="96" fill="url(#sg)"/>
<g class="spin" fill="none" stroke="#d9ab5b" stroke-width="1.2">
<circle cx="100" cy="100" r="88" stroke-dasharray="2 6"/>
<circle cx="100" cy="100" r="80"/>
${[...Array(12)].map((_, i) => `<text x="100" y="27" fill="#d9ab5b" stroke="none" font-size="11" text-anchor="middle" font-family="serif" transform="rotate(${i * 30} 100 100)">${'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃ'[i]}</text>`).join('')}
</g>
<g class="spin2" fill="none" stroke="#d9ab5b" stroke-width="1.4">
<polygon points="100,38 154,131 46,131" opacity=".8"/>
<polygon points="100,162 46,69 154,69" opacity=".8"/>
<circle cx="100" cy="100" r="56" stroke-dasharray="8 4"/>
</g>
<path d="M78 82 h44 v40 h-44z M100 82 v40" fill="#110e17" stroke="#f5d79a" stroke-width="2"/>
<path d="M84 92h10M84 100h10M84 108h10M106 92h10M106 100h10M106 108h10" stroke="#d9ab5b" stroke-width="1.2"/>
</svg>`;

  A.raven = (size = 36) => `<svg width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><path d="M10 40 C14 24 30 14 44 18 L58 14 L50 24 C54 34 46 48 30 50 L18 58 L20 48 C14 48 10 45 10 40Z" fill="#0d0b12" stroke="#d9ab5b" stroke-width="1.5"/><circle cx="42" cy="24" r="2.6" fill="#e9eef5"/><path d="M22 40 C28 36 36 36 42 40" stroke="#d9ab5b" stroke-width="1" fill="none" opacity=".6"/></svg>`;

  /* ---------- carte du monde ---------- */
  A.world = (v) => {
    // v = {regions:[{id,name,hue,map,p,boss,open}], total, finalOpen, finalDone}
    const r = rng(7);
    const tp = v.total;
    const sky = mix('#050408', '#10142a', tp);
    let s = `<svg viewBox="0 0 1000 1000" role="img" aria-label="Carte des Terres Brisées">
<defs>
<radialGradient id="wsky" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="${sky}"/><stop offset="1" stop-color="#030205"/></radialGradient>
<radialGradient id="fogc" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#b9b3c7" stop-opacity=".55"/><stop offset="1" stop-color="#b9b3c7" stop-opacity="0"/></radialGradient>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="rough"><feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="3" seed="4"/><feDisplacementMap in="SourceGraphic" scale="34"/></filter>
${v.regions.map((g) => `<radialGradient id="rg-${g.id}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${g.hue}" stop-opacity="${(0.15 + 0.55 * g.p).toFixed(2)}"/><stop offset="1" stop-color="${g.hue}" stop-opacity="0"/></radialGradient>`).join('')}
</defs>
<rect width="1000" height="1000" fill="url(#wsky)"/>
${stars(r, Math.round(20 + 120 * tp), 1000, 1000, 1000)}
<circle cx="860" cy="110" r="46" fill="${mix('#7a1d26', '#e9e4d8', tp)}" opacity="${(0.35 + 0.5 * tp).toFixed(2)}" filter="url(#glow)"/>
<path filter="url(#rough)" d="M140 190 C260 90 430 140 520 120 C640 90 800 130 880 220 C960 330 900 430 930 540 C960 660 900 800 790 860 C680 930 560 960 450 950 C320 940 190 900 120 800 C60 700 90 600 70 500 C50 380 60 260 140 190Z" fill="#100d16" stroke="#3b2f22" stroke-width="3"/>
<path filter="url(#rough)" d="M220 260 C330 220 420 280 500 250 C600 220 700 260 780 320 M200 640 C300 600 380 680 480 650 C580 620 680 690 800 660" fill="none" stroke="#1d1826" stroke-width="10" opacity=".9"/>`;
    // routes
    const C = [500, 520];
    for (const g of v.regions) {
      const lit = g.p > 0;
      s += `<path d="M${C[0]} ${C[1]} Q ${(C[0] + g.map[0]) / 2 + (g.map[1] > 500 ? 60 : -60)} ${(C[1] + g.map[1]) / 2} ${g.map[0]} ${g.map[1]}" fill="none" stroke="${lit ? g.hue : '#3a3344'}" stroke-width="${lit ? 4 : 3}" stroke-dasharray="${lit ? '0' : '10 12'}" opacity="${lit ? 0.35 + 0.5 * g.p : 0.6}" ${lit ? 'filter="url(#glow)"' : ''}/>`;
    }
    // sanctuaire
    const fo = v.finalOpen,
      fd = v.finalDone;
    s += `<g class="site ${fo ? '' : 'locked'}" data-final="1" transform="translate(500 520)">
<circle r="120" fill="${fd ? '#d9ab5b' : '#e0475b'}" opacity="${fd ? 0.25 : fo ? 0.18 : 0.05}" filter="url(#glow)"/>
<path d="M-26 40 L-14 -78 L0 -110 L14 -78 L26 40Z" fill="#0b0910" stroke="${fd ? '#f5d79a' : fo ? '#e0475b' : '#3a3344'}" stroke-width="3"/>
<path d="M-60 40 h120 l-14 26 h-92z" fill="#0b0910" stroke="${fd ? '#f5d79a' : '#3a3344'}" stroke-width="3"/>
<circle cy="-40" r="12" fill="${fd ? '#f5d79a' : fo ? '#e0475b' : '#2a2433'}" filter="url(#glow)"/>
<text y="104" text-anchor="middle" font-family="Cinzel,serif" font-size="30" font-weight="700" fill="${fo ? '#f2c3ca' : '#6f6878'}" stroke="#07060a" stroke-width="6" paint-order="stroke">Le Sanctuaire</text>
</g>`;
    // régions
    for (const g of v.regions) {
      const [x, y] = g.map;
      const circ = 2 * Math.PI * 82;
      const words = g.name.replace(/^(Les|La|Le) /, '$1 ').split(/ (?=des |de )/);
      s += `<g class="site ${g.open ? '' : 'locked'}" data-region="${g.id}" transform="translate(${x} ${y})">
<circle r="150" fill="url(#rg-${g.id})"/>
<circle r="82" fill="none" stroke="#2a2433" stroke-width="8"/>
<circle class="ring" r="82" fill="none" stroke="${g.hue}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${circ * (1 - g.p)}" transform="rotate(-90)" filter="url(#glow)"/>
<circle class="emb" r="66" fill="#0e0b13" stroke="${g.open ? g.hue : '#3a3344'}" stroke-width="2.5"/>
<text y="22" text-anchor="middle" font-family="Cinzel,serif" font-size="62" fill="${g.open ? g.hue : '#4a4352'}" ${g.p > 0 ? 'filter="url(#glow)"' : ''}>${esc(g.icon)}</text>
${g.boss ? `<text x="58" y="-50" font-size="34" text-anchor="middle">👑</text>` : ''}
${words.map((w, i) => `<text y="${120 + i * 34}" text-anchor="middle" font-family="Cinzel,serif" font-size="30" font-weight="700" fill="${g.open ? '#ece6da' : '#6f6878'}" stroke="#07060a" stroke-width="7" paint-order="stroke">${esc(w)}</text>`).join('')}
<ellipse class="drift" cx="-20" cy="0" rx="170" ry="90" fill="url(#fogc)" opacity="${(0.85 * (1 - g.p)).toFixed(2)}"/>
</g>`;
    }
    s += `<ellipse class="drift" cx="300" cy="500" rx="300" ry="120" fill="url(#fogc)" opacity="${(0.5 * (1 - tp)).toFixed(2)}"/>`;
    return s + '</svg>';
  };

  /* ---------- scène de région ---------- */
  function silhouette(kind, r, lit, hue) {
    // renvoie {shape, windows:[[x,y,w,h]]}
    let d = '',
      win = [];
    if (kind === 'ramparts') {
      d = 'M0 760 ';
      for (let x = 0; x <= 1000; x += 40) d += `L${x} 740 L${x} 712 L${x + 20} 712 L${x + 20} 740 `;
      d += 'L1000 760 L1000 1050 L0 1050Z';
      for (const tx of [90, 470, 880]) {
        d += `M${tx - 50} 1050 L${tx - 50} 600 L${tx - 60} 600 L${tx - 60} 560 L${tx + 60} 560 L${tx + 60} 600 L${tx + 50} 600 L${tx + 50} 1050Z`;
        win.push([tx - 10, 640, 20, 34], [tx - 10, 720, 20, 34]);
      }
      for (let x = 160; x < 860; x += 120) win.push([x, 800, 14, 24]);
    } else if (kind === 'crypt') {
      d = 'M0 820 C200 790 400 840 600 800 C800 770 900 810 1000 790 L1000 1050 L0 1050Z';
      for (const [cx, w, h] of [[150, 90, 150], [380, 70, 110], [620, 110, 200], [850, 80, 130]]) {
        d += `M${cx - w / 2} 1050 L${cx - w / 2} ${820 - h + w / 2} A${w / 2} ${w / 2} 0 0 1 ${cx + w / 2} ${820 - h + w / 2} L${cx + w / 2} 1050Z`;
        win.push([cx - 8, 840 - h + w / 2, 16, 40]);
      }
      for (let x = 60; x < 1000; x += 90) d += `M${x} 1050 L${x} 880 L${x + 8} 860 L${x + 16} 880 L${x + 16} 1050Z`;
    } else if (kind === 'tower') {
      d = 'M0 860 C250 830 750 830 1000 860 L1000 1050 L0 1050Z';
      d += 'M430 1050 L445 380 L425 380 L425 340 L500 250 L575 340 L575 380 L555 380 L570 1050Z';
      for (let y = 420; y < 900; y += 80) win.push([488, y, 24, 40]);
      d += 'M140 1050 L150 700 L130 700 L170 640 L210 700 L190 700 L200 1050Z M800 1050 L810 660 L790 660 L830 590 L870 660 L850 660 L860 1050Z';
      win.push([162, 740, 16, 26], [822, 700, 16, 26]);
    } else if (kind === 'library') {
      d = 'M0 880 L1000 880 L1000 1050 L0 1050Z M180 880 L180 640 L820 640 L820 880Z M220 640 A280 200 0 0 1 780 640Z M470 440 L530 440 L530 400 L470 400Z';
      for (let x = 230; x < 800; x += 80) win.push([x, 690, 30, 150]);
    } else {
      d = 'M0 840 L1000 840 L1000 1050 L0 1050Z';
      for (let i = 0; i < 4; i++) {
        const m = 60 + i * 70;
        d += `M${m} 1050 L${m} ${700 + i * 40} L${1000 - m} ${700 + i * 40} L${1000 - m} 1050 L${1000 - m - 24} 1050 L${1000 - m - 24} ${724 + i * 40} L${m + 24} ${724 + i * 40} L${m + 24} 1050Z`;
      }
      for (let x = 100; x < 1000; x += 160) win.push([x, 900, 20, 20]);
    }
    return { d, win };
  }
  A.scene = (v) => {
    // v = {region, p, bossDone, bossOpen, nodes:[{id,x,y,name,glyph,tier,state,ember,isNew}], edges:[{a,b,state}]}
    const g = v.region,
      p = v.p,
      hue = g.hue;
    const r = rng(g.id.charCodeAt(0) * 31 + g.id.charCodeAt(1));
    const top = mix('#040306', g.deep, 0.25 + 0.75 * p),
      bot = mix('#08060b', mix(g.deep, '#000000', 0.3), p);
    const sil = silhouette(g.scene, r, p, hue);
    const nWin = Math.round(sil.win.length * p);
    let s = `<svg viewBox="0 0 1000 1050" role="img" aria-label="${esc(g.name)}">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bot}"/></linearGradient>
<radialGradient id="hz" cx="50%" cy="100%" r="80%"><stop offset="0" stop-color="${hue}" stop-opacity="${(0.08 + 0.3 * p).toFixed(2)}"/><stop offset="1" stop-color="${hue}" stop-opacity="0"/></radialGradient>
<radialGradient id="fog" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#c9c3d6" stop-opacity=".5"/><stop offset="1" stop-color="#c9c3d6" stop-opacity="0"/></radialGradient>
<radialGradient id="halo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${hue}" stop-opacity=".55"/><stop offset="1" stop-color="${hue}" stop-opacity="0"/></radialGradient>
<radialGradient id="haloG" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#f5d79a" stop-opacity=".6"/><stop offset="1" stop-color="#f5d79a" stop-opacity="0"/></radialGradient>
<filter id="gl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="1000" height="1050" fill="url(#sky)"/>
<rect width="1000" height="1050" fill="url(#hz)"/>
${stars(r, Math.round(8 + 90 * p), 1000, 1000, 650)}
<circle cx="830" cy="140" r="54" fill="${mix('#8a1f2b', '#efe9dc', p)}" opacity="${(0.4 + 0.5 * p).toFixed(2)}" filter="url(#gl)"/>`;
    if (v.bossDone)
      s += `<path d="M-50 260 C200 160 400 320 620 200 C800 110 920 220 1050 150" stroke="${hue}" stroke-width="60" fill="none" opacity=".18" filter="url(#gl)"/><path d="M-50 300 C220 220 420 360 640 250 C820 160 930 260 1050 200" stroke="${hue}" stroke-width="24" fill="none" opacity=".22" filter="url(#gl)"/>`;
    s += `<path d="M0 640 C120 580 220 620 330 570 C450 520 560 600 690 560 C820 520 900 580 1000 550 L1000 1050 L0 1050Z" fill="${mix('#0b0910', g.deep, 0.25 * p)}" opacity=".9"/>
<path d="${sil.d}" fill="#0a080e" stroke="${p > 0 ? hue : '#211c29'}" stroke-opacity="${(0.15 + 0.35 * p).toFixed(2)}" stroke-width="2"/>
${sil.win
  .map((w, i) => `<rect x="${w[0]}" y="${w[1]}" width="${w[2]}" height="${w[3]}" rx="3" fill="${i < nWin ? hue : '#16121c'}" ${i < nWin ? 'filter="url(#gl)" opacity=".85"' : ''}/>`)
  .join('')}`;
    if (v.bossDone)
      for (const [bx, by] of [[90, 560], [880, 560]].filter(() => g.scene === 'ramparts').concat([[500, 250]].filter(() => g.scene === 'tower')).concat(g.scene !== 'ramparts' && g.scene !== 'tower' ? [[160, 640], [840, 640]] : []))
        s += `<path d="M${bx} ${by} v-90 l46 14 l-46 14" stroke="${hue}" stroke-width="3" fill="${hue}" fill-opacity=".7" filter="url(#gl)"/>`;
    // arêtes
    const pos = Object.fromEntries(v.nodes.map((n) => [n.id, n]));
    for (const e of v.edges) {
      const a = pos[e.a],
        b = pos[e.b];
      if (!a || !b) continue;
      const mx = (a.x + b.x) / 2 + (a.y - b.y) * 0.12,
        my = (a.y + b.y) / 2 + (b.x - a.x) * 0.12;
      const st = e.state;
      s += `<path d="M${a.x} ${a.y} Q${mx} ${my} ${b.x} ${b.y}" fill="none" stroke="${st === 'lit' ? hue : st === 'open' ? hue : '#3a3344'}" stroke-width="${st === 'lit' ? 5 : 3}" stroke-dasharray="${st === 'lit' ? '0' : '8 10'}" opacity="${st === 'lit' ? 0.75 : st === 'open' ? 0.45 : 0.55}" ${st === 'lit' ? 'filter="url(#gl)"' : ''}/>`;
    }
    // portail du gardien
    const bo = v.bossOpen,
      bd = v.bossDone;
    s += `<g class="node boss ${bo && !bd ? 'new' : ''}" data-boss="1" transform="translate(500 120)">
${bo && !bd ? `<circle class="pulse" r="78" fill="none" stroke="#e0475b" stroke-width="3"/>` : ''}
<circle r="90" fill="${bd ? 'url(#haloG)' : bo ? 'url(#halo)' : 'none'}" opacity="${bd ? 1 : 0.5}"/>
<path d="M-48 52 L-48 -10 C-48 -50 -20 -70 0 -78 C20 -70 48 -50 48 -10 L48 52Z" fill="#0c0a10" stroke="${bd ? '#f5d79a' : bo ? '#e0475b' : '#3a3344'}" stroke-width="4"/>
<text y="18" text-anchor="middle" font-size="46" font-family="serif" fill="${bd ? '#f5d79a' : bo ? '#ff8494' : '#4a4352'}" ${bo ? 'filter="url(#gl)"' : ''}>${esc(g.boss.glyph)}</text>
${!bo ? '<text y="44" text-anchor="middle" font-size="24">⛓</text>' : ''}
<text y="92" text-anchor="middle" font-family="Cinzel,serif" font-size="29" font-weight="700" fill="${bd ? '#f5d79a' : bo ? '#ffb3bd' : '#6f6878'}" stroke="#07060a" stroke-width="6" paint-order="stroke">${esc(g.boss.name)}</text>
</g>`;
    // Informes : ombres qui rôdent près des Lois non comprises
    const lurk = v.nodes.filter((n) => n.tier === 0);
    for (const n of lurk) {
      const ox = n.x + (r() < 0.5 ? -1 : 1) * (92 + r() * 20),
        oy = n.y - 58 - r() * 20;
      s += `<g class="drift" pointer-events="none" style="animation-duration:${(9 + r() * 8).toFixed(1)}s"><path d="M${ox - 26} ${oy + 40} C${ox - 30} ${oy - 10} ${ox - 10} ${oy - 34} ${ox} ${oy - 34} C${ox + 12} ${oy - 34} ${ox + 30} ${oy - 10} ${ox + 26} ${oy + 40} C${ox + 14} ${oy + 30} ${ox + 6} ${oy + 44} ${ox} ${oy + 34} C${ox - 8} ${oy + 44} ${ox - 14} ${oy + 30} ${ox - 26} ${oy + 40}Z" fill="#000" opacity=".75"/><circle cx="${ox - 8}" cy="${oy - 12}" r="3.2" fill="#ff3348" filter="url(#gl)"/><circle cx="${ox + 8}" cy="${oy - 12}" r="3.2" fill="#ff3348" filter="url(#gl)"/></g>`;
    }
    // nœuds
    for (const n of v.nodes) {
      const locked = n.state === 'locked';
      const col = locked ? '#4a4352' : n.tier === 3 ? '#f5d79a' : hue;
      const arcs = [0, 1, 2]
        .map((i) => {
          const a0 = ((-90 + i * 120 + 8) * Math.PI) / 180,
            a1 = ((-90 + i * 120 + 112) * Math.PI) / 180,
            R = 63;
          const lit = n.tier > i;
          return `<path d="M${(R * Math.cos(a0)).toFixed(1)} ${(R * Math.sin(a0)).toFixed(1)} A${R} ${R} 0 0 1 ${(R * Math.cos(a1)).toFixed(1)} ${(R * Math.sin(a1)).toFixed(1)}" fill="none" stroke="${lit ? (n.tier === 3 ? '#f5d79a' : hue) : '#2c2634'}" stroke-width="7" stroke-linecap="round" ${lit ? 'filter="url(#gl)"' : ''}/>`;
        })
        .join('');
      const words = n.name.split(' ');
      const lines = [];
      for (const w of words) {
        const L = lines[lines.length - 1];
        if (L && (L + ' ' + w).length <= 16) lines[lines.length - 1] = L + ' ' + w;
        else lines.push(w);
      }
      s += `<g class="node ${n.state} ${n.isNew ? 'new' : ''}" data-id="${n.id}" transform="translate(${n.x} ${n.y})" tabindex="0" role="button" aria-label="${esc(n.name)}">
<circle r="110" fill="${n.tier === 3 ? 'url(#haloG)' : 'url(#halo)'}" class="halo" opacity="${locked ? 0 : (0.15 + n.tier * 0.28).toFixed(2)}"/>
${n.isNew ? `<circle class="pulse" r="74" fill="none" stroke="${hue}" stroke-width="3"/>` : ''}
${n.tier === 3 ? `<circle class="crown" r="78" fill="none" stroke="#f5d79a" stroke-width="2" stroke-dasharray="3 9" opacity=".9"/>` : ''}
<g class="core"><circle r="52" fill="#100d15" stroke="${col}" stroke-width="2.5"/>
${arcs}
<text y="17" text-anchor="middle" font-size="48" font-family="Cinzel,serif" fill="${col}" ${!locked && n.tier ? 'filter="url(#gl)"' : ''}>${esc(n.glyph)}</text></g>
${locked ? '<text x="38" y="-34" font-size="28">⛓</text>' : ''}
${n.ember ? '<text x="30" y="-26" font-size="26">🔥</text>' : ''}
${lines.map((l, i) => `<text y="${100 + i * 31}" text-anchor="middle" font-family="Cinzel,serif" font-size="29" font-weight="700" fill="${locked ? '#6f6878' : '#ece6da'}" stroke="#07060a" stroke-width="6" paint-order="stroke">${esc(l)}</text>`).join('')}
${n.sub ? `<text y="${100 + lines.length * 31 + 2}" text-anchor="middle" font-family="Inter,sans-serif" font-size="23" font-weight="600" fill="${locked ? '#6f6878' : n.tier === 3 ? '#f5d79a' : hue}" stroke="#07060a" stroke-width="5" paint-order="stroke">${esc(n.sub)}</text>` : ''}
</g>`;
    }
    // l'Autel du Souvenir : on y révise ce qui a été appris (répétition espacée)
    if (v.altar) {
      const a = v.altar,
        ac = a.open ? '#c8b6ff' : '#4a4352';
      s += `<g class="node altar ${a.open ? 'open' : 'locked'} ${a.open && a.due ? 'new' : ''}" data-recall="1" transform="translate(${a.x} ${a.y})" tabindex="0" role="button" aria-label="Autel du Souvenir">
<circle r="105" fill="url(#halo)" opacity="${a.open ? (a.due ? 0.55 : 0.25) : 0.05}"/>
${a.open && a.due ? `<circle class="pulse" r="70" fill="none" stroke="#c8b6ff" stroke-width="3"/>` : ''}
<g class="core"><path d="M-46 40 L46 40 L38 22 L-38 22 Z M-30 22 L-30 -12 L30 -12 L30 22 Z" fill="#100d15" stroke="${ac}" stroke-width="3"/>
<path d="M-38 -12 L0 -50 L38 -12 Z" fill="#100d15" stroke="${ac}" stroke-width="3"/>
<text y="14" text-anchor="middle" font-size="30" font-family="serif" fill="${ac}" ${a.open ? 'filter="url(#gl)"' : ''}>◈</text>
${a.open && a.due ? `<circle cx="44" cy="-40" r="21" fill="#c8b6ff"/><text x="44" y="-31" text-anchor="middle" font-family="Inter,sans-serif" font-size="25" font-weight="700" fill="#100d15">${a.due > 99 ? '99' : a.due}</text>` : ''}</g>
<text y="84" text-anchor="middle" font-family="Cinzel,serif" font-size="27" font-weight="700" fill="${a.open ? '#e6dcff' : '#6f6878'}" stroke="#07060a" stroke-width="6" paint-order="stroke">Autel du</text>
<text y="114" text-anchor="middle" font-family="Cinzel,serif" font-size="27" font-weight="700" fill="${a.open ? '#e6dcff' : '#6f6878'}" stroke="#07060a" stroke-width="6" paint-order="stroke">Souvenir</text>
<text y="143" text-anchor="middle" font-family="Inter,sans-serif" font-size="23" font-weight="600" fill="${ac}" stroke="#07060a" stroke-width="5" paint-order="stroke">${esc(a.sub)}</text>
</g>`;
    }
    // brume (décor : ne doit jamais capter les touchers)
    const fogO = (0.75 * (1 - p)).toFixed(2);
    s += `<g pointer-events="none"><ellipse class="drift" cx="200" cy="860" rx="420" ry="130" fill="url(#fog)" opacity="${fogO}"/><ellipse class="drift" style="animation-duration:34s" cx="760" cy="620" rx="380" ry="110" fill="url(#fog)" opacity="${(fogO * 0.8).toFixed(2)}"/><ellipse class="drift" style="animation-duration:40s" cx="400" cy="380" rx="360" ry="100" fill="url(#fog)" opacity="${(fogO * 0.6).toFixed(2)}"/></g>`;
    return s + '</svg>';
  };

  A.boss = (glyph, hue = '#e0475b', size = 64) => `<svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">
<defs><radialGradient id="bp" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="${hue}" stop-opacity=".55"/><stop offset="1" stop-color="${hue}" stop-opacity="0"/></radialGradient></defs>
<circle cx="50" cy="50" r="48" fill="url(#bp)"/>
<path d="M20 92 C20 60 30 40 50 34 C70 40 80 60 80 92Z" fill="#050407"/>
<circle cx="50" cy="34" r="16" fill="#050407"/>
<path d="M36 22 L42 4 L46 18 L50 2 L54 18 L58 4 L64 22" fill="none" stroke="${hue}" stroke-width="2"/>
<circle cx="44" cy="34" r="2.6" fill="#ff3348"/><circle cx="56" cy="34" r="2.6" fill="#ff3348"/>
<text x="50" y="78" text-anchor="middle" font-size="24" font-family="serif" fill="${hue}">${esc(glyph)}</text></svg>`;

  A.seal = (hue, glyph) => {
    let shards = '';
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2,
        a2 = ((i + 1) / 10) * Math.PI * 2;
      const dx = Math.cos(a + 0.3) * 120,
        dy = Math.sin(a + 0.3) * 120;
      shards += `<path class="shardp" style="--dx:${dx.toFixed(0)}px;--dy:${dy.toFixed(0)}px;--rot:${((i % 2 ? 1 : -1) * 90).toFixed(0)}deg" d="M100 100 L${(100 + 70 * Math.cos(a)).toFixed(1)} ${(100 + 70 * Math.sin(a)).toFixed(1)} L${(100 + 70 * Math.cos(a2)).toFixed(1)} ${(100 + 70 * Math.sin(a2)).toFixed(1)}Z" fill="#1a1522" stroke="${hue}" stroke-width="1.5"/>`;
    }
    return `<svg class="seal-anim" viewBox="0 0 200 200" aria-hidden="true"><defs><radialGradient id="sl" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="${hue}"/><stop offset="1" stop-color="${hue}" stop-opacity="0"/></radialGradient></defs>
<circle class="core2" cx="100" cy="100" r="90" fill="url(#sl)" opacity=".8"/>
${shards}
<text class="core2" x="100" y="118" text-anchor="middle" font-size="52" font-family="Cinzel,serif" fill="#fff">${esc(glyph)}</text></svg>`;
  };
})();
