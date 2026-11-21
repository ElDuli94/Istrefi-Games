// Butikken: ting man kan kjøpe til figuren sin med mynter fra spillene.
// Alt er emoji/farger, så det fungerer på alle språk uten tekst.
import type { DictKey } from '../i18n/no';

export type Slot = 'hat' | 'glasses' | 'pet' | 'bg' | 'frame' | 'effect';

export interface ShopItem {
  id: string;
  slot: Slot;
  price: number;
  emoji?: string; // for hatt, briller, kjæledyr, effekt
  css?: string; // for bakgrunn og ramme
}

export const SLOTS: { id: Slot; icon: string; nameKey: DictKey }[] = [
  { id: 'hat', icon: '🎩', nameKey: 'slotHat' },
  { id: 'glasses', icon: '🕶️', nameKey: 'slotGlasses' },
  { id: 'pet', icon: '🐣', nameKey: 'slotPet' },
  { id: 'bg', icon: '🎨', nameKey: 'slotBg' },
  { id: 'frame', icon: '🖼️', nameKey: 'slotFrame' },
  { id: 'effect', icon: '✨', nameKey: 'slotEffect' }
];

export const SHOP_ITEMS: ShopItem[] = [
  // Hatter
  { id: 'hat-bow', slot: 'hat', emoji: '🎀', price: 15 },
  { id: 'hat-flower', slot: 'hat', emoji: '🌼', price: 15 },
  { id: 'hat-cap', slot: 'hat', emoji: '🧢', price: 25 },
  { id: 'hat-sun', slot: 'hat', emoji: '👒', price: 35 },
  { id: 'hat-top', slot: 'hat', emoji: '🎩', price: 45 },
  { id: 'hat-grad', slot: 'hat', emoji: '🎓', price: 60 },
  { id: 'hat-crown', slot: 'hat', emoji: '👑', price: 150 },
  // Briller
  { id: 'gl-round', slot: 'glasses', emoji: '👓', price: 20 },
  { id: 'gl-sun', slot: 'glasses', emoji: '🕶️', price: 40 },
  { id: 'gl-goggles', slot: 'glasses', emoji: '🥽', price: 55 },
  // Kjæledyr
  { id: 'pet-chick', slot: 'pet', emoji: '🐣', price: 40 },
  { id: 'pet-fish', slot: 'pet', emoji: '🐠', price: 45 },
  { id: 'pet-butterfly', slot: 'pet', emoji: '🦋', price: 45 },
  { id: 'pet-dog', slot: 'pet', emoji: '🐶', price: 70 },
  { id: 'pet-cat', slot: 'pet', emoji: '🐱', price: 70 },
  { id: 'pet-unicorn', slot: 'pet', emoji: '🦄', price: 180 },
  { id: 'pet-dragon', slot: 'pet', emoji: '🐉', price: 220 },
  // Bakgrunner
  { id: 'bg-sunset', slot: 'bg', css: 'linear-gradient(160deg,#ffbe0b,#fb5607)', price: 30 },
  { id: 'bg-ocean', slot: 'bg', css: 'linear-gradient(160deg,#4cc9f0,#3a0ca3)', price: 30 },
  { id: 'bg-forest', slot: 'bg', css: 'linear-gradient(160deg,#b7e4c7,#2d6a4f)', price: 30 },
  { id: 'bg-candy', slot: 'bg', css: 'linear-gradient(160deg,#ffc8dd,#cdb4db)', price: 50 },
  { id: 'bg-space', slot: 'bg', css: 'radial-gradient(circle at 30% 30%,#7b2cbf,#10002b)', price: 80 },
  { id: 'bg-rainbow', slot: 'bg', css: 'conic-gradient(#ff595e,#ffca3a,#8ac926,#1982c4,#6a4c93,#ff595e)', price: 110 },
  // Rammer
  { id: 'fr-silver', slot: 'frame', css: '#ced4da', price: 50 },
  { id: 'fr-pink', slot: 'frame', css: '#ff70a6', price: 50 },
  { id: 'fr-gold', slot: 'frame', css: '#ffc300', price: 120 },
  { id: 'fr-rainbow', slot: 'frame', css: 'rainbow', price: 160 },
  // Effekter
  { id: 'fx-bubbles', slot: 'effect', emoji: '🫧', price: 70 },
  { id: 'fx-hearts', slot: 'effect', emoji: '💖', price: 90 },
  { id: 'fx-stars', slot: 'effect', emoji: '⭐', price: 90 },
  { id: 'fx-sparkles', slot: 'effect', emoji: '✨', price: 120 }
];

export const STICKER_PACK_PRICE = 25;

export const itemById = (id?: string) => SHOP_ITEMS.find((i) => i.id === id);

/** Mynter for et resultat: 5 per stjerne, +10 første gang et nivå klares. */
export function coinsFor(r: { won: boolean; stars: number; firstClear?: boolean; coins?: number }): number {
  if (typeof r.coins === 'number') return r.coins;
  if (!r.won) return r.stars > 0 ? 2 : 0;
  return r.stars * 5 + (r.firstClear ? 10 : 0);
}
