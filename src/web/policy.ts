/**
 * Public-facing policy: limits, and validation of anything a stranger can send.
 *
 * The control panel trusts its operator; this app trusts nobody. Every field a
 * visitor can set is either clamped to a range or matched against a closed list.
 * Two fields in particular are load-bearing:
 *
 *   · `reciter` becomes a path segment in the everyayah.com URL, so it must come
 *     from the RECITERS registry — never a free string.
 *   · `fillColor` is interpolated RAW into the render page's <style> block, so it
 *     must be a literal hex (see render/options.ts).
 *
 * `backgroundLocalDir` is deliberately absent: it is a server filesystem path and
 * is never settable from the web.
 */
import { z } from 'zod';
import { RECITERS } from '../quran/reciters.js';
import { TRANSLATION_EDITIONS } from '../i18n.js';
import { HEX_COLOR } from '../render/options.js';
import { TEMPLATES, BASMALA_MODES } from '../store/store.js';

const num = (v: string | undefined, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : d;
};

/** Operator-tunable limits for the public app. */
export const policy = {
  port: num(process.env.WEB_PORT, 1999),
  /** Simultaneous renders. Each pins a Chrome + an ffmpeg; 1 is right for 2–4 cores. */
  concurrency: num(process.env.WEB_CONCURRENCY, 1),
  /** Refuse new jobs past this queue depth rather than promising a 40-minute wait. */
  queueMax: num(process.env.WEB_QUEUE_MAX, 20),
  /** Hard cap on passage length — the single biggest lever on render cost. */
  maxAyahs: num(process.env.WEB_MAX_AYAHS, 10),
  maxDurationSeconds: num(process.env.WEB_MAX_DURATION, 90),
  /** Jobs (and their work dirs) are swept this long after finishing. */
  jobTtlMinutes: num(process.env.WEB_JOB_TTL_MINUTES, 60),
  /**
   * How long a reel survives after its download completes.
   *
   * Not zero: deleting the instant the transfer lands means a visitor who saved
   * it to the wrong folder, or whose browser discarded it, has to render the
   * whole thing again. A few minutes costs about 2 MB of disk — the thing that
   * actually fills this server is Docker images, not reels.
   */
  downloadGraceMinutes: num(process.env.WEB_DOWNLOAD_GRACE_MINUTES, 3),
  /** Per-IP submissions per rolling hour, and concurrent jobs per IP. */
  ratePerHour: num(process.env.WEB_RATE_PER_HOUR, 5),
  maxActivePerIp: num(process.env.WEB_MAX_ACTIVE_PER_IP, 1),
  /** Honour X-Forwarded-For. Only enable behind a proxy you control. */
  trustProxy: process.env.WEB_TRUST_PROXY === 'true',
  /**
   * How many proxies sit in front of this app. Every per-IP limit depends on
   * getting this right, so it is a count rather than a boolean: X-Forwarded-For
   * is a list the client can seed and each hop appends to, which means only the
   * entries added by hops you control are trustworthy.
   */
  trustedProxies: num(process.env.WEB_TRUSTED_PROXIES, 1),
  /** Shown in the UI so people can star / self-host. */
  githubRepo: process.env.WEB_GITHUB_REPO || '911RS/tabligh',
  /** Optional Cloudflare Turnstile. Both empty = no captcha. */
  turnstileSecret: process.env.TURNSTILE_SECRET || '',
  turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || '',
} as const;

const RECITER_IDS = RECITERS.map((r) => r.id) as [string, ...string[]];
const EDITION_IDS = TRANSLATION_EDITIONS.flatMap((g) => g.editions.map((e) => e.id));

/** Background keywords are user text that reaches a third-party search API. Keep
 * it boring: letters, digits, spaces and hyphens, collapsed and length-capped. */
const keywords = z
  .string()
  .max(60)
  .transform((s) => s.replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim())
  .default('');

/** A handle is HTML-escaped downstream; this just keeps it sane and short. */
const handle = z
  .string()
  .max(24)
  .transform((s) => s.replace(/[^\p{L}\p{N}_.@-]/gu, '').trim())
  .default('');

export const PublicJobSchema = z
  .object({
    surah: z.coerce.number().int().min(1).max(114),
    ayahFrom: z.coerce.number().int().min(1).max(286),
    ayahTo: z.coerce.number().int().min(1).max(286),
    reciter: z.enum(RECITER_IDS).default('husary'),
    translationEdition: z.string().refine((v) => EDITION_IDS.includes(v), 'unknown translation').default('en.sahih'),

    template: z.enum(TEMPLATES as [string, ...string[]]).default('classic'),
    karaokeEnabled: z.coerce.boolean().default(true),
    particlesEnabled: z.coerce.boolean().default(true),
    bgAnimationEnabled: z.coerce.boolean().default(true),
    projectCreditEnabled: z.coerce.boolean().default(true),
    watermarkEnabled: z.coerce.boolean().default(false),
    watermarkHandle: handle,
    textFillColor: z.string().regex(HEX_COLOR, 'colour must be #rrggbb').default('#ffffff'),

    basmala: z.enum(BASMALA_MODES as [string, ...string[]]).default('off'),
    backgroundSource: z.enum(['auto', 'pexels', 'unsplash']).default('auto'),
    backgroundKeywords: keywords,
  })
  .transform((v) => {
    // Normalise the range, then clamp its LENGTH to the public cap. Done here
    // rather than with .refine so a too-greedy request is trimmed and served
    // instead of rejected — friendlier, and the cost ceiling is identical.
    const from = Math.min(v.ayahFrom, v.ayahTo);
    const to = Math.min(Math.max(v.ayahFrom, v.ayahTo), from + policy.maxAyahs - 1);
    return { ...v, ayahFrom: from, ayahTo: to };
  });

export type PublicJobInput = z.infer<typeof PublicJobSchema>;

/** Verify a Cloudflare Turnstile token. No secret configured → always passes. */
export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  if (!policy.turnstileSecret) return true;
  try {
    const body = new URLSearchParams({ secret: policy.turnstileSecret, response: token, remoteip: ip });
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    return res.ok && ((await res.json()) as { success?: boolean }).success === true;
  } catch {
    return false;
  }
}
