import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TextAnimate } from '@/components/ui/text-animate';

/**
 * Section heading. Centred, wide-margined and sparse — with a mesh backdrop
 * doing the visual work, the type's job is to stay calm and get out of the way.
 */
export function SectionHeading({
  kicker,
  title,
  subtitle,
  align = 'center',
  className,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  align?: 'center' | 'start';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mx-auto max-w-3xl',
        align === 'center' ? 'text-center' : 'text-start',
        className,
      )}
    >
      {kicker && (
        <div className={cn('mb-4 flex items-center gap-3', align === 'center' && 'justify-center')}>
          {/* An editorial eyebrow, not a badge. The pressed-in grey pill this
              replaces read as a disabled chip and repeated six times down the
              page; a ruled accent label states the section and gets out of the
              way. The rules are hidden from RTL mirroring concerns by being
              symmetric. */}
          {align === 'center' && (
            <span aria-hidden="true" className="h-px w-6 bg-gradient-to-r from-transparent to-accent/60 sm:w-10" />
          )}
          <span className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-accent">
            {kicker}
          </span>
          <span aria-hidden="true" className="h-px w-6 bg-gradient-to-l from-transparent to-accent/60 sm:w-10" />
        </div>
      )}

      {/* `key` restarts the reveal when the locale changes. */}
      <TextAnimate
        key={title}
        as="h2"
        by="word"
        animation="blurInUp"
        once
        className="text-[2rem] leading-[1.06] sm:text-[2.6rem] lg:text-[3.1rem]"
      >
        {title}
      </TextAnimate>

      {subtitle && (
        <p
          className={cn(
            'mt-4 text-[1.02rem] leading-relaxed text-ink-2',
            align === 'center' && 'mx-auto max-w-2xl',
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function Section({
  id,
  children,
  className,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn('relative scroll-mt-24 px-5 py-14 sm:px-8 sm:py-16 lg:py-20', className)}>
      <div className="relative z-10 mx-auto w-full max-w-7xl">{children}</div>
    </section>
  );
}
