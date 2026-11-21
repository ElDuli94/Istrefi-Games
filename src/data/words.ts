import type { Lang } from '../i18n';

// Barnevennlige ord til Ordgåten. 4 bokstaver for 8–11 år, 5 for 12–15 år.
// Albanske ord telles i albanske bokstaver (SH, LL, RR osv. er én bokstav).
// Albansk liste bør kvalitetssikres av en med albansk som morsmål.
export const WORDS: Record<Lang, { 4: string[]; 5: string[] }> = {
  no: {
    4: ['HUND', 'KATT', 'FISK', 'HEST', 'GRIS', 'OKSE', 'KAKE', 'EPLE', 'BUSS', 'SKOG', 'FOSS', 'REGN', 'VIND', 'NATT', 'VENN',
      'SANG', 'DANS', 'BARN', 'BABY', 'GUTT', 'BROR', 'BRØD', 'MELK', 'TACO', 'PÆRE', 'SAFT', 'VANN', 'ROSE', 'GRAN', 'FURU',
      'SAND', 'LØVE', 'HVAL', 'LAKS', 'UGLE', 'MÅKE', 'MAUR', 'FLUE', 'GLAD', 'SMIL', 'DRØM', 'HØST', 'STOL', 'SOFA', 'SENG',
      'GULV', 'HAGE', 'GATE', 'LAND', 'JORD', 'DATA', 'KORT', 'MALE', 'LØPE', 'SOVE', 'LESE', 'BALL', 'BORD', 'LEKE', 'VOTT'],
    5: ['BJØRN', 'TIGER', 'SEBRA', 'PANDA', 'KOALA', 'KANIN', 'FROSK', 'SVANE', 'KRÅKE', 'HYTTE', 'FJELL', 'PAPIR', 'SKOLE', 'LÆRER',
      'JENTE', 'MAMMA', 'PAPPA', 'ONKEL', 'TANTE', 'JAKKE', 'BUKSE', 'SUPPE', 'PIZZA', 'BANAN', 'DRUER', 'MELON', 'BOLLE', 'JUICE',
      'GRESS', 'LILJE', 'BJØRK', 'STEIN', 'FARGE', 'LYKKE', 'PRINS', 'TROLL', 'NISSE', 'PÅSKE', 'FERIE', 'LAMPE', 'VINDU', 'TRAPP',
      'MÅNEN', 'SOLEN', 'ROBOT', 'SPILL', 'DUKKE', 'BAMSE', 'KLOSS', 'TEGNE', 'SYNGE', 'HOPPE', 'SPISE', 'BÅTEN', 'TOGET', 'SKUFF']
  },
  sq: {
    4: ['LULE', 'DORË', 'KOKË', 'MACE', 'BUKË', 'MOLLË', 'DELE', 'DIELL', 'HËNË', 'DETI', 'KALË', 'QENI', 'ARIU', 'PESHK', 'LOPË',
      'NËNË', 'BABI', 'VËLLA', 'VERË', 'BORË', 'PEMË', 'RRUGË', 'LOJË', 'FSHAT', 'DITË', 'NATË', 'JAVË', 'SHOKU', 'VEZË', 'SUPË',
      'AKULL', 'ZJARR', 'RËRË', 'LUGË', 'GOTË', 'DERË', 'LAPS', 'TOPI', 'LUMI'],
    5: ['SHTËPI', 'LIBËR', 'SHKOLLË', 'VAJZË', 'DJALË', 'MOTËR', 'LODËR', 'DIMËR', 'QIELLI', 'ZEMËR', 'KOPSHT', 'DRITË', 'NGJYRË',
      'KËNGË', 'ÇANTË', 'QYTET', 'DREKË', 'DARKË', 'BLETË', 'DARDHË', 'DJATHË', 'PIRUN', 'SHTRAT', 'LETËR', 'FLETË']
  }
};
