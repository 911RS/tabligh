import { mkdir, readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import puppeteer, { type Browser } from 'puppeteer';
import { env } from '../config.js';
import { settings } from '../store/store.js';
import { log } from '../util/log.js';
import type { ReelJob } from '../types.js';
import type { Background } from './background.js';
import { buildScene, toArabicDigits, type SceneAyah } from './scene.js';

const W = 1080;
const H = 1920;
export const FPS = 25;
/** Silent outro tail: content→black, logo+ṣalawāt fade in, HOLD, then fade out. */
export const OUTRO_MS = 4200;

const FONT = (f: string) => join(process.cwd(), 'assets/fonts', f);

async function exists(p: string): Promise<boolean> {
  try { await access(p); return true; } catch { return false; }
}

// Combining marks / tatweel — removed only for weighting word length.
const MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;

/**
 * Approximate per-word timing by splitting the ayah's exact [start,end] across
 * its words, weighted by base-letter count. Not forced-alignment, but a cheap,
 * dependency-free karaoke sync that reads well for short passages.
 */
function computeWordTimings(arabic: string, startMs: number, endMs: number): SceneAyah['words'] {
  const words = arabic.trim().split(/\s+/).filter(Boolean);
  const weights = words.map((w) => Math.max(1, w.replace(MARKS, '').length));
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const span = endMs - startMs;
  let cursor = startMs;
  return words.map((t, i) => {
    const dur = (span * weights[i]) / total;
    const s = cursor;
    cursor += dur;
    return { t, s: Math.round(s), e: Math.round(cursor) };
  });
}

export interface FrameRenderOpts {
  background: Background;
  handle?: string;
  seed: number;
}

/** Render the animated scene to a JPEG frame sequence. Returns { dir, frameCount }. */
export async function renderFrames(
  reel: ReelJob,
  opts: FrameRenderOpts,
): Promise<{ dir: string; frameCount: number }> {
  const framesDir = join(reel.workDir, 'frames');
  await mkdir(framesDir, { recursive: true });

  const [arefRegular, arefBold, madaBold, reemBase64, ubuntuRegular, ubuntuMedium, ubuntuItalic] = await Promise.all([
    readFile(FONT('ArefRuqaa-Regular.ttf')).then((b) => b.toString('base64')),
    readFile(FONT('ArefRuqaa-Bold.ttf')).then((b) => b.toString('base64')),
    readFile(FONT('Mada-Bold.ttf')).then((b) => b.toString('base64')),
    readFile(FONT('ReemKufiFun.ttf')).then((b) => b.toString('base64')),
    readFile(FONT('Ubuntu-Regular.ttf')).then((b) => b.toString('base64')),
    readFile(FONT('Ubuntu-Medium.ttf')).then((b) => b.toString('base64')),
    readFile(FONT('Ubuntu-Italic.ttf')).then((b) => b.toString('base64')),
  ]);

  // Optional watermark logo (assets/logo.png)
  const logoPath = join(process.cwd(), 'assets/logo.png');
  const logoDataUri = (await exists(logoPath))
    ? `data:image/png;base64,${(await readFile(logoPath)).toString('base64')}`
    : undefined;

  const sceneAyahs: SceneAyah[] = reel.ayahs.map((a) => ({
    words: computeWordTimings(a.arabic, a.startMs, a.endMs),
    translation: a.translation,
    numArabic: a.ayah === 0 ? '' : toArabicDigits(a.ayah),
    startMs: a.startMs,
    endMs: a.endMs,
  }));

  const rangeLabel =
    reel.ayahFrom === reel.ayahTo
      ? `Ayah ${reel.ayahFrom}`
      : `Ayah ${reel.ayahFrom}–${reel.ayahTo}`;

  const html = buildScene({
    arefRegular,
    arefBold,
    madaBold,
    reemBase64,
    ubuntuRegular,
    ubuntuMedium,
    ubuntuItalic,
    background: opts.background,
    surahName: reel.surahName,
    surahEnglishName: reel.surahEnglishName,
    ayahRangeLabel: rangeLabel,
    reciterName: reel.reciterName,
    showBasmala: reel.hasBasmala,
    ayahs: sceneAyahs,
    durationMs: reel.durationMs,
    outroMs: OUTRO_MS,
    logoDataUri,
    handle: opts.handle,
    showWatermark: settings().branding.watermarkEnabled,
    fillColor: settings().branding.textFillColor,
    karaoke: settings().branding.karaokeEnabled,
    particles: settings().branding.particlesEnabled,
    bgAnimation: settings().branding.bgAnimationEnabled,
    projectCredit: settings().branding.projectCreditEnabled,
    template: settings().branding.template,
    seed: opts.seed,
  });

  const frameCount = Math.ceil(((reel.durationMs + OUTRO_MS) / 1000) * FPS);

  const browser: Browser = await puppeteer.launch({
    headless: true,
    executablePath: env.puppeteerExecutablePath,
    protocolTimeout: 300000,
    // NOTE: no --single-process/--no-zygote — they crash the Debian system
    // Chromium ("Failed to launch the browser process"). These flags are stable.
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--disable-software-rasterizer', '--no-first-run'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => (document as any).fonts.ready);
    await page.evaluate(() => (window as any).__setup());

    let lastPct = -1;
    for (let f = 0; f < frameCount; f++) {
      const ms = (f / FPS) * 1000;
      await page.evaluate((t) => (window as any).__setTime(t), ms);
      await page.screenshot({
        path: join(framesDir, `frame-${String(f).padStart(5, '0')}.jpg`),
        type: 'jpeg',
        quality: 92,
      });
      const pct = Math.floor(((f + 1) / frameCount) * 100);
      if (pct >= lastPct + 20) { log.step(`Frames ${pct}%`); lastPct = pct; }
    }
  } finally {
    await browser.close();
  }

  log.ok(`Rendered ${frameCount} frames @ ${FPS}fps`);
  return { dir: framesDir, frameCount };
}
