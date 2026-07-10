import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { JobSchema, type Job } from '../config.js';
import { buildReelJob, renderReel } from '../pipeline.js';
import { pickRandomJob } from '../random.js';
import { publishReel, prune } from '../publish/index.js';
import { isConfigured } from '../publish/buffer.js';
import { addPost, popQueueItem, settings } from '../store/store.js';
import { log } from '../util/log.js';

let busy = false;
let lastStatus = 'idle';

export const isBusy = () => busy;
export const runnerStatus = () => lastStatus;

/**
 * Run one job: prune → render → (publish if requested & configured) → record.
 * Shared by the scheduler and the control-panel API. Only one runs at a time.
 */
export async function runJob(opts: { jobOverride?: Partial<Job>; publish: boolean }): Promise<string> {
  if (busy) throw new Error('a run is already in progress');
  busy = true;
  lastStatus = 'starting';
  const id = randomBytes(6).toString('hex');
  try {
    await prune();
    const c = settings().content;
    const job: Job = opts.jobOverride
      ? JobSchema.parse({
          reciter: c.reciter || 'husary',
          translationEdition: c.translationEdition,
          background: { source: c.backgroundSource, keywords: c.backgroundKeywords, localDir: c.backgroundLocalDir },
          ...opts.jobOverride,
          publish: opts.publish,
        })
      : await pickRandomJob({ publish: opts.publish });

    lastStatus = `rendering ${job.surah}:${job.ayahFrom}-${job.ayahTo}`;
    const reel = await buildReelJob(job, `serve-${Date.now()}`);
    const { mp4, credit } = await renderReel(job, reel);
    const base = {
      id, ts: new Date().toISOString(),
      surah: reel.surah, ayahFrom: reel.ayahFrom, ayahTo: reel.ayahTo,
      reciter: reel.reciter, reciterName: reel.reciterName,
      // Dedup key uses the INTENDED (pre-render) range so it matches what
      // pickRandomJob checks against postedKeys(). The reel's range can differ
      // when the duration cap trims trailing ayahs (maxDurationSeconds > 0);
      // keying on the trimmed range would let the same picked passage re-post.
      key: `${job.surah}:${job.ayahFrom}-${job.ayahTo}`,
    } as const;

    if (opts.publish && isConfigured()) {
      lastStatus = 'publishing';
      const postIds = await publishReel(reel, mp4, { credit });
      const chans = settings().publish.channels;
      const platforms = (Object.keys(chans) as (keyof typeof chans)[]).filter((p) => chans[p].length);
      addPost({ ...base, status: 'published', postIds, platforms });
      lastStatus = 'idle';
      return `Published ${base.key} → ${postIds.join(', ')}`;
    }
    addPost({ ...base, status: 'rendered' });
    lastStatus = 'idle';
    return `Rendered ${base.key}${opts.publish ? ' (publisher not configured)' : ''}`;
  } catch (e) {
    lastStatus = 'idle';
    throw e;
  } finally {
    busy = false;
  }
}

/** Scheduled production run: prune always; queued passage first, else random. */
export async function scheduledRun(): Promise<void> {
  try {
    await prune();
    if (!isConfigured()) { log.warn('Publisher not configured — skipping scheduled run.'); return; }
    const next = popQueueItem();
    const jobOverride = next
      ? { surah: next.surah, ayahFrom: next.ayahFrom, ayahTo: next.ayahTo, ...(next.reciter ? { reciter: next.reciter } : {}) }
      : undefined;
    if (next) log.step(`From queue: ${next.surah}:${next.ayahFrom}-${next.ayahTo}`);
    log.ok(await runJob({ jobOverride, publish: true }));
  } catch (e) {
    log.error(`Scheduled run failed: ${e instanceof Error ? e.message : e}`);
  }
}

/** Newest work/<dir>/reel.mp4 by mtime, or null. */
export function findLatestVideo(): string | null {
  const root = join(process.cwd(), 'work');
  let best: string | null = null;
  let bestT = 0;
  try {
    for (const d of readdirSync(root)) {
      const f = join(root, d, 'reel.mp4');
      if (existsSync(f)) {
        const t = statSync(f).mtimeMs;
        if (t > bestT) { bestT = t; best = f; }
      }
    }
  } catch { /* work/ may not exist */ }
  return best;
}
