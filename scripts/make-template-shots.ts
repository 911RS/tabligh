/**
 * Render one real frame per template and save it for the website.
 *
 * The site used to draw its template previews by hand in CSS, which meant they
 * drifted from what the renderer actually produces — the worst kind of preview,
 * because it promises something the product does not deliver. These frames come
 * out of `buildScene`, the same function the video pipeline uses, so they cannot
 * drift by construction: re-run this after any change to scene.ts.
 *
 *   npx tsx scripts/make-template-shots.ts
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import puppeteer from 'puppeteer';
import { buildScene, toArabicDigits, type SceneAyah } from '../src/render/scene.js';
import { TEMPLATES, type Template } from '../src/store/store.js';
import { resolveBackground } from '../src/render/background.js';

const ROOT = process.cwd();
const FONT = (f: string) => join(ROOT, 'assets/fonts', f);
const OUT = join(ROOT, 'web/public/templates');

/** Al-Ikhlas 112:1 — short, universally recognised, and it fits one line. */
const ARABIC = 'قُلْ هُوَ ٱللَّهُ أَحَدٌ';
const TRANSLATION = 'Say, "He is Allah, [who is] One"';
const DURATION_MS = 6000;

/** Split the ayah across its words by letter weight, as the renderer does. */
function words(): SceneAyah['words'] {
  const parts = ARABIC.trim().split(/\s+/);
  const weights = parts.map((w) => Math.max(1, w.replace(/[ؐ-ٟـ]/g, '').length));
  const total = weights.reduce((a, b) => a + b, 0);
  let cursor = 0;
  return parts.map((t, i) => {
    const dur = (DURATION_MS * weights[i]) / total;
    const s = cursor;
    cursor += dur;
    return { t, s: Math.round(s), e: Math.round(cursor) };
  });
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const [arefRegular, arefBold, madaBold, reemBase64, ubuntuRegular, ubuntuMedium, ubuntuItalic] =
    await Promise.all(
      [
        'ArefRuqaa-Regular.ttf', 'ArefRuqaa-Bold.ttf', 'Mada-Bold.ttf', 'ReemKufiFun.ttf',
        'Ubuntu-Regular.ttf', 'Ubuntu-Medium.ttf', 'Ubuntu-Italic.ttf',
      ].map((f) => readFile(FONT(f)).then((b) => b.toString('base64'))),
    );

  const logoDataUri = await readFile(join(ROOT, 'assets/logo.png'))
    .then((b) => `data:image/png;base64,${b.toString('base64')}`)
    .catch(() => undefined);

  // A real background if keys are configured; the seeded gradient otherwise —
  // both are genuine renderer output.
  const background = await resolveBackground(['mosque dome blue sky architecture'], 'auto', 3);

  const ayah: SceneAyah = {
    words: words(),
    translation: TRANSLATION,
    numArabic: toArabicDigits(1),
    startMs: 0,
    endMs: DURATION_MS,
  };

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const blank: SceneAyah = { words: [{ t: '\u00a0', s: 0, e: DURATION_MS }], translation: '', numArabic: '', startMs: 0, endMs: DURATION_MS };

  try {
    for (const template of TEMPLATES as Template[]) {
      for (const plate of [false, true]) {
      const html = buildScene({
        arefRegular, arefBold, madaBold, reemBase64, ubuntuRegular, ubuntuMedium, ubuntuItalic,
        background,
        surahName: plate ? '' : 'سُورَةُ الإِخْلَاصِ',
        surahEnglishName: plate ? '' : 'Al-Ikhlaas',
        ayahRangeLabel: plate ? '' : 'Ayah 1',
        reciterName: plate ? '' : 'Mahmoud Khalil Al-Husary',
        showBasmala: false,
        ayahs: [plate ? blank : ayah],
        durationMs: DURATION_MS,
        outroMs: 0,
        logoDataUri,
        handle: undefined,
        showWatermark: false,
        fillColor: '#ffffff',
        karaoke: true,
        particles: true,
        bgAnimation: true,
        projectCredit: false,
        template,
        seed: 7,
      });

      const page = await browser.newPage();
      // MUST be 1080x1920 CSS pixels: scene.ts lays out in fixed px sized for a
      // 1080-wide frame, so shrinking the viewport scales all the type wrong.
      await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
      await page.setContent(html, { waitUntil: 'load' });
      await page.evaluate(() => (document as any).fonts.ready);
      await page.evaluate(() => (window as any).__setup());
      // Two thirds through: most of the ayah is lit, so the karaoke is visible.
      await page.evaluate((ms) => (window as any).__setTime(ms), DURATION_MS * 0.66);

      const buf = await page.screenshot({ type: 'jpeg', quality: 90 });
      const name = plate ? `${template}-plate.jpg` : `${template}.jpg`;
      await writeFile(join(OUT, name), buf);
      console.log(`web/public/templates/${name}`);
      await page.close();
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
