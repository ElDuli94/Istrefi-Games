// Shqipos eventyr – egne, originale korthistorier. Hver side har en bildescene (3D-emoji)
// og en til to korte setninger. Noen sider har to valg som styrer hva som skjer videre.
// Den albanske teksten bør kvalitetssikres av en med albansk som morsmål.
import type { Lang } from '../../i18n';

export type Anim = 'float' | 'bob' | 'fly' | 'spin' | 'shake' | 'pulse' | 'still';
export interface SceneItem { e: string; x: number; y: number; size: number; anim?: Anim }
export interface Choice { e: string; label: Record<Lang, string>; to: string }
export interface Page {
  id: string;
  bg: string;
  items: SceneItem[];
  text: Record<Lang, string>;
  next?: string;
  choices?: Choice[];
}
export interface Story { id: string; icon: string; title: Record<Lang, string>; pages: Page[] }

const i = (e: string, x: number, y: number, size = 5, anim: Anim = 'bob'): SceneItem => ({ e, x, y, size, anim });
const SKY = 'linear-gradient(180deg,#8ed8ff,#d9f3ff 70%,#b7e4a0 70%)';
const FOREST = 'linear-gradient(180deg,#b8f2c9,#74c69d 70%,#40916c 70%)';
const SEA = 'linear-gradient(180deg,#a0e7ff,#caf0f8 55%,#48cae4 55%)';
const KITCHEN = 'linear-gradient(180deg,#fff1e6,#ffe8d6 72%,#e3b78f 72%)';
const PARTY = 'linear-gradient(180deg,#ffc8dd,#ffafcc 72%,#cdb4db 72%)';
const SPACE = 'linear-gradient(180deg,#10002b,#3c096c)';
const NIGHT = 'linear-gradient(180deg,#240046,#5a189a 72%,#3c096c 72%)';

export const STORIES: Story[] = [
  {
    id: 'balloon',
    icon: '🎈',
    title: { no: 'Den bortkomne ballongen', sq: 'Tullumbacja e humbur' },
    pages: [
      {
        id: 'start', bg: SKY, next: 'sad',
        items: [i('🧸', 40, 62, 7), i('🎈', 72, 20, 5, 'fly'), i('☁️', 15, 15, 5, 'float'), i('🌳', 85, 60, 6, 'still')],
        text: {
          no: 'Lille Bjørn hadde en rød ballong. Plutselig blåste vinden, og ballongen fløy av gårde!',
          sq: 'Ariu i vogël kishte një tullumbace të kuqe. Papritur fryu era dhe tullumbacja fluturoi larg!'
        }
      },
      {
        id: 'sad', bg: SKY, next: 'choose',
        items: [i('🧸', 35, 62, 7, 'shake'), i('💧', 45, 48, 2, 'bob'), i('🦅', 70, 30, 6, 'fly')],
        text: {
          no: 'Lille Bjørn begynte å gråte. Da kom Shqipo flygende. Ikke vær lei deg, jeg skal hjelpe deg!',
          sq: 'Ariu i vogël filloi të qante. Atëherë erdhi Shqipo duke fluturuar. Mos u mërzit, do të të ndihmoj!'
        }
      },
      {
        id: 'choose', bg: SKY,
        items: [i('🦅', 50, 35, 7, 'fly'), i('🌲', 18, 62, 6, 'still'), i('🌊', 82, 66, 6, 'bob')],
        text: { no: 'Hvor skal Shqipo lete først?', sq: 'Ku duhet të kërkojë Shqipo së pari?' },
        choices: [
          { e: '🌲', label: { no: 'I skogen', sq: 'Në pyll' }, to: 'forest' },
          { e: '🌊', label: { no: 'Ved havet', sq: 'Te deti' }, to: 'sea' }
        ]
      },
      {
        id: 'forest', bg: FOREST, next: 'mountain',
        items: [i('🌳', 25, 45, 9, 'still'), i('🦉', 27, 33, 4, 'bob'), i('🐿️', 70, 66, 4, 'bob'), i('🦅', 72, 28, 5, 'fly')],
        text: {
          no: 'I skogen satt en ugle i et tre. Jeg så noe rødt fly forbi fjellet!',
          sq: 'Në pyll një buf rrinte në një pemë. Pashë diçka të kuqe që fluturoi pranë malit!'
        }
      },
      {
        id: 'mountain', bg: SKY, next: 'end',
        items: [i('⛰️', 50, 55, 12, 'still'), i('🎈', 52, 22, 4, 'shake'), i('🦅', 25, 25, 5, 'fly')],
        text: {
          no: 'Shqipo fløy høyt opp på fjellet. Der satt ballongen fast på en stein!',
          sq: 'Shqipo fluturoi lart në mal. Atje tullumbacja kishte ngecur te një gur!'
        }
      },
      {
        id: 'sea', bg: SEA, next: 'boat',
        items: [i('🐬', 30, 62, 6, 'spin'), i('⛵', 70, 52, 6, 'bob'), i('🦅', 50, 22, 5, 'fly')],
        text: {
          no: 'Ved havet hoppet en delfin opp av vannet. Ballongen fløy over båten min!',
          sq: 'Te deti një delfin kërceu nga uji. Tullumbacja fluturoi mbi varkën time!'
        }
      },
      {
        id: 'boat', bg: SEA, next: 'end',
        items: [i('⛵', 50, 52, 10, 'bob'), i('🎈', 56, 22, 4, 'shake'), i('🦅', 30, 25, 5, 'fly')],
        text: {
          no: 'Ballongen hadde satt seg fast i masta på båten. Shqipo tok den forsiktig med nebbet.',
          sq: 'Tullumbacja kishte ngecur te direku i varkës. Shqipo e kapi me kujdes me sqep.'
        }
      },
      {
        id: 'end', bg: SKY,
        items: [i('🧸', 35, 62, 7, 'bob'), i('🎈', 40, 25, 4, 'float'), i('🦅', 68, 45, 6, 'pulse'), i('💛', 52, 35, 3, 'pulse')],
        text: {
          no: 'Lille Bjørn ble så glad! Takk, Shqipo! Du er den beste vennen i hele verden.',
          sq: 'Ariu i vogël u gëzua shumë! Faleminderit, Shqipo! Ti je shoku më i mirë në gjithë botën.'
        }
      }
    ]
  },
  {
    id: 'cake',
    icon: '🎂',
    title: { no: 'Det store kakekalaset', sq: 'Festa e madhe e tortës' },
    pages: [
      {
        id: 'start', bg: KITCHEN, next: 'bake',
        items: [i('🦅', 35, 50, 7, 'bob'), i('🐰', 72, 55, 5, 'bob'), i('🎁', 80, 30, 3, 'pulse')],
        text: {
          no: 'I dag har Kanin bursdag. Shqipo vil bake en kake til henne.',
          sq: 'Sot është ditëlindja e Lepurushes. Shqipo do t’i pjekë një tortë.'
        }
      },
      {
        id: 'bake', bg: KITCHEN, next: 'choose',
        items: [i('🥚', 25, 40, 4, 'bob'), i('🥛', 45, 38, 4, 'bob'), i('🌾', 65, 40, 4, 'bob'), i('🥣', 47, 68, 7, 'shake')],
        text: {
          no: 'Shqipo henter egg, melk og mel. Så rører han alt sammen i en stor bolle.',
          sq: 'Shqipo merr vezë, qumësht dhe miell. Pastaj i përzien të gjitha në një tas të madh.'
        }
      },
      {
        id: 'choose', bg: KITCHEN,
        items: [i('🎂', 50, 55, 9, 'pulse'), i('🦅', 22, 40, 5, 'bob')],
        text: { no: 'Hva skal være oppå kaken?', sq: 'Çfarë do të vendosim mbi tortë?' },
        choices: [
          { e: '🍓', label: { no: 'Jordbær', sq: 'Luleshtrydhe' }, to: 'straw' },
          { e: '🍫', label: { no: 'Sjokolade', sq: 'Çokollatë' }, to: 'choco' }
        ]
      },
      {
        id: 'straw', bg: KITCHEN, next: 'party',
        items: [i('🎂', 50, 58, 9, 'still'), i('🍓', 40, 32, 3, 'bob'), i('🍓', 52, 28, 3, 'bob'), i('🍓', 64, 32, 3, 'bob')],
        text: {
          no: 'Shqipo legger røde, søte jordbær på kaken. Mmm, så fin den ble!',
          sq: 'Shqipo vendos luleshtrydhe të kuqe e të ëmbla mbi tortë. Mmm, sa e bukur doli!'
        }
      },
      {
        id: 'choco', bg: KITCHEN, next: 'party',
        items: [i('🎂', 50, 58, 9, 'still'), i('🍫', 50, 28, 4, 'shake')],
        text: {
          no: 'Shqipo heller deilig sjokolade over kaken. Mmm, så godt det lukter!',
          sq: 'Shqipo hedh çokollatë të shijshme mbi tortë. Mmm, sa erë të mirë ka!'
        }
      },
      {
        id: 'party', bg: PARTY, next: 'end',
        items: [i('🐰', 50, 50, 6, 'bob'), i('🐻', 22, 58, 5, 'bob'), i('🦊', 78, 58, 5, 'bob'), i('🎈', 15, 20, 4, 'float'), i('🎉', 85, 22, 4, 'spin')],
        text: {
          no: 'Alle vennene kommer på festen. De synger bursdagssangen for Kanin.',
          sq: 'Të gjithë shokët vijnë në festë. Ata i këndojnë këngën e ditëlindjes Lepurushes.'
        }
      },
      {
        id: 'end', bg: PARTY,
        items: [i('🐰', 35, 52, 6, 'pulse'), i('🎂', 62, 60, 6, 'still'), i('🦅', 75, 30, 5, 'fly')],
        text: {
          no: 'Dette er den beste kaken jeg har smakt! sier Kanin. Og så spiser alle kake sammen.',
          sq: 'Kjo është torta më e mirë që kam provuar! thotë Lepurushja. Dhe pastaj të gjithë hanë tortë bashkë.'
        }
      }
    ]
  },
  {
    id: 'moon',
    icon: '🚀',
    title: { no: 'Reisen til månen', sq: 'Udhëtimi në hënë' },
    pages: [
      {
        id: 'start', bg: SKY, next: 'build',
        items: [i('🦊', 30, 60, 6, 'bob'), i('📦', 55, 64, 6, 'still'), i('🦅', 75, 45, 6, 'bob')],
        text: {
          no: 'Shqipo og Rev fant en stor pappeske. La oss bygge en rakett! sa Rev.',
          sq: 'Shqipo dhe Dhelpra gjetën një kuti të madhe kartoni. Le të ndërtojmë një raketë! tha Dhelpra.'
        }
      },
      {
        id: 'build', bg: SKY, next: 'space',
        items: [i('🚀', 50, 50, 10, 'shake'), i('✨', 30, 30, 3, 'pulse'), i('✨', 70, 30, 3, 'pulse')],
        text: {
          no: 'De malte raketten rød og gul. Så telte de: tre, to, en … og så fløy de!',
          sq: 'E lyen raketën të kuqe dhe të verdhë. Pastaj numëruan: tre, dy, një … dhe fluturuan!'
        }
      },
      {
        id: 'space', bg: SPACE, next: 'choose',
        items: [i('🌍', 20, 70, 6, 'spin'), i('🚀', 50, 45, 6, 'fly'), i('🌙', 80, 22, 6, 'pulse'), i('⭐', 30, 20, 2, 'pulse'), i('⭐', 62, 15, 2, 'pulse')],
        text: {
          no: 'Raketten fløy forbi skyene og opp blant stjernene. Der framme var månen!',
          sq: 'Raketa fluturoi mbi retë dhe lart mes yjeve. Atje përpara ishte hëna!'
        }
      },
      {
        id: 'choose', bg: SPACE,
        items: [i('🌕', 50, 55, 10, 'still'), i('🦊', 38, 40, 4, 'bob'), i('🦅', 62, 38, 4, 'bob')],
        text: { no: 'Hva vil de gjøre på månen?', sq: 'Çfarë duan të bëjnë në hënë?' },
        choices: [
          { e: '⭐', label: { no: 'Telle stjerner', sq: 'Të numërojnë yjet' }, to: 'stars' },
          { e: '🐇', label: { no: 'Møte månekaninen', sq: 'Të takojnë lepurin e hënës' }, to: 'bunny' }
        ]
      },
      {
        id: 'stars', bg: SPACE, next: 'home',
        items: [i('⭐', 15, 30, 3, 'pulse'), i('⭐', 32, 20, 3, 'pulse'), i('⭐', 50, 32, 3, 'pulse'), i('⭐', 68, 18, 3, 'pulse'), i('🌟', 85, 28, 5, 'spin')],
        text: {
          no: 'De telte stjernene: en, to, tre, fire, fem! Den største stjernen blunket til dem.',
          sq: 'Ata numëruan yjet: një, dy, tre, katër, pesë! Ylli më i madh u shkeli syrin.'
        }
      },
      {
        id: 'bunny', bg: SPACE, next: 'home',
        items: [i('🌕', 50, 75, 14, 'still'), i('🐇', 50, 45, 6, 'bob'), i('🥕', 68, 40, 3, 'shake')],
        text: {
          no: 'På månen bodde en liten kanin. Den ga dem en sølvgulrot og vinket hadet.',
          sq: 'Në hënë jetonte një lepur i vogël. Ai u dha një karotë të argjendtë dhe u tha mirupafshim.'
        }
      },
      {
        id: 'home', bg: NIGHT,
        items: [i('🏠', 50, 58, 9, 'still'), i('🦊', 35, 72, 4, 'bob'), i('🦅', 65, 72, 4, 'bob'), i('💤', 40, 55, 3, 'float'), i('🌙', 82, 18, 5, 'pulse')],
        text: {
          no: 'Så fløy de hjem igjen. Rev gjespet stort. Det var den fineste reisen i hele verden.',
          sq: 'Pastaj fluturuan përsëri në shtëpi. Dhelpra ishte e përgjumur. Ishte udhëtimi më i bukur në gjithë botën.'
        }
      }
    ]
  }
];

/** Del side-teksten i setninger (samme regel som opplesingen). */
export const sentencesOf = (text: string) => text.split(/(?<=[.!?…])\s+/).filter(Boolean);
