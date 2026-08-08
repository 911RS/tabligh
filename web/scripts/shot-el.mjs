/**
 * Screenshot individual elements at 2x, so small composites (the phone
 * previews) can actually be judged rather than squinted at.
 *
 * Usage: node scripts/shot-el.mjs <url> <outDir> <selector>[ <selector>...]
 */
import { mkdir } from 'node:fs/promises';
import puppeteer from '../../node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';

const [url, out, ...selectors] = process.argv.slice(2);
await mkdir(out, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await new Promise((r) => setTimeout(r, 1500));
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise((r) => setTimeout(r, 2500));

for (const [i, sel] of selectors.entries()) {
  const el = await page.$(sel);
  if (!el) { console.log(`MISS ${sel}`); continue; }
  await el.scrollIntoView();
  await new Promise((r) => setTimeout(r, 1800));
  const name = `${out}/el${i}.png`;
  await el.screenshot({ path: name });
  console.log(`${name}  <- ${sel}`);
}

await browser.close();
