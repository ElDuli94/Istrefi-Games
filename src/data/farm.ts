import type { Lang } from '../i18n';
import type { AnimalSound } from '../audio/animalSounds';

// Dyr i Dyrelyder-spillet: navn og hva dyret "sier" på hvert språk.
// Albanske lydord bør kvalitetssikres av en med albansk som morsmål.
export const FARM: { id: AnimalSound; emoji: string; bg: string; name: Record<Lang, string>; says: Record<Lang, string> }[] = [
  { id: 'dog', emoji: '🐶', bg: '#ffd6a5', name: { no: 'Hund', sq: 'Qen' }, says: { no: 'Voff voff!', sq: 'Ham ham!' } },
  { id: 'cat', emoji: '🐱', bg: '#fdffb6', name: { no: 'Katt', sq: 'Mace' }, says: { no: 'Mjau!', sq: 'Mjau!' } },
  { id: 'cow', emoji: '🐮', bg: '#caffbf', name: { no: 'Ku', sq: 'Lopë' }, says: { no: 'Møøø!', sq: 'Muuu!' } },
  { id: 'sheep', emoji: '🐑', bg: '#e0e0e0', name: { no: 'Sau', sq: 'Dele' }, says: { no: 'Bæææ!', sq: 'Beee!' } },
  { id: 'pig', emoji: '🐷', bg: '#ffc6ff', name: { no: 'Gris', sq: 'Derr' }, says: { no: 'Nøff nøff!', sq: 'Hrum hrum!' } },
  { id: 'duck', emoji: '🦆', bg: '#9bf6ff', name: { no: 'And', sq: 'Rosë' }, says: { no: 'Kvakk kvakk!', sq: 'Kuak kuak!' } },
  { id: 'chicken', emoji: '🐔', bg: '#ffadad', name: { no: 'Høne', sq: 'Pulë' }, says: { no: 'Klukk klukk!', sq: 'Kot kot!' } },
  { id: 'bird', emoji: '🐦', bg: '#a0c4ff', name: { no: 'Fugl', sq: 'Zog' }, says: { no: 'Kvitter kvitter!', sq: 'Cicërr cicërr!' } },
  { id: 'frog', emoji: '🐸', bg: '#b9fbc0', name: { no: 'Frosk', sq: 'Bretkosë' }, says: { no: 'Kvekk kvekk!', sq: 'Kuak kuak!' } },
  { id: 'lion', emoji: '🦁', bg: '#ffe066', name: { no: 'Løve', sq: 'Luan' }, says: { no: 'Roaaar!', sq: 'Roaaar!' } },
  { id: 'owl', emoji: '🦉', bg: '#d4a373', name: { no: 'Ugle', sq: 'Buf' }, says: { no: 'Uhu uhu!', sq: 'Hu hu!' } },
  { id: 'horse', emoji: '🐴', bg: '#e9c46a', name: { no: 'Hest', sq: 'Kalë' }, says: { no: 'Ihahaha!', sq: 'Hihihi!' } },
  { id: 'elephant', emoji: '🐘', bg: '#cdb4db', name: { no: 'Elefant', sq: 'Elefant' }, says: { no: 'Tuuut!', sq: 'Tuuut!' } },
  { id: 'monkey', emoji: '🐵', bg: '#f4a261', name: { no: 'Ape', sq: 'Majmun' }, says: { no: 'U-u-a-a!', sq: 'U-u-a-a!' } }
];
