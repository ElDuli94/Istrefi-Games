import type { Lang } from '../i18n';
import type { AnimalSound } from '../audio/animalSounds';

// Dyr i Dyrelyder-spillet: navn på hvert språk og bakgrunnsfarge.
// Albanske navn bør kvalitetssikres av en med albansk som morsmål.
export const FARM: { id: AnimalSound; emoji: string; bg: string; name: Record<Lang, string> }[] = [
  { id: 'dog', emoji: '🐶', bg: '#ffd6a5', name: { no: 'Hund', sq: 'Qen' } },
  { id: 'cat', emoji: '🐱', bg: '#fdffb6', name: { no: 'Katt', sq: 'Mace' } },
  { id: 'cow', emoji: '🐮', bg: '#caffbf', name: { no: 'Ku', sq: 'Lopë' } },
  { id: 'sheep', emoji: '🐑', bg: '#e0e0e0', name: { no: 'Sau', sq: 'Dele' } },
  { id: 'pig', emoji: '🐷', bg: '#ffc6ff', name: { no: 'Gris', sq: 'Derr' } },
  { id: 'duck', emoji: '🦆', bg: '#9bf6ff', name: { no: 'And', sq: 'Rosë' } },
  { id: 'chicken', emoji: '🐔', bg: '#ffadad', name: { no: 'Høne', sq: 'Pulë' } },
  { id: 'bird', emoji: '🐦', bg: '#a0c4ff', name: { no: 'Fugl', sq: 'Zog' } },
  { id: 'frog', emoji: '🐸', bg: '#b9fbc0', name: { no: 'Frosk', sq: 'Bretkosë' } },
  { id: 'lion', emoji: '🦁', bg: '#ffe066', name: { no: 'Løve', sq: 'Luan' } },
  { id: 'owl', emoji: '🦉', bg: '#d4a373', name: { no: 'Ugle', sq: 'Buf' } },
  { id: 'horse', emoji: '🐴', bg: '#e9c46a', name: { no: 'Hest', sq: 'Kalë' } },
  { id: 'elephant', emoji: '🐘', bg: '#cdb4db', name: { no: 'Elefant', sq: 'Elefant' } },
  { id: 'monkey', emoji: '🐵', bg: '#f4a261', name: { no: 'Ape', sq: 'Majmun' } }
];
