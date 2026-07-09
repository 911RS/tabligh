/* Minimal timestamped logger — no deps. Keeps a ring buffer for the panel. */

const t = () => new Date().toISOString().slice(11, 19);

const RING: string[] = [];
const RING_MAX = 300;
function push(level: string, msg: string): void {
  RING.push(`${t()} ${level} ${msg}`);
  if (RING.length > RING_MAX) RING.shift();
}

/** Recent log lines (newest last) for the control panel. */
export const recentLogs = (limit = 200): string[] => RING.slice(-limit);

export const log = {
  info: (msg: string, ...rest: unknown[]) => { push('·', msg); console.log(`[${t()}] ${msg}`, ...rest); },
  step: (msg: string, ...rest: unknown[]) => { push('▸', msg); console.log(`[${t()}] ▸ ${msg}`, ...rest); },
  ok: (msg: string, ...rest: unknown[]) => { push('✓', msg); console.log(`[${t()}] ✓ ${msg}`, ...rest); },
  warn: (msg: string, ...rest: unknown[]) => { push('!', msg); console.warn(`[${t()}] ! ${msg}`, ...rest); },
  error: (msg: string, ...rest: unknown[]) => { push('✗', msg); console.error(`[${t()}] ✗ ${msg}`, ...rest); },
};
