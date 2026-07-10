import { spawn } from 'node:child_process';

/**
 * Open a URL (or file path) in the user's default browser/app, cross-platform.
 * Detached + unref'd so it never blocks or ties the child to our process.
 */
export function openBrowser(target: string): void {
  const platform = process.platform;
  const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = platform === 'win32' ? ['/c', 'start', '', target] : [target];
  try {
    const child = spawn(cmd, args, { detached: true, stdio: 'ignore' });
    child.unref();
  } catch {
    /* headless / no opener available — caller shows the URL as text */
  }
}
