import { cn } from '@/lib/utils';

/** The khatim (eight-point star) mark. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn('h-8 w-8', className)} aria-hidden="true">
      <defs>
        <linearGradient id="mark-mesh" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#10b981" />
          <stop offset="55%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <path
        d="M32 2 L41.5 22.5 L62 32 L41.5 41.5 L32 62 L22.5 41.5 L2 32 L22.5 22.5 Z"
        fill="url(#mark-mesh)"
      />
      <circle cx="32" cy="32" r="6" fill="#f59e0b" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark className="h-7 w-7" />
      <span className="font-display text-lg font-bold tracking-tight text-ink">Tabligh</span>
    </span>
  );
}
