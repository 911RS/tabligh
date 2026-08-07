/** Screenshot individual sections at readable scale.
 *  Usage: node scripts/shot-section.mjs <outDir> <selector...> */
import { mkdir } from 'node:fs/promises';
import puppeteer from '../../node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';

const [outDir, ...selectors] = process.argv.slice(2);
await mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 2 });
await page.goto('http://localhost:5273/', { waitUntil: 'networkidle2' });

for (const sel of selectors) {
  const el = await page.$(sel);
  if (!el) { console.log(`missing ${sel}`); continue; }
  await el.scrollIntoView();
  await new Promise((r) => setTimeout(r, 2200));
  const name = sel.replace(/[^a-z0-9]/gi, '') || 'shot';
  await el.screenshot({ path: `${outDir}/${name}.png` });
  console.log(`${outDir}/${name}.png`);
}

await browser.close();
