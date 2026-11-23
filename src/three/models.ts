// Hvilke emoji som har en ekte 3D-modell (Kenney, CC0). Brukes av <Thing> og 3D-øya/huset.
// Uten modell (eller på enheter uten 3D) vises vanlig 3D-emoji som før.

export interface ModelInfo {
  /** Sti under public/models/ */
  path: string;
  /** Modellen har animasjoner (Cube Pets: idle, walk, run, eat, dance, gesture-positive …) */
  animated?: boolean;
  /** Ekstra rotasjon rundt Y (radianer) så modellen ser mot kameraet */
  rotY?: number;
}

const pet = (f: string): ModelInfo => ({ path: `pets/animal-${f}.glb`, animated: true });
const food = (f: string): ModelInfo => ({ path: `food/${f}.glb` });
const car = (f: string): ModelInfo => ({ path: `cars/${f}.glb`, rotY: -0.6 });
const furn = (f: string): ModelInfo => ({ path: `furniture/${f}.glb`, rotY: Math.PI + 0.5 });
const nat = (f: string): ModelInfo => ({ path: `nature/${f}.glb` });

export const MODELS: Record<string, ModelInfo> = {
  // Dyr (animerte)
  '🐶': pet('dog'), '🐕': pet('dog'), '🐱': pet('cat'), '🐈': pet('cat'), '🐮': pet('cow'), '🐄': pet('cow'),
  '🐷': pet('pig'), '🐖': pet('pig'), '🦁': pet('lion'), '🐘': pet('elephant'), '🐵': pet('monkey'), '🐒': pet('monkey'),
  '🐰': pet('bunny'), '🐇': pet('bunny'), '🐼': pet('panda'), '🦊': pet('fox'), '🐧': pet('penguin'), '🦒': pet('giraffe'),
  '🐯': pet('tiger'), '🐅': pet('tiger'), '🐻‍❄️': pet('polar'), '🐨': pet('koala'), '🦜': pet('parrot'), '🐝': pet('bee'),
  '🦀': pet('crab'), '🐟': pet('fish'), '🐠': pet('fish'), '🦌': pet('deer'), '🦫': pet('beaver'), '🐗': pet('hog'),
  '🐛': pet('caterpillar'), '🐥': pet('chick'), '🐣': pet('chick'), '🐤': pet('chick'),
  // Mat
  '🍎': food('apple'), '🍌': food('banana'), '🍓': food('strawberry'), '🍇': food('grapes'), '🍊': food('orange'),
  '🍉': food('watermelon'), '🍐': food('pear'), '🍒': food('cherries'), '🥕': food('carrot'), '🍅': food('tomato'),
  '🌽': food('corn'), '🍞': food('loaf'), '🧀': food('cheese'), '🥚': food('egg'), '🍕': food('pizza'), '🍦': food('ice-cream'),
  '🎂': food('cake-birthday'), '🍪': food('cookie'), '🥛': food('carton'), '🧁': food('cupcake'), '🍩': food('donut-sprinkles'),
  // Kjøretøy
  '🚗': car('sedan'), '🚒': car('firetruck'), '🚑': car('ambulance'), '🚓': car('police'), '🚜': car('tractor'),
  '🚕': car('taxi'), '🚚': car('truck'), '🚐': car('van'), '🏎️': car('race'),
  // Møbler og ting i huset
  '🛏️': furn('bedDouble'), '🪑': furn('chair'), '💡': furn('lampRoundTable'), '🛁': furn('bathtub'), '📚': furn('books'),
  '📕': furn('books'), '🧸': furn('bear'), '🛋️': furn('loungeSofa'), '📺': furn('televisionModern'), '💻': furn('laptop'),
  '🪴': furn('pottedPlant'), '🪞': furn('bathroomMirror'), '🗄️': furn('bookcaseClosed'), '📻': furn('radio'), '🚽': furn('toilet'),
  // Natur
  '🌳': nat('tree_oak'), '🌲': nat('tree_pineRoundA'), '🌴': nat('tree_palmTall'), '🍄': nat('mushroom_red'),
  '🌸': nat('flower_redA'), '🌷': nat('flower_redA'), '🌻': nat('flower_yellowA'), '💐': nat('flower_purpleA'), '⛺': nat('tent_detailedOpen'),
  '🪵': nat('log_stack'), '🔥': nat('campfire_stones')
};

export const modelFor = (e: string): ModelInfo | null => MODELS[e] ?? MODELS[e.replace(/️/g, '')] ?? null;
export const modelUrl = (m: ModelInfo) => `${import.meta.env.BASE_URL}models/${m.path}`;
