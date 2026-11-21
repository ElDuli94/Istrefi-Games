import type { Lang } from '../../i18n';

// Tradisjonelle melodier som er fri for opphavsrett (kun melodi, ingen sangtekst).
// Noter: C D E F G A H c (c = høy C). Tallet etter en note er lengden i slag (standard 1).
export interface Song { id: string; icon: string; title: Record<Lang, string>; notes: string; level: 1 | 2 | 3 }

export const SONGS: Song[] = [
  { id: 'lamb', icon: '🐑', level: 1, title: { no: 'Det lille lammet', sq: 'Qengji i vogël' },
    notes: 'E D C D E E E2 D D D2 E G G2 E D C D E E E E D D E D C4' },
  { id: 'twinkle', icon: '⭐', level: 1, title: { no: 'Blinke, blinke, lille stjerne', sq: 'Ylli i vogël' },
    notes: 'C C G G A A G2 F F E E D D C2 G G F F E E D2 G G F F E E D2 C C G G A A G2 F F E E D D C2' },
  { id: 'row', icon: '🚣', level: 2, title: { no: 'Ro, ro, ro din båt', sq: 'Voziti barkën' },
    notes: 'C2 C2 C D E2 E D E F G4 c c c G G G E E E C C C G F E D C4' },
  { id: 'ode', icon: '🎻', level: 2, title: { no: 'Ode til gleden', sq: 'Oda e gëzimit' },
    notes: 'E E F G G F E D C C D E E3 D D2 E E F G G F E D C C D E D3 C C2' },
  { id: 'lisa', icon: '🎒', level: 2, title: { no: 'Lisa gikk til skolen', sq: 'Liza shkon në shkollë' },
    notes: 'G E E2 F D D2 C D E F G G G2 G E E2 F D D2 C E G G C4 D D D D D E F2 E E E E E F G2 G E E2 F D D2 C E G G C4' },
  { id: 'bus', icon: '🚌', level: 3, title: { no: 'Hjulene på bussen', sq: 'Rrotat e autobusit' },
    notes: 'C F F F F A c A F2 G E C2 c A F2 C F F F F A c A F2 G2 C2 F4' },
  { id: 'jingle', icon: '🔔', level: 3, title: { no: 'Bjelleklang', sq: 'Zilet e Krishtlindjes' },
    notes: 'E E E2 E E E2 E G C D E4 F F F F F E E E E D D E D2 G2 E E E2 E E E2 E G C D E4 F F F F F E E E G G F D C4' }
];

const INDEX: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, H: 6, c: 7 };

/** "C C G2" -> [{key:0,beats:1},{key:0,beats:1},{key:4,beats:2}] */
export function parseSong(s: string) {
  return s.trim().split(/\s+/).map((tok) => ({ key: INDEX[tok[0]], beats: tok.length > 1 ? Number(tok.slice(1)) : 1 }));
}
