import type { Lang } from '../i18n';

// Dyr med navn på hvert språk – brukes i memory og til opplesing.
export const ANIMALS: { emoji: string; name: Record<Lang, string> }[] = [
  { emoji: '🐶', name: { no: 'hund', sq: 'qen' } },
  { emoji: '🐱', name: { no: 'katt', sq: 'mace' } },
  { emoji: '🐮', name: { no: 'ku', sq: 'lopë' } },
  { emoji: '🐷', name: { no: 'gris', sq: 'derr' } },
  { emoji: '🐸', name: { no: 'frosk', sq: 'bretkosë' } },
  { emoji: '🐵', name: { no: 'ape', sq: 'majmun' } },
  { emoji: '🐔', name: { no: 'høne', sq: 'pulë' } },
  { emoji: '🦁', name: { no: 'løve', sq: 'luan' } },
  { emoji: '🐘', name: { no: 'elefant', sq: 'elefant' } },
  { emoji: '🐴', name: { no: 'hest', sq: 'kalë' } },
  { emoji: '🐑', name: { no: 'sau', sq: 'dele' } },
  { emoji: '🐰', name: { no: 'kanin', sq: 'lepur' } },
  { emoji: '🐻', name: { no: 'bjørn', sq: 'ari' } },
  { emoji: '🦊', name: { no: 'rev', sq: 'dhelpër' } },
  { emoji: '🐧', name: { no: 'pingvin', sq: 'pinguin' } },
  { emoji: '🦒', name: { no: 'sjiraff', sq: 'gjirafë' } },
  { emoji: '🐢', name: { no: 'skilpadde', sq: 'breshkë' } },
  { emoji: '🐙', name: { no: 'blekksprut', sq: 'oktapod' } },
  { emoji: '🦓', name: { no: 'sebra', sq: 'zebër' } },
  { emoji: '🦉', name: { no: 'ugle', sq: 'buf' } }
];
