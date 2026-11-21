import type { Lang } from '../i18n';

// Alfabet per språk. Albansk har 36 bokstaver, hvorav 9 er "doble" (DH, GJ, LL ...)
// – de regnes som én bokstav og får sin egen brikke.
export const ALPHABETS: Record<Lang, string[]> = {
  no: 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z Æ Ø Å'.split(' '),
  sq: 'A B C Ç D DH E Ë F G GJ H I J K L LL M N NJ O P Q R RR S SH T TH U V X XH Y Z ZH'.split(' ')
};

export const VOWELS: Record<Lang, Set<string>> = {
  no: new Set('A E I O U Y Æ Ø Å'.split(' ')),
  sq: new Set('A E Ë I O U Y'.split(' '))
};

/** Del et ord i bokstaver etter språkets alfabet (lengste treff først, så "SH" blir én bokstav). */
export function splitLetters(word: string, lang: Lang): string[] {
  const up = word.toUpperCase();
  const alpha = ALPHABETS[lang];
  const out: string[] = [];
  let i = 0;
  while (i < up.length) {
    const two = up.slice(i, i + 2);
    if (two.length === 2 && alpha.includes(two)) {
      out.push(two);
      i += 2;
    } else {
      out.push(up[i]);
      i += 1;
    }
  }
  return out;
}
