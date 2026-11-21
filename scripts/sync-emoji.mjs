// Finner alle emoji som brukes i appen og kopierer tilhørende 3D-figurer
// (Microsoft Fluent Emoji 3D, MIT-lisens, via @lobehub/fluent-emoji-3d) til public/emoji3d/.
// Kjøres automatisk etter `npm install` og før bygging.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assets = join(root, 'node_modules/@lobehub/fluent-emoji-3d/assets');
const out = join(root, 'public/emoji3d');
const listFile = join(root, 'src/emoji3dList.ts');

const norm = (seq) => [...seq].map((c) => c.codePointAt(0).toString(16)).filter((h) => h !== 'fe0f').join('-');

if (!existsSync(assets)) {
  console.warn('[emoji3d] Fant ikke @lobehub/fluent-emoji-3d – bruker vanlige emoji.');
  if (!existsSync(listFile)) writeFileSync(listFile, 'export const EMOJI3D: string[] = [];\n');
  process.exit(0);
}

// Tilgjengelige 3D-filer, nøkkel uten fe0f
const available = new Map();
for (const f of readdirSync(assets)) if (f.endsWith('.webp')) available.set(f.replace('.webp', '').split('-').filter((h) => h !== 'fe0f').join('-'), f);

// Finn emoji i kildekoden
const files = [];
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(tsx?|css)$/.test(f) && !p.endsWith('emoji3dList.ts')) files.push(p); } };
walk(join(root, 'src'));
const seg = new Intl.Segmenter('en', { granularity: 'grapheme' });
const used = new Set();
for (const f of files) {
  for (const { segment } of seg.segment(readFileSync(f, 'utf8'))) {
    if (/\p{Extended_Pictographic}/u.test(segment)) used.add(norm(segment));
  }
}

mkdirSync(out, { recursive: true });
const copied = [];
for (const key of [...used].sort()) {
  const file = available.get(key);
  if (!file) continue;
  copyFileSync(join(assets, file), join(out, `${key}.webp`));
  copied.push(key);
}
writeFileSync(listFile, `// Generert av scripts/sync-emoji.mjs – ikke rediger.\nexport const EMOJI3D: string[] = ${JSON.stringify(copied)};\n`);
console.log(`[emoji3d] ${copied.length} av ${used.size} emoji har 3D-versjon (kopiert til public/emoji3d).`);
