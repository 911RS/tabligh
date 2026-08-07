import { ArrowRight, Play, Sparkles } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useMeta } from '@/lib/hooks';
import { PhonePreview } from './PhonePreview';
import { ReelScreen, type ReelContent } from './ReelScreen';
import { NumberTicker } from '@/components/ui/number-ticker';
import { BlurFade } from '@/components/ui/blur-fade';
import { TextAnimate } from '@/components/ui/text-animate';

/**
 * The hero: centred copy, then the product playing underneath it.
 *
 * The layout this replaces was copy left / phone right, which left a column of
 * dead air under the text at every width above `lg` and a very long scroll of
 * nothing on phones. Centring the copy and putting the reel below it fills the
 * space below the fold with the thing being sold rather than with padding.
 *
 * One phone, not several. An intermediate version fanned three out on a dark
 * slab to show all the templates at once — but the flanking two were the same
 * reel in different treatments, so the extra width bought noise, and the slab
 * cut a cold rectangle across a deliberately warm page. Template variety is
 * the Templates section's job.
 */
const REEL: ReelContent = {
  words: ['ٱللَّهُ', 'نُورُ', 'ٱلسَّمَٰوَٰتِ', 'وَٱلْأَرْضِ'],
  translation: 'God is the Light of the heavens and the earth',
  surahArabic: 'سُورَةُ ٱلنُّور',
  surahLatin: 'An-Nur',
  range: '24:35',
  reciter: 'Mahmoud Khalil Al-Husary',
  ayahNumber: '٣٥',
  fillColor: '#ffffff',
};

export function Hero() {
  const { t } = useI18n();
  const meta = useMeta();

  const stats = [
    { value: meta?.reciters.length ?? 8, label: t('statReciters') },
    { value: meta?.translations.length ?? 13, label: t('statLanguages') },
    { value: meta?.templates.length ?? 3, label: t('statTemplates') },
  ];

  return (
    <section className="relative px-5 pb-16 pt-28 sm:px-8 lg:pt-32">
      <div className="mx-auto w-full max-w-5xl text-center">
        <BlurFade delay={0.05} inView>
          <span className="glass-pill inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 text-[0.8rem] font-medium text-ink-2 sm:text-sm">
            <Sparkles className="h-4 w-4 text-accent" />
            {t('heroBadge')}
          </span>
        </BlurFade>

        <h1 className="mx-auto mt-6 max-w-4xl text-[2.7rem] leading-[1.02] tracking-[-0.04em] sm:text-[3.8rem] lg:text-[4.6rem]">
          <TextAnimate key={t('heroTitleLead')} as="span" by="word" animation="blurInUp" once className="block">
            {t('heroTitleLead')}
          </TextAnimate>
          <span className="text-mesh mt-1 block">{t('heroTitleAccent')}</span>
        </h1>

        <BlurFade delay={0.3} inView>
          <p className="mx-auto mt-6 max-w-2xl text-[1.05rem] leading-relaxed text-ink-2">
            {t('heroSubtitle')}
          </p>
        </BlurFade>

        <BlurFade delay={0.42} inView>
          <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <a
              href="#studio"
              className="btn-primary group inline-flex w-full items-center justify-center gap-2.5 rounded-full px-7 py-3.5 text-base font-semibold sm:w-auto"
            >
              {t('heroCtaPrimary')}
              <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </a>
            <a
              href="#how"
              className="glass-pill inline-flex w-full items-center justify-center gap-2.5 rounded-full px-7 py-3.5 text-base font-semibold text-ink transition-transform hover:-translate-y-0.5 sm:w-auto"
            >
              <Play className="h-4 w-4 fill-current text-accent" />
              {t('heroCtaSecondary')}
            </a>
          </div>
          <p className="mt-4 text-sm text-ink-3">{t('heroNoteFree')}</p>
        </BlurFade>
      </div>

      {/* ── The product ────────────────────────────────────────────────────
          One phone, on the page's own warm light. An earlier pass put three
          phones on a dark slab: it cut a cold blue-green rectangle across a
          warm page and the two flanking reels were duplicates of the middle
          one, so the extra width bought nothing but noise. */}
      <BlurFade delay={0.2} inView>
        <div className="relative mx-auto mt-14 flex w-full max-w-5xl flex-col items-center">
          {/* Warm halo — the phone is the only dark object on the page, and
              this is what stops it reading as a hole punched in the sheet. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[115%] w-[min(680px,100%)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(249,115,22,0.20),rgba(247,190,90,0.10)_55%,transparent)] blur-2xl"
          />

          <div className="relative w-[240px] motion-safe:animate-[phone-float_8s_ease-in-out_infinite] sm:w-[266px]">
            <PhonePreview>
              <ReelScreen template="noor" content={REEL} />
            </PhonePreview>
          </div>

          {/* The counts sit under the product rather than beside the copy,
              where they read as filler between the buttons and the fold. */}
          <dl className="glass-pill relative mt-10 grid grid-cols-3 items-center gap-x-6 rounded-3xl px-6 py-5 sm:gap-x-16 sm:rounded-full sm:px-10">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <dd className="font-display text-2xl font-bold tabular-nums text-ink">
                  <NumberTicker value={s.value} className="text-ink" />
                </dd>
                <dt className="mt-0.5 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-ink-3">
                  {s.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </BlurFade>
    </section>
  );
}
