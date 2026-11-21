// Egne, originale illustrasjoner til puslespillet (SVG – skarpe i alle størrelser, fungerer offline).
const svg = (body: string, defs = '') =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs>${defs}</defs>${body}</svg>`)}`;

const sky = (id: string, a: string, b: string) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
const cloud = (x: number, y: number, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})" fill="#fff"><ellipse cx="0" cy="0" rx="34" ry="20"/><ellipse cx="28" cy="-10" rx="26" ry="22"/><ellipse cx="54" cy="2" rx="28" ry="18"/></g>`;
const sun = (x: number, y: number, r = 34) =>
  `<g transform="translate(${x} ${y})"><g stroke="#ffb703" stroke-width="7" stroke-linecap="round">${Array.from({ length: 10 }, (_, i) => {
    const a = (i * Math.PI) / 5;
    return `<line x1="${Math.cos(a) * (r + 10)}" y1="${Math.sin(a) * (r + 10)}" x2="${Math.cos(a) * (r + 24)}" y2="${Math.sin(a) * (r + 24)}"/>`;
  }).join('')}</g><circle r="${r}" fill="#ffd60a"/><circle cx="-11" cy="-6" r="4" fill="#5b3a29"/><circle cx="11" cy="-6" r="4" fill="#5b3a29"/><path d="M-12 8 Q0 18 12 8" stroke="#5b3a29" stroke-width="4" fill="none" stroke-linecap="round"/></g>`;
const flower = (x: number, y: number, c: string, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 V40" stroke="#2d6a4f" stroke-width="5"/><ellipse cx="9" cy="26" rx="10" ry="5" fill="#52b788" transform="rotate(-30 9 26)"/>${[0, 72, 144, 216, 288]
    .map((a) => `<ellipse cx="0" cy="-13" rx="9" ry="14" fill="${c}" transform="rotate(${a})"/>`).join('')}<circle r="8" fill="#ffd60a"/></g>`;
const fish = (x: number, y: number, c: string, s = 1, flip = false) =>
  `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})"><path d="M28 0 L48 -14 L48 14 Z" fill="${c}"/><ellipse cx="0" cy="0" rx="32" ry="20" fill="${c}"/><circle cx="-16" cy="-4" r="6" fill="#fff"/><circle cx="-17" cy="-4" r="3" fill="#111"/><path d="M-4 -18 Q6 -30 16 -16" fill="${c}"/></g>`;
const pine = (x: number, y: number, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-6" y="0" width="12" height="22" fill="#7f5539"/><path d="M0 -70 L30 -20 L-30 -20 Z M0 -45 L38 5 L-38 5 Z" fill="#2d6a4f"/><path d="M0 -70 L14 -48 L-14 -48 Z" fill="#fff"/></g>`;
const eagle = (x: number, y: number, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s}) translate(-100 -110)"><ellipse cx="34" cy="100" rx="22" ry="44" fill="#3d2618" transform="rotate(55 34 100)"/><ellipse cx="166" cy="100" rx="22" ry="44" fill="#3d2618" transform="rotate(-55 166 100)"/><path d="M78 52 Q84 24 96 48 Q100 20 106 48 Q118 24 122 52 Z" fill="#3d2618"/><circle cx="100" cy="112" r="62" fill="#5b3a29"/><ellipse cx="100" cy="140" rx="38" ry="30" fill="#f4d8b0"/><circle cx="78" cy="96" r="17" fill="#fff"/><circle cx="122" cy="96" r="17" fill="#fff"/><circle cx="81" cy="98" r="9" fill="#111"/><circle cx="119" cy="98" r="9" fill="#111"/><circle cx="62" cy="118" r="8" fill="#ff8fab" opacity=".7"/><circle cx="138" cy="118" r="8" fill="#ff8fab" opacity=".7"/><path d="M86 112 Q100 102 114 112 Q108 132 100 136 Q92 132 86 112 Z" fill="#ffb703"/><path d="M58 154 Q100 172 142 154 L140 166 Q100 184 60 166 Z" fill="#e63946"/></g>`;

export const SCENES: string[] = [
  // Sommerdag med hus
  svg(
    `<rect width="400" height="400" fill="url(#s)"/>${sun(320, 70)}${cloud(50, 70)}${cloud(170, 120, 0.8)}
     <path d="M0 270 Q100 220 200 260 T400 250 V400 H0 Z" fill="#74c69d"/><path d="M0 310 Q120 270 240 300 T400 300 V400 H0 Z" fill="#52b788"/>
     <rect x="90" y="200" width="120" height="100" fill="#ff6b6b"/><path d="M75 205 L150 140 L225 205 Z" fill="#9d4edd"/>
     <rect x="135" y="245" width="32" height="55" rx="4" fill="#7f5539"/><circle cx="160" cy="273" r="3" fill="#ffd60a"/>
     <rect x="102" y="220" width="26" height="26" fill="#cfefff" stroke="#fff" stroke-width="4"/><rect x="175" y="220" width="26" height="26" fill="#cfefff" stroke="#fff" stroke-width="4"/>
     <rect x="290" y="210" width="16" height="70" fill="#7f5539"/><circle cx="298" cy="190" r="44" fill="#40916c"/><circle cx="280" cy="180" r="8" fill="#ff4d6d"/><circle cx="312" cy="200" r="8" fill="#ff4d6d"/><circle cx="300" cy="165" r="8" fill="#ff4d6d"/>
     ${flower(40, 330, '#ff70a6', 0.8)}${flower(250, 335, '#ffd166', 0.8)}${flower(350, 330, '#a0c4ff', 0.8)}`,
    sky('s', '#8ee3ff', '#e0f7ff')
  ),
  // Havet
  svg(
    `<rect width="400" height="400" fill="url(#s)"/>${sun(70, 60, 28)}${cloud(260, 60, 0.8)}
     <rect y="150" width="400" height="250" fill="url(#w)"/>
     <path d="M150 140 L250 140 L235 165 L165 165 Z" fill="#e63946"/><path d="M200 60 V140" stroke="#5b3a29" stroke-width="5"/><path d="M204 64 L250 132 L204 132 Z" fill="#fff"/><path d="M196 74 L162 132 L196 132 Z" fill="#ffd60a"/>
     <path d="M0 160 Q25 150 50 160 T100 160 T150 160 T200 160 T250 160 T300 160 T350 160 T400 160" stroke="#fff" stroke-width="5" fill="none" opacity=".7"/>
     ${fish(90, 240, '#ff9f1c')}${fish(290, 280, '#ff70a6', 1.1, true)}${fish(170, 330, '#ffd60a', 0.8)}${fish(330, 210, '#06d6a0', 0.7, true)}
     <circle cx="120" cy="200" r="6" fill="none" stroke="#fff" stroke-width="3"/><circle cx="130" cy="185" r="4" fill="none" stroke="#fff" stroke-width="3"/>
     <path d="M30 400 Q40 350 30 320 M50 400 Q65 360 55 330" stroke="#2d6a4f" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M360 400 Q350 355 365 325" stroke="#2d6a4f" stroke-width="8" fill="none" stroke-linecap="round"/>`,
    sky('s', '#8ee3ff', '#caf0f8') + sky('w', '#48cae4', '#0077b6')
  ),
  // Verdensrommet
  svg(
    `<rect width="400" height="400" fill="url(#s)"/>${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 97) % 400}" cy="${(i * 53) % 400}" r="${(i % 3) + 1}" fill="#fff" opacity=".8"/>`).join('')}
     <circle cx="320" cy="80" r="40" fill="#ffd166"/><circle cx="305" cy="70" r="8" fill="#e9c46a"/><circle cx="330" cy="95" r="6" fill="#e9c46a"/>
     <g transform="translate(90 290)"><ellipse rx="70" ry="16" fill="none" stroke="#ffadad" stroke-width="8"/><circle r="40" fill="#9d4edd"/><path d="M-40 0 A40 40 0 0 0 40 0" fill="#7b2cbf"/><ellipse rx="70" ry="16" fill="none" stroke="#ffadad" stroke-width="8" stroke-dasharray="0 110 200"/></g>
     <g transform="translate(220 200) rotate(25)"><path d="M0 -90 Q40 -40 30 40 L-30 40 Q-40 -40 0 -90 Z" fill="#f1f3f5"/><path d="M0 -90 Q22 -62 26 -40 L-26 -40 Q-22 -62 0 -90 Z" fill="#e63946"/>
       <circle cy="-10" r="16" fill="#4cc9f0" stroke="#adb5bd" stroke-width="5"/><path d="M-30 20 L-55 55 L-28 45 Z M30 20 L55 55 L28 45 Z" fill="#e63946"/>
       <path d="M-18 42 Q0 100 18 42 Z" fill="#ff9f1c"/><path d="M-9 42 Q0 75 9 42 Z" fill="#ffd60a"/></g>`,
    sky('s', '#10002b', '#3c096c')
  ),
  // Regnbue
  svg(
    `<rect width="400" height="400" fill="url(#s)"/>
     ${['#ff595e', '#ff924c', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'].map((c, i) => `<path d="M${40 + i * 18} 300 A${160 - i * 18} ${160 - i * 18} 0 0 1 ${360 - i * 18} 300" stroke="${c}" stroke-width="18" fill="none"/>`).join('')}
     ${cloud(20, 300, 1.3)}${cloud(300, 300, 1.3)}
     <path d="M0 340 Q200 310 400 340 V400 H0 Z" fill="#95d5b2"/>
     ${[[80, 90], [320, 110], [200, 60]].map(([x, y]) => `<path transform="translate(${x} ${y}) scale(1.4)" d="M0 6 C-12 -6 -6 -16 0 -9 C6 -16 12 -6 0 6 Z" fill="#ff70a6"/>`).join('')}
     ${flower(120, 360, '#ff70a6', 0.6)}${flower(280, 360, '#ffd166', 0.6)}`,
    sky('s', '#cfefff', '#fff')
  ),
  // Shqipo flyr over fjellene
  svg(
    `<rect width="400" height="400" fill="url(#s)"/>${sun(330, 70, 28)}${cloud(30, 60, 0.9)}${cloud(250, 150, 0.7)}
     <path d="M0 330 L90 190 L150 270 L220 160 L300 280 L350 220 L400 290 V400 H0 Z" fill="#7b2cbf"/>
     <path d="M90 190 L110 222 L98 218 L88 230 L76 212 Z M220 160 L243 196 L230 192 L218 205 L205 186 Z" fill="#fff"/>
     <path d="M0 360 Q200 320 400 360 V400 H0 Z" fill="#52b788"/>${pine(40, 370, 0.6)}${pine(360, 372, 0.6)}${pine(330, 380, 0.5)}
     ${eagle(180, 120, 0.85)}`,
    sky('s', '#ffd6a5', '#cfefff')
  ),
  // Vinter med snømann
  svg(
    `<rect width="400" height="400" fill="url(#s)"/>${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 71) % 400}" cy="${(i * 37) % 260}" r="${(i % 3) + 2}" fill="#fff"/>`).join('')}
     <path d="M0 290 Q200 240 400 290 V400 H0 Z" fill="#fff"/>${pine(60, 290, 1)}${pine(340, 285, 0.9)}${pine(380, 300, 0.6)}
     <circle cx="200" cy="300" r="62" fill="#fff" stroke="#dee2e6" stroke-width="3"/><circle cx="200" cy="205" r="44" fill="#fff" stroke="#dee2e6" stroke-width="3"/>
     <circle cx="200" cy="270" r="6" fill="#343a40"/><circle cx="200" cy="295" r="6" fill="#343a40"/><circle cx="200" cy="320" r="6" fill="#343a40"/>
     <circle cx="185" cy="195" r="5" fill="#111"/><circle cx="215" cy="195" r="5" fill="#111"/><path d="M200 205 L238 212 L200 214 Z" fill="#ff9f1c"/>
     <path d="M168 238 Q200 252 232 238 L232 252 Q200 264 168 252 Z" fill="#e63946"/><path d="M220 248 L236 280 L222 280 Z" fill="#e63946"/>
     <rect x="170" y="150" width="60" height="12" rx="3" fill="#343a40"/><rect x="180" y="110" width="40" height="44" rx="4" fill="#343a40"/>
     <path d="M140 270 L100 240 M260 270 L300 235" stroke="#7f5539" stroke-width="6" stroke-linecap="round"/>`,
    sky('s', '#a0c4ff', '#e0fbfc')
  ),
  // Slott
  svg(
    `<rect width="400" height="400" fill="url(#s)"/>${cloud(40, 80, 0.9)}${cloud(280, 60, 0.8)}
     <path d="M0 330 Q200 300 400 330 V400 H0 Z" fill="#74c69d"/>
     <rect x="110" y="170" width="180" height="160" fill="#ffc8dd"/><rect x="70" y="130" width="60" height="200" fill="#ffafcc"/><rect x="270" y="130" width="60" height="200" fill="#ffafcc"/>
     <path d="M62 135 L100 70 L138 135 Z M262 135 L300 70 L338 135 Z" fill="#8338ec"/><path d="M160 175 L200 110 L240 175 Z" fill="#8338ec"/>
     <path d="M100 70 V40 M300 70 V40 M200 110 V80" stroke="#5b3a29" stroke-width="4"/><path d="M100 40 L125 48 L100 56 Z M300 40 L325 48 L300 56 Z M200 80 L225 88 L200 96 Z" fill="#ffd60a"/>
     <path d="M170 330 V270 Q200 240 230 270 V330 Z" fill="#7f5539"/>
     <rect x="88" y="170" width="24" height="34" rx="12" fill="#cfefff"/><rect x="288" y="170" width="24" height="34" rx="12" fill="#cfefff"/><rect x="188" y="195" width="24" height="30" rx="12" fill="#cfefff"/>
     ${flower(40, 345, '#ff70a6', 0.6)}${flower(360, 345, '#ffd166', 0.6)}`,
    sky('s', '#bde0fe', '#fff')
  ),
  // Blomsterhage med sommerfugl
  svg(
    `<rect width="400" height="400" fill="url(#s)"/>${sun(60, 60, 26)}
     <path d="M0 250 Q200 220 400 250 V400 H0 Z" fill="#95d5b2"/>
     ${flower(50, 260, '#ff70a6', 1.6)}${flower(140, 290, '#ffd166', 1.4)}${flower(240, 265, '#a0c4ff', 1.6)}${flower(340, 290, '#ff595e', 1.4)}${flower(100, 340, '#cdb4db', 1)}${flower(300, 345, '#ffadad', 1)}
     <g transform="translate(250 120) rotate(-12)"><ellipse cx="-22" cy="-14" rx="24" ry="30" fill="#ff9f1c"/><ellipse cx="22" cy="-14" rx="24" ry="30" fill="#ff9f1c"/>
       <ellipse cx="-18" cy="22" rx="16" ry="20" fill="#ffd60a"/><ellipse cx="18" cy="22" rx="16" ry="20" fill="#ffd60a"/><circle cx="-22" cy="-14" r="8" fill="#fff"/><circle cx="22" cy="-14" r="8" fill="#fff"/>
       <ellipse cx="0" cy="4" rx="7" ry="34" fill="#3d2618"/><path d="M-3 -28 Q-12 -46 -18 -48 M3 -28 Q12 -46 18 -48" stroke="#3d2618" stroke-width="3" fill="none"/></g>
     <g transform="translate(120 160) scale(.8)"><ellipse cx="0" cy="0" rx="18" ry="13" fill="#ffd60a"/><path d="M-6 -13 V13 M6 -13 V13" stroke="#3d2618" stroke-width="5"/><ellipse cx="-4" cy="-16" rx="10" ry="7" fill="#fff" opacity=".9"/><ellipse cx="8" cy="-16" rx="10" ry="7" fill="#fff" opacity=".9"/><circle cx="14" cy="-3" r="2.5" fill="#111"/></g>`,
    sky('s', '#cfefff', '#fdffe0')
  )
];
