import { useState } from 'react';
import { BookOpen, Check, Copy, Github, Scale, Star } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useGithubStars, useMeta } from '@/lib/hooks';
import { Section, SectionHeading } from './Section';
import { BlurFade } from '@/components/ui/blur-fade';
import { NumberTicker } from '@/components/ui/number-ticker';

/** A terminal block. Kept dark on the light page on purpose — a shell is one of
 *  the few places where a dark surface is the honest representation. */
function CommandBlock({ title, lines }: { title: string; lines: string[] }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked — the text is selectable anyway */ }
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-[#14211c] shadow-float">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </span>
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/50">
            {title}
          </span>
        </div>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy"
          className="rounded-md p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[#28c840]" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Commands are always LTR, even on an RTL page. */}
      <pre dir="ltr" className="overflow-x-auto px-4 py-4 font-ui text-[0.82rem] leading-relaxed text-white/90">
        {lines.map((l) => (
          <div key={l}>
            <span className="select-none text-[#4fd1a5]">$ </span>
            {l}
          </div>
        ))}
      </pre>
    </div>
  );
}

export function SelfHost() {
  const { t } = useI18n();
  const meta = useMeta();
  const repo = meta?.github ?? '911RS/tabligh';
  const stars = useGithubStars(repo);
  const repoUrl = `https://github.com/${repo}`;

  return (
    <Section id="selfhost">
      <SectionHeading kicker={t('selfKicker')} title={t('selfTitle')} subtitle={t('selfSubtitle')} />

      <div className="mx-auto mt-10 grid max-w-5xl gap-6 lg:grid-cols-2">
        <BlurFade delay={0.1} inView>
          <CommandBlock
            title={t('selfDocker')}
            lines={[`git clone https://github.com/${repo}.git`, 'cd tabligh', 'docker compose up -d']}
          />
        </BlurFade>
        <BlurFade delay={0.2} inView>
          <CommandBlock
            title={t('selfNpm')}
            lines={['npm install', 'npm run build', 'npm start init', 'npm start serve']}
          />
        </BlurFade>
      </div>

      <BlurFade delay={0.3} inView>
        <div className="glass mx-auto mt-8 flex max-w-5xl flex-col items-center gap-6 p-8 text-center sm:p-10">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href={repoUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="btn-primary inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 font-bold transition-transform hover:scale-[1.02]"
            >
              <Github className="h-5 w-5" />
              {t('selfStar')}
              {stars !== null && (
                <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-sm tabular-nums">
                  <Star className="h-3.5 w-3.5 fill-white text-white" />
                  <NumberTicker value={stars} className="text-white" />
                </span>
              )}
            </a>

            <a
              href={`${repoUrl}#readme`}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2.5 rounded-full border border-white/70 bg-white/60 px-7 py-3.5 font-semibold text-ink transition-colors hover:border-accent/50 hover:text-accent"
            >
              <BookOpen className="h-5 w-5" />
              {t('selfDocs')}
            </a>
          </div>

          <p className="flex items-center gap-2 text-sm text-ink-3">
            <Scale className="h-4 w-4" />
            {t('selfLicense')}
          </p>
        </div>
      </BlurFade>
    </Section>
  );
}
