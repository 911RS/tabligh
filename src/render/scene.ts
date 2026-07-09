import type { Background } from './background.js';

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
  /** Outro sign-off text, used when there is no logo. */
  outroText?: string;
  /** Color of already-recited (filled) karaoke text. */
  fillColor: string;
  /** Word-by-word karaoke fill (else the ayah shows fully filled). */
  karaoke: boolean;
  seed: number;
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
        <div class="num">${esc(a.numArabic)}</div>
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

  const cfg = { duration: p.durationMs, outro: p.outroMs, seed: p.seed, count: p.ayahs.length, karaoke: p.karaoke };
  // Outro card: logo (only when the logo/watermark is enabled) stacked above the
  // ṣalawāt text; both centered. With the logo off, the ṣalawāt shows alone.
  const endCardInner =
    (p.showWatermark && p.logoDataUri ? `<img class="end-logo" src="${p.logoDataUri}" alt=""/>` : '') +
    (p.outroText ? `<div class="end-text" dir="rtl">${esc(p.outroText)}</div>` : '');

  return `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"/>
<style>
@font-face{font-family:'Aref';src:url(data:font/ttf;base64,${p.arefRegular}) format('truetype');font-weight:400;font-display:block}
@font-face{font-family:'Aref';src:url(data:font/ttf;base64,${p.arefBold}) format('truetype');font-weight:700;font-display:block}
@font-face{font-family:'Kufi';src:url(data:font/ttf;base64,${p.reemBase64}) format('truetype');font-weight:400 700;font-display:block}
@font-face{font-family:'Ubuntu';src:url(data:font/ttf;base64,${p.ubuntuRegular}) format('truetype');font-weight:400;font-display:block}
@font-face{font-family:'Ubuntu';src:url(data:font/ttf;base64,${p.ubuntuMedium}) format('truetype');font-weight:500;font-display:block}
@font-face{font-family:'Ubuntu';src:url(data:font/ttf;base64,${p.ubuntuItalic}) format('truetype');font-weight:400;font-style:italic;font-display:block}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;background:#05070a}
.bg{position:absolute;inset:-4%;${bgLayer}will-change:transform}
/* Strong cinematic overlay so white text stays readable on any photo */
.scrim{position:absolute;inset:0;background:
  radial-gradient(135% 62% at 50% 48%, rgba(4,7,10,.30) 0%, rgba(4,7,10,.62) 58%, rgba(3,5,8,.86) 100%),
  linear-gradient(180deg, rgba(3,5,8,.78) 0%, rgba(3,5,8,.34) 22%, rgba(3,5,8,.44) 58%, rgba(3,5,8,.86) 100%)}
.particles{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.p{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.9),rgba(255,255,255,0) 70%);will-change:transform,opacity}
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
.artext{font-family:'Aref';font-weight:700;font-size:150px;line-height:1.7;text-align:center;direction:rtl;
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
const F = 380;            // sequential ayah fade in/out (no cross-ayah overlap)
const STAGGER = 180;      // ms between each element's reveal within an ayah
const CHILD_FADE = 380;   // ms for a single element to fade/slide in
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
let particles=[];
window.__setup=function(){
  const rnd=mulberry32(CFG.seed);
  const host=document.getElementById('particles');
  for(let i=0;i<46;i++){
    const el=document.createElement('div');el.className='p';
    const size=5+rnd()*17;el.style.width=size+'px';el.style.height=size+'px';
    particles.push({el,x:rnd()*1080,baseY:rnd()*1920,speed:11+rnd()*28,amp:16+rnd()*50,drift:0.12+rnd()*0.45,phase:rnd()*6.28,op:0.20+rnd()*0.5});
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
  // Very subtle slow zoom — no panning; the life comes from the particles.
  document.getElementById('bg').style.transform='scale('+(1+0.05*(ms/dur)).toFixed(4)+')';
  document.getElementById('pfill').style.width=(Math.min(1,ms/dur)*1080).toFixed(1)+'px';
  for(const p of particles){
    let y=p.baseY-sec*p.speed;y=((y%1920)+1920)%1920;
    const x=p.x+Math.sin(sec*p.drift+p.phase)*p.amp;
    p.el.style.transform='translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px)';
    p.el.style.opacity=(p.op*(0.7+0.3*Math.sin(sec*1.3+p.phase))).toFixed(3);
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
      kids[k].style.transform='translateY('+((1-sf)*14).toFixed(1)+'px)';
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
    // end-card: glide up slowly from the bottom (eased + de-blur), HOLD, then fade out.
    const ei=clamp((vp-0.05)/0.28), se=ei*ei*(3-2*ei); // smootherstep entrance
    const ex=clamp((vp-0.75)/0.25);
    ec.style.opacity=(se*(1-ex)).toFixed(3);
    ec.style.transform='translateY('+((1-se)*110).toFixed(1)+'px) scale('+(0.98+0.02*se).toFixed(3)+')';
    ec.style.filter='blur('+((1-se)*9).toFixed(1)+'px)';
    // Only at the very END: fade the WHOLE video to black.
    veil.style.opacity=clamp((vp-0.72)/0.28).toFixed(3);
  } else {
    safe.style.opacity='1'; safe.style.transform='none';
    veil.style.opacity='0'; ec.style.opacity='0';
    if(wm) wm.style.opacity='1';
  }
};
</script>
</body></html>`;
}
