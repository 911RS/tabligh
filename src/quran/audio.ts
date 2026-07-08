import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { env } from '../config.js';
import { probeDurationMs, run } from '../util/exec.js';
import { log } from '../util/log.js';
import type { AyahText } from './quranApi.js';
import type { TimedAyah } from '../types.js';

const pad3 = (n: number) => String(n).padStart(3, '0');

/** everyayah filename for a given ayah: SSSAAA.mp3 */
function everyayahUrl(folder: string, surah: number, ayah: number): string {
  return `${env.everyayahBase}/${folder}/${pad3(surah)}${pad3(ayah)}.mp3`;
}

/**
 * Trim excess leading/trailing silence (keeping a small natural pad) and apply
 * short edge fades to a raw ayah MP3, writing a uniform PCM WAV. This removes the
 * abrupt "cut"/dead-air feel between concatenated ayahs without clipping the
 * recitation. Falls back to the raw file if processing fails.
 */
async function processAyahAudio(rawMp3: string, destWav: string): Promise<string> {
  try {
    await run('ffmpeg', [
      '-y', '-i', rawMp3,
      '-af',
      // trim leading silence (keep 0.10s), then trailing (keep 0.25s) via reverse,
      // then 20ms fade-in and 55ms fade-out (as reversed fade-in) to kill clicks.
      'silenceremove=start_periods=1:start_silence=0.10:start_threshold=-45dB,' +
        'areverse,' +
        'silenceremove=start_periods=1:start_silence=0.25:start_threshold=-45dB,' +
        'afade=t=in:st=0:d=0.055,areverse,' +
        'afade=t=in:st=0:d=0.020',
      '-ar', '44100', '-ac', '2', '-c:a', 'pcm_s16le',
      destWav,
    ]);
    return destWav;
  } catch {
    log.warn(`audio processing failed for ${rawMp3}; using raw`);
    return rawMp3;
  }
}

/**
 * Download each ayah's individual MP3 from everyayah, clean it (trim + edge
 * fades), probe its exact duration, and derive cumulative [startMs,endMs]
 * boundaries. Because each file IS one ayah, timing is exact and free — no ASR.
 */
export async function downloadTimedAyahs(
  ayahs: AyahText[],
  reciterFolder: string,
  workDir: string,
): Promise<TimedAyah[]> {
  const audioDir = join(workDir, 'audio');
  await mkdir(audioDir, { recursive: true });

  const timed: TimedAyah[] = [];
  let cursor = 0;

  for (const a of ayahs) {
    const url = everyayahUrl(reciterFolder, a.surah, a.ayah);
    const raw = join(audioDir, `${pad3(a.surah)}${pad3(a.ayah)}.raw.mp3`);

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(
        `everyayah ${res.status} for ${a.key} — check reciter folder "${reciterFolder}" (${url})`,
      );
    }
    await writeFile(raw, Buffer.from(await res.arrayBuffer()));

    const wav = join(audioDir, `${pad3(a.surah)}${pad3(a.ayah)}.wav`);
    const audioFile = await processAyahAudio(raw, wav);

    const durMs = await probeDurationMs(audioFile);
    timed.push({ ...a, startMs: cursor, endMs: cursor + durMs, audioFile });
    cursor += durMs;
    log.step(`${a.key}  ${(durMs / 1000).toFixed(2)}s  →  ${(cursor / 1000).toFixed(2)}s`);
  }

  return timed;
}

/**
 * Concatenate the per-ayah MP3s into one passage track. Re-encodes to a uniform
 * AAC stream so differing source bitrates/sample-rates concat cleanly.
 * Returns { file, durationMs }.
 */
export async function concatAudio(
  timed: TimedAyah[],
  workDir: string,
): Promise<{ file: string; durationMs: number }> {
  const listPath = join(workDir, 'audio', 'concat.txt');
  const list = timed.map((t) => `file '${t.audioFile.replace(/'/g, "'\\''")}'`).join('\n');
  await writeFile(listPath, list + '\n');

  const out = join(workDir, 'passage.m4a');
  await run('ffmpeg', [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', listPath,
    '-c:a', 'aac',
    '-b:a', '160k',
    '-ar', '44100',
    '-ac', '2',
    out,
  ]);

  const durationMs = await probeDurationMs(out);
  return { file: out, durationMs };
}
