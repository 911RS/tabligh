/**
 * Viewport screenshots taken at real scroll offsets.
 *
 * `fullPage: true` composites the page with `position: fixed` layers painted
 * once, at their top-of-page position — so the mesh backdrop and the header
 * vanish below the fold and the design looks flatter than it is. Scrolling and
 * shooting the viewport is the only way to see what a visitor sees.
 *
 * Usage: node scripts/shot-scroll.mjs [url] [outDir] [width] [height]
 */
import { mkdir } from 'node:fs/promises';
import puppeteer from '../../node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';

const URL = process.argv[2] ?? 'http://localhost:5273/';
const OUT = process.argv[3] ?? '/tmp/shots';
const W = Number(process.argv[4] ?? 1440);
const H = Number(process.argv[5] ?? 900);

await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });

const total = await page.evaluate(() => document.body.scrollHeight);
const steps = Math.ceil(total / H);

for (let i = 0; i < steps; i++) {
  const y = i * H;
  await page.evaluate((to) => window.scrollTo(0, to), y);
  // The entrance animations are in-view triggered with staggers up to ~0.8s.
  await new Promise((r) => setTimeout(r, 1200));
  const name = `${OUT}/v${String(i).padStart(2, '0')}.png`;
  await page.screenshot({ path: name });
  console.log(name);
}

console.log(`page height ${total}px over ${steps} viewports`);
await browser.close();
