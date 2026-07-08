import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface RunResult {
  stdout: string;
  stderr: string;
}

/** Run a binary with args, rejecting on non-zero exit. Large buffers allowed (ffmpeg is chatty). */
export async function run(bin: string, args: string[]): Promise<RunResult> {
  const { stdout, stderr } = await execFileAsync(bin, args, {
    maxBuffer: 64 * 1024 * 1024,
  });
  return { stdout: stdout.toString(), stderr: stderr.toString() };
}

/** Duration of a media file in milliseconds, via ffprobe. */
export async function probeDurationMs(file: string): Promise<number> {
  const { stdout } = await run('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    file,
  ]);
  const seconds = parseFloat(stdout.trim());
  if (!Number.isFinite(seconds)) {
    throw new Error(`ffprobe returned no duration for ${file}: "${stdout}"`);
  }
  return Math.round(seconds * 1000);
}
