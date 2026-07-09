import { readFileSync } from 'node:fs';
import { z } from 'zod';
import 'dotenv/config';

/** A single reel job: which passage, which reciter, how to style/publish. */
export const JobSchema = z.object({
  surah: z.number().int().min(1).max(114),
  ayahFrom: z.number().int().min(1),
  ayahTo: z.number().int().min(1),
  /** everyayah reciter id, name, or raw folder (see reciters.ts) */
  reciter: z.string().default('husary'),
  /** alquran.cloud translation edition, e.g. en.sahih, fr.hamidullah. '' = Arabic only */
  translationEdition: z.string().default('en.sahih'),
  background: z
    .object({
      source: z.enum(['pexels', 'unsplash', 'auto']).default('auto'),
      keywords: z.array(z.string()).default([]),
    })
    .default({ source: 'auto', keywords: [] }),
  /** Watermark handle shown on the reel, e.g. "@myaccount". '' = none. */
  watermarkHandle: z.string().default(''),
  /** Post to Buffer/TikTok at the end. Default false = render only. */
  publish: z.boolean().default(false),
}).refine((j) => j.ayahTo >= j.ayahFrom, {
  message: 'ayahTo must be >= ayahFrom',
  path: ['ayahTo'],
});

export type Job = z.infer<typeof JobSchema>;

/** Split a comma-separated env value into a trimmed, non-empty id list. */
const parseIds = (v: string | undefined): string[] =>
  (v ?? '').split(',').map((s) => s.trim()).filter(Boolean);

/** Process-level env, validated once. */
export const env = {
  quranApiBase: process.env.QURAN_API_BASE ?? 'https://api.alquran.cloud/v1',
  everyayahBase: process.env.EVERYAYAH_BASE ?? 'https://everyayah.com/data',
  pexelsKey: process.env.PEXELS_API_KEY ?? '',
  unsplashKey: process.env.UNSPLASH_ACCESS_KEY ?? '',
  puppeteerExecutablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  bufferToken: process.env.BUFFER_ACCESS_TOKEN ?? '',
  // Buffer channel ids per platform — post to any/all you configure.
  bufferChannels: {
    tiktok: parseIds(process.env.BUFFER_TIKTOK_CHANNEL_IDS),
    instagram: parseIds(process.env.BUFFER_INSTAGRAM_CHANNEL_IDS),
    facebook: parseIds(process.env.BUFFER_FACEBOOK_CHANNEL_IDS),
    youtube: parseIds(process.env.BUFFER_YOUTUBE_CHANNEL_IDS),
  },
  minio: {
    endpoint: process.env.MINIO_ENDPOINT ?? '',
    port: Number(process.env.MINIO_PORT ?? '9000'),
    useSSL: (process.env.MINIO_USE_SSL ?? 'false') === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY ?? '',
    secretKey: process.env.MINIO_SECRET_KEY ?? '',
    bucket: process.env.MINIO_BUCKET_NAME ?? 'tabligh',
    publicUrl: (process.env.MINIO_PUBLIC_URL ?? '').replace(/\/$/, ''),
  },
  retentionDays: Number(process.env.RETENTION_DAYS ?? '7'),
  // Hours to keep uploaded videos on MinIO before `prune` removes them
  // (must outlast Buffer's ingest of the media). 24h is the safe default.
  minioRetentionHours: Number(process.env.MINIO_RETENTION_HOURS ?? '24'),
  // If a surah has this many ayahs or fewer, render the WHOLE surah regardless
  // of the requested range. Set to 0 to disable.
  fullSurahMaxAyahs: Number(process.env.FULL_SURAH_MAX_AYAHS ?? '7'),
  // `random` mode: pick a consecutive run of this many ayahs (from long surahs).
  randomMinAyahs: Number(process.env.RANDOM_MIN_AYAHS ?? '5'),
  randomMaxAyahs: Number(process.env.RANDOM_MAX_AYAHS ?? '10'),
  // Cap the recitation length (excluding outro), seconds. Trailing ayahs are
  // dropped until it fits (overrides the min-ayah floor). 0 = no limit.
  maxVideoSeconds: Number(process.env.MAX_VIDEO_SECONDS ?? '0'),
  // HTTP server (serve mode): port + secret for the manual /trigger endpoint.
  port: Number(process.env.PORT ?? '3000'),
  triggerToken: process.env.TRIGGER_TOKEN ?? '',
  // Karaoke word-by-word fill synced to the recitation.
  karaokeEnabled: (process.env.KARAOKE_ENABLED ?? 'true') === 'true',
  // Drifting particle glints and animated background zoom.
  particlesEnabled: (process.env.PARTICLES_ENABLED ?? 'true') === 'true',
  bgAnimationEnabled: (process.env.BG_ANIMATION ?? 'true') === 'true',
  projectCreditEnabled: (process.env.PROJECT_CREDIT ?? 'true') === 'true',
  // Color of already-recited (filled) karaoke text; unfilled stays dim white.
  textFillColor: process.env.TEXT_FILL_COLOR || '#ffffff',
  // Show the top-right corner watermark (logo/handle). The outro sign-off is
  // always shown regardless of this.
  watermarkEnabled: (process.env.WATERMARK_ENABLED ?? 'true') === 'true',
  // Outro sign-off text (ṣalawāt), shown centered on the fade-to-black — under
  // the logo when a logo is present, otherwise on its own.
  outroText:
    process.env.OUTRO_TEXT ??
    'اللّهم صلِّ وسلّم وبارك على سيدنا محمد وعلى آله وصحبه أجمعين',
  // Keep MinIO objects ~24h after publish so Buffer can ingest, then `prune`
  // removes them. Local assets are always deleted immediately after publish.
  // Flip to 'true' only if you want the (risky) instant MinIO delete.
  deleteMinioOnPublish: (process.env.DELETE_MINIO_ON_PUBLISH ?? 'false') === 'true',
};

/** Load a job from a JSON file path. */
export function loadJobFile(path: string): Job {
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  return JobSchema.parse(raw);
}
