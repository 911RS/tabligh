import { JobSchema, type Job } from './config.js';
import { settings, postedKeys } from './store/store.js';
import { fetchSurahMeta } from './quran/quranApi.js';
import { RECITERS } from './quran/reciters.js';
import { log } from './util/log.js';

const randInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * Build a random job for the cron: a random surah, a random consecutive ayah
 * run (randomMin..randomMax), and a random reciter from the configured set.
 * Short surahs (≤ fullSurahMaxAyahs) become the full surah via the pipeline rule,
 * but we also pick the full range here so the log/label is accurate.
 */
export async function pickRandomJob(overrides: Partial<Job> = {}): Promise<Job> {
  const posted = postedKeys();
  let surah = 0, ayahFrom = 0, ayahTo = 0, englishName = '';
  // Retry a few times to avoid re-posting a passage we've already published.
  for (let attempt = 0; attempt < 14; attempt++) {
    surah = overrides.surah ?? randInt(1, 114);
    const meta = await fetchSurahMeta(surah);
    englishName = meta.englishName;
    if (meta.numberOfAyahs <= settings().content.fullSurahMaxAyahs) {
      ayahFrom = 1;
      ayahTo = meta.numberOfAyahs;
    } else {
      const maxLen = Math.min(settings().content.randomMaxAyahs, meta.numberOfAyahs);
      const len = randInt(Math.min(settings().content.randomMinAyahs, maxLen), maxLen);
      ayahFrom = randInt(1, meta.numberOfAyahs - len + 1);
      ayahTo = ayahFrom + len - 1;
    }
    if (overrides.surah || !posted.has(`${surah}:${ayahFrom}-${ayahTo}`)) break;
  }

  const reciter = overrides.reciter ?? pick(RECITERS).id;

  const job = JobSchema.parse({
    surah,
    ayahFrom,
    ayahTo,
    reciter,
    translationEdition: overrides.translationEdition ?? 'en.sahih',
    watermarkHandle: overrides.watermarkHandle ?? '',
    publish: overrides.publish ?? false,
    background: overrides.background,
  });

  log.step(`Random pick → ${englishName} ${surah}:${ayahFrom}-${ayahTo} · ${reciter}`);
  return job;
}
