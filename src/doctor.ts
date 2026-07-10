import { spawnSync } from 'node:child_process';
import { existsSync, statfsSync, writeFileSync, rmSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import puppeteer from 'puppeteer';
import { env } from './config.js';
import { settings, secrets } from './store/store.js';
import { isConfigured } from './publish/buffer.js';

export type CheckStatus = 'pass' | 'warn' | 'fail';
export interface Check {
  name: string;
  status: CheckStatus;
  detail: string;
}

const DATA_DIR = process.env.STORE_PATH ? dirname(process.env.STORE_PATH) : join(process.cwd(), 'data');
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

function checkFfmpeg(): Check {
  const r = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
  if (r.status === 0) {
    const first = (r.stdout || '').split('\n')[0] || 'ffmpeg';
    return { name: 'ffmpeg', status: 'pass', detail: first.replace('ffmpeg version ', 'v').slice(0, 40) };
  }
  return { name: 'ffmpeg', status: 'fail', detail: 'not found on PATH — video assembly will fail' };
}

function checkChrome(): Check {
  try {
    const p = env.puppeteerExecutablePath || puppeteer.executablePath();
    if (p && existsSync(p)) return { name: 'Chrome (Puppeteer)', status: 'pass', detail: p };
    return { name: 'Chrome (Puppeteer)', status: 'fail', detail: `not found at ${p || '(unset)'} — run: npx puppeteer browsers install chrome` };
  } catch (e) {
    return { name: 'Chrome (Puppeteer)', status: 'fail', detail: e instanceof Error ? e.message : 'resolution failed' };
  }
}

function checkKey(name: string, value: string, optional = false): Check {
  if (value) return { name, status: 'pass', detail: 'configured' };
  return { name, status: optional ? 'warn' : 'fail', detail: optional ? 'not set (optional)' : 'not set' };
}

function checkPublish(): Check {
  return isConfigured()
    ? { name: 'Publishing (Buffer)', status: 'pass', detail: 'token + ≥1 channel configured' }
    : { name: 'Publishing (Buffer)', status: 'warn', detail: 'not configured — renders stay local' };
}

async function checkMinio(): Promise<Check> {
  const m = secrets().minio;
  if (!m.endpoint) return { name: 'Object storage (MinIO/S3)', status: 'warn', detail: 'not set — needed only for publishing' };
  const scheme = m.useSSL ? 'https' : 'http';
  const url = `${scheme}://${m.endpoint}:${m.port}/minio/health/live`;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 2500);
  try {
    const res = await fetch(url, { signal: ac.signal });
    return res.ok
      ? { name: 'Object storage (MinIO/S3)', status: 'pass', detail: `reachable at ${m.endpoint}:${m.port}` }
      : { name: 'Object storage (MinIO/S3)', status: 'warn', detail: `${m.endpoint}:${m.port} responded ${res.status}` };
  } catch {
    return { name: 'Object storage (MinIO/S3)', status: 'warn', detail: `unreachable at ${m.endpoint}:${m.port} (health check)` };
  } finally {
    clearTimeout(t);
  }
}

function checkStoreWritable(): Check {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    const probe = join(DATA_DIR, `.doctor-${process.pid}`);
    writeFileSync(probe, 'ok');
    rmSync(probe);
    return { name: 'Data folder writable', status: 'pass', detail: DATA_DIR };
  } catch (e) {
    return { name: 'Data folder writable', status: 'fail', detail: `${DATA_DIR}: ${e instanceof Error ? e.message : 'not writable'}` };
  }
}

function checkDisk(): Check {
  try {
    const s = statfsSync(process.cwd());
    const freeGb = (s.bavail * s.bsize) / 1e9;
    const status: CheckStatus = freeGb < 1 ? 'fail' : freeGb < 3 ? 'warn' : 'pass';
    return { name: 'Free disk space', status, detail: `${freeGb.toFixed(1)} GB free` };
  } catch (e) {
    return { name: 'Free disk space', status: 'warn', detail: e instanceof Error ? e.message : 'unknown' };
  }
}

function checkBackground(): Check {
  const c = settings().content;
  if (c.backgroundSource === 'local') {
    const dir = c.backgroundLocalDir.trim();
    if (!dir) return { name: 'Background (local)', status: 'fail', detail: 'source is "local" but no folder set' };
    try {
      const imgs = readdirSync(dir).filter((f) => IMAGE_EXTS.has(extname(f).toLowerCase()));
      return imgs.length
        ? { name: 'Background (local)', status: 'pass', detail: `${imgs.length} image(s) in ${dir}` }
        : { name: 'Background (local)', status: 'fail', detail: `no images in ${dir}` };
    } catch {
      return { name: 'Background (local)', status: 'fail', detail: `folder not readable: ${dir}` };
    }
  }
  const hasKey = !!secrets().pexelsKey || !!secrets().unsplashKey;
  return hasKey
    ? { name: 'Background (stock)', status: 'pass', detail: `source: ${c.backgroundSource}` }
    : { name: 'Background (stock)', status: 'warn', detail: 'no Pexels/Unsplash key — gradient fallback only' };
}

/** Run all environment/config health checks. Used by `tabligh doctor` and the TUI. */
export async function runDoctor(): Promise<Check[]> {
  const sync = [
    checkFfmpeg(),
    checkChrome(),
    checkStoreWritable(),
    checkDisk(),
    checkBackground(),
    checkKey('Pexels API key', secrets().pexelsKey, true),
    checkKey('Unsplash API key', secrets().unsplashKey, true),
    checkPublish(),
  ];
  const minio = await checkMinio();
  return [...sync, minio];
}
