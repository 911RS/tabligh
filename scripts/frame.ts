/**
 * Debug helper: render ONE frame of the animated scene at a given time, fast.
 *   npx tsx scripts/frame.ts <ir.json> <timeMs> [out.png]
 * Lets us iterate on visuals without encoding a full video.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import puppeteer from 'puppeteer';
import { buildScene, toArabicDigits, type SceneAyah } from '../src/render/scene.js';
import { resolveBackground } from '../src/render/background.js';
import type { ReelJob } from '../src/types.js';

const [, , irPath, timeStr, outArg] = process.argv;
const timeMs = Number(timeStr ?? '2500');
const out = outArg ?? '/home/dell/Sync/QuranPoster/work/frame-debug.png';

const reel = JSON.parse(await readFile(irPath, 'utf8')) as ReelJob;
const F = (f: string) => join(process.cwd(), 'assets/fonts', f);
const b64 = (f: string) => readFile(F(f)).then((b) => b.toString('base64'));

const [reemBase64, ubuntuRegular, ubuntuMedium, ubuntuBold, ubuntuItalic] = await Promise.all([
  b64('ReemKufiFun.ttf'), b64('Ubuntu-Regular.ttf'), b64('Ubuntu-Medium.ttf'),
  b64('Ubuntu-Bold.ttf'), b64('Ubuntu-Italic.ttf'),
]);

const ayahs: SceneAyah[] = reel.ayahs.map((a) => ({
  arabic: a.arabic, translation: a.translation, numArabic: toArabicDigits(a.ayah),
  startMs: a.startMs, endMs: a.endMs,
}));

const background = await resolveBackground([], 'auto', 42);
const html = buildScene({
  reemBase64, ubuntuRegular, ubuntuMedium, ubuntuBold, ubuntuItalic, background,
  surahName: reel.surahName, surahEnglishName: reel.surahEnglishName,
  ayahRangeLabel: reel.ayahFrom === reel.ayahTo ? `Ayah ${reel.ayahFrom}` : `Ayah ${reel.ayahFrom}–${reel.ayahTo}`,
  showBasmala: reel.hasBasmala, ayahs, durationMs: reel.durationMs,
  handle: '@quran.reels', seed: 42,
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
