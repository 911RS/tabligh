import http from 'node:http';
import { env, JobSchema, type Job } from './config.js';
import { buildReelJob, renderReel } from './pipeline.js';
import { pickRandomJob } from './random.js';
import { publishReel, prune } from './publish/index.js';
import { isConfigured } from './publish/buffer.js';
import { log } from './util/log.js';

const TZ = process.env.TZ || 'Africa/Tunis';
const TIMES = (process.env.PUBLISH_TIMES || '07:00,13:00,19:00')
  .split(',').map((s) => s.trim()).filter(Boolean);

let busy = false; // guard: only one heavy render/publish at a time

function nowParts(): { hm: string; day: string } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
  const p = Object.fromEntries(fmt.formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { hm: `${p.hour}:${p.minute}`, day: `${p.year}-${p.month}-${p.day}` };
}

/**
 * Run one job: prune → render → (publish if requested & configured).
 * `jobOverride` lets the manual trigger pick an exact passage; otherwise random.
 */
async function runJob(opts: { jobOverride?: Partial<Job>; publish: boolean }): Promise<string> {
  if (busy) throw new Error('a run is already in progress');
  busy = true;
  try {
    await prune();
    const job: Job = opts.jobOverride
      ? JobSchema.parse({ reciter: 'husary', ...opts.jobOverride, publish: opts.publish })
      : await pickRandomJob({ publish: opts.publish });

    const reel = await buildReelJob(job, `serve-${Date.now()}`);
    const { mp4, credit } = await renderReel(job, reel);

    if (opts.publish && isConfigured()) {
      const ids = await publishReel(reel, mp4, { credit });
      const msg = `Published ${job.surah}:${job.ayahFrom}-${job.ayahTo} → ${ids.join(', ')}`;
      log.ok(msg);
      return msg;
    }
    const why = opts.publish ? 'Buffer not configured' : 'render-only';
    log.ok(`Rendered ${job.surah}:${job.ayahFrom}-${job.ayahTo} (${why}) → ${mp4}`);
    return `rendered ${job.surah}:${job.ayahFrom}-${job.ayahTo} (${why})`;
  } finally {
    busy = false;
  }
}

/** Scheduled production run at PUBLISH_TIMES: publish a random reel (skip if no Buffer). */
async function scheduledRun(): Promise<void> {
  try {
    await prune(); // always prune stale assets, even when we skip publishing
    if (!isConfigured()) {
      log.warn('Buffer not configured — skipping scheduled run.');
      return;
    }
    await runJob({ publish: true });
  } catch (e) {
    log.error(`Scheduled run failed: ${e instanceof Error ? e.message : e}`);
  }
}

/** Tiny HTTP server: GET /health and secured POST|GET /trigger. */
function startHttp(): void {
  http
    .createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://localhost');
      if (url.pathname === '/health') {
        res.writeHead(200, { 'content-type': 'text/plain' });
        res.end('ok');
        return;
      }
      if (url.pathname === '/trigger') {
        const key = url.searchParams.get('key') ?? req.headers['x-trigger-key'];
        if (!env.triggerToken || key !== env.triggerToken) {
          res.writeHead(401); res.end('unauthorized'); return;
        }
        if (busy) { res.writeHead(409); res.end('a run is already in progress'); return; }
        const q = url.searchParams;
        const jobOverride = q.get('surah')
          ? {
              surah: Number(q.get('surah')),
              ayahFrom: Number(q.get('from') ?? '1'),
              ayahTo: Number(q.get('to') ?? q.get('from') ?? '1'),
              ...(q.get('reciter') ? { reciter: q.get('reciter')! } : {}),
            }
          : undefined;
        const publish = q.get('publish') !== 'false'; // temp test hook: publish by default
        res.writeHead(202, { 'content-type': 'text/plain' });
        res.end(`triggered${publish ? ' (will publish if Buffer configured)' : ' (render-only)'} — watch logs`);
        runJob({ jobOverride, publish }).catch((e) =>
          log.error(`Trigger run failed: ${e instanceof Error ? e.message : e}`),
        );
        return;
      }
      res.writeHead(404); res.end('not found');
    })
    .listen(env.port, () => log.ok(`HTTP on :${env.port} (/health, /trigger${env.triggerToken ? '' : ' DISABLED — set TRIGGER_TOKEN'})`));
}

/** Long-running entrypoint: HTTP server + wall-clock scheduler. */
export async function serve(): Promise<void> {
  log.ok(`serve up · TZ=${TZ} · times=[${TIMES.join(', ')}] · publish=${isConfigured() ? 'on' : 'OFF (no Buffer creds)'}`);
  startHttp();
  let lastFired = '';
  for (;;) {
    const { hm, day } = nowParts();
    const slot = `${day} ${hm}`;
    if (TIMES.includes(hm) && lastFired !== slot) {
      lastFired = slot;
      log.step(`Trigger ${hm} ${TZ}`);
      await scheduledRun();
    }
    await new Promise((r) => setTimeout(r, 30_000));
  }
}
