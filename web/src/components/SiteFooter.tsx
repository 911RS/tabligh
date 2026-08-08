import { ArrowRight, BookOpen, Github, Heart, MessageSquare, Scale, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LANGS, useI18n, type Lang } from '@/i18n';
import { useMeta } from '@/lib/hooks';
import { LogoMark, Wordmark } from './Logo';
import { Panel } from './Panel';

/**
 * The footer does two jobs: it makes the last offer before someone leaves, and
 * it is where the ten locales become real, crawlable links. The hadith the
 * project is named for sits at the top — it is the reason the thing exists, and
 * burying it under link columns would have that backwards.
 */
export function SiteFooter() {
  const { t, lang, setLang } = useI18n();
  const meta = useMeta();
  const repo = meta?.github ?? '911RS/tabligh';
  const repoUrl = `https://github.com/${repo}`;

  const columns = [
    {
      title: t('navStudio'),
      links: [
        { label: t('navStudio'), href: '#studio' },
        { label: t('navTemplates'), href: '#templates' },
        { label: t('navHow'), href: '#how' },
        { label: t('navFaq'), href: '#faq' },
      ],
    },
    {
      title: t('toolsKicker'),
      links: [
        { label: t('toolCli'), href: '#tools' },
        { label: t('toolTui'), href: '#tools' },
        { label: t('toolPanel'), href: '#tools' },
        { label: t('toolScheduler'), href: '#autoposter' },
      ],
    },
  ];

  return (
    <footer className="relative px-5 pb-10 pt-16 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        {/* ── Last call ─────────────────────────────────────────────────── */}
        <Panel className="shadow-float">
          <div className="px-6 py-14 text-center sm:px-12">
            <LogoMark className="mx-auto h-10 w-10" />

            <p dir="rtl" lang="ar" className="mx-auto mt-7 max-w-xl font-quran text-2xl leading-loose text-ink sm:text-3xl">
              بلّغوا عني ولو آية
            </p>
            <p className="mt-4 text-base italic text-ink-2">{t('footerTagline')}</p>
            <p className="mt-1 text-[0.68rem] uppercase tracking-[0.2em] text-ink-3">{t('footerHadith')}</p>

            <a
              href="#studio"
              className="btn-primary group mt-9 inline-flex items-center gap-2.5 rounded-full px-8 py-4 text-base font-semibold"
            >
              <Sparkles className="h-4.5 w-4.5" />
              {t('heroCtaPrimary')}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </a>
            <p className="mt-4 text-sm text-ink-3">{t('heroNoteFree')}</p>
          </div>
        </Panel>

        {/* ── Directory ─────────────────────────────────────────────────── */}
        <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-3">{t('footerSadaqah')}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { icon: Github, label: t('footerSource'), href: repoUrl },
                { icon: MessageSquare, label: t('footerIssues'), href: `${repoUrl}/issues` },
                { icon: BookOpen, label: t('selfDocs'), href: `${repoUrl}#readme` },
              ].map((a) => (
                <a
                  key={a.label}
                  href={a.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-3.5 py-2 text-[0.8rem] font-semibold text-ink transition-colors hover:bg-white/90"
                >
                  <a.icon className="h-3.5 w-3.5" />
                  {a.label}
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <nav key={col.title}>
              <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-ink-3">
                {col.title}
              </h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-sm text-ink-2 transition-colors hover:text-accent">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Every locale is a real link so crawlers reach all ten. */}
          <nav>
            <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-ink-3">
              {t('footerLangs')}
            </h3>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
              {LANGS.map((l) => (
                <li key={l.code}>
                  <a
                    href={`/${l.code}/`}
                    hrefLang={l.code}
                    lang={l.code}
                    dir={l.dir}
                    onClick={(e) => { e.preventDefault(); setLang(l.code as Lang); }}
                    className={cn(
                      'text-sm transition-colors',
                      l.code === lang ? 'font-semibold text-accent' : 'text-ink-2 hover:text-accent',
                    )}
                  >
                    {l.native}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* ── Colophon ──────────────────────────────────────────────────── */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-black/5 pt-7 sm:flex-row">
          <p className="flex items-center gap-2 text-xs text-ink-3">
            <Scale className="h-3.5 w-3.5" />
            {t('footerBuilt')}
          </p>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-2">
            <Heart className="h-3.5 w-3.5 fill-accent text-accent" />
            tabligh.cc
          </p>
        </div>
      </div>
    </footer>
  );
}
