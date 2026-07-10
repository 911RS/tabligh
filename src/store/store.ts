import { mkdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { env } from '../config.js';
import type { PostMode } from '../publish/buffer.js';

/**
 * Persisted store — the single source of truth the control panel edits, so
 * settings changes take effect live without editing .env or restarting.
 * Env vars are used only to SEED the store on first run (backward compatible).
 * The data layer is intentionally simple (JSON) and abstracted so it can be
 * swapped for SQLite/Postgres when this goes multi-tenant.
 */

export type UiLang = 'en' | 'ar' | 'fr' | 'ur' | 'id' | 'tr' | 'ms' | 'bn' | 'fa' | 'es';
export const UI_LANGS: UiLang[] = ['en', 'ar', 'fr', 'ur', 'id', 'tr', 'ms', 'bn', 'fa', 'es'];
export type BackgroundSource = 'auto' | 'pexels' | 'unsplash' | 'local';
/** Visual template for the rendered reel. */
export type Template = 'classic' | 'glass' | 'noor';
export const TEMPLATES: Template[] = ['classic', 'glass', 'noor'];
/** Prepend the reciter's Bismillah (Fatiha 1:1) before a passage.
 *  off = only when the passage starts at ayah 1 (this rule always applies) ·
 *  always = before every passage. Ayah-1 passages get the basmala either way. */
export type BasmalaMode = 'off' | 'always';
export const BASMALA_MODES: BasmalaMode[] = ['off', 'always'];

export interface Settings {
  schedule: { tz: string; times: string[]; enabled: boolean };
  content: {
    reciter: string;
    translationEdition: string;
    fullSurahMaxAyahs: number;
    randomMinAyahs: number;
    randomMaxAyahs: number;
    /** Max recitation length (excluding outro), seconds. 0 = no limit. Trailing
     * ayahs are dropped until the passage fits. */
    maxDurationSeconds: number;
    backgroundKeywords: string[];
    /** Where background images come from. 'local' picks from backgroundLocalDir. */
    backgroundSource: BackgroundSource;
    /** Folder of your own portrait images, used when backgroundSource === 'local'. */
    backgroundLocalDir: string;
    /** Prepend the reciter's own Bismillah before the passage. */
    basmala: BasmalaMode;
  };
  /** Interactive terminal UI preferences. */
  ui: { lang: UiLang };
  branding: {
    /** Visual style of the rendered reel. */
    template: Template;
    watermarkEnabled: boolean;
    watermarkHandle: string;
    textFillColor: string;
    karaokeEnabled: boolean;
    outroText: string;
    /** Drifting particle glints over the video. */
    particlesEnabled: boolean;
    /** Slow cinematic background zoom/breathing. */
    bgAnimationEnabled: boolean;
    /** Show the "Check the Tabligh project" line in the outro (link always shown). */
    projectCreditEnabled: boolean;
  };
  publish: {
    channels: { tiktok: string[]; instagram: string[]; facebook: string[]; youtube: string[] };
    mode: PostMode;
    deleteMinioOnPublish: boolean;
    minioRetentionHours: number;
  };
  cleanup: { retentionDays: number };
}

export interface Secrets {
  pexelsKey: string;
  unsplashKey: string;
  bufferToken: string;
  minio: { endpoint: string; port: number; useSSL: boolean; accessKey: string; secretKey: string; bucket: string; publicUrl: string };
  panelPasswordHash: string;
  sessionSecret: string;
  triggerToken: string;
}

export interface PostRecord {
  id: string;
  ts: string;
  surah: number;
  ayahFrom: number;
  ayahTo: number;
  reciter: string;
  reciterName: string;
  status: 'rendered' | 'published' | 'failed' | 'pending-approval';
  platforms?: string[];
  postIds?: string[];
  error?: string;
  key: string; // surah:from-to for de-dup
}

export interface QueueItem {
  id: string;
  surah: number;
  ayahFrom: number;
  ayahTo: number;
  reciter?: string;
  addedAt: string;
  note?: string;
}

export interface StoreData {
  version: number;
  setupComplete: boolean;
  settings: Settings;
  secrets: Secrets;
  posts: PostRecord[];
  queue: QueueItem[];
}

const STORE_PATH = process.env.STORE_PATH || join(process.cwd(), 'data', 'store.json');

/** Build the initial store seeded from environment variables. */
function seedFromEnv(): StoreData {
  return {
    version: 1,
    setupComplete: false,
    settings: {
      schedule: {
        tz: process.env.TZ || 'Africa/Tunis',
        times: (process.env.PUBLISH_TIMES || '07:00,13:00,19:00').split(',').map((s) => s.trim()).filter(Boolean),
        enabled: true,
      },
      content: {
        reciter: 'husary',
        translationEdition: 'en.sahih',
        fullSurahMaxAyahs: env.fullSurahMaxAyahs,
        randomMinAyahs: env.randomMinAyahs,
        randomMaxAyahs: env.randomMaxAyahs,
        maxDurationSeconds: env.maxVideoSeconds,
        backgroundKeywords: [],
        backgroundSource: env.backgroundSource,
        backgroundLocalDir: env.backgroundLocalDir,
        basmala: env.basmala,
      },
      ui: { lang: env.uiLang },
      branding: {
        template: env.template,
        watermarkEnabled: env.watermarkEnabled,
        watermarkHandle: process.env.WATERMARK_HANDLE || '',
        textFillColor: env.textFillColor,
        karaokeEnabled: env.karaokeEnabled,
        outroText: env.outroText,
        particlesEnabled: env.particlesEnabled,
        bgAnimationEnabled: env.bgAnimationEnabled,
        projectCreditEnabled: env.projectCreditEnabled,
      },
      publish: {
        channels: {
          tiktok: [...env.bufferChannels.tiktok],
          instagram: [...env.bufferChannels.instagram],
          facebook: [...env.bufferChannels.facebook],
          youtube: [...env.bufferChannels.youtube],
        },
        mode: 'addToQueue',
        deleteMinioOnPublish: env.deleteMinioOnPublish,
        minioRetentionHours: env.minioRetentionHours,
      },
      cleanup: { retentionDays: env.retentionDays },
    },
    secrets: {
      pexelsKey: env.pexelsKey,
      unsplashKey: env.unsplashKey,
      bufferToken: env.bufferToken,
      minio: { ...env.minio },
      panelPasswordHash: '',
      sessionSecret: '',
      triggerToken: env.triggerToken,
    },
    posts: [],
    queue: [],
  };
}

let _cache: { data: StoreData; mtime: number } | null = null;

/** Load the store from disk, seeding + persisting it on first run. */
export function loadStore(): StoreData {
  if (!existsSync(STORE_PATH)) {
    const seeded = seedFromEnv();
    saveStore(seeded);
    return seeded;
  }
  const mtime = statSync(STORE_PATH).mtimeMs;
  if (_cache && _cache.mtime === mtime) return _cache.data;
  const loaded = JSON.parse(readFileSync(STORE_PATH, 'utf8')) as Partial<StoreData>;
  // Merge over fresh defaults so fields added in newer versions always exist.
  const base = seedFromEnv();
  const data: StoreData = {
    version: loaded.version ?? base.version,
    setupComplete: loaded.setupComplete ?? base.setupComplete,
    settings: deepMerge(base.settings, (loaded.settings ?? {}) as DeepPartial<Settings>),
    secrets: deepMerge(base.secrets, (loaded.secrets ?? {}) as DeepPartial<Secrets>),
    posts: loaded.posts ?? [],
    queue: loaded.queue ?? [],
  };
  _cache = { data, mtime };
  return data;
}

export function saveStore(data: StoreData): void {
  mkdirSync(dirname(STORE_PATH), { recursive: true });
  writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
  _cache = { data, mtime: statSync(STORE_PATH).mtimeMs };
}

/** Live settings (store-first). Read fresh so panel edits apply without restart. */
export const settings = (): Settings => loadStore().settings;
export const secrets = (): Secrets => loadStore().secrets;

export function updateSettings(patch: DeepPartial<Settings>): Settings {
  const data = loadStore();
  data.settings = deepMerge(data.settings, patch);
  saveStore(data);
  return data.settings;
}

export function updateSecrets(patch: DeepPartial<Secrets>): void {
  const data = loadStore();
  data.secrets = deepMerge(data.secrets, patch);
  saveStore(data);
}

export function markSetupComplete(): void {
  const data = loadStore();
  data.setupComplete = true;
  saveStore(data);
}

export function isSetupComplete(): boolean {
  return loadStore().setupComplete;
}

export function addPost(rec: PostRecord): void {
  const data = loadStore();
  data.posts.unshift(rec);
  data.posts = data.posts.slice(0, 2000); // cap history
  saveStore(data);
}

export function listPosts(limit = 100): PostRecord[] {
  return loadStore().posts.slice(0, limit);
}

/** Passages already posted (published) — for de-dup. */
export function postedKeys(): Set<string> {
  return new Set(loadStore().posts.filter((p) => p.status === 'published').map((p) => p.key));
}

export function listQueue(): QueueItem[] {
  return loadStore().queue ?? [];
}
export function addQueueItem(item: Omit<QueueItem, 'id' | 'addedAt'> & { id: string }): void {
  const data = loadStore();
  (data.queue ??= []).push({ ...item, addedAt: new Date().toISOString() });
  saveStore(data);
}
export function removeQueueItem(id: string): void {
  const data = loadStore();
  data.queue = (data.queue ?? []).filter((q) => q.id !== id);
  saveStore(data);
}
/** Remove and return the next queued item (FIFO), or null. */
export function popQueueItem(): QueueItem | null {
  const data = loadStore();
  const q = data.queue ?? [];
  if (!q.length) return null;
  const item = q.shift()!;
  data.queue = q;
  saveStore(data);
  return item;
}

// ── tiny deep-merge helpers ───────────────────────────────────────────────
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

function deepMerge<T>(base: T, patch: DeepPartial<T>): T {
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...base };
  for (const k of Object.keys(patch) as (keyof T)[]) {
    const pv = patch[k] as any;
    if (pv === undefined) continue;
    const bv = (base as any)[k];
    out[k] = pv && typeof pv === 'object' && !Array.isArray(pv) && bv && typeof bv === 'object'
      ? deepMerge(bv, pv)
      : pv;
  }
  return out;
}
