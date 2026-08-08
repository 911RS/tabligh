import { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';
import type { DictKey } from '@/i18n';
import { Section, SectionHeading } from './Section';
import { BlurFade } from '@/components/ui/blur-fade';

/** Kept in step with the FAQPage JSON-LD emitted by src/web/seo.ts — the
 *  structured data and the visible answers must always say the same thing. */
export const FAQ_KEYS: { q: DictKey; a: DictKey }[] = [
  { q: 'faqQ1', a: 'faqA1' },
  { q: 'faqQ2', a: 'faqA2' },
  { q: 'faqQ3', a: 'faqA3' },
  { q: 'faqQ4', a: 'faqA4' },
  { q: 'faqQ5', a: 'faqA5' },
  { q: 'faqQ6', a: 'faqA6' },
  { q: 'faqQ7', a: 'faqA7' },
  { q: 'faqQ8', a: 'faqA8' },
];

function Item({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border transition-colors',
        open ? 'border-accent/35 bg-white/60 ' : 'border-white/60 bg-white/60',
      )}
    >
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-6 px-6 py-5 text-start"
        >
          <span className="font-display text-[1.05rem] font-bold text-ink">{q}</span>
          <span
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300',
              open ? 'rotate-45 bg-accent text-white' : 'bg-white/50 text-ink-2',
            )}
          >
            <Plus className="h-4 w-4" />
          </span>
        </button>
      </h3>

      {/* Grid-rows trick: animates height without measuring the content. */}
      <div
        className={cn(
          'grid transition-all duration-300 ease-out',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-6 pe-16 text-[0.95rem] leading-relaxed text-ink-2">{a}</p>
        </div>
      </div>
    </div>
  );
}

export function Faq() {
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Section id="faq">
      <SectionHeading kicker={t('faqKicker')} title={t('faqTitle')} />

      <BlurFade delay={0.1} inView>
        <div className="mx-auto mt-10 flex max-w-3xl flex-col gap-3">
          {FAQ_KEYS.map((f, i) => (
            <Item
              key={f.q}
              q={t(f.q)}
              a={t(f.a)}
              open={open === i}
              onToggle={() => setOpen(open === i ? null : i)}
            />
          ))}
        </div>
      </BlurFade>
    </Section>
  );
}
