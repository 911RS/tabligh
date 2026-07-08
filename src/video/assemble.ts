import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { run } from '../util/exec.js';
import { log } from '../util/log.js';
import type { ReelJob } from '../types.js';

/**
 * Assemble the final MP4: each ayah still shown for exactly its audio duration
 * (hard cuts on ayah boundaries), muxed with the concatenated recitation.
 *
 * Uses the concat demuxer with per-image `duration` directives. The last image
 * must be listed twice (demuxer quirk) so its final segment isn't dropped.
 */
export async function assembleVideo(reel: ReelJob, stills: string[]): Promise<string> {
  if (stills.length !== reel.ayahs.length) {
    throw new Error(`stills (${stills.length}) != ayahs (${reel.ayahs.length})`);
  }

  const lines: string[] = [];
  reel.ayahs.forEach((a, i) => {
    const durS = (a.endMs - a.startMs) / 1000;
    lines.push(`file '${stills[i].replace(/'/g, "'\\''")}'`);
    lines.push(`duration ${durS.toFixed(3)}`);
  });
  // Repeat last frame so the demuxer holds the final ayah for its full duration.
  lines.push(`file '${stills[stills.length - 1].replace(/'/g, "'\\''")}'`);

  const listPath = join(reel.workDir, 'stills', 'slideshow.txt');
  await writeFile(listPath, lines.join('\n') + '\n');

  const out = join(reel.workDir, 'reel.mp4');
  await run('ffmpeg', [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', listPath,
    '-i', reel.audioFile,
    '-vf', 'scale=1080:1920,format=yuv420p,fps=30',
    '-c:v', 'libx264',
    '-profile:v', 'main',
    '-level', '4.0',
    '-preset', 'medium',
    '-crf', '20',
    '-movflags', '+faststart',
    '-c:a', 'aac',
    '-b:a', '160k',
    '-ar', '44100',
    '-ac', '2',
    '-shortest',
    out,
  ]);

  log.ok(`Assembled → ${out}`);
  return out;
}
