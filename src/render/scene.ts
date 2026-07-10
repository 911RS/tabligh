import type { Background } from './background.js';
import type { Template } from '../store/store.js';

/** The outro sign-off — a ṣalawāt upon the Prophet ﷺ. Fixed by design; the
 * project intentionally exposes no way for users to change or remove it. */
const OUTRO_SALAWAT = 'اللّهم صلِّ وسلّم وبارك على سيدنا محمد وعلى آله وصحبه أجمعين';

export interface KaraokeWord {
  t: string;
  /** absolute ms in the concatenated audio */
  s: number;
  e: number;
}

export interface SceneAyah {
  words: KaraokeWord[];
  translation: string;
  numArabic: string;
  startMs: number;
  endMs: number;
}

export interface SceneParams {
  arefRegular: string;
  arefBold: string;
  /** Mada (variable) — used for the ayah body text. */
  madaBold: string;
  /** Reem Kufi Fun — used for the outro ṣalawāt sign-off. */
  reemBase64: string;
  ubuntuRegular: string;
  ubuntuMedium: string;
  ubuntuItalic: string;
  background: Background;
  surahName: string;
  surahEnglishName: string;
  ayahRangeLabel: string;
  reciterName: string;
  showBasmala: boolean;
  ayahs: SceneAyah[];
  durationMs: number;
  outroMs: number;
  logoDataUri?: string;
  handle?: string;
  /** Show the top-right corner watermark (outro sign-off is always shown). */
  showWatermark: boolean;
  /** Color of already-recited (filled) karaoke text. */
  fillColor: string;
  /** Word-by-word karaoke fill (else the ayah shows fully filled). */
  karaoke: boolean;
  /** Drifting particle glints. */
  particles: boolean;
  /** Animated background zoom/breathing. */
  bgAnimation: boolean;
  /** Show the "Check the Tabligh project" line (the github link is always shown). */
  projectCredit: boolean;
  /** Visual template — swaps a CSS theme over the same DOM/animation. */
  template: Template;
  seed: number;
}

/**
 * Per-template CSS overrides, appended AFTER the base rules so equal-specificity
 * selectors win. The DOM and the animation JS are identical across templates —
 * only the look changes. `classic` returns nothing (base styles stand).
 */
function themeCss(p: SceneParams): string {
  if (p.template === 'glass') {
    return `
/* ── Glassmorphism · ONE persistent frosted card; only the ayah swaps ────── */
.scrim{background:
  radial-gradient(140% 70% at 50% 44%, rgba(4,7,10,.16) 0%, rgba(4,7,10,.44) 60%, rgba(3,5,8,.78) 100%),
  linear-gradient(180deg, rgba(3,5,8,.5) 0%, rgba(3,5,8,.16) 30%, rgba(3,5,8,.3) 64%, rgba(3,5,8,.8) 100%)}
/* The safe area IS the single card. Header, ayah and reciter all live inside it;
   as ayahs advance only the text inside changes — the card never moves.
   Plain, normal glassmorphism: frosted translucent panel + blur + 1px light
   border + soft shadow. No specular sheen / liquid-glass highlights. */
.safe{border-radius:48px;overflow:hidden;
  background:rgba(255,255,255,.11);
  -webkit-backdrop-filter:blur(26px) saturate(130%);backdrop-filter:blur(26px) saturate(130%);
  border:1px solid rgba(255,255,255,.24);
  box-shadow:0 30px 80px rgba(0,0,0,.42)}
/* One card → no top progress line, no per-ayah card, no pills. */
.ptrack,.pfill{display:none}
.body{background:none;-webkit-backdrop-filter:none;backdrop-filter:none;border:none;box-shadow:none;padding:0;max-width:none}
.body::before{display:none}
/* Lay out the three zones inside the card, each with its own breathing room, and
   inset them from the frosted border so text never crowds the edge. */
.header,.stage,.footer,.wave{left:56px;right:56px}
.header{top:64px}
.stage{top:330px;bottom:360px}
.footer{bottom:46px}
.artext{max-width:760px}
.trtext{max-width:740px}
.sname{color:#fff}
.num{background:rgba(255,255,255,.88);color:#12161f;border:1px solid #fff;
  box-shadow:0 6px 18px rgba(0,0,0,.3), inset 0 1px 0 #fff}
.artext{filter:drop-shadow(0 3px 22px rgba(0,0,0,.6))}
.w{--off:rgba(255,255,255,.5)}
.trtext{color:rgba(255,255,255,.96);text-shadow:0 2px 14px rgba(0,0,0,.6)}
/* Dynamic waveform (bars pulse in __setTime and fill with progress). */
.wave{position:absolute;left:110px;right:110px;bottom:248px;height:54px;display:flex;align-items:flex-end;
  justify-content:center;gap:6px;direction:ltr}
.wave span{flex:0 0 5px;border-radius:3px;background:#fff;box-shadow:0 0 8px rgba(255,255,255,.35);
  transform-origin:center bottom;opacity:.3}`;
  }
  if (p.template === 'noor') {
    return `
/* ── Noor · Divine Light ───────────────────────────────────────────────── */
/* Warm, reverent, illuminated-manuscript feel: a soft golden halo behind the
   ayah, gilded numerals, hairline gold rules. */
.scrim{background:
  radial-gradient(120% 56% at 50% 42%, rgba(214,178,84,.14) 0%, rgba(6,8,12,.55) 52%, rgba(2,4,7,.92) 100%),
  linear-gradient(180deg, rgba(2,4,7,.86) 0%, rgba(2,4,7,.38) 26%, rgba(2,4,7,.5) 60%, rgba(2,4,7,.94) 100%)}
.ayah{display:flex;justify-content:center;align-items:center}
.body{position:relative;max-width:900px;padding:56px 44px}
.body::before{content:'';position:absolute;left:50%;top:50%;width:780px;height:540px;
  transform:translate(-50%,-50%);z-index:-1;pointer-events:none;filter:blur(24px);
  background:radial-gradient(ellipse at center, rgba(232,204,128,.30) 0%, rgba(232,204,128,.07) 46%, transparent 72%)}
.sname{color:#f4e8c6;filter:drop-shadow(0 0 18px rgba(214,178,84,.35)) drop-shadow(0 2px 12px rgba(0,0,0,.7))}
.meta{color:rgba(232,204,128,.9);border-top:1px solid rgba(232,204,128,.35);border-bottom:1px solid rgba(232,204,128,.35);
  display:inline-block;padding:8px 26px;margin-top:16px}
.basmala{color:#f4e8c6}
.num{background:linear-gradient(150deg,#f6e6ac 0%,#d6b254 60%,#b8922f 100%);color:#2a2205;
  border:1px solid rgba(255,244,208,.7);box-shadow:0 0 26px rgba(214,178,84,.55),0 4px 18px rgba(0,0,0,.5)}
.artext{color:#fdf7e6;filter:drop-shadow(0 0 30px rgba(214,178,84,.4)) drop-shadow(0 3px 16px rgba(0,0,0,.8))}
.w{--off:rgba(253,247,230,.4)}
.trtext{font-style:italic;color:rgba(253,247,230,.95)}
.footer .lbl{color:rgba(232,204,128,.85);letter-spacing:3px;text-transform:uppercase;font-size:24px}
.footer b{color:#f4e8c6}`;
  }
  return '';
}

const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
export const toArabicDigits = (n: number) =>
  String(n).split('').map((d) => AR_DIGITS[+d] ?? d).join('');

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// TikTok-safe band (1080×1920). Right rail + bottom caption cleared.
const SAFE = { top: 190, bottom: 400, side: 96 };

/** Build the animated cinematic scene. Exposes window.__setup / __setTime(ms). */
export function buildScene(p: SceneParams): string {
  const bgLayer =
    p.background.kind === 'image'
      ? `background-image:${p.background.css};background-size:cover;background-position:center;`
      : `background:${p.background.css};`;

  const ayahLayers = p.ayahs
    .map((a, i) => {
      const words = a.words
        .map((w) => `<span class="w" data-s="${w.s}" data-e="${w.e}">${esc(w.t)}</span>`)
        .join(' ');
      return `
    <div class="ayah" data-i="${i}" data-start="${a.startMs}" data-end="${a.endMs}">
      <div class="body">
        ${a.numArabic ? `<div class="num">${esc(a.numArabic)}</div>` : ''}
        <div class="artext" dir="rtl">${words}</div>
        ${a.translation ? `<div class="trtext" dir="ltr">${esc(a.translation)}</div>` : ''}
      </div>
    </div>`;
    })
    .join('');

  const watermark = !p.showWatermark
    ? ''
    : p.logoDataUri
      ? `<img class="wm-logo" src="${p.logoDataUri}" alt=""/>`
      : p.handle
        ? `<div class="wm-handle" dir="ltr">${esc(p.handle)}</div>`
        : '';

  const cfg = { duration: p.durationMs, outro: p.outroMs, seed: p.seed, count: p.ayahs.length, karaoke: p.karaoke, particles: p.particles, bgAnimation: p.bgAnimation };
  // Glass template signature: an audio waveform that doubles as the progress bar.
  // Bar heights are RANDOM per video (seeded), so every reel gets a unique wave;
  // they fill left→right with the recitation progress (driven in __setTime).
  let wseed = (p.seed >>> 0) || 1;
  const wrand = () => {
    wseed = (wseed + 0x6d2b79f5) >>> 0;
    let t = Math.imul(wseed ^ (wseed >>> 15), 1 | wseed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const waveHtml =
    p.template === 'glass'
      ? `<div class="wave" id="wave">${Array.from({ length: 52 }, () => `<span style="height:${12 + Math.round(82 * wrand())}%"></span>`).join('')}</div>`
      : '';
  // Outro card: logo (only when the logo/watermark is enabled) stacked above the
  // ṣalawāt text; both centered. With the logo off, the ṣalawāt shows alone.
  // A small project credit sits subtly beneath it.
  const ghIcon = `<svg class="gh" viewBox="0 0 16 16" width="34" height="34" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>`;
  const endCardInner =
    (p.showWatermark && p.logoDataUri ? `<img class="end-logo eo" src="${p.logoDataUri}" alt=""/>` : '') +
    `<div class="end-text eo" dir="rtl">${esc(OUTRO_SALAWAT)}</div>` +
    `<div class="end-foot${p.projectCredit ? '' : ' compact'}" dir="ltr">
       <div class="end-sep eo"></div>
       ${p.projectCredit ? `<div class="end-project eo">Check the <b>Tabligh</b> project</div>` : ''}
       <div class="end-credit eo">${ghIcon}<span>github.com/911RS/tabligh</span></div>
     </div>`;

  return `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"/>
<style>
@font-face{font-family:'Aref';src:url(data:font/ttf;base64,${p.arefRegular}) format('truetype');font-weight:400;font-display:block}
@font-face{font-family:'Aref';src:url(data:font/ttf;base64,${p.arefBold}) format('truetype');font-weight:700;font-display:block}
@font-face{font-family:'Mada';src:url(data:font/ttf;base64,${p.madaBold}) format('truetype');font-weight:300 900;font-display:block}
@font-face{font-family:'Kufi';src:url(data:font/ttf;base64,${p.reemBase64}) format('truetype');font-weight:400 700;font-display:block}
@font-face{font-family:'Ubuntu';src:url(data:font/ttf;base64,${p.ubuntuRegular}) format('truetype');font-weight:400;font-display:block}
@font-face{font-family:'Ubuntu';src:url(data:font/ttf;base64,${p.ubuntuMedium}) format('truetype');font-weight:500;font-display:block}
@font-face{font-family:'Ubuntu';src:url(data:font/ttf;base64,${p.ubuntuItalic}) format('truetype');font-weight:400;font-style:italic;font-display:block}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;background:#05070a}
.bg{position:absolute;inset:-8%;${bgLayer}will-change:transform}
/* Strong cinematic overlay so white text stays readable on any photo */
.scrim{position:absolute;inset:0;background:
  radial-gradient(135% 62% at 50% 48%, rgba(4,7,10,.30) 0%, rgba(4,7,10,.62) 58%, rgba(3,5,8,.86) 100%),
  linear-gradient(180deg, rgba(3,5,8,.78) 0%, rgba(3,5,8,.34) 22%, rgba(3,5,8,.44) 58%, rgba(3,5,8,.86) 100%)}
.particles{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.p{position:absolute;left:0;top:0;border-radius:50%;background:#fff;
  box-shadow:0 0 4px rgba(255,255,255,.5);will-change:transform,opacity}
.ptrack{position:absolute;top:0;left:0;right:0;height:6px;background:rgba(255,255,255,.14)}
.pfill{position:absolute;top:0;left:0;height:6px;width:0;background:${p.fillColor};box-shadow:0 0 12px ${p.fillColor}}
.safe{position:absolute;left:${SAFE.side}px;right:${SAFE.side}px;top:${SAFE.top}px;bottom:${SAFE.bottom}px}
/* Header */
.header{position:absolute;top:0;left:0;right:0;text-align:center}
.sname{font-family:'Aref';font-weight:700;font-size:58px;color:#fff;direction:rtl;
  filter:drop-shadow(0 2px 14px rgba(0,0,0,.75))}
.meta{font-family:'Ubuntu';font-weight:500;letter-spacing:4px;text-transform:uppercase;
  font-size:26px;color:rgba(255,255,255,.85);margin-top:12px;text-shadow:0 2px 10px rgba(0,0,0,.7)}
.basmala{font-family:'Aref';font-weight:400;font-size:40px;color:rgba(255,255,255,.9);margin-top:18px;
  direction:rtl;filter:drop-shadow(0 2px 12px rgba(0,0,0,.7))}
/* Ayah stage (reserves room below header, above footer — never overlaps) */
.stage{position:absolute;left:0;right:0;top:300px;bottom:120px}
.ayah{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);opacity:0;will-change:opacity}
.body{display:flex;flex-direction:column;align-items:center;gap:44px}
/* Elements start hidden; setTime fades them in one-by-one (staggered). */
.num,.artext,.trtext{opacity:0;will-change:opacity,transform}
.num{width:82px;height:82px;border-radius:50%;display:grid;place-items:center;
  background:rgba(255,255,255,.95);color:#0c0f14;font-family:'Aref';font-weight:700;font-size:36px;
  box-shadow:0 4px 18px rgba(0,0,0,.5)}
.artext{font-family:'Mada';font-weight:700;font-size:132px;line-height:1.65;text-align:center;direction:rtl;
  filter:drop-shadow(0 3px 20px rgba(0,0,0,.85))}
/* Karaoke word fill: bright already-recited part, dim upcoming (RTL: fills from right) */
.w{color:transparent;background-image:linear-gradient(to left, var(--on) var(--f,0%), var(--off) var(--f,0%));
  -webkit-background-clip:text;background-clip:text;--on:${p.fillColor};--off:rgba(255,255,255,.42)}
.trtext{font-family:'Ubuntu';font-weight:400;font-size:48px;line-height:1.4;color:rgba(255,255,255,.95);
  text-align:center;max-width:900px;text-shadow:0 2px 14px rgba(0,0,0,.8)}
/* Reciter footer (bottom of safe band) */
.footer{position:absolute;bottom:-78px;left:0;right:0;text-align:center;line-height:1.5;
  font-family:'Ubuntu';font-weight:500;font-size:30px;color:rgba(255,255,255,.82);
  text-shadow:0 2px 10px rgba(0,0,0,.7)}
.footer .mic{display:block;width:36px;height:36px;margin:0 auto 10px}
.footer .lbl{display:block;opacity:.85}
.footer b{display:block;font-weight:700;font-size:38px;color:#fff;margin-top:6px}
/* Watermark PNG top-right (outside safe zone, above TikTok buttons) */
.wm{position:absolute;top:130px;right:44px;display:flex;align-items:center;z-index:5}
.wm-logo{height:150px;width:auto;opacity:.97;filter:drop-shadow(0 3px 14px rgba(0,0,0,.65))}
.wm-handle{font-family:'Ubuntu';font-weight:600;letter-spacing:2px;font-size:28px;color:rgba(255,255,255,.9);text-shadow:0 2px 10px rgba(0,0,0,.7)}
/* Outro: fade whole video to black + centered logo sign-off */
.veil{position:absolute;inset:0;background:#000;opacity:0;z-index:20;pointer-events:none}
.endcard{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;
  justify-content:center;gap:44px;opacity:0;z-index:21;pointer-events:none}
.end-logo{width:300px;height:auto;filter:drop-shadow(0 6px 30px rgba(0,0,0,.6))}
.end-text{font-family:'Kufi';font-weight:600;font-size:50px;line-height:1.9;color:#fff;text-align:center;
  direction:rtl;max-width:820px;padding:0 70px;filter:drop-shadow(0 3px 18px rgba(0,0,0,.7))}
.eo{opacity:0;will-change:opacity,transform,filter}
.end-foot{display:flex;flex-direction:column;align-items:center;gap:18px;margin-top:8px}
.end-sep{width:170px;height:3px;border-radius:3px;background:linear-gradient(90deg,transparent,${p.fillColor},transparent);opacity:.8}
.end-project{font-family:'Ubuntu';font-weight:500;font-size:36px;color:rgba(255,255,255,.78);letter-spacing:.3px}
.end-project b{color:${p.fillColor};font-weight:700}
.end-credit{display:flex;align-items:center;gap:14px;font-family:'Ubuntu';font-weight:500;font-size:32px;
  letter-spacing:.6px;color:rgba(255,255,255,.82);filter:drop-shadow(0 2px 8px rgba(0,0,0,.6))}
.end-credit .gh{width:1.06em;height:1.06em;opacity:.9;flex:none}
/* Compact (project text hidden): shrink the link a little. */
.end-foot.compact .end-credit{font-size:26px;letter-spacing:.4px}
${themeCss(p)}
</style></head>
<body>
  <div class="bg" id="bg"></div>
  <div class="scrim"></div>
  <div class="particles" id="particles"></div>
  <div class="ptrack"></div><div class="pfill" id="pfill"></div>
  <div class="safe">
    <div class="header">
      <div class="sname" dir="rtl">${esc(p.surahName)}</div>
      <div class="meta">${esc(p.surahEnglishName)} · ${esc(p.ayahRangeLabel)}</div>
      ${p.showBasmala ? `<div class="basmala" dir="rtl">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>` : ''}
    </div>
    <div class="stage" id="stage">${ayahLayers}</div>
    ${waveHtml}
    <div class="footer">
      <svg class="mic" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="17" x2="12" y2="21"/><line x1="8" y1="21" x2="16" y2="21"/></svg>
      <span class="lbl">Recited by</span>
      <b>${esc(p.reciterName)}</b>
    </div>
  </div>
  <div class="wm">${watermark}</div>
  <div class="veil" id="veil"></div>
  <div class="endcard" id="endcard">${endCardInner}</div>
<script>
const CFG = ${JSON.stringify(cfg)};
const F = 300;            // sequential ayah fade in/out (no cross-ayah overlap)
const STAGGER = 260;      // ms between each element's reveal within an ayah
const CHILD_FADE = 460;   // ms for a single element to fade/slide in
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
let particles=[];
window.__setup=function(){
  const rnd=mulberry32(CFG.seed);
  const host=document.getElementById('particles');
  // Sparse & gentle: only ~14 total so 5–15 are ever visible at once.
  for(let i=0;CFG.particles&&i<14;i++){
    const el=document.createElement('div');el.className='p';
    // Small CRISP dots (2–5px), not glowy blobs.
    const size=2+rnd()*3;el.style.width=size+'px';el.style.height=size+'px';
    // Emit from the lower area, biased toward centre; rise only a little (220–640px)
    // then fade out. Staggered lifetimes so a few are always drifting up.
    particles.push({el,x:540+(rnd()-0.5)*880,y0:1560+rnd()*380,rise:220+rnd()*420,life:5+rnd()*5,t0:rnd()*10,sway:8+rnd()*22,swf:0.3+rnd()*0.5,phase:rnd()*6.28,maxOp:0.5+rnd()*0.5});
    host.appendChild(el);
  }
  // Fit: shrink Arabic; if a tall ayah, drop its translation; clamp as last resort.
  const stage=document.getElementById('stage');
  const maxH=stage.clientHeight-14;
  document.querySelectorAll('.ayah .body').forEach((body)=>{
    const ar=body.querySelector('.artext'), tr=body.querySelector('.trtext');
    const fits=()=>body.scrollHeight<=maxH;
    if(ar){let fs=parseFloat(getComputedStyle(ar).fontSize);let g=90;
      while(!fits()&&fs>110&&g-->0){fs-=4;ar.style.fontSize=fs+'px';}
      if(!fits()&&tr){tr.style.display='none';
        while(!fits()&&fs>66&&g-->0){fs-=4;ar.style.fontSize=fs+'px';}}}
    if(tr&&tr.style.display!=='none'){let fs=parseFloat(getComputedStyle(tr).fontSize);let g=40;
      while(!fits()&&fs>30&&g-->0){fs-=2;tr.style.fontSize=fs+'px';}}
    body.dataset.scale=fits()?'1':String(Math.max(0.4,maxH/body.scrollHeight));
  });
};
function envelope(ms,s,e){
  if(ms<s||ms>=e) return 0;
  if(ms<s+F) return (ms-s)/F;
  if(ms>e-F) return (e-ms)/F;
  return 1;
}
window.__setTime=function(ms){
  const dur=CFG.duration, sec=ms/1000;
  // Animated background: a slow cinematic zoom-in plus a gentle breathing pulse
  // (no panning). Overscan (.bg inset) hides the scaled edges.
  const zoom=CFG.bgAnimation ? 1+0.11*(ms/dur)+0.014*Math.sin(sec*0.5) : 1.02;
  document.getElementById('bg').style.transform='scale('+zoom.toFixed(4)+')';
  document.getElementById('pfill').style.width=(Math.min(1,ms/dur)*1080).toFixed(1)+'px';
  // Glass template's waveform doubles as the progress bar: static bar heights,
  // filled left→right as the recitation progresses (played = bright, upcoming = dim).
  const wave=document.getElementById('wave');
  if(wave){const prog=Math.min(1,ms/dur),bars=wave.children,n=bars.length,front=prog*n;
    for(let i=0;i<n;i++){const f=Math.max(0,Math.min(1,front-i));// 0..1 how filled this bar is
      bars[i].style.opacity=(0.22+0.76*f).toFixed(3);}}
  for(const p of particles){
    // Cyclic life 0→1: rises a short way up from its low start, fading in fast then
    // out as it climbs — a soft drift of light rising from the bottom.
    const age=((((sec+p.t0)%p.life)+p.life)%p.life)/p.life;
    const y=p.y0-age*p.rise;
    const x=p.x+Math.sin(sec*p.swf+p.phase)*p.sway;
    const o=age<0.15?age/0.15:Math.max(0,1-(age-0.15)/0.85);
    p.el.style.transform='translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px)';
    p.el.style.opacity=(o*p.maxOp).toFixed(3);
  }
  document.querySelectorAll('.ayah').forEach((el)=>{
    const s=+el.dataset.start, e=+el.dataset.end;
    const o=envelope(ms,s,e);
    const body=el.querySelector('.body');
    el.style.opacity=o.toFixed(3);
    body.style.transform='scale('+(body.dataset.scale||'1')+')';
    if(o<=0.001) return; // skip work for hidden ayahs
    // Staggered fade-in of this ayah's elements: number → ayah → translation.
    const kids=body.children;
    for(let k=0;k<kids.length;k++){
      const sf=Math.max(0,Math.min(1,(ms-s-k*STAGGER)/CHILD_FADE));
      kids[k].style.opacity=sf.toFixed(3);
      kids[k].style.transform='translateY('+((1-sf)*46).toFixed(1)+'px)';
    }
    // Karaoke word fill (RTL right→left). When disabled, show fully filled.
    body.querySelectorAll('.w').forEach((w)=>{
      const ws=+w.dataset.s, we=+w.dataset.e;
      const f=CFG.karaoke ? Math.max(0,Math.min(1,(ms-ws)/Math.max(1,we-ws))) : 1;
      w.style.setProperty('--f',(f*100).toFixed(1)+'%');
    });
  });
  // Outro (silent tail): content → black quickly, corner watermark fades out,
  // then the logo + ṣalawāt fade IN, HOLD for a beat, and finally fade the whole
  // thing OUT to black.
  const safe=document.querySelector('.safe');
  const veil=document.getElementById('veil');
  const ec=document.getElementById('endcard');
  const wm=document.querySelector('.wm');
  const clamp=(x)=>Math.max(0,Math.min(1,x));
  if(CFG.outro>0 && ms>=CFG.duration){
    const vp=clamp((ms-CFG.duration)/CFG.outro);
    // ayah content + corner watermark fade out — but the PHOTO bg + overlay stay,
    // so the ṣalawāt sits on the same look as the rest of the video.
    const cf=clamp(vp/0.15);
    safe.style.opacity=(1-cf).toFixed(3);
    safe.style.transform='scale('+(1+0.04*cf).toFixed(3)+')';
    if(wm) wm.style.opacity=(1-clamp(vp/0.12)).toFixed(3);
    // end-card elements glide up one-by-one from the bottom (eased + de-blur),
    // HOLD, then fade the whole card out near the very end.
    const ex=clamp((vp-0.80)/0.20);
    ec.style.opacity='1';
    const eos=ec.querySelectorAll('.eo'), EST=0.085;
    for(let i=0;i<eos.length;i++){
      const ei=clamp((vp-0.05-i*EST)/0.20), se=ei*ei*(3-2*ei); // staggered smootherstep
      eos[i].style.opacity=(se*(1-ex)).toFixed(3);
      eos[i].style.transform='translateY('+((1-se)*66).toFixed(1)+'px)';
      eos[i].style.filter='blur('+((1-se)*7).toFixed(1)+'px)';
    }
    // Only at the very END: fade the WHOLE video to black.
    veil.style.opacity=clamp((vp-0.76)/0.24).toFixed(3);
  } else {
    safe.style.opacity='1'; safe.style.transform='none';
    veil.style.opacity='0'; ec.style.opacity='0';
    if(wm) wm.style.opacity='1';
  }
};
</script>
</body></html>`;
}
