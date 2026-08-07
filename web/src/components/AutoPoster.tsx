import { forwardRef, useRef } from 'react';
import { CalendarClock, Repeat, Send } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';
import type { DictKey } from '@/i18n';
import { Section, SectionHeading } from './Section';
import { AnimatedBeam } from '@/components/ui/animated-beam';
import { BlurFade } from '@/components/ui/blur-fade';
import { LogoMark } from './Logo';
import { FacebookIcon, InstagramIcon, TikTokIcon, YouTubeIcon } from './PlatformIcons';

const Node = forwardRef<
  HTMLDivElement,
  { className?: string; children: React.ReactNode; label?: string }
>(({ className, children, label }, ref) => (
  <div className="flex flex-col items-center gap-2">
    <div
      ref={ref}
      className={cn(
        'z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/60 bg-white/60 ',
        className,
      )}
    >
      {children}
    </div>
    {label && (
      <span className="whitespace-nowrap text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-3">
        {label}
      </span>
    )}
  </div>
));
Node.displayName = 'Node';

const FEATURES: { icon: LucideIcon; titleKey: DictKey; descKey: DictKey }[] = [
  { icon: CalendarClock, titleKey: 'autoFeat1', descKey: 'autoFeat1Desc' },
  { icon: Send, titleKey: 'autoFeat2', descKey: 'autoFeat2Desc' },
  { icon: Repeat, titleKey: 'autoFeat3', descKey: 'autoFeat3Desc' },
];

/**
 * The auto-poster is the project's real differentiator: self-hosted, it renders
 * and publishes on a schedule with nobody at the keyboard. It gets a full
 * section and its own diagram rather than a card in a grid, because it is the
 * reason most people will end up cloning the repo.
 */
export function AutoPoster() {
  const { t } = useI18n();
  const container = useRef<HTMLDivElement>(null);
  const clock = useRef<HTMLDivElement>(null);
  const hub = useRef<HTMLDivElement>(null);
  const tiktok = useRef<HTMLDivElement>(null);
  const instagram = useRef<HTMLDivElement>(null);
  const youtube = useRef<HTMLDivElement>(null);
  const facebook = useRef<HTMLDivElement>(null);

  const targets = [
    { ref: tiktok, Icon: TikTokIcon, label: 'TikTok', color: '#111111' },
    { ref: instagram, Icon: InstagramIcon, label: 'Instagram', color: '#e1306c' },
    { ref: youtube, Icon: YouTubeIcon, label: 'YouTube', color: '#ff0033' },
    { ref: facebook, Icon: FacebookIcon, label: 'Facebook', color: '#1877f2' },
  ];

  return (
    <Section id="autoposter">
      <SectionHeading kicker={t('autoKicker')} title={t('autoTitle')} subtitle={t('autoSubtitle')} />

      {/* ── The diagram ────────────────────────────────────────────────────
          Schedule → your server → every connected channel. Three evenly
          spaced columns so the beams read as a fan-out, not a tangle. */}
      <BlurFade delay={0.12} inView>
        <div
          ref={container}
          className="glass relative mx-auto mt-10 grid max-w-4xl grid-cols-3 items-center gap-4 overflow-hidden px-5 py-10 sm:px-12"
        >

          <div className="relative z-10 flex justify-center">
            <Node ref={clock} label="07:00 · 13:00 · 19:00" className="border-accent/35 bg-accent/10">
              <CalendarClock className="h-6 w-6 text-accent" />
            </Node>
          </div>

          <div className="relative z-10 flex justify-center">
            <Node ref={hub} label={t('toolPanel')} className="h-20 w-20 border-accent/35 shadow-float">
              <LogoMark className="h-9 w-9" />
            </Node>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-4 sm:items-end">
            {targets.map((p) => (
              <Node key={p.label} ref={p.ref} className="h-12 w-12">
                <p.Icon className="h-5 w-5 text-ink" />
              </Node>
            ))}
          </div>

          <AnimatedBeam
            containerRef={container}
            fromRef={clock}
            toRef={hub}
            duration={3}
            pathColor="#14211c"
            pathOpacity={0.1}
            pathWidth={1.5}
            gradientStartColor="#10b981"
            gradientStopColor="#059669"
          />
          {targets.map((p, i) => (
            <AnimatedBeam
              containerRef={container}
              key={p.label}
              fromRef={hub}
              toRef={p.ref}
              duration={3.4}
              delay={0.4 * i}
              curvature={(i - 1.5) * 22}
              pathColor="#14211c"
              pathOpacity={0.1}
              pathWidth={1.5}
              gradientStartColor="#059669"
              gradientStopColor={p.color}
            />
          ))}
        </div>
      </BlurFade>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {FEATURES.map((f, i) => (
          <BlurFade key={f.titleKey} delay={0.2 + i * 0.1} inView className="h-full">
            <div className="glass h-full p-6 transition-shadow hover:-translate-y-1">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
                <f.icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-ink">{t(f.titleKey)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{t(f.descKey)}</p>
            </div>
          </BlurFade>
        ))}
      </div>

      <BlurFade delay={0.5} inView>
        <div className="mt-10 flex flex-col items-center gap-5">
          <a
            href="#selfhost"
            className="btn-primary inline-flex items-center gap-2 rounded-full px-8 py-3.5 font-bold transition-transform hover:scale-[1.02]"
          >
            {t('autoCta')}
          </a>
          <p className="max-w-xl text-center text-sm text-ink-3">{t('autoNote')}</p>
        </div>
      </BlurFade>
    </Section>
  );
}
