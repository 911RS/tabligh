import type { Background } from './background.js';

export interface AyahCardParams {
  arabic: string;
  translation: string;
  surah: number;
  ayah: number;
  /** Base64 (no prefix) of the Amiri Quran TTF, embedded as @font-face. */
  fontBase64: string;
  background: Background;
  /** Show a small Basmala header above the ayah (untimed decoration). */
  showBasmala: boolean;
  /** Initial Arabic font size in px; still.ts may shrink it to fit. */
  arabicFontPx?: number;
}

const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const toArabicDigits = (n: number) => String(n).split('').map((d) => AR_DIGITS[+d] ?? d).join('');

const BASMALA = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Full self-contained HTML page for one ayah card, 1080×1920. */
export function buildAyahCard(p: AyahCardParams): string {
  const fs = p.arabicFontPx ?? 78;
  const bgLayer =
    p.background.kind === 'image'
      ? `background-image:${p.background.css};background-size:cover;background-position:center;`
      : `background:${p.background.css};`;

  return `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"/>
<style>
@font-face{
  font-family:'Amiri Quran';
  src:url(data:font/ttf;base64,${p.fontBase64}) format('truetype');
  font-weight:normal;font-style:normal;font-display:block;
}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden}
.bg{position:absolute;inset:0;${bgLayer}}
/* Legibility scrim: darker toward the center where text sits */
.scrim{position:absolute;inset:0;
  background:
    radial-gradient(120% 70% at 50% 45%, rgba(0,0,0,.15) 0%, rgba(0,0,0,.62) 70%, rgba(0,0,0,.78) 100%),
    linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 78%, rgba(0,0,0,.45) 100%);
}
.wrap{position:absolute;inset:0;display:flex;flex-direction:column;
  align-items:center;justify-content:center;padding:120px 96px;gap:56px;text-align:center}
.basmala{font-family:'Amiri Quran',serif;color:#e9f7ef;font-size:46px;opacity:.85;
  text-shadow:0 2px 18px rgba(0,0,0,.6)}
.ayah{font-family:'Amiri Quran',serif;color:#fff;font-size:${fs}px;line-height:2.05;
  direction:rtl;text-shadow:0 3px 26px rgba(0,0,0,.65);max-width:960px}
.badge{display:inline-flex;align-items:center;justify-content:center;
  min-width:64px;height:64px;padding:0 18px;border-radius:999px;
  border:2px solid rgba(255,255,255,.55);color:#eafff2;
  font-family:'Amiri Quran',serif;font-size:34px;
  background:rgba(255,255,255,.06);backdrop-filter:blur(2px)}
.tr{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;color:#e8eef2;
  font-size:38px;line-height:1.5;opacity:.94;max-width:820px;
  text-shadow:0 2px 16px rgba(0,0,0,.6);font-weight:400}
.foot{position:absolute;bottom:72px;left:0;right:0;text-align:center;
  font-family:'Segoe UI',system-ui,sans-serif;color:rgba(255,255,255,.75);
  font-size:30px;letter-spacing:1px}
.divider{width:120px;height:2px;background:rgba(255,255,255,.35);border-radius:2px}
</style></head>
<body>
  <div class="bg"></div>
  <div class="scrim"></div>
  <div class="wrap">
    ${p.showBasmala ? `<div class="basmala" dir="rtl">${esc(BASMALA)}</div>` : ''}
    <div class="badge" dir="rtl">${toArabicDigits(p.ayah)}</div>
    <div class="ayah" id="ayah" dir="rtl">${esc(p.arabic)}</div>
    ${p.translation ? `<div class="divider"></div><div class="tr" dir="ltr">${esc(p.translation)}</div>` : ''}
  </div>
  <div class="foot" dir="ltr">${p.surah}:${p.ayah}</div>
</body></html>`;
}
