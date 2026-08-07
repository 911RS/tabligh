import { CalendarClock, Globe, LayoutDashboard, SquareTerminal, TerminalSquare } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';
import type { DictKey } from '@/i18n';
import { Section, SectionHeading } from './Section';
import { BlurFade } from '@/components/ui/blur-fade';

const TOOLS: {
  icon: LucideIcon;
  titleKey: DictKey;
  descKey: DictKey;
  here?: boolean;
}[] = [
  { icon: Globe, titleKey: 'toolWeb', descKey: 'toolWebDesc', here: true },
  { icon: TerminalSquare, titleKey: 'toolCli', descKey: 'toolCliDesc' },
  { icon: SquareTerminal, titleKey: 'toolTui', descKey: 'toolTuiDesc' },
  { icon: LayoutDashboard, titleKey: 'toolPanel', descKey: 'toolPanelDesc' },
  { icon: CalendarClock, titleKey: 'toolScheduler', descKey: 'toolSchedulerDesc' },
];

export function Tools() {
  const { t } = useI18n();

  return (
    <Section id="tools">
      <SectionHeading kicker={t('toolsKicker')} title={t('toolsTitle')} subtitle={t('toolsSubtitle')} />

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool, i) => (
          <BlurFade key={tool.titleKey} delay={0.06 * i} inView className="h-full">
            <article
              className={cn(
                'h-full rounded-[1.5rem] border p-6 transition-shadow',
                tool.here
                  ? 'border-accent/35 bg-accent/10 '
                  : 'glass hover:-translate-y-1',
              )}
            >
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-2xl',
                  tool.here ? 'bg-accent text-white' : 'bg-accent/10 text-accent',
                )}
              >
                <tool.icon className="h-5 w-5" />
              </div>

              <h3 className="mt-5 flex flex-wrap items-center gap-2.5 font-display text-lg font-bold text-ink">
                {t(tool.titleKey)}
                {tool.here && (
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-white">
                    {t('toolWebTag')}
                  </span>
                )}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{t(tool.descKey)}</p>
            </article>
          </BlurFade>
        ))}

        <BlurFade delay={0.36} inView className="h-full">
          <div className="flex h-full flex-col justify-center rounded-[1.5rem] border border-dashed border-white/70 p-6">
            <p className="text-sm leading-relaxed text-ink-3">{t('toolsNote')}</p>
            <a
              href="#selfhost"
              className="mt-4 w-fit rounded-full border border-white/70 bg-white/60 px-5 py-2 text-sm font-semibold text-ink transition-colors hover:border-accent/50 hover:text-accent"
            >
              {t('selfKicker')} →
            </a>
          </div>
        </BlurFade>
      </div>
    </Section>
  );
}
