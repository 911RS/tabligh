import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LANGS, useI18n, type Lang } from '@/i18n';

/**
 * Ten-locale picker.
 *
 * Two columns rather than a tall scrolling list — ten items fit in one glance
 * that way, and nobody has to scroll a dropdown to find their own language.
 * Each entry is set in its own script and direction, so a reader recognises it
 * without reading any English.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={box} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('chooseLanguage')}
        className={cn(
          'flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors',
          open
            ? 'border-accent/40 bg-accent/10 text-accent'
            : 'border-white/60 bg-white/50 text-ink hover:bg-white/80',
        )}
      >
        <Languages className="h-4 w-4" />
        <span className="hidden uppercase tracking-wider sm:inline">{current.code}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="absolute end-0 top-[calc(100%+0.75rem)] z-50 w-[19rem] origin-top rounded-3xl border border-black/5 bg-white p-3 shadow-float"
          >
            <p className="px-2 pb-2 text-[0.66rem] font-bold uppercase tracking-[0.18em] text-ink-3">
              {t('chooseLanguage')}
            </p>

            <ul role="listbox" className="grid grid-cols-2 gap-1.5">
              {LANGS.map((l) => {
                const on = l.code === lang;
                return (
                  <li key={l.code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={on}
                      onClick={() => {
                        setLang(l.code as Lang);
                        setOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-start transition-colors',
                        on ? 'bg-accent text-white shadow-accent' : 'text-ink-2 hover:bg-base-2',
                      )}
                    >
                      <span
                        className={cn(
                          'grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[0.6rem] font-bold uppercase tracking-wide',
                          on ? 'bg-white/25 text-white' : 'bg-base-2 text-ink-3',
                        )}
                      >
                        {l.code}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        <span
                          className={cn('block truncate text-[0.82rem] font-semibold', on && 'text-white')}
                          lang={l.code}
                          dir={l.dir}
                        >
                          {l.native}
                        </span>
                      </span>
                      {on && <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3} />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
