/**
 * Screenshot the dev server so the design can be reviewed as rendered rather
 * than as imagined. Usage: node scripts/shoot.mjs [url] [outDir]
 */
import { mkdir } from 'node:fs/promises';
import puppeteer from '../../node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';

const URL = process.argv[2] ?? 'http://localhost:5273/';
const OUT = process.argv[3] ?? '/tmp/shots';

const SHOTS = [
  { name: 'desktop-full', width: 1440, height: 900, full: true },
  { name: 'mobile-full', width: 390, height: 844, full: true },
];

await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  // Resolved explicitly: this script runs from web/, so Puppeteer's own cache
  // lookup starts in the wrong place.
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

for (const s of SHOTS) {
  const page = await browser.newPage();
  await page.setViewport({ width: s.width, height: s.height, deviceScaleFactor: 1 });
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
  // Walk the page in half-viewport steps, DWELLING at each one. The entrance
  // animations are in-view triggered with staggered delays up to ~0.8s, so a
  // fast scroll captures them mid-flight (or not at all) and the screenshot
  // lies about the design.
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.5);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 900));
    }
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: `${OUT}/${s.name}.png`, fullPage: s.full });
  console.log(`${OUT}/${s.name}.png`);
  await page.close();
}

await browser.close();
