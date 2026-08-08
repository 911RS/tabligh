import { BookOpen, Film, Music, ShieldCheck, Timer, Video } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useI18n } from '@/i18n';
import type { DictKey } from '@/i18n';
import { Section, SectionHeading } from './Section';
import { BlurFade } from '@/components/ui/blur-fade';

const STEPS: { icon: LucideIcon; titleKey: DictKey; descKey: DictKey }[] = [
  { icon: BookOpen, titleKey: 'step1', descKey: 'step1Desc' },
  { icon: Music, titleKey: 'step2', descKey: 'step2Desc' },
  { icon: Timer, titleKey: 'step3', descKey: 'step3Desc' },
  { icon: Film, titleKey: 'step4', descKey: 'step4Desc' },
  { icon: Video, titleKey: 'step5', descKey: 'step5Desc' },
];

export function HowItWorks() {
  const { t } = useI18n();

  return (
    <Section id="how">
      <SectionHeading kicker={t('howKicker')} title={t('howTitle')} subtitle={t('howSubtitle')} />

      {/* The steps are NOT individually wrapped in BlurFade — a wrapper <div>
          between <ol> and <li> breaks the list semantics and collapses the row
          rhythm, which is exactly what it did in the first pass. */}
      <BlurFade delay={0.1} inView>
        <ol className="mx-auto mt-10 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.titleKey} className="glass relative flex flex-col p-6">
              <span className="absolute end-5 top-5 font-display text-4xl font-extrabold text-ink-3/30">
                {i + 1}
              </span>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10">
                <s.icon className="h-5 w-5 text-accent" />
              </div>

              <h3 className="mt-5 font-display text-lg font-bold text-ink">{t(s.titleKey)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{t(s.descKey)}</p>
            </li>
          ))}

          {/* The integrity promise. For a Quran tool this is the single most
              important claim on the page, so it occupies the last grid cell
              rather than being tucked underneath. */}
          <li className="flex flex-col justify-center rounded-[1.5rem] border border-accent/35 bg-accent/10 p-6">
            <ShieldCheck className="h-8 w-8 text-accent" />
            <p className="mt-4 text-[0.95rem] font-medium leading-relaxed text-accent">
              {t('howAccuracy')}
            </p>
          </li>
        </ol>
      </BlurFade>
    </Section>
  );
}
