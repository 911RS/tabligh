import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type Job } from './config.js';
import { settings } from './store/store.js';
import { resolveReciter, reciterDisplayName } from './quran/reciters.js';
import { fetchPassageText, fetchSurahMeta } from './quran/quranApi.js';
import { downloadTimedAyahs, concatAudio, downloadBasmala } from './quran/audio.js';
import { log } from './util/log.js';
import { resolveBackground } from './render/background.js';
import { renderFrames } from './render/frames.js';
import { assembleVideo } from './video/assemble.js';
import type { ReelJob } from './types.js';

/** Slug + a run tag so concurrent/repeat runs don't collide in work/. */
function workDirFor(surah: number, from: number, to: number, reciter: string, runTag: string): string {
  return join(process.cwd(), 'work', `${surah}_${from}-${to}_${reciter}__${runTag}`);
}

/**
 * Stage 1 (data): resolve the passage into a fully-timed ReelJob.
 *   text  → quran API
 *   audio → everyayah per-ayah MP3s (exact timing) → concatenated track
 * Writes ir.json into the work dir for inspection. No rendering/publishing yet.
 */
export async function buildReelJob(job: Job, runTag: string): Promise<ReelJob> {
  const reciterFolder = resolveReciter(job.reciter);

  // Surah meta first — it drives the effective ayah range.
  const surahMeta = await fetchSurahMeta(job.surah);

  // Effective range: clamp BOTH ends to the surah, and if the surah is short,
  // render it whole. Clamping ayahFrom too prevents an out-of-range manual/queued
  // job (e.g. ayahFrom past the surah end) from producing ayahFrom > ayahTo, which
  // yields an empty passage and crashes ffmpeg with no input.
  let ayahFrom = Math.max(1, Math.min(job.ayahFrom, surahMeta.numberOfAyahs));
  let ayahTo = Math.max(ayahFrom, Math.min(job.ayahTo, surahMeta.numberOfAyahs));
  const maxFull = settings().content.fullSurahMaxAyahs;
  if (maxFull > 0 && surahMeta.numberOfAyahs <= maxFull) {
    ayahFrom = 1;
    ayahTo = surahMeta.numberOfAyahs;
    log.step(`Short surah (${surahMeta.numberOfAyahs} ayahs ≤ ${maxFull}) → rendering full surah`);
  }

  const workDir = workDirFor(job.surah, ayahFrom, ayahTo, reciterFolder, runTag);
  await mkdir(workDir, { recursive: true });

  log.step(
    `Passage ${job.surah}:${ayahFrom}-${ayahTo} · reciter ${reciterFolder} · translation ${job.translationEdition || '(none)'}`,
  );

  log.step('Fetching text (Uthmani + translation)…');
  const text = await fetchPassageText(job.surah, ayahFrom, ayahTo, job.translationEdition);
  log.ok(`Fetched ${text.length} ayah(s) · ${surahMeta.englishName}`);

  log.step('Downloading per-ayah audio + computing exact timing…');
  let ayahs = await downloadTimedAyahs(text, reciterFolder, workDir);

  // Enforce the max recitation length (excluding outro): drop trailing ayahs until
  // the passage fits. This overrides the min-ayah floor — we keep at least one ayah.
  const maxSec = settings().content.maxDurationSeconds;
  if (maxSec > 0 && ayahs.length > 1 && ayahs[ayahs.length - 1].endMs > maxSec * 1000) {
    const kept = ayahs.filter((a) => a.endMs <= maxSec * 1000);
    const trimmed = kept.length ? kept : ayahs.slice(0, 1);
    log.step(`Passage ${(ayahs[ayahs.length - 1].endMs / 1000).toFixed(0)}s > ${maxSec}s cap → trimming ${ayahs.length - trimmed.length} trailing ayah(s)`);
    ayahs = trimmed;
    ayahTo = ayahFrom + ayahs.length - 1;
  }

  // Bismillah intro. Hard rule: a passage that starts at ayah 1 always opens with
  // the basmala. The 'always' setting adds it to every passage too. Skipped for
  // At-Tawbah (no basmala) and for Al-Fatiha 1:1 (which already IS the basmala).
  const basmalaMode = settings().content.basmala;
  const isTawbah = job.surah === 9;
  const fatihaOpening = job.surah === 1 && ayahFrom === 1;
  const includeBasmala = !isTawbah && !fatihaOpening && (ayahFrom === 1 || basmalaMode === 'always');
  if (includeBasmala) {
    log.step('Prepending Bismillah (reciter 1:1)…');
    const basmala = await downloadBasmala(reciterFolder, workDir);
    const shift = basmala.endMs;
    ayahs = [basmala, ...ayahs.map((a) => ({ ...a, startMs: a.startMs + shift, endMs: a.endMs + shift }))];
  }

  log.step('Concatenating recitation…');
  const { file: audioFile, durationMs } = await concatAudio(ayahs, workDir);
  log.ok(`Passage audio ${(durationMs / 1000).toFixed(2)}s → ${audioFile}`);

  const reel: ReelJob = {
    surah: job.surah,
    ayahFrom,
    ayahTo,
    reciter: reciterFolder,
    reciterName: reciterDisplayName(reciterFolder),
    translationEdition: job.translationEdition,
    surahName: surahMeta.name,
    surahEnglishName: surahMeta.englishName,
    ayahs,
    audioFile,
    durationMs,
    // Header basmala is redundant once we play a full basmala intro.
    hasBasmala: !includeBasmala && text.some((a) => a.strippedBasmala),
    workDir,
  };

  await writeFile(join(workDir, 'ir.json'), JSON.stringify(reel, null, 2));
  log.ok(`Wrote IR → ${join(workDir, 'ir.json')}`);
  return reel;
}

export interface RenderResult {
  mp4: string;
  credit?: import('./render/background.js').PhotoCredit;
}

/**
 * Stage 2 (render): data IR → background → animated frames → assembled MP4.
 * Returns the MP4 path and the background photo credit (for the caption).
 */
export async function renderReel(job: Job, reel: ReelJob): Promise<RenderResult> {
  // Randomize each run so the background photo + particle layout vary between runs.
  const seed = Math.floor(Math.random() * 1e9);

  log.step('Resolving background…');
  const background = await resolveBackground(job.background.keywords, job.background.source, seed, job.background.localDir);

  log.step('Rendering animated frames (Aref Ruqaa + karaoke)…');
  const frames = await renderFrames(reel, {
    background,
    handle: job.watermarkHandle || undefined,
    seed,
  });

  log.step('Assembling video…');
  const mp4 = await assembleVideo(reel, frames);
  return { mp4, credit: background.credit };
}
