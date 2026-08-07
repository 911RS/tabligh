import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Github, Menu, Star, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';
import { Wordmark } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NumberTicker } from '@/components/ui/number-ticker';
import { useActiveSection, useGithubStars, useMeta } from '@/lib/hooks';

const LINKS = [
  { id: 'main', key: 'navHome' },
  { id: 'studio', key: 'navStudio' },
  { id: 'templates', key: 'navTemplates' },
  { id: 'how', key: 'navHow' },
  { id: 'tools', key: 'navTools' },
  { id: 'faq', key: 'navFaq' },
] as const;

export function SiteHeader() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const meta = useMeta();
  const stars = useGithubStars(meta?.github);

  const ids = useMemo(() => LINKS.map((l) => l.id), []);
  const active = useActiveSection(ids);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const repoUrl = `https://github.com/${meta?.github ?? '911RS/tabligh'}`;

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      {/* The bar contracts as you scroll — it starts generous and settles into
          a compact pill, so it stays out of the way once you are reading. */}
      {/* The bar contracts on scroll, but it must never contract past its own
          content: every label here is translated, and the longest locale is a
          good deal wider than English. `w-fit` + `whitespace-nowrap` below let
          the pill refuse the animated maxWidth rather than wrapping a nav item
          onto a second line and bursting out of the fixed height. */}
      <motion.div
        animate={{ maxWidth: scrolled ? 1040 : 1152, paddingLeft: scrolled ? 10 : 18, paddingRight: scrolled ? 10 : 18 }}
        transition={{ type: 'spring', stiffness: 260, damping: 32 }}
        className="glass-nav mx-auto flex h-14 w-full min-w-0 items-center justify-between gap-2 rounded-full"
      >
        <a href="#main" aria-label="Tabligh" className="shrink-0 ps-2">
          <Wordmark />
        </a>

        {/* Scroll-spy nav: a single pill slides between items via a shared
            layoutId, so the highlight animates rather than jumping. */}
        <nav className="hidden min-w-0 items-center lg:flex">
          {LINKS.map((l) => {
            const on = active === l.id;
            return (
              <a
                key={l.id}
                href={`#${l.id}`}
                aria-current={on ? 'true' : undefined}
                className={cn(
                  'relative whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-colors',
                  on ? 'text-white' : 'text-ink-2 hover:text-ink',
                )}
              >
                {on && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-gradient-to-b from-accent-lit to-accent shadow-accent"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                {t(l.key)}
              </a>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5">
          <a
            href={repoUrl}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="GitHub"
            className="group hidden items-center gap-2 whitespace-nowrap rounded-full border border-border-strong bg-white/70 px-3 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-white sm:flex"
          >
            <Github className="h-4 w-4" />
            {/* The count is dropped entirely until GitHub answers, so a private
                or rate-limited repo never renders a misleading zero — and never
                renders a bare dash that reads as a broken badge either. */}
            {stars !== null && (
              <span className="flex items-center gap-1 tabular-nums">
                <Star className="h-3.5 w-3.5 fill-amber text-amber transition-transform group-hover:scale-110" />
                <NumberTicker value={stars} />
              </span>
            )}
          </a>

          <LanguageSwitcher />

          <a
            href="#studio"
            className="btn-primary hidden shrink-0 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold sm:block"
          >
            {t('heroCtaPrimary')}
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-full p-2 text-ink-2 transition-colors hover:bg-white/60 lg:hidden"
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </motion.div>

      {open && (
        <div className="glass mx-auto mt-3 w-full max-w-6xl rounded-3xl p-3 lg:hidden">
          <nav className="flex flex-col">
            {LINKS.map((l) => (
              <a
                key={l.id}
                href={`#${l.id}`}
                onClick={() => setOpen(false)}
                className={cn(
                  'rounded-2xl px-4 py-3.5 text-base font-medium transition-colors',
                  active === l.id ? 'bg-accent text-white' : 'text-ink-2 hover:bg-white/60',
                )}
              >
                {t(l.key)}
              </a>
            ))}
            <a
              href="#studio"
              onClick={() => setOpen(false)}
              className="btn-primary mt-3 rounded-full px-4 py-3.5 text-center text-sm font-semibold"
            >
              {t('heroCtaPrimary')}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
