/**
 * The public web app.
 *
 * Deliberately a separate process from the control panel (src/server/panel.ts):
 * this one has no session, no settings writes and no route that can reach the
 * publisher. The blast radius of a bug here is a wasted render, not a hijacked
 * social account.
 *
 * Serves: the built SPA (with per-locale SEO head), the render API, and the
 * finished MP4s.
 */
import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { RECITERS } from '../quran/reciters.js';
import { fetchAllSurahs } from '../quran/quranApi.js';
import { TRANSLATION_EDITIONS } from '../i18n.js';
import { TEMPLATES } from '../store/store.js';
import { log } from '../util/log.js';
import { policy, PublicJobSchema, verifyTurnstile } from './policy.js';
import {
  checkAdmission, getJob, purgeJob, queueStats, resetOutputDir, startSweeper, submit, viewJob,
} from './queue.js';
import { isLocale, LOCALES, renderShell, robots, sitemap } from './seo.js';

const WEB_ROOT = join(process.cwd(), 'dist', 'web');

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

function json(res: ServerResponse, code: number, body: unknown): void {
  const s = JSON.stringify(body);
  res.writeHead(code, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(s),
    'cache-control': 'no-store',
  });
  res.end(s);
}

async function readBody(req: IncomingMessage, limit = 16_384): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const c of req) {
    size += (c as Buffer).length;
    // A render request is a few hundred bytes; anything larger is not ours.
    if (size > limit) throw new Error('payload too large');
    chunks.push(c as Buffer);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString());
}

function clientIp(req: IncomingMessage): string {
  if (policy.trustProxy) {
    const fwd = req.headers['x-forwarded-for'];
    if (typeof fwd === 'string' && fwd) return fwd.split(',')[0].trim();
  }
  return req.socket.remoteAddress ?? 'unknown';
}

/** Serve a file with Range support — browsers need 206 to scrub a <video>. */
function sendFile(req: IncomingMessage, res: ServerResponse, file: string, cache: string): void {
  const { size } = statSync(file);
  const type = MIME[extname(file).toLowerCase()] ?? 'application/octet-stream';
  const range = req.headers.range;

  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (m) {
      const start = m[1] ? Number(m[1]) : 0;
      const end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
      if (start >= size || start > end) {
        res.writeHead(416, { 'content-range': `bytes */${size}` });
        res.end();
        return;
      }
      res.writeHead(206, {
        'content-type': type,
        'content-length': end - start + 1,
        'content-range': `bytes ${start}-${end}/${size}`,
        'accept-ranges': 'bytes',
        'cache-control': cache,
      });
      return void createReadStream(file, { start, end }).pipe(res);
    }
  }

  res.writeHead(200, {
    'content-type': type,
    'content-length': size,
    'accept-ranges': 'bytes',
    'cache-control': cache,
  });
  createReadStream(file).pipe(res);
}

// ── API ──────────────────────────────────────────────────────────────────────
async function api(req: IncomingMessage, res: ServerResponse, path: string): Promise<void> {
  const method = req.method ?? 'GET';

  if (path === '/api/meta' && method === 'GET') {
    try {
      const surahs = await fetchAllSurahs();
      return json(res, 200, {
        surahs,
        reciters: RECITERS.map((r) => ({ id: r.id, name: r.name, style: r.style })),
        translations: TRANSLATION_EDITIONS,
        templates: TEMPLATES,
        limits: {
          maxAyahs: policy.maxAyahs,
          maxDurationSeconds: policy.maxDurationSeconds,
          ratePerHour: policy.ratePerHour,
          jobTtlMinutes: policy.jobTtlMinutes,
        },
        queue: queueStats(),
        github: policy.githubRepo,
        turnstileSiteKey: policy.turnstileSiteKey,
      });
    } catch (e) {
      return json(res, 503, { error: e instanceof Error ? e.message : 'upstream unavailable' });
    }
  }

  if (path === '/api/jobs' && method === 'POST') {
    const ip = clientIp(req);

    let body: unknown;
    try {
      body = await readBody(req);
    } catch {
      return json(res, 400, { error: 'invalid request' });
    }

    const parsed = PublicJobSchema.safeParse(body);
    if (!parsed.success) {
      return json(res, 400, { error: parsed.error.issues[0]?.message ?? 'invalid input' });
    }

    const token = typeof (body as { turnstileToken?: string })?.turnstileToken === 'string'
      ? (body as { turnstileToken: string }).turnstileToken
      : '';
    if (!(await verifyTurnstile(token, ip))) {
      return json(res, 403, { error: 'Captcha verification failed. Please reload and try again.' });
    }

    const reject = checkAdmission(ip);
    if (reject) {
      if (reject.retryAfterMinutes) res.setHeader('retry-after', String(reject.retryAfterMinutes * 60));
      return json(res, reject.code === 'full' ? 503 : 429, { error: reject.message, code: reject.code });
    }

    const job = submit(parsed.data, ip);
    return json(res, 202, { id: job.id });
  }

  const jobMatch = /^\/api\/jobs\/([A-Za-z0-9_-]{4,32})$/.exec(path);
  if (jobMatch && method === 'GET') {
    const job = getJob(jobMatch[1]);
    if (!job) return json(res, 404, { error: 'That render has expired.' });
    return json(res, 200, viewJob(job));
  }

  if (path === '/api/health') return json(res, 200, { ok: true, ...queueStats() });

  return json(res, 404, { error: 'not found' });
}

/**
 * Serve a finished render. Ids are unguessable, so possession of the id is the
 * authorisation — there are no accounts to check against.
 *
 * `?dl=1` marks the visitor's actual download, as opposed to the result view's
 * inline <video> streaming the same URL to play it. Only the former deletes the
 * file afterwards: purging on any GET would have the preview delete the reel
 * out from under the Download button next to it.
 */
function download(
  res: ServerResponse,
  req: IncomingMessage,
  id: string,
  ext: string,
  save: boolean,
): void {
  const job = getJob(id);
  const file = ext === '.jpg' ? job?.thumb : job?.file;
  if (!job || job.state !== 'done' || !file || !existsSync(file)) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    return void res.end('This render has expired.');
  }

  const name = `tabligh-${job.result?.surahEnglishName ?? 'reel'}-${job.result?.ayahFrom ?? ''}.mp4`;
  if (ext === '.mp4') {
    res.setHeader('content-disposition', `${save ? 'attachment' : 'inline'}; filename="${name}"`);
  }

  // A range request is one slice of a download that is still in progress;
  // deleting on it would break the very transfer that asked for it.
  const partial = Boolean(req.headers.range);
  if (save && ext === '.mp4' && !partial) {
    // 'finish', not 'close'. 'close' waits for the socket itself, which under
    // keep-alive is reaped seconds after the body has landed — long enough for
    // the file to still be re-downloadable after we claimed to have deleted it.
    // 'finish' fires exactly when the whole body has been flushed, and does not
    // fire at all if the client aborts mid-transfer.
    res.on('finish', () => void purgeJob(id));
  }

  sendFile(req, res, file, 'private, max-age=600');
}

// ── Static + SPA ─────────────────────────────────────────────────────────────
let shellCache: string | null = null;
function shell(): string | null {
  if (shellCache) return shellCache;
  const f = join(WEB_ROOT, 'index.html');
  if (!existsSync(f)) return null;
  shellCache = readFileSync(f, 'utf8');
  return shellCache;
}

function serveStatic(req: IncomingMessage, res: ServerResponse, pathname: string): boolean {
  // normalize() then a prefix check defeats ../ traversal.
  const file = normalize(join(WEB_ROOT, decodeURIComponent(pathname)));
  if (!file.startsWith(WEB_ROOT) || !existsSync(file) || !statSync(file).isFile()) return false;
  // Vite fingerprints /assets/*; everything else stays short-lived.
  const immutable = pathname.startsWith('/assets/') || pathname.startsWith('/fonts/');
  sendFile(req, res, file, immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=3600');
  return true;
}

export function startWebApp(): http.Server {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      const p = url.pathname;

      if (p.startsWith('/api/')) return await api(req, res, p);

      const dl = /^\/d\/([A-Za-z0-9_-]{4,32})(\.mp4|\.jpg)$/.exec(p);
      if (dl) return download(res, req, dl[1], dl[2], url.searchParams.get('dl') === '1');

      if (p === '/robots.txt') {
        res.writeHead(200, { 'content-type': MIME['.txt'] });
        return void res.end(robots());
      }
      if (p === '/sitemap.xml') {
        res.writeHead(200, { 'content-type': MIME['.xml'] });
        return void res.end(sitemap());
      }

      if (serveStatic(req, res, p)) return;

      // Anything else is an SPA route. `/xx/...` selects the locale.
      const s = shell();
      if (!s) {
        res.writeHead(503, { 'content-type': 'text/plain; charset=utf-8' });
        return void res.end('The web app has not been built yet. Run: npm run build:web');
      }
      const seg = p.split('/')[1] ?? '';
      const locale = isLocale(seg) ? seg : 'en';
      const html = renderShell(s, locale);
      res.writeHead(200, {
        'content-type': MIME['.html'],
        'cache-control': 'public, max-age=300',
        'content-language': locale,
        // Belt and braces: no inline third-party anything.
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'strict-origin-when-cross-origin',
      });
      res.end(html);
    } catch (e) {
      log.error(`web: ${e instanceof Error ? e.message : e}`);
      if (!res.headersSent) json(res, 500, { error: 'server error' });
      else res.end();
    }
  });

  void resetOutputDir();
  startSweeper();

  server.listen(policy.port, () => {
    log.ok(`Public web app on :${policy.port} · concurrency=${policy.concurrency} · cap=${policy.maxAyahs} ayahs · locales=${LOCALES.length}`);
    if (!shell()) log.warn('dist/web is missing — build the frontend with: npm run build:web');
  });
  return server;
}
