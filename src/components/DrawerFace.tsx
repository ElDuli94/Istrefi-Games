/**
 * Front på en skuff i spillskapet: lyst tre med årer, utskåret grep i toppen
 * og et søtt dyrefjes (egen tegning). Seks ulike fjes – ett per skuff.
 */
export type FaceKind = 'dots' | 'happy' | 'wink' | 'lashes' | 'big' | 'sleepy';

/** Bland en farge med hvitt (0–1) – gir lysere toppfarge til skuffen */
function lighten(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.round(v + (255 - v) * f).toString(16).padStart(2, '0');
  return `#${ch(n >> 16)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}

export function DrawerFace({ face, dark = false, color, blush = '#ff8fab' }: { face: FaceKind; dark?: boolean; color?: string; blush?: string }) {
  const wood = color ? [lighten(color, 0.35), color] : dark ? ['#c9a68a', '#bb967a'] : ['#f1d9b5', '#e7c99f'];
  const line = '#3b2a20';
  const eye = (x: number) => {
    switch (face) {
      case 'dots': return <><ellipse cx={x} cy={52} rx={3.4} ry={4.2} fill={line} /><circle cx={x + 1.2} cy={50.5} r={1.1} fill="#fff" /></>;
      case 'happy': return <path d={`M${x - 6} 53 Q${x} 46 ${x + 6} 53`} stroke={line} strokeWidth={2.6} fill="none" strokeLinecap="round" />;
      case 'wink': return x < 50
        ? <path d={`M${x - 6} 52 Q${x} 56 ${x + 6} 52`} stroke={line} strokeWidth={2.6} fill="none" strokeLinecap="round" />
        : <><ellipse cx={x} cy={52} rx={3.4} ry={4.2} fill={line} /><circle cx={x + 1.2} cy={50.5} r={1.1} fill="#fff" /></>;
      case 'lashes': return <><path d={`M${x - 6} 52 Q${x} 57 ${x + 6} 52`} stroke={line} strokeWidth={2.4} fill="none" strokeLinecap="round" />{[-4, 0, 4].map((d) => <line key={d} x1={x + d} y1={53.5 + Math.abs(d) * 0.1} x2={x + d * 1.4} y2={58.5} stroke={line} strokeWidth={1.6} strokeLinecap="round" />)}</>;
      case 'big': return <><circle cx={x} cy={52} r={6} fill="#fff" stroke={line} strokeWidth={1.6} /><circle cx={x + 1} cy={53} r={3.4} fill={line} /><circle cx={x + 2.2} cy={51.4} r={1.2} fill="#fff" /></>;
      case 'sleepy': return <path d={`M${x - 6} 52 L${x + 6} 52`} stroke={line} strokeWidth={2.6} strokeLinecap="round" />;
    }
  };
  return (
    <svg viewBox="0 0 100 100" className="dface" aria-hidden preserveAspectRatio="none">
      <defs>
        <linearGradient id={`w-${face}-${dark}-${color ?? ""}`} x1="0" x2="0.4" y1="0" y2="1">
          <stop offset="0" stopColor={wood[0]} /><stop offset="1" stopColor={wood[1]} />
        </linearGradient>
      </defs>
      <rect x={1} y={1} width={98} height={98} rx={7} fill={`url(#w-${face}-${dark}-${color ?? ""})`} />
      {color && <rect x={6} y={26} width={88} height={6} rx={3} fill="rgba(255,255,255,.35)" />}
      {/* Treårer */}
      {[18, 34, 63, 79, 90].map((y, i) => (
        <path key={y} d={`M4 ${y} C30 ${y - 3 + i} 60 ${y + 3} 96 ${y - 1}`} stroke={color ? "rgba(255,255,255,.22)" : "rgba(120,80,40,.13)"} strokeWidth={1.2} fill="none" />
      ))}
      {/* Utskåret grep i toppen */}
      <path d="M30 1 Q30 22 50 22 Q70 22 70 1 Z" fill="#4a3426" />
      <path d="M33 1 Q33 18 50 18 Q67 18 67 1" fill="none" stroke="rgba(0,0,0,.25)" strokeWidth={2} />
      {/* Fjes */}
      {eye(36)}{eye(64)}
      <ellipse cx={26} cy={63} rx={6} ry={3.6} fill={blush} opacity={0.85} />
      <ellipse cx={74} cy={63} rx={6} ry={3.6} fill={blush} opacity={0.85} />
      {(face === 'wink' || face === 'lashes') && [[22, 58], [27, 61], [73, 61], [78, 58]].map(([x, y]) => <circle key={x} cx={x} cy={y} r={0.9} fill={line} />)}
      <path d="M45 60 Q50 57 55 60 Q53 65 50 65.5 Q47 65 45 60 Z" fill={line} />
      <path d="M50 65.5 L50 69 M50 69 Q46 73 42 70 M50 69 Q54 73 58 70" stroke={line} strokeWidth={2} fill="none" strokeLinecap="round" />
      {face === 'sleepy' && <path d="M48 71 Q50 76 52 71" fill="#ff8fab" />}
    </svg>
  );
}
