#!/usr/bin/env node
import { JobSchema, loadJobFile, type Job } from './config.js';
import { buildReelJob, renderReel } from './pipeline.js';
import { log } from './util/log.js';

/** Tiny flag parser: --key value / --flag (boolean). */
function parseFlags(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      out[key] = true;
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

function jobFromFlags(f: Record<string, string | boolean>): Job {
  if (typeof f.job === 'string') return loadJobFile(f.job);
  return JobSchema.parse({
    surah: Number(f.surah),
    ayahFrom: Number(f.from),
    ayahTo: Number(f.to),
    reciter: (f.reciter as string) ?? 'alafasy',
    translationEdition: f.translation === undefined ? 'en.sahih' : String(f.translation),
    publish: f.publish === true,
  });
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const flags = parseFlags(rest);

  // runTag is passed in (not generated) so runs are reproducible / resumable.
  const runTag = (flags.tag as string) ?? 'dev';

  switch (cmd) {
    case 'fetch': {
      // Stage 1 only: resolve passage → timed IR + concatenated audio.
      const job = jobFromFlags(flags);
      const reel = await buildReelJob(job, runTag);
      log.ok(
        `Done. ${reel.ayahs.length} ayah(s), ${(reel.durationMs / 1000).toFixed(1)}s. Inspect ${reel.workDir}`,
      );
      break;
    }
    case 'render': {
      // Stage 1 + 2: data → MP4 (no publish).
      const job = jobFromFlags(flags);
      const reel = await buildReelJob(job, runTag);
      const mp4 = await renderReel(job, reel);
      log.ok(`Preview video → ${mp4}`);
      break;
    }
    default:
      console.log(`quran-poster

Usage:
  quran-poster fetch  --surah 55 --from 1 --to 5 [--reciter alafasy] [--translation en.sahih]
  quran-poster render --surah 112 --from 1 --to 4 --reciter alafasy
  quran-poster render --job path/to/job.json

Commands:
  fetch    Stage 1: fetch text + per-ayah audio, compute exact timing, write ir.json
  render   Stage 1+2: also render Amiri-Quran stills and assemble reel.mp4 (no publish)
`);
  }
}

main().catch((err) => {
  log.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
