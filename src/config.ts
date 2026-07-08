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

/** Process-level env, validated once. */
export const env = {
  quranApiBase: process.env.QURAN_API_BASE ?? 'https://api.alquran.cloud/v1',
  everyayahBase: process.env.EVERYAYAH_BASE ?? 'https://everyayah.com/data',
  pexelsKey: process.env.CK2 ?? '',
  unsplashKey: process.env.CK3 ?? '',
  puppeteerExecutablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  soundsDir: process.env.SOCIAL_SOUNDS_DIR || undefined,
  bufferToken: process.env.CK8 ?? '',
  bufferTiktokChannelIds: (process.env.BUFFER_TIKTOK_CHANNEL_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  minio: {
    endpoint: process.env.MINIO_ENDPOINT ?? '',
    port: Number(process.env.MINIO_PORT ?? '9000'),
    useSSL: (process.env.MINIO_USE_SSL ?? 'false') === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY ?? '',
    secretKey: process.env.MINIO_SECRET_KEY ?? '',
    bucket: process.env.MINIO_BUCKET_NAME ?? 'quran-poster',
    publicUrl: (process.env.MINIO_PUBLIC_URL ?? '').replace(/\/$/, ''),
  },
  retentionDays: Number(process.env.RETENTION_DAYS ?? '7'),
  // Hours to keep uploaded videos on MinIO before `prune` removes them
  // (must outlast Buffer's ingest of the media).
  minioRetentionHours: Number(process.env.MINIO_RETENTION_HOURS ?? '48'),
  // If a surah has this many ayahs or fewer, render the WHOLE surah regardless
  // of the requested range. Set to 0 to disable.
  fullSurahMaxAyahs: Number(process.env.FULL_SURAH_MAX_AYAHS ?? '7'),
  // `random` mode: pick a consecutive run of this many ayahs (from long surahs).
  randomMinAyahs: Number(process.env.RANDOM_MIN_AYAHS ?? '3'),
  randomMaxAyahs: Number(process.env.RANDOM_MAX_AYAHS ?? '7'),
};

/** Load a job from a JSON file path. */
export function loadJobFile(path: string): Job {
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  return JobSchema.parse(raw);
}
