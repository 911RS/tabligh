import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type Tpl = 'classic' | 'glass' | 'noor';

/**
 * A live mock of a rendered reel, filling the whole phone screen.
 *
 * The reference is `web/public/templates/<tpl>.jpg` — a real frame straight out
 * of the renderer. This composition is measured against it, because a preview
 * that invents its own look is worse than no preview: it promises something the
 * download will not deliver. Two things this got wrong before, both visible the
 * moment the two were put side by side:
 *
 *   - an eight-point star pattern tiled over everything, which appears nowhere
 *     in the render and, fixed at 64px while the phone is ~220px wide, came out
 *     as four enormous stars across the sky;
 *   - a full-screen scrim, which double-darkened a plate that already carries
 *     the render's own grade and turned a blue-hour photograph sepia.
 *
 * Type is sized in `cqw` against the screen as a container, so the whole
 * composition scales with the frame. It is used at 182px in the template cards,
 * 208px in the studio and 266px in the hero; fixed rem sizes meant the same
 * layout was cramped in one place and oversized in another.
 */

/** Only seen behind the plate photo while it decodes. */
const BACKDROP: Record<Tpl, string> = {
  classic: 'linear-gradient(160deg,#16232b 0%,#1d3038 55%,#26404a 100%)',
  glass: 'linear-gradient(165deg,#14232f 0%,#22384a 100%)',
  noor: 'linear-gradient(180deg,#121e26 0%,#1e2f38 60%,#2b3f48 100%)',
};

export interface ReelContent {
  words: string[];
  translation: string;
  surahArabic: string;
  surahLatin: string;
  range: string;
  reciter: string;
  handle?: string;
  fillColor?: string;
  /** Shown in the gilded medallion, as the renderer does for single ayahs. */
  ayahNumber?: string;
}

export const DEFAULT_REEL: ReelContent = {
  words: ['ٱللَّهُ', 'نُورُ', 'ٱلسَّمَٰوَٰتِ', 'وَٱلْأَرْضِ'],
  translation: 'God is the Light of the heavens and the earth',
  surahArabic: 'سُورَةُ ٱلنُّور',
  surahLatin: 'An-Nur',
  range: '24:35',
  reciter: 'Mahmoud Khalil Al-Husary',
};

/** Karaoke cursor. Returns the index of the last word lit, -1 before the start. */
function useKaraoke(count: number, weights: number[], cycleMs = 5600, holdMs = 1600) {
  const [lit, setLit] = useState(0);

  useEffect(() => {
    const total = weights.reduce((a, b) => a + b, 0) || 1;
    let timer: number;
    let cancelled = false;

    const run = (i: number) => {
      if (cancelled) return;
      setLit(i);
      if (i >= count - 1) {
        timer = window.setTimeout(() => run(0), holdMs);
        return;
      }
      const next = i + 1;
      timer = window.setTimeout(() => run(next), (weights[next] / total) * cycleMs);
    };

    run(0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [count, cycleMs, holdMs, weights]);

  return lit;
}

/** The render's gold. Chrome stays this colour whatever the karaoke fill is. */
const GILT = '#e9c37c';

/** The renderer sets ayah numerals in Arabic-Indic digits; so does the medallion. */
export const arabicDigits = (n: number): string =>
  String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

export function ReelScreen({
  template = 'noor',
  content = DEFAULT_REEL,
  animate = true,
  className,
}: {
  template?: Tpl;
  content?: ReelContent;
  animate?: boolean;
  className?: string;
}) {
  const words = content.words;
  const weights = words.map((w) => Math.max(1, w.replace(/[ً-ْـ]/g, '').length));
  const lit = useKaraoke(words.length, weights);
  const cursor = animate ? lit : Math.floor(words.length / 2) - 1;
  const fill = content.fillColor ?? '#ffffff';

  return (
    <div
      className={cn('@container relative h-full w-full overflow-hidden', className)}
      style={{ background: BACKDROP[template] }}
    >
      {/* A real frame with its text blanked (scripts/make-template-shots.ts),
          so the photograph, its grade and the per-template treatment are
          already exactly what the video will have. */}
      <img
        aria-hidden="true"
        src={`/templates/${template}-plate.jpg`}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover motion-safe:animate-[reel-pan_18s_ease-in-out_infinite]"
      />

      {template === 'classic' && <div className="absolute inset-0 bg-black/35" />}
      {template === 'noor' && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[52%] w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(233,195,124,0.20),transparent_70%)] blur-lg" />
      )}

      {/* Just enough vignette to seat the chrome top and bottom. The verse is
          carried by its own shadow, the way the renderer does it, rather than
          by dimming the picture everyone came to look at. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(8,14,18,0.55) 0%, rgba(8,14,18,0.12) 18%, rgba(8,14,18,0) 38%, rgba(8,14,18,0) 62%, rgba(8,14,18,0.20) 80%, rgba(8,14,18,0.66) 100%)',
        }}
      />

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="absolute inset-x-0 top-[10%] z-10 flex flex-col items-center gap-[1.6cqw] px-[6cqw]">
        <p
          dir="rtl"
          lang="ar"
          className="font-quran text-[5.4cqw] leading-none"
          style={{ color: GILT, textShadow: '0 0.4cqw 1.4cqw rgba(8,14,18,0.8)' }}
        >
          {content.surahArabic}
        </p>

        {/* Rule / label / rule — the render's header sits on a hairline. */}
        <div className="flex w-full items-center justify-center gap-[2.4cqw]">
          <span aria-hidden="true" className="h-px flex-1" style={{ background: `${GILT}55` }} />
          <p
            className="whitespace-nowrap text-[2.5cqw] uppercase leading-none tracking-[0.22em]"
            style={{ color: `${GILT}dd`, textShadow: '0 0.4cqw 1.2cqw rgba(8,14,18,0.8)' }}
          >
            {content.surahLatin} · {content.range}
          </p>
          <span aria-hidden="true" className="h-px flex-1" style={{ background: `${GILT}55` }} />
        </div>
      </div>

      {/* ── The verse ────────────────────────────────────────────────────── */}
      <div className="absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 px-[6cqw]">
        {content.ayahNumber && (
          <div className="mb-[4cqw] flex justify-center">
            <span
              dir="rtl"
              lang="ar"
              className="grid h-[9cqw] w-[9cqw] place-items-center rounded-full font-quran text-[4cqw] text-[#2a2008]"
              style={{ background: GILT, boxShadow: `0 0 4cqw ${GILT}66` }}
            >
              {content.ayahNumber}
            </span>
          </div>
        )}

        <p
          dir="rtl"
          lang="ar"
          className="flex flex-wrap justify-center gap-x-[2.6cqw] text-center font-quran text-[10cqw] leading-[1.55]"
          aria-label={words.join(' ')}
        >
          {words.map((w, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="transition-all duration-500 ease-out"
              style={
                i <= cursor
                  ? {
                      color: fill,
                      textShadow: `0 0.5cqw 2cqw rgba(8,14,18,0.85), 0 0 3cqw ${fill}55`,
                    }
                  : {
                      color: 'rgba(255,255,255,0.5)',
                      textShadow: '0 0.5cqw 2cqw rgba(8,14,18,0.9)',
                    }
              }
            >
              {w}
            </span>
          ))}
        </p>

        {/* Italic, as the render sets it — it is a translator's voice, not the
            revelation, and the type says so. */}
        <p
          className="mx-auto mt-[4cqw] max-w-[86%] text-center text-[3.6cqw] italic leading-snug text-white/90"
          style={{ textShadow: '0 0.4cqw 1.6cqw rgba(8,14,18,0.9)' }}
        >
          {content.translation}
        </p>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────
          The plates carry a baked-in mic glyph and a gilded "RECITED BY"
          caption, so this is only the name that caption introduces — sat
          directly beneath it. */}
      <div className="absolute inset-x-0 bottom-[7%] z-10 flex flex-col items-center gap-[1.5cqw] px-[6cqw]">
        <p
          className="text-center text-[3.4cqw] font-bold leading-tight text-white"
          style={{ textShadow: '0 0.4cqw 1.6cqw rgba(8,14,18,0.9)' }}
        >
          {content.reciter}
        </p>

        {content.handle && (
          <p
            className="text-[2.8cqw] leading-none tracking-[0.12em] text-white/75"
            style={{ textShadow: '0 0.4cqw 1.4cqw rgba(8,14,18,0.9)' }}
          >
            {content.handle}
          </p>
        )}
      </div>
    </div>
  );
}
