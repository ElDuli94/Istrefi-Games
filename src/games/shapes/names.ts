export type ShapeId = 'circle' | 'square' | 'triangle' | 'star' | 'heart' | 'rectangle' | 'oval' | 'hexagon' | 'diamond';
export const NAMES: Record<ShapeId, { no: string; sq: string }> = {
  circle: { no: 'sirkel', sq: 'rreth' },
  square: { no: 'firkant', sq: 'katror' },
  triangle: { no: 'trekant', sq: 'trekëndësh' },
  star: { no: 'stjerne', sq: 'yll' },
  heart: { no: 'hjerte', sq: 'zemër' },
  rectangle: { no: 'rektangel', sq: 'drejtkëndësh' },
  oval: { no: 'oval', sq: 'oval' },
  hexagon: { no: 'sekskant', sq: 'gjashtëkëndësh' },
  diamond: { no: 'rombe', sq: 'romb' }
};
export const SHAPE_NAMES = NAMES;
