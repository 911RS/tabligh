import { secrets } from '../store/store.js';
import { log } from '../util/log.js';
import { BACKGROUND_KEYWORDS, altIsSafe } from './keywords.js';

/** Attribution for a stock photo, surfaced in the post caption. */
export interface PhotoCredit {
  source: 'Pexels' | 'Unsplash';
  author: string;
  url: string;
}

/**
 * A background the HTML layer drops into `background:` — an embedded image
 * data-URI (from Pexels/Unsplash) or a CSS gradient fallback.
 */
export interface Background {
  css: string;
  kind: 'image' | 'gradient';
  credit?: PhotoCredit;
}

// Deep, cinematic gradient fallbacks used only when no stock key/result.
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

interface Found { imgUrl: string; credit: PhotoCredit }

async function searchPexels(query: string): Promise<Found | null> {
  if (!secrets().pexelsKey) return null;
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=20&orientation=portrait`;
  const res = await fetch(url, { headers: { Authorization: secrets().pexelsKey } });
  if (!res.ok) return null;
  const body = (await res.json()) as {
    photos?: { src: { portrait?: string; large2x?: string; large?: string; original: string }; photographer: string; url: string; alt?: string }[];
  };
  const safe = (body.photos ?? []).filter((p) => altIsSafe(p.alt)); // drop any people/NSFW
  if (!safe.length) return null;
  const p = safe[Math.floor(Math.random() * safe.length)];
  return {
    imgUrl: p.src.portrait ?? p.src.large2x ?? p.src.large ?? p.src.original,
    credit: { source: 'Pexels', author: p.photographer, url: p.url },
  };
}

async function searchUnsplash(query: string): Promise<Found | null> {
  if (!secrets().unsplashKey) return null;
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=20&orientation=portrait`;
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${secrets().unsplashKey}` } });
  if (!res.ok) return null;
  const body = (await res.json()) as {
    results?: { urls: { regular?: string; full: string }; user: { name: string }; links: { html: string }; alt_description?: string }[];
  };
  const safe = (body.results ?? []).filter((r) => altIsSafe(r.alt_description));
  if (!safe.length) return null;
  const r = safe[Math.floor(Math.random() * safe.length)];
  return {
    imgUrl: r.urls.regular ?? r.urls.full,
    credit: { source: 'Unsplash', author: r.user.name, url: r.links.html },
  };
}

/**
 * Resolve a portrait background for the given keywords (Pexels→Unsplash),
 * embedding it as a data-URI. Falls back to a seeded gradient with no credit.
 */
export async function resolveBackground(
  keywords: string[],
  source: 'pexels' | 'unsplash' | 'auto',
  seed: number,
): Promise<Background> {
  const provided = keywords.filter(Boolean).join(' ').trim();
  const query = provided || BACKGROUND_KEYWORDS[seed % BACKGROUND_KEYWORDS.length];
  try {
    let found: Found | null = null;
    if (source === 'pexels' || source === 'auto') found = await searchPexels(query);
    if (!found && (source === 'unsplash' || source === 'auto')) found = await searchUnsplash(query);
    if (found) {
      const dataUri = await fetchAsDataUri(found.imgUrl);
      log.step(`Background: ${found.credit.source} photo by ${found.credit.author} ("${query}")`);
      return { css: `url('${dataUri}')`, kind: 'image', credit: found.credit };
    }
  } catch (e) {
    log.warn(`Stock background failed (${e instanceof Error ? e.message : e}); using gradient`);
  }
  log.step('Background: gradient fallback');
  return gradientFor(seed);
}
