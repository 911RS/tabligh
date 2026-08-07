import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * The karaoke highlight the product actually renders, running live on the page.
 * The hero demonstrates itself instead of describing itself.
 *
 * The ayah is An-Nur 24:35 — "God is the Light of the heavens and the earth".
 */
const WORDS = ['ٱللَّهُ', 'نُورُ', 'ٱلسَّمَٰوَٰتِ', 'وَٱلْأَرْضِ'];
const TRANSLATION = 'God is the Light of the heavens and the earth';

/** Per-word dwell, weighted by letter count the same way the renderer does. */
const WEIGHTS = WORDS.map((w) => Math.max(1, w.replace(/[ً-ْـ]/g, '').length));
const TOTAL = WEIGHTS.reduce((a, b) => a + b, 0);
const CYCLE_MS = 5600;
const HOLD_MS = 1800;

export function AyahKaraoke({ className }: { className?: string }) {
  const [lit, setLit] = useState(-1);

  useEffect(() => {
    let timer: number;
    let cancelled = false;

    const run = (i: number) => {
      if (cancelled) return;
      setLit(i);
      if (i >= WORDS.length - 1) {
        timer = window.setTimeout(() => run(-1), HOLD_MS);
        return;
      }
      const next = i + 1;
      timer = window.setTimeout(() => run(next), (WEIGHTS[next] / TOTAL) * CYCLE_MS);
    };

    run(-1);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, []);

  const progress = ((lit + 1) / WORDS.length) * 100;

  return (
    <div className={cn('flex w-full flex-col items-center gap-7', className)}>
      <p
        dir="rtl"
        lang="ar"
        className="flex flex-wrap justify-center gap-x-5 gap-y-3 font-quran text-[1.9rem] leading-[2.1] sm:text-[2.3rem]"
        aria-label={WORDS.join(' ')}
      >
        {WORDS.map((w, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={cn(
              'transition-all duration-500 ease-out',
              i <= lit
                ? 'text-[#f7e3b6] [text-shadow:0_0_34px_rgba(227,180,99,0.7)]'
                : 'text-white/22',
            )}
          >
            {w}
          </span>
        ))}
      </p>

      <p className="max-w-[19rem] text-center text-[0.78rem] leading-relaxed text-white/55">
        {TRANSLATION}
      </p>

      {/* Recitation progress, exactly like the rendered reel. */}
      <div className="h-[3px] w-3/5 overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full bg-[#e3b463] shadow-[0_0_12px_rgba(227,180,99,0.9)] transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-[0.62rem] uppercase tracking-[0.34em] text-white/40">An-Nur · 24:35</p>
    </div>
  );
}
