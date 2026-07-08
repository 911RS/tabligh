import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Job } from './config.js';
import { resolveReciter } from './quran/reciters.js';
import { fetchPassageText, fetchSurahMeta } from './quran/quranApi.js';
import { downloadTimedAyahs, concatAudio } from './quran/audio.js';
import { log } from './util/log.js';
import { resolveBackground } from './render/background.js';
import { renderFrames } from './render/frames.js';
import { assembleVideo } from './video/assemble.js';
import type { ReelJob } from './types.js';

/** Slug + a run tag so concurrent/repeat runs don't collide in work/. */
function workDirFor(job: Job, runTag: string): string {
  const slug = `${job.surah}_${job.ayahFrom}-${job.ayahTo}_${resolveReciter(job.reciter)}`;
  return join(process.cwd(), 'work', `${slug}__${runTag}`);
}

/**
 * Stage 1 (data): resolve the passage into a fully-timed ReelJob.
 *   text  → quran API
 *   audio → everyayah per-ayah MP3s (exact timing) → concatenated track
 * Writes ir.json into the work dir for inspection. No rendering/publishing yet.
 */
export async function buildReelJob(job: Job, runTag: string): Promise<ReelJob> {
  const reciterFolder = resolveReciter(job.reciter);
  const workDir = workDirFor(job, runTag);
  await mkdir(workDir, { recursive: true });

  log.step(
    `Passage ${job.surah}:${job.ayahFrom}-${job.ayahTo} · reciter ${reciterFolder} · translation ${job.translationEdition || '(none)'}`,
  );

  log.step('Fetching text (Uthmani + translation) + surah meta…');
  const [text, surahMeta] = await Promise.all([
    fetchPassageText(job.surah, job.ayahFrom, job.ayahTo, job.translationEdition),
    fetchSurahMeta(job.surah),
  ]);
  log.ok(`Fetched ${text.length} ayah(s) · ${surahMeta.englishName}`);

  log.step('Downloading per-ayah audio + computing exact timing…');
  const ayahs = await downloadTimedAyahs(text, reciterFolder, workDir);

  log.step('Concatenating recitation…');
  const { file: audioFile, durationMs } = await concatAudio(ayahs, workDir);
  log.ok(`Passage audio ${(durationMs / 1000).toFixed(2)}s → ${audioFile}`);

  const reel: ReelJob = {
    surah: job.surah,
    ayahFrom: job.ayahFrom,
    ayahTo: job.ayahTo,
    reciter: reciterFolder,
    translationEdition: job.translationEdition,
    surahName: surahMeta.name,
    surahEnglishName: surahMeta.englishName,
    ayahs,
    audioFile,
    durationMs,
    hasBasmala: text.some((a) => a.strippedBasmala),
    workDir,
  };

  await writeFile(join(workDir, 'ir.json'), JSON.stringify(reel, null, 2));
  log.ok(`Wrote IR → ${join(workDir, 'ir.json')}`);
  return reel;
}

/**
 * Stage 2 (render): data IR → background → stills → assembled MP4.
 * Returns the path to reel.mp4.
 */
export async function renderReel(job: Job, reel: ReelJob): Promise<string> {
  // Randomize each run so the background "life" (gradient + particle layout)
  // varies between renders, while staying deterministic within a single run.
  const seed = Math.floor(Math.random() * 1e9);

  log.step('Resolving background…');
  const background = await resolveBackground(job.background.keywords, job.background.source, seed);

  log.step('Rendering animated frames (Reem Kufi Fun)…');
  const frames = await renderFrames(reel, {
    background,
    handle: job.watermarkHandle || undefined,
    seed,
  });

  log.step('Assembling video…');
  return assembleVideo(reel, frames);
}
