import { spawn } from 'node:child_process';
import { openSync, readFileSync, writeFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config.js';

/**
 * Background lifecycle for the control-panel web server. The TUI (and the
 * wizard) use this to Start / Stop / Restart the panel without blocking the
 * terminal. We spawn `tabligh serve` detached, track it by a PID file, and
 * check liveness with the process signal + the `/health` endpoint.
 */

const DATA_DIR = process.env.STORE_PATH ? dirname(process.env.STORE_PATH) : join(process.cwd(), 'data');
const PID_FILE = join(DATA_DIR, 'panel.pid');
const LOG_FILE = join(DATA_DIR, 'panel.log');

export interface PanelInfo {
  pid: number;
  port: number;
  startedAt: string;
}

export interface PanelStatus {
  running: boolean;
  healthy: boolean;
  pid?: number;
  port: number;
  startedAt?: string;
  url: string;
}

export const panelUrl = (): string => `http://localhost:${env.port}/`;
export const panelLogPath = (): string => LOG_FILE;

/** The CLI entrypoint to spawn `serve` from. Uses the running entry when it is
 * the CLI (normal case), else falls back to the compiled sibling (dist/cli.js). */
function resolveCliPath(): string {
  const a = process.argv[1];
  if (a && /cli\.(js|ts|mjs)$/.test(a)) return a;
  return fileURLToPath(new URL('../cli.js', import.meta.url));
}

function readPidFile(): PanelInfo | null {
  try {
    return JSON.parse(readFileSync(PID_FILE, 'utf8')) as PanelInfo;
  } catch {
    return null;
  }
}

/** True if a process with this pid is alive (signal 0 probes without killing). */
function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** Best-effort liveness ping of the panel's /health endpoint. */
async function pingHealth(port: number, timeoutMs = 1500): Promise<boolean> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(`http://localhost:${port}/health`, { signal: ac.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

/** Current panel status: PID-file + process-alive + HTTP health. */
export async function panelStatus(): Promise<PanelStatus> {
  const info = readPidFile();
  const port = info?.port ?? env.port;
  const url = `http://localhost:${port}/`;
  if (!info || !isAlive(info.pid)) {
    // Stale pid file (crash / kill -9): clean it up so status is truthful.
    if (info) { try { rmSync(PID_FILE); } catch { /* ignore */ } }
    // The panel may also be running outside our control (e.g. Docker) — still ping.
    const healthy = await pingHealth(port);
    return { running: healthy, healthy, port, url };
  }
  const healthy = await pingHealth(info.port);
  return { running: true, healthy, pid: info.pid, port: info.port, startedAt: info.startedAt, url };
}

/** Start the panel as a detached background process. No-op if already running. */
export async function startPanel(): Promise<PanelStatus> {
  const status = await panelStatus();
  if (status.running) return status;

  mkdirSync(DATA_DIR, { recursive: true });
  const cliPath = resolveCliPath(); // dist/cli.js (or src/cli.ts under tsx)
  const out = openSync(LOG_FILE, 'a');
  const child = spawn(process.execPath, [cliPath, 'serve'], {
    detached: true,
    stdio: ['ignore', out, out],
    env: process.env,
  });
  child.unref();

  const info: PanelInfo = { pid: child.pid!, port: env.port, startedAt: new Date().toISOString() };
  writeFileSync(PID_FILE, JSON.stringify(info, null, 2));

  // Wait briefly for /health to come up so callers can report success/failure.
  for (let i = 0; i < 40; i++) {
    if (await pingHealth(env.port, 500)) break;
    await new Promise((r) => setTimeout(r, 250));
  }
  return panelStatus();
}

/** Stop the background panel (SIGTERM). Returns true if a process was signalled. */
export function stopPanel(): boolean {
  const info = readPidFile();
  if (!info) return false;
  let signalled = false;
  try {
    if (isAlive(info.pid)) { process.kill(info.pid, 'SIGTERM'); signalled = true; }
  } catch { /* already gone */ }
  try { rmSync(PID_FILE); } catch { /* ignore */ }
  return signalled;
}

/** Stop then start; returns the fresh status. */
export async function restartPanel(): Promise<PanelStatus> {
  stopPanel();
  // Give the old listener a moment to release the port.
  await new Promise((r) => setTimeout(r, 600));
  return startPanel();
}

/** Last `n` lines of the panel log (for the TUI "View logs" screen). */
export function tailPanelLog(n = 40): string[] {
  if (!existsSync(LOG_FILE)) return [];
  const lines = readFileSync(LOG_FILE, 'utf8').split('\n').filter(Boolean);
  return lines.slice(-n);
}
