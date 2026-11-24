// Egne linjetegninger til fargeleggingsboka. Hver figur er en liste med flater man kan fylle.
// [tagg, attributter, kanFylles?]
export type Shape = [tag: 'path' | 'circle' | 'ellipse' | 'rect' | 'polygon', attrs: Record<string, string | number>, fill?: boolean];
export interface ColorPic { id: string; icon: string; shapes: Shape[] }

const sunRays = (cx: number, cy: number, r: number): Shape[] =>
  Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    const p = (rr: number, da: number) => `${cx + Math.cos(a + da) * rr},${cy + Math.sin(a + da) * rr}`;
    return ['polygon', { points: `${p(r + 6, -0.18)} ${p(r + 26, 0)} ${p(r + 6, 0.18)}` }] as Shape;
  });

export const COLOR_PICS: ColorPic[] = [
  { id: 'house', icon: '🏡', shapes: [
    ['rect', { x: 0, y: 0, width: 400, height: 270 }], ...sunRays(320, 70, 32), ['circle', { cx: 320, cy: 70, r: 32 }],
    ['path', { d: 'M40 90 q15 -30 45 -18 q20 -22 45 0 q25 0 20 22 z' }],
    ['path', { d: 'M0 270 Q100 230 200 262 T400 255 V400 H0 Z' }],
    ['rect', { x: 100, y: 190, width: 140, height: 120 }], ['polygon', { points: '85,195 170,120 255,195' }],
    ['rect', { x: 150, y: 240, width: 40, height: 70 }], ['rect', { x: 113, y: 210, width: 30, height: 30 }], ['rect', { x: 197, y: 210, width: 30, height: 30 }],
    ['rect', { x: 300, y: 220, width: 18, height: 80 }], ['circle', { cx: 309, cy: 195, r: 46 }],
    ['circle', { cx: 50, cy: 340, r: 14 }], ['circle', { cx: 90, cy: 355, r: 14 }], ['circle', { cx: 350, cy: 345, r: 14 }]
  ] },
  { id: 'fish', icon: '🐠', shapes: [
    ['rect', { x: 0, y: 0, width: 400, height: 400 }], ['path', { d: 'M0 340 Q100 320 200 345 T400 335 V400 H0 Z' }],
    ['polygon', { points: '270,200 350,140 340,200 350,260' }], ['ellipse', { cx: 190, cy: 200, rx: 110, ry: 72 }],
    ['path', { d: 'M150 132 Q190 80 240 135 Z' }], ['path', { d: 'M170 268 Q195 305 225 265 Z' }],
    ['path', { d: 'M150 140 Q130 200 150 260 Q165 200 150 140 Z' }], ['path', { d: 'M205 135 Q185 200 205 266 Q222 200 205 135 Z' }],
    ['circle', { cx: 120, cy: 185, r: 18 }], ['circle', { cx: 116, cy: 185, r: 7 }],
    ['circle', { cx: 80, cy: 110, r: 12 }], ['circle', { cx: 60, cy: 75, r: 8 }],
    ['path', { d: 'M40 400 Q20 350 45 300 Q60 350 60 400 Z' }], ['path', { d: 'M350 400 Q340 340 365 290 Q380 350 375 400 Z' }]
  ] },
  { id: 'rocket', icon: '🚀', shapes: [
    ['rect', { x: 0, y: 0, width: 400, height: 400 }], ['circle', { cx: 80, cy: 300, r: 45 }], ['ellipse', { cx: 80, cy: 300, rx: 75, ry: 16 }, false],
    ['path', { d: 'M200 40 Q260 110 245 260 L155 260 Q140 110 200 40 Z' }], ['path', { d: 'M200 40 Q232 78 240 115 L160 115 Q168 78 200 40 Z' }],
    ['circle', { cx: 200, cy: 165, r: 26 }], ['polygon', { points: '155,215 110,290 158,262' }], ['polygon', { points: '245,215 290,290 242,262' }],
    ['path', { d: 'M170 262 Q200 360 230 262 Z' }], ['path', { d: 'M185 262 Q200 320 215 262 Z' }],
    ['polygon', { points: '320,60 328,80 350,82 333,95 338,117 320,105 302,117 307,95 290,82 312,80' }],
    ['polygon', { points: '330,240 335,252 348,253 338,261 341,274 330,267 319,274 322,261 312,253 325,252' }]
  ] },
  { id: 'flower', icon: '🌷', shapes: [
    ['rect', { x: 0, y: 0, width: 400, height: 400 }], ['rect', { x: 192, y: 190, width: 16, height: 140 }],
    ['ellipse', { cx: 160, cy: 270, rx: 36, ry: 16, transform: 'rotate(-30 160 270)' }], ['ellipse', { cx: 240, cy: 250, rx: 36, ry: 16, transform: 'rotate(30 240 250)' }],
    ...[0, 60, 120, 180, 240, 300].map((a) => ['ellipse', { cx: 200, cy: 80, rx: 32, ry: 52, transform: `rotate(${a} 200 140)` }] as Shape),
    ['circle', { cx: 200, cy: 140, r: 34 }], ['polygon', { points: '130,320 270,320 250,390 150,390' }], ['rect', { x: 120, y: 305, width: 160, height: 22, rx: 6 }]
  ] },
  { id: 'butterfly', icon: '🦋', shapes: [
    ['rect', { x: 0, y: 0, width: 400, height: 400 }],
    ['ellipse', { cx: 130, cy: 140, rx: 80, ry: 95, transform: 'rotate(-20 130 140)' }], ['ellipse', { cx: 270, cy: 140, rx: 80, ry: 95, transform: 'rotate(20 270 140)' }],
    ['ellipse', { cx: 145, cy: 285, rx: 55, ry: 70, transform: 'rotate(20 145 285)' }], ['ellipse', { cx: 255, cy: 285, rx: 55, ry: 70, transform: 'rotate(-20 255 285)' }],
    ['circle', { cx: 120, cy: 130, r: 28 }], ['circle', { cx: 280, cy: 130, r: 28 }], ['circle', { cx: 150, cy: 290, r: 20 }], ['circle', { cx: 250, cy: 290, r: 20 }],
    ['ellipse', { cx: 200, cy: 215, rx: 18, ry: 110 }], ['circle', { cx: 200, cy: 100, r: 22 }],
    ['path', { d: 'M192 82 Q170 40 150 35 M208 82 Q230 40 250 35', fill: 'none' }, false]
  ] },
  { id: 'eagle', icon: '🦅', shapes: [
    ['rect', { x: 0, y: 0, width: 400, height: 400 }],
    ['ellipse', { cx: 92, cy: 230, rx: 40, ry: 76, transform: 'rotate(25 92 230)' }], ['ellipse', { cx: 308, cy: 230, rx: 40, ry: 76, transform: 'rotate(-25 308 230)' }],
    ['path', { d: 'M156 104 Q168 48 192 96 Q200 40 212 96 Q236 48 244 104 Z' }], ['circle', { cx: 200, cy: 224, r: 124 }],
    ['ellipse', { cx: 200, cy: 280, rx: 76, ry: 60 }], ['circle', { cx: 156, cy: 192, r: 34 }], ['circle', { cx: 244, cy: 192, r: 34 }],
    ['circle', { cx: 162, cy: 196, r: 16 }], ['circle', { cx: 238, cy: 196, r: 16 }],
    ['path', { d: 'M172 224 Q200 204 228 224 Q216 264 200 272 Q184 264 172 224 Z' }], ['path', { d: 'M116 308 Q200 344 284 308 L280 332 Q200 368 120 332 Z' }]
  ] },
  { id: 'car', icon: '🚗', shapes: [
    ['rect', { x: 0, y: 0, width: 400, height: 300 }], ['rect', { x: 0, y: 300, width: 400, height: 100 }], ['rect', { x: 20, y: 345, width: 60, height: 10 }], ['rect', { x: 170, y: 345, width: 60, height: 10 }], ['rect', { x: 320, y: 345, width: 60, height: 10 }],
    ['path', { d: 'M50 280 L50 220 Q55 200 80 198 L340 198 Q360 200 360 225 L360 280 Z' }], ['path', { d: 'M110 198 L150 140 L270 140 L310 198 Z' }],
    ['polygon', { points: '125,195 155,150 205,150 205,195' }], ['polygon', { points: '215,150 265,150 295,195 215,195' }],
    ['circle', { cx: 120, cy: 285, r: 34 }], ['circle', { cx: 290, cy: 285, r: 34 }], ['circle', { cx: 120, cy: 285, r: 14 }], ['circle', { cx: 290, cy: 285, r: 14 }],
    ['rect', { x: 340, y: 225, width: 22, height: 16, rx: 4 }], ...sunRays(70, 70, 28), ['circle', { cx: 70, cy: 70, r: 28 }]
  ] },
  { id: 'snowman', icon: '⛄', shapes: [
    ['rect', { x: 0, y: 0, width: 400, height: 400 }], ['path', { d: 'M0 300 Q200 260 400 300 V400 H0 Z' }],
    ['circle', { cx: 200, cy: 300, r: 70 }], ['circle', { cx: 200, cy: 190, r: 52 }],
    ['rect', { x: 165, y: 120, width: 70, height: 14, rx: 4 }], ['rect', { x: 176, y: 70, width: 48, height: 54, rx: 6 }],
    ['path', { d: 'M160 228 Q200 246 240 228 L240 246 Q200 262 160 246 Z' }], ['polygon', { points: '222,240 240,290 222,290' }],
    ['polygon', { points: '200,195 246,204 200,210' }], ['circle', { cx: 182, cy: 178, r: 6 }], ['circle', { cx: 218, cy: 178, r: 6 }],
    ['circle', { cx: 200, cy: 275, r: 8 }], ['circle', { cx: 200, cy: 305, r: 8 }], ['circle', { cx: 200, cy: 335, r: 8 }],
    ['polygon', { points: '60,80 66,96 84,98 70,108 74,126 60,116 46,126 50,108 36,98 54,96' }], ['polygon', { points: '340,60 346,76 364,78 350,88 354,106 340,96 326,106 330,88 316,78 334,76' }]
  ] },
  { id: 'cake', icon: '🎂', shapes: [
    ['rect', { x: 0, y: 0, width: 400, height: 400 }], ['ellipse', { cx: 200, cy: 345, rx: 165, ry: 30 }],
    ['rect', { x: 70, y: 245, width: 260, height: 95, rx: 10 }], ['rect', { x: 100, y: 170, width: 200, height: 80, rx: 10 }],
    ['path', { d: 'M70 262 Q95 285 120 262 Q145 285 170 262 Q195 285 220 262 Q245 285 270 262 Q295 285 330 262 L330 250 L70 250 Z' }],
    ['path', { d: 'M100 185 Q125 205 150 185 Q175 205 200 185 Q225 205 250 185 Q275 205 300 185 L300 172 L100 172 Z' }],
    ['rect', { x: 140, y: 115, width: 16, height: 55, rx: 4 }], ['rect', { x: 192, y: 105, width: 16, height: 65, rx: 4 }], ['rect', { x: 244, y: 115, width: 16, height: 55, rx: 4 }],
    ['path', { d: 'M148 112 Q136 92 148 76 Q160 92 148 112 Z' }], ['path', { d: 'M200 102 Q188 82 200 66 Q212 82 200 102 Z' }], ['path', { d: 'M252 112 Q240 92 252 76 Q264 92 252 112 Z' }],
    ['circle', { cx: 120, cy: 305, r: 10 }], ['circle', { cx: 200, cy: 310, r: 10 }], ['circle', { cx: 280, cy: 305, r: 10 }],
    ['polygon', { points: '50,60 56,76 74,78 60,88 64,106 50,96 36,106 40,88 26,78 44,76' }], ['polygon', { points: '350,70 356,86 374,88 360,98 364,116 350,106 336,116 340,98 326,88 344,86' }]
  ] },
  { id: 'castle', icon: '🏰', shapes: [
    ['rect', { x: 0, y: 0, width: 400, height: 320 }], ['path', { d: 'M0 320 Q200 290 400 320 V400 H0 Z' }],
    ['rect', { x: 110, y: 160, width: 180, height: 170 }], ['rect', { x: 50, y: 120, width: 70, height: 210 }], ['rect', { x: 280, y: 120, width: 70, height: 210 }],
    ['polygon', { points: '40,122 85,50 130,122' }], ['polygon', { points: '270,122 315,50 360,122' }],
    ['path', { d: 'M110 160 V140 H130 V160 H150 V140 H170 V160 H190 V140 H210 V160 H230 V140 H250 V160 H270 V140 H290 V160 Z' }],
    ['path', { d: 'M170 330 V270 Q200 235 230 270 V330 Z' }], ['rect', { x: 72, y: 170, width: 26, height: 36, rx: 12 }], ['rect', { x: 302, y: 170, width: 26, height: 36, rx: 12 }],
    ['rect', { x: 150, y: 190, width: 26, height: 34, rx: 12 }], ['rect', { x: 224, y: 190, width: 26, height: 34, rx: 12 }],
    ['polygon', { points: '85,50 85,20 110,30 85,40' }], ['polygon', { points: '315,50 315,20 340,30 315,40' }],
    ['path', { d: 'M300 80 q12 -24 36 -14 q16 -18 36 0 q20 0 16 18 z' }]
  ] },
  { id: 'whale', icon: '🐳', shapes: [
    ['rect', { x: 0, y: 0, width: 400, height: 230 }], ['path', { d: 'M0 230 Q50 215 100 230 T200 230 T300 230 T400 230 V400 H0 Z' }],
    ['path', { d: 'M60 230 Q60 140 170 135 Q280 132 320 200 Q335 230 300 250 Q200 290 100 265 Q60 255 60 230 Z' }],
    ['path', { d: 'M70 238 Q160 280 300 248 Q230 300 130 285 Q80 270 70 238 Z' }],
    ['path', { d: 'M300 200 Q350 150 375 165 Q355 200 330 215 Q370 230 372 262 Q340 260 305 232 Z' }],
    ['circle', { cx: 120, cy: 200, r: 10 }], ['path', { d: 'M165 135 Q150 90 130 80 M170 135 Q175 85 195 70 M168 135 Q165 95 165 65', fill: 'none' }, false],
    ['circle', { cx: 130, cy: 72, r: 9 }], ['circle', { cx: 196, cy: 62, r: 9 }], ['circle', { cx: 165, cy: 55, r: 9 }],
    ['path', { d: 'M40 320 Q55 300 70 320 Q55 340 40 320 Z' }], ['path', { d: 'M320 340 Q335 320 350 340 Q335 360 320 340 Z' }],
    ...sunRays(340, 60, 26), ['circle', { cx: 340, cy: 60, r: 26 }]
  ] },
  { id: 'airballoon', icon: '🎈', shapes: [
    ['rect', { x: 0, y: 0, width: 400, height: 400 }], ['path', { d: 'M0 350 Q100 320 200 345 T400 335 V400 H0 Z' }],
    ['path', { d: 'M200 40 Q300 40 300 150 Q300 220 230 260 L170 260 Q100 220 100 150 Q100 40 200 40 Z' }],
    ['path', { d: 'M200 40 Q245 40 245 150 Q245 220 215 260 L185 260 Q155 220 155 150 Q155 40 200 40 Z' }],
    ['path', { d: 'M200 40 Q215 40 215 150 Q215 220 205 260 L195 260 Q185 220 185 150 Q185 40 200 40 Z' }],
    ['path', { d: 'M172 262 L180 300 M228 262 L220 300', fill: 'none' }, false], ['rect', { x: 172, y: 298, width: 56, height: 38, rx: 6 }],
    ['path', { d: 'M40 110 q15 -30 45 -18 q20 -22 45 0 q25 0 20 22 z' }], ['path', { d: 'M280 290 q12 -24 36 -14 q16 -18 36 0 q20 0 16 18 z' }],
    ['polygon', { points: '340,60 346,76 364,78 350,88 354,106 340,96 326,106 330,88 316,78 334,76' }]
  ] }
];
