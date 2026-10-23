// Original, offline vector art. The same apprentice keeps her face at every stage.
export function apprentice(level = 1) {
  level = Math.max(1, Math.min(6, Math.trunc(level) || 1));
  const star = (x, y, r = 5) =>
    `<path d="M${x} ${y - r}l${r * 0.3} ${r * 0.7} ${r * 0.7} ${r * 0.3}-${r * 0.7} ${r * 0.3}-${r * 0.3} ${r * 0.7}-${r * 0.3}-${r * 0.7}-${r * 0.7}-${r * 0.3} ${r * 0.7}-${r * 0.3}Z"/>`;
  return `<svg class="apprentice-art" viewBox="0 0 300 400" role="img" aria-label="Apprentie magicienne blonde, évolution ${level}">
  <ellipse cx="150" cy="376" rx="93" ry="13" fill="#11162c" opacity=".6"/>
  <g fill="#f2d596" opacity=".6">${star(55, 128, 5)}${star(244, 102, 4)}${star(47, 280, 4)}</g>
  ${level >= 2 ? '<path d="M101 169Q66 223 53 340Q93 366 151 346Q212 366 250 339Q224 215 198 169Z" fill="#773c69" stroke="#cf9c9a" stroke-width="2"/><path d="M105 180L69 335L117 320L150 188L187 321L233 335L195 179Z" fill="#a36182"/><path d="M80 302L83 310L91 313L83 316L80 324L77 316L69 313L77 310ZM220 302L223 310L231 313L223 316L220 324L217 316L209 313L217 310Z" fill="#ead3ad"/>' : ''}
  <path d="M119 331L114 369Q115 378 137 374L146 334M161 333L164 372Q186 379 190 369L181 331" fill="#252d46" stroke="#171f36" stroke-width="3"/>
  <path d="M113 367Q99 373 102 381L138 381L138 368M163 368L164 381L201 381Q204 375 187 368" fill="#3c3149" stroke="#d5ab78" stroke-width="2"/>
  <path d="M112 165Q91 173 84 204L68 248L94 261L111 231L98 338Q150 360 202 338L187 231L207 265L232 252L211 201Q201 173 185 165Z" fill="#354667" stroke="#96a1bb" stroke-width="2"/>
  <path d="M145 184L128 340Q153 346 172 340L158 184" fill="#202c49"/>
  <path d="M116 171L145 195L152 181L158 195L184 171" fill="#f2e4cb" stroke="#d6c6af" stroke-width="2"/>
  <path d="M145 189L153 183L160 189L156 204L161 237L150 246L144 237L149 204Z" fill="#c5a366"/>
  <path d="M103 271Q150 284 196 270L197 284Q151 296 102 285Z" fill="#987954"/><rect x="142" y="278" width="18" height="12" rx="3" fill="#f1d291"/>
  <path d="M78 246Q65 253 68 263Q75 273 85 263L96 252M213 253Q226 262 235 252Q242 243 229 238L217 239" fill="#f4cbb2" stroke="#c38b77" stroke-width="2"/>
  <path d="M102 157Q76 119 96 70Q109 35 154 39Q209 38 211 90Q226 140 198 177L185 157L104 179Z" fill="#cb943e" stroke="#f3cf76" stroke-width="2"/>
  <path d="M137 146L136 169Q151 183 168 167L166 145" fill="#efbda0"/>
  <path d="M107 92Q104 60 153 59Q201 63 195 104L190 131Q181 158 153 161Q123 159 112 134Z" fill="#f6d0b6" stroke="#d89f83" stroke-width="1.5"/>
  <path d="M103 112Q91 60 133 49Q180 28 203 76L204 116Q183 99 180 72Q150 102 111 100L105 146L97 161Q91 134 103 112Z" fill="#edbd58"/>
  <path d="M112 79Q142 53 171 55M100 116Q97 142 104 161M194 103Q207 140 191 163" fill="none" stroke="#ffe19a" stroke-width="4" stroke-linecap="round"/>
  <path d="M122 112Q128 108 135 112M166 112Q173 108 179 112" fill="none" stroke="#9f713d" stroke-width="2.5" stroke-linecap="round"/>
  <ellipse cx="130" cy="121" rx="3.5" ry="5" fill="#465562"/><ellipse cx="173" cy="121" rx="3.5" ry="5" fill="#465562"/>
  <circle cx="131" cy="119" r="1.1" fill="#fff"/><circle cx="174" cy="119" r="1.1" fill="#fff"/>
  <ellipse cx="120" cy="135" rx="8" ry="4" fill="#e8a99b" opacity=".5"/><ellipse cx="182" cy="135" rx="8" ry="4" fill="#e8a99b" opacity=".5"/>
  <path d="M151 125L147 134L152 135M141 143Q152 151 164 142" fill="none" stroke="#b77569" stroke-width="2" stroke-linecap="round"/>
  <g transform="rotate(-12 86 244)"><rect x="52" y="219" width="56" height="65" rx="5" fill="${level >= 6 ? '#716297' : '#528077'}" stroke="#e1c48c" stroke-width="3"/><path d="M62 220V282M72 233H97M74 270H94" stroke="#c9d8bb" stroke-width="2"/><g fill="#f1d596">${star(84, 251, 9)}</g></g>
  ${level >= 3 ? '<path d="M229 243L256 166" stroke="#e0b17b" stroke-width="6" stroke-linecap="round"/><circle cx="256" cy="163" r="13" fill="#f4dba1" opacity=".18"/><g fill="#ffe5ad">' + star(256, 163, 9) + star(276, 149, 4) + star(244, 139, 3) + '</g><path d="M112 307L123 316L117 329M186 307L175 316L181 329" fill="none" stroke="#e6c58d" stroke-width="2"/>' : '<path d="M228 241L250 192" stroke="#a98261" stroke-width="5" stroke-linecap="round"/>'}
  ${level >= 4 ? '<path d="M108 64Q116 23 143 6Q167 14 176 29Q180 44 197 62Z" fill="#41466e" stroke="#bda6bb" stroke-width="2"/><path d="M114 49Q149 58 189 47L194 60L108 64Z" fill="#b48a62"/><ellipse cx="151" cy="65" rx="63" ry="12" fill="#51517b" stroke="#c9afbd" stroke-width="2"/><path d="M143 23L146 30L153 32L147 36L147 43L141 38L135 41L137 34L132 29L140 29Z" fill="#f0d18e"/>' : ''}
  ${level >= 5 ? '<g transform="translate(183 203)"><path d="M-9-7L-10-15L0-10L10-15L9-7Q17 9 0 16Q-17 9-9-7Z" fill="#e7c781"/><circle cx="-5" cy="0" r="5" fill="#f9ebc9"/><circle cx="5" cy="0" r="5" fill="#f9ebc9"/><circle cx="-5" cy="0" r="2" fill="#3b405e"/><circle cx="5" cy="0" r="2" fill="#3b405e"/><path d="M-3 6L0 10L3 6" fill="#9e713c"/></g>' : ''}
  ${level >= 6 ? '<path d="M43 205Q23 153 62 137Q89 127 89 92" fill="none" stroke="#e2c587" stroke-width="1.5" stroke-dasharray="3 7"/><g fill="#ffe6b0">' + star(38, 179, 5) + star(61, 137, 7) + star(89, 92, 5) + '</g><path d="M68 210Q81 194 95 210M74 201Q82 180 91 201" fill="none" stroke="#e7d6a2" stroke-width="2"/>' : ''}
  </svg>`;
}

export function magicSchool() {
  return `<svg class="school-art" viewBox="0 0 620 440" role="img" aria-label="La grande salle de l’école de magie, ses vitraux et sa bibliothèque">
  <path d="M20 420V165Q20 15 171 15H449Q600 15 600 165V420Z" fill="#262a48" stroke="#565471" stroke-width="2"/>
  <path d="M208 332V146Q208 52 310 42Q412 52 412 146V332Z" fill="#171e3d" stroke="#89839b" stroke-width="5"/>
  <path d="M222 318V146Q222 69 310 58Q398 69 398 146V318Z" fill="#35436b"/>
  <circle cx="341" cy="125" r="27" fill="#f4d999"/><circle cx="352" cy="115" r="25" fill="#35436b"/>
  <path d="M310 61V318M222 175H398M225 245H395M250 86L369 309M370 86L252 309" stroke="#737b99" stroke-width="4"/>
  <g fill="#d9c38d"><circle cx="269" cy="132" r="2"/><circle cx="367" cy="206" r="3"/><path d="M258 202H270M264 196V208M340 275H352M346 269V281" stroke="#f1d69b" stroke-width="2"/></g>
  <g stroke="#75617a" stroke-width="5" fill="#38334d"><path d="M51 165H177V358H51Z"/><path d="M443 165H569V358H443Z"/></g>
  <g stroke="#ab8e89" stroke-width="4"><path d="M53 222H175M53 287H175M445 222H567M445 287H567"/></g>
  <g stroke-width="9" stroke-linecap="round">${[63, 79, 96, 114, 135, 153, 459, 475, 492, 510, 532, 551].map((x, i) => `<path d="M${x} 213V${178 + (i % 3) * 6}M${x} 278V${237 + (i % 2) * 8}M${x} 347V${306 + (i % 3) * 4}" stroke="${['#a17481', '#bc9965', '#6e918f', '#7b86ae'][i % 4]}"/>`).join('')}</g>
  <path d="M181 89V174L160 161L141 174V89Z" fill="#784461" stroke="#c09985" stroke-width="1.5"/><path d="M479 89V174L459 161L438 174V89Z" fill="#557c7b" stroke="#a7b29d" stroke-width="1.5"/>
  <g fill="#edcf91"><path d="M158 109L161 119L172 123L161 126L158 137L155 126L145 123L155 119Z"/><path d="M457 109L460 119L471 123L460 126L457 137L454 126L444 123L454 119Z"/></g>
  <path d="M20 373H600L620 440H0Z" fill="#34334f"/><path d="M20 373H600M10 401H610M110 373L80 440M220 373L205 440M400 373L415 440M510 373L540 440" stroke="#676078" stroke-width="1"/>
  <g fill="#f8e0a4" stroke="#b59d80">${[
    [115, 91],
    [494, 58],
    [67, 125],
    [552, 126],
  ]
    .map(
      ([x, y]) =>
        `<rect x="${x}" y="${y}" width="8" height="28" rx="2"/><path d="M${x + 4} ${y - 3}Q${x - 3} ${y - 10} ${x + 4} ${y - 17}Q${x + 12} ${y - 8} ${x + 4} ${y - 3}" fill="#ffe8a8" stroke="none"/>`,
    )
    .join('')}</g>
  </svg>`;
}
