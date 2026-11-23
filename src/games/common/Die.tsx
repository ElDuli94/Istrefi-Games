// Terningside (1–6) som SVG – brukes i Ludo og Stigespillet.
const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 25], [72, 25], [28, 50], [72, 50], [28, 75], [72, 75]]
};
export function DieFace({ n }: { n: number }) {
  return (
    <svg viewBox="0 0 100 100" className="ludo-die__face">
      <rect x={4} y={4} width={92} height={92} rx={20} fill="#fff" />
      {PIPS[n].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={9} fill={n === 6 ? '#ef233c' : '#222'} />)}
    </svg>
  );
}
