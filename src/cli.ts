#!/usr/bin/env node
import { JobSchema, loadJobFile, type Job } from './config.js';
import { buildReelJob, renderReel } from './pipeline.js';
import { pickRandomJob } from './random.js';
import { publishReel, prune } from './publish/index.js';
import { listChannels, isConfigured } from './publish/buffer.js';
import type { PostMode } from './publish/buffer.js';
import { serve } from './serve.js';
import { runWizard } from './wizard.js';
import { hashPassword } from './auth.js';
import { updateSecrets, markSetupComplete } from './store/store.js';
import { runDoctor } from './doctor.js';
import { log } from './util/log.js';

/** ANSI helpers for the plain-text `doctor` output. */
const paint = (c: number, s: string) => `\x1b[${c}m${s}\x1b[0m`;
async function printDoctor(): Promise<void> {
  const checks = await runDoctor();
  console.log(paint(1, '\nTabligh — health check\n'));
  for (const c of checks) {
    const [col, icon] = c.status === 'pass' ? [32, '✓'] : c.status === 'warn' ? [33, '!'] : [31, '✗'];
    console.log(`  ${paint(col, icon)} ${c.name.padEnd(26)} ${paint(90, c.detail)}`);
  }
  const bad = checks.filter((c) => c.status === 'fail').length;
  console.log(bad ? paint(31, `\n${bad} check(s) failed.\n`) : paint(32, '\nAll good.\n'));
}

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
  const { mp4, credit } = await renderReel(job, reel);
  log.ok(`Video → ${mp4}`);
  if (job.publish) {
    if (!isConfigured()) {
      log.warn('Publish requested but Buffer is not configured (BUFFER_ACCESS_TOKEN / BUFFER_*_CHANNEL_IDS) — skipping publish; video kept locally.');
      return;
    }
    const ids = await publishReel(reel, mp4, {
      mode: publishMode(flags),
      dueAt: typeof flags.due === 'string' ? flags.due : undefined,
      credit,
    });
    log.ok(`Published. Buffer post id(s): ${ids.join(', ')}`);
  }
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const flags = parseFlags(rest);
  const runTag = (flags.tag as string) ?? 'dev';

  // No subcommand in an interactive terminal → open the command center.
  // Non-TTY (pipes, Docker, CI) falls through to the help text below.
  if (cmd === undefined && process.stdout.isTTY && process.stdin.isTTY) {
    const { launchTui } = await import('./tui/index.js');
    await launchTui();
    return;
  }

  switch (cmd) {
    case 'menu': {
      const { launchTui } = await import('./tui/index.js');
      await launchTui();
      break;
    }
    case 'doctor': {
      await printDoctor();
      break;
    }
    case 'init': {
      // Interactive setup wizard → writes the persisted store.
      await runWizard();
      break;
    }
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
      // `--no-panel` (or PANEL_ENABLED=false) runs the scheduler headless.
      await serve({ panel: flags['no-panel'] !== true });
      break;
    }
    case 'web': {
      // Public, anonymous render studio. Separate process from `serve` on
      // purpose — it has no session, no settings writes and no publish path.
      const { startWebApp } = await import('./web/app.js');
      const server = startWebApp();
      const stop = () => { server.close(); process.exit(0); };
      process.on('SIGTERM', stop);
      process.on('SIGINT', stop);
      await new Promise(() => {}); // run until signalled
      break;
    }
    case 'channels': {
      // Setup helper: list Buffer channels so you can find your TikTok channel id.
      const channels = await listChannels();
      for (const c of channels) console.log(`${c.service.padEnd(12)} ${c.id}  ${c.name}`);
      break;
    }
    case 'set-password': {
      // Reset the control-panel password from the server (e.g. via docker exec).
      let pw = (rest[0] && !rest[0].startsWith('--')) ? rest[0] : (flags.password as string | undefined);
      if (!pw) {
        const { createInterface } = await import('node:readline/promises');
        const rl = createInterface({ input: process.stdin, output: process.stdout });
        pw = (await rl.question('New panel password: ')).trim();
        rl.close();
      }
      if (!pw || pw.length < 4) { log.error('Password must be at least 4 characters.'); process.exit(1); }
      updateSecrets({ panelPasswordHash: hashPassword(pw) });
      markSetupComplete();
      log.ok('Panel password updated — log in with the new password.');
      break;
    }
    default:
      console.log(`tabligh — run with no arguments in a terminal to open the interactive menu.

Usage:
  tabligh                      # interactive command center (TTY only)
  tabligh menu                 # force the interactive menu
  tabligh fetch  --surah 55 --from 1 --to 5 [--reciter husary] [--translation en.sahih]
  tabligh render --surah 112 --from 1 --to 4 [--reciter husary] [--watermark @handle] [--publish]
  tabligh random [--publish] [--mode addToQueue|shareNow|customScheduled] [--due <ISO>]
  tabligh serve  [--no-panel]  # always-on scheduler (+ control panel unless --no-panel)
  tabligh web                  # public web studio (anonymous, render-only)
  tabligh auto                 # cron: prune → random → publish
  tabligh prune                # remove stale MinIO objects + old work dirs
  tabligh doctor               # environment & config health check
  tabligh channels             # list Buffer channels (find your TikTok id)

Commands:
  menu      Open the interactive command center (generate, panel control, settings…)
  init      Interactive setup wizard (keys, storage, schedule, branding, password)
  fetch     Fetch text + per-ayah audio, compute exact timing, write ir.json
  render    Also render the animated reel.mp4; add --publish to post it
  random    Pick a random surah + consecutive ayahs (full surah if ≤ ${'FULL_SURAH_MAX_AYAHS'})
  serve     Always-on scheduler + control panel; --no-panel for headless
  web       Public web studio on WEB_PORT (no auth, render-only, never publishes)
  auto      One-shot cron job: prune, then render + publish a random reel
  prune     Delete stale assets (MinIO objects + local work dirs)
  doctor    Check ffmpeg, Chrome, API keys, storage, disk
  channels  List Buffer channels for setup
  set-password [pw]  Reset the control-panel password
`);
  }
}

main().catch((err) => {
  log.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
