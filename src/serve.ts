import { buildReelJob, renderReel } from './pipeline.js';
import { pickRandomJob } from './random.js';
import { publishReel, prune } from './publish/index.js';
import { isConfigured } from './publish/buffer.js';
import { log } from './util/log.js';

const TZ = process.env.TZ || 'Africa/Tunis';
// Times of day (in TZ) to publish. Default: morning, midday, evening → 3×/day.
const TIMES = (process.env.PUBLISH_TIMES || '07:00,13:00,19:00')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

/** Current HH:MM and YYYY-MM-DD in the configured timezone. */
function nowParts(): { hm: string; day: string } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
  const p = Object.fromEntries(fmt.formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { hm: `${p.hour}:${p.minute}`, day: `${p.year}-${p.month}-${p.day}` };
}

/** One production run: prune stale assets, then render + publish a random reel. */
async function runOnce(): Promise<void> {
  try {
    await prune();
    // Skip the (heavy) render entirely until Buffer is set up — no point burning
    // CPU on videos we can't post yet. Runs resume automatically once configured.
    if (!isConfigured()) {
      log.warn('Buffer not configured (CK8 / BUFFER_TIKTOK_CHANNEL_IDS) — skipping this run.');
      return;
    }
    const job = await pickRandomJob({ publish: true });
    const runTag = `serve-${Date.now()}`;
    const reel = await buildReelJob(job, runTag);
    const { mp4, credit } = await renderReel(job, reel);
    const ids = await publishReel(reel, mp4, { credit });
    log.ok(`Published ${ids.join(', ')}`);
  } catch (e) {
    log.error(`Scheduled run failed: ${e instanceof Error ? e.message : e}`);
  }
}

/**
 * Long-running scheduler (container entrypoint). Every 30s it checks the wall
 * clock in TZ; when it hits one of TIMES it triggers a run, guarding against
 * double-fires within the same minute.
 */
export async function serve(): Promise<void> {
  log.ok(`serve up · TZ=${TZ} · times=[${TIMES.join(', ')}] · publish=${isConfigured() ? 'on' : 'OFF (no Buffer creds)'}`);
  let lastFired = ''; // `${day} ${hm}` of the last trigger

  // Fire immediately if launched exactly on a scheduled minute; otherwise wait.
  for (;;) {
    const { hm, day } = nowParts();
    const slot = `${day} ${hm}`;
    if (TIMES.includes(hm) && lastFired !== slot) {
      lastFired = slot;
      log.step(`Trigger ${hm} ${TZ}`);
      await runOnce();
    }
    await new Promise((r) => setTimeout(r, 30_000));
  }
}
