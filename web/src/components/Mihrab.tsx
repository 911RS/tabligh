import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * A mihrab niche — the arched alcove in a mosque wall that marks the qibla.
 *
 * It is the hero's centrepiece and the reason the page reads as Quranic at a
 * glance: the silhouette is unmistakable, and it frames the ayah the way an
 * illuminated page frames its text. The arch is built from border-radius rather
 * than a clip-path so it scales fluidly and can still cast a real shadow.
 */
export function MihrabFrame({
  children,
  className,
  tone = 'glass',
}: {
  children: ReactNode;
  className?: string;
  tone?: 'glass' | 'dark';
}) {
  return (
    <div className={cn('relative', className)}>
      {/* Outer keel — a second arch offset behind, like the moulding around a
          real niche. */}
      <div
        aria-hidden="true"
        className="absolute -inset-3 rounded-[50%_50%_1.75rem_1.75rem/38%_38%_2.5%_2.5%] border border-white/50 bg-white/25 backdrop-blur-sm"
      />

      <div
        className={cn(
          'relative overflow-hidden rounded-[50%_50%_1.5rem_1.5rem/36%_36%_2%_2%]',
          tone === 'glass'
            ? 'border border-white/70 bg-white/55 shadow-float backdrop-blur-2xl'
            : 'border border-white/10 bg-[linear-gradient(180deg,#141019,#2a1f10_55%,#3d2c11)] shadow-float',
        )}
      >
        {/* Girih lattice inside the niche, barely there. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.10]"
          style={{
            backgroundSize: '76px 76px',
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='76' height='76' viewBox='0 0 76 76'%3E%3Cg fill='none' stroke='%23d4a03c' stroke-width='1'%3E%3Cpath d='M38 4 L47 29 L72 38 L47 47 L38 72 L29 47 L4 38 L29 29 Z'/%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        {/* Warm light pooling at the back of the niche. */}
        {tone === 'dark' && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(243,214,152,0.35),transparent_70%)] blur-xl"
          />
        )}

        {children}
      </div>

      {/* Keystone: the eight-point khatim at the apex of the arch. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 64 64"
        className="absolute -top-8 left-1/2 h-11 w-11 -translate-x-1/2 drop-shadow-sm"
      >
        <defs>
          <linearGradient id="keystone" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>
        <path
          d="M32 2 L41.5 22.5 L62 32 L41.5 41.5 L32 62 L22.5 41.5 L2 32 L22.5 22.5 Z"
          fill="url(#keystone)"
        />
        <circle cx="32" cy="32" r="5.5" className="fill-base" />
      </svg>
    </div>
  );
}
