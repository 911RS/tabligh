/* Minimal timestamped logger — no deps, readable in Coolify logs. */

const t = () => new Date().toISOString().slice(11, 19);

export const log = {
  info: (msg: string, ...rest: unknown[]) => console.log(`[${t()}] ${msg}`, ...rest),
  step: (msg: string, ...rest: unknown[]) => console.log(`[${t()}] ▸ ${msg}`, ...rest),
  ok: (msg: string, ...rest: unknown[]) => console.log(`[${t()}] ✓ ${msg}`, ...rest),
  warn: (msg: string, ...rest: unknown[]) => console.warn(`[${t()}] ! ${msg}`, ...rest),
  error: (msg: string, ...rest: unknown[]) => console.error(`[${t()}] ✗ ${msg}`, ...rest),
};
