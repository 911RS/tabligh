import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { run } from '../util/exec.js';
import { log } from '../util/log.js';
import type { ReelJob } from '../types.js';
import { FPS } from '../render/frames.js';

/**
 * Encode the JPEG frame sequence + concatenated recitation into the final MP4.
 * H.264, browser-safe color tags, faststart. Frames are pruned after encode.
 */
export async function assembleVideo(
  reel: ReelJob,
  frames: { dir: string; frameCount: number },
): Promise<string> {
  const out = join(reel.workDir, 'reel.mp4');

  await run('ffmpeg', [
    '-y',
    '-framerate', String(FPS),
    '-i', join(frames.dir, 'frame-%05d.jpg'),
    '-i', reel.audioFile,
    '-vf', 'scale=1080:1920,format=yuv420p',
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
    '-shortest',
    out,
  ]);

  // Frames are large and disposable — remove immediately after encode.
  await rm(frames.dir, { recursive: true, force: true });

  log.ok(`Assembled → ${out}`);
  return out;
}
