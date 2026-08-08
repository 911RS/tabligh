/**
 * Render public/og.png (1200×630), the card every social platform and search
 * preview shows. Generated from HTML with the site's own fonts so it can never
 * drift from the brand; re-run with `npm run og` after a palette change.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from '../../node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const PUB = join(HERE, '..', 'public');

const b64 = async (p) => (await readFile(join(PUB, 'fonts', p))).toString('base64');

const [fustat, almarai, aref] = await Promise.all([
  b64('fustat-latin-200-800.woff2'),
  b64('almarai-arabic-800.woff2'),
  b64('aref-ruqaa-arabic-400.woff2'),
]);

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'Fustat';src:url(data:font/woff2;base64,${fustat}) format('woff2');font-weight:200 800}
@font-face{font-family:'Almarai';src:url(data:font/woff2;base64,${almarai}) format('woff2');font-weight:800}
@font-face{font-family:'Aref';src:url(data:font/woff2;base64,${aref}) format('woff2');font-weight:400}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#f6f5f3;font-family:'Fustat',sans-serif;overflow:hidden;position:relative}
.glow-a{position:absolute;left:-160px;top:-160px;width:620px;height:620px;border-radius:50%;
  background:radial-gradient(circle,rgba(249,115,22,.22),transparent 65%)}
.glow-b{position:absolute;right:-140px;bottom:-220px;width:680px;height:680px;border-radius:50%;
  background:radial-gradient(circle,rgba(234,88,12,.18),transparent 65%)}
.tess{position:absolute;inset:0;opacity:.05;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cg fill='none' stroke='%23ea580c' stroke-width='1'%3E%3Cpath d='M60 10 L75 45 L110 60 L75 75 L60 110 L45 75 L10 60 L45 45 Z'/%3E%3C/g%3E%3C/svg%3E")}
.wrap{position:relative;display:flex;align-items:center;height:100%;padding:0 72px;gap:56px}
.left{flex:1}
.brand{display:flex;align-items:center;gap:14px;margin-bottom:30px}
.brand span{font-size:30px;font-weight:800;color:#17171a;letter-spacing:-.02em}
h1{font-size:64px;line-height:1.04;font-weight:800;color:#17171a;letter-spacing:-.035em}
h1 em{font-style:normal;background:linear-gradient(100deg,#c2410c,#ea580c 45%,#f97316);
  -webkit-background-clip:text;background-clip:text;color:transparent}
p{margin-top:22px;font-size:25px;line-height:1.45;color:#4b4b52;max-width:620px}
.chips{margin-top:32px;display:flex;gap:12px}
.chip{border:1px solid rgba(234,88,12,.22);background:#fff2e8;color:#c2410c;
  padding:9px 20px;border-radius:999px;font-size:19px;font-weight:700}
.phone{width:250px;height:530px;border-radius:42px;padding:5px;
  background:linear-gradient(180deg,#2b3330,#141a18);box-shadow:0 40px 90px -30px rgba(20,33,28,.55)}
.screen{width:100%;height:100%;border-radius:37px;position:relative;overflow:hidden;
  background:linear-gradient(180deg,#03251f,#0e7490);display:flex;align-items:center;justify-content:center}
.halo{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:270px;height:270px;
  border-radius:50%;background:radial-gradient(circle,rgba(52,211,153,.34),transparent 68%)}
.ayah{position:relative;font-family:'Aref',serif;font-size:34px;line-height:2;text-align:center;
  color:#f7e3b6;text-shadow:0 0 30px rgba(227,180,99,.6);padding:0 26px}
.url{position:absolute;bottom:34px;left:0;right:0;text-align:center;font-size:17px;
  font-weight:700;letter-spacing:1.5px;color:#e3b463}
</style></head><body>
<div class="glow-a"></div><div class="glow-b"></div><div class="tess"></div>
<div class="wrap">
  <div class="left">
    <div class="brand">
      <svg width="42" height="42" viewBox="0 0 64 64">
        <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f97316"/><stop offset="100%" stop-color="#c2410c"/>
        </linearGradient></defs>
        <path d="M32 3 L41.5 22.5 L61 32 L41.5 41.5 L32 61 L22.5 41.5 L3 32 L22.5 22.5 Z" fill="url(#g)"/>
        <circle cx="32" cy="32" r="6.5" fill="#ffffff"/>
      </svg>
      <span>Tabligh</span>
    </div>
    <h1>Create a Quran reel,<br/><em>free</em></h1>
    <p>Any surah, any reciter, word-by-word karaoke — a vertical video ready for TikTok, Reels and Shorts.</p>
    <div class="chips"><div class="chip">No account</div><div class="chip">No watermark</div><div class="chip">Open source</div></div>
  </div>
  <div class="phone"><div class="screen">
    <div class="halo"></div>
    <div class="ayah" dir="rtl">ٱللَّهُ نُورُ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضِ</div>
    <div class="url">tabligh.cc</div>
  </div></div>
</div></body></html>`;

const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await mkdir(PUB, { recursive: true });
await writeFile(join(PUB, 'og.png'), await page.screenshot({ type: 'png' }));
await browser.close();
console.log('public/og.png written (1200×630)');
