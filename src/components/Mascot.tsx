// Shqipo – Istrefi Games sin ørnemaskot (inspirert av ørnen i det albanske flagget).
interface Props {
  size?: number;
  mood?: 'happy' | 'cheer';
  className?: string;
}

export function Mascot({ size = 120, mood = 'happy', className = '' }: Props) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`mascot mascot--${mood} ${className}`}
      role="img"
      aria-label="Shqipo"
    >
      <g className="mascot__wing mascot__wing--l">
        <ellipse cx="46" cy="122" rx="22" ry="38" fill="#3d2618" transform="rotate(25 46 122)" />
      </g>
      <g className="mascot__wing mascot__wing--r">
        <ellipse cx="154" cy="122" rx="22" ry="38" fill="#3d2618" transform="rotate(-25 154 122)" />
      </g>
      <path d="M78 52 Q84 24 96 48 Q100 20 106 48 Q118 24 122 52 Z" fill="#3d2618" />
      <circle cx="100" cy="112" r="62" fill="#5b3a29" />
      <ellipse cx="100" cy="140" rx="38" ry="30" fill="#f4d8b0" />
      <g className="mascot__eyes">
        <circle cx="78" cy="96" r="17" fill="#fff" />
        <circle cx="122" cy="96" r="17" fill="#fff" />
        {mood === 'cheer' ? (
          <>
            <path d="M68 98 Q78 86 88 98" stroke="#111" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M112 98 Q122 86 132 98" stroke="#111" strokeWidth="6" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="81" cy="98" r="9" fill="#111" />
            <circle cx="119" cy="98" r="9" fill="#111" />
            <circle cx="84" cy="94" r="3.5" fill="#fff" />
            <circle cx="122" cy="94" r="3.5" fill="#fff" />
          </>
        )}
      </g>
      <circle cx="62" cy="118" r="8" fill="#ff8fab" opacity=".7" />
      <circle cx="138" cy="118" r="8" fill="#ff8fab" opacity=".7" />
      <path d="M86 112 Q100 102 114 112 Q108 132 100 136 Q92 132 86 112 Z" fill="#ffb703" />
      <path d="M58 154 Q100 172 142 154 L140 166 Q100 184 60 166 Z" fill="#e63946" />
      <ellipse cx="84" cy="178" rx="10" ry="6" fill="#ffb703" />
      <ellipse cx="116" cy="178" rx="10" ry="6" fill="#ffb703" />
    </svg>
  );
}

/** Maskot med snakkeboble. Trykk på Shqipo for å høre teksten igjen. */
export function MascotSays({ text, onTap, size = 90 }: { text: string; onTap?: () => void; size?: number }) {
  return (
    <button className="mascot-says" onClick={onTap} aria-label={text}>
      <Mascot size={size} />
      <span className="bubble">{text}</span>
    </button>
  );
}
