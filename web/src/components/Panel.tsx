import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Our card surface.
 *
 * Replaces Cult UI's TextureCard, which built its bevel from five nested divs.
 * That has two costs: layout classes on the root never reach the content (they
 * land on a wrapper), and the stacked hairlines read as fussy at this scale.
 * One border, one inner highlight and a soft shadow gets the same lifted feel
 * with a single element that behaves like a normal box.
 */
export function Panel({
  children,
  className,
  tone = 'solid',
}: {
  children: ReactNode;
  className?: string;
  /** `glass` lets the mesh show through; `solid` sits on top of it. */
  tone?: 'solid' | 'glass';
}) {
  return (
    <div
      className={cn(
        'relative rounded-[24px] border shadow-glass',
        'before:pointer-events-none before:absolute before:inset-px before:rounded-[23px]',
        'before:bg-gradient-to-b before:from-white/80 before:to-transparent before:opacity-70',
        tone === 'glass'
          ? 'border-white/70 bg-white/60 backdrop-blur-2xl'
          : 'border-black/[0.06] bg-white/92 backdrop-blur-xl',
        className,
      )}
    >
      {/* `rounded-[inherit]` carries the corner radius down to children that
          trace the panel's edge (BorderBeam does this). Without it the chain
          breaks here and any such overlay renders square. */}
      <div className="relative rounded-[inherit]">{children}</div>
    </div>
  );
}
