import { env } from '../config.js';
import { log } from '../util/log.js';

/**
 * A background the HTML layer can drop straight into `background:` — either an
 * embedded image data-URI (from Pexels/Unsplash) or a CSS gradient fallback.
 * Returned as a CSS value string so the renderer stays agnostic.
 */
export interface Background {
  css: string;
  kind: 'image' | 'gradient';
  credit?: string;
}

// Calm, deep gradients that read well behind light Arabic text. Deterministic
// pick by a seed so a given passage always looks the same across re-renders.
const GRADIENTS = [
  'linear-gradient(160deg, #0f2027 0%, #203a43 55%, #2c5364 100%)',
  'linear-gradient(160deg, #093028 0%, #237a57 100%)',
  'linear-gradient(160deg, #1a2a6c 0%, #2a5298 60%, #1e3c72 100%)',
  'linear-gradient(160deg, #232526 0%, #414345 100%)',
  'linear-gradient(160deg, #0b486b 0%, #3b8686 100%)',
];

function gradientFor(seed: number): Background {
  return { css: GRADIENTS[seed % GRADIENTS.length], kind: 'gradient' };
}

async function fetchAsDataUri(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': 'QuranPoster/0.1 (+background)' } });
  if (!res.ok) throw new Error(`background image ${res.status}`);
  const mime = res.headers.get('content-type') ?? 'image/jpeg';
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:${mime};base64,${buf.toString('base64')}`;
}

async function searchPexels(query: string): Promise<string | null> {
  if (!env.pexelsKey) return null;
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=portrait`;
  const res = await fetch(url, { headers: { Authorization: env.pexelsKey } });
  if (!res.ok) return null;
  const body = (await res.json()) as { photos?: { src: { large2x?: string; large?: string; original: string } }[] };
  const p = body.photos?.[0];
  return p ? p.src.large2x ?? p.src.large ?? p.src.original : null;
}

async function searchUnsplash(query: string): Promise<string | null> {
  if (!env.unsplashKey) return null;
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=15&orientation=portrait`;
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${env.unsplashKey}` } });
  if (!res.ok) return null;
  const body = (await res.json()) as { results?: { urls: { regular?: string; full: string } }[] };
  const r = body.results?.[0];
  return r ? r.urls.regular ?? r.urls.full : null;
}

/**
 * Resolve a background for a job. Tries Pexels→Unsplash for the given keywords
 * (portrait), embeds the winner as a data-URI. Falls back to a seeded gradient
 * if there are no keys / no results — so rendering never blocks on stock APIs.
 */
export async function resolveBackground(
  keywords: string[],
  source: 'pexels' | 'unsplash' | 'auto',
  seed: number,
): Promise<Background> {
  const query = keywords.filter(Boolean).join(' ').trim();
  if (query) {
    try {
      let imgUrl: string | null = null;
      if (source === 'pexels' || source === 'auto') imgUrl = await searchPexels(query);
      if (!imgUrl && (source === 'unsplash' || source === 'auto')) imgUrl = await searchUnsplash(query);
      if (imgUrl) {
        const dataUri = await fetchAsDataUri(imgUrl);
        log.step(`Background: stock image for "${query}"`);
        return { css: `url('${dataUri}')`, kind: 'image', credit: query };
      }
    } catch (e) {
      log.warn(`Stock background failed (${e instanceof Error ? e.message : e}); using gradient`);
    }
  }
  log.step('Background: gradient fallback');
  return gradientFor(seed);
}
