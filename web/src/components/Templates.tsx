import { ArrowRight } from 'lucide-react';
import { useI18n } from '@/i18n';
import type { DictKey } from '@/i18n';
import { Section, SectionHeading } from './Section';
import { BlurFade } from '@/components/ui/blur-fade';
import { Panel } from './Panel';
import { PhonePreview } from './PhonePreview';
import type { Tpl } from './ReelScreen';

const TEMPLATES: { id: Tpl; nameKey: DictKey; descKey: DictKey }[] = [
  { id: 'classic', nameKey: 'tplClassic', descKey: 'tplClassicDesc' },
  { id: 'glass', nameKey: 'tplGlass', descKey: 'tplGlassDesc' },
  { id: 'noor', nameKey: 'tplNoor', descKey: 'tplNoorDesc' },
];

/**
 * These are REAL frames, produced by the video pipeline itself via
 * `scripts/make-template-shots.ts` — not CSS impressions of it. A hand-drawn
 * preview inevitably drifts from what the renderer outputs, which is the worst
 * kind of preview: it promises something the product does not deliver.
 */
export function Templates() {
  const { t } = useI18n();

  return (
    <Section id="templates">
      <SectionHeading
        kicker={t('templatesKicker')}
        title={t('templatesTitle')}
        subtitle={t('templatesSubtitle')}
      />

      <div className="mt-10 grid gap-6 md:grid-cols-3 lg:gap-8">
        {TEMPLATES.map((tpl, i) => (
            <BlurFade key={tpl.id} delay={0.1 + i * 0.1} inView className="h-full">
              <article className="h-full text-center">
                <Panel className="h-full">
                  <div className="flex h-full flex-col items-center p-6">
                <div className="relative w-[182px]">
                  <PhonePreview>
                    <img
                      src={`/templates/${tpl.id}.jpg`}
                      alt={t('templatePreviewAria').replace('{name}', t(tpl.nameKey))}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </PhonePreview>
                </div>

                <h3 className="mt-7 font-display text-xl font-bold text-ink">{t(tpl.nameKey)}</h3>
                <p className="mb-6 mt-2.5 text-sm leading-relaxed text-ink-2">{t(tpl.descKey)}</p>

                {/* `mt-auto` pins the three CTAs to a common baseline — the
                    descriptions run to different line counts, so a fixed top
                    margin left one card's button floating above the others. */}
                <a
                  href="#studio"
                  className="mt-auto inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-white px-5 py-2 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
                >
                  {t('heroCtaPrimary')}
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                </a>
                  </div>
                </Panel>
              </article>
            </BlurFade>
        ))}
      </div>

      <BlurFade delay={0.4} inView>
        <p className="mt-8 text-center text-xs text-ink-3">
          Actual frames from the renderer — not mock-ups.
        </p>
      </BlurFade>
    </Section>
  );
}
