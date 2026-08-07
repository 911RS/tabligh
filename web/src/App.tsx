import { useCallback, useEffect, useMemo, useState } from 'react';
import { I18nContext, detectLang, isRtl, translate, type Lang } from './i18n';
import type { DictKey } from './i18n';
import { ScrollProgress } from './components/ui/scroll-progress';
import { SiteHeader } from './components/SiteHeader';
import { Hero } from './components/Hero';
import { Studio } from './components/Studio';
import { Templates } from './components/Templates';
import { HowItWorks } from './components/HowItWorks';
import { AutoPoster } from './components/AutoPoster';
import { Tools } from './components/Tools';
import { Reciters } from './components/Reciters';
import { SelfHost } from './components/SelfHost';
import { Faq } from './components/Faq';
import { SiteFooter } from './components/SiteFooter';

export default function App() {
  const [lang, setLangState] = useState<Lang>(() => detectLang());
  const rtl = isRtl(lang);

  // The document element is the single source of truth for direction and
  // script: globals.css keys its per-script font stacks off :lang(), and the
  // whole layout mirrors off dir. Nothing else needs to know.
  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang;
    el.dir = rtl ? 'rtl' : 'ltr';
  }, [lang, rtl]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('tabligh.lang', l); } catch { /* private mode */ }
  }, []);

  const t = useCallback((key: DictKey) => translate(lang, key), [lang]);
  const ctx = useMemo(() => ({ lang, rtl, setLang, t }), [lang, rtl, setLang, t]);

  return (
    <I18nContext.Provider value={ctx}>
      <ScrollProgress className="z-[70] h-[3px] bg-gradient-to-r from-accent via-gold to-amber" />

      
      <div className="grain relative min-h-screen overflow-x-clip">
        {/* The mesh is the only place colour lives; every pane blurs it. */}
        <div className="mesh" aria-hidden="true"><span /></div>
        <a
          href="#studio"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          {t('skipToContent')}
        </a>

        <SiteHeader />

        <main id="main">
          <Hero />
          <Studio />
          <Templates />
          <HowItWorks />
          <AutoPoster />
          <Tools />
          <Reciters />
          <SelfHost />
          <Faq />
        </main>

        <SiteFooter />
      </div>
    </I18nContext.Provider>
  );
}
