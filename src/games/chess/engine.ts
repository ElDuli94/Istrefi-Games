/**
 * Liten sjakkmotor laget for Istrefi Games.
 * Brettet er 64 ruter: indeks 0 = a8 (øverst til venstre sett fra hvit), 63 = h1.
 * Full regelstøtte: rokade, en passant, forvandling, sjakk, matt, patt,
 * 50-trekksregelen, tre like stillinger og for lite materiell.
 */
export type Color = 'w' | 'b';
export type Kind = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';
export interface Piece { c: Color; k: Kind }
export interface State {
  b: (Piece | null)[];
  turn: Color;
  castle: { wK: boolean; wQ: boolean; bK: boolean; bQ: boolean };
  ep: number | null; // rute man kan slå en passant på
  half: number; // trekk siden sist bondetrekk/slag (50-trekksregelen)
  full: number;
}
export interface Move { from: number; to: number; promo?: Kind; castle?: 'K' | 'Q'; ep?: boolean; capture?: Kind }

export const rowOf = (sq: number) => sq >> 3;
export const colOf = (sq: number) => sq & 7;
const at = (r: number, c: number) => r * 8 + c;
const inside = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;
export const other = (c: Color): Color => (c === 'w' ? 'b' : 'w');
export const squareName = (sq: number) => 'abcdefgh'[colOf(sq)] + (8 - rowOf(sq));

export function initialState(): State {
  const b: (Piece | null)[] = Array(64).fill(null);
  const back: Kind[] = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
  back.forEach((k, c) => { b[at(0, c)] = { c: 'b', k }; b[at(7, c)] = { c: 'w', k }; b[at(1, c)] = { c: 'b', k: 'P' }; b[at(6, c)] = { c: 'w', k: 'P' }; });
  return { b, turn: 'w', castle: { wK: true, wQ: true, bK: true, bQ: true }, ep: null, half: 0, full: 1 };
}

/** Tomt brett med noen brikker (brukes i «Lær brikkene») */
export function customState(pieces: [number, Piece][], turn: Color = 'w'): State {
  const b: (Piece | null)[] = Array(64).fill(null);
  pieces.forEach(([sq, p]) => (b[sq] = p));
  return { b, turn, castle: { wK: false, wQ: false, bK: false, bQ: false }, ep: null, half: 0, full: 1 };
}

const KN = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const KG = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const ORTH = [[-1, 0], [1, 0], [0, -1], [0, 1]];

/** Er ruten angrepet av fargen «by»? */
export function attacked(b: (Piece | null)[], sq: number, by: Color): boolean {
  const r = rowOf(sq), c = colOf(sq);
  const is = (rr: number, cc: number, kinds: Kind[]) => {
    if (!inside(rr, cc)) return false;
    const p = b[at(rr, cc)];
    return !!p && p.c === by && kinds.includes(p.k);
  };
  // Bønder: hvite bønder angriper oppover (lavere rad)
  const pr = by === 'w' ? r + 1 : r - 1;
  if (is(pr, c - 1, ['P']) || is(pr, c + 1, ['P'])) return true;
  for (const [dr, dc] of KN) if (is(r + dr, c + dc, ['N'])) return true;
  for (const [dr, dc] of KG) if (is(r + dr, c + dc, ['K'])) return true;
  const slide = (dirs: number[][], kinds: Kind[]) => {
    for (const [dr, dc] of dirs) {
      let rr = r + dr, cc = c + dc;
      while (inside(rr, cc)) {
        const p = b[at(rr, cc)];
        if (p) { if (p.c === by && kinds.includes(p.k)) return true; break; }
        rr += dr; cc += dc;
      }
    }
    return false;
  };
  return slide(DIAG, ['B', 'Q']) || slide(ORTH, ['R', 'Q']);
}

export function kingSquare(s: State, c: Color) {
  return s.b.findIndex((p) => p?.c === c && p.k === 'K');
}
export function inCheck(s: State, c: Color) {
  const k = kingSquare(s, c);
  return k >= 0 && attacked(s.b, k, other(c));
}

/** Alle trekk uten å sjekke om egen konge står i sjakk etterpå */
function pseudoMoves(s: State, onlyFrom?: number): Move[] {
  const out: Move[] = [];
  const me = s.turn, b = s.b;
  for (let sq = 0; sq < 64; sq++) {
    if (onlyFrom !== undefined && sq !== onlyFrom) continue;
    const p = b[sq];
    if (!p || p.c !== me) continue;
    const r = rowOf(sq), c = colOf(sq);
    const add = (to: number, extra: Partial<Move> = {}) => {
      const t = b[to];
      out.push({ from: sq, to, capture: t?.k, ...extra });
    };
    if (p.k === 'P') {
      const dir = me === 'w' ? -1 : 1, startRow = me === 'w' ? 6 : 1, lastRow = me === 'w' ? 0 : 7;
      const pushP = (to: number, extra: Partial<Move> = {}) => {
        if (rowOf(to) === lastRow) (['Q', 'R', 'B', 'N'] as Kind[]).forEach((k) => add(to, { ...extra, promo: k }));
        else add(to, extra);
      };
      if (inside(r + dir, c) && !b[at(r + dir, c)]) {
        pushP(at(r + dir, c));
        if (r === startRow && !b[at(r + 2 * dir, c)]) add(at(r + 2 * dir, c));
      }
      for (const dc of [-1, 1]) {
        if (!inside(r + dir, c + dc)) continue;
        const to = at(r + dir, c + dc), t = b[to];
        if (t && t.c !== me) pushP(to);
        else if (to === s.ep) out.push({ from: sq, to, ep: true, capture: 'P' });
      }
    } else if (p.k === 'N' || p.k === 'K') {
      for (const [dr, dc] of p.k === 'N' ? KN : KG) {
        if (!inside(r + dr, c + dc)) continue;
        const to = at(r + dr, c + dc), t = b[to];
        if (!t || t.c !== me) add(to);
      }
      if (p.k === 'K') {
        const row = me === 'w' ? 7 : 0;
        const rights = s.castle;
        const canK = me === 'w' ? rights.wK : rights.bK, canQ = me === 'w' ? rights.wQ : rights.bQ;
        if (sq === at(row, 4) && (canK || canQ) && !attacked(b, sq, other(me))) {
          if (canK && !b[at(row, 5)] && !b[at(row, 6)] && b[at(row, 7)]?.k === 'R' && !attacked(b, at(row, 5), other(me)) && !attacked(b, at(row, 6), other(me)))
            out.push({ from: sq, to: at(row, 6), castle: 'K' });
          if (canQ && !b[at(row, 3)] && !b[at(row, 2)] && !b[at(row, 1)] && b[at(row, 0)]?.k === 'R' && !attacked(b, at(row, 3), other(me)) && !attacked(b, at(row, 2), other(me)))
            out.push({ from: sq, to: at(row, 2), castle: 'Q' });
        }
      }
    } else {
      const dirs = p.k === 'B' ? DIAG : p.k === 'R' ? ORTH : [...DIAG, ...ORTH];
      for (const [dr, dc] of dirs) {
        let rr = r + dr, cc = c + dc;
        while (inside(rr, cc)) {
          const to = at(rr, cc), t = b[to];
          if (t) { if (t.c !== me) add(to); break; }
          add(to);
          rr += dr; cc += dc;
        }
      }
    }
  }
  return out;
}

export function makeMove(s: State, m: Move): State {
  const b = s.b.slice();
  const p = b[m.from]!;
  const me = s.turn;
  b[m.to] = m.promo ? { c: me, k: m.promo } : p;
  b[m.from] = null;
  if (m.ep) b[at(rowOf(m.from), colOf(m.to))] = null;
  if (m.castle) {
    const row = rowOf(m.from);
    if (m.castle === 'K') { b[at(row, 5)] = b[at(row, 7)]; b[at(row, 7)] = null; }
    else { b[at(row, 3)] = b[at(row, 0)]; b[at(row, 0)] = null; }
  }
  const castle = { ...s.castle };
  if (p.k === 'K') { if (me === 'w') { castle.wK = false; castle.wQ = false; } else { castle.bK = false; castle.bQ = false; } }
  for (const sq of [m.from, m.to]) {
    if (sq === 63) castle.wK = false;
    if (sq === 56) castle.wQ = false;
    if (sq === 7) castle.bK = false;
    if (sq === 0) castle.bQ = false;
  }
  const ep = p.k === 'P' && Math.abs(rowOf(m.to) - rowOf(m.from)) === 2 ? (m.from + m.to) / 2 : null;
  return {
    b, turn: other(me), castle, ep,
    half: p.k === 'P' || m.capture ? 0 : s.half + 1,
    full: me === 'b' ? s.full + 1 : s.full
  };
}

/** Lovlige trekk (egen konge kan ikke stå i sjakk etterpå) */
export function legalMoves(s: State, onlyFrom?: number): Move[] {
  return pseudoMoves(s, onlyFrom).filter((m) => !inCheck(makeMove(s, m), s.turn));
}

/** Nøkkel for stillingen (brukes for tre like stillinger) */
export function positionKey(s: State): string {
  let k = '';
  for (const p of s.b) k += p ? (p.c === 'w' ? p.k : p.k.toLowerCase()) : '.';
  const c = s.castle;
  return `${k}${s.turn}${c.wK ? 'K' : ''}${c.wQ ? 'Q' : ''}${c.bK ? 'k' : ''}${c.bQ ? 'q' : ''}${s.ep ?? '-'}`;
}

export type Outcome = { kind: 'mate'; winner: Color } | { kind: 'stalemate' | 'fifty' | 'repetition' | 'material' } | null;

function insufficient(s: State) {
  const rest = s.b.filter((p) => p && p.k !== 'K') as Piece[];
  if (rest.length === 0) return true;
  if (rest.length === 1 && (rest[0].k === 'B' || rest[0].k === 'N')) return true;
  return false;
}

/** Er spillet over? history = nøkler for tidligere stillinger (inkl. den nåværende) */
export function outcome(s: State, history: string[] = []): Outcome {
  if (!legalMoves(s).length) return inCheck(s, s.turn) ? { kind: 'mate', winner: other(s.turn) } : { kind: 'stalemate' };
  if (s.half >= 100) return { kind: 'fifty' };
  if (insufficient(s)) return { kind: 'material' };
  const key = positionKey(s);
  if (history.filter((h) => h === key).length >= 3) return { kind: 'repetition' };
  return null;
}

// ---------------------------------------------------------------------------
// Robotmotstander: alfa-beta-søk med enkel stillingsvurdering
// ---------------------------------------------------------------------------
export const VALUE: Record<Kind, number> = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 0 };
// Plasseringstabeller sett fra hvit (rad 0 = 8. rad). Svart speiles.
const PST: Record<Kind, number[]> = {
  P: [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
  N: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
  B: [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
  R: [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
  Q: [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
  K: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20]
};

/** Vurdering sett fra den som skal trekke (positiv = bra for den) */
export function evaluate(s: State): number {
  let score = 0;
  for (let sq = 0; sq < 64; sq++) {
    const p = s.b[sq];
    if (!p) continue;
    const idx = p.c === 'w' ? sq : (7 - rowOf(sq)) * 8 + colOf(sq);
    const v = VALUE[p.k] + PST[p.k][idx];
    score += p.c === 'w' ? v : -v;
  }
  return s.turn === 'w' ? score : -score;
}

const MATE = 100000;
function order(moves: Move[], s: State) {
  const score = (m: Move) => (m.capture ? 10 * VALUE[m.capture] - VALUE[s.b[m.from]!.k] / 10 : 0) + (m.promo ? VALUE[m.promo] : 0);
  return moves.sort((a, b) => score(b) - score(a));
}

function quiesce(s: State, alpha: number, beta: number, depth: number): number {
  const stand = evaluate(s);
  if (stand >= beta) return beta;
  if (alpha < stand) alpha = stand;
  if (depth <= 0) return alpha;
  for (const m of order(legalMoves(s).filter((x) => x.capture || x.promo), s)) {
    const v = -quiesce(makeMove(s, m), -beta, -alpha, depth - 1);
    if (v >= beta) return beta;
    if (v > alpha) alpha = v;
  }
  return alpha;
}

function search(s: State, depth: number, alpha: number, beta: number, ply: number, q: boolean): number {
  const moves = legalMoves(s);
  if (!moves.length) return inCheck(s, s.turn) ? -MATE + ply : 0;
  if (s.half >= 100) return 0;
  if (depth <= 0) return q ? quiesce(s, alpha, beta, 4) : evaluate(s);
  for (const m of order(moves, s)) {
    const v = -search(makeMove(s, m), depth - 1, -beta, -alpha, ply + 1, q);
    if (v >= beta) return beta;
    if (v > alpha) alpha = v;
  }
  return alpha;
}

/**
 * Robotens trekk. Nivå 1–5:
 * 1 Nybegynner: tilfeldige trekk (slår gjerne brikker).
 * 2 Lett: ser ett trekk fram, med mye tilfeldighet.
 * 3 Middels: to trekk fram.  4 Vanskelig: tre trekk fram.  5 Mester: fire trekk + ser alle slag til slutt.
 */
export function bestMove(s: State, level: number): Move | null {
  const moves = legalMoves(s);
  if (!moves.length) return null;
  if (level <= 1) {
    const caps = moves.filter((m) => m.capture);
    const pool = caps.length && Math.random() < 0.5 ? caps : moves;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  const depth = level === 2 ? 1 : level === 3 ? 2 : level === 4 ? 3 : 4;
  const noise = level === 2 ? 120 : level === 3 ? 30 : level === 4 ? 8 : 0;
  const q = level >= 5;
  let best: Move = moves[0], bestV = -Infinity;
  for (const m of order(moves, s)) {
    // Uten tilfeldighet kan vi bruke beste verdi så langt som grense (raskere)
    const lo = noise ? -MATE - 1 : Math.max(-MATE - 1, bestV);
    const v = -search(makeMove(s, m), depth - 1, -MATE - 1, -lo, 1, q) + (noise ? (Math.random() - 0.5) * noise : 0);
    if (v > bestV) { bestV = v; best = m; }
  }
  return best;
}
