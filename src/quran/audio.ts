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
 * Download each ayah's individual MP3 from everyayah, probe its exact duration,
 * and derive cumulative [startMs,endMs] boundaries. Because each file IS one
 * ayah, timing is exact and free — no ASR, no alignment.
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
    const dest = join(audioDir, `${pad3(a.surah)}${pad3(a.ayah)}.mp3`);

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(
        `everyayah ${res.status} for ${a.key} — check reciter folder "${reciterFolder}" (${url})`,
      );
    }
    await writeFile(dest, Buffer.from(await res.arrayBuffer()));

    const durMs = await probeDurationMs(dest);
    timed.push({
      ...a,
      startMs: cursor,
      endMs: cursor + durMs,
      audioFile: dest,
    });
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
