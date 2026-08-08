import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import { statSync, createReadStream, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { env } from '../config.js';
import {
  settings, updateSettings, secrets, updateSecrets, isSetupComplete, markSetupComplete, listPosts,
  listQueue, addQueueItem, removeQueueItem,
} from '../store/store.js';
import { hashPassword, verifyPanelPassword, panelPasswordConfigured, signSession, verifySession, readCookie, SESSION_COOKIE } from '../auth.js';
import { isConfigured, listChannels } from '../publish/buffer.js';
import { runJob, isBusy, runnerStatus, findLatestVideo } from './runner.js';
import { log, recentLogs } from '../util/log.js';
import { renderPanel } from './ui.js';
import { TRANSLATION_EDITIONS } from '../i18n.js';
import { computeStats } from '../store/stats.js';

let _html: string | null = null;
/** Build the panel HTML once, embedding the vendored Ubuntu fonts + icon. */
function panelHtml(): string {
  if (_html) return _html;
  const F = (n: string) => readFileSync(join(process.cwd(), 'assets/fonts', n)).toString('base64');
  let icon = '';
  try { icon = readFileSync(join(process.cwd(), 'assets/icon.png')).toString('base64'); } catch { /* optional */ }
  _html = renderPanel({ regular: F('Ubuntu-Regular.ttf'), medium: F('Ubuntu-Medium.ttf'), bold: F('Ubuntu-Bold.ttf') }, icon);
  return _html;
}

function json(res: ServerResponse, code: number, body: unknown): void {
  const s = JSON.stringify(body);
  res.writeHead(code, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(s) });
  res.end(s);
}

async function readBody(req: IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString()); } catch { return {}; }
}

function authed(req: IncomingMessage): boolean {
  return verifySession(readCookie(req.headers.cookie, SESSION_COOKIE));
}

function setSession(res: ServerResponse): void {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${signSession()}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${30 * 24 * 3600}`);
}

/** Public status (no secrets) — drives which screen the UI shows. */
function statusPayload() {
  const sch = settings().schedule;
  const sec = secrets();
  return {
    setupComplete: isSetupComplete() || panelPasswordConfigured(),
    publishConfigured: isConfigured(),
    busy: isBusy(),
    status: runnerStatus(),
    schedule: sch,
    secretsPresent: {
      pexels: !!sec.pexelsKey, unsplash: !!sec.unsplashKey, buffer: !!sec.bufferToken,
      minio: !!sec.minio.endpoint, password: !!sec.panelPasswordHash || panelPasswordConfigured(),
    },
  };
}

// ── Login brute-force protection (per-IP, in-memory) ─────────────────────────
const LOGIN_ATTEMPTS = new Map<string, { count: number; until: number }>();
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
/**
 * Is this connection from the machine itself?
 *
 * Deliberately reads the socket, never X-Forwarded-For: that header is
 * attacker-controlled, and trusting it here would let anyone claim loopback by
 * simply asking to. A reverse proxy on the same host genuinely does connect
 * over loopback, so it still passes.
 */
function isLoopbackAddr(addr: string | undefined): boolean {
  if (!addr) return false;
  const a = addr.replace(/^::ffff:/, '');           // IPv4-mapped IPv6
  return a === '127.0.0.1' || a === '::1' || a.startsWith('127.');
}

function isLoopbackHost(host: string): boolean {
  return host === 'localhost' || isLoopbackAddr(host);
}

function clientIp(req: IncomingMessage): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd) return fwd.split(',')[0].trim();
  return req.socket.remoteAddress ?? 'unknown';
}
function loginLock(ip: string): number {
  const e = LOGIN_ATTEMPTS.get(ip);
  return e && e.until > Date.now() ? Math.ceil((e.until - Date.now()) / 60000) : 0;
}
function registerFail(ip: string): number {
  const e = LOGIN_ATTEMPTS.get(ip) ?? { count: 0, until: 0 };
  e.count++;
  if (e.count >= MAX_FAILS) e.until = Date.now() + LOCK_MS;
  LOGIN_ATTEMPTS.set(ip, e);
  return Math.max(0, MAX_FAILS - e.count);
}

async function api(req: IncomingMessage, res: ServerResponse, path: string): Promise<void> {
  const method = req.method ?? 'GET';

  if (path === '/api/status') return json(res, 200, { ...statusPayload(), authed: authed(req) });

  // Web setup — allowed without auth ONLY while setup is incomplete.
  if (path === '/api/setup' && method === 'POST') {
    if (isSetupComplete() || panelPasswordConfigured()) return json(res, 403, { error: 'already set up' });
    // ...and only from this machine. This endpoint sets the panel password, so
    // whoever reaches it first owns the panel and every credential in it. A
    // reverse proxy connects over loopback, so the normal VPS setup still
    // works; a directly-exposed port does not.
    if (!env.panelAllowRemoteSetup && !isLoopbackAddr(req.socket.remoteAddress)) {
      log.warn(`panel: refused remote setup attempt from ${req.socket.remoteAddress ?? 'unknown'}`);
      return json(res, 403, {
        error:
          'First-run setup must be completed from the machine running Tabligh ' +
          '(or through a reverse proxy). Set PANEL_ALLOW_REMOTE_SETUP=1 to override.',
      });
    }
    const b = await readBody(req);
    if (!b.password || String(b.password).length < 4) return json(res, 400, { error: 'password too short' });
    updateSecrets({ panelPasswordHash: hashPassword(String(b.password)) });
    if (b.settings) updateSettings(b.settings);
    if (b.secrets) updateSecrets(b.secrets);
    markSetupComplete();
    setSession(res);
    return json(res, 200, { ok: true });
  }

  if (path === '/api/login' && method === 'POST') {
    const ip = clientIp(req);
    const mins = loginLock(ip);
    if (mins > 0) return json(res, 429, { error: `Too many attempts — locked for ${mins} more minute(s).` });
    const b = await readBody(req);
    if (verifyPanelPassword(String(b.password ?? ''))) {
      LOGIN_ATTEMPTS.delete(ip); // reset on success
      setSession(res);
      return json(res, 200, { ok: true });
    }
    const left = registerFail(ip);
    return json(res, 401, { error: left > 0 ? `Wrong password — ${left} attempt(s) left.` : 'Too many attempts — locked for 15 minutes.' });
  }

  if (path === '/api/logout' && method === 'POST') {
    res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0`);
    return json(res, 200, { ok: true });
  }

  // Everything below requires a session.
  if (!authed(req)) return json(res, 401, { error: 'unauthorized' });

  if (path === '/api/settings') {
    if (method === 'GET') {
      const m = secrets().minio; // non-sensitive storage fields (not the keys) for prefill
      return json(res, 200, { ...settings(), minioPublic: { endpoint: m.endpoint, port: m.port, bucket: m.bucket, publicUrl: m.publicUrl } });
    }
    if (method === 'PUT') return json(res, 200, updateSettings(await readBody(req)));
  }

  if (path === '/api/secrets' && method === 'PUT') {
    const b = await readBody(req);
    // Only overwrite provided (non-empty) fields — never blank a secret by omission.
    const patch: any = {};
    for (const k of ['pexelsKey', 'unsplashKey', 'bufferToken']) if (b[k]) patch[k] = b[k];
    if (b.minio && typeof b.minio === 'object') patch.minio = b.minio;
    updateSecrets(patch);
    return json(res, 200, { ok: true });
  }

  if (path === '/api/channels' && method === 'GET') {
    try { return json(res, 200, await listChannels()); }
    catch (e) { return json(res, 400, { error: e instanceof Error ? e.message : 'failed' }); }
  }

  if (path === '/api/generate' && method === 'POST') {
    if (isBusy()) return json(res, 409, { error: 'a run is already in progress' });
    const b = await readBody(req);
    const jobOverride = b.surah
      ? { surah: Number(b.surah), ayahFrom: Number(b.from ?? 1), ayahTo: Number(b.to ?? b.from ?? 1), ...(b.reciter ? { reciter: String(b.reciter) } : {}) }
      : undefined;
    runJob({ jobOverride, publish: b.publish === true }).then((m) => log.ok(m))
      .catch((e) => log.error(`Panel run failed: ${e instanceof Error ? e.message : e}`));
    return json(res, 202, { ok: true });
  }

  if (path === '/api/editions' && method === 'GET') return json(res, 200, TRANSLATION_EDITIONS);
  if (path === '/api/history' && method === 'GET') return json(res, 200, listPosts(100));
  if (path === '/api/stats' && method === 'GET') return json(res, 200, computeStats());
  if (path === '/api/logs' && method === 'GET') return json(res, 200, recentLogs(200));

  if (path === '/api/queue') {
    if (method === 'GET') return json(res, 200, listQueue());
    if (method === 'POST') {
      const b = await readBody(req);
      if (!b.surah) return json(res, 400, { error: 'surah required' });
      addQueueItem({
        id: randomBytes(5).toString('hex'), surah: Number(b.surah),
        ayahFrom: Number(b.ayahFrom ?? 1), ayahTo: Number(b.ayahTo ?? b.ayahFrom ?? 1),
        ...(b.reciter ? { reciter: String(b.reciter) } : {}),
      });
      return json(res, 200, { ok: true });
    }
  }
  if (path === '/api/queue' && method === 'DELETE') {
    removeQueueItem(new URL(req.url ?? '', 'http://x').searchParams.get('id') ?? '');
    return json(res, 200, { ok: true });
  }

  if (path === '/api/preview' && method === 'GET') {
    const file = findLatestVideo();
    if (!file) return json(res, 404, { error: 'no video yet' });
    res.writeHead(200, { 'content-type': 'video/mp4', 'content-length': statSync(file).size });
    return void createReadStream(file).pipe(res);
  }

  return json(res, 404, { error: 'not found' });
}

/** Legacy token-secured endpoints kept for scripting: /health, /trigger, /last. */
function legacy(req: IncomingMessage, res: ServerResponse, url: URL): boolean {
  const p = url.pathname;
  if (p === '/health') { res.writeHead(200); res.end('tabligh ok'); return true; }
  if (p === '/trigger') {
    const key = url.searchParams.get('key') ?? req.headers['x-trigger-key'];
    if (!secrets().triggerToken || key !== secrets().triggerToken) { res.writeHead(401); res.end('unauthorized'); return true; }
    if (isBusy()) { res.writeHead(409); res.end('busy'); return true; }
    const q = url.searchParams;
    const jobOverride = q.get('surah')
      ? { surah: Number(q.get('surah')), ayahFrom: Number(q.get('from') ?? '1'), ayahTo: Number(q.get('to') ?? q.get('from') ?? '1'), ...(q.get('reciter') ? { reciter: q.get('reciter')! } : {}) }
      : undefined;
    const publish = q.get('publish') !== 'false';
    res.writeHead(202); res.end('triggered — watch logs');
    runJob({ jobOverride, publish }).then((m) => log.ok(m)).catch((e) => log.error(`Trigger failed: ${e}`));
    return true;
  }
  if (p === '/last') {
    const key = url.searchParams.get('key') ?? req.headers['x-trigger-key'];
    if (!secrets().triggerToken || key !== secrets().triggerToken) { res.writeHead(401); res.end('unauthorized'); return true; }
    const f = findLatestVideo();
    if (!f) { res.writeHead(404); res.end('no video yet'); return true; }
    res.writeHead(200, { 'content-type': 'video/mp4', 'content-length': statSync(f).size });
    createReadStream(f).pipe(res);
    return true;
  }
  return false;
}

/** Start the control-panel HTTP server (API + embedded SPA). Returns the
 * server so callers (e.g. `serve`) can close it on shutdown. */
export function startServer(): http.Server {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      if (url.pathname.startsWith('/api/')) return await api(req, res, url.pathname);
      if (legacy(req, res, url)) return;
      // Everything else → the single-page panel (client routes on setup/login/dashboard).
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(panelHtml());
    } catch (e) {
      json(res, 500, { error: e instanceof Error ? e.message : 'server error' });
    }
  });
  server.listen(env.port, env.panelHost, () => {
    log.ok(`Control panel on ${env.panelHost}:${env.port}`);
    if (!isLoopbackHost(env.panelHost)) {
      log.warn(
        `The control panel is bound to ${env.panelHost} — it is reachable from outside this machine. ` +
          'Put it behind a reverse proxy with TLS, or set PANEL_HOST=127.0.0.1.',
      );
      if (!isSetupComplete() && !panelPasswordConfigured()) {
        log.warn(
          'It has NO PASSWORD yet, so whoever reaches it first can claim it. Either set ' +
            'PANEL_PASSWORD in your environment, or keep the port closed until you have ' +
            'finished setup from this machine.',
        );
      }
    }
  });
  return server;
}
