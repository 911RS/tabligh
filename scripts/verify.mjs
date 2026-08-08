/**
 * One command that proves a deployment actually works.
 *
 *   npm run verify                       # http://localhost:1999
 *   npm run verify -- http://host/       # anything else
 *   npm run verify -- <url> --render     # also render+download a real reel (slow)
 *
 * Every check here exists because that exact thing broke in production and the
 * checks in use at the time reported success. Two traps make this harder than
 * it looks, and both are handled below:
 *
 *   - curl does not obey CSP, so a header dump cannot tell you the page works.
 *   - browsers exempt `localhost` from upgrade-insecure-requests, so pointing a
 *     browser at localhost — or proxying production through it — hides the one
 *     directive capable of blanking the whole site.
 *
 * So: a tiny proxy forwards to the target, and Chrome reaches it under a fake
 * hostname it does NOT consider trustworthy. Assertions are on rendered state
 * ("did React mount") rather than status codes.
 */
import http from 'node:http';
import { once } from 'node:events';
import puppeteer from 'puppeteer';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith('--')));
const BASE = new URL(args[0] ?? 'http://localhost:1999/');
const FULL = flags.has('--render');

const results = [];
const ok = (name, detail = '') => results.push({ pass: true, name, detail });
const bad = (name, detail = '') => results.push({ pass: false, name, detail });

const get = (path, opts = {}) =>
  new Promise((resolve, reject) => {
    const req = http.request(
      { host: BASE.hostname, port: BASE.port || 80, path, method: opts.method ?? 'GET', headers: opts.headers },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
      },
    );
    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });

// ── A proxy so the browser can use an origin it does not trust ───────────────
const proxy = http.createServer((req, res) => {
  const up = http.request(
    { host: BASE.hostname, port: BASE.port || 80, path: req.url, method: req.method,
      headers: { ...req.headers, host: BASE.host } },
    (r) => { res.writeHead(r.statusCode, r.headers); r.pipe(res); },
  );
  up.on('error', (e) => { res.writeHead(502); res.end(String(e)); });
  req.pipe(up);
});
proxy.listen(0);
await once(proxy, 'listening');
const proxyPort = proxy.address().port;

console.log(`verifying ${BASE.origin}\n`);

// ── 1. HTTP-level checks ─────────────────────────────────────────────────────
try {
  const health = await get('/api/health');
  const j = JSON.parse(health.body.toString());
  j.ok ? ok('health', `queue ${j.queued}/${j.queueMax}`) : bad('health', health.body.toString());
} catch (e) { bad('health', String(e)); }

try {
  const meta = await get('/api/meta');
  const m = JSON.parse(meta.body.toString());
  m.surahs?.length === 114
    ? ok('meta', `${m.surahs.length} surahs, ${m.reciters.length} reciters`)
    : bad('meta', `expected 114 surahs, got ${m.surahs?.length}`);
} catch (e) { bad('meta', String(e)); }

const shell = await get('/');
shell.status === 200 ? ok('shell serves') : bad('shell serves', `HTTP ${shell.status}`);

// The shell names fingerprinted assets that change every deploy. Caching it
// outlives them, and a stale shell asks for a bundle that no longer exists.
/no-cache|no-store|max-age=0/.test(shell.headers['cache-control'] ?? '')
  ? ok('shell not cached', shell.headers['cache-control'])
  : bad('shell not cached', `cache-control: ${shell.headers['cache-control']} — a stale shell will ask for a deleted bundle`);

// A missing file must 404. Answering it with the shell hands the browser HTML
// where it expected a module, and it silently fails to execute.
const ghost = await get('/assets/index-DOESNOTEXIST.js');
ghost.status === 404
  ? ok('missing asset 404s')
  : bad('missing asset 404s', `HTTP ${ghost.status} ${ghost.headers['content-type']} — the SPA catch-all is swallowing asset requests`);

// The directive that blanked the site: it upgrades every subresource to https,
// so on a plain-HTTP origin nothing loads.
const csp = shell.headers['content-security-policy'] ?? '';
const isHttps = BASE.protocol === 'https:';
if (!csp) bad('CSP present');
else if (csp.includes('upgrade-insecure-requests') && !isHttps)
  bad('no upgrade-insecure-requests over HTTP', 'this alone blanks the site — nothing is listening on 443');
else ok('CSP sane', isHttps ? 'https, upgrade allowed' : 'http, upgrade correctly absent');

for (const h of ['x-content-type-options', 'x-frame-options', 'referrer-policy']) {
  shell.headers[h] ? ok(`header ${h}`, shell.headers[h]) : bad(`header ${h}`, 'missing');
}

for (const p of ['/ar', '/fr']) {
  const r = await get(p);
  r.status === 200 ? ok(`locale ${p}`) : bad(`locale ${p}`, `HTTP ${r.status}`);
}

// ── 2. The browser check, from an origin Chrome does not trust ───────────────
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
    `--host-resolver-rules=MAP studio.test 127.0.0.1:${proxyPort}`],
});
const page = await browser.newPage();
const failures = [];
page.on('requestfailed', (r) => failures.push(`${r.url()} :: ${r.failure()?.errorText}`));
page.on('pageerror', (e) => failures.push(`pageerror: ${e.message}`));

try {
  await page.goto('http://studio.test/', { waitUntil: 'networkidle2', timeout: 60_000 });
  await new Promise((r) => setTimeout(r, 3500));

  const state = await page.evaluate(() => ({
    mounted: !!document.querySelector('header') && !!document.querySelector('main'),
    seoLeftOver: !!document.querySelector('#seo-content'),
    studio: !!document.querySelector('#studio form, #studio [aria-busy]'),
    surahOptions: document.querySelectorAll('#surah option').length,
  }));

  state.mounted && !state.seoLeftOver
    ? ok('React mounts (untrusted origin)')
    : bad('React mounts (untrusted origin)', 'the SEO fallback is still on screen — no JavaScript ran');
  state.studio ? ok('studio renders') : bad('studio renders', 'no form and no loading state');
  state.surahOptions === 114
    ? ok('surah list populated', `${state.surahOptions} options`)
    : bad('surah list populated', `${state.surahOptions} options — the API did not reach the page`);

  // Blocked subresources are the signature of a CSP that is too tight.
  const blocked = failures.filter((f) => !f.includes('api.github.com'));
  blocked.length === 0 ? ok('no blocked resources') : bad('no blocked resources', blocked.slice(0, 3).join(' | '));
} catch (e) {
  bad('page loads', String(e).slice(0, 160));
}
await browser.close();

// ── 3. Optional: a real render, download and retention ───────────────────────
if (FULL) {
  console.log('  rendering a real reel…');
  const job = JSON.stringify({
    surah: 112, ayahFrom: 1, ayahTo: 1, reciter: 'husary', translationEdition: 'en.sahih',
    template: 'noor', karaokeEnabled: true, particlesEnabled: false, bgAnimationEnabled: false,
    projectCreditEnabled: true, watermarkEnabled: false, watermarkHandle: '',
    textFillColor: '#ffffff', basmala: 'off', backgroundSource: 'auto', backgroundKeywords: '',
  });
  const created = await get('/api/jobs', { method: 'POST', body: job, headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(job) } });
  const id = JSON.parse(created.body.toString()).id;
  if (!id) bad('render accepted', created.body.toString());
  else {
    let state = '';
    for (let i = 0; i < 150; i++) {
      await new Promise((r) => setTimeout(r, 4000));
      state = JSON.parse((await get(`/api/jobs/${id}`)).body.toString()).state;
      if (state === 'done' || state === 'failed') break;
    }
    state === 'done' ? ok('render completes') : bad('render completes', `state=${state}`);

    if (state === 'done') {
      // Watching the preview must NOT delete the file out from under Download.
      await get(`/d/${id}.mp4`);
      const alive = await get(`/api/jobs/${id}`);
      alive.status === 200 ? ok('preview does not purge') : bad('preview does not purge', `HTTP ${alive.status}`);

      const dl = await get(`/d/${id}.mp4?dl=1`);
      dl.status === 200 && dl.body.length > 100_000
        ? ok('download works', `${(dl.body.length / 1048576).toFixed(1)} MB`)
        : bad('download works', `HTTP ${dl.status}, ${dl.body.length} bytes`);

      // The grace window is the point: a second attempt must still succeed.
      const again = await get(`/d/${id}.mp4?dl=1`);
      again.status === 200 ? ok('second download within grace') : bad('second download within grace', `HTTP ${again.status}`);
    }
  }
}

proxy.close();

// ── Report ───────────────────────────────────────────────────────────────────
console.log();
for (const r of results) {
  console.log(`  ${r.pass ? '✓' : '✗'} ${r.name}${r.detail ? `  — ${r.detail}` : ''}`);
}
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.log(`\nFAILED: ${failed.map((f) => f.name).join(', ')}`);
  process.exit(1);
}
console.log('all good');
