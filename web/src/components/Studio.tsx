import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, Download, Loader2, RotateCcw, Sparkles, Wand2 } from 'lucide-react';

import { fill, useI18n } from '@/i18n';
import { useMetaState } from '@/lib/hooks';
import {
  ApiError, createJob, formatBytes, formatDuration, pollJob,
  type JobRequest, type JobView,
} from '@/lib/api';
import { Section, SectionHeading } from './Section';
import { Panel } from './Panel';
import { PhonePreview } from './PhonePreview';
import { ReelScreen, DEFAULT_REEL, arabicDigits, type Tpl } from './ReelScreen';
import { ColorField, Field, Fieldset, NumberInput, Select, TextInput, ToggleChip } from './studio/Field';
import { AnimatedCircularProgressBar } from '@/components/ui/animated-circular-progress-bar';
import { NumberTicker } from '@/components/ui/number-ticker';
import { BorderBeam } from '@/components/ui/border-beam';
import { Confetti, type ConfettiRef } from '@/components/ui/confetti';
import { cn } from '@/lib/utils';

const DEFAULTS: JobRequest = {
  surah: 112,
  ayahFrom: 1,
  ayahTo: 4,
  reciter: 'husary',
  translationEdition: 'en.sahih',
  template: 'noor',
  karaokeEnabled: true,
  particlesEnabled: true,
  bgAnimationEnabled: true,
  // The outro sign-off is not optional — the server ignores this field and the
  // studio offers no switch for it.
  projectCreditEnabled: true,
  watermarkEnabled: false,
  watermarkHandle: '',
  textFillColor: '#ffffff',
  basmala: 'off',
  backgroundSource: 'auto',
  backgroundKeywords: '',
};

const STAGE_KEYS = {
  queued: 'stateQueued', fetching: 'stateFetching', timing: 'stateTiming',
  background: 'stateBackground', rendering: 'stateRendering', encoding: 'stateEncoding',
  done: 'stateDone', failed: 'stateFailed',
} as const;

const TEMPLATES: { id: Tpl; key: 'tplClassic' | 'tplGlass' | 'tplNoor' }[] = [
  { id: 'classic', key: 'tplClassic' },
  { id: 'glass', key: 'tplGlass' },
  { id: 'noor', key: 'tplNoor' },
];

/**
 * The studio.
 *
 * Shaped as an editor, not a form. The preview sits on its own dark stage
 * because it is the thing being made and it is a video: the version this
 * replaces tucked it into a pale 320px sidebar rail where it read as an
 * afterthought beside a column of form rows.
 *
 * The stage is sticky and carries the primary action, so "what I am making"
 * and "make it" never scroll apart no matter how far down the controls you
 * are. Every option stays visible: two earlier attempts failed as a sprawling
 * two-column form and then as a wizard that hid everything behind Next.
 */
export function Studio() {
  const { t } = useI18n();
  const { meta, loading: metaLoading, failed: metaFailed, retry: retryMeta } = useMetaState();
  const [form, setForm] = useState<JobRequest>(DEFAULTS);
  const [job, setJob] = useState<JobView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const confetti = useRef<ConfettiRef>(null);

  const surah = useMemo(() => meta?.surahs.find((s) => s.number === form.surah), [meta, form.surah]);
  const maxAyah = surah?.numberOfAyahs ?? 286;
  const maxSpan = meta?.limits.maxAyahs ?? 10;

  const set = <K extends keyof JobRequest>(k: K, v: JobRequest[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    setForm((f) => {
      const from = Math.min(Math.max(1, f.ayahFrom), maxAyah);
      const to = Math.min(Math.max(from, f.ayahTo), maxAyah);
      return from === f.ayahFrom && to === f.ayahTo ? f : { ...f, ayahFrom: from, ayahTo: to };
    });
  }, [maxAyah]);

  const overCap = Math.max(1, form.ayahTo - form.ayahFrom + 1) > maxSpan;
  useEffect(() => () => abort.current?.abort(), []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null); setBusy(true); setJob(null);
    abort.current = new AbortController();
    try {
      const { id } = await createJob(form);
      const finished = await pollJob(id, setJob, abort.current.signal);
      if (finished.state === 'done') confetti.current?.fire({});
      else setError(finished.error ?? t('errorGeneric'));
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      setError(e instanceof ApiError ? e.message : t('errorGeneric'));
    } finally { setBusy(false); }
  }

  function reset() {
    abort.current?.abort();
    setJob(null); setError(null); setBusy(false);
  }

  const stageLabel = job ? t(STAGE_KEYS[job.stage as keyof typeof STAGE_KEYS] ?? 'stateQueued') : '';
  const done = job?.state === 'done';
  const reciterName = meta?.reciters.find((r) => r.id === form.reciter)?.name ?? DEFAULT_REEL.reciter;

  /* ── The stage ───────────────────────────────────────────────────────────
     Dark panel, big phone, template switcher, primary action. Shared by the
     editor and reused visually by the result view. */
  const stage = (
    <div className="relative flex flex-col gap-5 overflow-hidden rounded-[1.6rem] bg-[linear-gradient(168deg,#2a1508_0%,#1a0d04_55%,#33190a_100%)] p-5 sm:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-1/4 left-1/2 h-[60%] w-[85%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(249,150,60,0.22),transparent_70%)] blur-2xl"
      />

      <p className="relative flex items-center justify-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-white/55">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-lit opacity-70" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-lit" />
        </span>
        {t('previewLive')}
      </p>

      {/* Sized so the stage and the control column come out close to the same
          height — a much taller sticky preview left a bank of empty panel
          under the last fieldset. */}
      <div className="relative mx-auto w-full max-w-[208px]">
        <PhonePreview>
          <ReelScreen
            template={form.template as Tpl}
            content={{
              ...DEFAULT_REEL,
              words: ['قُلْ', 'هُوَ', 'ٱللَّهُ', 'أَحَدٌ'],
              translation: 'Say, “He is Allah, [who is] One”',
              surahArabic: surah?.name ?? DEFAULT_REEL.surahArabic,
              surahLatin: surah?.englishName ?? DEFAULT_REEL.surahLatin,
              range: `${form.surah}:${form.ayahFrom}${form.ayahTo !== form.ayahFrom ? `-${form.ayahTo}` : ''}`,
              reciter: reciterName,
              handle: form.watermarkEnabled ? form.watermarkHandle : undefined,
              fillColor: form.textFillColor,
              // The medallion carries a single ayah's number; a range has no
              // one number to show, exactly as in the renderer.
              ayahNumber:
                form.ayahFrom === form.ayahTo ? arabicDigits(form.ayahFrom) : undefined,
            }}
          />
        </PhonePreview>
      </div>

      {/* Template switching lives against the preview rather than a third of a
          page away in the control column — it is the one setting whose whole
          point is watching the picture change. */}
      <div
        role="radiogroup"
        aria-label={t('fieldTemplate')}
        className="relative grid grid-cols-3 gap-1 rounded-full bg-white/8 p-1"
      >
        {TEMPLATES.map((tpl) => {
          const on = form.template === tpl.id;
          return (
            <button
              key={tpl.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => set('template', tpl.id)}
              className={cn(
                'rounded-full px-2 py-2 text-[0.78rem] font-semibold transition-colors',
                on ? 'bg-white text-ink shadow-sm' : 'text-white/65 hover:text-white',
              )}
            >
              {t(tpl.key)}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="relative flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/15 p-3 text-[0.78rem] leading-snug text-white">
          <AlertTriangle className="mt-px h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <div className="relative">
        <button
          type="submit"
          form="studio-form"
          disabled={busy || !meta}
          className="btn-primary inline-flex w-full items-center justify-center gap-2.5 rounded-full px-6 py-4 text-[0.95rem] font-bold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
          {busy ? t('btnGenerating') : t('btnGenerate')}
        </button>
        <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-[0.7rem] text-white/55">
          <Check className="h-3 w-3 text-accent-lit" />
          {t('studioEstimate')}
        </p>
      </div>
    </div>
  );

  return (
    <Section id="studio">
      <SectionHeading kicker={t('studioKicker')} title={t('studioTitle')} subtitle={t('studioSubtitle')} />

      <div className="relative mx-auto mt-10 max-w-6xl">
        <Panel className="relative overflow-hidden">
          {busy && <BorderBeam size={280} duration={7} colorFrom="#f97316" colorTo="#0d9488" />}

          {done && job?.result ? (
            /* ── Result ───────────────────────────────────────────────── */
            <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[300px_1fr] lg:gap-12">
              <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-[1.6rem] bg-[linear-gradient(168deg,#2a1508,#1a0d04)] p-5">
                <PhonePreview>
                  <video
                    src={job.downloadUrl}
                    poster={job.thumbUrl}
                    controls
                    playsInline
                    className="h-full w-full bg-black object-cover"
                  />
                </PhonePreview>
              </div>

              <div className="flex flex-col justify-center">
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-accent/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-accent-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t('resultTitle')}
                </span>
                <h3 className="mt-4 font-display text-3xl font-bold text-ink">
                  {job.result.surahEnglishName} · {job.result.ayahFrom}
                  {job.result.ayahTo !== job.result.ayahFrom && `–${job.result.ayahTo}`}
                </h3>
                <p dir="rtl" lang="ar" className="mt-1 font-quran text-2xl text-accent">
                  {job.result.surahName}
                </p>

                <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:max-w-md">
                  {[
                    [t('fieldReciter'), job.result.reciterName],
                    [t('resultDuration'), formatDuration(job.result.durationMs)],
                    [t('resultSize'), formatBytes(job.result.sizeBytes)],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-ink-3">{k}</dt>
                      <dd className="mt-1 font-medium text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  {/* `?dl=1` tells the server this is the real download, not
                      the <video> above streaming the same URL — the file is
                      deleted from the server the moment this transfer lands. */}
                  <a
                    href={`${job.downloadUrl}?dl=1`}
                    download={`tabligh-${job.result.surahEnglishName}-${job.result.ayahFrom}.mp4`}
                    className="btn-primary inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 font-semibold"
                  >
                    <Download className="h-5 w-5" />
                    {t('btnDownload')}
                  </a>
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-border-strong bg-white px-7 py-3.5 font-semibold text-ink transition-colors hover:bg-base-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {t('btnAnother')}
                  </button>
                </div>

                {job.expiresInMinutes !== undefined && (
                  <p className="mt-5 flex items-start gap-2 rounded-2xl bg-amber/10 p-3 text-sm text-amber-deep">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    {fill(t('expiresIn'), { n: job.expiresInMinutes })}
                  </p>
                )}
              </div>
            </div>
          ) : busy && job ? (
            /* ── Rendering ────────────────────────────────────────────── */
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <AnimatedCircularProgressBar
                value={job.progress} min={0} max={100}
                gaugePrimaryColor="#ea580c" gaugeSecondaryColor="rgba(28,25,23,0.08)"
                className="size-36 text-ink"
              />
              <p className="mt-8 font-display text-2xl font-bold text-ink">{stageLabel}</p>
              {job.state === 'queued' && job.queuePosition > 0 && (
                <p className="mt-3 text-ink-2">
                  {t('queuePosition')}{' '}
                  <span className="font-bold tabular-nums text-accent">
                    <NumberTicker value={job.queuePosition} />
                  </span>
                </p>
              )}
              {job.etaSeconds !== null && (
                <p className="mt-2 text-sm tabular-nums text-ink-3">
                  {t('etaAbout')}{' '}
                  {job.etaSeconds >= 60
                    ? `${Math.ceil(job.etaSeconds / 60)} ${t('etaMinutes')}`
                    : `${job.etaSeconds} ${t('etaSeconds')}`}
                </p>
              )}
              <button
                type="button"
                onClick={reset}
                className="mt-8 text-sm font-medium text-ink-3 underline underline-offset-4 hover:text-ink"
              >
                {t('btnCancel')}
              </button>
            </div>
          ) : metaFailed ? (
            /* ── Could not load ───────────────────────────────────────────
               Without this the form still rendered, with every select empty
               and no explanation — which read as a broken studio rather than
               an unreachable server. */
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
                <AlertTriangle className="h-7 w-7" />
              </span>
              <h3 className="mt-5 font-display text-2xl font-bold text-ink">{t('metaFailedTitle')}</h3>
              <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-ink-2">{t('metaFailedBody')}</p>
              <button
                type="button"
                onClick={retryMeta}
                className="btn-primary mt-7 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                <RotateCcw className="h-4 w-4" />
                {t('metaRetry')}
              </button>
            </div>
          ) : (
            /* ── The editor ───────────────────────────────────────────── */
            <div className="grid lg:grid-cols-[minmax(0,340px)_1fr]">
              <div className="p-4 sm:p-6 lg:sticky lg:top-24 lg:self-start">
                {metaLoading ? (
                  <div
                    className="flex flex-col gap-6 rounded-[1.6rem] bg-[linear-gradient(168deg,#2a1508,#1a0d04)] p-6"
                    aria-busy="true"
                    aria-live="polite"
                  >
                    <span className="sr-only">{t('metaLoading')}</span>
                    <div className="mx-auto aspect-[9/17] w-full max-w-[208px] animate-pulse rounded-[2.4rem] bg-white/8" />
                    <div className="h-10 animate-pulse rounded-full bg-white/8" />
                    <div className="h-14 animate-pulse rounded-full bg-white/8" />
                  </div>
                ) : (
                  stage
                )}
              </div>

              {/* The controls. `id` + `form=` on the submit button lets the
                  primary action live on the stage while staying a real submit
                  for this form — so Enter in any field still works. */}
              <form
                id="studio-form"
                onSubmit={submit}
                className="min-w-0 border-t border-border lg:border-s lg:border-t-0"
              >
                {metaLoading ? (
                  <div className="p-5 sm:p-7" aria-hidden="true">
                    {[3, 2, 2, 3].map((cols, i) => (
                      <div key={i} className="border-b border-border py-5 first:pt-0 last:border-b-0">
                        <div className="mb-3.5 h-3 w-24 animate-pulse rounded-full bg-ink/8" />
                        <div
                          className="grid gap-3"
                          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
                        >
                          {Array.from({ length: cols }, (_, j) => (
                            <div key={j} className="h-11 animate-pulse rounded-xl bg-ink/6" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {/* The control column used to start cold, straight into a
                        SURAH label at the panel's top edge. This says what the
                        column is and what the settings currently add up to. */}
                    <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-5 py-4 sm:px-7">
                      <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-ink-3">
                        {t('studioSummary')}
                      </p>
                      <p className="min-w-0 text-[0.9rem] font-semibold text-ink">
                        {surah?.englishName ?? '—'}{' '}
                        <span className="tabular-nums">
                          {form.surah}:{form.ayahFrom}
                          {form.ayahTo !== form.ayahFrom && `–${form.ayahTo}`}
                        </span>
                        <span className="font-medium text-ink-3"> · {reciterName}</span>
                      </p>
                    </header>

                    <Fieldset title={t('fieldPassage')}>
                      <div className="grid gap-3 sm:grid-cols-[1fr_92px_92px]">
                        <Field label={t('fieldSurah')} htmlFor="surah">
                          <Select
                            id="surah" value={form.surah}
                            onChange={(e) => set('surah', Number(e.target.value))}
                          >
                            {(meta?.surahs ?? []).map((s) => (
                              <option key={s.number} value={s.number}>
                                {s.number}. {s.englishName} — {s.name}
                              </option>
                            ))}
                          </Select>
                        </Field>
                        <Field label={t('fieldAyahFrom')} htmlFor="from">
                          <NumberInput
                            id="from" min={1} max={maxAyah} value={form.ayahFrom}
                            onValueChange={(n) => set('ayahFrom', n)}
                          />
                        </Field>
                        <Field label={t('fieldAyahTo')} htmlFor="to">
                          <NumberInput
                            id="to" min={form.ayahFrom} max={maxAyah} value={form.ayahTo}
                            onValueChange={(n) => set('ayahTo', n)}
                          />
                        </Field>
                      </div>
                      {overCap && (
                        <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber/10 p-2.5 text-[0.75rem] leading-snug text-amber-deep">
                          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
                          {fill(t('clampNote'), { n: maxSpan })}
                        </p>
                      )}
                    </Fieldset>

                    <Fieldset title={t('fieldReciter')}>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label={t('fieldReciter')} htmlFor="reciter">
                          <Select
                            id="reciter" value={form.reciter}
                            onChange={(e) => set('reciter', e.target.value)}
                          >
                            {(meta?.reciters ?? []).map((r) => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </Select>
                        </Field>
                        <Field label={t('fieldTranslation')} htmlFor="translation">
                          <Select
                            id="translation" value={form.translationEdition}
                            onChange={(e) => set('translationEdition', e.target.value)}
                          >
                            {(meta?.translations ?? []).map((g) => (
                              <optgroup key={g.code} label={g.language}>
                                {g.editions.map((ed) => (
                                  <option key={ed.id || 'none'} value={ed.id}>
                                    {ed.id ? ed.name : t('translationNone')}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </Select>
                        </Field>
                      </div>
                    </Fieldset>

                    <Fieldset title={t('fieldBackground')}>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label={t('fieldKeywords')} htmlFor="keywords" hint={t('keywordsHelp')}>
                          <TextInput
                            id="keywords" maxLength={60} placeholder={t('keywordsPlaceholder')}
                            value={form.backgroundKeywords}
                            onChange={(e) => set('backgroundKeywords', e.target.value)}
                          />
                        </Field>
                        <Field label={t('fieldBasmala')} htmlFor="basmala">
                          <Select
                            id="basmala" value={form.basmala}
                            onChange={(e) => set('basmala', e.target.value)}
                          >
                            <option value="off">{t('basmalaOff')}</option>
                            <option value="always">{t('basmalaAlways')}</option>
                          </Select>
                        </Field>
                      </div>
                    </Fieldset>

                    <Fieldset title={t('optionsTitle')}>
                      <Field label={t('fieldColor')} className="mb-4">
                        <ColorField
                          label={t('fieldColor')}
                          value={form.textFillColor}
                          onChange={(v) => set('textFillColor', v)}
                        />
                      </Field>

                      <div className="flex flex-wrap gap-2">
                        <ToggleChip checked={form.karaokeEnabled} onChange={(v) => set('karaokeEnabled', v)} label={t('optKaraoke')} />
                        <ToggleChip checked={form.particlesEnabled} onChange={(v) => set('particlesEnabled', v)} label={t('optParticles')} />
                        <ToggleChip checked={form.bgAnimationEnabled} onChange={(v) => set('bgAnimationEnabled', v)} label={t('optBgAnimation')} />
                        <ToggleChip checked={form.watermarkEnabled} onChange={(v) => set('watermarkEnabled', v)} label={t('optWatermark')} />
                      </div>

                      {form.watermarkEnabled && (
                        <div className="mt-3 max-w-[15rem]">
                          <TextInput
                            maxLength={24} placeholder={t('handlePlaceholder')}
                            aria-label={t('fieldHandle')}
                            value={form.watermarkHandle}
                            onChange={(e) => set('watermarkHandle', e.target.value)}
                          />
                        </div>
                      )}
                    </Fieldset>
                  </>
                )}
              </form>
            </div>
          )}
        </Panel>

        <Confetti ref={confetti} manualstart className="pointer-events-none absolute inset-0 z-20 h-full w-full" />
      </div>
    </Section>
  );
}
