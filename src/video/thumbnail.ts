import { join } from 'node:path';
import { run } from '../util/exec.js';

/** Grab a single JPEG frame from the video for use as the post thumbnail. */
export async function extractThumbnail(videoFile: string, workDir: string, atSec = 1.2): Promise<string> {
  const out = join(workDir, 'thumb.jpg');
  await run('ffmpeg', ['-y', '-ss', String(atSec), '-i', videoFile, '-frames:v', '1', '-q:v', '2', out]);
  return out;
}
