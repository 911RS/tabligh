#!/usr/bin/env node
import { JobSchema, loadJobFile, type Job } from './config.js';
import { buildReelJob, renderReel } from './pipeline.js';
import { pickRandomJob } from './random.js';
import { publishReel, prune } from './publish/index.js';
import { listChannels, isConfigured } from './publish/buffer.js';
import type { PostMode } from './publish/buffer.js';
import { serve } from './serve.js';
import { log } from './util/log.js';

/** Tiny flag parser: --key value / --flag (boolean). */
function parseFlags(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) out[key] = true;
    else { out[key] = next; i++; }
  }
  return out;
}

function jobFromFlags(f: Record<string, string | boolean>): Job {
  if (typeof f.job === 'string') return loadJobFile(f.job);
  return JobSchema.parse({
    surah: Number(f.surah),
    ayahFrom: Number(f.from),
    ayahTo: Number(f.to),
    reciter: (f.reciter as string) ?? 'husary',
    translationEdition: f.translation === undefined ? 'en.sahih' : String(f.translation),
    watermarkHandle: typeof f.watermark === 'string' ? f.watermark : '',
    publish: f.publish === true,
  });
}

function publishMode(f: Record<string, string | boolean>): PostMode {
  const m = f.mode as string | undefined;
  if (m === 'shareNow' || m === 'customScheduled' || m === 'addToQueue') return m;
  return 'addToQueue';
}

/** Render a job and, if requested, publish it to Buffer/TikTok. */
async function renderAndMaybePublish(job: Job, runTag: string, flags: Record<string, string | boolean>) {
  const reel = await buildReelJob(job, runTag);
  const mp4 = await renderReel(job, reel);
  log.ok(`Video → ${mp4}`);
  if (job.publish) {
    if (!isConfigured()) {
      log.warn('Publish requested but Buffer is not configured (CK8 / BUFFER_TIKTOK_CHANNEL_IDS) — skipping publish; video kept locally.');
      return;
    }
    const ids = await publishReel(reel, mp4, {
      mode: publishMode(flags),
      dueAt: typeof flags.due === 'string' ? flags.due : undefined,
    });
    log.ok(`Published. Buffer post id(s): ${ids.join(', ')}`);
  }
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const flags = parseFlags(rest);
  const runTag = (flags.tag as string) ?? 'dev';

  switch (cmd) {
    case 'fetch': {
      const reel = await buildReelJob(jobFromFlags(flags), runTag);
      log.ok(`Done. ${reel.ayahs.length} ayah(s), ${(reel.durationMs / 1000).toFixed(1)}s → ${reel.workDir}`);
      break;
    }
    case 'render': {
      await renderAndMaybePublish(jobFromFlags(flags), runTag, flags);
      break;
    }
    case 'random': {
      // Random surah + random consecutive ayahs (full surah if short).
      const job = await pickRandomJob({ publish: flags.publish === true });
      await renderAndMaybePublish(job, runTag, flags);
      break;
    }
    case 'auto': {
      // Cron entry point: prune stale assets, then render+publish a random reel.
      await prune();
      const job = await pickRandomJob({ publish: true });
      await renderAndMaybePublish(job, runTag, flags);
      break;
    }
    case 'prune': {
      await prune();
      break;
    }
    case 'serve': {
      // Always-on: internally schedule `auto` at PUBLISH_TIMES (the container CMD).
      await serve();
      break;
    }
    case 'channels': {
      // Setup helper: list Buffer channels so you can find your TikTok channel id.
      const channels = await listChannels();
      for (const c of channels) console.log(`${c.service.padEnd(12)} ${c.id}  ${c.name}`);
      break;
    }
    default:
      console.log(`quran-poster

Usage:
  quran-poster fetch  --surah 55 --from 1 --to 5 [--reciter husary] [--translation en.sahih]
  quran-poster render --surah 112 --from 1 --to 4 [--reciter husary] [--watermark @handle] [--publish]
  quran-poster random [--publish] [--mode addToQueue|shareNow|customScheduled] [--due <ISO>]
  quran-poster auto                 # cron: prune → random → publish
  quran-poster prune                # remove stale MinIO objects + old work dirs
  quran-poster channels             # list Buffer channels (find your TikTok id)

Commands:
  fetch     Fetch text + per-ayah audio, compute exact timing, write ir.json
  render    Also render the animated reel.mp4; add --publish to post it
  random    Pick a random surah + consecutive ayahs (full surah if ≤ ${'FULL_SURAH_MAX_AYAHS'})
  auto      One-shot cron job: prune, then render + publish a random reel
  prune     Delete stale assets (MinIO objects + local work dirs)
  channels  List Buffer channels for setup
`);
  }
}

main().catch((err) => {
  log.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
