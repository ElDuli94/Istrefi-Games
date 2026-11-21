// Lager PNG-ikoner (til app-installasjon) fra public/favicon.svg.
// Kjør: npm run icons  (krever Playwright/Chromium)
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
import { readFileSync } from 'node:fs';

const svg = readFileSync(new URL('../public/favicon.svg', import.meta.url), 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage();

async function render(size, file, { maskable = false, rounded = true } = {}) {
  let s = svg;
  if (!rounded) s = s.replace('rx="44"', 'rx="0"');
  const inner = maskable
    ? `<div style="width:${size}px;height:${size}px;background:#4cc9f0;display:flex;align-items:center;justify-content:center"><div style="width:${size * 0.8}px;height:${size * 0.8}px">${s}</div></div>`
    : `<div style="width:${size}px;height:${size}px">${s}</div>`;
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${inner}<style>svg{width:100%;height:100%;display:block}</style></body></html>`);
  await page.screenshot({ path: new URL(`../public/${file}`, import.meta.url).pathname, omitBackground: true });
}

await render(192, 'icon-192.png');
await render(512, 'icon-512.png');
await render(512, 'icon-512-maskable.png', { maskable: true, rounded: false });
await render(180, 'apple-touch-icon.png', { rounded: false });
await browser.close();
console.log('Ikoner laget i public/');
