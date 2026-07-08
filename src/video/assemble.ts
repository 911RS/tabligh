import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { run } from '../util/exec.js';
import { log } from '../util/log.js';
import type { ReelJob } from '../types.js';
import { FPS, OUTRO_MS } from '../render/frames.js';

/**
 * Encode the JPEG frame sequence + concatenated recitation into the final MP4.
 * The video runs OUTRO_MS longer than the audio (silent fade-to-black tail):
 * the recitation is faded out at its end and the track is padded with silence,
 * with total length capped to the frame timeline.
 */
export async function assembleVideo(
  reel: ReelJob,
  frames: { dir: string; frameCount: number },
): Promise<string> {
  const out = join(reel.workDir, 'reel.mp4');
  const totalSec = (reel.durationMs + OUTRO_MS) / 1000;
  const fadeSt = Math.max(0, reel.durationMs / 1000 - 0.5);

  await run('ffmpeg', [
    '-y',
    '-framerate', String(FPS),
    '-i', join(frames.dir, 'frame-%05d.jpg'),
    '-i', reel.audioFile,
    '-vf', 'scale=1080:1920,format=yuv420p',
    '-af', `afade=t=out:st=${fadeSt.toFixed(2)}:d=0.5,apad`,
    '-c:v', 'libx264',
    '-profile:v', 'main',
    '-level', '4.0',
    '-preset', 'medium',
    '-crf', '20',
    '-x264-params', 'colorprim=bt709:transfer=bt709:colormatrix=bt709:keyint=50:min-keyint=25',
    '-movflags', '+faststart',
    '-c:a', 'aac',
    '-b:a', '160k',
    '-ar', '44100',
    '-ac', '2',
    '-t', totalSec.toFixed(2),
    out,
  ]);

  // Frames are large and disposable — remove immediately after encode.
  await rm(frames.dir, { recursive: true, force: true });

  log.ok(`Assembled → ${out}`);
  return out;
}
