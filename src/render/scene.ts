import type { Background } from './background.js';

export interface SceneAyah {
  arabic: string;
  translation: string;
  /** Arabic-Indic ayah number, e.g. "١" */
  numArabic: string;
  startMs: number;
  endMs: number;
}

export interface SceneParams {
  reemBase64: string;
  ubuntuRegular: string;
  ubuntuMedium: string;
  ubuntuBold: string;
  ubuntuItalic: string;
  background: Background;
  surahName: string;
  surahEnglishName: string;
  ayahRangeLabel: string; // "Ayah 1–4"
  showBasmala: boolean;
  ayahs: SceneAyah[];
  durationMs: number;
  /** Watermark: logo image data-URI takes priority; else handle text. */
  logoDataUri?: string;
  handle?: string;
  /** Deterministic seed for particle layout / gradient variation. */
  seed: number;
}

const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
export const toArabicDigits = (n: number) =>
  String(n).split('').map((d) => AR_DIGITS[+d] ?? d).join('');

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// TikTok-safe composition band (1080×1920). Right rail + bottom caption cleared.
const SAFE = { top: 210, bottom: 430, side: 132 };

// Subtle film grain via inline SVG turbulence (static, no external asset).
const GRAIN =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'>
      <filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/>
      <feColorMatrix type='saturate' values='0'/></filter>
      <rect width='100%' height='100%' filter='url(#n)' opacity='0.5'/></svg>`,
  );

/** Build the full animated page. Exposes window.__setup() and window.__setTime(ms). */
export function buildScene(p: SceneParams): string {
  const bgLayer =
    p.background.kind === 'image'
      ? `background-image:${p.background.css};background-size:cover;background-position:center;`
      : `background:${p.background.css};`;

  const ayahLayers = p.ayahs
    .map(
      (a, i) => `
    <div class="ayah" data-i="${i}" data-start="${a.startMs}" data-end="${a.endMs}">
      <div class="body">
        <div class="num"><span>${esc(a.numArabic)}</span></div>
        <div class="artext" dir="rtl">${esc(a.arabic)}</div>
        ${a.translation ? `<div class="orn"><i></i><b></b><i></i></div><div class="trtext" dir="ltr">${esc(a.translation)}</div>` : ''}
      </div>
    </div>`,
    )
    .join('');

  const watermark = p.logoDataUri
    ? `<img class="wm-logo" src="${p.logoDataUri}" alt=""/>`
    : p.handle
      ? `<div class="wm-handle" dir="ltr">${esc(p.handle)}</div>`
      : '';

  const cfg = {
    duration: p.durationMs,
    seed: p.seed,
    ayahs: p.ayahs.map((a) => ({ s: a.startMs, e: a.endMs })),
    safe: SAFE,
  };

  return `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"/>
<style>
@font-face{font-family:'Reem';src:url(data:font/ttf;base64,${p.reemBase64}) format('truetype');font-weight:400 700;font-display:block}
@font-face{font-family:'Ubuntu';src:url(data:font/ttf;base64,${p.ubuntuRegular}) format('truetype');font-weight:400;font-display:block}
@font-face{font-family:'Ubuntu';src:url(data:font/ttf;base64,${p.ubuntuMedium}) format('truetype');font-weight:500;font-display:block}
@font-face{font-family:'Ubuntu';src:url(data:font/ttf;base64,${p.ubuntuBold}) format('truetype');font-weight:700;font-display:block}
@font-face{font-family:'Ubuntu';src:url(data:font/ttf;base64,${p.ubuntuItalic}) format('truetype');font-weight:400;font-style:italic;font-display:block}
:root{--gold:#d8b25a;--gold-soft:#e7cd90;--paper:#f6efdf;--muted:#d7ddd2}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;background:#0b0f0e}
.bg{position:absolute;inset:-6%;${bgLayer}will-change:transform}
.grain{position:absolute;inset:0;background:url("${GRAIN}");background-size:180px;opacity:.06;mix-blend-mode:overlay;pointer-events:none}
.scrim{position:absolute;inset:0;background:
  radial-gradient(125% 62% at 50% 42%, rgba(3,10,9,.05) 0%, rgba(3,10,9,.55) 62%, rgba(2,7,6,.82) 100%),
  linear-gradient(180deg, rgba(2,7,6,.55) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 74%, rgba(2,6,6,.72) 100%)}
.particles{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.p{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(232,205,144,.9),rgba(232,205,144,0) 70%);will-change:transform,opacity}
/* Progress bar along the very top border */
.ptrack{position:absolute;top:0;left:0;right:0;height:7px;background:rgba(216,178,90,.16)}
.pfill{position:absolute;top:0;left:0;height:7px;width:0;background:linear-gradient(90deg,var(--gold),var(--gold-soft));
  box-shadow:0 0 14px rgba(216,178,90,.7)}
.safe{position:absolute;left:${SAFE.side}px;right:${SAFE.side}px;top:${SAFE.top}px;bottom:${SAFE.bottom}px}
/* Header */
.header{position:absolute;top:0;left:0;right:0;text-align:center}
.hrule{display:flex;align-items:center;justify-content:center;gap:20px;margin-bottom:14px}
.hrule i{height:1px;width:70px;background:linear-gradient(90deg,transparent,var(--gold))}
.hrule i.r{background:linear-gradient(90deg,var(--gold),transparent)}
.hrule span{font-family:'Ubuntu';font-weight:500;letter-spacing:6px;text-transform:uppercase;
  font-size:28px;color:var(--gold-soft)}
.sname{font-family:'Reem';font-weight:700;font-size:64px;color:var(--paper);
  text-shadow:0 2px 20px rgba(0,0,0,.6);direction:rtl}
.range{font-family:'Ubuntu';font-style:italic;font-size:30px;color:var(--muted);opacity:.8;margin-top:8px}
.basmala{font-family:'Reem';font-weight:600;font-size:40px;color:var(--gold-soft);opacity:.85;
  margin-top:16px;text-shadow:0 2px 16px rgba(0,0,0,.6);direction:rtl}
/* Ayah stage — lifted toward the header, centered in the upper-safe band */
/* Stage begins below the header (reserves room for name+basmala) so large text never collides. */
.stage{position:absolute;left:0;right:0;top:300px;bottom:150px}
/* .ayah centers its content; .body carries opacity+drift animation and is what we measure to fit. */
.ayah{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%)}
.body{display:flex;flex-direction:column;align-items:center;gap:38px;opacity:0;will-change:opacity,transform}
.num{width:96px;height:96px;border-radius:50%;display:grid;place-items:center;
  border:1.5px solid rgba(216,178,90,.6);background:rgba(216,178,90,.08);
  box-shadow:0 0 22px rgba(216,178,90,.18) inset}
.num span{font-family:'Reem';font-weight:600;font-size:42px;line-height:1;color:var(--gold-soft);
  transform:translateY(1px)}
.artext{font-family:'Reem';font-weight:600;font-size:196px;line-height:1.5;color:var(--paper);
  text-align:center;direction:rtl;text-shadow:0 3px 30px rgba(0,0,0,.7)}
.orn{display:flex;align-items:center;justify-content:center;gap:16px}
.orn i{height:1px;width:80px;background:linear-gradient(90deg,transparent,rgba(216,178,90,.7))}
.orn i:last-child{background:linear-gradient(90deg,rgba(216,178,90,.7),transparent)}
.orn b{width:9px;height:9px;transform:rotate(45deg);background:var(--gold);box-shadow:0 0 12px rgba(216,178,90,.8)}
.trtext{font-family:'Ubuntu';font-weight:400;font-size:50px;line-height:1.4;color:var(--muted);
  text-align:center;max-width:880px;text-shadow:0 2px 16px rgba(0,0,0,.6)}
/* Watermark — PNG icon in the top-right, OUTSIDE the safe zone (above TikTok's
   right-side action buttons). Positioned relative to the full frame, not .safe. */
.wm{position:absolute;top:150px;right:52px;display:flex;align-items:center;z-index:5}
.wm-logo{height:104px;width:auto;opacity:.92;filter:drop-shadow(0 2px 10px rgba(0,0,0,.55))}
.wm-handle{font-family:'Ubuntu';font-weight:600;letter-spacing:2px;font-size:28px;color:rgba(246,239,223,.85);
  text-shadow:0 2px 12px rgba(0,0,0,.6)}
</style></head>
<body>
  <div class="bg" id="bg"></div>
  <div class="grain"></div>
  <div class="scrim"></div>
  <div class="particles" id="particles"></div>
  <div class="ptrack"></div><div class="pfill" id="pfill"></div>
  <div class="safe">
    <div class="header">
      <div class="hrule"><i></i><span>${esc(p.surahEnglishName)}</span><i class="r"></i></div>
      <div class="sname" dir="rtl">${esc(p.surahName)}</div>
      <div class="range">${esc(p.ayahRangeLabel)}</div>
      ${p.showBasmala ? `<div class="basmala" dir="rtl">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>` : ''}
    </div>
    <div class="stage" id="stage">${ayahLayers}</div>
  </div>
  <div class="wm">${watermark}</div>
<script>
const CFG = ${JSON.stringify(cfg)};
const FADE = 460; // ms cross-fade window at each ayah boundary

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

let particles=[];
window.__setup=function(){
  // Build particles deterministically from seed
  const rnd=mulberry32(CFG.seed);
  const host=document.getElementById('particles');
  const N=26;
  for(let i=0;i<N;i++){
    const el=document.createElement('div');el.className='p';
    const size=6+rnd()*16;
    el.style.width=size+'px';el.style.height=size+'px';
    const pp={el,x:rnd()*1080,baseY:rnd()*1920,size,
      speed:14+rnd()*30,        // px/sec upward
      amp:16+rnd()*44,          // horizontal sway px
      drift:0.15+rnd()*0.5,     // sway speed
      phase:rnd()*Math.PI*2,
      op:0.15+rnd()*0.45};
    particles.push(pp);host.appendChild(el);
  }
  // Fit each ayah so its content block stays inside the stage. We measure the
  // .body (auto height = actual content), not the centered .ayah container.
  // Robust order: shrink Arabic → shrink translation → final uniform scale clamp.
  const stage=document.getElementById('stage');
  const maxH=stage.clientHeight-16;
  // Keep the translation only while the Arabic can stay comfortably large.
  const KEEP_TR_MIN=130;
  document.querySelectorAll('.ayah .body').forEach((body)=>{
    const ar=body.querySelector('.artext');
    const tr=body.querySelector('.trtext');
    const orn=body.querySelector('.orn');
    const fits=()=>body.scrollHeight<=maxH;
    if(ar){
      // Shrink Arabic, but not below KEEP_TR_MIN while translation is present.
      let fs=parseFloat(getComputedStyle(ar).fontSize);let g=90;
      while(!fits()&&fs>KEEP_TR_MIN&&g-->0){fs-=4;ar.style.fontSize=fs+'px';}
      // Tall ayah: Arabic would have to get too small alongside the translation.
      // Drop the translation and let the Arabic use the whole stage.
      if(!fits()&&tr){
        tr.style.display='none'; if(orn) orn.style.display='none';
        while(!fits()&&fs>72&&g-->0){fs-=4;ar.style.fontSize=fs+'px';}
      }
    }
    // If a kept translation still overflows a touch, shrink it.
    if(tr&&tr.style.display!=='none'){let fs=parseFloat(getComputedStyle(tr).fontSize);let g=40;
      while(!fits()&&fs>30&&g-->0){fs-=2;tr.style.fontSize=fs+'px';}}
    // Final clamp so an extreme Arabic-only block never overflows.
    const scale=fits()?1:Math.max(0.4,maxH/body.scrollHeight);
    body.dataset.scale=String(scale);
  });
};

function ayahOpacity(ms,s,e,isFirst,isLast){
  const inC=s, outC=e;
  if(ms<inC-FADE/2 && !isFirst) return {o:0,dy:24};
  if(ms<inC+FADE/2){
    if(isFirst){const t=Math.min(1,Math.max(0,ms/ (FADE)));return {o:t,dy:(1-t)*24};}
    const t=(ms-(inC-FADE/2))/FADE;return {o:t,dy:(1-t)*24};
  }
  if(ms<outC-FADE/2) return {o:1,dy:0};
  if(ms<outC+FADE/2){
    if(isLast) return {o:1,dy:0};
    const t=(ms-(outC-FADE/2))/FADE;return {o:1-t,dy:-t*24};
  }
  return {o:0,dy:-24};
}

window.__setTime=function(ms){
  const dur=CFG.duration;
  const prog=Math.min(1,ms/dur);
  // Ken Burns
  const sc=1+0.09*(ms/dur);
  const tx=Math.sin(ms/9000)*10, ty=-6*(ms/dur);
  document.getElementById('bg').style.transform='scale('+sc.toFixed(4)+') translate('+tx.toFixed(2)+'px,'+ty.toFixed(2)+'px)';
  // Progress bar
  document.getElementById('pfill').style.width=(prog*1080).toFixed(1)+'px';
  // Particles
  const sec=ms/1000;
  for(const p of particles){
    let y=p.baseY-sec*p.speed;y=((y%1920)+1920)%1920;
    const x=p.x+Math.sin(sec*p.drift+p.phase)*p.amp;
    const flick=p.op*(0.7+0.3*Math.sin(sec*1.3+p.phase));
    p.el.style.transform='translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px)';
    p.el.style.opacity=flick.toFixed(3);
  }
  // Ayahs
  const A=CFG.ayahs;
  document.querySelectorAll('.ayah').forEach((el)=>{
    const i=+el.dataset.i, s=+el.dataset.start, e=+el.dataset.end;
    const r=ayahOpacity(ms,s,e,i===0,i===A.length-1);
    const body=el.querySelector('.body');
    const sc=body.dataset.scale||'1';
    body.style.opacity=r.o.toFixed(3);
    body.style.transform='translateY('+r.dy.toFixed(1)+'px) scale('+sc+')';
  });
};
</script>
</body></html>`;
}
