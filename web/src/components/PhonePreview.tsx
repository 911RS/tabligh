import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * A phone frame we own, rather than Magic UI's <Iphone> — that one only accepts
 * an image or video source, and these previews are live DOM.
 *
 * The child fills the screen edge to edge; composition is the child's job (see
 * ReelScreen). `float` gives the hero copy a slow idle drift so the page has
 * one thing quietly moving.
 */
export function PhonePreview({
  children,
  className,
  float = false,
}: {
  children: ReactNode;
  className?: string;
  float?: boolean;
}) {
  return (
    <div
      className={cn(
        // 9:17, not the 9:18.5 this had. Reels render at 1080×1920 (9:16), and
        // a frame much taller than the footage makes `object-cover` scale to
        // height and crop the sides — about 8% off each edge, which shoved the
        // Glass template's inset frosted panel out to the screen edges and made
        // it look full-bleed. This is as tall as the frame can be while still
        // showing the composition the renderer actually produces.
        'relative aspect-[9/17] w-full rounded-[2.4rem] bg-gradient-to-b from-[#3a4048] via-[#1b1f24] to-[#0d1013] p-[3px] shadow-float',
        float && 'motion-safe:animate-[phone-float_7s_ease-in-out_infinite]',
        className,
      )}
    >
      {/* Side buttons — small detail, but their absence is what makes a CSS
          phone read as "a rounded rectangle". */}
      <span aria-hidden="true" className="absolute -start-[2px] top-[22%] h-9 w-[3px] rounded-s bg-[#2a2f36]" />
      <span aria-hidden="true" className="absolute -start-[2px] top-[33%] h-14 w-[3px] rounded-s bg-[#2a2f36]" />
      <span aria-hidden="true" className="absolute -end-[2px] top-[27%] h-16 w-[3px] rounded-e bg-[#2a2f36]" />

      <div className="relative h-full w-full overflow-hidden rounded-[2.15rem] bg-black">
        {children}

        {/* Dynamic island */}
        <div className="absolute left-1/2 top-2.5 z-20 h-[20px] w-[74px] -translate-x-1/2 rounded-full bg-black" />
        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 z-20 h-[3px] w-24 -translate-x-1/2 rounded-full bg-white/40" />
        {/* Glass reflection */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(115deg,rgba(255,255,255,0.13),transparent_36%)]" />
      </div>
    </div>
  );
}
