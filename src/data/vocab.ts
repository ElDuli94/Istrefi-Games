import type { Lang } from '../i18n';
import type { DictKey } from '../i18n/no';
import { ANIMALS } from './animals';
import { splitLetters } from './alphabets';

// Ord med bilde, i kategorier – brukes i «Hva heter det?» og «A som i ape».
// Albanske ord bør kvalitetssikres av en med albansk som morsmål.
export interface VocabItem { e: string; no: string; sq: string }
export interface VocabCat { id: string; icon: string; nameKey: DictKey; items: VocabItem[] }

const v = (e: string, no: string, sq: string): VocabItem => ({ e, no, sq });

export const VOCAB: VocabCat[] = [
  { id: 'animals', icon: '🐶', nameKey: 'cat_animals', items: ANIMALS.map((a) => v(a.emoji, a.name.no, a.name.sq)) },
  {
    id: 'food', icon: '🍎', nameKey: 'cat_food', items: [
      v('🍎', 'eple', 'mollë'), v('🍌', 'banan', 'banane'), v('🍓', 'jordbær', 'luleshtrydhe'), v('🍇', 'druer', 'rrush'),
      v('🍊', 'appelsin', 'portokall'), v('🍉', 'vannmelon', 'shalqi'), v('🍐', 'pære', 'dardhë'), v('🍒', 'kirsebær', 'qershi'),
      v('🥕', 'gulrot', 'karotë'), v('🍅', 'tomat', 'domate'), v('🥒', 'agurk', 'kastravec'), v('🌽', 'mais', 'misër'),
      v('🍞', 'brød', 'bukë'), v('🧀', 'ost', 'djathë'), v('🥚', 'egg', 'vezë'), v('🥛', 'melk', 'qumësht'),
      v('🍕', 'pizza', 'pica'), v('🍦', 'is', 'akullore'), v('🎂', 'kake', 'tortë'), v('🍪', 'kjeks', 'biskotë')
    ]
  },
  {
    id: 'vehicles', icon: '🚗', nameKey: 'cat_vehicles', items: [
      v('🚗', 'bil', 'makinë'), v('🚌', 'buss', 'autobus'), v('🚂', 'tog', 'tren'), v('✈️', 'fly', 'aeroplan'),
      v('🚁', 'helikopter', 'helikopter'), v('⛵', 'båt', 'varkë'), v('🚲', 'sykkel', 'biçikletë'), v('🚒', 'brannbil', 'zjarrfikëse'),
      v('🚑', 'ambulanse', 'ambulancë'), v('🚓', 'politibil', 'makinë policie'), v('🚜', 'traktor', 'traktor'), v('🚀', 'rakett', 'raketë'),
      v('🛴', 'sparkesykkel', 'patinë'), v('🏍️', 'motorsykkel', 'motoçikletë')
    ]
  },
  {
    id: 'body', icon: '👂', nameKey: 'cat_body', items: [
      v('👁️', 'øye', 'sy'), v('👂', 'øre', 'vesh'), v('👃', 'nese', 'hundë'), v('👄', 'munn', 'gojë'), v('🦷', 'tann', 'dhëmb'),
      v('👅', 'tunge', 'gjuhë'), v('✋', 'hånd', 'dorë'), v('🦶', 'fot', 'këmbë'), v('💪', 'arm', 'krah')
    ]
  },
  {
    id: 'clothes', icon: '👕', nameKey: 'cat_clothes', items: [
      v('👕', 'genser', 'bluzë'), v('👖', 'bukse', 'pantallona'), v('👗', 'kjole', 'fustan'), v('🧦', 'sokker', 'çorape'),
      v('👟', 'sko', 'këpucë'), v('🧢', 'caps', 'kapelë'), v('🧤', 'votter', 'doreza'), v('🧣', 'skjerf', 'shall'),
      v('🧥', 'jakke', 'xhaketë'), v('👓', 'briller', 'syze'), v('🎒', 'sekk', 'çantë')
    ]
  },
  {
    id: 'home', icon: '🏠', nameKey: 'cat_home', items: [
      v('🛏️', 'seng', 'shtrat'), v('🪑', 'stol', 'karrige'), v('🚪', 'dør', 'derë'), v('🪟', 'vindu', 'dritare'),
      v('💡', 'lampe', 'llambë'), v('🛁', 'badekar', 'vaskë'), v('🪥', 'tannbørste', 'furçë dhëmbësh'), v('📕', 'bok', 'libër'),
      v('⚽', 'ball', 'top'), v('🧸', 'bamse', 'arush'), v('⏰', 'klokke', 'orë'), v('☂️', 'paraply', 'çadër'),
      v('✏️', 'blyant', 'laps'), v('✂️', 'saks', 'gërshërë'), v('🔑', 'nøkkel', 'çelës'), v('📱', 'telefon', 'telefon')
    ]
  },
  {
    id: 'nature', icon: '🌈', nameKey: 'cat_nature', items: [
      v('☀️', 'sol', 'diell'), v('🌙', 'måne', 'hënë'), v('⭐', 'stjerne', 'yll'), v('☁️', 'sky', 're'), v('🌧️', 'regn', 'shi'),
      v('❄️', 'snø', 'borë'), v('🌈', 'regnbue', 'ylber'), v('🌳', 'tre', 'pemë'), v('🌸', 'blomst', 'lule'),
      v('🍄', 'sopp', 'kërpudhë'), v('🔥', 'ild', 'zjarr'), v('🌊', 'bølge', 'valë'), v('⛰️', 'fjell', 'mal')
    ]
  },
  {
    id: 'colors', icon: '🎨', nameKey: 'cat_colors', items: [
      v('🔴', 'rød', 'e kuqe'), v('🟠', 'oransje', 'portokalli'), v('🟡', 'gul', 'e verdhë'), v('🟢', 'grønn', 'jeshile'),
      v('🔵', 'blå', 'blu'), v('🟣', 'lilla', 'vjollcë'), v('🟤', 'brun', 'kafe'), v('⚫', 'svart', 'e zezë'), v('⚪', 'hvit', 'e bardhë')
    ]
  }
];

/** Første bokstav i et ord etter språkets alfabet (SH, LL osv. er én bokstav på albansk). */
export function firstLetter(word: string, lang: Lang): string {
  return splitLetters(word.replace(/[^\p{L}]/gu, ''), lang)[0] ?? '';
}

/** Et bilde-ord som starter på bokstaven («A som i ape»), eller null. Fargeord og flerords-navn hoppes over. */
export function wordForLetter(letter: string, lang: Lang): VocabItem | null {
  for (const c of VOCAB) {
    if (c.id === 'colors') continue;
    for (const it of c.items) {
      const w = it[lang];
      if (!w.includes(' ') && firstLetter(w, lang) === letter.toUpperCase()) return it;
    }
  }
  return null;
}
