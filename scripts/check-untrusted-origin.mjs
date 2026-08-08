/**
 * Loads the app from a NON-localhost http:// origin.
 *
 * localhost is "potentially trustworthy", so browsers exempt it from
 * upgrade-insecure-requests — which is precisely why testing against
 * http://localhost hid a CSP directive that broke every real visitor.
 * The resolver rule gives us an untrusted origin pointing at the same server.
 */
import puppeteer from 'puppeteer';
const target = process.argv[2] || '127.0.0.1:1999';
const b = await puppeteer.launch({ headless:true, args:[
  '--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage',
  `--host-resolver-rules=MAP studio.test ${target}`,
]});
const p = await b.newPage();
const bad=[];
p.on('requestfailed', r => bad.push(`FAILED ${r.url().slice(0,80)} :: ${r.failure()?.errorText}`));
p.on('console', m => { if (m.type()==='error') bad.push(`[console] ${m.text().slice(0,110)}`); });
await p.goto('http://studio.test/', { waitUntil:'networkidle2', timeout:60000 });
await new Promise(r=>setTimeout(r,3500));
const s = await p.evaluate(() => ({
  reactMounted: !!document.querySelector('header'),
  seoStillShowing: !!document.querySelector('#seo-content'),
  text: (document.body.innerText||'').trim().slice(0,55),
}));
console.log(`origin http://studio.test (untrusted) -> ${target}`);
console.log('  reactMounted     :', s.reactMounted);
console.log('  seoStillShowing  :', s.seoStillShowing);
console.log('  firstText        :', JSON.stringify(s.text));
console.log('  problems         :'); [...new Set(bad)].slice(0,6).forEach(x=>console.log('    '+x));
console.log(s.reactMounted && !s.seoStillShowing ? '\n  PASS — the UI renders' : '\n  FAIL — no UI');
await b.close();
process.exit(s.reactMounted && !s.seoStillShowing ? 0 : 1);
