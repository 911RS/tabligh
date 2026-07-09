import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import { statSync, createReadStream } from 'node:fs';
import { env } from '../config.js';
import {
  settings, updateSettings, secrets, updateSecrets, isSetupComplete, markSetupComplete, listPosts,
} from '../store/store.js';
import { hashPassword, verifyPassword, signSession, verifySession, readCookie, SESSION_COOKIE } from '../auth.js';
import { isConfigured, listChannels } from '../publish/buffer.js';
import { runJob, isBusy, runnerStatus, findLatestVideo } from './runner.js';
import { log } from '../util/log.js';
import { PANEL_HTML } from './ui.js';

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
    setupComplete: isSetupComplete(),
    publishConfigured: isConfigured(),
    busy: isBusy(),
    status: runnerStatus(),
    schedule: sch,
    secretsPresent: {
      pexels: !!sec.pexelsKey, unsplash: !!sec.unsplashKey, buffer: !!sec.bufferToken,
      minio: !!sec.minio.endpoint, password: !!sec.panelPasswordHash,
    },
  };
}

async function api(req: IncomingMessage, res: ServerResponse, path: string): Promise<void> {
  const method = req.method ?? 'GET';

  if (path === '/api/status') return json(res, 200, { ...statusPayload(), authed: authed(req) });

  // Web setup — allowed without auth ONLY while setup is incomplete.
  if (path === '/api/setup' && method === 'POST') {
    if (isSetupComplete()) return json(res, 403, { error: 'already set up' });
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
    const b = await readBody(req);
    if (verifyPassword(String(b.password ?? ''), secrets().panelPasswordHash)) {
      setSession(res);
      return json(res, 200, { ok: true });
    }
    return json(res, 401, { error: 'wrong password' });
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

  if (path === '/api/history' && method === 'GET') return json(res, 200, listPosts(100));

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

/** Start the control-panel HTTP server (API + embedded SPA). */
export function startServer(): void {
  http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      if (url.pathname.startsWith('/api/')) return await api(req, res, url.pathname);
      if (legacy(req, res, url)) return;
      // Everything else → the single-page panel (client routes on setup/login/dashboard).
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(PANEL_HTML);
    } catch (e) {
      json(res, 500, { error: e instanceof Error ? e.message : 'server error' });
    }
  }).listen(env.port, () => log.ok(`Control panel on :${env.port}`));
}
