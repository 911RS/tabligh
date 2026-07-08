import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import puppeteer, { type Browser } from 'puppeteer';
import { env } from '../config.js';
import { log } from '../util/log.js';
import type { ReelJob } from '../types.js';
import type { Background } from './background.js';
import { buildAyahCard } from './html.js';

const W = 1080;
const H = 1920;

/** Render one 1080×1920 PNG per ayah. Returns the PNG paths in ayah order. */
export async function renderStills(
  reel: ReelJob,
  background: Background,
): Promise<string[]> {
  const framesDir = join(reel.workDir, 'stills');
  await mkdir(framesDir, { recursive: true });

  const fontBase64 = (await readFile(join(process.cwd(), 'assets/fonts/AmiriQuran-Regular.ttf'))).toString('base64');

  const browser: Browser = await puppeteer.launch({
    headless: true,
    executablePath: env.puppeteerExecutablePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
      '--no-zygote',
    ],
  });

  const paths: string[] = [];
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });

    for (let i = 0; i < reel.ayahs.length; i++) {
      const a = reel.ayahs[i];
      const html = buildAyahCard({
        arabic: a.arabic,
        translation: a.translation,
        surah: a.surah,
        ayah: a.ayah,
        fontBase64,
        background,
        showBasmala: i === 0 && reel.hasBasmala,
        arabicFontPx: 82,
      });
      await page.setContent(html, { waitUntil: 'load' });
      // Font is embedded (font-display:block); make sure it's ready before shots.
      await page.evaluate(() => (document as any).fonts.ready);

      // Auto-shrink Arabic so long ayahs never overflow the safe area.
      await page.evaluate(() => {
        const el = document.getElementById('ayah') as HTMLElement | null;
        const wrap = el?.parentElement as HTMLElement | null;
        if (!el || !wrap) return;
        const maxH = 1920 * 0.62;
        let fs = parseFloat(getComputedStyle(el).fontSize);
        let guard = 40;
        while (wrap.scrollHeight > maxH && fs > 34 && guard-- > 0) {
          fs -= 3;
          el.style.fontSize = `${fs}px`;
        }
      });

      const out = join(framesDir, `ayah-${String(i).padStart(3, '0')}.png`);
      await page.screenshot({ path: out, type: 'png' });
      paths.push(out);
      log.step(`Rendered still ${a.key}`);
    }
  } finally {
    await browser.close();
  }
  return paths;
}
