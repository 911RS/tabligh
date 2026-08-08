/** Report why elements are invisible: computed opacity/color/filter per node. */
import puppeteer from '../../node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';

const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
page.on('console', (m) => console.log('[console]', m.type(), m.text()));
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.setViewport({ width: 1440, height: 900 });
await page.goto(process.argv[2] ?? 'http://localhost:5273/', { waitUntil: 'networkidle2' });

// Scroll everything into view, then settle.
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 400) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 60));
  }
  window.scrollTo(0, 0);
});
await new Promise((r) => setTimeout(r, 1500));

const report = await page.evaluate(() => {
  const out = [];
  for (const h of document.querySelectorAll('h2')) {
    const cs = getComputedStyle(h);
    out.push({
      tag: 'h2',
      text: (h.textContent ?? '').slice(0, 40),
      opacity: cs.opacity,
      color: cs.color,
      filter: cs.filter,
      display: cs.display,
      visibility: cs.visibility,
      rect: h.getBoundingClientRect().height,
      childOpacity: [...h.querySelectorAll('span')].slice(0, 3).map((s) => getComputedStyle(s).opacity),
    });
  }
  const sections = [...document.querySelectorAll('section')].map((s) => ({
    id: s.id,
    height: Math.round(s.getBoundingClientRect().height),
    children: s.querySelectorAll('*').length,
  }));
  return { h2s: out, sections };
});

console.log(JSON.stringify(report, null, 2));
await browser.close();
