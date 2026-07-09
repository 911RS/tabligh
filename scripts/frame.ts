/**
 * Debug: render ONE frame of the scene at a given time, fast.
 *   npx tsx scripts/frame.ts <ir.json> <timeMs> [out.png] [keyword...]
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import puppeteer from 'puppeteer';
import { buildScene, toArabicDigits, type SceneAyah } from '../src/render/scene.js';
import { resolveBackground } from '../src/render/background.js';
import type { ReelJob } from '../src/types.js';

const [, , irPath, timeStr, outArg, ...kw] = process.argv;
const timeMs = Number(timeStr ?? '2500');
const out = outArg ?? '/home/dell/Sync/QuranPoster/work/frame-debug.png';

const MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
function words(arabic: string, s: number, e: number): SceneAyah['words'] {
  const ws = arabic.trim().split(/\s+/).filter(Boolean);
  const wt = ws.map((w) => Math.max(1, w.replace(MARKS, '').length));
  const total = wt.reduce((a, b) => a + b, 0) || 1;
  let c = s;
  return ws.map((t, i) => { const d = ((e - s) * wt[i]) / total; const st = c; c += d; return { t, s: Math.round(st), e: Math.round(c) }; });
}

const reel = JSON.parse(await readFile(irPath, 'utf8')) as ReelJob;
const F = (f: string) => join(process.cwd(), 'assets/fonts', f);
const b64 = (f: string) => readFile(F(f)).then((b) => b.toString('base64'));
const [arefRegular, arefBold, reemBase64, ubuntuRegular, ubuntuMedium, ubuntuItalic] = await Promise.all([
  b64('ArefRuqaa-Regular.ttf'), b64('ArefRuqaa-Bold.ttf'), b64('ReemKufiFun.ttf'),
  b64('Ubuntu-Regular.ttf'), b64('Ubuntu-Medium.ttf'), b64('Ubuntu-Italic.ttf'),
]);

const ayahs: SceneAyah[] = reel.ayahs.map((a) => ({
  words: words(a.arabic, a.startMs, a.endMs), translation: a.translation,
  numArabic: toArabicDigits(a.ayah), startMs: a.startMs, endMs: a.endMs,
}));

const background = await resolveBackground(kw, 'auto', 7);
const logoB64 = await readFile(join(process.cwd(), 'assets/logo.png')).then((b) => b.toString('base64')).catch(() => '');
const html = buildScene({
  arefRegular, arefBold, reemBase64, ubuntuRegular, ubuntuMedium, ubuntuItalic, background,
  surahName: reel.surahName, surahEnglishName: reel.surahEnglishName,
  ayahRangeLabel: reel.ayahFrom === reel.ayahTo ? `Ayah ${reel.ayahFrom}` : `Ayah ${reel.ayahFrom}–${reel.ayahTo}`,
  reciterName: reel.reciterName || 'Reciter', showBasmala: reel.hasBasmala, ayahs,
  durationMs: reel.durationMs, outroMs: 4200,
  logoDataUri: logoB64 ? 'data:image/png;base64,' + logoB64 : undefined,
  handle: '@eQurany', showWatermark: false,
  outroText: 'اللّهم صلِّ وسلّم وبارك على سيدنا محمد وعلى آله وصحبه أجمعين',
  seed: 7,
});

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => (document as any).fonts.ready);
await page.evaluate(() => (window as any).__setup());
await page.evaluate((t) => (window as any).__setTime(t), timeMs);
await page.screenshot({ path: out, type: 'png' });
await browser.close();
console.log('wrote', out);
