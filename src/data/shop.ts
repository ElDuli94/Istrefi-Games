// Butikken: ting man kan kjøpe til figuren sin med mynter fra spillene.
// Alt er emoji/farger, så det fungerer på alle språk uten tekst.
import type { DictKey } from '../i18n/no';

export type Slot = 'hat' | 'glasses' | 'held' | 'pet' | 'skin' | 'bg' | 'frame' | 'effect';

export interface ShopItem {
  id: string;
  slot: Slot;
  price: number;
  emoji?: string; // for hatt, briller, leker, kjæledyr, spesialdyr, effekt
  css?: string; // for bakgrunn og ramme
}

export const SLOTS: { id: Slot; icon: string; nameKey: DictKey }[] = [
  { id: 'hat', icon: '🎩', nameKey: 'slotHat' },
  { id: 'glasses', icon: '🕶️', nameKey: 'slotGlasses' },
  { id: 'held', icon: '🎈', nameKey: 'slotHeld' },
  { id: 'pet', icon: '🐣', nameKey: 'slotPet' },
  { id: 'skin', icon: '🦄', nameKey: 'slotSkin' },
  { id: 'bg', icon: '🎨', nameKey: 'slotBg' },
  { id: 'frame', icon: '🖼️', nameKey: 'slotFrame' },
  { id: 'effect', icon: '✨', nameKey: 'slotEffect' }
];

// Hjelpere for å skrive listen kort: [id, emoji/css, pris]
const E = (slot: Slot, list: [string, string, number][]): ShopItem[] => list.map(([id, emoji, price]) => ({ id, slot, emoji, price }));
const C = (slot: Slot, list: [string, string, number][]): ShopItem[] => list.map(([id, css, price]) => ({ id, slot, css, price }));

export const SHOP_ITEMS: ShopItem[] = [
  ...E('hat', [
    ['hat-bow', '🎀', 15], ['hat-flower', '🌼', 15], ['hat-blossom', '🌸', 20], ['hat-sunflower', '🌻', 20],
    ['hat-cap', '🧢', 25], ['hat-strawberry', '🍓', 30], ['hat-sun', '👒', 35], ['hat-mushroom', '🍄', 40],
    ['hat-top', '🎩', 45], ['hat-cactus', '🌵', 45], ['hat-cupcake', '🧁', 50], ['hat-pineapple', '🍍', 55],
    ['hat-grad', '🎓', 60], ['hat-pumpkin', '🎃', 70], ['hat-frog', '🐸', 80], ['hat-star', '⭐', 95],
    ['hat-cake', '🎂', 110], ['hat-moon', '🌙', 120], ['hat-crown', '👑', 150], ['hat-rainbow', '🌈', 200],
    ['hat-glowstar', '🌟', 300], ['hat-gem', '💎', 500], ['hat-planet', '🪐', 800], ['hat-trophy', '🏆', 1200]
  ]),
  ...E('glasses', [
    ['gl-round', '👓', 20], ['gl-sun', '🕶️', 40], ['gl-goggles', '🥽', 55], ['gl-dive', '🤿', 90],
    ['gl-mask', '🎭', 180], ['gl-hearts', '💕', 260], ['gl-stars', '✨', 400]
  ]),
  ...E('held', [
    ['held-balloon', '🎈', 20], ['held-icecream', '🍦', 25], ['held-lollipop', '🍭', 25], ['held-ball', '⚽', 30],
    ['held-basket', '🏀', 30], ['held-books', '📚', 35], ['held-pizza', '🍕', 35], ['held-paint', '🎨', 40],
    ['held-torch', '🔦', 40], ['held-flowers', '💐', 45], ['held-teddy', '🧸', 50], ['held-kite', '🪁', 60],
    ['held-guitar', '🎸', 80], ['held-skate', '🛹', 90], ['held-game', '🎮', 110], ['held-wand', '🪄', 140],
    ['held-scope', '🔭', 180], ['held-rocket', '🚀', 280], ['held-trophy', '🏆', 450], ['held-crystal', '🔮', 700]
  ]),
  ...E('pet', [
    ['pet-ladybug', '🐞', 35], ['pet-chick', '🐣', 40], ['pet-bee', '🐝', 45], ['pet-fish', '🐠', 45],
    ['pet-butterfly', '🦋', 45], ['pet-turtle', '🐢', 55], ['pet-bunny', '🐰', 60], ['pet-dog', '🐶', 70],
    ['pet-cat', '🐱', 70], ['pet-hedgehog', '🦔', 75], ['pet-penguin', '🐧', 85], ['pet-parrot', '🦜', 95],
    ['pet-fox', '🦊', 110], ['pet-koala', '🐨', 120], ['pet-panda', '🐼', 130], ['pet-flamingo', '🦩', 150],
    ['pet-dino', '🦕', 170], ['pet-trex', '🦖', 180], ['pet-unicorn', '🦄', 200], ['pet-whale', '🐳', 240],
    ['pet-dragon', '🐉', 320], ['pet-robot', '🤖', 450], ['pet-alien', '👾', 600], ['pet-eagle', '🦅', 1000]
  ]),
  ...E('skin', [
    ['skin-butterfly', '🦋', 150], ['skin-octopus', '🐙', 200], ['skin-shark', '🦈', 250], ['skin-peacock', '🦚', 280],
    ['skin-unicorn', '🦄', 300], ['skin-ghost', '👻', 320], ['skin-snowman', '⛄', 350], ['skin-trex', '🦖', 380],
    ['skin-alien', '👽', 450], ['skin-dragon', '🐲', 550], ['skin-robot', '🤖', 700], ['skin-star', '🌟', 1500]
  ]),
  ...C('bg', [
    ['bg-mint', 'linear-gradient(160deg,#d8f3dc,#74c69d)', 25], ['bg-lemon', 'linear-gradient(160deg,#fff3b0,#ffd166)', 25],
    ['bg-sunset', 'linear-gradient(160deg,#ffbe0b,#fb5607)', 30], ['bg-ocean', 'linear-gradient(160deg,#4cc9f0,#3a0ca3)', 30],
    ['bg-forest', 'linear-gradient(160deg,#b7e4c7,#2d6a4f)', 30], ['bg-candy', 'linear-gradient(160deg,#ffc8dd,#cdb4db)', 50],
    ['bg-dots', 'radial-gradient(#fff 18%,transparent 20%) 0 0/12px 12px,#ff8fab', 70],
    ['bg-stripes', 'repeating-linear-gradient(45deg,#ffd6a5 0 8px,#ffadad 8px 16px)', 70],
    ['bg-checks', 'repeating-conic-gradient(#caffbf 0 25%,#9bf6ff 0 50%) 0 0/16px 16px', 80],
    ['bg-space', 'radial-gradient(circle at 30% 30%,#7b2cbf,#10002b)', 80],
    ['bg-lava', 'radial-gradient(circle at 50% 80%,#ffba08,#d00000 60%,#370617)', 120],
    ['bg-aurora', 'linear-gradient(160deg,#0b132b,#1c7c54 50%,#73e2a7)', 150],
    ['bg-rainbow', 'conic-gradient(#ff595e,#ffca3a,#8ac926,#1982c4,#6a4c93,#ff595e)', 110],
    ['bg-galaxy', 'radial-gradient(circle at 70% 20%,#fff 1px,transparent 2px) 0 0/14px 14px,radial-gradient(circle at 30% 40%,#c77dff,#240046 70%)', 250],
    ['bg-gold', 'linear-gradient(135deg,#fff3b0,#ffc300 40%,#b8860b 60%,#ffe066)', 600],
    ['bg-diamond', 'linear-gradient(135deg,#e0fbfc,#98c1d9 30%,#ffffff 50%,#a8dadc 70%,#e0fbfc)', 1000]
  ]),
  ...C('frame', [
    ['fr-blue', '#4cc9f0', 40], ['fr-green', '#06d6a0', 40], ['fr-silver', '#ced4da', 50], ['fr-pink', '#ff70a6', 50],
    ['fr-purple', '#8338ec', 60], ['fr-gold', '#ffc300', 120], ['fr-fire', 'linear-gradient(#ffba08,#d00000)', 220],
    ['fr-ice', 'linear-gradient(#e0fbfc,#4cc9f0)', 220], ['fr-rainbow', 'rainbow', 160], ['fr-galaxy', 'linear-gradient(#c77dff,#240046)', 400],
    ['fr-diamond', 'linear-gradient(135deg,#ffffff,#98c1d9,#ffffff,#a8dadc)', 900]
  ]),
  ...E('effect', [
    ['fx-bubbles', '🫧', 70], ['fx-petals', '🌸', 80], ['fx-notes', '🎵', 85], ['fx-clover', '🍀', 85],
    ['fx-hearts', '💖', 90], ['fx-stars', '⭐', 90], ['fx-snow', '❄️', 110], ['fx-sparkles', '✨', 120],
    ['fx-confetti', '🎉', 180], ['fx-lightning', '⚡', 240], ['fx-fire', '🔥', 260], ['fx-rainbow', '🌈', 350],
    ['fx-gems', '💎', 600], ['fx-crowns', '👑', 900]
  ])
].sort((a, b) => a.price - b.price);

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export function rarityOf(price: number): Rarity {
  if (price < 60) return 'common';
  if (price < 180) return 'rare';
  if (price < 500) return 'epic';
  return 'legendary';
}

export const STICKER_PACK_PRICE = 25;

export const itemById = (id?: string) => SHOP_ITEMS.find((i) => i.id === id);

/** Mynter for et resultat: 5 per stjerne, +10 første gang et nivå klares. */
export function coinsFor(r: { won: boolean; stars: number; firstClear?: boolean; coins?: number }): number {
  if (typeof r.coins === 'number') return r.coins;
  if (!r.won) return r.stars > 0 ? 2 : 0;
  return r.stars * 5 + (r.firstClear ? 10 : 0);
}
