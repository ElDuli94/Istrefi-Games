// Ting til barnets eget hus. Kjøpes for mynter og plasseres fritt i rommet.
import type { DictKey } from '../i18n/no';

export type HouseCat = 'furniture' | 'plants' | 'toys' | 'decor' | 'pets' | 'wall' | 'floor';
export interface HouseItem { id: string; cat: HouseCat; price: number; emoji?: string; css?: string }

export const HOUSE_CATS: { id: HouseCat; icon: string; nameKey: DictKey }[] = [
  { id: 'furniture', icon: '🛋️', nameKey: 'catFurniture' },
  { id: 'plants', icon: '🪴', nameKey: 'catPlants' },
  { id: 'toys', icon: '🧸', nameKey: 'catToys' },
  { id: 'decor', icon: '🖼️', nameKey: 'catDecor' },
  { id: 'pets', icon: '🐈', nameKey: 'catPets' },
  { id: 'wall', icon: '🧱', nameKey: 'catWall' },
  { id: 'floor', icon: '🟫', nameKey: 'catFloor' }
];

const E = (cat: HouseCat, list: [string, string, number][]): HouseItem[] => list.map(([id, emoji, price]) => ({ id, cat, emoji, price }));
const C = (cat: HouseCat, list: [string, string, number][]): HouseItem[] => list.map(([id, css, price]) => ({ id, cat, css, price }));

export const DEFAULT_WALL = 'w-peach';
export const DEFAULT_FLOOR = 'f-wood';

export const HOUSE_ITEMS: HouseItem[] = [
  ...E('furniture', [
    ['h-chair', '🪑', 30], ['h-lamp', '💡', 30], ['h-basket', '🧺', 25], ['h-ladder', '🪜', 35], ['h-cabinet', '🗄️', 45],
    ['h-mirror', '🪞', 50], ['h-bed', '🛏️', 60], ['h-clock', '🕰️', 60], ['h-sofa', '🛋️', 80], ['h-tv', '📺', 100],
    ['h-bath', '🛁', 120], ['h-pc', '💻', 150], ['h-piano', '🎹', 220]
  ]),
  ...E('plants', [
    ['h-tulip', '🌷', 20], ['h-sunflower', '🌻', 20], ['h-cactus', '🌵', 25], ['h-mushroom', '🍄', 25], ['h-potplant', '🪴', 30],
    ['h-bouquet', '💐', 40], ['h-tree', '🌳', 120], ['h-palm', '🌴', 140], ['h-xmastree', '🎄', 160]
  ]),
  ...E('toys', [
    ['h-dice', '🎲', 15], ['h-yoyo', '🪀', 20], ['h-ball', '⚽', 20], ['h-teddy', '🧸', 30], ['h-kite', '🪁', 35],
    ['h-car', '🚗', 40], ['h-pinata', '🪅', 50], ['h-train', '🚂', 60], ['h-skate', '🛹', 60], ['h-drum', '🥁', 70],
    ['h-console', '🎮', 90], ['h-robot', '🤖', 120], ['h-castle', '🏰', 220], ['h-carousel', '🎠', 300]
  ]),
  ...E('decor', [
    ['h-ribbon', '🎀', 15], ['h-balloon', '🎈', 15], ['h-candle', '🕯️', 20], ['h-bell', '🔔', 25], ['h-books', '📚', 30],
    ['h-carp', '🎏', 30], ['h-lantern', '🏮', 40], ['h-picture', '🖼️', 40], ['h-map', '🗺️', 45], ['h-star', '⭐', 50],
    ['h-globe', '🌍', 80], ['h-rainbow', '🌈', 100], ['h-trophy', '🏆', 250], ['h-gem', '💎', 500]
  ]),
  ...E('pets', [
    ['h-fish', '🐠', 50], ['h-turtle', '🐢', 60], ['h-rabbit', '🐇', 70], ['h-cat', '🐈', 90], ['h-dog', '🐕', 90],
    ['h-parrot', '🦜', 100], ['h-hamster', '🐹', 80], ['h-unicorn', '🦄', 400]
  ]),
  ...C('wall', [
    [DEFAULT_WALL, '#ffe5b4', 0], ['w-mint', '#d8f3dc', 30], ['w-sky', '#cfefff', 30], ['w-pink', '#ffd6e8', 30], ['w-lilac', '#e7d6ff', 30],
    ['w-stripes', 'repeating-linear-gradient(90deg,#fff1e6 0 24px,#ffd7ba 24px 48px)', 60],
    ['w-dots', 'radial-gradient(#ffffff 22%,transparent 24%) 0 0/28px 28px,#a0c4ff', 70],
    ['w-wood', 'repeating-linear-gradient(90deg,#d4a373 0 36px,#c8956a 36px 38px)', 90],
    ['w-brick', 'repeating-linear-gradient(0deg,#e5989b 0 18px,#f7f1ed 18px 21px)', 90],
    ['w-rainbow', 'linear-gradient(180deg,#ffadad,#ffd6a5,#fdffb6,#caffbf,#9bf6ff,#a0c4ff,#bdb2ff)', 180],
    ['w-space', 'radial-gradient(#fff 1px,transparent 2px) 0 0/22px 22px,linear-gradient(#240046,#3c096c)', 250]
  ]),
  ...C('floor', [
    [DEFAULT_FLOOR, 'repeating-linear-gradient(90deg,#deb887 0 60px,#d2a679 60px 62px)', 0],
    ['f-carpet', '#90caf9', 30], ['f-grass', 'linear-gradient(#95d5b2,#52b788)', 40],
    ['f-checks', 'repeating-conic-gradient(#fff 0 25%,#ffafcc 0 50%) 0 0/48px 48px', 70],
    ['f-tiles', 'repeating-conic-gradient(#e9ecef 0 25%,#ced4da 0 50%) 0 0/40px 40px', 60],
    ['f-sand', 'linear-gradient(#ffe8a3,#f4d58d)', 60], ['f-dark', 'repeating-linear-gradient(90deg,#7f5539 0 60px,#6f4518 60px 62px)', 80],
    ['f-clouds', 'radial-gradient(circle at 20% 50%,#fff 20%,transparent 21%) 0 0/60px 40px,#caf0f8', 150],
    ['f-rainbow', 'linear-gradient(90deg,#ff595e,#ffca3a,#8ac926,#1982c4,#6a4c93)', 220]
  ])
];

export const houseItemById = (id?: string) => HOUSE_ITEMS.find((i) => i.id === id);

export interface Placed { id: string; x: number; y: number; s: number; f: boolean }
export interface House { wall: string; floor: string; items: Placed[]; avatar: { x: number; y: number } }
export const defaultHouse = (): House => ({ wall: DEFAULT_WALL, floor: DEFAULT_FLOOR, items: [], avatar: { x: 50, y: 82 } });
