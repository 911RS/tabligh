import { settings } from './store/store.js';
import { isConfigured } from './publish/buffer.js';
import { scheduledRun } from './server/runner.js';
import { startServer } from './server/panel.js';
import { log } from './util/log.js';

function nowParts(tz: string): { hm: string; day: string } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
  const p = Object.fromEntries(fmt.formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { hm: `${p.hour}:${p.minute}`, day: `${p.year}-${p.month}-${p.day}` };
}

/**
 * Long-running entrypoint: the control-panel HTTP server + a wall-clock
 * scheduler that fires a run at each of the store's PUBLISH_TIMES.
 */
export async function serve(): Promise<void> {
  const s0 = settings().schedule;
  log.ok(`serve up · TZ=${s0.tz} · times=[${s0.times.join(', ')}] · publish=${isConfigured() ? 'on' : 'OFF (not configured)'}`);
  startServer();
  let lastFired = '';
  for (;;) {
    const sch = settings().schedule; // live — panel edits apply immediately
    if (sch.enabled) {
      const { hm, day } = nowParts(sch.tz);
      const slot = `${day} ${hm}`;
      if (sch.times.includes(hm) && lastFired !== slot) {
        lastFired = slot;
        log.step(`Trigger ${hm} ${sch.tz}`);
        await scheduledRun();
      }
    }
    await new Promise((r) => setTimeout(r, 30_000));
  }
}
