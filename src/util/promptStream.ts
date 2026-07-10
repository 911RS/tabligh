import { createReadStream } from 'node:fs';
import { stdin } from 'node:process';
import type { Readable } from 'node:stream';

/**
 * A readable stream to drive `readline` question prompts, plus a matching
 * cleanup.
 *
 * After the Ink TUI runs, `process.stdin` is left in a state that `readline`
 * can no longer read from — Ink puts the TTY in raw mode and installs its own
 * reader, and even removing every listener and clearing raw mode does not make
 * a fresh `readline` interface receive keystrokes again (the internal readable
 * state is corrupted for the lifetime of the process). Reopening the
 * controlling terminal (`/dev/tty`) as a brand-new stream sidesteps this
 * entirely, so any prompt shown after the menu actually receives input.
 *
 * Falls back to `process.stdin` when there is no controlling TTY (pipes, CI,
 * Windows) or if `/dev/tty` can't be opened — in those cases nothing has
 * corrupted stdin and the default stream is correct.
 */
export function openPromptInput(): { input: Readable; cleanup: () => void } {
  if (process.platform !== 'win32' && stdin.isTTY) {
    try {
      const tty = createReadStream('/dev/tty');
      return { input: tty, cleanup: () => tty.destroy() };
    } catch {
      /* fall through to stdin */
    }
  }
  return { input: stdin, cleanup: () => {} };
}
