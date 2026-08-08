/** Park a section in the middle of the viewport and measure whether its
 *  in-view animations actually resolved. */
import puppeteer from '../../node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';

const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('response', (r) => { if (r.status() >= 400) console.log('[http]', r.status(), r.url()); });
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:5273/', { waitUntil: 'networkidle2' });

await page.evaluate(() => document.querySelector('#studio')?.scrollIntoView({ block: 'center' }));
await new Promise((r) => setTimeout(r, 2500));

console.log(JSON.stringify(await page.evaluate(() => {
  const h2 = document.querySelector('#studio h2');
  const spans = h2 ? [...h2.querySelectorAll('span')] : [];
  const rect = h2?.getBoundingClientRect();
  return {
    h2Text: h2?.textContent?.slice(0, 30),
    inViewport: rect ? rect.top < innerHeight && rect.bottom > 0 : null,
    rectTop: rect ? Math.round(rect.top) : null,
    spanOpacities: spans.slice(0, 5).map((s) => getComputedStyle(s).opacity),
    spanTransforms: spans.slice(1, 3).map((s) => getComputedStyle(s).transform),
    // BlurFade wrappers elsewhere on the page
    blurFadeOpacities: [...document.querySelectorAll('#how div[style*="opacity"], #tools div[style*="opacity"]')]
      .slice(0, 4).map((d) => getComputedStyle(d).opacity),
  };
}, null, 2)));

await browser.close();
