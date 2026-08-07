/**
 * The public render queue.
 *
 * Rendering a reel means ~25 Puppeteer screenshots per second of audio followed
 * by an x264 encode — minutes of pinned CPU. That cost, not the code, is what
 * shapes this module: a small bounded FIFO with a hard concurrency limit, per-IP
 * throttling, and an aggressive sweeper. Everything lives in memory on purpose —
 * a public render is disposable, and a restart losing the queue is correct
 * behaviour, not data loss.
 *
 * This module never publishes. `publish` is not a parameter here; the social
 * accounts belong to the operator and the public path cannot reach them.
 */
import { randomBytes } from 'node:crypto';
import { mkdir, rm, stat, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { JobSchema } from '../config.js';
import { buildReelJob, renderReel } from '../pipeline.js';
import { extractThumbnail } from '../video/thumbnail.js';
import { log } from '../util/log.js';
import { safeBasmala, safeTemplate, safeFillColor, type ContentOptions, type BrandingOptions } from '../render/options.js';
import { policy, type PublicJobInput } from './policy.js';

export type JobState = 'queued' | 'running' | 'done' | 'failed';

export interface WebJob {
  id: string;
  ip: string;
  state: JobState;
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  /** 0..100 across the whole pipeline, not just the frame loop. */
  progress: number;
  /** Machine-readable stage, translated client-side. */
  stage: string;
  /** Terminal-style trace shown live in the UI. */
  logs: string[];
  /** Set by cancelJob(). The render may still be in flight when this flips —
   *  the flag is what stops its output being kept or its slot being counted. */
  cancelled?: boolean;
  input: PublicJobInput;
  /** Populated on success. */
  result?: {
    surahName: string;
    surahEnglishName: string;
    reciterName: string;
    ayahFrom: number;
    ayahTo: number;
    durationMs: number;
    sizeBytes: number;
    credit?: { source: string; author: string; url: string };
  };
  error?: string;
  /** Absolute paths (server-side only, never serialised to clients). */
  file?: string;
  thumb?: string;
}

const JOBS = new Map<string, WebJob>();
const PENDING: string[] = [];
let running = 0;

/** Flat output dir for finished renders — the per-run work dir is deleted. */
const OUT_DIR = join(process.cwd(), 'work', '_web');

// ── Rate limiting ────────────────────────────────────────────────────────────
const HITS = new Map<string, number[]>();

function recentHits(ip: string): number[] {
  const cutoff = Date.now() - 3600_000;
  const kept = (HITS.get(ip) ?? []).filter((t) => t > cutoff);
  if (kept.length) HITS.set(ip, kept);
  else HITS.delete(ip);
  return kept;
}

function activeForIp(ip: string): number {
  let n = 0;
  for (const j of JOBS.values()) if (j.ip === ip && (j.state === 'queued' || j.state === 'running')) n++;
  return n;
}

export interface RejectReason { code: 'rate' | 'active' | 'full'; message: string; retryAfterMinutes?: number }

/** Check whether `ip` may submit right now. Returns null when allowed. */
export function checkAdmission(ip: string): RejectReason | null {
  if (PENDING.length >= policy.queueMax) {
    return { code: 'full', message: 'The render queue is full right now. Please try again in a few minutes.' };
  }
  if (activeForIp(ip) >= policy.maxActivePerIp) {
    return { code: 'active', message: 'You already have a reel rendering. Wait for it to finish before starting another.' };
  }
  const hits = recentHits(ip);
  if (hits.length >= policy.ratePerHour) {
    const oldest = Math.min(...hits);
    const mins = Math.max(1, Math.ceil((oldest + 3600_000 - Date.now()) / 60_000));
    return {
      code: 'rate',
      message: `You've reached the limit of ${policy.ratePerHour} reels per hour. Try again in ${mins} minute(s), or self-host for unlimited renders.`,
      retryAfterMinutes: mins,
    };
  }
  return null;
}

// ── Public view of a job (no filesystem paths) ───────────────────────────────
export interface JobView {
  id: string;
  state: JobState;
  progress: number;
  stage: string;
  logs: string[];
  /** 1-based place in line; 0 once running. */
  queuePosition: number;
  /** Rough seconds remaining, based on observed throughput. null when unknown. */
  etaSeconds: number | null;
  result?: WebJob['result'];
  error?: string;
  downloadUrl?: string;
  thumbUrl?: string;
  expiresInMinutes?: number;
}

/** Mean seconds-per-second-of-audio observed this process, for the ETA. */
let costRatio = 8;
let samples = 0;

export function viewJob(job: WebJob): JobView {
  const idx = PENDING.indexOf(job.id);
  const audioSec = (job.result?.durationMs ?? 0) / 1000;
  let eta: number | null = null;
  if (job.state === 'running' && job.progress > 3) {
    const elapsed = (Date.now() - (job.startedAt ?? Date.now())) / 1000;
    eta = Math.max(1, Math.round((elapsed / job.progress) * (100 - job.progress)));
  } else if (job.state === 'queued') {
    // Assume an average passage; enough to set expectations, not a promise.
    const perJob = Math.max(20, Math.round((audioSec || 25) * costRatio));
    eta = Math.round(((idx + 1) / policy.concurrency) * perJob);
  }
  return {
    id: job.id,
    state: job.state,
    progress: job.progress,
    stage: job.stage,
    logs: job.logs,
    queuePosition: idx >= 0 ? idx + 1 : 0,
    etaSeconds: eta,
    result: job.result,
    error: job.error,
    downloadUrl: job.state === 'done' ? `/d/${job.id}.mp4` : undefined,
    thumbUrl: job.state === 'done' && job.thumb ? `/d/${job.id}.jpg` : undefined,
    expiresInMinutes: job.finishedAt
      ? Math.max(0, Math.round((job.finishedAt + policy.jobTtlMinutes * 60_000 - Date.now()) / 60_000))
      : undefined,
  };
}

export const getJob = (id: string): WebJob | undefined => JOBS.get(id);

export function queueStats() {
  return {
    queued: PENDING.length,
    running,
    concurrency: policy.concurrency,
    queueMax: policy.queueMax,
  };
}

// ── Submission ───────────────────────────────────────────────────────────────
export function submit(input: PublicJobInput, ip: string): WebJob {
  const id = randomBytes(9).toString('base64url');
  const job: WebJob = {
    id, ip, state: 'queued', createdAt: Date.now(), progress: 0,
    stage: 'queued', logs: ['queued'], input,
  };
  JOBS.set(id, job);
  PENDING.push(id);
  HITS.set(ip, [...recentHits(ip), Date.now()]);
  log.step(`web: queued ${id} · ${input.surah}:${input.ayahFrom}-${input.ayahTo} · ${input.template}`);
  pump();
  return job;
}

function pump(): void {
  while (running < policy.concurrency && PENDING.length) {
    const id = PENDING.shift()!;
    const job = JOBS.get(id);
    if (!job || job.state !== 'queued') continue;
    running++;
    void execute(job).finally(() => {
      running--;
      pump();
    });
  }
}

/** Translate the public input into the two option bundles the pipeline takes. */
function optionsFor(input: PublicJobInput): { content: ContentOptions; branding: BrandingOptions } {
  return {
    content: {
      // Public jobs never expand to a full surah — the cap is the cost ceiling.
      fullSurahMaxAyahs: 0,
      maxDurationSeconds: policy.maxDurationSeconds,
      basmala: safeBasmala(input.basmala),
    },
    branding: {
      template: safeTemplate(input.template),
      watermarkEnabled: input.watermarkEnabled,
      textFillColor: safeFillColor(input.textFillColor),
      karaokeEnabled: input.karaokeEnabled,
      particlesEnabled: input.particlesEnabled,
      bgAnimationEnabled: input.bgAnimationEnabled,
      projectCreditEnabled: input.projectCreditEnabled,
    },
  };
}

function step(job: WebJob, stage: string, progress: number, line?: string): void {
  job.stage = stage;
  job.progress = Math.max(job.progress, Math.round(progress));
  if (line) {
    job.logs.push(line);
    if (job.logs.length > 60) job.logs.shift();
  }
}

async function execute(job: WebJob): Promise<void> {
  job.state = 'running';
  job.startedAt = Date.now();
  const { content, branding } = optionsFor(job.input);
  let workDir: string | undefined;

  try {
    const parsed = JobSchema.parse({
      surah: job.input.surah,
      ayahFrom: job.input.ayahFrom,
      ayahTo: job.input.ayahTo,
      reciter: job.input.reciter,
      translationEdition: job.input.translationEdition,
      watermarkHandle: job.input.watermarkHandle,
      background: {
        source: job.input.backgroundSource,
        keywords: job.input.backgroundKeywords ? [job.input.backgroundKeywords] : [],
        localDir: '', // never settable from the web
      },
      publish: false, // structurally impossible to flip from a public request
    });

    step(job, 'fetching', 3, `fetching ${parsed.surah}:${parsed.ayahFrom}-${parsed.ayahTo}`);
    const reel = await buildReelJob(parsed, `web-${job.id}`, content);
    workDir = reel.workDir;
    step(job, 'timing', 12, `${reel.ayahs.length} ayah(s) · ${(reel.durationMs / 1000).toFixed(1)}s recitation`);

    step(job, 'background', 15, 'resolving background');
    const { mp4, credit } = await renderReel(parsed, reel, branding, (pct) => {
      // The frame loop is the bulk of the wall clock: map it onto 18..88.
      step(job, 'rendering', 18 + (pct / 100) * 70);
    });
    step(job, 'encoding', 90, 'encoding H.264');

    await mkdir(OUT_DIR, { recursive: true });
    const outFile = join(OUT_DIR, `${job.id}.mp4`);
    await rename(mp4, outFile);

    let thumb: string | undefined;
    try {
      const t = await extractThumbnail(outFile, OUT_DIR);
      const dest = join(OUT_DIR, `${job.id}.jpg`);
      if (t !== dest) await rename(t, dest);
      thumb = dest;
    } catch { /* poster frame is a nicety, not a requirement */ }

    // The visitor walked away while this was rendering. Do not resurrect the
    // job into `done` — cancelJob already moved it to a terminal state and
    // released their slot — and do not leave the output sitting on disk for
    // nobody.
    if (job.cancelled) {
      await rm(outFile, { force: true }).catch(() => {});
      if (thumb) await rm(thumb, { force: true }).catch(() => {});
      log.info(`web: discarded cancelled ${job.id}`);
      return;
    }

    const { size } = await stat(outFile);
    job.file = outFile;
    job.thumb = thumb;
    job.result = {
      surahName: reel.surahName,
      surahEnglishName: reel.surahEnglishName,
      reciterName: reel.reciterName,
      ayahFrom: reel.ayahFrom,
      ayahTo: reel.ayahTo,
      durationMs: reel.durationMs,
      sizeBytes: size,
      credit,
    };
    step(job, 'done', 100, `ready · ${(size / 1048576).toFixed(1)} MB`);
    job.state = 'done';
    job.finishedAt = Date.now();

    // Feed the ETA estimator with what this render actually cost.
    const secs = (job.finishedAt - job.startedAt) / 1000;
    const audioSec = reel.durationMs / 1000;
    if (audioSec > 1) {
      costRatio = (costRatio * samples + secs / audioSec) / (samples + 1);
      samples = Math.min(samples + 1, 20);
    }
    log.ok(`web: done ${job.id} in ${secs.toFixed(0)}s`);
  } catch (e) {
    job.state = 'failed';
    job.finishedAt = Date.now();
    job.error = e instanceof Error ? e.message : String(e);
    step(job, 'failed', job.progress, `failed: ${job.error}`);
    log.error(`web: job ${job.id} failed — ${job.error}`);
  } finally {
    // The work dir holds the raw audio and IR; the MP4 has been moved out.
    if (workDir) await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * Cancel a job on behalf of the visitor who started it.
 *
 * Cancelling used to be purely client-side: the browser dropped its polling and
 * showed the form again, while the server kept the job in `running`. Since the
 * per-IP admission check counts queued and running jobs, the next submit was
 * refused with "You already have a reel rendering" — for a render the visitor
 * had already abandoned, until it finished on its own.
 *
 * A queued job is dropped outright. One already rendering cannot be killed
 * mid-frame, but marking it here releases the visitor's slot immediately and
 * makes `execute` throw its output away rather than present it.
 *
 * Ownership is the submitting IP: there are no accounts, and a job id is not a
 * secret worth letting a stranger cancel on.
 */
export function cancelJob(id: string, ip: string): boolean {
  const job = JOBS.get(id);
  if (!job || job.ip !== ip) return false;
  if (job.state === 'done' || job.state === 'failed') return false;

  job.cancelled = true;
  job.state = 'failed';
  job.error = 'cancelled';
  job.finishedAt = Date.now();

  const i = PENDING.indexOf(id);
  if (i !== -1) PENDING.splice(i, 1);

  log.info(`web: cancelled ${id}`);
  return true;
}

/**
 * Delete a finished render's files and forget the job.
 *
 * Called the moment the visitor's download completes, so a reel lives on this
 * disk only for the seconds between "encoded" and "saved to your phone". The
 * TTL sweeper below is the backstop for the ones nobody ever collects.
 */
export async function purgeJob(id: string): Promise<void> {
  const job = JOBS.get(id);
  if (!job) return;
  JOBS.delete(id);
  if (job.file) await rm(job.file, { force: true }).catch(() => {});
  if (job.thumb) await rm(job.thumb, { force: true }).catch(() => {});
  log.info(`web: purged ${id} after download`);
}

// ── Sweeper ──────────────────────────────────────────────────────────────────
/** Drop finished jobs and their files once past the TTL. */
async function sweep(): Promise<void> {
  const ttl = policy.jobTtlMinutes * 60_000;
  const now = Date.now();
  for (const [id, job] of JOBS) {
    if (!job.finishedAt || now - job.finishedAt < ttl) continue;
    JOBS.delete(id);
    if (job.file) await rm(job.file, { force: true }).catch(() => {});
    if (job.thumb) await rm(job.thumb, { force: true }).catch(() => {});
  }
}

let sweeper: NodeJS.Timeout | undefined;

export function startSweeper(): void {
  if (sweeper) return;
  sweeper = setInterval(() => void sweep(), 60_000);
  sweeper.unref();
}

/** Remove anything left in work/_web by a previous process. */
export async function resetOutputDir(): Promise<void> {
  await rm(OUT_DIR, { recursive: true, force: true }).catch(() => {});
  await mkdir(OUT_DIR, { recursive: true });
}
